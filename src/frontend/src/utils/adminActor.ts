import { HttpAgent } from "@icp-sdk/core/agent";
import type { backendInterface } from "../backend.d";
import { createActorWithConfig, loadConfig } from "../config";
import { getSecretParameter } from "./urlParams";

/**
 * Result of a fully-initialised admin session.
 * Callers can use `actor` for canister calls and `agent` for direct
 * authenticated calls (e.g. StorageClient certificate requests).
 */
export interface AdminSession {
  actor: backendInterface;
  agent: HttpAgent;
}

/**
 * Module-level singleton for the admin-authenticated session.
 *
 * The actor AND agent are created ONCE per page load and reused for all
 * mutations, upload auth checks, and blob-storage certificate requests.
 *
 * Critical fix: previous versions created a *separate, anonymous* HttpAgent
 * inside useUploadImage for every upload. That anonymous agent called
 * `_caffeineStorageCreateCertificate` without admin rights, causing auth
 * failures. Now the same authenticated agent is shared with StorageClient.
 *
 * If initialisation fails the promise is cleared so the next call retries.
 */
let adminSessionPromise: Promise<AdminSession> | null = null;

export function getAdminSession(): Promise<AdminSession> {
  if (!adminSessionPromise) {
    adminSessionPromise = (async () => {
      const config = await loadConfig();
      const adminToken = getSecretParameter("caffeineAdminToken") || "";

      // Guard: fail fast and clearly if the admin token is missing.
      // An empty token means _initializeAccessControlWithSecret will never be
      // called, producing a broken session that silently rejects every canister
      // call with "Unauthorized". Throwing here surfaces the real reason to the
      // admin instead of caching a broken session.
      if (!adminToken) {
        throw new Error(
          "Admin token not found. Please open the app via the correct admin link and refresh the page.",
        );
      }

      // Build a single HttpAgent that will be reused everywhere
      const agent = await HttpAgent.create({
        host: config.backend_host,
        shouldFetchRootKey: config.backend_host?.includes("localhost"),
      });

      // Create the actor using the same agent
      const actor = await createActorWithConfig({
        agentOptions: { identity: (agent as any).identity },
      });

      // Initialise access control exactly once with the validated token
      await actor._initializeAccessControlWithSecret(adminToken);

      console.info("[AdminActor] Admin session initialised successfully.");
      return { actor: actor as unknown as backendInterface, agent };
    })();

    // Reset on failure so the next call gets a fresh attempt
    adminSessionPromise.catch((err) => {
      console.error("[AdminActor] Session initialisation failed:", err);
      adminSessionPromise = null;
    });
  }
  return adminSessionPromise;
}

/**
 * Convenience wrapper — returns just the actor (backward compatible with all
 * existing callers that only need actor methods).
 */
export async function getAdminActor(): Promise<backendInterface> {
  const { actor } = await getAdminSession();
  return actor;
}

/**
 * Force-reset the singleton (e.g. after logout or auth error).
 * The next call to `getAdminActor()` / `getAdminSession()` will re-initialise.
 */
export function resetAdminActor(): void {
  adminSessionPromise = null;
}
