# Vishal Embroidery Works

## Current State
The Virtual Trial Room exists with a 5-layer system but has several issues:
- Blouse subcategories in admin/upload use old values (simple-blouse, bridal-blouse, designer-blouse)
- A separate BlouseType selector exists in both admin panel and trial room UI
- Right view may load the wrong mannequin image
- Design gallery images could appear in trial room context
- Blouse color zone positioning could be cleaner
- Multiple embroidery overlays can stack (partially handled by React key)

## Requested Changes (Diff)

### Add
- New blouse subcategory values: princess-cut, high-neck, collar-neck, padded-blouse
- Design code prefixes for new subcategories (PC, HN, CN, PB)
- Auto-derive blouseType from design subcategory in trial room

### Modify
- `storage.ts` Subcategory type: replace old blouse subcategories with 5 aligned values matching BlouseType
- `designCodes.ts`: update PREFIXES and SUBCATEGORY_LABELS
- `UploadDesign.tsx`: update CATEGORY_SUBCATEGORIES, remove BLOUSE TYPE selector
- `AdminDesigns.tsx`: update CATEGORY_SUBCATEGORIES, remove BLOUSE TYPE selector
- `BlousePage.tsx`: simplify filtering to use subcategory === blouseType directly
- `VirtualTrialRoomPage.tsx`: remove blouse style selector, clean 5-layer rendering, fix view mapping, ensure correct embroidery field mapping

### Remove
- `BLOUSE TYPE (for Trial Room)` section from admin upload form
- `BLOUSE TYPE` section from admin design edit modal  
- `SELECT BLOUSE STYLE` section from trial room controls
- Old subcategories: simple-blouse, bridal-blouse, designer-blouse

## Implementation Plan
1. Update `storage.ts` Subcategory union type
2. Update `designCodes.ts` PREFIXES and SUBCATEGORY_LABELS
3. Update `CATEGORY_SUBCATEGORIES` in UploadDesign and AdminDesigns; remove BlouseType selectors
4. Update `BlousePage.tsx` to filter by subcategory
5. Rewrite VirtualTrialRoomPage: remove blouse style selector, 5-layer stack, correct view→mannequin mapping, correct embroidery field mapping, prevent gallery images from appearing as background
