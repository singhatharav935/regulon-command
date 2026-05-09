import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ── GSTIN → Real company name from GST Portal ────────────────────────────────
async function lookupGSTIN(gstin: string) {
  // Try GSTZero API if key is set (most reliable, free tier available)
  const gstZeroKey = Deno.env.get("GSTZERO_API_KEY");
  if (gstZeroKey) {
    try {
      const res = await fetch(`https://api.gstzero.in/gstin/${gstin}`, {
        headers: { "X-GSTZERO-API-KEY": gstZeroKey, Accept: "application/json" },
      });
      if (res.ok) {
        const d = await res.json();
        if (d.lgnm || d.tradeNam) {
          return {
            found: true, source: "GST Records",
            legal_name: d.lgnm, trade_name: d.tradeNam,
            status: d.sts || "Active", registration_date: d.rgdt,
            business_type: d.dty, state: d.stj,
          };
        }
      }
    } catch { /* fall through */ }
  }

  // Try free GST portal public endpoint (no key required)
  try {
    const res = await fetch(
      `https://services.gst.gov.in/services/api/search/taxpayerDetails?gstin=${gstin}`,
      { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      if (d.lgnm || d.tradeNam) {
        return {
          found: true, source: "GST Portal",
          legal_name: d.lgnm, trade_name: d.tradeNam,
          status: d.sts || "Active", registration_date: d.rgdt,
          business_type: d.dty, state: d.stj,
        };
      }
    }
  } catch { /* fall through */ }

  return null; // checksum was valid but govt lookup failed
}

// ── PAN → Entity type extraction (no API needed) ─────────────────────────────
function extractPAN(pan: string) {
  const ENTITY: Record<string, string> = {
    C: "Company", P: "Individual", H: "HUF",
    F: "Firm / Partnership", A: "Association of Persons",
    T: "Trust", B: "Body of Individuals", L: "Local Authority",
    J: "Juridical Person", G: "Government Entity",
  };
  const entityChar = pan[3]?.toUpperCase() ?? "";
  return {
    found: true, source: "PAN Format Analysis",
    entity_type: ENTITY[entityChar] || "Unknown",
    entity_char: entityChar,
    name_initial: pan[4]?.toUpperCase() ?? "",
    note: "Real name lookup requires PAN verification API",
  };
}

// ── CIN → Company metadata extraction ────────────────────────────────────────
function extractCIN(cin: string) {
  const m = cin.match(/^([UL])(\d{5})([A-Z]{2})(\d{4})(PTC|PLC|OPC|LLP|NPL|GOI|FTC|FLC|GAP|PVT)(\d{6})$/i);
  if (!m) return null;

  const ENTITY: Record<string, string> = {
    PTC: "Private Limited Company", PLC: "Public Limited Company",
    OPC: "One Person Company", LLP: "Limited Liability Partnership",
    NPL: "Section 8 (Non-Profit)", GOI: "Government Company",
    FTC: "Foreign Company", PVT: "Private Company",
  };
  const STATES: Record<string, string> = {
    MH: "Maharashtra", DL: "Delhi", KA: "Karnataka", TN: "Tamil Nadu",
    GJ: "Gujarat", RJ: "Rajasthan", WB: "West Bengal", UP: "Uttar Pradesh",
    AP: "Andhra Pradesh", TS: "Telangana", KL: "Kerala", HR: "Haryana",
    PB: "Punjab", MP: "Madhya Pradesh", OR: "Odisha", BR: "Bihar",
    UK: "Uttarakhand", JH: "Jharkhand", CG: "Chhattisgarh", AS: "Assam",
    HP: "Himachal Pradesh", GA: "Goa", CH: "Chandigarh",
  };

  return {
    found: true, source: "MCA Format Analysis",
    listed: m[1].toUpperCase() === "L" ? "Listed" : "Unlisted",
    nic_code: m[2], state: STATES[m[3].toUpperCase()] || m[3],
    incorporated_year: m[4],
    entity_type: ENTITY[m[5].toUpperCase()] || m[5],
    serial: m[6],
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const type  = url.searchParams.get("type");
  const value = url.searchParams.get("value")?.trim().toUpperCase();

  if (!type || !value) return json(400, { error: "type and value required" });

  try {
    if (type === "gstin") {
      const result = await lookupGSTIN(value);
      return result
        ? json(200, { success: true, ...result })
        : json(404, { success: false, error: "Not found in government records — verify the GSTIN number" });
    }
    if (type === "pan") {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value))
        return json(400, { success: false, error: "Invalid PAN format" });
      return json(200, { success: true, ...extractPAN(value) });
    }
    if (type === "cin") {
      const info = extractCIN(value);
      return info
        ? json(200, { success: true, ...info })
        : json(400, { success: false, error: "Invalid CIN format" });
    }
    return json(400, { error: "type must be: gstin | pan | cin" });
  } catch (err: unknown) {
    return json(500, { error: err instanceof Error ? err.message : "Verification failed" });
  }
});
