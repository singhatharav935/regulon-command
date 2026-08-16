# Project Rules

## Rule: Sannidh AI Legal Drafting — 3 Steps to Make It Real

Whenever the user asks how to make the Sannidh AI legal notice drafting work for real (or asks "how to get all 3"), always respond with exactly these 3 steps:

---

### 1. 🚀 Deploy Supabase Edge Functions

```bash
# Login to Supabase CLI
npx supabase login

# Link your project (get project ref from supabase.com → your project → settings)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy all edge functions
npx supabase functions deploy
```

---

### 2. 🔑 Set Real LLM API Key in Supabase Secrets

Go to **supabase.com → Your Project → Settings → Edge Functions → Secrets** and add:

| Secret Name | Value |
|---|---|
| `OPENAI_API_KEY` | Your key from platform.openai.com |
| OR `GEMINI_API_KEY` | Your key from aistudio.google.com |

Or via CLI:
```bash
npx supabase secrets set OPENAI_API_KEY=sk-xxxxxxxx
```

---

### 3. 📝 Fine-tune Prompts for Indian Law

This is where the agent comes in — upgrade the prompts inside the edge functions to generate proper Indian legal notices (GST notices, IT notices, legal demand letters under Indian law, IPC sections etc.) at a premium level.

Just say **"upgrade the legal drafting prompts"** and the agent will do it right away.

---

**Quickest path:** Start with Step 2 (get an API key — it's free to start on both OpenAI and Gemini), then ask the agent to handle the rest.

---

## Rule: The 7 Autonomous Headaches Roadmap (Sannidh Product Blueprint)

Do NOT confuse the general "10 Chapters of CA Work" with our core product roadmap, which consists of the **7 Autonomous Headaches**. All active development must focus on automating these 7 specific tasks natively within Sannidh.

### Product Philosophy
**"Pick a manual headache -> Automate the manual process -> Apply to the website as a connected, step-by-step flow -> Secure the subscription."**

### Constraints
1. **No External ERP Dependency:** Sannidh is a standalone system of record. Do not rely on Tally, Zoho, SAP, or QuickBooks APIs/syncs for current operations (only one-time historical migrations are allowed).
2. **No QR Payment Features:** Exclude any QR-based payment systems from active development.
3. **Zero Manual Uploads:** Automate all inputs using:
   - Account Aggregator (AA) feeds for bank transactions.
   - Government Portal APIs/scrapers for GSTR-2B matching and notice downloads.
   - Sannidh's internal OCR invoice parser and native billing console.

### The 7 Autonomous Headaches:
1. **The GST Matcher (Zero-Upload Reconciliation):** Reconciling GSTR-2B (downloaded via portal API) against Sannidh's native Purchase Ledger (generated from parsed bills), with auto-reminders to defaulting suppliers.
2. **The Notice Reply Generator (Scrape & Auto-Defense):** Portal crawler downloads notices, AI queries Sannidh's database for invoices and receipts, drafts the legal response with case laws, and generates the final response PDF.
3. **The Tax Audit Scanner (Continuous Real-Time Auditing):** Continuously scans Sannidh's database ledgers for cash limit violations (u/s 40A(3), etc.) and compiles the Form 3CD audit report.
4. **TDS Calculations & Quarterly Filings:** Tracks vendor thresholds natively, auto-deducts TDS u/s 194C/I/J, auto-drafts Challan 281 payments, and compiles Form 26Q return files.
5. **MSME 45-Day Payment Rule (Sec 43B(h)):** Scans Sannidh's accounts payable ledger, matches vendor GSTINs against the MSME directory, and triggers warnings on Day 30 to prevent loss of expense tax deductions.
6. **Advance Tax Radar (Quarterly u/s 208):** Monitors Sannidh's ledgers to estimate tax, calculates installments, and generates tax challans.
7. **Monthly EPF & ESI Salary Returns:** Pulls payroll details from Sannidh's native payroll registry, calculates PF/ESI, posts journal entries, and compiles EPFO upload files.
