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

// ─── Admin Token Bootstrap ─────────────────────────────────────────────────────
// CRITICAL: This runs synchronously before React renders and before any OAuth
// redirect can strip the caffeineAdminToken from the URL.
//
// Caffeine injects the admin token as a URL query parameter on the admin link.
// When a Google OAuth login redirects the browser back to the app, the token
// is gone from the URL. By saving it here — at the very first line of JS
// execution — we ensure it is always in sessionStorage for adminActor.ts to
// find, regardless of subsequent navigation or OAuth round-trips.
(function bootstrapAdminToken() {
  const TOKEN_KEY = "vew_caffeine_admin_token";
  try {
    // Already saved — nothing to do
    if (sessionStorage.getItem(TOKEN_KEY)) {
      console.info(
        "[TokenBootstrap] caffeineAdminToken already in sessionStorage ✅",
      );
      return;
    }

    // Check URL query string (?caffeineAdminToken=...)
    const searchParams = new URLSearchParams(window.location.search);
    const fromQuery = searchParams.get("caffeineAdminToken");
    if (fromQuery) {
      sessionStorage.setItem(TOKEN_KEY, fromQuery);
      console.info(
        "[TokenBootstrap] caffeineAdminToken captured from URL query string → saved to sessionStorage ✅",
      );
      return;
    }

    // Check URL hash fragment (#caffeineAdminToken=... or #/?caffeineAdminToken=...)
    const hashStr = window.location.hash.replace(/^#\/?/, "");
    const hashParams = new URLSearchParams(hashStr);
    const fromHash = hashParams.get("caffeineAdminToken");
    if (fromHash) {
      sessionStorage.setItem(TOKEN_KEY, fromHash);
      console.info(
        "[TokenBootstrap] caffeineAdminToken captured from URL hash → saved to sessionStorage ✅",
      );
      return;
    }

    console.info(
      "[TokenBootstrap] caffeineAdminToken not found in URL (may already be in sessionStorage or not an admin session).",
    );
  } catch (e) {
    console.warn("[TokenBootstrap] Failed to bootstrap admin token:", e);
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
