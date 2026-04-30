-- Public landing backend core tables: content, leads, and rate limits.

CREATE TABLE public.landing_public_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  cta_primary_label TEXT,
  cta_secondary_label TEXT,
  stat_regulators_covered INTEGER NOT NULL DEFAULT 5,
  stat_regulatory_blueprints TEXT NOT NULL DEFAULT '10K+',
  stat_reasoning_prompts TEXT NOT NULL DEFAULT '5K+',
  stat_review_model TEXT NOT NULL DEFAULT 'CA+Law',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.landing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'general',
  message TEXT,
  source TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.landing_public_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL,
  route TEXT NOT NULL,
  window_bucket BIGINT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key_hash, route, window_bucket)
);

CREATE INDEX idx_landing_leads_status_created_at
  ON public.landing_leads(status, created_at DESC);

CREATE INDEX idx_landing_leads_email
  ON public.landing_leads(email);

CREATE INDEX idx_landing_rate_limits_route_bucket
  ON public.landing_public_rate_limits(route, window_bucket DESC);

ALTER TABLE public.landing_public_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_public_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage landing content"
  ON public.landing_public_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage landing leads"
  ON public.landing_leads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view landing rate limits"
  ON public.landing_public_rate_limits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_landing_public_content_updated_at
  BEFORE UPDATE ON public.landing_public_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_leads_updated_at
  BEFORE UPDATE ON public.landing_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_public_rate_limits_updated_at
  BEFORE UPDATE ON public.landing_public_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.landing_public_content (
  key,
  title,
  subtitle,
  description,
  cta_primary_label,
  cta_secondary_label,
  stat_regulators_covered,
  stat_regulatory_blueprints,
  stat_reasoning_prompts,
  stat_review_model
) VALUES (
  'homepage',
  'REGULON',
  'Compliance & Regulatory Command Platform',
  'AI-powered, human-verified regulatory execution for businesses. Complete compliance coverage across MCA, GST, Income Tax, RBI & SEBI.',
  'Get Started',
  'Login to Dashboard',
  5,
  '10K+',
  '5K+',
  'CA+Law'
)
ON CONFLICT (key) DO NOTHING;
