-- Filing-readiness assessment snapshots for draft runs

CREATE TABLE public.draft_filing_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_run_id UUID REFERENCES public.draft_runs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  ready BOOLEAN NOT NULL DEFAULT false,
  blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_draft_filing_checks_run_created
  ON public.draft_filing_checks(draft_run_id, created_at DESC);

ALTER TABLE public.draft_filing_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read accessible filing checks"
  ON public.draft_filing_checks FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.draft_runs dr
      WHERE dr.id = draft_filing_checks.draft_run_id
        AND (
          dr.user_id = auth.uid()
          OR (dr.company_id IS NOT NULL AND public.is_company_member(auth.uid(), dr.company_id))
          OR public.has_persona(auth.uid(), 'in_house_lawyer')
          OR (
            public.has_persona(auth.uid(), 'ca_firm')
            AND EXISTS (
              SELECT 1 FROM public.user_roles ur
              WHERE ur.user_id = dr.user_id
                AND ur.role = 'manager'
            )
          )
        )
    )
  );

CREATE POLICY "Managers can create filing checks"
  ON public.draft_filing_checks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'admin')
    )
  );
