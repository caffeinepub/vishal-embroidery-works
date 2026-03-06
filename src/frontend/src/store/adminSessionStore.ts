import { create } from "zustand";
import { getAdminSession, resetAdminActor } from "../utils/adminActor";
import type { AdminSession } from "../utils/adminActor";

export type SessionStatus = "idle" | "loading" | "ready" | "error";

interface AdminSessionState {
  status: SessionStatus;
  session: AdminSession | null;
  error: string | null;
  /** Call once after PIN login to warm up the session. Idempotent. */
  initSession: () => Promise<void>;
  /** Call on logout — clears in-memory state and resets the actor singleton. */
  clearSession: () => void;
}

export const useAdminSessionStore = create<AdminSessionState>((set, get) => ({
  status: "idle",
  session: null,
  error: null,

  initSession: async () => {
    const current = get().status;
    // Avoid duplicate requests — loading or already ready
    if (current === "loading" || current === "ready") return;

    set({ status: "loading", error: null });

    try {
      const session = await getAdminSession();
      set({ status: "ready", session, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[AdminSessionStore] Session init failed:", msg);
      set({ status: "error", session: null, error: msg });
    }
  },

  clearSession: () => {
    resetAdminActor();
    set({ status: "idle", session: null, error: null });
  },
}));
