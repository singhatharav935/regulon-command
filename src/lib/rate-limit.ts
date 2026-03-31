/**
 * Rate Limiting Utility
 * 
 * Client-side rate limiting for security-sensitive operations
 * like login attempts, password resets, and OTP requests.
 * 
 * NOTE: This is client-side rate limiting and should be backed
 * by server-side rate limiting for production security.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

// Configuration for different operation types
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  otp: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  verification: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
};

type RateLimitOperation = keyof typeof RATE_LIMIT_CONFIG;

const STORAGE_KEY_PREFIX = 'regulon_rate_limit_';

function getStorageKey(operation: RateLimitOperation, identifier: string): string {
  return `${STORAGE_KEY_PREFIX}${operation}_${identifier}`;
}

function getEntry(operation: RateLimitOperation, identifier: string): RateLimitEntry | null {
  try {
    const key = getStorageKey(operation, identifier);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as RateLimitEntry;
  } catch {
    return null;
  }
}

function setEntry(operation: RateLimitOperation, identifier: string, entry: RateLimitEntry): void {
  try {
    const key = getStorageKey(operation, identifier);
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage might be full or disabled
  }
}

function clearEntry(operation: RateLimitOperation, identifier: string): void {
  try {
    const key = getStorageKey(operation, identifier);
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if an operation is rate limited
 * @returns Object with isLimited, remainingAttempts, and retryAfter (ms)
 */
export function checkRateLimit(
  operation: RateLimitOperation,
  identifier: string
): {
  isLimited: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
  retryAfterFormatted: string;
} {
  const config = RATE_LIMIT_CONFIG[operation];
  const now = Date.now();
  const entry = getEntry(operation, identifier);

  // No previous attempts
  if (!entry) {
    return {
      isLimited: false,
      remainingAttempts: config.maxAttempts,
      retryAfterMs: 0,
      retryAfterFormatted: '',
    };
  }

  // Check if blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const retryAfterMs = entry.blockedUntil - now;
    return {
      isLimited: true,
      remainingAttempts: 0,
      retryAfterMs,
      retryAfterFormatted: formatDuration(retryAfterMs),
    };
  }

  // Check if window has expired
  if (now - entry.firstAttempt > config.windowMs) {
    clearEntry(operation, identifier);
    return {
      isLimited: false,
      remainingAttempts: config.maxAttempts,
      retryAfterMs: 0,
      retryAfterFormatted: '',
    };
  }

  // Within window, check attempts
  const remainingAttempts = config.maxAttempts - entry.attempts;
  return {
    isLimited: remainingAttempts <= 0,
    remainingAttempts: Math.max(0, remainingAttempts),
    retryAfterMs: entry.blockedUntil ? entry.blockedUntil - now : 0,
    retryAfterFormatted: entry.blockedUntil ? formatDuration(entry.blockedUntil - now) : '',
  };
}

/**
 * Record an attempt for rate limiting
 * Call this when an operation is attempted (before checking success/failure)
 */
export function recordAttempt(
  operation: RateLimitOperation,
  identifier: string
): {
  isBlocked: boolean;
  remainingAttempts: number;
  blockedUntilFormatted: string;
} {
  const config = RATE_LIMIT_CONFIG[operation];
  const now = Date.now();
  let entry = getEntry(operation, identifier);

  // Initialize or reset if window expired
  if (!entry || now - entry.firstAttempt > config.windowMs) {
    entry = {
      attempts: 1,
      firstAttempt: now,
      blockedUntil: null,
    };
    setEntry(operation, identifier, entry);
    return {
      isBlocked: false,
      remainingAttempts: config.maxAttempts - 1,
      blockedUntilFormatted: '',
    };
  }

  // Increment attempts
  entry.attempts += 1;

  // Check if should block
  if (entry.attempts >= config.maxAttempts) {
    entry.blockedUntil = now + config.blockDurationMs;
    setEntry(operation, identifier, entry);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      blockedUntilFormatted: formatDuration(config.blockDurationMs),
    };
  }

  setEntry(operation, identifier, entry);
  return {
    isBlocked: false,
    remainingAttempts: config.maxAttempts - entry.attempts,
    blockedUntilFormatted: '',
  };
}

/**
 * Clear rate limit on successful operation
 * Call this when the operation succeeds (e.g., successful login)
 */
export function clearRateLimit(operation: RateLimitOperation, identifier: string): void {
  clearEntry(operation, identifier);
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(operation: RateLimitOperation, identifier: string) {
  const check = () => checkRateLimit(operation, identifier);
  const record = () => recordAttempt(operation, identifier);
  const clear = () => clearRateLimit(operation, identifier);

  return { check, record, clear };
}
