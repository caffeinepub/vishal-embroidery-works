# Vishal Embroidery Works

## Current State

- BulkUpload.tsx processes images in sequential batches of 10; progress counter updates after each batch completes (not per-image), so it can appear stuck at 0/N for a long time before jumping.
- UploadDesign.tsx uploads images sequentially (one at a time) with no per-image progress indication.
- AdminDesigns.tsx edit modal allows editing Title, Images, and Bridal toggle only. There is no field for Design Code or Category.
- Orders reference designCode as a string snapshot; updating a design does not cascade to orders.

## Requested Changes (Diff)

### Add
- Per-image real-time progress counter during bulk upload (increments by 1 after each individual image is saved).
- Parallel image processing (all images in a batch converted to base64 simultaneously, all Firestore writes fired in parallel) for bulk upload.
- "Edit Code" field in AdminDesigns edit modal — admin can change designCode freely.
- "Edit Category / Subcategory" fields in AdminDesigns edit modal.
- After designCode is updated via Firestore, update all Order documents that reference the old designCode.

### Modify
- BulkUpload.tsx: rewrite upload loop to fire all Firestore writes concurrently and increment progress counter atomically per save completion.
- AdminDesigns.tsx edit modal: add designCode input, category select, subcategory select fields; wire save to cascade code change to orders.
- firestoreService.ts: add `updateOrderDesignCode` helper that scans orders collection and patches any OrderDesign entry matching the old code.

### Remove
- Sequential per-batch await in bulk upload that causes progress to stall.

## Implementation Plan

1. **BulkUpload.tsx** — Convert all files to base64 in parallel upfront. Then fire all `addDesign` calls concurrently with `Promise.allSettled`, incrementing a shared counter via a callback after each resolves. Progress bar updates in real-time (0→1→2→…→N). Show "Upload Successful" when done.
2. **firestoreService.ts** — Add `updateOrderDesignCode(oldCode, newCode)` that queries the orders collection and updates any matching `designs[].designCode` entries.
3. **AdminDesigns.tsx** — Extend edit state with `editCode`, `editCategory`, `editSubcategory`. Edit modal shows: Design Code input, Title input, Category selector, Subcategory selector, Images editor, Bridal toggle. On save, if code changed call `updateOrderDesignCode` before saving design.
