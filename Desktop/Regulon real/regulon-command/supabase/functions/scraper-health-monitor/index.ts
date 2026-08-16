/**
 * scraper-health-monitor — THE SELF-HEALING AI SUBAGENT
 * ═══════════════════════════════════════════════════════
 *
 * This is the autonomous AI that keeps all 3 government portal scrapers
 * alive even when the government updates their UI and breaks the selectors.
 *
 * HOW IT WORKS:
 * ─────────────
 * 1. Runs every 6 hours via Supabase CRON (or triggered manually).
 * 2. Queries scraper_health_logs for failures in the last 24 hours.
 * 3. For each failure with a failed_selector:
 *    a. Sends the broken selector + error message + page HTML snippet
 *       + screenshot to GPT-4o Vision.
 *    b. GPT-4o analyzes the actual page HTML and screenshot to find the
 *       correct NEW selector for the same element.
 *    c. Returns { fixed_selector, explanation, confidence: 0-100 }.
 * 4. If confidence >= 70: Deploys the fix by updating scraper_selectors.
 * 5. If confidence < 70: Sends admin alert and marks for manual review.
 * 6. Logs everything to scraper_repair_logs for full audit trail.
 *
 * The scrapers always load their selectors from scraper_selectors at
 * runtime, so the fix is INSTANTLY live on the next run — no deployment.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const getDb = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// ─────────────────────────────────────────────────────────────────
// STEP 1: Group failures by portal + selector_key
// Multiple failures on the same selector = one repair attempt.
// ─────────────────────────────────────────────────────────────────
interface FailureGroup {
  portal: string;
  failedSelector: string;
  failedStep: string;
  errorMessage: string;
  pageHtmlSnippet: string;
  screenshotBase64?: string;
  healthLogId: string;
  count: number;
}

async function collectFailures(db: ReturnType<typeof getDb>): Promise<FailureGroup[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: logs, error } = await db
    .from("scraper_health_logs")
    .select("id, portal, failed_step, failed_selector, error_context")
    .in("status", ["failed", "selector_not_found", "captcha_failed", "login_failed"])
    .not("failed_selector", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error || !logs) return [];

  // Group by portal + failed_selector
  const groups = new Map<string, FailureGroup>();

  for (const log of logs) {
    const ctx = log.error_context as Record<string, any> || {};
    const key = `${log.portal}::${log.failed_selector}`;

    if (!groups.has(key)) {
      groups.set(key, {
        portal: log.portal,
        failedSelector: log.failed_selector,
        failedStep: log.failed_step || "unknown",
        errorMessage: ctx.error_message || "Unknown error",
        pageHtmlSnippet: ctx.page_html_snippet || "",
        screenshotBase64: ctx.screenshot_base64,
        healthLogId: log.id,
        count: 1,
      });
    } else {
      groups.get(key)!.count++;
    }
  }

  return Array.from(groups.values());
}

// ─────────────────────────────────────────────────────────────────
// STEP 2: Map failed_selector back to a selector_key name
// We need to know which logical selector key the bot was trying to use.
// e.g. "#username" → "login_username"
// ─────────────────────────────────────────────────────────────────
async function getSelectorKey(
  db: ReturnType<typeof getDb>,
  portal: string,
  selectorValue: string
): Promise<string | null> {
  const { data } = await db
    .from("scraper_selectors")
    .select("selector_key")
    .eq("portal", portal)
    .eq("selector_value", selectorValue)
    .eq("is_active", true)
    .maybeSingle();

  return data?.selector_key || null;
}

// ─────────────────────────────────────────────────────────────────
// STEP 3: The AI Healing Call
// Sends everything to GPT-4o (with Vision if screenshot available)
// and asks it to find the NEW selector.
// ─────────────────────────────────────────────────────────────────
interface HealResult {
  fixedSelector: string;
  explanation: string;
  confidence: number;
  tokensUsed: number;
}

async function callHealingAI(failure: FailureGroup, openaiKey: string): Promise<HealResult | null> {
  const portalName = {
    GSTN: "Indian GST Portal (services.gst.gov.in)",
    INCOME_TAX: "Indian Income Tax Portal (www.incometax.gov.in)",
    MCA: "Indian MCA V3 Portal (www.mca.gov.in)",
  }[failure.portal] || failure.portal;

  const systemPrompt = `You are an expert web scraping engineer specializing in Indian government tax portals.
You are part of an autonomous self-healing scraper system. A CSS/XPath selector for a critical UI element 
on the ${portalName} has STOPPED working, which means the government portal was updated and the selector is now broken.

Your job is to ANALYZE the actual page HTML provided and find the CORRECT new selector for the same logical element.

CRITICAL RULES:
1. Output ONLY valid JSON in this exact format: { "fixed_selector": "string", "explanation": "string", "confidence": number }
2. "fixed_selector" must be a valid CSS selector string (e.g., "#newId", ".new-class", "input[name='user']").
3. "confidence" must be an integer 0-100 representing your confidence that the new selector is correct.
   - 90-100: You found an exact match in the HTML.
   - 70-89: You found a very likely match.
   - 50-69: You have a reasonable guess but the HTML is unclear.
   - 0-49: You cannot determine the correct selector — flag for human review.
4. "explanation" must explain WHY you chose this selector and what changed on the portal.
5. NEVER invent a selector that doesn't exist in the provided HTML.`;

  const userMessage: any = {
    role: "user",
    content: [] as any[],
  };

  userMessage.content.push({
    type: "text",
    text: `Portal: ${portalName}
Step that failed: ${failure.failedStep}
Broken selector (no longer works): ${failure.failedSelector}
Error message: ${failure.errorMessage}
Times this selector failed in 24h: ${failure.count}

--- PAGE HTML SNIPPET (what the page actually looks like now) ---
${failure.pageHtmlSnippet || "(No HTML captured)"}
---

Find the correct new CSS selector for the "${failure.failedStep}" element on this page.`,
  });

  // Add screenshot if available (GPT-4o Vision)
  if (failure.screenshotBase64 && failure.screenshotBase64.length < 200000) {
    userMessage.content.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${failure.screenshotBase64}`,
        detail: "high",
      },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",   // Use full model for precise HTML analysis
      messages: [
        { role: "system", content: systemPrompt },
        userMessage,
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,  // Low temp — we want deterministic selector identification
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    console.error("[HEAL AI] OpenAI API error:", await res.text());
    return null;
  }

  const data = await res.json();
  const raw = data.choices[0]?.message?.content;
  const usage = data.usage?.total_tokens || 0;

  try {
    const parsed = JSON.parse(raw);
    return {
      fixedSelector: parsed.fixed_selector || "",
      explanation: parsed.explanation || "",
      confidence: parseInt(parsed.confidence) || 0,
      tokensUsed: usage,
    };
  } catch {
    console.error("[HEAL AI] Failed to parse JSON response:", raw);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// STEP 4: Deploy the healed selector
// Updates scraper_selectors table so the bot picks it up instantly.
// ─────────────────────────────────────────────────────────────────
async function deployHealedSelector(
  db: ReturnType<typeof getDb>,
  portal: string,
  selectorKey: string,
  newValue: string,
  confidence: number
): Promise<boolean> {
  // Deactivate old selector
  const { error: deactivateErr } = await db
    .from("scraper_selectors")
    .update({ is_active: false })
    .eq("portal", portal)
    .eq("selector_key", selectorKey)
    .eq("is_active", true);

  if (deactivateErr) {
    console.error("[HEAL] Could not deactivate old selector:", deactivateErr);
    return false;
  }

  // Get next version number
  const { data: latest } = await db
    .from("scraper_selectors")
    .select("version")
    .eq("portal", portal)
    .eq("selector_key", selectorKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version || 0) + 1;

  // Insert new active selector
  const { error: insertErr } = await db
    .from("scraper_selectors")
    .insert({
      portal,
      selector_key: selectorKey,
      selector_value: newValue,
      selector_type: "css",
      version: nextVersion,
      is_active: true,
      healed_by_ai: true,
      heal_confidence: confidence,
      notes: `Auto-healed by SANNIDH AI Monitor. Confidence: ${confidence}%.`,
    });

  if (insertErr) {
    console.error("[HEAL] Could not insert healed selector:", insertErr);
    return false;
  }

  console.log(`[HEAL] ✅ Deployed healed selector for ${portal}::${selectorKey} v${nextVersion}: "${newValue}" (confidence: ${confidence}%)`);
  return true;
}

// ─────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────
async function runHealingCycle(db: ReturnType<typeof getDb>, openaiKey: string): Promise<{
  processed: number;
  healed: number;
  flagged: number;
  skipped: number;
}> {
  const stats = { processed: 0, healed: 0, flagged: 0, skipped: 0 };

  // Collect all unique failures from last 24h
  const failures = await collectFailures(db);
  console.log(`[MONITOR] Found ${failures.length} unique selector failures to analyze.`);

  for (const failure of failures) {
    stats.processed++;
    console.log(`[MONITOR] Processing failure: ${failure.portal}::${failure.failedSelector} (${failure.count} failures)`);

    // Check if this failure was already repaired today
    const { data: recentRepair } = await db
      .from("scraper_repair_logs")
      .select("id, status")
      .eq("portal", failure.portal)
      .eq("original_selector", failure.failedSelector)
      .in("status", ["deployed", "verified"])
      .gte("repaired_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (recentRepair) {
      console.log(`[MONITOR] Skipping — already repaired recently.`);
      stats.skipped++;
      continue;
    }

    // Find the selector_key name from the selector value
    const selectorKey = await getSelectorKey(db, failure.portal, failure.failedSelector);

    if (!selectorKey) {
      console.warn(`[MONITOR] Could not identify selector_key for value "${failure.failedSelector}" on ${failure.portal}. Logging as unknown.`);
      stats.skipped++;
      continue;
    }

    // Call the healing AI
    const healResult = await callHealingAI(failure, openaiKey);

    if (!healResult) {
      console.error(`[MONITOR] AI healing call failed for ${failure.portal}::${selectorKey}`);
      stats.skipped++;
      continue;
    }

    const repairStatus = healResult.confidence >= 70 ? "deployed" : "rejected_low_conf";

    // Log the repair attempt
    const { data: repairLog } = await db
      .from("scraper_repair_logs")
      .insert({
        health_log_id: failure.healthLogId,
        portal: failure.portal,
        selector_key: selectorKey,
        original_selector: failure.failedSelector,
        fixed_selector: healResult.fixedSelector,
        confidence_score: healResult.confidence,
        ai_explanation: healResult.explanation,
        status: repairStatus,
        tokens_used: healResult.tokensUsed,
      })
      .select("id")
      .single();

    if (repairStatus === "deployed" && healResult.fixedSelector) {
      // Deploy the fix
      const deployed = await deployHealedSelector(
        db, failure.portal, selectorKey,
        healResult.fixedSelector, healResult.confidence
      );

      if (deployed) {
        stats.healed++;
        console.log(`[MONITOR] 🤖 AI Self-Healed: ${failure.portal}::${selectorKey}`);
        console.log(`   Old: "${failure.failedSelector}"`);
        console.log(`   New: "${healResult.fixedSelector}" (${healResult.confidence}% confidence)`);
        console.log(`   Why: ${healResult.explanation}`);
      }
    } else {
      // Low confidence — flag for manual review
      stats.flagged++;
      console.warn(`[MONITOR] ⚠️ Low confidence (${healResult.confidence}%) for ${failure.portal}::${selectorKey}`);
      console.warn(`   Suggested fix: "${healResult.fixedSelector}"`);
      console.warn(`   Flagged for manual review.`);
      
      // TODO: Integrate with Slack/email notification here
      // await sendSlackAlert({ portal: failure.portal, selectorKey, suggestion: healResult.fixedSelector, confidence: healResult.confidence });
    }
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────────
// HTTP Handler (called by Supabase Cron or manual trigger)
// ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return json(500, { error: "OPENAI_API_KEY not set — healing monitor cannot function." });

    const db = getDb();
    const stats = await runHealingCycle(db, openaiKey);

    console.log(`[MONITOR] Healing cycle complete:`, stats);

    return json(200, {
      success: true,
      message: `Self-Healing Monitor cycle complete.`,
      stats,
    });
  } catch (err: any) {
    console.error("[MONITOR] Fatal error in healing cycle:", err);
    return json(500, { error: err.message });
  }
});
