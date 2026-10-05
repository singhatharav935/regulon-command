-- Post-launch readiness backend:
-- KPI snapshots, churn/risk alerts, model quality reviews, and hotfix/rollback tracking.

CREATE TABLE IF NOT EXISTS public.postlaunch_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  activation_count INTEGER NOT NULL DEFAULT 0 CHECK (activation_count >= 0),
  draft_success_count INTEGER NOT NULL DEFAULT 0 CHECK (draft_success_count >= 0),
  draft_failure_count INTEGER NOT NULL DEFAULT 0 CHECK (draft_failure_count >= 0),
  active_companies_count INTEGER NOT NULL DEFAULT 0 CHECK (active_companies_count >= 0),
  active_ca_users_count INTEGER NOT NULL DEFAULT 0 CHECK (active_ca_users_count >= 0),
  churn_risk_companies_count INTEGER NOT NULL DEFAULT 0 CHECK (churn_risk_companies_count >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date)
);

CREATE TABLE IF NOT EXISTS public.postlaunch_risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('churn_risk', 'workflow_failure_spike', 'sla_breach_spike', 'payment_risk', 'compliance_risk')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  title TEXT NOT NULL,
  detail TEXT,
  owner_user_id UUID,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.postlaunch_model_quality_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_window_start DATE NOT NULL,
  review_window_end DATE NOT NULL,
  sample_size INTEGER NOT NULL CHECK (sample_size > 0),
  hallucination_rate_percent NUMERIC(6,3) NOT NULL CHECK (hallucination_rate_percent >= 0 AND hallucination_rate_percent <= 100),
  citation_coverage_percent NUMERIC(6,3) NOT NULL CHECK (citation_coverage_percent >= 0 AND citation_coverage_percent <= 100),
  legal_risk_incidents INTEGER NOT NULL DEFAULT 0 CHECK (legal_risk_incidents >= 0),
  quality_score NUMERIC(6,3) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  reviewer_user_id UUID,
  summary TEXT,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (review_window_end >= review_window_start)
);

CREATE TABLE IF NOT EXISTS public.postlaunch_hotfix_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_tag TEXT NOT NULL,
  commit_sha TEXT,
  scope TEXT NOT NULL DEFAULT 'workspace-backend',
  trigger_reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'deployed', 'rolled_back', 'failed')),
  rollback_available BOOLEAN NOT NULL DEFAULT true,
  rollback_executed BOOLEAN NOT NULL DEFAULT false,
  rollback_notes TEXT,
  deployed_by UUID,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (release_tag)
);

CREATE INDEX IF NOT EXISTS idx_postlaunch_kpi_snapshots_date
  ON public.postlaunch_kpi_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_postlaunch_risk_alerts_status_severity_created
  ON public.postlaunch_risk_alerts(status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_postlaunch_model_quality_reviews_window_end
  ON public.postlaunch_model_quality_reviews(review_window_end DESC);

CREATE INDEX IF NOT EXISTS idx_postlaunch_hotfix_releases_deployed_at
  ON public.postlaunch_hotfix_releases(deployed_at DESC);

ALTER TABLE public.postlaunch_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postlaunch_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postlaunch_model_quality_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postlaunch_hotfix_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage postlaunch KPI snapshots"
  ON public.postlaunch_kpi_snapshots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage postlaunch risk alerts"
  ON public.postlaunch_risk_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage postlaunch model quality reviews"
  ON public.postlaunch_model_quality_reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage postlaunch hotfix releases"
  ON public.postlaunch_hotfix_releases FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_postlaunch_kpi_snapshots_updated_at
  BEFORE UPDATE ON public.postlaunch_kpi_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postlaunch_risk_alerts_updated_at
  BEFORE UPDATE ON public.postlaunch_risk_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postlaunch_model_quality_reviews_updated_at
  BEFORE UPDATE ON public.postlaunch_model_quality_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postlaunch_hotfix_releases_updated_at
  BEFORE UPDATE ON public.postlaunch_hotfix_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

