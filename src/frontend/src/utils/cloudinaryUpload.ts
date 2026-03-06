/**
 * Cloudinary Direct Upload Utility
 * ──────────────────────────────────
 * Uploads image files directly to Cloudinary using XMLHttpRequest (XHR).
 * XHR is preferred over fetch for mobile uploads because it provides
 * real-time progress events via xhr.upload.onprogress.
 *
 * Configuration:
 *   Cloud Name:    doxbxqcef
 *   Upload Preset: Embroidery_works  (unsigned preset)
 *   Endpoint:      https://api.cloudinary.com/v1_1/doxbxqcef/image/upload
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLOUDINARY_CLOUD_NAME = "doxbxqcef";
export const CLOUDINARY_UPLOAD_PRESET = "Embroidery_works";
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const CLOUDINARY_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export const CLOUDINARY_MAX_FILE_SIZE_MB = 10;
export const CLOUDINARY_MAX_FILE_SIZE_BYTES =
  CLOUDINARY_MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  /** The secure HTTPS URL returned by Cloudinary. Use this as the image src. */
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryValidationError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "EMPTY_FILE",
  ) {
    super(message);
    this.name = "CloudinaryValidationError";
  }
}

export class CloudinaryUploadError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly fileName?: string,
  ) {
    super(message);
    this.name = "CloudinaryUploadError";
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a file before uploading to Cloudinary.
 * Throws CloudinaryValidationError with a clear user-facing message on failure.
 */
export function validateCloudinaryFile(file: File): void {
  if (file.size === 0) {
    throw new CloudinaryValidationError(
      `"${file.name}" appears to be empty. Please choose a valid image.`,
      "EMPTY_FILE",
    );
  }

  const mimeType = file.type.toLowerCase();
  if (!(CLOUDINARY_ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
    throw new CloudinaryValidationError(
      `"${file.name}" is not a supported format. Please use PNG, JPG, or JPEG.`,
      "INVALID_TYPE",
    );
  }

  if (file.size > CLOUDINARY_MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new CloudinaryValidationError(
      `"${file.name}" is ${sizeMB} MB. Maximum allowed size is ${CLOUDINARY_MAX_FILE_SIZE_MB} MB.`,
      "FILE_TOO_LARGE",
    );
  }
}

// ─── Core Upload ──────────────────────────────────────────────────────────────

/**
 * Upload a single image file to Cloudinary.
 *
 * Uses XMLHttpRequest (not fetch) so that mobile browsers emit accurate
 * upload progress events via xhr.upload.onprogress.
 *
 * @param file        The image File to upload
 * @param onProgress  Optional callback receiving upload percentage (0–100)
 * @returns           CloudinaryUploadResult with secureUrl and metadata
 * @throws            CloudinaryValidationError if file is invalid
 * @throws            CloudinaryUploadError if the upload request fails
 */
export function uploadToCloudinary(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<CloudinaryUploadResult> {
  // Validate before sending
  validateCloudinaryFile(file);

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();

    // ── Progress tracking (mobile-friendly) ──────────────────────────────────
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(pct, 99)); // cap at 99 until server responds
        }
      };
    }

    // ── Success ───────────────────────────────────────────────────────────────
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            secure_url: string;
            public_id: string;
            width: number;
            height: number;
            format: string;
            bytes: number;
            error?: { message: string };
          };

          if (data.error) {
            reject(
              new CloudinaryUploadError(
                `Cloudinary error: ${data.error.message}`,
                xhr.status,
                file.name,
              ),
            );
            return;
          }

          onProgress?.(100);
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            bytes: data.bytes,
          });
        } catch {
          reject(
            new CloudinaryUploadError(
              `Failed to parse Cloudinary response for "${file.name}". Status: ${xhr.status}`,
              xhr.status,
              file.name,
            ),
          );
        }
      } else {
        // HTTP error — include the status and any error body
        let errorDetail = "";
        try {
          const body = JSON.parse(xhr.responseText) as {
            error?: { message: string };
          };
          errorDetail = body.error?.message ?? xhr.statusText;
        } catch {
          errorDetail = xhr.statusText || `HTTP ${xhr.status}`;
        }
        reject(
          new CloudinaryUploadError(
            `Upload failed for "${file.name}": ${errorDetail} (HTTP ${xhr.status})`,
            xhr.status,
            file.name,
          ),
        );
      }
    };

    // ── Network error (offline / CORS / DNS) ─────────────────────────────────
    xhr.onerror = () => {
      reject(
        new CloudinaryUploadError(
          `Network error uploading "${file.name}". Please check your internet connection and try again.`,
          undefined,
          file.name,
        ),
      );
    };

    // ── Timeout ───────────────────────────────────────────────────────────────
    xhr.ontimeout = () => {
      reject(
        new CloudinaryUploadError(
          `Upload timed out for "${file.name}". Please check your connection and try again.`,
          undefined,
          file.name,
        ),
      );
    };

    xhr.timeout = 120_000; // 2-minute timeout for large images on slow connections
    xhr.open("POST", CLOUDINARY_UPLOAD_URL, true);
    xhr.send(formData);
  });
}

// ─── Batch Upload ─────────────────────────────────────────────────────────────

export interface BatchUploadResult {
  successes: Array<{ file: File; secureUrl: string }>;
  failures: Array<{ file: File; error: string }>;
}

/**
 * Upload multiple image files to Cloudinary sequentially.
 * Continues past individual failures — failures are collected, not thrown.
 *
 * @param files          Array of Files to upload
 * @param onFileProgress Called with (fileIndex, percentage) for each file
 * @returns              BatchUploadResult with successes and failures separated
 */
export async function uploadBatchToCloudinary(
  files: File[],
  onFileProgress?: (fileIndex: number, percentage: number) => void,
): Promise<BatchUploadResult> {
  const successes: BatchUploadResult["successes"] = [];
  const failures: BatchUploadResult["failures"] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadToCloudinary(files[i], (pct) =>
        onFileProgress?.(i, pct),
      );
      successes.push({ file: files[i], secureUrl: result.secureUrl });
    } catch (err) {
      const message =
        err instanceof CloudinaryValidationError ||
        err instanceof CloudinaryUploadError
          ? err.message
          : `Upload failed for "${files[i].name}".`;
      console.error(
        `[Cloudinary] File ${i + 1}/${files.length} failed: ${message}`,
        err,
      );
      failures.push({ file: files[i], error: message });
    }
  }

  return { successes, failures };
}
