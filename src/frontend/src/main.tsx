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
 * Bootstrap: capture caffeineAdminToken from the URL into sessionStorage
 * BEFORE React renders — this must run synchronously so the token survives
 * any OAuth redirect or hash-router navigation that strips the URL params.
 *
 * Priority order:
 *   1. URL query string (?caffeineAdminToken=...)  ← Caffeine injects here
 *   2. URL hash fragment  (#caffeineAdminToken=...)
 *   3. Already in sessionStorage (previously saved)
 */
(function bootstrapAdminToken() {
  const STORAGE_KEY = "vew_caffeine_admin_token";

  // Skip if already persisted
  if (sessionStorage.getItem(STORAGE_KEY)) {
    console.info(
      "[TokenBootstrap] Token already in sessionStorage — skipping URL scan.",
    );
    return;
  }

  // 1. Query string
  try {
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("caffeineAdminToken");
    if (fromQuery) {
      sessionStorage.setItem(STORAGE_KEY, fromQuery);
      console.info(
        "[TokenBootstrap] caffeineAdminToken captured from query string.",
      );
      return;
    }
  } catch (e) {
    console.warn("[TokenBootstrap] Could not parse query string:", e);
  }

  // 2. Hash fragment — handles both #caffeineAdminToken=... and #/?caffeineAdminToken=...
  try {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashContent = hash.substring(1); // strip leading #
      // Try raw hash params first: #key=val
      const rawHash = new URLSearchParams(hashContent);
      const fromRawHash = rawHash.get("caffeineAdminToken");
      if (fromRawHash) {
        sessionStorage.setItem(STORAGE_KEY, fromRawHash);
        console.info(
          "[TokenBootstrap] caffeineAdminToken captured from raw hash.",
        );
        return;
      }
      // Try query-within-hash: #/route?key=val
      const qIdx = hashContent.indexOf("?");
      if (qIdx !== -1) {
        const hashQs = new URLSearchParams(hashContent.substring(qIdx + 1));
        const fromHashQs = hashQs.get("caffeineAdminToken");
        if (fromHashQs) {
          sessionStorage.setItem(STORAGE_KEY, fromHashQs);
          console.info(
            "[TokenBootstrap] caffeineAdminToken captured from hash query string.",
          );
          return;
        }
      }
    }
  } catch (e) {
    console.warn("[TokenBootstrap] Could not parse hash fragment:", e);
  }

  console.warn(
    "[TokenBootstrap] caffeineAdminToken NOT found in URL. " +
      "ICP write operations will use anonymous mode. " +
      "Open the app via the Caffeine admin link to restore full access.",
    {
      search: window.location.search.substring(0, 120),
      hash: window.location.hash.substring(0, 80),
    },
  );
})();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
