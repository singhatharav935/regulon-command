import { describe, expect, it } from "vitest";
import { buildOpsRunbooks, buildRegressionChecklist, computePrelaunchGate } from "./ops-contract";

describe("ops-contract", () => {
  it("computes fail gate when env is missing", () => {
    const result = computePrelaunchGate({
      envPresent: {
        SUPABASE_URL: true,
        SUPABASE_ANON_KEY: false,
      },
      schemaReadiness: {
        missingTables: [],
        probeErrors: 0,
      },
      workflowIntegrity: { critical: 0, high: 0, medium: 0 },
      workflowSla: { critical: 0, high: 0, medium: 0 },
      aiOps: { sampledRows: 10, failedCount: 1, staleProcessingCount: 0 },
      tenantIsolation: { critical: 0, high: 0, medium: 0 },
      auditTrail: { critical: 0, high: 0, medium: 0 },
    });

    expect(result.status).toBe("fail");
    expect(result.summary.fail).toBeGreaterThan(0);
  });

  it("computes warn gate when only high-risk warnings exist", () => {
    const result = computePrelaunchGate({
      envPresent: {
        SUPABASE_URL: true,
        SUPABASE_ANON_KEY: true,
      },
      schemaReadiness: {
        missingTables: [],
        probeErrors: 0,
      },
      workflowIntegrity: { critical: 0, high: 1, medium: 0 },
      workflowSla: { critical: 0, high: 0, medium: 0 },
      aiOps: { sampledRows: 20, failedCount: 1, staleProcessingCount: 0 },
      tenantIsolation: { critical: 0, high: 0, medium: 0 },
      auditTrail: { critical: 0, high: 0, medium: 0 },
    });

    expect(result.status).toBe("warn");
    expect(result.summary.warn).toBeGreaterThan(0);
  });

  it("returns pass when all gates are healthy", () => {
    const result = computePrelaunchGate({
      envPresent: {
        SUPABASE_URL: true,
        SUPABASE_ANON_KEY: true,
      },
      schemaReadiness: {
        missingTables: [],
        probeErrors: 0,
      },
      workflowIntegrity: { critical: 0, high: 0, medium: 0 },
      workflowSla: { critical: 0, high: 0, medium: 0 },
      aiOps: { sampledRows: 100, failedCount: 3, staleProcessingCount: 0 },
      tenantIsolation: { critical: 0, high: 0, medium: 0 },
      auditTrail: { critical: 0, high: 0, medium: 0 },
    });

    expect(result.status).toBe("pass");
    expect(result.score).toBe(100);
  });

  it("exposes runbook and regression checklist content", () => {
    const runbooks = buildOpsRunbooks();
    const checklist = buildRegressionChecklist();
    expect(runbooks.items.length).toBeGreaterThan(0);
    expect(checklist.flows.length).toBeGreaterThan(0);
    expect(checklist.requiredEndpoints).toContain("/ops/prelaunch-gate");
    expect(checklist.requiredEndpoints).toContain("/ops/draft-audit-integrity-check");
  });

  it("fails gate when required schema is missing", () => {
    const result = computePrelaunchGate({
      envPresent: {
        SUPABASE_URL: true,
        SUPABASE_ANON_KEY: true,
      },
      schemaReadiness: {
        missingTables: ["landing_leads"],
        probeErrors: 0,
      },
      workflowIntegrity: { critical: 0, high: 0, medium: 0 },
      workflowSla: { critical: 0, high: 0, medium: 0 },
      aiOps: { sampledRows: 50, failedCount: 2, staleProcessingCount: 0 },
      tenantIsolation: { critical: 0, high: 0, medium: 0 },
      auditTrail: { critical: 0, high: 0, medium: 0 },
    });

    expect(result.status).toBe("fail");
  });

  it("warns gate when tenant isolation has high findings", () => {
    const result = computePrelaunchGate({
      envPresent: {
        SUPABASE_URL: true,
        SUPABASE_ANON_KEY: true,
      },
      schemaReadiness: {
        missingTables: [],
        probeErrors: 0,
      },
      workflowIntegrity: { critical: 0, high: 0, medium: 0 },
      workflowSla: { critical: 0, high: 0, medium: 0 },
      aiOps: { sampledRows: 80, failedCount: 1, staleProcessingCount: 0 },
      tenantIsolation: { critical: 0, high: 2, medium: 1 },
      auditTrail: { critical: 0, high: 0, medium: 0 },
    });

    expect(result.status).toBe("warn");
  });

  it("fails gate when audit trail has critical findings", () => {
    const result = computePrelaunchGate({
      envPresent: {
        SUPABASE_URL: true,
        SUPABASE_ANON_KEY: true,
      },
      schemaReadiness: {
        missingTables: [],
        probeErrors: 0,
      },
      workflowIntegrity: { critical: 0, high: 0, medium: 0 },
      workflowSla: { critical: 0, high: 0, medium: 0 },
      aiOps: { sampledRows: 50, failedCount: 1, staleProcessingCount: 0 },
      tenantIsolation: { critical: 0, high: 0, medium: 0 },
      auditTrail: { critical: 2, high: 0, medium: 0 },
    });

    expect(result.status).toBe("fail");
  });
});
