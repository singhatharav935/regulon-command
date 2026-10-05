-- Migration: Audit Trail & Compliance Reporting
-- Created: 2026-05-29
-- Description: Immutable audit log across all modules, compliance score computation,
--              regulatory-ready PDF/Excel reports (SOC-style), board summaries, data retention.

-- ── 1. audit_trail_events ─────────────────────────────────────────────────────
-- Append-only immutable log — NO UPDATE allowed (enforced via RLS)
CREATE TABLE IF NOT EXISTS audit_trail_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,  -- stable external ID
    -- Actor
    actor_type TEXT NOT NULL CHECK (actor_type IN ('ca_user', 'team_member', 'client', 'system', 'api')),
    actor_id TEXT NOT NULL,     -- user UUID or API key ID or 'system'
    actor_name TEXT NOT NULL,
    actor_ip TEXT,
    actor_user_agent TEXT,
    -- Action
    module TEXT NOT NULL CHECK (module IN (
        'multi-entity', 'e-filing', 'payment', 'calendar', 'regulatory-version',
        'enterprise-api', 'erp-integration', 'doc-ocr', 'team-rbac',
        'notifications', 'audit-trail', 'clients', 'billing', 'auth', 'system'
    )),
    action TEXT NOT NULL,        -- e.g. 'create', 'update', 'delete', 'view', 'export', 'login', 'logout'
    resource_type TEXT NOT NULL, -- e.g. 'entity', 'filing', 'document', 'member'
    resource_id TEXT,            -- UUID of affected resource
    resource_name TEXT,          -- human-readable label
    -- Payload
    old_value JSONB,             -- previous state (for updates/deletes)
    new_value JSONB,             -- new state (for creates/updates)
    diff JSONB,                  -- computed diff for updates
    metadata JSONB DEFAULT '{}',
    -- Risk & Classification
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    is_sensitive BOOLEAN DEFAULT false, -- PII or financial data involved
    -- Integrity
    hash TEXT,                   -- SHA-256 of (event_id + actor_id + action + resource_id + created_at)
    previous_hash TEXT,          -- for chain-of-custody verification
    -- Timestamp (NO updated_at — immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. compliance_scores ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id TEXT,              -- company / client reference
    entity_name TEXT NOT NULL,
    score_date DATE NOT NULL,
    -- Module-wise scores (0–100)
    gst_score INTEGER DEFAULT 0 CHECK (gst_score BETWEEN 0 AND 100),
    itr_score INTEGER DEFAULT 0 CHECK (itr_score BETWEEN 0 AND 100),
    tds_score INTEGER DEFAULT 0 CHECK (tds_score BETWEEN 0 AND 100),
    mca_score INTEGER DEFAULT 0 CHECK (mca_score BETWEEN 0 AND 100),
    rbi_score INTEGER DEFAULT 0 CHECK (rbi_score BETWEEN 0 AND 100),
    sebi_score INTEGER DEFAULT 0 CHECK (sebi_score BETWEEN 0 AND 100),
    overall_score INTEGER GENERATED ALWAYS AS (
        (gst_score + itr_score + tds_score + mca_score + rbi_score + sebi_score) / 6
    ) STORED,
    -- Risk flags
    pending_filings INTEGER DEFAULT 0,
    overdue_filings INTEGER DEFAULT 0,
    pending_payments INTEGER DEFAULT 0,
    open_notices INTEGER DEFAULT 0,
    unresolved_queries INTEGER DEFAULT 0,
    -- Trend
    previous_score INTEGER,
    score_delta INTEGER GENERATED ALWAYS AS (
        (gst_score + itr_score + tds_score + mca_score + rbi_score + sebi_score) / 6 - COALESCE(previous_score, 0)
    ) STORED,
    notes TEXT,
    computed_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ca_user_id, entity_id, score_date)
);

-- ── 3. compliance_reports ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'soc_audit', 'board_summary', 'regulatory_submission', 'client_health',
        'annual_compliance', 'quarterly_review', 'incident_report', 'custom'
    )),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    entity_scope JSONB DEFAULT '[]',      -- list of entity IDs included
    modules_included TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'shared', 'archived')),
    format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
    -- Content
    summary_data JSONB DEFAULT '{}',      -- aggregated KPIs, risk ratings
    findings JSONB DEFAULT '[]',          -- list of {finding, severity, recommendation}
    recommendations JSONB DEFAULT '[]',
    -- File storage (Supabase Storage URL)
    file_url TEXT,
    file_size_bytes INTEGER DEFAULT 0,
    -- Sharing
    shared_with TEXT[] DEFAULT '{}',      -- email addresses
    is_confidential BOOLEAN DEFAULT false,
    -- Metadata
    generated_by TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. data_retention_policies ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    retention_days INTEGER NOT NULL DEFAULT 2555, -- 7 years default (Indian IT Act)
    auto_archive BOOLEAN DEFAULT true,
    auto_delete_after_days INTEGER,               -- NULL = never auto-delete
    legal_basis TEXT DEFAULT 'IT Act 2000 / Companies Act 2013 — mandatory 7-year retention',
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    records_archived INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ca_user_id, module)
);

-- ── 5. audit_alert_subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_name TEXT NOT NULL,
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    -- e.g. {"severity": "critical", "module": "e-filing", "action": "delete"}
    notify_email TEXT[] DEFAULT '{}',
    notify_webhook TEXT,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. Triggers ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_compliance_scores_updated_at') THEN
    CREATE TRIGGER update_compliance_scores_updated_at BEFORE UPDATE ON compliance_scores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_compliance_reports_updated_at') THEN
    CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON compliance_reports FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_retention_policies_updated_at') THEN
    CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_audit_alert_subscriptions_updated_at') THEN
    CREATE TRIGGER update_audit_alert_subscriptions_updated_at BEFORE UPDATE ON audit_alert_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- ── 7. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_events_ca ON audit_trail_events(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_module ON audit_trail_events(module);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_trail_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_trail_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_trail_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_trail_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scores_ca ON compliance_scores(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scores_entity ON compliance_scores(entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_scores_date ON compliance_scores(score_date DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_ca ON compliance_reports(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_retention_policies_ca ON data_retention_policies(ca_user_id);

-- ── 8. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE audit_trail_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Audit Trail — READ ONLY (immutable — no UPDATE/DELETE allowed via RLS)
CREATE POLICY "CAs can view own audit events"
ON audit_trail_events FOR SELECT TO authenticated USING (ca_user_id = auth.uid());

CREATE POLICY "CAs can insert audit events"
ON audit_trail_events FOR INSERT TO authenticated WITH CHECK (ca_user_id = auth.uid());
-- NOTE: No UPDATE or DELETE policy — this enforces immutability at DB level

-- Compliance Scores
CREATE POLICY "CAs manage own compliance scores"
ON compliance_scores FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Compliance Reports
CREATE POLICY "CAs manage own compliance reports"
ON compliance_reports FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Data Retention Policies
CREATE POLICY "CAs manage own retention policies"
ON data_retention_policies FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- Audit Alert Subscriptions
CREATE POLICY "CAs manage own audit alert subscriptions"
ON audit_alert_subscriptions FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- ── 9. Seed default retention policies via function ───────────────────────────
CREATE OR REPLACE FUNCTION bootstrap_retention_policies(ca_id UUID)
RETURNS VOID AS $$
DECLARE
  modules TEXT[] := ARRAY[
    'multi-entity', 'e-filing', 'payment', 'calendar', 'regulatory-version',
    'enterprise-api', 'erp-integration', 'doc-ocr', 'team-rbac', 'notifications', 'audit-trail'
  ];
  m TEXT;
BEGIN
  FOREACH m IN ARRAY modules LOOP
    INSERT INTO data_retention_policies (ca_user_id, module, retention_days, auto_archive, legal_basis)
    VALUES (ca_id, m, 2555, true, 'IT Act 2000 / Companies Act 2013 — mandatory 7-year retention')
    ON CONFLICT (ca_user_id, module) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
