-- Migration: Notification & Alert Engine (SMS, Email, WhatsApp)
-- Created: 2026-05-29
-- Description: Multi-channel notification dispatching with templates, schedules, delivery logs and alert rules.

-- ── 1. notification_channels ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
    channel_name TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}',
    -- For email: { from_name, from_email, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted }
    -- For SMS: { provider: 'twilio'|'msg91'|'kaleyra', api_key_encrypted, sender_id }
    -- For WhatsApp: { provider: 'twilio'|'meta'|'wati', api_key_encrypted, phone_number_id, business_account_id }
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT 1000,
    total_sent INTEGER DEFAULT 0,
    last_tested_at TIMESTAMPTZ,
    test_status TEXT CHECK (test_status IN ('pass', 'fail', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. notification_templates ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
    category TEXT NOT NULL CHECK (category IN (
        'deadline_reminder', 'payment_due', 'filing_completed', 'document_request',
        'compliance_alert', 'audit_notice', 'gst_alert', 'itr_alert',
        'tds_alert', 'mca_alert', 'custom'
    )),
    subject TEXT,            -- for email
    body TEXT NOT NULL,      -- Handlebars-style template: {{client_name}}, {{due_date}}, etc.
    whatsapp_template_id TEXT, -- Meta-approved template ID for WhatsApp
    variables TEXT[] DEFAULT '{}', -- list of variable names used in template
    is_active BOOLEAN DEFAULT true,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ca_user_id, template_name)
);

-- ── 3. notification_alert_rules ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN (
        'deadline_approaching', 'deadline_missed', 'payment_overdue', 'filing_due',
        'document_expiry', 'compliance_score_drop', 'gst_return_due', 'itr_due',
        'tds_due', 'mca_filing_due', 'roc_compliance', 'custom_schedule'
    )),
    channel_ids UUID[] DEFAULT '{}',    -- which channels to dispatch via
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    advance_days INTEGER DEFAULT 7,     -- how many days before event to trigger
    is_enabled BOOLEAN DEFAULT true,
    scope TEXT DEFAULT 'all_clients' CHECK (scope IN ('all_clients', 'specific_clients', 'tagged_clients')),
    client_filter JSONB DEFAULT '{}',   -- for specific/tagged clients
    time_of_day TIME DEFAULT '09:00',   -- local time to dispatch
    repeat_interval TEXT DEFAULT 'once' CHECK (repeat_interval IN ('once', 'daily', 'weekly', 'monthly')),
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. notification_recipients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    company_name TEXT,
    company_id UUID,
    tags TEXT[] DEFAULT '{}',
    is_opted_in_email BOOLEAN DEFAULT true,
    is_opted_in_sms BOOLEAN DEFAULT true,
    is_opted_in_whatsapp BOOLEAN DEFAULT true,
    custom_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. notification_dispatches ────────────────────────────────────────────────
-- Records each individual notification dispatch attempt
CREATE TABLE IF NOT EXISTS notification_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES notification_alert_rules(id) ON DELETE SET NULL,
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES notification_recipients(id) ON DELETE SET NULL,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
    recipient_email TEXT,
    recipient_phone TEXT,
    subject TEXT,
    body_rendered TEXT NOT NULL,        -- final message with variables substituted
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'delivered', 'failed', 'bounced', 'unsubscribed')),
    provider_message_id TEXT,           -- external provider's message ID for tracking
    provider_response JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,             -- for email open tracking
    clicked_at TIMESTAMPTZ,            -- for email click tracking
    cost_inr NUMERIC(10, 4) DEFAULT 0, -- per-message cost for billing
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. notification_delivery_stats ────────────────────────────────────────────
-- Aggregated daily stats per channel for analytics
CREATE TABLE IF NOT EXISTS notification_delivery_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    stat_date DATE NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_cost_inr NUMERIC(12, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ca_user_id, channel_type, stat_date)
);

-- ── 7. Triggers ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_channels_updated_at') THEN
    CREATE TRIGGER update_notification_channels_updated_at BEFORE UPDATE ON notification_channels FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_templates_updated_at') THEN
    CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_alert_rules_updated_at') THEN
    CREATE TRIGGER update_notification_alert_rules_updated_at BEFORE UPDATE ON notification_alert_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_recipients_updated_at') THEN
    CREATE TRIGGER update_notification_recipients_updated_at BEFORE UPDATE ON notification_recipients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_dispatches_updated_at') THEN
    CREATE TRIGGER update_notification_dispatches_updated_at BEFORE UPDATE ON notification_dispatches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_delivery_stats_updated_at') THEN
    CREATE TRIGGER update_notification_delivery_stats_updated_at BEFORE UPDATE ON notification_delivery_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- ── 8. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_channels_ca ON notification_channels(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_templates_ca ON notification_templates(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notif_rules_ca ON notification_alert_rules(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_rules_event ON notification_alert_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_ca ON notification_recipients(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_email ON notification_recipients(email);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_phone ON notification_recipients(phone);
CREATE INDEX IF NOT EXISTS idx_notif_dispatches_ca ON notification_dispatches(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_dispatches_status ON notification_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_notif_dispatches_created ON notification_dispatches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_stats_ca_date ON notification_delivery_stats(ca_user_id, stat_date DESC);

-- ── 9. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_stats ENABLE ROW LEVEL SECURITY;

-- Channels
CREATE POLICY "CAs manage own notification channels"
ON notification_channels FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Templates
CREATE POLICY "CAs manage own notification templates"
ON notification_templates FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Alert Rules
CREATE POLICY "CAs manage own alert rules"
ON notification_alert_rules FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Recipients
CREATE POLICY "CAs manage own notification recipients"
ON notification_recipients FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Dispatches
CREATE POLICY "CAs can view own dispatches"
ON notification_dispatches FOR SELECT TO authenticated
USING (ca_user_id = auth.uid());

CREATE POLICY "CAs can insert dispatches"
ON notification_dispatches FOR INSERT TO authenticated
WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "CAs can update own dispatches"
ON notification_dispatches FOR UPDATE TO authenticated
USING (ca_user_id = auth.uid());

-- Stats
CREATE POLICY "CAs can manage own delivery stats"
ON notification_delivery_stats FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
