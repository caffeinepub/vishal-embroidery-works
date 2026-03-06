/**
 * Utility functions for parsing and managing URL parameters
 * Works with both hash-based and browser-based routing
 */

/**
 * Extracts a URL parameter from the current URL
 * Works with both query strings (?param=value) and hash-based routing (#/?param=value)
 *
 * @param paramName - The name of the parameter to extract
 * @returns The parameter value if found, null otherwise
 */
export function getUrlParameter(paramName: string): string | null {
  // Try to get from regular query string first
  const urlParams = new URLSearchParams(window.location.search);
  const regularParam = urlParams.get(paramName);

  if (regularParam !== null) {
    return regularParam;
  }

  // If not found, try to extract from hash (for hash-based routing)
  const hash = window.location.hash;
  const queryStartIndex = hash.indexOf("?");

  if (queryStartIndex !== -1) {
    const hashQuery = hash.substring(queryStartIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    return hashParams.get(paramName);
  }

  return null;
}

/**
 * Stores a parameter in sessionStorage for persistence across navigation
 * Useful for maintaining state like admin tokens throughout the session
 *
 * @param key - The key to store the value under
 * @param value - The value to store
 */
export function storeSessionParameter(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to store session parameter ${key}:`, error);
  }
}

/**
 * Retrieves a parameter from sessionStorage
 *
 * @param key - The key to retrieve
 * @returns The stored value if found, null otherwise
 */
export function getSessionParameter(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to retrieve session parameter ${key}:`, error);
    return null;
  }
}

/**
 * Gets a parameter from URL or sessionStorage (URL takes precedence)
 * If found in URL, also stores it in sessionStorage for future use
 *
 * @param paramName - The name of the parameter to retrieve
 * @param storageKey - Optional custom storage key (defaults to paramName)
 * @returns The parameter value if found, null otherwise
 */
export function getPersistedUrlParameter(
  paramName: string,
  storageKey?: string,
): string | null {
  const key = storageKey || paramName;

  // Check URL first
  const urlValue = getUrlParameter(paramName);
  if (urlValue !== null) {
    // Store in session for persistence
    storeSessionParameter(key, urlValue);
    return urlValue;
  }

  // Fall back to session storage
  return getSessionParameter(key);
}

/**
 * Removes a parameter from sessionStorage
 *
 * @param key - The key to remove
 */
export function clearSessionParameter(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to clear session parameter ${key}:`, error);
  }
}

/**
 * Removes a specific parameter from the URL hash without reloading the page
 * Preserves route information and other parameters in the hash
 * Used to remove sensitive data from the address bar after extracting it
 *
 * @param paramName - The parameter to remove from the hash
 *
 * @example
 * // URL: https://app.com/#/dashboard?caffeineAdminToken=xxx&other=value
 * // After clearParamFromHash('caffeineAdminToken')
 * // URL: https://app.com/#/dashboard?other=value
 */
function clearParamFromHash(paramName: string): void {
  if (!window.history.replaceState) {
    return;
  }

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return;
  }

  // Remove the leading #
  const hashContent = hash.substring(1);

  // Split route path from query string
  const queryStartIndex = hashContent.indexOf("?");

  if (queryStartIndex === -1) {
    // No query string in hash, nothing to remove
    return;
  }

  const routePath = hashContent.substring(0, queryStartIndex);
  const queryString = hashContent.substring(queryStartIndex + 1);

  // Parse and remove the specific parameter
  const params = new URLSearchParams(queryString);
  params.delete(paramName);

  // Reconstruct the URL
  const newQueryString = params.toString();
  let newHash = routePath;

  if (newQueryString) {
    newHash += `?${newQueryString}`;
  }

  // If we still have content in the hash, keep it; otherwise remove the hash entirely
  const newUrl =
    window.location.pathname +
    window.location.search +
    (newHash ? `#${newHash}` : "");
  window.history.replaceState(null, "", newUrl);
}

/**
 * Gets a secret from the URL — checks BOTH query string and hash fragment.
 *
 * IMPORTANT: Caffeine injects `caffeineAdminToken` as a QUERY STRING parameter
 * (?caffeineAdminToken=...), NOT in the hash. Previous versions only checked the
 * hash, which caused the token to silently return null every time.
 *
 * Priority order:
 *  1. sessionStorage (post-redirect recovery)
 *  2. URL query string (?caffeineAdminToken=...) — Caffeine's injection method
 *  3. URL hash fragment (#caffeineAdminToken=...) — fallback for older deployments
 *
 * @param paramName - The name of the secret parameter
 * @returns The secret value if found (from session or URL), null otherwise
 */
export function getSecretFromHash(paramName: string): string | null {
  // 1. Check session first to avoid unnecessary URL manipulation
  const existingSecret = getSessionParameter(paramName);
  if (existingSecret !== null) {
    return existingSecret;
  }

  // 2. Try the URL query string (?paramName=...) — PRIMARY Caffeine injection method
  const queryParams = new URLSearchParams(window.location.search);
  const fromQuery = queryParams.get(paramName);
  if (fromQuery) {
    storeSessionParameter(paramName, fromQuery);
    return fromQuery;
  }

  // 3. Try to extract from hash fragment (#paramName=... or #/?paramName=...)
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return null;
  }

  // Try bare hash: #paramName=...
  const bareHashParams = new URLSearchParams(hash.substring(1));
  const fromBareHash = bareHashParams.get(paramName);
  if (fromBareHash) {
    storeSessionParameter(paramName, fromBareHash);
    clearParamFromHash(paramName);
    return fromBareHash;
  }

  // Try hash-router format: #/?paramName=... or #/path?paramName=...
  const queryIndex = hash.indexOf("?");
  if (queryIndex !== -1) {
    const hashQueryParams = new URLSearchParams(hash.substring(queryIndex + 1));
    const fromHashQuery = hashQueryParams.get(paramName);
    if (fromHashQuery) {
      storeSessionParameter(paramName, fromHashQuery);
      clearParamFromHash(paramName);
      return fromHashQuery;
    }
  }

  return null;
}

/**
 * Gets a secret parameter with fallback chain: query string -> hash -> sessionStorage
 * This is the recommended way to handle sensitive parameters like admin tokens.
 *
 * Works correctly with Caffeine's token injection which uses query string params.
 *
 * @param paramName - The name of the secret parameter
 * @returns The secret value if found, null otherwise
 */
export function getSecretParameter(paramName: string): string | null {
  return getSecretFromHash(paramName);
}
