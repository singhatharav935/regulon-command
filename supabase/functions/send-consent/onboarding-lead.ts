/**
 * Onboarding Lead Handler
 * ========================
 * Called from send-consent edge function when action=onboarding_lead
 *
 * On submit it sends:
 *   1. Email notification to Sannidh team (Resend)
 *   2. Email confirmation to submitter (Resend)
 *   3. WhatsApp confirmation to submitter (Twilio WhatsApp API)
 *   4. WhatsApp alert to Sannidh team (Twilio WhatsApp API)
 */

const TEAM_EMAIL        = "rishabhshukla2510@gmail.com";
const TEAM_WHATSAPP     = "+919834537694"; // Sannidh owner WhatsApp

// ─── Helper: Send email via Resend ───────────────────────────────────────────
async function sendResendEmail(key: string, from: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) { console.error("Resend error:", await res.text()); return false; }
    return true;
  } catch (e) { console.error("Resend exception:", e); return false; }
}

// ─── Helper: Send WhatsApp via Twilio ────────────────────────────────────────
async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const sid   = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from  = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886"; // Twilio sandbox default

  if (!sid || !token) {
    console.warn("Twilio credentials not configured — WhatsApp skipped.");
    return false;
  }

  // Normalize phone: ensure it has country code
  const normalized = to.startsWith("+") ? to : `+91${to.replace(/\D/g, "").slice(-10)}`;
  const waTo   = `whatsapp:${normalized}`;
  const waFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const params = new URLSearchParams({ From: waFrom, To: waTo, Body: message });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
    if (!res.ok) { console.error("Twilio WhatsApp error:", await res.text()); return false; }
    return true;
  } catch (e) { console.error("Twilio WhatsApp exception:", e); return false; }
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function handleOnboardingLead(body: {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return { success: false, error: "Email service not configured" };

  const { name, email, phone, companyName, message } = body;
  if (!name || !email) return { success: false, error: "Name and email are required" };

  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "SANNIDH <onboarding@sannidh.in>";

  const now     = new Date();
  const dateStr = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  // ── 1. Team notification email ─────────────────────────────────────────────
  const teamHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}
.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:32px;text-align:center}
.hdr h1{color:#fff;margin:0;font-size:22px;font-weight:700}.hdr p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:13px}
.body{padding:32px}.info{background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0}
.row:last-child{border-bottom:none}.lbl{color:#64748b;font-size:13px}.val{color:#1e293b;font-size:13px;font-weight:600}
.msg{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0;color:#1e40af;font-size:14px;line-height:1.6}
.ftr{padding:20px 32px;background:#f8fafc;text-align:center}.ftr p{color:#94a3b8;font-size:11px;margin:4px 0}
</style></head><body><div class="wrap">
<div class="hdr"><h1>🚀 New Onboarding Request</h1><p>SANNIDH | Compliance & Regulatory Platform</p></div>
<div class="body">
<p style="color:#1e293b;font-size:15px">A new onboarding request has been received from the landing page.</p>
<div class="info">
  <div class="row"><span class="lbl">Name</span><span class="val">${name}</span></div>
  <div class="row"><span class="lbl">Email</span><span class="val">${email}</span></div>
  ${phone ? `<div class="row"><span class="lbl">Phone / WhatsApp</span><span class="val">${phone}</span></div>` : ""}
  ${companyName ? `<div class="row"><span class="lbl">Company</span><span class="val">${companyName}</span></div>` : ""}
  <div class="row"><span class="lbl">Submitted At</span><span class="val">${dateStr} IST</span></div>
</div>
${message ? `<div class="msg"><strong>Requirement:</strong><br>${message}</div>` : ""}
<p style="color:#475569;font-size:13px">📞 Please follow up within 24 hours.</p>
</div>
<div class="ftr"><p>SANNIDH — Compliance & Regulatory Command Platform</p><p>www.sannidh.in</p></div>
</div></body></html>`;

  // ── 2. User confirmation email ─────────────────────────────────────────────
  const userHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc}
.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hdr{background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:36px;text-align:center}
.hdr h1{color:#fff;margin:0;font-size:24px;font-weight:700}.hdr p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px}
.body{padding:36px}
.tick{text-align:center;font-size:60px;margin:0 0 24px}
.card{background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:20px 0;text-align:center}
.card p{color:#166534;font-size:15px;margin:0;line-height:1.6}
.steps{margin:24px 0;padding:0;list-style:none}
.steps li{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569}
.steps li:last-child{border-bottom:none}
.steps .icon{font-size:18px;min-width:28px}
.ftr{padding:24px 32px;background:#f8fafc;text-align:center}.ftr p{color:#94a3b8;font-size:11px;margin:4px 0}
</style></head><body><div class="wrap">
<div class="hdr"><h1>✅ Request Received!</h1><p>SANNIDH | Compliance & Regulatory Platform</p></div>
<div class="body">
<div class="tick">🎉</div>
<p style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 8px">Dear ${name},</p>
<p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px">
  Thank you for reaching out to <strong>SANNIDH</strong>! Your onboarding request has been successfully submitted.
</p>
<div class="card">
  <p>✅ Your query is submitted.<br>Our executive will be in touch with you soon.</p>
</div>
<ul class="steps">
  <li><span class="icon">📋</span><span>We have received your details${companyName ? ` for <strong>${companyName}</strong>` : ""}</span></li>
  <li><span class="icon">⏰</span><span>Our team will review and contact you within <strong>24 hours</strong></span></li>
  <li><span class="icon">📞</span><span>We will reach you at ${phone ? `<strong>${phone}</strong> or ` : ""}<strong>${email}</strong></span></li>
  <li><span class="icon">🌐</span><span>Explore more at <a href="https://www.sannidh.in" style="color:#0ea5e9;font-weight:600">www.sannidh.in</a></span></li>
</ul>
<p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px">Submitted on ${dateStr} IST</p>
</div>
<div class="ftr"><p>SANNIDH — Compliance & Regulatory Command Platform</p><p>www.sannidh.in</p></div>
</div></body></html>`;

  try {
    // Fire all 4 notifications in parallel
    const tasks: Promise<boolean>[] = [
      // 1. Team email
      sendResendEmail(resendKey, fromEmail, TEAM_EMAIL,
        `🚀 New Onboarding Request — ${name}${companyName ? ` (${companyName})` : ""}`,
        teamHtml),
      // 2. User confirmation email
      sendResendEmail(resendKey, fromEmail, email,
        "✅ Your Onboarding Request is Received — SANNIDH",
        userHtml),
    ];

    // 3 & 4. WhatsApp messages (only if phone provided)
    if (phone && phone.trim()) {
      // WhatsApp to user
      tasks.push(sendWhatsApp(phone,
        `Hello ${name}! 👋\n\n✅ *Your query is submitted to SANNIDH.*\n\nOur executive will be in touch with you soon.\n\n📋 *Details received:*\n• Name: ${name}\n• Email: ${email}${companyName ? `\n• Company: ${companyName}` : ""}\n\nThank you for choosing SANNIDH — India's AI-powered Compliance Platform. 🚀\n\nwww.sannidh.in`
      ));
      // WhatsApp alert to team owner
      tasks.push(sendWhatsApp(TEAM_WHATSAPP,
        `🚀 *New Onboarding Request — SANNIDH*\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone}${companyName ? `\n🏢 Company: ${companyName}` : ""}${message ? `\n💬 Requirement: ${message}` : ""}\n\n⏰ Received: ${dateStr} IST\n\nFollow up ASAP! 🔥`
      ));
    }

    await Promise.allSettled(tasks);

    return { success: true };
  } catch (err) {
    console.error("Onboarding lead processing error:", err);
    return { success: false, error: "Processing error" };
  }
}
