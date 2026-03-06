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

// ─── Admin Token Bootstrap ────────────────────────────────────────────────────
// MUST run before ReactDOM.createRoot() so the token is in sessionStorage
// before any React component or hook tries to read it.
//
// Caffeine injects caffeineAdminToken once — in the URL of the admin link.
// After any Google OAuth redirect (or a page refresh from a clean URL) the
// token is gone from the URL.  Capturing it here, at the very first line of
// JS execution, guarantees it survives all subsequent navigation.
(function bootstrapAdminToken() {
  const STORAGE_KEY = "vew_caffeine_admin_token";
  try {
    // Already saved from a previous page load — nothing to do.
    if (sessionStorage.getItem(STORAGE_KEY)) {
      console.info(
        "[TokenBootstrap] caffeineAdminToken already in sessionStorage. ✓",
      );
      return;
    }

    let token: string | null = null;
    let source = "";

    // 1. URL query string  (?caffeineAdminToken=...)
    try {
      const qs = new URLSearchParams(window.location.search);
      const t = qs.get("caffeineAdminToken");
      if (t) {
        token = t;
        source = "URL query string";
      }
    } catch {
      /* ignore */
    }

    // 2. URL hash fragment  (#caffeineAdminToken=...)
    if (!token) {
      try {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const hashContent = hash.substring(1);
          // Try plain hash params first
          const rawHash = new URLSearchParams(hashContent);
          const t = rawHash.get("caffeineAdminToken");
          if (t) {
            token = t;
            source = "URL hash fragment";
          } else {
            // Try hash that contains its own query string (...#...?caffeineAdminToken=...)
            const qIdx = hashContent.indexOf("?");
            if (qIdx !== -1) {
              const hashQs = new URLSearchParams(
                hashContent.substring(qIdx + 1),
              );
              const t2 = hashQs.get("caffeineAdminToken");
              if (t2) {
                token = t2;
                source = "URL hash query string";
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token);
      console.info(
        `[TokenBootstrap] caffeineAdminToken captured from ${source} and saved to sessionStorage. ✓`,
        { tokenLength: token.length },
      );
    } else {
      console.warn(
        "[TokenBootstrap] caffeineAdminToken NOT found in URL. " +
          "App will run in anonymous mode for ICP writes. " +
          "Open via the Caffeine admin link to restore full access.",
        {
          search: window.location.search.substring(0, 100),
          hash: window.location.hash.substring(0, 60),
        },
      );
    }
  } catch (e) {
    console.error(
      "[TokenBootstrap] Unexpected error during token bootstrap:",
      e,
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
