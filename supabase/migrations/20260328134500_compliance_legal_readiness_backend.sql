-- Compliance + legal readiness backend:
-- 1) Consent event tracking
-- 2) Legal disclaimer acceptance tracking
-- 3) DPDP-aligned data subject request workflow
-- 4) Immutable compliance audit trail

CREATE TABLE IF NOT EXISTS public.compliance_user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_key TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  consent_status TEXT NOT NULL DEFAULT 'accepted' CHECK (consent_status IN ('accepted', 'revoked')),
  consent_source TEXT NOT NULL DEFAULT 'web',
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_key, consent_version)
);

CREATE TABLE IF NOT EXISTS public.legal_disclaimer_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  disclaimer_key TEXT NOT NULL DEFAULT 'ai_assisted_drafting',
  disclaimer_version TEXT NOT NULL DEFAULT 'v1',
  source TEXT NOT NULL DEFAULT 'app',
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, disclaimer_key, disclaimer_version)
);

CREATE TABLE IF NOT EXISTS public.compliance_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access_export', 'deletion', 'rectification', 'restriction')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'completed', 'cancelled')),
  jurisdiction TEXT NOT NULL DEFAULT 'IN-DPDP',
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  admin_notes TEXT,
  due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_user_consents_user_created
  ON public.compliance_user_consents(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_user_consents_key_status
  ON public.compliance_user_consents(consent_key, consent_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_disclaimer_acceptances_user_created
  ON public.legal_disclaimer_acceptances(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_data_requests_user_status_created
  ON public.compliance_data_requests(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_data_requests_company_status_created
  ON public.compliance_data_requests(company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_data_requests_due_open
  ON public.compliance_data_requests(due_at, status);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_events_actor_created
  ON public.compliance_audit_events(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_events_company_created
  ON public.compliance_audit_events(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_events_entity
  ON public.compliance_audit_events(entity_type, entity_id);

ALTER TABLE public.compliance_user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_disclaimer_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own compliance consents"
  ON public.compliance_user_consents FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can upsert own compliance consents"
  ON public.compliance_user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own compliance consents"
  ON public.compliance_user_consents FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own legal disclaimer acceptances"
  ON public.legal_disclaimer_acceptances FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own legal disclaimer acceptances"
  ON public.legal_disclaimer_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own legal disclaimer acceptances"
  ON public.legal_disclaimer_acceptances FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own compliance data requests"
  ON public.compliance_data_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create own compliance data requests"
  ON public.compliance_data_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (company_id IS NULL OR public.is_company_member(auth.uid(), company_id))
  );

CREATE POLICY "Users can update own submitted compliance data requests"
  ON public.compliance_data_requests FOR UPDATE
  USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can view own compliance audit events"
  ON public.compliance_audit_events FOR SELECT
  USING (
    auth.uid() = actor_user_id
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own compliance audit events"
  ON public.compliance_audit_events FOR INSERT
  WITH CHECK (
    auth.uid() = actor_user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage compliance audit events"
  ON public.compliance_audit_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_compliance_user_consents_updated_at
  BEFORE UPDATE ON public.compliance_user_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_disclaimer_acceptances_updated_at
  BEFORE UPDATE ON public.legal_disclaimer_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_data_requests_updated_at
  BEFORE UPDATE ON public.compliance_data_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
