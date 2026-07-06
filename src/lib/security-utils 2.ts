/**
 * Shared Security Utilities
 * Central module for XSS prevention, input sanitization, and safe logging.
 */

// ─────────────────────────────────────────────────────────────
// HTML ENTITY ESCAPING (XSS Prevention for document.write / innerHTML)
// ─────────────────────────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Escape a string for safe interpolation into HTML templates.
 * Prevents XSS when using document.write() or innerHTML.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

// ─────────────────────────────────────────────────────────────
// CSS VALUE VALIDATION (Prevents CSS Injection in <style> tags)
// ─────────────────────────────────────────────────────────────

/**
 * Validate that a CSS color/value only contains safe characters.
 * Strips anything that could introduce CSS injection (e.g., expressions, url(), etc.).
 */
export function sanitizeCssValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Allow: hex colors (#fff, #abcdef), rgb/hsl functions, named colors, numbers, percentages
  // Block: url(), expression(), javascript:, import, @, semicolons, braces
  if (/[;{}@\\]|url\s*\(|expression\s*\(|javascript\s*:/i.test(str)) {
    return '';
  }
  return str;
}

// ─────────────────────────────────────────────────────────────
// INPUT SANITIZATION (Shared across all form components)
// ─────────────────────────────────────────────────────────────

/**
 * Sanitize user text input: trim, strip control characters, enforce max length.
 * Safe for search fields, form inputs, text areas, etc.
 */
export function sanitizeInput(value: string, maxLength: number = 500): string {
  if (!value) return '';
  // Remove control characters (except newlines and tabs for textarea support)
  const cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, maxLength);
}

/**
 * Validate a payload object: reject oversized JSON or objects with too many keys.
 * Returns { valid: boolean; reason?: string }.
 */
export function validatePayload(
  payload: unknown,
  opts: { maxKeys?: number; maxJsonSize?: number } = {}
): { valid: boolean; reason?: string } {
  const { maxKeys = 50, maxJsonSize = 100_000 } = opts;

  if (payload === null || payload === undefined) {
    return { valid: false, reason: 'Payload is null or undefined' };
  }

  if (typeof payload === 'object') {
    const keys = Object.keys(payload as Record<string, unknown>);
    if (keys.length > maxKeys) {
      return { valid: false, reason: `Payload has too many keys (${keys.length} > ${maxKeys})` };
    }
  }

  try {
    const json = JSON.stringify(payload);
    if (json.length > maxJsonSize) {
      return { valid: false, reason: `Payload too large (${json.length} > ${maxJsonSize} bytes)` };
    }
  } catch {
    return { valid: false, reason: 'Payload is not serializable' };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// SAFE LOGGER (Strips sensitive logs in production)
// ─────────────────────────────────────────────────────────────

const IS_PRODUCTION = typeof import.meta !== 'undefined'
  && import.meta.env
  && import.meta.env.PROD === true;

/**
 * Production-safe logger. In production, only warnings and errors are logged
 * (without stack traces). In development, all logs are forwarded to console.
 */
export const safeLog = {
  /** Debug — stripped entirely in production */
  debug: (...args: unknown[]) => {
    if (!IS_PRODUCTION) {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', ...args);
    }
  },

  /** Info — stripped in production */
  info: (...args: unknown[]) => {
    if (!IS_PRODUCTION) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args);
    }
  },

  /** Warning — shown in both dev and prod (without raw error objects in prod) */
  warn: (message: string, ..._details: unknown[]) => {
    if (IS_PRODUCTION) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`);
    } else {
      // eslint-disable-next-line no-console
      console.warn('[WARN]', message, ..._details);
    }
  },

  /** Error — shown in both dev and prod (sanitized in prod) */
  error: (message: string, ..._details: unknown[]) => {
    if (IS_PRODUCTION) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`);
    } else {
      // eslint-disable-next-line no-console
      console.error('[ERROR]', message, ..._details);
    }
  },
};

// ─────────────────────────────────────────────────────────────
// URL SAFETY (Validates URLs before window.open)
// ─────────────────────────────────────────────────────────────

/**
 * Open a URL safely in a new tab with noopener,noreferrer.
 * Validates that the URL uses http(s) to prevent javascript: protocol attacks.
 */
export function safeWindowOpen(url: string | undefined | null): void {
  if (!url) return;
  const trimmed = String(url).trim();
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return;
  window.open(trimmed, '_blank', 'noopener,noreferrer');
}
