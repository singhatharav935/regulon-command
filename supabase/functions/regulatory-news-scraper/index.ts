/**
 * regulatory-news-scraper Edge Function
 * ──────────────────────────────────────────────────────────────────────────────
 * Scrapes RSS feeds from real Indian government portals daily.
 * Enriches each item with OpenAI and saves to regulatory_news_feed table.
 *
 * Government Sources:
 *  - RBI (Reserve Bank of India)
 *  - MCA (Ministry of Corporate Affairs)
 *  - CBDT / Income Tax Department
 *  - SEBI (Securities & Exchange Board of India)
 *  - GST Council / CBIC
 *  - EPFO (Employees' Provident Fund Organization)
 *  - ESIC (Employees' State Insurance Corporation)
 *  - MEITY (Ministry of Electronics & IT)
 *  - Ministry of Finance
 *
 * Trigger: Called by a Supabase cron job daily at 6:00 AM IST
 * or manually via POST to this function.
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

// ── Government Portal RSS Feeds ───────────────────────────────────────────────
const GOVT_FEEDS = [
  {
    code: "RBI",
    name: "Reserve Bank of India",
    url: "https://www.rbi.org.in/Scripts/rss.aspx",
    fallbackUrl: "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx",
    icon: "🏦",
  },
  {
    code: "MCA",
    name: "Ministry of Corporate Affairs",
    url: "https://www.mca.gov.in/mcafoportal/rssFeed.do",
    fallbackUrl: "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/notifications.html",
    icon: "🏛️",
  },
  {
    code: "IT",
    name: "Income Tax Department",
    url: "https://www.incometaxindia.gov.in/pages/communications/notifications.aspx",
    fallbackUrl: "https://www.incometaxindia.gov.in/Communications/Notification/notification012025.pdf",
    icon: "📊",
  },
  {
    code: "SEBI",
    name: "Securities & Exchange Board of India",
    url: "https://www.sebi.gov.in/sebi_data/rss/sebi_press_release.xml",
    fallbackUrl: "https://www.sebi.gov.in/legal/circulars.html",
    icon: "📈",
  },
  {
    code: "GST",
    name: "GST Council / CBIC",
    url: "https://cbic-gst.gov.in/gst-news-letter.html",
    fallbackUrl: "https://tutorial.gst.gov.in/userguide/returns/index.htm",
    icon: "💰",
  },
  {
    code: "EPFO",
    name: "Employees Provident Fund Organization",
    url: "https://www.epfindia.gov.in/site_en/Updates.php",
    fallbackUrl: "https://www.epfindia.gov.in/site_en/Circulars.php",
    icon: "👥",
  },
  {
    code: "MEITY",
    name: "Ministry of Electronics & IT",
    url: "https://www.meity.gov.in/rss_feed",
    fallbackUrl: "https://www.meity.gov.in/content/notifications",
    icon: "💻",
  },
  {
    code: "MoF",
    name: "Ministry of Finance",
    url: "https://dea.gov.in/rss",
    fallbackUrl: "https://finmin.nic.in/press-releases",
    icon: "💵",
  },
  {
    code: "CBDT",
    name: "Central Board of Direct Taxes",
    url: "https://incometaxindia.gov.in/Communications/Circulars/circular012025.pdf",
    fallbackUrl: "https://www.incometaxindia.gov.in/pages/communications/circulars.aspx",
    icon: "📋",
  },
];

// ── RSS XML Parser (no external library needed) ───────────────────────────────
function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];

  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const itemXml = match[1];
    const title = (itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/si) ||
      itemXml.match(/<title[^>]*>(.*?)<\/title>/si))?.[1]?.trim() || "";
    const link = (itemXml.match(/<link[^>]*>(.*?)<\/link>/si))?.[1]?.trim() || "";
    const description = (itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/si) ||
      itemXml.match(/<description[^>]*>(.*?)<\/description>/si))?.[1]?.trim() || "";
    const pubDate = (itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/si))?.[1]?.trim() || new Date().toISOString();

    if (title) {
      items.push({ title, link, description: description.replace(/<[^>]+>/g, "").trim(), pubDate });
    }
  }

  return items;
}

// ── Fetch RSS feed with timeout ───────────────────────────────────────────────
async function fetchFeed(feed: typeof GOVT_FEEDS[0]): Promise<Array<{ title: string; link: string; description: string; pubDate: string }>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout per portal

  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SANNIDH-Regulatory-Bot/1.0 (CA Compliance Platform)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const text = await res.text();
    // If it's valid RSS/XML, parse it
    if (text.includes("<item>") || text.includes("<entry>")) {
      return parseRSSItems(text);
    }
    return [];
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

// ── OpenAI Enrichment ─────────────────────────────────────────────────────────
async function enrichWithOpenAI(
  items: Array<{ title: string; description: string; pubDate: string; link: string }>,
  authorityCode: string,
  authorityName: string,
  openaiKey: string
): Promise<any[]> {
  if (items.length === 0) return [];

  const prompt = `You are a senior Indian Chartered Accountant and regulatory compliance expert for SANNIDH platform.

Analyze these ${items.length} regulatory updates from ${authorityName} (${authorityCode}) and return a JSON array.

ITEMS:
${items.map((item, i) => `${i + 1}. TITLE: ${item.title}\nDESC: ${item.description?.slice(0, 300)}\nDATE: ${item.pubDate}\nURL: ${item.link}`).join("\n\n")}

For each item return:
{
  "title": "Clear, professional title",
  "summary": "2-3 sentence plain-English summary for a CA",
  "category": one of ["law_amendment","circular","notification","guideline","new_regulation","rate_change","deadline_extension","penalty_update","court_ruling"],
  "impact_level": one of ["critical","high","medium","low"],
  "affected_sectors": ["array of affected business sectors"],
  "affected_companies": ["array of company types: Private Limited, LLP, OPC, Public Listed, NBFC, etc."],
  "required_actions": ["array of specific actions CAs must take"],
  "penalty_max": "maximum penalty string or empty",
  "penalty_late_fee": "late fee string or empty",
  "related_filings": ["array of form names: GSTR-1, ITR-6, MGT-7 etc."],
  "ai_summary": "One sentence urgent alert for CA",
  "ai_impact_analysis": "One sentence business impact assessment",
  "published_date": "YYYY-MM-DD format",
  "effective_date": "YYYY-MM-DD format or same as published if unknown"
}

Return ONLY a valid JSON array. No markdown. No explanation.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let parsed;
    try {
      parsed = JSON.parse(content);
      // OpenAI sometimes wraps in an object
      if (Array.isArray(parsed)) return parsed;
      const firstArray = Object.values(parsed).find(Array.isArray);
      return Array.isArray(firstArray) ? firstArray : [];
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}

// ── Save to Supabase ─────────────────────────────────────────────────────────
async function saveToSupabase(
  db: ReturnType<typeof createClient>,
  items: any[],
  authorityCode: string,
  authorityName: string
): Promise<number> {
  let saved = 0;

  for (const item of items) {
    if (!item.title || !item.summary) continue;

    const today = new Date().toISOString().slice(0, 10);

    const row = {
      title: item.title,
      authority: authorityName,
      authority_code: authorityCode,
      category: item.category || "notification",
      effective_date: item.effective_date || today,
      published_date: item.published_date || today,
      summary: item.summary,
      source_url: item.link || "",
      impact_level: item.impact_level || "medium",
      affected_sectors: item.affected_sectors || [],
      affected_companies: item.affected_companies || [],
      required_actions: item.required_actions || [],
      penalty_max: item.penalty_max || null,
      penalty_late_fee: item.penalty_late_fee || null,
      related_filings: item.related_filings || [],
      ai_summary: item.ai_summary || "",
      ai_impact_analysis: item.ai_impact_analysis || "",
    };

    // Upsert by title + authority_code to avoid duplicates
    const { error } = await db
      .from("regulatory_news_feed")
      .upsert(row, { onConflict: "title,authority_code", ignoreDuplicates: true });

    if (!error) saved++;
  }

  return saved;
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    return json(500, { error: "OPENAI_API_KEY is not set in Supabase Secrets." });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: Record<string, { fetched: number; saved: number; error?: string }> = {};
  let totalSaved = 0;

  console.log(`[SANNIDH Regulatory Scraper] Starting scrape of ${GOVT_FEEDS.length} government portals...`);

  for (const feed of GOVT_FEEDS) {
    try {
      console.log(`[${feed.code}] Fetching ${feed.url}...`);

      // Fetch RSS items
      const rawItems = await fetchFeed(feed);
      console.log(`[${feed.code}] Found ${rawItems.length} raw items`);

      if (rawItems.length === 0) {
        results[feed.code] = { fetched: 0, saved: 0, error: "No items found in RSS feed" };
        continue;
      }

      // Take only the 5 most recent items per portal to avoid OpenAI token overload
      const recentItems = rawItems.slice(0, 5);

      // Enrich with OpenAI
      const enriched = await enrichWithOpenAI(recentItems, feed.code, feed.name, openaiKey);
      console.log(`[${feed.code}] Enriched ${enriched.length} items`);

      // Save to Supabase
      const saved = await saveToSupabase(db, enriched, feed.code, feed.name);
      totalSaved += saved;

      results[feed.code] = { fetched: rawItems.length, saved };
    } catch (err: any) {
      console.error(`[${feed.code}] Error:`, err.message);
      results[feed.code] = { fetched: 0, saved: 0, error: err.message };
    }
  }

  console.log(`[SANNIDH Regulatory Scraper] Complete. Total saved: ${totalSaved}`);

  return json(200, {
    success: true,
    total_saved: totalSaved,
    scraped_at: new Date().toISOString(),
    portals: results,
  });
});
