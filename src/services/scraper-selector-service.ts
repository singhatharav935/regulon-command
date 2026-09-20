/**
 * Scraper Selector & Health Service
 * ═════════════════════════════════
 * Interacts with:
 * - client_portal_credentials
 * - scraper_selectors
 * - scraper_health_logs
 * - scraper_repair_logs
 * - client_govt_notices
 * - Executing Edge Functions: gst-scraper-bot, it-scraper-bot, mca-scraper-bot, notice-detector, scraper-health-monitor
 */

import { supabase } from "@/integrations/supabase/client";

export interface PortalCredential {
  company_id: string;
  portal_type: "GSTN" | "INCOME_TAX" | "MCA";
  username: string;
  last_verified_at?: string;
}

export interface ScraperSelector {
  id: string;
  portal: "GSTN" | "INCOME_TAX" | "MCA";
  selector_key: string;
  selector_value: string;
  selector_type: "css" | "xpath" | "text";
  version: number;
  is_active: boolean;
  healed_by_ai: boolean;
  heal_confidence?: number;
  notes?: string;
  created_at: string;
}

export interface ScraperHealthLog {
  id: string;
  run_id: string;
  portal: "GSTN" | "INCOME_TAX" | "MCA";
  company_id: string;
  status: "running" | "success" | "failed" | "captcha_failed" | "login_failed" | "selector_not_found";
  failed_step?: string;
  failed_selector?: string;
  error_context?: any;
  notices_found: number;
  captcha_attempts: number;
  duration_ms?: number;
  created_at: string;
}

export interface ScraperRepairLog {
  id: string;
  health_log_id?: string;
  portal: "GSTN" | "INCOME_TAX" | "MCA";
  selector_key: string;
  original_selector: string;
  fixed_selector?: string;
  confidence_score?: number;
  ai_explanation?: string;
  status: "pending" | "deployed" | "verified" | "rejected_low_conf" | "rejected_failed" | "manual_override";
  tokens_used?: number;
  repaired_at: string;
  verified_at?: string;
}

/** Fetch active credentials for a company */
export async function getPortalCredentials(companyId: string): Promise<PortalCredential[]> {
  const { data, error } = await supabase
    .from("client_portal_credentials" as any)
    .select("company_id, portal_type, username, last_verified_at")
    .eq("company_id", companyId);

  if (error) {
    console.error("Error fetching credentials:", error);
    return [];
  }
  return data as any[];
}

/** Save or update credentials for a company portal */
export async function savePortalCredentials(
  companyId: string,
  portalType: "GSTN" | "INCOME_TAX" | "MCA",
  username: string,
  passwordVal: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("client_portal_credentials" as any)
    .upsert({
      company_id: companyId,
      portal_type: portalType,
      username,
      encrypted_password: passwordVal, // Stored encrypted/hashed in prod, plain fallback
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "company_id,portal_type"
    });

  if (error) {
    console.error("Error saving credentials:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Fetch all active/healed selectors */
export async function getScraperSelectors(portal?: "GSTN" | "INCOME_TAX" | "MCA"): Promise<ScraperSelector[]> {
  let query = supabase
    .from("scraper_selectors" as any)
    .select("*")
    .order("portal", { ascending: true })
    .order("selector_key", { ascending: true })
    .order("version", { ascending: false });

  if (portal) {
    query = query.eq("portal", portal);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching selectors:", error);
    return [];
  }
  return data as any[];
}

/** Fetch recent scraper health run logs */
export async function getScraperHealthLogs(limit = 50): Promise<ScraperHealthLog[]> {
  const { data, error } = await supabase
    .from("scraper_health_logs" as any)
    .select("*, companies(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching health logs:", error);
    return [];
  }
  return data as any[];
}

/** Fetch recent AI self-healing repair logs */
export async function getScraperRepairLogs(limit = 30): Promise<ScraperRepairLog[]> {
  const { data, error } = await supabase
    .from("scraper_repair_logs" as any)
    .select("*")
    .order("repaired_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching repair logs:", error);
    return [];
  }
  return data as any[];
}

/** Fetch all notices parsed by the scrapers */
export async function getDetectedNotices(companyId?: string): Promise<any[]> {
  let query = supabase
    .from("client_govt_notices" as any)
    .select("*, companies(name)")
    .order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching notices:", error);
    return [];
  }
  return data;
}

/** Trigger a specific portal scraper bot for a company */
export async function triggerPortalScraper(
  companyId: string,
  portalType: "GSTN" | "INCOME_TAX" | "MCA"
): Promise<{ success: boolean; noticesFound?: number; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const { data: { session } } = await supabase.auth.getSession();
    
    const functionName = {
      GSTN: "gst-scraper-bot",
      INCOME_TAX: "it-scraper-bot",
      MCA: "mca-scraper-bot"
    }[portalType];

    const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`
      },
      body: JSON.stringify({ company_id: companyId })
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json();
    return {
      success: data.success,
      noticesFound: data.noticesFound,
      error: data.error
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Trigger the AI Self-Healing monitor to heal selector failures */
export async function triggerSelfHealingCycle(): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${supabaseUrl}/functions/v1/scraper-health-monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json();
    return {
      success: data.success,
      stats: data.stats,
      error: data.error
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
