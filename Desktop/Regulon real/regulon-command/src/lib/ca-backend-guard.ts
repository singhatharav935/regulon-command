/**
 * CA Backend Availability Guard
 * 
 * Centralised check used by all CA dashboard components to decide whether
 * to fire real API requests or silently fall back to local/mock data.
 *
 * The backend is considered unavailable when VITE_CA_API_BASE_URL is not
 * set (defaults to the unreachable localhost:3001).
 */

/**
 * Returns `true` when a real CA backend URL has been configured via
 * the VITE_CA_API_BASE_URL environment variable.  When this returns
 * `false`, components should skip network requests entirely and use
 * local/fallback data instead.
 */
export function isCABackendConfigured(): boolean {
  const url = import.meta.env.VITE_CA_API_BASE_URL as string | undefined;
  // Only consider the backend "configured" if an explicit URL was provided
  // and it does NOT point to the default localhost placeholder.
  return Boolean(url && !url.includes('localhost:3001'));
}

/**
 * Resolved base URL for CA API calls.
 * Use this instead of repeating the env-var + fallback pattern everywhere.
 */
export function getCAAPIBaseURL(): string {
  return (import.meta.env.VITE_CA_API_BASE_URL as string);
}
