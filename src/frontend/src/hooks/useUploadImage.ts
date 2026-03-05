import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback } from "react";
import { createActorWithConfig, loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { compressImage } from "../utils/imageCompression";
import { getSecretParameter } from "../utils/urlParams";

const FILE_LEVEL_RETRIES = 2;
const FILE_RETRY_DELAY_MS = 1200;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hook that provides an uploadImage function for uploading files to Caffeine blob storage.
 * - Compresses images > 300KB before upload (max 1500px, JPEG 0.82)
 * - Retries at the file level (2 extra attempts) for transient network failures
 * - Admin token is initialized fresh before each upload session to avoid stale auth
 */
export function useUploadImage() {
  const uploadImage = useCallback(
    async (
      file: File,
      onProgress?: (percentage: number) => void,
    ): Promise<string> => {
      // Compress image before uploading
      const fileToUpload = await compressImage(file);

      // Initialize admin auth ONCE before any upload attempt.
      // If this fails, there is no point retrying the upload.
      const config = await loadConfig();
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      if (adminToken) {
        try {
          const actor = await createActorWithConfig();
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch (initErr) {
          console.warn("Admin token initialization failed:", initErr);
          throw new Error(
            "Upload failed: authentication error. Please refresh the page and try again.",
          );
        }
      }

      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= FILE_LEVEL_RETRIES; attempt++) {
        if (attempt > 0) {
          console.warn(`Upload retry attempt ${attempt} for "${file.name}"...`);
          await sleep(FILE_RETRY_DELAY_MS * attempt);
        }

        try {
          // Create a fresh agent for each attempt (network may have changed)
          const agent = await HttpAgent.create({
            host: config.backend_host,
            shouldFetchRootKey: config.backend_host?.includes("localhost"),
          });

          const storageClient = new StorageClient(
            "designs",
            "https://blob.caffeine.ai",
            config.backend_canister_id,
            config.project_id,
            agent,
          );

          const arrayBuffer = await fileToUpload.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);

          const { hash } = await storageClient.putFile(bytes, onProgress);
          const url = await storageClient.getDirectURL(hash);
          return url;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          const msg = lastError.message.toLowerCase();

          // Don't retry auth errors -- they won't resolve on retry
          if (
            msg.includes("auth") ||
            msg.includes("unauthorized") ||
            msg.includes("forbidden") ||
            msg.includes("401") ||
            msg.includes("403")
          ) {
            throw lastError;
          }

          // On final attempt, throw
          if (attempt === FILE_LEVEL_RETRIES) {
            throw lastError;
          }
        }
      }

      throw lastError || new Error("Upload failed after retries");
    },
    [],
  );

  return { uploadImage };
}
