/**
 * Utility stub for URL parameter extraction.
 * Not used in localStorage-only mode but required by protected hooks.
 */
export function getSecretParameter(_key: string): string | null {
  try {
    // Check URL hash
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const val = params.get(_key);
    if (val) return val;
    // Check sessionStorage
    return sessionStorage.getItem(_key);
  } catch {
    return null;
  }
}
