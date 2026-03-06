# Vishal Embroidery Works — Admin Panel Reset

## Current State

The app has a working PIN-based admin system with PIN `7391`. The admin panel includes:
- Analytics, Update Design, Design Upload, Bulk Upload, and Customer tabs
- `useAdminAuth.ts` manages PIN login with sessionStorage persistence
- `adminSessionStore.ts` (Zustand) manages backend session state via `getAdminSession()` from `adminActor.ts`
- `AdminScreen.tsx` renders the PIN screen first, then the full dashboard after login
- `main.tsx` wraps everything in `InternetIdentityProvider` which calls `loadConfig()` and can throw "Cannot read properties of undefined (reading 'config')"
- `useInternetIdentity.ts` calls `loadConfig()` inside `createAuthClient()` with no try/catch guard — this is the source of the undefined config crash
- The admin panel currently works for core functions but breaks on some devices when config is undefined

## Requested Changes (Diff)

### Add
- Safe try/catch guard around `loadConfig()` in `useInternetIdentity.ts` so config errors are caught and the provider gracefully falls back to idle state instead of crashing
- Safe default for `config.ii_derivation_origin` in `useInternetIdentity.ts` (use empty string if undefined)

### Modify
- **`useAdminAuth.ts`**: Change `ADMIN_PIN` from `"7391"` to `"4321"` — this is the primary change requested
- **`useInternetIdentity.ts`**: Wrap `loadConfig()` call in try/catch; if config loading fails, continue without `derivationOrigin` rather than crashing
- **`adminActor.ts`**: Add a top-level try/catch around the entire `initAdminSession()` function body to ensure it never throws uncaught; return fallback session on any error

### Remove
- No files removed — the existing structure is correct and working

## Implementation Plan

1. **`useAdminAuth.ts`**: Update `ADMIN_PIN` constant from `"7391"` to `"4321"`
2. **`useInternetIdentity.ts`**: Wrap the `loadConfig()` call in `createAuthClient()` inside a try/catch block; if it throws, create `AuthClient` without `derivationOrigin` option so the app never crashes on missing config
3. **`adminActor.ts`**: Wrap entire `initAdminSession()` in a top-level try/catch that returns the fallback session on any unhandled error
4. Validate build passes with no TypeScript errors
