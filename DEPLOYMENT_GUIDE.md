# WebAuthn Deployment Guide

## Quick Start (Recommended)

### Step 1: Link Your Supabase Project

First, you need to link this project to your Supabase project:

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find your project ref:**
1. Go to https://supabase.com/dashboard
2. Open your project
3. Look at the URL: `https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]`
4. Copy the project ref (the part after `/project/`)

### Step 2: Run the Deployment Script

```powershell
.\deploy-webauthn.ps1
```

This will:
- ✅ Create the `webauthn_credentials` table
- ✅ Deploy all 5 Edge Functions
- ✅ Show a summary of what was deployed

### Step 3: Test Windows Hello

1. Run your app: `npm run dev`
2. Log in with email/password (this registers a passkey)
3. Log out
4. Return to login page
5. Click the fingerprint button
6. **Windows Security dialog appears!** 🎉

---

## Manual Deployment (Alternative)

If the script doesn't work, you can deploy manually:

### 1. Create Database Table

Go to **SQL Editor** in Supabase Dashboard and run:

```sql
-- Copy from supabase/migrations/20250108_create_webauthn_credentials.sql
```

### 2. Deploy Each Edge Function

```powershell
npx supabase functions deploy webauthn-registration-options --no-verify-jwt
npx supabase functions deploy webauthn-registration-verify --no-verify-jwt
npx supabase functions deploy webauthn-authentication-options --no-verify-jwt
npx supabase functions deploy webauthn-authentication-verify --no-verify-jwt
npx supabase functions deploy webauthn-has-credential --no-verify-jwt
```

---

## Troubleshooting

### "supabase: The term 'supabase' is not recognized"

Use `npx` instead:
```powershell
npx supabase [command]
```

### "Not linked to a Supabase project"

Run:
```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
```

### "Failed to deploy function"

- Check if Edge Functions are enabled in your Supabase project settings
- Verify your authentication: `npx supabase login`
- Check the Supabase dashboard for error logs

### "Cannot find module 'Deno'"

These are IDE warnings and can be ignored. The functions will work when deployed to Supabase.

---

## Production Configuration

After deployment, update these values in each Edge Function:

**Current (Development):**
```typescript
const rpID = 'localhost';
const origin = 'http://localhost:5173';
```

**Production:**
```typescript
const rpID = 'yourdomain.com';
const origin = 'https://yourdomain.com';
```

**Files to update:**
- `supabase/functions/webauthn-registration-options/index.ts`
- `supabase/functions/webauthn-registration-verify/index.ts`
- `supabase/functions/webauthn-authentication-options/index.ts`
- `supabase/functions/webauthn-authentication-verify/index.ts`

After updating, re-deploy:
```powershell
.\deploy-webauthn.ps1
```

---

## Testing Checklist

- [ ] Database table created
- [ ] All 5 Edge Functions deployed
- [ ] Can register new user with email/password
- [ ] Fingerprint button appears on return visit
- [ ] Windows Security dialog shows when clicking button
- [ ] Can authenticate with PIN/fingerprint/face
- [ ] User is logged in after authentication

---

## Need Help?

Check the full documentation in `WEBAUTHN_SETUP.md`
