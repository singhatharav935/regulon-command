export type DeployReadinessSignal = {
  env: {
    requiredPresent: Record<string, boolean>;
    enforceAuthEnabled: boolean;
    allowedOrigins: string[];
  };
  db: {
    requiredTablesMissing: string[];
  };
  functionConfig: {
    landingPublicEnabled: boolean;
  };
};

export const evaluateDeployReadiness = (signal: DeployReadinessSignal) => {
  const checks = [
    {
      id: "env_required",
      title: "Required Environment Variables",
      status: Object.values(signal.env.requiredPresent).every(Boolean) ? "pass" : "fail",
      detail: "Critical runtime secrets and URLs are present.",
    },
    {
      id: "auth_enforcement",
      title: "Function Auth Enforcement",
      status: signal.env.enforceAuthEnabled ? "pass" : "fail",
      detail: "ENFORCE_AUTH is enabled for protected APIs.",
    },
    {
      id: "cors_allowlist",
      title: "CORS Allowlist",
      status:
        signal.env.allowedOrigins.length === 0
          ? "fail"
          : signal.env.allowedOrigins.includes("*")
            ? "warn"
            : "pass",
      detail: "ALLOWED_ORIGINS is defined and avoids wildcard in production.",
    },
    {
      id: "db_schema",
      title: "Database Schema Readiness",
      status: signal.db.requiredTablesMissing.length === 0 ? "pass" : "fail",
      detail: "Required tables are available after migrations.",
    },
    {
      id: "landing_public_routes",
      title: "Landing Public API Readiness",
      status: signal.functionConfig.landingPublicEnabled ? "pass" : "fail",
      detail: "Public landing routes are enabled for overview and lead capture.",
    },
  ] as const;

  const failCount = checks.filter((item) => item.status === "fail").length;
  const warnCount = checks.filter((item) => item.status === "warn").length;
  const score = Math.max(0, 100 - failCount * 30 - warnCount * 10);
  const status = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "pass";

  return {
    status,
    score,
    checks,
    summary: {
      pass: checks.filter((item) => item.status === "pass").length,
      warn: warnCount,
      fail: failCount,
    },
  };
};
