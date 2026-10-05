-- ─────────────────────────────────────────────────────────────────────────────
-- REGULATORY SYNC JOBS
-- One row is created per company whenever a client approves consent.
-- The `regulatory-sync` Edge Function reads this queue, hits GST/MCA portals,
-- calculates a real compliance_health score and writes results back here.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.regulatory_sync_jobs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_request_id  uuid        REFERENCES public.consent_requests(id) ON DELETE CASCADE,
  company_id          uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identifiers to query government portals
  gstin               text,
  pan                 text,
  cin                 text,

  -- Job lifecycle
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','running','completed','failed')),
  error_message       text,

  -- Raw data fetched from portals (JSONB so we can evolve schema without migrations)
  gst_taxpayer_data   jsonb,
  gst_filings_data    jsonb,
  mca_company_data    jsonb,

  -- Computed results written back to companies table
  compliance_score    integer,          -- 0–100
  total_returns_due   integer,
  total_filed_on_time integer,
  total_filed_late    integer,
  total_missing       integer,
  gaps_found          jsonb,            -- Array of {type, description, severity}

  -- Timestamps
  created_at          timestamptz NOT NULL DEFAULT now(),
  started_at          timestamptz,
  completed_at        timestamptz
);

-- RLS: Only the owning CA can read/write their sync jobs
ALTER TABLE public.regulatory_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_owns_sync_jobs" ON public.regulatory_sync_jobs;
CREATE POLICY "ca_owns_sync_jobs"
  ON public.regulatory_sync_jobs FOR ALL
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_jobs_company
  ON public.regulatory_sync_jobs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status
  ON public.regulatory_sync_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_consent
  ON public.regulatory_sync_jobs (consent_request_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-TRIGGER: When consent_status changes to 'approved', enqueue a sync job
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enqueue_regulatory_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.consent_status = 'approved') AND
     (OLD.consent_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.regulatory_sync_jobs
      (consent_request_id, company_id, ca_user_id, gstin, pan, cin, status)
    VALUES
      (NEW.id, NEW.company_id, NEW.ca_user_id, NEW.gstin, NEW.pan, NEW.cin, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_consent_approved ON public.consent_requests;
CREATE TRIGGER on_consent_approved
  AFTER UPDATE ON public.consent_requests
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_regulatory_sync();

-- ─────────────────────────────────────────────────────────────────────────────
-- Add sync_status column to companies (visible on CA dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sync_status      text DEFAULT 'not_synced'
                                            CHECK (sync_status IN ('not_synced','syncing','synced','failed')),
  ADD COLUMN IF NOT EXISTS last_synced_at   timestamptz,
  ADD COLUMN IF NOT EXISTS compliance_gaps  jsonb;
