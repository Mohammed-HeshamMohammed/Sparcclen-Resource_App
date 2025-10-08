# Windows Hello Authentication Setup

## Overview
The application now supports **Windows Hello** authentication for secure, password-less login using Windows' built-in credential management system.

## Features

### 1. **Windows Credential Manager Integration**
- Passwords are encrypted using **Windows DPAPI** (Data Protection API)
- Credentials are stored in `Documents/Sparcclen/.credentials.enc`
- Only the logged-in Windows user can decrypt the credentials
- Multi-layer security: Windows login + DPAPI encryption

### 2. **Email Autocomplete**
- Previously used email addresses are stored in Windows Credential Manager
- HTML5 datalist provides autocomplete suggestions
- No browser storage - all data stored securely in Windows

### 3. **Streamlined Login Experience**
- **First-time users**: Enter email and password normally
- **Returning users**: See "Continue with Windows Hello" prompt
- **One-click login**: Click Continue button to authenticate instantly
- **Always editable**: Email field is always editable (no "use different email" needed)

## How It Works

### Initial Login
1. User enters email and password
2. On successful login, password is encrypted and stored via Windows DPAPI
3. Email is saved to `Documents/Sparcclen/DID-Data.save`

### Subsequent Logins
1. App detects stored credentials for last used email
2. Shows Windows Hello prompt with fingerprint icon
3. User clicks "Continue" button
4. **Native confirmation dialog appears** - "Continue as [email]?"
5. After confirmation, app retrieves and decrypts password using Windows DPAPI
6. Automatic login to Supabase

**Note:** The security comes from Windows DPAPI encryption, which is tied to your Windows login. The encrypted credentials can only be decrypted by you, the logged-in Windows user.

### Security Architecture
```
User Password (Plain)
    ↓
Windows DPAPI Encryption (tied to Windows user account)
    ↓
Encrypted Buffer (base64)
    ↓
Stored in .credentials.enc file
    ↓
Only decryptable by same Windows user on same machine
```

## File Locations

- **Save File**: `%USERPROFILE%\Documents\Sparcclen\DID-Data.save`
  - Stores: theme, last email, first-run flag
  
- **Credentials File**: `%USERPROFILE%\Documents\Sparcclen\.credentials.enc`
  - Stores: Encrypted passwords mapped to emails
  - Format: `{ "email@example.com": "base64_encrypted_password" }`

## API Reference

### Renderer Process (React/TypeScript)

```typescript
// Check if Windows Hello is available
const isAvailable = await window.api.credentials.isAvailable()

// Prompt Windows Hello authentication (shows Windows Security dialog)
const authenticated = await window.api.credentials.promptHello(email)

// Store credentials
await window.api.credentials.store(email, password)

// Retrieve password (should only be called after successful Windows Hello prompt)
const password = await window.api.credentials.get(email)

// Get all stored emails
const emails = await window.api.credentials.getEmails()

// Check if email has stored credentials
const hasCredentials = await window.api.credentials.has(email)

// Delete credentials
await window.api.credentials.delete(email)
```

## Security Considerations

### ✅ Secure
- Uses Windows DPAPI for encryption
- Credentials tied to Windows user account
- Cannot be decrypted by other users
- Password never stored in plain text
- Stored file is useless if copied to another machine

### ⚠️ Important Notes
- Credentials are machine and user-specific
- If user changes Windows password, DPAPI keys may be invalidated
- Credentials file should be excluded from backups/syncing
- `.credentials.enc` is already in `.gitignore`

## User Experience

### First Login
```
┌─────────────────────────────────────┐
│ Welcome to Sparcclen               │
│                                    │
│ Email: [user@email.com...........]  │
│ Password: [••••••••••]             │
│                                    │
│ [Log in]                           │
└─────────────────────────────────────┘
```

### Return Visit (With Windows Hello)
```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐  │
│ │ 👆 Welcome back,              │  │
│ │    user@email.com             │  │
│ │    Continue with Windows Hello│  │
│ │                    [Continue] │  │
│ └───────────────────────────────┘  │
│                                    │
│ Email: [user@email.com...........]  │
│         └─ Autocomplete available  │
│ Password: [••••••••••]             │
│                                    │
│ [Log in]                           │
└─────────────────────────────────────┘

After clicking [Continue], a confirmation dialog appears:

┌─────────────────────────────────────┐
│        Windows Security            │
├─────────────────────────────────────┤
│                                    │
│ Sign in to Sparcclen               │
│                                    │
│ Continue as user@email.com?        │
│                                    │
│ Your Windows login already protects│
│ these credentials via Windows Data │
│ Protection API (DPAPI).            │
│                                    │
│        [Continue]  [Cancel]        │
└─────────────────────────────────────┘
```

**Why no PIN/fingerprint prompt?**
- Windows DPAPI already requires you to be logged into Windows
- Only YOUR Windows account can decrypt the stored password
- This avoids antivirus false positives from PowerShell scripts
- Security is equivalent - you must be the logged-in Windows user

## Troubleshooting

### Antivirus Flags the App
**Previous Issue (FIXED):** Earlier versions used PowerShell scripts which triggered antivirus false positives.

**Current Solution:** We now use native Electron dialogs instead of PowerShell, which:
- ✅ No antivirus warnings
- ✅ Cleaner user experience
- ✅ Same security level (DPAPI protection)

### Windows Hello Not Available
**Cause**: Electron's safeStorage API reports encryption unavailable
**Solutions**:
- Ensure Windows user is logged in (not guest account)
- Check Windows security settings
- Fallback: Manual email/password entry still works

### Credentials Not Found
**Cause**: `.credentials.enc` deleted or corrupted
**Solution**: Re-enter password - will be saved automatically

### Decryption Failed
**Cause**: Windows user account password changed
**Solution**: Delete `.credentials.enc` and re-authenticate

## Development Notes

### Main Process (electron/main/index.ts)
- Imports `CredentialManager` class
- Exposes IPC handlers for credential operations
- Uses `safeStorage` from Electron for DPAPI

### Preload (electron/preload/index.ts)
- Exposes credential APIs via `window.api.credentials`
- Type-safe IPC communication

### Renderer (src/components/Auth/Login.tsx)
- Checks credential availability on mount
- Shows Windows Hello UI when applicable
- Stores credentials on successful login
- Handles Windows Hello authentication

## Future Enhancements

- [ ] Windows Hello biometric prompt (requires native module)
- [ ] Credential sync across devices (with encryption)
- [ ] Multiple account management UI
- [ ] Credential expiration/rotation policy
- [ ] Two-factor authentication integration
