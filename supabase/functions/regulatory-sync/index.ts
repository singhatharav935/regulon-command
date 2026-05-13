/**
 * regulatory-sync Edge Function (REAL WORLD GSP INTEGRATION)
 * ──────────────────────────────────────────────────────────
 * The "Brain" of SANNIDH's compliance engine.
 *
 * Triggered by the CA frontend or autonomous pipeline. It:
 *  1. Fetches the real GSTN_AUTH_TOKEN from client_portal_credentials.
 *  2. Calls the official GSP API to pull 2-year filing history.
 *  3. Calls the official GSP API to pull active NOTICES.
 *  4. Inserts any found notices into client_govt_notices (which triggers the AI Drafting Engine webhook).
 *  5. Calculates compliance math and saves to regulatory_sync_jobs.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const getServiceClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

const getAuthUser = async (req: Request) => {
  const token = (req.headers.get("authorization") || "").replace(/^bearer\s+/i, "").trim();
  if (!token) throw new Error("Unauthorized");
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  return data.user;
};

// ── REAL GSP INTEGRATION: Fetch Filing History ──────────────────────────────
async function fetchRealGstHistory(gstin: string, authToken: string, gspApiKey: string): Promise<Record<string, unknown>[] | null> {
  try {
    console.log(`[Regulon Auto-Pilot] Fetching real 2-year history for ${gstin}...`);
    // MasterGST / ClearTax Schema
    const res = await fetch(`https://api.mastergst.com/public/search/returns?gstin=${gstin}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${gspApiKey}`,
        "auth-token": authToken,
        "Accept": "application/json"
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data?.returns || data?.data || null;
    }
    return null;
  } catch (err) {
    console.error("GSP History Fetch Error", err);
    return null;
  }
}

// ── REAL GSP INTEGRATION: Fetch Notices ──────────────────────────────────────
async function fetchRealGstNotices(gstin: string, authToken: string, gspApiKey: string): Promise<Record<string, unknown>[] | null> {
  try {
    console.log(`[Regulon Auto-Pilot] Scanning for active notices for ${gstin}...`);
    const res = await fetch(`https://api.mastergst.com/public/search/notices?gstin=${gstin}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${gspApiKey}`,
        "auth-token": authToken,
        "Accept": "application/json"
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data?.notices || data?.data || null;
    }
    return null;
  } catch (err) {
    console.error("GSP Notice Fetch Error", err);
    return null;
  }
}

// ── COMPLIANCE SCORE ENGINE ──────────────────────────────────────────────────
function computeScore(filingHistory: Record<string, unknown>[] | null): any {
  let score = 100;
  const gaps: any[] = [];
  let onTime = 0, late = 0, missing = 0, totalDue = 0;

  if (filingHistory && filingHistory.length > 0) {
    for (const row of filingHistory) {
      totalDue++;
      const status = (row.status as string || "").toLowerCase();
      if (status === "not filed" || status === "pending") {
        missing++;
        score -= 20;
        gaps.push({ type: "missing_return", severity: "critical", description: "Mandatory return not filed." });
      } else if (status === "filed_late") {
        late++;
        score -= 10;
        gaps.push({ type: "late_filing", severity: "medium", description: "Return filed after due date." });
      } else {
        onTime++;
      }
    }
  } else {
    score = 50;
    gaps.push({ type: "info", severity: "high", description: "No filing history retrieved. Auth Token may be invalid or missing." });
  }

  return { score: Math.max(0, score), totalDue, onTime, late, missing, gaps };
}

// ── MAIN RUNNER ──────────────────────────────────────────────────────────────
async function runSync(db: ReturnType<typeof getServiceClient>, job: Record<string, string | null>) {
  try {
    const gspApiKey = Deno.env.get("GSTN_GSP_API_KEY");
    if (!gspApiKey) {
      throw new Error("GSTN_GSP_API_KEY is missing. Cannot fetch real government data.");
    }

    // 1. Fetch the Auth Token from the secure vault we built
    const { data: creds } = await db.from('client_portal_credentials')
      .select('username, encrypted_password')
      .eq('company_id', job.company_id)
      .eq('portal_type', 'GSTN_AUTH_TOKEN')
      .single();

    const gstin = creds?.username || job.gstin;
    const authToken = creds?.encrypted_password;

    if (!gstin || !authToken) {
       throw new Error("Client GSTN Auth Token is missing. The Unified Consent process was not completed by the client.");
    }

    // 2. Fetch real data from the Government API
    const [filingHistory, notices] = await Promise.all([
      fetchRealGstHistory(gstin, authToken, gspApiKey),
      fetchRealGstNotices(gstin, authToken, gspApiKey)
    ]);

    // 3. Process and Save Notices (This triggers the AI Drafting Engine Webhook!)
    if (notices && notices.length > 0) {
      for (const notice of notices) {
        // Insert into client_govt_notices
        // If it successfully inserts with status 'detected', the DB webhook fires instantly!
        await db.from('client_govt_notices').insert({
          company_id: job.company_id,
          ca_user_id: job.ca_user_id,
          financial_year: "2024-25", // Hardcoded for current cycle
          notice_type: notice.noticeType || "Department Clarification",
          department: "GST Department",
          issue_date: notice.issueDate || new Date().toISOString(),
          due_date: notice.dueDate || new Date(Date.now() + 15*86400000).toISOString(),
          status: "detected", // <--- THE TRIGGER WORD
          ai_summary: notice.description || "Notice detected during autonomous sync."
        });
      }
    }

    // 4. Compute Compliance Health Score based on actual math
    const result = computeScore(filingHistory);

    // 5. Update the Database
    await db.from("regulatory_sync_jobs").update({
      status:              "completed",
      completed_at:        new Date().toISOString(),
      gst_filings_data:    filingHistory ? { rows: filingHistory } : null,
      compliance_score:    result.score,
      total_returns_due:   result.totalDue,
      total_filed_on_time: result.onTime,
      total_filed_late:    result.late,
      total_missing:       result.missing,
      gaps_found:          result.gaps,
    }).eq("id", job.id);

    await db.from("companies").update({
      compliance_health: result.score,
      sync_status:       "synced",
      last_synced_at:    new Date().toISOString(),
      compliance_gaps:   result.gaps,
    }).eq("id", job.company_id);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    await db.from("regulatory_sync_jobs").update({ status: "failed", error_message: msg }).eq("id", job.id);
    if (job.company_id) await db.from("companies").update({ sync_status: "failed" }).eq("id", job.company_id);
  }
}

async function handleTrigger(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  const { job_id, company_id } = await req.json();

  const db = getServiceClient();

  let jobQuery = db.from("regulatory_sync_jobs").select("*");
  if (job_id) jobQuery = jobQuery.eq("id", job_id);
  else if (company_id) jobQuery = jobQuery.eq("company_id", company_id).eq("status", "pending").order("created_at", { ascending: false }).limit(1);
  else return json(400, { error: "job_id or company_id required" });

  const { data: jobs } = await jobQuery;
  const job = Array.isArray(jobs) ? jobs[0] : jobs;
  if (!job) return json(404, { error: "Sync job not found" });
  if (job.ca_user_id !== user.id) return json(403, { error: "Forbidden" });
  if (job.status === "running") return json(200, { message: "Already running", job_id: job.id });

  await db.from("regulatory_sync_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", job.id);
  await db.from("companies").update({ sync_status: "syncing" }).eq("id", job.company_id);

  runSync(db, job).catch(console.error);

  return json(200, { success: true, job_id: job.id, message: "Real GSP Sync started" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "trigger" && req.method === "POST") return await handleTrigger(req);
    return json(404, { error: "Unknown action. Use: trigger" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg === "Unauthorized") return json(401, { error: "Unauthorized" });
    return json(500, { error: msg });
  }
});
