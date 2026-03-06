# Vishal Embroidery Works

## Current State

- Full-stack app: Motoko backend + React/TypeScript frontend
- Bottom nav has 7 tabs: Home, Embroidery, Blouse, Favourite, Customers, Contact, Admin
- Home screen has a 3x2 quick-access grid with: Embroidery, Blouse, Customers, Admin Panel, Contact, Favourites
- AdminScreen is accessed via the "Admin" tab in bottom nav or from Home quick-access cards
- Admin panel has 3 internal tabs: Designs, Upload, Customers
- Google Client ID is set to `1002480004594-1h58q9aikcgelgeae3gl28pijm9uj5sl.apps.googleusercontent.com` (most recent version)
- Admin whitelist contains `akhileshsworks@gmail.com`
- `adminActor.ts` uses a 3-step token fallback (sessionStorage → URL query → URL hash)
- `main.tsx` does NOT currently have a bootstrap token capture function
- Image upload uses `imageHandler.ts` with the shared admin session agent
- Upload pipeline: validate → compress → get admin session → create StorageClient → upload

## Requested Changes (Diff)

### Add

- `bootstrapAdminToken()` function in `main.tsx` that runs before React renders, reads the `caffeineAdminToken` from URL query string and saves it to sessionStorage immediately (this is the critical fix — must run before any OAuth redirect)
- VEW button at top-left of the Home screen header that opens the Admin Panel login modal/overlay (hidden admin access point)
- Admin panel 4th section: split the current "Upload" tab into "Design Upload" (single design) and "Bulk Upload" (bulk), keeping "Update Design" (designs list) and "Customer" as tabs — total 4 tabs
- Backend health check before admin actions: verify canister is responding before showing admin dashboard

### Modify

- `main.tsx`: add `bootstrapAdminToken()` self-executing function that captures token from URL to sessionStorage before React renders
- `App.tsx`: 
  - Remove "customers" and "contact" tabs from bottom nav (keep Home, Embroidery, Blouse, Favourite only — 4 tabs)
  - Remove "admin" tab from bottom nav
  - Change the VEW badge/button in Home header to be a tappable button that opens Admin Panel
  - The Home header currently has a `<span>` labeled "VEW" — convert it to a `<button>` that navigates to admin
- `HomeScreen.tsx`: Remove "Customers", "Admin Panel", and "Contact" cards from the Quick Access grid (keep only Embroidery, Blouse, Favourites — 3 cards)
- `AdminScreen.tsx`: 
  - Rename existing tabs: "designs" → "Update Design", "upload" tab split into two: "Design Upload" + "Bulk Upload", "customers" → "Customer"
  - Total 4 tabs: Update Design, Design Upload, Bulk Upload, Customer
  - Google Client ID already correct — confirm it stays as-is
  - Admin login form works as modal/overlay opened by VEW button (not a separate tab)
- `adminActor.ts`: Ensure the singleton is reset on first failed init so it retries cleanly; remove the pattern where `adminSessionPromise.catch` clears the promise (causes retry storms) — keep it but make sure it only clears on definitive auth errors, not transient network errors

### Remove

- "Customers" tab from bottom nav
- "Contact" tab from bottom nav  
- "Admin" tab from bottom nav
- "Customers", "Admin Panel", "Contact" quick-access cards from Home screen (keep Embroidery, Blouse, Favourites)

## Implementation Plan

1. **`main.tsx`** — Add `bootstrapAdminToken()` function that runs synchronously before `ReactDOM.createRoot`. It reads `caffeineAdminToken` from `window.location.search` and saves to `sessionStorage` with key `vew_caffeine_admin_token`. This ensures the token survives any OAuth redirect.

2. **`App.tsx`** — 
   - Reduce `NAV_ITEMS` to 4 items: Home, Embroidery, Blouse, Favourite (remove Customers, Contact, Admin)
   - Remove `Tab` union members for `customers`, `contact`, `admin` — add back `admin` as a state flag, not a tab
   - Add `showAdmin` state boolean
   - In the Home header, convert the `<span className="...">VEW</span>` badge to a `<button>` that sets `showAdmin = true`
   - Render `AdminScreen` as an overlay (full-screen modal) when `showAdmin === true`, with `onBack` closing it

3. **`HomeScreen.tsx`** — Remove "Customers", "Admin Panel", "Contact" from `QUICK_SECTIONS`. Keep: Embroidery, Blouse, Favourites (3 cards). Pass `onNavigate` calls for those 3 only.

4. **`AdminScreen.tsx`** — 
   - Update `AdminTab` type: `"update_design" | "design_upload" | "bulk_upload" | "customer"`
   - Map existing "designs" content → "update_design" tab
   - Map existing `UnifiedUploadPanel` → split into two separate panels: single design form goes to "design_upload" tab, bulk upload UI goes to "bulk_upload" tab
   - Map existing "customers" content → "customer" tab
   - Tab labels: "Update Design / ಡಿಸೈನ್ ಅಪ್ಡೇಟ್", "Design Upload / ಡಿಸೈನ್ ಅಪ್ಲೋಡ್", "Bulk Upload / ಬಲ್ಕ್ ಅಪ್ಲೋಡ್", "Customer / ಗ್ರಾಹಕ"

5. **Canister health check** — Before showing the admin dashboard after login, call a lightweight read method (e.g., `getNextDesignCode("")` or `getAllDesigns()`) to verify the canister is alive. If it fails, show a "Backend unavailable — the canister may be restarting" banner while still allowing login.
