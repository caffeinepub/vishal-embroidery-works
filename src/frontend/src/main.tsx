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
 * CRITICAL: Bootstrap the admin token BEFORE React renders.
 *
 * Why this must run first:
 *   Caffeine injects `caffeineAdminToken` into the URL as a query string param
 *   (?caffeineAdminToken=...) when the admin link is opened. After a Google
 *   OAuth redirect, the browser lands on a clean URL — the token is gone from
 *   the URL. If we don't capture it to sessionStorage on the very first load
 *   (before React renders, before any redirect), the token is permanently lost
 *   and every canister call requiring admin auth will fail with "Unauthorized".
 *
 * Token storage key must match the key used in adminActor.ts (TOKEN_STORAGE_KEY).
 */
const TOKEN_STORAGE_KEY = "vew_caffeine_admin_token";

(function bootstrapAdminToken() {
  try {
    // Check if we already have a token stored (post-redirect recovery)
    const existing = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (existing) {
      console.info(
        "[TokenBootstrap] caffeineAdminToken already in sessionStorage — no action needed.",
      );
      return;
    }

    // Primary: check the URL query string (?caffeineAdminToken=...)
    // This is how Caffeine injects the token on the initial admin link open.
    const queryParams = new URLSearchParams(window.location.search);
    const fromQuery = queryParams.get("caffeineAdminToken");
    if (fromQuery) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, fromQuery);
      console.info(
        "[TokenBootstrap] ✅ caffeineAdminToken captured from URL query string and saved to sessionStorage.",
        { tokenLength: fromQuery.length },
      );
      return;
    }

    // Fallback: check the URL hash fragment
    // Some older Caffeine deployments or hash-router setups inject via hash.
    // Check both bare #caffeineAdminToken=... and #/?caffeineAdminToken=...
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      // Try bare hash params: #caffeineAdminToken=...
      const bareHashParams = new URLSearchParams(hash.substring(1));
      const fromBareHash = bareHashParams.get("caffeineAdminToken");
      if (fromBareHash) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, fromBareHash);
        console.info(
          "[TokenBootstrap] ✅ caffeineAdminToken captured from URL hash (bare) and saved to sessionStorage.",
          { tokenLength: fromBareHash.length },
        );
        return;
      }

      // Try hash-router format: #/?caffeineAdminToken=... or #/path?caffeineAdminToken=...
      const queryIndex = hash.indexOf("?");
      if (queryIndex !== -1) {
        const hashQueryParams = new URLSearchParams(
          hash.substring(queryIndex + 1),
        );
        const fromHashQuery = hashQueryParams.get("caffeineAdminToken");
        if (fromHashQuery) {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, fromHashQuery);
          console.info(
            "[TokenBootstrap] ✅ caffeineAdminToken captured from URL hash query and saved to sessionStorage.",
            { tokenLength: fromHashQuery.length },
          );
          return;
        }
      }
    }

    // Token not found — this is expected on the customer-facing URL.
    // Admin must open the app via the Caffeine admin link.
    console.info(
      `[TokenBootstrap] caffeineAdminToken not found in URL. Admin features require opening the app via the Caffeine admin link. Current URL search: ${window.location.search.substring(0, 60)}`,
    );
  } catch (err) {
    // Never let bootstrap errors crash the app
    console.error(
      "[TokenBootstrap] Unexpected error during token bootstrap:",
      err,
    );
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
