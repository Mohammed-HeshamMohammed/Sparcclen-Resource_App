# WebAuthn (Windows Hello) Setup Guide

## ✅ Implementation Complete!

Your app now supports **real Windows Hello biometric authentication** using the **WebAuthn standard**. This will trigger the actual Windows Security dialog with PIN, fingerprint, or face recognition.

## What Was Implemented

### 1. **Client-Side (Browser)**
- `src/lib/services/webauthn.ts` - WebAuthn service using `@simplewebauthn/browser`
- Updated `Login.tsx` to use WebAuthn authentication
- Updated `SignUp.tsx` to include display name

### 2. **Server-Side (Supabase Edge Functions)**
- `webauthn-registration-options` - Generate registration challenge
- `webauthn-registration-verify` - Verify passkey registration
- `webauthn-authentication-options` - Generate authentication challenge
- `webauthn-authentication-verify` - Verify passkey authentication
- `webauthn-has-credential` - Check if user has registered passkey

### 3. **Database**
- Migration file: `supabase/migrations/20250108_create_webauthn_credentials.sql`
- Table: `webauthn_credentials` for storing passkey public keys

## Setup Instructions

### Step 1: Run Database Migration

```bash
# Navigate to your project
cd X:\Work\Start-UP

# Run the migration
supabase db push
```

Or apply manually in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/20250108_create_webauthn_credentials.sql`
3. Run the SQL

### Step 2: Deploy Supabase Edge Functions

```bash
# Deploy all WebAuthn functions
supabase functions deploy webauthn-registration-options
supabase functions deploy webauthn-registration-verify
supabase functions deploy webauthn-authentication-options
supabase functions deploy webauthn-authentication-verify
supabase functions deploy webauthn-has-credential
```

### Step 3: Configure Origins (Important!)

In each Edge Function file, update these values for production:

```typescript
const rpID = 'your-domain.com'; // Change from 'localhost'
const origin = 'https://your-domain.com'; // Change from 'http://localhost:5173'
```

## How It Works

### First-Time Login (Registration)
1. User signs up or logs in with email/password
2. App automatically registers a **Windows Hello passkey** in the background
3. User's public key is stored in Supabase `webauthn_credentials` table

### Subsequent Logins (Authentication)
1. App detects user has a registered passkey
2. Shows "Welcome back" card with fingerprint button
3. User clicks the fingerprint button
4. **Windows Security dialog appears** 🎉
   - "Sign in with a passkey"
   - Prompts for PIN, fingerprint, or face recognition
5. User authenticates with Windows Hello
6. User is logged in immediately

## Testing

### Prerequisites
- Windows 10/11 with Windows Hello set up (PIN, fingerprint, or face)
- Modern browser (Chrome, Edge, Firefox)
- HTTPS or localhost (WebAuthn requires secure context)

### Test Flow
1. **Sign up** with a new account
   - Enter display name, email, password
   - Passkey is registered automatically
2. **Log out**
3. **Return to login page**
   - You'll see the "Welcome back [Your Name]!" card
4. **Click the fingerprint button**
   - Windows Security dialog appears
   - Enter your PIN or use biometric
5. **You're logged in!**

## Security Features

✅ **FIDO2/WebAuthn Standard** - Industry-standard passwordless authentication  
✅ **Phishing Resistant** - Passkeys are bound to your domain  
✅ **Hardware-Backed** - Uses Windows TPM chip when available  
✅ **Biometric Authentication** - PIN, fingerprint, or face recognition  
✅ **No Password Transmission** - Only cryptographic signatures are sent  
✅ **Server Verification** - All passkey assertions are verified server-side  

## Troubleshooting

### "Windows Hello not available"
- **Cause**: Windows Hello is not set up on this device
- **Solution**: Go to Windows Settings > Accounts > Sign-in options > Set up Windows Hello

### "No credentials found"
- **Cause**: User hasn't registered a passkey yet
- **Solution**: Log in with email/password once to register

### "Authentication failed"
- **Cause**: User cancelled the Windows Security prompt
- **Solution**: Try again or use email/password

### Edge Functions not working
- **Cause**: Functions not deployed or CORS issues
- **Solution**: 
  - Deploy all functions: `supabase functions deploy [function-name]`
  - Check Supabase logs for errors
  - Verify CORS headers in function code

## Production Checklist

- [ ] Run database migration in production Supabase
- [ ] Deploy all 5 Edge Functions to production
- [ ] Update `rpID` and `origin` in all Edge Function files
- [ ] Test passkey registration on production URL
- [ ] Test passkey authentication on production URL
- [ ] Set up monitoring for WebAuthn Edge Functions
- [ ] Add fallback for browsers without WebAuthn support

## API Reference

### Client-Side Functions

```typescript
// Check if browser supports WebAuthn
isWebAuthnSupported(): boolean

// Register a new passkey (automatic after login)
registerPasskey(email: string): Promise<boolean>

// Authenticate with passkey (shows Windows Security dialog)
authenticateWithPasskey(email: string): Promise<{
  success: boolean;
  sessionToken?: string;
  error?: string;
}>

// Check if user has registered passkey
hasRegisteredPasskey(email: string): Promise<boolean>
```

## Notes

- The Deno lint errors in Edge Functions are expected (they run in Deno, not Node.js)
- WebAuthn requires HTTPS in production (localhost is OK for development)
- Users can have multiple passkeys (different devices)
- Passkeys are synced via Windows if user has Microsoft account sync enabled

## Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [SimpleWebAuthn Docs](https://simplewebauthn.dev/)
- [Windows Hello Overview](https://docs.microsoft.com/en-us/windows/security/identity-protection/hello-for-business/)
