/**
 * regulatory-sync Edge Function
 * ─────────────────────────────
 * The "Brain" of SANNIDH's compliance engine.
 *
 * Triggered by the CA frontend (POST ?action=trigger) after a consent approval
 * is detected. It then:
 *  1. Marks the sync job as 'running'
 *  2. Calls GST Portal public API for taxpayer master data
 *  3. Calls Sandbox.co.in GST API for full filing history (if SANDBOX_API_KEY set)
 *  4. Calls MCA public API for company master data
 *  5. Runs the statutory arithmetic to produce a real compliance_score (0–100)
 *  6. Writes gaps[], score, and raw data back to regulatory_sync_jobs
 *  7. Updates companies.compliance_health and companies.sync_status
 *
 * Routes:
 *   POST ?action=trigger  — CA triggers a sync for a specific job_id
 *   GET  ?action=status   — Poll sync status for a company_id
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

// ── GST Portal: fetch taxpayer master data (free, no auth) ───────────────────
async function fetchGSTTaxpayer(gstin: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `https://services.gst.gov.in/services/api/search/taxpayerDetails?gstin=${gstin}`,
      { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      if (d.lgnm || d.tradeNam) return d;
    }
  } catch { /* fall through */ }

  // Also try the verify-identifier function (already deployed) as fallback
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const res = await fetch(`${supabaseUrl}/functions/v1/verify-identifier?type=gstin&value=${gstin}`);
    if (res.ok) {
      const d = await res.json();
      if (d.success) return d;
    }
  } catch { /* fall through */ }

  return null;
}

// ── Sandbox.co.in: get access token (required before every API call) ─────────
async function getSandboxToken(): Promise<string | null> {
  const apiKey    = Deno.env.get("SANDBOX_API_KEY");
  const apiSecret = Deno.env.get("SANDBOX_API_SECRET");
  if (!apiKey || !apiSecret) return null;

  try {
    const res = await fetch("https://api.sandbox.co.in/authenticate", {
      method: "POST",
      headers: {
        "x-api-key":    apiKey,
        "x-api-secret": apiSecret,
        "x-api-version": "1.0",
        "Accept": "application/json",
      },
    });
    if (res.ok) {
      const d = await res.json();
      return d?.access_token || null;
    }
  } catch { /* fall through */ }
  return null;
}

// ── Sandbox.co.in: fetch GST filing history (Track Returns API) ─────────────
// Endpoint: POST /gst/compliance/public/gstrs/track?financial_year=FY%20YYYY-YY
// Body: {"gstin": "..."}
// Returns array of filings with: rtntype, ret_prd, dof, status, arn, mof
async function fetchGSTFilingHistory(gstin: string): Promise<Record<string, unknown>[] | null> {
  const token = await getSandboxToken();
  if (!token) return null;
  const apiKey = Deno.env.get("SANDBOX_API_KEY")!;

  // Build FY string: "FY YYYY-YY" (e.g., "FY 2024-25")
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEnd = String(fyStart + 1).slice(-2);
  const allFilings: Record<string, unknown>[] = [];

  // Fetch current FY + previous FY for ~24 months coverage
  const years = [`FY ${fyStart}-${fyEnd}`, `FY ${fyStart - 1}-${String(fyStart).slice(-2)}`];

  for (const fy of years) {
    try {
      const res = await fetch(
        `https://api.sandbox.co.in/gst/compliance/public/gstrs/track?financial_year=${encodeURIComponent(fy)}`,
        {
          method: "POST",
          headers: {
            "authorization": token,
            "x-api-key": apiKey,
            "x-api-version": "1.0.0",
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ gstin }),
        }
      );
      if (res.ok) {
        const d = await res.json();
        if (d.code === 200 && d.data?.data?.EFiledlist) {
          allFilings.push(...d.data.data.EFiledlist);
        }
      }
    } catch { /* continue to next FY */ }
  }

  return allFilings.length > 0 ? allFilings : null;
}

// ── Advanced Triple-Redundancy Fallback: Fetch MCA Data ──────────────────────────
// Tier 1: Sandbox (Live Gov API)
// Tier 2: Public Aggregator Fallback (Cache)
// Tier 3: GST Network Pivot (Handled in compliance engine)
async function fetchMCAData(cin: string, maxRetries = 2): Promise<Record<string, unknown> | null> {
  const token = await getSandboxToken();
  
  // TIER 1: LIVE GOVERNMENT API (Sandbox)
  if (token) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch("https://api.sandbox.co.in/mca/company/master-data/search", {
          method: "POST",
          headers: {
            "authorization": token,
            "x-api-key": Deno.env.get("SANDBOX_API_KEY")!,
            "x-api-version": "1.0.0",
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ 
            "@entity": "in.co.sandbox.kyc.mca.master_data.request",
            id: cin, consent: "y", reason: "For Company KYC" 
          }),
        });

        if (res.ok) {
          const d = await res.json();
          return d?.data || d || null;
        }

        if (res.status === 504 || res.status === 502) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1500));
            continue;
          }
        } else {
          break;
        }
      } catch {
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  // TIER 2: ADVANCED AGGREGATOR FALLBACK (Scraping Public Datasets)
  // If the government portal is down, we silently query third-party public databases
  // that maintain cached copies of the MCA registry (e.g., Probe42, Tofler, Zauba, etc.)
  try {
    console.log(`[Regulon Auto-Pilot] Gov portal offline for ${cin}. Pivoting to Aggregator Fallback...`);
    // Example: Fallback to an open company search aggregator endpoint
    const fallbackRes = await fetch(`https://api.thecompanycheck.com/v1/company/${cin}`, {
      headers: { "Accept": "application/json" },
      // Note: In a full production scenario, you would route this through a proxy
      // or use a dedicated fallback API key for a service like Karza.
    });
    
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      return {
        company_name: fallbackData.companyName || "Retrieved from Fallback",
        company_status: fallbackData.status || "Active",
        date_of_incorporation: fallbackData.incorporationDate,
        _source: "aggregators_fallback" // Tagged so the AI knows the data source
      };
    }
  } catch {
    console.log(`[Regulon Auto-Pilot] Aggregator fallback unavailable for ${cin}.`);
  }

  // TIER 3: GST NETWORK PIVOT 
  // Returning null here triggers the engine to calculate compliance using ONLY the GST network data.
  // Since GST runs on different servers than MCA, it is almost never down at the same time.
  return null;
}

// ── Compliance Score Engine ────────────────────────────────────────────────────
interface Gap {
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  period?: string;
}

interface ScoreResult {
  score: number;
  totalDue: number;
  onTime: number;
  late: number;
  missing: number;
  gaps: Gap[];
  method: "full_history" | "taxpayer_data_only" | "minimal";
}

function computeScore(
  taxpayerData: Record<string, unknown> | null,
  filingHistory: Record<string, unknown>[] | null,
  mcaData: Record<string, unknown> | null
): ScoreResult {
  const gaps: Gap[] = [];
  let score = 100;

  // ── CASE 1: Full filing history available (Sandbox API) ──────────────────
  if (filingHistory && filingHistory.length > 0) {
    let totalDue = 0, onTime = 0, late = 0, missing = 0;
    const DUE_DATE_DAY: Record<string, number> = {
      "GSTR-3B": 20, "GSTR-1": 11, "GSTR-9": 31, "GSTR-9C": 31,
    };

    for (const row of filingHistory) {
      // Map real Sandbox API fields: rtntype, ret_prd, dof, status
      const returnType = (row.rtntype as string || row.return_type as string || "").toUpperCase();
      const period = (row.ret_prd as string || row.tax_period as string || "");
      const rawDate = (row.dof as string || row.date_of_filing as string || "");
      const status = (row.status as string || "").toLowerCase();

      // Parse filed date from "DD-MM-YYYY" format (Sandbox) or ISO
      let filedDate: Date | null = null;
      if (rawDate) {
        if (rawDate.includes("-") && rawDate.length === 10 && parseInt(rawDate.substring(0, 2)) <= 31) {
          // DD-MM-YYYY format from Sandbox
          const [dd, mm, yyyy] = rawDate.split("-");
          filedDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        } else {
          filedDate = new Date(rawDate);
        }
        if (isNaN(filedDate.getTime())) filedDate = null;
      }

      totalDue++;

      if (status === "not filed" || !filedDate) {
        missing++;
        score -= 20;
        gaps.push({
          type: "missing_return",
          description: `${returnType} for ${period} has NOT been filed.`,
          severity: "critical",
          period,
        });
        continue;
      }

      // Parse due date from period (e.g., "032024" = March 2024 or "122024" = Dec 2024)
      if (period.length >= 6) {
        const month = parseInt(period.substring(0, 2)) - 1;
        const year = parseInt(period.substring(2, 6));
        const dueDay = DUE_DATE_DAY[returnType] || 20;
        const dueDate = new Date(year, month, dueDay);

        const daysLate = Math.floor((filedDate.getTime() - dueDate.getTime()) / 86400000);
        if (daysLate <= 0) {
          onTime++;
        } else if (daysLate <= 30) {
          late++;
          score -= 5;
          gaps.push({
            type: "late_filing",
            description: `${returnType} for ${period} was filed ${daysLate} days late.`,
            severity: "medium",
            period,
          });
        } else {
          late++;
          score -= 10;
          gaps.push({
            type: "late_filing",
            description: `${returnType} for ${period} was filed ${daysLate} days late (major delay).`,
            severity: "high",
            period,
          });
        }
      } else {
        onTime++;
      }
    }

    // MCA deductions (if available)
    if (mcaData) {
      const companyStatus = ((mcaData.company_status || mcaData.status) as string || "").toLowerCase();
      if (companyStatus.includes("struck") || companyStatus.includes("dissolved")) {
        score -= 50;
        gaps.push({ type: "mca_critical", description: "Company is Struck Off or Dissolved on MCA.", severity: "critical" });
      } else if (companyStatus.includes("under liquidation")) {
        score -= 40;
        gaps.push({ type: "mca_critical", description: "Company is Under Liquidation on MCA.", severity: "critical" });
      }
      const aoc4 = (mcaData.aoc4_filing_status as string || "").toLowerCase();
      const mgt7 = (mcaData.mgt7_filing_status as string || "").toLowerCase();
      if (aoc4 === "pending" || aoc4 === "not filed") {
        score -= 30;
        gaps.push({ type: "mca_balance_sheet", description: "AOC-4 (Balance Sheet) has not been filed with MCA.", severity: "high" });
      }
      if (mgt7 === "pending" || mgt7 === "not filed") {
        score -= 20;
        gaps.push({ type: "mca_annual_return", description: "MGT-7 (Annual Return) has not been filed with MCA.", severity: "high" });
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      totalDue, onTime, late, missing, gaps,
      method: "full_history",
    };
  }

  // ── CASE 2: Only taxpayer master data (no Sandbox key) ──────────────────
  if (taxpayerData) {
    const status = ((taxpayerData.sts || taxpayerData.status) as string || "").toLowerCase();
    const taxpayerType = ((taxpayerData.dty || taxpayerData.business_type) as string || "").toLowerCase();
    const regDate = (taxpayerData.rgdt || taxpayerData.registration_date) as string | undefined;

    if (status.includes("cancelled") || status.includes("suspended")) {
      score = 20;
      gaps.push({ type: "gst_status_critical", description: "GST registration is Cancelled or Suspended.", severity: "critical" });
    } else if (status.includes("inactive")) {
      score -= 30;
      gaps.push({ type: "gst_inactive", description: "GST registration is Inactive.", severity: "high" });
    }

    // Age bonus — older companies have more history to evaluate
    if (regDate) {
      const parts = regDate.split("/");
      const regYear = parts.length === 3 ? parseInt(parts[2]) : 0;
      const age = new Date().getFullYear() - regYear;
      if (age >= 3) score = Math.min(score, 85); // Can't give full score without history
      else score = Math.min(score, 90);
    }

    // Composition taxpayers have simpler requirements
    if (taxpayerType.includes("composition")) {
      gaps.push({ type: "info", description: "Composition taxpayer — simplified filing requirements.", severity: "low" });
    }

    gaps.push({
      type: "info",
      description: "Connect SANDBOX_API_KEY for full 24-month filing history analysis.",
      severity: "low",
    });

    return { score: Math.max(0, Math.min(100, score)), totalDue: 0, onTime: 0, late: 0, missing: 0, gaps, method: "taxpayer_data_only" };
  }

  // ── CASE 3: No data at all ────────────────────────────────────────────────
  gaps.push({
    type: "info",
    description: "GSTIN verification did not return data from the GST Portal. Please verify the GSTIN is correct.",
    severity: "medium",
  });
  return { score: 50, totalDue: 0, onTime: 0, late: 0, missing: 0, gaps, method: "minimal" };
}

// ── Route: trigger ────────────────────────────────────────────────────────────
async function handleTrigger(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  const { job_id, company_id } = await req.json();

  const db = getServiceClient();

  // Find the job — either by direct job_id or latest pending job for company
  let jobQuery = db.from("regulatory_sync_jobs").select("*");
  if (job_id) jobQuery = jobQuery.eq("id", job_id);
  else if (company_id) jobQuery = jobQuery.eq("company_id", company_id).eq("status", "pending").order("created_at", { ascending: false }).limit(1);
  else return json(400, { error: "job_id or company_id required" });

  const { data: jobs } = await jobQuery;
  const job = Array.isArray(jobs) ? jobs[0] : jobs;
  if (!job) return json(404, { error: "Sync job not found" });
  if (job.ca_user_id !== user.id) return json(403, { error: "Forbidden" });
  if (job.status === "running") return json(200, { message: "Already running", job_id: job.id });

  // Mark as running
  await db.from("regulatory_sync_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id);
  await db.from("companies")
    .update({ sync_status: "syncing" })
    .eq("id", job.company_id);

  // ── Async: Run the actual sync (don't await — return immediately to client) ──
  runSync(db, job).catch(console.error);

  return json(200, { success: true, job_id: job.id, message: "Sync started" });
}

async function runSync(db: ReturnType<typeof getServiceClient>, job: Record<string, string | null>) {
  try {
    // 1. Fetch government data
    const [taxpayerData, filingHistory, mcaData] = await Promise.all([
      job.gstin ? fetchGSTTaxpayer(job.gstin) : Promise.resolve(null),
      job.gstin ? fetchGSTFilingHistory(job.gstin) : Promise.resolve(null),
      job.cin   ? fetchMCAData(job.cin)           : Promise.resolve(null),
    ]);

    // 2. Compute score
    const result = computeScore(taxpayerData, filingHistory, mcaData);

    // 3. Write results back to sync job
    await db.from("regulatory_sync_jobs").update({
      status:              "completed",
      completed_at:        new Date().toISOString(),
      gst_taxpayer_data:   taxpayerData,
      gst_filings_data:    filingHistory ? { rows: filingHistory } : null,
      mca_company_data:    mcaData,
      compliance_score:    result.score,
      total_returns_due:   result.totalDue,
      total_filed_on_time: result.onTime,
      total_filed_late:    result.late,
      total_missing:       result.missing,
      gaps_found:          result.gaps,
    }).eq("id", job.id);

    // 4. Update company record
    if (job.company_id) {
      await db.from("companies").update({
        compliance_health: result.score,
        sync_status:       "synced",
        last_synced_at:    new Date().toISOString(),
        compliance_gaps:   result.gaps,
      }).eq("id", job.company_id);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    await db.from("regulatory_sync_jobs").update({ status: "failed", error_message: msg }).eq("id", job.id);
    if (job.company_id) await db.from("companies").update({ sync_status: "failed" }).eq("id", job.company_id);
  }
}

// ── Route: status ─────────────────────────────────────────────────────────────
async function handleStatus(req: Request, url: URL): Promise<Response> {
  const user = await getAuthUser(req);
  const companyId = url.searchParams.get("company_id");
  const jobId     = url.searchParams.get("job_id");
  if (!companyId && !jobId) return json(400, { error: "company_id or job_id required" });

  const db = getServiceClient();
  let q = db.from("regulatory_sync_jobs")
    .select("id,status,compliance_score,total_returns_due,total_filed_on_time,total_filed_late,total_missing,gaps_found,error_message,completed_at,started_at,created_at")
    .eq("ca_user_id", user.id);

  if (jobId)     q = q.eq("id", jobId);
  else if (companyId) q = q.eq("company_id", companyId).order("created_at", { ascending: false }).limit(1);

  const { data } = await q;
  const job = Array.isArray(data) ? data[0] : data;
  if (!job) return json(404, { error: "No sync job found" });
  return json(200, { success: true, ...job });
}

// ── Main ──────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "trigger" && req.method === "POST") return await handleTrigger(req);
    if (action === "status"  && req.method === "GET")  return await handleStatus(req, url);
    return json(404, { error: "Unknown action. Use: trigger | status" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg === "Unauthorized") return json(401, { error: "Unauthorized" });
    return json(500, { error: msg });
  }
});
