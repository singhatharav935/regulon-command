import { supabase } from "@/integrations/supabase/client";

type WorkspaceBackendEnvelope<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
  error_code?: string;
};

const AI_FRONTEND_MAX_RETRIES = Math.max(1, Number(import.meta.env.VITE_AI_FRONTEND_MAX_RETRIES ?? "3"));
const AI_FRONTEND_BASE_BACKOFF_MS = Math.max(300, Number(import.meta.env.VITE_AI_FRONTEND_BASE_BACKOFF_MS ?? "800"));
const AI_FRONTEND_MIN_REQUEST_GAP_MS = Math.max(0, Number(import.meta.env.VITE_AI_FRONTEND_MIN_REQUEST_GAP_MS ?? "1200"));

const aiUserQueue = new Map<string, Promise<void>>();
const aiUserLastRequestAt = new Map<string, number>();

const getWorkspaceBackendBaseUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL for workspace backend.");
  }
  return `${supabaseUrl}/functions/v1/workspace-backend`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (retryAfterHeader: string | null) => {
  if (!retryAfterHeader) return 0;
  const numericSeconds = Number(retryAfterHeader);
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return numericSeconds * 1000;
  }
  const dateMs = Date.parse(retryAfterHeader);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return 0;
};

const shouldRetryResponse = (status: number) => status === 429 || status >= 500;

const withPerUserAiQueue = async <T>(
  userId: string,
  task: () => Promise<T>,
): Promise<T> => {
  const previous = aiUserQueue.get(userId) ?? Promise.resolve();
  let release: (() => void) | null = null;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  aiUserQueue.set(userId, previous.then(() => current));

  await previous;
  try {
    const lastRequestAt = aiUserLastRequestAt.get(userId) ?? 0;
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < AI_FRONTEND_MIN_REQUEST_GAP_MS) {
      await sleep(AI_FRONTEND_MIN_REQUEST_GAP_MS - elapsed);
    }
    aiUserLastRequestAt.set(userId, Date.now());
    return await task();
  } finally {
    if (release) release();
    if (aiUserQueue.get(userId) === current) {
      aiUserQueue.delete(userId);
    }
  }
};

const getAuthenticatedContext = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  const userId = session?.user?.id;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !publishableKey || !userId) {
    throw new Error("Missing authenticated session for workspace backend.");
  }

  return {
    userId,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: publishableKey,
    },
  };
};

const getWorkspaceBackendHeaders = async () => {
  const { headers } = await getAuthenticatedContext();
  return headers;
};

export const workspaceBackendRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  // --- HIGH-FIDELITY INTERCEPTOR FOR DEMO CA DASHBOARD ---
  const isDemo = typeof window !== 'undefined' && (
    window.location.pathname === '/ca-dashboard' || window.location.pathname === '/ca-dashboard/' || window.location.pathname.startsWith('/ca-dashboard/')
  );
  if (isDemo) {
    await sleep(600); // Simulate network latency
    
    if (path.includes("/drafting/capabilities")) {
      return {
        quota: {
          actor: {
            monthStart: new Date().toISOString(),
            effectiveLimit: 500,
            used: 12,
            remaining: 488,
            hardBlock: false
          },
          firm: {
            monthStart: new Date().toISOString(),
            limit: 5000,
            used: 142,
            remaining: 4858,
            hardBlock: false,
            firmName: "Sannidh CA Practice"
          }
        },
        rate_policy: {
          max_requests_per_minute: 60,
          max_concurrent_requests: 5,
          lock_window_seconds: 0
        },
        capabilities: {
          can_assistant_access: true
        }
      } as unknown as T;
    }
    
    if (path.includes("/drafts/history")) {
      return {
        history: [
          {
            id: "demo-run-1",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            status: "signed_off",
            document_type: "gst-show-cause",
            draft_mode: "balanced",
            draft_content: `BEFORE THE CENTRAL GOODS AND SERVICES TAX OFFICERS, DIVISION-I, NEW DELHI

IN THE MATTER OF:
M/s GlobalTrade India Logistics (Assessee)
GSTIN: 27AABCG5678K2ZQ

SUBJECT: REPLY TO SHOW CAUSE NOTICE REF NO: SCN-829412 DATED 25/05/2026

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS:
The Assessee, M/s GlobalTrade India Logistics, submits that the impugned Show Cause Notice proposing demand of Input Tax Credit (ITC) mismatch under GSTR-2B vs GSTR-3B is legally untenable.

2. RECONCILIATION STATEMENT:
The variance of ₹2,40,000 has been reconciled down to invoice-level errors. Supplier M/s Supplier A filed GSTR-1 late. Tax was paid in full under Section 16(2)(c).

PRAYER:
We request that the proposed demand of ₹2,40,000 along with interest and penalty be dropped.

For M/s GlobalTrade India Logistics
CA Rajesh Kumar (Authorized Signatory)`,
            qa: {
              filing_score: 95,
              risk_band: "low",
              mandatory_gates: { "Document Class Override": true },
              missing_for_final_filing: []
            },
            package: {
              reply: "BEFORE THE CENTRAL GOODS...",
              annexure_index: [{ annexure_id: "A1", purpose: "Supplier payment ledger", linked_issue: "GST reconciliation" }],
              hearing_notes: "Focus on Section 16(2) details.",
              argument_script: ["The Assessee paid tax on invoice..."]
            }
          }
        ]
      } as unknown as T;
    }
    
    if (path.includes("/drafts") && init?.method === "POST") {
      return {
        draftRunId: "demo-run-id-" + Math.floor(Math.random() * 100000)
      } as unknown as T;
    }
    
    if (path.includes("/snapshot") || path.includes("/artifacts")) {
      return {
        version_number: 1,
        content: `BEFORE THE CENTRAL GOODS AND SERVICES TAX OFFICERS, DIVISION-I, NEW DELHI

IN THE MATTER OF:
M/s GlobalTrade India Logistics (Assessee)
GSTIN: 27AABCG5678K2ZQ

SUBJECT: REPLY TO SHOW CAUSE NOTICE REF NO: SCN-829412 DATED 25/05/2026

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS:
The Assessee, M/s GlobalTrade India Logistics, submits that the impugned Show Cause Notice proposing demand of Input Tax Credit (ITC) mismatch under GSTR-2B vs GSTR-3B is legally untenable.

2. RECONCILIATION STATEMENT:
The variance of ₹2,40,000 has been reconciled down to invoice-level errors. Supplier M/s Supplier A filed GSTR-1 late. Tax was paid in full under Section 16(2)(c).

PRAYER:
We request that the proposed demand of ₹2,40,000 along with interest and penalty be dropped.

For M/s GlobalTrade India Logistics
CA Rajesh Kumar (Authorized Signatory)`,
        artifacts: []
      } as unknown as T;
    }
    
    if (path.includes("/drafting/ai")) {
      const parsedBody = init?.body ? JSON.parse(init.body as string) : {};
      const docType = parsedBody.documentType || "gst-show-cause";
      const companyId = parsedBody.companyId;
      
      let clientName = "GlobalTrade India Logistics";
      if (companyId === "demo-client-1" || parsedBody.companyName?.includes("Acme")) clientName = "Acme Technologies Pvt Ltd";
      else if (companyId === "demo-client-3" || parsedBody.companyName?.includes("SecurePay")) clientName = "SecurePay Solutions Ltd";
      else if (companyId === "demo-client-4" || parsedBody.companyName?.includes("Vertex")) clientName = "Vertex EduTech Services";

      let mockReply = `BEFORE THE CENTRAL GOODS AND SERVICES TAX OFFICERS, DIVISION-I, NEW DELHI

IN THE MATTER OF:
M/s ${clientName} (Assessee)

SUBJECT: REPLY TO SHOW CAUSE NOTICE REF NO: SCN-829412 DATED 25/05/2026

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS:
The Assessee submits that the impugned Show Cause Notice proposing demand of Input Tax Credit (ITC) mismatch under GSTR-2B vs GSTR-3B is legally untenable and contrary to established circulars.

2. DETAILED RECONCILIATION STATEMENT:
The variance of ₹2,40,000 has been reconciled down to invoice-level errors:
- Supplier M/s Supplier A filed GSTR-1 with a delay. ITC was claimed under GSTR-3B in May 2026 after verification of payments.
- All payments were made in accordance with Section 16(2)(c) of the CGST Act.

3. LEGAL PRECEDENT AND PRAYER:
We rely on established Circulars clarifying that clerical errors on the part of suppliers should not lead to adverse actions against genuine assessees.

PRAYER:
In view of the above submissions, it is respectfully prayed that the proposed proceedings/demand be dropped and no adverse actions be initiated.

For and on behalf of M/s ${clientName}
CA Rajesh Kumar (Authorized Signatory)`;

      if (docType === "mca-notice") {
        mockReply = `BEFORE THE REGISTRAR OF COMPANIES (ROC), KARNATAKA

IN THE MATTER OF:
M/s ${clientName}
CIN: L65191KA2015PLC082931

SUBJECT: RESPONDING TO ROC INTIMATION REF NO: SCN-MCA-104928

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY CONTEXT:
The Assessee responds to the notice regarding the delay in filing DIR-3 KYC for the director Shri. Ramesh Patel.

2. SYSTEM DELAY & VERIFICATION:
The KYC documents were processed on 12th May 2026, but the MCA portal faced payment gateway sync issues. The Director identification number (DIN) status is fully active as on date.

PRAYER:
We pray that the proceedings be dropped without penalty.

For and on behalf of M/s ${clientName}
CA Rajesh Kumar (Authorized Signatory)`;
      }

      return {
        draft: mockReply,
        qa: {
          filing_score: 95,
          risk_band: "low",
          mandatory_gates: { "Document Class Override": true },
          missing_for_final_filing: []
        },
        package: {
          reply: mockReply,
          annexure_index: [{ annexure_id: "A1", purpose: "Supporting Ledger", linked_issue: "Compliance Verification" }],
          hearing_notes: "Present dynamic MCA dashboard directorship log sheets.",
          argument_script: ["All director KYC documents are fully updated in the system."]
        },
        metadata: { trainingCaseId: "demo-case-" + Date.now() }
      } as unknown as T;
    }
  }
  // --- END INTERCEPTOR ---

  const { userId, headers } = await getAuthenticatedContext();
  const mergedHeaders = {
    ...headers,
    ...(init?.headers ?? {}),
  };

  const executeRequest = async () => fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
    ...init,
    headers: mergedHeaders,
  });

  const isAiPath = path.startsWith("/drafting/ai");
  const perform = async () => {
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt < AI_FRONTEND_MAX_RETRIES; attempt += 1) {
      const response = await executeRequest();
      if (!isAiPath || !shouldRetryResponse(response.status) || attempt === AI_FRONTEND_MAX_RETRIES - 1) {
        return response;
      }
      lastResponse = response;
      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      const jitter = Math.floor(Math.random() * 300);
      const backoffMs = AI_FRONTEND_BASE_BACKOFF_MS * (attempt + 1) + jitter;
      await sleep(Math.max(retryAfterMs, backoffMs));
    }
    if (lastResponse) return lastResponse;
    return executeRequest();
  };

  const response = isAiPath
    ? await withPerUserAiQueue(userId, perform)
    : await perform();

  const payload = (await response.json().catch(() => ({}))) as WorkspaceBackendEnvelope<T>;
  if (!response.ok) {
    const message = payload?.error || `Workspace backend request failed (${response.status}).`;
    const code = payload?.error_code;
    throw new Error(code ? `${message} [${code}]` : message);
  }

  return payload.data as T;
};

export const workspaceBackendStreamRequest = async (
  path: string,
  payload: Record<string, unknown>,
) => {
  // --- HIGH-FIDELITY INTERCEPTOR FOR DEMO CA DASHBOARD ---
  const isDemo = typeof window !== 'undefined' && (
    window.location.pathname === '/ca-dashboard' || window.location.pathname === '/ca-dashboard/' || window.location.pathname.startsWith('/ca-dashboard/')
  );
  if (isDemo) {
    await sleep(600); // Simulate network latency
    
    // For advancedMode JSON fallback:
    if (payload.advancedMode || payload.strictValidation) {
      const docType = payload.documentType || "gst-show-cause";
      let mockReply = `BEFORE THE CENTRAL GOODS AND SERVICES TAX OFFICERS, DIVISION-I, NEW DELHI

IN THE MATTER OF:
M/s GlobalTrade India Logistics (Assessee)
GSTIN: 27AABCG5678K2ZQ

SUBJECT: REPLY TO SHOW CAUSE NOTICE REF NO: SCN-829412 DATED 25/05/2026

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS:
The Assessee, M/s GlobalTrade India Logistics, submits that the impugned Show Cause Notice proposing demand of Input Tax Credit (ITC) mismatch under GSTR-2B vs GSTR-3B is legally untenable.

2. RECONCILIATION STATEMENT:
The variance of ₹2,40,000 has been reconciled down to invoice-level errors. Supplier M/s Supplier A filed GSTR-1 late. Tax was paid in full under Section 16(2)(c).

PRAYER:
We request that the proposed demand of ₹2,40,000 along with interest and penalty be dropped.

For M/s GlobalTrade India Logistics
CA Rajesh Kumar (Authorized Signatory)`;

      if (docType === "mca-notice") {
        mockReply = `BEFORE THE REGISTRAR OF COMPANIES (ROC), KARNATAKA

IN THE MATTER OF:
M/s SecurePay Solutions Ltd
CIN: L65191KA2015PLC082931

SUBJECT: REPLY TO SHOW CAUSE NOTICE DATED 20/05/2026

MOST RESPECTFULLY SHOWETH:

1. SYSTEM COMPLIANCE:
We respond to the notice regarding the delay in filing DIR-3 KYC for director Shri. Ramesh Patel. The KYC documents are fully active in systems.

PRAYER:
We pray that the proceedings be dropped without penalty.

For M/s SecurePay Solutions Ltd
CA Rajesh Kumar (Authorized Signatory)`;
      }

      const mockData = {
        draft: mockReply,
        qa: {
          filing_score: 95,
          risk_band: "low",
          mandatory_gates: { "Document Class Override": true },
          missing_for_final_filing: []
        },
        package: {
          reply: mockReply,
          annexure_index: [{ annexure_id: "A1", purpose: "Supporting Ledger", linked_issue: "Compliance Verification" }],
          hearing_notes: "Present dynamic MCA dashboard directorship log sheets.",
          argument_script: ["All director KYC documents are fully updated in the system."]
        },
        metadata: { trainingCaseId: "demo-case-" + Date.now() }
      };
      
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // For standard typewriter SSE streaming:
    const docType = payload.documentType || "gst-show-cause";
    const mockContent = docType === "mca-notice" 
      ? `BEFORE THE REGISTRAR OF COMPANIES (ROC), KARNATAKA\n\nIN THE MATTER OF:\nM/s SecurePay Solutions Ltd\nCIN: L65191KA2015PLC082931\n\nSUBJECT: REPLY TO SHOW CAUSE NOTICE DATED 20/05/2026\n\n1. SYSTEM COMPLIANCE: We respond to the notice regarding the delay in filing DIR-3 KYC for director Shri. Ramesh Patel. The KYC documents are fully active in systems.`
      : `BEFORE THE CENTRAL GOODS AND SERVICES TAX OFFICERS, DIVISION-I, NEW DELHI\n\nIN THE MATTER OF:\nM/s GlobalTrade India Logistics (Assessee)\nGSTIN: 27AABCG5678K2ZQ\n\nSUBJECT: REPLY TO SHOW CAUSE NOTICE REF NO: SCN-829412 DATED 25/05/2026\n\nMOST RESPECTFULLY SHOWETH:\n\n1. PRELIMINARY OBJECTIONS: The Assessee, M/s GlobalTrade India Logistics, submits that the impugned Show Cause Notice proposing demand of Input Tax Credit (ITC) mismatch under GSTR-2B vs GSTR-3B is legally untenable.`;
    
    const chunks = mockContent.split(" ");
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          const sseEvent = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk + " " } }] })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
          await new Promise((resolve) => setTimeout(resolve, 25)); // Smooth streaming typing speed
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    });
    
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" }
    });
  }
  // --- END INTERCEPTOR ---

  const { userId, headers } = await getAuthenticatedContext();
  const isAiPath = path.startsWith("/drafting/ai");

  const perform = async () => {
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt < AI_FRONTEND_MAX_RETRIES; attempt += 1) {
      const response = await fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!isAiPath || !shouldRetryResponse(response.status) || attempt === AI_FRONTEND_MAX_RETRIES - 1) {
        return response;
      }
      lastResponse = response;
      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      const jitter = Math.floor(Math.random() * 300);
      const backoffMs = AI_FRONTEND_BASE_BACKOFF_MS * (attempt + 1) + jitter;
      await sleep(Math.max(retryAfterMs, backoffMs));
    }
    if (lastResponse) return lastResponse;
    return fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  };

  return isAiPath
    ? withPerUserAiQueue(userId, perform)
    : perform();
};

export const workspacePublicRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(publishableKey ? { apikey: publishableKey } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as WorkspaceBackendEnvelope<T>;
  if (!response.ok) {
    const message = payload?.error || `Workspace backend public request failed (${response.status}).`;
    const code = payload?.error_code;
    throw new Error(code ? `${message} [${code}]` : message);
  }

  return payload.data as T;
};

export const workspaceBackendTesting = {
  parseRetryAfterMs,
  shouldRetryResponse,
};
