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
    console.info("[AdminSessionStore] Session init started…");

    try {
      const session = await getAdminSession();
      set({ status: "ready", session, error: null });

      // ── Detailed session summary log ──────────────────────────────────────
      // This is the single place where you can see EXACTLY what the canister
      // delivered and whether the session is fully authenticated or anonymous.
      console.group("[AdminSessionStore] ✓ Session ready — full summary");
      console.info("isAnonymous:", session.isAnonymous);
      console.info(
        "Auth level:",
        session.isAnonymous
          ? "⚠ ANONYMOUS — ICP writes will fail. Cloudinary uploads OK."
          : "✓ AUTHENTICATED — all uploads and ICP saves authorised.",
      );
      console.info(
        "actor (available methods):",
        Object.keys(session.actor as object)
          .filter(
            (k) =>
              typeof (session.actor as unknown as Record<string, unknown>)[
                k
              ] === "function",
          )
          .slice(0, 20),
      );
      console.info(
        "agent:",
        session.agent
          ? `Present (type=${typeof session.agent})`
          : "⚠ agent is null/undefined — StorageClient will use anonymous agent.",
      );
      console.groupEnd();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[AdminSessionStore] ✗ Session init failed:", {
        message: msg,
        raw: err,
        hint: "Check the [AdminAuth] logs above for the exact failure point.",
      });
      set({ status: "error", session: null, error: msg });
    }
  },

  clearSession: () => {
    resetAdminActor();
    set({ status: "idle", session: null, error: null });
    console.info("[AdminSessionStore] Session cleared.");
  },
}));
