import { describe, expect, it } from "vitest";
import { normalizeLandingLead } from "./landing-contract";

describe("landing-contract", () => {
  it("normalizes and validates lead input", () => {
    const out = normalizeLandingLead({
      name: "  Test User ",
      email: "USER@EXAMPLE.COM ",
      inquiryType: "expert",
      source: "homepage-cta",
    });
    expect(out.email).toBe("user@example.com");
    expect(out.name).toBe("Test User");
    expect(out.inquiry_type).toBe("expert");
  });

  it("falls back to general inquiry type", () => {
    const out = normalizeLandingLead({
      email: "hello@example.com",
      inquiryType: "unsupported-value",
    });
    expect(out.inquiry_type).toBe("general");
  });

  it("rejects missing/invalid email", () => {
    expect(() => normalizeLandingLead({ email: "invalid" })).toThrow("email is required and must be valid");
    expect(() => normalizeLandingLead({})).toThrow("email is required and must be valid");
  });
});
