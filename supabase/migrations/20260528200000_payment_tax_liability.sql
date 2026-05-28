-- ============================================================
-- Payment / Tax-Liability Automation — Gap 3
-- Migration: 20260528200000
-- Purpose: Tax liability calculation engine, payment tracking,
--          gateway integration, reconciliation, scheduled reminders
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.tax_type AS ENUM (
    'gst_igst','gst_cgst','gst_sgst','gst_cess',
    'tds','tcs','advance_tax','self_assessment_tax',
    'corporate_tax','professional_tax','pt_employer',
    'epf_employee','epf_employer','esic_employee','esic_employer',
    'customs_duty','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending','initiated','processing','success','failed',
    'refunded','partially_paid','scheduled','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_gateway AS ENUM (
    'razorpay','payu','cashfree','stripe','upi_direct',
    'neft','rtgs','cheque','challan_offline','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.challan_type AS ENUM (
    'itns280','itns281','itns282','itns283','itns285',
    'gst_pmt06','gst_pmt08','epf_ecr','esic_challan','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- Table 1: tax_liability_heads
-- Master table of all tax heads per entity per period
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tax_liability_heads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id           UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  company_id          UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  tax_type            public.tax_type NOT NULL,
  tax_label           TEXT NOT NULL,          -- e.g. "GSTR-3B July 2026 CGST"

  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  due_date            DATE NOT NULL,

  -- Liability amounts (in paise / smallest unit for precision)
  gross_liability_paise   BIGINT NOT NULL DEFAULT 0,
  itc_available_paise     BIGINT NOT NULL DEFAULT 0,
  net_liability_paise     BIGINT NOT NULL DEFAULT 0,  -- gross - itc
  interest_paise          BIGINT NOT NULL DEFAULT 0,
  penalty_paise           BIGINT NOT NULL DEFAULT 0,
  late_fee_paise          BIGINT NOT NULL DEFAULT 0,
  total_due_paise         BIGINT NOT NULL DEFAULT 0,  -- net + interest + penalty + late_fee
  amount_paid_paise       BIGINT NOT NULL DEFAULT 0,
  balance_due_paise       BIGINT GENERATED ALWAYS AS (total_due_paise - amount_paid_paise) STORED,

  -- Computation details
  computation_data    JSONB NOT NULL DEFAULT '{}',  -- breakdown of how liability was computed
  ai_computation      BOOLEAN NOT NULL DEFAULT FALSE,
  ai_notes            TEXT,

  -- Status
  is_paid             BOOLEAN NOT NULL DEFAULT FALSE,
  is_nil_return       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Challan reference
  challan_type        public.challan_type,
  bsr_code            VARCHAR(7),
  challan_serial_no   VARCHAR(5),
  challan_date        DATE,
  challan_amount_paise BIGINT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tax_liability_period_check CHECK (period_end >= period_start),
  CONSTRAINT tax_liability_entity_or_company CHECK (entity_id IS NOT NULL OR company_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tlh_ca         ON public.tax_liability_heads (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_tlh_entity     ON public.tax_liability_heads (entity_id);
CREATE INDEX IF NOT EXISTS idx_tlh_company    ON public.tax_liability_heads (company_id);
CREATE INDEX IF NOT EXISTS idx_tlh_due        ON public.tax_liability_heads (due_date);
CREATE INDEX IF NOT EXISTS idx_tlh_tax_type   ON public.tax_liability_heads (tax_type);
CREATE INDEX IF NOT EXISTS idx_tlh_is_paid    ON public.tax_liability_heads (is_paid);

CREATE OR REPLACE TRIGGER trg_tlh_updated_at
  BEFORE UPDATE ON public.tax_liability_heads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tax_liability_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tlh_select ON public.tax_liability_heads FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY tlh_insert ON public.tax_liability_heads FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY tlh_update ON public.tax_liability_heads FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY tlh_delete ON public.tax_liability_heads FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 2: payment_transactions
-- Every payment attempt against a tax liability
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liability_id        UUID REFERENCES public.tax_liability_heads(id) ON DELETE SET NULL,
  entity_id           UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  company_id          UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- Payment metadata
  gateway             public.payment_gateway NOT NULL,
  amount_paise        BIGINT NOT NULL CHECK (amount_paise > 0),
  currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
  status              public.payment_status NOT NULL DEFAULT 'pending',

  -- Gateway response
  gateway_order_id    TEXT,
  gateway_payment_id  TEXT,
  gateway_signature   TEXT,
  gateway_response    JSONB DEFAULT '{}',

  -- Challan / govt receipt
  challan_number      TEXT,
  bank_reference_no   TEXT,
  payment_mode        TEXT,      -- 'net_banking', 'debit_card', 'upi', etc.
  bank_name           TEXT,
  payment_date        DATE,

  -- Purpose & notes
  description         TEXT NOT NULL,
  notes               JSONB DEFAULT '{}',
  failure_reason      TEXT,

  -- Timestamps
  initiated_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_ca          ON public.payment_transactions (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_pt_liability   ON public.payment_transactions (liability_id);
CREATE INDEX IF NOT EXISTS idx_pt_entity      ON public.payment_transactions (entity_id);
CREATE INDEX IF NOT EXISTS idx_pt_status      ON public.payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_pt_gateway     ON public.payment_transactions (gateway);
CREATE INDEX IF NOT EXISTS idx_pt_created     ON public.payment_transactions (created_at DESC);

CREATE OR REPLACE TRIGGER trg_pt_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_select ON public.payment_transactions FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY pt_insert ON public.payment_transactions FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY pt_update ON public.payment_transactions FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY pt_delete ON public.payment_transactions FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Auto-update liability paid status on payment success
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_liability_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total_paid BIGINT;
  total_due  BIGINT;
BEGIN
  IF NEW.status = 'success' AND NEW.liability_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount_paise),0)
    INTO total_paid
    FROM public.payment_transactions
    WHERE liability_id = NEW.liability_id AND status = 'success';

    SELECT total_due_paise
    INTO total_due
    FROM public.tax_liability_heads
    WHERE id = NEW.liability_id;

    UPDATE public.tax_liability_heads
    SET
      amount_paid_paise = total_paid,
      is_paid = (total_paid >= total_due),
      updated_at = now()
    WHERE id = NEW.liability_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_liability_on_payment
  AFTER INSERT OR UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_liability_on_payment();

-- ────────────────────────────────────────────────────────────
-- Table 3: payment_reminders
-- Scheduled reminders for upcoming tax payments
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liability_id    UUID REFERENCES public.tax_liability_heads(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES public.entities(id) ON DELETE CASCADE,

  reminder_date   DATE NOT NULL,
  reminder_type   TEXT NOT NULL DEFAULT 'email'
                    CHECK (reminder_type IN ('email','sms','whatsapp','in_app','all')),
  message         TEXT NOT NULL,
  recipients      JSONB NOT NULL DEFAULT '[]',

  is_sent         BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,
  delivery_status JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_ca          ON public.payment_reminders (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_pr_date        ON public.payment_reminders (reminder_date);
CREATE INDEX IF NOT EXISTS idx_pr_is_sent     ON public.payment_reminders (is_sent);

CREATE OR REPLACE TRIGGER trg_pr_updated_at
  BEFORE UPDATE ON public.payment_reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_select ON public.payment_reminders FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY pr_insert ON public.payment_reminders FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY pr_update ON public.payment_reminders FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY pr_delete ON public.payment_reminders FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 4: payment_reconciliation
-- Match bank transactions with tax payments
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_reconciliation (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id      UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  liability_id        UUID REFERENCES public.tax_liability_heads(id) ON DELETE SET NULL,

  -- Bank statement line
  bank_txn_date       DATE NOT NULL,
  bank_txn_amount_paise BIGINT NOT NULL,
  bank_narration      TEXT,
  bank_reference      TEXT,

  -- Match status
  is_matched          BOOLEAN NOT NULL DEFAULT FALSE,
  match_confidence    NUMERIC(3,2) DEFAULT 0,  -- 0.00 to 1.00
  match_method        TEXT DEFAULT 'manual'
                        CHECK (match_method IN ('manual','ai','exact','fuzzy')),
  mismatch_reason     TEXT,

  reconciled_at       TIMESTAMPTZ,
  reconciled_by       UUID REFERENCES auth.users(id),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_ca        ON public.payment_reconciliation (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_recon_txn       ON public.payment_reconciliation (transaction_id);
CREATE INDEX IF NOT EXISTS idx_recon_liability ON public.payment_reconciliation (liability_id);
CREATE INDEX IF NOT EXISTS idx_recon_matched   ON public.payment_reconciliation (is_matched);

CREATE OR REPLACE TRIGGER trg_recon_updated_at
  BEFORE UPDATE ON public.payment_reconciliation
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.payment_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY recon_select ON public.payment_reconciliation FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY recon_insert ON public.payment_reconciliation FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY recon_update ON public.payment_reconciliation FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 5: tax_computation_rules
-- CA-defined rules for automated tax calculation
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tax_computation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES public.entities(id) ON DELETE CASCADE,

  rule_name       TEXT NOT NULL,
  tax_type        public.tax_type NOT NULL,
  -- Rule definition as JSON (e.g. {"rate": 0.18, "threshold": 2000000})
  rule_definition JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  applies_from    DATE NOT NULL,
  applies_until   DATE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tcr_ca     ON public.tax_computation_rules (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_tcr_entity ON public.tax_computation_rules (entity_id);

CREATE OR REPLACE TRIGGER trg_tcr_updated_at
  BEFORE UPDATE ON public.tax_computation_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tax_computation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tcr_select ON public.tax_computation_rules FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY tcr_insert ON public.tax_computation_rules FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY tcr_update ON public.tax_computation_rules FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY tcr_delete ON public.tax_computation_rules FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- View: payment_dashboard_summary
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.payment_dashboard_summary AS
SELECT
  t.ca_user_id,
  COUNT(*)                                                  AS total_liabilities,
  COUNT(*) FILTER (WHERE t.is_paid)                         AS paid_count,
  COUNT(*) FILTER (WHERE NOT t.is_paid)                     AS unpaid_count,
  COUNT(*) FILTER (WHERE NOT t.is_paid AND t.due_date < CURRENT_DATE) AS overdue_count,
  COUNT(*) FILTER (WHERE NOT t.is_paid AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS due_this_week,
  COALESCE(SUM(t.total_due_paise), 0)                       AS total_due_paise,
  COALESCE(SUM(t.amount_paid_paise), 0)                     AS total_paid_paise,
  COALESCE(SUM(t.balance_due_paise) FILTER (WHERE NOT t.is_paid), 0) AS total_balance_paise
FROM public.tax_liability_heads t
GROUP BY t.ca_user_id;

GRANT SELECT ON public.payment_dashboard_summary TO authenticated;

-- ────────────────────────────────────────────────────────────
-- View: upcoming_payments (next 30 days, unpaid)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.upcoming_payments AS
SELECT
  t.*,
  e.entity_name,
  e.entity_type,
  e.gstin,
  e.pan
FROM public.tax_liability_heads t
LEFT JOIN public.entities e ON e.id = t.entity_id
WHERE NOT t.is_paid
  AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
ORDER BY t.due_date ASC;

GRANT SELECT ON public.upcoming_payments TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
