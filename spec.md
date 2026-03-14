# Vishal Embroidery Works

## Current State
The app has Embroidery and Blouse pages showing a 2-column subcategory grid. Design interface has `images[]` only. DesignCard always shows `images[0]`.

## Requested Changes (Diff)

### Add
- `frontEmbroidery`, `backEmbroidery`, `sleeveEmbroidery`, `generatedImages` fields to Design
- Canvas-based blouse preview compositor
- Admin 3-slot embroidery upload (only for embroidery+embroidery)
- Auto-generation of 3 composite blouse preview images
- Horizontal category sliders for Embroidery and Blouse tabs

### Modify
- Design interface, firestoreService sanitize, UploadDesign, DesignCard, EmbroideryPage, BlousePage

### Remove
- Category grid layouts (replaced by sliders)

## Implementation Plan
1. Generate blouse template images
2. Create canvas compositor utility
3. Update storage.ts + firestoreService.ts
4. Update UploadDesign.tsx
5. Update DesignCard.tsx
6. Rewrite EmbroideryPage.tsx with horizontal slider
7. Rewrite BlousePage.tsx with horizontal slider
