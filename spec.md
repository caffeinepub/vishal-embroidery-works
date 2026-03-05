# Vishal Embroidery Works

## Current State

Full-stack ICP app with Motoko backend + React frontend. Features:
- Admin panel with password login (akhilesh18 / Theakhilesh18), add/edit/delete designs, toggle trending/bridal flags
- Design type: { id, designCode, category, workType, imageUrl (single), isBridal, isTrending, isNew, createdAt }
- Embroidery screen with 2 tabs (All Embroidery / Ready Blouse Embroidery), 3-column DesignGrid with infinite scroll + back-to-top
- Blouse screen with 5 category tabs
- Home screen with 4 horizontal sections (Trending, New, Bridal, Recently Viewed)
- Favourite screen (reads from localStorage) — currently only looks up in SAMPLE_DESIGNS (broken for real backend designs)
- Contact screen with address, phone, WhatsApp button, admin link
- Customer measurements screen
- DesignDetailModal with Book Stitching, WhatsApp, Share, Add to Favourite buttons
- Image upload via blob storage (single image per design)
- Design card shows single imageUrl

## Requested Changes (Diff)

### Add
- **Multi-image support per design**: Design type gets `imageUrls: [Text]` (array of up to 10 URLs). `imageUrl` kept for backward compat as alias to first element.
- **Bulk Upload feature** in admin: upload up to 500 images at once; auto-create design per image with filename as code, category="All Embroidery Works", workType="Embroidery", trending=false, bridal=false
- **Admin Add Design form**: support up to 10 images for a single design entry
- **Search bar** in Embroidery screen (All tab): filter by design code in real time
- **Compare Designs feature**: select 2 designs from gallery, view side by side in a modal
- **Image swiper in DesignCard thumbnail**: show first image, but multi-image indicator (dot count)
- **Image swiper in DesignDetailModal**: swipe left/right through all images of a design
- **Pinch-to-zoom + double-tap zoom + drag while zoomed** in DesignDetailModal image viewer
- **FavouriteScreen**: fix to load from real backend designs (useAllDesigns) instead of SAMPLE_DESIGNS only
- **createMeasurement** fix: remove the admin-only check so customers can book stitching without ICP auth

### Modify
- **Backend Design type**: add `imageUrls: [Text]` field; update `createDesign`, `updateDesign` to accept `imageUrls`; keep backward compat by computing `imageUrl` from first element
- **Admin DesignFormPanel**: replace single image upload with multi-image (up to 10) upload strip
- **Admin Designs tab**: add Bulk Upload button that opens a bulk upload panel
- **EmbroideryScreen All tab**: add search bar at top
- **DesignCard**: show first image from imageUrls; show multi-image dot indicator if > 1 image
- **DesignDetailModal**: image section becomes a swiper (swipe left/right), with pinch-to-zoom/double-tap/drag support
- **FavouriteScreen**: replace SAMPLE_DESIGNS lookup with real useAllDesigns hook data
- **ContactScreen**: already correct (Nehru Chowk Road, +917353315706) — no change needed

### Remove
- Single `imageUrl` field from createDesign/updateDesign backend signatures (replaced by `imageUrls` array; imageUrl becomes a derived property)

## Implementation Plan

### Backend (main.mo)
1. Add `imageUrls: [Text]` to Design type; keep `imageUrl` as first element accessor for queries
2. Update `createDesign` signature: accept `imageUrls: [Text]` instead of single `imageUrl: Text`
3. Update `updateDesign` signature: accept `imageUrls: [Text]`
4. Add `createDesignBulk(entries: [{designCode, imageUrl}])` for efficient bulk creation — each entry uses defaults (category="All Embroidery Works", workType="Embroidery", isBridal=false, isTrending=false)
5. Remove admin-only check from `createMeasurement` so customers can book stitching

### Frontend
1. Update `backend.d.ts` to reflect new signatures
2. Update `useCreateDesign`, `useUpdateDesign` mutations to pass `imageUrls`
3. Add `useCreateDesignBulk` mutation
4. **DesignCard**: read `imageUrls[0]` or fallback to `imageUrl`; show dot indicator for multi-image
5. **DesignDetailModal image section**: build touch-gesture swiper (translate CSS, touch events); add pinch-zoom with CSS transform; double-tap zoom; drag when zoomed
6. **DesignFormPanel**: replace single upload with multi-image upload strip (up to 10), show thumbnail row
7. **Admin Bulk Upload panel**: new tab or section; file input `multiple` + `max 500`; batch upload with progress bar per file; auto-create design per file
8. **EmbroideryScreen**: add controlled search input above the grid in All tab; filter designs by designCode
9. **Compare Designs**: add compare mode toggle button in Embroidery/Blouse screens; when active, tapping a card selects it (up to 2); floating "Compare" button opens CompareModal showing 2 designs side by side
10. **FavouriteScreen**: load all designs from `useAllDesigns` and filter by localStorage favourite IDs
