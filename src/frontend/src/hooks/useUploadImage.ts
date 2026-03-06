import { useCallback } from "react";
import {
  ImageUploadError,
  getUploadErrorMessage,
  uploadImageFile,
} from "../utils/imageHandler";

/**
 * Hook that provides an `uploadImage` function backed by the centralized
 * ImageHandler service.
 *
 * Retry logic:
 * - Retries up to 3 times for NETWORK_ERROR (1 second delay between retries)
 * - AUTH_ERROR fails immediately (no retry — won't be fixed by retrying)
 * - Validation errors fail immediately
 */
export function useUploadImage() {
  const uploadImage = useCallback(
    async (
      file: File,
      onProgress?: (percentage: number) => void,
    ): Promise<string> => {
      const MAX_RETRIES = 3;
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await uploadImageFile(file, onProgress);
          return result.url;
        } catch (err) {
          lastError = err;
          // Don't retry auth errors - they won't be fixed by retrying
          if (err instanceof ImageUploadError && err.code === "AUTH_ERROR") {
            throw new Error(getUploadErrorMessage(err));
          }
          // Don't retry validation errors
          if (
            err instanceof ImageUploadError &&
            err.code === "UNKNOWN" &&
            err.message.includes("validation")
          ) {
            throw new Error(getUploadErrorMessage(err));
          }
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw new Error(getUploadErrorMessage(lastError));
    },
    [],
  );

  return { uploadImage };
}
