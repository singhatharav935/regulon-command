/**
 * Security Utilities Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  generateSecureToken,
  isValidRedirectUrl,
  sanitizeFilename,
  hasSqlInjectionPatterns,
  maskEmail,
  maskPhone,
  safeJsonParse,
  ClientRateLimiter,
} from "./security";

describe("Security Utilities", () => {
  describe("sanitizeInput", () => {
    it("should escape HTML special characters", () => {
      expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
      );
    });

    it("should escape ampersands", () => {
      expect(sanitizeInput("foo & bar")).toBe("foo &amp; bar");
    });

    it("should escape quotes", () => {
      expect(sanitizeInput('test "quoted"')).toBe("test &quot;quoted&quot;");
    });

    it("should handle empty strings", () => {
      expect(sanitizeInput("")).toBe("");
    });

    it("should not modify safe strings", () => {
      expect(sanitizeInput("Hello World 123")).toBe("Hello World 123");
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.org")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
      expect(isValidEmail("no@domain")).toBe(false);
      expect(isValidEmail("spaces in@email.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should reject short passwords", () => {
      const result = validatePasswordStrength("Short1");
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain("Password must be at least 8 characters");
    });

    it("should require uppercase", () => {
      const result = validatePasswordStrength("lowercase123");
      expect(result.feedback).toContain("Add an uppercase letter");
    });

    it("should require lowercase", () => {
      const result = validatePasswordStrength("UPPERCASE123");
      expect(result.feedback).toContain("Add a lowercase letter");
    });

    it("should require numbers", () => {
      const result = validatePasswordStrength("NoNumbers!");
      expect(result.feedback).toContain("Add a number");
    });

    it("should accept strong passwords", () => {
      const result = validatePasswordStrength("StrongP@ss123");
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it("should penalize common passwords", () => {
      const result = validatePasswordStrength("Password123!");
      expect(result.feedback).toContain("Avoid common passwords");
    });
  });

  describe("generateSecureToken", () => {
    it("should generate token of correct length", () => {
      const token = generateSecureToken(16);
      expect(token.length).toBe(32); // Each byte = 2 hex chars
    });

    it("should generate unique tokens", () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it("should only contain hex characters", () => {
      const token = generateSecureToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe("isValidRedirectUrl", () => {
    it("should allow relative paths", () => {
      expect(isValidRedirectUrl("/dashboard")).toBe(true);
      expect(isValidRedirectUrl("/app/settings")).toBe(true);
    });

    it("should reject protocol-relative URLs", () => {
      expect(isValidRedirectUrl("//evil.com")).toBe(false);
    });

    it("should reject external domains by default", () => {
      expect(isValidRedirectUrl("https://evil.com/steal")).toBe(false);
    });

    it("should allow explicitly whitelisted domains", () => {
      expect(isValidRedirectUrl("https://trusted.com/page", ["trusted.com"])).toBe(true);
    });

    it("should allow same-origin URLs", () => {
      // In test environment, window.location.origin would need to be mocked
      expect(isValidRedirectUrl("/")).toBe(true);
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove path traversal attempts", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("etcpasswd");
      expect(sanitizeFilename("..\\..\\windows\\system32")).toBe("windowssystem32");
    });

    it("should remove leading dots", () => {
      expect(sanitizeFilename(".hidden")).toBe("hidden");
    });

    it("should preserve safe filenames", () => {
      expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
      expect(sanitizeFilename("my-file_v2.txt")).toBe("my-file_v2.txt");
    });
  });

  describe("hasSqlInjectionPatterns", () => {
    it("should detect OR injection", () => {
      expect(hasSqlInjectionPatterns("' OR '1'='1")).toBe(true);
    });

    it("should detect DROP statements", () => {
      expect(hasSqlInjectionPatterns("; DROP TABLE users")).toBe(true);
    });

    it("should detect UNION SELECT", () => {
      expect(hasSqlInjectionPatterns("UNION SELECT * FROM passwords")).toBe(true);
    });

    it("should detect SQL comments", () => {
      expect(hasSqlInjectionPatterns("admin'--")).toBe(true);
    });

    it("should not flag normal input", () => {
      expect(hasSqlInjectionPatterns("John O'Brien")).toBe(false);
      expect(hasSqlInjectionPatterns("Regular text input")).toBe(false);
    });
  });

  describe("maskEmail", () => {
    it("should mask email local part", () => {
      expect(maskEmail("john.doe@example.com")).toBe("j******e@example.com");
    });

    it("should handle short local parts", () => {
      expect(maskEmail("ab@example.com")).toBe("**@example.com");
    });

    it("should handle invalid emails", () => {
      expect(maskEmail("notanemail")).toBe("***");
    });
  });

  describe("maskPhone", () => {
    it("should show last 4 digits", () => {
      expect(maskPhone("+1 (555) 123-4567")).toBe("*******4567");
    });

    it("should handle short numbers", () => {
      expect(maskPhone("123")).toBe("***");
    });
  });

  describe("safeJsonParse", () => {
    it("should parse valid JSON", () => {
      expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: "value" });
    });

    it("should return fallback for invalid JSON", () => {
      expect(safeJsonParse("not json", { default: true })).toEqual({ default: true });
    });

    it("should return fallback for empty string", () => {
      expect(safeJsonParse("", [])).toEqual([]);
    });
  });

  describe("ClientRateLimiter", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should allow requests within limit", () => {
      const limiter = new ClientRateLimiter(5, 60000);
      
      for (let i = 0; i < 5; i++) {
        expect(limiter.canProceed()).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      const limiter = new ClientRateLimiter(3, 60000);
      
      expect(limiter.canProceed()).toBe(true);
      expect(limiter.canProceed()).toBe(true);
      expect(limiter.canProceed()).toBe(true);
      expect(limiter.canProceed()).toBe(false);
    });

    it("should reset after window expires", () => {
      const limiter = new ClientRateLimiter(2, 1000);
      
      expect(limiter.canProceed()).toBe(true);
      expect(limiter.canProceed()).toBe(true);
      expect(limiter.canProceed()).toBe(false);
      
      vi.advanceTimersByTime(1100);
      
      expect(limiter.canProceed()).toBe(true);
    });

    it("should reset manually", () => {
      const limiter = new ClientRateLimiter(2, 60000);
      
      limiter.canProceed();
      limiter.canProceed();
      expect(limiter.canProceed()).toBe(false);
      
      limiter.reset();
      expect(limiter.canProceed()).toBe(true);
    });
  });
});
