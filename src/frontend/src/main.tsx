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
 * Token Bootstrap — runs BEFORE React renders.
 *
 * The `caffeineAdminToken` is injected once by Caffeine into the page URL
 * (?caffeineAdminToken=... or #caffeineAdminToken=...). After any redirect
 * (e.g. OAuth, page refresh) the URL is clean and the token is gone.
 *
 * This IIFE captures the token from the URL at the earliest possible moment
 * and persists it in sessionStorage so adminActor.ts can find it later,
 * even after OAuth redirects have stripped it from the URL.
 *
 * Must run synchronously before ReactDOM.createRoot() — do NOT move it.
 */
(function bootstrapAdminToken() {
  const TOKEN_KEY = "vew_caffeine_admin_token";
  try {
    // 1. Already in sessionStorage — nothing to do
    if (sessionStorage.getItem(TOKEN_KEY)) {
      console.info("[TokenBootstrap] Token already in sessionStorage.");
      return;
    }

    // 2. URL query string  (?caffeineAdminToken=...)
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("caffeineAdminToken");
    if (fromQuery) {
      sessionStorage.setItem(TOKEN_KEY, fromQuery);
      console.info("[TokenBootstrap] Token captured from URL query string.");
      return;
    }

    // 3. URL hash fragment  (#caffeineAdminToken=... or #/route?caffeineAdminToken=...)
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashContent = hash.substring(1);

      // Plain hash: #caffeineAdminToken=xxx
      const plainHash = new URLSearchParams(hashContent);
      const fromPlainHash = plainHash.get("caffeineAdminToken");
      if (fromPlainHash) {
        sessionStorage.setItem(TOKEN_KEY, fromPlainHash);
        console.info("[TokenBootstrap] Token captured from URL hash.");
        return;
      }

      // Hash with embedded query string: #/route?caffeineAdminToken=xxx
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

    console.warn(
      "[TokenBootstrap] caffeineAdminToken not found in URL or sessionStorage. " +
        "Open the app via the Caffeine admin link to restore full access.",
    );
  } catch (e) {
    // sessionStorage may be blocked in some private-browsing modes — safe to ignore
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
