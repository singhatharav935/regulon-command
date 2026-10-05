# SANNIDH | External CA Dashboard - FINAL PRODUCTION AUDIT
**Status:** 🛡️ Hybrid (Core Engine Live / Support Systems Simulated)
**Audit Date:** 2026-05-16 07:45 AM

## 🟢 WHAT IS 100% REAL (PRODUCTION READY)
- **Client Portfolio:** Real onboarding, real GSTIN/PAN validation, real Supabase storage for client metadata.
- **Financial Swarm Engine:** Real Edge Function trigger, real transaction categorization, and real status polling.
- **AI Drafting Engine:** Real legal letter generation using OpenAI and live client financial context.
- **WORM Audit (Partial):** The backend supports hashing, but the UI is not yet reading from the sealed table.
- **Consent Flow:** Real emails and WhatsApp links are generated and tracked in the `consent_requests` table.

## 🔴 WHAT IS 100% SIMULATED (NEEDS BACKEND)
1. **Practice Billing Panel:** 
   - *Current:* Generates "Unbilled Tasks" using a JS loop.
   - *Fix:* Create `ca_invoices` table and link to completed task logs.
2. **Task & Filing Management:**
   - *Current:* Hardcoded templates (GSTR-3B, etc.) mapped to clients.
   - *Fix:* Must query `client_statutory_deadlines` and `government_sync_logs`.
3. **Regulatory News & Impact:**
   - *Current:* A static array of 10 Indian Law updates.
   - *Fix:* Connect to a real RSS/Scraper service or Supabase Edge Function cron job.
4. **Client Dependency Tracker:**
   - *Current:* Generates "Missing Docs" based on a client's health score.
   - *Fix:* Create `document_requests` table and link to the Client Portal.
5. **Communication Logs:**
   - *Current:* Randomly assigns "Query" or "Escalation" statuses to clients.
   - *Fix:* Link to real `communication_logs` table (requires Email/WhatsApp webhook integration).

## 📊 DATABASE GAPS (MISSING TABLES)
The following tables exist in the UI logic but are **MISSING** from the Supabase schema:
- `ca_dependencies` (For document tracking)
- `ca_task_history` (For filing proof)
- `ca_firm_invoices` (For billing)
- `regulatory_news_feed` (For live updates)

## 🏁 NEXT STEPS FOR "PRODUCTION FLIP"
1. **Migration Phase:** Deploy the missing tables listed above.
2. **Scaffold Removal:** Replace `DEMO_DATA` arrays with `useEffect` Supabase queries in the following components:
   - `PracticeBillingPanel.tsx`
   - `TaskFilingManagement.tsx`
   - `RegulatoryNewsRuleImpact.tsx`
3. **Polling Implementation:** Replace `setTimeout` timers in `ClientPortfolioSection.tsx` with real job-status polling.

## 🔑 REQUIRED SECRETS & API KEYS (USER ACTION NEEDED)
The following keys must be injected into your **Supabase Edge Function Secrets** to enable real-world government connectivity. Without these, the system will continue to fail back to simulations:

| Secret Name | Purpose | Source |
|-------------|---------|--------|
| `GSTN_GSP_API_KEY` | Pulling real GST returns & notices | GSTN GSP Portal |
| `SETU_CLIENT_ID` | Account Aggregator / Bank Sync | Setu.co |
| `SETU_SECRET` | Account Aggregator / Bank Sync | Setu.co |
| `MCA_API_KEY` | Fetching ROC filings & director data | MCA Portal / API Provider |
| `OPENAI_API_KEY` | AI Drafting & Impact Analysis | OpenAI |
| `ENCRYPTION_KEY` | Encrypting client portal passwords | Generate a 32-char string |
| `RESEND_API_KEY` | Sending Consent emails to clients | Resend.com |

> [!TIP]
> Use the command: `supabase secrets set SECRET_NAME=VALUE` for each of these.

## 🛡️ FOUNDATION TRUTH (DATABASE MIGRATIONS LOCKED)
The following files define the real backend logic we will be wiring into:
- `supabase/migrations/20260511200000_govt_notices.sql`
- `supabase/migrations/20260511100000_client_financials.sql`
- `supabase/migrations/20260511600000_portal_credentials.sql`
- `supabase/migrations/20260511300000_bank_upload_system.sql`

## 🗺️ STEP-BY-STEP PRODUCTION HARDENING ROADMAP

### **Step 1: The Engine Room (Sync & Polling)**
*   **Target:** `ClientPortfolioSection.tsx`
*   **DELETE:** All `setTimeout` blocks (35s and 45s timers) inside the Sync and Swarm handlers.
*   **FIX:** Implement real-time polling against `regulatory_sync_jobs` and `ai_swarm_jobs`.
*   **USER ACTION:** Inject `GSTN_GSP_API_KEY` and `SETU_CLIENT_ID` into Supabase Secrets.

### **Step 2: The Control Tower (Notices & Tasks)**
*   **Target:** `TaskFilingManagement.tsx`
*   **DELETE:** `TASK_TEMPLATES` array and the `loadRealTaskData` function that generates fake rows.
*   **FIX:** Wire the table to `client_govt_notices`.
*   **USER ACTION:** Run the `20260511200000_govt_notices.sql` migration in your Supabase SQL Editor.

### **Step 3: The Client Vault (Dependencies & Docs)**
*   **Target:** `ClientDependencyTracker.tsx`
*   **DELETE:** `DEPENDENCY_TEMPLATES` and the logic that "guesses" documents are missing.
*   **FIX:** Create the `ca_dependencies` table and link to real document requests.
*   **USER ACTION:** Manually insert at least 1 real pending document request into the `ca_dependencies` table for testing.

### **Step 4: The Audit Trail (Logs & History)**
*   **Target:** `CommunicationLogsLive.tsx` & `ComplianceHealthChangeLog.tsx`
*   **DELETE:** `COMM_TEMPLATES` and the hardcoded `previous_score: 50` logic.
*   **FIX:** Wire to `communication_logs` and `compliance_score_history`.
*   **USER ACTION:** Enable "Database Webhooks" in Supabase to automatically log system actions to the audit tables.

### **Step 5: The Command Center (Analytics & Revenue)**
*   **Target:** `CAAnalyticsPerformance.tsx` & `RegulatoryNewsRuleImpact.tsx`
*   **DELETE:** `DEMO_ANALYTICS` object and the `LIVE_REGULATORY_NEWS` hardcoded array.
*   **FIX:** Implement PostgreSQL aggregation for revenue and live news scrapers.
*   **USER ACTION:** Provide `OPENAI_API_KEY` to enable the AI Impact Analysis for the live news feed.
