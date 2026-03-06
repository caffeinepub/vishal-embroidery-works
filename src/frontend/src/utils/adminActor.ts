import { HttpAgent } from "@icp-sdk/core/agent";
import type { backendInterface } from "../backend.d";
import { createActorWithConfig, loadConfig } from "../config";
import { getSecretParameter, storeSessionParameter } from "./urlParams";

/**
 * Result of a fully-initialised admin session.
 * Callers can use `actor` for canister calls and `agent` for direct
 * authenticated calls (e.g. StorageClient certificate requests).
 */
export interface AdminSession {
  actor: backendInterface;
  agent: HttpAgent;
}

// ─── Token persistence key ────────────────────────────────────────────────────
// The caffeineAdminToken arrives in the URL hash on first load. We persist it
// to sessionStorage under this key so it survives Google OAuth redirects and
// in-app navigation that strips the original URL parameters.
const TOKEN_STORAGE_KEY = "vew_caffeine_admin_token";

/**
 * Reads the admin token using a multi-fallback chain:
 *  1. sessionStorage (fastest path — already cached from a prior page load)
 *  2. URL query string (?caffeineAdminToken=...) — Caffeine's primary injection method
 *  3. URL hash fragment (#caffeineAdminToken=... or #/?caffeineAdminToken=...)
 *
 * Once found in the URL it is immediately persisted to sessionStorage so it
 * survives Google OAuth redirects and in-app navigation.
 *
 * Why sessionStorage is checked FIRST:
 *   After a Google OAuth round-trip, the URL no longer contains the token.
 *   Checking sessionStorage first ensures we recover the token immediately on
 *   the post-redirect load without needing the URL parameter to be present again.
 */
function resolveAdminToken(): string | null {
  // 1. Fastest path: token already cached from a previous page load or login
  const fromSession = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (fromSession) {
    console.info(
      "[AdminAuth] caffeineAdminToken restored from sessionStorage (post-OAuth-redirect path).",
    );
    return fromSession;
  }

  // 2. Try the URL query string (?caffeineAdminToken=...)
  //    This is the primary injection point used by Caffeine when opening the admin link.
  const urlSearchParams = new URLSearchParams(window.location.search);
  const fromQuery = urlSearchParams.get("caffeineAdminToken");
  if (fromQuery) {
    storeSessionParameter(TOKEN_STORAGE_KEY, fromQuery);
    console.info(
      "[AdminAuth] caffeineAdminToken found in URL query string — persisted to sessionStorage.",
    );
    return fromQuery;
  }

  // 3. Try the URL hash fragment (both bare #token=... and hash-routed #/?token=... forms)
  const fromHash = getSecretParameter("caffeineAdminToken");
  if (fromHash) {
    storeSessionParameter(TOKEN_STORAGE_KEY, fromHash);
    console.info(
      "[AdminAuth] caffeineAdminToken found in URL hash — persisted to sessionStorage.",
    );
    return fromHash;
  }

  console.error(
    "[AdminAuth] caffeineAdminToken NOT FOUND — checked sessionStorage, URL query string, and URL hash.",
    {
      urlSearch: window.location.search,
      urlHash: `${window.location.hash.substring(0, 80)}…`,
      sessionKeys: Object.keys(sessionStorage),
    },
  );
  return null;
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
      console.group("[AdminAuth] Initialising admin session…");
      const config = await loadConfig();

      const adminToken = resolveAdminToken();

      // Guard: fail fast and clearly if the admin token is missing.
      // An empty token means _initializeAccessControlWithSecret will never be
      // called, producing a broken session that silently rejects every canister
      // call with "Unauthorized". Throwing here surfaces the real reason.
      if (!adminToken) {
        console.error(
          "[AdminAuth] ❌ Token missing — admin session cannot be created.",
          "Fix: open the app via the Caffeine admin link (it includes caffeineAdminToken in the URL).",
        );
        console.groupEnd();
        throw new Error(
          "Admin token not found. Please open the app via the correct Caffeine admin link. " +
            "If you arrived here via Google login, refresh the page using the original admin link.",
        );
      }

      console.info(
        "[AdminAuth] Token resolved. Building HttpAgent for host:",
        config.backend_host,
      );

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
      console.info("[AdminAuth] Calling _initializeAccessControlWithSecret…");
      await actor._initializeAccessControlWithSecret(adminToken);

      console.info(
        "[AdminAuth] ✅ Admin session initialised successfully. Upload requests will use this authenticated agent.",
      );
      console.groupEnd();
      return { actor: actor as unknown as backendInterface, agent };
    })();

    // Reset on failure so the next call gets a fresh attempt
    adminSessionPromise.catch((err) => {
      console.error("[AdminAuth] ❌ Session initialisation failed:", err);
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
