-- Autonomous agent backend for cross-dashboard work execution, review, and approval

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_run_status') THEN
    CREATE TYPE public.agent_run_status AS ENUM (
      'queued',
      'running',
      'needs_owner_review',
      'approved',
      'completed',
      'failed',
      'closed'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_action_status') THEN
    CREATE TYPE public.agent_action_status AS ENUM (
      'queued',
      'in_progress',
      'completed',
      'needs_approval',
      'approved',
      'rejected',
      'failed'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.can_access_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = _company_id
    );
$$;

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_scope TEXT NOT NULL,
  status public.agent_run_status NOT NULL DEFAULT 'queued',
  summary TEXT,
  context JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  generated_work TEXT NOT NULL,
  status public.agent_action_status NOT NULL DEFAULT 'needs_approval',
  needs_approval BOOLEAN NOT NULL DEFAULT true,
  approval_note TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_action_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edited_work TEXT NOT NULL,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_notifications_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'in_app', 'sms')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_portal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  portal TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source_ref TEXT,
  dedupe_key TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_owner_created ON public.agent_runs(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_company_created ON public.agent_runs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_run_status ON public.agent_actions(run_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_owner_status ON public.agent_actions(owner_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_status_created ON public.agent_notifications_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_portal_events_portal_time ON public.agent_portal_events(portal, detected_at DESC);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_action_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_portal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible agent runs"
  ON public.agent_runs FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.can_access_company(company_id))
  );

CREATE POLICY "Users can create own agent runs"
  ON public.agent_runs FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid()
    AND (company_id IS NULL OR public.can_access_company(company_id))
  );

CREATE POLICY "Users can update accessible agent runs"
  ON public.agent_runs FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can view accessible agent actions"
  ON public.agent_actions FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.can_access_company(company_id))
  );

CREATE POLICY "Users can create own agent actions"
  ON public.agent_actions FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid()
    AND (company_id IS NULL OR public.can_access_company(company_id))
  );

CREATE POLICY "Users can update own agent actions"
  ON public.agent_actions FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can view edits for accessible actions"
  ON public.agent_action_edits FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.agent_actions a
      WHERE a.id = action_id
        AND (
          a.owner_user_id = auth.uid()
          OR (a.company_id IS NOT NULL AND public.can_access_company(a.company_id))
        )
    )
  );

CREATE POLICY "Users can create edits for accessible actions"
  ON public.agent_action_edits FOR INSERT
  WITH CHECK (
    edited_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.agent_actions a
      WHERE a.id = action_id
        AND (
          a.owner_user_id = auth.uid()
          OR (a.company_id IS NOT NULL AND public.can_access_company(a.company_id))
        )
    )
  );

CREATE POLICY "Users can view notification outbox for accessible actions"
  ON public.agent_notifications_outbox FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.can_access_company(company_id))
  );

CREATE POLICY "Admins can manage notification outbox"
  ON public.agent_notifications_outbox FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view portal events for accessible companies"
  ON public.agent_portal_events FOR SELECT
  USING (
    company_id IS NULL
    OR public.can_access_company(company_id)
  );

CREATE POLICY "Admins can manage portal events"
  ON public.agent_portal_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_agent_runs_updated_at ON public.agent_runs;
CREATE TRIGGER update_agent_runs_updated_at
  BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_actions_updated_at ON public.agent_actions;
CREATE TRIGGER update_agent_actions_updated_at
  BEFORE UPDATE ON public.agent_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_notifications_outbox_updated_at ON public.agent_notifications_outbox;
CREATE TRIGGER update_agent_notifications_outbox_updated_at
  BEFORE UPDATE ON public.agent_notifications_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
