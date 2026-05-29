-- =============================================================================
-- Gap 6: Enterprise API & Webhooks
-- Production-ready tables for API key management, webhook endpoints,
-- delivery tracking, and API access logging.
-- =============================================================================


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1a. enterprise_api_keys — API key registry for enterprise integrations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  allowed_ips TEXT[] DEFAULT '{}',
  allowed_origins TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  total_requests BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1b. webhook_endpoints — registered webhook delivery targets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.enterprise_api_keys(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  secret_hash TEXT NOT NULL,
  secret_prefix TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  failure_count INTEGER NOT NULL DEFAULT 0,
  max_failures_before_disable INTEGER NOT NULL DEFAULT 10,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1c. webhook_deliveries — individual delivery attempts per event
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  http_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivering', 'delivered', 'failed', 'retrying')),
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1d. api_access_logs — per-request audit log for API key usage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.enterprise_api_keys(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- enterprise_api_keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_ca_user
  ON public.enterprise_api_keys(ca_user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON public.enterprise_api_keys(api_key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix
  ON public.enterprise_api_keys(key_prefix);

-- webhook_endpoints indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_ca_user
  ON public.webhook_endpoints(ca_user_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_events
  ON public.webhook_endpoints USING GIN(events);

-- webhook_deliveries indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
  ON public.webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status
  ON public.webhook_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event
  ON public.webhook_deliveries(event_type);

-- api_access_logs indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_key
  ON public.api_access_logs(api_key_id);

CREATE INDEX IF NOT EXISTS idx_api_logs_created
  ON public.api_access_logs(created_at DESC);


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_access_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3a. enterprise_api_keys policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own API keys"
  ON public.enterprise_api_keys FOR SELECT
  TO authenticated
  USING (ca_user_id = auth.uid());

CREATE POLICY "Users can create own API keys"
  ON public.enterprise_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON public.enterprise_api_keys FOR UPDATE
  TO authenticated
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON public.enterprise_api_keys FOR DELETE
  TO authenticated
  USING (ca_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3b. webhook_endpoints policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own webhooks"
  ON public.webhook_endpoints FOR SELECT
  TO authenticated
  USING (ca_user_id = auth.uid());

CREATE POLICY "Users can create own webhooks"
  ON public.webhook_endpoints FOR INSERT
  TO authenticated
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can update own webhooks"
  ON public.webhook_endpoints FOR UPDATE
  TO authenticated
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can delete own webhooks"
  ON public.webhook_endpoints FOR DELETE
  TO authenticated
  USING (ca_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3c. webhook_deliveries policies (scoped through parent webhook)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints w
      WHERE w.id = webhook_deliveries.webhook_id
        AND w.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own webhook deliveries"
  ON public.webhook_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints w
      WHERE w.id = webhook_deliveries.webhook_id
        AND w.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own webhook deliveries"
  ON public.webhook_deliveries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints w
      WHERE w.id = webhook_deliveries.webhook_id
        AND w.ca_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints w
      WHERE w.id = webhook_deliveries.webhook_id
        AND w.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own webhook deliveries"
  ON public.webhook_deliveries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints w
      WHERE w.id = webhook_deliveries.webhook_id
        AND w.ca_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3d. api_access_logs policies (scoped through parent API key)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own API access logs"
  ON public.api_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_api_keys k
      WHERE k.id = api_access_logs.api_key_id
        AND k.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own API access logs"
  ON public.api_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enterprise_api_keys k
      WHERE k.id = api_access_logs.api_key_id
        AND k.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own API access logs"
  ON public.api_access_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_api_keys k
      WHERE k.id = api_access_logs.api_key_id
        AND k.ca_user_id = auth.uid()
    )
  );


-- =============================================================================
-- 4. VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4a. api_key_usage_summary — aggregated usage stats per API key
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.api_key_usage_summary AS
SELECT
  k.id AS api_key_id,
  k.ca_user_id,
  k.key_name,
  k.key_prefix,
  k.is_active,
  k.total_requests,
  k.last_used_at,
  k.rate_limit_per_minute,
  k.rate_limit_per_day,
  k.expires_at,
  k.created_at,
  COALESCE(wc.active_webhook_count, 0) AS active_webhook_count
FROM public.enterprise_api_keys k
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS active_webhook_count
  FROM public.webhook_endpoints w
  WHERE w.api_key_id = k.id
    AND w.is_active = true
) wc ON true;

-- ---------------------------------------------------------------------------
-- 4b. webhook_health_summary — health & performance stats per webhook
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.webhook_health_summary AS
SELECT
  w.id AS webhook_id,
  w.ca_user_id,
  w.url,
  w.is_active,
  w.failure_count,
  w.max_failures_before_disable,
  w.last_triggered_at,
  w.last_success_at,
  w.last_failure_at,
  w.created_at,
  COALESCE(ds.total_deliveries, 0) AS total_deliveries,
  COALESCE(ds.successful_deliveries, 0) AS successful_deliveries,
  COALESCE(ds.failed_deliveries, 0) AS failed_deliveries,
  CASE
    WHEN COALESCE(ds.total_deliveries, 0) = 0 THEN 0
    ELSE ROUND((ds.successful_deliveries::NUMERIC / ds.total_deliveries) * 100, 2)
  END AS success_rate_pct,
  COALESCE(ds.avg_response_time_ms, 0) AS avg_response_time_ms
FROM public.webhook_endpoints w
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::BIGINT AS total_deliveries,
    COUNT(*) FILTER (WHERE d.status = 'delivered')::BIGINT AS successful_deliveries,
    COUNT(*) FILTER (WHERE d.status = 'failed')::BIGINT AS failed_deliveries,
    COALESCE(AVG(d.response_time_ms) FILTER (WHERE d.response_time_ms IS NOT NULL), 0)::INTEGER AS avg_response_time_ms
  FROM public.webhook_deliveries d
  WHERE d.webhook_id = w.id
) ds ON true;


-- =============================================================================
-- 5. TRIGGER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5a. Auto-disable webhook when consecutive failures hit max threshold
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_webhook_delivery_auto_disable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act on deliveries that just failed
  IF NEW.status = 'failed' THEN
    UPDATE public.webhook_endpoints
    SET
      failure_count = failure_count + 1,
      last_failure_at = now(),
      last_triggered_at = now(),
      updated_at = now()
    WHERE id = NEW.webhook_id;

    -- Auto-disable if failure threshold is reached
    UPDATE public.webhook_endpoints
    SET
      is_active = false,
      updated_at = now()
    WHERE id = NEW.webhook_id
      AND is_active = true
      AND failure_count >= max_failures_before_disable;

  ELSIF NEW.status = 'delivered' THEN
    -- Reset failure count on success
    UPDATE public.webhook_endpoints
    SET
      failure_count = 0,
      last_success_at = now(),
      last_triggered_at = now(),
      updated_at = now()
    WHERE id = NEW.webhook_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5b. Increment API key usage counter on access log insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_api_key_usage_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.enterprise_api_keys
  SET
    total_requests = total_requests + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = NEW.api_key_id;

  RETURN NEW;
END;
$$;


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- updated_at triggers (reuse existing update_updated_at_column function)
DROP TRIGGER IF EXISTS trg_api_keys_updated_at ON public.enterprise_api_keys;
CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON public.enterprise_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_webhooks_updated_at ON public.webhook_endpoints;
CREATE TRIGGER trg_webhooks_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Webhook delivery auto-disable trigger
DROP TRIGGER IF EXISTS trg_webhook_delivery_auto_disable ON public.webhook_deliveries;
CREATE TRIGGER trg_webhook_delivery_auto_disable
  AFTER INSERT OR UPDATE OF status ON public.webhook_deliveries
  FOR EACH ROW
  WHEN (NEW.status IN ('failed', 'delivered'))
  EXECUTE FUNCTION public.fn_webhook_delivery_auto_disable();

-- API key usage counter trigger
DROP TRIGGER IF EXISTS trg_api_key_usage_counter ON public.api_access_logs;
CREATE TRIGGER trg_api_key_usage_counter
  AFTER INSERT ON public.api_access_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_api_key_usage_counter();
