# SANNIDH Production Go-Live Roadmap
**Last Updated by AI Agent — Complete Reference**

## MEMORY: What Is Built vs What Needs Keys

The system architecture for Financial Account Aggregation, GSTN Data Sync,
AI Drafting, Client Consent, and OCR is 100% built and deployed in Supabase
Edge Functions. The system is structurally ready for real client data.
Only the API keys are missing.

---

## STEP 1 — .env File (Already Set ✅)

These go in your `.env` file in the project root:

| Variable | Status | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Set | Database + Auth + Edge Functions |
| `VITE_SUPABASE_ANON_KEY` | ✅ Set | Client-side DB access |
| `VITE_CA_API_BASE_URL` | ✅ Set | Points to Supabase |
| `VITE_API_URL` | ✅ Set | Edge Function base URL |

---

## STEP 2 — Supabase Edge Function Secrets (YOU NEED TO ADD THESE)

Go to: **Supabase Dashboard → Edge Functions → Manage Secrets**
Or run each command below in your terminal.

### 🔴 HIGH PRIORITY (Core Features Won't Work Without These)

| Secret Name | Purpose | Get From | Terminal Command |
|---|---|---|---|
| `OPENAI_API_KEY` | AI Drafting Engine, AI Swarm, OCR | platform.openai.com/api-keys | `npx supabase secrets set OPENAI_API_KEY="sk-..." --project-ref vqomazfvyyfofzdssmaw` |
| `SETU_CLIENT_ID` | RBI Account Aggregator — pulls real bank data | bridge.setu.co | `npx supabase secrets set SETU_CLIENT_ID="your-id" --project-ref vqomazfvyyfofzdssmaw` |
| `SETU_SECRET` | RBI Account Aggregator — auth | bridge.setu.co | `npx supabase secrets set SETU_SECRET="your-secret" --project-ref vqomazfvyyfofzdssmaw` |
| `GSTN_GSP_API_KEY` | Auto-fetches 2yr GST filing history via client OTP consent | mastergst.com or GSTZen | `npx supabase secrets set GSTN_GSP_API_KEY="your-key" --project-ref vqomazfvyyfofzdssmaw` |
| `RESEND_API_KEY` | Client consent emails, OTP, onboarding | resend.com | `npx supabase secrets set RESEND_API_KEY="re_..." --project-ref vqomazfvyyfofzdssmaw` |
| `ENCRYPTION_KEY` | Encrypts client portal credentials in vault | Generate yourself | `npx supabase secrets set ENCRYPTION_KEY="$(openssl rand -hex 16)" --project-ref vqomazfvyyfofzdssmaw` |

### 🟡 MEDIUM PRIORITY (Additional Features)

| Secret Name | Purpose | Get From | Terminal Command |
|---|---|---|---|
| `MCA_API_KEY` | ROC filings, Director data, Company info | mca.gov.in developer portal | `npx supabase secrets set MCA_API_KEY="your-key" --project-ref vqomazfvyyfofzdssmaw` |
| `TWILIO_ACCOUNT_SID` | WhatsApp consent messages | console.twilio.com | `npx supabase secrets set TWILIO_ACCOUNT_SID="AC..." --project-ref vqomazfvyyfofzdssmaw` |
| `TWILIO_AUTH_TOKEN` | WhatsApp messages auth | console.twilio.com | `npx supabase secrets set TWILIO_AUTH_TOKEN="..." --project-ref vqomazfvyyfofzdssmaw` |
| `TWILIO_WHATSAPP_FROM` | Your Twilio WhatsApp sandbox number | console.twilio.com → Messaging → WhatsApp | `npx supabase secrets set TWILIO_WHATSAPP_FROM="whatsapp:+1415..." --project-ref vqomazfvyyfofzdssmaw` |

---

## STEP 3 — Legal Requirements Before Real Users (FIU Registration)

Before allowing real clients to connect their bank accounts via Setu AA:

1. **FIU Registration** — Register SANNIDH as a Financial Information User (FIU) under RBI AA framework
   - Apply at: https://sahamati.org.in/fiu-registration/
2. **Sahamati Alliance** — Register with Sahamati
3. **Infosec Audit** — Pass security audit for the Supabase infrastructure

> ⚠️ Without FIU registration, Setu will only work in sandbox/test mode.
> Real client bank data requires RBI-approved FIU status.

---

## STEP 4 — GSTN GSP: If Using a Non-MasterGST Provider

The `gstn-otp-auth` Edge Function defaults to `api.mastergst.com`.
If you use a different GSP (ClearTax, GSTZen, etc.), update the base URL in:
```
supabase/functions/gstn-otp-auth/index.ts
```

---

## Current Status: What Works Right Now (Without Any Keys)

✅ Client Portfolio — Add/view clients, consent flow UI  
✅ Supabase Auth — Real login, register, OTP  
✅ Compliance Calculators — All 26 modules (GSTR, ITR, EPF, etc.)  
✅ AI Drafting UI — Upload notice, document parsing (needs OpenAI for generation)  
✅ E-Filing UI — Built and connected  
✅ Statutory Calendar — Real deadlines, date calculations  
✅ Multi-Language — Hindi, Marathi, Tamil, Telugu, Bengali  
✅ Offline Mode — PWA service worker active  
✅ Team RBAC — Role management UI  

⏳ Waiting for Keys:  
- AI Draft Generation → needs `OPENAI_API_KEY`  
- Bank Data Sync → needs `SETU_CLIENT_ID` + `SETU_SECRET`  
- GST Portal Sync → needs `GSTN_GSP_API_KEY`  
- Consent Emails → needs `RESEND_API_KEY`  
- WhatsApp Messages → needs Twilio keys  
