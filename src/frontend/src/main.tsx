import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "../index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// ─── Bootstrap: capture caffeineAdminToken before React renders ───────────────
// This MUST run before ReactDOM.createRoot() so the token is in sessionStorage
// before any component mounts. The admin URL format is:
//   https://vishal-embroidery-works-c1l.caffeine.xyz/#caffeineAdminToken=<token>
// The hash fragment is the most secure injection point (not sent to servers).
(function bootstrapAdminToken() {
  const TOKEN_KEY = "vew_caffeine_admin_token";
  try {
    // Already stored from a previous load? Skip.
    if (sessionStorage.getItem(TOKEN_KEY)) {
      console.info("[TokenBootstrap] Token already in sessionStorage. ✓");
      return;
    }

    // 1. Check hash fragment: #caffeineAdminToken=...
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashContent = hash.substring(1); // remove leading #
      const hashParams = new URLSearchParams(hashContent);
      const tokenFromHash = hashParams.get("caffeineAdminToken");
      if (tokenFromHash) {
        sessionStorage.setItem(TOKEN_KEY, tokenFromHash);
        console.info(
          `[TokenBootstrap] Token captured from hash fragment (length=${tokenFromHash.length}). ✓`,
        );
        // Clean the token from the URL bar so it doesn't leak into history
        try {
          const cleanHash = hashContent.replace(
            /[?&]?caffeineAdminToken=[^&]*/,
            "",
          );
          window.history.replaceState(
            null,
            "",
            window.location.pathname +
              window.location.search +
              (cleanHash ? `#${cleanHash}` : ""),
          );
        } catch {
          // replaceState may fail in some iframes — not critical
        }
        return;
      }
    }

    // 2. Check query string: ?caffeineAdminToken=...
    const qs = new URLSearchParams(window.location.search);
    const tokenFromQs = qs.get("caffeineAdminToken");
    if (tokenFromQs) {
      sessionStorage.setItem(TOKEN_KEY, tokenFromQs);
      console.info(
        `[TokenBootstrap] Token captured from query string (length=${tokenFromQs.length}). ✓`,
      );
      return;
    }

    console.warn(
      "[TokenBootstrap] caffeineAdminToken not found in URL. " +
        "Admin ICP writes will use anonymous mode. " +
        "Open the app via: https://vishal-embroidery-works-c1l.caffeine.xyz/#caffeineAdminToken=<token>",
    );
  } catch (err) {
    console.warn("[TokenBootstrap] Error during token bootstrap:", err);
  }
})();

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
