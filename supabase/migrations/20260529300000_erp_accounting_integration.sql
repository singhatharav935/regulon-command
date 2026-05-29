-- =============================================================================
-- Gap 7: ERP / Accounting System Integration
-- (Tally, Zoho Books, QuickBooks, SAP)
--
-- Production-ready tables for managing ERP connections, field mappings,
-- sync jobs, sync logs, and cached accounting data.
-- =============================================================================


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1a. erp_connections — registered ERP/accounting platform connections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,

  -- Platform identification
  platform TEXT NOT NULL
    CHECK (platform IN ('tally', 'zoho_books', 'quickbooks', 'sap', 'busy', 'marg', 'custom')),
  platform_version TEXT,
  connection_name TEXT NOT NULL,
  description TEXT DEFAULT '',

  -- Credentials (encrypted at-rest by Supabase; app should additionally encrypt secrets before storing)
  auth_type TEXT NOT NULL DEFAULT 'api_key'
    CHECK (auth_type IN ('api_key', 'oauth2', 'basic_auth', 'certificate', 'tally_xml')),
  credentials_encrypted JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- For OAuth2 flows
  oauth_access_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_token_expires_at TIMESTAMPTZ,

  -- Connection endpoint
  base_url TEXT,
  port INTEGER,
  company_name TEXT,           -- e.g., Tally company name or Zoho org name
  environment TEXT DEFAULT 'production'
    CHECK (environment IN ('production', 'sandbox', 'staging')),

  -- Status
  status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'error', 'syncing', 'auth_expired')),
  last_connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Sync configuration
  sync_direction TEXT NOT NULL DEFAULT 'pull'
    CHECK (sync_direction IN ('pull', 'push', 'bidirectional')),
  sync_frequency_minutes INTEGER DEFAULT 60,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  sync_start_date DATE,        -- Don't sync records before this date

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1b. erp_field_mappings — maps ERP fields to Regulon internal fields
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,

  -- Source (ERP side)
  erp_entity TEXT NOT NULL,       -- e.g., 'ledger', 'voucher', 'stock_item', 'invoice', 'journal'
  erp_field TEXT NOT NULL,        -- e.g., 'PartyName', 'Amount', 'VoucherDate'

  -- Target (Regulon side)
  regulon_entity TEXT NOT NULL,   -- e.g., 'client_companies', 'tax_liabilities', 'payments'
  regulon_field TEXT NOT NULL,    -- e.g., 'company_name', 'amount', 'due_date'

  -- Transformation
  transform_type TEXT DEFAULT 'direct'
    CHECK (transform_type IN ('direct', 'format_date', 'currency_convert', 'lookup', 'concatenate', 'split', 'custom_formula')),
  transform_config JSONB DEFAULT '{}'::jsonb,

  -- Validation
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  validation_regex TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (connection_id, erp_entity, erp_field, regulon_entity, regulon_field)
);

-- ---------------------------------------------------------------------------
-- 1c. erp_sync_jobs — tracks each sync execution
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job details
  sync_type TEXT NOT NULL DEFAULT 'full'
    CHECK (sync_type IN ('full', 'incremental', 'selective')),
  direction TEXT NOT NULL DEFAULT 'pull'
    CHECK (direction IN ('pull', 'push', 'bidirectional')),
  entities_synced TEXT[] DEFAULT '{}',  -- Which ERP entities were synced

  -- Status
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled', 'partial')),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Counters
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Duration
  duration_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1d. erp_sync_logs — per-record sync audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID NOT NULL REFERENCES public.erp_sync_jobs(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,

  -- Record identification
  erp_entity TEXT NOT NULL,
  erp_record_id TEXT NOT NULL,
  regulon_entity TEXT,
  regulon_record_id UUID,

  -- Operation
  operation TEXT NOT NULL
    CHECK (operation IN ('create', 'update', 'skip', 'delete', 'error')),
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'skipped', 'conflict')),

  -- Data snapshot
  erp_data JSONB,                  -- Raw data from ERP
  mapped_data JSONB,               -- Transformed data written to Regulon
  conflict_details JSONB,          -- If conflict, what was the existing value

  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1e. erp_data_cache — cached snapshots of ERP data for preview and diffing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.erp_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,

  erp_entity TEXT NOT NULL,
  erp_record_id TEXT NOT NULL,
  data_snapshot JSONB NOT NULL,
  checksum TEXT,                   -- SHA-256 of data for change detection

  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,

  UNIQUE (connection_id, erp_entity, erp_record_id)
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- erp_connections
CREATE INDEX IF NOT EXISTS idx_erp_connections_ca_user
  ON public.erp_connections(ca_user_id);

CREATE INDEX IF NOT EXISTS idx_erp_connections_platform
  ON public.erp_connections(platform);

CREATE INDEX IF NOT EXISTS idx_erp_connections_status
  ON public.erp_connections(status);

CREATE INDEX IF NOT EXISTS idx_erp_connections_entity
  ON public.erp_connections(entity_id);

-- erp_field_mappings
CREATE INDEX IF NOT EXISTS idx_erp_mappings_connection
  ON public.erp_field_mappings(connection_id);

CREATE INDEX IF NOT EXISTS idx_erp_mappings_erp_entity
  ON public.erp_field_mappings(erp_entity);

-- erp_sync_jobs
CREATE INDEX IF NOT EXISTS idx_erp_sync_jobs_connection
  ON public.erp_sync_jobs(connection_id);

CREATE INDEX IF NOT EXISTS idx_erp_sync_jobs_status
  ON public.erp_sync_jobs(status);

CREATE INDEX IF NOT EXISTS idx_erp_sync_jobs_ca_user
  ON public.erp_sync_jobs(ca_user_id);

CREATE INDEX IF NOT EXISTS idx_erp_sync_jobs_created
  ON public.erp_sync_jobs(created_at DESC);

-- erp_sync_logs
CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_job
  ON public.erp_sync_logs(sync_job_id);

CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_connection
  ON public.erp_sync_logs(connection_id);

CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_operation
  ON public.erp_sync_logs(operation);

-- erp_data_cache
CREATE INDEX IF NOT EXISTS idx_erp_cache_connection_entity
  ON public.erp_data_cache(connection_id, erp_entity);


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.erp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_data_cache ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3a. erp_connections policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own ERP connections"
  ON public.erp_connections FOR SELECT
  TO authenticated
  USING (ca_user_id = auth.uid());

CREATE POLICY "Users can create own ERP connections"
  ON public.erp_connections FOR INSERT
  TO authenticated
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can update own ERP connections"
  ON public.erp_connections FOR UPDATE
  TO authenticated
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can delete own ERP connections"
  ON public.erp_connections FOR DELETE
  TO authenticated
  USING (ca_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3b. erp_field_mappings policies (scoped through parent connection)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own ERP field mappings"
  ON public.erp_field_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_field_mappings.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own ERP field mappings"
  ON public.erp_field_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_field_mappings.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own ERP field mappings"
  ON public.erp_field_mappings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_field_mappings.connection_id
        AND c.ca_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_field_mappings.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own ERP field mappings"
  ON public.erp_field_mappings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_field_mappings.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3c. erp_sync_jobs policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own ERP sync jobs"
  ON public.erp_sync_jobs FOR SELECT
  TO authenticated
  USING (ca_user_id = auth.uid());

CREATE POLICY "Users can create own ERP sync jobs"
  ON public.erp_sync_jobs FOR INSERT
  TO authenticated
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can update own ERP sync jobs"
  ON public.erp_sync_jobs FOR UPDATE
  TO authenticated
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can delete own ERP sync jobs"
  ON public.erp_sync_jobs FOR DELETE
  TO authenticated
  USING (ca_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3d. erp_sync_logs policies (scoped through parent sync job)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own ERP sync logs"
  ON public.erp_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_sync_jobs j
      WHERE j.id = erp_sync_logs.sync_job_id
        AND j.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own ERP sync logs"
  ON public.erp_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.erp_sync_jobs j
      WHERE j.id = erp_sync_logs.sync_job_id
        AND j.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own ERP sync logs"
  ON public.erp_sync_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_sync_jobs j
      WHERE j.id = erp_sync_logs.sync_job_id
        AND j.ca_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3e. erp_data_cache policies (scoped through parent connection)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own ERP data cache"
  ON public.erp_data_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_data_cache.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own ERP data cache"
  ON public.erp_data_cache FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_data_cache.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own ERP data cache"
  ON public.erp_data_cache FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_data_cache.connection_id
        AND c.ca_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_data_cache.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own ERP data cache"
  ON public.erp_data_cache FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.erp_connections c
      WHERE c.id = erp_data_cache.connection_id
        AND c.ca_user_id = auth.uid()
    )
  );


-- =============================================================================
-- 4. VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4a. erp_connection_dashboard — overview of all connections with sync stats
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.erp_connection_dashboard AS
SELECT
  c.id AS connection_id,
  c.ca_user_id,
  c.platform,
  c.connection_name,
  c.company_name,
  c.status,
  c.sync_direction,
  c.auto_sync_enabled,
  c.sync_frequency_minutes,
  c.last_sync_at,
  c.last_connected_at,
  c.last_error,
  c.environment,
  c.created_at,
  COALESCE(js.total_jobs, 0) AS total_sync_jobs,
  COALESCE(js.successful_jobs, 0) AS successful_sync_jobs,
  COALESCE(js.failed_jobs, 0) AS failed_sync_jobs,
  COALESCE(js.total_records_synced, 0) AS total_records_synced,
  COALESCE(js.last_job_status, 'none') AS last_job_status,
  COALESCE(fm.mapping_count, 0) AS field_mapping_count
FROM public.erp_connections c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS total_jobs,
    COUNT(*) FILTER (WHERE j.status = 'completed')::INTEGER AS successful_jobs,
    COUNT(*) FILTER (WHERE j.status = 'failed')::INTEGER AS failed_jobs,
    SUM(COALESCE(j.records_created, 0) + COALESCE(j.records_updated, 0))::BIGINT AS total_records_synced,
    (SELECT j2.status FROM public.erp_sync_jobs j2
     WHERE j2.connection_id = c.id
     ORDER BY j2.created_at DESC LIMIT 1) AS last_job_status
  FROM public.erp_sync_jobs j
  WHERE j.connection_id = c.id
) js ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS mapping_count
  FROM public.erp_field_mappings fm2
  WHERE fm2.connection_id = c.id
    AND fm2.is_active = true
) fm ON true;

-- ---------------------------------------------------------------------------
-- 4b. erp_sync_job_details — detailed view of recent sync jobs with duration
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.erp_sync_job_details AS
SELECT
  j.id AS job_id,
  j.connection_id,
  j.ca_user_id,
  c.platform,
  c.connection_name,
  j.sync_type,
  j.direction,
  j.entities_synced,
  j.status,
  j.progress_pct,
  j.started_at,
  j.completed_at,
  j.records_fetched,
  j.records_created,
  j.records_updated,
  j.records_skipped,
  j.records_failed,
  j.error_message,
  j.duration_ms,
  j.created_at,
  COALESCE(sl.log_count, 0) AS total_log_entries,
  COALESCE(sl.error_count, 0) AS error_log_entries
FROM public.erp_sync_jobs j
JOIN public.erp_connections c ON c.id = j.connection_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS log_count,
    COUNT(*) FILTER (WHERE l.status = 'failed')::INTEGER AS error_count
  FROM public.erp_sync_logs l
  WHERE l.sync_job_id = j.id
) sl ON true;


-- =============================================================================
-- 5. TRIGGER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5a. Auto-update connection status when a sync job completes or fails
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_erp_sync_job_update_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'running' AND (OLD.status IS NULL OR OLD.status != 'running') THEN
    UPDATE public.erp_connections
    SET status = 'syncing',
        updated_at = now()
    WHERE id = NEW.connection_id;

  ELSIF NEW.status = 'completed' THEN
    UPDATE public.erp_connections
    SET status = 'connected',
        last_sync_at = now(),
        last_error = NULL,
        updated_at = now()
    WHERE id = NEW.connection_id;

  ELSIF NEW.status = 'failed' THEN
    UPDATE public.erp_connections
    SET status = 'error',
        last_error = COALESCE(NEW.error_message, 'Sync job failed'),
        updated_at = now()
    WHERE id = NEW.connection_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5b. Auto-calculate duration when sync job completes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_erp_sync_job_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'partial', 'cancelled')
     AND NEW.started_at IS NOT NULL
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;

  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER * 1000;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5c. Expire stale data cache entries
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_erp_cache_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On insert, clean up expired entries for the same connection
  DELETE FROM public.erp_data_cache
  WHERE connection_id = NEW.connection_id
    AND expires_at IS NOT NULL
    AND expires_at < now();

  RETURN NEW;
END;
$$;


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_erp_connections_updated_at ON public.erp_connections;
CREATE TRIGGER trg_erp_connections_updated_at
  BEFORE UPDATE ON public.erp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_erp_mappings_updated_at ON public.erp_field_mappings;
CREATE TRIGGER trg_erp_mappings_updated_at
  BEFORE UPDATE ON public.erp_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync job → connection status trigger
DROP TRIGGER IF EXISTS trg_erp_sync_job_connection_status ON public.erp_sync_jobs;
CREATE TRIGGER trg_erp_sync_job_connection_status
  AFTER INSERT OR UPDATE OF status ON public.erp_sync_jobs
  FOR EACH ROW
  WHEN (NEW.status IN ('running', 'completed', 'failed'))
  EXECUTE FUNCTION public.fn_erp_sync_job_update_connection();

-- Sync job auto-duration
DROP TRIGGER IF EXISTS trg_erp_sync_job_duration ON public.erp_sync_jobs;
CREATE TRIGGER trg_erp_sync_job_duration
  BEFORE UPDATE OF status ON public.erp_sync_jobs
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed', 'partial', 'cancelled'))
  EXECUTE FUNCTION public.fn_erp_sync_job_duration();

-- Cache cleanup on insert
DROP TRIGGER IF EXISTS trg_erp_cache_cleanup ON public.erp_data_cache;
CREATE TRIGGER trg_erp_cache_cleanup
  AFTER INSERT ON public.erp_data_cache
  FOR EACH ROW EXECUTE FUNCTION public.fn_erp_cache_cleanup();
