-- Income-tax learning data layer: cases, issue labels, feedback, and coverage.

CREATE TABLE IF NOT EXISTS public.income_tax_training_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_run_id UUID REFERENCES public.draft_runs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE SET NULL,
  notice_class TEXT NOT NULL,
  notice_reference TEXT,
  notice_date DATE,
  notice_snapshot TEXT NOT NULL,
  generated_draft TEXT NOT NULL,
  corrected_draft TEXT,
  status TEXT NOT NULL DEFAULT 'captured' CHECK (status IN ('captured', 'reviewed', 'approved', 'rejected')),
  filing_score INTEGER CHECK (filing_score BETWEEN 0 AND 100),
  risk_band TEXT CHECK (risk_band IN ('low', 'medium', 'high')),
  outcome_label TEXT NOT NULL DEFAULT 'pending' CHECK (outcome_label IN ('pending', 'favorable', 'partly_favorable', 'adverse', 'withdrawn')),
  order_reference TEXT,
  order_date DATE,
  qa_payload JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.income_tax_training_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.income_tax_training_cases(id) ON DELETE CASCADE NOT NULL,
  issue_code TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  detector_source TEXT NOT NULL DEFAULT 'rule' CHECK (detector_source IN ('rule', 'ai', 'ca_review', 'hearing_outcome')),
  issue_text TEXT NOT NULL,
  suggested_fix TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.income_tax_training_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.income_tax_training_cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('draft_quality', 'legal_accuracy', 'facts_alignment', 'hearing_outcome')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_tax_training_cases_user ON public.income_tax_training_cases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_income_tax_training_cases_notice_class ON public.income_tax_training_cases(notice_class);
CREATE INDEX IF NOT EXISTS idx_income_tax_training_cases_status ON public.income_tax_training_cases(status, outcome_label);
CREATE INDEX IF NOT EXISTS idx_income_tax_training_issues_case ON public.income_tax_training_issues(case_id, resolved);
CREATE INDEX IF NOT EXISTS idx_income_tax_training_feedback_case ON public.income_tax_training_feedback(case_id, created_at DESC);

ALTER TABLE public.income_tax_training_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_tax_training_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_tax_training_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own income-tax training cases" ON public.income_tax_training_cases;
CREATE POLICY "Users can manage own income-tax training cases"
  ON public.income_tax_training_cases FOR ALL
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

DROP POLICY IF EXISTS "Users can manage issues for accessible income-tax cases" ON public.income_tax_training_issues;
CREATE POLICY "Users can manage issues for accessible income-tax cases"
  ON public.income_tax_training_issues FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.income_tax_training_cases c
      WHERE c.id = income_tax_training_issues.case_id
        AND (
          c.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR (c.ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), c.ca_firm_id))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.income_tax_training_cases c
      WHERE c.id = income_tax_training_issues.case_id
        AND (
          c.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR (c.ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), c.ca_firm_id))
        )
    )
  );

DROP POLICY IF EXISTS "Users can manage feedback for accessible income-tax cases" ON public.income_tax_training_feedback;
CREATE POLICY "Users can manage feedback for accessible income-tax cases"
  ON public.income_tax_training_feedback FOR ALL
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.income_tax_training_cases c
      WHERE c.id = income_tax_training_feedback.case_id
        AND c.ca_firm_id IS NOT NULL
        AND public.is_ca_firm_member(auth.uid(), c.ca_firm_id)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.income_tax_training_cases c
      WHERE c.id = income_tax_training_feedback.case_id
        AND c.ca_firm_id IS NOT NULL
        AND public.is_ca_firm_member(auth.uid(), c.ca_firm_id)
    )
  );

DROP TRIGGER IF EXISTS update_income_tax_training_cases_updated_at ON public.income_tax_training_cases;
CREATE TRIGGER update_income_tax_training_cases_updated_at
  BEFORE UPDATE ON public.income_tax_training_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.income_tax_training_coverage_v AS
SELECT
  c.notice_class,
  COUNT(*)::INTEGER AS total_cases,
  COUNT(*) FILTER (WHERE c.status = 'approved')::INTEGER AS approved_cases,
  COUNT(*) FILTER (WHERE c.outcome_label = 'favorable')::INTEGER AS favorable_cases,
  COUNT(*) FILTER (WHERE c.outcome_label = 'partly_favorable')::INTEGER AS partly_favorable_cases,
  COUNT(*) FILTER (WHERE c.outcome_label = 'adverse')::INTEGER AS adverse_cases,
  ROUND(AVG(c.filing_score)::numeric, 2) AS avg_filing_score,
  COUNT(i.*)::INTEGER AS total_issue_labels,
  COUNT(i.*) FILTER (WHERE i.resolved)::INTEGER AS resolved_issue_labels
FROM public.income_tax_training_cases c
LEFT JOIN public.income_tax_training_issues i ON i.case_id = c.id
GROUP BY c.notice_class;
