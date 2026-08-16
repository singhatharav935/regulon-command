-- ============================================================
-- Multi-Entity & Consolidated Reporting
-- Migration: 20260528000000
-- Purpose: Full multi-entity management, group hierarchy,
--          consolidated reports, and compliance snapshots for CAs
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Utility: updated_at trigger (create once, reuse)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Table 1: entities
-- Core registry of all client entities managed by a CA
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entities (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id           UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  entity_name          TEXT NOT NULL,
  entity_type          TEXT NOT NULL DEFAULT 'company'
                         CHECK (entity_type IN (
                           'company','llp','partnership','proprietorship',
                           'trust','huf','aop','society'
                         )),

  pan                  VARCHAR(10),
  cin                  VARCHAR(21),
  gstin                VARCHAR(15),
  tan                  VARCHAR(10),

  incorporation_date   DATE,
  financial_year_end   VARCHAR(5) DEFAULT '03-31',   -- MM-DD format

  industry             TEXT,
  turnover_bracket     TEXT
                         CHECK (turnover_bracket IN (
                           'below_1cr','1cr_5cr','5cr_10cr',
                           '10cr_50cr','50cr_250cr','above_250cr'
                         )),

  entity_status        TEXT NOT NULL DEFAULT 'active'
                         CHECK (entity_status IN (
                           'active','dormant','strike_off_pending','dissolved'
                         )),

  metadata             JSONB NOT NULL DEFAULT '{}',

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT entities_ca_pan_unique UNIQUE (ca_user_id, pan)
);

CREATE INDEX IF NOT EXISTS idx_entities_ca_user_id  ON public.entities (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_entities_company_id  ON public.entities (company_id);
CREATE INDEX IF NOT EXISTS idx_entities_entity_type ON public.entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_status      ON public.entities (entity_status);

CREATE OR REPLACE TRIGGER trg_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY entities_ca_select ON public.entities
  FOR SELECT USING (ca_user_id = auth.uid());

CREATE POLICY entities_ca_insert ON public.entities
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY entities_ca_update ON public.entities
  FOR UPDATE USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY entities_ca_delete ON public.entities
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 2: entity_groups
-- Named groups of entities (holding co, family group, etc.)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_groups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  group_name        TEXT NOT NULL,
  group_type        TEXT NOT NULL DEFAULT 'custom'
                      CHECK (group_type IN (
                        'holding_subsidiary','family_group','custom','industry_cluster'
                      )),

  parent_entity_id  UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  description       TEXT,
  color_tag         VARCHAR(7) DEFAULT '#06b6d4',   -- hex colour for UI

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_groups_ca_user ON public.entity_groups (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_entity_groups_parent  ON public.entity_groups (parent_entity_id);

CREATE OR REPLACE TRIGGER trg_entity_groups_updated_at
  BEFORE UPDATE ON public.entity_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.entity_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY entity_groups_ca_select ON public.entity_groups
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY entity_groups_ca_insert ON public.entity_groups
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY entity_groups_ca_update ON public.entity_groups
  FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY entity_groups_ca_delete ON public.entity_groups
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 3: entity_group_members
-- M:N join between entities and groups
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_group_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL REFERENCES public.entity_groups(id) ON DELETE CASCADE,
  entity_id         UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,

  role_in_group     TEXT NOT NULL DEFAULT 'member'
                      CHECK (role_in_group IN ('parent','subsidiary','associate','member')),

  ownership_percent NUMERIC(5,2) CHECK (ownership_percent BETWEEN 0 AND 100),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT entity_group_members_unique UNIQUE (group_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_egm_group_id  ON public.entity_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_egm_entity_id ON public.entity_group_members (entity_id);

ALTER TABLE public.entity_group_members ENABLE ROW LEVEL SECURITY;

-- Members inherit the CA's ownership of the group
CREATE POLICY egm_select ON public.entity_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entity_groups g
      WHERE g.id = entity_group_members.group_id
        AND g.ca_user_id = auth.uid()
    )
  );
CREATE POLICY egm_insert ON public.entity_group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entity_groups g
      WHERE g.id = entity_group_members.group_id
        AND g.ca_user_id = auth.uid()
    )
  );
CREATE POLICY egm_delete ON public.entity_group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.entity_groups g
      WHERE g.id = entity_group_members.group_id
        AND g.ca_user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Table 4: consolidated_reports
-- AI-generated consolidated reports for groups
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consolidated_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id        UUID REFERENCES public.entity_groups(id) ON DELETE SET NULL,

  report_type     TEXT NOT NULL
                    CHECK (report_type IN (
                      'gst_summary','itr_summary','tds_summary',
                      'compliance_scorecard','consolidated_balance_sheet',
                      'inter_company_reconciliation','deadline_matrix','risk_heatmap'
                    )),

  report_title    TEXT NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,

  generated_data  JSONB NOT NULL DEFAULT '{}',

  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','finalized','shared','archived')),

  shared_with     JSONB NOT NULL DEFAULT '[]',
  pdf_url         TEXT,

  entity_count    INT NOT NULL DEFAULT 0,
  ai_insights     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consol_reports_ca    ON public.consolidated_reports (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_consol_reports_group ON public.consolidated_reports (group_id);
CREATE INDEX IF NOT EXISTS idx_consol_reports_type  ON public.consolidated_reports (report_type);
CREATE INDEX IF NOT EXISTS idx_consol_reports_date  ON public.consolidated_reports (created_at DESC);

CREATE OR REPLACE TRIGGER trg_consol_reports_updated_at
  BEFORE UPDATE ON public.consolidated_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.consolidated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY consol_reports_ca_select ON public.consolidated_reports
  FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY consol_reports_ca_insert ON public.consolidated_reports
  FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY consol_reports_ca_update ON public.consolidated_reports
  FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY consol_reports_ca_delete ON public.consolidated_reports
  FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 5: entity_compliance_snapshot
-- Point-in-time compliance health per entity per day
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entity_compliance_snapshot (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id              UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,

  snapshot_date          DATE NOT NULL DEFAULT CURRENT_DATE,

  gst_status             JSONB NOT NULL DEFAULT '{}',
  itr_status             JSONB NOT NULL DEFAULT '{}',
  tds_status             JSONB NOT NULL DEFAULT '{}',
  mca_status             JSONB NOT NULL DEFAULT '{}',
  roc_status             JSONB NOT NULL DEFAULT '{}',

  overall_health_score   NUMERIC(5,2) CHECK (overall_health_score BETWEEN 0 AND 100),
  pending_tasks_count    INT NOT NULL DEFAULT 0,
  overdue_tasks_count    INT NOT NULL DEFAULT 0,

  upcoming_deadlines     JSONB NOT NULL DEFAULT '[]',

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ecs_entity_date_unique UNIQUE (entity_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_ecs_entity_id     ON public.entity_compliance_snapshot (entity_id);
CREATE INDEX IF NOT EXISTS idx_ecs_snapshot_date ON public.entity_compliance_snapshot (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ecs_health_score  ON public.entity_compliance_snapshot (overall_health_score);

ALTER TABLE public.entity_compliance_snapshot ENABLE ROW LEVEL SECURITY;

-- Snapshots are readable if the entity belongs to the CA
CREATE POLICY ecs_select ON public.entity_compliance_snapshot
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_compliance_snapshot.entity_id
        AND e.ca_user_id = auth.uid()
    )
  );
CREATE POLICY ecs_insert ON public.entity_compliance_snapshot
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_compliance_snapshot.entity_id
        AND e.ca_user_id = auth.uid()
    )
  );
CREATE POLICY ecs_update ON public.entity_compliance_snapshot
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_compliance_snapshot.entity_id
        AND e.ca_user_id = auth.uid()
    )
  );
CREATE POLICY ecs_delete ON public.entity_compliance_snapshot
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_compliance_snapshot.entity_id
        AND e.ca_user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- Helper Function: Get group compliance summary
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_group_compliance_summary(p_group_id UUID)
RETURNS TABLE (
  entity_id              UUID,
  entity_name            TEXT,
  entity_type            TEXT,
  overall_health_score   NUMERIC,
  pending_tasks_count    INT,
  overdue_tasks_count    INT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    e.id,
    e.entity_name,
    e.entity_type,
    COALESCE(s.overall_health_score, 0),
    COALESCE(s.pending_tasks_count, 0),
    COALESCE(s.overdue_tasks_count, 0)
  FROM public.entity_group_members m
  JOIN public.entities e ON e.id = m.entity_id
  LEFT JOIN LATERAL (
    SELECT overall_health_score, pending_tasks_count, overdue_tasks_count
    FROM public.entity_compliance_snapshot
    WHERE entity_id = e.id
    ORDER BY snapshot_date DESC
    LIMIT 1
  ) s ON true
  WHERE m.group_id = p_group_id
    AND e.ca_user_id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- Grant public schema usage to service_role (already default)
-- ────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL   ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL   ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
