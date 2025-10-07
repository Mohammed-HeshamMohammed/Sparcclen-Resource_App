# Automatic Auth Cleanup - Setup Guide

## Overview

This system automatically removes unconfirmed users from Supabase Auth after 48 hours. It runs when your app starts and checks every hour.

## Architecture

```
App Startup
    ↓
AuthProvider initializes
    ↓
initAuthCleanup() called
    ↓
Runs immediately, then every 1 hour
    ↓
Calls Supabase Edge Function
    ↓
Edge Function (with admin privileges):
  - Lists all users
  - Filters unconfirmed users > 48 hours old
  - Deletes them
    ↓
Returns count of deleted users
```

## Files Created

### 1. `src/lib/services/authCleanup.ts`
Client-side service that:
- Runs on app startup
- Checks every hour
- Calls the Supabase Edge Function
- Tracks cleanup statistics

### 2. `supabase/functions/cleanup-unconfirmed-users/index.ts`
Supabase Edge Function that:
- Uses Admin API to list all users
- Filters unconfirmed users older than 48 hours
- Deletes them from Supabase Auth

### 3. `src/lib/auth/auth.tsx` (Modified)
Integrated cleanup service initialization into AuthProvider

## Setup Instructions

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

```bash
supabase link --project-ref your-project-ref
```

Find your project ref in Supabase Dashboard → Settings → General

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy cleanup-unconfirmed-users
```

### Step 5: Set Environment Variables (if needed)

The Edge Function automatically has access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No additional configuration needed!

### Step 6: Test the Function

You can manually test the function:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/cleanup-unconfirmed-users \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Or from your app's console:

```javascript
const { data, error } = await supabase.functions.invoke('cleanup-unconfirmed-users')
console.log(data)
```

## How It Works

### Cleanup Logic

1. **On App Start**: Cleanup runs immediately
2. **Every Hour**: Cleanup runs again
3. **Edge Function**:
   - Gets all users from Supabase Auth
   - Calculates cutoff time (48 hours ago)
   - Filters users where:
     - `email_confirmed_at` is `null`
     - `created_at` is older than 48 hours
   - Deletes each unconfirmed user

### Example Response

```json
{
  "success": true,
  "totalChecked": 150,
  "totalUnconfirmed": 5,
  "totalDeleted": 5,
  "deletedUsers": [
    {
      "userId": "uuid-1",
      "email": "user1@example.com",
      "createdAt": "2025-10-05T10:00:00Z"
    }
  ],
  "errors": [],
  "cutoffTime": "2025-10-05T20:00:00Z",
  "timestamp": "2025-10-07T20:00:00Z"
}
```

## Configuration

### Change Cleanup Interval

Edit `src/lib/services/authCleanup.ts`:

```typescript
const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour (default)
// Change to:
const CLEANUP_INTERVAL = 1000 * 60 * 30; // 30 minutes
```

### Change Timeout Duration

Edit both files:

**Client (`src/lib/services/authCleanup.ts`):**
```typescript
const UNCONFIRMED_USER_TIMEOUT = 1000 * 60 * 60 * 48; // 48 hours (default)
// Change to:
const UNCONFIRMED_USER_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours
```

**Edge Function (`supabase/functions/cleanup-unconfirmed-users/index.ts`):**
```typescript
const cutoffTime = now - (48 * 60 * 60 * 1000) // 48 hours (default)
// Change to:
const cutoffTime = now - (24 * 60 * 60 * 1000) // 24 hours
```

## Monitoring

### View Cleanup Stats

In your app console:

```javascript
import { authCleanupService } from './lib/services/authCleanup'

// Get statistics
const stats = authCleanupService.getStats()
console.log(stats)
// {
//   lastRun: Date,
//   totalCleaned: 15,
//   lastCleanedCount: 3,
//   errors: []
// }
```

### View Logs

**Client-side logs:**
- Check browser console for `[AuthCleanup]` messages

**Edge Function logs:**
- Go to Supabase Dashboard → Edge Functions → cleanup-unconfirmed-users → Logs

## Troubleshooting

### Edge Function Not Found

**Error:** `FunctionsRelayError: Edge Function not found`

**Solution:**
1. Verify function is deployed: `supabase functions list`
2. Redeploy: `supabase functions deploy cleanup-unconfirmed-users`

### Permission Denied

**Error:** `Permission denied` or `Unauthorized`

**Solution:**
- Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` automatically
- No additional permissions needed
- Verify your Supabase project is properly linked

### No Users Being Deleted

**Possible Reasons:**
1. All users confirmed their emails
2. No users older than 48 hours
3. Check Edge Function logs for errors

**Debug:**
```javascript
// Manually invoke to see results
const { data } = await supabase.functions.invoke('cleanup-unconfirmed-users')
console.log('Cleanup results:', data)
```

### Cleanup Not Running

**Check:**
1. AuthProvider is mounted (app is running)
2. Check console for `[AuthCleanup] Starting cleanup service...`
3. Verify no errors in console

## Security Considerations

### Why Edge Function?

- **Admin Access Required**: Only Supabase Admin API can list and delete users
- **Service Role Key**: Edge Functions have access to service role key
- **Client SDK Limited**: Client SDK cannot perform admin operations

### Best Practices

1. **Don't expose service role key** in client code
2. **Use Edge Functions** for admin operations
3. **Monitor logs** regularly
4. **Test thoroughly** before production

## Alternative: Database Trigger

Instead of Edge Functions, you can use a PostgreSQL trigger:

```sql
-- Create a function to delete old unconfirmed users
CREATE OR REPLACE FUNCTION delete_unconfirmed_users()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-unconfirmed-users',
  '0 * * * *', -- Every hour
  'SELECT delete_unconfirmed_users();'
);
```

**Note:** This requires `pg_cron` extension and database access.

## Testing Scenarios

### Test 1: Fresh Signup (< 48 hours)
1. Sign up with new email
2. Don't confirm
3. Wait for cleanup to run
4. User should NOT be deleted (too recent)

### Test 2: Old Unconfirmed User (> 48 hours)
1. Sign up with email
2. Don't confirm
3. Manually set `created_at` to 3 days ago (database)
4. Wait for cleanup or manually trigger
5. User should be deleted

### Test 3: Confirmed User
1. Sign up and confirm email
2. Wait > 48 hours
3. User should NOT be deleted (confirmed)

### Manual Test

```javascript
// In browser console
const { data } = await supabase.functions.invoke('cleanup-unconfirmed-users')
console.log('Deleted:', data.totalDeleted)
console.log('Details:', data.deletedUsers)
```

## Production Checklist

- [ ] Edge Function deployed to Supabase
- [ ] Tested with sample unconfirmed users
- [ ] Verified cleanup interval is appropriate
- [ ] Monitored logs for errors
- [ ] Documented for team
- [ ] Set up alerting (optional)

## Support

If you encounter issues:
1. Check Supabase Dashboard → Edge Functions → Logs
2. Check browser console for `[AuthCleanup]` messages
3. Verify Edge Function is deployed: `supabase functions list`
4. Test manually: `supabase functions invoke cleanup-unconfirmed-users`
