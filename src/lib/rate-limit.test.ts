import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  recordAttempt,
  clearRateLimit,
} from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should return not limited for new users", () => {
      const result = checkRateLimit("login", "test@example.com");
      
      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBe(5);
      expect(result.retryAfterMs).toBe(0);
    });

    it("should return remaining attempts after some attempts", () => {
      recordAttempt("login", "test@example.com");
      recordAttempt("login", "test@example.com");
      
      const result = checkRateLimit("login", "test@example.com");
      
      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBe(3);
    });

    it("should return limited after max attempts", () => {
      for (let i = 0; i < 5; i++) {
        recordAttempt("login", "test@example.com");
      }
      
      const result = checkRateLimit("login", "test@example.com");
      
      expect(result.isLimited).toBe(true);
      expect(result.remainingAttempts).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });
  });

  describe("recordAttempt", () => {
    it("should record first attempt correctly", () => {
      const result = recordAttempt("login", "test@example.com");
      
      expect(result.isBlocked).toBe(false);
      expect(result.remainingAttempts).toBe(4);
    });

    it("should block after max attempts", () => {
      for (let i = 0; i < 4; i++) {
        recordAttempt("login", "test@example.com");
      }
      
      const result = recordAttempt("login", "test@example.com");
      
      expect(result.isBlocked).toBe(true);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntilFormatted).toBeTruthy();
    });
  });

  describe("clearRateLimit", () => {
    it("should clear rate limit for a user", () => {
      // Record some attempts
      for (let i = 0; i < 3; i++) {
        recordAttempt("login", "test@example.com");
      }
      
      // Clear the limit
      clearRateLimit("login", "test@example.com");
      
      // Check it's cleared
      const result = checkRateLimit("login", "test@example.com");
      
      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe("different operation types", () => {
    it("should have different limits for passwordReset", () => {
      const result = checkRateLimit("passwordReset", "test@example.com");
      
      expect(result.remainingAttempts).toBe(3); // passwordReset has 3 max attempts
    });

    it("should have different limits for otp", () => {
      const result = checkRateLimit("otp", "test@example.com");
      
      expect(result.remainingAttempts).toBe(5); // otp has 5 max attempts
    });

    it("should track operations independently", () => {
      recordAttempt("login", "test@example.com");
      recordAttempt("login", "test@example.com");
      
      const loginResult = checkRateLimit("login", "test@example.com");
      const passwordResult = checkRateLimit("passwordReset", "test@example.com");
      
      expect(loginResult.remainingAttempts).toBe(3);
      expect(passwordResult.remainingAttempts).toBe(3); // Unaffected
    });
  });

  describe("window expiry", () => {
    it("should reset after window expires", () => {
      // Record attempts
      for (let i = 0; i < 4; i++) {
        recordAttempt("login", "test@example.com");
      }
      
      // Fast forward past the window (15 minutes for login)
      vi.advanceTimersByTime(16 * 60 * 1000);
      
      const result = checkRateLimit("login", "test@example.com");
      
      expect(result.isLimited).toBe(false);
      expect(result.remainingAttempts).toBe(5);
    });
  });
});
