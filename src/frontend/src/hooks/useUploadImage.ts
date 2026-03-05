import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useRef } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

/**
 * Hook that provides an uploadImage function for uploading files to Caffeine blob storage.
 * Returns a stable function reference that can be called to upload an image file.
 */
export function useUploadImage() {
  // Cache the storage client to avoid recreating it on every upload
  const storageClientRef = useRef<StorageClient | null>(null);

  const uploadImage = useCallback(
    async (
      file: File,
      onProgress?: (percentage: number) => void,
    ): Promise<string> => {
      // Build storage client lazily (once per hook instance)
      if (!storageClientRef.current) {
        const config = await loadConfig();

        const agentOptions: Record<string, unknown> = {};
        if (config.backend_host) {
          agentOptions.host = config.backend_host;
        }

        const agent = await HttpAgent.create({
          host: config.backend_host,
          shouldFetchRootKey: config.backend_host?.includes("localhost"),
        });

        storageClientRef.current = new StorageClient(
          "designs",
          "https://blob.caffeine.ai",
          config.backend_canister_id,
          config.project_id,
          agent,
        );
      }

      const storageClient = storageClientRef.current;

      // Convert the File to a Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Upload the file and get the hash
      const { hash } = await storageClient.putFile(bytes, onProgress);

      // Return the direct URL for the uploaded file
      const url = await storageClient.getDirectURL(hash);
      return url;
    },
    [],
  );

  return { uploadImage };
}
