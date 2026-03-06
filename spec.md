# Vishal Embroidery Works

## Current State

The app is a full-stack embroidery shop catalog built on ICP (Motoko backend + React frontend). It has:
- 5-tab bottom nav: Home, Embroidery, Blouse, Favourite, Customers
- Hidden admin access via "VEW" button on Home screen header
- Admin panel with 4 tabs: Analytics, Update Design, Design Upload, Bulk Upload, Customer
- Google OAuth login + username/password login for admin
- Image upload pipeline via Caffeine blob storage
- Design management, customer management, order tracking

Current broken state:
1. `main.tsx` was never updated to include `bootstrapAdminToken()` — the token capture that was referenced in code comments was never actually implemented. This means the `caffeineAdminToken` from the URL is never saved to `sessionStorage` before React renders.
2. `getSecretParameter()` in `urlParams.ts` only checks the URL **hash fragment** (`#caffeineAdminToken=...`) but Caffeine injects the token as a **query string** parameter (`?caffeineAdminToken=...`). This means token lookup silently returns null.
3. `useActor.ts` uses `getSecretParameter()` which also misses the query string token.
4. `adminActor.ts` has `resolveAdminToken()` which does check the query string, but since the bootstrap in `main.tsx` is missing, after any Google OAuth redirect the token is gone from the URL and not in sessionStorage either.
5. `AdminScreen.tsx` `initializeGoogle()` can crash with "Cannot read properties of undefined (reading 'config')" if `window.google.accounts.id.initialize()` is called before the script is fully loaded or if the GIS script loads in a partially initialized state.

## Requested Changes (Diff)

### Add
- `bootstrapAdminToken()` function in `main.tsx` that runs before ReactDOM.createRoot(), saves `caffeineAdminToken` from URL query string AND hash fragment to sessionStorage immediately
- Defensive null guard in `AdminScreen.tsx` `initializeGoogle()` around `window.google?.accounts?.id?.initialize()` to prevent the undefined config crash
- Add an `initTimeout` retry mechanism in `AdminScreen.tsx` so if the Google script loads but `accounts.id` is temporarily undefined, it retries initialization up to 3 times with 500ms delay

### Modify
- `main.tsx`: Add `bootstrapAdminToken()` call before ReactDOM.createRoot() — this is the single most critical fix
- `urlParams.ts` `getSecretParameter()`: Also check URL query string (not just hash), so it works for both Caffeine's query injection and hash injection
- `useActor.ts`: Use `getPersistedUrlParameter` or inline query string lookup instead of `getSecretParameter` to ensure the token is found in query string
- `adminActor.ts` `resolveAdminToken()`: Already correct but add defensive check — if sessionStorage has the token, return early without logging errors

### Remove
- Nothing to remove

## Implementation Plan

1. Fix `main.tsx`: Add `bootstrapAdminToken()` as an IIFE before React renders. It reads `caffeineAdminToken` from both `window.location.search` (query string) and `window.location.hash` (hash fragment), and immediately saves to sessionStorage.
2. Fix `urlParams.ts` `getSecretParameter()`: Change to check query string first, then hash fragment (matching Caffeine's actual injection method).
3. Fix `useActor.ts`: Use `new URLSearchParams(window.location.search).get('caffeineAdminToken')` or `getPersistedUrlParameter` so the actor initialization has the token.
4. Fix `AdminScreen.tsx`: Wrap `window.google.accounts.id.initialize(...)` in a proper null guard for each property in the chain; add retry logic if GIS object is partially loaded.
5. No backend changes needed — the Motoko canister is fine; the issues are all in frontend auth/token handling.
