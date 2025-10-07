# Supabase Email Confirmation Setup

## Changes Made

### Problem
When Supabase sends a confirmation email and the user clicks "Confirm your mail", the redirect URL includes the token in the **hash fragment** (after `#`), not in query parameters. The app was only checking `window.location.search` (query params), so it couldn't detect the confirmation tokens.

### Solution
Updated the app to check **both** query parameters and hash fragments for Supabase tokens.

## Files Modified

### 1. `src/App.tsx`
- **Lines 24-38**: Updated initial auth state detection to check both `window.location.search` and `window.location.hash` for tokens
- **Lines 288-298**: Updated `AuthError` rendering to extract error from both query params and hash

### 2. `src/components/Auth/AuthConfirm.tsx`
- **Lines 16-54**: Updated token extraction to check both query params and hash fragment
- Now properly handles Supabase's hash-based token delivery

## How It Works

1. **User signs up** → Supabase sends confirmation email
2. **User clicks "Confirm your mail"** → Redirects to:
   ```
   http://localhost:5173/auth/confirm#token_hash=xxx&type=signup
   ```
3. **App detects hash params** → Shows `AuthConfirm` component
4. **AuthConfirm extracts token** → Calls `supabase.auth.verifyOtp()`
5. **Success** → Shows success message, redirects to home after 2 seconds
6. **Error** → Shows error message with retry option

## Testing Steps

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Sign up with a real email**:
   - Go to signup page
   - Enter your email and password
   - Click "Create Account"
   - You'll see "Account Created!" message

3. **Check your email**:
   - Open the confirmation email from Supabase
   - Click "Confirm your mail" link

4. **Verify redirect**:
   - Should redirect to `http://localhost:5173/auth/confirm#token_hash=...&type=signup`
   - App should show "Email Confirmation" page with loading spinner
   - After verification, should show success message
   - After 2 seconds, redirects to home (login page)

## Supabase Configuration

Make sure your Supabase project has the correct redirect URL configured:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:5173/auth/confirm
   ```
3. For production, add:
   ```
   https://yourdomain.com/auth/confirm
   ```

## Current Redirect Flow

```
SignUp.tsx (line 72):
emailRedirectTo: `${window.location.origin}/auth/confirm`
                  ↓
Supabase sends email with link
                  ↓
User clicks link → Supabase redirects to:
http://localhost:5173/auth/confirm#token_hash=xxx&type=signup
                  ↓
App.tsx detects hash params → Sets authState to 'auth-confirm'
                  ↓
AuthConfirm.tsx extracts token → Calls verifyOtp()
                  ↓
Success → Redirects to '/' (login page)
```

## Troubleshooting

### Token not detected
- Check browser console for errors
- Verify URL contains `#token_hash=...&type=signup`
- Ensure Supabase URL and anon key are set in `.env`

### Verification fails
- Check Supabase dashboard logs
- Verify email confirmation is enabled in Supabase settings
- Check token hasn't expired (tokens expire after 24 hours)

### Redirect doesn't work
- Check `next` parameter in URL
- Verify `window.location.href = next` executes
- Check browser console for navigation errors

## Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
