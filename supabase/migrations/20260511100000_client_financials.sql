-- ─────────────────────────────────────────────────────────────────────────────
-- AI SWARM FINANCIAL ENGINE — Database Layer
-- Stores bank transactions (AI-categorized), auto-generated BS & P&L books,
-- and saved snapshots from all 26 calculator modules per client per FY.
-- This is the Notice Preparation Data Room.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Bank Transactions (AI-Categorized) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_bank_transactions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  transaction_date  date        NOT NULL,
  value_date        date,
  description       text        NOT NULL,
  ref_number        text,
  debit_amount      numeric(15,2) DEFAULT 0,
  credit_amount     numeric(15,2) DEFAULT 0,
  closing_balance   numeric(15,2),
  bank_name         text,
  account_number    text,

  -- AI auto-categorization fields
  ai_category       text        DEFAULT 'uncategorized'
    CHECK (ai_category IN (
      'revenue','purchase','salary','rent','utilities','professional_fees',
      'gst_payment','tds_payment','advance_tax','loan_emi','loan_received',
      'capital_infusion','dividend','interest_income','interest_expense',
      'asset_purchase','asset_sale','refund','misc_income','misc_expense',
      'uncategorized'
    )),
  ai_subcategory    text,
  ai_confidence     numeric(3,2) DEFAULT 0,  -- 0.00–1.00
  bs_mapping        text,  -- which BS line item this maps to
  pl_mapping        text,  -- which P&L line item this maps to
  financial_year    text        NOT NULL, -- '2024-25'
  is_verified       boolean     DEFAULT false,

  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Auto-Generated Financial Books (BS + P&L + Cash Flow) ──────────────────
CREATE TABLE IF NOT EXISTS public.client_financial_books (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year  text          NOT NULL, -- '2024-25'

  book_type       text          NOT NULL
    CHECK (book_type IN ('balance_sheet','profit_loss','cash_flow')),

  -- The full auto-generated statement stored as structured JSON
  book_data       jsonb         NOT NULL DEFAULT '{}',
  -- Summary metrics for quick dashboard display
  summary_metrics jsonb         DEFAULT '{}',
  -- e.g. {total_assets, total_liabilities, net_profit, gross_margin_pct, ...}

  -- Generation metadata
  generated_by    text          DEFAULT 'ai_swarm',  -- 'ai_swarm' | 'manual'
  transaction_count integer     DEFAULT 0,
  generation_log  jsonb         DEFAULT '[]',  -- step-by-step log of how it was generated

  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (company_id, financial_year, book_type)
);

-- ── 3. Module Calculation Snapshots (All 26 Modules) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.client_module_calculations (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year  text          NOT NULL,

  module_id       text          NOT NULL,
  -- One of the 26 module IDs: 'gstr1','gstr2b','gstr3b','itr','epf-esi','financials',
  -- 'board','notices','debtors','invoice','audit','fema-sebi','import-export',
  -- 'prof-cqc','salary-tds','gratuity','board-res','agm-minutes','mca-20b',
  -- 'din-tan','accounting-sync','bank-rec-auto','regime-optimizer',
  -- 'capital-gains','advance-tax-radar','deferred-tax'

  module_label    text          NOT NULL,  -- Human-readable label
  calculation_data jsonb        NOT NULL DEFAULT '{}',  -- The full calculation output
  input_data      jsonb         DEFAULT '{}',  -- The input data used for calculation
  summary         text,         -- One-line AI summary of the result

  status          text          DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','not_applicable')),
  error_message   text,

  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  UNIQUE (company_id, financial_year, module_id)
);

-- ── 4. Notice Data Room (Compiled Summaries for Draft Engine) ─────────────────
CREATE TABLE IF NOT EXISTS public.client_notice_data_room (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year  text          NOT NULL,

  -- Readiness status
  readiness_score integer       DEFAULT 0,  -- 0–100
  total_modules_completed integer DEFAULT 0,
  total_modules integer         DEFAULT 26,

  -- Compiled data for the AI Drafting Engine
  compiled_bs     jsonb         DEFAULT '{}',  -- Copy of balance sheet
  compiled_pl     jsonb         DEFAULT '{}',  -- Copy of P&L
  compiled_cf     jsonb         DEFAULT '{}',  -- Copy of cash flow
  compiled_modules jsonb        DEFAULT '{}',  -- All 26 module snapshots indexed by module_id
  
  -- AI-generated executive summary
  executive_summary text,
  key_financials    jsonb       DEFAULT '{}',  -- Quick-access: revenue, profit, tax, etc.

  last_compiled_at  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, financial_year)
);

-- ── 5. AI Swarm Job Queue ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_swarm_jobs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year  text          NOT NULL,

  job_type        text          NOT NULL
    CHECK (job_type IN ('full_pipeline','bank_process','generate_books','run_modules','compile_data_room')),

  status          text          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  
  progress        integer       DEFAULT 0,  -- 0–100
  current_step    text,
  steps_log       jsonb         DEFAULT '[]',
  error_message   text,

  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- ── RLS (CA owns their client data) ──────────────────────────────────────────
ALTER TABLE public.client_bank_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_financial_books         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_module_calculations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notice_data_room        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_swarm_jobs                  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_owns_bank_txn"      ON public.client_bank_transactions;
DROP POLICY IF EXISTS "ca_owns_fin_books"     ON public.client_financial_books;
DROP POLICY IF EXISTS "ca_owns_mod_calcs"     ON public.client_module_calculations;
DROP POLICY IF EXISTS "ca_owns_data_room"     ON public.client_notice_data_room;
DROP POLICY IF EXISTS "ca_owns_swarm_jobs"    ON public.ai_swarm_jobs;

CREATE POLICY "ca_owns_bank_txn"
  ON public.client_bank_transactions FOR ALL
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "ca_owns_fin_books"
  ON public.client_financial_books FOR ALL
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "ca_owns_mod_calcs"
  ON public.client_module_calculations FOR ALL
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "ca_owns_data_room"
  ON public.client_notice_data_room FOR ALL
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "ca_owns_swarm_jobs"
  ON public.ai_swarm_jobs FOR ALL
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bank_txn_company_fy  ON public.client_bank_transactions (company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_bank_txn_category    ON public.client_bank_transactions (company_id, ai_category);
CREATE INDEX IF NOT EXISTS idx_fin_books_co_fy      ON public.client_financial_books (company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_mod_calcs_co_fy      ON public.client_module_calculations (company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_data_room_co_fy      ON public.client_notice_data_room (company_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_swarm_jobs_status     ON public.ai_swarm_jobs (status, created_at);

-- ── Auto-update timestamps ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS fin_books_updated ON public.client_financial_books;
CREATE TRIGGER fin_books_updated BEFORE UPDATE ON public.client_financial_books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

DROP TRIGGER IF EXISTS mod_calcs_updated ON public.client_module_calculations;
CREATE TRIGGER mod_calcs_updated BEFORE UPDATE ON public.client_module_calculations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

DROP TRIGGER IF EXISTS data_room_updated ON public.client_notice_data_room;
CREATE TRIGGER data_room_updated BEFORE UPDATE ON public.client_notice_data_room
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();
