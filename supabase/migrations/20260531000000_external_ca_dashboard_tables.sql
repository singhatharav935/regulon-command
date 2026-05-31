-- ╔══════════════════════════════════════════════════════════════╗
-- ║  REGULON MASTER MIGRATION — NUCLEAR REBUILD                ║
-- ║  Generated: 2026-05-31                                      ║
-- ║                                                              ║
-- ║  WARNING: This drops ALL public schema tables and rebuilds   ║
-- ║  from scratch. All existing data will be LOST.               ║
-- ║                                                              ║
-- ║  Run as: postgres role in Supabase SQL Editor                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════
-- PHASE 0: CLEAN SLATE
-- Drop everything in public schema (except auth-managed objects)
-- ═══════════════════════════════════════════════════════════════

-- Drop all views first (they depend on tables)
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
  END LOOP;
END $$;

-- Drop all tables (CASCADE handles FK dependencies)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('schema_migrations')
    ORDER BY tablename
  ) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

-- Drop custom enum types
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  ) LOOP
    EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 1: HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 2: ENUM TYPES
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE public.regulatory_status AS ENUM ('active', 'not_applicable', 'potential', 'evaluated');
CREATE TYPE public.task_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'under_review', 'completed', 'overdue');
CREATE TYPE public.document_status AS ENUM ('approved', 'submitted', 'under_review', 'draft');

-- ═══════════════════════════════════════════════════════════════
-- PHASE 3: CORE FOUNDATION TABLES
-- (these are referenced by many other tables)
-- ═══════════════════════════════════════════════════════════════

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  compliance_health INTEGER DEFAULT 85 CHECK (compliance_health >= 0 AND compliance_health <= 100),
  logo_url TEXT,
  -- Additional columns from later migrations
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  tan TEXT,
  registration_number TEXT,
  entity_type TEXT,
  date_of_incorporation DATE,
  registered_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  email TEXT,
  website TEXT,
  status TEXT DEFAULT 'active',
  financial_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- company_members
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Core helper functions
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE user_id = _user_id AND company_id = _company_id)
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Members can view their companies" ON public.companies FOR SELECT
  USING (public.is_company_member(auth.uid(), id));
CREATE POLICY "Admins can update companies" ON public.companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid() AND company_id = id AND role = 'admin'));
CREATE POLICY "Members can view company members" ON public.company_members FOR SELECT
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Users can view their own memberships" ON public.company_members FOR SELECT
  USING (auth.uid() = user_id);

-- user_profiles (alternative profile table used by persona system)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  designation TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own user_profiles" ON public.user_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_personas
CREATE TABLE public.user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona TEXT NOT NULL DEFAULT 'startup_founder',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, persona)
);
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own personas" ON public.user_personas FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_role_assignments  
CREATE TABLE public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_name, company_id)
);
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own role assignments" ON public.user_role_assignments FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_verifications
CREATE TABLE public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own verifications" ON public.user_verifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- entities (multi-entity support)
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'company',
  pan TEXT,
  gstin TEXT,
  cin TEXT,
  tan TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own entities" ON public.entities FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- PHASE 4: COMPANY-SCOPED TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.regulatory_exposure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  regulator TEXT NOT NULL,
  status public.regulatory_status NOT NULL DEFAULT 'potential',
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, regulator)
);
ALTER TABLE public.regulatory_exposure ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view regulatory exposure" ON public.regulatory_exposure FOR SELECT
  USING (public.is_company_member(auth.uid(), company_id));

CREATE TABLE public.compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  regulator TEXT NOT NULL,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view company tasks" ON public.compliance_tasks FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Members can create company tasks" ON public.compliance_tasks FOR INSERT WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Members can update company tasks" ON public.compliance_tasks FOR UPDATE USING (public.is_company_member(auth.uid(), company_id));

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  status public.document_status NOT NULL DEFAULT 'draft',
  regulator TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view company documents" ON public.documents FOR SELECT USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Members can upload documents" ON public.documents FOR INSERT WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Members can update documents" ON public.documents FOR UPDATE USING (public.is_company_member(auth.uid(), company_id));

CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  regulator TEXT NOT NULL,
  due_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view company deadlines" ON public.deadlines FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in own conversations" ON public.ai_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages in own conversations" ON public.ai_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- Company dashboard tables
CREATE TABLE public.company_employees (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, name TEXT, email TEXT, role TEXT, department TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, invoice_number TEXT, amount NUMERIC(14,2), status TEXT DEFAULT 'pending', due_date DATE, client_name TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, category TEXT, amount NUMERIC(14,2), description TEXT, expense_date DATE, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_payroll (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, employee_id UUID, month TEXT, gross_salary NUMERIC(14,2), net_salary NUMERIC(14,2), status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_gst_filings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, filing_type TEXT, period TEXT, status TEXT DEFAULT 'pending', due_date DATE, filed_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_tax_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, plan_name TEXT, financial_year TEXT, status TEXT DEFAULT 'draft', content JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_kpis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, metric_name TEXT NOT NULL, metric_value NUMERIC, metric_unit TEXT, period TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_compliance_scores (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, regulator TEXT, score INTEGER, max_score INTEGER DEFAULT 100, period TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, user_id UUID, title TEXT, message TEXT, type TEXT DEFAULT 'info', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_risk_assessments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, risk_type TEXT, severity TEXT, description TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_regulatory_evaluations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, regulator TEXT, evaluation_date DATE, result TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_contracts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, title TEXT, contract_type TEXT, party_name TEXT, start_date DATE, end_date DATE, value NUMERIC(14,2), status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_cases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, case_title TEXT, case_type TEXT, court TEXT, status TEXT DEFAULT 'open', next_hearing_date DATE, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_case_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), case_id UUID REFERENCES public.company_cases(id) ON DELETE CASCADE, document_name TEXT, file_path TEXT, uploaded_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_legal_notices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, notice_type TEXT, from_entity TEXT, description TEXT, received_date DATE, due_date DATE, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_legal_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, risk_area TEXT, severity TEXT, likelihood TEXT, impact TEXT, mitigation TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_deadline_alerts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, deadline_title TEXT, regulator TEXT, due_date DATE, alert_type TEXT, sent_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.company_registry (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, registry_type TEXT, registry_number TEXT, issued_date DATE, expiry_date DATE, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now());

-- Enable RLS on all company tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN VALUES ('company_employees'),('company_invoices'),('company_expenses'),('company_payroll'),
    ('company_gst_filings'),('company_tax_plans'),('company_kpis'),('company_compliance_scores'),
    ('company_notifications'),('company_risk_assessments'),('company_regulatory_evaluations'),
    ('company_contracts'),('company_cases'),('company_case_documents'),('company_legal_notices'),
    ('company_legal_risks'),('company_deadline_alerts'),('company_registry')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Authenticated access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 5: CA-SCOPED TABLES (ca_user_id = auth.uid())
-- ═══════════════════════════════════════════════════════════════

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
  consent_status TEXT NOT NULL DEFAULT 'pending', consent_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  email_sent BOOLEAN DEFAULT FALSE, whatsapp_sent BOOLEAN DEFAULT FALSE, responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_govt_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, department TEXT NOT NULL DEFAULT '',
  notice_type TEXT NOT NULL DEFAULT '', notice_number TEXT, issue_date DATE, due_date DATE,
  financial_year TEXT, raw_text_content TEXT, ai_draft_response TEXT,
  status TEXT NOT NULL DEFAULT 'detected', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, document_name TEXT NOT NULL DEFAULT '',
  description TEXT, due_date DATE, status TEXT NOT NULL DEFAULT 'pending',
  urgency TEXT NOT NULL DEFAULT 'medium', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, ca_user_id UUID NOT NULL, type TEXT NOT NULL DEFAULT 'email',
  direction TEXT NOT NULL DEFAULT 'outbound', subject TEXT, content TEXT NOT NULL DEFAULT '',
  recipient TEXT, status TEXT NOT NULL DEFAULT 'sent', ai_agent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, ca_user_id UUID NOT NULL, task_name TEXT NOT NULL DEFAULT '',
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
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT NOT NULL DEFAULT '',
  book_type TEXT NOT NULL DEFAULT '', book_data JSONB DEFAULT '{}', summary_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_module_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT NOT NULL DEFAULT '',
  module_id TEXT NOT NULL DEFAULT '', module_label TEXT NOT NULL DEFAULT '',
  calculation_data JSONB DEFAULT '{}', summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_notice_data_room (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT NOT NULL DEFAULT '',
  readiness_score INTEGER DEFAULT 0, total_modules_completed INTEGER DEFAULT 0,
  executive_summary TEXT, key_financials JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_trail_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, company_id UUID, event_type TEXT NOT NULL DEFAULT '',
  entity_type TEXT, entity_id UUID, action TEXT NOT NULL DEFAULT '',
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
  ca_user_id UUID NOT NULL, company_id UUID, report_name TEXT NOT NULL DEFAULT '',
  report_type TEXT NOT NULL DEFAULT '', period_from DATE, period_to DATE,
  content JSONB DEFAULT '{}', file_path TEXT, status TEXT DEFAULT 'draft',
  generated_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, policy_name TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT '', retention_days INTEGER DEFAULT 2555,
  auto_delete BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, alert_type TEXT NOT NULL DEFAULT '',
  conditions JSONB DEFAULT '{}', channels JSONB DEFAULT '["email"]',
  is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, transaction_date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL DEFAULT '', debit_amount NUMERIC(14,2) DEFAULT 0,
  credit_amount NUMERIC(14,2) DEFAULT 0, balance NUMERIC(14,2),
  ai_category TEXT, manual_category TEXT, reference TEXT, bank_name TEXT, account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_statutory_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, financial_year TEXT NOT NULL DEFAULT '',
  input_type TEXT NOT NULL DEFAULT '', input_key TEXT NOT NULL DEFAULT '',
  input_value TEXT NOT NULL DEFAULT '', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, ca_user_id UUID NOT NULL, file_name TEXT NOT NULL DEFAULT '',
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
  document_type TEXT NOT NULL DEFAULT '', draft_mode TEXT DEFAULT 'ai',
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

-- CA Audits chain
CREATE TABLE public.ca_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_client_id UUID, company_id UUID,
  audit_type TEXT NOT NULL DEFAULT '', financial_year TEXT,
  status TEXT DEFAULT 'planned', start_date DATE, end_date DATE, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_audit_id UUID, ca_client_id UUID,
  title TEXT NOT NULL DEFAULT '', description TEXT, regulator TEXT, due_date DATE,
  status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_audit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_audit_id UUID, ca_client_id UUID,
  document_name TEXT NOT NULL DEFAULT '', document_type TEXT, file_path TEXT,
  file_size BIGINT, uploaded_by UUID, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, ca_audit_id UUID, ca_client_id UUID,
  report_title TEXT NOT NULL DEFAULT '', report_type TEXT, content TEXT, file_path TEXT,
  status TEXT DEFAULT 'draft', issued_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CA Firm tables
CREATE TABLE public.ca_firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, user_id UUID NOT NULL, name TEXT, email TEXT,
  role TEXT DEFAULT 'associate', status TEXT DEFAULT 'active', joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, company_id UUID, client_name TEXT NOT NULL DEFAULT '',
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

CREATE TABLE public.ca_firm_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, metric_name TEXT, metric_value NUMERIC, period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ca_firm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL, document_name TEXT, document_type TEXT, file_path TEXT,
  uploaded_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all CA tables with ca_user_id policy
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN VALUES ('ca_clients'),('consent_requests'),('client_govt_notices'),('ca_dependencies'),
    ('communication_logs'),('ca_task_history'),('client_financial_books'),('client_module_calculations'),
    ('client_notice_data_room'),('audit_trail_events'),('compliance_scores'),('compliance_reports'),
    ('data_retention_policies'),('audit_alert_subscriptions'),('client_bank_transactions'),
    ('client_statutory_inputs'),('client_bank_statements'),('aa_consent_requests'),
    ('draft_runs'),('lawyer_review_requests'),('compliance_score_history'),
    ('ca_audits'),('ca_compliance_items'),('ca_audit_documents'),('ca_audit_reports')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "CA access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "CA access" ON public.%I FOR ALL TO authenticated USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid())', t);
  END LOOP;
END $$;

-- RLS for firm tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN VALUES ('ca_firm_invoices'),('ca_firm_members'),('ca_firm_clients'),
    ('ca_assignments'),('ca_firm_analytics'),('ca_firm_documents')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Firm access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Firm access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 6: CALENDAR & DEADLINE MANAGEMENT
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.compliance_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  entity_id UUID,
  company_id UUID,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'custom',
  regulator TEXT NOT NULL DEFAULT 'Other',
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_time TIME,
  start_date DATE,
  all_day BOOLEAN NOT NULL DEFAULT TRUE,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'upcoming',
  sla_hours INTEGER,
  sla_started_at TIMESTAMPTZ,
  sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  sla_completed_at TIMESTAMPTZ,
  penalty_per_day_paise BIGINT DEFAULT 0,
  max_penalty_paise BIGINT DEFAULT 0,
  penalty_section TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern TEXT,
  recurrence_day INTEGER,
  recurrence_month INTEGER,
  recurrence_end_date DATE,
  parent_event_id UUID,
  linked_liability_id UUID,
  linked_filing_job_id UUID,
  linked_task_id UUID,
  color_tag VARCHAR(7) DEFAULT '#3B82F6',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cce_all" ON public.compliance_calendar_events FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_cce_ca ON public.compliance_calendar_events(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_cce_due ON public.compliance_calendar_events(due_date);
CREATE INDEX IF NOT EXISTS idx_cce_status ON public.compliance_calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_cce_company ON public.compliance_calendar_events(company_id);

CREATE TABLE public.deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL,
  event_id UUID,
  remind_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  days_before INTEGER DEFAULT 3,
  channel TEXT DEFAULT 'in_app',
  recipients JSONB DEFAULT '[]',
  subject TEXT DEFAULT '',
  message_body TEXT DEFAULT '',
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  delivery_status JSONB DEFAULT '{}',
  failure_reason TEXT,
  is_snoozed BOOLEAN DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dr_all" ON public.deadline_reminders FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE TABLE public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_name TEXT NOT NULL DEFAULT '', description TEXT,
  trigger_type TEXT DEFAULT 'days_before_due', trigger_value INTEGER DEFAULT 3,
  channel TEXT DEFAULT 'email', recipients JSONB DEFAULT '[]', cc_recipients JSONB DEFAULT '[]',
  subject_template TEXT DEFAULT '', body_template TEXT DEFAULT '',
  applies_to_types TEXT[] DEFAULT '{}', applies_to_priorities TEXT[] DEFAULT '{}',
  applies_to_regulators TEXT[] DEFAULT '{}', entity_id UUID,
  is_active BOOLEAN DEFAULT TRUE, last_triggered_at TIMESTAMPTZ, trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "er_all" ON public.escalation_rules FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE TABLE public.escalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, rule_id UUID, event_id UUID,
  channel TEXT DEFAULT 'email', recipients JSONB DEFAULT '[]',
  subject TEXT DEFAULT '', message_body TEXT DEFAULT '',
  delivery_status TEXT DEFAULT 'pending', sent_at TIMESTAMPTZ, error_message TEXT,
  trigger_reason TEXT DEFAULT '', event_snapshot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "el_all" ON public.escalation_logs FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE TABLE public.recurring_deadline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, template_name TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'custom', regulator TEXT NOT NULL DEFAULT 'Other',
  description TEXT, recurrence TEXT DEFAULT 'monthly',
  day_of_month INTEGER, month_of_year INTEGER,
  default_priority TEXT DEFAULT 'high', default_sla_hours INTEGER,
  penalty_per_day_paise BIGINT DEFAULT 0, max_penalty_paise BIGINT DEFAULT 0,
  penalty_section TEXT, color_tag VARCHAR(7) DEFAULT '#3B82F6',
  auto_remind_days INTEGER[] DEFAULT '{7,3,1}', remind_channels TEXT[] DEFAULT '{in_app}',
  is_active BOOLEAN DEFAULT TRUE, last_generated DATE, generate_months_ahead INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_deadline_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdt_all" ON public.recurring_deadline_templates FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

CREATE TABLE public.deadline_sla_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL, event_id UUID,
  sla_name TEXT NOT NULL DEFAULT '', total_hours INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(), paused_at TIMESTAMPTZ,
  elapsed_hours NUMERIC(10,2) DEFAULT 0,
  is_running BOOLEAN DEFAULT TRUE, is_breached BOOLEAN DEFAULT FALSE,
  breached_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  breach_escalation_rule_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deadline_sla_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sla_all" ON public.deadline_sla_timers FOR ALL TO authenticated
  USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- PHASE 7: REMAINING TABLES (from various migrations)
-- ═══════════════════════════════════════════════════════════════

-- Simple generic tables used across features
CREATE TABLE public.admin_users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE, email TEXT, role TEXT DEFAULT 'admin', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.system_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key TEXT UNIQUE, setting_value JSONB, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.system_health_metrics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metric_name TEXT, metric_value NUMERIC, recorded_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.system_audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, action TEXT, entity_type TEXT, entity_id UUID, details JSONB DEFAULT '{}', ip_address INET, created_at TIMESTAMPTZ DEFAULT now());

-- Regulatory news
CREATE TABLE public.regulatory_news_feed (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, source TEXT, url TEXT, summary TEXT, regulator TEXT, category TEXT, published_at TIMESTAMPTZ, scraped_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.regulatory_news_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), news_id UUID, version INTEGER, content JSONB, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.bilingual_notices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, title TEXT, content_en TEXT, content_hi TEXT, source TEXT, category TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- Invoices, expenses, payroll, tax_plans (generic)
CREATE TABLE public.invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, invoice_number TEXT, amount NUMERIC(14,2), status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, category TEXT, amount NUMERIC(14,2), description TEXT, expense_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.payroll_records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, employee_name TEXT, month TEXT, gross NUMERIC(14,2), net NUMERIC(14,2), status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.gst_filings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, filing_type TEXT, period TEXT, status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.tax_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, plan_name TEXT, financial_year TEXT, content JSONB DEFAULT '{}', status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.contracts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, title TEXT, party_name TEXT, start_date DATE, end_date DATE, value NUMERIC(14,2), status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.legal_cases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, case_title TEXT, case_type TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.legal_notices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, notice_type TEXT, from_entity TEXT, description TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.legal_risks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, risk_area TEXT, severity TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.bank_statements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, bank_name TEXT, file_path TEXT, period TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- Multi-entity and consolidated
CREATE TABLE public.entity_groups (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, group_name TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.entity_group_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), group_id UUID, entity_id UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.entity_compliance_snapshot (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entity_id UUID, snapshot_date DATE, score INTEGER, breakdown JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.consolidated_reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, report_name TEXT, report_type TEXT, entity_ids UUID[], content JSONB DEFAULT '{}', status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT now());

-- E-filing
CREATE TABLE public.efiling_portal_credentials (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, entity_id UUID, portal_name TEXT, username TEXT, encrypted_password TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.efiling_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, template_name TEXT, portal TEXT, form_type TEXT, template_data JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.efiling_jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, entity_id UUID, template_id UUID, portal TEXT, form_type TEXT, filing_data JSONB DEFAULT '{}', status TEXT DEFAULT 'draft', acknowledgement_number TEXT, filed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.efiling_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID, document_name TEXT, file_path TEXT, document_type TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.efiling_status_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID, status TEXT, message TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- Payment & Tax Liability
CREATE TABLE public.tax_liability_heads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, entity_id UUID, head_name TEXT, tax_type TEXT, amount NUMERIC(14,2), due_date DATE, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.tax_computation_rules (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, rule_name TEXT, tax_type TEXT, formula JSONB DEFAULT '{}', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.payment_transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, entity_id UUID, liability_id UUID, amount NUMERIC(14,2), payment_method TEXT, payment_date DATE, status TEXT DEFAULT 'pending', reference_number TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.payment_reconciliation (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, transaction_id UUID, matched_amount NUMERIC(14,2), status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.payment_reminders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, liability_id UUID, remind_at TIMESTAMPTZ, is_sent BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());

-- Enterprise API & Webhooks
CREATE TABLE public.enterprise_api_keys (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, key_name TEXT, api_key TEXT UNIQUE, permissions JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT TRUE, last_used_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.api_access_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), api_key_id UUID, endpoint TEXT, method TEXT, status_code INTEGER, response_time_ms INTEGER, ip_address INET, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.api_key_usage_summary (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), api_key_id UUID, period TEXT, request_count INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.webhook_endpoints (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, url TEXT, events TEXT[], secret TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.webhook_deliveries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), endpoint_id UUID, event_type TEXT, payload JSONB, status_code INTEGER, response_body TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- ERP Integration
CREATE TABLE public.erp_connections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, erp_type TEXT, connection_name TEXT, config JSONB DEFAULT '{}', status TEXT DEFAULT 'active', last_sync_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.erp_sync_jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), connection_id UUID, sync_type TEXT, status TEXT DEFAULT 'pending', started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, records_synced INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.erp_sync_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID, message TEXT, level TEXT DEFAULT 'info', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.erp_field_mappings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), connection_id UUID, source_field TEXT, target_field TEXT, transform JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.erp_data_cache (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), connection_id UUID, cache_key TEXT, data JSONB, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());

-- Document Management & OCR
CREATE TABLE public.document_vault (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, company_id UUID, document_name TEXT, file_path TEXT, file_type TEXT, file_size BIGINT, category TEXT, tags TEXT[] DEFAULT '{}', status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.document_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID, version_number INTEGER, file_path TEXT, changed_by UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.document_access_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID, user_id UUID, action TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.ocr_jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, document_id UUID, status TEXT DEFAULT 'pending', engine TEXT DEFAULT 'tesseract', started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.ocr_results (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID, extracted_text TEXT, structured_data JSONB DEFAULT '{}', confidence NUMERIC(5,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.deletion_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, entity_type TEXT, entity_id UUID, reason TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());

-- RBAC & Team Management
CREATE TABLE public.rbac_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, role_name TEXT, description TEXT, permissions JSONB DEFAULT '[]', is_system BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.rbac_role_permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), role_id UUID, permission TEXT, resource TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.rbac_teams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID NOT NULL, team_name TEXT, description TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.rbac_team_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID, user_id UUID, role_id UUID, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.rbac_team_invitations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID, email TEXT, role_id UUID, status TEXT DEFAULT 'pending', invited_by UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.rbac_member_activity_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), team_id UUID, user_id UUID, action TEXT, details JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());

-- Notification Engine
CREATE TABLE public.notification_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, template_name TEXT, channel TEXT, subject TEXT, body TEXT, variables JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.notification_channels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, channel_type TEXT, config JSONB DEFAULT '{}', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.notification_alert_rules (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, rule_name TEXT, event_type TEXT, conditions JSONB DEFAULT '{}', template_id UUID, channel_id UUID, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.notification_dispatches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ca_user_id UUID, rule_id UUID, channel TEXT, recipient TEXT, subject TEXT, body TEXT, status TEXT DEFAULT 'pending', sent_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.notification_recipients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rule_id UUID, recipient_type TEXT, recipient_value TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.notification_delivery_stats (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), channel TEXT, period TEXT, sent INTEGER DEFAULT 0, delivered INTEGER DEFAULT 0, failed INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());

-- Localization
CREATE TABLE public.user_language_preferences (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE, language TEXT DEFAULT 'en', created_at TIMESTAMPTZ DEFAULT now());

-- University tables
CREATE TABLE public.university_members (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, user_id UUID, role TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_compliance_tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, title TEXT, regulator TEXT, status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_compliance_filings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, filing_type TEXT, period TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_compliance_evidence (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID, evidence_type TEXT, file_path TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.university_fee_invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, amount NUMERIC(14,2), status TEXT DEFAULT 'pending', due_date DATE, created_at TIMESTAMPTZ DEFAULT now());

-- In-house CA tables
CREATE TABLE public.inhouse_ca_projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, project_name TEXT, status TEXT DEFAULT 'active', ca_user_id UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.inhouse_ca_metrics (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, metric_name TEXT, metric_value NUMERIC, period TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.inhouse_ca_alerts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID, alert_type TEXT, message TEXT, severity TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());

-- Enable RLS on ALL remaining tables with open authenticated policy
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('schema_migrations')
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    -- Don't error if policy already exists
    BEGIN
      EXECUTE format('CREATE POLICY "auth_access_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', r.tablename, r.tablename);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 8: VIEWS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.upcoming_deadlines_detailed AS
SELECT
  e.id, e.ca_user_id, e.company_id, e.title, e.event_type,
  e.start_date AS event_date, e.due_date, e.regulator, e.priority, e.status,
  (e.due_date - CURRENT_DATE) AS days_remaining,
  COALESCE((SELECT COUNT(*) FROM public.deadline_reminders r WHERE r.event_id = e.id AND r.is_sent = TRUE), 0) AS reminders_sent,
  COALESCE((SELECT COUNT(*) FROM public.escalation_logs l WHERE l.event_id = e.id), 0) AS escalations_fired
FROM public.compliance_calendar_events e
WHERE e.status NOT IN ('completed','cancelled','waived')
  AND e.due_date >= CURRENT_DATE - 7
ORDER BY e.due_date ASC;
GRANT SELECT ON public.upcoming_deadlines_detailed TO authenticated;

CREATE OR REPLACE VIEW public.calendar_dashboard_summary AS
SELECT
  e.ca_user_id,
  COUNT(*) AS total_events,
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
FROM public.compliance_calendar_events e
GROUP BY e.ca_user_id;
GRANT SELECT ON public.calendar_dashboard_summary TO authenticated;

CREATE OR REPLACE VIEW public.efiling_dashboard_summary AS
SELECT ca_user_id, COUNT(*) AS total_jobs,
  COUNT(*) FILTER (WHERE status = 'filed') AS filed_count,
  COUNT(*) FILTER (WHERE status = 'draft') AS draft_count
FROM public.efiling_jobs GROUP BY ca_user_id;
GRANT SELECT ON public.efiling_dashboard_summary TO authenticated;

CREATE OR REPLACE VIEW public.payment_dashboard_summary AS
SELECT ca_user_id, COUNT(*) AS total_payments,
  SUM(amount) AS total_amount,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
FROM public.payment_transactions GROUP BY ca_user_id;
GRANT SELECT ON public.payment_dashboard_summary TO authenticated;

CREATE OR REPLACE VIEW public.upcoming_payments AS
SELECT t.* FROM public.tax_liability_heads t WHERE t.status = 'pending' AND t.due_date >= CURRENT_DATE ORDER BY t.due_date;
GRANT SELECT ON public.upcoming_payments TO authenticated;

CREATE OR REPLACE VIEW public.erp_connection_dashboard AS
SELECT ca_user_id, COUNT(*) AS total_connections,
  COUNT(*) FILTER (WHERE status = 'active') AS active_count
FROM public.erp_connections GROUP BY ca_user_id;
GRANT SELECT ON public.erp_connection_dashboard TO authenticated;

CREATE OR REPLACE VIEW public.document_vault_dashboard AS
SELECT ca_user_id, COUNT(*) AS total_documents,
  SUM(file_size) AS total_size_bytes
FROM public.document_vault GROUP BY ca_user_id;
GRANT SELECT ON public.document_vault_dashboard TO authenticated;

CREATE OR REPLACE VIEW public.webhook_health_summary AS
SELECT e.ca_user_id, COUNT(DISTINCT e.id) AS total_endpoints,
  COUNT(d.id) AS total_deliveries
FROM public.webhook_endpoints e
LEFT JOIN public.webhook_deliveries d ON d.endpoint_id = e.id
GROUP BY e.ca_user_id;
GRANT SELECT ON public.webhook_health_summary TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PHASE 9: TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Recreate auth trigger (drop first to avoid duplicate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers for key tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN VALUES ('profiles'),('companies'),('compliance_tasks'),('documents'),
    ('compliance_calendar_events'),('deadline_reminders'),('escalation_rules'),
    ('ca_clients'),('consent_requests'),('client_govt_notices'),('ca_dependencies'),
    ('draft_runs'),('lawyer_review_requests'),('ca_firm_invoices'),
    ('client_financial_books'),('client_module_calculations'),('client_notice_data_room'),
    ('compliance_reports'),('data_retention_policies'),('document_vault')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_%s ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_updated_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- Grant schema-wide permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- DONE — Master migration complete
-- ═══════════════════════════════════════════════════════════════
