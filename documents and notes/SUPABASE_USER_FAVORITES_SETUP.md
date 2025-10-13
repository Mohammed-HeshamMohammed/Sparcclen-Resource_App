# Supabase User Favorites Setup

This document describes the `user_favorites` table and the `favoritesService` for syncing user favorites across devices.

## 1) Table Schema

Run in Supabase SQL editor:

```sql
create table if not exists public.user_favorites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  favorites jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_favorites enable row level security;

create policy "user_favorites_select_owner"
on public.user_favorites for select
using (auth.uid() = user_id);

create policy "user_favorites_insert_owner"
on public.user_favorites for insert
with check (auth.uid() = user_id);

create policy "user_favorites_update_owner"
on public.user_favorites for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 2) Service Implementation

The `src/lib/services/favoritesService.ts` handles:

- Local storage of favorites in `localStorage` keyed by `userId`
- Syncing to Supabase `user_favorites` table for multi-device support
- Fallback to local-only if the table doesn't exist in the project

### Key Methods:

- `getFavorites(userId, email, forceRefresh?)`: Gets favorites from local storage or Supabase
- `addFavorite(userId, email, resourceId)`: Adds a favorite and syncs to Supabase
- `removeFavorite(userId, email, resourceId)`: Removes a favorite and syncs to Supabase
- `syncWithOnline(userId, email)`: Syncs local favorites to Supabase

## 3) Integration

Used in:
- `src/components/Dashboard/Dashboard.tsx`: For favorites display and toggle
- `src/components/Resources/*`: For favorite buttons on resources

## 4) Notes

- Favorites are stored as an array of `resourceId` strings in JSONB format
- Sync happens automatically when favorites are modified
- If the `user_favorites` table doesn't exist, the service falls back to local-only storage
- RLS policies ensure users can only access their own favorites
