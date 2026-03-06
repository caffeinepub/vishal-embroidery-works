import { Actor, type HttpAgent } from "@icp-sdk/core/agent";
import type { backendInterface } from "../backend.d";
import { createActorWithConfig } from "../config";

// ─── Token Storage Key ────────────────────────────────────────────────────────
const TOKEN_KEY = "vew_caffeine_admin_token";

// ─── Fallback Configuration ───────────────────────────────────────────────────
// Used when the canister is temporarily unreachable so the app never hard-crashes.
// Cloudinary uploads still work in this mode; ICP write operations will fail gracefully.
export const FALLBACK_CONFIG = {
  cloudinaryCloudName: "doxbxqcef",
  cloudinaryUploadPreset: "Embroidery_works",
  isAnonymous: true,
  canisterAvailable: false,
} as const;

// ─── Admin Session ────────────────────────────────────────────────────────────

export interface AdminSession {
  actor: backendInterface;
  agent: HttpAgent | null;
  /** true when no admin token was found or canister was unreachable */
  isAnonymous: boolean;
  /** true when the canister responded successfully */
  canisterAvailable: boolean;
}

// ─── Token Resolution ─────────────────────────────────────────────────────────
// Reads only from sessionStorage — the bootstrap IIFE in main.tsx already
// captured the token before React rendered.

function resolveAdminToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

// ─── Singleton Session Promise ────────────────────────────────────────────────

let sessionPromise: Promise<AdminSession> | null = null;

async function initAdminSession(): Promise<AdminSession> {
  try {
    // Step 1: read token from sessionStorage (already captured by bootstrap in main.tsx)
    const adminToken = resolveAdminToken();

    // Step 2: attempt to create the actor — single try, then fallback
    let actor: backendInterface | null = null;
    try {
      const rawActor = await createActorWithConfig();
      if (rawActor) {
        actor = rawActor as unknown as backendInterface;
      }
    } catch (err) {
      console.warn(
        "[AdminActor] createActorWithConfig() failed — using fallback config.",
        err instanceof Error ? err.message : String(err),
      );
    }

    // If actor is unavailable, return a safe fallback session
    if (!actor) {
      console.warn(
        "[AdminActor] Canister unavailable — returning fallback session. " +
          "Cloudinary uploads work; ICP operations will not function until the canister is reachable.",
      );
      return {
        actor: {} as backendInterface,
        agent: null,
        isAnonymous: true,
        canisterAvailable: false,
      };
    }

    // Step 3: authenticate with the canister using the token (if available)
    // Cast to any to call the Caffeine-injected method not declared in backendInterface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actorAny = actor as any;

    if (adminToken) {
      try {
        await actorAny._initializeAccessControlWithSecret(adminToken);
      } catch (err) {
        // Non-fatal — canister may already be initialised
        console.info(
          "[AdminActor] _initializeAccessControlWithSecret threw (may be benign):",
          err instanceof Error ? err.message : String(err),
        );
      }

      // Extract the agent for storage client use
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agent = Actor.agentOf(actor as any) as unknown as HttpAgent | null;
      return {
        actor,
        agent,
        isAnonymous: false,
        canisterAvailable: true,
      };
    }

    // No token — anonymous session
    try {
      await actorAny._initializeAccessControlWithSecret("");
    } catch {
      // Expected for anonymous callers
    }

    return {
      actor,
      agent: null,
      isAnonymous: true,
      canisterAvailable: true,
    };
  } catch (err) {
    // Absolute safety net — never crash the app
    console.error(
      "[AdminActor] initAdminSession encountered an unhandled error:",
      err instanceof Error ? err.message : String(err),
    );
    return {
      actor: {} as backendInterface,
      agent: null,
      isAnonymous: true,
      canisterAvailable: false,
    };
  }
}

export function getAdminSession(): Promise<AdminSession> {
  if (!sessionPromise) {
    sessionPromise = initAdminSession();
    sessionPromise.catch(() => {
      // Reset so the next call gets a fresh attempt
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

export async function getAdminActor(): Promise<backendInterface> {
  const { actor } = await getAdminSession();
  return actor;
}

export function resetAdminActor(): void {
  sessionPromise = null;
}
