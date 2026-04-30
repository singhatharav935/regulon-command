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

const getUserCaFirmIds = async (client: ReturnType<typeof createClient>, userId: string) => {
  const { data, error } = await client.from("ca_firm_members").select("ca_firm_id").eq("user_id", userId);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((row) => row.ca_firm_id)));
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
    .select("sannidh_legal_lane_enabled, assistant_access_enabled, plan_monthly_request_limit")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    sannidhLegalLaneEnabled: data?.sannidh_legal_lane_enabled === true,
    assistantAccessEnabled: data?.assistant_access_enabled !== false,
    planMonthlyRequestLimit: typeof data?.plan_monthly_request_limit === "number"
      ? data.plan_monthly_request_limit
      : null,
  };
};

const resolveLegalLaneEnabled = (persona: AppPersona | null, entitlements: { sannidhLegalLaneEnabled: boolean }) => {
  if (persona === "in_house_ca" || persona === "in_house_lawyer" || persona === "admin") return true;
  if (persona === "external_ca" || persona === "ca_firm") return entitlements.sannidhLegalLaneEnabled;
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
    return "external_legal_outside_sannidh";
  }
  return "internal_sannidh_lane";
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
  if (message.includes("must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.includes("must be between 0 and 100")) return "VALIDATION_INVALID_FIELD";
  if (message.includes("must be a positive number")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("dueAt must be a valid ISO date")) return "VALIDATION_INVALID_FIELD";
  if (message.includes("must be snake_case")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("Published legal document not found")) return "VALIDATION_INVALID_FIELD";
  if (message.includes("cannot be set together")) return "VALIDATION_INVALID_FIELD";
  if (message.includes("must be a non-negative number")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("Active billing plan not found")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("billing subscription not found")) return "RESOURCE_NOT_FOUND";
  if (message.startsWith("support ticket not found")) return "RESOURCE_NOT_FOUND";
  if (message.startsWith("assignment request not found")) return "RESOURCE_NOT_FOUND";
  if (message.startsWith("category must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("priority must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("assignmentType must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("alertType must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("checkType must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("comparator must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("budgetKey must be snake_case")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("statusCode must be a valid HTTP status code")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("thresholdWarn and thresholdFail must be numbers")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("errorRatePercent must be between 0 and 100")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("triggeredValue must be a number")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("severity must be one of: medium, high, critical")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("status must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("quality percentages must be between 0 and 100")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("sourceType must be one of:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("suiteName is required")) return "VALIDATION_REQUIRED_FIELD";
  if (message.startsWith("flowName is required")) return "VALIDATION_REQUIRED_FIELD";
  if (message.startsWith("runDurationMs must be a non-negative number")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("totalTests must be a non-negative number")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("passedTests must be a non-negative number")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("failedTests must be a non-negative number")) return "VALIDATION_INVALID_FIELD";
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

  const workspaceType = data?.workspace_type === "sannidh_ca" || data?.workspace_type === "external_ca"
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

const EXPORT_MIME_BY_FORMAT: Record<"pdf" | "docx", string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const EXPORT_EXTENSION_BY_FORMAT: Record<"pdf" | "docx", string> = {
  pdf: ".pdf",
  docx: ".docx",
};

const normalizeExportFormat = (value: unknown): "pdf" | "docx" => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "pdf" || normalized === "docx") return normalized;
  throw new Error("format must be pdf or docx");
};

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("");

const sha256Hex = async (bytes: Uint8Array) => {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(new Uint8Array(digest));
};

const assertDraftExportRowIntegrity = (row: {
  id: string;
  format: string;
  mime_type: string | null;
  file_name: string | null;
  storage_path: string | null;
}) => {
  const format = normalizeExportFormat(row.format);
  const expectedMime = EXPORT_MIME_BY_FORMAT[format];
  const expectedExtension = EXPORT_EXTENSION_BY_FORMAT[format];

  if (row.mime_type !== expectedMime) {
    throw new Error(`Export integrity failed: mime mismatch for export ${row.id}`);
  }
  if (!row.file_name || !row.file_name.toLowerCase().endsWith(expectedExtension)) {
    throw new Error(`Export integrity failed: file extension mismatch for export ${row.id}`);
  }
  if (!row.storage_path || !row.storage_path.endsWith(row.file_name)) {
    throw new Error(`Export integrity failed: storage path mismatch for export ${row.id}`);
  }
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
  const format = normalizeExportFormat(body.format);
  const fileName = `${baseName}.${format}`;
  const title = `SANNIDH Filing Draft`;
  const now = new Date();

  const serviceClient = getServiceClient();
  if (!serviceClient) {
    throw new Error("Missing Supabase service role configuration");
  }

  const byteData = format === "pdf"
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
  const mimeType = EXPORT_MIME_BY_FORMAT[format];
  const exportHashSha256 = await sha256Hex(byteData);

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
      format,
      status: "generated",
      file_name: fileName,
      mime_type: mimeType,
      storage_path: storagePath,
      metadata: {
        source: "workspace-backend",
        workflow_status: run.status,
        byte_size: byteData.byteLength,
        sha256: exportHashSha256,
        generator: "workspace-backend@v1",
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
      export_format: format,
      export_id: exportRow.id,
      file_name: fileName,
      storage_path: storagePath,
      sha256: exportHashSha256,
      byte_size: byteData.byteLength,
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
  assertDraftExportRowIntegrity({
    id: row.id,
    format: String(row.format),
    mime_type: row.mime_type,
    file_name: row.file_name,
    storage_path: row.storage_path,
  });

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
        file_name: row.file_name,
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
      sannidhLegalLaneEntitled: entitlements.sannidhLegalLaneEnabled,
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
    blockers.push("External CA lane active: legal sign-off must happen outside SANNIDH unless add-on is enabled.");
  }

  const lane = (persona === "external_ca" || persona === "ca_firm") && !legalLaneEnabled
    ? "external_legal_outside_sannidh"
    : "internal_sannidh_legal_lane";

  return {
    draftRunId,
    status: review.run.status,
    documentType: review.run.document_type,
    lane,
    policy: {
      legalReviewRequired: workflowPolicy.legalReviewRequired,
      finalSignoffMode: workflowPolicy.finalSignoffMode,
      legalLaneEnabled,
      sannidhLegalLaneEntitled: entitlements.sannidhLegalLaneEnabled,
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
      sannidhLegalLaneEntitled: entitlements.sannidhLegalLaneEnabled,
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

const runDraftAuditTrailIntegrityCheck = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; companyId?: string | null },
) => {
  const limit = Math.max(50, Math.min(5000, Number(options?.limit ?? 800)));
  const companyId = typeof options?.companyId === "string" && options.companyId.trim() ? options.companyId.trim() : null;

  let runsQuery = client
    .from("draft_runs")
    .select("id, company_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (companyId) runsQuery = runsQuery.eq("company_id", companyId);

  const { data: runs, error: runsError } = await runsQuery;
  if (runsError) throw runsError;

  const runRows = runs ?? [];
  const runIds = runRows.map((row) => row.id);
  if (runIds.length === 0) {
    return {
      scanned: 0,
      findings: [],
      summary: { critical: 0, high: 0, medium: 0 },
      overall: { pass: true },
    };
  }

  const [versionsResult, eventsResult] = await Promise.all([
    client
      .from("draft_versions")
      .select("draft_run_id, version_number, created_at")
      .in("draft_run_id", runIds)
      .order("version_number", { ascending: true }),
    client
      .from("draft_audit_events")
      .select("draft_run_id, event_type, created_at")
      .in("draft_run_id", runIds)
      .order("created_at", { ascending: true }),
  ]);
  if (versionsResult.error) throw versionsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const versionsByRun = new Map<string, Array<{ version_number: number; created_at: string }>>();
  for (const row of versionsResult.data ?? []) {
    const list = versionsByRun.get(row.draft_run_id) ?? [];
    list.push({
      version_number: Number(row.version_number),
      created_at: String(row.created_at),
    });
    versionsByRun.set(row.draft_run_id, list);
  }

  const eventsByRun = new Map<string, Array<{ event_type: string; created_at: string }>>();
  for (const row of eventsResult.data ?? []) {
    const list = eventsByRun.get(row.draft_run_id) ?? [];
    list.push({
      event_type: String(row.event_type),
      created_at: String(row.created_at),
    });
    eventsByRun.set(row.draft_run_id, list);
  }

  const findings: Array<{
    severity: "critical" | "high" | "medium";
    code: string;
    draft_run_id: string;
    detail: string;
  }> = [];

  for (const run of runRows) {
    const runVersions = versionsByRun.get(run.id) ?? [];
    const runEvents = eventsByRun.get(run.id) ?? [];

    if (runVersions.length === 0) {
      findings.push({
        severity: "critical",
        code: "MISSING_VERSIONS",
        draft_run_id: run.id,
        detail: "Draft run has no version history rows.",
      });
    } else {
      const uniqueVersions = new Set(runVersions.map((v) => v.version_number));
      if (uniqueVersions.size !== runVersions.length) {
        findings.push({
          severity: "critical",
          code: "DUPLICATE_VERSION_NUMBER",
          draft_run_id: run.id,
          detail: "Duplicate version numbers detected for draft run.",
        });
      }
      if (runVersions[0].version_number !== 1) {
        findings.push({
          severity: "critical",
          code: "VERSION_SEQUENCE_START_INVALID",
          draft_run_id: run.id,
          detail: `Version sequence starts at ${runVersions[0].version_number} instead of 1.`,
        });
      }
      let expected = 1;
      for (const version of runVersions) {
        if (version.version_number !== expected) {
          findings.push({
            severity: "critical",
            code: "VERSION_SEQUENCE_GAP",
            draft_run_id: run.id,
            detail: `Expected version ${expected} but found ${version.version_number}.`,
          });
          break;
        }
        expected += 1;
      }
    }

    if (runEvents.length === 0) {
      findings.push({
        severity: "critical",
        code: "MISSING_AUDIT_EVENTS",
        draft_run_id: run.id,
        detail: "Draft run has no audit trail events.",
      });
      continue;
    }

    const eventSet = new Set(runEvents.map((event) => event.event_type));
    if (!eventSet.has("draft_generated")) {
      findings.push({
        severity: "high",
        code: "MISSING_DRAFT_GENERATED_EVENT",
        draft_run_id: run.id,
        detail: "Audit trail does not include draft_generated event.",
      });
    }

    if (run.status === "under_review" && !eventSet.has("submitted_for_review")) {
      findings.push({
        severity: "high",
        code: "UNDER_REVIEW_WITHOUT_SUBMISSION_EVENT",
        draft_run_id: run.id,
        detail: "Draft status is under_review but no submitted_for_review event exists.",
      });
    }

    if (
      run.status === "approved" &&
      !(eventSet.has("review_approved") || eventSet.has("legal_review_approved") || eventSet.has("external_legal_signed_off"))
    ) {
      findings.push({
        severity: "high",
        code: "APPROVED_WITHOUT_APPROVAL_EVENT",
        draft_run_id: run.id,
        detail: "Draft status is approved but no approval event exists.",
      });
    }

    if (
      run.status === "signed_off" &&
      !(eventSet.has("final_sign_off") || eventSet.has("legal_final_sign_off") || eventSet.has("external_legal_signed_off"))
    ) {
      findings.push({
        severity: "high",
        code: "SIGNED_OFF_WITHOUT_SIGNOFF_EVENT",
        draft_run_id: run.id,
        detail: "Draft status is signed_off but no sign-off event exists.",
      });
    }

    const runCreatedAtMs = Date.parse(String(run.created_at));
    const earliestEventMs = Date.parse(runEvents[0].created_at);
    if (!Number.isNaN(runCreatedAtMs) && !Number.isNaN(earliestEventMs) && earliestEventMs < runCreatedAtMs - 60_000) {
      findings.push({
        severity: "medium",
        code: "EVENT_BEFORE_RUN_CREATED",
        draft_run_id: run.id,
        detail: "Earliest audit event timestamp is earlier than draft run creation timestamp.",
      });
    }
  }

  return {
    scanned: runRows.length,
    findings: findings.slice(0, 300),
    summary: {
      critical: findings.filter((item) => item.severity === "critical").length,
      high: findings.filter((item) => item.severity === "high").length,
      medium: findings.filter((item) => item.severity === "medium").length,
    },
    overall: {
      pass: findings.length === 0,
    },
  };
};

const runDraftExportIntegrityCheck = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; companyId?: string | null },
) => {
  const limit = Math.max(50, Math.min(5000, Number(options?.limit ?? 1200)));
  const companyId = typeof options?.companyId === "string" && options.companyId.trim() ? options.companyId.trim() : null;

  let exportsQuery = client
    .from("draft_exports")
    .select("id, draft_run_id, company_id, format, status, file_name, mime_type, storage_path, metadata, completed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (companyId) exportsQuery = exportsQuery.eq("company_id", companyId);

  const { data: exportRows, error: exportsError } = await exportsQuery;
  if (exportsError) throw exportsError;
  const rows = exportRows ?? [];
  if (rows.length === 0) {
    return {
      scanned: 0,
      findings: [],
      summary: { critical: 0, high: 0, medium: 0 },
      overall: { pass: true },
    };
  }

  const runIds = Array.from(new Set(rows.map((row) => row.draft_run_id)));
  const [runsResult, eventsResult] = await Promise.all([
    client
      .from("draft_runs")
      .select("id, company_id")
      .in("id", runIds),
    client
      .from("draft_audit_events")
      .select("draft_run_id, event_type, payload, created_at")
      .in("draft_run_id", runIds)
      .in("event_type", ["filing_export_generated", "filing_export_download_link_issued"]),
  ]);
  if (runsResult.error) throw runsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const runById = new Map((runsResult.data ?? []).map((row) => [row.id, row]));
  const eventsByRun = new Map<string, Array<{ event_type: string; payload: Record<string, unknown> | null }>>();
  for (const event of eventsResult.data ?? []) {
    const list = eventsByRun.get(event.draft_run_id) ?? [];
    list.push({
      event_type: String(event.event_type),
      payload: event.payload && typeof event.payload === "object" ? event.payload as Record<string, unknown> : null,
    });
    eventsByRun.set(event.draft_run_id, list);
  }

  const findings: Array<{
    severity: "critical" | "high" | "medium";
    code: string;
    export_id: string;
    draft_run_id: string;
    detail: string;
  }> = [];

  for (const row of rows) {
    const run = runById.get(row.draft_run_id);
    if (!run) {
      findings.push({
        severity: "critical",
        code: "EXPORT_WITHOUT_DRAFT_RUN",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: "Export row references a missing draft run.",
      });
      continue;
    }

    if (row.company_id && run.company_id && row.company_id !== run.company_id) {
      findings.push({
        severity: "critical",
        code: "EXPORT_COMPANY_MISMATCH",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: "Export company_id differs from draft run company_id.",
      });
    }

    try {
      assertDraftExportRowIntegrity({
        id: row.id,
        format: String(row.format),
        mime_type: row.mime_type,
        file_name: row.file_name,
        storage_path: row.storage_path,
      });
    } catch (error) {
      findings.push({
        severity: "critical",
        code: "EXPORT_FILE_METADATA_INVALID",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: error instanceof Error ? error.message : "Invalid export metadata",
      });
    }

    const rowMetadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : null;
    const byteSize = Number(rowMetadata?.byte_size ?? 0);
    const sha256 = typeof rowMetadata?.sha256 === "string" ? rowMetadata.sha256 : "";
    if (!Number.isInteger(byteSize) || byteSize <= 0) {
      findings.push({
        severity: "high",
        code: "EXPORT_BYTE_SIZE_MISSING",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: "Export metadata does not include a valid byte_size.",
      });
    }
    if (!/^[a-f0-9]{64}$/i.test(sha256)) {
      findings.push({
        severity: "high",
        code: "EXPORT_HASH_MISSING",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: "Export metadata does not include a valid sha256 hash.",
      });
    }

    if (row.status === "generated" && !row.completed_at) {
      findings.push({
        severity: "high",
        code: "EXPORT_GENERATED_WITHOUT_COMPLETED_AT",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: "Generated export is missing completed_at timestamp.",
      });
    }

    const runEvents = eventsByRun.get(row.draft_run_id) ?? [];
    const hasGenerationEvent = runEvents.some((event) =>
      event.event_type === "filing_export_generated" &&
      String(event.payload?.export_id ?? "") === row.id,
    );
    if (!hasGenerationEvent) {
      findings.push({
        severity: "high",
        code: "MISSING_EXPORT_GENERATED_AUDIT_EVENT",
        export_id: row.id,
        draft_run_id: row.draft_run_id,
        detail: "No filing_export_generated audit event found for export row.",
      });
    }
  }

  return {
    scanned: rows.length,
    findings: findings.slice(0, 300),
    summary: {
      critical: findings.filter((item) => item.severity === "critical").length,
      high: findings.filter((item) => item.severity === "high").length,
      medium: findings.filter((item) => item.severity === "medium").length,
    },
    overall: {
      pass: findings.length === 0,
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

  const [integrity, sla, tenantIsolation, auditTrail, exportIntegrity, complianceLegal, commercialReadiness, operationsReadiness, infraDevops] = await Promise.all([
    runWorkflowIntegrityCheck(client, { limit: 300 }),
    runWorkflowSlaMonitor(client, { limit: 500 }),
    runTenantIsolationCheck(client, { limitPerTable: 3000 }),
    runDraftAuditTrailIntegrityCheck(client, { limit: 1200 }),
    runDraftExportIntegrityCheck(client, { limit: 1200 }),
    collectComplianceLegalReadinessSignals(client),
    collectCommercialReadinessSignals(client),
    collectOperationsReadinessSignals(client),
    collectInfraDevopsReadinessSignals(client),
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
    tenantIsolation: tenantIsolation.summary,
    auditTrail: auditTrail.summary,
    exportIntegrity: exportIntegrity.summary,
    complianceLegal: complianceLegal.summary,
    commercialReadiness: commercialReadiness.summary,
    operationsReadiness: operationsReadiness.summary,
    infraDevops: infraDevops.summary,
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
    "compliance_user_consents",
    "legal_disclaimer_acceptances",
    "compliance_data_requests",
    "compliance_audit_events",
    "legal_documents",
    "legal_document_acceptances",
    "billing_plans",
    "billing_subscriptions",
    "billing_invoice_records",
    "billing_payment_attempts",
    "billing_usage_meters",
    "billing_usage_events",
    "billing_usage_monthly_rollups",
    "ops_support_tickets",
    "ops_support_ticket_messages",
    "ops_client_assignment_requests",
    "ops_activity_logs",
    "infra_runbooks",
    "infra_release_registry",
    "infra_backup_restore_drills",
    "infra_monitoring_integrations",
    "infra_slo_policies",
    "infra_slo_breaches",
    "postlaunch_kpi_snapshots",
    "postlaunch_risk_alerts",
    "postlaunch_model_quality_reviews",
    "postlaunch_hotfix_releases",
    "performance_client_metrics",
    "performance_synthetic_checks",
    "performance_budget_policies",
    "performance_alert_events",
    "qa_api_contract_runs",
    "qa_e2e_smoke_runs",
    "qa_failure_registry",
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
      ? "sannidh_ca"
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
  public: [
    { route: "GET /public/landing/overview", roles: ["public"] },
    { route: "POST /public/landing/lead", roles: ["public"] },
    { route: "GET /public/legal-documents", roles: ["public"] },
    { route: "GET /public/legal-documents/index", roles: ["public"] },
    { route: "GET /public/regulatory-announcements", roles: ["public"] },
    { route: "POST /public/regulatory-announcements/sync-now", roles: ["public"] },
  ],
  dashboards: [
    { route: "GET /onboarding/status", roles: ["authenticated"] },
    { route: "POST /onboarding/repair-self", roles: ["authenticated"] },
    { route: "GET /dashboard/readiness/self", roles: ["authenticated"] },
    { route: "GET /ops/dashboard-readiness/smoke", roles: ["admin"] },
    { route: "GET /ca/workspace-profile", roles: ["manager", "admin"] },
    { route: "GET /company/dashboard", roles: ["user", "manager", "admin"] },
    { route: "POST /company/workspace", roles: ["user", "manager", "admin"] },
    { route: "POST /company/bootstrap-data", roles: ["user", "manager", "admin"] },
    { route: "GET /ca/dashboard", roles: ["manager", "admin"] },
    { route: "GET /legal/dashboard", roles: ["manager", "admin"] },
    { route: "GET /ca-firm/dashboard", roles: ["manager", "admin"] },
    { route: "POST /ca-firm/workspace", roles: ["manager", "admin"] },
    { route: "POST /ca-firm/bootstrap-data", roles: ["manager", "admin"] },
    { route: "GET /admin/dashboard", roles: ["admin"] },
    { route: "GET /compliance/consent/status", roles: ["authenticated"] },
    { route: "POST /compliance/consent/events", roles: ["authenticated"] },
    { route: "GET /compliance/legal-disclaimer/status", roles: ["authenticated"] },
    { route: "POST /compliance/legal-disclaimer/accept", roles: ["authenticated"] },
    { route: "GET /compliance/data-requests", roles: ["authenticated"] },
    { route: "POST /compliance/data-requests", roles: ["authenticated"] },
    { route: "GET /compliance/legal-documents/acceptance-status", roles: ["authenticated"] },
    { route: "POST /compliance/legal-documents/accept", roles: ["authenticated"] },
    { route: "GET /billing/plans", roles: ["authenticated"] },
    { route: "GET /billing/subscription", roles: ["authenticated"] },
    { route: "POST /billing/subscription/activate", roles: ["manager", "admin"] },
    { route: "POST /billing/subscription/change-plan", roles: ["manager", "admin"] },
    { route: "POST /billing/subscription/cancel", roles: ["manager", "admin"] },
    { route: "GET /billing/invoices", roles: ["authenticated"] },
    { route: "POST /billing/usage/events", roles: ["manager", "admin"] },
    { route: "GET /billing/usage/summary", roles: ["authenticated"] },
    { route: "GET /ops/support/tickets", roles: ["authenticated"] },
    { route: "POST /ops/support/tickets", roles: ["authenticated"] },
    { route: "POST /ops/support/tickets/:id/update", roles: ["authenticated"] },
    { route: "POST /ops/support/tickets/:id/messages", roles: ["authenticated"] },
    { route: "GET /ops/assignment/requests", roles: ["authenticated"] },
    { route: "POST /ops/assignment/requests", roles: ["authenticated"] },
    { route: "POST /ops/assignment/requests/:id/decide", roles: ["admin"] },
    { route: "GET /ops/activity/logs", roles: ["authenticated"] },
  ],
  drafts: [
    { route: "GET /draft-review/:id", roles: ["manager", "admin"] },
    { route: "POST /draft-review/:id/save", roles: ["manager", "admin"] },
    { route: "GET /drafting/preferences", roles: ["manager", "admin"] },
    { route: "GET /drafting/capabilities", roles: ["manager", "admin"] },
    { route: "GET /drafting/clients", roles: ["manager", "admin"] },
    { route: "POST /drafting/ai", roles: ["manager", "admin"] },
    { route: "POST /drafting/ai-stream", roles: ["manager", "admin"] },
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
    { route: "GET /ops/draft-audit-integrity-check", roles: ["admin"] },
    { route: "GET /ops/draft-export-integrity-check", roles: ["admin"] },
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
    { route: "GET /ops/compliance/readiness", roles: ["admin"] },
    { route: "GET /ops/compliance/data-requests", roles: ["admin"] },
    { route: "GET /ops/compliance/legal-documents", roles: ["admin"] },
    { route: "POST /ops/compliance/legal-documents/publish", roles: ["admin"] },
    { route: "POST /ops/compliance/data-requests/:id/status", roles: ["admin"] },
    { route: "GET /ops/commercial/readiness", roles: ["admin"] },
    { route: "GET /ops/operations/readiness", roles: ["admin"] },
    { route: "GET /ops/infra/readiness", roles: ["admin"] },
    { route: "GET /ops/infra/runbooks", roles: ["admin"] },
    { route: "POST /ops/infra/runbooks", roles: ["admin"] },
    { route: "GET /ops/infra/releases", roles: ["admin"] },
    { route: "POST /ops/infra/releases", roles: ["admin"] },
    { route: "GET /ops/infra/backup-drills", roles: ["admin"] },
    { route: "POST /ops/infra/backup-drills", roles: ["admin"] },
    { route: "GET /ops/infra/monitoring-integrations", roles: ["admin"] },
    { route: "POST /ops/infra/monitoring-integrations", roles: ["admin"] },
    { route: "GET /ops/infra/slo-policies", roles: ["admin"] },
    { route: "POST /ops/infra/slo-policies", roles: ["admin"] },
    { route: "GET /ops/infra/slo-breaches", roles: ["admin"] },
    { route: "POST /ops/infra/slo-breaches", roles: ["admin"] },
    { route: "GET /ops/postlaunch/readiness", roles: ["admin"] },
    { route: "GET /ops/postlaunch/kpi-snapshots", roles: ["admin"] },
    { route: "POST /ops/postlaunch/kpi-snapshots", roles: ["admin"] },
    { route: "GET /ops/postlaunch/risk-alerts", roles: ["admin"] },
    { route: "POST /ops/postlaunch/risk-alerts", roles: ["admin"] },
    { route: "GET /ops/postlaunch/model-quality-reviews", roles: ["admin"] },
    { route: "POST /ops/postlaunch/model-quality-reviews", roles: ["admin"] },
    { route: "GET /ops/postlaunch/hotfix-releases", roles: ["admin"] },
    { route: "POST /ops/postlaunch/hotfix-releases", roles: ["admin"] },
    { route: "GET /ops/performance/readiness", roles: ["admin"] },
    { route: "GET /ops/performance/client-metrics", roles: ["admin"] },
    { route: "POST /ops/performance/client-metrics", roles: ["admin"] },
    { route: "GET /ops/performance/synthetic-checks", roles: ["admin"] },
    { route: "POST /ops/performance/synthetic-checks", roles: ["admin"] },
    { route: "GET /ops/performance/budgets", roles: ["admin"] },
    { route: "POST /ops/performance/budgets", roles: ["admin"] },
    { route: "GET /ops/performance/alerts", roles: ["admin"] },
    { route: "POST /ops/performance/alerts", roles: ["admin"] },
    { route: "GET /ops/qa/readiness", roles: ["admin"] },
    { route: "GET /ops/qa/api-contract-runs", roles: ["admin"] },
    { route: "POST /ops/qa/api-contract-runs", roles: ["admin"] },
    { route: "GET /ops/qa/e2e-smoke-runs", roles: ["admin"] },
    { route: "POST /ops/qa/e2e-smoke-runs", roles: ["admin"] },
    { route: "GET /ops/qa/failures", roles: ["admin"] },
    { route: "POST /ops/qa/failures", roles: ["admin"] },
    { route: "POST /ops/billing/invoice/issue", roles: ["admin"] },
    { route: "POST /ops/billing/payment-attempt", roles: ["admin"] },
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
  const aiModelUsed = response.headers.get("x-sannidh-model-used");
  const aiFallbackUsedHeader = response.headers.get("x-sannidh-fallback-used");
  const aiAttemptCountHeader = response.headers.get("x-sannidh-attempt-count");
  const aiAttemptCount = aiAttemptCountHeader ? Number(aiAttemptCountHeader) : null;
  const modelRouterVersion = response.headers.get("x-sannidh-model-router-version");

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

  const aiModelUsed = response.headers.get("x-sannidh-model-used");
  const aiFallbackUsedHeader = response.headers.get("x-sannidh-fallback-used");
  const aiAttemptCountHeader = response.headers.get("x-sannidh-attempt-count");
  const aiAttemptCount = aiAttemptCountHeader ? Number(aiAttemptCountHeader) : null;
  const modelRouterVersion = response.headers.get("x-sannidh-model-router-version");

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
    title: "SANNIDH",
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

const LEGAL_DOC_REQUIRED_KEYS = [
  "privacy_policy",
  "terms_of_service",
  "refund_policy",
  "dpa_terms",
  "data_retention_policy",
] as const;

const normalizeLegalDocKey = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) throw new Error("docKey is required");
  if (!/^[a-z0-9_]+$/.test(normalized)) throw new Error("docKey must be snake_case");
  return normalized;
};

const loadPublicLegalDocument = async (
  serviceClient: ReturnType<typeof createClient>,
  docKey: string,
) => {
  const { data, error } = await serviceClient
    .from("legal_documents")
    .select("doc_key, version, title, jurisdiction, summary, content_markdown, requires_acceptance, effective_at, published_at, updated_at")
    .eq("doc_key", docKey)
    .eq("status", "published")
    .order("effective_at", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Published legal document not found for key: ${docKey}`);
  return data;
};

const listPublicLegalDocumentIndex = async (
  serviceClient: ReturnType<typeof createClient>,
) => {
  const { data, error } = await serviceClient
    .from("legal_documents")
    .select("doc_key, version, title, summary, requires_acceptance, effective_at, published_at")
    .eq("status", "published")
    .order("doc_key", { ascending: true })
    .order("effective_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  const byKey = new Map<string, Record<string, unknown>>();
  for (const row of data ?? []) {
    const key = String(row.doc_key);
    if (!byKey.has(key)) byKey.set(key, row as unknown as Record<string, unknown>);
  }
  return Array.from(byKey.values());
};

const listPublicRegulatoryAnnouncements = async (
  serviceClient: ReturnType<typeof createClient>,
  options?: { limit?: number },
) => {
  const triggerRegulatoryAgentSync = async (triggerReason: string) => {
    try {
      const { url, serviceRole } = getEnv();
      const endpoint = `${url}/functions/v1/regulatory-intel-agent/sync`;
      const cronSecret = Deno.env.get("REGULATORY_AGENT_CRON_SECRET") ?? "";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
          "Content-Type": "application/json",
          ...(cronSecret ? { "x-cron-secret": cronSecret } : {}),
        },
        body: JSON.stringify({ trigger: triggerReason }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return { attempted: true, ok: false, error: `agent sync failed (${response.status}) ${body.slice(0, 200)}` };
      }
      return { attempted: true, ok: true, error: null as string | null };
    } catch (error) {
      return {
        attempted: true,
        ok: false,
        error: error instanceof Error ? error.message : "agent sync failed",
      };
    }
  };

  const fetchAnnouncements = async (limit: number) => {
    const { data, error } = await serviceClient
      .from("government_announcements")
      .select("id, source, source_label, title, summary, category, announced_by, source_url, announced_on, published_date, detected_at, effective_date, action_deadline, impact_score, company_exposure, action_owner, original_url, source_verified, created_at")
      .order("published_date", { ascending: false, nullsFirst: false })
      .order("detected_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) {
      if (isMissingRelationError(error, "government_announcements")) {
        return [];
      }
      throw error;
    }
    return data ?? [];
  };

  const limit = Math.max(3, Math.min(100, Number(options?.limit ?? 30)));
  const monitoredSources = [
    { source: "pib", source_label: "PIB India" },
    { source: "gstn", source_label: "GSTN" },
    { source: "cbic", source_label: "CBIC" },
    { source: "incometax", source_label: "Income Tax India" },
    { source: "mca", source_label: "MCA" },
  ];
  let data = await fetchAnnouncements(limit);

  const { data: syncRun, error: syncError } = await serviceClient
    .from("regulatory_agent_sync_runs")
    .select("created_at, monitored_portals")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (syncError && !isMissingRelationError(syncError, "regulatory_agent_sync_runs")) throw syncError;

  let bootstrap = { attempted: false, ok: false, error: null as string | null };
  if (data.length === 0 && !syncRun?.created_at) {
    bootstrap = await triggerRegulatoryAgentSync("workspace-backend-empty-feed-bootstrap");
    data = await fetchAnnouncements(limit);
  }

  const { data: sourceStateRows, error: sourceStateError } = await serviceClient
    .from("regulatory_source_states")
    .select("source, source_label, last_status, last_success_at, last_error");
  if (sourceStateError && !isMissingRelationError(sourceStateError, "regulatory_source_states")) throw sourceStateError;

  const sourceStatus = monitoredSources.map((sourceRow) => {
    const latest = (data ?? []).find((row) => row.source === sourceRow.source);
    const state = (sourceStateRows ?? []).find((row) => row.source === sourceRow.source);
    const resolvedStatus = state?.last_status === "failed" || state?.last_status === "partial"
      ? "awaiting_feed"
      : latest || state?.last_success_at
        ? "active"
        : "awaiting_feed";
    return {
      source: sourceRow.source,
      source_label: state?.source_label ?? sourceRow.source_label,
      status: resolvedStatus,
      latest_notice_at: latest?.published_date ?? latest?.announced_on ?? state?.last_success_at ?? null,
      latest_notice_title: latest?.title ?? null,
      last_error: state?.last_error ?? null,
    };
  });

  return {
    announcements: (data ?? []).map((row) => ({
      id: row.id,
      source: row.source,
      source_label: row.source_label,
      title: row.title,
      summary: row.summary,
      category: row.category,
      announced_by: row.announced_by,
      source_url: row.source_url ?? row.original_url,
      announced_on: row.published_date ?? row.announced_on,
      published_date: row.published_date ?? row.announced_on,
      detected_at: row.detected_at ?? row.created_at,
      effective_date: row.effective_date,
      action_deadline: row.action_deadline,
      impact_score: Number(row.impact_score ?? 0),
      company_exposure: row.company_exposure,
      action_owner: row.action_owner,
      original_url: row.original_url,
      source_verified: row.source_verified !== false,
    })),
    last_synced_at: syncRun?.created_at ?? null,
    monitored_portals: Number(syncRun?.monitored_portals ?? 12),
    sync_status: syncRun?.created_at ? "agent_active" : "awaiting_first_sync",
    source_status: sourceStatus,
    bootstrap,
  };
};

const acceptLegalDocument = async (
  client: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  payload: Record<string, unknown>,
) => {
  const docKey = normalizeLegalDocKey(payload.docKey);
  const version = toTrimmedString(payload.version, 40);
  const source = toTrimmedString(payload.source, 60) ?? "app";

  let publishedQuery = client
    .from("legal_documents")
    .select("doc_key, version, status")
    .eq("doc_key", docKey)
    .eq("status", "published")
    .order("effective_at", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1);
  if (version) {
    publishedQuery = client
      .from("legal_documents")
      .select("doc_key, version, status")
      .eq("doc_key", docKey)
      .eq("version", version)
      .eq("status", "published")
      .limit(1);
  }
  const { data: docRows, error: docError } = await publishedQuery;
  if (docError) throw docError;
  const doc = (docRows ?? [])[0];
  if (!doc) throw new Error("Published legal document/version not found");

  const ipHash = await hashText(getRequestIp(req));
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
  const metadata = safeMetadataObject(payload.metadata);

  const { data, error } = await client
    .from("legal_document_acceptances")
    .upsert({
      user_id: userId,
      doc_key: doc.doc_key,
      version: doc.version,
      source,
      ip_hash: ipHash,
      user_agent: userAgent,
      metadata,
      accepted_at: new Date().toISOString(),
    }, { onConflict: "user_id,doc_key,version" })
    .select("id, user_id, doc_key, version, accepted_at, source, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to store legal document acceptance");

  await recordComplianceAuditEvent(client, {
    actorUserId: userId,
    eventType: "legal_document_accepted",
    entityType: "legal_document_acceptances",
    entityId: data.id,
    payload: {
      doc_key: data.doc_key,
      version: data.version,
      accepted_at: data.accepted_at,
    },
  });

  return data;
};

const listLegalDocumentAcceptanceStatus = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  options?: { docKey?: string | null; limit?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 60)));
  let query = client
    .from("legal_document_acceptances")
    .select("id, doc_key, version, accepted_at, source, updated_at")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false })
    .limit(limit);
  const docKey = toTrimmedString(options?.docKey ?? null, 120);
  if (docKey) query = query.eq("doc_key", normalizeLegalDocKey(docKey));
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const listLegalDocumentsByAdmin = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; docKey?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(300, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("legal_documents")
    .select("id, doc_key, version, title, jurisdiction, status, summary, requires_acceptance, effective_at, published_at, approved_by, approved_at, created_by, updated_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const docKey = toTrimmedString(options?.docKey ?? null, 120);
  if (docKey) query = query.eq("doc_key", normalizeLegalDocKey(docKey));
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const publishLegalDocumentByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  payload: Record<string, unknown>,
) => {
  const docKey = normalizeLegalDocKey(payload.docKey);
  const version = toTrimmedString(payload.version, 40);
  const title = toTrimmedString(payload.title, 180);
  const contentMarkdown = typeof payload.contentMarkdown === "string" ? payload.contentMarkdown.trim() : "";
  if (!version) throw new Error("version is required");
  if (!title) throw new Error("title is required");
  if (!contentMarkdown) throw new Error("contentMarkdown is required");
  const jurisdiction = toTrimmedString(payload.jurisdiction, 20) ?? "IN";
  const summary = toTrimmedString(payload.summary, 2000);
  const requiresAcceptance = payload.requiresAcceptance !== false;
  const effectiveAtRaw = toTrimmedString(payload.effectiveAt, 80);
  const effectiveAt = effectiveAtRaw ? new Date(effectiveAtRaw).toISOString() : new Date().toISOString();
  const metadata = safeMetadataObject(payload.metadata);
  const nowIso = new Date().toISOString();

  const { error: archiveError } = await client
    .from("legal_documents")
    .update({ status: "archived" })
    .eq("doc_key", docKey)
    .eq("status", "published");
  if (archiveError) throw archiveError;

  const { data, error } = await client
    .from("legal_documents")
    .upsert({
      doc_key: docKey,
      version,
      title,
      jurisdiction,
      status: "published",
      summary,
      content_markdown: contentMarkdown,
      requires_acceptance: requiresAcceptance,
      effective_at: effectiveAt,
      published_at: nowIso,
      approved_by: adminUserId,
      approved_at: nowIso,
      created_by: adminUserId,
      metadata,
    }, { onConflict: "doc_key,version" })
    .select("id, doc_key, version, title, status, requires_acceptance, effective_at, published_at, approved_by, approved_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to publish legal document");

  await recordComplianceAuditEvent(client, {
    actorUserId: adminUserId,
    eventType: "legal_document_published",
    entityType: "legal_documents",
    entityId: data.id,
    payload: {
      doc_key: data.doc_key,
      version: data.version,
      title: data.title,
      effective_at: data.effective_at,
    },
  });

  return data;
};

const COMPLIANCE_REQUEST_TYPES = new Set(["access_export", "deletion", "rectification", "restriction"]);
const COMPLIANCE_REQUEST_STATUSES = new Set(["submitted", "under_review", "approved", "rejected", "completed", "cancelled"]);
const TERMINAL_COMPLIANCE_STATUSES = new Set(["rejected", "completed", "cancelled"]);

const normalizeComplianceConsentStatus = (value: unknown): "accepted" | "revoked" => {
  const normalized = String(value ?? "accepted").trim().toLowerCase();
  if (normalized === "accepted" || normalized === "revoked") return normalized;
  throw new Error("consentStatus must be one of: accepted, revoked");
};

const normalizeComplianceDataRequestType = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!COMPLIANCE_REQUEST_TYPES.has(normalized)) {
    throw new Error("requestType must be one of: access_export, deletion, rectification, restriction");
  }
  return normalized;
};

const normalizeComplianceDataRequestStatus = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!COMPLIANCE_REQUEST_STATUSES.has(normalized)) {
    throw new Error("status must be one of: submitted, under_review, approved, rejected, completed, cancelled");
  }
  return normalized;
};

const toTrimmedString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const safeMetadataObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const recordComplianceAuditEvent = async (
  client: ReturnType<typeof createClient>,
  params: {
    actorUserId: string;
    eventType: string;
    entityType: string;
    entityId: string | null;
    companyId?: string | null;
    payload?: Record<string, unknown>;
  },
) => {
  const { error } = await client.from("compliance_audit_events").insert({
    actor_user_id: params.actorUserId,
    company_id: params.companyId ?? null,
    event_type: params.eventType,
    entity_type: params.entityType,
    entity_id: params.entityId,
    payload: params.payload ?? {},
  });
  if (error) throw error;
};

const upsertComplianceConsent = async (
  client: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  payload: Record<string, unknown>,
) => {
  const consentKey = toTrimmedString(payload.consentKey, 120);
  if (!consentKey) throw new Error("consentKey is required");
  const consentVersion = toTrimmedString(payload.consentVersion, 40) ?? "v1";
  const consentStatus = normalizeComplianceConsentStatus(payload.consentStatus);
  const consentSource = toTrimmedString(payload.source, 60) ?? "app";
  const acceptedAt = consentStatus === "accepted" ? new Date().toISOString() : null;
  const revokedAt = consentStatus === "revoked" ? new Date().toISOString() : null;
  const ipHash = await hashText(getRequestIp(req));
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
  const metadata = safeMetadataObject(payload.metadata);

  const { data, error } = await client
    .from("compliance_user_consents")
    .upsert({
      user_id: userId,
      consent_key: consentKey,
      consent_version: consentVersion,
      consent_status: consentStatus,
      consent_source: consentSource,
      ip_hash: ipHash,
      user_agent: userAgent,
      metadata,
      accepted_at: acceptedAt,
      revoked_at: revokedAt,
    }, { onConflict: "user_id,consent_key,consent_version" })
    .select("id, user_id, consent_key, consent_version, consent_status, consent_source, accepted_at, revoked_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to persist consent event");

  await recordComplianceAuditEvent(client, {
    actorUserId: userId,
    eventType: consentStatus === "accepted" ? "consent_accepted" : "consent_revoked",
    entityType: "compliance_user_consents",
    entityId: data.id,
    payload: {
      consent_key: data.consent_key,
      consent_version: data.consent_version,
      consent_status: data.consent_status,
    },
  });

  return data;
};

const listComplianceConsentStatus = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  options?: { consentKey?: string | null; limit?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 50)));
  let query = client
    .from("compliance_user_consents")
    .select("id, consent_key, consent_version, consent_status, consent_source, accepted_at, revoked_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  const consentKey = toTrimmedString(options?.consentKey ?? null, 120);
  if (consentKey) query = query.eq("consent_key", consentKey);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertLegalDisclaimerAcceptance = async (
  client: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  payload: Record<string, unknown>,
) => {
  const disclaimerKey = toTrimmedString(payload.disclaimerKey, 120) ?? "ai_assisted_drafting";
  const disclaimerVersion = toTrimmedString(payload.disclaimerVersion, 40) ?? "v1";
  const source = toTrimmedString(payload.source, 60) ?? "app";
  const ipHash = await hashText(getRequestIp(req));
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
  const metadata = safeMetadataObject(payload.metadata);

  const { data, error } = await client
    .from("legal_disclaimer_acceptances")
    .upsert({
      user_id: userId,
      disclaimer_key: disclaimerKey,
      disclaimer_version: disclaimerVersion,
      source,
      ip_hash: ipHash,
      user_agent: userAgent,
      metadata,
      accepted_at: new Date().toISOString(),
    }, { onConflict: "user_id,disclaimer_key,disclaimer_version" })
    .select("id, user_id, disclaimer_key, disclaimer_version, source, accepted_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to persist legal disclaimer acceptance");

  await recordComplianceAuditEvent(client, {
    actorUserId: userId,
    eventType: "legal_disclaimer_accepted",
    entityType: "legal_disclaimer_acceptances",
    entityId: data.id,
    payload: {
      disclaimer_key: data.disclaimer_key,
      disclaimer_version: data.disclaimer_version,
    },
  });

  return data;
};

const listLegalDisclaimerStatus = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  options?: { disclaimerKey?: string | null; limit?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 50)));
  let query = client
    .from("legal_disclaimer_acceptances")
    .select("id, disclaimer_key, disclaimer_version, source, accepted_at, updated_at")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false })
    .limit(limit);
  const disclaimerKey = toTrimmedString(options?.disclaimerKey ?? null, 120);
  if (disclaimerKey) query = query.eq("disclaimer_key", disclaimerKey);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const createComplianceDataRequest = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  payload: Record<string, unknown>,
) => {
  const requestType = normalizeComplianceDataRequestType(payload.requestType);
  const jurisdiction = toTrimmedString(payload.jurisdiction, 40) ?? "IN-DPDP";
  const adminNotes = toTrimmedString(payload.notes, 2000);
  const requestPayload = safeMetadataObject(payload.requestPayload ?? payload.details);
  const companyIdRaw = toTrimmedString(payload.companyId, 80);
  const companyId = companyIdRaw && companyIdRaw !== "none" ? companyIdRaw : null;
  if (companyId) assertUuid(companyId, "companyId");
  if (companyId) {
    const companyIds = await getUserCompanyIds(client, userId);
    if (!companyIds.includes(companyId)) {
      throw new Error("Forbidden");
    }
  }

  const dueAtCandidate = toTrimmedString(payload.dueAt, 80);
  let dueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  if (dueAtCandidate) {
    const parsed = new Date(dueAtCandidate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("dueAt must be a valid ISO date");
    }
    dueAt = parsed.toISOString();
  }

  const { data, error } = await client
    .from("compliance_data_requests")
    .insert({
      user_id: userId,
      company_id: companyId,
      request_type: requestType,
      status: "submitted",
      jurisdiction,
      request_payload: requestPayload,
      admin_notes: adminNotes,
      due_at: dueAt,
    })
    .select("id, user_id, company_id, request_type, status, jurisdiction, request_payload, admin_notes, due_at, submitted_at, resolved_at, resolved_by, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create compliance data request");

  await recordComplianceAuditEvent(client, {
    actorUserId: userId,
    eventType: "compliance_data_request_submitted",
    entityType: "compliance_data_requests",
    entityId: data.id,
    companyId: data.company_id,
    payload: {
      request_type: data.request_type,
      jurisdiction: data.jurisdiction,
      due_at: data.due_at,
    },
  });

  return data;
};

const listComplianceDataRequests = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  options?: { status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 50)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("compliance_data_requests")
    .select("id, user_id, company_id, request_type, status, jurisdiction, request_payload, admin_notes, due_at, submitted_at, resolved_at, resolved_by, updated_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 40);
  if (status) query = query.eq("status", normalizeComplianceDataRequestStatus(status));
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const listComplianceDataRequestsByAdmin = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; requestType?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(300, Number(options?.limit ?? 100)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("compliance_data_requests")
    .select("id, user_id, company_id, request_type, status, jurisdiction, request_payload, admin_notes, due_at, submitted_at, resolved_at, resolved_by, updated_at")
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 40);
  if (status) query = query.eq("status", normalizeComplianceDataRequestStatus(status));
  const requestType = toTrimmedString(options?.requestType ?? null, 40);
  if (requestType) query = query.eq("request_type", normalizeComplianceDataRequestType(requestType));
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const updateComplianceDataRequestStatusByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  requestId: string,
  payload: Record<string, unknown>,
) => {
  assertUuid(requestId, "requestId");
  const nextStatus = normalizeComplianceDataRequestStatus(payload.status);
  const adminNotes = toTrimmedString(payload.adminNotes, 2000);
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: nextStatus,
    admin_notes: adminNotes,
  };
  if (TERMINAL_COMPLIANCE_STATUSES.has(nextStatus)) {
    patch.resolved_at = nowIso;
    patch.resolved_by = adminUserId;
  } else {
    patch.resolved_at = null;
    patch.resolved_by = null;
  }

  const { data, error } = await client
    .from("compliance_data_requests")
    .update(patch)
    .eq("id", requestId)
    .select("id, user_id, company_id, request_type, status, jurisdiction, request_payload, admin_notes, due_at, submitted_at, resolved_at, resolved_by, updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("compliance data request not found");

  await recordComplianceAuditEvent(client, {
    actorUserId: adminUserId,
    eventType: "compliance_data_request_status_updated",
    entityType: "compliance_data_requests",
    entityId: data.id,
    companyId: data.company_id,
    payload: {
      request_type: data.request_type,
      status: data.status,
      resolved_at: data.resolved_at,
      resolved_by: data.resolved_by,
    },
  });

  return data;
};

const collectComplianceLegalReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const nowIso = new Date().toISOString();
  const staleSubmittedIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [profileCountResult, disclaimerRowsResult, openRequestsResult, overdueRequestsResult, staleSubmittedResult, publishedDocsResult, legalDocAcceptanceResult] = await Promise.all([
    client.from("profiles").select("user_id", { count: "exact", head: true }),
    client.from("legal_disclaimer_acceptances").select("user_id").eq("disclaimer_key", "ai_assisted_drafting").limit(5000),
    client.from("compliance_data_requests").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review", "approved"]),
    client.from("compliance_data_requests").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review", "approved"]).lt("due_at", nowIso),
    client.from("compliance_data_requests").select("id", { count: "exact", head: true }).eq("status", "submitted").lt("submitted_at", staleSubmittedIso),
    client.from("legal_documents").select("doc_key").eq("status", "published").in("doc_key", [...LEGAL_DOC_REQUIRED_KEYS]),
    client.from("legal_document_acceptances").select("user_id, doc_key").in("doc_key", ["privacy_policy", "terms_of_service"]).limit(5000),
  ]);

  if (profileCountResult.error) throw profileCountResult.error;
  if (disclaimerRowsResult.error) throw disclaimerRowsResult.error;
  if (openRequestsResult.error) throw openRequestsResult.error;
  if (overdueRequestsResult.error) throw overdueRequestsResult.error;
  if (staleSubmittedResult.error) throw staleSubmittedResult.error;
  if (publishedDocsResult.error) throw publishedDocsResult.error;
  if (legalDocAcceptanceResult.error) throw legalDocAcceptanceResult.error;

  const totalUsers = Number(profileCountResult.count ?? 0);
  const acceptedUserCount = new Set((disclaimerRowsResult.data ?? []).map((row) => String(row.user_id))).size;
  const missingDisclaimerUsers = Math.max(0, totalUsers - acceptedUserCount);
  const openRequests = Number(openRequestsResult.count ?? 0);
  const overdueOpenRequests = Number(overdueRequestsResult.count ?? 0);
  const staleSubmittedRequests = Number(staleSubmittedResult.count ?? 0);
  const publishedDocKeys = new Set((publishedDocsResult.data ?? []).map((row) => String(row.doc_key)));
  const requiredMissingDocs = LEGAL_DOC_REQUIRED_KEYS.filter((key) => !publishedDocKeys.has(key));
  const usersAcceptedCoreDocs = new Set(
    (legalDocAcceptanceResult.data ?? [])
      .filter((row) => row.doc_key === "privacy_policy" || row.doc_key === "terms_of_service")
      .map((row) => String(row.user_id)),
  ).size;
  const usersMissingCoreDocAcceptance = Math.max(0, totalUsers - usersAcceptedCoreDocs);

  const critical = overdueOpenRequests + requiredMissingDocs.length;
  const high = staleSubmittedRequests + (missingDisclaimerUsers > 0 ? 1 : 0) + (usersMissingCoreDocAcceptance > 0 ? 1 : 0);
  const medium = openRequests;

  return {
    summary: {
      critical,
      high,
      medium,
    },
    metrics: {
      users_total: totalUsers,
      users_with_ai_disclaimer: acceptedUserCount,
      users_missing_ai_disclaimer: missingDisclaimerUsers,
      required_docs_published: LEGAL_DOC_REQUIRED_KEYS.length - requiredMissingDocs.length,
      required_docs_missing: requiredMissingDocs,
      users_with_core_legal_acceptance: usersAcceptedCoreDocs,
      users_missing_core_legal_acceptance: usersMissingCoreDocAcceptance,
      open_data_requests: openRequests,
      overdue_open_data_requests: overdueOpenRequests,
      stale_submitted_requests_older_than_7d: staleSubmittedRequests,
    },
    overall: {
      pass: critical === 0 && high === 0,
    },
  };
};

const resolveBillingScopeForUser = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  options?: { companyId?: string | null; caFirmId?: string | null },
) => {
  const companyIdRaw = toTrimmedString(options?.companyId ?? null, 80);
  const caFirmIdRaw = toTrimmedString(options?.caFirmId ?? null, 80);
  const companyId = companyIdRaw && companyIdRaw !== "none" ? companyIdRaw : null;
  const caFirmId = caFirmIdRaw && caFirmIdRaw !== "none" ? caFirmIdRaw : null;
  if (companyId && caFirmId) throw new Error("companyId and caFirmId cannot be set together");
  if (companyId) assertUuid(companyId, "companyId");
  if (caFirmId) assertUuid(caFirmId, "caFirmId");

  if (roles.has("admin")) {
    if (companyId || caFirmId) return { companyId, caFirmId };
    return { companyId: null, caFirmId: null };
  }

  const [companyIds, caFirmIds] = await Promise.all([
    getUserCompanyIds(client, userId),
    getUserCaFirmIds(client, userId),
  ]);

  if (companyId) {
    if (!companyIds.includes(companyId)) throw new Error("Forbidden");
    return { companyId, caFirmId: null };
  }
  if (caFirmId) {
    if (!caFirmIds.includes(caFirmId)) throw new Error("Forbidden");
    return { companyId: null, caFirmId };
  }
  if (companyIds.length > 0) return { companyId: companyIds[0], caFirmId: null };
  if (caFirmIds.length > 0) return { companyId: null, caFirmId: caFirmIds[0] };
  return { companyId: null, caFirmId: null };
};

const listBillingPlans = async (client: ReturnType<typeof createClient>) => {
  const { data, error } = await client
    .from("billing_plans")
    .select("id, plan_code, plan_name, plan_tier, billing_cycle, currency, base_price_minor, gst_rate_bps, ai_monthly_request_limit, seats_included, overage_per_request_minor, active, metadata, updated_at")
    .eq("active", true)
    .order("base_price_minor", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

const loadBillingSubscription = async (
  client: ReturnType<typeof createClient>,
  scope: { companyId: string | null; caFirmId: string | null },
) => {
  if (!scope.companyId && !scope.caFirmId) return null;
  let query = client
    .from("billing_subscriptions")
    .select("id, company_id, ca_firm_id, owner_user_id, plan_id, status, current_period_start, current_period_end, trial_ends_at, cancel_at_period_end, cancelled_at, auto_renew, payment_retry_count, payment_last_failed_at, payment_failure_code, payment_failure_message, metadata, updated_at, billing_plans(plan_code, plan_name, plan_tier, billing_cycle, currency, base_price_minor, gst_rate_bps, ai_monthly_request_limit, seats_included, overage_per_request_minor)")
    .order("created_at", { ascending: false })
    .limit(1);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  if (scope.caFirmId) query = query.eq("ca_firm_id", scope.caFirmId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ?? null;
};

const upsertBillingSubscription = async (
  client: ReturnType<typeof createClient>,
  params: {
    scope: { companyId: string | null; caFirmId: string | null };
    ownerUserId: string;
    planCode: string;
    action: "activate" | "change_plan" | "cancel";
    cancelAtPeriodEnd?: boolean;
  },
) => {
  const planCode = toTrimmedString(params.planCode, 100);
  if (!planCode && params.action !== "cancel") throw new Error("planCode is required");

  const current = await loadBillingSubscription(client, params.scope);
  if (params.action === "cancel") {
    if (!current) throw new Error("billing subscription not found");
    const cancelAtPeriodEnd = params.cancelAtPeriodEnd !== false;
    const patch = cancelAtPeriodEnd
      ? { cancel_at_period_end: true, auto_renew: false, status: "active" }
      : { status: "cancelled", cancelled_at: new Date().toISOString(), auto_renew: false, cancel_at_period_end: false };
    const { data, error } = await client
      .from("billing_subscriptions")
      .update(patch)
      .eq("id", current.id)
      .select("id, status, cancel_at_period_end, cancelled_at, current_period_end, updated_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to cancel subscription");
    return data;
  }

  const { data: plan, error: planError } = await client
    .from("billing_plans")
    .select("id, plan_code")
    .eq("plan_code", planCode)
    .eq("active", true)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new Error("Active billing plan not found");

  const periodStart = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  if (!current) {
    const { data, error } = await client
      .from("billing_subscriptions")
      .insert({
        company_id: params.scope.companyId,
        ca_firm_id: params.scope.caFirmId,
        owner_user_id: params.ownerUserId,
        plan_id: plan.id,
        status: "trialing",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        trial_ends_at: trialEndsAt,
        auto_renew: true,
      })
      .select("id, company_id, ca_firm_id, plan_id, status, current_period_start, current_period_end, trial_ends_at, updated_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to create billing subscription");
    return data;
  }

  const { data, error } = await client
    .from("billing_subscriptions")
    .update({
      plan_id: plan.id,
      status: current.status === "cancelled" || current.status === "expired" ? "active" : current.status,
      cancel_at_period_end: false,
      auto_renew: true,
      cancelled_at: null,
    })
    .eq("id", current.id)
    .select("id, company_id, ca_firm_id, plan_id, status, current_period_start, current_period_end, trial_ends_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update billing subscription");
  return data;
};

const listBillingInvoices = async (
  client: ReturnType<typeof createClient>,
  scope: { companyId: string | null; caFirmId: string | null },
  options?: { limit?: number; offset?: number; status?: string | null },
) => {
  if (!scope.companyId && !scope.caFirmId) return [];
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 60)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("billing_invoice_records")
    .select("id, invoice_number, invoice_type, status, currency, subtotal_minor, tax_minor, total_minor, amount_paid_minor, issued_at, due_at, paid_at, gstin_supplier, gstin_customer, place_of_supply, hsn_sac_code, metadata, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  if (scope.caFirmId) query = query.eq("ca_firm_id", scope.caFirmId);
  const status = toTrimmedString(options?.status ?? null, 40);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const recordBillingUsageEvent = async (
  client: ReturnType<typeof createClient>,
  params: {
    scope: { companyId: string | null; caFirmId: string | null };
    userId: string;
    meterKey: string;
    quantity: number;
    source: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
  },
) => {
  const meterKey = toTrimmedString(params.meterKey, 80);
  if (!meterKey) throw new Error("meterKey is required");
  const idempotencyKey = toTrimmedString(params.idempotencyKey, 120);
  if (!idempotencyKey) throw new Error("idempotencyKey is required");
  const source = toTrimmedString(params.source, 80) ?? "api";
  const quantity = Number(params.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error("quantity must be a non-negative number");

  const { data: meter, error: meterError } = await client
    .from("billing_usage_meters")
    .select("id, meter_key, billable")
    .eq("meter_key", meterKey)
    .eq("active", true)
    .maybeSingle();
  if (meterError) throw meterError;
  if (!meter) throw new Error("Active usage meter not found");

  const subscription = await loadBillingSubscription(client, params.scope);
  const subscriptionId = subscription?.id ?? null;
  const nowIso = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartDate = monthStart.toISOString().slice(0, 10);

  const { data: event, error: eventError } = await client
    .from("billing_usage_events")
    .insert({
      meter_id: meter.id,
      subscription_id: subscriptionId,
      company_id: params.scope.companyId,
      ca_firm_id: params.scope.caFirmId,
      user_id: params.userId,
      quantity,
      source,
      idempotency_key: idempotencyKey,
      metadata: params.metadata ?? {},
      event_at: nowIso,
    })
    .select("id, meter_id, subscription_id, company_id, ca_firm_id, user_id, quantity, event_at, source, idempotency_key")
    .single();
  if (eventError || !event) throw eventError ?? new Error("Failed to record usage event");

  const { data: rollup, error: rollupLoadError } = await client
    .from("billing_usage_monthly_rollups")
    .select("id, total_quantity, billable_quantity")
    .eq("meter_id", meter.id)
    .eq("month_start", monthStartDate)
    .eq("subscription_id", subscriptionId)
    .eq("company_id", params.scope.companyId)
    .eq("ca_firm_id", params.scope.caFirmId)
    .eq("user_id", params.userId)
    .maybeSingle();
  if (rollupLoadError) throw rollupLoadError;

  const nextTotal = Number(rollup?.total_quantity ?? 0) + quantity;
  const nextBillable = Number(rollup?.billable_quantity ?? 0) + (meter.billable ? quantity : 0);

  const { error: rollupUpsertError } = await client
    .from("billing_usage_monthly_rollups")
    .upsert({
      id: rollup?.id,
      meter_id: meter.id,
      month_start: monthStartDate,
      subscription_id: subscriptionId,
      company_id: params.scope.companyId,
      ca_firm_id: params.scope.caFirmId,
      user_id: params.userId,
      total_quantity: nextTotal,
      billable_quantity: nextBillable,
      last_event_at: nowIso,
      updated_at: nowIso,
    }, { onConflict: "meter_id,month_start,subscription_id,company_id,ca_firm_id,user_id" });
  if (rollupUpsertError) throw rollupUpsertError;

  return event;
};

const loadBillingUsageSummary = async (
  client: ReturnType<typeof createClient>,
  scope: { companyId: string | null; caFirmId: string | null },
  options?: { monthStart?: string | null },
) => {
  const monthStart = toTrimmedString(options?.monthStart ?? null, 20)
    ?? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  let query = client
    .from("billing_usage_monthly_rollups")
    .select("meter_id, month_start, subscription_id, company_id, ca_firm_id, user_id, total_quantity, billable_quantity, last_event_at");
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  if (scope.caFirmId) query = query.eq("ca_firm_id", scope.caFirmId);
  query = query.eq("month_start", monthStart);
  const { data: rows, error } = await query;
  if (error) throw error;
  const meterIds = Array.from(new Set((rows ?? []).map((row) => row.meter_id).filter(Boolean)));
  const { data: meters, error: meterError } = meterIds.length > 0
    ? await client.from("billing_usage_meters").select("id, meter_key, meter_name, unit").in("id", meterIds)
    : { data: [], error: null };
  if (meterError) throw meterError;
  const meterById = new Map((meters ?? []).map((row) => [row.id, row]));
  return (rows ?? []).map((row) => ({
    ...row,
    meter: meterById.get(row.meter_id) ?? null,
  }));
};

const issueBillingInvoiceByAdmin = async (
  client: ReturnType<typeof createClient>,
  params: {
    subscriptionId: string;
    invoiceNumber: string;
    subtotalMinor: number;
    taxMinor: number;
    dueAt?: string | null;
    gstinCustomer?: string | null;
    placeOfSupply?: string | null;
    hsnSacCode?: string | null;
    lineItems?: unknown;
    metadata?: Record<string, unknown>;
  },
) => {
  assertUuid(params.subscriptionId, "subscriptionId");
  const { data: subscription, error: subError } = await client
    .from("billing_subscriptions")
    .select("id, company_id, ca_firm_id, status")
    .eq("id", params.subscriptionId)
    .maybeSingle();
  if (subError) throw subError;
  if (!subscription) throw new Error("billing subscription not found");

  const invoiceNumber = toTrimmedString(params.invoiceNumber, 80);
  if (!invoiceNumber) throw new Error("invoiceNumber is required");
  const subtotalMinor = Number(params.subtotalMinor);
  const taxMinor = Number(params.taxMinor);
  if (!Number.isFinite(subtotalMinor) || subtotalMinor < 0) throw new Error("subtotalMinor must be a non-negative number");
  if (!Number.isFinite(taxMinor) || taxMinor < 0) throw new Error("taxMinor must be a non-negative number");
  const totalMinor = subtotalMinor + taxMinor;

  const dueAtRaw = toTrimmedString(params.dueAt ?? null, 80);
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const lineItems = Array.isArray(params.lineItems) ? params.lineItems : [];

  const { data, error } = await client
    .from("billing_invoice_records")
    .insert({
      subscription_id: subscription.id,
      company_id: subscription.company_id,
      ca_firm_id: subscription.ca_firm_id,
      invoice_number: invoiceNumber,
      invoice_type: "tax_invoice",
      status: "issued",
      subtotal_minor: subtotalMinor,
      tax_minor: taxMinor,
      total_minor: totalMinor,
      amount_paid_minor: 0,
      due_at: dueAt,
      gstin_supplier: "27ABCDE1234F1Z5",
      gstin_customer: toTrimmedString(params.gstinCustomer, 20),
      place_of_supply: toTrimmedString(params.placeOfSupply, 80),
      hsn_sac_code: toTrimmedString(params.hsnSacCode, 20),
      line_items: lineItems,
      metadata: params.metadata ?? {},
    })
    .select("id, subscription_id, invoice_number, status, subtotal_minor, tax_minor, total_minor, due_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to issue invoice");
  return data;
};

const recordBillingPaymentAttemptByAdmin = async (
  client: ReturnType<typeof createClient>,
  params: {
    subscriptionId: string;
    invoiceId?: string | null;
    status: "succeeded" | "failed" | "scheduled_retry" | "cancelled";
    amountMinor: number;
    provider?: string | null;
    failureCode?: string | null;
    failureMessage?: string | null;
    retryScheduledAt?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  assertUuid(params.subscriptionId, "subscriptionId");
  if (params.invoiceId) assertUuid(params.invoiceId, "invoiceId");
  const amountMinor = Number(params.amountMinor);
  if (!Number.isFinite(amountMinor) || amountMinor < 0) throw new Error("amountMinor must be a non-negative number");

  const { data: latestAttempt, error: latestError } = await client
    .from("billing_payment_attempts")
    .select("attempt_number")
    .eq("subscription_id", params.subscriptionId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  const attemptNumber = Number(latestAttempt?.attempt_number ?? 0) + 1;

  const retryScheduledAt = toTrimmedString(params.retryScheduledAt ?? null, 80);
  const retryIso = retryScheduledAt ? new Date(retryScheduledAt).toISOString() : null;
  const provider = toTrimmedString(params.provider ?? null, 80) ?? "manual";
  const failureCode = toTrimmedString(params.failureCode ?? null, 80);
  const failureMessage = toTrimmedString(params.failureMessage ?? null, 2000);
  const nowIso = new Date().toISOString();

  const { data, error } = await client
    .from("billing_payment_attempts")
    .insert({
      subscription_id: params.subscriptionId,
      invoice_id: params.invoiceId ?? null,
      attempt_number: attemptNumber,
      status: params.status,
      amount_minor: amountMinor,
      provider,
      failure_code: failureCode,
      failure_message: failureMessage,
      retry_scheduled_at: retryIso,
      attempted_at: nowIso,
      resolved_at: params.status === "succeeded" || params.status === "cancelled" ? nowIso : null,
      metadata: params.metadata ?? {},
    })
    .select("id, subscription_id, invoice_id, attempt_number, status, amount_minor, provider, failure_code, failure_message, retry_scheduled_at, attempted_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to record payment attempt");

  if (params.status === "succeeded") {
    const { error: subUpdateError } = await client
      .from("billing_subscriptions")
      .update({
        status: "active",
        payment_retry_count: 0,
        payment_last_failed_at: null,
        payment_failure_code: null,
        payment_failure_message: null,
      })
      .eq("id", params.subscriptionId);
    if (subUpdateError) throw subUpdateError;

    if (params.invoiceId) {
      const { error: invoiceUpdateError } = await client
        .from("billing_invoice_records")
        .update({
          status: "paid",
          amount_paid_minor: amountMinor,
          paid_at: nowIso,
        })
        .eq("id", params.invoiceId);
      if (invoiceUpdateError) throw invoiceUpdateError;
    }
  } else if (params.status === "failed" || params.status === "scheduled_retry") {
    const { data: sub, error: subLoadError } = await client
      .from("billing_subscriptions")
      .select("payment_retry_count")
      .eq("id", params.subscriptionId)
      .maybeSingle();
    if (subLoadError) throw subLoadError;
    const nextRetry = Number(sub?.payment_retry_count ?? 0) + 1;
    const { error: subUpdateError } = await client
      .from("billing_subscriptions")
      .update({
        status: "past_due",
        payment_retry_count: nextRetry,
        payment_last_failed_at: nowIso,
        payment_failure_code: failureCode,
        payment_failure_message: failureMessage,
      })
      .eq("id", params.subscriptionId);
    if (subUpdateError) throw subUpdateError;

    if (params.invoiceId) {
      const { error: invoiceUpdateError } = await client
        .from("billing_invoice_records")
        .update({ status: "overdue" })
        .eq("id", params.invoiceId);
      if (invoiceUpdateError) throw invoiceUpdateError;
    }
  }

  return data;
};

const collectCommercialReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const [plansResult, subscriptionsResult, activeSubscriptionsResult, invoicesResult, overdueInvoicesResult, failedPaymentsResult, metersResult, usageEventsResult] = await Promise.all([
    client.from("billing_plans").select("id, metadata").eq("active", true),
    client.from("billing_subscriptions").select("id, status, company_id, ca_firm_id, current_period_end, payment_retry_count"),
    client.from("billing_subscriptions").select("id", { count: "exact", head: true }).in("status", ["trialing", "active", "past_due", "paused"]),
    client.from("billing_invoice_records").select("id", { count: "exact", head: true }),
    client.from("billing_invoice_records").select("id", { count: "exact", head: true }).eq("status", "overdue"),
    client.from("billing_payment_attempts").select("id", { count: "exact", head: true }).eq("status", "failed"),
    client.from("billing_usage_meters").select("id", { count: "exact", head: true }).eq("active", true),
    client.from("billing_usage_events").select("id", { count: "exact", head: true }).gte("event_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  if (plansResult.error) throw plansResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (activeSubscriptionsResult.error) throw activeSubscriptionsResult.error;
  if (invoicesResult.error) throw invoicesResult.error;
  if (overdueInvoicesResult.error) throw overdueInvoicesResult.error;
  if (failedPaymentsResult.error) throw failedPaymentsResult.error;
  if (metersResult.error) throw metersResult.error;
  if (usageEventsResult.error) throw usageEventsResult.error;

  const plans = plansResult.data ?? [];
  const subscriptions = subscriptionsResult.data ?? [];
  const activeSubscriptions = Number(activeSubscriptionsResult.count ?? 0);
  const overdueInvoices = Number(overdueInvoicesResult.count ?? 0);
  const failedPayments = Number(failedPaymentsResult.count ?? 0);
  const usageEvents30d = Number(usageEventsResult.count ?? 0);

  const missingRequiredPlanTiers = ["core", "nexus", "sovereign"].filter((tier) =>
    !plans.some((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const tierFromMetadata = typeof metadata.plan_tier === "string" ? metadata.plan_tier : null;
      return tierFromMetadata === tier;
    }) && !plans.some((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const code = typeof metadata.plan_code === "string" ? metadata.plan_code.toLowerCase() : "";
      return code.includes(tier);
    }) && !plans.some((row) => {
      const raw = JSON.stringify(row).toLowerCase();
      return raw.includes(`"plan_tier":"${tier}"`) || raw.includes(`${tier}_monthly`) || raw.includes(`"${tier}"`);
    })
  );

  const pastDueSubscriptions = subscriptions.filter((row) => row.status === "past_due").length;
  const excessiveRetrySubscriptions = subscriptions.filter((row) => Number(row.payment_retry_count ?? 0) >= 3).length;
  const tenantScopedCount = subscriptions.filter((row) => (row.company_id ? 1 : 0) + (row.ca_firm_id ? 1 : 0) === 1).length;

  return {
    summary: {
      critical: missingRequiredPlanTiers.length + (tenantScopedCount !== subscriptions.length ? 1 : 0),
      high: overdueInvoices + excessiveRetrySubscriptions + (Number(metersResult.count ?? 0) === 0 ? 1 : 0),
      medium: pastDueSubscriptions + failedPayments,
    },
    metrics: {
      plans_active: plans.length,
      plans_missing_tiers: missingRequiredPlanTiers,
      subscriptions_total: subscriptions.length,
      subscriptions_active_like: activeSubscriptions,
      invoices_total: Number(invoicesResult.count ?? 0),
      invoices_overdue: overdueInvoices,
      payment_attempts_failed: failedPayments,
      subscriptions_with_retry_ge_3: excessiveRetrySubscriptions,
      usage_meters_active: Number(metersResult.count ?? 0),
      usage_events_30d: usageEvents30d,
    },
    overall: {
      pass:
        missingRequiredPlanTiers.length === 0 &&
        tenantScopedCount === subscriptions.length &&
        Number(metersResult.count ?? 0) > 0,
    },
  };
};

const INFRA_RUNBOOK_ALLOWED_STATUSES = new Set(["draft", "active", "archived"]);
const INFRA_RELEASE_ALLOWED_ENVIRONMENTS = new Set(["development", "staging", "production"]);
const INFRA_RELEASE_ALLOWED_STATUSES = new Set(["planned", "deployed", "rolled_back", "failed"]);
const INFRA_BACKUP_DRILL_ALLOWED_ENVIRONMENTS = new Set(["staging", "production"]);
const INFRA_BACKUP_DRILL_ALLOWED_STATUSES = new Set(["planned", "running", "succeeded", "failed"]);
const INFRA_MONITORING_ALLOWED_TYPES = new Set(["uptime", "error_tracking", "logging", "alerting"]);
const INFRA_MONITORING_ALLOWED_STATUSES = new Set(["active", "degraded", "disabled", "failed"]);
const INFRA_SLO_BREACH_ALLOWED_SEVERITIES = new Set(["warning", "critical"]);
const INFRA_SLO_BREACH_ALLOWED_STATUSES = new Set(["open", "acknowledged", "resolved"]);

const listInfraRunbooks = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; serviceScope?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("infra_runbooks")
    .select("id, runbook_key, title, service_scope, status, owner_user_id, metadata, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const serviceScope = toTrimmedString(options?.serviceScope ?? null, 120);
  if (serviceScope) query = query.eq("service_scope", serviceScope);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertInfraRunbookByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    runbookKey: string;
    title: string;
    serviceScope?: string | null;
    contentMarkdown: string;
    status?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const runbookKey = toTrimmedString(params.runbookKey, 120);
  if (!runbookKey) throw new Error("runbookKey is required");
  if (!/^[a-z0-9_]+$/.test(runbookKey)) {
    throw new Error("runbookKey must be snake_case");
  }
  const title = toTrimmedString(params.title, 220);
  if (!title) throw new Error("title is required");
  const contentMarkdown = toTrimmedString(params.contentMarkdown, 120000);
  if (!contentMarkdown) throw new Error("contentMarkdown is required");
  const serviceScope = toTrimmedString(params.serviceScope ?? null, 120) ?? "workspace-backend";
  const status = toTrimmedString(params.status ?? null, 30) ?? "active";
  if (!INFRA_RUNBOOK_ALLOWED_STATUSES.has(status)) {
    throw new Error("status must be one of: draft, active, archived");
  }

  const { data, error } = await client
    .from("infra_runbooks")
    .upsert({
      runbook_key: runbookKey,
      title,
      service_scope: serviceScope,
      content_markdown: contentMarkdown,
      status,
      owner_user_id: adminUserId,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "runbook_key" })
    .select("id, runbook_key, title, service_scope, status, owner_user_id, metadata, updated_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert infra runbook");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "infra_runbook_upserted",
    entityType: "infra_runbooks",
    entityId: data.id,
    details: { runbook_key: data.runbook_key, status: data.status, service_scope: data.service_scope },
  });
  return data;
};

const listInfraReleaseRegistry = async (
  client: ReturnType<typeof createClient>,
  options?: { environment?: string | null; status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("infra_release_registry")
    .select("id, release_version, environment, status, commit_sha, deployed_by, deployed_at, rollback_reference, rollback_reason, metadata, updated_at, created_at")
    .order("deployed_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const environment = toTrimmedString(options?.environment ?? null, 30);
  if (environment) query = query.eq("environment", environment);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertInfraReleaseByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    releaseVersion: string;
    environment?: string | null;
    status?: string | null;
    commitSha?: string | null;
    deployedAt?: string | null;
    rollbackReference?: string | null;
    rollbackReason?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const releaseVersion = toTrimmedString(params.releaseVersion, 120);
  if (!releaseVersion) throw new Error("releaseVersion is required");
  const environment = toTrimmedString(params.environment ?? null, 30) ?? "production";
  if (!INFRA_RELEASE_ALLOWED_ENVIRONMENTS.has(environment)) {
    throw new Error("environment must be one of: development, staging, production");
  }
  const status = toTrimmedString(params.status ?? null, 30) ?? "deployed";
  if (!INFRA_RELEASE_ALLOWED_STATUSES.has(status)) {
    throw new Error("status must be one of: planned, deployed, rolled_back, failed");
  }
  const deployedAtRaw = toTrimmedString(params.deployedAt ?? null, 80);
  const deployedAt = deployedAtRaw ? new Date(deployedAtRaw).toISOString() : new Date().toISOString();
  const commitSha = toTrimmedString(params.commitSha ?? null, 120);
  const rollbackReference = toTrimmedString(params.rollbackReference ?? null, 220);
  const rollbackReason = toTrimmedString(params.rollbackReason ?? null, 3000);

  const { data, error } = await client
    .from("infra_release_registry")
    .upsert({
      release_version: releaseVersion,
      environment,
      status,
      commit_sha: commitSha,
      deployed_by: adminUserId,
      deployed_at: deployedAt,
      rollback_reference: rollbackReference,
      rollback_reason: rollbackReason,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "release_version,environment" })
    .select("id, release_version, environment, status, commit_sha, deployed_by, deployed_at, rollback_reference, rollback_reason, metadata, updated_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert release registry row");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "infra_release_upserted",
    entityType: "infra_release_registry",
    entityId: data.id,
    details: { release_version: data.release_version, environment: data.environment, status: data.status },
  });
  return data;
};

const listInfraBackupRestoreDrills = async (
  client: ReturnType<typeof createClient>,
  options?: { environment?: string | null; status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("infra_backup_restore_drills")
    .select("id, environment, status, executed_by, started_at, completed_at, rto_minutes, rpo_minutes, backup_snapshot_ref, notes, metadata, updated_at, created_at")
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const environment = toTrimmedString(options?.environment ?? null, 30);
  if (environment) query = query.eq("environment", environment);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const createInfraBackupRestoreDrillByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    environment?: string | null;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    rtoMinutes?: number | null;
    rpoMinutes?: number | null;
    backupSnapshotRef?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const environment = toTrimmedString(params.environment ?? null, 30) ?? "production";
  if (!INFRA_BACKUP_DRILL_ALLOWED_ENVIRONMENTS.has(environment)) {
    throw new Error("environment must be one of: staging, production");
  }
  const status = toTrimmedString(params.status, 30);
  if (!status || !INFRA_BACKUP_DRILL_ALLOWED_STATUSES.has(status)) {
    throw new Error("status must be one of: planned, running, succeeded, failed");
  }
  const startedAtRaw = toTrimmedString(params.startedAt ?? null, 80);
  const startedAt = startedAtRaw ? new Date(startedAtRaw).toISOString() : new Date().toISOString();
  const completedAtRaw = toTrimmedString(params.completedAt ?? null, 80);
  const completedAt = completedAtRaw ? new Date(completedAtRaw).toISOString() : null;
  const rtoMinutes = params.rtoMinutes === null || typeof params.rtoMinutes === "undefined" ? null : Number(params.rtoMinutes);
  const rpoMinutes = params.rpoMinutes === null || typeof params.rpoMinutes === "undefined" ? null : Number(params.rpoMinutes);
  if (rtoMinutes !== null && (!Number.isFinite(rtoMinutes) || rtoMinutes < 0)) {
    throw new Error("rtoMinutes must be a non-negative number");
  }
  if (rpoMinutes !== null && (!Number.isFinite(rpoMinutes) || rpoMinutes < 0)) {
    throw new Error("rpoMinutes must be a non-negative number");
  }

  const { data, error } = await client
    .from("infra_backup_restore_drills")
    .insert({
      environment,
      status,
      executed_by: adminUserId,
      started_at: startedAt,
      completed_at: completedAt,
      rto_minutes: rtoMinutes,
      rpo_minutes: rpoMinutes,
      backup_snapshot_ref: toTrimmedString(params.backupSnapshotRef ?? null, 220),
      notes: toTrimmedString(params.notes ?? null, 3000),
      metadata: params.metadata ?? {},
    })
    .select("id, environment, status, executed_by, started_at, completed_at, rto_minutes, rpo_minutes, backup_snapshot_ref, notes, metadata, updated_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create backup/restore drill");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "infra_backup_drill_created",
    entityType: "infra_backup_restore_drills",
    entityId: data.id,
    details: { environment: data.environment, status: data.status },
  });
  return data;
};

const listInfraMonitoringIntegrations = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; integrationType?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("infra_monitoring_integrations")
    .select("id, provider, integration_type, status, config_masked, last_check_at, last_error, owner_user_id, metadata, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const integrationType = toTrimmedString(options?.integrationType ?? null, 60);
  if (integrationType) query = query.eq("integration_type", integrationType);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertInfraMonitoringIntegrationByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    provider: string;
    integrationType: string;
    status?: string | null;
    configMasked?: Record<string, unknown>;
    lastCheckAt?: string | null;
    lastError?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const provider = toTrimmedString(params.provider, 120);
  if (!provider) throw new Error("provider is required");
  const integrationType = toTrimmedString(params.integrationType, 60);
  if (!integrationType || !INFRA_MONITORING_ALLOWED_TYPES.has(integrationType)) {
    throw new Error("integrationType must be one of: uptime, error_tracking, logging, alerting");
  }
  const status = toTrimmedString(params.status ?? null, 30) ?? "active";
  if (!INFRA_MONITORING_ALLOWED_STATUSES.has(status)) {
    throw new Error("status must be one of: active, degraded, disabled, failed");
  }
  const lastCheckAtRaw = toTrimmedString(params.lastCheckAt ?? null, 80);
  const lastCheckAt = lastCheckAtRaw ? new Date(lastCheckAtRaw).toISOString() : null;

  const { data, error } = await client
    .from("infra_monitoring_integrations")
    .upsert({
      provider,
      integration_type: integrationType,
      status,
      config_masked: params.configMasked ?? {},
      last_check_at: lastCheckAt,
      last_error: toTrimmedString(params.lastError ?? null, 2000),
      owner_user_id: adminUserId,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "provider,integration_type" })
    .select("id, provider, integration_type, status, config_masked, last_check_at, last_error, owner_user_id, metadata, updated_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert monitoring integration");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "infra_monitoring_integration_upserted",
    entityType: "infra_monitoring_integrations",
    entityId: data.id,
    details: { provider: data.provider, integration_type: data.integration_type, status: data.status },
  });
  return data;
};

const listInfraSloPolicies = async (
  client: ReturnType<typeof createClient>,
  options?: { active?: boolean | null; serviceName?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("infra_slo_policies")
    .select("id, service_name, sli_name, window_days, target_percent, warning_threshold_percent, critical_threshold_percent, active, metadata, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (typeof options?.active === "boolean") query = query.eq("active", options.active);
  const serviceName = toTrimmedString(options?.serviceName ?? null, 120);
  if (serviceName) query = query.eq("service_name", serviceName);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertInfraSloPolicyByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    serviceName: string;
    sliName: string;
    windowDays?: number | null;
    targetPercent: number;
    warningThresholdPercent: number;
    criticalThresholdPercent: number;
    active?: boolean;
    metadata?: Record<string, unknown>;
  },
) => {
  const serviceName = toTrimmedString(params.serviceName, 120);
  if (!serviceName) throw new Error("serviceName is required");
  const sliName = toTrimmedString(params.sliName, 120);
  if (!sliName) throw new Error("sliName is required");
  const windowDays = Number(params.windowDays ?? 30);
  if (!Number.isFinite(windowDays) || windowDays <= 0) throw new Error("windowDays must be a positive number");
  const targetPercent = Number(params.targetPercent);
  const warningThresholdPercent = Number(params.warningThresholdPercent);
  const criticalThresholdPercent = Number(params.criticalThresholdPercent);
  const thresholds = [targetPercent, warningThresholdPercent, criticalThresholdPercent];
  if (thresholds.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error("target/threshold percentages must be between 0 and 100");
  }

  const { data, error } = await client
    .from("infra_slo_policies")
    .upsert({
      service_name: serviceName,
      sli_name: sliName,
      window_days: Math.round(windowDays),
      target_percent: targetPercent,
      warning_threshold_percent: warningThresholdPercent,
      critical_threshold_percent: criticalThresholdPercent,
      active: params.active !== false,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "service_name,sli_name,window_days" })
    .select("id, service_name, sli_name, window_days, target_percent, warning_threshold_percent, critical_threshold_percent, active, metadata, updated_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert SLO policy");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "infra_slo_policy_upserted",
    entityType: "infra_slo_policies",
    entityId: data.id,
    details: { service_name: data.service_name, sli_name: data.sli_name, active: data.active },
  });
  return data;
};

const listInfraSloBreaches = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; severity?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("infra_slo_breaches")
    .select("id, policy_id, severity, status, observed_percent, breach_started_at, breach_resolved_at, acknowledged_by, notes, metadata, updated_at, created_at")
    .order("breach_started_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const severity = toTrimmedString(options?.severity ?? null, 30);
  if (severity) query = query.eq("severity", severity);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertInfraSloBreachByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    id?: string | null;
    policyId: string;
    severity: string;
    status?: string | null;
    observedPercent: number;
    breachStartedAt?: string | null;
    breachResolvedAt?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  assertUuid(params.policyId, "policyId");
  if (params.id) assertUuid(params.id, "id");
  const severity = toTrimmedString(params.severity, 30);
  if (!severity || !INFRA_SLO_BREACH_ALLOWED_SEVERITIES.has(severity)) {
    throw new Error("severity must be one of: warning, critical");
  }
  const status = toTrimmedString(params.status ?? null, 30) ?? "open";
  if (!INFRA_SLO_BREACH_ALLOWED_STATUSES.has(status)) {
    throw new Error("status must be one of: open, acknowledged, resolved");
  }
  const observedPercent = Number(params.observedPercent);
  if (!Number.isFinite(observedPercent) || observedPercent < 0 || observedPercent > 100) {
    throw new Error("observedPercent must be between 0 and 100");
  }
  const startedAtRaw = toTrimmedString(params.breachStartedAt ?? null, 80);
  const resolvedAtRaw = toTrimmedString(params.breachResolvedAt ?? null, 80);
  const startedAt = startedAtRaw ? new Date(startedAtRaw).toISOString() : new Date().toISOString();
  const resolvedAt = resolvedAtRaw ? new Date(resolvedAtRaw).toISOString() : (status === "resolved" ? new Date().toISOString() : null);
  const acknowledgedBy = status === "acknowledged" ? adminUserId : null;

  const patch = {
    id: params.id ?? undefined,
    policy_id: params.policyId,
    severity,
    status,
    observed_percent: observedPercent,
    breach_started_at: startedAt,
    breach_resolved_at: resolvedAt,
    acknowledged_by: acknowledgedBy,
    notes: toTrimmedString(params.notes ?? null, 3000),
    metadata: params.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("infra_slo_breaches")
    .upsert(patch)
    .select("id, policy_id, severity, status, observed_percent, breach_started_at, breach_resolved_at, acknowledged_by, notes, metadata, updated_at, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert SLO breach");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "infra_slo_breach_upserted",
    entityType: "infra_slo_breaches",
    entityId: data.id,
    details: { policy_id: data.policy_id, severity: data.severity, status: data.status },
  });
  return data;
};

const collectInfraDevopsReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const releaseFreshCutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const drillFreshCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const [runbooksResult, activeRunbooksResult, productionReleasesResult, recentProductionReleaseResult, monitoringResult, activeSloPoliciesResult, openBreachesResult, recentSucceededDrillsResult] = await Promise.all([
    client.from("infra_runbooks").select("id", { count: "exact", head: true }),
    client.from("infra_runbooks").select("id", { count: "exact", head: true }).eq("status", "active"),
    client.from("infra_release_registry").select("id", { count: "exact", head: true }).eq("environment", "production").eq("status", "deployed"),
    client.from("infra_release_registry").select("id", { count: "exact", head: true }).eq("environment", "production").eq("status", "deployed").gte("deployed_at", releaseFreshCutoff),
    client.from("infra_monitoring_integrations").select("id, integration_type, status"),
    client.from("infra_slo_policies").select("id", { count: "exact", head: true }).eq("active", true),
    client.from("infra_slo_breaches").select("id, severity, status").in("status", ["open", "acknowledged"]),
    client.from("infra_backup_restore_drills").select("id", { count: "exact", head: true }).eq("status", "succeeded").gte("started_at", drillFreshCutoff),
  ]);
  if (runbooksResult.error) throw runbooksResult.error;
  if (activeRunbooksResult.error) throw activeRunbooksResult.error;
  if (productionReleasesResult.error) throw productionReleasesResult.error;
  if (recentProductionReleaseResult.error) throw recentProductionReleaseResult.error;
  if (monitoringResult.error) throw monitoringResult.error;
  if (activeSloPoliciesResult.error) throw activeSloPoliciesResult.error;
  if (openBreachesResult.error) throw openBreachesResult.error;
  if (recentSucceededDrillsResult.error) throw recentSucceededDrillsResult.error;

  const monitoringRows = monitoringResult.data ?? [];
  const requiredMonitoringTypes = ["uptime", "error_tracking", "logging", "alerting"];
  const missingMonitoringTypes = requiredMonitoringTypes.filter((type) =>
    !monitoringRows.some((row) => row.integration_type === type && row.status !== "disabled")
  );
  const degradedOrFailedMonitoring = monitoringRows.filter((row) => row.status === "degraded" || row.status === "failed").length;

  const openBreaches = openBreachesResult.data ?? [];
  const openCriticalBreaches = openBreaches.filter((row) => row.severity === "critical").length;
  const openWarningBreaches = openBreaches.filter((row) => row.severity === "warning").length;

  const runbooksActive = Number(activeRunbooksResult.count ?? 0);
  const productionReleases = Number(productionReleasesResult.count ?? 0);
  const recentProductionReleases = Number(recentProductionReleaseResult.count ?? 0);
  const recentSucceededDrills = Number(recentSucceededDrillsResult.count ?? 0);
  const activeSloPolicies = Number(activeSloPoliciesResult.count ?? 0);

  return {
    summary: {
      critical:
        (runbooksActive === 0 ? 1 : 0) +
        (productionReleases === 0 ? 1 : 0) +
        openCriticalBreaches,
      high:
        missingMonitoringTypes.length +
        degradedOrFailedMonitoring +
        (recentSucceededDrills === 0 ? 1 : 0) +
        (recentProductionReleases === 0 ? 1 : 0),
      medium:
        openWarningBreaches +
        (activeSloPolicies === 0 ? 1 : 0),
    },
    metrics: {
      runbooks_total: Number(runbooksResult.count ?? 0),
      runbooks_active: runbooksActive,
      production_releases_total: productionReleases,
      production_releases_recent_45d: recentProductionReleases,
      backup_restore_drills_succeeded_90d: recentSucceededDrills,
      monitoring_integrations_total: monitoringRows.length,
      monitoring_integrations_missing_types: missingMonitoringTypes,
      monitoring_integrations_degraded_or_failed: degradedOrFailedMonitoring,
      slo_policies_active: activeSloPolicies,
      slo_breaches_open_critical: openCriticalBreaches,
      slo_breaches_open_warning: openWarningBreaches,
    },
    overall: {
      pass:
        runbooksActive > 0 &&
        productionReleases > 0 &&
        recentSucceededDrills > 0 &&
        missingMonitoringTypes.length === 0 &&
        degradedOrFailedMonitoring === 0 &&
        openCriticalBreaches === 0,
    },
  };
};

const POSTLAUNCH_RISK_ALERT_TYPES = new Set(["churn_risk", "workflow_failure_spike", "sla_breach_spike", "payment_risk", "compliance_risk"]);
const POSTLAUNCH_ALERT_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const POSTLAUNCH_ALERT_STATUSES = new Set(["open", "acknowledged", "resolved", "dismissed"]);
const POSTLAUNCH_HOTFIX_STATUSES = new Set(["planned", "deployed", "rolled_back", "failed"]);

const listPostlaunchKpiSnapshots = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; offset?: number; fromDate?: string | null; toDate?: string | null },
) => {
  const limit = Math.max(1, Math.min(365, Number(options?.limit ?? 90)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("postlaunch_kpi_snapshots")
    .select("id, snapshot_date, activation_count, draft_success_count, draft_failure_count, active_companies_count, active_ca_users_count, churn_risk_companies_count, metadata, created_by, created_at, updated_at")
    .order("snapshot_date", { ascending: false })
    .range(offset, offset + limit - 1);
  const fromDate = toTrimmedString(options?.fromDate ?? null, 20);
  if (fromDate) query = query.gte("snapshot_date", fromDate);
  const toDate = toTrimmedString(options?.toDate ?? null, 20);
  if (toDate) query = query.lte("snapshot_date", toDate);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertPostlaunchKpiSnapshotByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    snapshotDate: string;
    activationCount: number;
    draftSuccessCount: number;
    draftFailureCount: number;
    activeCompaniesCount: number;
    activeCaUsersCount: number;
    churnRiskCompaniesCount: number;
    metadata?: Record<string, unknown>;
  },
) => {
  const snapshotDate = toTrimmedString(params.snapshotDate, 20);
  if (!snapshotDate) throw new Error("snapshotDate is required");
  const parseCount = (value: number, key: string) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error(`${key} must be a non-negative number`);
    return Math.trunc(number);
  };
  const activationCount = parseCount(params.activationCount, "activationCount");
  const draftSuccessCount = parseCount(params.draftSuccessCount, "draftSuccessCount");
  const draftFailureCount = parseCount(params.draftFailureCount, "draftFailureCount");
  const activeCompaniesCount = parseCount(params.activeCompaniesCount, "activeCompaniesCount");
  const activeCaUsersCount = parseCount(params.activeCaUsersCount, "activeCaUsersCount");
  const churnRiskCompaniesCount = parseCount(params.churnRiskCompaniesCount, "churnRiskCompaniesCount");

  const { data, error } = await client
    .from("postlaunch_kpi_snapshots")
    .upsert({
      snapshot_date: snapshotDate,
      activation_count: activationCount,
      draft_success_count: draftSuccessCount,
      draft_failure_count: draftFailureCount,
      active_companies_count: activeCompaniesCount,
      active_ca_users_count: activeCaUsersCount,
      churn_risk_companies_count: churnRiskCompaniesCount,
      metadata: params.metadata ?? {},
      created_by: adminUserId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "snapshot_date" })
    .select("id, snapshot_date, activation_count, draft_success_count, draft_failure_count, active_companies_count, active_ca_users_count, churn_risk_companies_count, metadata, created_by, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert KPI snapshot");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "postlaunch_kpi_snapshot_upserted",
    entityType: "postlaunch_kpi_snapshots",
    entityId: data.id,
    details: { snapshot_date: data.snapshot_date },
  });
  return data;
};

const listPostlaunchRiskAlerts = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; severity?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(250, Number(options?.limit ?? 100)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("postlaunch_risk_alerts")
    .select("id, company_id, alert_type, severity, status, title, detail, owner_user_id, acknowledged_by, acknowledged_at, resolved_by, resolved_at, metadata, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const severity = toTrimmedString(options?.severity ?? null, 30);
  if (severity) query = query.eq("severity", severity);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertPostlaunchRiskAlertByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    id?: string | null;
    companyId?: string | null;
    alertType: string;
    severity: string;
    status?: string | null;
    title: string;
    detail?: string | null;
    ownerUserId?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  if (params.id) assertUuid(params.id, "id");
  if (params.companyId) assertUuid(params.companyId, "companyId");
  if (params.ownerUserId) assertUuid(params.ownerUserId, "ownerUserId");
  const alertType = toTrimmedString(params.alertType, 60);
  if (!alertType || !POSTLAUNCH_RISK_ALERT_TYPES.has(alertType)) {
    throw new Error("alertType must be one of: churn_risk, workflow_failure_spike, sla_breach_spike, payment_risk, compliance_risk");
  }
  const severity = toTrimmedString(params.severity, 20);
  if (!severity || !POSTLAUNCH_ALERT_SEVERITIES.has(severity)) {
    throw new Error("severity must be one of: low, medium, high, critical");
  }
  const status = toTrimmedString(params.status ?? null, 20) ?? "open";
  if (!PERFORMANCE_ALERT_STATUSES.has(status)) {
    throw new Error("status must be one of: open, acknowledged, resolved, dismissed");
  }
  const title = toTrimmedString(params.title, 240);
  if (!title) throw new Error("title is required");
  const nowIso = new Date().toISOString();
  const acknowledged = status === "acknowledged";
  const resolved = status === "resolved" || status === "dismissed";

  const { data, error } = await client
    .from("postlaunch_risk_alerts")
    .upsert({
      id: params.id ?? undefined,
      company_id: params.companyId ?? null,
      alert_type: alertType,
      severity,
      status,
      title,
      detail: toTrimmedString(params.detail ?? null, 6000),
      owner_user_id: params.ownerUserId ?? null,
      acknowledged_by: acknowledged ? adminUserId : null,
      acknowledged_at: acknowledged ? nowIso : null,
      resolved_by: resolved ? adminUserId : null,
      resolved_at: resolved ? nowIso : null,
      metadata: params.metadata ?? {},
      updated_at: nowIso,
    })
    .select("id, company_id, alert_type, severity, status, title, detail, owner_user_id, acknowledged_by, acknowledged_at, resolved_by, resolved_at, metadata, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert risk alert");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    companyId: data.company_id ?? null,
    activityType: "postlaunch_risk_alert_upserted",
    entityType: "postlaunch_risk_alerts",
    entityId: data.id,
    details: { alert_type: data.alert_type, severity: data.severity, status: data.status },
  });
  return data;
};

const listPostlaunchModelQualityReviews = async (
  client: ReturnType<typeof createClient>,
  options?: { limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(120, Number(options?.limit ?? 40)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  const { data, error } = await client
    .from("postlaunch_model_quality_reviews")
    .select("id, review_window_start, review_window_end, sample_size, hallucination_rate_percent, citation_coverage_percent, legal_risk_incidents, quality_score, reviewer_user_id, summary, actions, metadata, created_at, updated_at")
    .order("review_window_end", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
};

const createPostlaunchModelQualityReviewByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    reviewWindowStart: string;
    reviewWindowEnd: string;
    sampleSize: number;
    hallucinationRatePercent: number;
    citationCoveragePercent: number;
    legalRiskIncidents: number;
    qualityScore: number;
    summary?: string | null;
    actions?: unknown;
    metadata?: Record<string, unknown>;
  },
) => {
  const reviewWindowStart = toTrimmedString(params.reviewWindowStart, 20);
  const reviewWindowEnd = toTrimmedString(params.reviewWindowEnd, 20);
  if (!reviewWindowStart || !reviewWindowEnd) throw new Error("reviewWindowStart and reviewWindowEnd are required");
  const sampleSize = Number(params.sampleSize);
  const legalRiskIncidents = Number(params.legalRiskIncidents ?? 0);
  const hallucinationRatePercent = Number(params.hallucinationRatePercent);
  const citationCoveragePercent = Number(params.citationCoveragePercent);
  const qualityScore = Number(params.qualityScore);
  if (!Number.isFinite(sampleSize) || sampleSize <= 0) throw new Error("sampleSize must be a positive number");
  if (!Number.isFinite(legalRiskIncidents) || legalRiskIncidents < 0) throw new Error("legalRiskIncidents must be a non-negative number");
  const bounded = [hallucinationRatePercent, citationCoveragePercent, qualityScore];
  if (bounded.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error("quality percentages must be between 0 and 100");
  }
  const actions = Array.isArray(params.actions) ? params.actions : [];

  const { data, error } = await client
    .from("postlaunch_model_quality_reviews")
    .insert({
      review_window_start: reviewWindowStart,
      review_window_end: reviewWindowEnd,
      sample_size: Math.trunc(sampleSize),
      hallucination_rate_percent: hallucinationRatePercent,
      citation_coverage_percent: citationCoveragePercent,
      legal_risk_incidents: Math.trunc(legalRiskIncidents),
      quality_score: qualityScore,
      reviewer_user_id: adminUserId,
      summary: toTrimmedString(params.summary ?? null, 8000),
      actions,
      metadata: params.metadata ?? {},
    })
    .select("id, review_window_start, review_window_end, sample_size, hallucination_rate_percent, citation_coverage_percent, legal_risk_incidents, quality_score, reviewer_user_id, summary, actions, metadata, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create model quality review");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "postlaunch_model_quality_review_created",
    entityType: "postlaunch_model_quality_reviews",
    entityId: data.id,
    details: { review_window_start: data.review_window_start, review_window_end: data.review_window_end, quality_score: data.quality_score },
  });
  return data;
};

const listPostlaunchHotfixReleases = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("postlaunch_hotfix_releases")
    .select("id, release_tag, commit_sha, scope, trigger_reason, status, rollback_available, rollback_executed, rollback_notes, deployed_by, deployed_at, metadata, created_at, updated_at")
    .order("deployed_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertPostlaunchHotfixReleaseByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    releaseTag: string;
    commitSha?: string | null;
    scope?: string | null;
    triggerReason: string;
    status: string;
    rollbackAvailable?: boolean;
    rollbackExecuted?: boolean;
    rollbackNotes?: string | null;
    deployedAt?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const releaseTag = toTrimmedString(params.releaseTag, 120);
  if (!releaseTag) throw new Error("releaseTag is required");
  const triggerReason = toTrimmedString(params.triggerReason, 400);
  if (!triggerReason) throw new Error("triggerReason is required");
  const status = toTrimmedString(params.status, 30);
  if (!status || !POSTLAUNCH_HOTFIX_STATUSES.has(status)) {
    throw new Error("status must be one of: planned, deployed, rolled_back, failed");
  }
  const deployedAtRaw = toTrimmedString(params.deployedAt ?? null, 80);
  const deployedAt = deployedAtRaw ? new Date(deployedAtRaw).toISOString() : new Date().toISOString();

  const { data, error } = await client
    .from("postlaunch_hotfix_releases")
    .upsert({
      release_tag: releaseTag,
      commit_sha: toTrimmedString(params.commitSha ?? null, 120),
      scope: toTrimmedString(params.scope ?? null, 160) ?? "workspace-backend",
      trigger_reason: triggerReason,
      status,
      rollback_available: params.rollbackAvailable !== false,
      rollback_executed: params.rollbackExecuted === true,
      rollback_notes: toTrimmedString(params.rollbackNotes ?? null, 3000),
      deployed_by: adminUserId,
      deployed_at: deployedAt,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "release_tag" })
    .select("id, release_tag, commit_sha, scope, trigger_reason, status, rollback_available, rollback_executed, rollback_notes, deployed_by, deployed_at, metadata, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert hotfix release");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "postlaunch_hotfix_release_upserted",
    entityType: "postlaunch_hotfix_releases",
    entityId: data.id,
    details: { release_tag: data.release_tag, status: data.status, rollback_executed: data.rollback_executed },
  });
  return data;
};

const collectPostlaunchReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const snapshotCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const qualityCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const hotfixCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [recentSnapshotsResult, openAlertsResult, recentQualityResult, recentHotfixResult] = await Promise.all([
    client.from("postlaunch_kpi_snapshots").select("id", { count: "exact", head: true }).gte("snapshot_date", snapshotCutoff),
    client.from("postlaunch_risk_alerts").select("id, severity, status").in("status", ["open", "acknowledged"]),
    client.from("postlaunch_model_quality_reviews").select("id", { count: "exact", head: true }).gte("review_window_end", qualityCutoff),
    client.from("postlaunch_hotfix_releases").select("id, status, rollback_executed").gte("deployed_at", hotfixCutoff),
  ]);
  if (recentSnapshotsResult.error) throw recentSnapshotsResult.error;
  if (openAlertsResult.error) throw openAlertsResult.error;
  if (recentQualityResult.error) throw recentQualityResult.error;
  if (recentHotfixResult.error) throw recentHotfixResult.error;

  const openAlerts = openAlertsResult.data ?? [];
  const criticalOpenAlerts = openAlerts.filter((row) => row.severity === "critical").length;
  const highOpenAlerts = openAlerts.filter((row) => row.severity === "high").length;
  const mediumOpenAlerts = openAlerts.filter((row) => row.severity === "medium").length;
  const recentHotfix = recentHotfixResult.data ?? [];
  const failedHotfix = recentHotfix.filter((row) => row.status === "failed").length;
  const rollbackExecutedCount = recentHotfix.filter((row) => row.rollback_executed === true).length;
  const recentSnapshots = Number(recentSnapshotsResult.count ?? 0);
  const recentQuality = Number(recentQualityResult.count ?? 0);

  return {
    summary: {
      critical: criticalOpenAlerts,
      high: highOpenAlerts + failedHotfix + (recentSnapshots === 0 ? 1 : 0),
      medium: mediumOpenAlerts + (recentQuality === 0 ? 1 : 0),
    },
    metrics: {
      kpi_snapshots_last_7d: recentSnapshots,
      open_alerts_critical: criticalOpenAlerts,
      open_alerts_high: highOpenAlerts,
      open_alerts_medium: mediumOpenAlerts,
      model_quality_reviews_last_14d: recentQuality,
      hotfix_releases_last_30d: recentHotfix.length,
      hotfix_failed_last_30d: failedHotfix,
      hotfix_rollbacks_last_30d: rollbackExecutedCount,
    },
    overall: {
      pass: criticalOpenAlerts === 0 && failedHotfix === 0 && recentSnapshots > 0,
    },
  };
};

const PERFORMANCE_SYNTHETIC_CHECK_TYPES = new Set(["landing", "auth", "company_dashboard", "ca_dashboard", "legal_dashboard", "api_health"]);
const PERFORMANCE_CHECK_STATUSES = new Set(["pass", "warn", "fail"]);
const PERFORMANCE_BUDGET_COMPARATORS = new Set(["lte", "gte"]);
const PERFORMANCE_ALERT_SEVERITIES = new Set(["medium", "high", "critical"]);
const PERFORMANCE_ALERT_STATUSES = new Set(["open", "acknowledged", "resolved", "dismissed"]);

const listPerformanceClientMetrics = async (
  client: ReturnType<typeof createClient>,
  options?: { route?: string | null; limit?: number; offset?: number; fromDate?: string | null; toDate?: string | null },
) => {
  const limit = Math.max(1, Math.min(365, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("performance_client_metrics")
    .select("id, metric_date, route, role_scope, source, p95_ttfb_ms, p95_lcp_ms, p95_cls, error_rate_percent, bundle_kb_main, js_chunk_count, metadata, created_by, created_at, updated_at")
    .order("metric_date", { ascending: false })
    .range(offset, offset + limit - 1);
  const route = toTrimmedString(options?.route ?? null, 220);
  if (route) query = query.eq("route", route);
  const fromDate = toTrimmedString(options?.fromDate ?? null, 20);
  if (fromDate) query = query.gte("metric_date", fromDate);
  const toDate = toTrimmedString(options?.toDate ?? null, 20);
  if (toDate) query = query.lte("metric_date", toDate);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertPerformanceClientMetricByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    metricDate: string;
    route: string;
    roleScope?: string | null;
    source?: string | null;
    p95TtfbMs?: number | null;
    p95LcpMs?: number | null;
    p95Cls?: number | null;
    errorRatePercent?: number | null;
    bundleKbMain?: number | null;
    jsChunkCount?: number | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const metricDate = toTrimmedString(params.metricDate, 20);
  if (!metricDate) throw new Error("metricDate is required");
  const route = toTrimmedString(params.route, 220);
  if (!route) throw new Error("route is required");
  const roleScope = toTrimmedString(params.roleScope ?? null, 80) ?? "all";
  const source = toTrimmedString(params.source ?? null, 80) ?? "manual";

  const parseOptionalNonNegativeNumber = (value: number | null | undefined, key: string) => {
    if (typeof value === "undefined" || value === null) return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error(`${key} must be a non-negative number`);
    return number;
  };

  const p95TtfbMs = parseOptionalNonNegativeNumber(params.p95TtfbMs, "p95TtfbMs");
  const p95LcpMs = parseOptionalNonNegativeNumber(params.p95LcpMs, "p95LcpMs");
  const p95Cls = parseOptionalNonNegativeNumber(params.p95Cls, "p95Cls");
  const errorRatePercent = parseOptionalNonNegativeNumber(params.errorRatePercent, "errorRatePercent");
  if (errorRatePercent !== null && errorRatePercent > 100) {
    throw new Error("errorRatePercent must be between 0 and 100");
  }
  const bundleKbMain = parseOptionalNonNegativeNumber(params.bundleKbMain, "bundleKbMain");
  const jsChunkCount = parseOptionalNonNegativeNumber(params.jsChunkCount, "jsChunkCount");

  const { data, error } = await client
    .from("performance_client_metrics")
    .upsert({
      metric_date: metricDate,
      route,
      role_scope: roleScope,
      source,
      p95_ttfb_ms: p95TtfbMs === null ? null : Math.trunc(p95TtfbMs),
      p95_lcp_ms: p95LcpMs === null ? null : Math.trunc(p95LcpMs),
      p95_cls: p95Cls,
      error_rate_percent: errorRatePercent,
      bundle_kb_main: bundleKbMain === null ? null : Math.trunc(bundleKbMain),
      js_chunk_count: jsChunkCount === null ? null : Math.trunc(jsChunkCount),
      metadata: params.metadata ?? {},
      created_by: adminUserId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "metric_date,route,role_scope,source" })
    .select("id, metric_date, route, role_scope, source, p95_ttfb_ms, p95_lcp_ms, p95_cls, error_rate_percent, bundle_kb_main, js_chunk_count, metadata, created_by, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert performance metric");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "performance_client_metric_upserted",
    entityType: "performance_client_metrics",
    entityId: data.id,
    details: { metric_date: data.metric_date, route: data.route, source: data.source },
  });
  return data;
};

const listPerformanceSyntheticChecks = async (
  client: ReturnType<typeof createClient>,
  options?: { checkType?: string | null; status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(500, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("performance_synthetic_checks")
    .select("id, check_type, target, status, latency_ms, status_code, checked_at, details, metadata, created_by, created_at, updated_at")
    .order("checked_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const checkType = toTrimmedString(options?.checkType ?? null, 80);
  if (checkType) query = query.eq("check_type", checkType);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const createPerformanceSyntheticCheckByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    checkType: string;
    target: string;
    status: string;
    latencyMs?: number | null;
    statusCode?: number | null;
    checkedAt?: string | null;
    details?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const checkType = toTrimmedString(params.checkType, 80);
  if (!checkType || !PERFORMANCE_SYNTHETIC_CHECK_TYPES.has(checkType)) {
    throw new Error("checkType must be one of: landing, auth, company_dashboard, ca_dashboard, legal_dashboard, api_health");
  }
  const target = toTrimmedString(params.target, 220);
  if (!target) throw new Error("target is required");
  const status = toTrimmedString(params.status, 30);
  if (!status || !PERFORMANCE_CHECK_STATUSES.has(status)) {
    throw new Error("status must be one of: pass, warn, fail");
  }
  const latencyMs = typeof params.latencyMs === "undefined" || params.latencyMs === null ? null : Number(params.latencyMs);
  if (latencyMs !== null && (!Number.isFinite(latencyMs) || latencyMs < 0)) {
    throw new Error("latencyMs must be a non-negative number");
  }
  const statusCode = typeof params.statusCode === "undefined" || params.statusCode === null ? null : Number(params.statusCode);
  if (statusCode !== null && (!Number.isFinite(statusCode) || statusCode < 100)) {
    throw new Error("statusCode must be a valid HTTP status code");
  }
  const checkedAtRaw = toTrimmedString(params.checkedAt ?? null, 80);
  const checkedAt = checkedAtRaw ? new Date(checkedAtRaw).toISOString() : new Date().toISOString();

  const { data, error } = await client
    .from("performance_synthetic_checks")
    .insert({
      check_type: checkType,
      target,
      status,
      latency_ms: latencyMs === null ? null : Math.trunc(latencyMs),
      status_code: statusCode === null ? null : Math.trunc(statusCode),
      checked_at: checkedAt,
      details: toTrimmedString(params.details ?? null, 6000),
      metadata: params.metadata ?? {},
      created_by: adminUserId,
    })
    .select("id, check_type, target, status, latency_ms, status_code, checked_at, details, metadata, created_by, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create synthetic check");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "performance_synthetic_check_created",
    entityType: "performance_synthetic_checks",
    entityId: data.id,
    details: { check_type: data.check_type, status: data.status, target: data.target },
  });
  return data;
};

const listPerformanceBudgetPolicies = async (
  client: ReturnType<typeof createClient>,
  options?: { active?: boolean | null; metricName?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("performance_budget_policies")
    .select("id, budget_key, metric_name, threshold_warn, threshold_fail, comparator, active, metadata, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (typeof options?.active === "boolean") query = query.eq("active", options.active);
  const metricName = toTrimmedString(options?.metricName ?? null, 80);
  if (metricName) query = query.eq("metric_name", metricName);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertPerformanceBudgetPolicyByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    budgetKey: string;
    metricName: string;
    thresholdWarn: number;
    thresholdFail: number;
    comparator?: string | null;
    active?: boolean;
    metadata?: Record<string, unknown>;
  },
) => {
  const budgetKey = toTrimmedString(params.budgetKey, 120);
  if (!budgetKey) throw new Error("budgetKey is required");
  if (!/^[a-z0-9_]+$/.test(budgetKey)) throw new Error("budgetKey must be snake_case");
  const metricName = toTrimmedString(params.metricName, 80);
  if (!metricName) throw new Error("metricName is required");
  const thresholdWarn = Number(params.thresholdWarn);
  const thresholdFail = Number(params.thresholdFail);
  if (!Number.isFinite(thresholdWarn) || !Number.isFinite(thresholdFail)) {
    throw new Error("thresholdWarn and thresholdFail must be numbers");
  }
  const comparator = toTrimmedString(params.comparator ?? null, 20) ?? "lte";
  if (!PERFORMANCE_BUDGET_COMPARATORS.has(comparator)) {
    throw new Error("comparator must be one of: lte, gte");
  }

  const { data, error } = await client
    .from("performance_budget_policies")
    .upsert({
      budget_key: budgetKey,
      metric_name: metricName,
      threshold_warn: thresholdWarn,
      threshold_fail: thresholdFail,
      comparator,
      active: params.active !== false,
      metadata: params.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "budget_key" })
    .select("id, budget_key, metric_name, threshold_warn, threshold_fail, comparator, active, metadata, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert performance budget policy");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "performance_budget_policy_upserted",
    entityType: "performance_budget_policies",
    entityId: data.id,
    details: { budget_key: data.budget_key, metric_name: data.metric_name, active: data.active },
  });
  return data;
};

const listPerformanceAlertEvents = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; severity?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(300, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("performance_alert_events")
    .select("id, metric_name, severity, status, title, detail, triggered_value, budget_policy_id, acknowledged_by, acknowledged_at, resolved_by, resolved_at, metadata, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const severity = toTrimmedString(options?.severity ?? null, 30);
  if (severity) query = query.eq("severity", severity);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertPerformanceAlertEventByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    id?: string | null;
    metricName: string;
    severity: string;
    status?: string | null;
    title: string;
    detail?: string | null;
    triggeredValue?: number | null;
    budgetPolicyId?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  if (params.id) assertUuid(params.id, "id");
  if (params.budgetPolicyId) assertUuid(params.budgetPolicyId, "budgetPolicyId");
  const metricName = toTrimmedString(params.metricName, 80);
  if (!metricName) throw new Error("metricName is required");
  const severity = toTrimmedString(params.severity, 20);
  if (!severity || !PERFORMANCE_ALERT_SEVERITIES.has(severity)) {
    throw new Error("severity must be one of: medium, high, critical");
  }
  const status = toTrimmedString(params.status ?? null, 20) ?? "open";
  if (!POSTLAUNCH_ALERT_STATUSES.has(status)) {
    throw new Error("status must be one of: open, acknowledged, resolved, dismissed");
  }
  const title = toTrimmedString(params.title, 240);
  if (!title) throw new Error("title is required");
  const triggeredValue = typeof params.triggeredValue === "undefined" || params.triggeredValue === null ? null : Number(params.triggeredValue);
  if (triggeredValue !== null && !Number.isFinite(triggeredValue)) throw new Error("triggeredValue must be a number");
  const nowIso = new Date().toISOString();
  const acknowledged = status === "acknowledged";
  const resolved = status === "resolved" || status === "dismissed";

  const { data, error } = await client
    .from("performance_alert_events")
    .upsert({
      id: params.id ?? undefined,
      metric_name: metricName,
      severity,
      status,
      title,
      detail: toTrimmedString(params.detail ?? null, 6000),
      triggered_value: triggeredValue,
      budget_policy_id: params.budgetPolicyId ?? null,
      acknowledged_by: acknowledged ? adminUserId : null,
      acknowledged_at: acknowledged ? nowIso : null,
      resolved_by: resolved ? adminUserId : null,
      resolved_at: resolved ? nowIso : null,
      metadata: params.metadata ?? {},
      updated_at: nowIso,
    })
    .select("id, metric_name, severity, status, title, detail, triggered_value, budget_policy_id, acknowledged_by, acknowledged_at, resolved_by, resolved_at, metadata, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert performance alert");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "performance_alert_event_upserted",
    entityType: "performance_alert_events",
    entityId: data.id,
    details: { metric_name: data.metric_name, severity: data.severity, status: data.status },
  });
  return data;
};

const collectPerformanceReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const now = Date.now();
  const metricsCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const syntheticCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const monitorCheckCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [clientMetricsResult, syntheticResult, budgetsResult, alertsResult, monitorResult] = await Promise.all([
    client.from("performance_client_metrics").select("id, metric_date, p95_ttfb_ms, p95_lcp_ms, p95_cls, error_rate_percent, bundle_kb_main").gte("metric_date", metricsCutoff),
    client.from("performance_synthetic_checks").select("id, check_type, status, checked_at").gte("checked_at", syntheticCutoff),
    client.from("performance_budget_policies").select("id, budget_key, metric_name, threshold_warn, threshold_fail, comparator, active").eq("active", true),
    client.from("performance_alert_events").select("id, severity, status").in("status", ["open", "acknowledged"]),
    client.from("infra_monitoring_integrations").select("id, integration_type, status, last_check_at"),
  ]);
  if (clientMetricsResult.error) throw clientMetricsResult.error;
  if (syntheticResult.error) throw syntheticResult.error;
  if (budgetsResult.error) throw budgetsResult.error;
  if (alertsResult.error) throw alertsResult.error;
  if (monitorResult.error) throw monitorResult.error;

  const metricsRows = clientMetricsResult.data ?? [];
  const syntheticRows = syntheticResult.data ?? [];
  const budgetRows = budgetsResult.data ?? [];
  const alertRows = alertsResult.data ?? [];
  const monitorRows = monitorResult.data ?? [];

  const requiredChecks = ["landing", "auth", "company_dashboard", "api_health"];
  const missingChecks = requiredChecks.filter((checkType) => !syntheticRows.some((row) => row.check_type === checkType));
  const syntheticFailCount = syntheticRows.filter((row) => row.status === "fail").length;
  const syntheticWarnCount = syntheticRows.filter((row) => row.status === "warn").length;

  const alertCriticalOpen = alertRows.filter((row) => row.severity === "critical").length;
  const alertHighOpen = alertRows.filter((row) => row.severity === "high").length;
  const alertMediumOpen = alertRows.filter((row) => row.severity === "medium").length;

  const monitoringIssues = monitorRows.filter((row) => row.status === "failed" || row.status === "degraded").length;
  const staleMonitoringChecks = monitorRows.filter((row) => {
    if (typeof row.last_check_at !== "string" || !row.last_check_at) return true;
    const checkAt = Date.parse(row.last_check_at);
    if (Number.isNaN(checkAt)) return true;
    return checkAt < Date.parse(monitorCheckCutoff);
  }).length;

  const latestMetricByRoute = new Map<string, Record<string, unknown>>();
  for (const row of metricsRows) {
    const key = `${row.route}`;
    const existing = latestMetricByRoute.get(key);
    const currentDate = Date.parse(String(row.metric_date));
    const existingDate = existing ? Date.parse(String(existing.metric_date)) : Number.NEGATIVE_INFINITY;
    if (!existing || currentDate >= existingDate) {
      latestMetricByRoute.set(key, row as unknown as Record<string, unknown>);
    }
  }

  const metricValueByName = (metric: Record<string, unknown>, metricName: string): number | null => {
    const value = metric[metricName];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return null;
  };

  let budgetWarnCount = 0;
  let budgetFailCount = 0;
  for (const budget of budgetRows) {
    const metricName = String(budget.metric_name ?? "");
    const comparator = String(budget.comparator ?? "lte");
    const warn = Number(budget.threshold_warn ?? 0);
    const fail = Number(budget.threshold_fail ?? 0);
    const routeValues = Array.from(latestMetricByRoute.values())
      .map((metric) => metricValueByName(metric, metricName))
      .filter((value): value is number => value !== null);
    if (routeValues.length === 0) continue;

    const worst = comparator === "gte" ? Math.min(...routeValues) : Math.max(...routeValues);
    const isFail = comparator === "gte" ? worst < fail : worst > fail;
    const isWarn = comparator === "gte" ? worst < warn : worst > warn;
    if (isFail) budgetFailCount += 1;
    else if (isWarn) budgetWarnCount += 1;
  }

  return {
    summary: {
      critical: syntheticFailCount + alertCriticalOpen + budgetFailCount,
      high: missingChecks.length + syntheticWarnCount + alertHighOpen + monitoringIssues + staleMonitoringChecks + (metricsRows.length === 0 ? 1 : 0),
      medium: alertMediumOpen + budgetWarnCount,
    },
    metrics: {
      client_metrics_last_7d: metricsRows.length,
      synthetic_checks_last_24h: syntheticRows.length,
      synthetic_checks_missing_core: missingChecks,
      synthetic_checks_fail: syntheticFailCount,
      synthetic_checks_warn: syntheticWarnCount,
      budgets_active: budgetRows.length,
      budgets_warn_breaches: budgetWarnCount,
      budgets_fail_breaches: budgetFailCount,
      alerts_open_critical: alertCriticalOpen,
      alerts_open_high: alertHighOpen,
      alerts_open_medium: alertMediumOpen,
      monitoring_integrations_problematic: monitoringIssues,
      monitoring_integrations_stale_check: staleMonitoringChecks,
    },
    overall: {
      pass:
        syntheticFailCount === 0 &&
        alertCriticalOpen === 0 &&
        budgetFailCount === 0 &&
        missingChecks.length === 0 &&
        monitoringIssues === 0 &&
        staleMonitoringChecks === 0,
    },
  };
};

const QA_RUN_ALLOWED_STATUS = new Set(["pass", "warn", "fail"]);
const QA_FAILURE_ALLOWED_SEVERITIES = new Set(["medium", "high", "critical"]);
const QA_FAILURE_ALLOWED_STATUSES = new Set(["open", "acknowledged", "resolved", "dismissed"]);
const QA_FAILURE_ALLOWED_SOURCES = new Set(["api_contract", "e2e_smoke", "manual", "production_incident"]);

const listQaApiContractRuns = async (
  client: ReturnType<typeof createClient>,
  options?: { environment?: string | null; status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(300, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("qa_api_contract_runs")
    .select("id, suite_name, environment, status, total_tests, passed_tests, failed_tests, run_duration_ms, details, executed_by, executed_at, created_at, updated_at")
    .order("executed_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const environment = toTrimmedString(options?.environment ?? null, 30);
  if (environment) query = query.eq("environment", environment);
  const status = toTrimmedString(options?.status ?? null, 20);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const createQaApiContractRunByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    suiteName: string;
    environment?: string | null;
    status: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    runDurationMs?: number | null;
    details?: Record<string, unknown>;
    executedAt?: string | null;
  },
) => {
  const suiteName = toTrimmedString(params.suiteName, 160);
  if (!suiteName) throw new Error("suiteName is required");
  const environment = toTrimmedString(params.environment ?? null, 20) ?? "production";
  const status = toTrimmedString(params.status, 20);
  if (!status || !QA_RUN_ALLOWED_STATUS.has(status)) throw new Error("status must be one of: pass, warn, fail");

  const parseCount = (value: number, key: string) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error(`${key} must be a non-negative number`);
    return Math.trunc(number);
  };
  const totalTests = parseCount(params.totalTests, "totalTests");
  const passedTests = parseCount(params.passedTests, "passedTests");
  const failedTests = parseCount(params.failedTests, "failedTests");
  const runDurationMs = typeof params.runDurationMs === "undefined" || params.runDurationMs === null ? null : parseCount(params.runDurationMs, "runDurationMs");
  const executedAtRaw = toTrimmedString(params.executedAt ?? null, 80);
  const executedAt = executedAtRaw ? new Date(executedAtRaw).toISOString() : new Date().toISOString();

  const { data, error } = await client
    .from("qa_api_contract_runs")
    .insert({
      suite_name: suiteName,
      environment,
      status,
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: failedTests,
      run_duration_ms: runDurationMs,
      details: params.details ?? {},
      executed_by: adminUserId,
      executed_at: executedAt,
    })
    .select("id, suite_name, environment, status, total_tests, passed_tests, failed_tests, run_duration_ms, details, executed_by, executed_at, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create QA API contract run");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "qa_api_contract_run_created",
    entityType: "qa_api_contract_runs",
    entityId: data.id,
    details: { suite_name: data.suite_name, status: data.status, environment: data.environment },
  });
  return data;
};

const listQaE2eSmokeRuns = async (
  client: ReturnType<typeof createClient>,
  options?: { roleScope?: string | null; status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(300, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("qa_e2e_smoke_runs")
    .select("id, flow_name, role_scope, status, evidence, error_summary, executed_by, executed_at, created_at, updated_at")
    .order("executed_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const roleScope = toTrimmedString(options?.roleScope ?? null, 80);
  if (roleScope) query = query.eq("role_scope", roleScope);
  const status = toTrimmedString(options?.status ?? null, 20);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const createQaE2eSmokeRunByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    flowName: string;
    roleScope?: string | null;
    status: string;
    evidence?: Record<string, unknown>;
    errorSummary?: string | null;
    executedAt?: string | null;
  },
) => {
  const flowName = toTrimmedString(params.flowName, 160);
  if (!flowName) throw new Error("flowName is required");
  const status = toTrimmedString(params.status, 20);
  if (!status || !QA_RUN_ALLOWED_STATUS.has(status)) throw new Error("status must be one of: pass, warn, fail");
  const roleScope = toTrimmedString(params.roleScope ?? null, 80) ?? "all";
  const executedAtRaw = toTrimmedString(params.executedAt ?? null, 80);
  const executedAt = executedAtRaw ? new Date(executedAtRaw).toISOString() : new Date().toISOString();

  const { data, error } = await client
    .from("qa_e2e_smoke_runs")
    .insert({
      flow_name: flowName,
      role_scope: roleScope,
      status,
      evidence: params.evidence ?? {},
      error_summary: toTrimmedString(params.errorSummary ?? null, 6000),
      executed_by: adminUserId,
      executed_at: executedAt,
    })
    .select("id, flow_name, role_scope, status, evidence, error_summary, executed_by, executed_at, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create QA E2E smoke run");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "qa_e2e_smoke_run_created",
    entityType: "qa_e2e_smoke_runs",
    entityId: data.id,
    details: { flow_name: data.flow_name, status: data.status, role_scope: data.role_scope },
  });
  return data;
};

const listQaFailures = async (
  client: ReturnType<typeof createClient>,
  options?: { status?: string | null; severity?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(300, Number(options?.limit ?? 120)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("qa_failure_registry")
    .select("id, source_type, source_run_id, severity, status, title, detail, owner_user_id, acknowledged_by, acknowledged_at, resolved_by, resolved_at, metadata, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const status = toTrimmedString(options?.status ?? null, 20);
  if (status) query = query.eq("status", status);
  const severity = toTrimmedString(options?.severity ?? null, 20);
  if (severity) query = query.eq("severity", severity);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const upsertQaFailureByAdmin = async (
  client: ReturnType<typeof createClient>,
  adminUserId: string,
  params: {
    id?: string | null;
    sourceType: string;
    sourceRunId?: string | null;
    severity: string;
    status?: string | null;
    title: string;
    detail?: string | null;
    ownerUserId?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  if (params.id) assertUuid(params.id, "id");
  if (params.sourceRunId) assertUuid(params.sourceRunId, "sourceRunId");
  if (params.ownerUserId) assertUuid(params.ownerUserId, "ownerUserId");

  const sourceType = toTrimmedString(params.sourceType, 40);
  if (!sourceType || !QA_FAILURE_ALLOWED_SOURCES.has(sourceType)) {
    throw new Error("sourceType must be one of: api_contract, e2e_smoke, manual, production_incident");
  }
  const severity = toTrimmedString(params.severity, 20);
  if (!severity || !QA_FAILURE_ALLOWED_SEVERITIES.has(severity)) {
    throw new Error("severity must be one of: medium, high, critical");
  }
  const status = toTrimmedString(params.status ?? null, 20) ?? "open";
  if (!QA_FAILURE_ALLOWED_STATUSES.has(status)) {
    throw new Error("status must be one of: open, acknowledged, resolved, dismissed");
  }
  const title = toTrimmedString(params.title, 240);
  if (!title) throw new Error("title is required");
  const nowIso = new Date().toISOString();
  const acknowledged = status === "acknowledged";
  const resolved = status === "resolved" || status === "dismissed";

  const { data, error } = await client
    .from("qa_failure_registry")
    .upsert({
      id: params.id ?? undefined,
      source_type: sourceType,
      source_run_id: params.sourceRunId ?? null,
      severity,
      status,
      title,
      detail: toTrimmedString(params.detail ?? null, 6000),
      owner_user_id: params.ownerUserId ?? null,
      acknowledged_by: acknowledged ? adminUserId : null,
      acknowledged_at: acknowledged ? nowIso : null,
      resolved_by: resolved ? adminUserId : null,
      resolved_at: resolved ? nowIso : null,
      metadata: params.metadata ?? {},
      updated_at: nowIso,
    })
    .select("id, source_type, source_run_id, severity, status, title, detail, owner_user_id, acknowledged_by, acknowledged_at, resolved_by, resolved_at, metadata, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to upsert QA failure");

  await createOpsActivityLog(client, {
    actorUserId: adminUserId,
    activityType: "qa_failure_upserted",
    entityType: "qa_failure_registry",
    entityId: data.id,
    details: { source_type: data.source_type, severity: data.severity, status: data.status },
  });
  return data;
};

const collectQaReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const apiCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const e2eCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const [apiRecentResult, e2eRecentResult, failuresResult] = await Promise.all([
    client.from("qa_api_contract_runs").select("id, status").gte("executed_at", apiCutoff),
    client.from("qa_e2e_smoke_runs").select("id, status").gte("executed_at", e2eCutoff),
    client.from("qa_failure_registry").select("id, severity, status").in("status", ["open", "acknowledged"]),
  ]);
  if (apiRecentResult.error) throw apiRecentResult.error;
  if (e2eRecentResult.error) throw e2eRecentResult.error;
  if (failuresResult.error) throw failuresResult.error;

  const apiRecent = apiRecentResult.data ?? [];
  const e2eRecent = e2eRecentResult.data ?? [];
  const failures = failuresResult.data ?? [];

  const apiFail = apiRecent.filter((row) => row.status === "fail").length;
  const e2eFail = e2eRecent.filter((row) => row.status === "fail").length;
  const failureCritical = failures.filter((row) => row.severity === "critical").length;
  const failureHigh = failures.filter((row) => row.severity === "high").length;
  const failureMedium = failures.filter((row) => row.severity === "medium").length;

  return {
    summary: {
      critical: failureCritical + apiFail + e2eFail,
      high: failureHigh + (apiRecent.length === 0 ? 1 : 0) + (e2eRecent.length === 0 ? 1 : 0),
      medium: failureMedium,
    },
    metrics: {
      api_contract_runs_last_72h: apiRecent.length,
      api_contract_runs_failed_last_72h: apiFail,
      e2e_smoke_runs_last_72h: e2eRecent.length,
      e2e_smoke_runs_failed_last_72h: e2eFail,
      qa_failures_open_critical: failureCritical,
      qa_failures_open_high: failureHigh,
      qa_failures_open_medium: failureMedium,
    },
    overall: {
      pass: failureCritical === 0 && apiFail === 0 && e2eFail === 0 && apiRecent.length > 0 && e2eRecent.length > 0,
    },
  };
};

const OPS_TICKET_ALLOWED_STATUSES = new Set(["open", "in_progress", "waiting_customer", "resolved", "closed"]);
const OPS_TICKET_ALLOWED_PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const OPS_TICKET_ALLOWED_CATEGORIES = new Set(["general", "billing", "kyc", "technical", "workflow", "dispute", "security"]);
const OPS_ASSIGNMENT_ALLOWED_STATUSES = new Set(["pending", "approved", "rejected", "cancelled"]);
const OPS_ASSIGNMENT_ALLOWED_TYPES = new Set(["external_ca", "in_house_ca", "in_house_lawyer", "ca_firm"]);

const createOpsActivityLog = async (
  client: ReturnType<typeof createClient>,
  params: {
    actorUserId: string;
    companyId?: string | null;
    caFirmId?: string | null;
    activityType: string;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, unknown>;
  },
) => {
  const { error } = await client.from("ops_activity_logs").insert({
    actor_user_id: params.actorUserId,
    company_id: params.companyId ?? null,
    ca_firm_id: params.caFirmId ?? null,
    activity_type: params.activityType,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
  });
  if (error) throw error;
};

const createSupportTicket = async (
  client: ReturnType<typeof createClient>,
  params: {
    actorUserId: string;
    scope: { companyId: string | null; caFirmId: string | null };
    category: string;
    priority: string;
    subject: string;
    description?: string | null;
    dueAt?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  if (!OPS_TICKET_ALLOWED_CATEGORIES.has(params.category)) {
    throw new Error("category must be one of: general, billing, kyc, technical, workflow, dispute, security");
  }
  if (!OPS_TICKET_ALLOWED_PRIORITIES.has(params.priority)) {
    throw new Error("priority must be one of: low, medium, high, critical");
  }
  const subject = toTrimmedString(params.subject, 220);
  if (!subject) throw new Error("subject is required");
  const description = toTrimmedString(params.description ?? null, 6000);
  const dueAtRaw = toTrimmedString(params.dueAt ?? null, 80);
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;

  const { data, error } = await client
    .from("ops_support_tickets")
    .insert({
      company_id: params.scope.companyId,
      ca_firm_id: params.scope.caFirmId,
      raised_by: params.actorUserId,
      category: params.category,
      priority: params.priority,
      status: "open",
      subject,
      description,
      due_at: dueAt,
      metadata: params.metadata ?? {},
    })
    .select("id, company_id, ca_firm_id, raised_by, assigned_to, category, priority, status, subject, description, due_at, created_at, updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create support ticket");

  await createOpsActivityLog(client, {
    actorUserId: params.actorUserId,
    companyId: data.company_id,
    caFirmId: data.ca_firm_id,
    activityType: "support_ticket_created",
    entityType: "ops_support_tickets",
    entityId: data.id,
    details: { category: data.category, priority: data.priority, status: data.status },
  });
  return data;
};

const listSupportTickets = async (
  client: ReturnType<typeof createClient>,
  scope: { companyId: string | null; caFirmId: string | null },
  options?: { limit?: number; offset?: number; status?: string | null; category?: string | null },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 60)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("ops_support_tickets")
    .select("id, company_id, ca_firm_id, raised_by, assigned_to, category, priority, status, subject, due_at, first_response_at, resolved_at, resolution_summary, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  if (scope.caFirmId) query = query.eq("ca_firm_id", scope.caFirmId);
  const status = toTrimmedString(options?.status ?? null, 40);
  if (status) query = query.eq("status", status);
  const category = toTrimmedString(options?.category ?? null, 80);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const updateSupportTicket = async (
  client: ReturnType<typeof createClient>,
  params: {
    actorUserId: string;
    ticketId: string;
    status?: string | null;
    priority?: string | null;
    assignedTo?: string | null;
    resolutionSummary?: string | null;
  },
) => {
  assertUuid(params.ticketId, "ticketId");
  const patch: Record<string, unknown> = {};
  const status = toTrimmedString(params.status ?? null, 40);
  if (status) {
    if (!OPS_TICKET_ALLOWED_STATUSES.has(status)) {
      throw new Error("status must be one of: open, in_progress, waiting_customer, resolved, closed");
    }
    patch.status = status;
    if (status === "resolved" || status === "closed") patch.resolved_at = new Date().toISOString();
  }
  const priority = toTrimmedString(params.priority ?? null, 40);
  if (priority) {
    if (!OPS_TICKET_ALLOWED_PRIORITIES.has(priority)) {
      throw new Error("priority must be one of: low, medium, high, critical");
    }
    patch.priority = priority;
  }
  if (typeof params.assignedTo === "string") {
    const assigned = params.assignedTo.trim();
    patch.assigned_to = assigned ? assigned : null;
  }
  const resolutionSummary = toTrimmedString(params.resolutionSummary ?? null, 3000);
  if (resolutionSummary) patch.resolution_summary = resolutionSummary;

  const { data, error } = await client
    .from("ops_support_tickets")
    .update(patch)
    .eq("id", params.ticketId)
    .select("id, company_id, ca_firm_id, assigned_to, status, priority, resolution_summary, updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("support ticket not found");

  await createOpsActivityLog(client, {
    actorUserId: params.actorUserId,
    companyId: data.company_id,
    caFirmId: data.ca_firm_id,
    activityType: "support_ticket_updated",
    entityType: "ops_support_tickets",
    entityId: data.id,
    details: { status: data.status, priority: data.priority, assigned_to: data.assigned_to },
  });
  return data;
};

const createSupportTicketMessage = async (
  client: ReturnType<typeof createClient>,
  params: {
    actorUserId: string;
    ticketId: string;
    message: string;
    isInternal?: boolean;
    attachments?: unknown;
  },
) => {
  assertUuid(params.ticketId, "ticketId");
  const message = toTrimmedString(params.message, 12000);
  if (!message) throw new Error("message is required");
  const attachments = Array.isArray(params.attachments) ? params.attachments : [];

  const { data, error } = await client
    .from("ops_support_ticket_messages")
    .insert({
      ticket_id: params.ticketId,
      sender_user_id: params.actorUserId,
      message,
      is_internal: params.isInternal === true,
      attachments,
    })
    .select("id, ticket_id, sender_user_id, message, is_internal, attachments, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create support message");

  const { data: ticket, error: ticketError } = await client
    .from("ops_support_tickets")
    .select("id, company_id, ca_firm_id, first_response_at")
    .eq("id", params.ticketId)
    .maybeSingle();
  if (ticketError) throw ticketError;
  if (ticket && !ticket.first_response_at) {
    await client.from("ops_support_tickets").update({ first_response_at: new Date().toISOString() }).eq("id", params.ticketId);
  }

  await createOpsActivityLog(client, {
    actorUserId: params.actorUserId,
    companyId: ticket?.company_id ?? null,
    caFirmId: ticket?.ca_firm_id ?? null,
    activityType: "support_ticket_message_added",
    entityType: "ops_support_ticket_messages",
    entityId: data.id,
    details: { ticket_id: data.ticket_id, is_internal: data.is_internal },
  });
  return data;
};

const createAssignmentRequest = async (
  client: ReturnType<typeof createClient>,
  params: {
    actorUserId: string;
    companyId: string;
    assignmentType: string;
    requestedCaUserId?: string | null;
    requestedCaFirmId?: string | null;
    justification?: string | null;
  },
) => {
  assertUuid(params.companyId, "companyId");
  if (!OPS_ASSIGNMENT_ALLOWED_TYPES.has(params.assignmentType)) {
    throw new Error("assignmentType must be one of: external_ca, in_house_ca, in_house_lawyer, ca_firm");
  }
  const requestedCaUserId = toTrimmedString(params.requestedCaUserId ?? null, 80);
  const requestedCaFirmId = toTrimmedString(params.requestedCaFirmId ?? null, 80);
  if (requestedCaUserId) assertUuid(requestedCaUserId, "requestedCaUserId");
  if (requestedCaFirmId) assertUuid(requestedCaFirmId, "requestedCaFirmId");
  const justification = toTrimmedString(params.justification ?? null, 3000);

  const { data, error } = await client
    .from("ops_client_assignment_requests")
    .insert({
      company_id: params.companyId,
      requested_by: params.actorUserId,
      requested_ca_user_id: requestedCaUserId,
      requested_ca_firm_id: requestedCaFirmId,
      assignment_type: params.assignmentType,
      status: "pending",
      justification,
    })
    .select("id, company_id, requested_by, requested_ca_user_id, requested_ca_firm_id, assignment_type, status, justification, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create assignment request");

  await createOpsActivityLog(client, {
    actorUserId: params.actorUserId,
    companyId: data.company_id,
    activityType: "assignment_request_created",
    entityType: "ops_client_assignment_requests",
    entityId: data.id,
    details: { assignment_type: data.assignment_type, status: data.status },
  });
  return data;
};

const listAssignmentRequests = async (
  client: ReturnType<typeof createClient>,
  scope: { companyId: string | null },
  options?: { status?: string | null; limit?: number; offset?: number },
) => {
  const limit = Math.max(1, Math.min(200, Number(options?.limit ?? 80)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("ops_client_assignment_requests")
    .select("id, company_id, requested_by, requested_ca_user_id, requested_ca_firm_id, assignment_type, status, justification, admin_notes, decided_by, decided_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  const status = toTrimmedString(options?.status ?? null, 30);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const decideAssignmentRequestByAdmin = async (
  client: ReturnType<typeof createClient>,
  params: {
    adminUserId: string;
    requestId: string;
    status: string;
    adminNotes?: string | null;
  },
) => {
  assertUuid(params.requestId, "requestId");
  if (!OPS_ASSIGNMENT_ALLOWED_STATUSES.has(params.status)) {
    throw new Error("status must be one of: pending, approved, rejected, cancelled");
  }
  const adminNotes = toTrimmedString(params.adminNotes ?? null, 3000);
  const nowIso = new Date().toISOString();

  const { data, error } = await client
    .from("ops_client_assignment_requests")
    .update({
      status: params.status,
      admin_notes: adminNotes,
      decided_by: params.adminUserId,
      decided_at: nowIso,
    })
    .eq("id", params.requestId)
    .select("id, company_id, assignment_type, status, requested_ca_user_id, requested_ca_firm_id, decided_by, decided_at, updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("assignment request not found");

  await createOpsActivityLog(client, {
    actorUserId: params.adminUserId,
    companyId: data.company_id,
    activityType: "assignment_request_decided",
    entityType: "ops_client_assignment_requests",
    entityId: data.id,
    details: { assignment_type: data.assignment_type, status: data.status },
  });
  return data;
};

const listOpsActivityLogs = async (
  client: ReturnType<typeof createClient>,
  scope: { companyId: string | null; caFirmId: string | null },
  options?: { limit?: number; offset?: number; activityType?: string | null },
) => {
  const limit = Math.max(1, Math.min(250, Number(options?.limit ?? 100)));
  const offset = Math.max(0, Number(options?.offset ?? 0));
  let query = client
    .from("ops_activity_logs")
    .select("id, actor_user_id, company_id, ca_firm_id, activity_type, entity_type, entity_id, details, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
  if (scope.caFirmId) query = query.eq("ca_firm_id", scope.caFirmId);
  const activityType = toTrimmedString(options?.activityType ?? null, 120);
  if (activityType) query = query.eq("activity_type", activityType);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const collectOperationsReadinessSignals = async (
  client: ReturnType<typeof createClient>,
) => {
  const staleTicketIso = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const [openTicketsResult, criticalOpenTicketsResult, staleOpenTicketsResult, noResponseTicketsResult, pendingAssignmentsResult, activityLogsResult] = await Promise.all([
    client.from("ops_support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress", "waiting_customer"]),
    client.from("ops_support_tickets").select("id", { count: "exact", head: true }).eq("priority", "critical").in("status", ["open", "in_progress", "waiting_customer"]),
    client.from("ops_support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress", "waiting_customer"]).lt("created_at", staleTicketIso),
    client.from("ops_support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress", "waiting_customer"]).is("first_response_at", null).lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    client.from("ops_client_assignment_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("ops_activity_logs").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  if (openTicketsResult.error) throw openTicketsResult.error;
  if (criticalOpenTicketsResult.error) throw criticalOpenTicketsResult.error;
  if (staleOpenTicketsResult.error) throw staleOpenTicketsResult.error;
  if (noResponseTicketsResult.error) throw noResponseTicketsResult.error;
  if (pendingAssignmentsResult.error) throw pendingAssignmentsResult.error;
  if (activityLogsResult.error) throw activityLogsResult.error;

  const criticalOpen = Number(criticalOpenTicketsResult.count ?? 0);
  const staleOpen = Number(staleOpenTicketsResult.count ?? 0);
  const noResponse = Number(noResponseTicketsResult.count ?? 0);
  const pendingAssignments = Number(pendingAssignmentsResult.count ?? 0);
  const activity7d = Number(activityLogsResult.count ?? 0);

  return {
    summary: {
      critical: criticalOpen,
      high: staleOpen + noResponse,
      medium: pendingAssignments,
    },
    metrics: {
      open_tickets: Number(openTicketsResult.count ?? 0),
      critical_open_tickets: criticalOpen,
      stale_open_tickets_72h: staleOpen,
      open_tickets_without_first_response_24h: noResponse,
      pending_assignment_requests: pendingAssignments,
      ops_activity_logs_7d: activity7d,
    },
    overall: {
      pass: criticalOpen === 0 && staleOpen === 0 && noResponse === 0,
    },
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

    if (
      path.endsWith("public/landing/overview") ||
      path.endsWith("public/landing/lead") ||
      path.endsWith("public/legal-documents") ||
      path.endsWith("public/legal-documents/index") ||
      path.endsWith("public/regulatory-announcements") ||
      path.endsWith("public/regulatory-announcements/sync-now")
    ) {
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

      if (req.method === "GET" && path.endsWith("public/legal-documents/index")) {
        await enforcePublicRateLimit(serviceClient, req, "public-legal-documents-index", { limit: 60, windowSeconds: 60 });
        return json(req, 200, { ok: true, data: await listPublicLegalDocumentIndex(serviceClient) });
      }

      if (req.method === "GET" && path.endsWith("public/legal-documents")) {
        await enforcePublicRateLimit(serviceClient, req, "public-legal-documents", { limit: 60, windowSeconds: 60 });
        const docKey = normalizeLegalDocKey(url.searchParams.get("doc_key"));
        return json(req, 200, { ok: true, data: await loadPublicLegalDocument(serviceClient, docKey) });
      }

      if (req.method === "GET" && path.endsWith("public/regulatory-announcements")) {
        await enforcePublicRateLimit(serviceClient, req, "public-regulatory-announcements", { limit: 60, windowSeconds: 60 });
        const limit = Number(url.searchParams.get("limit") ?? 25);
        return json(req, 200, {
          ok: true,
          data: await listPublicRegulatoryAnnouncements(serviceClient, { limit }),
        });
      }

      if (req.method === "POST" && path.endsWith("public/regulatory-announcements/sync-now")) {
        await enforcePublicRateLimit(serviceClient, req, "public-regulatory-announcements-sync-now", { limit: 2, windowSeconds: 60 });
        const feed = await listPublicRegulatoryAnnouncements(serviceClient, { limit: 10 });
        return json(req, 200, { ok: true, data: feed });
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

    if (req.method === "GET" && path.endsWith("compliance/consent/status")) {
      const limitRaw = Number(url.searchParams.get("limit") ?? 50);
      return json(req, 200, {
        ok: true,
        data: await listComplianceConsentStatus(client, user.id, {
          consentKey: url.searchParams.get("consent_key"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 50,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("compliance/consent/events")) {
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertComplianceConsent(client, req, user.id, body as Record<string, unknown>),
      });
    }

    if (req.method === "GET" && path.endsWith("compliance/legal-disclaimer/status")) {
      const limitRaw = Number(url.searchParams.get("limit") ?? 50);
      return json(req, 200, {
        ok: true,
        data: await listLegalDisclaimerStatus(client, user.id, {
          disclaimerKey: url.searchParams.get("disclaimer_key"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 50,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("compliance/legal-disclaimer/accept")) {
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertLegalDisclaimerAcceptance(client, req, user.id, body as Record<string, unknown>),
      });
    }

    if (req.method === "GET" && path.endsWith("compliance/data-requests")) {
      const limitRaw = Number(url.searchParams.get("limit") ?? 50);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listComplianceDataRequests(client, user.id, {
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 50,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("compliance/data-requests")) {
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createComplianceDataRequest(client, user.id, body as Record<string, unknown>),
      });
    }

    if (req.method === "GET" && path.endsWith("compliance/legal-documents/acceptance-status")) {
      const limitRaw = Number(url.searchParams.get("limit") ?? 60);
      return json(req, 200, {
        ok: true,
        data: await listLegalDocumentAcceptanceStatus(client, user.id, {
          docKey: url.searchParams.get("doc_key"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 60,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("compliance/legal-documents/accept")) {
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await acceptLegalDocument(client, req, user.id, body as Record<string, unknown>),
      });
    }

    if (req.method === "GET" && path.endsWith("billing/plans")) {
      return json(req, 200, { ok: true, data: await listBillingPlans(client) });
    }

    if (req.method === "GET" && path.endsWith("billing/subscription")) {
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: url.searchParams.get("company_id"),
        caFirmId: url.searchParams.get("ca_firm_id"),
      });
      return json(req, 200, { ok: true, data: await loadBillingSubscription(client, scope) });
    }

    if (req.method === "POST" && path.endsWith("billing/subscription/activate")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: typeof body.companyId === "string" ? body.companyId : null,
        caFirmId: typeof body.caFirmId === "string" ? body.caFirmId : null,
      });
      return json(req, 200, {
        ok: true,
        data: await upsertBillingSubscription(client, {
          scope,
          ownerUserId: user.id,
          planCode: typeof body.planCode === "string" ? body.planCode : "",
          action: "activate",
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("billing/subscription/change-plan")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: typeof body.companyId === "string" ? body.companyId : null,
        caFirmId: typeof body.caFirmId === "string" ? body.caFirmId : null,
      });
      return json(req, 200, {
        ok: true,
        data: await upsertBillingSubscription(client, {
          scope,
          ownerUserId: user.id,
          planCode: typeof body.planCode === "string" ? body.planCode : "",
          action: "change_plan",
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("billing/subscription/cancel")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: typeof body.companyId === "string" ? body.companyId : null,
        caFirmId: typeof body.caFirmId === "string" ? body.caFirmId : null,
      });
      return json(req, 200, {
        ok: true,
        data: await upsertBillingSubscription(client, {
          scope,
          ownerUserId: user.id,
          planCode: "",
          action: "cancel",
          cancelAtPeriodEnd: body.cancelAtPeriodEnd !== false,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("billing/invoices")) {
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: url.searchParams.get("company_id"),
        caFirmId: url.searchParams.get("ca_firm_id"),
      });
      const limitRaw = Number(url.searchParams.get("limit") ?? 60);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listBillingInvoices(client, scope, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 60,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
          status: url.searchParams.get("status"),
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("billing/usage/events")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: typeof body.companyId === "string" ? body.companyId : null,
        caFirmId: typeof body.caFirmId === "string" ? body.caFirmId : null,
      });
      return json(req, 200, {
        ok: true,
        data: await recordBillingUsageEvent(client, {
          scope,
          userId: user.id,
          meterKey: typeof body.meterKey === "string" ? body.meterKey : "",
          quantity: Number(body.quantity ?? 0),
          source: typeof body.source === "string" ? body.source : "api",
          idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : "",
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("billing/usage/summary")) {
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: url.searchParams.get("company_id"),
        caFirmId: url.searchParams.get("ca_firm_id"),
      });
      return json(req, 200, {
        ok: true,
        data: await loadBillingUsageSummary(client, scope, {
          monthStart: url.searchParams.get("month_start"),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/support/tickets")) {
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: url.searchParams.get("company_id"),
        caFirmId: url.searchParams.get("ca_firm_id"),
      });
      const limitRaw = Number(url.searchParams.get("limit") ?? 60);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listSupportTickets(client, scope, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 60,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
          status: url.searchParams.get("status"),
          category: url.searchParams.get("category"),
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/support/tickets")) {
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: typeof body.companyId === "string" ? body.companyId : null,
        caFirmId: typeof body.caFirmId === "string" ? body.caFirmId : null,
      });
      return json(req, 200, {
        ok: true,
        data: await createSupportTicket(client, {
          actorUserId: user.id,
          scope,
          category: typeof body.category === "string" ? body.category.trim().toLowerCase() : "general",
          priority: typeof body.priority === "string" ? body.priority.trim().toLowerCase() : "medium",
          subject: typeof body.subject === "string" ? body.subject : "",
          description: typeof body.description === "string" ? body.description : null,
          dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "POST" && path.includes("ops/support/tickets/") && path.endsWith("/update")) {
      const ticketId = path.split("ops/support/tickets/")[1].replace("/update", "");
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await updateSupportTicket(client, {
          actorUserId: user.id,
          ticketId,
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          priority: typeof body.priority === "string" ? body.priority.trim().toLowerCase() : null,
          assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : null,
          resolutionSummary: typeof body.resolutionSummary === "string" ? body.resolutionSummary : null,
        }),
      });
    }

    if (req.method === "POST" && path.includes("ops/support/tickets/") && path.endsWith("/messages")) {
      const ticketId = path.split("ops/support/tickets/")[1].replace("/messages", "");
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createSupportTicketMessage(client, {
          actorUserId: user.id,
          ticketId,
          message: typeof body.message === "string" ? body.message : "",
          isInternal: body.isInternal === true && roles.has("admin"),
          attachments: Array.isArray(body.attachments) ? body.attachments : [],
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/assignment/requests")) {
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: url.searchParams.get("company_id"),
      });
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listAssignmentRequests(client, { companyId: scope.companyId }, {
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/assignment/requests")) {
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createAssignmentRequest(client, {
          actorUserId: user.id,
          companyId: typeof body.companyId === "string" ? body.companyId : "",
          assignmentType: typeof body.assignmentType === "string" ? body.assignmentType.trim().toLowerCase() : "",
          requestedCaUserId: typeof body.requestedCaUserId === "string" ? body.requestedCaUserId : null,
          requestedCaFirmId: typeof body.requestedCaFirmId === "string" ? body.requestedCaFirmId : null,
          justification: typeof body.justification === "string" ? body.justification : null,
        }),
      });
    }

    if (req.method === "POST" && path.includes("ops/assignment/requests/") && path.endsWith("/decide")) {
      requireRole(roles, ["admin"]);
      const requestId = path.split("ops/assignment/requests/")[1].replace("/decide", "");
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await decideAssignmentRequestByAdmin(client, {
          adminUserId: user.id,
          requestId,
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : "",
          adminNotes: typeof body.adminNotes === "string" ? body.adminNotes : null,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/activity/logs")) {
      const scope = await resolveBillingScopeForUser(client, user.id, roles, {
        companyId: url.searchParams.get("company_id"),
        caFirmId: url.searchParams.get("ca_firm_id"),
      });
      const limitRaw = Number(url.searchParams.get("limit") ?? 100);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listOpsActivityLogs(client, scope, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 100,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
          activityType: url.searchParams.get("activity_type"),
        }),
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
            sannidh_legal_lane_enabled: entitlements.sannidhLegalLaneEnabled,
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

    if (req.method === "GET" && path.endsWith("ops/draft-audit-integrity-check")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 800);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 800;
      const companyId = url.searchParams.get("company_id");
      return json(req, 200, {
        ok: true,
        data: await runDraftAuditTrailIntegrityCheck(client, {
          limit,
          companyId,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/draft-export-integrity-check")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 1200);
      const limit = Number.isFinite(limitRaw) ? limitRaw : 1200;
      const companyId = url.searchParams.get("company_id");
      return json(req, 200, {
        ok: true,
        data: await runDraftExportIntegrityCheck(client, {
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

    if (req.method === "GET" && path.endsWith("ops/compliance/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectComplianceLegalReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/compliance/data-requests")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 100);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listComplianceDataRequestsByAdmin(client, {
          status: url.searchParams.get("status"),
          requestType: url.searchParams.get("request_type"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 100,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/compliance/legal-documents")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listLegalDocumentsByAdmin(client, {
          status: url.searchParams.get("status"),
          docKey: url.searchParams.get("doc_key"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/compliance/legal-documents/publish")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await publishLegalDocumentByAdmin(client, user.id, body as Record<string, unknown>),
      });
    }

    if (req.method === "POST" && path.includes("ops/compliance/data-requests/") && path.endsWith("/status")) {
      requireRole(roles, ["admin"]);
      const requestId = path.split("ops/compliance/data-requests/")[1].replace("/status", "");
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await updateComplianceDataRequestStatusByAdmin(client, user.id, requestId, body as Record<string, unknown>),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/commercial/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectCommercialReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/operations/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectOperationsReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectInfraDevopsReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/runbooks")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listInfraRunbooks(client, {
          status: url.searchParams.get("status"),
          serviceScope: url.searchParams.get("service_scope"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/infra/runbooks")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertInfraRunbookByAdmin(client, user.id, {
          runbookKey: typeof body.runbookKey === "string" ? body.runbookKey : "",
          title: typeof body.title === "string" ? body.title : "",
          serviceScope: typeof body.serviceScope === "string" ? body.serviceScope : null,
          contentMarkdown: typeof body.contentMarkdown === "string" ? body.contentMarkdown : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/releases")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listInfraReleaseRegistry(client, {
          environment: url.searchParams.get("environment"),
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/infra/releases")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertInfraReleaseByAdmin(client, user.id, {
          releaseVersion: typeof body.releaseVersion === "string" ? body.releaseVersion : "",
          environment: typeof body.environment === "string" ? body.environment.trim().toLowerCase() : null,
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          commitSha: typeof body.commitSha === "string" ? body.commitSha : null,
          deployedAt: typeof body.deployedAt === "string" ? body.deployedAt : null,
          rollbackReference: typeof body.rollbackReference === "string" ? body.rollbackReference : null,
          rollbackReason: typeof body.rollbackReason === "string" ? body.rollbackReason : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/backup-drills")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listInfraBackupRestoreDrills(client, {
          environment: url.searchParams.get("environment"),
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/infra/backup-drills")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createInfraBackupRestoreDrillByAdmin(client, user.id, {
          environment: typeof body.environment === "string" ? body.environment.trim().toLowerCase() : null,
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : "",
          startedAt: typeof body.startedAt === "string" ? body.startedAt : null,
          completedAt: typeof body.completedAt === "string" ? body.completedAt : null,
          rtoMinutes: Number.isFinite(Number(body.rtoMinutes)) ? Number(body.rtoMinutes) : null,
          rpoMinutes: Number.isFinite(Number(body.rpoMinutes)) ? Number(body.rpoMinutes) : null,
          backupSnapshotRef: typeof body.backupSnapshotRef === "string" ? body.backupSnapshotRef : null,
          notes: typeof body.notes === "string" ? body.notes : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/monitoring-integrations")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listInfraMonitoringIntegrations(client, {
          status: url.searchParams.get("status"),
          integrationType: url.searchParams.get("integration_type"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/infra/monitoring-integrations")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertInfraMonitoringIntegrationByAdmin(client, user.id, {
          provider: typeof body.provider === "string" ? body.provider : "",
          integrationType: typeof body.integrationType === "string" ? body.integrationType.trim().toLowerCase() : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          configMasked: safeMetadataObject(body.configMasked),
          lastCheckAt: typeof body.lastCheckAt === "string" ? body.lastCheckAt : null,
          lastError: typeof body.lastError === "string" ? body.lastError : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/slo-policies")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      const activeRaw = url.searchParams.get("active");
      const active = activeRaw === null ? null : activeRaw === "true";
      return json(req, 200, {
        ok: true,
        data: await listInfraSloPolicies(client, {
          active,
          serviceName: url.searchParams.get("service_name"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/infra/slo-policies")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertInfraSloPolicyByAdmin(client, user.id, {
          serviceName: typeof body.serviceName === "string" ? body.serviceName : "",
          sliName: typeof body.sliName === "string" ? body.sliName : "",
          windowDays: Number.isFinite(Number(body.windowDays)) ? Number(body.windowDays) : null,
          targetPercent: Number(body.targetPercent ?? 0),
          warningThresholdPercent: Number(body.warningThresholdPercent ?? 0),
          criticalThresholdPercent: Number(body.criticalThresholdPercent ?? 0),
          active: body.active !== false,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/infra/slo-breaches")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listInfraSloBreaches(client, {
          status: url.searchParams.get("status"),
          severity: url.searchParams.get("severity"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/infra/slo-breaches")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertInfraSloBreachByAdmin(client, user.id, {
          id: typeof body.id === "string" ? body.id : null,
          policyId: typeof body.policyId === "string" ? body.policyId : "",
          severity: typeof body.severity === "string" ? body.severity.trim().toLowerCase() : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          observedPercent: Number(body.observedPercent ?? 0),
          breachStartedAt: typeof body.breachStartedAt === "string" ? body.breachStartedAt : null,
          breachResolvedAt: typeof body.breachResolvedAt === "string" ? body.breachResolvedAt : null,
          notes: typeof body.notes === "string" ? body.notes : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/postlaunch/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectPostlaunchReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/postlaunch/kpi-snapshots")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 90);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPostlaunchKpiSnapshots(client, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 90,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
          fromDate: url.searchParams.get("from_date"),
          toDate: url.searchParams.get("to_date"),
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/postlaunch/kpi-snapshots")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertPostlaunchKpiSnapshotByAdmin(client, user.id, {
          snapshotDate: typeof body.snapshotDate === "string" ? body.snapshotDate : "",
          activationCount: Number(body.activationCount ?? 0),
          draftSuccessCount: Number(body.draftSuccessCount ?? 0),
          draftFailureCount: Number(body.draftFailureCount ?? 0),
          activeCompaniesCount: Number(body.activeCompaniesCount ?? 0),
          activeCaUsersCount: Number(body.activeCaUsersCount ?? 0),
          churnRiskCompaniesCount: Number(body.churnRiskCompaniesCount ?? 0),
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/postlaunch/risk-alerts")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 100);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPostlaunchRiskAlerts(client, {
          status: url.searchParams.get("status"),
          severity: url.searchParams.get("severity"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 100,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/postlaunch/risk-alerts")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertPostlaunchRiskAlertByAdmin(client, user.id, {
          id: typeof body.id === "string" ? body.id : null,
          companyId: typeof body.companyId === "string" ? body.companyId : null,
          alertType: typeof body.alertType === "string" ? body.alertType.trim().toLowerCase() : "",
          severity: typeof body.severity === "string" ? body.severity.trim().toLowerCase() : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          title: typeof body.title === "string" ? body.title : "",
          detail: typeof body.detail === "string" ? body.detail : null,
          ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/postlaunch/model-quality-reviews")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 40);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPostlaunchModelQualityReviews(client, {
          limit: Number.isFinite(limitRaw) ? limitRaw : 40,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/postlaunch/model-quality-reviews")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createPostlaunchModelQualityReviewByAdmin(client, user.id, {
          reviewWindowStart: typeof body.reviewWindowStart === "string" ? body.reviewWindowStart : "",
          reviewWindowEnd: typeof body.reviewWindowEnd === "string" ? body.reviewWindowEnd : "",
          sampleSize: Number(body.sampleSize ?? 0),
          hallucinationRatePercent: Number(body.hallucinationRatePercent ?? 0),
          citationCoveragePercent: Number(body.citationCoveragePercent ?? 0),
          legalRiskIncidents: Number(body.legalRiskIncidents ?? 0),
          qualityScore: Number(body.qualityScore ?? 0),
          summary: typeof body.summary === "string" ? body.summary : null,
          actions: Array.isArray(body.actions) ? body.actions : [],
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/postlaunch/hotfix-releases")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPostlaunchHotfixReleases(client, {
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/postlaunch/hotfix-releases")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertPostlaunchHotfixReleaseByAdmin(client, user.id, {
          releaseTag: typeof body.releaseTag === "string" ? body.releaseTag : "",
          commitSha: typeof body.commitSha === "string" ? body.commitSha : null,
          scope: typeof body.scope === "string" ? body.scope : null,
          triggerReason: typeof body.triggerReason === "string" ? body.triggerReason : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : "",
          rollbackAvailable: body.rollbackAvailable !== false,
          rollbackExecuted: body.rollbackExecuted === true,
          rollbackNotes: typeof body.rollbackNotes === "string" ? body.rollbackNotes : null,
          deployedAt: typeof body.deployedAt === "string" ? body.deployedAt : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/performance/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectPerformanceReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/performance/client-metrics")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPerformanceClientMetrics(client, {
          route: url.searchParams.get("route"),
          fromDate: url.searchParams.get("from_date"),
          toDate: url.searchParams.get("to_date"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/performance/client-metrics")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertPerformanceClientMetricByAdmin(client, user.id, {
          metricDate: typeof body.metricDate === "string" ? body.metricDate : "",
          route: typeof body.route === "string" ? body.route : "",
          roleScope: typeof body.roleScope === "string" ? body.roleScope : null,
          source: typeof body.source === "string" ? body.source : null,
          p95TtfbMs: Number.isFinite(Number(body.p95TtfbMs)) ? Number(body.p95TtfbMs) : null,
          p95LcpMs: Number.isFinite(Number(body.p95LcpMs)) ? Number(body.p95LcpMs) : null,
          p95Cls: Number.isFinite(Number(body.p95Cls)) ? Number(body.p95Cls) : null,
          errorRatePercent: Number.isFinite(Number(body.errorRatePercent)) ? Number(body.errorRatePercent) : null,
          bundleKbMain: Number.isFinite(Number(body.bundleKbMain)) ? Number(body.bundleKbMain) : null,
          jsChunkCount: Number.isFinite(Number(body.jsChunkCount)) ? Number(body.jsChunkCount) : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/performance/synthetic-checks")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPerformanceSyntheticChecks(client, {
          checkType: url.searchParams.get("check_type"),
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/performance/synthetic-checks")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createPerformanceSyntheticCheckByAdmin(client, user.id, {
          checkType: typeof body.checkType === "string" ? body.checkType.trim().toLowerCase() : "",
          target: typeof body.target === "string" ? body.target : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : "",
          latencyMs: Number.isFinite(Number(body.latencyMs)) ? Number(body.latencyMs) : null,
          statusCode: Number.isFinite(Number(body.statusCode)) ? Number(body.statusCode) : null,
          checkedAt: typeof body.checkedAt === "string" ? body.checkedAt : null,
          details: typeof body.details === "string" ? body.details : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/performance/budgets")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 80);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      const activeRaw = url.searchParams.get("active");
      const active = activeRaw === null ? null : activeRaw === "true";
      return json(req, 200, {
        ok: true,
        data: await listPerformanceBudgetPolicies(client, {
          active,
          metricName: url.searchParams.get("metric_name"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 80,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/performance/budgets")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertPerformanceBudgetPolicyByAdmin(client, user.id, {
          budgetKey: typeof body.budgetKey === "string" ? body.budgetKey : "",
          metricName: typeof body.metricName === "string" ? body.metricName : "",
          thresholdWarn: Number(body.thresholdWarn ?? 0),
          thresholdFail: Number(body.thresholdFail ?? 0),
          comparator: typeof body.comparator === "string" ? body.comparator.trim().toLowerCase() : null,
          active: body.active !== false,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/performance/alerts")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listPerformanceAlertEvents(client, {
          status: url.searchParams.get("status"),
          severity: url.searchParams.get("severity"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/performance/alerts")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertPerformanceAlertEventByAdmin(client, user.id, {
          id: typeof body.id === "string" ? body.id : null,
          metricName: typeof body.metricName === "string" ? body.metricName : "",
          severity: typeof body.severity === "string" ? body.severity.trim().toLowerCase() : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          title: typeof body.title === "string" ? body.title : "",
          detail: typeof body.detail === "string" ? body.detail : null,
          triggeredValue: Number.isFinite(Number(body.triggeredValue)) ? Number(body.triggeredValue) : null,
          budgetPolicyId: typeof body.budgetPolicyId === "string" ? body.budgetPolicyId : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/qa/readiness")) {
      requireRole(roles, ["admin"]);
      return json(req, 200, {
        ok: true,
        data: await collectQaReadinessSignals(client),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/qa/api-contract-runs")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listQaApiContractRuns(client, {
          environment: url.searchParams.get("environment"),
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/qa/api-contract-runs")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createQaApiContractRunByAdmin(client, user.id, {
          suiteName: typeof body.suiteName === "string" ? body.suiteName : "",
          environment: typeof body.environment === "string" ? body.environment : null,
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : "",
          totalTests: Number(body.totalTests ?? 0),
          passedTests: Number(body.passedTests ?? 0),
          failedTests: Number(body.failedTests ?? 0),
          runDurationMs: Number.isFinite(Number(body.runDurationMs)) ? Number(body.runDurationMs) : null,
          details: safeMetadataObject(body.details),
          executedAt: typeof body.executedAt === "string" ? body.executedAt : null,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/qa/e2e-smoke-runs")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listQaE2eSmokeRuns(client, {
          roleScope: url.searchParams.get("role_scope"),
          status: url.searchParams.get("status"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/qa/e2e-smoke-runs")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await createQaE2eSmokeRunByAdmin(client, user.id, {
          flowName: typeof body.flowName === "string" ? body.flowName : "",
          roleScope: typeof body.roleScope === "string" ? body.roleScope : null,
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : "",
          evidence: safeMetadataObject(body.evidence),
          errorSummary: typeof body.errorSummary === "string" ? body.errorSummary : null,
          executedAt: typeof body.executedAt === "string" ? body.executedAt : null,
        }),
      });
    }

    if (req.method === "GET" && path.endsWith("ops/qa/failures")) {
      requireRole(roles, ["admin"]);
      const limitRaw = Number(url.searchParams.get("limit") ?? 120);
      const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
      return json(req, 200, {
        ok: true,
        data: await listQaFailures(client, {
          status: url.searchParams.get("status"),
          severity: url.searchParams.get("severity"),
          limit: Number.isFinite(limitRaw) ? limitRaw : 120,
          offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/qa/failures")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await upsertQaFailureByAdmin(client, user.id, {
          id: typeof body.id === "string" ? body.id : null,
          sourceType: typeof body.sourceType === "string" ? body.sourceType.trim().toLowerCase() : "",
          sourceRunId: typeof body.sourceRunId === "string" ? body.sourceRunId : null,
          severity: typeof body.severity === "string" ? body.severity.trim().toLowerCase() : "",
          status: typeof body.status === "string" ? body.status.trim().toLowerCase() : null,
          title: typeof body.title === "string" ? body.title : "",
          detail: typeof body.detail === "string" ? body.detail : null,
          ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : null,
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/billing/invoice/issue")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      return json(req, 200, {
        ok: true,
        data: await issueBillingInvoiceByAdmin(client, {
          subscriptionId: typeof body.subscriptionId === "string" ? body.subscriptionId : "",
          invoiceNumber: typeof body.invoiceNumber === "string" ? body.invoiceNumber : "",
          subtotalMinor: Number(body.subtotalMinor ?? 0),
          taxMinor: Number(body.taxMinor ?? 0),
          dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
          gstinCustomer: typeof body.gstinCustomer === "string" ? body.gstinCustomer : null,
          placeOfSupply: typeof body.placeOfSupply === "string" ? body.placeOfSupply : null,
          hsnSacCode: typeof body.hsnSacCode === "string" ? body.hsnSacCode : null,
          lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
          metadata: safeMetadataObject(body.metadata),
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("ops/billing/payment-attempt")) {
      requireRole(roles, ["admin"]);
      const body = await req.json().catch(() => ({}));
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
      const statusRaw = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
      if (!["succeeded", "failed", "scheduled_retry", "cancelled"].includes(statusRaw)) {
        return json(req, 400, { error: "status must be one of: succeeded, failed, scheduled_retry, cancelled" });
      }
      return json(req, 200, {
        ok: true,
        data: await recordBillingPaymentAttemptByAdmin(client, {
          subscriptionId: typeof body.subscriptionId === "string" ? body.subscriptionId : "",
          invoiceId: typeof body.invoiceId === "string" ? body.invoiceId : null,
          status: statusRaw as "succeeded" | "failed" | "scheduled_retry" | "cancelled",
          amountMinor: Number(body.amountMinor ?? 0),
          provider: typeof body.provider === "string" ? body.provider : null,
          failureCode: typeof body.failureCode === "string" ? body.failureCode : null,
          failureMessage: typeof body.failureMessage === "string" ? body.failureMessage : null,
          retryScheduledAt: typeof body.retryScheduledAt === "string" ? body.retryScheduledAt : null,
          metadata: safeMetadataObject(body.metadata),
        }),
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
          .select("sannidh_legal_lane_enabled, assistant_access_enabled, plan_monthly_request_limit, notes, updated_at")
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
          sannidh_legal_lane_enabled: entitlement?.sannidh_legal_lane_enabled === true,
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

      const legalLaneEnabled = body.sannidh_legal_lane_enabled === true;
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
          sannidh_legal_lane_enabled: legalLaneEnabled,
          assistant_access_enabled: assistantAccessEnabled,
          plan_monthly_request_limit: planMonthlyRequestLimit,
          notes,
        }, { onConflict: "user_id" });
      if (upsertError) return json(req, 400, { error: upsertError.message });

      return json(req, 200, {
        ok: true,
        data: {
          user_id: actorUserId,
          sannidh_legal_lane_enabled: legalLaneEnabled,
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
      let format: "pdf" | "docx";
      try {
        format = normalizeExportFormat(body.format ?? "pdf");
      } catch (error) {
        return json(req, 400, { error: error instanceof Error ? error.message : "format must be pdf or docx" });
      }
      return json(req, 200, {
        ok: true,
        data: await createDraftExport(client, user.id, roles, persona, draftRunId, {
          format,
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
