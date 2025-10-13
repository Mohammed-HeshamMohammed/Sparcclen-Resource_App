# Supabase Encrypted Profiles Setup

This app stores profile data encrypted at the application layer before sending to Supabase. Transport is HTTPS, and the server only sees ciphertext.

The client API lives in `src/lib/services/profileCloud.ts`:
- `saveProfileEncrypted(profile, password)`
- `fetchProfileDecrypted(password)`
- `uploadProfilePictureEncrypted(file, password)`
- `downloadProfilePictureDecrypted(password)`

The encryption password should never be sent to Supabase.

## 1) Configure environment
Set Supabase URL and anon key so `src/lib/services/supabase.ts` can create a real client.

- For Electron dev (Vite):
  - `.env` or `.env.local`
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
- For Node scripts:
  - `SUPABASE_URL=...`
  - `SUPABASE_KEY=...`

## 2) Create table and RLS policies
Run in Supabase SQL editor:

```sql
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name_enc text not null,
  email_enc text not null,
  account_type_enc text not null,
  imported_resources_enc text not null,
  member_since_enc text not null,
  last_active_enc text not null,
  picture_enc text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Allow all authenticated users to read profiles"
on public.profiles for select
using (auth.role() = 'authenticated');

create policy "profiles_insert_owner"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "profiles_update_owner"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 3) Profile picture storage (inline, encrypted)
- Pictures are stored directly in the `profiles.picture_enc` column as encrypted base64 (AES‑GCM), so no URL or path is used.
- This keeps the image private-by-design and avoids exposing a path.
- Consider keeping images reasonably small (e.g., compress client-side) to avoid oversized rows.

## 4) Choosing an encryption password
Do NOT send this to the server. Options:
- Prompt the user for a passphrase, then store it locally via DPAPI:
  - Use `window.api.credentials.store(email, passphrase)` and `window.api.credentials.get(email)` to keep it device-bound (Windows DPAPI).
- Or generate a random key once and protect it with DPAPI (not portable across devices).

## 5) Example usage
```ts
import { saveProfileEncrypted, fetchProfileDecrypted } from '@/lib/services'

const password = await window.api.credentials.get(currentEmail) // e.g., DPAPI-protected

await saveProfileEncrypted({
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  memberSince: new Date('2025-01-01').toISOString(),
  accountType: 'free',
  importedResources: 12,
  lastActive: new Date().toISOString(),
}, password)

const result = await fetchProfileDecrypted(password)
if (result.ok) {
  console.log('Decrypted profile', result.data)
}
```

## 8) Notes
- The app encrypts each field with AES-GCM using `src/lib/utils/crypto.ts`. The base64 output includes salt and IV.
- The email is stored encrypted by default. If you need plaintext indexing/search by email, consider a server-side HMAC(email) computed with a secret pepper (not implemented here).
- Profile picture uploads are encrypted as base64 text and stored inline in `picture_enc`.
- The code expects an authenticated Supabase session (`supabase.auth.getUser()`).
- RLS policies allow all authenticated users to read profiles, enabling dashboard features for admin views.
```
