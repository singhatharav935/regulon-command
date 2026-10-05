-- ============================================================
-- Calendar & Deadline Management — Gap 4
-- Migration: 20260528300000
-- Purpose: Global compliance calendar, SLA timers, escalation
--          alerts (SMS/WhatsApp/Email), recurring deadline
--          templates, reminder scheduling
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.calendar_event_type AS ENUM (
    'gst_return','itr_filing','tds_deposit','tds_return',
    'advance_tax','mca_filing','roc_filing','rbi_filing',
    'sebi_filing','epf_deposit','esic_deposit',
    'professional_tax','audit_due','agm','board_meeting',
    'compliance_review','custom','tax_payment','notice_response',
    'statutory_hearing','assessment','reassessment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deadline_priority AS ENUM (
    'critical','high','medium','low'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deadline_status AS ENUM (
    'upcoming','active','due_today','overdue',
    'completed','cancelled','extended','waived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.escalation_channel AS ENUM (
    'email','sms','whatsapp','in_app','slack','all'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.recurrence_pattern AS ENUM (
    'daily','weekly','biweekly','monthly','quarterly',
    'half_yearly','yearly','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- Table 1: compliance_calendar_events
-- Master table for all calendar events & deadlines
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compliance_calendar_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id           UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  company_id          UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- Event details
  title               TEXT NOT NULL,
  description         TEXT,
  event_type          public.calendar_event_type NOT NULL,
  regulator           TEXT NOT NULL DEFAULT 'Other'
                        CHECK (regulator IN (
                          'CBIC','CBDT','MCA','RBI','SEBI','EPFO','ESIC',
                          'ROC','IRDAI','FSSAI','DGFT','Labour','Custom','Other'
                        )),

  -- Timing
  due_date            DATE NOT NULL,
  due_time            TIME,                     -- optional time component
  start_date          DATE,                     -- for events spanning a range
  all_day             BOOLEAN NOT NULL DEFAULT TRUE,

  -- Priority & Status
  priority            public.deadline_priority NOT NULL DEFAULT 'medium',
  status              public.deadline_status NOT NULL DEFAULT 'upcoming',

  -- SLA configuration
  sla_hours           INTEGER,                  -- max hours allowed to complete
  sla_started_at      TIMESTAMPTZ,
  sla_breached        BOOLEAN NOT NULL DEFAULT FALSE,
  sla_completed_at    TIMESTAMPTZ,

  -- Penalty info
  penalty_per_day_paise  BIGINT DEFAULT 0,      -- late fee per day
  max_penalty_paise      BIGINT DEFAULT 0,
  penalty_section        TEXT,                   -- e.g. "Section 234F"

  -- Recurrence
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern  public.recurrence_pattern,
  recurrence_day      INTEGER,                  -- day of month (1-31)
  recurrence_month    INTEGER,                  -- month of year (1-12) for yearly
  recurrence_end_date DATE,
  parent_event_id     UUID REFERENCES public.compliance_calendar_events(id) ON DELETE SET NULL,

  -- Linking
  linked_liability_id UUID REFERENCES public.tax_liability_heads(id) ON DELETE SET NULL,
  linked_filing_job_id UUID REFERENCES public.efiling_jobs(id) ON DELETE SET NULL,
  linked_task_id      UUID REFERENCES public.compliance_tasks(id) ON DELETE SET NULL,

  -- Metadata
  color_tag           VARCHAR(7) DEFAULT '#3B82F6',  -- hex color for calendar UI
  tags                TEXT[] DEFAULT '{}',
  notes               TEXT,
  attachments         JSONB DEFAULT '[]',

  -- Completion
  completed_at        TIMESTAMPTZ,
  completed_by        UUID REFERENCES auth.users(id),
  completion_notes    TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cce_entity_or_company CHECK (entity_id IS NOT NULL OR company_id IS NOT NULL OR event_type = 'custom')
);

CREATE INDEX IF NOT EXISTS idx_cce_ca        ON public.compliance_calendar_events (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_cce_entity    ON public.compliance_calendar_events (entity_id);
CREATE INDEX IF NOT EXISTS idx_cce_company   ON public.compliance_calendar_events (company_id);
CREATE INDEX IF NOT EXISTS idx_cce_due       ON public.compliance_calendar_events (due_date);
CREATE INDEX IF NOT EXISTS idx_cce_status    ON public.compliance_calendar_events (status);
CREATE INDEX IF NOT EXISTS idx_cce_priority  ON public.compliance_calendar_events (priority);
CREATE INDEX IF NOT EXISTS idx_cce_type      ON public.compliance_calendar_events (event_type);
CREATE INDEX IF NOT EXISTS idx_cce_recurring ON public.compliance_calendar_events (is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_cce_parent    ON public.compliance_calendar_events (parent_event_id) WHERE parent_event_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_cce_updated_at
  BEFORE UPDATE ON public.compliance_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.compliance_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY cce_select ON public.compliance_calendar_events FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY cce_insert ON public.compliance_calendar_events FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY cce_update ON public.compliance_calendar_events FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY cce_delete ON public.compliance_calendar_events FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 2: deadline_reminders
-- Scheduled alerts for upcoming deadlines
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deadline_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.compliance_calendar_events(id) ON DELETE CASCADE,

  -- When to fire
  remind_at       TIMESTAMPTZ NOT NULL,
  days_before     INTEGER NOT NULL DEFAULT 3,   -- convenience: how many days before due_date

  -- Channel
  channel         public.escalation_channel NOT NULL DEFAULT 'in_app',
  recipients      JSONB NOT NULL DEFAULT '[]',  -- [{email, phone, name}]

  -- Message
  subject         TEXT NOT NULL,
  message_body    TEXT NOT NULL,

  -- Delivery
  is_sent         BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,
  delivery_status JSONB DEFAULT '{}',
  failure_reason  TEXT,

  -- Snooze
  is_snoozed      BOOLEAN NOT NULL DEFAULT FALSE,
  snoozed_until   TIMESTAMPTZ,
  snooze_count    INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_ca        ON public.deadline_reminders (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_dr_event     ON public.deadline_reminders (event_id);
CREATE INDEX IF NOT EXISTS idx_dr_remind    ON public.deadline_reminders (remind_at);
CREATE INDEX IF NOT EXISTS idx_dr_sent      ON public.deadline_reminders (is_sent);

CREATE OR REPLACE TRIGGER trg_dr_updated_at
  BEFORE UPDATE ON public.deadline_reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY dr_select ON public.deadline_reminders FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY dr_insert ON public.deadline_reminders FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY dr_update ON public.deadline_reminders FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY dr_delete ON public.deadline_reminders FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 3: escalation_rules
-- Define escalation chains for missed deadlines
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rule_name       TEXT NOT NULL,
  description     TEXT,

  -- Trigger conditions
  trigger_type    TEXT NOT NULL DEFAULT 'days_before_due'
                    CHECK (trigger_type IN (
                      'days_before_due','days_after_due','sla_breach',
                      'status_change','priority_change','custom'
                    )),
  trigger_value   INTEGER NOT NULL DEFAULT 3,   -- e.g. 3 days before due

  -- Who to notify
  channel         public.escalation_channel NOT NULL DEFAULT 'email',
  recipients      JSONB NOT NULL DEFAULT '[]',
  cc_recipients   JSONB DEFAULT '[]',

  -- Message template
  subject_template TEXT NOT NULL,
  body_template    TEXT NOT NULL,

  -- Scope
  applies_to_types public.calendar_event_type[] DEFAULT '{}',
  applies_to_priorities public.deadline_priority[] DEFAULT '{}',
  applies_to_regulators TEXT[] DEFAULT '{}',
  entity_id       UUID REFERENCES public.entities(id) ON DELETE CASCADE,

  -- State
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count   INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_er_ca     ON public.escalation_rules (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_er_active ON public.escalation_rules (is_active) WHERE is_active = TRUE;

CREATE OR REPLACE TRIGGER trg_er_updated_at
  BEFORE UPDATE ON public.escalation_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY er_select ON public.escalation_rules FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY er_insert ON public.escalation_rules FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY er_update ON public.escalation_rules FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY er_delete ON public.escalation_rules FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 4: escalation_logs
-- Immutable log of every escalation fired
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escalation_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id         UUID REFERENCES public.escalation_rules(id) ON DELETE SET NULL,
  event_id        UUID REFERENCES public.compliance_calendar_events(id) ON DELETE SET NULL,

  -- What happened
  channel         public.escalation_channel NOT NULL,
  recipients      JSONB NOT NULL DEFAULT '[]',
  subject         TEXT NOT NULL,
  message_body    TEXT NOT NULL,

  -- Result
  delivery_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (delivery_status IN ('pending','sent','delivered','failed','bounced')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,

  -- Context
  trigger_reason  TEXT NOT NULL,
  event_snapshot  JSONB DEFAULT '{}',   -- snapshot of event at escalation time

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_el_ca     ON public.escalation_logs (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_el_event  ON public.escalation_logs (event_id);
CREATE INDEX IF NOT EXISTS idx_el_rule   ON public.escalation_logs (rule_id);
CREATE INDEX IF NOT EXISTS idx_el_time   ON public.escalation_logs (created_at DESC);

ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY el_select ON public.escalation_logs FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY el_insert ON public.escalation_logs FOR INSERT WITH CHECK (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 5: recurring_deadline_templates
-- Pre-defined Indian statutory deadlines that auto-generate events
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recurring_deadline_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  template_name   TEXT NOT NULL,
  event_type      public.calendar_event_type NOT NULL,
  regulator       TEXT NOT NULL,
  description     TEXT,

  -- Recurrence
  recurrence      public.recurrence_pattern NOT NULL DEFAULT 'monthly',
  day_of_month    INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  month_of_year   INTEGER CHECK (month_of_year >= 1 AND month_of_year <= 12),

  -- Defaults
  default_priority  public.deadline_priority NOT NULL DEFAULT 'high',
  default_sla_hours INTEGER,
  penalty_per_day_paise BIGINT DEFAULT 0,
  max_penalty_paise     BIGINT DEFAULT 0,
  penalty_section       TEXT,
  color_tag       VARCHAR(7) DEFAULT '#3B82F6',

  -- Auto-remind config
  auto_remind_days INTEGER[] DEFAULT '{7,3,1}',
  remind_channels  public.escalation_channel[] DEFAULT '{in_app}',

  -- State
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated  DATE,
  generate_months_ahead INTEGER NOT NULL DEFAULT 3,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rdt_ca     ON public.recurring_deadline_templates (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_rdt_active ON public.recurring_deadline_templates (is_active) WHERE is_active = TRUE;

CREATE OR REPLACE TRIGGER trg_rdt_updated_at
  BEFORE UPDATE ON public.recurring_deadline_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.recurring_deadline_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY rdt_select ON public.recurring_deadline_templates FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY rdt_insert ON public.recurring_deadline_templates FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY rdt_update ON public.recurring_deadline_templates FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY rdt_delete ON public.recurring_deadline_templates FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Table 6: deadline_sla_timers
-- Track SLA countdowns per event
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deadline_sla_timers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.compliance_calendar_events(id) ON DELETE CASCADE,

  -- SLA definition
  sla_name        TEXT NOT NULL,
  total_hours     INTEGER NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at       TIMESTAMPTZ,
  elapsed_hours   NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Status
  is_running      BOOLEAN NOT NULL DEFAULT TRUE,
  is_breached     BOOLEAN NOT NULL DEFAULT FALSE,
  breached_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  -- Escalation on breach
  breach_escalation_rule_id UUID REFERENCES public.escalation_rules(id) ON DELETE SET NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sla_ca     ON public.deadline_sla_timers (ca_user_id);
CREATE INDEX IF NOT EXISTS idx_sla_event  ON public.deadline_sla_timers (event_id);
CREATE INDEX IF NOT EXISTS idx_sla_run    ON public.deadline_sla_timers (is_running) WHERE is_running = TRUE;

CREATE OR REPLACE TRIGGER trg_sla_updated_at
  BEFORE UPDATE ON public.deadline_sla_timers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.deadline_sla_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY sla_select ON public.deadline_sla_timers FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY sla_insert ON public.deadline_sla_timers FOR INSERT WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY sla_update ON public.deadline_sla_timers FOR UPDATE USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE POLICY sla_delete ON public.deadline_sla_timers FOR DELETE USING (ca_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Auto-update event status based on date
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_update_event_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Skip if already completed or cancelled
  IF NEW.status IN ('completed','cancelled','waived','extended') THEN
    RETURN NEW;
  END IF;

  -- Auto-set status based on due_date vs today
  IF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  ELSIF NEW.due_date = CURRENT_DATE THEN
    NEW.status := 'due_today';
  ELSIF NEW.due_date <= CURRENT_DATE + 3 THEN
    NEW.status := 'active';
  ELSE
    NEW.status := 'upcoming';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_auto_event_status
  BEFORE INSERT OR UPDATE OF due_date ON public.compliance_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_event_status();

-- ────────────────────────────────────────────────────────────
-- Auto-create reminders when an event is created
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_create_deadline_reminders()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  remind_days INTEGER[] := ARRAY[7, 3, 1, 0];
  d INTEGER;
  remind_ts TIMESTAMPTZ;
BEGIN
  FOREACH d IN ARRAY remind_days LOOP
    remind_ts := (NEW.due_date - d * INTERVAL '1 day')::TIMESTAMPTZ + INTERVAL '9 hours';
    -- Only create if in the future
    IF remind_ts > now() THEN
      INSERT INTO public.deadline_reminders (
        ca_user_id, event_id, remind_at, days_before, channel,
        subject, message_body
      ) VALUES (
        NEW.ca_user_id, NEW.id, remind_ts, d, 'in_app',
        CASE
          WHEN d = 0 THEN '🚨 DUE TODAY: ' || NEW.title
          WHEN d = 1 THEN '⚠️ Due Tomorrow: ' || NEW.title
          WHEN d = 3 THEN '📋 Due in 3 Days: ' || NEW.title
          ELSE '📅 Upcoming: ' || NEW.title
        END,
        'Compliance deadline "' || NEW.title || '" is due on ' ||
          TO_CHAR(NEW.due_date, 'DD Mon YYYY') || '. ' ||
          CASE
            WHEN d = 0 THEN 'Action required immediately!'
            WHEN d = 1 THEN 'Please complete before tomorrow.'
            WHEN d = 3 THEN 'Please start preparing.'
            ELSE 'This is an advance reminder.'
          END
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_auto_create_reminders
  AFTER INSERT ON public.compliance_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_deadline_reminders();

-- ────────────────────────────────────────────────────────────
-- View: calendar_dashboard_summary
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.calendar_dashboard_summary AS
SELECT
  e.ca_user_id,
  COUNT(*)                                                           AS total_events,
  COUNT(*) FILTER (WHERE e.status = 'upcoming')                     AS upcoming_count,
  COUNT(*) FILTER (WHERE e.status = 'active')                       AS active_count,
  COUNT(*) FILTER (WHERE e.status = 'due_today')                    AS due_today_count,
  COUNT(*) FILTER (WHERE e.status = 'overdue')                      AS overdue_count,
  COUNT(*) FILTER (WHERE e.status = 'completed')                    AS completed_count,
  COUNT(*) FILTER (WHERE e.priority = 'critical' AND e.status NOT IN ('completed','cancelled')) AS critical_pending,
  COUNT(*) FILTER (WHERE e.sla_breached)                            AS sla_breached_count,
  COUNT(*) FILTER (WHERE e.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
                         AND e.status NOT IN ('completed','cancelled')) AS due_this_week,
  COUNT(*) FILTER (WHERE e.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
                         AND e.status NOT IN ('completed','cancelled')) AS due_this_month,
  MIN(e.due_date) FILTER (WHERE e.status NOT IN ('completed','cancelled','waived')
                                AND e.due_date >= CURRENT_DATE)      AS next_due_date
FROM public.compliance_calendar_events e
GROUP BY e.ca_user_id;

GRANT SELECT ON public.calendar_dashboard_summary TO authenticated;

-- ────────────────────────────────────────────────────────────
-- View: upcoming_deadlines_detailed
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.upcoming_deadlines_detailed AS
SELECT
  e.*,
  ent.entity_name,
  ent.entity_type,
  ent.pan,
  ent.gstin,
  (e.due_date - CURRENT_DATE) AS days_remaining,
  COALESCE(
    (SELECT COUNT(*) FROM public.deadline_reminders r WHERE r.event_id = e.id AND r.is_sent),
    0
  ) AS reminders_sent,
  COALESCE(
    (SELECT COUNT(*) FROM public.escalation_logs l WHERE l.event_id = e.id),
    0
  ) AS escalations_fired
FROM public.compliance_calendar_events e
LEFT JOIN public.entities ent ON ent.id = e.entity_id
WHERE e.status NOT IN ('completed','cancelled','waived')
  AND e.due_date >= CURRENT_DATE - 7
ORDER BY e.due_date ASC, e.priority DESC;

GRANT SELECT ON public.upcoming_deadlines_detailed TO authenticated;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
