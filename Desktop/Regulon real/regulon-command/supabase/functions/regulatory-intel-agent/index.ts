import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SourceConfig = {
  key: "pib" | "gstn" | "cbdt" | "mca" | "cbic" | "incometax";
  label: string;
  announcedBy: string;
  baseUrl: string;
  feedType: "rss" | "html";
  path: string;
  category: "GST" | "Income Tax" | "Corporate Law" | "General";
};

type ParsedNotice = {
  source: SourceConfig["key"];
  source_label: string;
  title: string;
  summary: string | null;
  category: string;
  announced_by: string;
  source_url: string;
  published_date: string;
  effective_date: string | null;
  action_deadline: string | null;
  notification_ref: string | null;
};

const SOURCES: SourceConfig[] = [
  { key: "pib", label: "PIB India", announcedBy: "Press Information Bureau", baseUrl: "https://pib.gov.in", feedType: "rss", path: "/RssMain.aspx?ModId=6&Lang=1&Regid=3", category: "General" },
  { key: "gstn", label: "GSTN", announcedBy: "GSTN", baseUrl: "https://www.gst.gov.in", feedType: "html", path: "/newsandupdates", category: "GST" },
  { key: "cbdt", label: "CBDT", announcedBy: "CBDT", baseUrl: "https://incometaxindia.gov.in", feedType: "html", path: "/", category: "Income Tax" },
  { key: "mca", label: "MCA", announcedBy: "Ministry of Corporate Affairs", baseUrl: "https://www.mca.gov.in", feedType: "html", path: "/content/mca/global/en/notifications-orders/notifications.html", category: "Corporate Law" },
  { key: "cbic", label: "CBIC", announcedBy: "CBIC", baseUrl: "https://www.cbic.gov.in", feedType: "html", path: "/", category: "GST" },
  { key: "incometax", label: "Income Tax Portal", announcedBy: "Income Tax Department", baseUrl: "https://www.incometax.gov.in", feedType: "html", path: "/iec/foportal/", category: "Income Tax" },
];

const USER_AGENTS = [
  "SANNIDH-Compliance-Agent/2026 (+https://sannidh.in/security; contact=ops@sannidh.in)",
  "SANNIDH-Compliance-Agent/2026 sovereign-monitor",
  "SANNIDH-Compliance-Agent/2026 compliance-radar",
];

const MIN_SOURCE_INTERVAL_MS = 2 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20000;
const FETCH_RETRIES = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getEnv = () => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceRole) throw new Error("Missing Supabase service role environment variables");
  return { url, serviceRole };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const parseDateString = (value: string | null) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
};

const sanitizeText = (text: string) =>
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);

const maskPii = (text: string | null) => {
  if (!text) return null;
  return text
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[MASKED-PAN]")
    .replace(/\b\d{10}\b/g, "[MASKED-PHONE]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[MASKED-EMAIL]");
};

const impactScore = (title: string, summary: string | null) => {
  const payload = `${title} ${summary ?? ""}`.toLowerCase();
  let score = 3.5;
  if (/(penalty|fine|prosecution|interest|violation)/.test(payload)) score += 4;
  if (/(deadline|last date|due date|effective from|immediate effect)/.test(payload)) score += 2.5;
  if (/(mandatory|required|shall|must)/.test(payload)) score += 2;
  return Math.min(12, Number(score.toFixed(1)));
};

const exposureByScore = (score: number): "low" | "medium" | "high" => {
  if (score >= 9) return "high";
  if (score >= 6) return "medium";
  return "low";
};

const ownerByCategory = (category: string) => {
  if (category === "GST") return "Indirect Tax Lead";
  if (category === "Income Tax") return "Direct Tax Lead";
  if (category === "Corporate Law") return "Corporate Compliance Lead";
  return "Compliance Operations";
};

const allowedDomainForSource = (source: SourceConfig["key"]) => {
  if (source === "pib") return ["pib.gov.in"];
  if (source === "gstn") return ["gst.gov.in"];
  if (source === "cbdt") return ["incometaxindia.gov.in"];
  if (source === "mca") return ["mca.gov.in"];
  if (source === "cbic") return ["cbic.gov.in"];
  return ["incometax.gov.in"];
};

const isOfficialDomain = (source: SourceConfig["key"], url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const allowed = allowedDomainForSource(source);
    return allowed.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

const pickUserAgent = (attempt: number) => USER_AGENTS[attempt % USER_AGENTS.length];

const fetchWithRetry = async (url: string, sourceKey: SourceConfig["key"]) => {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": pickUserAgent(attempt),
          Accept: "text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
          "X-Sannidh-Agent": sourceKey,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
      return await response.text();
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      const backoffMs = 600 * 2 ** attempt;
      await sleep(backoffMs);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to fetch source");
};

const canFetchFromRobots = async (source: SourceConfig) => {
  try {
    const robotsUrl = new URL("/robots.txt", source.baseUrl).toString();
    const robotsBody = await fetchWithRetry(robotsUrl, source.key);
    const lines = robotsBody.split("\n").map((line) => line.trim());
    let globalBlock = false;
    const disallow: string[] = [];
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;
      const lower = line.toLowerCase();
      if (lower.startsWith("user-agent:")) {
        globalBlock = (line.split(":")[1] ?? "").trim() === "*";
      } else if (globalBlock && lower.startsWith("disallow:")) {
        const rule = (line.split(":")[1] ?? "").trim();
        if (rule) disallow.push(rule);
      }
    }
    const sourcePath = source.path.startsWith("/") ? source.path : `/${source.path}`;
    return !disallow.some((rule) => sourcePath.startsWith(rule));
  } catch {
    return true;
  }
};

const parseRss = (source: SourceConfig, xml: string): ParsedNotice[] => {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 35);
  return items.map((match) => {
    const block = match[1];
    const title = sanitizeText(
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>(.*?)<\/title>/)?.[1] ?? `${source.label} update`,
    );
    const summary = sanitizeText(
      block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>(.*?)<\/description>/)?.[1] ?? "",
    );
    const linkRaw = (block.match(/<link>(.*?)<\/link>/)?.[1] ?? "").trim();
    const sourceUrl = linkRaw.startsWith("http") ? linkRaw : new URL(linkRaw || source.path, source.baseUrl).toString();
    const pubDate = parseDateString(block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? null) ?? new Date().toISOString().slice(0, 10);
    const ref = block.match(/(Notification|Circular|Order)\s*(No\.?|Number)?\s*[:\-]?\s*([A-Za-z0-9\/\-.]+)/i)?.[3] ?? null;
    return {
      source: source.key,
      source_label: source.label,
      title,
      summary: summary || null,
      category: source.category,
      announced_by: source.announcedBy,
      source_url: sourceUrl,
      published_date: pubDate,
      effective_date: null,
      action_deadline: null,
      notification_ref: ref,
    };
  }).filter((row) => isOfficialDomain(source.key, row.source_url));
};

const parseHtmlLinks = (source: SourceConfig, html: string): ParsedNotice[] => {
  const matches = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  const today = new Date().toISOString().slice(0, 10);
  return matches
    .map((m) => {
      const hrefRaw = m[1].trim();
      const text = sanitizeText(m[2]);
      if (!text) return null;
      const sourceUrl = hrefRaw.startsWith("http") ? hrefRaw : new URL(hrefRaw, source.baseUrl).toString();
      const isRelevant = /(notification|circular|compliance|amendment|advisory|order|press|deadline|update)/i.test(text);
      if (!isRelevant) return null;
      const notificationRef = text.match(/(No\.?|Number)\s*[:\-]?\s*([A-Za-z0-9\/\-.]+)/i)?.[2] ?? null;
      const deadline = parseDateString(text.match(/(deadline|due date|last date)\s*[:\-]?\s*([A-Za-z0-9,\-\s]+)/i)?.[2] ?? null);
      return {
        source: source.key,
        source_label: source.label,
        title: text,
        summary: null,
        category: source.category,
        announced_by: source.announcedBy,
        source_url: sourceUrl,
        published_date: today,
        effective_date: null,
        action_deadline: deadline,
        notification_ref: notificationRef,
      } as ParsedNotice;
    })
    .filter((row): row is ParsedNotice => Boolean(row))
    .filter((row) => isOfficialDomain(source.key, row.source_url))
    .slice(0, 30);
};

const dedupeNotices = async (items: ParsedNotice[]) => {
  const out: Array<ParsedNotice & { dedupe_key: string }> = [];
  const local = new Set<string>();
  for (const item of items) {
    const dedupeMaterial = `${item.source}|${item.notification_ref ?? ""}|${item.published_date}|${item.title}`;
    const key = await sha256(dedupeMaterial);
    if (local.has(key)) continue;
    local.add(key);
    out.push({ ...item, dedupe_key: key });
  }
  return out;
};

const sourceStateAllowsFetch = (lastFetchedAt: string | null) => {
  if (!lastFetchedAt) return true;
  const last = Date.parse(lastFetchedAt);
  if (Number.isNaN(last)) return true;
  return Date.now() - last >= MIN_SOURCE_INTERVAL_MS;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { url, serviceRole } = getEnv();
    const supabase = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const requestUrl = new URL(req.url);
    const path = requestUrl.pathname.replace(/^\/+/, "");

    if (req.method === "GET" && path.endsWith("health")) {
      return json(200, { ok: true, agent: "sannidh-agent", time: new Date().toISOString() });
    }
    if (req.method !== "POST" || !path.endsWith("sync")) return json(404, { error: "Route not found" });

    const cronSecret = Deno.env.get("REGULATORY_AGENT_CRON_SECRET") ?? "";
    if (cronSecret && (req.headers.get("x-cron-secret") ?? "") !== cronSecret) {
      return json(401, { error: "Unauthorized" });
    }

    const startAt = new Date().toISOString();
    let totalFetched = 0;
    let totalInserted = 0;
    let sourceFailures = 0;

    for (const source of SOURCES) {
      const sourceUrl = new URL(source.path, source.baseUrl).toString();
      const { data: state } = await supabase
        .from("regulatory_source_states")
        .select("last_fetched_at, last_snapshot_hash, fail_count")
        .eq("source", source.key)
        .maybeSingle();

      await supabase.from("regulatory_source_states").upsert({
        source: source.key,
        source_label: source.label,
        source_url: sourceUrl,
        last_status: "idle",
      }, { onConflict: "source" });

      if (!sourceStateAllowsFetch(state?.last_fetched_at ?? null)) {
        await supabase.from("regulatory_source_states").update({
          last_status: "rate_limited",
          last_error: null,
        }).eq("source", source.key);
        continue;
      }

      try {
        if (!(await canFetchFromRobots(source))) {
          await supabase.from("regulatory_source_states").update({
            last_fetched_at: new Date().toISOString(),
            last_status: "skipped",
            last_error: "Blocked by robots.txt",
          }).eq("source", source.key);
          continue;
        }

        const raw = await fetchWithRetry(sourceUrl, source.key);
        const parsed = source.feedType === "rss" ? parseRss(source, raw) : parseHtmlLinks(source, raw);
        totalFetched += parsed.length;

        const digest = parsed.map((p) => `${p.title}|${p.source_url}|${p.published_date}`).join("\n");
        const snapshotHash = await sha256(`${source.key}|${digest}`);
        const snapshotChanged = snapshotHash !== (state?.last_snapshot_hash ?? null);

        await supabase.from("regulatory_source_snapshots").upsert({
          source: source.key,
          snapshot_hash: snapshotHash,
          content_digest: digest.slice(0, 16000),
          item_count: parsed.length,
        }, { onConflict: "source,snapshot_hash" });

        if (!snapshotChanged) {
          await supabase.from("regulatory_source_states").update({
            last_fetched_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            last_snapshot_hash: snapshotHash,
            last_status: "success",
            last_error: null,
          }).eq("source", source.key);
          continue;
        }

        const deduped = await dedupeNotices(parsed);
        const rows = deduped.map((item) => {
          const score = impactScore(item.title, item.summary);
          return {
            source: item.source,
            source_label: item.source_label,
            title: item.title,
            summary: maskPii(item.summary) ?? maskPii(item.title),
            category: item.category,
            announced_by: item.announced_by,
            announced_on: item.published_date,
            source_url: item.source_url,
            original_url: item.source_url,
            published_date: item.published_date,
            detected_at: new Date().toISOString(),
            effective_date: item.effective_date,
            action_deadline: item.action_deadline,
            notification_ref: item.notification_ref,
            impact_score: score,
            company_exposure: exposureByScore(score),
            action_owner: ownerByCategory(item.category),
            content_preview: maskPii(item.summary) ?? maskPii(item.title),
            source_verified: true,
            dedupe_key: item.dedupe_key,
          };
        });

        if (rows.length > 0) {
          const { error: upsertError } = await supabase
            .from("government_announcements")
            .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: false });
          if (upsertError) throw upsertError;
          totalInserted += rows.length;
        }

        await supabase.from("regulatory_source_states").update({
          last_fetched_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          last_snapshot_hash: snapshotHash,
          last_status: "success",
          fail_count: 0,
          last_error: null,
        }).eq("source", source.key);
      } catch (error) {
        sourceFailures += 1;
        const message = error instanceof Error ? error.message : "Source fetch failed";
        const nextFailCount = Number(state?.fail_count ?? 0) + 1;
        await supabase.from("regulatory_source_states").update({
          last_fetched_at: new Date().toISOString(),
          last_status: "failed",
          fail_count: nextFailCount,
          last_error: message.slice(0, 500),
        }).eq("source", source.key);
      }
    }

    const finalStatus = sourceFailures === 0 ? "success" : (sourceFailures < SOURCES.length ? "partial" : "failed");
    await supabase.from("regulatory_agent_sync_runs").insert({
      status: finalStatus,
      monitored_portals: SOURCES.length,
      records_fetched: totalFetched,
      records_inserted: totalInserted,
      error_summary: sourceFailures > 0 ? `${sourceFailures} source(s) failed in this run` : null,
      created_at: startAt,
    });

    return json(200, {
      ok: true,
      data: {
        status: finalStatus,
        monitored_portals: SOURCES.length,
        records_fetched: totalFetched,
        records_inserted: totalInserted,
        source_failures: sourceFailures,
        synced_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected failure";
    try {
      const { url, serviceRole } = getEnv();
      const supabase = createClient(url, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await supabase.from("regulatory_agent_sync_runs").insert({
        status: "failed",
        monitored_portals: SOURCES.length,
        records_fetched: 0,
        records_inserted: 0,
        error_summary: message.slice(0, 500),
      });
    } catch {
      // ignore secondary logging errors
    }
    return json(500, { error: message });
  }
});
