import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "../index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// ─── Token Bootstrap ──────────────────────────────────────────────────────────
// Capture caffeineAdminToken from the URL into sessionStorage BEFORE React
// renders. This ensures the token is always available when the admin actor
// initialises, regardless of navigation or timing.
(function bootstrapAdminToken() {
  const TOKEN_KEY = "vew_caffeine_admin_token";
  try {
    // Already persisted from a previous visit
    if (sessionStorage.getItem(TOKEN_KEY)) return;

    // Check URL hash fragment: #caffeineAdminToken=...
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const fromHash = hashParams.get("caffeineAdminToken");
      if (fromHash) {
        sessionStorage.setItem(TOKEN_KEY, fromHash);
        return;
      }
    }

    // Check query string: ?caffeineAdminToken=...
    const qsParams = new URLSearchParams(window.location.search);
    const fromQs = qsParams.get("caffeineAdminToken");
    if (fromQs) {
      sessionStorage.setItem(TOKEN_KEY, fromQs);
    }
  } catch {
    // sessionStorage unavailable (e.g. private browsing restriction) — ignore
  }
})();
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
