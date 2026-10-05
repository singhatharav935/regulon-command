-- ╔═══════════════════════════════════════════════════════════╗
-- ║  REGULON SCHEMA FIX — Drop simplified tables, rebuild   ║
-- ║  with full column definitions from original migrations   ║
-- ║  Generated: 2026-05-31                                   ║
-- ║                                                           ║
-- ║  This script DROPS all public tables and rebuilds them    ║
-- ║  with the FULL schemas from the original migration files. ║
-- ╚═══════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════
-- PHASE 0: DROP EVERYTHING IN PUBLIC (clean slate again)
-- ═══════════════════════════════════════════════════════════

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
  END LOOP;
END $$;

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('schema_migrations')) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT t.typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
    EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
-- PHASE 1: HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ═══════════════════════════════════════════════════════════
-- PHASE 2: ENUM TYPES (from 20260124)
-- ═══════════════════════════════════════════════════════════
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE public.regulatory_status AS ENUM ('active', 'not_applicable', 'potential', 'evaluated');
CREATE TYPE public.task_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'under_review', 'completed', 'overdue');
CREATE TYPE public.document_status AS ENUM ('approved', 'submitted', 'under_review', 'draft');

-- ═══════════════════════════════════════════════════════════
-- PHASE 3: FOUNDATION (from 20260124)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT, email TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, industry TEXT,
  compliance_health INTEGER DEFAULT 85 CHECK (compliance_health >= 0 AND compliance_health <= 100),
  logo_url TEXT, gstin TEXT, pan TEXT, cin TEXT, tan TEXT, registration_number TEXT,
  entity_type TEXT, date_of_incorporation DATE, registered_address TEXT,
  city TEXT, state TEXT, pincode TEXT, country TEXT DEFAULT 'India',
  phone TEXT, email TEXT, website TEXT, status TEXT DEFAULT 'active',
  financial_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE TABLE public.regulatory_exposure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  regulator TEXT NOT NULL, status public.regulatory_status NOT NULL DEFAULT 'potential',
  notes TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, regulator)
);

CREATE TABLE public.compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, description TEXT, regulator TEXT NOT NULL,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  due_date DATE, assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, file_path TEXT, file_type TEXT,
  status public.document_status NOT NULL DEFAULT 'draft', regulator TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, regulator TEXT NOT NULL, due_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')), content TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE user_id = _user_id AND company_id = _company_id)
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ═══════════════════════════════════════════════════════════
-- PHASE 4: PERSONA SYSTEM (from 20260227, 20260330)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  persona TEXT NOT NULL DEFAULT 'startup_founder',
  is_active BOOLEAN DEFAULT TRUE, onboarding_completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL, company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_name, company_id)
);

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT, email TEXT, avatar_url TEXT, phone TEXT, designation TEXT, bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_workspace_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  workspace_type TEXT NOT NULL DEFAULT 'external_ca',
  display_name TEXT, firm_name TEXT, specializations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.has_persona(_user_id UUID, _persona TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_personas WHERE user_id = _user_id AND persona = _persona)
$$;

-- user_verifications — FULL schema from 20260227180000
CREATE TABLE public.user_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL DEFAULT 'company_owner',
  entity_name TEXT, registration_number TEXT, license_number TEXT,
  jurisdiction TEXT, document_path TEXT, notes TEXT,
  verification_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 5: ENTITIES (multi-entity system)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_name TEXT NOT NULL, entity_type TEXT DEFAULT 'company',
  pan TEXT, gstin TEXT, cin TEXT, tan TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.entity_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, group_name TEXT NOT NULL, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.entity_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.entity_groups(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, entity_id)
);

CREATE TABLE public.entity_compliance_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  snapshot_date DATE DEFAULT CURRENT_DATE, score INTEGER, breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consolidated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, report_name TEXT, report_type TEXT,
  entity_ids UUID[] DEFAULT '{}', content JSONB DEFAULT '{}', status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 6: CA DASHBOARD TABLES (full schemas)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.ca_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID, company_name TEXT NOT NULL DEFAULT '',
  gstin TEXT, pan TEXT, cin TEXT, contact_email TEXT, contact_phone TEXT, industry TEXT,
  compliance_health_score INTEGER DEFAULT 75, risk_level TEXT DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'active', onboarded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, ca_user_id UUID NOT NULL, client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT, client_phone TEXT, gstin TEXT, pan TEXT, cin TEXT, ca_name TEXT,
  consent_status TEXT NOT NULL DEFAULT 'pending', consent_token TEXT DEFAULT gen_random_uuid()::text,
  email_sent BOOLEAN DEFAULT FALSE, whatsapp_sent BOOLEAN DEFAULT FALSE, responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_govt_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, department TEXT DEFAULT '',
  notice_type TEXT DEFAULT '', notice_number TEXT, issue_date DATE, due_date DATE,
  financial_year TEXT, raw_text_content TEXT, ai_draft_response TEXT,
  status TEXT DEFAULT 'detected', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, document_name TEXT DEFAULT '',
  description TEXT, due_date DATE, status TEXT DEFAULT 'pending', urgency TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, ca_user_id UUID NOT NULL, type TEXT DEFAULT 'email',
  direction TEXT DEFAULT 'outbound', subject TEXT, content TEXT DEFAULT '',
  recipient TEXT, status TEXT DEFAULT 'sent', ai_agent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, ca_user_id UUID NOT NULL, task_name TEXT DEFAULT '',
  task_type TEXT, description TEXT, suggested_fee NUMERIC(12,2) DEFAULT 0,
  is_billed BOOLEAN DEFAULT FALSE, invoice_id UUID, completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_firm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, company_id UUID, invoice_number TEXT,
  invoice_date DATE DEFAULT CURRENT_DATE, due_date DATE,
  total_amount NUMERIC(14,2) DEFAULT 0, tax_amount NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(14,2) DEFAULT 0, payment_status TEXT DEFAULT 'draft',
  payment_received_date DATE, line_items JSONB DEFAULT '[]', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_financial_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT DEFAULT '',
  book_type TEXT DEFAULT '', book_data JSONB DEFAULT '{}', summary_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_module_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT DEFAULT '',
  module_id TEXT DEFAULT '', module_label TEXT DEFAULT '',
  calculation_data JSONB DEFAULT '{}', summary TEXT, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_notice_data_room (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT DEFAULT '',
  readiness_score INTEGER DEFAULT 0, total_modules_completed INTEGER DEFAULT 0,
  executive_summary TEXT, key_financials JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_trail_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID, event_type TEXT DEFAULT '',
  entity_type TEXT, entity_id UUID, action TEXT DEFAULT '',
  old_values JSONB, new_values JSONB, metadata JSONB DEFAULT '{}',
  ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID NOT NULL, score INTEGER DEFAULT 0,
  score_date DATE DEFAULT CURRENT_DATE, breakdown JSONB DEFAULT '{}', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID, report_name TEXT DEFAULT '',
  report_type TEXT DEFAULT '', period_from DATE, period_to DATE,
  content JSONB DEFAULT '{}', file_path TEXT, status TEXT DEFAULT 'draft',
  generated_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, policy_name TEXT DEFAULT '', entity_type TEXT DEFAULT '',
  retention_days INTEGER DEFAULT 2555, auto_delete BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, alert_type TEXT DEFAULT '', conditions JSONB DEFAULT '{}',
  channels JSONB DEFAULT '["email"]', is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, transaction_date DATE DEFAULT CURRENT_DATE,
  description TEXT DEFAULT '', debit_amount NUMERIC(14,2) DEFAULT 0,
  credit_amount NUMERIC(14,2) DEFAULT 0, balance NUMERIC(14,2),
  ai_category TEXT, manual_category TEXT, reference TEXT, bank_name TEXT, account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_statutory_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT DEFAULT '',
  input_type TEXT DEFAULT '', input_key TEXT DEFAULT '', input_value TEXT DEFAULT '', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, file_name TEXT DEFAULT '',
  file_path TEXT, file_size BIGINT, bank_name TEXT, account_number TEXT,
  statement_from DATE, statement_to DATE, parse_status TEXT DEFAULT 'pending',
  transaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.aa_consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, aa_handle TEXT,
  consent_purpose TEXT, date_range_from DATE, date_range_to DATE,
  status TEXT DEFAULT 'pending', consent_id TEXT, consent_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.draft_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID, notice_id UUID,
  document_type TEXT DEFAULT '', draft_mode TEXT DEFAULT 'ai',
  draft_content TEXT, status TEXT DEFAULT 'pending', ca_action TEXT,
  content_hash TEXT, worm_seal TEXT, metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lawyer_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID, draft_id UUID, notice_id UUID,
  request_type TEXT DEFAULT 'review', priority TEXT DEFAULT 'medium',
  description TEXT, draft_content TEXT, lawyer_notes TEXT,
  status TEXT DEFAULT 'pending', assigned_to UUID, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, score INTEGER DEFAULT 0,
  previous_score INTEGER, change_reason TEXT, changed_by TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CA Audit chain
CREATE TABLE public.ca_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_client_id UUID, company_id UUID,
  audit_type TEXT DEFAULT '', financial_year TEXT,
  status TEXT DEFAULT 'planned', start_date DATE, end_date DATE, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_audit_id UUID, ca_client_id UUID,
  title TEXT DEFAULT '', description TEXT, regulator TEXT, due_date DATE,
  status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_audit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_audit_id UUID, ca_client_id UUID,
  document_name TEXT DEFAULT '', document_type TEXT, file_path TEXT,
  file_size BIGINT, uploaded_by UUID, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_audit_id UUID, ca_client_id UUID,
  report_title TEXT DEFAULT '', report_type TEXT, content TEXT, file_path TEXT,
  status TEXT DEFAULT 'draft', issued_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CA Firm system
CREATE TABLE public.ca_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, registration_number TEXT NOT NULL, jurisdiction TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, user_id UUID NOT NULL, name TEXT, email TEXT,
  role TEXT DEFAULT 'associate', status TEXT DEFAULT 'active', joined_at TIMESTAMPTZ DEFAULT now(),
  ca_firm_id UUID, full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, company_id UUID, client_name TEXT DEFAULT '',
  gstin TEXT, pan TEXT, email TEXT, phone TEXT,
  status TEXT DEFAULT 'active', risk_level TEXT DEFAULT 'Medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, firm_member_id UUID, firm_client_id UUID NOT NULL,
  assignment_type TEXT, status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(), completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_firm_analytics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), firm_id UUID NOT NULL, metric_name TEXT, metric_value NUMERIC, period TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.ca_firm_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), firm_id UUID NOT NULL, document_name TEXT, document_type TEXT, file_path TEXT, uploaded_by UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.ca_firm_ca_directory (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_firm_id UUID, ca_user_id UUID, ca_name TEXT, license_number TEXT, specialty TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

-- ═══════════════════════════════════════════════════════════
-- PHASE 7: CALENDAR & DEADLINES (full from 20260528300000)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.compliance_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_id UUID, company_id UUID,
  title TEXT NOT NULL DEFAULT '', description TEXT,
  event_type TEXT NOT NULL DEFAULT 'custom', regulator TEXT NOT NULL DEFAULT 'Other',
  due_date DATE NOT NULL DEFAULT CURRENT_DATE, due_time TIME, start_date DATE,
  all_day BOOLEAN DEFAULT TRUE, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'upcoming',
  sla_hours INTEGER, sla_started_at TIMESTAMPTZ, sla_breached BOOLEAN DEFAULT FALSE,
  sla_completed_at TIMESTAMPTZ, penalty_per_day_paise BIGINT DEFAULT 0,
  max_penalty_paise BIGINT DEFAULT 0, penalty_section TEXT,
  is_recurring BOOLEAN DEFAULT FALSE, recurrence_pattern TEXT,
  recurrence_day INTEGER, recurrence_month INTEGER, recurrence_end_date DATE,
  parent_event_id UUID, linked_liability_id UUID, linked_filing_job_id UUID, linked_task_id UUID,
  color_tag VARCHAR(7) DEFAULT '#3B82F6', tags TEXT[] DEFAULT '{}',
  notes TEXT, attachments JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ, completed_by UUID, completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, event_id UUID, remind_at TIMESTAMPTZ DEFAULT now(),
  days_before INTEGER DEFAULT 3, channel TEXT DEFAULT 'in_app',
  recipients JSONB DEFAULT '[]', subject TEXT DEFAULT '', message_body TEXT DEFAULT '',
  is_sent BOOLEAN DEFAULT FALSE, sent_at TIMESTAMPTZ, delivery_status JSONB DEFAULT '{}',
  failure_reason TEXT, is_snoozed BOOLEAN DEFAULT FALSE, snoozed_until TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_name TEXT DEFAULT '', description TEXT,
  trigger_type TEXT DEFAULT 'days_before_due', trigger_value INTEGER DEFAULT 3,
  channel TEXT DEFAULT 'email', recipients JSONB DEFAULT '[]', cc_recipients JSONB DEFAULT '[]',
  subject_template TEXT DEFAULT '', body_template TEXT DEFAULT '',
  applies_to_types TEXT[] DEFAULT '{}', applies_to_priorities TEXT[] DEFAULT '{}',
  applies_to_regulators TEXT[] DEFAULT '{}', entity_id UUID,
  is_active BOOLEAN DEFAULT TRUE, last_triggered_at TIMESTAMPTZ, trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.escalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_id UUID, event_id UUID,
  channel TEXT DEFAULT 'email', recipients JSONB DEFAULT '[]',
  subject TEXT DEFAULT '', message_body TEXT DEFAULT '',
  delivery_status TEXT DEFAULT 'pending', sent_at TIMESTAMPTZ, error_message TEXT,
  trigger_reason TEXT DEFAULT '', event_snapshot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.recurring_deadline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, template_name TEXT DEFAULT '',
  event_type TEXT DEFAULT 'custom', regulator TEXT DEFAULT 'Other', description TEXT,
  recurrence TEXT DEFAULT 'monthly', day_of_month INTEGER, month_of_year INTEGER,
  default_priority TEXT DEFAULT 'high', default_sla_hours INTEGER,
  penalty_per_day_paise BIGINT DEFAULT 0, max_penalty_paise BIGINT DEFAULT 0,
  penalty_section TEXT, color_tag VARCHAR(7) DEFAULT '#3B82F6',
  auto_remind_days INTEGER[] DEFAULT '{7,3,1}', remind_channels TEXT[] DEFAULT '{in_app}',
  is_active BOOLEAN DEFAULT TRUE, last_generated DATE, generate_months_ahead INTEGER DEFAULT 3,
  recurrence_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deadline_sla_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, event_id UUID, sla_name TEXT DEFAULT '',
  total_hours INTEGER DEFAULT 0, started_at TIMESTAMPTZ DEFAULT now(), paused_at TIMESTAMPTZ,
  elapsed_hours NUMERIC(10,2) DEFAULT 0, is_running BOOLEAN DEFAULT TRUE,
  is_breached BOOLEAN DEFAULT FALSE, breached_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  breach_escalation_rule_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 8: E-FILING (full from 20260528100000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.efiling_portal_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_id UUID, portal_name TEXT NOT NULL DEFAULT '',
  portal_url TEXT, username TEXT NOT NULL DEFAULT '', encrypted_password TEXT,
  encryption_key_ref TEXT, pan TEXT, gstin TEXT, is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ, last_login_status TEXT, credential_expiry DATE,
  notes TEXT, status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.efiling_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, template_name TEXT DEFAULT '', portal TEXT DEFAULT '',
  form_type TEXT DEFAULT '', description TEXT, template_data JSONB DEFAULT '{}',
  field_mappings JSONB DEFAULT '{}', validation_rules JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.efiling_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_id UUID, template_id UUID,
  portal TEXT DEFAULT '', form_type TEXT DEFAULT '', assessment_year TEXT,
  filing_data JSONB DEFAULT '{}', computed_fields JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', submission_mode TEXT DEFAULT 'manual',
  acknowledgement_number TEXT, filed_at TIMESTAMPTZ, receipt_path TEXT,
  error_log JSONB DEFAULT '[]', retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.efiling_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID, ca_user_id UUID, document_name TEXT, document_type TEXT,
  file_path TEXT, file_size BIGINT, is_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.efiling_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID, status TEXT, message TEXT, actor TEXT DEFAULT 'system',
  metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 9: PAYMENT & TAX (full from 20260528200000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.tax_liability_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_id UUID, head_name TEXT DEFAULT '',
  tax_type TEXT DEFAULT '', section TEXT, assessment_year TEXT,
  gross_liability_paise BIGINT DEFAULT 0, itc_available_paise BIGINT DEFAULT 0,
  interest_paise BIGINT DEFAULT 0, penalty_paise BIGINT DEFAULT 0,
  late_fee_paise BIGINT DEFAULT 0, net_liability_paise BIGINT DEFAULT 0,
  total_due_paise BIGINT DEFAULT 0, amount NUMERIC(14,2) DEFAULT 0,
  due_date DATE, status TEXT DEFAULT 'pending', notes TEXT,
  linked_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tax_computation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_name TEXT DEFAULT '', tax_type TEXT DEFAULT '',
  section TEXT, formula JSONB DEFAULT '{}', description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_id UUID, liability_id UUID,
  amount NUMERIC(14,2) DEFAULT 0, amount_paise BIGINT DEFAULT 0,
  payment_method TEXT DEFAULT 'online', payment_date DATE,
  gateway_order_id TEXT, gateway_payment_id TEXT,
  status TEXT DEFAULT 'pending', reference_number TEXT, receipt_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, transaction_id UUID, liability_id UUID,
  bank_reference TEXT, bank_txn_date DATE, bank_amount NUMERIC(14,2),
  matched_amount NUMERIC(14,2), status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, liability_id UUID, remind_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'in_app', is_sent BOOLEAN DEFAULT FALSE, sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 10: DOCUMENT MANAGEMENT & OCR (full from 20260529400000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_id UUID, company_id UUID,
  title TEXT NOT NULL DEFAULT '', description TEXT DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '', file_extension TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size_bytes BIGINT DEFAULT 0, storage_bucket TEXT DEFAULT 'documents',
  storage_path TEXT NOT NULL DEFAULT '', thumbnail_path TEXT,
  category TEXT DEFAULT 'general', sub_category TEXT,
  compliance_domain TEXT, financial_year TEXT, assessment_year TEXT,
  period_from DATE, period_to DATE, amount NUMERIC(15,2),
  status TEXT DEFAULT 'active', is_ocr_processed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE, verified_by UUID, verified_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}', source TEXT DEFAULT 'upload',
  metadata JSONB DEFAULT '{}', current_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID, version_number INTEGER DEFAULT 1,
  file_name TEXT DEFAULT '', file_size_bytes BIGINT DEFAULT 0,
  storage_path TEXT DEFAULT '', mime_type TEXT DEFAULT '',
  change_summary TEXT, changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID, ca_user_id UUID NOT NULL,
  ocr_engine TEXT DEFAULT 'google_vision', language_hints TEXT[] DEFAULT '{eng,hin}',
  processing_options JSONB DEFAULT '{}',
  status TEXT DEFAULT 'queued', progress_pct INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, duration_ms INTEGER,
  pages_processed INTEGER DEFAULT 0, total_pages INTEGER DEFAULT 0,
  confidence_score NUMERIC(5,4), word_count INTEGER DEFAULT 0,
  error_message TEXT, error_details JSONB, retry_count INTEGER DEFAULT 0, max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_job_id UUID, document_id UUID,
  page_number INTEGER DEFAULT 1, raw_text TEXT, raw_text_confidence NUMERIC(5,4),
  extracted_fields JSONB DEFAULT '{}', extracted_tables JSONB DEFAULT '[]',
  detected_entities JSONB DEFAULT '{}', bounding_boxes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID, user_id UUID,
  action TEXT DEFAULT 'view', ip_address INET, user_agent TEXT,
  metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, entity_type TEXT, entity_id UUID,
  reason TEXT, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 11: ERP INTEGRATION (full from 20260529300000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.erp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, erp_type TEXT DEFAULT '', connection_name TEXT DEFAULT '',
  config JSONB DEFAULT '{}', auth_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'manual', entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.erp_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID, ca_user_id UUID NOT NULL,
  sync_type TEXT DEFAULT 'full', direction TEXT DEFAULT 'pull',
  status TEXT DEFAULT 'pending', started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  records_synced INTEGER DEFAULT 0, records_failed INTEGER DEFAULT 0,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.erp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID, message TEXT, level TEXT DEFAULT 'info',
  entity_type TEXT, entity_id TEXT, details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.erp_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID, ca_user_id UUID,
  source_entity TEXT DEFAULT '', source_field TEXT DEFAULT '',
  target_entity TEXT DEFAULT '', target_field TEXT DEFAULT '',
  transform TEXT, transform_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE, sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.erp_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID, cache_key TEXT, entity_type TEXT,
  data JSONB, record_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 12: ENTERPRISE API & WEBHOOKS (full from 20260529200000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.enterprise_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, key_name TEXT DEFAULT '',
  api_key TEXT UNIQUE, key_prefix TEXT,
  permissions JSONB DEFAULT '[]', rate_limit_rpm INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE, expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ, total_requests BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.api_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID, endpoint TEXT, method TEXT, status_code INTEGER,
  response_time_ms INTEGER, request_body_size INTEGER, response_body_size INTEGER,
  ip_address INET, user_agent TEXT, error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.api_key_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID, period TEXT, request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0, avg_response_ms NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, api_key_id UUID,
  url TEXT NOT NULL DEFAULT '', description TEXT,
  events TEXT[] DEFAULT '{}', secret TEXT, signing_algorithm TEXT DEFAULT 'hmac-sha256',
  is_active BOOLEAN DEFAULT TRUE, failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ, last_status_code INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID, endpoint_id UUID,
  event_type TEXT DEFAULT '', payload JSONB DEFAULT '{}',
  http_status INTEGER, response_body TEXT, status TEXT DEFAULT 'pending',
  error_message TEXT, attempt_number INTEGER DEFAULT 1,
  duration_ms INTEGER, next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 13: RBAC & TEAM MANAGEMENT (full from 20260529500000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.rbac_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, role_name TEXT NOT NULL DEFAULT '',
  display_name TEXT, description TEXT, permissions JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rbac_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID, permission TEXT DEFAULT '', resource TEXT DEFAULT '',
  actions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rbac_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, team_name TEXT NOT NULL DEFAULT '',
  description TEXT, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rbac_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID, user_id UUID, role_id UUID,
  full_name TEXT, email TEXT, role_name TEXT,
  status TEXT DEFAULT 'active', invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rbac_team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID, email TEXT, role_id UUID, role_name TEXT,
  status TEXT DEFAULT 'pending', invited_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rbac_member_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID, user_id UUID, action TEXT DEFAULT '',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 14: NOTIFICATION ENGINE (full from 20260529600000)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, template_name TEXT DEFAULT '', channel TEXT DEFAULT 'email',
  subject TEXT DEFAULT '', body TEXT DEFAULT '', variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, channel_type TEXT DEFAULT 'email',
  display_name TEXT, config JSONB DEFAULT '{}', is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_name TEXT DEFAULT '', event_type TEXT DEFAULT '',
  conditions JSONB DEFAULT '{}', template_id UUID, channel_id UUID,
  is_active BOOLEAN DEFAULT TRUE, last_triggered_at TIMESTAMPTZ, trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_id UUID, channel TEXT DEFAULT 'email',
  recipient TEXT, subject TEXT, body TEXT,
  status TEXT DEFAULT 'pending', sent_at TIMESTAMPTZ,
  error_message TEXT, attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, full_name TEXT DEFAULT '', email TEXT DEFAULT '',
  phone TEXT, channel_preferences JSONB DEFAULT '["email"]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_delivery_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID, channel TEXT DEFAULT 'email', period TEXT,
  sent INTEGER DEFAULT 0, delivered INTEGER DEFAULT 0, failed INTEGER DEFAULT 0, opened INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PHASE 15: REMAINING TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.company_employees (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, name TEXT, email TEXT, role TEXT, department TEXT, designation TEXT, status TEXT DEFAULT 'active', phone TEXT, employee_id TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, invoice_number TEXT, amount NUMERIC(14,2), status TEXT DEFAULT 'pending', due_date DATE, client_name TEXT, description TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, category TEXT, amount NUMERIC(14,2), description TEXT, expense_date DATE, status TEXT DEFAULT 'pending', vendor TEXT, receipt_url TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_payroll (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, employee_id UUID, employee_name TEXT, month TEXT, gross_salary NUMERIC(14,2), net_salary NUMERIC(14,2), deductions JSONB DEFAULT '{}', status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_gst_filings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, filing_type TEXT, period TEXT, status TEXT DEFAULT 'pending', due_date DATE, filed_date DATE, tax_amount NUMERIC(14,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_tax_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, plan_name TEXT, financial_year TEXT, status TEXT DEFAULT 'draft', content JSONB DEFAULT '{}', estimated_savings NUMERIC(14,2), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_kpis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, metric_name TEXT, metric_value NUMERIC, metric_unit TEXT, period TEXT, target_value NUMERIC, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_compliance_scores (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, regulator TEXT, score INTEGER, max_score INTEGER DEFAULT 100, period TEXT, breakdown JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, user_id UUID, title TEXT, message TEXT, type TEXT DEFAULT 'info', is_read BOOLEAN DEFAULT FALSE, link TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_risk_assessments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, risk_type TEXT, severity TEXT, likelihood TEXT, impact TEXT, description TEXT, mitigation TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_regulatory_evaluations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, regulator TEXT, evaluation_date DATE, result TEXT, score INTEGER, notes TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_contracts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, title TEXT, contract_type TEXT, party_name TEXT, start_date DATE, end_date DATE, value NUMERIC(14,2), status TEXT DEFAULT 'active', file_path TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_cases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, case_title TEXT, case_type TEXT, case_number TEXT, court TEXT, status TEXT DEFAULT 'open', next_hearing_date DATE, opposing_party TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_case_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), case_id UUID, document_name TEXT, document_type TEXT, file_path TEXT, uploaded_by UUID, uploaded_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_legal_notices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, notice_type TEXT, from_entity TEXT, to_entity TEXT, description TEXT, received_date DATE, due_date DATE, status TEXT DEFAULT 'pending', response_deadline DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_legal_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, risk_area TEXT, severity TEXT, likelihood TEXT, impact TEXT, description TEXT, mitigation TEXT, status TEXT DEFAULT 'open', financial_impact NUMERIC(14,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_deadline_alerts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, deadline_title TEXT, regulator TEXT, due_date DATE, alert_type TEXT, sent_at TIMESTAMPTZ, priority TEXT DEFAULT 'medium', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_registry (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, registry_type TEXT, registry_number TEXT, issued_date DATE, expiry_date DATE, issuing_authority TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now());

-- Generic tables
CREATE TABLE public.admin_users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE, email TEXT, role TEXT DEFAULT 'admin', permissions JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.system_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key TEXT UNIQUE, setting_value JSONB, description TEXT, updated_by UUID, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.system_health_metrics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metric_name TEXT, metric_value NUMERIC, unit TEXT, threshold_warning NUMERIC, threshold_critical NUMERIC, recorded_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.system_audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, action TEXT, entity_type TEXT, entity_id UUID, details JSONB DEFAULT '{}', ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE public.regulatory_news_feed (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, source TEXT, url TEXT UNIQUE, summary TEXT, regulator TEXT, category TEXT, published_at TIMESTAMPTZ, scraped_at TIMESTAMPTZ DEFAULT now(), is_breaking BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.regulatory_news_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), news_id UUID, version INTEGER, content JSONB, diff_summary TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.bilingual_notices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, title TEXT, content_en TEXT, content_hi TEXT, source TEXT, category TEXT, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE public.invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, invoice_number TEXT, amount NUMERIC(14,2), status TEXT DEFAULT 'pending', due_date DATE, client_name TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, category TEXT, amount NUMERIC(14,2), description TEXT, expense_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.payroll_records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, employee_name TEXT, month TEXT, gross NUMERIC(14,2), net NUMERIC(14,2), status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.gst_filings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, filing_type TEXT, period TEXT, status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.tax_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, plan_name TEXT, financial_year TEXT, content JSONB DEFAULT '{}', status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.contracts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, title TEXT, party_name TEXT, start_date DATE, end_date DATE, value NUMERIC(14,2), status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.legal_cases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, case_title TEXT, case_type TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.legal_notices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, notice_type TEXT, from_entity TEXT, description TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.legal_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, risk_area TEXT, severity TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.bank_statements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, bank_name TEXT, file_path TEXT, period TEXT, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE public.user_language_preferences (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE, language TEXT DEFAULT 'en', region TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());

-- University
CREATE TABLE public.university_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, user_id UUID, role TEXT, department TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_compliance_tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, title TEXT, regulator TEXT, status TEXT DEFAULT 'pending', due_date DATE, assigned_to UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_compliance_filings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, filing_type TEXT, period TEXT, status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_compliance_evidence (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID, evidence_type TEXT, file_path TEXT, description TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_fee_invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, amount NUMERIC(14,2), status TEXT DEFAULT 'pending', due_date DATE, description TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- In-house CA
CREATE TABLE public.inhouse_ca_projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, project_name TEXT, status TEXT DEFAULT 'active', ca_user_id UUID, description TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.inhouse_ca_metrics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, metric_name TEXT, metric_value NUMERIC, period TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.inhouse_ca_alerts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, alert_type TEXT, message TEXT, severity TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());

-- ═══════════════════════════════════════════════════════════
-- PHASE 16: ENABLE RLS ON ALL TABLES + OPEN POLICIES
-- ═══════════════════════════════════════════════════════════
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('schema_migrations')) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    BEGIN
      EXECUTE format('CREATE POLICY "open_access_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', r.tablename, r.tablename);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
-- PHASE 17: VIEWS
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.upcoming_deadlines_detailed AS
SELECT e.id, e.ca_user_id, e.company_id, e.title, e.event_type,
  e.start_date AS event_date, e.due_date, e.regulator, e.priority, e.status,
  (e.due_date - CURRENT_DATE) AS days_remaining,
  COALESCE((SELECT COUNT(*) FROM public.deadline_reminders r WHERE r.event_id = e.id AND r.is_sent = TRUE), 0) AS reminders_sent,
  COALESCE((SELECT COUNT(*) FROM public.escalation_logs l WHERE l.event_id = e.id), 0) AS escalations_fired
FROM public.compliance_calendar_events e
WHERE e.status NOT IN ('completed','cancelled','waived') AND e.due_date >= CURRENT_DATE - 7
ORDER BY e.due_date ASC;

CREATE OR REPLACE VIEW public.calendar_dashboard_summary AS
SELECT e.ca_user_id, COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE e.status = 'upcoming') AS upcoming_count,
  COUNT(*) FILTER (WHERE e.status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE e.status = 'due_today') AS due_today_count,
  COUNT(*) FILTER (WHERE e.status = 'overdue') AS overdue_count,
  COUNT(*) FILTER (WHERE e.status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE e.priority = 'critical' AND e.status NOT IN ('completed','cancelled')) AS critical_pending,
  COUNT(*) FILTER (WHERE COALESCE(e.sla_breached, FALSE)) AS sla_breached_count,
  COUNT(*) FILTER (WHERE e.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND e.status NOT IN ('completed','cancelled')) AS due_this_week,
  COUNT(*) FILTER (WHERE e.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND e.status NOT IN ('completed','cancelled')) AS due_this_month,
  MIN(e.due_date) FILTER (WHERE e.status NOT IN ('completed','cancelled','waived') AND e.due_date >= CURRENT_DATE) AS next_due_date
FROM public.compliance_calendar_events e GROUP BY e.ca_user_id;

CREATE OR REPLACE VIEW public.efiling_dashboard_summary AS
SELECT ca_user_id, COUNT(*) AS total_jobs,
  COUNT(*) FILTER (WHERE status = 'filed') AS filed_count,
  COUNT(*) FILTER (WHERE status = 'draft') AS draft_count
FROM public.efiling_jobs GROUP BY ca_user_id;

CREATE OR REPLACE VIEW public.payment_dashboard_summary AS
SELECT ca_user_id, COUNT(*) AS total_payments, SUM(amount) AS total_amount,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
FROM public.payment_transactions GROUP BY ca_user_id;

CREATE OR REPLACE VIEW public.upcoming_payments AS
SELECT t.* FROM public.tax_liability_heads t WHERE t.status = 'pending' AND t.due_date >= CURRENT_DATE ORDER BY t.due_date;

CREATE OR REPLACE VIEW public.erp_connection_dashboard AS
SELECT ca_user_id, COUNT(*) AS total_connections, COUNT(*) FILTER (WHERE status = 'active') AS active_count
FROM public.erp_connections GROUP BY ca_user_id;

CREATE OR REPLACE VIEW public.document_vault_dashboard AS
SELECT d.id AS document_id, d.ca_user_id, d.title, d.file_name, d.file_extension, d.category,
  d.status, d.is_ocr_processed, d.tags, d.current_version, d.created_at, d.updated_at,
  COALESCE((SELECT COUNT(*)::INTEGER FROM public.document_versions v WHERE v.document_id = d.id), 0) AS total_versions
FROM public.document_vault d;

CREATE OR REPLACE VIEW public.webhook_health_summary AS
SELECT e.ca_user_id, COUNT(DISTINCT e.id) AS total_endpoints,
  COUNT(d.id) AS total_deliveries
FROM public.webhook_endpoints e LEFT JOIN public.webhook_deliveries d ON d.endpoint_id = e.id
GROUP BY e.ca_user_id;

-- Grant access to views
DO $$ DECLARE v RECORD;
BEGIN
  FOR v IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v.viewname);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
-- PHASE 18: AUTH TRIGGER
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  mapped_persona TEXT := COALESCE(NEW.raw_user_meta_data->>'registration_role', 'company_owner');
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_personas (user_id, persona) VALUES (NEW.id, mapped_persona)
  ON CONFLICT (user_id) DO UPDATE SET persona = EXCLUDED.persona, updated_at = now();

  INSERT INTO public.user_verifications (user_id, persona, status, is_verified)
  VALUES (NEW.id, mapped_persona, 'pending', false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN VALUES ('profiles'),('companies'),('compliance_tasks'),('documents'),
    ('compliance_calendar_events'),('deadline_reminders'),('escalation_rules'),
    ('ca_clients'),('consent_requests'),('client_govt_notices'),('ca_dependencies'),
    ('draft_runs'),('lawyer_review_requests'),('ca_firm_invoices'),
    ('client_financial_books'),('client_module_calculations'),('client_notice_data_room'),
    ('compliance_reports'),('data_retention_policies'),('document_vault'),
    ('erp_connections'),('erp_field_mappings'),('enterprise_api_keys'),
    ('webhook_endpoints'),('notification_templates'),('notification_channels'),
    ('notification_alert_rules'),('rbac_roles'),('rbac_teams'),('rbac_team_members'),
    ('user_verifications'),('user_profiles'),('user_personas'),('ca_workspace_profiles')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_%s ON public.%I', t, t);
    BEGIN
      EXECUTE format('CREATE TRIGGER trg_updated_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- Schema-wide grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- DONE — Master rebuild v2 with full column definitions
-- ═══════════════════════════════════════════════════════════
