/**
 * Supabase Edge Function: send-ca-link-otp
 * ==========================================
 * Handles the real Company ↔ CA connection flow.
 *
 * Actions:
 *   POST ?action=generate_code  — Generate/fetch a unique link code for a user
 *   POST ?action=send_otp       — Initiate link: send OTP to target user's email
 *   POST ?action=verify_otp     — Verify OTP and activate the connection
 *   GET  ?action=get_connection — Get current connection details for logged-in user
 *   POST ?action=disconnect     — Remove a connection
 *   POST ?action=sync_data      — Company pushes financial snapshot to CA
 *   GET  ?action=get_sync_data  — CA retrieves the latest synced data from a company
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

// ── Clients ───────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  const computed = await hashOtp(otp);
  return computed === hash;
}

// ── Email via Resend ──────────────────────────────────────────────────────────

async function sendOtpEmail(
  toEmail: string,
  recipientName: string,
  senderName: string,
  senderEmail: string,
  otp: string,
  connectionType: "ca_linking_company" | "company_linking_ca"
): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.error("RESEND_API_KEY not set");
    return false;
  }

  const isCAReceiving = connectionType === "ca_linking_company";
  const role = isCAReceiving ? "CA" : "Company Owner";
  const otherRole = isCAReceiving ? "Company Owner" : "CA";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #0f172a; }
  .wrap { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(99,102,241,0.3); }
  .hdr { background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); padding: 40px 32px; text-align: center; }
  .hdr h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .hdr p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; }
  .body { padding: 36px 32px; }
  .body p { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .otp-box { background: #0f172a; border: 2px solid #4f46e5; border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0; }
  .otp-label { color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
  .otp-code { font-size: 48px; font-weight: 900; color: #818cf8; letter-spacing: 12px; font-family: 'Courier New', monospace; }
  .otp-expiry { color: #64748b; font-size: 12px; margin-top: 12px; }
  .info-box { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 16px; margin: 20px 0; }
  .info-box p { color: #a5b4fc; font-size: 13px; margin: 0; }
  .warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 14px; margin: 20px 0; }
  .warning p { color: #fcd34d; font-size: 12px; margin: 0; }
  .ftr { padding: 24px 32px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
  .ftr p { color: #475569; font-size: 11px; margin: 4px 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>🔗 Dashboard Connection OTP</h1>
    <p>SANNIDH | Compliance & Regulatory Command Platform</p>
  </div>
  <div class="body">
    <p>Hello <strong style="color:#e2e8f0">${recipientName}</strong>,</p>
    <p>
      <strong style="color:#e2e8f0">${senderName}</strong> (${senderEmail}) is requesting to connect their
      <strong style="color:#818cf8">${otherRole} Dashboard</strong> to your <strong style="color:#818cf8">${role} Dashboard</strong> on SANNIDH.
    </p>
    <p>Once connected, they will be able to send their financial data directly to your dashboard with a single click.</p>

    <div class="otp-box">
      <div class="otp-label">Your Verification OTP</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏰ Valid for 10 minutes only</div>
    </div>

    <div class="info-box">
      <p>📋 Share this OTP with <strong>${senderName}</strong> to verify and complete the connection. Do NOT share it with anyone else.</p>
    </div>

    <div class="warning">
      <p>⚠️ If you did not initiate or expect this connection request, you can safely ignore this email. No connection will be made without your OTP.</p>
    </div>
  </div>
  <div class="ftr">
    <p>SANNIDH | Compliance & Regulatory Command Platform</p>
    <p>sannidh.in · This is an automated security email</p>
    <p style="margin-top:8px;color:#334155">Do not reply to this email</p>
  </div>
</div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SANNIDH Platform <noreply@sannidh.in>",
        to: [toEmail],
        subject: `🔗 Your OTP to Connect Dashboards on SANNIDH: ${otp}`,
        html,
      }),
    });
    const result = await res.json();
    console.log("Email sent:", result);
    return res.ok;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const db = getServiceClient();
    let user: Awaited<ReturnType<typeof getAuthUser>> | null = null;

    // Most actions require auth
    if (action !== "get_connection_by_code") {
      user = await getAuthUser(req);
    }

    // ── ACTION: generate_code ──────────────────────────────────────────────────
    if (action === "generate_code") {
      const body = await req.json();
      const role = body.role as "ca" | "company"; // who is asking

      // Check if user already has a code
      const { data: existing } = await db
        .from("ca_company_link_codes")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        return json(200, { code: existing.link_code, role: existing.role });
      }

      // Generate new code
      const prefix = role === "ca" ? "CA" : "CO";
      const code = generateCode(prefix);

      const { error } = await db.from("ca_company_link_codes").insert({
        user_id: user!.id,
        email: user!.email,
        role,
        link_code: code,
      });

      if (error) throw new Error(error.message);
      return json(200, { code, role });
    }

    // ── ACTION: send_otp ───────────────────────────────────────────────────────
    if (action === "send_otp") {
      const body = await req.json();
      const { target_code, requester_role } = body;
      // requester_role: who is sending the request ("ca" or "company")
      // target_code: the link code of the other party

      // Find target user by their link code
      const { data: target, error: targetErr } = await db
        .from("ca_company_link_codes")
        .select("*")
        .eq("link_code", target_code.toUpperCase().trim())
        .maybeSingle();

      if (targetErr || !target) {
        return json(404, { error: "Link code not found. Please check and try again." });
      }

      // Ensure roles are complementary
      const expectedTargetRole = requester_role === "ca" ? "company" : "ca";
      if (target.role !== expectedTargetRole) {
        return json(400, { error: `This code belongs to another ${target.role}. A CA must connect to a Company and vice versa.` });
      }

      // Generate OTP
      const otp = generateOtp();
      const otpHash = await hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      // Upsert connection record in pending state
      const { error: upsertErr } = await db.from("ca_company_connections").upsert({
        requester_user_id: user!.id,
        requester_email: user!.email,
        requester_role,
        target_user_id: target.user_id,
        target_email: target.email,
        target_role: target.role,
        requester_link_code: (await db.from("ca_company_link_codes").select("link_code").eq("user_id", user!.id).maybeSingle()).data?.link_code || "",
        target_link_code: target_code.toUpperCase().trim(),
        otp_hash: otpHash,
        otp_expires_at: expiresAt,
        status: "otp_pending",
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "requester_user_id,target_user_id",
      });

      if (upsertErr) throw new Error(upsertErr.message);

      // Get requester's display name from profiles
      const { data: requesterProfile } = await db
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();

      const requesterName = requesterProfile?.full_name || user!.email!.split("@")[0];
      const targetName = target.email.split("@")[0];

      // Send OTP to TARGET's email
      const connectionType = requester_role === "ca" ? "ca_linking_company" : "company_linking_ca";
      const emailSent = await sendOtpEmail(
        target.email,
        targetName,
        requesterName,
        user!.email!,
        otp,
        connectionType
      );

      return json(200, {
        success: true,
        email_sent: emailSent,
        target_email_masked: target.email.replace(/(.{2}).+(@.+)/, "$1***$2"),
        otp_expires_in_minutes: 10,
        message: emailSent
          ? `OTP sent to ${target.email.replace(/(.{2}).+(@.+)/, "$1***$2")}`
          : "OTP generated but email delivery failed. Check RESEND_API_KEY.",
      });
    }

    // ── ACTION: verify_otp ─────────────────────────────────────────────────────
    if (action === "verify_otp") {
      const body = await req.json();
      const { target_code, otp } = body;

      // Find the pending connection
      const { data: conn, error: connErr } = await db
        .from("ca_company_connections")
        .select("*")
        .eq("requester_user_id", user!.id)
        .eq("target_link_code", target_code.toUpperCase().trim())
        .eq("status", "otp_pending")
        .maybeSingle();

      if (connErr || !conn) {
        return json(404, { error: "No pending connection found. Please restart the link process." });
      }

      // Check expiry
      if (new Date() > new Date(conn.otp_expires_at)) {
        return json(400, { error: "OTP has expired. Please request a new one." });
      }

      // Verify OTP
      const valid = await verifyOtpHash(otp, conn.otp_hash);
      if (!valid) {
        return json(400, { error: "Incorrect OTP. Please try again." });
      }

      // Activate connection
      const { error: updateErr } = await db
        .from("ca_company_connections")
        .update({
          status: "active",
          linked_at: new Date().toISOString(),
          otp_hash: null, // clear OTP after use
          updated_at: new Date().toISOString(),
        })
        .eq("id", conn.id);

      if (updateErr) throw new Error(updateErr.message);

      // Get target profile
      const { data: targetProfile } = await db
        .from("profiles")
        .select("full_name")
        .eq("id", conn.target_user_id)
        .maybeSingle();

      return json(200, {
        success: true,
        connection: {
          id: conn.id,
          target_user_id: conn.target_user_id,
          target_email: conn.target_email,
          target_name: targetProfile?.full_name || conn.target_email.split("@")[0],
          target_role: conn.target_role,
          target_link_code: conn.target_link_code,
          linked_at: new Date().toISOString(),
        },
      });
    }

    // ── ACTION: get_connection ─────────────────────────────────────────────────
    if (action === "get_connection") {
      // Find active connection where this user is requester OR target
      const { data: asRequester } = await db
        .from("ca_company_connections")
        .select("*")
        .eq("requester_user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();

      const { data: asTarget } = await db
        .from("ca_company_connections")
        .select("*")
        .eq("target_user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();

      const conn = asRequester || asTarget;
      if (!conn) return json(200, { connection: null });

      // Get other party's profile
      const otherId = conn.requester_user_id === user!.id ? conn.target_user_id : conn.requester_user_id;
      const { data: otherProfile } = await db.from("profiles").select("full_name").eq("id", otherId).maybeSingle();
      const otherEmail = conn.requester_user_id === user!.id ? conn.target_email : conn.requester_email;
      const otherRole = conn.requester_user_id === user!.id ? conn.target_role : conn.requester_role;
      const otherCode = conn.requester_user_id === user!.id ? conn.target_link_code : conn.requester_link_code;

      return json(200, {
        connection: {
          id: conn.id,
          other_user_id: otherId,
          other_email: otherEmail,
          other_name: otherProfile?.full_name || otherEmail.split("@")[0],
          other_role: otherRole,
          other_link_code: otherCode,
          linked_at: conn.linked_at,
          status: conn.status,
        },
      });
    }

    // ── ACTION: disconnect ─────────────────────────────────────────────────────
    if (action === "disconnect") {
      await db
        .from("ca_company_connections")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .or(`requester_user_id.eq.${user!.id},target_user_id.eq.${user!.id}`)
        .eq("status", "active");

      return json(200, { success: true });
    }

    // ── ACTION: sync_data ──────────────────────────────────────────────────────
    if (action === "sync_data") {
      const body = await req.json();
      const { payload } = body;

      // Find active connection
      const { data: conn } = await db
        .from("ca_company_connections")
        .select("id, target_user_id, requester_user_id, target_role, requester_role")
        .or(`requester_user_id.eq.${user!.id},target_user_id.eq.${user!.id}`)
        .eq("status", "active")
        .maybeSingle();

      if (!conn) return json(404, { error: "No active connection found" });

      // Determine CA's user ID (the other party or the one with role=ca)
      const caUserId = conn.requester_role === "ca" ? conn.requester_user_id : conn.target_user_id;

      // Upsert sync data
      const { error: syncErr } = await db.from("ca_company_sync_data").upsert({
        connection_id: conn.id,
        company_user_id: user!.id,
        ca_user_id: caUserId,
        payload: JSON.stringify(payload),
        sent_at: new Date().toISOString(),
      }, { onConflict: "connection_id" });

      if (syncErr) throw new Error(syncErr.message);

      return json(200, { success: true, sent_at: new Date().toISOString() });
    }

    // ── ACTION: get_sync_data ──────────────────────────────────────────────────
    if (action === "get_sync_data") {
      const { data: syncData } = await db
        .from("ca_company_sync_data")
        .select("*")
        .eq("ca_user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!syncData) return json(200, { payload: null });

      return json(200, {
        payload: typeof syncData.payload === "string" ? JSON.parse(syncData.payload) : syncData.payload,
        sent_at: syncData.sent_at,
      });
    }

    return json(400, { error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error("Edge function error:", err);
    if (err.message === "Unauthorized") return json(401, { error: "Unauthorized" });
    return json(500, { error: err.message || "Internal server error" });
  }
});
