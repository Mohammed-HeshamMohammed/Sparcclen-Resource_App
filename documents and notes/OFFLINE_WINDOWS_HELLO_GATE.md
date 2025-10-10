# Offline Windows Hello Gate (Local-Only)

## Overview
This app supports an offline "gate" using Windows Hello (via WebAuthn APIs) that lets users unlock the UI locally when the network is unavailable. This is not server authentication. It never stores or transmits a password and does not rely on any Supabase Edge Functions.

- No passwords are stored locally.
- No server verification occurs in offline mode.
- When the network is available, users authenticate online with Supabase email/password as usual.

## How it works
- The renderer calls the browser WebAuthn API to invoke the Windows Security dialog (PIN / fingerprint / face).
- We generate a local, random challenge and call `startAuthentication()` without server-provided options.
- A successful resolve is treated as a local-unlock signal only. No assertion is verified server-side.

Code paths:
- `src/lib/services/webauthn.ts` → `authenticateWithPasskeyOffline()` and `isWebAuthnSupported()`
- `src/components/Auth/Login.tsx` → Offline button calls `authenticateWithPasskeyOffline()`

## Online vs Offline
- Online (normal): email/password via Supabase (`supabase.auth.signInWithPassword`).
- Offline (gate): WebAuthn prompt triggers the Windows Security dialog locally and, if successful, unlocks the UI and marks an offline session in the save data.

## Security model
- This is a convenience gate for offline UX; it is not identity verification with a server.
- No reversible secrets are stored locally for login.
- The local save file (`Documents/Sparcclen/DID-Data.save`) contains only non-sensitive UI/session hints (e.g., lastEmail, displayName, offline flag). It’s not a credential vault.

## Dev notes
- The offline gate is only shown when `navigator.onLine` is false.
- The dev CSP already allows Vite HMR workers. No extra changes are required for the WebAuthn prompt.

## Future enhancements
- Optional DPAPI-encrypted session storage (refresh token) to auto-restore online sessions when connectivity returns.
- Per-user offline policy controls (enable/disable, timeout).
