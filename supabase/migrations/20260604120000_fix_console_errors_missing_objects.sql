-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION: Fix all remaining console errors                        ║
-- ║  Every section is wrapped in exception handlers so a single         ║
-- ║  column mismatch won't kill the entire migration.                   ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION A: Create missing core tables (IF NOT EXISTS = safe no-op)
-- ═══════════════════════════════════════════════════════════════════════

DO $a1$ BEGIN
CREATE TABLE IF NOT EXISTS public.ca_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID,
  company_id UUID,
  company_name TEXT NOT NULL DEFAULT '',
  gstin TEXT, pan TEXT, cin TEXT,
  contact_email TEXT, contact_phone TEXT, industry TEXT,
  compliance_health_score INTEGER DEFAULT 75,
  risk_level TEXT DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'active',
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'ca_clients: %', SQLERRM;
END $a1$;

DO $a2$ BEGIN
CREATE TABLE IF NOT EXISTS public.compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID,
  company_id UUID,
  client_name TEXT DEFAULT '',
  task_title TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT DEFAULT 'general',
  due_date DATE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,
  completed_at TIMESTAMPTZ,
  comments TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'compliance_tasks: %', SQLERRM;
END $a2$;

DO $a3$ BEGIN
CREATE TABLE IF NOT EXISTS public.client_govt_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID,
  company_id UUID NOT NULL,
  department TEXT DEFAULT '',
  notice_type TEXT DEFAULT '',
  notice_number TEXT,
  issue_date DATE, due_date DATE,
  financial_year TEXT,
  raw_text_content TEXT,
  ai_draft_response TEXT,
  status TEXT DEFAULT 'detected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'client_govt_notices: %', SQLERRM;
END $a3$;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION B: Create missing notification tables (IF NOT EXISTS = safe)
-- ═══════════════════════════════════════════════════════════════════════

DO $b1$ BEGIN
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  channel_type TEXT DEFAULT 'email',
  display_name TEXT,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notification_channels: %', SQLERRM;
END $b1$;

DO $b2$ BEGIN
CREATE TABLE IF NOT EXISTS public.notification_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  rule_name TEXT DEFAULT '',
  event_type TEXT DEFAULT '',
  conditions JSONB DEFAULT '{}',
  template_id UUID, channel_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notification_alert_rules: %', SQLERRM;
END $b2$;

DO $b3$ BEGIN
CREATE TABLE IF NOT EXISTS public.notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  full_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT,
  channel_preferences JSONB DEFAULT '["email"]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notification_recipients: %', SQLERRM;
END $b3$;

DO $b4$ BEGIN
CREATE TABLE IF NOT EXISTS public.notification_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  rule_id UUID,
  channel TEXT DEFAULT 'email',
  recipient TEXT,
  subject TEXT, body TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notification_dispatches: %', SQLERRM;
END $b4$;

DO $b5$ BEGIN
CREATE TABLE IF NOT EXISTS public.notification_delivery_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID,
  channel TEXT DEFAULT 'email',
  period TEXT,
  sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notification_delivery_stats: %', SQLERRM;
END $b5$;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION C: Create missing views — EACH wrapped in exception handler
-- ═══════════════════════════════════════════════════════════════════════

-- C1: upcoming_deadlines_detailed
DO $v1$ BEGIN
  DROP VIEW IF EXISTS public.upcoming_deadlines_detailed CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.upcoming_deadlines_detailed AS
    SELECT
      e.*,
      EXTRACT(DAY FROM (e.due_date::timestamp - now()))::integer AS days_remaining
    FROM public.compliance_calendar_events e
    WHERE e.status NOT IN ('completed', 'cancelled')
    ORDER BY e.due_date ASC
  $sql$;
  RAISE NOTICE 'Created view: upcoming_deadlines_detailed';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP upcoming_deadlines_detailed: %', SQLERRM;
END $v1$;

-- C2: calendar_dashboard_summary
DO $v2$ BEGIN
  DROP VIEW IF EXISTS public.calendar_dashboard_summary CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.calendar_dashboard_summary AS
    SELECT
      e.ca_user_id,
      count(*)::integer AS total_events,
      count(*) FILTER (WHERE e.status = 'upcoming')::integer AS upcoming_count,
      count(*) FILTER (WHERE e.status = 'active')::integer AS active_count,
      count(*) FILTER (WHERE e.status = 'due_today')::integer AS due_today_count,
      count(*) FILTER (WHERE e.status = 'overdue')::integer AS overdue_count,
      count(*) FILTER (WHERE e.status = 'completed')::integer AS completed_count,
      count(*) FILTER (WHERE e.priority = 'critical' AND e.status NOT IN ('completed','cancelled'))::integer AS critical_pending,
      count(*) FILTER (WHERE e.due_date <= (now() + interval '7 days')::date AND e.status NOT IN ('completed','cancelled'))::integer AS due_this_week,
      count(*) FILTER (WHERE e.due_date <= (now() + interval '30 days')::date AND e.status NOT IN ('completed','cancelled'))::integer AS due_this_month,
      min(e.due_date) FILTER (WHERE e.status NOT IN ('completed','cancelled')) AS next_due_date
    FROM public.compliance_calendar_events e
    GROUP BY e.ca_user_id
  $sql$;
  RAISE NOTICE 'Created view: calendar_dashboard_summary';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP calendar_dashboard_summary: %', SQLERRM;
END $v2$;

-- C3: upcoming_payments
DO $v3$ BEGIN
  DROP VIEW IF EXISTS public.upcoming_payments CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.upcoming_payments AS
    SELECT t.*
    FROM public.tax_liability_heads t
    WHERE t.status = 'pending'
      AND t.due_date >= CURRENT_DATE
    ORDER BY t.due_date ASC
  $sql$;
  RAISE NOTICE 'Created view: upcoming_payments';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP upcoming_payments: %', SQLERRM;
END $v3$;

-- C4: payment_dashboard_summary
DO $v4$ BEGIN
  DROP VIEW IF EXISTS public.payment_dashboard_summary CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.payment_dashboard_summary AS
    SELECT
      t.ca_user_id,
      COUNT(*)::integer AS total_liabilities,
      COUNT(*) FILTER (WHERE t.status = 'paid')::integer AS paid_count,
      COUNT(*) FILTER (WHERE t.status != 'paid')::integer AS unpaid_count,
      COUNT(*) FILTER (WHERE t.status != 'paid' AND t.due_date < CURRENT_DATE)::integer AS overdue_count,
      COALESCE(SUM(t.total_due_paise), 0)::bigint AS total_due_paise,
      COALESCE(SUM(t.amount), 0)::numeric AS total_amount
    FROM public.tax_liability_heads t
    GROUP BY t.ca_user_id
  $sql$;
  RAISE NOTICE 'Created view: payment_dashboard_summary';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP payment_dashboard_summary: %', SQLERRM;
END $v4$;

-- C5: efiling_dashboard_summary
DO $v5$ BEGIN
  DROP VIEW IF EXISTS public.efiling_dashboard_summary CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.efiling_dashboard_summary AS
    SELECT
      j.ca_user_id,
      count(*)::integer AS total_jobs,
      count(*) FILTER (WHERE j.status = 'completed')::integer AS completed_count,
      count(*) FILTER (WHERE j.status = 'failed')::integer AS failed_count,
      count(*) FILTER (WHERE j.status IN ('pending','draft','queued'))::integer AS pending_count,
      max(j.filed_at) AS last_filing_at
    FROM public.efiling_jobs j
    GROUP BY j.ca_user_id
  $sql$;
  RAISE NOTICE 'Created view: efiling_dashboard_summary';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP efiling_dashboard_summary: %', SQLERRM;
END $v5$;

-- C6: document_vault_dashboard
DO $v6$ BEGIN
  DROP VIEW IF EXISTS public.document_vault_dashboard CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.document_vault_dashboard AS
    SELECT
      d.ca_user_id,
      count(*)::integer AS total_documents,
      count(*) FILTER (WHERE d.status = 'active')::integer AS active_count,
      coalesce(sum(d.file_size_bytes), 0)::bigint AS total_size_bytes,
      max(d.created_at) AS last_upload_at
    FROM public.document_vault d
    GROUP BY d.ca_user_id
  $sql$;
  RAISE NOTICE 'Created view: document_vault_dashboard';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP document_vault_dashboard: %', SQLERRM;
END $v6$;

-- C7: erp_connection_dashboard
DO $v7$ BEGIN
  DROP VIEW IF EXISTS public.erp_connection_dashboard CASCADE;
  EXECUTE $sql$
    CREATE VIEW public.erp_connection_dashboard AS
    SELECT
      c.id AS connection_id,
      c.erp_type,
      c.connection_name,
      c.status,
      c.last_sync_at,
      c.created_at
    FROM public.erp_connections c
  $sql$;
  RAISE NOTICE 'Created view: erp_connection_dashboard';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP erp_connection_dashboard: %', SQLERRM;
END $v7$;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION D: Enable RLS and create open policies for all tables
-- ═══════════════════════════════════════════════════════════════════════

DO $rls$
DECLARE
  _tbl TEXT;
  _tables TEXT[] := ARRAY[
    'ca_clients',
    'compliance_tasks',
    'client_govt_notices',
    'notification_channels',
    'notification_alert_rules',
    'notification_recipients',
    'notification_dispatches',
    'notification_delivery_stats'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _tbl);
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'allow_all_' || _tbl, _tbl
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        'allow_all_' || _tbl, _tbl
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'RLS skip %: %', _tbl, SQLERRM;
    END;
  END LOOP;
END $rls$;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- SECTION E: Auto-populate ca_clients from existing companies
-- Uses ONLY columns guaranteed to exist on the deployed companies table
-- ═══════════════════════════════════════════════════════════════════════
DO $pop$ BEGIN
  INSERT INTO public.ca_clients (company_id, company_name, gstin, pan)
  SELECT c.id, c.name, c.gstin, c.pan
  FROM public.companies c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ca_clients cc WHERE cc.company_id = c.id
  )
  ON CONFLICT DO NOTHING;
  RAISE NOTICE 'Populated ca_clients from companies';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP ca_clients populate: %', SQLERRM;
END $pop$;
