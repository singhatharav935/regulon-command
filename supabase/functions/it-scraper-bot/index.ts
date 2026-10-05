/**
 * it-scraper-bot — NEW: Income Tax Portal Scraper
 * ════════════════════════════════════════════════
 * Self-Healing Headless Scraper for Income Tax Portal
 * https://www.incometax.gov.in
 *
 * Scrapes: Outstanding Tax Demands, Notices under Section 143(1),
 *          148 scrutiny notices, 245 adjustment notices.
 *
 * Architecture mirrors gst-scraper-bot with portal-specific selectors.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

// Load active IT portal selectors from the versioned DB store
async function loadSelectors(db: ReturnType<typeof getDb>): Promise<Record<string, string>> {
  const { data, error } = await db
    .from("scraper_selectors")
    .select("selector_key, selector_value")
    .eq("portal", "INCOME_TAX")
    .eq("is_active", true);

  if (error || !data || data.length === 0) {
    return {
      login_pan_input:       "#userId",
      login_continue_btn:    "#continue",
      login_password:        "#passwordField",
      captcha_img:           ".captcha-img img",
      captcha_input:         "#captchaText",
      login_submit:          "#loginBtn",
      pending_actions_link:  'a[href*="pending-actions"]',
      notice_table_row:      ".outstanding-table tbody tr",
      notice_ref_cell:       "td:nth-child(1)",
      notice_type_cell:      "td:nth-child(2)",
      notice_amount_cell:    "td:nth-child(3)",
      notice_date_cell:      "td:nth-child(4)",
      notice_download_link:  "a.download-notice",
    };
  }

  return Object.fromEntries(data.map((r: any) => [r.selector_key, r.selector_value]));
}

// OCR CAPTCHA solver — same GPT-4o-mini Vision approach as GST bot
async function solveCaptchaOCR(page: any, captchaImgSel: string, maxAttempts = 3): Promise<string | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY missing.");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const captchaEl = await page.$(captchaImgSel);
      if (!captchaEl) return null;

      const src: string = await page.evaluate((el: HTMLImageElement) => el.src, captchaEl);
      let b64 = "";
      if (src.startsWith("data:image")) {
        b64 = src.split(",")[1];
      } else {
        const r = await fetch(src);
        const buf = await r.arrayBuffer();
        b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "This is an Indian government Income Tax portal CAPTCHA. Output ONLY the alphanumeric characters visible, no spaces, no explanation." },
              { type: "image_url", image_url: { url: `data:image/png;base64,${b64}`, detail: "high" } },
            ],
          }],
          max_tokens: 20,
          temperature: 0,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const text = (data.choices[0]?.message?.content || "").trim().replace(/\s+/g, "");
      if (text.length >= 4 && text.length <= 8) return text;

      if (attempt < maxAttempts) {
        await captchaEl.click();
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (e) {
      console.error(`[IT OCR] Attempt ${attempt} failed:`, e);
    }
  }
  return null;
}

async function logRun(db: ReturnType<typeof getDb>, runId: string, companyId: string, caUserId: string, data: any) {
  await db.from("scraper_health_logs").insert({
    run_id: runId, portal: "INCOME_TAX",
    company_id: companyId, ca_user_id: caUserId,
    ...data,
  });
}

async function captureErrorCtx(page: any, sel: string, msg: string): Promise<Record<string, unknown>> {
  try {
    const html: string = await page.evaluate(() => document.body.innerHTML.substring(0, 8000));
    const ss: Uint8Array = await page.screenshot({ type: "png", encoding: "binary" });
    const b64 = btoa(String.fromCharCode(...ss));
    return { error_message: msg, failed_selector: sel, page_url: page.url(), page_html_snippet: html, screenshot_base64: b64 };
  } catch {
    return { error_message: msg, failed_selector: sel };
  }
}

async function scrapeITPortal(
  db: ReturnType<typeof getDb>,
  company: { id: string; ca_user_id: string; pan: string; name: string },
  sel: Record<string, string>
): Promise<{ success: boolean; noticesFound: number; error?: string }> {
  const runId = crypto.randomUUID();
  const startTime = Date.now();
  let browser: any = null;
  let page: any = null;

  // Fetch stored credentials (IT portal uses PAN as username)
  const { data: creds } = await db
    .from("client_portal_credentials")
    .select("username, encrypted_password")
    .eq("company_id", company.id)
    .eq("portal_type", "INCOME_TAX")
    .maybeSingle();

  if (!creds) {
    await logRun(db, runId, company.id, company.ca_user_id, {
      status: "failed", failedStep: "credentials_fetch",
      error_context: { error_message: "Income Tax portal credentials not found." },
    });
    return { success: false, noticesFound: 0, error: "IT portal credentials not found." };
  }

  const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
  if (!browserlessKey) return { success: false, noticesFound: 0, error: "BROWSERLESS_API_KEY not set." };

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessKey}&timeout=120000`,
    });
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1366, height: 768 });

    // Navigate to IT portal
    console.log(`[IT BOT] Navigating to IT Portal for PAN: ${company.pan}`);
    await page.goto("https://www.incometax.gov.in/iec/foportal/", { waitUntil: "networkidle2", timeout: 60000 });

    // Enter PAN
    try {
      await page.waitForSelector(sel.login_pan_input, { timeout: 15000 });
    } catch {
      const ctx = await captureErrorCtx(page, sel.login_pan_input, "PAN input field not found.");
      await logRun(db, runId, company.id, company.ca_user_id, {
        status: "selector_not_found", failedStep: "login_pan", failed_selector: sel.login_pan_input,
        error_context: ctx, duration_ms: Date.now() - startTime,
      });
      return { success: false, noticesFound: 0, error: "PAN input selector not found on IT portal." };
    }

    await page.click(sel.login_pan_input);
    await page.type(sel.login_pan_input, creds.username, { delay: 80 });
    await page.click(sel.login_continue_btn);
    await new Promise(r => setTimeout(r, 2000));

    // Enter password
    await page.waitForSelector(sel.login_password, { timeout: 10000 });
    await page.type(sel.login_password, creds.encrypted_password, { delay: 60 });

    // Solve CAPTCHA
    const captchaText = await solveCaptchaOCR(page, sel.captcha_img, 3);
    if (captchaText) {
      await page.click(sel.captcha_input);
      await page.type(sel.captcha_input, captchaText, { delay: 50 });
    }

    await page.click(sel.login_submit);

    // Wait for post-login navigation
    try {
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 25000 });
    } catch {
      const ctx = await captureErrorCtx(page, sel.login_submit, "Post-login navigation timeout.");
      await logRun(db, runId, company.id, company.ca_user_id, {
        status: "login_failed", failedStep: "post_login_navigation",
        error_context: ctx, duration_ms: Date.now() - startTime,
      });
      return { success: false, noticesFound: 0, error: "IT portal login failed." };
    }

    console.log(`[IT BOT] Login success. Navigating to pending actions / notices...`);

    // Navigate to Notices / Pending Actions
    try {
      await page.waitForSelector(sel.pending_actions_link, { timeout: 10000 });
      await page.click(sel.pending_actions_link);
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 });
    } catch {
      // Try direct URL
      await page.goto("https://www.incometax.gov.in/iec/foportal/pages/pending-actions/outstanding-demand", {
        waitUntil: "networkidle2", timeout: 30000
      });
    }

    // Extract notices
    let notices: any[] = [];
    try {
      await page.waitForSelector(sel.notice_table_row, { timeout: 15000 });
      notices = await page.evaluate(
        (rowSel: string, refSel: string, typeSel: string, amtSel: string, dateSel: string, dlSel: string) => {
          return Array.from(document.querySelectorAll(rowSel)).map(row => ({
            reference: row.querySelector(refSel)?.textContent?.trim() || "",
            type: row.querySelector(typeSel)?.textContent?.trim() || "",
            amount: row.querySelector(amtSel)?.textContent?.trim() || "",
            issueDate: row.querySelector(dateSel)?.textContent?.trim() || "",
            downloadUrl: (row.querySelector(dlSel) as HTMLAnchorElement)?.href || "",
          })).filter(n => n.reference);
        },
        sel.notice_table_row, sel.notice_ref_cell, sel.notice_type_cell,
        sel.notice_amount_cell, sel.notice_date_cell, sel.notice_download_link
      );
    } catch {
      console.log(`[IT BOT] No notices table found for ${company.name}.`);
    }

    // Store new notices
    let newNoticesCount = 0;
    for (const notice of notices) {
      const { data: existing } = await db.from("client_govt_notices")
        .select("id").eq("company_id", company.id).eq("notice_number", notice.reference).maybeSingle();

      if (!existing) {
        await db.from("client_govt_notices").insert({
          company_id: company.id,
          ca_user_id: company.ca_user_id,
          department: "Income Tax",
          notice_type: notice.type || "Income Tax Notice",
          notice_number: notice.reference,
          issue_date: notice.issueDate || new Date().toISOString().split("T")[0],
          raw_text_content: `Income Tax Portal notice. Type: ${notice.type}. Demand Amount: ${notice.amount}`,
          financial_year: "2024-25",
          status: "detected",
        });
        newNoticesCount++;
      }
    }

    await logRun(db, runId, company.id, company.ca_user_id, {
      status: "success",
      notices_found: newNoticesCount,
      duration_ms: Date.now() - startTime,
    });

    return { success: true, noticesFound: newNoticesCount };

  } catch (err: any) {
    const ctx = page ? await captureErrorCtx(page, "unknown", err.message) : { error_message: err.message };
    await logRun(db, runId, company.id, company.ca_user_id, {
      status: "failed", failedStep: "unexpected_error",
      error_context: ctx, duration_ms: Date.now() - startTime,
    });
    return { success: false, noticesFound: 0, error: err.message };
  } finally {
    if (browser) try { await browser.close(); } catch { /* ignore */ }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { company_id } = await req.json();
    if (!company_id) return json(400, { error: "company_id is required" });

    const db = getDb();
    const sel = await loadSelectors(db);

    const { data: company } = await db.from("companies")
      .select("id, ca_user_id, pan, name")
      .eq("id", company_id).single();

    if (!company) return json(404, { error: "Company not found" });
    if (!company.pan) return json(400, { error: "Company has no PAN registered" });

    const result = await scrapeITPortal(db, company, sel);
    return json(result.success ? 200 : 422, result);
  } catch (err: any) {
    return json(500, { error: err.message });
  }
});
