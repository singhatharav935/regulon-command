-- Performance readiness backend:
-- client performance metrics, synthetic checks, budgets, and alert events.

CREATE TABLE IF NOT EXISTS public.performance_client_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  route TEXT NOT NULL,
  role_scope TEXT NOT NULL DEFAULT 'all',
  source TEXT NOT NULL DEFAULT 'manual',
  p95_ttfb_ms INTEGER CHECK (p95_ttfb_ms IS NULL OR p95_ttfb_ms >= 0),
  p95_lcp_ms INTEGER CHECK (p95_lcp_ms IS NULL OR p95_lcp_ms >= 0),
  p95_cls NUMERIC(8,4) CHECK (p95_cls IS NULL OR p95_cls >= 0),
  error_rate_percent NUMERIC(8,4) CHECK (error_rate_percent IS NULL OR (error_rate_percent >= 0 AND error_rate_percent <= 100)),
  bundle_kb_main INTEGER CHECK (bundle_kb_main IS NULL OR bundle_kb_main >= 0),
  js_chunk_count INTEGER CHECK (js_chunk_count IS NULL OR js_chunk_count >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_date, route, role_scope, source)
);

CREATE TABLE IF NOT EXISTS public.performance_synthetic_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL CHECK (check_type IN ('landing', 'auth', 'company_dashboard', 'ca_dashboard', 'legal_dashboard', 'api_health')),
  target TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'warn', 'fail')),
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  status_code INTEGER CHECK (status_code IS NULL OR status_code >= 100),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_budget_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_key TEXT NOT NULL UNIQUE,
  metric_name TEXT NOT NULL,
  threshold_warn NUMERIC(10,4) NOT NULL,
  threshold_fail NUMERIC(10,4) NOT NULL,
  comparator TEXT NOT NULL DEFAULT 'lte' CHECK (comparator IN ('lte', 'gte')),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  title TEXT NOT NULL,
  detail TEXT,
  triggered_value NUMERIC(12,4),
  budget_policy_id UUID REFERENCES public.performance_budget_policies(id) ON DELETE SET NULL,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_client_metrics_date_route
  ON public.performance_client_metrics(metric_date DESC, route);

CREATE INDEX IF NOT EXISTS idx_performance_synthetic_checks_checked_at
  ON public.performance_synthetic_checks(checked_at DESC, check_type);

CREATE INDEX IF NOT EXISTS idx_performance_budget_policies_active
  ON public.performance_budget_policies(active, metric_name);

CREATE INDEX IF NOT EXISTS idx_performance_alert_events_status_severity
  ON public.performance_alert_events(status, severity, created_at DESC);

ALTER TABLE public.performance_client_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_synthetic_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage performance client metrics"
  ON public.performance_client_metrics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage performance synthetic checks"
  ON public.performance_synthetic_checks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage performance budget policies"
  ON public.performance_budget_policies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage performance alert events"
  ON public.performance_alert_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_performance_client_metrics_updated_at
  BEFORE UPDATE ON public.performance_client_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_synthetic_checks_updated_at
  BEFORE UPDATE ON public.performance_synthetic_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_budget_policies_updated_at
  BEFORE UPDATE ON public.performance_budget_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_alert_events_updated_at
  BEFORE UPDATE ON public.performance_alert_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.performance_budget_policies (budget_key, metric_name, threshold_warn, threshold_fail, comparator, active, metadata)
VALUES
  ('web_lcp_ms', 'p95_lcp_ms', 3000, 4000, 'lte', true, '{"scope":"frontend"}'::jsonb),
  ('web_ttfb_ms', 'p95_ttfb_ms', 800, 1200, 'lte', true, '{"scope":"frontend"}'::jsonb),
  ('web_cls', 'p95_cls', 0.1, 0.25, 'lte', true, '{"scope":"frontend"}'::jsonb),
  ('web_error_rate_percent', 'error_rate_percent', 2, 5, 'lte', true, '{"scope":"frontend"}'::jsonb)
ON CONFLICT (budget_key) DO NOTHING;

