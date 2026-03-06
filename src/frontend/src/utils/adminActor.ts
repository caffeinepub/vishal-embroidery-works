import { Actor, type HttpAgent } from "@icp-sdk/core/agent";
import type { backendInterface } from "../backend.d";
import { createActorWithConfig } from "../config";
import { storeSessionParameter } from "./urlParams";

/**
 * Result of a fully-initialised admin session.
 * isAnonymous = true means the ICP admin token was not found;
 * the actor works for read operations but write operations will
 * fail with "Unauthorized" from the canister.
 * Cloudinary uploads are unaffected — they don't use the ICP actor.
 */
export interface AdminSession {
  actor: backendInterface;
  agent: HttpAgent;
  /** true when no ICP admin token was found; limited write access */
  isAnonymous: boolean;
}

// ─── Token persistence key ─────────────────────────────────────────────────────
const TOKEN_STORAGE_KEY = "vew_caffeine_admin_token";

/**
 * Reads the admin token using a multi-fallback chain:
 *  1. sessionStorage (fastest path — bootstrap saved it here before React rendered)
 *  2. URL query string (?caffeineAdminToken=...)
 *  3. URL hash fragment (#caffeineAdminToken=...)
 *
 * Returns null if not found — callers must handle anonymous mode gracefully.
 */
function resolveAdminToken(): string | null {
  // 1. sessionStorage — bootstrap in main.tsx already saved it here
  try {
    const fromSession = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (fromSession) {
      console.info(
        "[AdminAuth] caffeineAdminToken restored from sessionStorage.",
      );
      return fromSession;
    }
  } catch {
    // sessionStorage unavailable (private browsing restriction) — fall through
  }

  // 2. URL query string
  try {
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("caffeineAdminToken");
    if (fromQuery) {
      storeSessionParameter(TOKEN_STORAGE_KEY, fromQuery);
      console.info(
        "[AdminAuth] caffeineAdminToken found in URL query string — persisted.",
      );
      return fromQuery;
    }
  } catch {
    // URL parse error — fall through
  }

  // 3. URL hash fragment
  try {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashContent = hash.substring(1);
      const rawHash = new URLSearchParams(hashContent);
      const fromRawHash = rawHash.get("caffeineAdminToken");
      if (fromRawHash) {
        storeSessionParameter(TOKEN_STORAGE_KEY, fromRawHash);
        console.info(
          "[AdminAuth] caffeineAdminToken found in URL hash — persisted.",
        );
        return fromRawHash;
      }
      const qIdx = hashContent.indexOf("?");
      if (qIdx !== -1) {
        const hashQs = new URLSearchParams(hashContent.substring(qIdx + 1));
        const fromHashQs = hashQs.get("caffeineAdminToken");
        if (fromHashQs) {
          storeSessionParameter(TOKEN_STORAGE_KEY, fromHashQs);
          console.info(
            "[AdminAuth] caffeineAdminToken found in hash query string — persisted.",
          );
          return fromHashQs;
        }
      }
    }
  } catch {
    // hash parse error — fall through
  }

  console.warn(
    "[AdminAuth] caffeineAdminToken NOT FOUND — using anonymous mode. " +
      "ICP write operations will fail. Open the app via the Caffeine admin link to restore full access.",
    {
      urlSearch: window.location.search.substring(0, 120),
      urlHash: window.location.hash.substring(0, 80),
      sessionKeys: (() => {
        try {
          return Object.keys(sessionStorage);
        } catch {
          return [];
        }
      })(),
    },
  );
  return null;
}

/**
 * isInitialized — true once the session promise has resolved (successfully or
 * with an anonymous fallback). Components can read this synchronously to
 * decide whether it is safe to render config-dependent UI.
 *
 * Start as false; set to true inside initAdminSession() after the actor is ready.
 * Reset to false when resetAdminActor() is called (logout).
 */
export let isInitialized = false;

/**
 * Module-level singleton promise for the admin-authenticated session.
 *
 * The init sequence is strictly sequential (async/await):
 *   1. Resolve token from sessionStorage / URL
 *   2. createActorWithConfig() — awaited so config is fully loaded before use
 *   3. _initializeAccessControlWithSecret() — awaited so auth is confirmed
 *   4. Extract the authenticated agent via Actor.agentOf()
 *
 * If any step throws, the singleton is reset so the next call retries fresh.
 * If the token is missing, anonymous mode is used (Cloudinary works, ICP writes fail).
 */
let adminSessionPromise: Promise<AdminSession> | null = null;

export function getAdminSession(): Promise<AdminSession> {
  if (!adminSessionPromise) {
    adminSessionPromise = initAdminSession();
    // On success: mark as initialized
    adminSessionPromise.then(() => {
      isInitialized = true;
    });
    // Reset on failure so the next call gets a fresh attempt
    adminSessionPromise.catch((err) => {
      console.error("[AdminAuth] Session initialisation failed:", err);
      adminSessionPromise = null;
      isInitialized = false;
    });
  }
  return adminSessionPromise;
}

/**
 * Attempt createActorWithConfig() up to maxAttempts times with an exponential
 * back-off delay between retries.  This handles the race where the canister
 * configuration (config) is not yet available on the very first render,
 * which would otherwise cause:
 *   "Cannot read properties of undefined (reading 'config')"
 */
async function createActorWithRetry(
  maxAttempts = 4,
  initialDelayMs = 300,
): Promise<Awaited<ReturnType<typeof createActorWithConfig>>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const actor = await createActorWithConfig();
      if (actor) return actor;

      // Returned null/undefined — not ready yet
      lastError = new Error(
        "[AdminAuth] createActorWithConfig() returned null/undefined — canister config not ready.",
      );
    } catch (err) {
      lastError = err;
      console.warn(
        `[AdminAuth] createActorWithConfig() attempt ${attempt}/${maxAttempts} threw:`,
        err instanceof Error ? err.message : String(err),
      );
    }

    if (attempt < maxAttempts) {
      const delay = initialDelayMs * 2 ** (attempt - 1); // 300, 600, 1200 ms
      console.info(
        `[AdminAuth] Retrying createActorWithConfig() in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})…`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const lastMsg =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `[AdminAuth] createActorWithConfig() failed after all retries — the canister configuration (config) could not be loaded. Open the app via the Caffeine admin link and refresh the page. Last error: ${lastMsg}`,
  );
}

/**
 * Core sequential init function.
 * Separated from getAdminSession() so the logic is testable and readable.
 */
async function initAdminSession(): Promise<AdminSession> {
  console.group("[AdminAuth] Initialising admin session…");

  // Step 1: resolve token BEFORE creating the actor
  const adminToken = resolveAdminToken();

  // Step 2: create actor — awaited with retry so the config object is fully
  // loaded before use.  The retry loop handles the race where
  // createActorWithConfig() returns null on the very first render because
  // the canister configuration has not finished loading yet.
  // This is the primary guard against:
  //   "Cannot read properties of undefined (reading 'config')"
  let actor: Awaited<ReturnType<typeof createActorWithConfig>>;
  try {
    actor = await createActorWithRetry();
  } catch (err) {
    console.groupEnd();
    throw new Error(
      `[AdminAuth] Actor creation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Belt-and-suspenders null guard (createActorWithRetry throws if null, but
  // TypeScript doesn't know that).
  if (!actor) {
    console.groupEnd();
    throw new Error(
      "[AdminAuth] createActorWithConfig() returned null/undefined after retries — " +
        "the canister configuration (config) is not available. " +
        "Open the app via the Caffeine admin link and refresh the page.",
    );
  }

  if (adminToken) {
    // Step 3a: authenticated session
    console.info(
      "[AdminAuth] Token resolved. Calling _initializeAccessControlWithSecret…",
    );
    try {
      await actor._initializeAccessControlWithSecret(adminToken);
    } catch (err) {
      // Log but don't throw — the canister may already be initialised
      console.warn(
        "[AdminAuth] _initializeAccessControlWithSecret threw (may be benign if already initialised):",
        err instanceof Error ? err.message : String(err),
      );
    }

    // Step 4: extract the authenticated agent that was used by the actor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractedAgent = Actor.agentOf(actor as any) as unknown as HttpAgent;
    if (!extractedAgent) {
      console.groupEnd();
      throw new Error(
        "[AdminAuth] Actor.agentOf() returned null — cannot build authenticated StorageClient.",
      );
    }

    console.info("[AdminAuth] Admin session initialised (full access).");
    console.groupEnd();
    return {
      actor: actor as unknown as backendInterface,
      agent: extractedAgent,
      isAnonymous: false,
    };
  }

  // Step 3b: anonymous fallback
  console.warn(
    "[AdminAuth] No token — anonymous actor. Cloudinary uploads OK; ICP writes may fail.",
  );
  try {
    await actor._initializeAccessControlWithSecret("");
  } catch {
    // Expected for anonymous callers — ignore
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractedAgent = Actor.agentOf(actor as any) as unknown as HttpAgent;
  console.groupEnd();
  return {
    actor: actor as unknown as backendInterface,
    agent: extractedAgent ?? ({} as HttpAgent),
    isAnonymous: true,
  };
}

/**
 * Convenience wrapper — returns just the actor.
 * All mutations in useQueries.ts call this.
 */
export async function getAdminActor(): Promise<backendInterface> {
  const { actor } = await getAdminSession();
  return actor;
}

/**
 * Force-reset the singleton (e.g. after logout).
 * The next call to getAdminSession() / getAdminActor() will re-initialise.
 */
export function resetAdminActor(): void {
  adminSessionPromise = null;
  isInitialized = false;
}
