/**
 * UUID Validation Guard
 * 
 * Prevents non-UUID strings (e.g. 'ca-001') from reaching Supabase queries.
 * PostgreSQL rejects non-UUID values on UUID columns with:
 *   "invalid input syntax for type uuid"
 * 
 * Usage:
 *   if (!isValidUUID(caUserId)) return [];
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true only when the value is a properly formatted UUID v4 string.
 * Returns false for null, undefined, empty strings, and non-UUID identifiers
 * like 'ca-001', 'firm-001', 'inhouse-ca-001', etc.
 */
export function isValidUUID(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}
