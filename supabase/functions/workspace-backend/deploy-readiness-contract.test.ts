import { describe, expect, it } from "vitest";
import { evaluateDeployReadiness } from "./deploy-readiness-contract";

describe("deploy-readiness-contract", () => {
  it("fails when required env or tables are missing", () => {
    const result = evaluateDeployReadiness({
      env: {
        requiredPresent: { OPENAI_API_KEY: true, OPENAI_MODEL: false },
        enforceAuthEnabled: false,
        allowedOrigins: [],
      },
      db: {
        requiredTablesMissing: ["landing_leads"],
      },
      functionConfig: {
        landingPublicEnabled: false,
      },
    });
    expect(result.status).toBe("fail");
    expect(result.summary.fail).toBeGreaterThan(0);
  });

  it("warns when wildcard CORS is used", () => {
    const result = evaluateDeployReadiness({
      env: {
        requiredPresent: { OPENAI_API_KEY: true, OPENAI_MODEL: true },
        enforceAuthEnabled: true,
        allowedOrigins: ["*"],
      },
      db: {
        requiredTablesMissing: [],
      },
      functionConfig: {
        landingPublicEnabled: true,
      },
    });
    expect(result.status).toBe("warn");
    expect(result.summary.warn).toBeGreaterThan(0);
  });

  it("passes when all readiness checks are good", () => {
    const result = evaluateDeployReadiness({
      env: {
        requiredPresent: { OPENAI_API_KEY: true, OPENAI_MODEL: true },
        enforceAuthEnabled: true,
        allowedOrigins: ["https://app.regulon.com"],
      },
      db: {
        requiredTablesMissing: [],
      },
      functionConfig: {
        landingPublicEnabled: true,
      },
    });
    expect(result.status).toBe("pass");
    expect(result.score).toBe(100);
  });
});
