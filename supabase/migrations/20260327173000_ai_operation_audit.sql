CREATE TABLE IF NOT EXISTS public.ai_operation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  draft_run_id UUID REFERENCES public.draft_runs(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  lane TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failed', 'in_progress')),
  response_status INTEGER,
  ai_model_used TEXT,
  ai_fallback_used BOOLEAN,
  ai_attempt_count INTEGER,
  model_router_version TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  payload_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_operation_audit_created
  ON public.ai_operation_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_operation_audit_user_created
  ON public.ai_operation_audit(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_operation_audit_company_created
  ON public.ai_operation_audit(company_id, created_at DESC);

ALTER TABLE public.ai_operation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI operation audit rows"
  ON public.ai_operation_audit FOR SELECT
  USING (auth.uid() = user_id OR (company_id IS NOT NULL AND public.can_access_company(company_id)));

CREATE POLICY "Users can create own AI operation audit rows"
  ON public.ai_operation_audit FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI operation audit rows"
  ON public.ai_operation_audit FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage AI operation audit rows"
  ON public.ai_operation_audit FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
