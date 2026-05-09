/**
 * send-consent Edge Function
 * Handles 3 actions:
 *   POST ?action=initiate  — CA initiates: create consent_request, send Email + WhatsApp
 *   GET  ?action=status    — Public: poll consent status by token
 *   POST ?action=respond   — Public: client approves or rejects by token
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

const getServiceClient = () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};

const getAuthUser = async (req: Request) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) throw new Error("Unauthorized");
  const token = auth.replace(/^bearer\s+/i, "").trim();
  const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  return data.user;
};

// ── Email via Resend ──────────────────────────────────────────────────────────
async function sendEmail(to: string, caName: string, clientName: string, gstin: string | null, pan: string | null, consentUrl: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}
.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#4f46e5,#0ea5e9);padding:40px 32px;text-align:center}
.hdr h1{color:#fff;margin:0;font-size:24px;font-weight:700}.hdr p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}
.body{padding:40px 32px}.info{background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0}
.row:last-child{border-bottom:none}.lbl{color:#64748b;font-size:13px}.val{color:#1e293b;font-size:13px;font-weight:600}
.btn{display:block;width:fit-content;margin:32px auto;padding:16px 48px;background:linear-gradient(135deg,#4f46e5,#0ea5e9);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px}
.ftr{padding:24px 32px;background:#f8fafc;text-align:center}.ftr p{color:#94a3b8;font-size:12px;margin:4px 0}
</style></head><body><div class="wrap">
<div class="hdr"><h1>🔐 Authorization Required</h1><p>SANNIDH | Compliance & Regulatory Platform</p></div>
<div class="body">
<p style="color:#1e293b;font-size:16px">Dear <strong>${clientName}</strong>,</p>
<p style="color:#475569;font-size:15px;line-height:1.6">Your Chartered Accountant <strong>${caName}</strong> has requested authorized access to your company's compliance data through SANNIDH.</p>
<div class="info">
  <div class="row"><span class="lbl">Requested by</span><span class="val">${caName}</span></div>
  ${gstin ? `<div class="row"><span class="lbl">GSTIN</span><span class="val">${gstin}</span></div>` : ""}
  ${pan ? `<div class="row"><span class="lbl">PAN</span><span class="val">${pan}</span></div>` : ""}
  <div class="row"><span class="lbl">Platform</span><span class="val">SANNIDH AI</span></div>
</div>
<p style="color:#475569;font-size:14px;line-height:1.8">✅ Data used only for compliance tracking<br>✅ You can revoke access anytime<br>✅ Encrypted &amp; stored securely</p>
<a href="${consentUrl}" class="btn">Authorize Access →</a>
<p style="color:#94a3b8;font-size:13px;text-align:center">If you did not expect this, safely ignore this email.</p>
</div>
<div class="ftr"><p>SANNIDH — Compliance & Regulatory Command Platform</p><p>🔒 This link expires in 7 days</p></div>
</div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "SANNIDH <onboarding@resend.dev>",
      to: [to],
      subject: `[Action Required] ${caName} requests compliance data authorization`,
      html,
    }),
  });
  return res.ok;
}

// ── WhatsApp via Twilio ───────────────────────────────────────────────────────
async function sendWhatsApp(to: string, caName: string, clientName: string, consentUrl: string): Promise<boolean> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!sid || !token || !from) return false;

  const message = `Hello ${clientName},\n\nYour CA *${caName}* has requested authorized access to your compliance data via SANNIDH.\n\n👉 Click to Authorize:\n${consentUrl}\n\n_You can decline on the page if you did not expect this request._`;

  const phone = to.startsWith("+") ? to : `+91${to.replace(/\D/g, "").slice(-10)}`;
  const params = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${phone}`, Body: message });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  return res.ok;
}

// ── Route: initiate ───────────────────────────────────────────────────────────
async function handleInitiate(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  const body = await req.json();
  const { company_id, client_name, client_email, client_phone, gstin, pan, cin, ca_name, ca_firm_name } = body;

  if (!client_name) return json(400, { error: "client_name required" });
  if (!client_email && !client_phone) return json(400, { error: "client_email or client_phone required" });

  const db = getServiceClient();

  // Insert consent_request row (token auto-generated by DB default)
  const { data: req_row, error: insertErr } = await db
    .from("consent_requests")
    .insert({
      ca_user_id: user.id,
      company_id: company_id || null,
      client_name,
      client_email: client_email || null,
      client_phone: client_phone || null,
      gstin: gstin || null,
      pan: pan || null,
      cin: cin || null,
      ca_name: ca_name || null,
      ca_firm_name: ca_firm_name || null,
      notification_sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr || !req_row) return json(500, { error: insertErr?.message || "DB insert failed" });

  const appUrl = Deno.env.get("APP_URL") || "https://sannidh.in";
  const consentUrl = `${appUrl}/consent/${req_row.consent_token}`;

  let emailSent = false;
  let whatsappSent = false;

  if (client_email) {
    emailSent = await sendEmail(client_email, ca_name || "Your CA", client_name, gstin || null, pan || null, consentUrl);
  }
  if (client_phone) {
    whatsappSent = await sendWhatsApp(client_phone, ca_name || "Your CA", client_name, consentUrl);
  }

  // Update sent flags
  await db.from("consent_requests").update({ email_sent: emailSent, whatsapp_sent: whatsappSent }).eq("id", req_row.id);

  return json(200, {
    success: true,
    request_id: req_row.id,
    consent_token: req_row.consent_token,
    consent_url: consentUrl,
    email_sent: emailSent,
    whatsapp_sent: whatsappSent,
  });
}

// ── Route: status (public) ────────────────────────────────────────────────────
async function handleStatus(url: URL): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token) return json(400, { error: "token required" });

  const db = getServiceClient();
  const { data, error } = await db
    .from("consent_requests")
    .select("id, client_name, ca_name, ca_firm_name, gstin, pan, consent_status, created_at, responded_at")
    .eq("consent_token", token)
    .single();

  if (error || !data) return json(404, { error: "Consent request not found" });
  return json(200, { success: true, ...data });
}

// ── Route: respond (public, client approves/rejects) ─────────────────────────
async function handleRespond(req: Request): Promise<Response> {
  const { token, decision } = await req.json();
  if (!token) return json(400, { error: "token required" });
  if (decision !== "approved" && decision !== "rejected") return json(400, { error: "decision must be 'approved' or 'rejected'" });

  const db = getServiceClient();
  const { data: existing } = await db
    .from("consent_requests")
    .select("id, consent_status")
    .eq("consent_token", token)
    .single();

  if (!existing) return json(404, { error: "Invalid consent token" });
  if (existing.consent_status !== "pending") return json(409, { error: "Already responded" });

  const { error } = await db
    .from("consent_requests")
    .update({ consent_status: decision, responded_at: new Date().toISOString() })
    .eq("consent_token", token);

  if (error) return json(500, { error: error.message });
  return json(200, { success: true, status: decision });
}

// ── Main ──────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "initiate" && req.method === "POST") return await handleInitiate(req);
    if (action === "status" && req.method === "GET") return await handleStatus(url);
    if (action === "respond" && req.method === "POST") return await handleRespond(req);
    return json(404, { error: "Unknown action. Use: initiate | status | respond" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg === "Unauthorized") return json(401, { error: "Unauthorized" });
    return json(500, { error: msg });
  }
});
