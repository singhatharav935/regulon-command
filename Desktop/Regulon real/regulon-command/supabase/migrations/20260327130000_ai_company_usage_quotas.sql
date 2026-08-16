CREATE TABLE IF NOT EXISTS public.ai_company_usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  monthly_request_limit INTEGER NOT NULL DEFAULT 2000 CHECK (monthly_request_limit > 0),
  hard_block BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_company_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_company_monthly_usage_company_month
  ON public.ai_company_monthly_usage(company_id, month_start DESC);

ALTER TABLE public.ai_company_usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_company_monthly_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI company quotas for accessible company"
  ON public.ai_company_usage_quotas FOR SELECT
  USING (public.can_access_company(company_id));

CREATE POLICY "Users can view AI company monthly usage for accessible company"
  ON public.ai_company_monthly_usage FOR SELECT
  USING (public.can_access_company(company_id));

CREATE POLICY "Admins can manage AI company quotas"
  ON public.ai_company_usage_quotas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage AI company monthly usage"
  ON public.ai_company_monthly_usage FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_ai_company_usage_quotas_updated_at ON public.ai_company_usage_quotas;
CREATE TRIGGER update_ai_company_usage_quotas_updated_at
  BEFORE UPDATE ON public.ai_company_usage_quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_company_monthly_usage_updated_at ON public.ai_company_monthly_usage;
CREATE TRIGGER update_ai_company_monthly_usage_updated_at
  BEFORE UPDATE ON public.ai_company_monthly_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
