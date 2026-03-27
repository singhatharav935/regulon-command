CREATE TABLE IF NOT EXISTS public.authority_workflow_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL UNIQUE,
  legal_review_required BOOLEAN NOT NULL DEFAULT false,
  final_signoff_mode TEXT NOT NULL DEFAULT 'ca_only' CHECK (final_signoff_mode IN ('ca_only', 'lawyer_only', 'dual')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ca_actor_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  regulon_legal_lane_enabled BOOLEAN NOT NULL DEFAULT false,
  assistant_access_enabled BOOLEAN NOT NULL DEFAULT true,
  plan_monthly_request_limit INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (plan_monthly_request_limit IS NULL OR plan_monthly_request_limit > 0)
);

ALTER TABLE public.authority_workflow_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_actor_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority workflow policies"
  ON public.authority_workflow_policies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage authority workflow policies"
  ON public.authority_workflow_policies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own CA entitlements"
  ON public.ca_actor_entitlements FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage CA entitlements"
  ON public.ca_actor_entitlements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_authority_workflow_policies_updated_at ON public.authority_workflow_policies;
CREATE TRIGGER update_authority_workflow_policies_updated_at
  BEFORE UPDATE ON public.authority_workflow_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ca_actor_entitlements_updated_at ON public.ca_actor_entitlements;
CREATE TRIGGER update_ca_actor_entitlements_updated_at
  BEFORE UPDATE ON public.ca_actor_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
