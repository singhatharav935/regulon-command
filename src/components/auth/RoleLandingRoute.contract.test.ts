import { describe, expect, it } from "vitest";
import { resolveLandingPath } from "@/components/auth/RoleLandingRoute";

describe("RoleLandingRoute contract", () => {
  it("routes persona-based users to correct dashboards", () => {
    expect(resolveLandingPath({ persona: "admin", roles: [], metadataPersona: null })).toBe("/app/admin-dashboard");
    expect(resolveLandingPath({ persona: "in_house_lawyer", roles: [], metadataPersona: null })).toBe("/app/legal-dashboard");
    expect(resolveLandingPath({ persona: "external_ca", roles: [], metadataPersona: null })).toBe("/app/ca-dashboard");
    expect(resolveLandingPath({ persona: "ca_firm", roles: [], metadataPersona: null })).toBe("/dashboards/ca-firm");
    expect(resolveLandingPath({ persona: "company_owner", roles: [], metadataPersona: null })).toBe("/app/dashboard");
  });

  it("falls back to role-based routing when persona is missing", () => {
    expect(resolveLandingPath({ persona: null, roles: ["admin"], metadataPersona: null })).toBe("/app/admin-dashboard");
    expect(resolveLandingPath({ persona: null, roles: ["manager"], metadataPersona: null })).toBe("/app/ca-dashboard");
    expect(resolveLandingPath({ persona: null, roles: [], metadataPersona: null })).toBe("/app/dashboard");
  });
});
