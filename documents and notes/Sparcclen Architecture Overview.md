# Sparcclen Architecture Overview
Date: 2025-10-09

## 1. High-level Summary
- **Platform**: Electron desktop app with React 18 + TypeScript, Vite build.
- **State/Flow**: Single-page orchestration in `src/App.tsx` without a router. App states: Splash → Theme Selection (first-run) → Auth screens → Main Shell.
- **Auth**: Supabase Auth (email/password). Optional offline gating via Windows Hello (local-only, no server verification).
- **Data**: Local in-memory resources with favorites persisted locally (works offline).
- **Theming**: System/light/dark with animated transitions and rate limiting.
- **Electron**: Frameless window, custom controls, persistent user save file, IPC bridge via preload. Legacy DPAPI credential manager remains for compatibility but is not used by the current auth flow.

---

## 2. Runtime Targets & Boot
- `electron/main/index.ts`
  - Creates the main window with frameless UI and IPC handlers for minimize/maximize/close and window size queries.
  - In dev, installs a permissive CSP to allow dev server and Supabase domains.
  - Implements single-instance lock and shows window only when ready.
  - Persists app save under `Documents/Sparcclen/DID-Data.save` with helpers `readSaveFile()` and `writeSaveFile()` exposed to renderer via preload IPC (`save:read`, `save:write`).
  - For dev: separates `appData` and `cache` to avoid Windows cache lock issues.
- `electron/main/credentialManager.ts` (Legacy, DPAPI-based)
  - Historical component for encrypted credential storage under `Documents/Sparcclen/.credentials.enc`.
  - Methods (`isEncryptionAvailable()`, `storeCredentials()`, `getCredentials()`, `getStoredEmails()`, `hasCredentials()`, `deleteCredentials()`) are retained for backward compatibility.
  - The native Windows Hello confirmation (`promptWindowsHello()`) is not used anymore. Windows Hello flows are WebAuthn-only now.
- `electron/preload/index.ts`
  - Exposes `window.api` with window controls, save calls, (legacy) credential manager methods, and event subscription for window resize. Legacy credential calls are not used in current auth.

---

## 3. Frontend Composition
- Entry: `src/main.tsx` renders `src/App.tsx` in StrictMode.
- `src/App.tsx` (AuthFlow)
  - Tracks UI mode via internal `authState`: 'login' | 'signup' | 'forgot-password' | 'update-password' | 'auth-confirm' | 'auth-error'.
  - First-run experience: splash (`components/Layout/SplashScreen.tsx`) then `ThemeSelection`.
  - Uses `ThemeProvider` for theming context and `AuthProvider` for authentication context.
  - Handles online/offline status and an "offline session" toggle via app save. After offline authentication, a playful `OfflineInterstitial` shows before the Shell.

---

## 4. Authentication Layer
- `src/lib/auth/auth.tsx`
  - Wraps Supabase session (`supabase.auth.getSession()` / `onAuthStateChange`).
  - Persists last known display name/email to the Electron save and local storage.
- Supabase client: `src/lib/services/supabase.ts`
  - Typed with `Database` from `src/types/database/`.
  - Returns a minimal mock client for development.
- Auth Screens (`src/components/Auth/`)
  - `Login.tsx`: email/password with `hashPasswordSecure()` and an optional Windows Hello offline gate (local-only). Offline UI is minimal (welcome line + subtitle + fingerprint button).
  - `SignUp.tsx`: registration via `supabase.auth.signUp()` with client-side hashing.
  - `ForgotPassword.tsx`: sends reset email; `UpdatePassword.tsx`: updates password.
  - `AuthConfirm.tsx`: handles email confirmation by `supabase.auth.verifyOtp()` using URL tokens.
  - `AuthError.tsx`: shows auth errors.
  - Provides `authenticateWithPasskeyOffline()` as a local-only gate (no server verification). Online WebAuthn flows have been removed.
  - See `documents and notes/OFFLINE_WINDOWS_HELLO_GATE.md` for details on the offline Windows Hello gate.

---

## 5. Data & Services
- Local resource API: `src/lib/services/localApi.ts`
  - `getCategories()`, `getResources()`, `searchResources()`, `toggleFavorite()`, `incrementViewCount()`, `getFavoritedResources()`, `getTags()`, `getTagsByCategory()`.
  - Favorites persisted in `localStorage` keyed by `userId`.
- Profile service: `src/lib/services/profileCloud.ts`
  - Handles encrypted profile data and pictures in Supabase `profiles` table.
- Avatar service: `src/lib/services/avatarService.ts`
  - Manages profile picture display and uploads.
- Types: `src/types/index.ts` for `Category`, `Resource`, `Tag`, `Favorite`, `AppSettings`, `SearchFilters`, `ViewMode`.
- System save: `src/lib/system/saveClient.ts` uses `window.api` in Electron, falling back to `localStorage` in the browser build. Dispatches a `save:updated` event after writes so UI reacts immediately (e.g., switching to Shell after offline auth).
- Services index: `src/lib/services/index.ts` re-exports local API functions and `supabase`.

---

## 6. Theming & UI Transitions
- `src/hooks/useTheme.ts`
  - Manages theme state: 'system' | 'light' | 'dark'.
  - Adds/removes `dark` class on root, persists to local storage and Electron save.
  - Animated transitions via `ThemeTransition` with safety timeout and queuing.
- `src/components/Layout/ThemeProvider.tsx`
  - Wraps children with theme context and renders `ThemeTransition` overlay when `isTransitioning`.
- `src/components/Layout/ThemeSelection.tsx` + `src/hooks/useThemeRateLimit.ts`
  - First-run theme picker with rate-limiting (4+ switches per minute triggers cooldown with countdown).
- `src/components/Layout/ToggleTheme.tsx`
  - Compact theme switcher in the custom title bar.

---

## 7. Main Shell / Resources UI
- `src/components/Layout/Shell.tsx`
  - Owns app content once authenticated or in offline session.
  - Integrates:
    - `ResourceSidebar.tsx`: Navigation + user section (logout). Uses `components/ui/sidebar.tsx`.
    - `TopBar.tsx`: Search, favorites toggle, category filter.
    - `ResourceGrid.tsx`: Displays `ResourceCard` items; uses `SkeletonLoader` while loading.
    - `ResourceDetailModal.tsx`: Focused view with metadata and actions.
  - `Settings.tsx`, `Profile.tsx` as content pages.
  - `Dashboard.tsx`: Overview with charts, stats, top resources, favorites, recent activity, and user management with avatars.
  - Data flows from `lib/services` (currently the local in-memory API) and `useAuth()` for user context.

---

## 8. Admin & User Management
- `src/components/Admin/RoleManagement.tsx`
  - Allows admins to view and update user roles (Free, Premium, Admin, CEO).
  - Integrates with Supabase for role management.
  - Displays user list with avatars and role indicators.

---

## 9. Reusable UI & Utilities
- `src/components/ui/`
  - `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx` built on utility `cn()` from `@/lib/utils`.
  - `sidebar.tsx`: composable sidebar used by resources area.
- `src/lib/utils/`
  - `utils.ts`: `cn`, `truncateText`, `formatDate`, simple `debounce`.
  - `crypto.ts`: WebCrypto-based helpers including `hashPasswordSecure()` and deterministic salt.
- `src/hooks/useKeyboardShortcuts.ts`
  - Declarative keyboard shortcut registration hook.

---

## 10. Supabase Functions & DB
- **Single root**: Edge Functions live under `supabase/functions/`.
- **Functions**:
  - `get_user_by_email`
- **Tables**:
  - `profiles`: Encrypted user profile data including pictures
  

---

## 11. Build and Config
- `tsconfig.json` sets `baseUrl: ./src` with alias `@/*` used across the code.
- `vite.config.ts`
  - Root set to `src/`; tsconfig paths plugin; node polyfills; code-splitting (supabase, react, framer, icons).
  - Electron main/preload builds output to `dist-electron/`.

---

## 12. Legacy/Removed (housekeeping already applied)
- Deleted unused: `src/components/ui/bar.tsx`, `src/components/User/SettingsModal.tsx`, `src/components/Admin/Users.tsx`, `src/lib/services/client.ts`, `src/lib/library/`.
- Cleaned `src/lib/index.ts` and `src/lib/auth/index.ts` to remove dangling exports.
- Windows Hello via DPAPI (native prompt) removed from the auth flow; WebAuthn is the single path (online/offline).

---

## 13. Known Environment & Secrets
- `.env` expected to include Supabase URL/Key:
  - `SUPABASE_URL`/`VITE_SUPABASE_URL`, `SUPABASE_KEY`/`VITE_SUPABASE_ANON_KEY`.
 

---

## 14. Suggested Improvements (actionable)
- **Data layer abstraction**
  - Introduce a `ResourceService` interface (remote vs local). Toggle via env flag. Gradually replace `localApi` usage with injected implementation.
- **Type safety end-to-end**
  - Generate Supabase types (tables, RPCs) and use them across services. Align `Category/Resource` with DB schema, add Zod schemas for runtime validation.
- **Auth hardening**
  - Centralize error handling and toasts for auth calls. Sanitize logs. Unify password hashing strategy with server expectations (avoid deterministic salts if server-side hashing exists).
- **WebAuthn UX**
  - Detect platform authenticator availability and show contextual guidance. Add retry/backoff. For offline gating, clarify semantics and messaging.
- **Performance**
  - Virtualize `ResourceGrid` for large lists (e.g., `react-window`).
  - Add search debounce (already imported `debounce`, ensure used in `Shell.tsx` for query typing) and request cancellation.
  - Lazy-load heavy screens/modals.
- **Resilience**
  - Add global error boundary and per-section fallback UIs. Strengthen `saveClient` fallback (verify presence of `window.api`).
- **Testing**
  - Unit tests for hooks (`useTheme`, `useThemeRateLimit`, `useKeyboardShortcuts`).
  - Integration tests for Auth flow with a mocked Supabase client.
  - E2E smoke on Electron (Playwright).
- **DX and structure**
  - Enforce alias imports project-wide (done in this refactor; add ESLint rule to prevent deep relatives).
  - Consider a thin router (even hash-based) for better deep-linking and state restoration.
- **Accessibility**
  - Audit interactive components (`Sidebar`, `Modal`, `WindowControls`) for ARIA, keyboard focus management, reduced-motion support.
- **Security**
  - Review CSP in production builds. Consider encrypting the local save as well (even if low sensitivity).
- **Observability**
  - Add optional lightweight telemetry/error reporting with opt-in toggle.

---

## 15. Inspiration for New Features
- **Resource intelligence**
  - AI-assisted tagging, summarization, and deduplication of resources. Smart recommendations based on favorites and usage.
- **Collections & Sharing**
  - User-curated collections, export/import (JSON), and shareable bundles.
- **Command Palette**
  - Global command palette (Ctrl/Cmd+K) for navigation/actions with `useKeyboardShortcuts` integration.
- **Advanced Theming**
  - Theme presets marketplace, dynamic color extraction from resource thumbnails, per-collection themes.
- **Offline-first sync**
  - Background sync for resources and tags with conflict resolution. Visual indicators for offline edits.
- **Notifications & Updates**
  - In-app release notes, optional desktop notifications for new collections/resources.
- **Passkey-first**
  - Offer passkey enrollment during signup; fast login with device-bound credentials.
- **Multi-workspace**
  - Separate profiles/workspaces (e.g., Design, Dev, Research) with quick switching.

---

## 16. Quick Map of Key Files
- Entry/UI: `src/App.tsx`, `src/components/Layout/*`, `src/components/Resources/*`, `src/components/Auth/*`, `src/components/Dashboard/*`, `src/components/Admin/*`
- Auth: `src/lib/auth/auth.tsx`, `src/lib/services/supabase.ts`, `src/lib/services/webauthn.ts`
- Data: `src/lib/services/localApi.ts`, `src/lib/services/profileCloud.ts`, `src/lib/services/avatarService.ts`, `src/types/index.ts`
- Theming: `src/hooks/useTheme.ts`, `src/components/Layout/ThemeProvider.tsx`, `src/components/Layout/ThemeSelection.tsx`
- Electron: `electron/main/index.ts`, `electron/preload/index.ts`, `electron/main/credentialManager.ts`
- System save: `src/lib/system/saveClient.ts`
- Utilities: `src/lib/utils/*`

---

This document reflects the current codebase after refactors and cleanup. Use it as a living guide during logic fixes, testing, and future feature work.
