/**
 * Email Service Utility
 * 
 * Handles all email-related functionality using Supabase's built-in email system
 * and optionally integrates with external providers (SendGrid/Resend) for production.
 * 
 * Supabase handles:
 * - Email verification on signup (automatic)
 * - Password reset emails (via supabase.auth.resetPasswordForEmail)
 * - Magic link authentication
 * 
 * This module provides:
 * - Helper functions for common email operations
 * - Rate limiting for email operations
 * - Email template configuration
 */

import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit, recordAttempt, clearRateLimit } from "@/lib/rate-limit";

export interface EmailResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<EmailResult> {
  // Check rate limit
  const rateLimitStatus = checkRateLimit('passwordReset', email);
  if (rateLimitStatus.isLimited) {
    return {
      success: false,
      message: `Too many requests. Please wait ${rateLimitStatus.retryAfterFormatted} before trying again.`,
      error: 'RATE_LIMITED',
    };
  }

  // Record attempt
  const attemptResult = recordAttempt('passwordReset', email);
  if (attemptResult.isBlocked) {
    return {
      success: false,
      message: `Too many attempts. Try again in ${attemptResult.blockedUntilFormatted}.`,
      error: 'RATE_LIMITED',
    };
  }

  try {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to send password reset email. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(email: string): Promise<EmailResult> {
  // Check rate limit
  const rateLimitStatus = checkRateLimit('verification', email);
  if (rateLimitStatus.isLimited) {
    return {
      success: false,
      message: `Too many requests. Please wait ${rateLimitStatus.retryAfterFormatted}.`,
      error: 'RATE_LIMITED',
    };
  }

  // Record attempt
  recordAttempt('verification', email);

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?mode=login`,
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to send verification email. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Update user password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<EmailResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to update password. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<EmailResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      message: 'Signed out successfully.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to sign out. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Check if email is verified
 */
export async function checkEmailVerified(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email_confirmed_at !== null;
  } catch {
    return false;
  }
}

/**
 * Send OTP to email (for 2FA or verification)
 */
export async function sendOTP(email: string): Promise<EmailResult> {
  // Check rate limit
  const rateLimitStatus = checkRateLimit('otp', email);
  if (rateLimitStatus.isLimited) {
    return {
      success: false,
      message: `Too many requests. Please wait ${rateLimitStatus.retryAfterFormatted}.`,
      error: 'RATE_LIMITED',
    };
  }

  // Record attempt
  recordAttempt('otp', email);

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Don't create new users, only existing
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR',
      };
    }

    return {
      success: true,
      message: 'OTP sent to your email.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(email: string, token: string): Promise<EmailResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR',
      };
    }

    // Clear rate limit on success
    clearRateLimit('otp', email);

    return {
      success: true,
      message: 'Email verified successfully.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}
