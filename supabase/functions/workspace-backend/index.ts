import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const isLocalOrigin =
    origin.startsWith("http://localhost:") ||
    origin.startsWith("https://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("https://127.0.0.1:");

  const hasWildcard = allowlist.includes("*");
  const isAllowlisted = allowlist.includes(origin);
  const allowOrigin = allowlist.length === 0 ? "*" : (isLocalOrigin || hasWildcard || isAllowlisted ? origin : "null");

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
  "generated->generated": ["manual_version_saved", "review_saved", "legal_review_saved", "draft_generated"],
  "generated->under_review": ["submitted_for_review", "review_started"],
  "under_review->under_review": ["manual_version_saved", "review_saved", "legal_review_saved"],
  "under_review->approved": ["review_approved", "legal_review_approved"],
  "approved->approved": ["manual_version_saved", "review_saved", "legal_review_saved"],
  "approved->signed_off": ["final_sign_off", "legal_final_sign_off"],
  "signed_off->signed_off": ["manual_version_saved", "review_saved"],
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
}: {
  roles: Set<string>;
  persona: AppPersona | null;
  eventType: string;
}) => {
  if (roles.has("admin")) return;
  if (!roles.has("manager")) {
    throw new Error("Policy denied: manager_role_required_for_review_actions");
  }

  // Backward compatibility: legacy accounts may not have user_personas hydrated yet.
  if (!persona) return;

  if (eventType === "legal_review_approved" || eventType === "legal_final_sign_off" || eventType === "legal_review_saved") {
    if (persona !== "in_house_lawyer") {
      throw new Error("Policy denied: legal_review_events_require_in_house_lawyer");
    }
    return;
  }

  if (eventType === "review_approved" || eventType === "final_sign_off" || eventType === "submitted_for_review" || eventType === "review_started") {
    if (persona !== "external_ca" && persona !== "in_house_ca" && persona !== "ca_firm") {
      throw new Error("Policy denied: ca_review_events_require_ca_persona");
    }
    return;
  }
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
}: {
  roles: Set<string>;
  persona: AppPersona | null;
  operation: string;
}) => {
  if (roles.has("admin")) return;
  if (!roles.has("manager")) {
    throw new Error("Policy denied: manager_role_required_for_ai_operations");
  }

  // Backward compatibility: legacy accounts may not have persona rows yet.
  if (!persona) return;

  const caPersonas: AppPersona[] = ["external_ca", "in_house_ca", "ca_firm"];
  const caOrLegalPersonas: AppPersona[] = [...caPersonas, "in_house_lawyer"];

  if (operation === "draft" || operation === "generate" || operation === "apply-fix" || operation === "fix") {
    if (!caPersonas.includes(persona)) {
      throw new Error("Policy denied: draft_generation_requires_ca_persona");
    }
    return;
  }

  if (operation === "recheck" || operation === "notice-ocr" || operation === "notice-details") {
    if (!caOrLegalPersonas.includes(persona)) {
      throw new Error("Policy denied: ai_operation_requires_ca_or_legal_persona");
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

const enforceAiRequestRateLimit = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  companyId: string | null,
) => {
  const maxRequestsPerMinute = Math.max(5, Number(Deno.env.get("AI_MAX_REQUESTS_PER_MINUTE") ?? "30"));
  const maxConcurrentRequests = Math.max(1, Number(Deno.env.get("AI_MAX_CONCURRENT_REQUESTS") ?? "3"));
  const maxCompanyRequestsPerMinute = Math.max(10, Number(Deno.env.get("AI_MAX_COMPANY_REQUESTS_PER_MINUTE") ?? "90"));
  const lockWindowSeconds = Math.max(15, Number(Deno.env.get("AI_LOCK_WINDOW_SECONDS") ?? "120"));
  const minuteAgoIso = new Date(Date.now() - 60 * 1000).toISOString();

  const requests = [
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
  ];

  if (companyId) {
    requests.push(
      client
        .from("ai_request_idempotency")
        .select("id")
        .eq("company_id", companyId)
        .gte("created_at", minuteAgoIso)
        .limit(maxCompanyRequestsPerMinute + 1),
    );
  }

  const [recentResult, processingResult, companyResult] = await Promise.all(requests);
  const recentRows = "data" in recentResult ? recentResult.data : null;
  const recentError = "error" in recentResult ? recentResult.error : null;
  const processingRows = "data" in processingResult ? processingResult.data : null;
  const processingError = "error" in processingResult ? processingResult.error : null;
  const companyRows = companyResult && "data" in companyResult ? companyResult.data : null;
  const companyError = companyResult && "error" in companyResult ? companyResult.error : null;

  if (recentError) throw recentError;
  if (processingError) throw processingError;
  if (companyError) throw companyError;

  const recentCount = (recentRows ?? []).length;
  const freshInFlightCount = (processingRows ?? []).filter((row) => isLockFresh(row.updated_at, lockWindowSeconds)).length;
  const companyRecentCount = (companyRows ?? []).length;

  if (freshInFlightCount >= maxConcurrentRequests) {
    throw new Error("AI rate limit exceeded: too_many_inflight");
  }
  if (recentCount >= maxRequestsPerMinute) {
    throw new Error("AI rate limit exceeded: too_many_requests");
  }
  if (companyId && companyRecentCount >= maxCompanyRequestsPerMinute) {
    throw new Error("AI rate limit exceeded: company_quota");
  }
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

  await enforceAiRequestRateLimit(client, userId, scopedCompanyId);

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
  if (message.startsWith("Policy denied:")) return "WORKFLOW_ACTOR_FORBIDDEN";
  if (message === "AI request already in progress") return "AI_REQUEST_IN_PROGRESS";
  if (message.startsWith("AI rate limit exceeded:")) return "AI_RATE_LIMITED";
  if (message.startsWith("Unsupported documentType:")) return "VALIDATION_INVALID_FIELD";
  if (message.startsWith("Invalid workflow transition:")) return "WORKFLOW_TRANSITION_INVALID";
  if (message.startsWith("Invalid event type for transition:")) return "WORKFLOW_EVENT_INVALID";
  if (message.includes(" is required") || message.includes(" are required")) return "VALIDATION_REQUIRED_FIELD";
  return "INTERNAL_ERROR";
};

const createCompanyWorkspace = async (client: ReturnType<typeof createClient>, name: string, industry: string | null) => {
  const { error } = await client.rpc("create_company_with_owner", {
    _name: name,
    _industry: industry,
  });
  if (error) throw error;
  return { created: true };
};

const createCaFirmWorkspace = async (
  client: ReturnType<typeof createClient>,
  name: string,
  registrationNumber: string,
  jurisdiction: string | null,
) => {
  const { error } = await client.rpc("create_ca_firm_with_owner", {
    _name: name,
    _registration_number: registrationNumber,
    _jurisdiction: jurisdiction,
  });
  if (error) throw error;
  return { created: true };
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

const createDraftRun = async (
  client: ReturnType<typeof createClient>,
  userId: string,
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
  if (payload.companyId) {
    const companyIds = await getUserCompanyIds(client, userId);
    if (!companyIds.includes(payload.companyId)) {
      throw new Error("Forbidden");
    }
  }

  const { data: draftRun, error: draftRunError } = await client
    .from("draft_runs")
    .insert({
      user_id: userId,
      company_id: payload.companyId,
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
    noticeInput?: string | null;
    qa?: unknown;
    draftPackage?: unknown;
    payload?: Record<string, unknown>;
  },
) => {
  const review = await loadDraftReview(client, userId, roles, draftRunId);
  const currentStatus = String(review.run.status);
  const nextStatus = body.nextStatus || currentStatus;
  assertValidWorkflowTransition(currentStatus, nextStatus);
  assertValidEventTypeForTransition(currentStatus, nextStatus, body.eventType);
  assertEventActorAllowed({ roles, persona, eventType: body.eventType });

  const { data: latestVersion } = await client
    .from("draft_versions")
    .select("version_number")
    .eq("draft_run_id", draftRunId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersionNumber = Number(latestVersion?.version_number ?? 0) + 1;

  const { error: updateError } = await client
    .from("draft_runs")
    .update({
      draft_content: body.content,
      status: nextStatus,
      notice_input: body.noticeInput ?? undefined,
      qa: body.qa ?? undefined,
      package: body.draftPackage ?? undefined,
    })
    .eq("id", draftRunId);
  if (updateError) throw updateError;

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
  if (auditError) throw auditError;

  await queueWorkflowNotifications(client, draftRunId, body.eventType, nextStatus, userId);

  return await loadDraftArtifacts(client, userId, roles, draftRunId);
};

const validateAiDraftScope = async (
  client: ReturnType<typeof createClient>,
  userId: string,
  roles: Set<string>,
  persona: AppPersona | null,
  payload: Record<string, unknown>,
) => {
  const operation = normalizeAiOperation(payload);
  assertAiOperationActorAllowed({ roles, persona, operation });
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
  const operation = normalizeAiOperation(payload);
  const { requestKey, cachedResponse } = await prepareAiIdempotencyLock(client, userId, operation, payload, companyId);

  if (cachedResponse) {
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
    await finalizeAiIdempotencyLock(client, userId, requestKey, {
      status: response.ok ? "completed" : "failed",
      responsePayload: response.ok ? body : null,
      errorMessage: response.ok ? null : (typeof body?.error === "string" ? body.error : `ai-draft failed (${response.status})`),
      responseStatus: response.status,
      aiModelUsed,
      aiFallbackUsed: aiFallbackUsedHeader === "true",
      aiAttemptCount: Number.isFinite(aiAttemptCount as number) ? aiAttemptCount : null,
      modelRouterVersion,
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
  const operation = normalizeAiOperation(payload);
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
    .select("id, status, document_type, draft_mode, draft_content, created_at, company_id")
    .eq("id", draftRunId)
    .single();
  if (runError || !run) throw new Error("Draft not found");

  if (!roles.has("admin") && run.company_id) {
    const companyIds = await getUserCompanyIds(client, userId);
    if (!companyIds.includes(run.company_id)) {
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

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (corsHeaders["Access-Control-Allow-Origin"] === "null") {
    return json(req, 403, { error: "Origin not allowed" });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/+/, "");
    const { client, user, token } = await getUserClient(req);
    const roles = await getUserRoles(client, user.id);
    const persona = await getUserPersona(client, user.id, user);

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

    if (req.method === "GET" && path.includes("draft-review/")) {
      const draftRunId = path.split("draft-review/")[1];
      return json(req, 200, { ok: true, data: await loadDraftReview(client, user.id, roles, draftRunId) });
    }

    if (req.method === "POST" && path.includes("draft-review/") && path.endsWith("/save")) {
      const draftRunId = path.split("draft-review/")[1].replace("/save", "");
      const payload = await loadDraftReview(client, user.id, roles, draftRunId);
      const body = await req.json();
      const content = String(body.content || "").trim();
      const nextStatus = body.next_status ? String(body.next_status) : payload.run.status;
      const eventType = String(body.event_type || "review_saved");
      if (!content) return json(req, 400, { error: "content is required" });
      const currentStatus = String(payload.run.status);
      assertValidWorkflowTransition(currentStatus, nextStatus);
      assertValidEventTypeForTransition(currentStatus, nextStatus, eventType);
      assertEventActorAllowed({ roles, persona, eventType });

      const { data: latestVersion } = await client
        .from("draft_versions")
        .select("version_number")
        .eq("draft_run_id", draftRunId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextVersionNumber = Number(latestVersion?.version_number ?? 0) + 1;

      const { error: updateError } = await client
        .from("draft_runs")
        .update({ draft_content: content, status: nextStatus })
        .eq("id", draftRunId);
      if (updateError) return json(req, 400, { error: updateError.message });

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
      if (auditError) return json(req, 400, { error: auditError.message });

      await queueWorkflowNotifications(client, draftRunId, eventType, nextStatus, user.id);

      return json(req, 200, { ok: true, data: await loadDraftReview(client, user.id, roles, draftRunId) });
    }

    if (req.method === "POST" && path.endsWith("company/workspace")) {
      requireRole(roles, ["user", "manager", "admin"]);
      const body = await req.json();
      const name = String(body.name || "").trim();
      const industry = typeof body.industry === "string" && body.industry.trim() ? body.industry.trim() : null;
      if (!name) return json(req, 400, { error: "name is required" });
      return json(req, 200, { ok: true, data: await createCompanyWorkspace(client, name, industry) });
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
        data: await createCaFirmWorkspace(client, name, registrationNumber, jurisdiction),
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
        data: await createDraftRun(client, user.id, {
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
      if (!content || !eventType) {
        return json(req, 400, { error: "content and eventType are required" });
      }
      return json(req, 200, {
        ok: true,
        data: await saveDraftSnapshot(client, user.id, roles, persona, draftRunId, {
          content,
          nextStatus: body.nextStatus ? String(body.nextStatus) : undefined,
          eventType,
          noticeInput: typeof body.noticeInput === "string" ? body.noticeInput : null,
          qa: body.qa ?? undefined,
          draftPackage: body.draftPackage ?? undefined,
          payload: typeof body.payload === "object" && body.payload ? body.payload : undefined,
        }),
      });
    }

    if (req.method === "POST" && path.endsWith("drafting/ai")) {
      requireRole(roles, ["manager", "admin"]);
      const body = await req.json();
      if (!body || typeof body !== "object") {
        return json(req, 400, { error: "request body is required" });
      }
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
      return await proxyAiDraftStream(req, client, user.id, roles, persona, token, body as Record<string, unknown>);
    }

    return json(req, 404, { error: "Route not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const errorCode = resolveErrorCode(message);
    const status =
      errorCode === "AUTH_UNAUTHORIZED"
        ? 401
        : errorCode === "ACCESS_FORBIDDEN" || errorCode === "WORKFLOW_ACTOR_FORBIDDEN"
          ? 403
          : errorCode === "AI_REQUEST_IN_PROGRESS"
            ? 409
            : errorCode === "AI_RATE_LIMITED"
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
