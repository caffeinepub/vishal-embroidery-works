# Vishal Embroidery Works

## Current State

- App has 7 bottom nav tabs: Home, Embroidery, Blouse, Favourite, Customers, Contact, Admin
- Admin tab is always visible in the bottom nav and navigates directly to AdminScreen
- AdminScreen internally shows a login wall if not authenticated, then the dashboard
- The Admin tab is hidden in the nav bar when the Admin screen is active (nav hides on admin tab)
- "Add Design" and "Bulk Upload" are separate tabs inside the Admin dashboard
- Session is stored in `sessionStorage` via `useAdminAuth` hook
- Google OAuth and username/password login both supported
- Admin whitelist: akhileshsworks@gmail.com

## Requested Changes (Diff)

### Add
- Dedicated Admin entry point in the Home screen quick-access grid (tapping navigates to admin tab)
- Admin tab in bottom nav remains but acts as a protected route: immediately shows login wall before rendering any dashboard UI
- Unified Upload View: combine "Add Design" and "Bulk Upload" into a single unified tab called "Upload" inside the Admin dashboard, showing both a single-upload form and a bulk upload zone on the same scrollable screen
- Session persistence across Admin sub-navigation so user doesn't re-authenticate per upload

### Modify
- Bottom nav: Admin tab always visible; tapping it when not logged in shows the login screen, when logged in goes straight to the dashboard
- AdminScreen flow: restructure so the login check happens at the top level before any dashboard content is rendered (currently done but needs the unified upload tab)
- Admin dashboard tabs: replace the separate "Add Design" and "Bulk Upload" tabs with a single "Upload" tab that combines both features

### Remove
- Separate "Add Design" and "Bulk Upload" as distinct tabs -- they merge into one "Upload" tab
- The old "add" admin tab (replaced by unified Upload tab)
- The old "bulk" admin tab (replaced by unified Upload tab)

## Implementation Plan

1. In `AdminScreen.tsx`, change the `AdminTab` type: replace `"add"` and `"bulk"` with `"upload"`
2. Create a new `UnifiedUploadPanel` component that renders:
   - A section header with "Add Single Design" (DesignFormPanel inline) and "Bulk Upload" (BulkUploadPanel inline) stacked vertically in one scrollable view, separated by a divider
3. Update the admin tab bar: replace "Add Design" and "Bulk Upload" tabs with a single "Upload" tab pointing to `"upload"`
4. Update the tab content renderer: render `<UnifiedUploadPanel />` when `activeTab === "upload"`
5. Ensure session check at the very top of AdminScreen renders login wall immediately (already in place, confirm no regressions)
6. Update App.tsx: ensure the Admin bottom nav tab is always visible (remove the `activeTab !== "admin"` hide condition from the nav — currently the entire nav is hidden when admin tab is active; keep it visible so user can navigate away without a back button)
7. Keep all existing upload logic, auth flows, design code generation, and session persistence intact
