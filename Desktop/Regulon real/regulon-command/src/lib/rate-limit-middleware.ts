/**
 * API Rate Limiting Middleware
 *
 * Provides a general-purpose query wrapper that enforces rate limits on all
 * Supabase REST API calls. This protects against:
 *  - Runaway polling loops that spam the backend
 *  - Automated scripts attempting bulk data extraction
 *  - Accidental infinite useEffect re-render loops
 *
 * Usage:
 *   import { rateLimitedQuery } from '@/lib/rate-limit-middleware';
 *
 *   // Wrap any async Supabase call:
 *   const data = await rateLimitedQuery(() =>
 *     supabase.from('table').select('*')
 *   );
 */

import { GeneralApiRateLimiter } from './security';

const apiLimiter = GeneralApiRateLimiter.getInstance();

export class RateLimitExceededError extends Error {
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    const sec = Math.ceil(retryAfterMs / 1000);
    super(`Rate limit exceeded. Too many requests — please wait ${sec} seconds before retrying.`);
    this.name = 'RateLimitExceededError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Wraps an async function with rate-limit enforcement.
 * If the rate limit is exceeded, throws a RateLimitExceededError
 * instead of executing the query.
 *
 * @param queryFn  The async function to execute (typically a Supabase query)
 * @returns        The result of queryFn
 * @throws         RateLimitExceededError if the call is rate-limited
 */
export async function rateLimitedQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  if (!apiLimiter.canProceed()) {
    const waitMs = apiLimiter.getRemainingWaitMs();
    throw new RateLimitExceededError(waitMs);
  }
  return queryFn();
}

/**
 * Non-throwing version: returns { data, error } shape.
 * If rate-limited, returns an error object instead of throwing.
 */
export async function safeRateLimitedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  if (!apiLimiter.canProceed()) {
    const waitMs = apiLimiter.getRemainingWaitMs();
    const sec = Math.ceil(waitMs / 1000);
    return {
      data: null,
      error: {
        message: `Rate limit exceeded. Please wait ${sec} seconds.`,
        code: '429',
        details: 'Client-side rate limit',
      },
    };
  }
  return queryFn();
}

/**
 * Endpoint-specific rate limiters for sensitive operations.
 * These are stricter than the general API limiter and are
 * persisted in localStorage to survive page refreshes.
 */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes */
  LOGIN: { max: 5, windowMs: 15 * 60 * 1000 },
  /** Registration: 3 attempts per 15 minutes */
  REGISTRATION: { max: 3, windowMs: 15 * 60 * 1000 },
  /** Password Reset: 3 attempts per 15 minutes */
  PASSWORD_RESET: { max: 3, windowMs: 15 * 60 * 1000 },
  /** General API: 60 calls per minute */
  GENERAL_API: { max: 60, windowMs: 60 * 1000 },
  /** Email verification resend: 2 per 5 minutes */
  EMAIL_RESEND: { max: 2, windowMs: 5 * 60 * 1000 },
} as const;
