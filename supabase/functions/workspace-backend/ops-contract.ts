export type GateStatus = "pass" | "warn" | "fail";

export type PrelaunchSignals = {
  envPresent: Record<string, boolean>;
  schemaReadiness: {
    missingTables: string[];
    probeErrors: number;
  };
  workflowIntegrity: {
    critical: number;
    high: number;
    medium: number;
  };
  workflowSla: {
    critical: number;
    high: number;
    medium: number;
  };
  aiOps: {
    sampledRows: number;
    failedCount: number;
    staleProcessingCount: number;
  };
  tenantIsolation: {
    critical: number;
    high: number;
    medium: number;
  };
  auditTrail: {
    critical: number;
    high: number;
    medium: number;
  };
  exportIntegrity: {
    critical: number;
    high: number;
    medium: number;
  };
  complianceLegal: {
    critical: number;
    high: number;
    medium: number;
  };
};

export const computePrelaunchGate = (signals: PrelaunchSignals) => {
  const gates = [
    {
      id: "env",
      title: "Environment Configuration",
      status: Object.values(signals.envPresent).every(Boolean) ? "pass" : "fail",
      detail: "Core runtime secrets and Supabase keys are present.",
    },
    {
      id: "schema_readiness",
      title: "Schema Readiness",
      status: signals.schemaReadiness.missingTables.length > 0 || signals.schemaReadiness.probeErrors > 0 ? "fail" : "pass",
      detail: "All required database tables are present and readiness probes are healthy.",
    },
    {
      id: "workflow_integrity",
      title: "Workflow Integrity",
      status: signals.workflowIntegrity.critical > 0 ? "fail" : signals.workflowIntegrity.high > 0 ? "warn" : "pass",
      detail: "Draft lifecycle events are consistent with workflow states.",
    },
    {
      id: "workflow_sla",
      title: "Workflow SLA",
      status: signals.workflowSla.critical > 0 ? "fail" : signals.workflowSla.high > 0 ? "warn" : "pass",
      detail: "Generated, review, and approved stages are within SLA windows.",
    },
    {
      id: "ai_ops",
      title: "AI Operations Reliability",
      status: signals.aiOps.staleProcessingCount > 0
        ? "fail"
        : signals.aiOps.sampledRows > 0 && (signals.aiOps.failedCount / signals.aiOps.sampledRows) > 0.2
          ? "warn"
          : "pass",
      detail: "AI request failure ratio and stale processing locks are in control.",
    },
    {
      id: "tenant_isolation",
      title: "Tenant Isolation",
      status: signals.tenantIsolation.critical > 0 ? "fail" : signals.tenantIsolation.high > 0 ? "warn" : "pass",
      detail: "Cross-tenant reference integrity and membership isolation checks are healthy.",
    },
    {
      id: "audit_trail",
      title: "Draft Version & Audit Trail Integrity",
      status: signals.auditTrail.critical > 0 ? "fail" : signals.auditTrail.high > 0 ? "warn" : "pass",
      detail: "Every draft has coherent versions and mandatory lifecycle audit events.",
    },
    {
      id: "export_integrity",
      title: "Export Integrity (PDF/DOCX)",
      status: signals.exportIntegrity.critical > 0 ? "fail" : signals.exportIntegrity.high > 0 ? "warn" : "pass",
      detail: "Export metadata, mime/format parity, and delivery audit chain are complete.",
    },
    {
      id: "compliance_legal",
      title: "Compliance & Legal Readiness",
      status: signals.complianceLegal.critical > 0 ? "fail" : signals.complianceLegal.high > 0 ? "warn" : "pass",
      detail: "Consent capture, legal disclaimers, and data subject request workflow are operational.",
    },
  ] as const;

  const failCount = gates.filter((gate) => gate.status === "fail").length;
  const warnCount = gates.filter((gate) => gate.status === "warn").length;
  const score = Math.max(0, 100 - failCount * 35 - warnCount * 12);
  const status: GateStatus = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "pass";

  return {
    status,
    score,
    summary: {
      pass: gates.filter((gate) => gate.status === "pass").length,
      warn: warnCount,
      fail: failCount,
    },
    gates,
  };
};

export const buildOpsRunbooks = () => ({
  items: [
    {
      id: "workflow-incident",
      title: "Workflow Incident Response",
      steps: [
        "Run /ops/workflow-integrity-check and classify findings by severity.",
        "Freeze new sign-off actions for affected company_ids if critical findings exist.",
        "Replay missing workflow events through controlled workflow-action APIs.",
        "Re-run integrity check and capture before/after report.",
      ],
    },
    {
      id: "ai-reliability",
      title: "AI Reliability Degradation",
      steps: [
        "Check /drafting/ai-ops/stats for stale_processing, fallback spikes, and fail ratio.",
        "Recover stale idempotency rows via ai-ops recovery endpoint.",
        "Temporarily lower per-user throughput and increase retry backoff.",
        "Escalate model fallback policy if fail ratio remains above threshold.",
      ],
    },
    {
      id: "prelaunch-gate",
      title: "Prelaunch Go/No-Go",
      steps: [
        "Run /ops/prelaunch-gate.",
        "Block launch if status is fail.",
        "If status is warn, open explicit risk acceptance with owner.",
        "Archive gate response with release tag and timestamp.",
      ],
    },
  ],
});

export const buildRegressionChecklist = () => ({
  flows: [
    "Draft create -> snapshot -> workflow-action submit/approve/signoff",
    "External legal lane export -> external signoff path",
    "Version rollback with expectedVersionNumber conflict handling",
    "Filing readiness evaluate + persist + history query",
    "Export generation + secure download-link + timeline trace",
  ],
  requiredEndpoints: [
    "/drafts/:id/workflow-actions",
    "/drafts/:id/workflow-action",
    "/drafts/:id/filing-readiness",
    "/drafts/:id/exports",
    "/draft-exports/:id/download-link",
    "/ops/workflow-integrity-check",
    "/ops/draft-audit-integrity-check",
    "/ops/draft-export-integrity-check",
    "/ops/compliance/readiness",
    "/ops/workflow-sla-monitor",
    "/ops/prelaunch-gate",
  ],
});
