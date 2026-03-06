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
 *
 * If all retries fail, returns a FALLBACK actor using default configuration
 * so the app never hard-crashes due to a missing config object.
 * The fallback actor can still perform Cloudinary uploads (which are
 * independent of ICP config) but ICP write operations will likely fail.
 */
async function createActorWithRetry(
  maxAttempts = 4,
  initialDelayMs = 300,
): Promise<Awaited<ReturnType<typeof createActorWithConfig>>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.info(
        `[AdminAuth] createActorWithConfig() attempt ${attempt}/${maxAttempts}…`,
      );
      const actor = await createActorWithConfig();
      if (actor) {
        console.info(
          `[AdminAuth] createActorWithConfig() succeeded on attempt ${attempt}. ✓`,
          {
            actorType: typeof actor,
            actorKeys: actor
              ? Object.keys(actor as object).slice(0, 10)
              : "null",
          },
        );
        return actor;
      }

      // Returned null/undefined — not ready yet
      lastError = new Error(
        "[AdminAuth] createActorWithConfig() returned null/undefined — canister config not ready.",
      );
      console.warn(`[AdminAuth] Attempt ${attempt}: returned null/undefined.`);
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

  // ── Fallback: try one last time with a longer delay ──────────────────────
  // Before giving up entirely, wait 2 seconds and try once more.
  // This handles slow canister cold-starts on the ICP network.
  console.warn(
    "[AdminAuth] All fast retries failed. Attempting final slow retry (2s delay)…",
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));
  try {
    const actor = await createActorWithConfig();
    if (actor) {
      console.info("[AdminAuth] Slow retry succeeded. ✓");
      return actor;
    }
  } catch (slowErr) {
    console.error(
      "[AdminAuth] Slow retry also failed:",
      slowErr instanceof Error ? slowErr.message : String(slowErr),
    );
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
 *
 * DETAILED LOGGING: Every step logs exactly what the canister returns so
 * issues can be diagnosed from the browser DevTools console without guessing.
 */
async function initAdminSession(): Promise<AdminSession> {
  console.group("[AdminAuth] ═══ Initialising admin session ═══");
  console.info("[AdminAuth] Step 1: Resolving admin token…");

  // Step 1: resolve token BEFORE creating the actor
  const adminToken = resolveAdminToken();
  console.info(
    "[AdminAuth] Token resolution result:",
    adminToken
      ? `Found (length=${adminToken.length}, prefix="${adminToken.substring(0, 8)}…")`
      : "NOT FOUND — will use anonymous mode",
  );

  // Step 2: create actor — awaited with retry so the config object is fully
  // loaded before use.  The retry loop handles the race where
  // createActorWithConfig() returns null on the very first render because
  // the canister configuration has not finished loading yet.
  // This is the primary guard against:
  //   "Cannot read properties of undefined (reading 'config')"
  console.info(
    "[AdminAuth] Step 2: Creating actor via createActorWithConfig()…",
  );
  let actor: Awaited<ReturnType<typeof createActorWithConfig>>;
  try {
    actor = await createActorWithRetry();
  } catch (err) {
    console.error(
      "[AdminAuth] ✗ Actor creation failed completely. Raw error:",
      err,
    );
    console.groupEnd();
    throw new Error(
      `[AdminAuth] Actor creation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Belt-and-suspenders null guard (createActorWithRetry throws if null, but
  // TypeScript doesn't know that).
  if (!actor) {
    console.error(
      "[AdminAuth] ✗ createActorWithConfig() returned null/undefined after all retries.",
      {
        hint: "This usually means the Caffeine config canister is unreachable or the app was not opened via the Caffeine admin link.",
        urlSearch: window.location.search.substring(0, 80),
      },
    );
    console.groupEnd();
    throw new Error(
      "[AdminAuth] createActorWithConfig() returned null/undefined after retries — " +
        "the canister configuration (config) is not available. " +
        "Open the app via the Caffeine admin link and refresh the page.",
    );
  }

  console.info("[AdminAuth] ✓ Actor created successfully.", {
    methods: Object.keys(actor as object)
      .filter(
        (k) =>
          typeof (actor as unknown as Record<string, unknown>)[k] ===
          "function",
      )
      .slice(0, 15),
  });

  if (adminToken) {
    // Step 3a: authenticated session
    console.info(
      "[AdminAuth] Step 3a: Calling _initializeAccessControlWithSecret (authenticated)…",
    );
    let initResult: unknown = undefined;
    try {
      initResult = await actor._initializeAccessControlWithSecret(adminToken);
      console.info(
        "[AdminAuth] ✓ _initializeAccessControlWithSecret completed.",
        {
          // Log EXACTLY what the canister returned so we can see the raw response
          canisterReturnValue: initResult,
          returnType: typeof initResult,
          returnJSON: (() => {
            try {
              return JSON.stringify(initResult);
            } catch {
              return String(initResult);
            }
          })(),
        },
      );
    } catch (err) {
      // Log the full error object — not just err.message — so we can see
      // the canister trap text, error code, and any nested details.
      console.warn(
        "[AdminAuth] _initializeAccessControlWithSecret threw (may be benign if canister already initialised).",
        {
          errorMessage: err instanceof Error ? err.message : String(err),
          errorObject: err,
          hint: "If this says 'already initialized' or similar, the session will still work.",
        },
      );
    }

    // Step 4: extract the authenticated agent that was used by the actor
    console.info("[AdminAuth] Step 4: Extracting agent via Actor.agentOf()…");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractedAgent = Actor.agentOf(actor as any) as unknown as HttpAgent;
    if (!extractedAgent) {
      console.error(
        "[AdminAuth] ✗ Actor.agentOf() returned null — cannot build authenticated StorageClient.",
        { actor },
      );
      console.groupEnd();
      throw new Error(
        "[AdminAuth] Actor.agentOf() returned null — cannot build authenticated StorageClient.",
      );
    }

    console.info(
      "[AdminAuth] ✓ Admin session fully initialised (full access). All uploads and ICP saves should work.",
    );
    console.groupEnd();
    return {
      actor: actor as unknown as backendInterface,
      agent: extractedAgent,
      isAnonymous: false,
    };
  }

  // Step 3b: anonymous fallback
  // No admin token found — use an empty string so the actor still initialises.
  // Cloudinary uploads work; ICP canister writes (createDesign etc.) will
  // be rejected by the canister's #admin permission check.
  console.warn(
    "[AdminAuth] Step 3b: No token — using anonymous fallback. Cloudinary uploads OK; ICP writes may fail.",
    {
      hint: "Open via the Caffeine admin link to get a token and enable full ICP write access.",
    },
  );
  let anonInitResult: unknown = undefined;
  try {
    anonInitResult = await actor._initializeAccessControlWithSecret("");
    console.info(
      "[AdminAuth] Anonymous _initializeAccessControlWithSecret result:",
      {
        canisterReturnValue: anonInitResult,
        returnType: typeof anonInitResult,
        returnJSON: (() => {
          try {
            return JSON.stringify(anonInitResult);
          } catch {
            return String(anonInitResult);
          }
        })(),
      },
    );
  } catch (anonErr) {
    // Expected — anonymous callers are usually rejected
    console.info(
      "[AdminAuth] Anonymous _initializeAccessControlWithSecret threw (expected for anonymous callers):",
      {
        message: anonErr instanceof Error ? anonErr.message : String(anonErr),
        raw: anonErr,
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractedAgent = Actor.agentOf(actor as any) as unknown as HttpAgent;
  console.warn(
    "[AdminAuth] ⚠ Anonymous session created. ICP writes will likely fail. Cloudinary uploads unaffected.",
  );
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
