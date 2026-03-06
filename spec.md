# Vishal Embroidery Works

## Current State

The Admin Panel has accumulated layers of retry logic, logging, and session state management across three interconnected files that are causing runtime crashes:

- `src/frontend/src/utils/adminActor.ts` — complex singleton session with 5-retry + slow-retry logic, heavy debug logging, verbose error paths; `isInitialized` mutable export
- `src/frontend/src/store/adminSessionStore.ts` — Zustand store wrapping `adminActor.ts`, adds another async lifecycle layer
- `src/frontend/src/hooks/useAdminAuth.ts` — PIN login hook using sessionStorage
- `src/frontend/src/components/screens/AdminScreen.tsx` — 1900-line monolith importing all three above; has loading gate but session init errors still cause crashes

Root causes of the current corruption:
1. `bootstrapAdminToken()` was never added to `main.tsx` despite being referenced everywhere — the token is NOT pre-captured before React renders
2. `adminActor.ts` uses `createActorWithConfig()` which can return `undefined` if config is not ready; the retry loop adds complexity without fixing the root race
3. `adminSessionStore.ts` adds a third layer of async state over an already fragile promise singleton
4. Design Upload and Bulk Upload panels import hooks that call the actor immediately on mount, racing with the session init

## Requested Changes (Diff)

### Add
- `main.tsx` bootstrap: an IIFE that reads `caffeineAdminToken` from hash/query/sessionStorage and stores it in `sessionStorage` before `ReactDOM.createRoot` is called
- Hardcoded `FALLBACK_CONFIG` object in `adminActor.ts` used when `createActorWithConfig()` fails, so the app always has safe default values
- `AdminConfigContext` — a React context that holds the resolved config/session state and guards all child renders until ready
- Loading boundary wrapper for Design Upload and Bulk Upload panels — they only mount after config context is confirmed ready

### Modify
- `adminActor.ts` — complete rewrite: remove all retry/logging complexity; single clean async init; fallback config applied if actor creation fails; token read only after canister availability is confirmed
- `useAdminAuth.ts` — simplify to pure PIN check with sessionStorage persistence (no changes to logic, just clean rewrite to remove any stale state)
- `adminSessionStore.ts` — simplify to a minimal Zustand store: `idle | loading | ready | error` statuses, delegates entirely to the rewritten `adminActor.ts`
- `AdminScreen.tsx` — rewrite session init to use `AdminConfigContext`; Design Upload and Bulk Upload wrapped in explicit loading boundary that checks context ready state before rendering
- `main.tsx` — add token bootstrap IIFE before ReactDOM.createRoot

### Remove
- All `console.group` / verbose debug logging blocks from `adminActor.ts` (they bloat production bundles and obscure real errors)
- The 5-retry + slow-retry loop in `adminActor.ts` (replaced by single attempt + fallback config)
- `isInitialized` mutable module export (replaced by context/store state)

## Implementation Plan

1. Rewrite `main.tsx` to add the `bootstrapAdminToken()` IIFE before React renders — this is the single most important fix
2. Rewrite `adminActor.ts` from scratch:
   - Read token from sessionStorage only (bootstrap has already put it there)
   - Single attempt to `createActorWithConfig()`; if it fails, use `FALLBACK_CONFIG` (hardcoded safe defaults)
   - Call `_initializeAccessControlWithSecret(token)` only if canister is confirmed available
   - Export `getAdminActor()`, `getAdminSession()`, `resetAdminActor()` with clean signatures
3. Rewrite `useAdminAuth.ts` — keep identical PIN logic, remove stale imports
4. Rewrite `adminSessionStore.ts` — minimal store, no extra logic beyond delegating to adminActor
5. Rewrite `AdminScreen.tsx`:
   - PIN login screen unchanged
   - After login: show loading spinner while `initSession()` runs
   - Design Upload and Bulk Upload tabs: wrapped in a `<ConfigReadyBoundary>` component that renders a spinner if session is not yet `ready`
   - All existing 5 tabs (Analytics, Update Design, Design Upload, Bulk Upload, Customer) preserved
   - All `data-ocid` markers preserved
6. Validate (typecheck + build)
