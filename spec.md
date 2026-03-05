# Vishal Embroidery Works

## Current State

The app is a full-stack Motoko + React mobile catalog for a tailoring/embroidery shop. It includes:
- Splash screen (SplashScreen.tsx) with VEW logo and shop name
- 6-tab bottom navigation: Home, Embroidery, Blouse, Favourite, Customers, Contact
- Admin panel with username/password login, Add Design, Bulk Upload, manage designs/customers
- Image upload via Caffeine blob storage (StorageClient.ts) with admin token auth
- Auto-generated design codes (VEW-AE-xxx etc.) per category
- Design gallery with lazy loading (page 50), back-to-top, search, compare
- Customer management with orders, measurements, status tracking
- Backend: Motoko with access control requiring admin role for mutations

Known problems:
1. Splash screen may show blank if logo image fails to load (no fallback/inline SVG)
2. Splash screen timer starts immediately regardless of image load state -- may navigate before logo is visible
3. `useUploadImage` initializes admin token via a separate actor call inside the upload loop -- fragile; if that call fails the entire upload fails with an auth error
4. The `getAllDesigns` query in the backend calls `.sort()` without a comparator, which sorts by default object ordering (unreliable)
5. After bulk upload, gallery cache invalidation may not force a refetch quickly enough
6. `createCustomer` backend requires `#user` permission; the admin actor has `#admin` which does NOT include `#user` unless `hasPermission` checks for admin as a superset -- need to verify and fix
7. Upload error messages may be misleading when the admin token is missing from the URL (token not in sessionStorage yet)
8. The `useGetNextDesignCode` query requires admin auth -- if the admin token isn't initialized yet on first load, the preview badge fails silently
9. No `loading` / `error` fallback on the VEW logo `<img>` in the splash screen
10. `BulkUploadPanel` re-creates upload state after clear but doesn't reset `isDone` consistently

## Requested Changes (Diff)

### Add
- Inline SVG fallback for the VEW logo in SplashScreen when image fails to load
- `onLoad` / `onError` handling on splash screen logo image so the timer only starts after the logo is confirmed visible (or after a max wait)
- Inline fallback VEW text badge on all logo `<img>` elements with `onError` handler
- Stale-time configuration on `useGetNextDesignCode` to avoid re-fetching constantly

### Modify
- **SplashScreen.tsx**: Wait for the logo to load (or error) before starting the 2.2s display timer; add `onError` fallback to show inline "VEW" text badge instead of broken image
- **useUploadImage.ts**: Move the admin token initialization outside the retry loop -- initialize once before the loop starts, throw early if it fails, don't call it again on retry
- **useQueries.ts `useCreateDesignBulk`**: After successful mutate, call `refetchQueries` with `type: 'active'` to force immediate gallery refresh
- **EmbroideryScreen.tsx**: Remove the sample data fallback entirely once `allQueriesReturned` is true -- make the empty state show a helpful "No designs yet, add some from Admin Panel" message
- **AdminScreen.tsx `DesignFormPanel`**: Validate that at least one image is uploaded before allowing save; show a clear validation message if no images
- **AdminScreen.tsx `BulkUploadPanel`**: After `isDone`, show a "Upload more" button that fully resets state including `isDone = false`; fix the `handleClear` to also reset `isDone`
- **HomeScreen.tsx**: Only fall back to sample data when the query is still loading (isLoading = true), not after it has returned empty

### Remove
- The redundant admin token init call inside the retry loop in `useUploadImage` (moved to before the loop)
- Sample data fallback in EmbroideryScreen when queries have returned (even if empty)

## Implementation Plan

1. **SplashScreen fix**: Add `logoLoaded` state; only start the exit timer after `onLoad` or `onError` fires on the logo `<img>`. Add `onError` handler that replaces image with inline "VEW" styled div. Cap max wait at 3s.

2. **Logo fallback everywhere**: In SplashScreen, App.tsx header logo images -- add `onError` that hides the `<img>` and shows a fallback "VEW" badge div.

3. **Upload auth fix in useUploadImage**: Move the admin token init to before the `for` loop. Initialize once. If it fails, throw immediately. Inside the loop, create a fresh agent but skip the init call.

4. **Gallery refresh fix**: In `useCreateDesignBulk` mutation `onSuccess`, use `refetchQueries({ queryKey: ['designs'], type: 'active' })` to force immediate active query refresh.

5. **EmbroideryScreen empty state**: After `allQueriesReturned` is true and `embroideryDesigns.length === 0`, show empty state with "No designs yet" message instead of sample data. This ensures newly uploaded designs appear immediately.

6. **Add Design validation**: In `DesignFormPanel`, validate `form.imageUrls.length > 0` before calling `onSave`. Show inline error message if no images selected.

7. **Bulk Upload reset**: Fix `handleClear` in `BulkUploadPanel` to reset `isDone` too. After upload completes (isDone=true), show a "Upload More Images" button that calls `handleClear`.

8. **HomeScreen sample data**: Only fall back to sample data when `isLoading` is true. Once queries return (even empty), show real data.

9. **Performance**: Add `loading="lazy"` and `decoding="async"` to all design grid images. Add `staleTime: 30_000` to `useGetNextDesignCode` to avoid hammering the backend.

10. **Admin login**: Confirm existing logic is correct (it was fixed in v5). No changes needed unless a regression is found during implementation.
