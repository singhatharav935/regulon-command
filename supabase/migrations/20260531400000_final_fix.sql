-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  FINAL PATCH: Fix remaining 3 errors                          ║
-- ║  1. company_members FK → companies (for PostgREST join)        ║
-- ║  2. regulatory_news_feed missing columns                       ║
-- ║  3. Enable Supabase Realtime on key tables                     ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- ─── A: Ensure company_members FK exists ─────────────────────────
DO $a$
BEGIN
  -- The company_members table was created in the master migration WITH
  -- REFERENCES companies(id), but it may have failed due to ordering.
  -- Re-add to be safe:
  ALTER TABLE public.company_members
    ADD CONSTRAINT fk_cm_company
    FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK company_members: %', SQLERRM;
END $a$;

-- ─── B: regulatory_news_feed — ensure all columns exist ──────────
DO $b$
DECLARE _sql TEXT;
  _stmts TEXT[] := ARRAY[
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS authority TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS authority_code TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS effective_date DATE',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS published_date DATE',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS impact_level TEXT DEFAULT ''medium''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS full_text TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS source_url TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS affected_sectors TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS affected_companies TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS required_actions TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS penalty_max TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS penalty_late_fee TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS related_filings TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS ai_summary TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS ai_impact_analysis TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS change_summary TEXT DEFAULT ''Initial publication''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS updated_by UUID',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',
    -- consent_requests columns
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS ca_user_id UUID',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT ''''',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS client_email TEXT',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS client_phone TEXT',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS gstin TEXT',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS pan TEXT',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS cin TEXT',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS ca_name TEXT',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS consent_status TEXT DEFAULT ''pending''',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS consent_token TEXT DEFAULT gen_random_uuid()::text',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.consent_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ',
    -- company_regulatory_evaluations — FK + columns
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS news_id UUID',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS matched_version INTEGER DEFAULT 1',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT ''pending_review''',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS matched_reason TEXT DEFAULT ''''',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ DEFAULT now()',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',
    -- regulatory_news_versions
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS title TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS authority TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS authority_code TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS category TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS effective_date DATE',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS published_date DATE',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS summary TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS full_text TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS source_url TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS impact_level TEXT DEFAULT ''medium''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS affected_sectors TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS affected_companies TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS required_actions TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS penalty_max TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS penalty_late_fee TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS related_filings TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS ai_summary TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS ai_impact_analysis TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS change_summary TEXT DEFAULT ''''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS created_by UUID'
  ];
BEGIN
  FOREACH _sql IN ARRAY _stmts LOOP
    BEGIN EXECUTE _sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skip: %', SQLERRM;
    END;
  END LOOP;
END $b$;

-- Backfill published_date from published_at
UPDATE public.regulatory_news_feed
  SET published_date = published_at::date
  WHERE published_date IS NULL AND published_at IS NOT NULL;

UPDATE public.regulatory_news_feed
  SET authority = COALESCE(source, regulator, 'Unknown'),
      authority_code = UPPER(LEFT(COALESCE(regulator, source, 'GEN'), 4))
  WHERE authority IS NULL;

-- ─── C: FK for company_regulatory_evaluations ────────────────────
DO $c$
BEGIN
  ALTER TABLE public.company_regulatory_evaluations
    ADD CONSTRAINT fk_eval_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $c$;

DO $c2$
BEGIN
  ALTER TABLE public.company_regulatory_evaluations
    ADD CONSTRAINT fk_eval_news
    FOREIGN KEY (news_id) REFERENCES public.regulatory_news_feed(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $c2$;

-- ─── D: Enable Supabase Realtime replication on key tables ───────
-- Without this, the Realtime channel subscription silently fails
DO $rt$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt$;

DO $rt2$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.company_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt2$;

DO $rt3$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_tasks;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt3$;

DO $rt4$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ca_clients;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt4$;

DO $rt5$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.consent_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt5$;

DO $rt6$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.document_vault;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt6$;

DO $rt7$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.regulatory_news_feed;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt7$;

DO $rt8$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ca_firm_invoices;
EXCEPTION WHEN OTHERS THEN NULL;
END $rt8$;

-- ─── E: Ensure RLS policies exist (open) ─────────────────────────
-- PostgREST returns 406 if RLS is enabled but no policy exists
DO $rls$
DECLARE
  _tbl TEXT;
  _tables TEXT[] := ARRAY[
    'companies','company_members','consent_requests','regulatory_news_feed',
    'ca_clients','compliance_tasks','ca_dependencies','ca_task_history',
    'client_govt_notices','communication_logs','ca_firm_invoices',
    'document_vault','regulatory_news_versions','company_regulatory_evaluations',
    'notification_alert_rules','notification_templates','notification_channels',
    'notification_dispatches','notification_recipients','notification_delivery_stats',
    'rbac_roles','rbac_teams','rbac_team_members','rbac_team_invitations',
    'entities','entity_groups','entity_group_members',
    'efiling_portal_credentials','efiling_jobs','efiling_documents',
    'payment_transactions','payment_reconciliation','tax_liability_heads',
    'data_retention_policies','compliance_scores','compliance_reports',
    'audit_trail_events','audit_alert_subscriptions'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _tables LOOP
    BEGIN
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _tbl);
      -- Create an open policy for authenticated users
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        'allow_all_' || _tbl,
        _tbl
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'RLS skip %: %', _tbl, SQLERRM;
    END;
  END LOOP;
END $rls$;

-- ─── F: Permissions ──────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
