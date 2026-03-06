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
    // Reset on failure so the next call gets a fresh attempt
    adminSessionPromise.catch((err) => {
      console.error("[AdminAuth] Session initialisation failed:", err);
      adminSessionPromise = null;
    });
  }
  return adminSessionPromise;
}

/**
 * Core sequential init function.
 * Separated from getAdminSession() so the logic is testable and readable.
 */
async function initAdminSession(): Promise<AdminSession> {
  console.group("[AdminAuth] Initialising admin session…");

  // Step 1: resolve token BEFORE creating the actor
  const adminToken = resolveAdminToken();

  // Step 2: create actor — awaited so the config object is fully loaded
  // createActorWithConfig() can return undefined/null on misconfiguration,
  // so we guard immediately to avoid the "Cannot read properties of undefined
  // (reading 'config')" crash that happens when downstream code calls actor.config.
  let actor: Awaited<ReturnType<typeof createActorWithConfig>>;
  try {
    actor = await createActorWithConfig();
  } catch (err) {
    console.groupEnd();
    throw new Error(
      `[AdminAuth] createActorWithConfig() threw: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!actor) {
    console.groupEnd();
    throw new Error(
      "[AdminAuth] createActorWithConfig() returned null/undefined. " +
        "The canister config may not be available yet — please refresh the page.",
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
}
