/**
 * Security Utilities
 * 
 * Common security functions for input validation, XSS prevention,
 * and other security measures.
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeInput(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return input.replace(/[&<>"'`=/]/g, (char) => map[char] || char);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional but recommended)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Password must be at least 8 characters");
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add an uppercase letter");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add a lowercase letter");
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add a number");
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'letmein', 'welcome', 'admin', 'login'
  ];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common passwords");
  }

  return {
    isValid: score >= 3 && password.length >= 8,
    score: Math.min(5, score),
    feedback,
  };
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256 (for non-sensitive data)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function isValidRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Only allow same-origin or explicitly allowed domains
    if (parsed.origin === window.location.origin) {
      return true;
    }

    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
    }

    return false;
  } catch {
    // Invalid URL - check if it's a relative path
    return url.startsWith('/') && !url.startsWith('//');
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and parent directory references
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '')
    .trim();
}

/**
 * Check for potential SQL injection patterns (for logging/alerting)
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /('|")\s*(or|and)\s*('|")/i,
    /;\s*(drop|delete|truncate|update|insert)/i,
    /union\s+(all\s+)?select/i,
    /--\s*$/,
    /\/\*.*\*\//,
  ];
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Content Security Policy nonce generator
 */
export function generateCSPNonce(): string {
  return generateSecureToken(16);
}

/**
 * Validate and sanitize JSON input
 */
export function safeJsonParse<T>(input: string, fallback: T): T {
  try {
    const parsed = JSON.parse(input);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Mask sensitive data (e.g., email, phone)
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***';
  
  const maskedLocal = localPart.length > 2 
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);
  
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

/**
 * Check if request is from a secure context
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:';
}

/**
 * Rate limiter for client-side operations.
 * Persists attempt timestamps in localStorage so limits survive page refreshes,
 * preventing trivial bypass by reloading the page.
 */
export class ClientRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly storageKey: string;

  /**
   * @param maxRequests Maximum allowed attempts within the window
   * @param windowMs   Sliding window duration in milliseconds
   * @param key        Unique localStorage key for this limiter instance
   */
  constructor(maxRequests: number = 10, windowMs: number = 60000, key?: string) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.storageKey = key || `sannidh_rl_${maxRequests}_${windowMs}`;
  }

  /** Read persisted timestamps (filter expired ones) */
  private getTimestamps(): number[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const all: number[] = JSON.parse(raw);
      const now = Date.now();
      return all.filter(t => now - t < this.windowMs);
    } catch {
      return [];
    }
  }

  /** Persist timestamps */
  private setTimestamps(ts: number[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(ts));
    } catch { /* storage full — degrade gracefully */ }
  }

  /**
   * Check if a new attempt is allowed. If yes, records the attempt.
   * @returns true if the attempt can proceed
   */
  canProceed(): boolean {
    const timestamps = this.getTimestamps();

    if (timestamps.length >= this.maxRequests) {
      // Still over limit after filtering — deny
      this.setTimestamps(timestamps); // persist the pruned list
      return false;
    }

    timestamps.push(Date.now());
    this.setTimestamps(timestamps);
    return true;
  }

  /** Number of attempts remaining before being rate-limited */
  getAttemptsRemaining(): number {
    return Math.max(0, this.maxRequests - this.getTimestamps().length);
  }

  /**
   * Milliseconds until the next attempt slot opens.
   * Returns 0 if attempts are available right now.
   */
  getRemainingWaitMs(): number {
    const timestamps = this.getTimestamps();
    if (timestamps.length < this.maxRequests) return 0;

    // Oldest timestamp in the window determines when a slot opens
    const oldest = Math.min(...timestamps);
    const waitMs = this.windowMs - (Date.now() - oldest);
    return Math.max(0, waitMs);
  }

  /** Human-readable remaining wait time (e.g. "2 min 30 sec") */
  getRemainingWaitFormatted(): string {
    const ms = this.getRemainingWaitMs();
    if (ms <= 0) return '';
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0 && sec > 0) return `${min} min ${sec} sec`;
    if (min > 0) return `${min} min`;
    return `${sec} sec`;
  }

  /** Clear all recorded attempts */
  reset(): void {
    try { localStorage.removeItem(this.storageKey); } catch {}
  }
}

/**
 * General-purpose API rate limiter (token-bucket style).
 * Limits the total number of Supabase REST calls per window to prevent
 * runaway queries from hammering the backend.
 */
export class GeneralApiRateLimiter {
  private static instance: GeneralApiRateLimiter | null = null;
  private callTimestamps: number[] = [];
  private readonly maxCalls: number;
  private readonly windowMs: number;

  constructor(maxCalls: number = 60, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  static getInstance(): GeneralApiRateLimiter {
    if (!GeneralApiRateLimiter.instance) {
      // 60 API calls per minute for general endpoints
      GeneralApiRateLimiter.instance = new GeneralApiRateLimiter(60, 60000);
    }
    return GeneralApiRateLimiter.instance;
  }

  /**
   * Check if an API call is allowed. Records the call if yes.
   * @returns true if the call can proceed
   */
  canProceed(): boolean {
    const now = Date.now();
    this.callTimestamps = this.callTimestamps.filter(t => now - t < this.windowMs);

    if (this.callTimestamps.length >= this.maxCalls) {
      return false;
    }

    this.callTimestamps.push(now);
    return true;
  }

  /** Milliseconds until the next call slot opens */
  getRemainingWaitMs(): number {
    const now = Date.now();
    this.callTimestamps = this.callTimestamps.filter(t => now - t < this.windowMs);
    if (this.callTimestamps.length < this.maxCalls) return 0;
    const oldest = Math.min(...this.callTimestamps);
    return Math.max(0, this.windowMs - (now - oldest));
  }
}
