-- Infra/DevOps readiness backend:
-- runbooks, release registry, backup/restore drills, monitoring integrations, SLO policies and breaches.

CREATE TABLE IF NOT EXISTS public.infra_runbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runbook_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  service_scope TEXT NOT NULL DEFAULT 'workspace-backend',
  content_markdown TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  owner_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.infra_release_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  status TEXT NOT NULL DEFAULT 'deployed' CHECK (status IN ('planned', 'deployed', 'rolled_back', 'failed')),
  commit_sha TEXT,
  deployed_by UUID,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rollback_reference TEXT,
  rollback_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_infra_release_registry_unique_version_env
  ON public.infra_release_registry(release_version, environment);

CREATE TABLE IF NOT EXISTS public.infra_backup_restore_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('staging', 'production')),
  status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'succeeded', 'failed')),
  executed_by UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  rto_minutes INTEGER CHECK (rto_minutes >= 0),
  rpo_minutes INTEGER CHECK (rpo_minutes >= 0),
  backup_snapshot_ref TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.infra_monitoring_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('uptime', 'error_tracking', 'logging', 'alerting')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'degraded', 'disabled', 'failed')),
  config_masked JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_check_at TIMESTAMPTZ,
  last_error TEXT,
  owner_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, integration_type)
);

CREATE TABLE IF NOT EXISTS public.infra_slo_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  sli_name TEXT NOT NULL,
  window_days INTEGER NOT NULL DEFAULT 30 CHECK (window_days > 0),
  target_percent NUMERIC(6,3) NOT NULL CHECK (target_percent >= 0 AND target_percent <= 100),
  warning_threshold_percent NUMERIC(6,3) NOT NULL CHECK (warning_threshold_percent >= 0 AND warning_threshold_percent <= 100),
  critical_threshold_percent NUMERIC(6,3) NOT NULL CHECK (critical_threshold_percent >= 0 AND critical_threshold_percent <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_name, sli_name, window_days)
);

CREATE TABLE IF NOT EXISTS public.infra_slo_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.infra_slo_policies(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  observed_percent NUMERIC(6,3) NOT NULL CHECK (observed_percent >= 0 AND observed_percent <= 100),
  breach_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  breach_resolved_at TIMESTAMPTZ,
  acknowledged_by UUID,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_runbooks_status_updated
  ON public.infra_runbooks(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_release_registry_env_deployed
  ON public.infra_release_registry(environment, deployed_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_backup_drills_env_started
  ON public.infra_backup_restore_drills(environment, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_monitoring_integrations_status_updated
  ON public.infra_monitoring_integrations(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_slo_policies_active
  ON public.infra_slo_policies(active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_slo_breaches_status_started
  ON public.infra_slo_breaches(status, breach_started_at DESC);

ALTER TABLE public.infra_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infra_release_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infra_backup_restore_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infra_monitoring_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infra_slo_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infra_slo_breaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage infra runbooks"
  ON public.infra_runbooks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage infra release registry"
  ON public.infra_release_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage backup restore drills"
  ON public.infra_backup_restore_drills FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage monitoring integrations"
  ON public.infra_monitoring_integrations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage SLO policies"
  ON public.infra_slo_policies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage SLO breaches"
  ON public.infra_slo_breaches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_infra_runbooks_updated_at
  BEFORE UPDATE ON public.infra_runbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_infra_release_registry_updated_at
  BEFORE UPDATE ON public.infra_release_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_infra_backup_restore_drills_updated_at
  BEFORE UPDATE ON public.infra_backup_restore_drills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_infra_monitoring_integrations_updated_at
  BEFORE UPDATE ON public.infra_monitoring_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_infra_slo_policies_updated_at
  BEFORE UPDATE ON public.infra_slo_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_infra_slo_breaches_updated_at
  BEFORE UPDATE ON public.infra_slo_breaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.infra_runbooks (runbook_key, title, service_scope, content_markdown, status, metadata)
VALUES
  ('workflow_incident_response', 'Workflow Incident Response', 'workspace-backend', '# Workflow Incident Response', 'active', '{"seeded":true}'::jsonb),
  ('ai_reliability_degradation', 'AI Reliability Degradation', 'workspace-backend', '# AI Reliability Degradation', 'active', '{"seeded":true}'::jsonb),
  ('prelaunch_go_no_go', 'Prelaunch Go/No-Go', 'workspace-backend', '# Prelaunch Go/No-Go', 'active', '{"seeded":true}'::jsonb)
ON CONFLICT (runbook_key) DO NOTHING;
