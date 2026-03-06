# Vishal Embroidery Works

## Current State

The admin panel has two image input flows:

1. **Design Upload tab (SingleDesignUploadPanel)** — `AdminScreen.tsx` lines 685–950  
   - Contains up to 10 URL text input fields (`<Input>`) with small preview thumbnails  
   - Admin pastes a direct image URL; valid `http`-starting strings are collected in `form.imageUrls`  
   - An "Add another URL" dashed button adds more rows

2. **Bulk Upload tab (BulkUploadPanel)** — `AdminScreen.tsx` lines 954–1163  
   - Admin pastes multiple URLs into a `<Textarea>` (one per line)  
   - Valid `http`-starting lines are parsed and sent to `createDesignBulk`

3. **Update Design tab (DesignFormPanel)** — edit flow in `AdminScreen.tsx` lines 332–625  
   - Same URL input approach used for editing existing designs

No file-upload system currently exists. `imageHandler.ts` and `useUploadImage.ts` contain a full Caffeine blob-storage upload pipeline but it is NOT wired to any UI.

The gallery (`DesignCard.tsx`, `DesignGrid.tsx`) simply renders whatever URL is stored in `design.imageUrls[]` — it doesn't care where the URL came from.

## Requested Changes (Diff)

### Add

- A new `cloudinaryUpload.ts` utility in `src/frontend/src/utils/` that:
  - Uploads a `File` directly to Cloudinary via their unsigned upload API  
  - Cloud Name: `doxbxqcef`  
  - Upload Preset: `Embroidery_works`  
  - Endpoint: `https://api.cloudinary.com/v1_1/doxbxqcef/image/upload`  
  - Returns the `secure_url` from Cloudinary's JSON response  
  - Handles upload progress via `XMLHttpRequest` for smooth mobile experience  
  - Throws a descriptive error if upload fails

- A `useCloudinaryUpload` hook in `src/frontend/src/hooks/` that wraps the utility with:
  - Per-file progress state (0–100%)  
  - Loading/error state  
  - Retry logic for network errors (up to 2 retries)

- A `CloudinaryImageUploader` reusable component that:
  - Renders a tappable photo upload button (opens native file picker, accepts PNG/JPG/JPEG)  
  - Shows upload progress bar per file  
  - Shows thumbnail preview once uploaded  
  - Shows a remove/replace button per uploaded image  
  - Supports up to 10 images (for single design form) and displays count  
  - Works well on mobile (large tap target, no hover-only UX)

### Modify

- **`SingleDesignUploadPanel`** (Design Upload tab):  
  Replace the URL text inputs + "Add another URL" button with `CloudinaryImageUploader` (up to 10 images). After upload each image's Cloudinary `secure_url` is stored in `form.imageUrls`. All other fields (category, work type, trending, bridal toggles, save button, auto-code preview) remain unchanged.

- **`BulkUploadPanel`** (Bulk Upload tab):  
  Replace the URL textarea with a multi-file upload button that accepts up to 500 files at once from the phone gallery. Each selected file is uploaded to Cloudinary sequentially (with overall progress shown). After all uploads, the resulting `secure_url` values are used to call `createDesignBulk`. The category selector, auto-code generation, success/error banners, and save logic remain unchanged.

- **`DesignFormPanel`** (Update Design / edit flow):  
  Replace the URL text input rows with `CloudinaryImageUploader`. When editing, existing URLs are shown as pre-loaded thumbnail previews (not re-uploaded). The admin can add new images (uploaded to Cloudinary) or remove existing ones. All other edit fields remain unchanged.

### Remove

- URL text `<Input>` fields for image entry in `SingleDesignUploadPanel`  
- URL `<Textarea>` in `BulkUploadPanel`  
- URL text `<Input>` rows in `DesignFormPanel`  
- `syncUrls` / `updateUrl` / `addUrlRow` / `removeUrlRow` helper functions (replaced by Cloudinary uploader state)

## Implementation Plan

1. Create `src/frontend/src/utils/cloudinaryUpload.ts`  
   - `uploadToCloudinary(file: File, onProgress?: (pct: number) => void): Promise<string>`  
   - Uses `XMLHttpRequest` with `FormData` (better mobile progress than `fetch`)  
   - Posts to `https://api.cloudinary.com/v1_1/doxbxqcef/image/upload`  
   - Sends `upload_preset=Embroidery_works`  
   - Returns `response.secure_url`  
   - Validates: PNG/JPG/JPEG only, max 10 MB  

2. Create `src/frontend/src/hooks/useCloudinaryUpload.ts`  
   - State: `uploading: boolean`, `progress: number[]`, `error: string | null`  
   - `uploadFiles(files: File[]): Promise<string[]>` — returns array of Cloudinary URLs  
   - Retry up to 2 times on network error  

3. Create `src/frontend/src/components/shared/CloudinaryImageUploader.tsx`  
   - Props: `value: string[]`, `onChange: (urls: string[]) => void`, `maxImages?: number`, `disabled?: boolean`  
   - Hidden `<input type="file" accept="image/png,image/jpeg,image/jpg" multiple>`  
   - Visible upload button: camera/image icon + "Upload Photo" label  
   - Per-image thumbnail with progress overlay while uploading  
   - Remove button (×) on each thumbnail  
   - Counter badge showing `n/maxImages`  
   - Compact layout suitable for mobile  

4. Update `SingleDesignUploadPanel` in `AdminScreen.tsx`  
   - Replace URL input section with `<CloudinaryImageUploader value={form.imageUrls} onChange={...} maxImages={10} />`  
   - Remove all URL sync helpers  

5. Update `BulkUploadPanel` in `AdminScreen.tsx`  
   - Replace textarea with a "Select Photos" file button (accepts multiple, up to 500)  
   - Show selected count + overall upload progress  
   - On save: upload all selected files to Cloudinary, then call `createDesignBulk` with resulting URLs  

6. Update `DesignFormPanel` in `AdminScreen.tsx`  
   - Replace URL input rows with `<CloudinaryImageUploader value={form.imageUrls} onChange={...} maxImages={10} />`  
   - Existing URLs shown as pre-loaded thumbnails (no re-upload needed)  

7. Validate with typecheck + lint + build
