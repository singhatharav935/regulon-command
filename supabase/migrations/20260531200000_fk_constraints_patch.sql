-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  PATCH 2: Add missing FK constraints for PostgREST joins       ║
-- ║  + fix remaining column mismatches.                            ║
-- ║  Safe to run multiple times (IF NOT EXISTS / exception blocks) ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- ─── Part A: Foreign Key Constraints ──────────────────────────────
-- PostgREST join syntax like .select('*, companies(name)') REQUIRES
-- a FK constraint from the child table to the parent table.
-- Without these, PostgREST returns 400.

DO $fk$
DECLARE
  _sql TEXT;
  _stmts TEXT[] := ARRAY[
    -- ca_dependencies → companies
    'ALTER TABLE public.ca_dependencies ADD CONSTRAINT fk_ca_deps_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE',
    -- client_govt_notices → companies
    'ALTER TABLE public.client_govt_notices ADD CONSTRAINT fk_notices_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE',
    -- ca_task_history → companies
    'ALTER TABLE public.ca_task_history ADD CONSTRAINT fk_task_history_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL',
    -- communication_logs → companies
    'ALTER TABLE public.communication_logs ADD CONSTRAINT fk_comms_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL',
    -- company_members → companies (may already exist)
    'ALTER TABLE public.company_members ADD CONSTRAINT fk_members_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE',
    -- notification_alert_rules → notification_templates
    'ALTER TABLE public.notification_alert_rules ADD CONSTRAINT fk_alert_rules_template FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL',
    -- notification_dispatches → notification_templates
    'ALTER TABLE public.notification_dispatches ADD CONSTRAINT fk_dispatches_template FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL',
    -- notification_dispatches → notification_recipients
    'ALTER TABLE public.notification_dispatches ADD CONSTRAINT fk_dispatches_recipient FOREIGN KEY (recipient_id) REFERENCES public.notification_recipients(id) ON DELETE SET NULL',
    -- rbac_team_members → rbac_roles
    'ALTER TABLE public.rbac_team_members ADD CONSTRAINT fk_team_members_role FOREIGN KEY (role_id) REFERENCES public.rbac_roles(id) ON DELETE SET NULL',
    -- rbac_team_members → rbac_teams
    'ALTER TABLE public.rbac_team_members ADD CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES public.rbac_teams(id) ON DELETE CASCADE',
    -- tax_liability_heads → entities
    'ALTER TABLE public.tax_liability_heads ADD CONSTRAINT fk_tax_heads_entity FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL',
    -- entity_group_members → entities (may already exist)
    'ALTER TABLE public.entity_group_members ADD CONSTRAINT fk_egm_entity FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE',
    -- entity_group_members → entity_groups (may already exist)
    'ALTER TABLE public.entity_group_members ADD CONSTRAINT fk_egm_group FOREIGN KEY (group_id) REFERENCES public.entity_groups(id) ON DELETE CASCADE',
    -- client_module_calculations → ca_clients (for PostgREST join)
    'ALTER TABLE public.client_module_calculations ADD CONSTRAINT fk_calc_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE',
    -- efiling_jobs → efiling_portal_credentials
    'ALTER TABLE public.efiling_jobs ADD CONSTRAINT fk_efiling_cred FOREIGN KEY (credential_id) REFERENCES public.efiling_portal_credentials(id) ON DELETE SET NULL',
    -- ca_dependencies → auth.users
    'ALTER TABLE public.ca_dependencies ADD CONSTRAINT fk_ca_deps_user FOREIGN KEY (ca_user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
    -- client_govt_notices → auth.users
    'ALTER TABLE public.client_govt_notices ADD CONSTRAINT fk_notices_user FOREIGN KEY (ca_user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
    -- notification_dispatches → notification_channels
    'ALTER TABLE public.notification_dispatches ADD CONSTRAINT fk_dispatches_channel FOREIGN KEY (channel_id) REFERENCES public.notification_channels(id) ON DELETE SET NULL'
  ];
BEGIN
  FOREACH _sql IN ARRAY _stmts LOOP
    BEGIN
      EXECUTE _sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'FK skip (OK): %', SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'All FK constraints processed.';
END $fk$;

-- ─── Part B: Missing columns that still cause 400 ────────────────

DO $cols$
DECLARE
  _sql TEXT;
  _stmts TEXT[] := ARRAY[
    -- ca_task_history
    'ALTER TABLE public.ca_task_history ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.ca_task_history ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now()',
    'ALTER TABLE public.ca_task_history ADD COLUMN IF NOT EXISTS task_name TEXT DEFAULT ''''',
    'ALTER TABLE public.ca_task_history ADD COLUMN IF NOT EXISTS hours_spent NUMERIC(6,2) DEFAULT 0',
    'ALTER TABLE public.ca_task_history ADD COLUMN IF NOT EXISTS billable_amount NUMERIC(14,2) DEFAULT 0',
    -- ca_dependencies
    'ALTER TABLE public.ca_dependencies ADD COLUMN IF NOT EXISTS due_date DATE',
    'ALTER TABLE public.ca_dependencies ADD COLUMN IF NOT EXISTS document_name TEXT DEFAULT ''''',
    'ALTER TABLE public.ca_dependencies ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT ''medium''',
    -- client_govt_notices
    'ALTER TABLE public.client_govt_notices ADD COLUMN IF NOT EXISTS due_date DATE',
    'ALTER TABLE public.client_govt_notices ADD COLUMN IF NOT EXISTS notice_type TEXT DEFAULT ''''',
    'ALTER TABLE public.client_govt_notices ADD COLUMN IF NOT EXISTS notice_number TEXT DEFAULT ''''',
    'ALTER TABLE public.client_govt_notices ADD COLUMN IF NOT EXISTS department TEXT DEFAULT ''''',
    -- communication_logs
    'ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT ''outbound''',
    'ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS subject TEXT',
    'ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS content TEXT',
    'ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS recipient TEXT',
    'ALTER TABLE public.communication_logs ADD COLUMN IF NOT EXISTS ai_agent_id TEXT',
    -- consent_requests
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
    -- companies (alias columns for LocalizationHub/OfflinePwaHub)
    'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_name TEXT',
    'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gst_number TEXT',
    'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pan_number TEXT',
    'ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS risk TEXT DEFAULT ''Medium''',
    -- compliance_tasks (alias columns for OfflinePwaHub)
    'ALTER TABLE public.compliance_tasks ADD COLUMN IF NOT EXISTS client_name TEXT',
    'ALTER TABLE public.compliance_tasks ADD COLUMN IF NOT EXISTS task_title TEXT',
    -- ca_firm_invoices
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS firm_id UUID',
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT ''draft''',
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2) DEFAULT 0',
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS due_date DATE',
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS payment_received_date DATE',
    -- notification_alert_rules (extra)
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS rule_name TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS trigger_event TEXT DEFAULT ''custom_schedule''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS channel_ids TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS advance_days INTEGER DEFAULT 3',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT ''all_clients''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS client_filter JSONB DEFAULT ''{}''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS time_of_day TEXT DEFAULT ''09:00''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS repeat_interval TEXT DEFAULT ''once''',
    -- notification_dispatches
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT ''email''',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS recipient_email TEXT',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS recipient_phone TEXT',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS body_rendered TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS provider_message_id TEXT',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS provider_response JSONB DEFAULT ''{}''',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS cost_inr NUMERIC(10,2) DEFAULT 0',
    -- notification_delivery_stats
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS stat_date DATE DEFAULT CURRENT_DATE',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_failed INTEGER DEFAULT 0',
    -- audit_trail_events
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS module TEXT DEFAULT ''system''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT ''info''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS actor_name TEXT DEFAULT ''''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0',
    -- audit_alert_subscriptions
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS alert_name TEXT DEFAULT ''''',
    -- notification_channels
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS channel_name TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS test_status TEXT',
    -- notification_templates
    'ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS template_name TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT ''custom''',
    -- notification_recipients
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS email TEXT',
    -- compliance_scores
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS overall_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS entity_name TEXT DEFAULT ''''',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS score_date DATE DEFAULT CURRENT_DATE',
    -- compliance_reports
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS report_name TEXT DEFAULT ''''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT ''custom''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS summary_data JSONB DEFAULT ''{}''',
    -- data_retention_policies
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS policy_name TEXT DEFAULT ''''',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS module TEXT DEFAULT ''system''',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS retention_days INTEGER DEFAULT 365',
    -- rbac_team_members
    'ALTER TABLE public.rbac_team_members ADD COLUMN IF NOT EXISTS role_id UUID',
    -- rbac_roles
    'ALTER TABLE public.rbac_roles ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT ''''',
    'ALTER TABLE public.rbac_roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.rbac_roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT ''[]''',
    -- efiling_jobs
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS credential_id UUID',
    -- entities (for PostgREST join from tax_liability_heads)
    'ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS entity_name TEXT DEFAULT ''''',
    'ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT ''''',
    'ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS gstin TEXT',
    'ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS pan TEXT'
  ];
BEGIN
  FOREACH _sql IN ARRAY _stmts LOOP
    BEGIN
      EXECUTE _sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Col skip (OK): %', SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'All column patches applied.';
END $cols$;

-- ─── Part C: Sync companies.company_name from companies.name ─────
-- So that queries using `company_name` find data
UPDATE public.companies SET company_name = name WHERE company_name IS NULL AND name IS NOT NULL;

-- ─── Part D: Permissions ─────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
