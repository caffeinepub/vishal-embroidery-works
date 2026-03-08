# Vishal Embroidery Works (VEW)

## Current State

The existing project has a React 19 + TypeScript frontend with remnants of an ICP/Motoko backend. The previous versions used Cloudinary for image uploads and ICP canister for backend data. Those caused repeated failures (IC0508, config errors, auth loops). The current codebase has various admin panel iterations, localStorage-based design storage from the last rebuild, and a bottom nav with Home/Embroidery/Blouse/Favourite/Customers/Admin tabs.

## Requested Changes (Diff)

### Add

- Complete offline-first localStorage data layer: `VEW_DESIGNS`, `VEW_CUSTOMERS`, `VEW_ORDERS`, `VEW_PAYMENTS`, `VEW_STITCHING_CART`
- Auto design code system per subcategory: EMB###, RBE###, SIM###, BN###, DSG###, BRD###
- Multi-image upload (max 5 per design) stored as base64 in localStorage
- Bridal tag toggle on designs — tagged designs appear in Bridal section automatically
- Bottom navigation: Home, Embroidery, Blouse, Bridal, Stitching Orders (5 tabs)
- Home page: welcome banner + 3 quick access cards (Embroidery, Blouse, Bridal)
- Embroidery page: 2-per-row subcategory grid (Embroidery, Ready Blouse Embroidery)
- Blouse page: 2-per-row subcategory grid (Simple Blouse, Boat Neck, Bridal Blouse, Designer Blouse)
- Bridal page: 2 sections side-by-side (Bridal Embroidery, Bridal Blouse) — populated from bridal-tagged designs
- Design gallery page per subcategory with square thumbnail grid
- Design detail page: image slider (swipe + pinch zoom + double-tap zoom), design code + title, buttons: Add Stitching Order, Share Design, Compare
- Stitching Orders tab: temporary cart with thumbnail/code/title, remove button, total count, Clear All, Confirm Stitching Order
- Confirm Order flow: search existing customer (by name/phone) or create new customer (name, phone, delivery date); on confirm: save order to customers DB, clear cart, WhatsApp share option
- Admin access: VEW icon top-right → PIN entry (PIN: 4321)
- Admin panel with 6 tabs: Upload, Bulk Upload, Designs, Customers, Orders, Dashboard
- Upload Design: category, subcategory, title, up to 5 images, bridal toggle
- Bulk Upload: 50–100 images, auto category/subcategory selection, auto code generation
- Designs admin page: grouped by subcategory in 2-column layout, edit/delete/hide per design
- Customers admin page: search bar, customer cards (name, phone, total orders, last order, status), edit/delete; customer profile with Orders, Tracking, Payments, Measurements, Notes sections
- Payment system inside customer profile: total amount, advance paid, balance, auto payment status (Pending/Partial/Paid), payment history
- Orders admin tab: filter by All/Pending/Cutting/Stitching/Ready/Completed; order cards with customer info, design image, code, dates, status; Mark as Cutting button, status dropdown, delete
- Manual order add: admin can add an order for a customer with custom design (not in gallery) — fields: design name, code, description, delivery date, status
- Admin Dashboard: stats cards (total designs, active orders, today's orders, pending/ready/completed orders, total customers, pending payments)
- WhatsApp share after order confirm with formatted message template

### Modify

- Replace entire app structure — remove all ICP/canister/Cloudinary dependencies
- Replace bottom nav: remove Favourite tab, remove Admin tab from bottom nav (admin accessed via top-right VEW icon)
- All images stored as base64 in localStorage (no external service)

### Remove

- All ICP actor/canister code and imports
- Cloudinary upload logic
- Google OAuth, token bootstrap, adminActor.ts, useAdminAuth.ts, adminSessionStore.ts
- ConfigReadyBoundary and session loading gates
- Favourite tab and all favourite-related logic
- Admin tab from bottom navigation

## Implementation Plan

1. Create `src/lib/storage.ts` — typed localStorage helpers for all 5 data stores
2. Create `src/lib/designCodes.ts` — auto-increment code generator per subcategory
3. Create `src/lib/imageUtils.ts` — base64 conversion helpers for image uploads
4. Create `src/store/appStore.ts` — Zustand store for cart (stitching orders), active tab, admin state
5. Rewrite `App.tsx` — clean router with bottom nav (5 tabs) and top-right VEW admin icon
6. Build pages: HomePage, EmbroideryPage, BlousePage, BridalPage, StitchingOrdersPage
7. Build subcategory gallery page (GalleryPage) reused across subcategories
8. Build DesignDetailPage with image slider, zoom, swipe
9. Build admin PIN screen and AdminPanel with 6 tabs
10. Build admin sub-pages: UploadDesign, BulkUpload, AdminDesigns, AdminCustomers, AdminOrders, AdminDashboard
11. Build customer profile page with Orders/Tracking/Payments/Measurements/Notes tabs
12. Build ConfirmOrderModal with customer search/create and WhatsApp share
13. Build CompareModal for side-by-side design comparison
14. Ensure all data operations are purely localStorage — no network calls
