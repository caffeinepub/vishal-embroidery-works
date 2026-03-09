# Vishal Embroidery Works

## Current State
- Upload design form has: Category, Subcategory, Title, Images, Bridal toggle
- Missing: Price, Tags, Notes fields
- Bulk upload has: Category, Subcategory, Bridal toggle — missing Tags, Price, Notes
- ManualOrderModal has no image upload capability
- Design type in storage.ts has no `tags`, `price`, or `notes` fields
- Search only filters by title and designCode, not tags

## Requested Changes (Diff)

### Add
- `tags: string[]`, `price?: number`, `notes?: string` fields to Design type
- `referenceImage?: string` field to OrderDesign type
- Tags input UI in UploadDesign: chip-based system with preset suggestions (zari, heavy, simple, bridal, daily wear, party wear) + custom entry
- Price field (optional) in UploadDesign — if blank shows "Ask in Shop" in gallery
- Notes textarea in UploadDesign
- Tags, Price, Notes to BulkUpload form (applied to all uploaded designs in batch)
- Optional reference image upload to ManualOrderModal (upload to Cloudinary, store URL)
- Tags and price display in AdminDesigns edit modal
- Tags filtering in search (AdminDesigns + global search)

### Modify
- UploadDesign: reorder fields to match spec (Category, Subcategory, Title, Images, Price, Tags, Bridal, Notes)
- BulkUpload: add same fields so bulk follows same rules as normal upload
- AdminDesigns edit modal: expose tags and price for editing
- firestoreService: no changes needed (merge: true handles new fields)

### Remove
- Nothing removed

## Implementation Plan
1. Update `storage.ts` — add `tags`, `price`, `notes` to Design; add `referenceImage` to OrderDesign
2. Update `UploadDesign.tsx` — add Price, Tags (chip UI), Notes; reorder fields
3. Update `BulkUpload.tsx` — add Price, Tags, Notes fields; pass to saved designs
4. Update `ManualOrderModal.tsx` — add optional image upload to Cloudinary
5. Update `AdminDesigns.tsx` — add tags and price to edit modal; include tags in search
