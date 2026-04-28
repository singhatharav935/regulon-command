-- QA automation backend core:
-- stores API contract runs, E2E smoke runs, and tracked failures.

CREATE TABLE IF NOT EXISTS public.qa_api_contract_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  total_tests INTEGER NOT NULL DEFAULT 0 CHECK (total_tests >= 0),
  passed_tests INTEGER NOT NULL DEFAULT 0 CHECK (passed_tests >= 0),
  failed_tests INTEGER NOT NULL DEFAULT 0 CHECK (failed_tests >= 0),
  run_duration_ms INTEGER CHECK (run_duration_ms IS NULL OR run_duration_ms >= 0),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_by UUID,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qa_e2e_smoke_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_name TEXT NOT NULL,
  role_scope TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_summary TEXT,
  executed_by UUID,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qa_failure_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('api_contract', 'e2e_smoke', 'manual', 'production_incident')),
  source_run_id UUID,
  severity TEXT NOT NULL CHECK (severity IN ('medium', 'high', 'critical')),
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

CREATE INDEX IF NOT EXISTS idx_qa_api_contract_runs_executed_at
  ON public.qa_api_contract_runs(executed_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_qa_e2e_smoke_runs_executed_at
  ON public.qa_e2e_smoke_runs(executed_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_qa_failure_registry_status_severity
  ON public.qa_failure_registry(status, severity, created_at DESC);

ALTER TABLE public.qa_api_contract_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_e2e_smoke_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_failure_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage QA API contract runs"
  ON public.qa_api_contract_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage QA E2E smoke runs"
  ON public.qa_e2e_smoke_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage QA failure registry"
  ON public.qa_failure_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_qa_api_contract_runs_updated_at
  BEFORE UPDATE ON public.qa_api_contract_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qa_e2e_smoke_runs_updated_at
  BEFORE UPDATE ON public.qa_e2e_smoke_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qa_failure_registry_updated_at
  BEFORE UPDATE ON public.qa_failure_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

