/**
 * Centralized Image Handler Service
 * ──────────────────────────────────
 * Single source of truth for all image operations in Vishal Embroidery Works.
 *
 * Responsibilities:
 *  1. Validate   – type (PNG/JPG/JPEG), size (≤ 10 MB)
 *  2. Compress   – canvas resize + JPEG re-encode for files > 500 KB
 *  3. Upload     – uses the admin-authenticated HttpAgent (not anonymous)
 *  4. URL        – returns the direct CDN/blob URL ready for <img src>
 *  5. Log        – structured error logging with file name, size, error type
 *
 * Why the previous approach failed:
 *   Every upload created a brand-new, anonymous HttpAgent for StorageClient.
 *   The canister's `_caffeineStorageCreateCertificate` requires an admin-
 *   initialised caller. Because the anonymous agent never called
 *   `_initializeAccessControlWithSecret`, the certificate request was always
 *   rejected → upload failed with an auth/403 error.
 *
 * Fix: `getAdminSession()` now exposes the same HttpAgent that was used to
 * initialise admin access control. StorageClient receives that agent, so its
 * certificate request is made with admin credentials.
 */

import { loadConfig } from "../config";
import { StorageClient } from "./StorageClient";
import { getAdminSession } from "./adminActor";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = 500 * 1024; // 500 KB
const MAX_DIMENSION = 1500;
const JPEG_QUALITY = 0.82;
const UPLOAD_BUCKET = "designs";
const STORAGE_GATEWAY_URL = "https://blob.caffeine.ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageUploadResult {
  url: string;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

export class ImageValidationError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "EMPTY_FILE",
  ) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "AUTH_ERROR"
      | "NETWORK_ERROR"
      | "SERVER_ERROR"
      | "UNKNOWN",
    public readonly fileName: string,
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a file before upload.
 * Throws ImageValidationError with a user-friendly message on failure.
 */
export function validateImageFile(file: File): void {
  if (file.size === 0) {
    throw new ImageValidationError(
      `"${file.name}" is empty. Please select a valid image file.`,
      "EMPTY_FILE",
    );
  }

  const mimeType = file.type.toLowerCase();
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new ImageValidationError(
      `"${file.name}" is not a supported format. Please use PNG, JPG, or JPEG images only.`,
      "INVALID_TYPE",
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new ImageValidationError(
      `"${file.name}" is ${sizeMB} MB, which exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please use a smaller image.`,
      "FILE_TOO_LARGE",
    );
  }
}

/**
 * Validates multiple files. Returns the first validation error found, or null.
 */
export function validateImageFiles(files: File[]): ImageValidationError | null {
  for (const file of files) {
    try {
      validateImageFile(file);
    } catch (err) {
      if (err instanceof ImageValidationError) return err;
    }
  }
  return null;
}

// ─── Compression ─────────────────────────────────────────────────────────────

/**
 * Compresses an image file using the Canvas API.
 * - Skips files already below COMPRESS_THRESHOLD_BYTES
 * - Resizes if longest side > MAX_DIMENSION
 * - Re-encodes as JPEG (preserves PNG for transparency)
 * - Falls back to original if compression increases file size
 */
export async function compressImageFile(file: File): Promise<File> {
  if (file.size < COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Downscale if needed
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.warn(
          `[ImageHandler] Canvas context unavailable for "${file.name}", skipping compression.`,
        );
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = outputType === "image/jpeg" ? JPEG_QUALITY : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compression didn't help — use original
            resolve(file);
            return;
          }
          const ext = outputType === "image/jpeg" ? "jpg" : "png";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const compressed = new File([blob], `${baseName}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });
          console.info(
            `[ImageHandler] Compressed "${file.name}": ${(file.size / 1024).toFixed(0)} KB → ${(compressed.size / 1024).toFixed(0)} KB`,
          );
          resolve(compressed);
        },
        outputType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.warn(
        `[ImageHandler] Could not decode "${file.name}" for compression, using original.`,
      );
      resolve(file);
    };

    img.src = objectUrl;
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a single image file to Caffeine blob storage.
 *
 * Critical: uses the admin session's HttpAgent (not a new anonymous one)
 * so that `_caffeineStorageCreateCertificate` is called with admin credentials.
 *
 * @param file          The image File to upload (will be validated + compressed)
 * @param onProgress    Optional callback with upload percentage (0–100)
 * @returns             ImageUploadResult containing the public URL
 */
export async function uploadImageFile(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<ImageUploadResult> {
  const originalSize = file.size;

  // 1. Validate
  validateImageFile(file);

  // 2. Compress
  const compressed = await compressImageFile(file);
  const compressedSize = compressed.size;

  // 3. Get admin session (actor + authenticated agent — initialized once)
  let session: Awaited<ReturnType<typeof getAdminSession>>;
  try {
    session = await getAdminSession();
  } catch (initErr) {
    console.error(
      `[ImageHandler] Admin session init failed for "${file.name}":`,
      initErr,
    );
    throw new ImageUploadError(
      "Upload failed: could not authenticate. Please refresh the page and log in again.",
      "AUTH_ERROR",
      file.name,
    );
  }

  // 4. Load config for project/canister IDs
  const config = await loadConfig();

  // 5. Create StorageClient using the admin-authenticated agent
  const storageClient = new StorageClient(
    UPLOAD_BUCKET,
    STORAGE_GATEWAY_URL,
    config.backend_canister_id,
    config.project_id,
    session.agent, // ← the fix: authenticated agent, not anonymous
  );

  // 6. Upload
  try {
    const bytes = new Uint8Array(await compressed.arrayBuffer());
    const { hash } = await storageClient.putFile(bytes, onProgress);
    const url = await storageClient.getDirectURL(hash);

    console.info(
      `[ImageHandler] Uploaded "${file.name}" → ${url.substring(0, 80)}...`,
    );

    return {
      url,
      originalSize,
      compressedSize,
      wasCompressed: compressed !== file,
    };
  } catch (err) {
    // Preserve the full original message so admins see the real reason
    // (e.g. canister trap text, HTTP status details, token errors).
    const fullMsg = err instanceof Error ? err.message : String(err);
    const msg = fullMsg.toLowerCase();
    console.error(`[ImageHandler] Upload failed for "${file.name}":`, err);

    if (
      msg.includes("admin token not found") ||
      msg.includes("auth") ||
      msg.includes("unauthorized") ||
      msg.includes("forbidden") ||
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("certificate")
    ) {
      throw new ImageUploadError(
        `Upload failed (auth): ${fullMsg}`,
        "AUTH_ERROR",
        file.name,
      );
    }

    if (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("connection") ||
      msg.includes("timeout") ||
      msg.includes("ssl") ||
      msg.includes("tls")
    ) {
      throw new ImageUploadError(
        `Upload failed (network): ${fullMsg}`,
        "NETWORK_ERROR",
        file.name,
      );
    }

    if (msg.includes("413") || msg.includes("too large")) {
      throw new ImageUploadError(
        `Upload failed (file too large): "${file.name}" was rejected by the server. Try a smaller image.`,
        "SERVER_ERROR",
        file.name,
      );
    }

    // Unknown — include the raw message so the admin can report it
    throw new ImageUploadError(
      `Upload failed for "${file.name}": ${fullMsg}`,
      "UNKNOWN",
      file.name,
    );
  }
}

/**
 * Upload multiple files sequentially, continuing past individual failures.
 *
 * @param files       Array of files to upload
 * @param onFileProgress  Called with (fileIndex, percentage) for each file
 * @returns           Array of results — { url } for success, { error } for failure
 */
export async function uploadImageFiles(
  files: File[],
  onFileProgress?: (fileIndex: number, percentage: number) => void,
): Promise<Array<{ url: string } | { error: string; fileName: string }>> {
  const results: Array<{ url: string } | { error: string; fileName: string }> =
    [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImageFile(files[i], (pct) =>
        onFileProgress?.(i, pct),
      );
      results.push({ url: result.url });
    } catch (err) {
      const message =
        err instanceof ImageUploadError || err instanceof ImageValidationError
          ? err.message
          : `Upload failed for "${files[i].name}".`;
      console.error(
        `[ImageHandler] File ${i + 1}/${files.length} failed:`,
        err,
      );
      results.push({ error: message, fileName: files[i].name });
    }
  }

  return results;
}

/**
 * Returns a user-friendly error message from any upload-related error.
 */
export function getUploadErrorMessage(err: unknown): string {
  if (err instanceof ImageValidationError || err instanceof ImageUploadError) {
    return err.message;
  }
  if (err instanceof Error) {
    // Always return the real message — never swallow the reason
    return err.message;
  }
  return `Upload failed: ${String(err)}`;
}
