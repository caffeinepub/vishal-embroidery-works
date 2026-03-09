# Vishal Embroidery Works — Virtual Trial Room

## Current State
The app has an existing `TrialRoomPage` (a simple saved-designs list, max 10 designs). The `HomePage` has a hero banner, search bar, and quick access cards. Navigation is via bottom nav and a page stack in `App.tsx`. Cart items are `CartItem` objects in localStorage.

## Requested Changes (Diff)

### Add
- **`VirtualTrialRoomPage.tsx`** — A full virtual try-on screen featuring:
  - Search bar (placeholder "Search Embroidery Design") with live Firestore search by code/name/tags
  - Front / Back view toggle
  - SVG-based female mannequin upper torso (shoulders + neck + blouse, no full body) rendered with dynamic neck cutout shapes
  - Neck type selector (Front: U Neck, Boat Neck, V Neck, Round Neck, Square Neck; Back: Deep U, Keyhole, Dori Style, V Back, Round Back)
  - Blouse color picker (HEX/swatch)
  - Embroidery Color 1 & Color 2 pickers (stored as metadata for the order)
  - Selected embroidery design overlay on the neckline area of the SVG mannequin
  - "Upload My Blouse Photo" button — reads dominant color via Canvas API and applies to mannequin blouse; user can still override manually
  - Cancel button → goes back
  - Add to Stitching button → adds a CartItem (with designCode, view, neck type, blouse color, embroidery colors) to the stitching cart and shows toast
- **`storage.ts`** — Add `VirtualTrialConfig` interface; extend `CartItem` with optional trial config fields: `view`, `neckType`, `blouseColor`, `embColor1`, `embColor2`, `uploadedBlousePhoto`
- **`HomePage.tsx`** — Add a large "Open Trial Room" button below quick access cards
- **`App.tsx`** — Add `virtual-trial-room` page entry to page stack and render `VirtualTrialRoomPage`

### Modify
- `storage.ts` — Extend `CartItem` interface with optional trial config fields
- `HomePage.tsx` — Insert "Open Trial Room" CTA
- `App.tsx` — Add virtual trial room navigation and page rendering

### Remove
- Nothing removed from existing features

## Implementation Plan
1. Extend `CartItem` in `storage.ts` with optional trial config fields
2. Build `VirtualTrialRoomPage.tsx`:
   a. SVG mannequin with dynamic blouse color and neck-shape clip paths (5 front + 5 back variants)
   b. Embroidery design image overlay positioned at neckline, clipped to neck shape
   c. Search + filter by front/back view
   d. Neck type pills selector
   e. Color pickers for blouse, emb1, emb2
   f. Upload photo button with Canvas dominant-color detection
   g. Real-time state updates (all changes instant, no reload)
   h. Cancel (goBack) and Add to Stitching (addToCart + toast + goBack)
3. Add "Open Trial Room" button to `HomePage.tsx`
4. Wire navigation in `App.tsx`
