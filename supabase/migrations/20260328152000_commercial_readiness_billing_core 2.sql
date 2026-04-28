-- Commercial readiness backend core:
-- plans, subscriptions, GST invoice records, payment retry flows, usage metering.

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('core', 'nexus', 'sovereign')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  currency TEXT NOT NULL DEFAULT 'INR',
  base_price_minor INTEGER NOT NULL DEFAULT 0 CHECK (base_price_minor >= 0),
  gst_rate_bps INTEGER NOT NULL DEFAULT 1800 CHECK (gst_rate_bps >= 0),
  ai_monthly_request_limit INTEGER NOT NULL DEFAULT 0 CHECK (ai_monthly_request_limit >= 0),
  seats_included INTEGER NOT NULL DEFAULT 1 CHECK (seats_included >= 0),
  overage_per_request_minor INTEGER NOT NULL DEFAULT 0 CHECK (overage_per_request_minor >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE,
  owner_user_id UUID,
  plan_id UUID NOT NULL REFERENCES public.billing_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  trial_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_retry_count INTEGER NOT NULL DEFAULT 0 CHECK (payment_retry_count >= 0),
  payment_last_failed_at TIMESTAMPTZ,
  payment_failure_code TEXT,
  payment_failure_message TEXT,
  external_customer_ref TEXT,
  external_subscription_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((company_id IS NOT NULL AND ca_firm_id IS NULL) OR (company_id IS NULL AND ca_firm_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscription_company_active
  ON public.billing_subscriptions(company_id)
  WHERE company_id IS NOT NULL AND status IN ('trialing', 'active', 'past_due', 'paused');

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscription_firm_active
  ON public.billing_subscriptions(ca_firm_id)
  WHERE ca_firm_id IS NOT NULL AND status IN ('trialing', 'active', 'past_due', 'paused');

CREATE TABLE IF NOT EXISTS public.billing_invoice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL DEFAULT 'tax_invoice' CHECK (invoice_type IN ('tax_invoice', 'credit_note', 'debit_note')),
  status TEXT NOT NULL DEFAULT 'issued'
    CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void', 'refunded')),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal_minor INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  tax_minor INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor INTEGER NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  amount_paid_minor INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid_minor >= 0),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  gstin_supplier TEXT,
  gstin_customer TEXT,
  place_of_supply TEXT,
  hsn_sac_code TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((company_id IS NOT NULL AND ca_firm_id IS NULL) OR (company_id IS NULL AND ca_firm_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.billing_payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.billing_invoice_records(id) ON DELETE SET NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  status TEXT NOT NULL CHECK (status IN ('processing', 'succeeded', 'failed', 'scheduled_retry', 'cancelled')),
  amount_minor INTEGER NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_payment_id TEXT,
  failure_code TEXT,
  failure_message TEXT,
  retry_scheduled_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_key TEXT NOT NULL UNIQUE,
  meter_name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'count',
  scope TEXT NOT NULL CHECK (scope IN ('subscription', 'company', 'firm', 'user')),
  billable BOOLEAN NOT NULL DEFAULT true,
  aggregation_mode TEXT NOT NULL DEFAULT 'sum' CHECK (aggregation_mode IN ('sum', 'count')),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.billing_usage_meters(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE,
  user_id UUID,
  quantity NUMERIC(18, 6) NOT NULL DEFAULT 0,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'system',
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (quantity >= 0),
  CHECK (
    (company_id IS NOT NULL AND ca_firm_id IS NULL)
    OR (company_id IS NULL AND ca_firm_id IS NOT NULL)
    OR (company_id IS NULL AND ca_firm_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.billing_usage_monthly_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.billing_usage_meters(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE,
  user_id UUID,
  total_quantity NUMERIC(18, 6) NOT NULL DEFAULT 0,
  billable_quantity NUMERIC(18, 6) NOT NULL DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meter_id, month_start, subscription_id, company_id, ca_firm_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status_period
  ON public.billing_subscriptions(status, current_period_end);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_subscription_created
  ON public.billing_invoice_records(subscription_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_status_due
  ON public.billing_invoice_records(status, due_at);

CREATE INDEX IF NOT EXISTS idx_billing_payment_subscription_attempted
  ON public.billing_payment_attempts(subscription_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_usage_events_subscription_event
  ON public.billing_usage_events(subscription_id, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_usage_events_company_event
  ON public.billing_usage_events(company_id, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_usage_events_firm_event
  ON public.billing_usage_events(ca_firm_id, event_at DESC);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_monthly_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active billing plans"
  ON public.billing_plans FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage billing plans"
  ON public.billing_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view accessible billing subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can create accessible billing subscriptions"
  ON public.billing_subscriptions FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can update accessible billing subscriptions"
  ON public.billing_subscriptions FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR owner_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can view accessible invoices"
  ON public.billing_invoice_records FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Admins can manage invoices"
  ON public.billing_invoice_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view accessible payment attempts"
  ON public.billing_payment_attempts FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.billing_subscriptions s
      WHERE s.id = billing_payment_attempts.subscription_id
        AND (
          s.owner_user_id = auth.uid()
          OR (s.company_id IS NOT NULL AND public.is_company_member(auth.uid(), s.company_id))
          OR (s.ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), s.ca_firm_id))
        )
    )
  );

CREATE POLICY "Admins can manage payment attempts"
  ON public.billing_payment_attempts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active usage meters"
  ON public.billing_usage_meters FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage usage meters"
  ON public.billing_usage_meters FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view accessible usage events"
  ON public.billing_usage_events FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can insert accessible usage events"
  ON public.billing_usage_events FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can view accessible usage rollups"
  ON public.billing_usage_monthly_rollups FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Admins can manage usage rollups"
  ON public.billing_usage_monthly_rollups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_billing_plans_updated_at ON public.billing_plans;
CREATE TRIGGER update_billing_plans_updated_at
  BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_subscriptions_updated_at ON public.billing_subscriptions;
CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_invoice_records_updated_at ON public.billing_invoice_records;
CREATE TRIGGER update_billing_invoice_records_updated_at
  BEFORE UPDATE ON public.billing_invoice_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_usage_meters_updated_at ON public.billing_usage_meters;
CREATE TRIGGER update_billing_usage_meters_updated_at
  BEFORE UPDATE ON public.billing_usage_meters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_usage_monthly_rollups_updated_at ON public.billing_usage_monthly_rollups;
CREATE TRIGGER update_billing_usage_monthly_rollups_updated_at
  BEFORE UPDATE ON public.billing_usage_monthly_rollups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.billing_plans (
  plan_code,
  plan_name,
  plan_tier,
  billing_cycle,
  currency,
  base_price_minor,
  gst_rate_bps,
  ai_monthly_request_limit,
  seats_included,
  overage_per_request_minor,
  metadata
)
VALUES
  (
    'core_monthly',
    'Core',
    'core',
    'monthly',
    'INR',
    499900,
    1800,
    3000,
    5,
    150,
    '{"pricing_status":"provisional","notes":"Final commercial pricing to be approved"}'::jsonb
  ),
  (
    'nexus_monthly',
    'Nexus',
    'nexus',
    'monthly',
    'INR',
    1499900,
    1800,
    12000,
    20,
    100,
    '{"pricing_status":"provisional","notes":"Final commercial pricing to be approved"}'::jsonb
  ),
  (
    'sovereign_monthly',
    'Sovereign',
    'sovereign',
    'monthly',
    'INR',
    3999900,
    1800,
    50000,
    100,
    75,
    '{"pricing_status":"provisional","notes":"Final commercial pricing to be approved"}'::jsonb
  )
ON CONFLICT (plan_code) DO NOTHING;

INSERT INTO public.billing_usage_meters (
  meter_key,
  meter_name,
  unit,
  scope,
  billable,
  aggregation_mode,
  metadata
)
VALUES
  ('ai_requests', 'AI Draft Requests', 'request', 'subscription', true, 'sum', '{"category":"ai"}'::jsonb),
  ('draft_exports', 'Draft Exports', 'export', 'subscription', true, 'sum', '{"category":"filing"}'::jsonb),
  ('workspace_api_calls', 'Workspace API Calls', 'call', 'subscription', false, 'sum', '{"category":"ops"}'::jsonb)
ON CONFLICT (meter_key) DO NOTHING;
