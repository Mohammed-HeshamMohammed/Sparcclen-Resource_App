# Start-UP App Overview

This document summarizes the updated project structure, import/export conventions, and developer workflows after the component re-organization.

## Project structure

- `src/components/`
  - `Auth/`
    - `screens/` → Login, SignUp, ForgotPassword, UpdatePassword, AuthConfirm, AuthError
    - `modals/` → WindowsHelloModal, SupportContactModal
    - `wrappers/` → FormContentWrapper, BottomSectionWrapper
    - `interstitials/` → OfflineInterstitial
    - `index.ts` re-exports from subfolders
  - `Layout/`
    - `shell/` → Shell, TopBar, WindowControls
    - `theme/` → ThemeProvider, useTheme, ThemeSelection, ThemeTransition, ToggleTheme
    - `feedback/` → SplashScreen
    - `index.ts` re-exports from subfolders
  - `Resources/`
    - `grid/` → ResourceGrid, ResourceCard
    - `sidebar/` → ResourceSidebar (+ Logo, LogoIcon)
    - `modals/` → ResourceDetailModal
    - `filters/` → CategoryFilter
    - `index.ts` re-exports from subfolders
  - `User/`
    - `screens/` → Profile, Settings
    - `index.ts` re-exports from subfolder
  - `ui/`
    - `form/` → Button, Input, Label
    - `surface/` → Card and related
    - `layout/` → Sidebar primitives
    - `feedback/` → SkeletonLoader
    - `index.ts` re-exports from subfolders
- `src/lib/`
  - `utils/utils.ts` → `cn()`, helpers
  - `services/` → `supabase.ts`, `webauthn.ts`
  - other app libs

## Import conventions

- Prefer alias imports based on `tsconfig.json`:
  - `@/components/...` for components
  - `@/lib/...` for library code
- Example canonical imports:
  - `import { Shell } from '@/components/Layout'`
  - `import { CategoryFilter } from '@/components/Resources/filters'`
  - `import { Button, Input } from '@/components/ui/form'`
  - `import { SkeletonLoader } from '@/components/ui/feedback'`

## Barrel files

- Each folder exposes a local `index.ts`.
- Top-level barrels (`Auth/index.ts`, `Layout/index.ts`, etc.) re-export subfolders to keep imports short and avoid cycles.

## Export conventions

- Mixed exports exist (some default, some named) to preserve compatibility.
- Recommendation: standardize on named exports for components.
  - Migration plan:
    1. Convert `Auth/screens/*` default exports to named.
    2. Update imports across the project.
    3. Repeat per folder.
  - Optional ESLint: add `eslint-plugin-import` and enable `import/no-default-export` to enforce.

## Linting and type checking

- ESLint flat config: `eslint.config.js`
  - Warns on deep parent relative imports (prefers alias paths).
  - React hooks and refresh rules enabled.
  - Unused vars/args starting with `_` are ignored (e.g., `_userId`).
- Scripts:
  - `npm run lint` → lint TS/TSX sources
  - `npm run lint:fix` → auto-fix
  - `npm run typecheck` → TypeScript check without emitting

## Build

- Dev: `npm run dev`
- Production build: `npm run build`

## Offline WebAuthn (Windows Hello)

- Retained offline-only authentication flow using the browser WebAuthn API.
- Helper: `src/lib/services/webauthn.ts`
  - `isWebAuthnSupported()` → checks availability.
  - `authenticateWithPasskeyOffline()` → shows the Windows Security dialog and treats a successful assertion as an offline gate. No server verification.
- UI integration:
  - `src/components/Auth/screens/Login.tsx` uses the helper functions.
  - `src/components/Auth/modals/WindowsHelloModal.tsx` handles the UX.
- Dependency: `@simplewebauthn/browser` must remain in `package.json`.

## Dependency cleanup

- Unused Electron/polyfill packages removed.
- Only libraries referenced by code remain (React, Supabase, Framer Motion, Lucide, Radix, Sonner, utility libs).

## Notes

- `SkeletonLoader` moved to `ui/feedback` to avoid Layout/Resources cycles and to centralize UI feedback components.
- `useThemeRateLimit` is resolved via alias `@/hooks/useThemeRateLimit`.
