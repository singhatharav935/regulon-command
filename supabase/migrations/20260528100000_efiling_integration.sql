-- ============================================================
-- E-Filing Integration — Gap 2
-- Migration: 20260528100000
-- Purpose: Full e-filing workflow: portal credentials, filing
--          jobs, status tracking, government portal callbacks
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.efiling_portal AS ENUM (
    'gst_portal', 'mca21', 'income_tax', 'traces', 'epfo', 'esic', 'roc'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.efiling_status AS ENUM (
    'draft', 'ready_to_submit', 'submitted', 'under_processing',
    'acknowledged', 'approved', 'rejected', 'reverted', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.efiling_type AS ENUM (
    'gstr1', 'gstr3b', 'gstr9', 'gstr9c',
    'itr1', 'itr3', 'itr4', 'itr5', 'itr6', 'itr7',
    'form26q', 'form24q', 'form27eq',
    'mca_aoc4', 'mca_mgt7', 'mca_dir3kyc',
    'form_26as', 'adt1', 'adt2',
    'pt_return', 'roc_filing', 'epf_ecr', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- Table 1: efiling_portal_credentials
-- Encrypted portal credentials per entity per portal
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_portal_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES public.entities(id) ON DELETE CASCADE,

  portal          public.efiling_portal NOT NULL,
  portal_username TEXT NOT NULL,
  -- Password stored as AES-256 encrypted blob (encrypted at app layer before insert)
  portal_password_enc  TEXT,
  -- OAuth / token-based portals
  access_token_enc     TEXT,
  refresh_token_enc    TEXT,
  token_expires_at     TIMESTAMPTZ,
  -- Additional identifiers
  gstin           VARCHAR(15),
  tan             VARCHAR(10),
  pan             VARCHAR(10),
  din             VARCHAR(8),
  -- Status
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  last_error      TEXT,

  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT efiling_creds_unique UNIQUE (ca_user_id, entity_id, portal)
);

CREATE INDEX IF NOT EXISTS idx_efiling_creds_ca     ON public.efiling_portal_credentials (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_efiling_creds_entity ON public.efiling_portal_credentials (entity_id);
CREATE INDEX IF NOT EXISTS idx_efiling_creds_portal ON public.efiling_portal_credentials (portal);

CREATE OR REPLACE TRIGGER trg_efiling_creds_updated
  BEFORE UPDATE ON public.efiling_portal_credentials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.efiling_portal_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY efiling_creds_select ON public.efiling_portal_credentials
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY efiling_creds_insert ON public.efiling_portal_credentials
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_creds_update ON public.efiling_portal_credentials
  FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_creds_delete ON public.efiling_portal_credentials
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 2: efiling_jobs
-- Individual filing submissions — one row per form submission
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id           UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  credential_id       UUID REFERENCES public.efiling_portal_credentials(id) ON DELETE SET NULL,

  -- Filing details
  filing_type         public.efiling_type NOT NULL,
  portal              public.efiling_portal NOT NULL,
  filing_title        TEXT NOT NULL,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  due_date            DATE,

  -- Status lifecycle
  status              public.efiling_status NOT NULL DEFAULT 'draft',
  status_message      TEXT,
  progress_percent    INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),

  -- Government acknowledgment
  ack_number          TEXT,
  ack_date            TIMESTAMPTZ,
  ack_pdf_url         TEXT,

  -- Filing data (form payload for submission)
  form_data           JSONB NOT NULL DEFAULT '{}',
  computation_data    JSONB NOT NULL DEFAULT '{}',   -- tax computation details

  -- AI review
  ai_review_notes     TEXT,
  ai_reviewed_at      TIMESTAMPTZ,
  ca_approved         BOOLEAN NOT NULL DEFAULT FALSE,
  ca_approved_at      TIMESTAMPTZ,
  ca_approved_by      UUID REFERENCES auth.users(id),

  -- Submission tracking
  submitted_at        TIMESTAMPTZ,
  last_status_check   TIMESTAMPTZ,
  retry_count         INT NOT NULL DEFAULT 0,
  next_retry_at       TIMESTAMPTZ,

  -- Error tracking
  last_error          TEXT,
  error_code          TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_efiling_jobs_ca         ON public.efiling_jobs (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_efiling_jobs_entity     ON public.efiling_jobs (entity_id);
CREATE INDEX IF NOT EXISTS idx_efiling_jobs_status     ON public.efiling_jobs (status);
CREATE INDEX IF NOT EXISTS idx_efiling_jobs_due        ON public.efiling_jobs (due_date);
CREATE INDEX IF NOT EXISTS idx_efiling_jobs_portal     ON public.efiling_jobs (portal);
CREATE INDEX IF NOT EXISTS idx_efiling_jobs_created    ON public.efiling_jobs (created_at DESC);

CREATE OR REPLACE TRIGGER trg_efiling_jobs_updated
  BEFORE UPDATE ON public.efiling_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.efiling_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY efiling_jobs_select ON public.efiling_jobs
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY efiling_jobs_insert ON public.efiling_jobs
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_jobs_update ON public.efiling_jobs
  FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_jobs_delete ON public.efiling_jobs
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 3: efiling_status_log
-- Full audit trail of every status change per filing
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_status_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.efiling_jobs(id) ON DELETE CASCADE,
  ca_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  old_status  public.efiling_status,
  new_status  public.efiling_status NOT NULL,
  message     TEXT,
  actor       TEXT NOT NULL DEFAULT 'system',  -- 'system' | 'ca' | 'government'
  raw_payload JSONB DEFAULT '{}',              -- raw government API response

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_efiling_log_job    ON public.efiling_status_log (job_id);
CREATE INDEX IF NOT EXISTS idx_efiling_log_ca     ON public.efiling_status_log (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_efiling_log_ts     ON public.efiling_status_log (created_at DESC);

ALTER TABLE public.efiling_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY efiling_log_select ON public.efiling_status_log
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY efiling_log_insert ON public.efiling_status_log
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 4: efiling_documents
-- Documents attached to a filing (computation sheets, annexures)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES public.efiling_jobs(id) ON DELETE CASCADE,
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  document_name   TEXT NOT NULL,
  document_type   TEXT NOT NULL DEFAULT 'annexure'
                    CHECK (document_type IN (
                      'computation_sheet','annexure','acknowledgment',
                      'supporting_document','signed_copy','other'
                    )),
  file_path       TEXT,   -- Supabase Storage path
  file_size_bytes BIGINT,
  mime_type       TEXT,
  is_government_generated BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_efiling_docs_job ON public.efiling_documents (job_id);
CREATE INDEX IF NOT EXISTS idx_efiling_docs_ca  ON public.efiling_documents (ca_user_id);

ALTER TABLE public.efiling_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY efiling_docs_select ON public.efiling_documents
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY efiling_docs_insert ON public.efiling_documents
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_docs_delete ON public.efiling_documents
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 5: efiling_templates
-- CA-customised templates for recurring filings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  template_name   TEXT NOT NULL,
  filing_type     public.efiling_type NOT NULL,
  portal          public.efiling_portal NOT NULL,
  default_data    JSONB NOT NULL DEFAULT '{}',
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_efiling_templates_ca ON public.efiling_templates (ca_user_id);

CREATE OR REPLACE TRIGGER trg_efiling_templates_updated
  BEFORE UPDATE ON public.efiling_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.efiling_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY efiling_templates_ca_select ON public.efiling_templates
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY efiling_templates_ca_insert ON public.efiling_templates
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_templates_ca_update ON public.efiling_templates
  FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY efiling_templates_ca_delete ON public.efiling_templates
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Helper Function: Auto-log status changes
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_efiling_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.efiling_status_log
      (job_id, ca_user_id, old_status, new_status, message, actor)
    VALUES
      (NEW.id, NEW.ca_user_id, OLD.status, NEW.status,
       NEW.status_message, 'system');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_efiling_status_log
  AFTER UPDATE ON public.efiling_jobs
  FOR EACH ROW EXECUTE FUNCTION public.log_efiling_status_change();

-- ────────────────────────────────────────────────────────────
-- View: efiling_dashboard_summary
-- Per-CA summary for the dashboard stats bar
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.efiling_dashboard_summary AS
SELECT
  ca_user_id,
  COUNT(*)                                              AS total_filings,
  COUNT(*) FILTER (WHERE status = 'draft')              AS draft_count,
  COUNT(*) FILTER (WHERE status = 'ready_to_submit')    AS ready_count,
  COUNT(*) FILTER (WHERE status = 'submitted')          AS submitted_count,
  COUNT(*) FILTER (WHERE status = 'acknowledged')       AS acknowledged_count,
  COUNT(*) FILTER (WHERE status = 'approved')           AS approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected')           AS rejected_count,
  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('approved','acknowledged','cancelled')) AS overdue_count,
  COUNT(*) FILTER (WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND status NOT IN ('approved','acknowledged','cancelled')) AS due_this_week
FROM public.efiling_jobs
GROUP BY ca_user_id;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.efiling_dashboard_summary TO authenticated;
