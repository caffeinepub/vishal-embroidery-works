/**
 * CloudinaryImageUploader
 * ──────────────────────────────────────────────────────────────────────────────
 * Reusable photo-upload component that uploads images directly to Cloudinary
 * and returns the resulting secure HTTPS URLs.
 *
 * Features:
 *  • Mobile-first: large tappable button, camera icon, bilingual label
 *  • Per-image progress overlays during upload
 *  • Thumbnail grid with × remove buttons after upload
 *  • Inline per-image error messages on failure
 *  • Count badge  n / maxImages
 *  • Hides upload button when maxImages is reached
 *  • Accepts: PNG, JPG, JPEG; max 10 MB each
 */

import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  type CloudinaryUploadError,
  type CloudinaryValidationError,
  uploadToCloudinary,
  validateCloudinaryFile,
} from "../../utils/cloudinaryUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryImageUploaderProps {
  /** Current list of Cloudinary secure URLs (controlled) */
  value: string[];
  /** Called whenever the list of URLs changes */
  onChange: (urls: string[]) => void;
  /** Max number of images allowed. Default: 10 */
  maxImages?: number;
  /** Disables the uploader when true */
  disabled?: boolean;
}

interface ImageSlot {
  /** Stable key for React rendering */
  key: string;
  /** Either a local blob URL (uploading) or a Cloudinary URL (done) */
  previewUrl: string;
  /** Upload progress 0–100 */
  progress: number;
  /** "uploading" | "done" | "error" */
  status: "uploading" | "done" | "error";
  /** Error message if status === "error" */
  error?: string;
  /** The final Cloudinary URL (once uploaded) */
  cloudinaryUrl?: string;
  /** Local blob URL to revoke on cleanup */
  blobUrl?: string;
}

let slotKeyCounter = 0;
const nextKey = () => `slot-${++slotKeyCounter}`;

// ─── Component ────────────────────────────────────────────────────────────────

export function CloudinaryImageUploader({
  value,
  onChange,
  maxImages = 10,
  disabled = false,
}: CloudinaryImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slots track in-progress or failed uploads.
  // Once a slot completes successfully, its cloudinaryUrl is
  // added to `value` via onChange, and the slot is removed.
  const [slots, setSlots] = useState<ImageSlot[]>([]);

  // ── File selection handler ─────────────────────────────────────────────────
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const available = maxImages - value.length;
    if (available <= 0) return;

    const selected = Array.from(files).slice(0, available);

    // For each selected file: create a slot with a local blob preview,
    // then start the Cloudinary upload in the background.
    const newSlots: ImageSlot[] = selected.map((file) => {
      const blobUrl = URL.createObjectURL(file);
      return {
        key: nextKey(),
        previewUrl: blobUrl,
        blobUrl,
        progress: 0,
        status: "uploading" as const,
      };
    });

    setSlots((prev) => [...prev, ...newSlots]);

    // Upload each file, updating its slot's state as we go
    selected.forEach((file, idx) => {
      const slotKey = newSlots[idx].key;

      // Validate first — if invalid, mark error immediately
      try {
        validateCloudinaryFile(file);
      } catch (err) {
        const msg =
          (err as CloudinaryValidationError | CloudinaryUploadError).message ??
          "Invalid file";
        setSlots((prev) =>
          prev.map((s) =>
            s.key === slotKey ? { ...s, status: "error", error: msg } : s,
          ),
        );
        return;
      }

      uploadToCloudinary(file, (pct) => {
        setSlots((prev) =>
          prev.map((s) => (s.key === slotKey ? { ...s, progress: pct } : s)),
        );
      })
        .then((result) => {
          // Revoke the blob URL now that we have the real URL
          URL.revokeObjectURL(newSlots[idx].blobUrl ?? "");

          // Remove the slot and add the Cloudinary URL to value
          setSlots((prev) => prev.filter((s) => s.key !== slotKey));
          onChange([...value, result.secureUrl]);
        })
        .catch(
          (err: CloudinaryValidationError | CloudinaryUploadError | Error) => {
            const msg = err.message ?? "Upload failed";
            setSlots((prev) =>
              prev.map((s) =>
                s.key === slotKey
                  ? { ...s, status: "error", error: msg, progress: 0 }
                  : s,
              ),
            );
          },
        );
    });

    // Reset the file input so the same file can be re-selected after an error
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Remove an already-uploaded URL ────────────────────────────────────────
  const handleRemoveUrl = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  // ── Remove a failed/in-progress slot ──────────────────────────────────────
  const handleRemoveSlot = (slotKey: string) => {
    setSlots((prev) => {
      const slot = prev.find((s) => s.key === slotKey);
      if (slot?.blobUrl) URL.revokeObjectURL(slot.blobUrl);
      return prev.filter((s) => s.key !== slotKey);
    });
  };

  const totalCount =
    value.length + slots.filter((s) => s.status !== "error").length;
  const showUploadButton =
    !disabled &&
    value.length + slots.filter((s) => s.status !== "error").length < maxImages;

  return (
    <div className="space-y-3">
      {/* ── Count badge ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Images / ಚಿತ್ರಗಳು</span>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            totalCount >= maxImages
              ? "bg-amber-100 text-amber-700"
              : "bg-vew-sky-light text-vew-sky"
          }`}
        >
          {totalCount} / {maxImages}
        </span>
      </div>

      {/* ── Hidden file input ──────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ── Upload button (large, mobile-friendly) ─────────────────────────── */}
      {showUploadButton && (
        <button
          type="button"
          data-ocid="admin.cloudinary_uploader.upload_button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full min-h-[56px] rounded-2xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 hover:bg-vew-sky-light/40 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-3 px-4 py-3 select-none touch-manipulation"
        >
          <div className="w-10 h-10 rounded-xl bg-vew-sky/10 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-vew-sky" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-vew-sky leading-tight">
              Upload Photo
            </p>
            <p className="text-[10px] text-vew-sky/70 leading-tight">
              ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ · PNG, JPG, JPEG · max 10 MB
            </p>
          </div>
        </button>
      )}

      {/* ── Thumbnail grid: uploaded URLs + in-progress slots ──────────────── */}
      {(value.length > 0 || slots.length > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {/* Already-uploaded Cloudinary URLs */}
          {value.map((url, idx) => (
            <div
              key={url}
              className="relative aspect-square rounded-xl overflow-hidden bg-vew-sky-light/30 border border-border/60 group"
            >
              <img
                src={url}
                alt={`Design ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  // Show fallback icon on broken URLs
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const fallback = img.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              {/* Fallback for broken URLs */}
              <div
                className="absolute inset-0 hidden items-center justify-center bg-muted/20"
                aria-hidden="true"
              >
                <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                data-ocid={`admin.cloudinary_uploader.remove_button.${idx + 1}`}
                onClick={() => handleRemoveUrl(idx)}
                disabled={disabled}
                aria-label={`Remove image ${idx + 1}`}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 active:scale-90 z-10 touch-manipulation"
                style={{ opacity: undefined }} // always show on mobile (no hover)
              >
                <X className="w-3 h-3" />
              </button>

              {/* Always-visible remove button for touch devices */}
              <button
                type="button"
                onClick={() => handleRemoveUrl(idx)}
                disabled={disabled}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center sm:hidden z-10 touch-manipulation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* In-progress / error slots */}
          {slots.map((slot) => (
            <div
              key={slot.key}
              className="relative aspect-square rounded-xl overflow-hidden bg-vew-sky-light/30 border border-border/60"
            >
              {/* Preview image */}
              <img
                src={slot.previewUrl}
                alt="Uploading..."
                className="w-full h-full object-cover"
              />

              {/* Uploading overlay */}
              {slot.status === "uploading" && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  <span className="text-[10px] text-white font-semibold">
                    {slot.progress}%
                  </span>
                  {/* Thin progress bar at bottom */}
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-vew-sky transition-all duration-200"
                    style={{ width: `${slot.progress}%` }}
                  />
                </div>
              )}

              {/* Error overlay */}
              {slot.status === "error" && (
                <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-1 p-2">
                  <X className="w-4 h-4 text-red-200 flex-shrink-0" />
                  <p className="text-[9px] text-red-100 text-center leading-tight line-clamp-3">
                    {slot.error ?? "Upload failed"}
                  </p>
                  {/* Dismiss error slot */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.key)}
                    className="mt-1 text-[9px] text-red-200 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state hint ───────────────────────────────────────────────── */}
      {value.length === 0 && slots.length === 0 && (
        <p className="text-[10px] text-amber-600 text-center">
          At least one photo is required · ಕನಿಷ್ಠ ಒಂದು ಫೋಟೋ ಅಗತ್ಯ
        </p>
      )}
    </div>
  );
}
