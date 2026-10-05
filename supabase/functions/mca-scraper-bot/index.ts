/**
 * mca-scraper-bot — NEW: MCA V3 Portal Scraper
 * ═════════════════════════════════════════════
 * Self-Healing Headless Scraper for Ministry of Corporate Affairs Portal
 * https://www.mca.gov.in
 *
 * Scrapes: Show Cause Notices, filing defaults, director DIN violations,
 *          company filing status (AOC-4, MGT-7, MGT-14 etc.)
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

async function loadSelectors(db: ReturnType<typeof getDb>): Promise<Record<string, string>> {
  const { data, error } = await db
    .from("scraper_selectors")
    .select("selector_key, selector_value")
    .eq("portal", "MCA").eq("is_active", true);

  if (error || !data || data.length === 0) {
    return {
      login_username:        "#userId",
      login_password:        "#userPassword",
      captcha_img:           'img[alt="captcha"]',
      captcha_input:         "#captchaText",
      login_submit:          'button[type="submit"]',
      my_workspace_link:     'a[href*="workspace"]',
      show_cause_notice_tab: 'a[href*="show-cause"]',
      notice_table_row:      "table.notice-list tbody tr",
      notice_ref_cell:       "td:nth-child(1)",
      notice_type_cell:      "td:nth-child(2)",
      notice_date_cell:      "td:nth-child(3)",
      notice_download_link:  "td a",
    };
  }

  return Object.fromEntries(data.map((r: any) => [r.selector_key, r.selector_value]));
}

async function solveCaptchaOCR(page: any, captchaImgSel: string): Promise<string | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY missing.");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const el = await page.$(captchaImgSel);
      if (!el) return null;

      const src: string = await page.evaluate((e: HTMLImageElement) => e.src, el);
      let b64 = "";
      if (src.startsWith("data:")) {
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
              { type: "text", text: "This is an Indian government MCA portal CAPTCHA. Output ONLY the alphanumeric characters visible, no spaces, no explanation." },
              { type: "image_url", image_url: { url: `data:image/png;base64,${b64}`, detail: "high" } },
            ],
          }],
          max_tokens: 20, temperature: 0,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const text = (data.choices[0]?.message?.content || "").trim().replace(/\s+/g, "");
      if (text.length >= 4 && text.length <= 8) return text;

      if (attempt < 3) { await el.click(); await new Promise(r => setTimeout(r, 1500)); }
    } catch (e) { console.error(`[MCA OCR] Attempt ${attempt}:`, e); }
  }
  return null;
}

async function logRun(db: ReturnType<typeof getDb>, runId: string, companyId: string, caUserId: string, data: any) {
  await db.from("scraper_health_logs").insert({ run_id: runId, portal: "MCA", company_id: companyId, ca_user_id: caUserId, ...data });
}

async function captureCtx(page: any, sel: string, msg: string): Promise<Record<string, unknown>> {
  try {
    const html: string = await page.evaluate(() => document.body.innerHTML.substring(0, 8000));
    const ss: Uint8Array = await page.screenshot({ type: "png", encoding: "binary" });
    return { error_message: msg, failed_selector: sel, page_url: page.url(), page_html_snippet: html, screenshot_base64: btoa(String.fromCharCode(...ss)) };
  } catch { return { error_message: msg, failed_selector: sel }; }
}

async function scrapeMCAPortal(
  db: ReturnType<typeof getDb>,
  company: { id: string; ca_user_id: string; cin: string; name: string },
  sel: Record<string, string>
): Promise<{ success: boolean; noticesFound: number; error?: string }> {
  const runId = crypto.randomUUID();
  const startTime = Date.now();
  let browser: any = null;
  let page: any = null;

  const { data: creds } = await db
    .from("client_portal_credentials")
    .select("username, encrypted_password")
    .eq("company_id", company.id).eq("portal_type", "MCA").maybeSingle();

  if (!creds) {
    await logRun(db, runId, company.id, company.ca_user_id, {
      status: "failed", failedStep: "credentials_fetch",
      error_context: { error_message: "MCA credentials not found." },
    });
    return { success: false, noticesFound: 0, error: "MCA portal credentials not found." };
  }

  const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
  if (!browserlessKey) return { success: false, noticesFound: 0, error: "BROWSERLESS_API_KEY not set." };

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessKey}&timeout=120000`,
    });
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[MCA BOT] Navigating to MCA portal for CIN: ${company.cin}`);
    await page.goto("https://www.mca.gov.in/content/mca/global/en/home.html", { waitUntil: "networkidle2", timeout: 60000 });

    // Find and click Login link
    try {
      await page.waitForSelector(sel.login_username, { timeout: 20000 });
    } catch {
      // MCA portal may have a separate login page - try direct URL
      await page.goto("https://efiling.mca.gov.in/efilingui/login", { waitUntil: "networkidle2", timeout: 30000 });
      try { await page.waitForSelector(sel.login_username, { timeout: 10000 }); } catch {
        const ctx = await captureCtx(page, sel.login_username, "MCA login form not found.");
        await logRun(db, runId, company.id, company.ca_user_id, {
          status: "selector_not_found", failedStep: "login_form",
          failed_selector: sel.login_username, error_context: ctx, duration_ms: Date.now() - startTime,
        });
        return { success: false, noticesFound: 0, error: "MCA portal login selector not found." };
      }
    }

    await page.click(sel.login_username);
    await page.type(sel.login_username, creds.username, { delay: 70 });
    await page.type(sel.login_password, creds.encrypted_password, { delay: 55 });

    const captchaText = await solveCaptchaOCR(page, sel.captcha_img);
    if (captchaText) {
      await page.click(sel.captcha_input);
      await page.type(sel.captcha_input, captchaText, { delay: 50 });
    }

    await page.click(sel.login_submit);

    try {
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 25000 });
    } catch {
      const ctx = await captureCtx(page, sel.login_submit, "MCA post-login timeout.");
      await logRun(db, runId, company.id, company.ca_user_id, {
        status: "login_failed", failedStep: "post_login", error_context: ctx, duration_ms: Date.now() - startTime,
      });
      return { success: false, noticesFound: 0, error: "MCA portal login failed." };
    }

    console.log(`[MCA BOT] Login success. Navigating to workspace...`);

    // Navigate to company workspace
    try {
      await page.waitForSelector(sel.my_workspace_link, { timeout: 10000 });
      await page.click(sel.my_workspace_link);
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 });
    } catch {
      await page.goto(`https://efiling.mca.gov.in/efilingui/company/showCause?cin=${company.cin}`, { waitUntil: "networkidle2", timeout: 30000 });
    }

    // Click Show Cause Notice tab
    try {
      const showCauseTab = await page.$(sel.show_cause_notice_tab);
      if (showCauseTab) {
        await showCauseTab.click();
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch {
      console.log("[MCA BOT] Show cause tab not found, continuing with main page...");
    }

    // Extract notices
    let notices: any[] = [];
    try {
      await page.waitForSelector(sel.notice_table_row, { timeout: 15000 });
      notices = await page.evaluate(
        (rowSel: string, refSel: string, typeSel: string, dateSel: string, dlSel: string) => {
          return Array.from(document.querySelectorAll(rowSel)).map(row => ({
            reference: row.querySelector(refSel)?.textContent?.trim() || "",
            type: row.querySelector(typeSel)?.textContent?.trim() || "",
            issueDate: row.querySelector(dateSel)?.textContent?.trim() || "",
            downloadUrl: (row.querySelector(dlSel) as HTMLAnchorElement)?.href || "",
          })).filter(n => n.reference);
        },
        sel.notice_table_row, sel.notice_ref_cell, sel.notice_type_cell, sel.notice_date_cell, sel.notice_download_link
      );
    } catch {
      console.log(`[MCA BOT] No notices table found for ${company.name}.`);
    }

    // Also check filing defaults (overdue forms)
    let filingDefaults: any[] = [];
    try {
      // Navigate to filing status page for the company CIN
      await page.goto(`https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html?cin=${company.cin}`, {
        waitUntil: "networkidle2", timeout: 30000
      });
      // Extract overdue filing status from the company master data page
      const overdueText: string = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll("td"));
        const overdueCells = cells.filter(td => 
          td.textContent?.includes("Overdue") || td.textContent?.includes("Due")
        );
        return overdueCells.map(td => td.textContent?.trim()).join(" | ");
      });

      if (overdueText && overdueText.length > 5) {
        filingDefaults.push({
          reference: `MCA-FILING-${company.cin.substring(0, 6)}-${Date.now().toString().slice(-4)}`,
          type: "Filing Default Notice",
          issueDate: new Date().toISOString().split("T")[0],
          description: overdueText.substring(0, 500),
        });
      }
    } catch {
      console.log("[MCA BOT] Could not check filing defaults.");
    }

    // Merge all notices + filing defaults
    const allNotices = [...notices, ...filingDefaults];
    let newNoticesCount = 0;

    for (const notice of allNotices) {
      const { data: existing } = await db.from("client_govt_notices")
        .select("id").eq("company_id", company.id).eq("notice_number", notice.reference).maybeSingle();

      if (!existing) {
        await db.from("client_govt_notices").insert({
          company_id: company.id,
          ca_user_id: company.ca_user_id,
          department: "MCA",
          notice_type: notice.type || "MCA Notice",
          notice_number: notice.reference,
          issue_date: notice.issueDate || new Date().toISOString().split("T")[0],
          raw_text_content: notice.description || `MCA Portal notice. Type: ${notice.type}. Reference: ${notice.reference}`,
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
    const ctx = page ? await captureCtx(page, "unknown", err.message) : { error_message: err.message };
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
      .select("id, ca_user_id, cin, name")
      .eq("id", company_id).single();

    if (!company) return json(404, { error: "Company not found" });
    if (!company.cin) return json(400, { error: "Company has no CIN registered" });

    const result = await scrapeMCAPortal(db, company, sel);
    return json(result.success ? 200 : 422, result);
  } catch (err: any) {
    return json(500, { error: err.message });
  }
});
