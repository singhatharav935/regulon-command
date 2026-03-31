import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      resend: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
    },
  },
}));

// Mock rate-limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ isLimited: false, retryAfterFormatted: "" })),
  recordAttempt: vi.fn(() => ({ isBlocked: false, blockedUntilFormatted: "" })),
  clearRateLimit: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import {
  sendPasswordResetEmail,
  resendVerificationEmail,
  updatePassword,
  signOut,
  checkEmailVerified,
} from "./email-service";

describe("email-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email successfully", async () => {
      (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const result = await sendPasswordResetEmail("test@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toContain("Password reset email sent");
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("/auth/reset-password") })
      );
    });

    it("should return error when rate limited", async () => {
      (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
        isLimited: true,
        retryAfterFormatted: "5 minutes",
      });

      const result = await sendPasswordResetEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("RATE_LIMITED");
    });

    it("should return error when supabase fails", async () => {
      (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
        isLimited: false,
        retryAfterFormatted: "",
      });
      (recordAttempt as ReturnType<typeof vi.fn>).mockReturnValue({
        isBlocked: false,
        blockedUntilFormatted: "",
      });
      (supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      });

      const result = await sendPasswordResetEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.message).toBe("User not found");
    });
  });

  describe("resendVerificationEmail", () => {
    it("should resend verification email successfully", async () => {
      (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
        isLimited: false,
        retryAfterFormatted: "",
      });
      (recordAttempt as ReturnType<typeof vi.fn>).mockReturnValue({
        isBlocked: false,
        blockedUntilFormatted: "",
      });
      (supabase.auth.resend as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const result = await resendVerificationEmail("test@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toContain("Verification email sent");
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      (supabase.auth.updateUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const result = await updatePassword("newPassword123");

      expect(result.success).toBe(true);
      expect(result.message).toContain("Password updated");
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "newPassword123" });
    });

    it("should return error on failure", async () => {
      (supabase.auth.updateUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: "Weak password" },
      });

      const result = await updatePassword("weak");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Weak password");
    });
  });

  describe("signOut", () => {
    it("should sign out successfully", async () => {
      (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(result.message).toContain("Signed out");
    });
  });

  describe("checkEmailVerified", () => {
    it("should return true when email is confirmed", async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: { email_confirmed_at: "2024-01-01T00:00:00Z" } },
      });

      const result = await checkEmailVerified();

      expect(result).toBe(true);
    });

    it("should return false when email is not confirmed", async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: { email_confirmed_at: null } },
      });

      const result = await checkEmailVerified();

      expect(result).toBe(false);
    });
  });
});
