-- Migration: Lawyer Dashboard Tables
-- Creates contracts, legal_cases, legal_notices, legal_risks tables
-- Safe to re-run (fully idempotent)

-- ─── Contracts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  vendor_name     TEXT NOT NULL,
  contract_type   TEXT NOT NULL DEFAULT 'service_agreement',
  contract_value  NUMERIC(15,2),
  currency        TEXT NOT NULL DEFAULT 'INR',
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','negotiation','active','expired','archived')),
  risk_level      TEXT CHECK (risk_level IN ('low','medium','high')),
  key_terms       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_company ON public.contracts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_user    ON public.contracts(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status  ON public.contracts(status);

-- ─── Legal Cases ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_title      TEXT NOT NULL,
  case_number     TEXT NOT NULL,
  case_type       TEXT NOT NULL DEFAULT 'civil',
  court_name      TEXT,
  status          TEXT NOT NULL DEFAULT 'ongoing'
                  CHECK (status IN ('ongoing','settled','completed','dismissed')),
  next_hearing    DATE,
  filing_date     DATE,
  assigned_lawyer TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_cases_company ON public.legal_cases(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_cases_user    ON public.legal_cases(created_by, created_at DESC);

-- ─── Legal Notices ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_notices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject           TEXT NOT NULL,
  notice_type       TEXT NOT NULL DEFAULT 'regulatory',
  issued_by         TEXT NOT NULL,
  content           TEXT,
  notice_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  response_due_date DATE,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','responded','resolved','escalated')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_notices_company ON public.legal_notices(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_notices_user    ON public.legal_notices(created_by, created_at DESC);

-- ─── Legal Risks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_risks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  risk_title       TEXT NOT NULL,
  risk_category    TEXT NOT NULL DEFAULT 'contract',
  risk_description TEXT,
  probability      TEXT NOT NULL DEFAULT 'medium'
                   CHECK (probability IN ('low','medium','high')),
  impact           TEXT NOT NULL DEFAULT 'medium'
                   CHECK (impact IN ('low','medium','high')),
  status           TEXT NOT NULL DEFAULT 'identified'
                   CHECK (status IN ('identified','mitigating','monitored','resolved')),
  mitigation_plan  TEXT,
  mitigation_owner TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_risks_company ON public.legal_risks(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_risks_user    ON public.legal_risks(created_by, created_at DESC);

-- ─── Updated-at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_lawyer_tables_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_contracts_updated_at    ON public.contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_lawyer_tables_updated_at();

DROP TRIGGER IF EXISTS trg_legal_cases_updated_at  ON public.legal_cases;
CREATE TRIGGER trg_legal_cases_updated_at
  BEFORE UPDATE ON public.legal_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_lawyer_tables_updated_at();

DROP TRIGGER IF EXISTS trg_legal_notices_updated_at ON public.legal_notices;
CREATE TRIGGER trg_legal_notices_updated_at
  BEFORE UPDATE ON public.legal_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_lawyer_tables_updated_at();

DROP TRIGGER IF EXISTS trg_legal_risks_updated_at   ON public.legal_risks;
CREATE TRIGGER trg_legal_risks_updated_at
  BEFORE UPDATE ON public.legal_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_lawyer_tables_updated_at();

-- ─── RLS — user-scoped (own data + company members) ──────────────────────────
ALTER TABLE public.contracts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_risks   ENABLE ROW LEVEL SECURITY;

-- Helper: can_access_company_data
-- A user can access data if they created it OR they're a member of the same company
CREATE OR REPLACE FUNCTION public.can_access_legal_record(p_created_by UUID, p_company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    auth.uid() = p_created_by
    OR (
      p_company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = p_company_id
      )
    )
    OR public.has_role(auth.uid(), 'admin');
$$;

-- Contracts
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT
  USING (public.can_access_legal_record(created_by, company_id));

DROP POLICY IF EXISTS "contracts_insert" ON public.contracts;
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE
  USING (public.can_access_legal_record(created_by, company_id));

DROP POLICY IF EXISTS "contracts_delete" ON public.contracts;
CREATE POLICY "contracts_delete" ON public.contracts FOR DELETE
  USING (auth.uid() = created_by);

-- Legal Cases
DROP POLICY IF EXISTS "legal_cases_select" ON public.legal_cases;
CREATE POLICY "legal_cases_select" ON public.legal_cases FOR SELECT
  USING (public.can_access_legal_record(created_by, company_id));

DROP POLICY IF EXISTS "legal_cases_insert" ON public.legal_cases;
CREATE POLICY "legal_cases_insert" ON public.legal_cases FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "legal_cases_update" ON public.legal_cases;
CREATE POLICY "legal_cases_update" ON public.legal_cases FOR UPDATE
  USING (public.can_access_legal_record(created_by, company_id));

-- Legal Notices
DROP POLICY IF EXISTS "legal_notices_select" ON public.legal_notices;
CREATE POLICY "legal_notices_select" ON public.legal_notices FOR SELECT
  USING (public.can_access_legal_record(created_by, company_id));

DROP POLICY IF EXISTS "legal_notices_insert" ON public.legal_notices;
CREATE POLICY "legal_notices_insert" ON public.legal_notices FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "legal_notices_update" ON public.legal_notices;
CREATE POLICY "legal_notices_update" ON public.legal_notices FOR UPDATE
  USING (public.can_access_legal_record(created_by, company_id));

-- Legal Risks
DROP POLICY IF EXISTS "legal_risks_select" ON public.legal_risks;
CREATE POLICY "legal_risks_select" ON public.legal_risks FOR SELECT
  USING (public.can_access_legal_record(created_by, company_id));

DROP POLICY IF EXISTS "legal_risks_insert" ON public.legal_risks;
CREATE POLICY "legal_risks_insert" ON public.legal_risks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "legal_risks_update" ON public.legal_risks;
CREATE POLICY "legal_risks_update" ON public.legal_risks FOR UPDATE
  USING (public.can_access_legal_record(created_by, company_id));
