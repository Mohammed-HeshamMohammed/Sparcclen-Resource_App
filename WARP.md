# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

**Core Development:**
- `npm run dev` - Start development server (Vite + Electron concurrently)
- `npm run dev:debug` - Start with Electron DevTools enabled
- `npm run dev:clean` - Clean development start
- `npm run cleanup` - Force kill Node/Electron processes on Windows

**Building:**
- `npm run build` - Production build
- `npm run preview` - Preview production build

**Code Quality:**
- `npm run lint` - Run ESLint on TypeScript/TSX files
- `npm run lint:fix` - Auto-fix linting issues and sort components
- `npm run typecheck` - TypeScript type checking without emit
- `npm run check:components` - Verify component index exports are sorted
- `npm run sort:components` - Auto-sort component index exports

**Electron Preload:**
- `npm run preload:build` - Build preload scripts
- `npm run preload:watch` - Watch and rebuild preload scripts

**Database Mirroring:**
- `npm run mirror:supabase-to-src` - Sync from Supabase to local
- `npm run mirror:src-to-supabase` - Sync local changes to Supabase

## Architecture Overview

**Hybrid Desktop Application:**
- **Frontend:** React 18 + TypeScript + Vite
- **Desktop:** Electron with custom IPC handlers
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Styling:** TailwindCSS + Radix UI components
- **State:** Local Electron persistence + Supabase sync

**Key Architectural Patterns:**
- **Dual Runtime:** Browser (React/Vite) + Node.js (Electron main process)
- **IPC Communication:** Structured handlers in `electron/main/ipc/` for main-renderer communication
- **Offline-First Auth:** WebAuthn (Windows Hello) for offline authentication with Supabase fallback
- **Component Organization:** Strict barrel export system with automated sorting

## Project Structure

**Core Directories:**
- `src/components/` - React components organized by feature area
  - `Auth/` - Authentication screens, modals, wrappers
  - `Layout/` - Shell, theme, window controls
  - `Resources/` - Resource management UI
  - `User/` - Profile and settings
  - `ui/` - Reusable UI primitives
- `electron/main/` - Electron main process
  - `ipc/` - IPC handlers (file system, credentials, resources, etc.)
  - `persistence/` - Local data storage
  - `security/` - Credential management
  - `windows/` - Window creation and management
- `electron/preload/` - Preload scripts for secure main-renderer bridge
- `src/lib/` - Utilities and services
  - `services/` - Supabase client, WebAuthn helpers
  - `utils/` - General utilities (cn, helpers)

**Import System:**
- Use `@/` alias for all internal imports
- Barrel exports via `index.ts` files (automatically sorted)
- Example: `import { Shell } from '@/components/Layout'`

**Component Organization Rules:**
- All `index.ts` files must export members alphabetically
- Use `npm run check:components` to verify, `npm run sort:components` to fix
- Mixed default/named exports exist but trend toward named exports

## Environment Setup

**Required Environment Variables:**
- `SUPABASE_URL` or `VITE_SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` or `VITE_SUPABASE_ANON_KEY` - Supabase anon key

**Development Environment:**
- Uses separate dev user data directory (`SparcclenDev`) 
- Vite dev server runs on port 5175
- Mock Supabase client used when credentials missing

## Technical Details

**Authentication Strategy:**
- Primary: Offline WebAuthn (Windows Hello) via browser API
- Fallback: Supabase Auth with email/password
- Helpers in `src/lib/services/webauthn.ts`

**Electron IPC Architecture:**
- Main process handles: file system, credentials, window controls, resources
- Preload API bridge in `electron/preload/api/`
- Upload tracking and window state management
- Single-instance application enforced

**Build Optimization:**
- Code splitting: Supabase, React vendor, Framer Motion, Lucide icons
- Chunk size warning limit: 1000KB
- Output to `dist-electron/renderer/`

**Database Integration:**
- Supabase client with TypeScript database types
- Local persistence layer in Electron main process
- Bidirectional sync scripts for development

## Development Workflow

1. **Setup:** Ensure environment variables are configured
2. **Development:** Use `npm run dev` for hot reload development
3. **Code Changes:** Components auto-format via ESLint + index sorting
4. **Type Safety:** Run `npm run typecheck` before commits
5. **Quality Check:** Use `npm run lint` to verify code standards
6. **Database Sync:** Use mirror scripts as needed for Supabase changes