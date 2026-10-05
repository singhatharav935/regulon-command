-- Migration: Lawyer Review Requests — CA to Lawyer Draft Review Workflow
-- Fully idempotent. Safe to re-run.

-- ─── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lawyer_review_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_run_id    UUID REFERENCES public.draft_runs(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  sent_by         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority        TEXT NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  ca_notes        TEXT,                        -- CA's message to lawyer
  lawyer_comments TEXT,                        -- Lawyer's review notes
  review_status   TEXT NOT NULL DEFAULT 'pending'
                  CHECK (review_status IN ('pending','in_review','approved','changes_requested','rejected')),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lrr_company   ON public.lawyer_review_requests(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lrr_sent_by   ON public.lawyer_review_requests(sent_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lrr_assigned  ON public.lawyer_review_requests(assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lrr_status    ON public.lawyer_review_requests(review_status);
CREATE INDEX IF NOT EXISTS idx_lrr_draft_run ON public.lawyer_review_requests(draft_run_id);

-- ─── Updated-at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_lrr_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lrr_updated_at ON public.lawyer_review_requests;
CREATE TRIGGER trg_lrr_updated_at
  BEFORE UPDATE ON public.lawyer_review_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_lrr_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.lawyer_review_requests ENABLE ROW LEVEL SECURITY;

-- CA can insert (send) a review request
DROP POLICY IF EXISTS "ca_can_send_review" ON public.lawyer_review_requests;
CREATE POLICY "ca_can_send_review" ON public.lawyer_review_requests
  FOR INSERT WITH CHECK (auth.uid() = sent_by);

-- CA can see their own sent requests
DROP POLICY IF EXISTS "ca_can_see_own" ON public.lawyer_review_requests;
CREATE POLICY "ca_can_see_own" ON public.lawyer_review_requests
  FOR SELECT USING (auth.uid() = sent_by);

-- Lawyer can see all requests for their company
DROP POLICY IF EXISTS "lawyer_can_see_company_requests" ON public.lawyer_review_requests;
CREATE POLICY "lawyer_can_see_company_requests" ON public.lawyer_review_requests
  FOR SELECT USING (
    auth.uid() = assigned_to
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = lawyer_review_requests.company_id
      )
    )
  );

-- Lawyer can update review_status, lawyer_comments, reviewed_at
DROP POLICY IF EXISTS "lawyer_can_review" ON public.lawyer_review_requests;
CREATE POLICY "lawyer_can_review" ON public.lawyer_review_requests
  FOR UPDATE USING (
    auth.uid() = assigned_to
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = lawyer_review_requests.company_id
      )
    )
  );

-- Also allow the draft_runs status to be updated by in-house lawyer for same company
-- (extend the existing draft_runs RLS policy to allow lawyer updates)
DROP POLICY IF EXISTS "lawyer_can_update_draft_status" ON public.draft_runs;
CREATE POLICY "lawyer_can_update_draft_status" ON public.draft_runs
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = draft_runs.company_id
      )
    )
  );
