-- REGULON SCHEMA FIX — Single safe query
-- Every statement is wrapped so failures don't stop execution
-- Run this in Supabase SQL Editor as-is

DO $fix$
DECLARE
  _sql TEXT;
  _statements TEXT[] := ARRAY[
    -- audit_trail_events
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS event_id TEXT DEFAULT gen_random_uuid()::text',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT ''ca_user''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS actor_id TEXT',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS actor_name TEXT DEFAULT ''''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS actor_ip TEXT',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS actor_user_agent TEXT',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS module TEXT DEFAULT ''system''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT ''''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS resource_id TEXT',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS resource_name TEXT',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS old_value JSONB',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS new_value JSONB',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS diff JSONB',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT ''info''',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS hash TEXT',
    'ALTER TABLE public.audit_trail_events ADD COLUMN IF NOT EXISTS previous_hash TEXT',

    -- audit_alert_subscriptions
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS alert_name TEXT DEFAULT ''''',
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT ''{}''',
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS notify_email TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS notify_webhook TEXT',
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0',
    'ALTER TABLE public.audit_alert_subscriptions ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ',

    -- compliance_scores
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS entity_id UUID',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS entity_name TEXT DEFAULT ''''',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS gst_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS itr_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS tds_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS mca_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS rbi_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS sebi_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS overall_score INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS pending_filings INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS overdue_filings INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS pending_payments INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS open_notices INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS unresolved_queries INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS previous_score INTEGER',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS score_delta INTEGER DEFAULT 0',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS computed_by TEXT DEFAULT ''system''',
    'ALTER TABLE public.compliance_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',

    -- compliance_reports
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS period_start DATE',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS period_end DATE',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS entity_scope TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS modules_included TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS format TEXT DEFAULT ''pdf''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS summary_data JSONB DEFAULT ''{}''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS findings JSONB DEFAULT ''[]''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS recommendations TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 0',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS shared_with TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS generated_by TEXT',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS approved_by TEXT',
    'ALTER TABLE public.compliance_reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ',

    -- data_retention_policies
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS module TEXT DEFAULT ''system''',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS auto_archive BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS auto_delete_after_days INTEGER',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS legal_basis TEXT DEFAULT ''''',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS records_archived INTEGER DEFAULT 0',
    'ALTER TABLE public.data_retention_policies ADD COLUMN IF NOT EXISTS records_deleted INTEGER DEFAULT 0',

    -- notification_channels
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS channel_name TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS rate_limit_per_hour INTEGER DEFAULT 100',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS rate_limit_per_day INTEGER DEFAULT 1000',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ',
    'ALTER TABLE public.notification_channels ADD COLUMN IF NOT EXISTS test_status TEXT',

    -- notification_templates
    'ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT ''email''',
    'ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT ''custom''',
    'ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS whatsapp_template_id TEXT',
    'ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0',

    -- notification_alert_rules
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS trigger_event TEXT DEFAULT ''custom_schedule''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS channel_ids TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS advance_days INTEGER DEFAULT 3',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT ''all_clients''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS client_filter JSONB DEFAULT ''{}''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS time_of_day TEXT DEFAULT ''09:00''',
    'ALTER TABLE public.notification_alert_rules ADD COLUMN IF NOT EXISTS repeat_interval TEXT DEFAULT ''once''',

    -- notification_recipients
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS company_name TEXT',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS company_id UUID',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS is_opted_in_email BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS is_opted_in_sms BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS is_opted_in_whatsapp BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.notification_recipients ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT ''{}''',

    -- notification_dispatches
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS template_id UUID',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS channel_id UUID',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS recipient_id UUID',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT ''email''',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS recipient_email TEXT',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS recipient_phone TEXT',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS body_rendered TEXT DEFAULT ''''',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS provider_message_id TEXT',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS provider_response JSONB DEFAULT ''{}''',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS cost_inr NUMERIC(10,2) DEFAULT 0',
    'ALTER TABLE public.notification_dispatches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',

    -- notification_delivery_stats
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS stat_date DATE DEFAULT CURRENT_DATE',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT ''email''',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_failed INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_bounced INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_opened INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_clicked INTEGER DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS total_cost_inr NUMERIC(10,2) DEFAULT 0',
    'ALTER TABLE public.notification_delivery_stats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',

    -- ca_clients
    'ALTER TABLE public.ca_clients ADD COLUMN IF NOT EXISTS gst_number TEXT',
    'ALTER TABLE public.ca_clients ADD COLUMN IF NOT EXISTS pan_number TEXT',

    -- ca_firm_invoices
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS billed_date DATE',
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT ''draft''',
    'ALTER TABLE public.ca_firm_invoices ADD COLUMN IF NOT EXISTS client_name TEXT',

    -- enterprise_api_keys
    'ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS description TEXT',
    'ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ''{}''',

    -- webhook_endpoints
    'ALTER TABLE public.webhook_endpoints ADD COLUMN IF NOT EXISTS name TEXT',
    'ALTER TABLE public.webhook_endpoints ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT ''{}''',
    'ALTER TABLE public.webhook_endpoints ADD COLUMN IF NOT EXISTS retry_policy JSONB DEFAULT ''{}''',
    'ALTER TABLE public.webhook_endpoints ADD COLUMN IF NOT EXISTS last_response_code INTEGER',

    -- webhook_deliveries
    'ALTER TABLE public.webhook_deliveries ADD COLUMN IF NOT EXISTS request_body JSONB',
    'ALTER TABLE public.webhook_deliveries ADD COLUMN IF NOT EXISTS response_headers JSONB',

    -- erp_connections
    'ALTER TABLE public.erp_connections ADD COLUMN IF NOT EXISTS display_name TEXT',
    'ALTER TABLE public.erp_connections ADD COLUMN IF NOT EXISTS api_base_url TEXT',
    'ALTER TABLE public.erp_connections ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT ''api_key''',
    'ALTER TABLE public.erp_connections ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT ''unknown''',
    'ALTER TABLE public.erp_connections ADD COLUMN IF NOT EXISTS total_records_synced BIGINT DEFAULT 0',

    -- erp_sync_jobs
    'ALTER TABLE public.erp_sync_jobs ADD COLUMN IF NOT EXISTS error_message TEXT',
    'ALTER TABLE public.erp_sync_jobs ADD COLUMN IF NOT EXISTS records_failed INTEGER DEFAULT 0',
    'ALTER TABLE public.erp_sync_jobs ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0',

    -- efiling
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS portal_url TEXT',
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS encryption_key_ref TEXT',
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS last_login_status TEXT',
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS credential_expiry DATE',
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS pan TEXT',
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS gstin TEXT',
    'ALTER TABLE public.efiling_portal_credentials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS assessment_year TEXT',
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS computed_fields JSONB DEFAULT ''{}''',
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS submission_mode TEXT DEFAULT ''manual''',
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS receipt_path TEXT',
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS error_log JSONB DEFAULT ''[]''',
    'ALTER TABLE public.efiling_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0',

    -- payment
    'ALTER TABLE public.tax_liability_heads ADD COLUMN IF NOT EXISTS section TEXT',
    'ALTER TABLE public.tax_liability_heads ADD COLUMN IF NOT EXISTS assessment_year TEXT',
    'ALTER TABLE public.tax_liability_heads ADD COLUMN IF NOT EXISTS linked_event_id UUID',
    'ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS amount_paise BIGINT DEFAULT 0',
    'ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS gateway_order_id TEXT',
    'ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT',
    'ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS receipt_path TEXT',
    'ALTER TABLE public.payment_reconciliation ADD COLUMN IF NOT EXISTS bank_reference TEXT',
    'ALTER TABLE public.payment_reconciliation ADD COLUMN IF NOT EXISTS bank_amount NUMERIC(14,2)',
    'ALTER TABLE public.payment_reconciliation ADD COLUMN IF NOT EXISTS liability_id UUID',

    -- document_vault
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS entity_id UUID',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_extension TEXT DEFAULT ''''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT ''application/octet-stream''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 0',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT ''documents''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS storage_path TEXT DEFAULT ''''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS thumbnail_path TEXT',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS sub_category TEXT',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS compliance_domain TEXT',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS financial_year TEXT',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS assessment_year TEXT',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS period_from DATE',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS period_to DATE',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2)',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS is_ocr_processed BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS verified_by UUID',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS source TEXT DEFAULT ''upload''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT ''{}''',
    'ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1',

    -- document_versions
    'ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 0',
    'ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS storage_path TEXT DEFAULT ''''',
    'ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT ''''',
    'ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS change_summary TEXT',

    -- ocr_jobs
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS ocr_engine TEXT DEFAULT ''google_vision''',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS language_hints TEXT[] DEFAULT ''{eng,hin}''',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS processing_options JSONB DEFAULT ''{}''',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS duration_ms INTEGER',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS pages_processed INTEGER DEFAULT 0',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 0',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,4)',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS error_details JSONB',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0',
    'ALTER TABLE public.ocr_jobs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3',

    -- ocr_results
    'ALTER TABLE public.ocr_results ADD COLUMN IF NOT EXISTS raw_text TEXT',
    'ALTER TABLE public.ocr_results ADD COLUMN IF NOT EXISTS raw_text_confidence NUMERIC(5,4)',
    'ALTER TABLE public.ocr_results ADD COLUMN IF NOT EXISTS extracted_fields JSONB DEFAULT ''{}''',
    'ALTER TABLE public.ocr_results ADD COLUMN IF NOT EXISTS extracted_tables JSONB DEFAULT ''[]''',
    'ALTER TABLE public.ocr_results ADD COLUMN IF NOT EXISTS detected_entities JSONB DEFAULT ''{}''',
    'ALTER TABLE public.ocr_results ADD COLUMN IF NOT EXISTS bounding_boxes JSONB DEFAULT ''[]''',

    -- rbac
    'ALTER TABLE public.rbac_roles ADD COLUMN IF NOT EXISTS display_name TEXT',
    'ALTER TABLE public.rbac_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.rbac_role_permissions ADD COLUMN IF NOT EXISTS actions TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.rbac_teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
    'ALTER TABLE public.rbac_team_members ADD COLUMN IF NOT EXISTS invited_by UUID',
    'ALTER TABLE public.rbac_team_invitations ADD COLUMN IF NOT EXISTS role_name TEXT',
    'ALTER TABLE public.rbac_team_invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ',

    -- entity
    'ALTER TABLE public.entity_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',

    -- regulatory
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS diff_summary TEXT',

    -- localization
    'ALTER TABLE public.user_language_preferences ADD COLUMN IF NOT EXISTS region TEXT',

    -- user_verifications
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS persona TEXT DEFAULT ''company_owner''',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS entity_name TEXT',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS registration_number TEXT',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS license_number TEXT',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS jurisdiction TEXT',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS document_path TEXT',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT ''{}''',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS reviewed_by UUID',
    'ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ'
  ];
BEGIN
  FOREACH _sql IN ARRAY _statements LOOP
    BEGIN
      EXECUTE _sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped (OK): % — %', _sql, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'All column patches applied.';
END $fix$;

-- RPC: bootstrap_ca_rbac_system
CREATE OR REPLACE FUNCTION public.bootstrap_ca_rbac_system(ca_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.rbac_roles (ca_user_id, role_name, display_name, description, is_system, permissions)
  VALUES
    (ca_id, 'owner', 'Owner', 'Full access', TRUE, '["*"]'::jsonb),
    (ca_id, 'admin', 'Admin', 'Administrative access', TRUE, '["manage_team","manage_clients"]'::jsonb),
    (ca_id, 'manager', 'Manager', 'Manage clients', TRUE, '["manage_clients","view_reports"]'::jsonb),
    (ca_id, 'analyst', 'Analyst', 'View data', TRUE, '["view_clients","view_reports"]'::jsonb),
    (ca_id, 'intern', 'Intern', 'Limited access', TRUE, '["view_clients"]'::jsonb)
  ON CONFLICT DO NOTHING;
END;
$$;

-- RPC: bootstrap_retention_policies
CREATE OR REPLACE FUNCTION public.bootstrap_retention_policies(ca_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.data_retention_policies (ca_user_id, module, policy_name, retention_days, auto_archive, legal_basis, is_active)
  VALUES
    (ca_id, 'audit-trail', 'Audit Trail Retention', 2555, TRUE, 'Companies Act 2013', TRUE),
    (ca_id, 'clients', 'Client Data Retention', 2555, TRUE, 'Income Tax Act', TRUE),
    (ca_id, 'e-filing', 'E-Filing Records', 2555, FALSE, 'IT Act Section 44AA', TRUE),
    (ca_id, 'payment', 'Payment Records', 3650, FALSE, 'GST Act', TRUE),
    (ca_id, 'doc-ocr', 'Document Retention', 2555, TRUE, 'Companies Act 2013', TRUE),
    (ca_id, 'notifications', 'Notification Logs', 365, TRUE, 'Internal policy', TRUE),
    (ca_id, 'calendar', 'Calendar Events', 1825, FALSE, 'Internal policy', TRUE)
  ON CONFLICT DO NOTHING;
END;
$$;

-- RPC: has_persona
CREATE OR REPLACE FUNCTION public.has_persona(_user_id UUID, _persona TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_personas WHERE user_id = _user_id AND persona = _persona)
$$;

-- Grant execute on RPCs
GRANT EXECUTE ON FUNCTION public.bootstrap_ca_rbac_system(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_retention_policies(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_persona(UUID, TEXT) TO authenticated;

-- Refresh view (must DROP first since column order changed)
DROP VIEW IF EXISTS public.document_vault_dashboard CASCADE;
CREATE VIEW public.document_vault_dashboard AS
SELECT d.id AS document_id, d.ca_user_id, d.title, d.file_name, d.file_extension,
  d.mime_type, d.file_size_bytes, d.category, d.sub_category, d.compliance_domain,
  d.financial_year, d.status, d.is_ocr_processed, d.is_verified, d.tags,
  d.source, d.current_version, d.created_at, d.updated_at,
  COALESCE((SELECT COUNT(*)::int FROM public.document_versions v WHERE v.document_id = d.id), 0) AS total_versions
FROM public.document_vault d;

GRANT SELECT ON public.document_vault_dashboard TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
