# Email Confirmation States - Visual Reference

## 🔄 Loading State
```
┌─────────────────────────────────────┐
│  Email Confirmation                 │
├─────────────────────────────────────┤
│                                     │
│         🔵 (spinning)               │
│                                     │
│   Confirming Your Email...          │
│                                     │
│   Please wait while we verify       │
│   your email address...             │
│                                     │
│   Almost there...                   │
│   Verifying your email address...   │
└─────────────────────────────────────┘
```

## ✅ Success State (with Windows-style progress)
```
┌─────────────────────────────────────┐
│  Email Confirmation                 │
├─────────────────────────────────────┤
│                                     │
│         ✓ (green)                   │
│                                     │
│   Email Confirmed!                  │
│                                     │
│   Email confirmed successfully!     │
│                                     │
│   ┌───────────────────────────┐    │
│   │ Redirecting you to login...│    │
│   └───────────────────────────┘    │
│                                     │
│   ████████████░░░░░░░░░░░░░░░      │
│   75% complete                      │
│                                     │
│   Welcome aboard!                   │
│   Your account is now active...     │
└─────────────────────────────────────┘
```

## ⏰ Expired Link State
```
┌─────────────────────────────────────┐
│  Email Confirmation                 │
├─────────────────────────────────────┤
│                                     │
│         🕐 (orange)                 │
│                                     │
│   Link Expired                      │
│                                     │
│   Your confirmation link has        │
│   expired. Please request a new one.│
│                                     │
│   ┌───────────────────────────┐    │
│   │ What happened?            │    │
│   │ Confirmation links expire │    │
│   │ after 24 hours for        │    │
│   │ security. Please sign up  │    │
│   │ again to receive a new    │    │
│   │ link.                     │    │
│   └───────────────────────────┘    │
│                                     │
│   [ Back to Home ]                  │
│                                     │
│   Need a new link?                  │
│   Go back to the signup page...     │
└─────────────────────────────────────┘
```

## 👤 Already Confirmed State
```
┌─────────────────────────────────────┐
│  Email Confirmation                 │
├─────────────────────────────────────┤
│                                     │
│         ✓👤 (blue)                  │
│                                     │
│   Already Confirmed                 │
│                                     │
│   Your email is already confirmed!  │
│   You can log in now.               │
│                                     │
│   ┌───────────────────────────┐    │
│   │ Good news!                │    │
│   │ Your account is ready to  │    │
│   │ use. Just log in with     │    │
│   │ your credentials.         │    │
│   └───────────────────────────┘    │
│                                     │
│   [ Go to Login ]                   │
│                                     │
│   Ready to start?                   │
│   Your email is verified...         │
└─────────────────────────────────────┘
```

## ⚠️ Invalid Link State
```
┌─────────────────────────────────────┐
│  Email Confirmation                 │
├─────────────────────────────────────┤
│                                     │
│         ⚠️ (red)                    │
│                                     │
│   Invalid Link                      │
│                                     │
│   This confirmation link is invalid │
│   or has already been used.         │
│                                     │
│   ┌───────────────────────────┐    │
│   │ Invalid or used link      │    │
│   │ This link may have already│    │
│   │ been used or is invalid.  │    │
│   │ Try signing up again if   │    │
│   │ needed.                   │    │
│   └───────────────────────────┘    │
│                                     │
│   [ Back to Home ]                  │
│                                     │
│   Need help?                        │
│   If you continue to experience...  │
└─────────────────────────────────────┘
```

## ❌ Generic Error State
```
┌─────────────────────────────────────┐
│  Email Confirmation                 │
├─────────────────────────────────────┤
│                                     │
│         ✕ (red)                     │
│                                     │
│   Confirmation Failed               │
│                                     │
│   [Error message from Supabase]     │
│                                     │
│   [ Back to Home ]                  │
│                                     │
│   Need help?                        │
│   If you continue to experience     │
│   issues, please contact support... │
└─────────────────────────────────────┘
```

## URL → State Mapping

| URL Pattern | State | Icon | Color |
|-------------|-------|------|-------|
| `#token_hash=xxx&type=signup` | Success | ✓ CheckCircle | Green |
| `#error=...&error_code=otp_expired` | Expired | 🕐 Clock | Orange |
| `#error=already_confirmed` | Already Confirmed | ✓👤 UserCheck | Blue |
| `#error=access_denied` | Invalid | ⚠️ AlertCircle | Red |
| `#error=...` (other) | Generic Error | ✕ XCircle | Red |

## Button Actions

| State | Button Text | Action |
|-------|-------------|--------|
| Success | (none - auto redirect) | Redirects to `/` after 2.5s |
| Expired | "Back to Home" | `window.location.href = '/'` |
| Already Confirmed | "Go to Login" | `window.location.href = '/'` |
| Invalid | "Back to Home" | `window.location.href = '/'` |
| Generic Error | "Back to Home" | `window.location.href = '/'` |

## Progress Animation Details

**Success State Only**
- Duration: 2.5 seconds
- Update interval: 40ms
- Increment: 2% per update
- Total updates: ~62 updates
- Visual: Green gradient progress bar
- Text: "X% complete" → "Complete!"

```tsx
// Animation code
const progressInterval = setInterval(() => {
  setProgress((prev) => {
    if (prev >= 100) {
      clearInterval(progressInterval)
      return 100
    }
    return prev + 2
  })
}, 40)

setTimeout(() => {
  window.location.href = next
}, 2500)
```

## Color Scheme

### Light Mode
- Success: `bg-green-100`, `text-green-600`
- Expired: `bg-orange-100`, `text-orange-600`
- Already Confirmed: `bg-blue-100`, `text-blue-600`
- Invalid/Error: `bg-red-100`, `text-red-600`
- Loading: `bg-blue-100`, `text-blue-600`

### Dark Mode
- Success: `dark:bg-green-900/30`, `dark:text-green-400`
- Expired: `dark:bg-orange-900/30`, `dark:text-orange-400`
- Already Confirmed: `dark:bg-blue-900/30`, `dark:text-blue-400`
- Invalid/Error: `dark:bg-red-900/30`, `dark:text-red-400`
- Loading: `dark:bg-blue-900/30`, `dark:text-blue-400`
