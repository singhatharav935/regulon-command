/**
 * Supabase Safe-Query Utilities
 *
 * Detects non-critical Supabase errors (missing tables, RLS policy issues,
 * schema cache misses) and returns safe defaults instead of throwing.
 *
 * This avoids flooding the console with errors for tables that haven't been
 * created yet in the database while preserving real error propagation for
 * genuine query failures on existing tables.
 */

/** PostgREST error codes that indicate a missing or inaccessible table/view */
const NON_CRITICAL_PATTERNS = [
  'Could not find the table',
  'Could not find the view',
  'schema cache',
  'relation',
  'does not exist',
  'infinite recursion detected in policy',
  'PGRST204',
  'PGRST116',
  '42P01', // PostgreSQL: undefined_table
];

/**
 * Returns true when a Supabase/PostgREST error is caused by infrastructure
 * that is not yet provisioned (missing table, view, or RLS policy issue).
 * These errors should NOT crash the UI — the feature simply isn't available yet.
 */
export function isNonCriticalError(error: { message?: string; code?: string; details?: string } | null | undefined): boolean {
  if (!error) return false;
  const haystack = `${error.message ?? ''} ${error.code ?? ''} ${error.details ?? ''}`.toLowerCase();
  return NON_CRITICAL_PATTERNS.some(p => haystack.includes(p.toLowerCase()));
}

/**
 * Wraps a Supabase error check: if the error is non-critical (missing table, etc.),
 * returns the provided fallback value silently. Otherwise throws normally.
 *
 * Usage in service functions:
 *   const { data, error } = await supabase.from('my_table').select('*')...;
 *   if (error) return handleServiceError(error, []);
 *   return data ?? [];
 */
export function handleServiceError<T>(error: { message?: string; code?: string; details?: string }, fallback: T): T {
  if (isNonCriticalError(error)) {
    // Silent — table/view not provisioned yet, feature unavailable
    return fallback;
  }
  throw new Error(error.message ?? 'Unknown Supabase error');
}
