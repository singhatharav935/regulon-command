/**
 * Onboarding Lead Email Handler
 * Called from the send-consent edge function when action=onboarding_lead
 * Sends a notification email to the Sannidh team via Resend
 */

const TEAM_EMAIL = "rishabhshukla2510@gmail.com";

export async function handleOnboardingLead(body: {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    return { success: false, error: "Email service not configured" };
  }

  const { name, email, phone, companyName, message } = body;

  // Validate required fields
  if (!name || !email) {
    return { success: false, error: "Name and email are required" };
  }

  const now = new Date();
  const dateStr = now.toLocaleString("en-IN", { 
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
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
  ${phone ? `<div class="row"><span class="lbl">Phone</span><span class="val">${phone}</span></div>` : ""}
  ${companyName ? `<div class="row"><span class="lbl">Company</span><span class="val">${companyName}</span></div>` : ""}
  <div class="row"><span class="lbl">Submitted At</span><span class="val">${dateStr}</span></div>
</div>
${message ? `<div class="msg"><strong>Requirement:</strong><br>${message}</div>` : ""}
<p style="color:#475569;font-size:13px">Please follow up with this lead at the earliest.</p>
</div>
<div class="ftr"><p>SANNIDH — Compliance & Regulatory Command Platform</p><p>www.sannidh.in</p></div>
</div></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "SANNIDH <noreply@sannidh.com>",
        to: [TEAM_EMAIL],
        subject: `🚀 New Onboarding Request — ${name} (${companyName || "N/A"})`,
        html,
        reply_to: email,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return { success: false, error: "Failed to send notification email" };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Email service error" };
  }
}
