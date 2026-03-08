# Vishal Embroidery Works

## Current State

The app is a mobile-first tailoring management system built with React 19 + TypeScript + Tailwind CSS. All data is stored in browser localStorage via `src/frontend/src/lib/storage.ts`. The app has:

- Bottom navigation: Home, Embroidery, Blouse, Bridal, Stitching Orders
- Admin panel via VEW button in top-right of TopBar, protected by PIN
- Design catalog with subcategories, auto-codes, bridal tagging, multi-image
- Stitching Orders cart system with confirm-order flow
- Customer management with measurements, payments, order history
- Admin panel with 6 tabs: Upload, Bulk Upload, Designs, Customers, Orders, Dashboard
- Images stored as base64 strings in localStorage

## Requested Changes (Diff)

### Add

- **Firebase SDK**: Install `firebase` npm package and create `src/frontend/src/lib/firebase.ts` to initialize Firebase app + Firestore using provided config
- **Firestore service layer**: Create `src/frontend/src/lib/firestoreService.ts` with CRUD functions + real-time listeners for all 4 collections: `designs`, `customers`, `orders`, `payments`
- **Real-time hooks**: Create `src/frontend/src/hooks/useFirestore.ts` with hooks (`useDesigns`, `useCustomers`, `useOrders`, `usePayments`) that subscribe to Firestore via `onSnapshot` for live updates
- **Firebase design codes**: Update `designCodes.ts` to generate codes based on Firestore collection counts (async), not localStorage
- **Home page redesign**: 
  - Hero banner text update: "Welcome to / ಸ್ವಾಗತ" + "Vishal Embroidery" + "ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ ವರ್ಕ್ಸ್", remove "10+ exclusive designs" text
  - Global search bar below hero (search by code or name across all designs)
  - Quick Access section: 3 cards (Embroidery, Blouse, Bridal)
  - Latest Embroidery Designs horizontal scroll section with "See All" button
- **Embroidery tab inline galleries**: Subcategory buttons tap → gallery appears on same page below buttons (no separate page push)
- **Embroidery image display fix**: For "embroidery" subcategory only — use `object-contain` with wide card ratio (e.g. 3:2 or 16:9 aspect). Other subcategories keep square layout.
- **Bridal crown icon**: Show 👑 icon overlay on design cards for `isBridal: true` designs
- **Cart stored in sessionStorage** (not Firestore; cart is temporary per-session)

### Modify

- **`src/frontend/src/lib/storage.ts`**: Remove all localStorage read/write functions for designs, customers, orders, payments. Keep only types, `formatDate`, `getPaymentStatus`, cart functions (using localStorage), `generateId`. All data reads/writes must route through `firestoreService.ts`.
- **`AdminDashboard.tsx`**: Read stats from Firestore hooks, not `getDesigns()`/`getOrders()` etc.
- **`AdminDesigns.tsx`**: Use `updateDesign`/`deleteDesign` from firestoreService. Refresh via real-time hook (no manual `refresh()`).
- **`AdminOrders.tsx`**: Use Firestore service for status changes and deletes.
- **`AdminCustomers.tsx`**: Use Firestore service for all CRUD. Real-time updates.
- **`CustomerProfile.tsx`**: Read orders/payments from Firestore via hooks.
- **`UploadDesign.tsx`**: Generate code async from Firestore count. Save via firestoreService.
- **`BulkUpload.tsx`**: Same — async code generation, Firestore save.
- **`GalleryPage.tsx`**: Use `useDesigns` Firestore hook. Change to 2 columns (not 3). Show 2 designs per row.
- **`EmbroideryPage.tsx`**: Show subcategory cards (2 per row). When tapped → show gallery inline below, same page. Gallery collapses if same card tapped again.
- **`BlousePage.tsx`**: Same pattern — subcategory tiles, inline gallery expand/collapse.
- **`BridalPage.tsx`**: Two side-by-side cards (Bridal Embroidery, Bridal Blouse). Click filters inline gallery.
- **`ConfirmOrderModal.tsx`**: Use Firestore for customer search (async from `useCustomers` data), save order via `saveOrder` from firestoreService.
- **`HomePage.tsx`**: Redesign per spec — banner text, search bar, quick access 3-cards, latest embroidery horizontal scroll + See All.
- **`TopBar.tsx`**: VEW logo on left, VEW admin button on right (unchanged behavior). Hide admin button when `showBack` is true is already correct.
- **`appStore.ts`**: Remove localStorage cart imports; use sessionStorage-backed cart instead (or keep localStorage for cart only — cart is intentionally NOT in Firestore).

### Remove

- All direct `localStorage.getItem` / `localStorage.setItem` calls for designs, customers, orders, payments in any component
- The `safeGet`/`safeSet` helpers in storage.ts (keep only cart-related localStorage)
- `getDesigns()`, `saveDesign()`, `updateDesign()`, `deleteDesign()` in storage.ts
- Same for customers, orders, payments localStorage-backed functions
- Separate navigation to GalleryPage from EmbroideryPage and BlousePage (inline expand replaces it)

## Implementation Plan

1. **Install Firebase**: Add `firebase` to `src/frontend/package.json` dependencies
2. **`lib/firebase.ts`**: Initialize Firebase app + Firestore with provided config. Export `db`.
3. **`lib/firestoreService.ts`**: Async CRUD functions for all 4 collections. Functions: `addDesign`, `updateDesign`, `deleteDesign`, `addCustomer`, `updateCustomer`, `deleteCustomer`, `addOrder`, `updateOrder`, `deleteOrder`, `addPayment`. All return Promises.
4. **`hooks/useFirestore.ts`**: Hooks using `onSnapshot` for real-time: `useDesigns()`, `useCustomers()`, `useOrders()`, `usePayments()`. Each returns `{ data, loading, error }`.
5. **Update `lib/designCodes.ts`**: Export async `generateDesignCode(subcategory, existingDesigns)` that takes current designs list as param (avoids extra Firestore call).
6. **Update `lib/storage.ts`**: Strip localStorage functions, keep only cart (localStorage), types, formatDate, getPaymentStatus, generateId.
7. **Update `UploadDesign.tsx`**: Async code generation using existing designs count from hook; call `addDesign` from firestoreService.
8. **Update `BulkUpload.tsx`**: Same pattern.
9. **Update `AdminDesigns.tsx`**: Subscribe to `useDesigns` hook; edit/delete via firestoreService.
10. **Update `AdminOrders.tsx`**: Subscribe to `useOrders` + `useCustomers`; status changes via `updateOrder` firestoreService.
11. **Update `AdminCustomers.tsx`**: Subscribe to `useCustomers`; CRUD via firestoreService.
12. **Update `CustomerProfile.tsx`**: Get orders/payments from `useOrders`/`usePayments` filtered by customer.
13. **Update `AdminDashboard.tsx`**: Use hooks for live stats.
14. **Update `ConfirmOrderModal.tsx`**: Use `useCustomers` data for search; save via `addOrder` + optionally `addCustomer`.
15. **Update `GalleryPage.tsx`**: Use `useDesigns` hook. Change to 2-column grid.
16. **Redesign `EmbroideryPage.tsx`**: Subcategory cards (2 per row). Active subcategory shows inline gallery below with `useDesigns` filtered. For "embroidery" subcategory: `object-contain` + wide aspect ratio cards.
17. **Redesign `BlousePage.tsx`**: Same inline pattern.
18. **Redesign `BridalPage.tsx`**: Side-by-side cards, inline gallery with `useDesigns` filtered by bridal + category.
19. **Redesign `HomePage.tsx`**: Banner with bilingual text (no "10+ exclusive designs"), global search bar, Quick Access 3-cards, latest embroidery horizontal scroll + See All button.
20. **Update `DesignCard.tsx`**: Add 👑 crown icon overlay for bridal designs.
21. **Update `App.tsx`**: Remove gallery/bridal-gallery page entries for embroidery/blouse pages (inline now). Keep bridal gallery route for potential "See All" from home.
22. **Update `appStore.ts`**: Remove dependency on localStorage-backed cart from storage.ts; use inline sessionStorage or plain localStorage for cart only.
