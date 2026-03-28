import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "https://esm.sh/docx@9.5.1";
import { buildOpsRunbooks, buildRegressionChecklist, computePrelaunchGate } from "./ops-contract.ts";
import { evaluateDeployReadiness } from "./deploy-readiness-contract.ts";
import { normalizeLandingLead } from "./landing-contract.ts";
import { validateAiOperationContractPayload } from "./ai-contract.ts";

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowLocalOrigins = (Deno.env.get("ALLOW_LOCAL_ORIGINS") ?? "").trim().toLowerCase() === "true";

  const isLocalOrigin =
    origin.startsWith("http://localhost:") ||
    origin.startsWith("https://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("https://127.0.0.1:");

  const hasWildcard = allowlist.includes("*");
  const isAllowlisted = allowlist.includes(origin);
  const localOriginAllowed = allowlist.length === 0 || allowLocalOrigins;
  const allowOrigin = allowlist.length === 0
    ? "*"
    : ((localOriginAllowed && isLocalOrigin) || hasWildcard || isAllowlisted ? origin : "null");

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
};

const json = (req: Request, status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });

const getEnv = () => {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!url || !anon) {
    throw new Error("Missing Supabase env configuration");
  }
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return { url, anon, serviceRole };
};

const getUserClient = async (req: Request) => {
  const { url, anon } = getEnv();
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.replace(/^bearer\s+/i, "").trim();
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }
  return { client, user: data.user, token };
};

const getServiceClient = () => {
  const { url, serviceRole } = getEnv();
  if (!serviceRole) return null;
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const getRequestIp = (req: Request) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();
  return "unknown";
};

const hashText = async (text: string) => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
};

const isMissingRelationError = (error: unknown, relation: string) => {
  if (!error || typeof error !== "object") return false;
  const objectError = error as Record<string, unknown>;
  const code = typeof objectError.code === "string" ? objectError.code.trim().toUpperCase() : "";
  if (code === "42P01" || code === "PGRST205") return true;
  const message = typeof objectError.message === "string" ? objectError.message.toLowerCase() : "";
  if (!message.includes(relation.toLowerCase())) return false;
  return message.includes("does not exist") || message.includes("could not find the table") || message.includes("schema cache");
};

const getErrorCode = (error: unknown) => {
  if (!error || typeof error !== "object") return null;
  const objectError = error as Record<string, unknown>;
  const code = typeof objectError.code === "string" ? objectError.code.trim() : "";
  return code || null;
};

const getErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "";
  const objectError = error as Record<string, unknown>;
  return typeof objectError.message === "string" ? objectError.message.trim() : "";
};

const isMissingTableProbeError = (error: unknown, table: string) => {
  if (!error || typeof error !== "object") return false;
  const code = (getErrorCode(error) || "").toUpperCase();
  const message = getErrorMessage(error).toLowerCase();
  if (code === "42P01") return true;
  if (code === "PGRST205") {
    return message.includes(table.toLowerCase());
  }
  return message.includes("does not exist") && message.includes(table.toLowerCase());
};

const enforcePublicRateLimit = async (
  serviceClient: ReturnType<typeof createClient>,
  req: Request,
  route: string,
  options: { limit: number; windowSeconds: number },
) => {
  const ip = getRequestIp(req);
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 256);
  const keyHash = await hashText(`${ip}|${userAgent}`);
  const windowSeconds = Math.max(30, options.windowSeconds);
  const windowBucket = Math.floor(Date.now() / (windowSeconds * 1000));

  const { data: existing, error: existingError } = await serviceClient
    .from("landing_public_rate_limits")
    .select("id, request_count")
    .eq("key_hash", keyHash)
    .eq("route", route)
    .eq("window_bucket", windowBucket)
    .maybeSingle();
  if (existingError) {
    if (isMissingRelationError(existingError, "landing_public_rate_limits")) return;
    throw existingError;
  }

  if (!existing) {
    const { error: insertError } = await serviceClient.from("landing_public_rate_limits").insert({
      key_hash: keyHash,
      route,
      window_bucket: windowBucket,
      request_count: 1,
    });
    if (insertError) {
      if (isMissingRelationError(insertError, "landing_public_rate_limits")) return;
      throw insertError;
    }
    return;
  }

  if (Number(existing.request_count ?? 0) >= options.limit) {
    throw new Error(`Public rate limit exceeded: ${route}`);
  }

  const { error: updateError } = await serviceClient
    .from("landing_public_rate_limits")
    .update({
      request_count: Number(existing.request_count ?? 0) + 1,
    })
    .eq("id", existing.id);
  if (updateError) {
    if (isMissingRelationError(updateError, "landing_public_rate_limits")) return;
    throw updateError;
  }
};

const getUserRoles = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.role));
};

type AppPersona = "external_ca" | "admin" | "company_owner" | "in_house_ca" | "in_house_lawyer" | "ca_firm";

const isAppPersona = (value: string | null): value is AppPersona =>
  value === "external_ca" ||
  value === "admin" ||
  value === "company_owner" ||
  value === "in_house_ca" ||
  value === "in_house_lawyer" ||
  value === "ca_firm";

const getUserPersona = async (client: ReturnType<typeof createClient>, userId: string, user: { user_metadata?: Record<string, unknown> }) => {
  const { data, error } = await client
    .from("user_personas")
    .select("persona")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const rowPersona = typeof data?.persona === "string" ? data.persona : null;
  if (isAppPersona(rowPersona)) return rowPersona;

  const metadataPersona = typeof user.user_metadata?.registration_role === "string"
    ? user.user_metadata.registration_role
    : null;
  if (isAppPersona(metadataPersona)) return metadataPersona;

  return null;
};

const applyPersonaRoleFallback = (roles: Set<string>, persona: AppPersona | null) => {
  const resolved = new Set(roles);
  if (persona === "admin") {
    resolved.add("admin");
  } else if (
    persona === "external_ca" ||
    persona === "in_house_ca" ||
    persona === "in_house_lawyer" ||
    persona === "ca_firm"
  ) {
    resolved.add("manager");
  } else if (persona === "company_owner") {
    resolved.add("user");
  }
  return resolved;
};

const getUserCompanyIds = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client.from("company_members").select("company_id").eq("user_id", userId);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((row) => row.company_id)));
};

const requireRole = (roles: Set<string>, allowed: string[]) => {
  if (!allowed.some((role) => roles.has(role))) {
    throw new Error("Forbidden: missing_required_role");
  }
};

const ALLOWED_WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  generated: ["generated", "under_review"],
  under_review: ["under_review", "approved"],
  approved: ["approved", "signed_off"],
  signed_off: ["signed_off"],
};

const ALLOWED_EVENT_TYPES_BY_TRANSITION: Record<string, string[]> = {
  "generated->generated": ["manual_version_saved", "review_saved", "legal_review_saved", "draft_generated", "exported_for_external_legal", "version_rollback_applied", "filing_export_generated", "filing_readiness_assessed", "filing_export_download_link_issued"],
  "generated->under_review": ["submitted_for_review", "review_started"],
  "under_review->under_review": ["manual_version_saved", "review_saved", "legal_review_saved", "exported_for_external_legal", "version_rollback_applied", "filing_export_generated", "filing_readiness_assessed", "filing_export_download_link_issued"],
  "under_review->approved": ["review_approved", "legal_review_approved"],
  "approved->approved": ["manual_version_saved", "review_saved", "legal_review_saved", "external_legal_signed_off", "version_rollback_applied", "filing_export_generated", "filing_readiness_assessed", "filing_export_download_link_issued"],
  "approved->signed_off": ["final_sign_off", "legal_final_sign_off", "external_legal_signed_off"],
  "signed_off->signed_off": ["manual_version_saved", "review_saved", "version_rollback_applied", "filing_export_generated", "filing_readiness_assessed", "filing_export_download_link_issued"],
};

const assertValidWorkflowTransition = (currentStatus: string, nextStatus: string) => {
  const allowed = ALLOWED_WORKFLOW_TRANSITIONS[currentStatus] ?? [currentStatus];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid workflow transition: ${currentStatus} -> ${nextStatus}`);
  }
};

const assertValidEventTypeForTransition = (currentStatus: string, nextStatus: string, eventType: string) => {
  const transitionKey = `${currentStatus}->${nextStatus}`;
  const allowed = ALLOWED_EVENT_TYPES_BY_TRANSITION[transitionKey] ?? [];
  if (!allowed.includes(eventType)) {
    throw new Error(`Invalid event type for transition: ${transitionKey} (${eventType})`);
  }
};

const assertEventActorAllowed = ({
  roles,
  persona,
  eventType,
  legalLaneEnabled,
  legalReviewRequired,
  finalSignoffMode,
}: {
  roles: Set<string>;
  persona: AppPersona | null;
  eventType: string;
  legalLaneEnabled: boolean;
  legalReviewRequired: boolean;
  finalSignoffMode: "ca_only" | "lawyer_only" | "dual";
}) => {
  if (roles.has("admin")) return;
  if (!roles.has("manager")) {
    throw new Error("Policy denied: manager_role_required_for_review_actions");
  }

  // Backward compatibility: legacy accounts may not have user_personas hydrated yet.
  if (!persona) return;

  const caPersonas: AppPersona[] = ["external_ca", "in_house_ca", "ca_firm"];
  const isCaPersona = caPersonas.includes(persona);
  const isLawyerPersona = persona === "in_house_lawyer";

  if (eventType === "legal_review_approved" || eventType === "legal_final_sign_off" || eventType === "legal_review_saved") {
    if (persona !== "in_house_lawyer") {
      throw new Error("Policy denied: legal_review_events_require_in_house_lawyer");
    }
    if (!legalLaneEnabled) {
      throw new Error("Policy denied: legal_lane_not_enabled_for_this_actor");
    }
    return;
  }

  if (eventType === "review_approved") {
    if (!isCaPersona) {
      throw new Error("Policy denied: ca_review_events_require_ca_persona");
    }
    return;
  }

  if (eventType === "submitted_for_review" || eventType === "review_started") {
    if (!isCaPersona) {
      throw new Error("Policy denied: ca_review_events_require_ca_persona");
    }
    if (!legalLaneEnabled) {
      throw new Error("Policy denied: legal_lane_not_enabled_for_this_actor");
    }
    return;
  }

  if (eventType === "final_sign_off") {
    if (!isCaPersona) {
      throw new Error("Policy denied: ca_review_events_require_ca_persona");
    }
    if (!legalLaneEnabled && (persona === "external_ca" || persona === "ca_firm")) {
      throw new Error("Policy denied: external_ca_export_only_lane_active");
    }
    if (legalReviewRequired && finalSignoffMode !== "ca_only") {
      throw new Error("Policy denied: legal_signoff_required_for_this_authority");
    }
    return;
  }

  if (eventType === "exported_for_external_legal") {
    if (!(persona === "external_ca" || persona === "ca_firm")) {
      throw new Error("Policy denied: export_for_external_legal_requires_external_ca_or_firm");
    }
    return;
  }

  if (eventType === "external_legal_signed_off") {
    if (!(persona === "external_ca" || persona === "ca_firm")) {
      throw new Error("Policy denied: external_legal_signoff_requires_external_ca_or_firm");
    }
    if (legalLaneEnabled) {
      throw new Error("Policy denied: external_legal_signoff_not_allowed_when_internal_lane_enabled");
    }
    return;
  }

  if (eventType === "manual_version_saved") {
    if (!isCaPersona && !isLawyerPersona) {
      throw new Error("Policy denied: review_edit_requires_ca_or_lawyer");
    }
  }
};

const assertWorkflowBlockingConditions = ({
  eventType,
  existingEvents,
  legalReviewRequired,
  finalSignoffMode,
  legalLaneEnabled,
  persona,
}: {
  eventType: string;
  existingEvents: Array<{ event_type: string }>;
  legalReviewRequired: boolean;
  finalSignoffMode: "ca_only" | "lawyer_only" | "dual";
  legalLaneEnabled: boolean;
  persona: AppPersona | null;
}) => {
  const eventSet = new Set(existingEvents.map((event) => event.event_type));

  if (eventType === "review_approved") {
    if (!eventSet.has("submitted_for_review") && !eventSet.has("review_started")) {
      throw new Error("Policy denied: review_approved_requires_review_submission");
    }
    return;
  }

  if (eventType === "final_sign_off") {
    if (persona === "external_ca" || persona === "ca_firm") {
      if (!legalLaneEnabled) {
        throw new Error("Policy denied: external_ca_export_only_lane_active");
      }
    }
    if (legalReviewRequired && finalSignoffMode !== "ca_only") {
      if (!eventSet.has("legal_review_approved")) {
        throw new Error("Policy denied: final_signoff_requires_legal_review_approval");
      }
    }
    if (finalSignoffMode === "dual" && !eventSet.has("review_approved")) {
      throw new Error("Policy denied: final_signoff_dual_mode_requires_ca_approval");
    }
    return;
  }

  if (eventType === "legal_final_sign_off") {
    if (!eventSet.has("review_approved") && finalSignoffMode === "dual") {
      throw new Error("Policy denied: legal_final_signoff_dual_mode_requires_ca_approval");
    }
  }

  if (eventType === "external_legal_signed_off") {
    if (!eventSet.has("exported_for_external_legal")) {
      throw new Error("Policy denied: external_legal_signoff_requires_export_event");
    }
    if (legalReviewRequired) {
      throw new Error("Policy denied: external_legal_signoff_not_allowed_when_internal_legal_review_required");
    }
  }
};

const loadAuthorityWorkflowPolicy = async (client: ReturnType<typeof createClient>, documentType: string | null) => {
  if (!documentType) {
    return {
      legalReviewRequired: false,
      finalSignoffMode: "ca_only" as const,
    };
  }

  const { data, error } = await client
    .from("authority_workflow_policies")
    .select("legal_review_required, final_signoff_mode")
    .eq("document_type", documentType)
    .maybeSingle();
  if (error) throw error;

  const finalSignoffMode =
    data?.final_signoff_mode === "lawyer_only" || data?.final_signoff_mode === "dual" || data?.final_signoff_mode === "ca_only"
      ? data.final_signoff_mode
      : "ca_only";

  return {
    legalReviewRequired: data?.legal_review_required === true,
    finalSignoffMode,
  };
};

const loadActorEntitlements = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client
    .from("ca_actor_entitlements")
    .select("regulon_legal_lane_enabled, assistant_access_enabled, plan_monthly_request_limit")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    regulonLegalLaneEnabled: data?.regulon_legal_lane_enabled === true,
    assistantAccessEnabled: data?.assistant_access_enabled !== false,
    planMonthlyRequestLimit: typeof data?.plan_monthly_request_limit === "number"
      ? data.plan_monthly_request_limit
      : null,
  };
};

const resolveLegalLaneEnabled = (persona: AppPersona | null, entitlements: { regulonLegalLaneEnabled: boolean }) => {
  if (persona === "in_house_ca" || persona === "in_house_lawyer" || persona === "admin") return true;
  if (persona === "external_ca" || persona === "ca_firm") return entitlements.regulonLegalLaneEnabled;
  return false;
};

const normalizeAiOperation = (payload: Record<string, unknown>) => {
  const operation = typeof payload.operation === "string" ? payload.operation.trim().toLowerCase() : "";
  if (operation) return operation;
  return "draft";
};

const assertAiOperationActorAllowed = ({
  roles,
  persona,
  operation,
  payload,
}: {
  roles: Set<string>;
  persona: AppPersona | null;
  operation: string;
  payload: Record<string, unknown>;
}) => {
  if (roles.has("admin")) return;
  if (!roles.has("manager")) {
    throw new Error("Policy denied: manager_role_required_for_ai_operations");
  }

  // Backward compatibility: legacy accounts may not have persona rows yet.
  if (!persona) return;

  const caPersonas: AppPersona[] = ["external_ca", "in_house_ca", "ca_firm"];
  const lawyerManualOverride = payload.lawyerOverride === true || payload.legalOverride === true;

  if (operation === "draft" || operation === "generate" || operation === "apply-fix" || operation === "fix") {
    if (persona === "in_house_lawyer" && lawyerManualOverride) {
      return;
    }
    if (!caPersonas.includes(persona)) {
      throw new Error("Policy denied: draft_generation_requires_ca_persona");
    }
    return;
  }

  if (operation === "recheck" || operation === "notice-ocr" || operation === "notice-details") {
    if (!caPersonas.includes(persona) && persona !== "in_house_lawyer") {
      throw new Error("Policy denied: ai_operation_requires_ca_or_lawyer_persona");
    }
    return;
  }

  throw new Error(`Policy denied: unsupported_ai_operation:${operation}`);
};

const SUPPORTED_AI_DOCUMENT_TYPES = new Set([
  "mca-notice",
  "gst-show-cause",
  "income-tax-response",
  "rbi-filing",
  "sebi-compliance",
  "customs-response",
  "contract-review",
  "custom-draft",
]);

const AUTHORITY_BACKEND_COVERAGE: Array<{
  documentType: string;
  authority: string;
  trainingCasesTable: string;
  defaultPolicy: { legalReviewRequired: boolean; finalSignoffMode: "ca_only" | "lawyer_only" | "dual"; notes: string };
}> = [
  {
    documentType: "mca-notice",
    authority: "MCA",
    trainingCasesTable: "mca_training_cases",
    defaultPolicy: { legalReviewRequired: false, finalSignoffMode: "ca_only", notes: "Default CA-only signoff for MCA notice response." },
  },
  {
    documentType: "gst-show-cause",
    authority: "GST",
    trainingCasesTable: "gst_training_cases",
    defaultPolicy: { legalReviewRequired: false, finalSignoffMode: "ca_only", notes: "Default CA-only signoff for GST show-cause response." },
  },
  {
    documentType: "income-tax-response",
    authority: "Income Tax",
    trainingCasesTable: "income_tax_training_cases",
    defaultPolicy: { legalReviewRequired: false, finalSignoffMode: "ca_only", notes: "Default CA-only signoff for income-tax response." },
  },
  {
    documentType: "rbi-filing",
    authority: "RBI",
    trainingCasesTable: "rbi_training_cases",
    defaultPolicy: { legalReviewRequired: true, finalSignoffMode: "dual", notes: "Default dual signoff for RBI filing workflow." },
  },
  {
    documentType: "sebi-compliance",
    authority: "SEBI",
    trainingCasesTable: "sebi_training_cases",
    defaultPolicy: { legalReviewRequired: true, finalSignoffMode: "dual", notes: "Default dual signoff for SEBI compliance workflow." },
  },
  {
    documentType: "customs-response",
    authority: "Customs",
    trainingCasesTable: "customs_training_cases",
    defaultPolicy: { legalReviewRequired: false, finalSignoffMode: "ca_only", notes: "Default CA-only signoff for customs response." },
  },
  {
    documentType: "contract-review",
    authority: "Contract",
    trainingCasesTable: "contract_training_cases",
    defaultPolicy: { legalReviewRequired: true, finalSignoffMode: "dual", notes: "Default dual signoff for contract review workflow." },
  },
  {
    documentType: "custom-draft",
    authority: "Custom",
    trainingCasesTable: "custom_training_cases",
    defaultPolicy: { legalReviewRequired: false, finalSignoffMode: "ca_only", notes: "Default CA-only signoff for custom draft workflow." },
  },
];

const parseDocumentType = (payload: Record<string, unknown>) => {
  const documentType = typeof payload.documentType === "string" ? payload.documentType.trim() : "";
  return documentType || null;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
};

const sha256Hex = async (input: string) => {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map((item) => item.toString(16).padStart(2, "0")).join("");
};

const isLockFresh = (updatedAt: string | null | undefined, thresholdSeconds: number) => {
  if (!updatedAt) return false;
  const parsed = Date.parse(updatedAt);
  if (Number.isNaN(parsed)) return false;
  return parsed >= Date.now() - (thresholdSeconds * 1000);
};

const isOlderThanMinutes = (timestamp: string | null | undefined, minutes: number) => {
  if (!timestamp) return false;
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return false;
  return parsed <= Date.now() - (minutes * 60 * 1000);
};

const getMonthStartDate = () => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return monthStart.toISOString().slice(0, 10);
};

const parseMonthStart = (value: string | null) => {
  if (!value) return getMonthStartDate();
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    throw new Error("month must be in YYYY-MM format");
  }
  return `${trimmed}-01`;
};

const getActorQuotaSnapshot = async (client: ReturnType<typeof createClient>, userId: string) => {
  const monthStart = getMonthStartDate();
  const defaultMonthlyLimit = Math.max(100, Number(Deno.env.get("AI_DEFAULT_ACTOR_MONTHLY_LIMIT") ?? "4000"));
  const entitlements = await loadActorEntitlements(client, userId);
  const [{ data: quotaRow, error: quotaError }, { data: usageRow, error: usageError }] = await Promise.all([
    client
      .from("ai_actor_usage_quotas")
      .select("monthly_request_limit, hard_block")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("ai_actor_monthly_usage")
      .select("request_count")
      .eq("user_id", userId)
      .eq("month_start", monthStart)
      .maybeSingle(),
  ]);
  if (quotaError) throw quotaError;
  if (usageError) throw usageError;

  const configuredLimit = Number(quotaRow?.monthly_request_limit ?? defaultMonthlyLimit);
  const effectiveLimit = entitlements.planMonthlyRequestLimit
    ? Math.min(configuredLimit, entitlements.planMonthlyRequestLimit)
    : configuredLimit;
  const used = Number(usageRow?.request_count ?? 0);

  return {
    monthStart,
    hardBlock: quotaRow?.hard_block === true,
    configuredLimit,
    planLimit: entitlements.planMonthlyRequestLimit,
    effectiveLimit,
    used,
    remaining: Math.max(0, effectiveLimit - used),
  };
};

const getFirmQuotaSnapshotForActor = async (client: ReturnType<typeof createClient>, userId: string) => {
  const caFirmId = await loadActorFirmId(client, userId);
  if (!caFirmId) return null;

  const monthStart = getMonthStartDate();
  const defaultMonthlyLimit = Math.max(500, Number(Deno.env.get("AI_DEFAULT_FIRM_MONTHLY_LIMIT") ?? "15000"));
  const [{ data: firm }, { data: quotaRow, error: quotaError }, { data: usageRow, error: usageError }] = await Promise.all([
    client.from("ca_firms").select("id, name").eq("id", caFirmId).maybeSingle(),
    client
      .from("ai_firm_usage_quotas")
      .select("monthly_request_limit, hard_block")
      .eq("ca_firm_id", caFirmId)
      .maybeSingle(),
    client
      .from("ai_firm_monthly_usage")
      .select("request_count")
      .eq("ca_firm_id", caFirmId)
      .eq("month_start", monthStart)
      .maybeSingle(),
  ]);
  if (quotaError) throw quotaError;
  if (usageError) throw usageError;

  const limit = Number(quotaRow?.monthly_request_limit ?? defaultMonthlyLimit);
  const used = Number(usageRow?.request_count ?? 0);

  return {
    caFirmId,
    firmName: firm?.name ?? null,
    monthStart,
    hardBlock: quotaRow?.hard_block === true,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
};

const loadActorFirmId = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client
    .from("ca_firm_members")
    .select("ca_firm_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return typeof data?.ca_firm_id === "string" ? data.ca_firm_id : null;
};

const enforceFirmMonthlyQuota = async (
  client: ReturnType<typeof createClient>,
  caFirmId: string | null,
) => {
  if (!caFirmId) return;
  const defaultMonthlyLimit = Math.max(500, Number(Deno.env.get("AI_DEFAULT_FIRM_MONTHLY_LIMIT") ?? "15000"));
  const monthStart = getMonthStartDate();

  const [{ data: quotaRow, error: quotaError }, { data: usageRow, error: usageError }] = await Promise.all([
    client
      .from("ai_firm_usage_quotas")
      .select("monthly_request_limit, hard_block")
      .eq("ca_firm_id", caFirmId)
      .maybeSingle(),
    client
      .from("ai_firm_monthly_usage")
      .select("request_count")
      .eq("ca_firm_id", caFirmId)
      .eq("month_start", monthStart)
      .maybeSingle(),
  ]);
  if (quotaError) throw quotaError;
  if (usageError) throw usageError;

  if (quotaRow?.hard_block) {
    throw new Error("AI quota exceeded: firm_hard_block");
  }

  const monthlyLimit = quotaRow?.monthly_request_limit ?? defaultMonthlyLimit;
  const currentCount = Number(usageRow?.request_count ?? 0);
  if (currentCount >= monthlyLimit) {
    throw new Error("AI quota exceeded: firm_monthly_limit");
  }
};

const incrementFirmMonthlyUsage = async (
  client: ReturnType<typeof createClient>,
  caFirmId: string | null,
) => {
  if (!caFirmId) return;
  const monthStart = getMonthStartDate();

  const { data: usageRow, error: loadError } = await client
    .from("ai_firm_monthly_usage")
    .select("request_count")
    .eq("ca_firm_id", caFirmId)
    .eq("month_start", monthStart)
    .maybeSingle();
  if (loadError) throw loadError;

  const nextCount = Number(usageRow?.request_count ?? 0) + 1;
  const { error: upsertError } = await client
    .from("ai_firm_monthly_usage")
    .upsert({
      ca_firm_id: caFirmId,
      month_start: monthStart,
      request_count: nextCount,
    }, { onConflict: "ca_firm_id,month_start" });
  if (upsertError) throw upsertError;
};

const enforceActorMonthlyQuota = async (
  client: ReturnType<typeof createClient>,
  userId: string,
) => {
  const defaultMonthlyLimit = Math.max(100, Number(Deno.env.get("AI_DEFAULT_ACTOR_MONTHLY_LIMIT") ?? "4000"));
  const monthStart = getMonthStartDate();
  const entitlements = await loadActorEntitlements(client, userId);

  const [{ data: quotaRow, error: quotaError }, { data: usageRow, error: usageError }] = await Promise.all([
    client
      .from("ai_actor_usage_quotas")
      .select("monthly_request_limit, hard_block")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("ai_actor_monthly_usage")
      .select("request_count")
      .eq("user_id", userId)
      .eq("month_start", monthStart)
      .maybeSingle(),
  ]);
  if (quotaError) throw quotaError;
  if (usageError) throw usageError;

  if (quotaRow?.hard_block) {
    throw new Error("AI quota exceeded: actor_hard_block");
  }

  const configuredLimit = quotaRow?.monthly_request_limit ?? defaultMonthlyLimit;
  const monthlyLimit = entitlements.planMonthlyRequestLimit
    ? Math.min(configuredLimit, entitlements.planMonthlyRequestLimit)
    : configuredLimit;
  const currentCount = Number(usageRow?.request_count ?? 0);
  if (currentCount >= monthlyLimit) {
    throw new Error("AI quota exceeded: actor_monthly_limit");
  }

  const actorFirmId = await loadActorFirmId(client, userId);
  await enforceFirmMonthlyQuota(client, actorFirmId);
};

const incrementActorMonthlyUsage = async (
  client: ReturnType<typeof createClient>,
  userId: string,
) => {
  const monthStart = getMonthStartDate();

  const { data: usageRow, error: loadError } = await client
    .from("ai_actor_monthly_usage")
    .select("request_count")
    .eq("user_id", userId)
    .eq("month_start", monthStart)
    .maybeSingle();
  if (loadError) throw loadError;

  const nextCount = Number(usageRow?.request_count ?? 0) + 1;
  const { error: upsertError } = await client
    .from("ai_actor_monthly_usage")
    .upsert({
      user_id: userId,
      month_start: monthStart,
      request_count: nextCount,
    }, { onConflict: "user_id,month_start" });
  if (upsertError) throw upsertError;

  const actorFirmId = await loadActorFirmId(client, userId);
  await incrementFirmMonthlyUsage(client, actorFirmId);
};

const enforceAiRequestRateLimit = async (
  client: ReturnType<typeof createClient>,
  userId: string,
) => {
  const maxRequestsPerMinute = Math.max(5, Number(Deno.env.get("AI_MAX_REQUESTS_PER_MINUTE") ?? "30"));
  const maxConcurrentRequests = Math.max(1, Number(Deno.env.get("AI_MAX_CONCURRENT_REQUESTS") ?? "3"));
  const lockWindowSeconds = Math.max(15, Number(Deno.env.get("AI_LOCK_WINDOW_SECONDS") ?? "120"));
  const minuteAgoIso = new Date(Date.now() - 60 * 1000).toISOString();

  const [recentResult, processingResult] = await Promise.all([
    client
      .from("ai_request_idempotency")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", minuteAgoIso)
      .limit(maxRequestsPerMinute + 1),
    client
      .from("ai_request_idempotency")
      .select("id, updated_at")
      .eq("user_id", userId)
      .eq("status", "processing")
      .limit(maxConcurrentRequests + 5),
  ]);
  const recentRows = "data" in recentResult ? recentResult.data : null;
  const recentError = "error" in recentResult ? recentResult.error : null;
  const processingRows = "data" in processingResult ? processingResult.data : null;
  const processingError = "error" in processingResult ? processingResult.error : null;

  if (recentError) throw recentError;
  if (processingError) throw processingError;

  const recentCount = (recentRows ?? []).length;
  const freshInFlightCount = (processingRows ?? []).filter((row) => isLockFresh(row.updated_at, lockWindowSeconds)).length;

  if (freshInFlightCount >= maxConcurrentRequests) {
    throw new Error("AI rate limit exceeded: too_many_inflight");
  }
  if (recentCount >= maxRequestsPerMinute) {
    throw new Error("AI rate limit exceeded: too_many_requests");
  }

  await enforceActorMonthlyQuota(client, userId);
};

const prepareAiIdempotencyLock = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  operation: string,
  payload: Record<string, unknown>,
  scopedCompanyId: string | null,
) => {
  const lockWindowSeconds = Math.max(15, Number(Deno.env.get("AI_LOCK_WINDOW_SECONDS") ?? "120"));
  const requestFingerprint = stableStringify({ operation, payload });
  const requestKey = await sha256Hex(requestFingerprint);

  const { data: existingLock } = await client
    .from("ai_request_idempotency")
    .select("id, status, response_payload, updated_at")
    .eq("user_id", userId)
    .eq("request_key", requestKey)
    .maybeSingle();

  if (existingLock?.status === "completed" && existingLock.response_payload) {
    return {
      requestKey,
      cachedResponse: existingLock.response_payload as Record<string, unknown>,
    };
  }

  if (existingLock?.status === "processing" && isLockFresh(existingLock.updated_at, lockWindowSeconds)) {
    throw new Error("AI request already in progress");
  }

  await enforceAiRequestRateLimit(client, userId);

  const { error: lockError } = await client
    .from("ai_request_idempotency")
    .upsert({
      user_id: userId,
      company_id: scopedCompanyId,
      request_key: requestKey,
      operation,
      status: "processing",
      response_payload: null,
      error_message: null,
    }, { onConflict: "user_id,request_key" });
  if (lockError) throw lockError;

  return { requestKey, cachedResponse: null };
};

const inferAiOperationLane = ({
  persona,
  legalLaneEnabled,
}: {
  persona: AppPersona | null;
  legalLaneEnabled: boolean;
}) => {
  if ((persona === "external_ca" || persona === "ca_firm") && !legalLaneEnabled) {
    return "external_legal_outside_regulon";
  }
  return "internal_regulon_lane";
};

const writeAiOperationAudit = async (
  client: ReturnType<typeof createClient>,
  params: {
    userId: string;
    companyId: string | null;
    draftRunId: string | null;
    operation: string;
    lane: string | null;
    outcome: "success" | "failed" | "in_progress";
    responseStatus?: number | null;
    aiModelUsed?: string | null;
    aiFallbackUsed?: boolean | null;
    aiAttemptCount?: number | null;
    modelRouterVersion?: string | null;
    durationMs?: number | null;
    errorMessage?: string | null;
    payloadMeta?: Record<string, unknown>;
  },
) => {
  const { error } = await client
    .from("ai_operation_audit")
    .insert({
      user_id: params.userId,
      company_id: params.companyId,
      draft_run_id: params.draftRunId,
      operation: params.operation,
      lane: params.lane,
      outcome: params.outcome,
      response_status: params.responseStatus ?? null,
      ai_model_used: params.aiModelUsed ?? null,
      ai_fallback_used: params.aiFallbackUsed ?? null,
      ai_attempt_count: params.aiAttemptCount ?? null,
      model_router_version: params.modelRouterVersion ?? null,
      duration_ms: params.durationMs ?? null,
      error_message: params.errorMessage ?? null,
      payload_meta: params.payloadMeta ?? null,
    });
  if (error) throw error;
};

const finalizeAiIdempotencyLock = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  requestKey: string,
  params: {
    status: "completed" | "failed";
    responsePayload?: unknown;
    errorMessage?: string | null;
    responseStatus?: number | null;
    aiModelUsed?: string | null;
    aiFallbackUsed?: boolean | null;
    aiAttemptCount?: number | null;
    modelRouterVersion?: string | null;
  },
) => {
  let shouldCountUsage = false;
  if (params.status === "completed") {
    const { data: existingRow } = await client
      .from("ai_request_idempotency")
      .select("status")
      .eq("user_id", userId)
      .eq("request_key", requestKey)
      .maybeSingle();
    shouldCountUsage = existingRow?.status !== "completed";
  }

  await client
    .from("ai_request_idempotency")
    .update({
      status: params.status,
      response_payload: params.status === "completed" ? (params.responsePayload ?? null) : null,
      error_message: params.status === "failed" ? (params.errorMessage ?? "ai_request_failed") : null,
      response_status: params.responseStatus ?? null,
      ai_model_used: params.aiModelUsed ?? null,
      ai_fallback_used: params.aiFallbackUsed ?? null,
      ai_attempt_count: params.aiAttemptCount ?? null,
      model_router_version: params.modelRouterVersion ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("request_key", requestKey);

  if (params.status === "completed" && shouldCountUsage) {
    await incrementActorMonthlyUsage(client, userId);
  }
};

const assertAiOperationPayloadShape = (operation: string, payload: Record<string, unknown>) => {
  const documentType = parseDocumentType(payload);
  const requiresDocumentType = operation === "draft" ||
    operation === "generate" ||
    operation === "apply-fix" ||
    operation === "fix" ||
    operation === "recheck" ||
    operation === "notice-details";

  if (requiresDocumentType && !documentType) {
    throw new Error("documentType is required for this operation");
  }

  if (documentType && !SUPPORTED_AI_DOCUMENT_TYPES.has(documentType)) {
    throw new Error(`Unsupported documentType: ${documentType}`);
  }
};

const resolveErrorCode = (message: string) => {
  if (message === "Unauthorized") return "AUTH_UNAUTHORIZED";
  if (message.startsWith("Forbidden")) return "ACCESS_FORBIDDEN";
  if (message.startsWith("Landing lead capture is not configured yet")) return "SERVICE_NOT_READY";
  if (message.includes("could not find the table")) return "SERVICE_NOT_READY";
  if (message.includes("relation") && message.includes("does not exist")) return "SERVICE_NOT_READY";
  if (message.includes("[42P01]")) return "SERVICE_NOT_READY";
  if (message.includes("[PGRST205]")) return "SERVICE_NOT_READY";
  if (message === "Draft not found" || message === "Draft export not found") return "RESOURCE_NOT_FOUND";
  if (message.startsWith("Draft version conflict:")) return "WORKFLOW_VERSION_CONFLICT";
  if (message.startsWith("Draft state conflict:")) return "WORKFLOW_STATE_CONFLICT";
  if (message === "Unsupported workflow action") return "VALIDATION_INVALID_FIELD";
  if (message === "expectedVersionNumber must be a positive integer") return "VALIDATION_INVALID_FIELD";
  if (message === "desiredPersona is invalid") return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("Policy denied:")) return "WORKFLOW_ACTOR_FORBIDDEN";
  if (message === "AI request already in progress") return "AI_REQUEST_IN_PROGRESS";
  if (message.startsWith("AI rate limit exceeded:")) return "AI_RATE_LIMITED";
  if (message.startsWith("AI quota exceeded:")) return "AI_QUOTA_EXCEEDED";
  if (message.startsWith("Public rate limit exceeded:")) return "AI_RATE_LIMITED";
  if (message.startsWith("Unsupported documentType:")) return "VALIDATION_INVALID_FIELD";
  if (message.includes("must be a valid UUID")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("Invalid workflow transition:")) return "WORKFLOW_TRANSITION_INVALID";
  if (message.startsWith("Invalid event type for transition:")) return "WORKFLOW_EVENT_INVALID";
  if (message.includes(" is required") || message.includes(" are required")) return "VALIDATION_REQUIRED_FIELD";
  return "INTERNAL_ERROR";
};

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  if (error && typeof error === "object") {
    const objectError = error as Record<string, unknown>;
    const message = typeof objectError.message === "string" ? objectError.message.trim() : "";
    const code = typeof objectError.code === "string" ? objectError.code.trim() : "";
    if (message && code) return `${message} [${code}]`;
    if (message) return message;
  }
  return "Internal error";
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const decoded = atob(`${normalized}${"=".repeat(padLength)}`);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const toIsoDate = (daysFromNow: number) => {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

const bootstrapCompanyWorkspaceData = async (
  client: ReturnType<typeof createClient>,
  params: { companyId: string; ownerUserId: string },
) => {
  const { companyId, ownerUserId } = params;
  const [exposureCountResult, taskCountResult, documentCountResult, deadlineCountResult] = await Promise.all([
    client.from("regulatory_exposure").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    client.from("compliance_tasks").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    client.from("documents").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    client.from("deadlines").select("id", { count: "exact", head: true }).eq("company_id", companyId),
  ]);

  if (exposureCountResult.error) throw exposureCountResult.error;
  if (taskCountResult.error) throw taskCountResult.error;
  if (documentCountResult.error) throw documentCountResult.error;
  if (deadlineCountResult.error) throw deadlineCountResult.error;

  const exposureCount = Number(exposureCountResult.count ?? 0);
  const taskCount = Number(taskCountResult.count ?? 0);
  const documentCount = Number(documentCountResult.count ?? 0);
  const deadlineCount = Number(deadlineCountResult.count ?? 0);

  if (exposureCount === 0) {
    const { error } = await client.from("regulatory_exposure").upsert([
      { company_id: companyId, regulator: "MCA", status: "potential", notes: "MCA statutory calendar initialized." },
      { company_id: companyId, regulator: "GST", status: "potential", notes: "GST monthly return watchlist initialized." },
      { company_id: companyId, regulator: "Income Tax", status: "potential", notes: "Income tax assessment workflow initialized." },
      { company_id: companyId, regulator: "RBI", status: "not_applicable", notes: "RBI applicability placeholder set." },
      { company_id: companyId, regulator: "SEBI", status: "not_applicable", notes: "SEBI applicability placeholder set." },
    ], { onConflict: "company_id,regulator" });
    if (error) throw error;
  }

  if (deadlineCount === 0) {
    const { error } = await client.from("deadlines").insert([
      { company_id: companyId, title: "Monthly GST Return Filing", regulator: "GST", due_date: toIsoDate(7), is_recurring: true },
      { company_id: companyId, title: "TDS Compliance Review", regulator: "Income Tax", due_date: toIsoDate(12), is_recurring: true },
      { company_id: companyId, title: "MCA ROC Form Preparedness", regulator: "MCA", due_date: toIsoDate(18), is_recurring: true },
      { company_id: companyId, title: "Quarterly Regulatory Exposure Review", regulator: "MCA", due_date: toIsoDate(25), is_recurring: true },
    ]);
    if (error) throw error;
  }

  if (taskCount === 0) {
    const { error } = await client.from("compliance_tasks").insert([
      {
        company_id: companyId,
        title: "Compile GST supporting invoices and reconciliations",
        description: "Prepare monthly invoice reconciliation pack for GST filing.",
        regulator: "GST",
        priority: "high",
        status: "pending",
        due_date: toIsoDate(6),
        assigned_to: ownerUserId,
      },
      {
        company_id: companyId,
        title: "Prepare Income Tax advance tax working note",
        description: "Review payable projections and supporting assumptions.",
        regulator: "Income Tax",
        priority: "critical",
        status: "in_progress",
        due_date: toIsoDate(10),
        assigned_to: ownerUserId,
      },
      {
        company_id: companyId,
        title: "Validate board and statutory records for MCA cycle",
        description: "Cross-check director registers and statutory filings.",
        regulator: "MCA",
        priority: "medium",
        status: "pending",
        due_date: toIsoDate(14),
        assigned_to: ownerUserId,
      },
      {
        company_id: companyId,
        title: "Review contract compliance exceptions",
        description: "Check key customer/vendor contracts for compliance triggers.",
        regulator: "Contract",
        priority: "medium",
        status: "under_review",
        due_date: toIsoDate(16),
        assigned_to: ownerUserId,
      },
    ]);
    if (error) throw error;
  }

  if (documentCount === 0) {
    const { error } = await client.from("documents").insert([
      { company_id: companyId, name: "GST Reconciliation Pack", file_type: "xlsx", regulator: "GST", status: "draft", uploaded_by: ownerUserId },
      { company_id: companyId, name: "Income Tax Working Papers", file_type: "pdf", regulator: "Income Tax", status: "under_review", uploaded_by: ownerUserId },
      { company_id: companyId, name: "MCA Board Records Summary", file_type: "docx", regulator: "MCA", status: "submitted", uploaded_by: ownerUserId },
      { company_id: companyId, name: "Contract Compliance Tracker", file_type: "xlsx", regulator: "Contract", status: "draft", uploaded_by: ownerUserId },
    ]);
    if (error) throw error;
  }

  return {
    company_id: companyId,
    seeded: {
      exposures: exposureCount === 0,
      tasks: taskCount === 0,
      documents: documentCount === 0,
      deadlines: deadlineCount === 0,
    },
  };
};

const createCompanyWorkspace = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  name: string,
  industry: string | null,
) => {
  const { data: companyId, error } = await client.rpc("create_company_with_owner", {
    _name: name,
    _industry: industry,
  });
  if (error) throw error;
  let seeded = null;
  let seedError: string | null = null;

  if (typeof companyId === "string" && companyId) {
    try {
      const seedClient = getServiceClient() ?? client;
      seeded = await bootstrapCompanyWorkspaceData(seedClient, {
        companyId,
        ownerUserId: userId,
      });
    } catch (error) {
      seedError = extractErrorMessage(error);
    }
  }

  return { created: true, companyId: typeof companyId === "string" ? companyId : null, seeded, seedError };
};

const bootstrapCaFirmWorkspaceData = async (
  client: ReturnType<typeof createClient>,
  params: { caFirmId: string; ownerUserId: string },
) => {
  const { caFirmId, ownerUserId } = params;

  const [{ count: memberCount, error: memberCountError }, { count: directoryCount, error: directoryCountError }] = await Promise.all([
    client.from("ca_firm_members").select("id", { count: "exact", head: true }).eq("ca_firm_id", caFirmId),
    client.from("ca_firm_ca_directory").select("id", { count: "exact", head: true }).eq("ca_firm_id", caFirmId),
  ]);
  if (memberCountError) throw memberCountError;
  if (directoryCountError) throw directoryCountError;

  if (Number(directoryCount ?? 0) === 0) {
    const [profileResult, verificationResult] = await Promise.all([
      client.from("profiles").select("full_name, email").eq("user_id", ownerUserId).maybeSingle(),
      client.from("user_verifications").select("license_number").eq("user_id", ownerUserId).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (verificationResult.error) throw verificationResult.error;

    const nameFromProfile = typeof profileResult.data?.full_name === "string" && profileResult.data.full_name.trim()
      ? profileResult.data.full_name.trim()
      : null;
    const emailFromProfile = typeof profileResult.data?.email === "string" && profileResult.data.email.trim()
      ? profileResult.data.email.trim()
      : null;
    const licenseNumber = typeof verificationResult.data?.license_number === "string" && verificationResult.data.license_number.trim()
      ? verificationResult.data.license_number.trim()
      : null;

    const caName = nameFromProfile ?? (emailFromProfile ? emailFromProfile.split("@")[0] : "Firm Owner");
    const { error: directoryInsertError } = await client.from("ca_firm_ca_directory").insert({
      ca_firm_id: caFirmId,
      ca_user_id: ownerUserId,
      ca_name: caName,
      license_number: licenseNumber,
      specialty: "Regulatory Advisory",
      status: "active",
    });
    if (directoryInsertError) throw directoryInsertError;
  }

  return {
    ca_firm_id: caFirmId,
    seeded: {
      owner_directory: Number(directoryCount ?? 0) === 0,
      member_count: Number(memberCount ?? 0),
      directory_count: Number(directoryCount ?? 0),
    },
  };
};

const createCaFirmWorkspace = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  name: string,
  registrationNumber: string,
  jurisdiction: string | null,
) => {
  const { data: caFirmId, error } = await client.rpc("create_ca_firm_with_owner", {
    _name: name,
    _registration_number: registrationNumber,
    _jurisdiction: jurisdiction,
  });
  if (error) throw error;
  let seeded = null;
  let seedError: string | null = null;

  if (typeof caFirmId === "string" && caFirmId) {
    try {
      const seedClient = getServiceClient() ?? client;
      seeded = await bootstrapCaFirmWorkspaceData(seedClient, {
        caFirmId,
        ownerUserId: userId,
      });
    } catch (error) {
      seedError = extractErrorMessage(error);
    }
  }

  return { created: true, caFirmId: typeof caFirmId === "string" ? caFirmId : null, seeded, seedError };
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assertUuid = (value: string, fieldName: string) => {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
};

const assignCompanyMembershipByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
  params: { companyId: string; userId: string; role: "user" | "manager" | "admin" },
) => {
  const { companyId, userId, role } = params;
  assertUuid(companyId, "companyId");
  assertUuid(userId, "userId");

  const [{ data: company, error: companyError }, { data: profile, error: profileError }] = await Promise.all([
    serviceClient.from("companies").select("id, name").eq("id", companyId).maybeSingle(),
    serviceClient.from("profiles").select("user_id, full_name, email").eq("user_id", userId).maybeSingle(),
  ]);
  if (companyError) throw companyError;
  if (profileError) throw profileError;
  if (!company) throw new Error("Company not found");
  if (!profile) throw new Error("Target user profile not found");

  const { error: memberError } = await serviceClient
    .from("company_members")
    .upsert({ user_id: userId, company_id: companyId, role }, { onConflict: "user_id,company_id" });
  if (memberError) throw memberError;

  const { error: roleError } = await serviceClient
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  if (roleError) throw roleError;

  return {
    assigned: true,
    company: { id: company.id, name: company.name },
    user: { id: profile.user_id, full_name: profile.full_name ?? null, email: profile.email ?? null },
    role,
  };
};

const assignCaFirmMembershipByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
  params: { caFirmId: string; userId: string; role: "owner" | "partner" | "manager" | "analyst" },
) => {
  const { caFirmId, userId, role } = params;
  assertUuid(caFirmId, "caFirmId");
  assertUuid(userId, "userId");

  const [{ data: firm, error: firmError }, { data: profile, error: profileError }] = await Promise.all([
    serviceClient.from("ca_firms").select("id, name").eq("id", caFirmId).maybeSingle(),
    serviceClient.from("profiles").select("user_id, full_name, email").eq("user_id", userId).maybeSingle(),
  ]);
  if (firmError) throw firmError;
  if (profileError) throw profileError;
  if (!firm) throw new Error("CA firm not found");
  if (!profile) throw new Error("Target user profile not found");

  const { error: memberError } = await serviceClient
    .from("ca_firm_members")
    .upsert({ ca_firm_id: caFirmId, user_id: userId, role }, { onConflict: "ca_firm_id,user_id" });
  if (memberError) throw memberError;

  const { error: roleError } = await serviceClient
    .from("user_roles")
    .upsert({ user_id: userId, role: "manager" }, { onConflict: "user_id,role" });
  if (roleError) throw roleError;

  return {
    assigned: true,
    firm: { id: firm.id, name: firm.name },
    user: { id: profile.user_id, full_name: profile.full_name ?? null, email: profile.email ?? null },
    role,
  };
};

const seedCompanyWorkflowByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
  params: { companyId: string; actorUserId?: string | null; documentType?: string | null; draftMode?: string | null },
) => {
  const companyId = params.companyId.trim();
  assertUuid(companyId, "companyId");

  const { data: company, error: companyError } = await serviceClient
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error("Company not found");

  const { data: members, error: membersError } = await serviceClient
    .from("company_members")
    .select("user_id, role")
    .eq("company_id", companyId)
    .in("role", ["admin", "manager"]);
  if (membersError) throw membersError;

  const preferredActor = typeof params.actorUserId === "string" && params.actorUserId.trim() ? params.actorUserId.trim() : null;
  const actorUserId = preferredActor ?? members?.[0]?.user_id ?? null;
  if (!actorUserId) throw new Error("No admin/manager company member found to seed workflow");
  assertUuid(actorUserId, "actorUserId");

  const documentType = typeof params.documentType === "string" && params.documentType.trim() ? params.documentType.trim() : "gst";
  const draftMode = typeof params.draftMode === "string" && params.draftMode.trim() ? params.draftMode.trim() : "defensive";
  const draftContent = [
    "Draft workflow bootstrap generated for dashboard readiness.",
    `Company: ${company.name}`,
    `Document Type: ${documentType}`,
    "Summary: Preliminary response structure prepared with chronology and evidence anchors.",
    "Action Items: Review factual matrix, validate annexures, and submit for legal review.",
  ].join("\n");

  const { data: run, error: runError } = await serviceClient
    .from("draft_runs")
    .insert({
      user_id: actorUserId,
      company_id: companyId,
      document_type: documentType,
      draft_mode: draftMode,
      status: "under_review",
      notice_input: "Dashboard workflow bootstrap seed",
      draft_content: draftContent,
      qa: { seeded: true, source: "ops_company_workflow_seed" },
      package: { seeded: true },
    })
    .select("id, company_id, user_id, status, document_type, draft_mode, created_at")
    .single();
  if (runError || !run) throw runError ?? new Error("Failed to create seeded draft run");

  const { error: versionError } = await serviceClient.from("draft_versions").insert({
    draft_run_id: run.id,
    user_id: actorUserId,
    version_number: 1,
    content: draftContent,
  });
  if (versionError) throw versionError;

  const { error: eventError } = await serviceClient.from("draft_audit_events").insert([
    {
      draft_run_id: run.id,
      user_id: actorUserId,
      event_type: "submitted_for_review",
      payload: { seeded: true, source: "ops_company_workflow_seed" },
    },
    {
      draft_run_id: run.id,
      user_id: actorUserId,
      event_type: "review_started",
      payload: { seeded: true, source: "ops_company_workflow_seed" },
    },
  ]);
  if (eventError) throw eventError;

  return {
    seeded: true,
    company: { id: company.id, name: company.name },
    draft_run: run,
  };
};

const loadCaWorkspaceProfile = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client
    .from("ca_workspace_profiles")
    .select("workspace_type")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const workspaceType = data?.workspace_type === "regulon_ca" || data?.workspace_type === "external_ca"
    ? data.workspace_type
    : "external_ca";

  return {
    workspaceType,
    source: data?.workspace_type ? "profile" : "default",
  };
};

const loadPracticePreferences = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client
    .from("practice_preferences")
    .select("preferred_mode, preferred_document_type, prefer_pii_masking")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};

const buildCompanyDashboard = async (client: ReturnType<typeof createClient>, userId: string) => {
  const companyIds = await getUserCompanyIds(client, userId);
  const scopedCompanyId = companyIds[0] ?? null;
  if (!scopedCompanyId) {
    return {
      company: null,
      exposures: [],
      tasks: [],
      documents: [],
      deadlines: [],
      draftRuns: [],
      draftAuditEvents: [],
    };
  }

  const [companyResult, exposuresResult, tasksResult, documentsResult, deadlinesResult, draftRunsResult] = await Promise.all([
    client.from("companies").select("id, name, industry, compliance_health").eq("id", scopedCompanyId).single(),
    client.from("regulatory_exposure").select("id, regulator, status, notes").eq("company_id", scopedCompanyId).order("regulator", { ascending: true }),
    client.from("compliance_tasks").select("id, title, regulator, priority, status, due_date").eq("company_id", scopedCompanyId).order("due_date", { ascending: true, nullsFirst: false }).limit(30),
    client.from("documents").select("id, name, file_type, regulator, status, created_at").eq("company_id", scopedCompanyId).order("created_at", { ascending: false }).limit(30),
    client.from("deadlines").select("id, title, regulator, due_date, is_recurring").eq("company_id", scopedCompanyId).order("due_date", { ascending: true }).limit(30),
    client.from("draft_runs").select("id, document_type, draft_mode, status, created_at").eq("company_id", scopedCompanyId).order("created_at", { ascending: false }).limit(20),
  ]);

  if (companyResult.error) throw companyResult.error;
  if (exposuresResult.error) throw exposuresResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (deadlinesResult.error) throw deadlinesResult.error;
  if (draftRunsResult.error) throw draftRunsResult.error;

  const draftRunIds = (draftRunsResult.data ?? []).map((row) => row.id);
  let draftAuditEvents: Array<Record<string, unknown>> = [];
  if (draftRunIds.length > 0) {
    const { data, error } = await client
      .from("draft_audit_events")
      .select("id, draft_run_id, event_type, created_at")
      .in("draft_run_id", draftRunIds)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    draftAuditEvents = data ?? [];
  }

  return {
    company: companyResult.data,
    exposures: exposuresResult.data ?? [],
    tasks: tasksResult.data ?? [],
    documents: documentsResult.data ?? [],
    deadlines: deadlinesResult.data ?? [],
    draftRuns: draftRunsResult.data ?? [],
    draftAuditEvents,
  };
};

const buildCaDashboard = async (client: ReturnType<typeof createClient>, userId: string) => {
  const companyIds = await getUserCompanyIds(client, userId);
  if (companyIds.length === 0) {
    return { companies: [], tasks: [], deadlines: [], documents: [], drafts: [] };
  }

  const [companiesResult, tasksResult, deadlinesResult, documentsResult, draftsResult] = await Promise.all([
    client.from("companies").select("id, name, industry, compliance_health").in("id", companyIds).order("name", { ascending: true }),
    client.from("compliance_tasks").select("id, company_id, title, regulator, priority, status, due_date").in("company_id", companyIds).order("due_date", { ascending: true, nullsFirst: false }).limit(150),
    client.from("deadlines").select("id, company_id, title, regulator, due_date").in("company_id", companyIds).order("due_date", { ascending: true }).limit(120),
    client.from("documents").select("id, company_id, name, status, created_at").in("company_id", companyIds).order("created_at", { ascending: false }).limit(120),
    client.from("draft_runs").select("id, company_id, document_type, draft_mode, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);

  if (companiesResult.error) throw companiesResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (deadlinesResult.error) throw deadlinesResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (draftsResult.error) throw draftsResult.error;

  return {
    companies: companiesResult.data ?? [],
    tasks: tasksResult.data ?? [],
    deadlines: deadlinesResult.data ?? [],
    documents: documentsResult.data ?? [],
    drafts: draftsResult.data ?? [],
  };
};

const buildLegalDashboard = async (client: ReturnType<typeof createClient>, userId: string) => {
  const companyIds = await getUserCompanyIds(client, userId);
  if (companyIds.length === 0) return { companyIds: [], runs: [], events: [] };

  const { data: runs, error: runsError } = await client
    .from("draft_runs")
    .select("id, company_id, document_type, draft_mode, status, created_at")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false })
    .limit(100);
  if (runsError) throw runsError;

  const runIds = (runs ?? []).map((row) => row.id);
  let events: Array<Record<string, unknown>> = [];
  if (runIds.length > 0) {
    const { data, error } = await client
      .from("draft_audit_events")
      .select("id, draft_run_id, event_type, created_at")
      .in("draft_run_id", runIds)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    events = data ?? [];
  }

  return { companyIds, runs: runs ?? [], events };
};

const buildCaFirmDashboard = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data: membership, error: membershipError } = await client
    .from("ca_firm_members")
    .select("ca_firm_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership?.ca_firm_id) return { firm: null, members: [], directory: [], runs: [] };

  const [firmResult, membersResult, directoryResult] = await Promise.all([
    client.from("ca_firms").select("id, name, registration_number, jurisdiction").eq("id", membership.ca_firm_id).single(),
    client.from("ca_firm_members").select("id, user_id, role").eq("ca_firm_id", membership.ca_firm_id),
    client.from("ca_firm_ca_directory").select("id, ca_user_id, ca_name, license_number, specialty, status").eq("ca_firm_id", membership.ca_firm_id).order("ca_name", { ascending: true }),
  ]);
  if (firmResult.error) throw firmResult.error;
  if (membersResult.error) throw membersResult.error;
  if (directoryResult.error) throw directoryResult.error;

  const caUserIds = Array.from(new Set((directoryResult.data ?? []).map((entry) => entry.ca_user_id).filter(Boolean)));
  let runs: Array<Record<string, unknown>> = [];
  if (caUserIds.length > 0) {
    const { data, error } = await client
      .from("draft_runs")
      .select("id, user_id, status, document_type, created_at")
      .in("user_id", caUserIds)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    runs = data ?? [];
  }

  return {
    firm: firmResult.data,
    members: membersResult.data ?? [],
    directory: directoryResult.data ?? [],
    runs,
  };
};

const buildAdminDashboard = async (client: ReturnType<typeof createClient>) => {
  const [companiesResult, tasksResult, docsResult, deadlinesResult, rolesResult, draftsResult] = await Promise.all([
    client.from("companies").select("id, name, industry, compliance_health, created_at").order("created_at", { ascending: false }),
    client.from("compliance_tasks").select("id, company_id, title, priority, status, due_date, created_at").order("created_at", { ascending: false }).limit(200),
    client.from("documents").select("id, company_id, status, created_at").order("created_at", { ascending: false }).limit(200),
    client.from("deadlines").select("id, company_id, title, due_date, created_at").order("due_date", { ascending: true }).limit(200),
    client.from("user_roles").select("id, role, user_id"),
    client.from("draft_runs").select("id, user_id, status, document_type, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  if (companiesResult.error) throw companiesResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (docsResult.error) throw docsResult.error;
  if (deadlinesResult.error) throw deadlinesResult.error;
  if (rolesResult.error) throw rolesResult.error;
  if (draftsResult.error) throw draftsResult.error;

  return {
    companies: companiesResult.data ?? [],
    tasks: tasksResult.data ?? [],
    documents: docsResult.data ?? [],
    deadlines: deadlinesResult.data ?? [],
    roles: rolesResult.data ?? [],
    drafts: draftsResult.data ?? [],
  };
};

const listDraftingClients = async (client: ReturnType<typeof createClient>, userId: string) => {
  const companyIds = await getUserCompanyIds(client, userId);
  if (companyIds.length === 0) {
    return { clients: [] };
  }

  const { data, error } = await client
    .from("companies")
    .select("id, name, industry")
    .in("id", companyIds)
    .order("name", { ascending: true });
  if (error) throw error;

  return {
    clients: (data ?? []).map((company) => ({
      id: company.id,
      name: company.name,
      industry: company.industry ?? "General",
    })),
  };
};

const listDraftHistory = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  companyId: string | null,
  documentType: string | null,
) => {
  let query = client
    .from("draft_runs")
    .select("id, created_at, status, document_type, draft_mode, draft_content, qa, package")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (companyId) {
    const companyIds = await getUserCompanyIds(client, userId);
    if (!companyIds.includes(companyId)) {
      throw new Error("Forbidden");
    }
    query = query.eq("company_id", companyId);
  }

  if (documentType) {
    query = query.eq("document_type", documentType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return { history: data ?? [] };
};

const loadDraftArtifacts = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  draftRunId: string,
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  return {
    versions: review.versions,
    events: review.events,
  };
};

const loadDraftTimeline = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  draftRunId: string,
  options?: { limit?: number; eventType?: string | null },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const limit = Math.max(10, Math.min(200, Number(options?.limit ?? 80)));
  const eventType = typeof options?.eventType === "string" && options.eventType.trim()
    ? options.eventType.trim()
    : null;

  let eventsQuery = client
    .from("draft_audit_events")
    .select("id, draft_run_id, user_id, event_type, payload, created_at")
    .eq("draft_run_id", draftRunId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (eventType) eventsQuery = eventsQuery.eq("event_type", eventType);

  const [{ data: events, error: eventsError }, { data: versions, error: versionsError }, { data: exports, error: exportsError }, { data: filingChecks, error: filingChecksError }] = await Promise.all([
    eventsQuery,
    client
      .from("draft_versions")
      .select("id, draft_run_id, user_id, version_number, created_at")
      .eq("draft_run_id", draftRunId)
      .order("version_number", { ascending: false })
      .limit(limit),
    client
      .from("draft_exports")
      .select("id, draft_run_id, requested_by, format, status, file_name, created_at, completed_at")
      .eq("draft_run_id", draftRunId)
      .order("created_at", { ascending: false })
      .limit(limit),
    client
      .from("draft_filing_checks")
      .select("id, draft_run_id, user_id, score, ready, blockers, warnings, created_at")
      .eq("draft_run_id", draftRunId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  if (eventsError) throw eventsError;
  if (versionsError) throw versionsError;
  if (exportsError) throw exportsError;
  if (filingChecksError) throw filingChecksError;

  const userIds = Array.from(new Set([
    ...(events ?? []).map((row) => row.user_id).filter((v): v is string => typeof v === "string"),
    ...(versions ?? []).map((row) => row.user_id).filter((v): v is string => typeof v === "string"),
    ...(exports ?? []).map((row) => row.requested_by).filter((v): v is string => typeof v === "string"),
    ...(filingChecks ?? []).map((row) => row.user_id).filter((v): v is string => typeof v === "string"),
  ]));

  const actorMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await client
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", userIds);
    if (profilesError) throw profilesError;
    for (const profile of profiles ?? []) {
      actorMap[profile.user_id] = {
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
      };
    }
  }

  return {
    draftRunId,
    currentStatus: review.run.status,
    documentType: review.run.document_type,
    companyId: review.run.company_id,
    eventFilter: eventType,
    events: (events ?? []).map((row) => ({
      ...row,
      actor: actorMap[row.user_id] ?? null,
    })),
    versions: (versions ?? []).map((row) => ({
      ...row,
      actor: actorMap[row.user_id] ?? null,
    })),
    exports: (exports ?? []).map((row) => ({
      ...row,
      actor: actorMap[row.requested_by] ?? null,
    })),
    filingChecks: (filingChecks ?? []).map((row) => ({
      ...row,
      blockers: parseJsonArrayStrings(row.blockers),
      warnings: parseJsonArrayStrings(row.warnings),
      actor: actorMap[row.user_id] ?? null,
    })),
  };
};

const toFilingFileSafe = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/-{2,}/g, "-").replace(/(^-|-$)/g, "") || "draft";

const chunkLines = (input: string, maxLen = 95) => {
  const normalized = input.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of normalized) {
    if (line.length <= maxLen) {
      out.push(line);
      continue;
    }
    let remaining = line;
    while (remaining.length > maxLen) {
      const boundary = remaining.lastIndexOf(" ", maxLen);
      const index = boundary > 20 ? boundary : maxLen;
      out.push(remaining.slice(0, index).trimEnd());
      remaining = remaining.slice(index).trimStart();
    }
    out.push(remaining);
  }
  return out;
};

const buildExportBaseName = (documentType: string | null, draftMode: string | null, draftRunId: string) => {
  const doc = toFilingFileSafe(documentType || "draft");
  const mode = toFilingFileSafe(draftMode || "response");
  const shortId = draftRunId.slice(0, 8);
  return `${doc}-${mode}-${shortId}`;
};

const createDraftPdfBytes = async (options: {
  title: string;
  documentType: string | null;
  draftMode: string | null;
  content: string;
  draftRunId: string;
}) => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 42;
  const width = 595.28;
  const height = 841.89;
  const contentWidth = width - margin * 2;
  const bodySize = 10.5;
  const lineHeight = 14;
  let page = pdf.addPage([width, height]);
  let y = height - margin;

  const drawHeader = () => {
    page.drawText(options.title, { x: margin, y, size: 15, font: bold, color: rgb(0.06, 0.08, 0.12) });
    y -= 20;
    const meta = `Type: ${options.documentType || "n/a"} | Mode: ${options.draftMode || "n/a"} | Draft: ${options.draftRunId}`;
    page.drawText(meta, { x: margin, y, size: 9.5, font, color: rgb(0.36, 0.39, 0.45) });
    y -= 18;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      color: rgb(0.82, 0.84, 0.88),
      thickness: 1,
    });
    y -= 18;
  };

  drawHeader();
  const lines = chunkLines(options.content || "");
  const minY = margin;
  for (const line of lines) {
    if (y < minY) {
      page = pdf.addPage([width, height]);
      y = height - margin;
      drawHeader();
    }
    page.drawText(line, { x: margin, y, size: bodySize, font, maxWidth: contentWidth, color: rgb(0.08, 0.1, 0.14) });
    y -= lineHeight;
  }

  return await pdf.save();
};

const createDraftDocxBytes = async (options: {
  title: string;
  documentType: string | null;
  draftMode: string | null;
  content: string;
  draftRunId: string;
}) => {
  const paragraphs = options.content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => new Paragraph({ children: [new TextRun(line || " ")] }));

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: options.title, bold: true })],
        }),
        new Paragraph(`Type: ${options.documentType || "n/a"}`),
        new Paragraph(`Mode: ${options.draftMode || "n/a"}`),
        new Paragraph(`Draft ID: ${options.draftRunId}`),
        new Paragraph(" "),
        ...paragraphs,
      ],
    }],
  });
  return await Packer.toUint8Array(doc);
};

const createDraftExport = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
  body: { format: "pdf" | "docx" },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const run = review.run;
  const content = typeof run.draft_content === "string" ? run.draft_content : "";
  if (!content.trim()) {
    throw new Error("Validation failed: draft content is empty");
  }

  const baseName = buildExportBaseName(
    typeof run.document_type === "string" ? run.document_type : null,
    typeof run.draft_mode === "string" ? run.draft_mode : null,
    run.id,
  );
  const fileName = `${baseName}.${body.format}`;
  const title = `REGULON Filing Draft`;
  const now = new Date();

  const serviceClient = getServiceClient();
  if (!serviceClient) {
    throw new Error("Missing Supabase service role configuration");
  }

  const byteData = body.format === "pdf"
    ? await createDraftPdfBytes({
      title,
      documentType: run.document_type,
      draftMode: run.draft_mode,
      content,
      draftRunId: run.id,
    })
    : await createDraftDocxBytes({
      title,
      documentType: run.document_type,
      draftMode: run.draft_mode,
      content,
      draftRunId: run.id,
    });

  const storagePath = `${userId}/${run.id}/${now.toISOString().replace(/[:.]/g, "-")}-${fileName}`;
  const mimeType = body.format === "pdf"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const { error: uploadError } = await serviceClient
    .storage
    .from("draft-exports")
    .upload(storagePath, byteData, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600",
    });
  if (uploadError) {
    throw new Error(`Failed to upload draft export: ${uploadError.message}`);
  }

  const { data: exportRow, error: exportInsertError } = await client
    .from("draft_exports")
    .insert({
      draft_run_id: run.id,
      requested_by: userId,
      company_id: run.company_id,
      format: body.format,
      status: "generated",
      file_name: fileName,
      mime_type: mimeType,
      storage_path: storagePath,
      metadata: {
        source: "workspace-backend",
        workflow_status: run.status,
      },
      completed_at: new Date().toISOString(),
    })
    .select("id, draft_run_id, requested_by, company_id, format, status, file_name, mime_type, storage_path, metadata, created_at, completed_at")
    .single();
  if (exportInsertError || !exportRow) {
    throw exportInsertError ?? new Error("Failed to persist export metadata");
  }

  const { data: signedUrlData, error: signedUrlError } = await serviceClient.storage
    .from("draft-exports")
    .createSignedUrl(storagePath, 60 * 15);
  if (signedUrlError) {
    throw new Error(`Failed to create export URL: ${signedUrlError.message}`);
  }

  await appendDraftAuditEvent(
    client,
    userId,
    roles,
    persona,
    run.id,
    "filing_export_generated",
    {
      export_generated: true,
      export_format: body.format,
      export_id: exportRow.id,
      file_name: fileName,
      storage_path: storagePath,
    },
  );

  return {
    ...exportRow,
    download_url: signedUrlData.signedUrl,
    download_url_expires_in_seconds: 60 * 15,
  };
};

const listDraftExports = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  draftRunId: string,
  options?: { limit?: number },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const limit = Math.max(1, Math.min(50, Number(options?.limit ?? 20)));
  const { data, error } = await client
    .from("draft_exports")
    .select("id, draft_run_id, requested_by, company_id, format, status, file_name, mime_type, storage_path, error_message, metadata, created_at, completed_at")
    .eq("draft_run_id", review.run.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const serviceClient = getServiceClient();
  const rows = data ?? [];
  if (!serviceClient) return rows;

  const withUrls = await Promise.all(rows.map(async (row) => {
    if (!row.storage_path) return { ...row, download_url: null };
    const { data: signed, error: signedError } = await serviceClient.storage
      .from("draft-exports")
      .createSignedUrl(row.storage_path, 60 * 10);
    if (signedError) {
      return { ...row, download_url: null, download_url_error: signedError.message };
    }
    return { ...row, download_url: signed.signedUrl, download_url_expires_in_seconds: 60 * 10 };
  }));

  return withUrls;
};

const getDraftExportDownloadLink = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  exportId: string,
  ttlSeconds = 600,
) => {
  const safeTtl = Math.max(60, Math.min(60 * 60, Number.isFinite(ttlSeconds) ? ttlSeconds : 600));
  const { data: row, error } = await client
    .from("draft_exports")
    .select("id, draft_run_id, requested_by, company_id, format, status, file_name, mime_type, storage_path, metadata, created_at, completed_at")
    .eq("id", exportId)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("Draft export not found");
  if (!row.storage_path) throw new Error("Draft export file is unavailable");

  await loadDraftReview(client, userId, roles, row.draft_run_id);

  const serviceClient = getServiceClient();
  if (!serviceClient) {
    throw new Error("Missing Supabase service role configuration");
  }

  const { data: signed, error: signedError } = await serviceClient.storage
    .from("draft-exports")
    .createSignedUrl(row.storage_path, safeTtl);
  if (signedError) {
    throw new Error(`Failed to create export URL: ${signedError.message}`);
  }

  const { error: auditError } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: row.draft_run_id,
      user_id: userId,
      event_type: "filing_export_download_link_issued",
      payload: {
        review_surface: "workspace-backend",
        export_id: row.id,
        export_format: row.format,
        requested_ttl_seconds: safeTtl,
      },
    });
  if (auditError) throw auditError;

  return {
    ...row,
    download_url: signed.signedUrl,
    download_url_expires_in_seconds: safeTtl,
  };
};

const parseJsonArrayStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string") as string[];
};

const evaluateDraftFilingReadiness = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);
  const eventSet = new Set(review.events.map((event) => String(event.event_type)));
  const content = typeof review.run.draft_content === "string" ? review.run.draft_content : "";

  const checkpoints = {
    submittedForReview: eventSet.has("submitted_for_review") || eventSet.has("review_started"),
    reviewApproved: eventSet.has("review_approved"),
    legalReviewApproved: eventSet.has("legal_review_approved"),
    externalLegalExported: eventSet.has("exported_for_external_legal"),
    externalLegalSignedOff: eventSet.has("external_legal_signed_off"),
    finalSignedOff: eventSet.has("final_sign_off") || eventSet.has("legal_final_sign_off") || eventSet.has("external_legal_signed_off"),
  };

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!content.trim()) {
    blockers.push("Draft content is empty.");
  }

  if (/\[to be filled by ca\/lawyer\]/i.test(content) || /\[to be filled\]/i.test(content)) {
    blockers.push("Draft contains unresolved placeholders.");
  }

  if (!checkpoints.submittedForReview) {
    blockers.push("Draft review was not formally submitted.");
  }

  if (!checkpoints.reviewApproved && workflowPolicy.finalSignoffMode === "dual") {
    blockers.push("CA review approval is required for dual sign-off mode.");
  }

  if (workflowPolicy.legalReviewRequired && !checkpoints.legalReviewApproved) {
    blockers.push("Legal review approval is required by authority policy.");
  }

  if (review.run.status !== "signed_off" || !checkpoints.finalSignedOff) {
    blockers.push("Final sign-off is pending.");
  }

  if ((persona === "external_ca" || persona === "ca_firm") && !legalLaneEnabled) {
    if (!checkpoints.externalLegalExported) {
      blockers.push("Draft must be exported for external legal sign-off.");
    }
    if (!checkpoints.externalLegalSignedOff) {
      blockers.push("External legal sign-off event is pending.");
    }
  }

  if (content.length < 1200) {
    warnings.push("Draft length is short for filing-grade quality.");
  }

  if (!/(section|rule|regulation|act|clause)\s+[a-z0-9()./-]+/i.test(content)) {
    warnings.push("No explicit legal provision anchors detected.");
  }

  if (!/(annexure|evidence|document|ledger|invoice|proof)/i.test(content)) {
    warnings.push("Evidence mapping language appears weak.");
  }

  if (!/(prayer|relief|request|hearing)/i.test(content)) {
    warnings.push("Prayer/hearing request language not detected.");
  }

  const scoreBase = 100 - (blockers.length * 18) - (warnings.length * 6);
  const score = Math.max(0, Math.min(100, scoreBase));
  const ready = blockers.length === 0 && score >= 85;

  return {
    draftRunId,
    score,
    ready,
    status: review.run.status,
    documentType: review.run.document_type,
    draftMode: review.run.draft_mode,
    policy: {
      legalReviewRequired: workflowPolicy.legalReviewRequired,
      finalSignoffMode: workflowPolicy.finalSignoffMode,
      legalLaneEnabled,
      regulonLegalLaneEntitled: entitlements.regulonLegalLaneEnabled,
    },
    checkpoints,
    blockers,
    warnings,
    signals: {
      contentLength: content.length,
      placeholderCount:
        (content.match(/\[to be filled by ca\/lawyer\]/gi)?.length ?? 0) +
        (content.match(/\[to be filled\]/gi)?.length ?? 0),
      eventCount: review.events.length,
      versionCount: review.versions.length,
    },
    generatedAt: new Date().toISOString(),
  };
};

const persistDraftFilingReadiness = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  draftRunId: string,
  assessment: {
    score: number;
    ready: boolean;
    blockers: string[];
    warnings: string[];
    signals: Record<string, unknown>;
  },
) => {
  const { data, error } = await client
    .from("draft_filing_checks")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      score: assessment.score,
      ready: assessment.ready,
      blockers: assessment.blockers,
      warnings: assessment.warnings,
      signals: assessment.signals,
    })
    .select("id, draft_run_id, user_id, score, ready, blockers, warnings, signals, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to persist filing readiness");

  const { error: auditError } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      event_type: "filing_readiness_assessed",
      payload: {
        review_surface: "workspace-backend",
        score: assessment.score,
        ready: assessment.ready,
        blocker_count: assessment.blockers.length,
        warning_count: assessment.warnings.length,
      },
    });
  if (auditError) throw auditError;

  return data;
};

const listDraftFilingReadinessHistory = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  draftRunId: string,
  options?: { limit?: number },
) => {
  await loadDraftReview(client, userId, roles, draftRunId);
  const limit = Math.max(1, Math.min(50, Number(options?.limit ?? 20)));
  const { data, error } = await client
    .from("draft_filing_checks")
    .select("id, draft_run_id, user_id, score, ready, blockers, warnings, signals, created_at")
    .eq("draft_run_id", draftRunId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    blockers: parseJsonArrayStrings(row.blockers),
    warnings: parseJsonArrayStrings(row.warnings),
  }));
};

const rollbackDraftToVersion = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
  body: { targetVersionNumber: number; expectedVersionNumber?: number; note?: string | null },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const currentStatus = String(review.run.status);
  assertDraftIsMutableForContentEdit(currentStatus);
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);

  const eventType = "version_rollback_applied";
  assertValidWorkflowTransition(currentStatus, currentStatus);
  assertValidEventTypeForTransition(currentStatus, currentStatus, eventType);
  assertEventActorAllowed({
    roles,
    persona,
    eventType,
    legalLaneEnabled,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
  });

  let targetVersion = review.versions.find((item) => Number(item.version_number) === body.targetVersionNumber);
  if (!targetVersion) {
    const { data, error } = await client
      .from("draft_versions")
      .select("id, version_number, content, created_at")
      .eq("draft_run_id", draftRunId)
      .eq("version_number", body.targetVersionNumber)
      .maybeSingle();
    if (error) throw error;
    targetVersion = data ?? undefined;
  }
  if (!targetVersion || typeof targetVersion.content !== "string" || !targetVersion.content.trim()) {
    throw new Error("targetVersionNumber is required and must reference an existing non-empty version");
  }

  const latestVersionNumber = await getLatestDraftVersionNumber(client, draftRunId);
  assertExpectedDraftVersion(latestVersionNumber, body.expectedVersionNumber);
  const nextVersionNumber = latestVersionNumber + 1;

  await updateDraftRunWithStatusGuard(client, draftRunId, currentStatus, {
    draft_content: targetVersion.content,
  });

  const { error: versionError } = await client
    .from("draft_versions")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      version_number: nextVersionNumber,
      content: targetVersion.content,
    });
  if (versionError) throw versionError;

  const { error: auditError } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      event_type: eventType,
      payload: {
        review_surface: "workspace-backend",
        previous_status: currentStatus,
        next_status: currentStatus,
        restored_from_version: body.targetVersionNumber,
        restored_into_version: nextVersionNumber,
        note: body.note ?? null,
      },
    });
  if (auditError) throw auditError;

  await queueWorkflowNotifications(client, draftRunId, eventType, currentStatus, userId);
  return await loadDraftArtifacts(client, userId, roles, draftRunId);
};

const createDraftRun = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  payload: {
    companyId: string | null;
    documentType: string;
    draftMode: string;
    noticeInput: string | null;
    draftContent: string;
    qa: unknown;
    draftPackage: unknown;
    preferPiiMasking: boolean;
  },
) => {
  let resolvedCompanyId = payload.companyId;
  if (!roles.has("admin")) {
    const companyIds = await getUserCompanyIds(client, userId);
    if (resolvedCompanyId) {
      if (!companyIds.includes(resolvedCompanyId)) {
        throw new Error("Forbidden");
      }
    } else if (companyIds.length === 1) {
      resolvedCompanyId = companyIds[0];
    } else {
      throw new Error("companyId is required for draft runs");
    }
  }

  const { data: draftRun, error: draftRunError } = await client
    .from("draft_runs")
    .insert({
      user_id: userId,
      company_id: resolvedCompanyId,
      document_type: payload.documentType,
      draft_mode: payload.draftMode,
      status: "generated",
      notice_input: payload.noticeInput,
      draft_content: payload.draftContent,
      qa: payload.qa,
      package: payload.draftPackage,
    })
    .select("id")
    .single();
  if (draftRunError || !draftRun) throw draftRunError ?? new Error("Failed to create draft run");

  const { error: versionError } = await client
    .from("draft_versions")
    .insert({
      draft_run_id: draftRun.id,
      user_id: userId,
      version_number: 1,
      content: payload.draftContent,
    });
  if (versionError) throw versionError;

  const { error: auditError } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: draftRun.id,
      user_id: userId,
      event_type: "draft_generated",
      payload: {
        document_type: payload.documentType,
        draft_mode: payload.draftMode,
        review_surface: "workspace-backend",
      },
    });
  if (auditError) throw auditError;

  const { error: preferenceError } = await client
    .from("practice_preferences")
    .upsert({
      user_id: userId,
      preferred_mode: payload.draftMode,
      preferred_document_type: payload.documentType,
      prefer_pii_masking: payload.preferPiiMasking,
    });
  if (preferenceError) throw preferenceError;

  return { draftRunId: draftRun.id };
};

const WORKFLOW_NOTIFICATION_EVENTS = new Set([
  "submitted_for_review",
  "review_approved",
  "legal_review_approved",
  "final_sign_off",
  "legal_final_sign_off",
]);

const queueWorkflowNotifications = async (
  actorClient: ReturnType<typeof createClient>,
  draftRunId: string,
  eventType: string,
  nextStatus: string,
  actorUserId: string,
) => {
  if (!WORKFLOW_NOTIFICATION_EVENTS.has(eventType)) return;

  const serviceClient = getServiceClient();
  if (!serviceClient) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing; skipping workflow notification queueing");
    return;
  }

  const { data: run, error: runError } = await actorClient
    .from("draft_runs")
    .select("id, company_id, document_type")
    .eq("id", draftRunId)
    .maybeSingle();
  if (runError || !run?.company_id) return;

  const [{ data: company }, { data: members, error: membersError }, { data: actorProfile }] = await Promise.all([
    serviceClient.from("companies").select("id, name").eq("id", run.company_id).maybeSingle(),
    serviceClient.from("company_members").select("user_id, role").eq("company_id", run.company_id).in("role", ["admin", "manager"]),
    serviceClient.from("profiles").select("full_name, email").eq("user_id", actorUserId).maybeSingle(),
  ]);

  if (membersError || !members?.length) return;

  const recipientUserIds = Array.from(new Set(members.map((member) => member.user_id).filter(Boolean)));
  if (!recipientUserIds.length) return;

  const { data: recipientProfiles, error: recipientProfilesError } = await serviceClient
    .from("profiles")
    .select("user_id, full_name, email")
    .in("user_id", recipientUserIds);
  if (recipientProfilesError || !recipientProfiles?.length) return;

  const actorName = actorProfile?.full_name || actorProfile?.email || "A team member";
  const companyName = company?.name || "Your company";
  const prettyEvent = eventType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const subject = `[Regulon] ${prettyEvent}: ${run.document_type}`;
  const rows = recipientProfiles
    .filter((profile) => typeof profile.email === "string" && profile.email.trim().length > 0)
    .map((profile) => ({
      company_id: run.company_id,
      owner_user_id: profile.user_id,
      channel: "email",
      payload: {
        template: "draft_workflow_event",
        to: profile.email,
        recipient_name: profile.full_name || profile.email,
        subject,
        body_text: `${actorName} marked ${run.document_type} as ${nextStatus} (${prettyEvent}) for ${companyName}.`,
        event_type: eventType,
        draft_run_id: run.id,
        document_type: run.document_type,
        status: nextStatus,
      },
      status: "queued",
    }));

  if (!rows.length) return;

  const { error: outboxError } = await serviceClient.from("agent_notifications_outbox").insert(rows);
  if (outboxError) {
    console.warn("Failed to enqueue workflow notifications", outboxError.message);
  }
};

const getLatestDraftVersionNumber = async (
  client: ReturnType<typeof createClient>,
  draftRunId: string,
) => {
  const { data: latestVersion, error } = await client
    .from("draft_versions")
    .select("version_number")
    .eq("draft_run_id", draftRunId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return Number(latestVersion?.version_number ?? 0);
};

const assertExpectedDraftVersion = (actualVersionNumber: number, expectedVersionNumber?: number | null) => {
  if (typeof expectedVersionNumber !== "number") return;
  if (!Number.isFinite(expectedVersionNumber) || expectedVersionNumber <= 0 || !Number.isInteger(expectedVersionNumber)) {
    throw new Error("expectedVersionNumber must be a positive integer");
  }
  if (actualVersionNumber !== expectedVersionNumber) {
    throw new Error(`Draft version conflict: expected=${expectedVersionNumber} actual=${actualVersionNumber}`);
  }
};

const assertDraftIsMutableForContentEdit = (currentStatus: string) => {
  if (currentStatus === "signed_off") {
    throw new Error("Policy denied: signed_off_drafts_are_immutable");
  }
};

const ONE_TIME_WORKFLOW_EVENTS = new Set([
  "exported_for_external_legal",
  "external_legal_signed_off",
  "review_approved",
  "legal_review_approved",
  "final_sign_off",
  "legal_final_sign_off",
]);

const isOneTimeWorkflowEvent = (eventType: string) => ONE_TIME_WORKFLOW_EVENTS.has(eventType);

const isUniqueConstraintViolation = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code === "23505";
};

const updateDraftRunWithStatusGuard = async (
  client: ReturnType<typeof createClient>,
  draftRunId: string,
  expectedCurrentStatus: string,
  patch: Record<string, unknown>,
) => {
  const { data, error } = await client
    .from("draft_runs")
    .update(patch)
    .eq("id", draftRunId)
    .eq("status", expectedCurrentStatus)
    .select("id")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(`Draft state conflict: expected_status=${expectedCurrentStatus}`);
  }
};

const saveDraftSnapshot = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
  body: {
    content: string;
    nextStatus?: string;
    eventType: string;
    expectedVersionNumber?: number;
    noticeInput?: string | null;
    qa?: unknown;
    draftPackage?: unknown;
    payload?: Record<string, unknown>;
  },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const currentStatus = String(review.run.status);
  assertDraftIsMutableForContentEdit(currentStatus);
  const nextStatus = body.nextStatus || currentStatus;
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);
  assertValidWorkflowTransition(currentStatus, nextStatus);
  assertValidEventTypeForTransition(currentStatus, nextStatus, body.eventType);
  assertEventActorAllowed({
    roles,
    persona,
    eventType: body.eventType,
    legalLaneEnabled,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
  });
  assertWorkflowBlockingConditions({
    eventType: body.eventType,
    existingEvents: review.events,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
    legalLaneEnabled,
    persona,
  });

  const latestVersionNumber = await getLatestDraftVersionNumber(client, draftRunId);
  assertExpectedDraftVersion(latestVersionNumber, body.expectedVersionNumber);
  const nextVersionNumber = latestVersionNumber + 1;

  await updateDraftRunWithStatusGuard(client, draftRunId, currentStatus, {
    draft_content: body.content,
    status: nextStatus,
    notice_input: body.noticeInput ?? undefined,
    qa: body.qa ?? undefined,
    package: body.draftPackage ?? undefined,
  });

  const { error: versionError } = await client
    .from("draft_versions")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      version_number: nextVersionNumber,
      content: body.content,
    });
  if (versionError) throw versionError;

  const { error: auditError } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      event_type: body.eventType,
      payload: {
        previous_status: currentStatus,
        next_status: nextStatus,
        review_surface: "workspace-backend",
        ...(body.payload ?? {}),
      },
    });
  if (auditError) {
    if (isUniqueConstraintViolation(auditError) && isOneTimeWorkflowEvent(body.eventType)) {
      return await loadDraftArtifacts(client, userId, roles, draftRunId);
    }
    throw auditError;
  }

  await queueWorkflowNotifications(client, draftRunId, body.eventType, nextStatus, userId);

  return await loadDraftArtifacts(client, userId, roles, draftRunId);
};

const appendDraftAuditEvent = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
  eventType: string,
  payload?: Record<string, unknown>,
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const currentStatus = String(review.run.status);
  const existingEventSet = new Set(review.events.map((item) => String(item.event_type)));
  const idempotentOneTimeEvents = new Set([
    ...ONE_TIME_WORKFLOW_EVENTS,
    "filing_export_generated",
    "filing_readiness_assessed",
  ]);
  if (idempotentOneTimeEvents.has(eventType) && existingEventSet.has(eventType)) {
    return await loadDraftArtifacts(client, userId, roles, draftRunId);
  }
  assertValidWorkflowTransition(currentStatus, currentStatus);
  assertValidEventTypeForTransition(currentStatus, currentStatus, eventType);
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);

  assertEventActorAllowed({
    roles,
    persona,
    eventType,
    legalLaneEnabled,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
  });
  assertWorkflowBlockingConditions({
    eventType,
    existingEvents: review.events,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
    legalLaneEnabled,
    persona,
  });

  const { error } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      event_type: eventType,
      payload: {
        review_surface: "workspace-backend",
        ...(payload ?? {}),
      },
    });
  if (error) {
    if (isUniqueConstraintViolation(error) && isOneTimeWorkflowEvent(eventType)) {
      return await loadDraftArtifacts(client, userId, roles, draftRunId);
    }
    throw error;
  }

  return await loadDraftArtifacts(client, userId, roles, draftRunId);
};

const advanceDraftWorkflowState = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
  body: {
    nextStatus: string;
    eventType: string;
    payload?: Record<string, unknown>;
  },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const currentStatus = String(review.run.status);
  const nextStatus = body.nextStatus;
  const existingEventSet = new Set(review.events.map((item) => String(item.event_type)));
  const idempotentTransitionEvents = new Set([
    "submitted_for_review",
    "review_started",
    "review_approved",
    "legal_review_approved",
    "final_sign_off",
    "legal_final_sign_off",
    "external_legal_signed_off",
  ]);
  if (idempotentTransitionEvents.has(body.eventType) && existingEventSet.has(body.eventType)) {
    return await loadDraftArtifacts(client, userId, roles, draftRunId);
  }
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);
  assertValidWorkflowTransition(currentStatus, nextStatus);
  assertValidEventTypeForTransition(currentStatus, nextStatus, body.eventType);
  assertEventActorAllowed({
    roles,
    persona,
    eventType: body.eventType,
    legalLaneEnabled,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
  });
  assertWorkflowBlockingConditions({
    eventType: body.eventType,
    existingEvents: review.events,
    legalReviewRequired: workflowPolicy.legalReviewRequired,
    finalSignoffMode: workflowPolicy.finalSignoffMode,
    legalLaneEnabled,
    persona,
  });

  await updateDraftRunWithStatusGuard(client, draftRunId, currentStatus, { status: nextStatus });

  const { error: auditError } = await client
    .from("draft_audit_events")
    .insert({
      draft_run_id: draftRunId,
      user_id: userId,
      event_type: body.eventType,
      payload: {
        previous_status: currentStatus,
        next_status: nextStatus,
        review_surface: "workspace-backend",
        ...(body.payload ?? {}),
      },
    });
  if (auditError) {
    if (isUniqueConstraintViolation(auditError) && isOneTimeWorkflowEvent(body.eventType)) {
      return await loadDraftArtifacts(client, userId, roles, draftRunId);
    }
    throw auditError;
  }

  await queueWorkflowNotifications(client, draftRunId, body.eventType, nextStatus, userId);
  return await loadDraftArtifacts(client, userId, roles, draftRunId);
};

const executeDraftWorkflowAction = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
  body: {
    action: string;
    note?: string | null;
  },
) => {
  const action = body.action.trim().toLowerCase();
  const actionMap: Record<string, { nextStatus: string; eventType: string }> = {
    submit_for_review: { nextStatus: "under_review", eventType: "submitted_for_review" },
    start_review: { nextStatus: "under_review", eventType: "review_started" },
    approve_review: { nextStatus: "approved", eventType: "review_approved" },
    approve_legal_review: { nextStatus: "approved", eventType: "legal_review_approved" },
    final_signoff: { nextStatus: "signed_off", eventType: "final_sign_off" },
    legal_final_signoff: { nextStatus: "signed_off", eventType: "legal_final_sign_off" },
  };

  const mapped = actionMap[action];
  if (!mapped) {
    throw new Error("Unsupported workflow action");
  }

  return await advanceDraftWorkflowState(
    client,
    userId,
    roles,
    persona,
    draftRunId,
    {
      nextStatus: mapped.nextStatus,
      eventType: mapped.eventType,
      payload: {
        action,
        note: body.note ?? null,
      },
    },
  );
};

const loadDraftPolicyStatus = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);

  const eventSet = new Set(review.events.map((event) => event.event_type));
  const blockers: string[] = [];
  if (!eventSet.has("submitted_for_review") && !eventSet.has("review_started")) {
    blockers.push("CA review submission is pending.");
  }
  if (workflowPolicy.legalReviewRequired && workflowPolicy.finalSignoffMode !== "ca_only" && !eventSet.has("legal_review_approved")) {
    blockers.push("Legal review approval is required before final sign-off.");
  }
  if (workflowPolicy.finalSignoffMode === "dual" && !eventSet.has("review_approved")) {
    blockers.push("CA review approval is required in dual-signoff mode.");
  }
  if ((persona === "external_ca" || persona === "ca_firm") && !legalLaneEnabled) {
    blockers.push("External CA lane active: legal sign-off must happen outside REGULON unless add-on is enabled.");
  }

  const lane = (persona === "external_ca" || persona === "ca_firm") && !legalLaneEnabled
    ? "external_legal_outside_regulon"
    : "internal_regulon_legal_lane";

  return {
    draftRunId,
    status: review.run.status,
    documentType: review.run.document_type,
    lane,
    policy: {
      legalReviewRequired: workflowPolicy.legalReviewRequired,
      finalSignoffMode: workflowPolicy.finalSignoffMode,
      legalLaneEnabled,
      regulonLegalLaneEntitled: entitlements.regulonLegalLaneEnabled,
    },
    checkpoints: {
      submittedForReview: eventSet.has("submitted_for_review") || eventSet.has("review_started"),
      reviewApproved: eventSet.has("review_approved"),
      legalReviewApproved: eventSet.has("legal_review_approved"),
      exportedForExternalLegal: eventSet.has("exported_for_external_legal"),
      finalSignedOff: eventSet.has("final_sign_off") || eventSet.has("legal_final_sign_off"),
    },
    blockers,
  };
};

const loadDraftWorkflowActions = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  draftRunId: string,
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const currentStatus = String(review.run.status);
  const documentType = typeof review.run.document_type === "string" ? review.run.document_type : null;
  const [workflowPolicy, entitlements] = await Promise.all([
    loadAuthorityWorkflowPolicy(client, documentType),
    loadActorEntitlements(client, userId),
  ]);
  const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);

  const candidates: Array<{ id: string; label: string; eventType: string; nextStatus: string }> = [
    { id: "submit_for_review", label: "Submit For Review", eventType: "submitted_for_review", nextStatus: "under_review" },
    { id: "start_review", label: "Start Review", eventType: "review_started", nextStatus: "under_review" },
    { id: "approve_review", label: "Approve Review", eventType: "review_approved", nextStatus: "approved" },
    { id: "approve_legal_review", label: "Approve Legal Review", eventType: "legal_review_approved", nextStatus: "approved" },
    { id: "final_signoff", label: "Final Signoff", eventType: "final_sign_off", nextStatus: "signed_off" },
    { id: "legal_final_signoff", label: "Legal Final Signoff", eventType: "legal_final_sign_off", nextStatus: "signed_off" },
    { id: "export_for_external_legal", label: "Export For External Legal", eventType: "exported_for_external_legal", nextStatus: currentStatus },
    { id: "external_legal_signoff", label: "External Legal Signoff", eventType: "external_legal_signed_off", nextStatus: "signed_off" },
  ];

  const actions = candidates.map((candidate) => {
    try {
      assertValidWorkflowTransition(currentStatus, candidate.nextStatus);
      assertValidEventTypeForTransition(currentStatus, candidate.nextStatus, candidate.eventType);
      assertEventActorAllowed({
        roles,
        persona,
        eventType: candidate.eventType,
        legalLaneEnabled,
        legalReviewRequired: workflowPolicy.legalReviewRequired,
        finalSignoffMode: workflowPolicy.finalSignoffMode,
      });
      assertWorkflowBlockingConditions({
        eventType: candidate.eventType,
        existingEvents: review.events,
        legalReviewRequired: workflowPolicy.legalReviewRequired,
        finalSignoffMode: workflowPolicy.finalSignoffMode,
        legalLaneEnabled,
        persona,
      });
      return {
        id: candidate.id,
        label: candidate.label,
        eventType: candidate.eventType,
        nextStatus: candidate.nextStatus,
        allowed: true,
        reason: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Not allowed";
      return {
        id: candidate.id,
        label: candidate.label,
        eventType: candidate.eventType,
        nextStatus: candidate.nextStatus,
        allowed: false,
        reason: message,
      };
    }
  });

  return {
    draftRunId,
    currentStatus,
    documentType: review.run.document_type,
    persona,
    policy: {
      legalReviewRequired: workflowPolicy.legalReviewRequired,
      finalSignoffMode: workflowPolicy.finalSignoffMode,
      legalLaneEnabled,
      regulonLegalLaneEntitled: entitlements.regulonLegalLaneEnabled,
    },
    actions,
  };
};

const listActionableDraftQueue = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  options?: { limit?: number },
) => {
  const limit = Math.max(10, Math.min(150, Number(options?.limit ?? 50)));
  const companyIds = await getUserCompanyIds(client, userId);

  let query = client
    .from("draft_runs")
    .select("id, company_id, document_type, draft_mode, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (!roles.has("admin")) {
    if (companyIds.length === 0) return [];
    query = query.in("company_id", companyIds);
  }

  const { data: runs, error: runsError } = await query;
  if (runsError) throw runsError;

  const items = [];
  for (const run of runs ?? []) {
    const policy = await loadDraftPolicyStatus(client, userId, roles, persona, run.id);
    const checkpoint = policy.checkpoints;
    const nextAction = (() => {
      if (!checkpoint.submittedForReview) return "submit_for_review";
      if (policy.policy.legalReviewRequired && !checkpoint.legalReviewApproved) {
        return policy.policy.legalLaneEnabled ? "request_legal_review" : "export_for_external_legal";
      }
      if (!checkpoint.finalSignedOff) return "final_signoff";
      return "none";
    })();

    items.push({
      draftRunId: run.id,
      companyId: run.company_id,
      documentType: run.document_type,
      draftMode: run.draft_mode,
      workflowStatus: run.status,
      createdAt: run.created_at,
      lane: policy.lane,
      nextAction,
      blockers: policy.blockers,
      checkpoints: policy.checkpoints,
    });
    if (items.length >= limit) break;
  }

  return items;
};

const runWorkflowIntegrityCheck = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; companyId?: string | null },
) => {
  const limit = Math.max(20, Math.min(500, Number(options?.limit ?? 200)));
  const companyId = typeof options?.companyId === "string" && options.companyId.trim() ? options.companyId.trim() : null;

  let runsQuery = client
    .from("draft_runs")
    .select("id, company_id, user_id, document_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (companyId) runsQuery = runsQuery.eq("company_id", companyId);

  const { data: runs, error: runsError } = await runsQuery;
  if (runsError) throw runsError;

  const runIds = (runs ?? []).map((row) => row.id);
  if (runIds.length === 0) {
    return {
      scanned: 0,
      findings: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
      },
    };
  }

  const { data: events, error: eventsError } = await client
    .from("draft_audit_events")
    .select("draft_run_id, event_type, created_at")
    .in("draft_run_id", runIds)
    .order("created_at", { ascending: true })
    .limit(Math.max(2000, limit * 30));
  if (eventsError) throw eventsError;

  const eventMap: Record<string, string[]> = {};
  for (const event of events ?? []) {
    const key = String(event.draft_run_id);
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(String(event.event_type));
  }

  const findings: Array<{
    severity: "critical" | "high" | "medium";
    draftRunId: string;
    documentType: string | null;
    workflowStatus: string;
    code: string;
    message: string;
  }> = [];

  for (const run of runs ?? []) {
    const runEvents = eventMap[run.id] ?? [];
    const set = new Set(runEvents);
    const docType = typeof run.document_type === "string" ? run.document_type : null;

    if (run.status === "signed_off" && !(set.has("final_sign_off") || set.has("legal_final_sign_off") || set.has("external_legal_signed_off"))) {
      findings.push({
        severity: "critical",
        draftRunId: run.id,
        documentType: docType,
        workflowStatus: run.status,
        code: "SIGNED_OFF_WITHOUT_SIGNOFF_EVENT",
        message: "Draft is signed_off but no sign-off event exists.",
      });
    }

    if ((run.status === "approved" || run.status === "signed_off") && !(set.has("review_approved") || set.has("legal_review_approved") || set.has("external_legal_signed_off"))) {
      findings.push({
        severity: "high",
        draftRunId: run.id,
        documentType: docType,
        workflowStatus: run.status,
        code: "APPROVAL_EVENT_MISSING",
        message: "Draft status implies approval but approval event trail is missing.",
      });
    }

    if (set.has("external_legal_signed_off") && !set.has("exported_for_external_legal")) {
      findings.push({
        severity: "high",
        draftRunId: run.id,
        documentType: docType,
        workflowStatus: run.status,
        code: "EXTERNAL_SIGNOFF_WITHOUT_EXPORT",
        message: "External legal sign-off exists without prior external export event.",
      });
    }

    if (set.has("legal_final_sign_off") && !set.has("legal_review_approved")) {
      findings.push({
        severity: "medium",
        draftRunId: run.id,
        documentType: docType,
        workflowStatus: run.status,
        code: "LEGAL_FINAL_WITHOUT_LEGAL_APPROVAL",
        message: "Legal final sign-off exists without legal review approval event.",
      });
    }

    if (set.has("review_approved") && !(set.has("submitted_for_review") || set.has("review_started"))) {
      findings.push({
        severity: "medium",
        draftRunId: run.id,
        documentType: docType,
        workflowStatus: run.status,
        code: "REVIEW_APPROVAL_WITHOUT_SUBMISSION",
        message: "Review approval exists without review submission/start events.",
      });
    }
  }

  return {
    scanned: (runs ?? []).length,
    findings,
    summary: {
      critical: findings.filter((item) => item.severity === "critical").length,
      high: findings.filter((item) => item.severity === "high").length,
      medium: findings.filter((item) => item.severity === "medium").length,
    },
  };
};

const runWorkflowSlaMonitor = async (
  client: ReturnType<typeof createClient>,
  options?: {
    limit?: number;
    companyId?: string | null;
    generatedWarnHours?: number;
    reviewWarnHours?: number;
    approvedWarnHours?: number;
  },
) => {
  const limit = Math.max(20, Math.min(1000, Number(options?.limit ?? 400)));
  const companyId = typeof options?.companyId === "string" && options.companyId.trim() ? options.companyId.trim() : null;
  const generatedWarnHours = Math.max(1, Math.min(720, Number(options?.generatedWarnHours ?? 24)));
  const reviewWarnHours = Math.max(1, Math.min(720, Number(options?.reviewWarnHours ?? 24)));
  const approvedWarnHours = Math.max(1, Math.min(720, Number(options?.approvedWarnHours ?? 48)));

  let query = client
    .from("draft_runs")
    .select("id, company_id, user_id, document_type, status, created_at, updated_at")
    .in("status", ["generated", "under_review", "approved"])
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (companyId) query = query.eq("company_id", companyId);

  const { data: runs, error } = await query;
  if (error) throw error;

  const nowMs = Date.now();
  const breaches: Array<{
    severity: "critical" | "high" | "medium";
    draftRunId: string;
    companyId: string | null;
    documentType: string | null;
    workflowStatus: string;
    ageHours: number;
    thresholdHours: number;
    code: string;
    message: string;
  }> = [];

  for (const run of runs ?? []) {
    const updatedAtMs = Date.parse(String(run.updated_at || run.created_at || ""));
    if (Number.isNaN(updatedAtMs)) continue;
    const ageHours = Number(((nowMs - updatedAtMs) / (1000 * 60 * 60)).toFixed(2));
    const status = String(run.status);

    if (status === "generated" && ageHours >= generatedWarnHours) {
      breaches.push({
        severity: ageHours >= generatedWarnHours * 2 ? "high" : "medium",
        draftRunId: run.id,
        companyId: run.company_id ?? null,
        documentType: typeof run.document_type === "string" ? run.document_type : null,
        workflowStatus: status,
        ageHours,
        thresholdHours: generatedWarnHours,
        code: "DRAFT_STUCK_GENERATED",
        message: "Draft has not moved from generated to review in SLA window.",
      });
      continue;
    }

    if (status === "under_review" && ageHours >= reviewWarnHours) {
      breaches.push({
        severity: ageHours >= reviewWarnHours * 2 ? "critical" : "high",
        draftRunId: run.id,
        companyId: run.company_id ?? null,
        documentType: typeof run.document_type === "string" ? run.document_type : null,
        workflowStatus: status,
        ageHours,
        thresholdHours: reviewWarnHours,
        code: "DRAFT_STUCK_UNDER_REVIEW",
        message: "Draft is under review beyond SLA threshold.",
      });
      continue;
    }

    if (status === "approved" && ageHours >= approvedWarnHours) {
      breaches.push({
        severity: ageHours >= approvedWarnHours * 2 ? "critical" : "high",
        draftRunId: run.id,
        companyId: run.company_id ?? null,
        documentType: typeof run.document_type === "string" ? run.document_type : null,
        workflowStatus: status,
        ageHours,
        thresholdHours: approvedWarnHours,
        code: "DRAFT_STUCK_APPROVED",
        message: "Draft approved but pending final sign-off beyond SLA threshold.",
      });
    }
  }

  breaches.sort((a, b) => {
    const rank = (v: string) => (v === "critical" ? 0 : v === "high" ? 1 : 2);
    const bySeverity = rank(a.severity) - rank(b.severity);
    if (bySeverity !== 0) return bySeverity;
    return b.ageHours - a.ageHours;
  });

  return {
    scanned: (runs ?? []).length,
    thresholds: {
      generated_warn_hours: generatedWarnHours,
      review_warn_hours: reviewWarnHours,
      approved_warn_hours: approvedWarnHours,
    },
    breaches,
    summary: {
      critical: breaches.filter((item) => item.severity === "critical").length,
      high: breaches.filter((item) => item.severity === "high").length,
      medium: breaches.filter((item) => item.severity === "medium").length,
    },
  };
};

const runTenantIsolationCheck = async (
  client: ReturnType<typeof createClient>,
  options?: { limitPerTable?: number },
) => {
  const limitPerTable = Math.max(200, Math.min(10000, Number(options?.limitPerTable ?? 3000)));
  const serviceClient = getServiceClient() ?? client;

  const [companiesResult, profilesResult, caFirmsResult] = await Promise.all([
    serviceClient.from("companies").select("id").limit(limitPerTable),
    serviceClient.from("profiles").select("user_id").limit(limitPerTable),
    serviceClient.from("ca_firms").select("id").limit(limitPerTable),
  ]);
  if (companiesResult.error) throw companiesResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (caFirmsResult.error) throw caFirmsResult.error;

  const validCompanyIds = new Set((companiesResult.data ?? []).map((row) => row.id));
  const validUserIds = new Set((profilesResult.data ?? []).map((row) => row.user_id));
  const validFirmIds = new Set((caFirmsResult.data ?? []).map((row) => row.id));

  const [tasksResult, docsResult, deadlinesResult, runsResult, exposuresResult, companyMembersResult, caFirmMembersResult, personaResult] = await Promise.all([
    serviceClient.from("compliance_tasks").select("id, company_id").limit(limitPerTable),
    serviceClient.from("documents").select("id, company_id").limit(limitPerTable),
    serviceClient.from("deadlines").select("id, company_id").limit(limitPerTable),
    serviceClient.from("draft_runs").select("id, company_id, user_id").limit(limitPerTable),
    serviceClient.from("regulatory_exposure").select("id, company_id").limit(limitPerTable),
    serviceClient.from("company_members").select("id, company_id, user_id").limit(limitPerTable),
    serviceClient.from("ca_firm_members").select("id, ca_firm_id, user_id").limit(limitPerTable),
    serviceClient.from("user_personas").select("user_id, persona").limit(limitPerTable),
  ]);
  if (tasksResult.error) throw tasksResult.error;
  if (docsResult.error) throw docsResult.error;
  if (deadlinesResult.error) throw deadlinesResult.error;
  if (runsResult.error) throw runsResult.error;
  if (exposuresResult.error) throw exposuresResult.error;
  if (companyMembersResult.error) throw companyMembersResult.error;
  if (caFirmMembersResult.error) throw caFirmMembersResult.error;
  if (personaResult.error) throw personaResult.error;

  const orphanTasks = (tasksResult.data ?? []).filter((row) => !validCompanyIds.has(row.company_id));
  const orphanDocuments = (docsResult.data ?? []).filter((row) => !validCompanyIds.has(row.company_id));
  const orphanDeadlines = (deadlinesResult.data ?? []).filter((row) => !validCompanyIds.has(row.company_id));
  const orphanExposures = (exposuresResult.data ?? []).filter((row) => !validCompanyIds.has(row.company_id));
  const orphanDraftRuns = (runsResult.data ?? []).filter((row) => row.company_id && !validCompanyIds.has(row.company_id));
  const orphanCompanyMembers = (companyMembersResult.data ?? []).filter((row) => !validCompanyIds.has(row.company_id) || !validUserIds.has(row.user_id));
  const orphanFirmMembers = (caFirmMembersResult.data ?? []).filter((row) => !validFirmIds.has(row.ca_firm_id) || !validUserIds.has(row.user_id));

  const companyMembershipCountByUser = new Map<string, number>();
  for (const row of companyMembersResult.data ?? []) {
    companyMembershipCountByUser.set(row.user_id, (companyMembershipCountByUser.get(row.user_id) ?? 0) + 1);
  }
  const firmMembershipCountByUser = new Map<string, number>();
  for (const row of caFirmMembersResult.data ?? []) {
    firmMembershipCountByUser.set(row.user_id, (firmMembershipCountByUser.get(row.user_id) ?? 0) + 1);
  }

  const ownerWithoutCompany = (personaResult.data ?? []).filter(
    (row) => row.persona === "company_owner" && (companyMembershipCountByUser.get(row.user_id) ?? 0) === 0,
  );
  const firmWithoutMembership = (personaResult.data ?? []).filter(
    (row) => row.persona === "ca_firm" && (firmMembershipCountByUser.get(row.user_id) ?? 0) === 0,
  );

  const critical = orphanTasks.length
    + orphanDocuments.length
    + orphanDeadlines.length
    + orphanExposures.length
    + orphanDraftRuns.length
    + orphanCompanyMembers.length
    + orphanFirmMembers.length;
  const high = ownerWithoutCompany.length + firmWithoutMembership.length;

  return {
    sampled: {
      limit_per_table: limitPerTable,
      companies: companiesResult.data?.length ?? 0,
      profiles: profilesResult.data?.length ?? 0,
      ca_firms: caFirmsResult.data?.length ?? 0,
    },
    findings: {
      orphan_tasks: orphanTasks.length,
      orphan_documents: orphanDocuments.length,
      orphan_deadlines: orphanDeadlines.length,
      orphan_exposures: orphanExposures.length,
      orphan_draft_runs: orphanDraftRuns.length,
      orphan_company_memberships: orphanCompanyMembers.length,
      orphan_ca_firm_memberships: orphanFirmMembers.length,
      owner_persona_without_company_membership: ownerWithoutCompany.length,
      ca_firm_persona_without_firm_membership: firmWithoutMembership.length,
    },
    summary: {
      critical,
      high,
      medium: 0,
    },
    sample_ids: {
      orphan_tasks: orphanTasks.slice(0, 10).map((row) => row.id),
      orphan_documents: orphanDocuments.slice(0, 10).map((row) => row.id),
      orphan_deadlines: orphanDeadlines.slice(0, 10).map((row) => row.id),
      orphan_exposures: orphanExposures.slice(0, 10).map((row) => row.id),
      orphan_draft_runs: orphanDraftRuns.slice(0, 10).map((row) => row.id),
      orphan_company_memberships: orphanCompanyMembers.slice(0, 10).map((row) => row.id),
      orphan_ca_firm_memberships: orphanFirmMembers.slice(0, 10).map((row) => row.id),
      owner_persona_without_company_membership: ownerWithoutCompany.slice(0, 10).map((row) => row.user_id),
      ca_firm_persona_without_firm_membership: firmWithoutMembership.slice(0, 10).map((row) => row.user_id),
    },
    overall: {
      pass: critical === 0 && high === 0,
    },
  };
};

const collectPrelaunchSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const envPresent = {
    SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
    SUPABASE_ANON_KEY: Boolean(Deno.env.get("SUPABASE_ANON_KEY")),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    ALLOWED_ORIGINS: Boolean((Deno.env.get("ALLOWED_ORIGINS") ?? "").trim()),
    OPENAI_API_KEY: Boolean(Deno.env.get("OPENAI_API_KEY")),
    OPENAI_MODEL: Boolean(Deno.env.get("OPENAI_MODEL")),
  };

  const [integrity, sla] = await Promise.all([
    runWorkflowIntegrityCheck(client, { limit: 300 }),
    runWorkflowSlaMonitor(client, { limit: 500 }),
  ]);
  const deployReadiness = await collectDeployReadinessSignals(client);

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: aiRows, error: aiRowsError } = await client
    .from("ai_request_idempotency")
    .select("status, created_at, updated_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(2500);
  if (aiRowsError) throw aiRowsError;

  const lockWindowSeconds = Math.max(15, Number(Deno.env.get("AI_LOCK_WINDOW_SECONDS") ?? "120"));
  const rows = aiRows ?? [];
  const staleProcessingCount = rows.filter((row) => row.status === "processing" && isLockFresh(row.updated_at, lockWindowSeconds) === false).length;
  const failedCount = rows.filter((row) => row.status === "failed").length;

  return {
    envPresent,
    schemaReadiness: {
      missingTables: deployReadiness.signals.db.requiredTablesMissing,
      probeErrors: deployReadiness.signals.db.tableProbeErrors.length,
    },
    workflowIntegrity: integrity.summary,
    workflowSla: sla.summary,
    aiOps: {
      sampledRows: rows.length,
      failedCount,
      staleProcessingCount,
    },
    tenantIsolation: (await runTenantIsolationCheck(client, { limitPerTable: 3000 })).summary,
  };
};

const collectDeployReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const requiredEnv = {
    SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
    SUPABASE_ANON_KEY: Boolean(Deno.env.get("SUPABASE_ANON_KEY")),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    OPENAI_API_KEY: Boolean(Deno.env.get("OPENAI_API_KEY")),
    OPENAI_MODEL: Boolean(Deno.env.get("OPENAI_MODEL")),
    ALLOWED_ORIGINS: Boolean((Deno.env.get("ALLOWED_ORIGINS") ?? "").trim()),
    ENFORCE_AUTH: Boolean((Deno.env.get("ENFORCE_AUTH") ?? "").trim()),
  };
  const enforceAuthEnabled = (Deno.env.get("ENFORCE_AUTH") ?? "").trim().toLowerCase() === "true";
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const probeClient = getServiceClient() ?? client;
  const requiredTables = [
    "profiles",
    "user_roles",
    "draft_runs",
    "draft_versions",
    "draft_audit_events",
    "draft_exports",
    "draft_filing_checks",
    "authority_workflow_policies",
    "ai_request_idempotency",
    "ai_operation_audit",
    "landing_public_content",
    "landing_leads",
    "landing_public_rate_limits",
  ];
  const missingTables: string[] = [];
  const tableProbeErrors: Array<{ table: string; code: string | null; message: string }> = [];
  for (const table of requiredTables) {
    const { error } = await probeClient.from(table).select("*", { count: "exact", head: true });
    if (!error) continue;
    if (isMissingTableProbeError(error, table)) {
      missingTables.push(table);
      continue;
    }
    tableProbeErrors.push({
      table,
      code: getErrorCode(error),
      message: getErrorMessage(error) || "Unknown table probe error",
    });
  }

  const signals = {
    env: {
      requiredPresent: requiredEnv,
      enforceAuthEnabled,
      allowedOrigins,
    },
    db: {
      requiredTablesMissing: missingTables,
      tableProbeErrors,
    },
    functionConfig: {
      landingPublicEnabled: true,
    },
  };

  return {
    signals,
    evaluation: evaluateDeployReadiness(signals),
  };
};

const collectSecurityReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const serviceClient = getServiceClient() ?? client;
  const enforceAuthEnabled = (Deno.env.get("ENFORCE_AUTH") ?? "").trim().toLowerCase() === "true";
  const allowLocalOriginsEnabled = (Deno.env.get("ALLOW_LOCAL_ORIGINS") ?? "").trim().toLowerCase() === "true";
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const hasWildcardOrigin = allowedOrigins.includes("*");

  const { data: rlsSnapshot, error: rlsError } = await serviceClient.rpc("security_readiness_snapshot");
  if (rlsError) throw rlsError;
  const rlsData = (rlsSnapshot ?? {}) as Record<string, unknown>;
  const rlsSummary = (rlsData.summary ?? {}) as Record<string, unknown>;

  const { data: bucketRows, error: bucketError } = await serviceClient
    .schema("storage")
    .from("buckets")
    .select("id, public, file_size_limit, allowed_mime_types")
    .eq("id", "verification-documents")
    .limit(1);
  if (bucketError) throw bucketError;
  const bucket = bucketRows?.[0] as
    | {
      id: string;
      public: boolean;
      file_size_limit: number | null;
      allowed_mime_types: string[] | null;
    }
    | undefined;

  const allowedMimes = new Set((bucket?.allowed_mime_types ?? []).map((item) => String(item).toLowerCase()));
  const uploadMimeOk =
    allowedMimes.has("application/pdf") &&
    allowedMimes.has("image/png") &&
    allowedMimes.has("image/jpeg");
  const uploadFileSizeOk = Number(bucket?.file_size_limit ?? 0) > 0 && Number(bucket?.file_size_limit ?? 0) <= 5242880;

  return {
    env: {
      enforce_auth_enabled: enforceAuthEnabled,
      allow_local_origins_enabled: allowLocalOriginsEnabled,
      allowed_origins: allowedOrigins,
      wildcard_origin_present: hasWildcardOrigin,
    },
    rls_rbac: {
      summary: rlsSummary,
      tables: rlsData.tables ?? [],
    },
    upload_security: {
      bucket_exists: Boolean(bucket),
      bucket_public: Boolean(bucket?.public),
      bucket_file_size_limit: bucket?.file_size_limit ?? null,
      bucket_allowed_mime_types: bucket?.allowed_mime_types ?? [],
      mime_policy_ok: uploadMimeOk,
      file_size_policy_ok: uploadFileSizeOk,
    },
    overall: {
      pass:
        enforceAuthEnabled &&
        !allowLocalOriginsEnabled &&
        !hasWildcardOrigin &&
        Number(rlsSummary.missing ?? 0) === 0 &&
        Number(rlsSummary.rls_disabled ?? 0) === 0 &&
        Number(rlsSummary.without_policies ?? 0) === 0 &&
        Boolean(bucket) &&
        bucket?.public === false &&
        uploadMimeOk &&
        uploadFileSizeOk,
    },
  };
};

const listDashboardReadinessUsers = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; offset?: number },
) => {
  const limit = Math.max(10, Math.min(300, Number(options?.limit ?? 100)));
  const offset = Math.max(0, Number(options?.offset ?? 0));

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("user_id, full_name, email, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (profilesError) throw profilesError;

  const userIds = Array.from(new Set((profiles ?? []).map((row) => row.user_id).filter(Boolean)));
  if (userIds.length === 0) {
    return { users: [], offset, limit, total_sampled: 0 };
  }

  const [rolesResult, personasResult, companyMembersResult, caFirmMembersResult, verificationResult] = await Promise.all([
    client.from("user_roles").select("user_id, role").in("user_id", userIds),
    client.from("user_personas").select("user_id, persona").in("user_id", userIds),
    client.from("company_members").select("user_id, company_id").in("user_id", userIds),
    client.from("ca_firm_members").select("user_id, ca_firm_id, role").in("user_id", userIds),
    client.from("user_verifications").select("user_id, status, is_verified").in("user_id", userIds),
  ]);
  if (rolesResult.error) throw rolesResult.error;
  if (personasResult.error) throw personasResult.error;
  if (companyMembersResult.error) throw companyMembersResult.error;
  if (caFirmMembersResult.error) throw caFirmMembersResult.error;
  if (verificationResult.error) throw verificationResult.error;

  const rolesByUser = new Map<string, string[]>();
  for (const row of rolesResult.data ?? []) {
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(String(row.role));
    rolesByUser.set(row.user_id, list);
  }

  const personaByUser = new Map<string, string>();
  for (const row of personasResult.data ?? []) {
    personaByUser.set(row.user_id, String(row.persona));
  }

  const companyCountByUser = new Map<string, number>();
  for (const row of companyMembersResult.data ?? []) {
    companyCountByUser.set(row.user_id, (companyCountByUser.get(row.user_id) ?? 0) + 1);
  }

  const caFirmCountByUser = new Map<string, number>();
  for (const row of caFirmMembersResult.data ?? []) {
    caFirmCountByUser.set(row.user_id, (caFirmCountByUser.get(row.user_id) ?? 0) + 1);
  }

  const verificationByUser = new Map<string, { status: string | null; is_verified: boolean }>();
  for (const row of verificationResult.data ?? []) {
    verificationByUser.set(row.user_id, {
      status: typeof row.status === "string" ? row.status : null,
      is_verified: Boolean(row.is_verified),
    });
  }

  const users = (profiles ?? []).map((profile) => {
    const userId = profile.user_id;
    const roles = rolesByUser.get(userId) ?? [];
    const persona = personaByUser.get(userId) ?? null;
    const companyMemberships = companyCountByUser.get(userId) ?? 0;
    const caFirmMemberships = caFirmCountByUser.get(userId) ?? 0;
    const verification = verificationByUser.get(userId) ?? { status: null, is_verified: false };

    const blockers: string[] = [];
    if (!persona) blockers.push("Missing persona");
    if (roles.length === 0) blockers.push("Missing app role");
    if (
      persona === "company_owner" ||
      persona === "external_ca" ||
      persona === "in_house_ca" ||
      persona === "in_house_lawyer"
    ) {
      if (companyMemberships === 0) blockers.push("No company assignment");
    }
    if (persona === "ca_firm" && caFirmMemberships === 0) {
      blockers.push("No CA firm membership");
    }
    const dashboardReady = blockers.length === 0;

    return {
      user_id: userId,
      full_name: profile.full_name ?? null,
      email: profile.email ?? null,
      persona,
      roles,
      memberships: {
        company: companyMemberships,
        ca_firm: caFirmMemberships,
      },
      verification,
      dashboard_ready: dashboardReady,
      blockers,
    };
  });

  return {
    users,
    offset,
    limit,
    total_sampled: users.length,
    summary: {
      ready: users.filter((item) => item.dashboard_ready).length,
      blocked: users.filter((item) => !item.dashboard_ready).length,
    },
  };
};

const normalizePersona = (value: unknown): AppPersona | null => {
  if (
    value === "external_ca" ||
    value === "admin" ||
    value === "company_owner" ||
    value === "in_house_ca" ||
    value === "in_house_lawyer" ||
    value === "ca_firm"
  ) {
    return value;
  }
  return null;
};

const mapPersonaToRole = (persona: AppPersona) => {
  if (persona === "admin") return "admin";
  if (persona === "company_owner") return "user";
  return "manager";
};

const loadSingleUserDashboardReadiness = async (
  client: ReturnType<typeof createClient>,
  userId: string,
) => {
  assertUuid(userId, "userId");
  const [profileResult, rolesResult, personaResult, companyMembersResult, caFirmMembersResult, verificationResult] = await Promise.all([
    client.from("profiles").select("user_id, full_name, email").eq("user_id", userId).maybeSingle(),
    client.from("user_roles").select("role").eq("user_id", userId),
    client.from("user_personas").select("persona").eq("user_id", userId).maybeSingle(),
    client.from("company_members").select("company_id").eq("user_id", userId),
    client.from("ca_firm_members").select("ca_firm_id").eq("user_id", userId),
    client.from("user_verifications").select("status, is_verified").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (rolesResult.error) throw rolesResult.error;
  if (personaResult.error) throw personaResult.error;
  if (companyMembersResult.error) throw companyMembersResult.error;
  if (caFirmMembersResult.error) throw caFirmMembersResult.error;
  if (verificationResult.error) throw verificationResult.error;
  if (!profileResult.data) throw new Error("Target user profile not found");

  const persona = normalizePersona(personaResult.data?.persona ?? null);
  const roles = (rolesResult.data ?? []).map((row) => String(row.role));
  const companyMemberships = (companyMembersResult.data ?? []).length;
  const caFirmMemberships = (caFirmMembersResult.data ?? []).length;
  const verification = {
    status: typeof verificationResult.data?.status === "string" ? verificationResult.data.status : null,
    is_verified: Boolean(verificationResult.data?.is_verified),
  };

  const blockers: string[] = [];
  if (!persona) blockers.push("Missing persona");
  if (roles.length === 0) blockers.push("Missing app role");
  if (persona === "company_owner" || persona === "external_ca" || persona === "in_house_ca" || persona === "in_house_lawyer") {
    if (companyMemberships === 0) blockers.push("No company assignment");
  }
  if (persona === "ca_firm" && caFirmMemberships === 0) {
    blockers.push("No CA firm membership");
  }

  return {
    user_id: profileResult.data.user_id,
    full_name: profileResult.data.full_name ?? null,
    email: profileResult.data.email ?? null,
    persona,
    roles,
    memberships: {
      company: companyMemberships,
      ca_firm: caFirmMemberships,
    },
    verification,
    dashboard_ready: blockers.length === 0,
    blockers,
  };
};

const resolveTargetDashboardPath = (persona: AppPersona | null, roles: string[]) => {
  if (persona === "admin" || roles.includes("admin")) return "/app/admin-dashboard";
  if (persona === "in_house_lawyer") return "/app/legal-dashboard";
  if (persona === "external_ca" || persona === "in_house_ca") return "/app/ca-dashboard";
  if (persona === "ca_firm") return "/app/ca-firm-dashboard";
  return "/app/dashboard";
};

const inferReadinessActions = (readiness: {
  blockers: string[];
  persona: AppPersona | null;
  roles: string[];
  memberships: { company: number; ca_firm: number };
}) => {
  const actions: string[] = [];
  for (const blocker of readiness.blockers) {
    if (blocker === "Missing persona") {
      actions.push("Set a valid persona in user_personas (company_owner, external_ca, in_house_ca, in_house_lawyer, ca_firm, admin).");
      continue;
    }
    if (blocker === "Missing app role") {
      actions.push("Insert matching app role in user_roles (user/manager/admin) based on persona.");
      continue;
    }
    if (blocker === "No company assignment") {
      actions.push("Assign company membership in company_members or create company workspace via POST /company/workspace.");
      continue;
    }
    if (blocker === "No CA firm membership") {
      actions.push("Assign CA firm membership in ca_firm_members or create firm workspace via POST /ca-firm/workspace.");
      continue;
    }
  }
  if (actions.length === 0) {
    if (readiness.persona === "ca_firm" && readiness.memberships.ca_firm > 0) {
      actions.push("Workspace is ready. Continue with /app/ca-firm-dashboard.");
    } else if (readiness.memberships.company > 0 || readiness.roles.includes("admin")) {
      actions.push("Workspace is ready. Continue with your role dashboard.");
    } else {
      actions.push("Complete profile assignment and membership setup.");
    }
  }
  return actions;
};

const ensureSelfOnboardingState = async (
  serviceClient: ReturnType<typeof createClient>,
  params: {
    userId: string;
    email: string | null;
    fullName: string | null;
    persona: AppPersona;
    verificationDraft: {
      entity_name: string | null;
      registration_number: string | null;
      license_number: string | null;
      jurisdiction: string | null;
    };
  },
) => {
  const mappedRole = mapPersonaToRole(params.persona);
  const workspaceType =
    params.persona === "in_house_ca"
      ? "regulon_ca"
      : params.persona === "external_ca"
        ? "external_ca"
        : null;

  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert(
      {
        user_id: params.userId,
        email: params.email,
        full_name: params.fullName,
      },
      { onConflict: "user_id" },
    );
  if (profileError) throw profileError;

  const { error: personaError } = await serviceClient
    .from("user_personas")
    .upsert(
      {
        user_id: params.userId,
        persona: params.persona,
      },
      { onConflict: "user_id" },
    );
  if (personaError) throw personaError;

  const { error: roleError } = await serviceClient
    .from("user_roles")
    .upsert(
      {
        user_id: params.userId,
        role: mappedRole,
      },
      { onConflict: "user_id,role" },
    );
  if (roleError) throw roleError;

  const { error: verificationError } = await serviceClient
    .from("user_verifications")
    .upsert(
      {
        user_id: params.userId,
        persona: params.persona,
        entity_name: params.verificationDraft.entity_name,
        registration_number: params.verificationDraft.registration_number,
        license_number: params.verificationDraft.license_number,
        jurisdiction: params.verificationDraft.jurisdiction,
        status: "pending",
        is_verified: false,
      },
      { onConflict: "user_id" },
    );
  if (verificationError) throw verificationError;

  if (workspaceType) {
    const { error: workspaceError } = await serviceClient
      .from("ca_workspace_profiles")
      .upsert(
        {
          user_id: params.userId,
          workspace_type: workspaceType,
        },
        { onConflict: "user_id" },
      );
    if (workspaceError) throw workspaceError;
  }

  return {
    role: mappedRole,
    persona: params.persona,
    workspace_type: workspaceType,
  };
};

const loadSelfOnboardingStatus = async (
  client: ReturnType<typeof createClient>,
  user: { id: string; email?: string | null; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> },
  effectivePersona: AppPersona | null,
  effectiveRoles: Set<string>,
) => {
  const userId = user.id;
  const [profileResult, personaResult, roleRowsResult, verificationResult, companyMembersResult, caFirmMembersResult] = await Promise.all([
    client.from("profiles").select("user_id, full_name, email").eq("user_id", userId).maybeSingle(),
    client.from("user_personas").select("persona").eq("user_id", userId).maybeSingle(),
    client.from("user_roles").select("role").eq("user_id", userId),
    client.from("user_verifications").select("status, is_verified").eq("user_id", userId).maybeSingle(),
    client.from("company_members").select("company_id").eq("user_id", userId),
    client.from("ca_firm_members").select("ca_firm_id").eq("user_id", userId),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (personaResult.error) throw personaResult.error;
  if (roleRowsResult.error) throw roleRowsResult.error;
  if (verificationResult.error) throw verificationResult.error;
  if (companyMembersResult.error) throw companyMembersResult.error;
  if (caFirmMembersResult.error) throw caFirmMembersResult.error;

  const rowPersona = normalizePersona(personaResult.data?.persona ?? null);
  const persona = rowPersona ?? effectivePersona ?? "company_owner";
  const roleRows = Array.from(new Set((roleRowsResult.data ?? []).map((row) => String(row.role))));
  const roles = Array.from(new Set([...roleRows, ...Array.from(effectiveRoles)]));

  const profilePresent = Boolean(profileResult.data);
  const personaPresent = Boolean(rowPersona);
  const rolePresent = roleRows.length > 0;
  const verification = verificationResult.data
    ? {
      status: typeof verificationResult.data.status === "string" ? verificationResult.data.status : "pending",
      is_verified: verificationResult.data.is_verified === true,
    }
    : null;
  const verificationPresent = Boolean(verificationResult.data);
  const companyAssignments = (companyMembersResult.data ?? []).length;
  const caFirmAssignments = (caFirmMembersResult.data ?? []).length;

  const requiresCompanyAssignment =
    persona === "company_owner" ||
    persona === "external_ca" ||
    persona === "in_house_ca" ||
    persona === "in_house_lawyer";
  const requiresCaFirmAssignment = persona === "ca_firm";
  const requiresVerification = true;

  const blockers: Array<{ code: string; message: string; severity: "critical" | "high" | "medium" }> = [];
  if (!user.email_confirmed_at) {
    blockers.push({
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified yet. Verify email before workspace access.",
      severity: "critical",
    });
  }
  if (!profilePresent) {
    blockers.push({
      code: "PROFILE_MISSING",
      message: "Profile row is missing.",
      severity: "high",
    });
  }
  if (!personaPresent) {
    blockers.push({
      code: "PERSONA_MISSING",
      message: "Persona mapping is missing.",
      severity: "high",
    });
  }
  if (!rolePresent) {
    blockers.push({
      code: "ROLE_MISSING",
      message: "Role mapping is missing.",
      severity: "high",
    });
  }
  if (requiresVerification && !verificationPresent) {
    blockers.push({
      code: "VERIFICATION_RECORD_MISSING",
      message: "Verification record is missing.",
      severity: "high",
    });
  }
  if (requiresVerification && verificationPresent && verification?.is_verified !== true) {
    blockers.push({
      code: "VERIFICATION_PENDING",
      message: "Verification is pending approval.",
      severity: "medium",
    });
  }
  if (requiresCompanyAssignment && companyAssignments === 0) {
    blockers.push({
      code: "COMPANY_ASSIGNMENT_MISSING",
      message: "No company assigned for this persona.",
      severity: "high",
    });
  }
  if (requiresCaFirmAssignment && caFirmAssignments === 0) {
    blockers.push({
      code: "CA_FIRM_ASSIGNMENT_MISSING",
      message: "No CA firm membership assigned.",
      severity: "high",
    });
  }

  return {
    user_id: userId,
    email: user.email ?? null,
    persona,
    roles,
    checks: {
      email_verified: Boolean(user.email_confirmed_at),
      profile_row_present: profilePresent,
      persona_row_present: personaPresent,
      role_row_present: rolePresent,
      verification_row_present: verificationPresent,
      verification_approved: verification?.is_verified === true,
      company_assignment_present: companyAssignments > 0,
      ca_firm_assignment_present: caFirmAssignments > 0,
    },
    verification: verification ?? { status: "missing", is_verified: false },
    memberships: {
      company: companyAssignments,
      ca_firm: caFirmAssignments,
    },
    target_dashboard: resolveTargetDashboardPath(persona, roles),
    ready_for_dashboard: blockers.length === 0,
    blockers,
    next_steps: inferReadinessActions({
      persona,
      roles,
      memberships: { company: companyAssignments, ca_firm: caFirmAssignments },
      blockers: blockers.map((item) => {
        if (item.code === "PERSONA_MISSING") return "Missing persona";
        if (item.code === "ROLE_MISSING") return "Missing app role";
        if (item.code === "COMPANY_ASSIGNMENT_MISSING") return "No company assignment";
        if (item.code === "CA_FIRM_ASSIGNMENT_MISSING") return "No CA firm membership";
        return item.message;
      }),
    }),
  };
};

const buildSelfDashboardProbe = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  persona: AppPersona | null,
  roles: string[],
) => {
  const targetPath = resolveTargetDashboardPath(persona, roles);
  try {
    if (targetPath === "/app/admin-dashboard") {
      const admin = await buildAdminDashboard(client);
      return {
        target_dashboard: targetPath,
        ok: true,
        data_shape: {
          companies: admin.companies.length,
          tasks: admin.tasks.length,
          documents: admin.documents.length,
          drafts: admin.drafts.length,
        },
      };
    }

    if (targetPath === "/app/legal-dashboard") {
      const legal = await buildLegalDashboard(client, userId);
      return {
        target_dashboard: targetPath,
        ok: true,
        data_shape: {
          companies: legal.companyIds.length,
          runs: legal.runs.length,
          events: legal.events.length,
        },
      };
    }

    if (targetPath === "/app/ca-dashboard") {
      const ca = await buildCaDashboard(client, userId);
      return {
        target_dashboard: targetPath,
        ok: true,
        data_shape: {
          companies: ca.companies.length,
          tasks: ca.tasks.length,
          deadlines: ca.deadlines.length,
          documents: ca.documents.length,
          drafts: ca.drafts.length,
        },
      };
    }

    if (targetPath === "/app/ca-firm-dashboard") {
      const firm = await buildCaFirmDashboard(client, userId);
      return {
        target_dashboard: targetPath,
        ok: true,
        data_shape: {
          firm_present: Boolean(firm.firm),
          members: firm.members.length,
          directory: firm.directory.length,
          runs: firm.runs.length,
        },
      };
    }

    const company = await buildCompanyDashboard(client, userId);
    return {
      target_dashboard: targetPath,
      ok: true,
      data_shape: {
        company_present: Boolean(company.company),
        exposures: company.exposures.length,
        tasks: company.tasks.length,
        documents: company.documents.length,
        deadlines: company.deadlines.length,
        draft_runs: company.draftRuns.length,
      },
    };
  } catch (error) {
    return {
      target_dashboard: targetPath,
      ok: false,
      error: extractErrorMessage(error),
      error_code: resolveErrorCode(extractErrorMessage(error)),
    };
  }
};

const repairUserDashboardReadinessByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
  params: {
    userId: string;
    desiredPersona?: AppPersona | null;
    companyId?: string | null;
    caFirmId?: string | null;
  },
) => {
  const userId = params.userId.trim();
  assertUuid(userId, "userId");
  const desiredPersona = params.desiredPersona ?? null;
  if (desiredPersona && !normalizePersona(desiredPersona)) {
    throw new Error("desiredPersona is invalid");
  }

  const profileReadiness = await loadSingleUserDashboardReadiness(serviceClient, userId);
  const persona = desiredPersona ?? profileReadiness.persona ?? "company_owner";
  const actions: string[] = [];

  const { error: personaError } = await serviceClient
    .from("user_personas")
    .upsert({ user_id: userId, persona }, { onConflict: "user_id" });
  if (personaError) throw personaError;
  actions.push(`persona_set:${persona}`);

  const appRole = mapPersonaToRole(persona);
  const { error: roleError } = await serviceClient
    .from("user_roles")
    .upsert({ user_id: userId, role: appRole }, { onConflict: "user_id,role" });
  if (roleError) throw roleError;
  actions.push(`role_ensured:${appRole}`);

  if (persona === "company_owner" || persona === "external_ca" || persona === "in_house_ca" || persona === "in_house_lawyer") {
    const { data: memberships, error: membershipsError } = await serviceClient
      .from("company_members")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1);
    if (membershipsError) throw membershipsError;

    if ((memberships ?? []).length === 0) {
      const explicitCompanyId = typeof params.companyId === "string" && params.companyId.trim() ? params.companyId.trim() : null;
      let companyId = explicitCompanyId;
      if (companyId) assertUuid(companyId, "companyId");
      if (!companyId) {
        const { data: existingCompany, error: companyError } = await serviceClient
          .from("companies")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (companyError) throw companyError;
        companyId = existingCompany?.id ?? null;
      }
      if (!companyId) {
        const workspaceName = profileReadiness.full_name ? `${profileReadiness.full_name} Workspace` : "Company Workspace";
        const { data: newCompany, error: newCompanyError } = await serviceClient
          .from("companies")
          .insert({ name: workspaceName, industry: null, compliance_health: 85 })
          .select("id")
          .single();
        if (newCompanyError || !newCompany) throw newCompanyError ?? new Error("Failed to create company for readiness repair");
        companyId = newCompany.id;
        actions.push("company_created");
      }

      const membershipRole: "user" | "manager" | "admin" = persona === "company_owner" ? "admin" : "manager";
      await assignCompanyMembershipByAdmin(serviceClient, { companyId, userId, role: membershipRole });
      actions.push(`company_assigned:${membershipRole}`);

      await bootstrapCompanyWorkspaceData(serviceClient, { companyId, ownerUserId: userId });
      actions.push("company_seeded");
    }
  }

  if (persona === "ca_firm") {
    const { data: firmMemberships, error: firmMembershipsError } = await serviceClient
      .from("ca_firm_members")
      .select("ca_firm_id")
      .eq("user_id", userId)
      .limit(1);
    if (firmMembershipsError) throw firmMembershipsError;

    if ((firmMemberships ?? []).length === 0) {
      const explicitFirmId = typeof params.caFirmId === "string" && params.caFirmId.trim() ? params.caFirmId.trim() : null;
      let caFirmId = explicitFirmId;
      if (caFirmId) assertUuid(caFirmId, "caFirmId");
      if (!caFirmId) {
        const { data: existingFirm, error: existingFirmError } = await serviceClient
          .from("ca_firms")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingFirmError) throw existingFirmError;
        caFirmId = existingFirm?.id ?? null;
      }
      if (!caFirmId) {
        const firmName = profileReadiness.full_name ? `${profileReadiness.full_name} & Co.` : "Regulon Partner Firm";
        const registration = `AUTO-${Date.now().toString().slice(-8)}`;
        const { data: newFirm, error: newFirmError } = await serviceClient
          .from("ca_firms")
          .insert({
            name: firmName,
            registration_number: registration,
            jurisdiction: null,
            created_by: userId,
          })
          .select("id")
          .single();
        if (newFirmError || !newFirm) throw newFirmError ?? new Error("Failed to create CA firm for readiness repair");
        caFirmId = newFirm.id;
        actions.push("ca_firm_created");
      }

      await assignCaFirmMembershipByAdmin(serviceClient, { caFirmId, userId, role: "owner" });
      actions.push("ca_firm_assigned:owner");
      await bootstrapCaFirmWorkspaceData(serviceClient, { caFirmId, ownerUserId: userId });
      actions.push("ca_firm_seeded");
    }
  }

  const readiness = await loadSingleUserDashboardReadiness(serviceClient, userId);
  return {
    repaired: true,
    actions,
    readiness,
  };
};

const repairAllDashboardReadinessByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
  options?: { limit?: number; seedWorkflows?: boolean },
) => {
  const limit = Math.max(10, Math.min(300, Number(options?.limit ?? 120)));
  const seedWorkflows = options?.seedWorkflows !== false;

  const snapshot = await listDashboardReadinessUsers(serviceClient, { limit, offset: 0 });
  const blocked = snapshot.users.filter((user) => user.dashboard_ready === false);
  const repaired: Array<{ user_id: string; ok: boolean; actions?: string[]; error?: string }> = [];

  for (const user of blocked) {
    try {
      const result = await repairUserDashboardReadinessByAdmin(serviceClient, {
        userId: user.user_id,
      });
      repaired.push({
        user_id: user.user_id,
        ok: true,
        actions: result.actions,
      });
    } catch (error) {
      repaired.push({
        user_id: user.user_id,
        ok: false,
        error: extractErrorMessage(error),
      });
    }
  }

  let workflowSeededCompanies = 0;
  const workflowSeedErrors: Array<{ company_id: string; error: string }> = [];
  if (seedWorkflows) {
    const { data: companies, error: companiesError } = await serviceClient
      .from("companies")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (companiesError) throw companiesError;

    for (const company of companies ?? []) {
      const { count: runCount, error: runCountError } = await serviceClient
        .from("draft_runs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id);
      if (runCountError) {
        workflowSeedErrors.push({ company_id: company.id, error: runCountError.message });
        continue;
      }
      if (Number(runCount ?? 0) > 0) continue;

      try {
        await bootstrapCompanyAuthorityWorkflowsByAdmin(serviceClient, { companyId: company.id });
        workflowSeededCompanies += 1;
      } catch (error) {
        workflowSeedErrors.push({
          company_id: company.id,
          error: extractErrorMessage(error),
        });
      }
    }
  }

  const after = await listDashboardReadinessUsers(serviceClient, { limit, offset: 0 });

  return {
    processed_limit: limit,
    before: snapshot.summary,
    after: after.summary,
    repaired_users: repaired.filter((item) => item.ok).length,
    failed_repairs: repaired.filter((item) => !item.ok).length,
    repair_results: repaired,
    workflow_seeded_companies: workflowSeededCompanies,
    workflow_seed_errors: workflowSeedErrors,
  };
};

const runDashboardReadinessSmokeByAdmin = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; offset?: number },
) => {
  const limit = Math.max(10, Math.min(300, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  const snapshot = await listDashboardReadinessUsers(client, { limit, offset });

  const rows: Array<{
    user_id: string;
    email: string | null;
    persona: AppPersona | null;
    roles: string[];
    target_dashboard: string;
    dashboard_ready: boolean;
    blockers: string[];
    probe_ok: boolean;
    probe_error: string | null;
    probe_error_code: string | null;
    probe_data_shape?: Record<string, unknown>;
  }> = [];

  for (const user of snapshot.users) {
    const effectiveRoles = applyPersonaRoleFallback(new Set(user.roles), user.persona);
    const probe = await buildSelfDashboardProbe(client, user.user_id, user.persona, Array.from(effectiveRoles));
    rows.push({
      user_id: user.user_id,
      email: user.email ?? null,
      persona: user.persona,
      roles: Array.from(effectiveRoles),
      target_dashboard: probe.target_dashboard,
      dashboard_ready: user.dashboard_ready,
      blockers: user.blockers,
      probe_ok: probe.ok,
      probe_error: probe.ok ? null : (typeof probe.error === "string" ? probe.error : null),
      probe_error_code: probe.ok ? null : (typeof probe.error_code === "string" ? probe.error_code : null),
      probe_data_shape: probe.ok && probe.data_shape && typeof probe.data_shape === "object"
        ? probe.data_shape as Record<string, unknown>
        : undefined,
    });
  }

  return {
    offset,
    limit,
    sampled_users: rows.length,
    summary: {
      ready_users: rows.filter((item) => item.dashboard_ready).length,
      blocked_users: rows.filter((item) => !item.dashboard_ready).length,
      probe_passed: rows.filter((item) => item.probe_ok).length,
      probe_failed: rows.filter((item) => !item.probe_ok).length,
      failed_despite_ready: rows.filter((item) => item.dashboard_ready && !item.probe_ok).length,
    },
    users: rows,
  };
};

const loadAuthorityBackendCoverage = async (
  client: ReturnType<typeof createClient>,
) => {
  const docTypes = AUTHORITY_BACKEND_COVERAGE.map((item) => item.documentType);
  const { data: policies, error: policiesError } = await client
    .from("authority_workflow_policies")
    .select("document_type, legal_review_required, final_signoff_mode, updated_at")
    .in("document_type", docTypes);
  if (policiesError) throw policiesError;

  const policyByDocType = new Map<string, { legal_review_required: boolean; final_signoff_mode: string; updated_at: string | null }>();
  for (const row of policies ?? []) {
    policyByDocType.set(String(row.document_type), {
      legal_review_required: row.legal_review_required === true,
      final_signoff_mode: typeof row.final_signoff_mode === "string" ? row.final_signoff_mode : "ca_only",
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    });
  }

  const trainingTableStats: Array<{ table: string; count: number; exists: boolean; error: string | null }> = [];
  for (const item of AUTHORITY_BACKEND_COVERAGE) {
    const { count, error } = await client
      .from(item.trainingCasesTable)
      .select("id", { count: "exact", head: true });
    if (error) {
      trainingTableStats.push({
        table: item.trainingCasesTable,
        count: 0,
        exists: false,
        error: getErrorMessage(error) || "table probe failed",
      });
      continue;
    }
    trainingTableStats.push({
      table: item.trainingCasesTable,
      count: Number(count ?? 0),
      exists: true,
      error: null,
    });
  }
  const trainingByTable = new Map(trainingTableStats.map((row) => [row.table, row]));

  const coverage = AUTHORITY_BACKEND_COVERAGE.map((item) => {
    const policy = policyByDocType.get(item.documentType) ?? null;
    const training = trainingByTable.get(item.trainingCasesTable) ?? { table: item.trainingCasesTable, count: 0, exists: false, error: "missing" };
    const policyPresent = Boolean(policy);
    const trainingPresent = training.exists;
    const ready = policyPresent && trainingPresent;
    return {
      authority: item.authority,
      document_type: item.documentType,
      workflow_policy: policy
        ? {
          legal_review_required: policy.legal_review_required,
          final_signoff_mode: policy.final_signoff_mode,
          updated_at: policy.updated_at,
        }
        : null,
      training_cases_table: item.trainingCasesTable,
      training_cases_count: training.count,
      training_table_exists: training.exists,
      training_probe_error: training.error,
      ready,
      blockers: [
        ...(policyPresent ? [] : ["Missing workflow policy row"]),
        ...(trainingPresent ? [] : [`Missing training table: ${item.trainingCasesTable}`]),
      ],
    };
  });

  return {
    authorities: coverage,
    summary: {
      total: coverage.length,
      ready: coverage.filter((item) => item.ready).length,
      blocked: coverage.filter((item) => !item.ready).length,
    },
  };
};

const bootstrapAuthorityWorkflowPoliciesByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
) => {
  const rows = AUTHORITY_BACKEND_COVERAGE.map((item) => ({
    document_type: item.documentType,
    legal_review_required: item.defaultPolicy.legalReviewRequired,
    final_signoff_mode: item.defaultPolicy.finalSignoffMode,
    notes: item.defaultPolicy.notes,
  }));

  const { data, error } = await serviceClient
    .from("authority_workflow_policies")
    .upsert(rows, { onConflict: "document_type" })
    .select("document_type, legal_review_required, final_signoff_mode, updated_at");
  if (error) throw error;
  return {
    upserted: rows.length,
    policies: data ?? [],
  };
};

const bootstrapCompanyAuthorityWorkflowsByAdmin = async (
  serviceClient: ReturnType<typeof createClient>,
  params: { companyId: string; actorUserId?: string | null },
) => {
  const companyId = params.companyId.trim();
  assertUuid(companyId, "companyId");
  const actorUserId = typeof params.actorUserId === "string" && params.actorUserId.trim() ? params.actorUserId.trim() : null;

  const seededRuns = [];
  for (const item of AUTHORITY_BACKEND_COVERAGE) {
    const seeded = await seedCompanyWorkflowByAdmin(serviceClient, {
      companyId,
      actorUserId,
      documentType: item.documentType,
      draftMode: "defensive",
    });
    seededRuns.push({
      authority: item.authority,
      document_type: item.documentType,
      draft_run_id: seeded.draft_run.id,
    });
  }

  return {
    seeded: true,
    company_id: companyId,
    total_runs: seededRuns.length,
    runs: seededRuns,
  };
};

const getRouteAccessMatrix = () => ({
  dashboards: [
    { route: "GET /onboarding/status", roles: ["authenticated"] },
    { route: "POST /onboarding/repair-self", roles: ["authenticated"] },
    { route: "GET /dashboard/readiness/self", roles: ["authenticated"] },
    { route: "GET /ops/dashboard-readiness/smoke", roles: ["admin"] },
    { route: "GET /company/dashboard", roles: ["user", "manager", "admin"] },
    { route: "POST /company/bootstrap-data", roles: ["user", "manager", "admin"] },
    { route: "GET /ca/dashboard", roles: ["manager", "admin"] },
    { route: "GET /legal/dashboard", roles: ["manager", "admin"] },
    { route: "GET /ca-firm/dashboard", roles: ["manager", "admin"] },
    { route: "POST /ca-firm/bootstrap-data", roles: ["manager", "admin"] },
    { route: "GET /admin/dashboard", roles: ["admin"] },
  ],
  drafts: [
    { route: "POST /drafts", roles: ["manager", "admin"] },
    { route: "POST /drafts/:id/snapshot", roles: ["manager", "admin"] },
    { route: "POST /drafts/:id/rollback", roles: ["manager", "admin"] },
    { route: "POST /drafts/:id/workflow-action", roles: ["manager", "admin"] },
    { route: "POST /drafts/:id/exports", roles: ["manager", "admin"] },
    { route: "POST /drafts/:id/external-legal/export", roles: ["manager", "admin"] },
    { route: "POST /drafts/:id/external-legal/signoff", roles: ["manager", "admin"] },
  ],
  adminOps: [
    { route: "GET /ops/config-check", roles: ["admin"] },
    { route: "GET /ops/security/readiness", roles: ["admin"] },
    { route: "GET /ops/security/session-check", roles: ["user", "manager", "admin"] },
    { route: "GET /ops/workflow-integrity-check", roles: ["admin"] },
    { route: "GET /ops/workflow-sla-monitor", roles: ["admin"] },
    { route: "GET /ops/tenant-isolation-check", roles: ["admin"] },
    { route: "GET /ops/deploy-readiness", roles: ["admin"] },
    { route: "GET /ops/dashboard-readiness/users", roles: ["admin"] },
    { route: "POST /ops/dashboard-readiness/repair-user", roles: ["admin"] },
    { route: "POST /ops/dashboard-readiness/repair-all", roles: ["admin"] },
    { route: "GET /ops/authority-coverage", roles: ["admin"] },
    { route: "POST /ops/authority-bootstrap", roles: ["admin"] },
    { route: "POST /ops/bootstrap/company-authority-workflows", roles: ["admin"] },
    { route: "GET /ops/route-access-matrix", roles: ["admin"] },
    { route: "GET /ops/landing/leads", roles: ["admin"] },
    { route: "GET /ops/landing/metrics", roles: ["admin"] },
    { route: "POST /ops/landing/leads/:id/status", roles: ["admin"] },
    { route: "POST /ops/assign/company-member", roles: ["admin"] },
    { route: "POST /ops/assign/ca-firm-member", roles: ["admin"] },
    { route: "POST /ops/bootstrap/company-workflow", roles: ["admin"] },
    { route: "GET /ops/runbooks", roles: ["admin"] },
    { route: "GET /ops/regression-checklist", roles: ["admin"] },
    { route: "GET /ops/prelaunch-gate", roles: ["admin"] },
    { route: "GET /drafting/ai-ops/*", roles: ["admin"] },
  ],
});

const validateAiDraftScope = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  payload: Record<string, unknown>,
) => {
  const operation = normalizeAiOperation(payload);
  assertAiOperationActorAllowed({ roles, persona, operation, payload });
  assertAiOperationPayloadShape(operation, payload);

  let companyId = typeof payload.companyId === "string" ? payload.companyId : null;
  let companyIds: string[] | null = null;
  if (companyId) {
    companyIds = await getUserCompanyIds(client, userId);
    if (!companyIds.includes(companyId)) {
      throw new Error("Forbidden");
    }
  }

  const draftRunId = typeof payload.draftRunId === "string" ? payload.draftRunId : null;
  if (draftRunId) {
    const review = await loadDraftReview(client, userId, roles, draftRunId);
    const draftCompanyId = typeof review.run.company_id === "string" ? review.run.company_id : null;
    if (companyId && draftCompanyId && draftCompanyId !== companyId) {
      throw new Error("Forbidden");
    }
    if (!companyId && draftCompanyId) {
      companyId = draftCompanyId;
    }
    const requestedDocumentType = parseDocumentType(payload);
    if (requestedDocumentType && requestedDocumentType !== String(review.run.document_type)) {
      throw new Error("documentType does not match draftRunId");
    }
  }

  if (!roles.has("admin") && !companyId) {
    const membershipIds = companyIds ?? await getUserCompanyIds(client, userId);
    if (membershipIds.length === 1) {
      companyId = membershipIds[0];
    } else {
      throw new Error("companyId is required for multi-tenant AI operations");
    }
  }

  if (companyId) {
    payload.companyId = companyId;
  }

  return { companyId };
};

const proxyAiDraft = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  token: string,
  payload: Record<string, unknown>,
) => {
  const { companyId } = await validateAiDraftScope(client, userId, roles, persona, payload);
  const entitlements = await loadActorEntitlements(client, userId);
  const lane = inferAiOperationLane({ persona, legalLaneEnabled: resolveLegalLaneEnabled(persona, entitlements) });
  const operation = normalizeAiOperation(payload);
  const draftRunId = typeof payload.draftRunId === "string" ? payload.draftRunId : null;
  const startedAt = Date.now();
  const { requestKey, cachedResponse } = await prepareAiIdempotencyLock(client, userId, operation, payload, companyId);

  if (cachedResponse) {
    await writeAiOperationAudit(client, {
      userId,
      companyId,
      draftRunId,
      operation,
      lane,
      outcome: "success",
      responseStatus: 200,
      durationMs: Date.now() - startedAt,
      payloadMeta: {
        request_key: requestKey,
        source: "idempotency_cache",
      },
    });
    return {
      ok: true,
      status: 200,
      body: cachedResponse,
      error: null,
    };
  }

  const { url, anon } = getEnv();
  const response = await fetch(`${url}/functions/v1/ai-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anon,
      "x-request-id": requestKey,
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  const aiModelUsed = response.headers.get("x-regulon-model-used");
  const aiFallbackUsedHeader = response.headers.get("x-regulon-fallback-used");
  const aiAttemptCountHeader = response.headers.get("x-regulon-attempt-count");
  const aiAttemptCount = aiAttemptCountHeader ? Number(aiAttemptCountHeader) : null;
  const modelRouterVersion = response.headers.get("x-regulon-model-router-version");

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => ({}));
    const isSuccess = response.ok;
    await finalizeAiIdempotencyLock(client, userId, requestKey, {
      status: isSuccess ? "completed" : "failed",
      responsePayload: isSuccess ? body : null,
      errorMessage: isSuccess ? null : (typeof body?.error === "string" ? body.error : `ai-draft failed (${response.status})`),
      responseStatus: response.status,
      aiModelUsed,
      aiFallbackUsed: aiFallbackUsedHeader === "true",
      aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
      modelRouterVersion,
    });
    await writeAiOperationAudit(client, {
      userId,
      companyId,
      draftRunId,
      operation,
      lane,
      outcome: isSuccess ? "success" : "failed",
      responseStatus: response.status,
      aiModelUsed,
      aiFallbackUsed: aiFallbackUsedHeader === "true",
      aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
      modelRouterVersion,
      durationMs: Date.now() - startedAt,
      errorMessage: isSuccess ? null : (typeof body?.error === "string" ? body.error : null),
      payloadMeta: {
        request_key: requestKey,
      },
    });
    return {
      ok: response.ok,
      status: response.status,
      body,
      error: typeof body?.error === "string" ? body.error : null,
    };
  }

  const text = await response.text().catch(() => "");
  await finalizeAiIdempotencyLock(client, userId, requestKey, {
    status: "failed",
    errorMessage: text || `ai-draft failed (${response.status})`,
    responseStatus: response.status,
    aiModelUsed,
    aiFallbackUsed: aiFallbackUsedHeader === "true",
    aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
    modelRouterVersion,
  });
  await writeAiOperationAudit(client, {
    userId,
    companyId,
    draftRunId,
    operation,
    lane,
    outcome: response.ok ? "success" : "failed",
    responseStatus: response.status,
    aiModelUsed,
    aiFallbackUsed: aiFallbackUsedHeader === "true",
    aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
    modelRouterVersion,
    durationMs: Date.now() - startedAt,
    errorMessage: text || `ai-draft failed (${response.status})`,
    payloadMeta: {
      request_key: requestKey,
    },
  });
  return {
    ok: response.ok,
    status: response.status,
    body: null,
    error: text || `ai-draft failed (${response.status})`,
  };
};

const proxyAiDraftStream = async (
  req: Request,
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  token: string,
  payload: Record<string, unknown>,
) => {
  const { companyId } = await validateAiDraftScope(client, userId, roles, persona, payload);
  const entitlements = await loadActorEntitlements(client, userId);
  const lane = inferAiOperationLane({ persona, legalLaneEnabled: resolveLegalLaneEnabled(persona, entitlements) });
  const operation = normalizeAiOperation(payload);
  const draftRunId = typeof payload.draftRunId === "string" ? payload.draftRunId : null;
  const startedAt = Date.now();
  const { requestKey } = await prepareAiIdempotencyLock(client, userId, operation, payload, companyId);
  const { url, anon } = getEnv();
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/ai-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anon,
        "x-request-id": requestKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "ai-draft stream request failed";
    await finalizeAiIdempotencyLock(client, userId, requestKey, { status: "failed", errorMessage });
    await writeAiOperationAudit(client, {
      userId,
      companyId,
      draftRunId,
      operation,
      lane,
      outcome: "failed",
      durationMs: Date.now() - startedAt,
      errorMessage,
      payloadMeta: { request_key: requestKey, source: "stream_fetch_error" },
    });
    throw error;
  }

  const headers = new Headers(getCorsHeaders(req));
  const contentType = response.headers.get("content-type");
  const cacheControl = response.headers.get("cache-control");
  if (contentType) headers.set("Content-Type", contentType);
  if (cacheControl) headers.set("Cache-Control", cacheControl);

  const aiModelUsed = response.headers.get("x-regulon-model-used");
  const aiFallbackUsedHeader = response.headers.get("x-regulon-fallback-used");
  const aiAttemptCountHeader = response.headers.get("x-regulon-attempt-count");
  const aiAttemptCount = aiAttemptCountHeader ? Number(aiAttemptCountHeader) : null;
  const modelRouterVersion = response.headers.get("x-regulon-model-router-version");

  await finalizeAiIdempotencyLock(client, userId, requestKey, {
    status: response.ok ? "completed" : "failed",
    errorMessage: response.ok ? null : `ai-draft stream failed (${response.status})`,
    responseStatus: response.status,
    aiModelUsed,
    aiFallbackUsed: aiFallbackUsedHeader === "true",
    aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
    modelRouterVersion,
  });
  await writeAiOperationAudit(client, {
    userId,
    companyId,
    draftRunId,
    operation,
    lane,
    outcome: response.ok ? "success" : "failed",
    responseStatus: response.status,
    aiModelUsed,
    aiFallbackUsed: aiFallbackUsedHeader === "true",
    aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
    modelRouterVersion,
    durationMs: Date.now() - startedAt,
    errorMessage: response.ok ? null : `ai-draft stream failed (${response.status})`,
    payloadMeta: { request_key: requestKey, source: "stream" },
  });

  if (response.body) {
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  const text = await response.text().catch(() => "");
  return json(req, response.status, { error: text || `ai-draft stream failed (${response.status})` });
};

const loadDraftReview = async (client: ReturnType<typeof createClient>, userId: string, roles: Set<string>, draftRunId: string) => {
  const { data: run, error: runError } = await client
    .from("draft_runs")
    .select("id, user_id, status, document_type, draft_mode, draft_content, created_at, company_id")
    .eq("id", draftRunId)
    .single();
  if (runError || !run) throw new Error("Draft not found");

  if (!roles.has("admin")) {
    if (run.user_id === userId) {
      // Always allow owner access.
    } else if (run.company_id) {
      const companyIds = await getUserCompanyIds(client, userId);
      if (!companyIds.includes(run.company_id)) {
        throw new Error("Forbidden");
      }
    } else {
      throw new Error("Forbidden");
    }
  }

  const [{ data: versions, error: versionsError }, { data: events, error: eventsError }] = await Promise.all([
    client.from("draft_versions").select("id, version_number, content, created_at").eq("draft_run_id", draftRunId).order("version_number", { ascending: false }).limit(20),
    client.from("draft_audit_events").select("id, event_type, created_at").eq("draft_run_id", draftRunId).order("created_at", { ascending: false }).limit(30),
  ]);
  if (versionsError) throw versionsError;
  if (eventsError) throw eventsError;

  return { run, versions: versions ?? [], events: events ?? [] };
};

const loadLandingOverview = async (serviceClient: ReturnType<typeof createClient>) => {
  const [{ data: content, error: contentError }, { count: leads7d, error: leadsError }] = await Promise.all([
    serviceClient
      .from("landing_public_content")
      .select("key, title, subtitle, description, cta_primary_label, cta_secondary_label, stat_regulators_covered, stat_regulatory_blueprints, stat_reasoning_prompts, stat_review_model, metadata")
      .eq("key", "homepage")
      .maybeSingle(),
    serviceClient
      .from("landing_leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  if (contentError && !isMissingRelationError(contentError, "landing_public_content")) throw contentError;
  if (leadsError && !isMissingRelationError(leadsError, "landing_leads")) throw leadsError;

  const fallback = {
    title: "REGULON",
    subtitle: "Compliance & Regulatory Command Platform",
    description:
      "AI-powered, human-verified regulatory execution for businesses. Complete compliance coverage across MCA, GST, Income Tax, RBI & SEBI.",
    cta_primary_label: "Get Started",
    cta_secondary_label: "Login to Dashboard",
    stat_regulators_covered: 5,
    stat_regulatory_blueprints: "10K+",
    stat_reasoning_prompts: "5K+",
    stat_review_model: "CA+Law",
    metadata: {},
  };

  return {
    ...fallback,
    ...(content ?? {}),
    telemetry: {
      leads_last_7d: leadsError ? 0 : (leads7d ?? 0),
    },
  };
};

const createLandingLead = async (
  serviceClient: ReturnType<typeof createClient>,
  req: Request,
  payload: Record<string, unknown>,
) => {
  await enforcePublicRateLimit(serviceClient, req, "landing-lead", { limit: 8, windowSeconds: 60 });
  const normalized = normalizeLandingLead({
    name: typeof payload.name === "string" ? payload.name : null,
    email: typeof payload.email === "string" ? payload.email : null,
    phone: typeof payload.phone === "string" ? payload.phone : null,
    companyName: typeof payload.companyName === "string" ? payload.companyName : null,
    inquiryType: typeof payload.inquiryType === "string" ? payload.inquiryType : null,
    message: typeof payload.message === "string" ? payload.message : null,
    source: typeof payload.source === "string" ? payload.source : null,
  });

  const ipHash = await hashText(getRequestIp(req));
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);

  const { data, error } = await serviceClient
    .from("landing_leads")
    .insert({
      ...normalized,
      ip_hash: ipHash,
      user_agent: userAgent,
    })
    .select("id, status, created_at")
    .single();
  if (error || !data) {
    if (isMissingRelationError(error, "landing_leads")) {
      throw new Error("Landing lead capture is not configured yet (landing_leads table missing)");
    }
    throw error ?? new Error("Failed to create landing lead");
  }
  return data;
};

const listLandingLeads = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; inquiryType?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(10, Math.min(200, Number(options?.limit ?? 50)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("landing_leads")
    .select("id, name, email, phone, company_name, inquiry_type, message, source, status, notes, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (options?.status && options.status.trim()) query = query.eq("status", options.status.trim());
  if (options?.inquiryType && options.inquiryType.trim()) query = query.eq("inquiry_type", options.inquiryType.trim());
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const loadLandingMetrics = async (client: ReturnType<typeof createClient>) => {
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [allResult, dayResult, weekResult, monthResult, statusResult, inquiryResult] = await Promise.all([
    client.from("landing_leads").select("id", { count: "exact", head: true }),
    client.from("landing_leads").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    client.from("landing_leads").select("id", { count: "exact", head: true }).gte("created_at", since7d),
    client.from("landing_leads").select("id", { count: "exact", head: true }).gte("created_at", since30d),
    client.from("landing_leads").select("status"),
    client.from("landing_leads").select("inquiry_type"),
  ]);

  if (allResult.error) throw allResult.error;
  if (dayResult.error) throw dayResult.error;
  if (weekResult.error) throw weekResult.error;
  if (monthResult.error) throw monthResult.error;
  if (statusResult.error) throw statusResult.error;
  if (inquiryResult.error) throw inquiryResult.error;

  const byStatus: Record<string, number> = {};
  for (const row of statusResult.data ?? []) {
    const key = typeof row.status === "string" && row.status.trim() ? row.status.trim() : "unknown";
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }

  const byInquiryType: Record<string, number> = {};
  for (const row of inquiryResult.data ?? []) {
    const key = typeof row.inquiry_type === "string" && row.inquiry_type.trim() ? row.inquiry_type.trim() : "unknown";
    byInquiryType[key] = (byInquiryType[key] ?? 0) + 1;
  }

  return {
    total: allResult.count ?? 0,
    leads_24h: dayResult.count ?? 0,
    leads_7d: weekResult.count ?? 0,
    leads_30d: monthResult.count ?? 0,
    by_status: byStatus,
    by_inquiry_type: byInquiryType,
  };
};

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (corsHeaders["Access-Control-Allow-Origin"] === "null") {
    return json(req, 403, { error: "Origin not allowed" });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/+/, "");

    if (req.method === "GET" && path.endsWith("health")) {
      return json(req, 200, {
        ok: true,
        service: "workspace-backend",
        time: new Date().toISOString(),
      });
    }

    if (path.endsWith("public/landing/overview") || path.endsWith("public/landing/lead")) {
      const serviceClient = getServiceClient();
      if (!serviceClient) {
        return json(req, 500, { error: "Server is not configured for public landing APIs" });
      }

      if (req.method === "GET" && path.endsWith("public/landing/overview")) {
        await enforcePublicRateLimit(serviceClient, req, "landing-overview", { limit: 60, windowSeconds: 60 });
        return json(req, 200, { ok: true, data: await loadLandingOverview(serviceClient) });
      }

      if (req.method === "POST" && path.endsWith("public/landing/lead")) {
        const body = await req.json().catch(() => ({}));
        if (!body || typeof body !== "object") {
          return json(req, 400, { error: "request body is required" });
        }
        return json(req, 200, { ok: true, data: await createLandingLead(serviceClient, req, body as Record<string, unknown>) });
      }
    }

    const { client, user, token } = await getUserClient(req);
    const persona = await getUserPersona(client, user.id, user);
    const roles = applyPersonaRoleFallback(await getUserRoles(client, user.id), persona);

    if (req.method === "GET" && path.endsWith("onboarding/status")) {
      return json(req, 200, {
        ok: true,
        data: await loadSelfOnboardingStatus(client, user, persona, roles),
      });
    }

    if (req.method === "POST" && path.endsWith("onboarding/repair-self")) {
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });

      const metadataPersona = normalizePersona(user.user_metadata?.registration_role ?? null);
      const resolvedPersona = persona ?? metadataPersona ?? "company_owner";
      const verificationDraft = {
        entity_name: typeof user.user_metadata?.verification_entity_name === "string" && user.user_metadata.verification_entity_name.trim()
          ? user.user_metadata.verification_entity_name.trim()
          : null,
        registration_number: typeof user.user_metadata?.verification_registration_number === "string" && user.user_metadata.verification_registration_number.trim()
          ? user.user_metadata.verification_registration_number.trim()
          : null,
        license_number: typeof user.user_metadata?.verification_license_number === "string" && user.user_metadata.verification_license_number.trim()
          ? user.user_metadata.verification_license_number.trim()
          : null,
        jurisdiction: typeof user.user_metadata?.verification_jurisdiction === "string" && user.user_metadata.verification_jurisdiction.trim()
          ? user.user_metadata.verification_jurisdiction.trim()
          : null,
      };

      const repaired = await ensureSelfOnboardingState(serviceClient, {
        userId: user.id,
        email: typeof user.email === "string" ? user.email : null,
        fullName: typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
          ? user.user_metadata.full_name.trim()
          : null,
        persona: resolvedPersona,
        verificationDraft,
      });

      const refreshedPersona = await getUserPersona(client, user.id, user);
      const refreshedRoles = applyPersonaRoleFallback(await getUserRoles(client, user.id), refreshedPersona);
      return json(req, 200, {
        ok: true,
        data: {
          repaired,
          status: await loadSelfOnboardingStatus(client, user, refreshedPersona, refreshedRoles),
        },
      });
    }

    if (req.method === "GET" && path.endsWith("dashboard/readiness/self")) {
      const readiness = await loadSingleUserDashboardReadiness(client, user.id);
      const probe = await buildSelfDashboardProbe(client, user.id, persona, Array.from(roles));
      return json(req, 200, {
        ok: true,
        data: {
          user_id: user.id,
          persona,
          roles: Array.from(roles),
          readiness,
          target_dashboard: resolveTargetDashboardPath(persona, Array.from(roles)),
          suggested_actions: inferReadinessActions(readiness),
          probe,
          checked_at: new Date().toISOString(),
        },
      });
    }

    if (req.method === "GET" && path.endsWith("company/dashboard")) {
      requireRole(roles, ["user", "manager", "admin"]);
      return json(req, 200, { ok: true, data: await buildCompanyDashboard(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("ca/dashboard")) {
      requireRole(roles, ["manager", "admin"]);
      return json(req, 200, { ok: true, data: await buildCaDashboard(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("ca/workspace-profile")) {
      requireRole(roles, ["manager", "admin"]);
      return json(req, 200, { ok: true, data: await loadCaWorkspaceProfile(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("drafting/preferences")) {
      requireRole(roles, ["manager", "admin"]);
      return json(req, 200, { ok: true, data: await loadPracticePreferences(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("drafting/capabilities")) {
      requireRole(roles, ["manager", "admin"]);
      const entitlements = await loadActorEntitlements(client, user.id);
      const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);
      const actorQuota = await getActorQuotaSnapshot(client, user.id);
      const firmQuota = await getFirmQuotaSnapshotForActor(client, user.id);
      const ratePolicy = {
        max_requests_per_minute: Math.max(10, Number(Deno.env.get("AI_MAX_REQUESTS_PER_MINUTE") ?? "60")),
        max_concurrent_requests: Math.max(1, Number(Deno.env.get("AI_MAX_CONCURRENT_REQUESTS") ?? "2")),
        lock_window_seconds: Math.max(15, Number(Deno.env.get("AI_LOCK_WINDOW_SECONDS") ?? "120")),
      };

      return json(req, 200, {
        ok: true,
        data: {
          persona,
          roles,
          capabilities: {
            can_draft_generate: persona === "external_ca" || persona === "in_house_ca" || persona === "ca_firm" || roles.has("admin"),
            can_lawyer_manual_override: persona === "in_house_lawyer" || roles.has("admin"),
            can_internal_legal_lane: legalLaneEnabled,
            can_assistant_access: entitlements.assistantAccessEnabled,
          },
          entitlement: {
            regulon_legal_lane_enabled: entitlements.regulonLegalLaneEnabled,
            assistant_access_enabled: entitlements.assistantAccessEnabled,
            plan_monthly_request_limit: entitlements.planMonthlyRequestLimit,
          },
          quota: {
            actor: actorQuota,
            firm: firmQuota,
          },
          rate_policy: ratePolicy,
        },
      });
    }

    if (req.method === "GET" && path.endsWith("ops/config-check")) {
      requireRole(roles, ["admin"]);
      const envKeys = {
        SUPABASE_URL: Boolean(Deno.env.get("SUPABASE_URL")),
        SUPABASE_ANON_KEY: Boolean(Deno.env.get("SUPABASE_ANON_KEY")),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
        ALLOWED_ORIGINS: Boolean((Deno.env.get("ALLOWED_ORIGINS") ?? "").trim()),
        OPENAI_API_KEY: Boolean(Deno.env.get("OPENAI_API_KEY")),
        OPENAI_MODEL: Boolean(Deno.env.get("OPENAI_MODEL")),
      };

      const [{ data: tablesProbe, error: probeError }] = await Promise.all([
        client
          .from("user_roles")
          .select("user_id")
          .limit(1),
      ]);

      return json(req, 200, {
        ok: true,
        auth_user_id: user.id,
        persona,
        roles,
        env_present: envKeys,
        db_probe_ok: !probeError,
        db_probe_rows: (tablesProbe ?? []).length,
      });
    }

    if (req.method === "GET" && path.endsWith("ops/security/session-check")) {
      requireRole(roles, ["user", "manager", "admin"]);
      const claims = decodeJwtPayload(token) ?? {};
      const exp = typeof claims.exp === "number" ? claims.exp : null;
      const iat = typeof claims.iat === "number" ? claims.iat : null;
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresInSeconds = exp ? exp - nowSeconds : null;

      return json(req, 200, {
        ok: true,
        data: {
          user_id: user.id,
          persona,
          roles: Array.from(roles),
          session: {
            issued_at_unix: iat,
            expires_at_unix: exp,
            expires_in_seconds: expiresInSeconds,
            is_expired: typeof expiresInSeconds === "number" ? expiresInSeconds <= 0 : null,
          },
        },
      });
    }

    if (req.method === "GET" && path.endsWith("ops/security/readiness")) {
      requireRole(roles, ["admin"]);
      const result = await collectSecurityReadinessSignals(client);
      return json(req, 200, {
        ok: true,
        data: {
          ...result,
          checked_at: new Date().toISOString(),
        },
      });
    }

    if (req.method === "GET" && path.endsWith("ops/deploy-readiness")) {
      requireRole(roles, ["admin"]);
      const result = await collectDeployReadinessSignals(client);
      return json(req, 200, {
        ok: true,
        data: {
          ...result.evaluation,
          signals: result.signals,
          checked_at: new Date().toISOString(),
        },
      });
    }

    if (req.method === "GET" && path.endsWith("ops/dashboard-readiness/users")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 100);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listDashboardReadinessUsers(client, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 100,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/dashboard-readiness/repair-user")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      const body = await req.json().catch(() => ({}));
      const userId = typeof body.userId === "string" ? body.userId.trim() : "";
      if (!userId) return json(req, 400, { error: "userId is required" });
      const desiredPersona = normalizePersona(body.desiredPersona ?? null);
      const companyId = typeof body.companyId === "string" ? body.companyId.trim() : null;
      const caFirmId = typeof body.caFirmId === "string" ? body.caFirmId.trim() : null;
      return json(req, 200, {
        ok: true,
        data: await repairUserDashboardReadinessByAdmin(serviceClient, {
          userId,
          desiredPersona,
          companyId,
          caFirmId,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/dashboard-readiness/repair-all")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      const body = await req.json().catch(() => ({}));
      const limitRaw = Number(body.limit ?? 120);
      const seedWorkflows = body.seedWorkflows !== false;
      return json(req, 200, {
        ok: true,
        data: await repairAllDashboardReadinessByAdmin(serviceClient, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          seedWorkflows,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/dashboard-readiness/smoke")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await runDashboardReadinessSmokeByAdmin(client, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/authority-coverage")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await loadAuthorityBackendCoverage(client),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/authority-bootstrap")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      return json(req, 200, {
        ok: true,
        data: await bootstrapAuthorityWorkflowPoliciesByAdmin(serviceClient),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/bootstrap/company-authority-workflows")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      const body = await req.json().catch(() => ({}));
      const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
      if (!companyId) return json(req, 400, { error: "companyId is required" });
      const actorUserId = typeof body.actorUserId === "string" ? body.actorUserId.trim() : null;
      return json(req, 200, {
        ok: true,
        data: await bootstrapCompanyAuthorityWorkflowsByAdmin(serviceClient, { companyId, actorUserId }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/workflow-integrity-check")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 200);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 200;
      const companyId = url.searchParams.get("company_id");
      return json(req, 200, {
        ok: true,
        data: await runWorkflowIntegrityCheck(client, {
          limit,
          companyId,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/workflow-sla-monitor")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 400);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 400;
      const companyId = url.searchParams.get("company_id");
      const generatedWarnHoursRaw = Number(url.searchParams.get("generated_warn_hours") ?? 24);
      const reviewWarnHoursRaw = Number(url.searchParams.get("review_warn_hours") ?? 24);
      const approvedWarnHoursRaw = Number(url.searchParams.get("approved_warn_hours") ?? 48);
      return json(req, 200, {
        ok: true,
        data: await runWorkflowSlaMonitor(client, {
          limit,
          companyId,
          generatedWarnHours: Number.isFinite(generatedWarnHoursRaw) ? generatedWarnHoursRaw : 24,
          reviewWarnHours: Number.isFinite(reviewWarnHoursRaw) ? reviewWarnHoursRaw : 24,
          approvedWarnHours: Number.isFinite(approvedWarnHoursRaw) ? approvedWarnHoursRaw : 48,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/tenant-isolation-check")) {
      requireRole(roles, ["admin"]);
      const limitPerTableRaw = Number(url.searchParams.get("limit_per_table") ?? 3000);
      return json(req, 200, {
        ok: true,
        data: await runTenantIsolationCheck(client, {
          limitPerTable: Number.isFinite(limitPerTableRaw) ? limitPerTableRaw : 3000,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/route-access-matrix")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: getRouteAccessMatrix(),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/runbooks")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: buildOpsRunbooks(),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/regression-checklist")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: buildRegressionChecklist(),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/prelaunch-gate")) {
      requireRole(roles, ["admin"]);
      const signals = await collectPrelaunchSignals(client);
      return json(req, 200, {
        ok: true,
        data: {
          ...computePrelaunchGate(signals),
          signals,
          generated_at: new Date().toISOString(),
        },
      });
    }

    if (req.method === "GET" && path.endsWith("ops/landing/leads")) {
      requireRole(roles, ["admin"]);
      const status = url.searchParams.get("status");
      const inquiryType = url.searchParams.get("inquiry_type");
      const limitRaw = Number(url.searchParams.get("limit") ?? 50);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listLandingLeads(client, {
          status,
          inquiryType,
          limit: Number.isFinite(limitRaw) ? limitRaw : 50,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/landing/metrics")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await loadLandingMetrics(client),
      });
    }

    if (req.method === "POST" && path.includes("ops/landing/leads/") && path.endsWith("/status")) {
      requireRole(roles, ["admin"]);
      const leadId = path.split("ops/landing/leads/")[1].replace("/status", "");
      const body = await req.json().catch(() => ({}));
      const statusRaw = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
      const allowedStatuses = new Set(["new", "contacted", "qualified", "closed", "spam"]);
      if (!allowedStatuses.has(statusRaw)) {
        return json(req, 400, { error: "status must be one of: new, contacted, qualified, closed, spam" });
      }
      const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;
      const { data, error } = await client
        .from("landing_leads")
        .update({ status: statusRaw, notes })
        .eq("id", leadId)
        .select("id, status, notes, updated_at")
        .maybeSingle();
      if (error) return json(req, 400, { error: error.message });
      if (!data) return json(req, 404, { error: "landing lead not found" });
      return json(req, 200, { ok: true, data });
    }

    if (req.method === "POST" && path.endsWith("ops/assign/company-member")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      const body = await req.json().catch(() => ({}));
      const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
      const userId = typeof body.userId === "string" ? body.userId.trim() : "";
      const roleRaw = typeof body.role === "string" ? body.role.trim().toLowerCase() : "user";
      const role = roleRaw === "admin" || roleRaw === "manager" ? roleRaw : "user";
      return json(req, 200, {
        ok: true,
        data: await assignCompanyMembershipByAdmin(serviceClient, { companyId, userId, role }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/assign/ca-firm-member")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      const body = await req.json().catch(() => ({}));
      const caFirmId = typeof body.caFirmId === "string" ? body.caFirmId.trim() : "";
      const userId = typeof body.userId === "string" ? body.userId.trim() : "";
      const roleRaw = typeof body.role === "string" ? body.role.trim().toLowerCase() : "analyst";
      const role = roleRaw === "owner" || roleRaw === "partner" || roleRaw === "manager" ? roleRaw : "analyst";
      return json(req, 200, {
        ok: true,
        data: await assignCaFirmMembershipByAdmin(serviceClient, { caFirmId, userId, role }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/bootstrap/company-workflow")) {
      requireRole(roles, ["admin"]);
      const serviceClient = getServiceClient();
      if (!serviceClient) return json(req, 500, { error: "Missing Supabase service role configuration" });
      const body = await req.json().catch(() => ({}));
      const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
      const actorUserId = typeof body.actorUserId === "string" ? body.actorUserId.trim() : null;
      const documentType = typeof body.documentType === "string" ? body.documentType : null;
      const draftMode = typeof body.draftMode === "string" ? body.draftMode : null;
      return json(req, 200, {
        ok: true,
        data: await seedCompanyWorkflowByAdmin(serviceClient, { companyId, actorUserId, documentType, draftMode }),
      });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/actor-entitlement")) {
      requireRole(roles, ["admin"]);
      const actorUserId = (url.searchParams.get("user_id") || "").trim();
      if (!actorUserId) return json(req, 400, { error: "user_id is required" });

      const [{ data: profile, error: profileError }, { data: entitlement, error: entitlementError }] = await Promise.all([
        client.from("profiles").select("user_id, full_name, email").eq("user_id", actorUserId).maybeSingle(),
        client
          .from("ca_actor_entitlements")
          .select("regulon_legal_lane_enabled, assistant_access_enabled, plan_monthly_request_limit, notes, updated_at")
          .eq("user_id", actorUserId)
          .maybeSingle(),
      ]);
      if (profileError) return json(req, 400, { error: profileError.message });
      if (entitlementError) return json(req, 400, { error: entitlementError.message });
      if (!profile) return json(req, 404, { error: "actor user not found" });

      return json(req, 200, {
        ok: true,
        actor: {
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
        },
        entitlement: {
          regulon_legal_lane_enabled: entitlement?.regulon_legal_lane_enabled === true,
          assistant_access_enabled: entitlement?.assistant_access_enabled !== false,
          plan_monthly_request_limit: entitlement?.plan_monthly_request_limit ?? null,
          notes: entitlement?.notes ?? null,
          updated_at: entitlement?.updated_at ?? null,
        },
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai-ops/actor-entitlement")) {
      requireRole(roles, ["admin"]);
      const body = await req.json();
      const actorUserId = String(body.user_id || "").trim();
      if (!actorUserId) return json(req, 400, { error: "user_id is required" });

      const legalLaneEnabled = body.regulon_legal_lane_enabled === true;
      const assistantAccessEnabled = body.assistant_access_enabled !== false;
      const planLimitRaw = body.plan_monthly_request_limit;
      const planMonthlyRequestLimit =
        planLimitRaw === null || typeof planLimitRaw === "undefined"
          ? null
          : Number.isFinite(Number(planLimitRaw))
            ? Math.max(100, Math.min(500000, Math.floor(Number(planLimitRaw))))
            : null;
      if (typeof planLimitRaw !== "undefined" && planLimitRaw !== null && planMonthlyRequestLimit === null) {
        return json(req, 400, { error: "plan_monthly_request_limit must be numeric or null" });
      }

      const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 1000) : null;

      const { error: upsertError } = await client
        .from("ca_actor_entitlements")
        .upsert({
          user_id: actorUserId,
          regulon_legal_lane_enabled: legalLaneEnabled,
          assistant_access_enabled: assistantAccessEnabled,
          plan_monthly_request_limit: planMonthlyRequestLimit,
          notes,
        }, { onConflict: "user_id" });
      if (upsertError) return json(req, 400, { error: upsertError.message });

      return json(req, 200, {
        ok: true,
        data: {
          user_id: actorUserId,
          regulon_legal_lane_enabled: legalLaneEnabled,
          assistant_access_enabled: assistantAccessEnabled,
          plan_monthly_request_limit: planMonthlyRequestLimit,
          notes,
        },
      });
    }

    if (req.method === "GET" && path.endsWith("drafting/workflow-policy")) {
      requireRole(roles, ["admin"]);
      const documentType = (url.searchParams.get("document_type") || "").trim();
      if (!documentType) return json(req, 400, { error: "document_type is required" });

      const { data, error } = await client
        .from("authority_workflow_policies")
        .select("document_type, legal_review_required, final_signoff_mode, notes, updated_at")
        .eq("document_type", documentType)
        .maybeSingle();
      if (error) return json(req, 400, { error: error.message });

      return json(req, 200, {
        ok: true,
        data: data ?? {
          document_type: documentType,
          legal_review_required: false,
          final_signoff_mode: "ca_only",
          notes: null,
          updated_at: null,
        },
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/workflow-policy")) {
      requireRole(roles, ["admin"]);
      const body = await req.json();
      const documentType = String(body.document_type || "").trim();
      if (!documentType) return json(req, 400, { error: "document_type is required" });
      const legalReviewRequired = body.legal_review_required === true;
      const finalSignoffMode =
        body.final_signoff_mode === "lawyer_only" || body.final_signoff_mode === "dual" || body.final_signoff_mode === "ca_only"
          ? body.final_signoff_mode
          : "ca_only";
      const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 1000) : null;

      const { error } = await client
        .from("authority_workflow_policies")
        .upsert({
          document_type: documentType,
          legal_review_required: legalReviewRequired,
          final_signoff_mode: finalSignoffMode,
          notes,
        }, { onConflict: "document_type" });
      if (error) return json(req, 400, { error: error.message });

      return json(req, 200, {
        ok: true,
        data: {
          document_type: documentType,
          legal_review_required: legalReviewRequired,
          final_signoff_mode: finalSignoffMode,
          notes,
        },
      });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/stats")) {
      requireRole(roles, ["admin"]);
      const sinceHoursRaw = Number(url.searchParams.get("since_hours") ?? 24);
      const sinceHours = Number.isFinite(sinceHoursRaw) ? Math.max(1, Math.min(168, sinceHoursRaw)) : 24;
      const sampleLimitRaw = Number(url.searchParams.get("sample_limit") ?? 2000);
      const sampleLimit = Number.isFinite(sampleLimitRaw) ? Math.max(100, Math.min(5000, sampleLimitRaw)) : 2000;
      const sinceIso = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();
      const lockWindowSeconds = Math.max(15, Number(Deno.env.get("AI_LOCK_WINDOW_SECONDS") ?? "120"));

      const { data: rows, error: rowsError } = await client
        .from("ai_request_idempotency")
        .select("user_id, status, response_status, ai_model_used, ai_fallback_used, ai_attempt_count, error_message, created_at, updated_at, completed_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(sampleLimit);
      if (rowsError) return json(req, 400, { error: rowsError.message });

      const allRows = rows ?? [];
      const statusCounts = { processing: 0, completed: 0, failed: 0 };
      for (const row of allRows) {
        if (row.status === "processing") statusCounts.processing += 1;
        if (row.status === "completed") statusCounts.completed += 1;
        if (row.status === "failed") statusCounts.failed += 1;
      }

      const modelBreakdown: Record<string, number> = {};
      let fallbackUsageCount = 0;
      let attemptsTotal = 0;
      let attemptsCount = 0;
      let rateLimitErrorCount = 0;
      const latenciesMs: number[] = [];
      const userRequestCount: Record<string, number> = {};
      const userFailureCount: Record<string, number> = {};

      for (const row of allRows) {
        if (typeof row.user_id === "string") {
          userRequestCount[row.user_id] = (userRequestCount[row.user_id] ?? 0) + 1;
          if (row.status === "failed") {
            userFailureCount[row.user_id] = (userFailureCount[row.user_id] ?? 0) + 1;
          }
        }
        if (typeof row.ai_model_used === "string" && row.ai_model_used.trim()) {
          modelBreakdown[row.ai_model_used] = (modelBreakdown[row.ai_model_used] ?? 0) + 1;
        }
        if (row.ai_fallback_used === true) fallbackUsageCount += 1;
        if (typeof row.ai_attempt_count === "number" && Number.isFinite(row.ai_attempt_count)) {
          attemptsTotal += row.ai_attempt_count;
          attemptsCount += 1;
        }
        if (typeof row.error_message === "string" && /rate limit|429|too_many/i.test(row.error_message)) {
          rateLimitErrorCount += 1;
        }
        const created = Date.parse(row.created_at ?? "");
        const completed = Date.parse(row.completed_at ?? "");
        if (!Number.isNaN(created) && !Number.isNaN(completed) && completed >= created) {
          latenciesMs.push(completed - created);
        }
      }

      latenciesMs.sort((a, b) => a - b);
      const p95Index = latenciesMs.length > 0 ? Math.floor(latenciesMs.length * 0.95) : -1;
      const p95LatencyMs = p95Index >= 0 ? latenciesMs[Math.min(latenciesMs.length - 1, p95Index)] : null;
      const avgLatencyMs = latenciesMs.length > 0 ? Math.round(latenciesMs.reduce((sum, value) => sum + value, 0) / latenciesMs.length) : null;
      const avgAttemptCount = attemptsCount > 0 ? Number((attemptsTotal / attemptsCount).toFixed(2)) : null;
      const staleProcessingCount = allRows.filter((row) => row.status === "processing" && isLockFresh(row.updated_at, lockWindowSeconds) === false).length;
      const topUsers = Object.entries(userRequestCount)
        .map(([userId, requestCount]) => ({
          user_id: userId,
          request_count: requestCount,
          failed_count: userFailureCount[userId] ?? 0,
        }))
        .sort((a, b) => b.request_count - a.request_count)
        .slice(0, 10);

      return json(req, 200, {
        ok: true,
        since_hours: sinceHours,
        sampled_rows: allRows.length,
        counts: {
          ...statusCounts,
          stale_processing: staleProcessingCount,
        },
        health: {
          avg_attempt_count: avgAttemptCount,
          avg_latency_ms: avgLatencyMs,
          p95_latency_ms: p95LatencyMs,
          fallback_usage_rate: allRows.length > 0 ? Number((fallbackUsageCount / allRows.length).toFixed(4)) : 0,
          rate_limit_error_count: rateLimitErrorCount,
        },
        model_breakdown: modelBreakdown,
        top_users: topUsers,
      });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/audit")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 200);
      const limit = Number.isFinite(limitRaw) ? Math.max(20, Math.min(1000, limitRaw)) : 200;
      const outcome = (url.searchParams.get("outcome") || "").trim();
      const operation = (url.searchParams.get("operation") || "").trim();
      const userId = (url.searchParams.get("user_id") || "").trim();
      const companyId = (url.searchParams.get("company_id") || "").trim();

      let query = client
        .from("ai_operation_audit")
        .select("id, user_id, company_id, draft_run_id, operation, lane, outcome, response_status, ai_model_used, ai_fallback_used, ai_attempt_count, duration_ms, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (outcome) query = query.eq("outcome", outcome);
      if (operation) query = query.eq("operation", operation);
      if (userId) query = query.eq("user_id", userId);
      if (companyId) query = query.eq("company_id", companyId);

      const { data, error } = await query;
      if (error) return json(req, 400, { error: error.message });

      return json(req, 200, { ok: true, data: data ?? [] });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/audit-summary")) {
      requireRole(roles, ["admin"]);
      const sinceHoursRaw = Number(url.searchParams.get("since_hours") ?? 24);
      const sinceHours = Number.isFinite(sinceHoursRaw) ? Math.max(1, Math.min(168, sinceHoursRaw)) : 24;
      const sinceIso = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

      const { data, error } = await client
        .from("ai_operation_audit")
        .select("operation, lane, outcome, duration_ms, ai_model_used, ai_fallback_used, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) return json(req, 400, { error: error.message });

      const rows = data ?? [];
      const counts = {
        total: rows.length,
        success: rows.filter((row) => row.outcome === "success").length,
        failed: rows.filter((row) => row.outcome === "failed").length,
      };
      const byOperation: Record<string, number> = {};
      const byLane: Record<string, number> = {};
      const byModel: Record<string, number> = {};
      let fallbackCount = 0;
      const durations: number[] = [];

      for (const row of rows) {
        byOperation[row.operation] = (byOperation[row.operation] ?? 0) + 1;
        const lane = row.lane || "unknown";
        byLane[lane] = (byLane[lane] ?? 0) + 1;
        const model = row.ai_model_used || "unknown";
        byModel[model] = (byModel[model] ?? 0) + 1;
        if (row.ai_fallback_used === true) fallbackCount += 1;
        if (typeof row.duration_ms === "number" && Number.isFinite(row.duration_ms) && row.duration_ms >= 0) {
          durations.push(row.duration_ms);
        }
      }

      durations.sort((a, b) => a - b);
      const p95Idx = durations.length > 0 ? Math.floor(durations.length * 0.95) : -1;
      const p95DurationMs = p95Idx >= 0 ? durations[Math.min(durations.length - 1, p95Idx)] : null;
      const avgDurationMs = durations.length > 0
        ? Math.round(durations.reduce((sum, val) => sum + val, 0) / durations.length)
        : null;

      return json(req, 200, {
        ok: true,
        since_hours: sinceHours,
        counts,
        avg_duration_ms: avgDurationMs,
        p95_duration_ms: p95DurationMs,
        fallback_usage_rate: rows.length > 0 ? Number((fallbackCount / rows.length).toFixed(4)) : 0,
        by_operation: byOperation,
        by_lane: byLane,
        by_model: byModel,
      });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/actor-usage")) {
      requireRole(roles, ["admin"]);
      const actorUserId = (url.searchParams.get("user_id") || "").trim();
      if (!actorUserId) return json(req, 400, { error: "user_id is required" });

      const monthStart = parseMonthStart(url.searchParams.get("month"));
      const [{ data: actorProfile, error: actorError }, { data: quota, error: quotaError }, { data: usage, error: usageError }] = await Promise.all([
        client.from("profiles").select("user_id, full_name, email").eq("user_id", actorUserId).maybeSingle(),
        client.from("ai_actor_usage_quotas").select("monthly_request_limit, hard_block, updated_at").eq("user_id", actorUserId).maybeSingle(),
        client.from("ai_actor_monthly_usage").select("request_count, updated_at").eq("user_id", actorUserId).eq("month_start", monthStart).maybeSingle(),
      ]);
      if (actorError) return json(req, 400, { error: actorError.message });
      if (quotaError) return json(req, 400, { error: quotaError.message });
      if (usageError) return json(req, 400, { error: usageError.message });
      if (!actorProfile) return json(req, 404, { error: "actor user not found" });

      const defaultMonthlyLimit = Math.max(100, Number(Deno.env.get("AI_DEFAULT_ACTOR_MONTHLY_LIMIT") ?? "4000"));
      const limit = Number(quota?.monthly_request_limit ?? defaultMonthlyLimit);
      const consumed = Number(usage?.request_count ?? 0);

      return json(req, 200, {
        ok: true,
        actor: {
          user_id: actorProfile.user_id,
          full_name: actorProfile.full_name,
          email: actorProfile.email,
        },
        month_start: monthStart,
        quota: {
          monthly_request_limit: limit,
          hard_block: Boolean(quota?.hard_block),
          updated_at: quota?.updated_at ?? null,
        },
        usage: {
          request_count: consumed,
          remaining: Math.max(0, limit - consumed),
          utilization_rate: limit > 0 ? Number((consumed / limit).toFixed(4)) : 0,
          updated_at: usage?.updated_at ?? null,
        },
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai-ops/actor-quota")) {
      requireRole(roles, ["admin"]);
      const body = await req.json();
      const actorUserId = String(body.user_id || "").trim();
      if (!actorUserId) return json(req, 400, { error: "user_id is required" });

      const monthlyLimitRaw = Number(body.monthly_request_limit ?? Number.NaN);
      const monthlyRequestLimit = Number.isFinite(monthlyLimitRaw)
        ? Math.max(100, Math.min(500000, Math.floor(monthlyLimitRaw)))
        : null;
      if (monthlyRequestLimit === null) {
        return json(req, 400, { error: "monthly_request_limit is required" });
      }
      const hardBlock = body.hard_block === true;

      const { error: upsertError } = await client
        .from("ai_actor_usage_quotas")
        .upsert({
          user_id: actorUserId,
          monthly_request_limit: monthlyRequestLimit,
          hard_block: hardBlock,
        }, { onConflict: "user_id" });
      if (upsertError) return json(req, 400, { error: upsertError.message });

      return json(req, 200, {
        ok: true,
        data: {
          user_id: actorUserId,
          monthly_request_limit: monthlyRequestLimit,
          hard_block: hardBlock,
        },
      });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/actor-usage-summary")) {
      requireRole(roles, ["admin"]);
      const monthStart = parseMonthStart(url.searchParams.get("month"));
      const limitRaw = Number(url.searchParams.get("limit") ?? 100);
      const limit = Number.isFinite(limitRaw) ? Math.max(10, Math.min(1000, limitRaw)) : 100;

      const { data: usageRows, error: usageError } = await client
        .from("ai_actor_monthly_usage")
        .select("user_id, request_count, updated_at")
        .eq("month_start", monthStart)
        .order("request_count", { ascending: false })
        .limit(limit);
      if (usageError) return json(req, 400, { error: usageError.message });

      const rows = usageRows ?? [];
      if (!rows.length) return json(req, 200, { ok: true, month_start: monthStart, actors: [] });

      const actorUserIds = Array.from(new Set(rows.map((row) => row.user_id)));
      const [{ data: profileRows, error: profileError }, { data: quotaRows, error: quotaError }] = await Promise.all([
        client.from("profiles").select("user_id, full_name, email").in("user_id", actorUserIds),
        client.from("ai_actor_usage_quotas").select("user_id, monthly_request_limit, hard_block").in("user_id", actorUserIds),
      ]);
      if (profileError) return json(req, 400, { error: profileError.message });
      if (quotaError) return json(req, 400, { error: quotaError.message });

      const profileMap = new Map((profileRows ?? []).map((row) => [row.user_id, row]));
      const quotaMap = new Map((quotaRows ?? []).map((row) => [row.user_id, row]));
      const defaultMonthlyLimit = Math.max(100, Number(Deno.env.get("AI_DEFAULT_ACTOR_MONTHLY_LIMIT") ?? "4000"));

      const actors = rows.map((row) => {
        const quota = quotaMap.get(row.user_id);
        const profile = profileMap.get(row.user_id);
        const limitValue = Number(quota?.monthly_request_limit ?? defaultMonthlyLimit);
        return {
          user_id: row.user_id,
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          request_count: row.request_count,
          monthly_request_limit: limitValue,
          hard_block: Boolean(quota?.hard_block),
          utilization_rate: limitValue > 0 ? Number((row.request_count / limitValue).toFixed(4)) : 0,
          updated_at: row.updated_at,
        };
      });

      return json(req, 200, { ok: true, month_start: monthStart, actors });
    }

    if (req.method === "GET" && path.endsWith("drafting/ai-ops/firm-usage")) {
      requireRole(roles, ["admin"]);
      const caFirmId = (url.searchParams.get("ca_firm_id") || "").trim();
      if (!caFirmId) return json(req, 400, { error: "ca_firm_id is required" });
      const monthStart = parseMonthStart(url.searchParams.get("month"));

      const [{ data: firm, error: firmError }, { data: quota, error: quotaError }, { data: usage, error: usageError }] = await Promise.all([
        client.from("ca_firms").select("id, name, registration_number").eq("id", caFirmId).maybeSingle(),
        client.from("ai_firm_usage_quotas").select("monthly_request_limit, hard_block, updated_at").eq("ca_firm_id", caFirmId).maybeSingle(),
        client.from("ai_firm_monthly_usage").select("request_count, updated_at").eq("ca_firm_id", caFirmId).eq("month_start", monthStart).maybeSingle(),
      ]);
      if (firmError) return json(req, 400, { error: firmError.message });
      if (quotaError) return json(req, 400, { error: quotaError.message });
      if (usageError) return json(req, 400, { error: usageError.message });
      if (!firm) return json(req, 404, { error: "ca firm not found" });

      const defaultMonthlyLimit = Math.max(500, Number(Deno.env.get("AI_DEFAULT_FIRM_MONTHLY_LIMIT") ?? "15000"));
      const limit = Number(quota?.monthly_request_limit ?? defaultMonthlyLimit);
      const consumed = Number(usage?.request_count ?? 0);
      return json(req, 200, {
        ok: true,
        firm,
        month_start: monthStart,
        quota: {
          monthly_request_limit: limit,
          hard_block: Boolean(quota?.hard_block),
          updated_at: quota?.updated_at ?? null,
        },
        usage: {
          request_count: consumed,
          remaining: Math.max(0, limit - consumed),
          utilization_rate: limit > 0 ? Number((consumed / limit).toFixed(4)) : 0,
          updated_at: usage?.updated_at ?? null,
        },
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai-ops/firm-quota")) {
      requireRole(roles, ["admin"]);
      const body = await req.json();
      const caFirmId = String(body.ca_firm_id || "").trim();
      if (!caFirmId) return json(req, 400, { error: "ca_firm_id is required" });

      const monthlyLimitRaw = Number(body.monthly_request_limit ?? Number.NaN);
      const monthlyRequestLimit = Number.isFinite(monthlyLimitRaw)
        ? Math.max(500, Math.min(1000000, Math.floor(monthlyLimitRaw)))
        : null;
      if (monthlyRequestLimit === null) return json(req, 400, { error: "monthly_request_limit is required" });
      const hardBlock = body.hard_block === true;

      const { error } = await client
        .from("ai_firm_usage_quotas")
        .upsert({
          ca_firm_id: caFirmId,
          monthly_request_limit: monthlyRequestLimit,
          hard_block: hardBlock,
        }, { onConflict: "ca_firm_id" });
      if (error) return json(req, 400, { error: error.message });

      return json(req, 200, {
        ok: true,
        data: {
          ca_firm_id: caFirmId,
          monthly_request_limit: monthlyRequestLimit,
          hard_block: hardBlock,
        },
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai-ops/recover-stale")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      const staleMinutesRaw = Number(body?.stale_minutes ?? 15);
      const staleMinutes = Number.isFinite(staleMinutesRaw) ? Math.max(1, Math.min(240, staleMinutesRaw)) : 15;
      const limitRaw = Number(body?.limit ?? 500);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(5000, limitRaw)) : 500;

      const { data: processingRows, error: processingError } = await client
        .from("ai_request_idempotency")
        .select("id, user_id, request_key, updated_at")
        .eq("status", "processing")
        .order("updated_at", { ascending: true })
        .limit(limit * 2);
      if (processingError) return json(req, 400, { error: processingError.message });

      const staleRows = (processingRows ?? [])
        .filter((row) => isOlderThanMinutes(row.updated_at, staleMinutes))
        .slice(0, limit);

      if (!staleRows.length) {
        return json(req, 200, { ok: true, recovered: 0, stale_minutes: staleMinutes });
      }

      let recovered = 0;
      for (const row of staleRows) {
        const { error: updateError } = await client
          .from("ai_request_idempotency")
          .update({
            status: "failed",
            error_message: "Recovered from stale processing lock",
            completed_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("status", "processing");
        if (!updateError) recovered += 1;
      }

      return json(req, 200, {
        ok: true,
        recovered,
        stale_minutes: staleMinutes,
        sample_request_keys: staleRows.slice(0, 10).map((row) => row.request_key),
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai-ops/cleanup")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      const retentionDaysRaw = Number(body?.retention_days ?? 30);
      const retentionDays = Number.isFinite(retentionDaysRaw) ? Math.max(3, Math.min(180, retentionDaysRaw)) : 30;
      const limitRaw = Number(body?.limit ?? 2000);
      const limit = Number.isFinite(limitRaw) ? Math.max(100, Math.min(10000, limitRaw)) : 2000;
      const dryRun = body?.dry_run === true;
      const cutoffIso = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

      const { data: staleRows, error: staleRowsError } = await client
        .from("ai_request_idempotency")
        .select("id")
        .in("status", ["completed", "failed"])
        .lt("created_at", cutoffIso)
        .order("created_at", { ascending: true })
        .limit(limit);
      if (staleRowsError) return json(req, 400, { error: staleRowsError.message });

      const ids = (staleRows ?? []).map((row) => row.id);
      if (!ids.length) {
        return json(req, 200, { ok: true, dry_run: dryRun, deleted: 0, retention_days: retentionDays });
      }

      if (dryRun) {
        return json(req, 200, {
          ok: true,
          dry_run: true,
          candidates: ids.length,
          retention_days: retentionDays,
          sample_ids: ids.slice(0, 10),
        });
      }

      const { error: deleteError } = await client.from("ai_request_idempotency").delete().in("id", ids);
      if (deleteError) return json(req, 400, { error: deleteError.message });

      return json(req, 200, {
        ok: true,
        dry_run: false,
        deleted: ids.length,
        retention_days: retentionDays,
      });
    }

    if (req.method === "GET" && path.endsWith("legal/dashboard")) {
      requireRole(roles, ["manager", "admin"]);
      return json(req, 200, { ok: true, data: await buildLegalDashboard(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("ca-firm/dashboard")) {
      requireRole(roles, ["manager", "admin"]);
      return json(req, 200, { ok: true, data: await buildCaFirmDashboard(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("admin/dashboard")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, { ok: true, data: await buildAdminDashboard(client) });
    }

    if (req.method === "GET" && path.endsWith("drafting/clients")) {
      requireRole(roles, ["manager", "admin"]);
      return json(req, 200, { ok: true, data: await listDraftingClients(client, user.id) });
    }

    if (req.method === "GET" && path.endsWith("drafting/actionable-queue")) {
      requireRole(roles, ["manager", "admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 50);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 50;
      return json(req, 200, {
        ok: true,
        data: await listActionableDraftQueue(client, user.id, roles, persona, { limit }),
      });
    }

    if (req.method === "GET" && path.includes("draft-exports/") && path.endsWith("/download-link")) {
      requireRole(roles, ["manager", "admin"]);
      const exportId = path.split("draft-exports/")[1].replace("/download-link", "");
      const ttlRaw = Number(url.searchParams.get("ttl") ?? 600);
      const ttl = Number.isFinite(ttlRaw) ? ttlRaw : 600;
      return json(req, 200, {
        ok: true,
        data: await getDraftExportDownloadLink(client, user.id, roles, exportId, ttl),
      });
    }

    if (req.method === "GET" && path.endsWith("drafts/history")) {
      requireRole(roles, ["manager", "admin"]);
      const companyId = url.searchParams.get("company_id");
      const documentType = url.searchParams.get("document_type");
      return json(req, 200, {
        ok: true,
        data: await listDraftHistory(client, user.id, companyId, documentType),
      });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/artifacts")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/artifacts", "");
      return json(req, 200, { ok: true, data: await loadDraftArtifacts(client, user.id, roles, draftRunId) });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/exports")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/exports", "");
      const limitRaw = Number(url.searchParams.get("limit") ?? 20);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
      return json(req, 200, {
        ok: true,
        data: await listDraftExports(client, user.id, roles, draftRunId, { limit }),
      });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/policy-status")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/policy-status", "");
      return json(req, 200, {
        ok: true,
        data: await loadDraftPolicyStatus(client, user.id, roles, persona, draftRunId),
      });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/workflow-actions")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/workflow-actions", "");
      return json(req, 200, {
        ok: true,
        data: await loadDraftWorkflowActions(client, user.id, roles, persona, draftRunId),
      });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/timeline")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/timeline", "");
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 80;
      const eventType = url.searchParams.get("event_type");
      return json(req, 200, {
        ok: true,
        data: await loadDraftTimeline(client, user.id, roles, draftRunId, { limit, eventType }),
      });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/filing-readiness/history")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/filing-readiness/history", "");
      const limitRaw = Number(url.searchParams.get("limit") ?? 20);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
      return json(req, 200, {
        ok: true,
        data: await listDraftFilingReadinessHistory(client, user.id, roles, draftRunId, { limit }),
      });
    }

    if (req.method === "GET" && path.includes("drafts/") && path.endsWith("/filing-readiness")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/filing-readiness", "");
      return json(req, 200, {
        ok: true,
        data: await evaluateDraftFilingReadiness(client, user.id, roles, persona, draftRunId),
      });
    }

    if (req.method === "GET" && path.includes("draft-review/")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("draft-review/")[1];
      return json(req, 200, { ok: true, data: await loadDraftReview(client, user.id, roles, draftRunId) });
    }

    if (req.method === "POST" && path.includes("draft-review/") && path.endsWith("/save")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("draft-review/")[1].replace("/save", "");
      const payload = await loadDraftReview(client, user.id, roles, draftRunId);
      const body = await req.json();
      const content = String(body.content || "").trim();
      const expectedVersionNumberRaw = body.expected_version_number;
      const expectedVersionNumber = typeof expectedVersionNumberRaw === "number"
        ? expectedVersionNumberRaw
        : Number.isFinite(Number(expectedVersionNumberRaw))
          ? Number(expectedVersionNumberRaw)
          : null;
      const nextStatus = body.next_status ? String(body.next_status) : payload.run.status;
      const eventType = String(body.event_type || "review_saved");
      if (!content) return json(req, 400, { error: "content is required" });
      const currentStatus = String(payload.run.status);
      assertDraftIsMutableForContentEdit(currentStatus);
      const documentType = typeof payload.run.document_type === "string" ? payload.run.document_type : null;
      const [workflowPolicy, entitlements] = await Promise.all([
        loadAuthorityWorkflowPolicy(client, documentType),
        loadActorEntitlements(client, user.id),
      ]);
      const legalLaneEnabled = resolveLegalLaneEnabled(persona, entitlements);
      assertValidWorkflowTransition(currentStatus, nextStatus);
      assertValidEventTypeForTransition(currentStatus, nextStatus, eventType);
      assertEventActorAllowed({
        roles,
        persona,
        eventType,
        legalLaneEnabled,
        legalReviewRequired: workflowPolicy.legalReviewRequired,
        finalSignoffMode: workflowPolicy.finalSignoffMode,
      });
      assertWorkflowBlockingConditions({
        eventType,
        existingEvents: payload.events,
        legalReviewRequired: workflowPolicy.legalReviewRequired,
        finalSignoffMode: workflowPolicy.finalSignoffMode,
        legalLaneEnabled,
        persona,
      });

      const latestVersionNumber = await getLatestDraftVersionNumber(client, draftRunId);
      assertExpectedDraftVersion(latestVersionNumber, expectedVersionNumber);
      const nextVersionNumber = latestVersionNumber + 1;

      await updateDraftRunWithStatusGuard(client, draftRunId, currentStatus, {
        draft_content: content,
        status: nextStatus,
      });

      const { error: versionError } = await client
        .from("draft_versions")
        .insert({
          draft_run_id: draftRunId,
          user_id: user.id,
          version_number: nextVersionNumber,
          content,
        });
      if (versionError) return json(req, 400, { error: versionError.message });

      const { error: auditError } = await client
        .from("draft_audit_events")
        .insert({
          draft_run_id: draftRunId,
          user_id: user.id,
          event_type: eventType,
          payload: {
            previous_status: currentStatus,
            next_status: nextStatus,
            review_surface: "workspace-backend",
          },
        });
      if (auditError) {
        if (!(isUniqueConstraintViolation(auditError) && isOneTimeWorkflowEvent(eventType))) {
          return json(req, 400, { error: auditError.message });
        }
      }

      await queueWorkflowNotifications(client, draftRunId, eventType, nextStatus, user.id);

      return json(req, 200, { ok: true, data: await loadDraftReview(client, user.id, roles, draftRunId) });
    }

    if (req.method === "POST" && path.endsWith("company/workspace")) {
      requireRole(roles, ["user", "manager", "admin"]);
      const body = await req.json();
      const name = String(body.name || "").trim();
      const industry = typeof body.industry === "string" && body.industry.trim() ? body.industry.trim() : null;
      if (!name) return json(req, 400, { error: "name is required" });
      return json(req, 200, { ok: true, data: await createCompanyWorkspace(client, user.id, name, industry) });
    }

    if (req.method === "POST" && path.endsWith("company/bootstrap-data")) {
      requireRole(roles, ["user", "manager", "admin"]);
      const body = await req.json().catch(() => ({}));
      const companyIdRaw = typeof body.companyId === "string" && body.companyId.trim() ? body.companyId.trim() : null;
      const companyIds = await getUserCompanyIds(client, user.id);
      let targetCompanyId = companyIdRaw;
      if (!targetCompanyId) {
        targetCompanyId = companyIds[0] ?? null;
      }
      if (!targetCompanyId) {
        return json(req, 400, { error: "No company assignment found for bootstrap" });
      }
      if (!roles.has("admin") && !companyIds.includes(targetCompanyId)) {
        return json(req, 403, { error: "Forbidden" });
      }
      const seedClient = getServiceClient() ?? client;
      return json(req, 200, {
        ok: true,
        data: await bootstrapCompanyWorkspaceData(seedClient, { companyId: targetCompanyId, ownerUserId: user.id }),
      });
    }

    if (req.method === "POST" && path.endsWith("ca-firm/workspace")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json();
      const name = String(body.name || "").trim();
      const registrationNumber = String(body.registrationNumber || "").trim();
      const jurisdiction = typeof body.jurisdiction === "string" && body.jurisdiction.trim() ? body.jurisdiction.trim() : null;
      if (!name || !registrationNumber) {
        return json(req, 400, { error: "name and registrationNumber are required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createCaFirmWorkspace(client, user.id, name, registrationNumber, jurisdiction),
      });
    }

    if (req.method === "POST" && path.endsWith("ca-firm/bootstrap-data")) {
      requireRole(roles, ["manager", "admin"]);
      const { data: membership, error: membershipError } = await client
        .from("ca_firm_members")
        .select("ca_firm_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;
      const caFirmId = membership?.ca_firm_id ?? null;
      if (!caFirmId) {
        return json(req, 400, { error: "No CA firm membership found for bootstrap" });
      }
      const seedClient = getServiceClient() ?? client;
      return json(req, 200, {
        ok: true,
        data: await bootstrapCaFirmWorkspaceData(seedClient, { caFirmId, ownerUserId: user.id }),
      });
    }

    if (req.method === "POST" && path.endsWith("drafts")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json();
      const draftContent = String(body.draftContent || "").trim();
      const documentType = String(body.documentType || "").trim();
      const draftMode = String(body.draftMode || "").trim();
      if (!draftContent || !documentType || !draftMode) {
        return json(req, 400, { error: "draftContent, documentType, and draftMode are required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createDraftRun(client, user.id, roles, {
          companyId: typeof body.companyId === "string" && body.companyId ? body.companyId : null,
          documentType,
          draftMode,
          noticeInput: typeof body.noticeInput === "string" ? body.noticeInput : null,
          draftContent,
          qa: body.qa ?? null,
          draftPackage: body.draftPackage ?? null,
          preferPiiMasking: body.preferPiiMasking !== false,
        }),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/snapshot")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/snapshot", "");
      const body = await req.json();
      const content = String(body.content || "").trim();
      const eventType = String(body.eventType || "").trim();
      const expectedVersionRaw = body.expectedVersionNumber;
      const expectedVersionNumber = typeof expectedVersionRaw === "number"
        ? expectedVersionRaw
        : Number.isFinite(Number(expectedVersionRaw))
          ? Number(expectedVersionRaw)
          : null;
      if (!content || !eventType) {
        return json(req, 400, { error: "content and eventType are required" });
      }
      return json(req, 200, {
        ok: true,
        data: await saveDraftSnapshot(client, user.id, roles, persona, draftRunId, {
          content,
          nextStatus: body.nextStatus ? String(body.nextStatus) : undefined,
          eventType,
          expectedVersionNumber: expectedVersionNumber ?? undefined,
          noticeInput: typeof body.noticeInput === "string" ? body.noticeInput : null,
          qa: body.qa ?? undefined,
          draftPackage: body.draftPackage ?? undefined,
          payload: typeof body.payload === "object" && body.payload ? body.payload : undefined,
        }),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/rollback")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/rollback", "");
      const body = await req.json().catch(() => ({}));
      const targetVersionRaw = Number(body.targetVersionNumber);
      const expectedVersionRaw = body.expectedVersionNumber;
      const expectedVersionNumber = typeof expectedVersionRaw === "number"
        ? expectedVersionRaw
        : Number.isFinite(Number(expectedVersionRaw))
          ? Number(expectedVersionRaw)
          : null;
      if (!Number.isInteger(targetVersionRaw) || targetVersionRaw <= 0) {
        return json(req, 400, { error: "targetVersionNumber is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await rollbackDraftToVersion(client, user.id, roles, persona, draftRunId, {
          targetVersionNumber: targetVersionRaw,
          expectedVersionNumber: expectedVersionNumber ?? undefined,
          note: typeof body.note === "string" ? body.note.trim() : null,
        }),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/filing-readiness")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/filing-readiness", "");
      const assessment = await evaluateDraftFilingReadiness(client, user.id, roles, persona, draftRunId);
      const snapshot = await persistDraftFilingReadiness(client, user.id, draftRunId, {
        score: assessment.score,
        ready: assessment.ready,
        blockers: assessment.blockers,
        warnings: assessment.warnings,
        signals: assessment.signals,
      });
      return json(req, 200, {
        ok: true,
        data: {
          ...assessment,
          snapshotId: snapshot.id,
          snapshotCreatedAt: snapshot.created_at,
        },
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/workflow-action")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/workflow-action", "");
      const body = await req.json().catch(() => ({}));
      const action = String(body.action || "").trim();
      if (!action) {
        return json(req, 400, { error: "action is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await executeDraftWorkflowAction(
          client,
          user.id,
          roles,
          persona,
          draftRunId,
          {
            action,
            note: typeof body.note === "string" ? body.note.trim() : null,
          },
        ),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/exports")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/exports", "");
      const body = await req.json().catch(() => ({}));
      const format = String(body.format || "pdf").trim().toLowerCase();
      if (format !== "pdf" && format !== "docx") {
        return json(req, 400, { error: "format must be pdf or docx" });
      }
      return json(req, 200, {
        ok: true,
        data: await createDraftExport(client, user.id, roles, persona, draftRunId, {
          format: format as "pdf" | "docx",
        }),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/export-mark")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/export-mark", "");
      const body = await req.json().catch(() => ({}));
      const eventType = String(body.eventType || "exported_for_external_legal");
      if (eventType !== "exported_for_external_legal") {
        return json(req, 400, { error: "eventType must be exported_for_external_legal for this route" });
      }
      return json(req, 200, {
        ok: true,
        data: await appendDraftAuditEvent(
          client,
          user.id,
          roles,
          persona,
          draftRunId,
          eventType,
          typeof body.payload === "object" && body.payload ? body.payload as Record<string, unknown> : undefined,
        ),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/external-legal/export")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/external-legal/export", "");
      const body = await req.json().catch(() => ({}));
      const counselName = typeof body.counsel_name === "string" && body.counsel_name.trim() ? body.counsel_name.trim().slice(0, 160) : null;
      const counselEmail = typeof body.counsel_email === "string" && body.counsel_email.trim() ? body.counsel_email.trim().slice(0, 220) : null;
      const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 1000) : null;
      return json(req, 200, {
        ok: true,
        data: await appendDraftAuditEvent(
          client,
          user.id,
          roles,
          persona,
          draftRunId,
          "exported_for_external_legal",
          {
            counsel_name: counselName,
            counsel_email: counselEmail,
            note,
          },
        ),
      });
    }

    if (req.method === "POST" && path.includes("drafts/") && path.endsWith("/external-legal/signoff")) {
      requireRole(roles, ["manager", "admin"]);
      const draftRunId = path.split("drafts/")[1].replace("/external-legal/signoff", "");
      const body = await req.json().catch(() => ({}));
      const signedOffAtRaw = typeof body.signed_off_at === "string" ? body.signed_off_at.trim() : "";
      const signedOffAt = signedOffAtRaw && !Number.isNaN(Date.parse(signedOffAtRaw))
        ? new Date(signedOffAtRaw).toISOString()
        : new Date().toISOString();
      const counselName = typeof body.counsel_name === "string" && body.counsel_name.trim() ? body.counsel_name.trim().slice(0, 160) : null;
      const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 1000) : null;
      return json(req, 200, {
        ok: true,
        data: await advanceDraftWorkflowState(
          client,
          user.id,
          roles,
          persona,
          draftRunId,
          {
            nextStatus: "signed_off",
            eventType: "external_legal_signed_off",
            payload: {
              signed_off_at: signedOffAt,
              counsel_name: counselName,
              note,
            },
          },
        ),
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json();
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      validateAiOperationContractPayload(body as Record<string, unknown>);
      const result = await proxyAiDraft(client, user.id, roles, persona, token, body as Record<string, unknown>);
      if (!result.ok) {
        return json(req, result.status, { error: result.error || "ai-draft request failed" });
      }
      return json(req, 200, { ok: true, data: result.body });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai-stream")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json();
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      validateAiOperationContractPayload(body as Record<string, unknown>);
      return await proxyAiDraftStream(req, client, user.id, roles, persona, token, body as Record<string, unknown>);
    }

    return json(req, 404, { error: "Route not found" });
  } catch (error) {
    const message = extractErrorMessage(error);
    const errorCode = resolveErrorCode(message);
    const status =
      errorCode === "AUTH_UNAUTHORIZED"
        ? 401
        : errorCode === "RESOURCE_NOT_FOUND"
          ? 404
        : errorCode === "ACCESS_FORBIDDEN" || errorCode === "WORKFLOW_ACTOR_FORBIDDEN"
          ? 403
        : errorCode === "SERVICE_NOT_READY"
          ? 503
        : errorCode === "AI_REQUEST_IN_PROGRESS"
            || errorCode === "WORKFLOW_VERSION_CONFLICT"
            || errorCode === "WORKFLOW_STATE_CONFLICT"
            ? 409
            : errorCode === "AI_RATE_LIMITED"
              ? 429
              : errorCode === "AI_QUOTA_EXCEEDED"
                ? 429
          : errorCode === "WORKFLOW_TRANSITION_INVALID"
            || errorCode === "WORKFLOW_EVENT_INVALID"
            || errorCode === "VALIDATION_INVALID_FIELD"
            || errorCode === "VALIDATION_REQUIRED_FIELD"
            ? 400
            : 500;
    return json(req, status, { error: message, error_code: errorCode });
  }
});
