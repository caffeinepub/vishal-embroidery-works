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
/**
 * bootstrapAdminToken — runs BEFORE React renders.
 *
 * The `caffeineAdminToken` is injected into the URL by Caffeine on the very
 * first admin page load.  Any navigation or OAuth redirect replaces the URL
 * with a clean one that no longer has the token.  We must capture it into
 * sessionStorage at the earliest possible moment — before ReactDOM.createRoot()
 * — so that adminActor.ts can read it after any redirect.
 *
 * Without this, every page load after a redirect finds no token, causing:
 *   • createActorWithConfig() to return without config
 *   • "Cannot read properties of undefined (reading 'config')" crash
 *   • "Authentication Status: Unauthorized" banner
 *   • All uploads and design saves to fail
 */
(function bootstrapAdminToken() {
  const TOKEN_KEY = "vew_caffeine_admin_token";
  try {
    // 1. Already stored from a previous load — nothing to do
    if (sessionStorage.getItem(TOKEN_KEY)) {
      console.info("[TokenBootstrap] Token already in sessionStorage.");
      return;
    }

    // 2. URL query string: ?caffeineAdminToken=...  (primary Caffeine injection point)
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("caffeineAdminToken");
    if (fromQuery) {
      sessionStorage.setItem(TOKEN_KEY, fromQuery);
      console.info("[TokenBootstrap] Token captured from URL query string.");
      return;
    }

    // 3. URL hash fragment: #caffeineAdminToken=...  (alternative injection)
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashContent = hash.substring(1);
      // Try plain hash params first: #caffeineAdminToken=...
      const hashParams = new URLSearchParams(hashContent);
      const fromHash = hashParams.get("caffeineAdminToken");
      if (fromHash) {
        sessionStorage.setItem(TOKEN_KEY, fromHash);
        console.info("[TokenBootstrap] Token captured from URL hash.");
        return;
      }
      // Also try hash + query string: #/path?caffeineAdminToken=...
      const qIdx = hashContent.indexOf("?");
      if (qIdx !== -1) {
        const hashQs = new URLSearchParams(hashContent.substring(qIdx + 1));
        const fromHashQs = hashQs.get("caffeineAdminToken");
        if (fromHashQs) {
          sessionStorage.setItem(TOKEN_KEY, fromHashQs);
          console.info(
            "[TokenBootstrap] Token captured from hash query string.",
          );
          return;
        }
      }
    }

    console.info(
      "[TokenBootstrap] Token not found in URL — anonymous mode. " +
        "Open the app via the Caffeine admin link to enable full admin access.",
    );
  } catch (e) {
    // sessionStorage blocked (private browsing) — fall through gracefully
    console.warn("[TokenBootstrap] Could not access sessionStorage:", e);
  }
})();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
