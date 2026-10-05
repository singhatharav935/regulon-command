/**
 * notice-detector — REAL PRODUCTION IMPLEMENTATION
 * ══════════════════════════════════════════════════
 * Autonomous Government Notice Detection Orchestrator
 *
 * This function runs every 6 hours via Supabase Cron Job.
 * For each client company, it dispatches the appropriate portal scraper bots
 * (GST, Income Tax, MCA) in parallel and collects results.
 *
 * Each bot writes directly to client_govt_notices on detection,
 * which fires a Postgres trigger → ai-drafting-engine (automatic draft generation).
 *
 * Processing is fully isolated: one client failing does NOT affect others.
 * Batched to 50 companies per cron run to stay within edge function timeouts.
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

const getDb = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// ─────────────────────────────────────────────────────────────────
// Invoke a single scraper bot via Supabase Edge Function invocation
// Uses the internal service URL — no external HTTP needed.
// ─────────────────────────────────────────────────────────────────
async function invokeScraper(
  scraperFunctionName: string,
  companyId: string,
  serviceKey: string,
  supabaseUrl: string
): Promise<{ success: boolean; noticesFound: number; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/${scraperFunctionName}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ company_id: companyId }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, noticesFound: 0, error: `HTTP ${res.status}: ${text.substring(0, 200)}` };
    }

    const data = await res.json();
    return {
      success: data.success || false,
      noticesFound: data.noticesFound || 0,
      error: data.error,
    };
  } catch (err: any) {
    return { success: false, noticesFound: 0, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────
// Process one company: determine which portals are registered,
// run the appropriate bots in parallel (max concurrency = 3 per company)
// ─────────────────────────────────────────────────────────────────
async function processCompany(
  db: ReturnType<typeof getDb>,
  company: { id: string; ca_user_id: string; name: string; cin?: string; gstin?: string; pan?: string },
  supabaseUrl: string,
  serviceKey: string
) {
  console.log(`[ORCHESTRATOR] Processing company: ${company.name} (${company.id})`);
  
  // Determine which portals have stored credentials for this company
  const { data: credentials } = await db
    .from("client_portal_credentials")
    .select("portal_type")
    .eq("company_id", company.id)
    .in("portal_type", ["GSTN", "INCOME_TAX", "MCA"]);

  const registeredPortals = new Set(credentials?.map((c: any) => c.portal_type) || []);
  
  // Build list of scrapers to run
  const scraperJobs: Array<{ name: string; fnName: string; portal: string }> = [];

  if (company.gstin && registeredPortals.has("GSTN")) {
    scraperJobs.push({ name: "GST Portal", fnName: "gst-scraper-bot", portal: "GSTN" });
  }
  if (company.pan && registeredPortals.has("INCOME_TAX")) {
    scraperJobs.push({ name: "Income Tax Portal", fnName: "it-scraper-bot", portal: "INCOME_TAX" });
  }
  if (company.cin && registeredPortals.has("MCA")) {
    scraperJobs.push({ name: "MCA Portal", fnName: "mca-scraper-bot", portal: "MCA" });
  }

  if (scraperJobs.length === 0) {
    console.log(`[ORCHESTRATOR] Skipping ${company.name} — no portal credentials registered.`);
    return { company: company.name, skipped: true };
  }

  // Run all applicable scrapers in parallel (with isolation)
  const results = await Promise.allSettled(
    scraperJobs.map(job =>
      invokeScraper(job.fnName, company.id, serviceKey, supabaseUrl).then(r => ({
        portal: job.portal,
        ...r,
      }))
    )
  );

  // Summarize
  let totalNew = 0;
  const portalResults: Record<string, any> = {};
  
  for (let i = 0; i < scraperJobs.length; i++) {
    const job = scraperJobs[i];
    const result = results[i];
    
    if (result.status === "fulfilled") {
      totalNew += result.value.noticesFound;
      portalResults[job.portal] = {
        success: result.value.success,
        noticesFound: result.value.noticesFound,
        error: result.value.error,
      };
    } else {
      portalResults[job.portal] = { success: false, error: result.reason?.message };
    }
  }

  // Update company's last_noticed_check timestamp
  await db
    .from("companies")
    .update({ last_noticed_at: new Date().toISOString() } as any)
    .eq("id", company.id);

  console.log(`[ORCHESTRATOR] ${company.name}: ${totalNew} new notices detected across ${scraperJobs.length} portals.`);
  
  return { company: company.name, totalNew, portals: portalResults };
}

// ─────────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const db = getDb();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const url = new URL(req.url);
    const manualCompanyId = url.searchParams.get("company_id");
    const manualPortal = url.searchParams.get("portal"); // Optional: run only one portal

    // Build query
    let query = db
      .from("companies")
      .select("id, ca_user_id, name, cin, gstin, pan");

    if (manualCompanyId) {
      // Manual trigger for a specific company
      query = query.eq("id", manualCompanyId);
    } else {
      // Cron mode: batch of 50, ordered by least recently checked
      query = query
        .order("last_noticed_at", { ascending: true, nullsFirst: true })
        .limit(50);
    }

    const { data: companies, error } = await query;
    if (error) throw error;
    if (!companies || companies.length === 0) {
      return json(200, { message: "No companies to process." });
    }

    console.log(`[ORCHESTRATOR] Starting notice detection for ${companies.length} companies...`);

    // Process all companies in parallel (isolated — one failure ≠ others fail)
    const companyResults = await Promise.allSettled(
      companies.map((company: any) => processCompany(db, company, supabaseUrl, serviceKey))
    );

    const summary = {
      total_companies: companies.length,
      processed: 0,
      total_new_notices: 0,
      skipped: 0,
      errors: 0,
    };

    for (const result of companyResults) {
      if (result.status === "fulfilled") {
        if (result.value.skipped) {
          summary.skipped++;
        } else {
          summary.processed++;
          summary.total_new_notices += result.value.totalNew || 0;
        }
      } else {
        summary.errors++;
      }
    }

    console.log(`[ORCHESTRATOR] Complete:`, summary);

    return json(200, {
      success: true,
      message: `Notice detection complete. ${summary.total_new_notices} new notices found across ${summary.processed} clients.`,
      summary,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[ORCHESTRATOR] Fatal error:", msg);
    return json(500, { error: msg });
  }
});
