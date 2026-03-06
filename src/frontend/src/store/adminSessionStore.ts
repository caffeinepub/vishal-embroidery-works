import { create } from "zustand";
import { getAdminSession, resetAdminActor } from "../utils/adminActor";
import type { AdminSession } from "../utils/adminActor";

/**
 * Global Zustand store for the admin session.
 *
 * Lifecycle:
 *   "idle"     → initial state, session not yet requested
 *   "loading"  → initSession() called, waiting for getAdminSession()
 *   "ready"    → session resolved (may be anonymous or authenticated)
 *   "error"    → session init threw (network down, canister unreachable, etc.)
 *
 * All admin mutations and the AdminScreen components should call initSession()
 * once on mount and read from sessionStatus / session / isAnonymous.
 *
 * The store persists session data in memory only (not localStorage/sessionStorage).
 * The underlying token persistence is handled by adminActor.ts / main.tsx.
 */

export type SessionStatus = "idle" | "loading" | "ready" | "error";

interface AdminSessionState {
  status: SessionStatus;
  session: AdminSession | null;
  error: string | null;

  /** Call once on AdminScreen mount to warm up the session. */
  initSession: () => Promise<void>;

  /** Call on logout — clears store state and resets the actor singleton. */
  clearSession: () => void;
}

export const useAdminSessionStore = create<AdminSessionState>((set, get) => ({
  status: "idle",
  session: null,
  error: null,

  initSession: async () => {
    // Avoid duplicate in-flight requests
    const current = get().status;
    if (current === "loading" || current === "ready") return;

    set({ status: "loading", error: null });

    try {
      const session = await getAdminSession();
      set({ status: "ready", session, error: null });
      console.info(
        `[AdminSessionStore] Session ready. isAnonymous=${session.isAnonymous}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[AdminSessionStore] Session init failed:", msg);
      set({ status: "error", session: null, error: msg });
    }
  },

  clearSession: () => {
    resetAdminActor();
    set({ status: "idle", session: null, error: null });
    console.info("[AdminSessionStore] Session cleared.");
  },
}));
