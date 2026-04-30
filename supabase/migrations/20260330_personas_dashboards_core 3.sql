-- Multi-Persona Dashboards: Complete Database Schema
-- This migration sets up all tables for Phases 3-8

-- ============================================================================
-- PHASE 3: External CA Dashboard Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS ca_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  industry VARCHAR(100),
  annual_turnover DECIMAL(15,2),
  employees_count INT,
  status VARCHAR(50) DEFAULT 'active',
  assigned_date TIMESTAMP DEFAULT NOW(),
  last_audit_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT ca_clients_unique_per_ca UNIQUE(ca_user_id, registration_number)
);

CREATE TABLE IF NOT EXISTS ca_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES ca_clients(id) ON DELETE CASCADE,
  audit_type VARCHAR(100),
  scheduled_date DATE,
  completion_deadline DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  audit_score INT,
  findings_count INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES ca_audits(id) ON DELETE CASCADE,
  requirement VARCHAR(500),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  due_date DATE,
  completed_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_audit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES ca_audits(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_url TEXT,
  file_type VARCHAR(50),
  file_size INT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES ca_audits(id) ON DELETE CASCADE,
  report_title VARCHAR(255),
  report_data JSONB,
  executive_summary TEXT,
  findings TEXT,
  recommendations TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_audit_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES ca_audits(id) ON DELETE CASCADE,
  fee_amount DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  billing_status VARCHAR(50) DEFAULT 'pending',
  invoice_number VARCHAR(100),
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PHASE 4: In-house CA Dashboard Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  designation VARCHAR(100),
  department VARCHAR(100),
  salary_amount DECIMAL(12,2),
  date_of_joining DATE,
  aadhaar_number VARCHAR(12),
  pan_number VARCHAR(10),
  bank_account_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
  payroll_month DATE NOT NULL,
  basic_salary DECIMAL(12,2),
  allowances DECIMAL(12,2),
  deductions DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  net_salary DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'draft',
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_payroll_per_employee_month UNIQUE(employee_id, payroll_month)
);

CREATE TABLE IF NOT EXISTS company_gst_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  filing_period DATE NOT NULL,
  gstr1_amount DECIMAL(15,2),
  gstr2_amount DECIMAL(15,2),
  gstr3b_amount DECIMAL(15,2),
  tax_payable DECIMAL(15,2),
  filing_status VARCHAR(50) DEFAULT 'pending',
  filing_date TIMESTAMP,
  due_date DATE,
  late_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_gst_filing_period UNIQUE(company_id, filing_period)
);

CREATE TABLE IF NOT EXISTS company_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE,
  party_name VARCHAR(255),
  party_gst VARCHAR(15),
  invoice_amount DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_date TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_invoice_per_company UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS company_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  expense_category VARCHAR(100),
  expense_amount DECIMAL(12,2),
  expense_date DATE,
  description TEXT,
  vendor_name VARCHAR(255),
  invoice_url TEXT,
  reimbursement_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_tax_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  planning_period DATE NOT NULL,
  planned_tax_amount DECIMAL(15,2),
  actual_tax_amount DECIMAL(15,2),
  tax_savings_strategy TEXT,
  savings_achieved DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PHASE 5: CA Firm Dashboard Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS ca_firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  member_name VARCHAR(255),
  role VARCHAR(100),
  specialization VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(255),
  joining_date DATE,
  license_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  industry VARCHAR(100),
  primary_ca_id UUID REFERENCES ca_firm_members(id),
  total_fees_ytd DECIMAL(15,2),
  last_service_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_member_id UUID NOT NULL REFERENCES ca_firm_members(id),
  firm_client_id UUID NOT NULL REFERENCES ca_firm_clients(id),
  service_type VARCHAR(100),
  assignment_date DATE,
  completion_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  hours_allocated INT,
  hours_utilized INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_firm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  firm_client_id UUID NOT NULL REFERENCES ca_firm_clients(id),
  invoice_number VARCHAR(100),
  invoice_amount DECIMAL(15,2),
  tax_amount DECIMAL(12,2),
  total_amount DECIMAL(15,2),
  invoice_date DATE,
  due_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_received_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ca_firm_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  analytics_month DATE NOT NULL,
  total_revenue DECIMAL(15,2),
  client_count INT,
  active_cases INT,
  completed_cases INT,
  average_case_value DECIMAL(12,2),
  revenue_per_ca DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_firm_analytics_month UNIQUE(firm_id, analytics_month)
);

-- ============================================================================
-- PHASE 6: In-house Lawyer Dashboard Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  contract_number VARCHAR(100) NOT NULL,
  contract_type VARCHAR(100),
  other_party_name VARCHAR(255),
  contract_amount DECIMAL(15,2),
  contract_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  document_url TEXT,
  key_clauses TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  case_number VARCHAR(100) NOT NULL,
  case_type VARCHAR(100),
  opposing_party VARCHAR(255),
  court_name VARCHAR(255),
  filing_date DATE,
  last_hearing_date DATE,
  next_hearing_date DATE,
  case_status VARCHAR(50) DEFAULT 'ongoing',
  estimated_resolution_date DATE,
  claim_amount DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_legal_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  notice_date DATE NOT NULL,
  from_party VARCHAR(255),
  notice_type VARCHAR(100),
  subject TEXT,
  notice_details TEXT,
  document_url TEXT,
  response_due_date DATE,
  response_status VARCHAR(50) DEFAULT 'pending',
  response_document_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES company_cases(id) ON DELETE CASCADE,
  document_type VARCHAR(100),
  document_name VARCHAR(255),
  file_url TEXT,
  upload_date TIMESTAMP,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_legal_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  risk_type VARCHAR(100),
  risk_description TEXT,
  severity_level VARCHAR(50),
  impact_area VARCHAR(100),
  mitigation_strategy TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PHASE 7: Company Owner Dashboard Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  kpi_name VARCHAR(100),
  kpi_value DECIMAL(15,2),
  kpi_unit VARCHAR(50),
  kpi_target DECIMAL(15,2),
  achievement_percentage DECIMAL(5,2),
  measured_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_kpi_per_day UNIQUE(company_id, kpi_name, measured_date)
);

CREATE TABLE IF NOT EXISTS company_compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  compliance_score INT,
  score_breakdown JSONB,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_compliance_score_per_company UNIQUE(company_id)
);

CREATE TABLE IF NOT EXISTS company_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  risk_category VARCHAR(100),
  risk_type VARCHAR(100),
  risk_score INT,
  severity_level VARCHAR(50),
  mitigation_status VARCHAR(50),
  last_assessed_date DATE,
  next_assessment_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_deadline_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  deadline_type VARCHAR(100),
  deadline_description TEXT,
  due_date DATE,
  responsible_department VARCHAR(100),
  alert_status VARCHAR(50) DEFAULT 'pending',
  completed_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  notification_type VARCHAR(100),
  message TEXT,
  severity_level VARCHAR(50),
  action_required BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PHASE 8: Admin Dashboard Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  admin_role VARCHAR(100),
  permissions JSONB,
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  cin_number VARCHAR(21),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  company_type VARCHAR(100),
  industry VARCHAR(100),
  annual_turnover DECIMAL(15,2),
  employee_count INT,
  status VARCHAR(50) DEFAULT 'active',
  onboarding_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company_registry(id),
  role_type VARCHAR(100),
  role_name VARCHAR(100),
  permissions JSONB,
  assigned_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_role_per_company UNIQUE(user_id, company_id, role_type)
);

CREATE TABLE IF NOT EXISTS system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50),
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100),
  metric_value DECIMAL(15,4),
  metric_unit VARCHAR(50),
  status VARCHAR(50),
  measured_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_ca_clients_ca_user_id ON ca_clients(ca_user_id);
CREATE INDEX idx_ca_audits_client_id ON ca_audits(client_id);
CREATE INDEX idx_ca_audits_status ON ca_audits(status);
CREATE INDEX idx_company_employees_company_id ON company_employees(company_id);
CREATE INDEX idx_company_payroll_employee_id ON company_payroll(employee_id);
CREATE INDEX idx_company_invoices_company_id ON company_invoices(company_id);
CREATE INDEX idx_company_contracts_company_id ON company_contracts(company_id);
CREATE INDEX idx_company_cases_company_id ON company_cases(company_id);
CREATE INDEX idx_ca_firm_members_firm_id ON ca_firm_members(firm_id);
CREATE INDEX idx_ca_firm_clients_firm_id ON ca_firm_clients(firm_id);
CREATE INDEX idx_company_kpis_company_id ON company_kpis(company_id);
CREATE INDEX idx_system_audit_logs_timestamp ON system_audit_logs(timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE ca_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_firm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_compliance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- External CA: Can only see their own clients and audits
CREATE POLICY ca_clients_rls ON ca_clients FOR SELECT
  USING (auth.uid() = ca_user_id);

CREATE POLICY ca_audits_rls ON ca_audits FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM ca_clients
    WHERE ca_clients.id = ca_audits.client_id
    AND ca_clients.ca_user_id = auth.uid()
  ));

-- In-house CA: Can see their company's employees and payroll
CREATE POLICY company_employees_rls ON company_employees FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM user_role_assignments
    WHERE user_role_assignments.user_id = auth.uid()
    AND user_role_assignments.company_id = company_employees.company_id
    AND user_role_assignments.role_type IN ('inhouse_ca', 'admin')
  ));

CREATE POLICY company_payroll_rls ON company_payroll FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM company_employees
    WHERE company_employees.id = company_payroll.employee_id
    AND EXISTS(
      SELECT 1 FROM user_role_assignments
      WHERE user_role_assignments.user_id = auth.uid()
      AND user_role_assignments.company_id = company_employees.company_id
    )
  ));

-- CA Firm: Can see their own members and clients
CREATE POLICY ca_firm_members_rls ON ca_firm_members FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM user_role_assignments
    WHERE user_role_assignments.user_id = auth.uid()
    AND user_role_assignments.role_type = 'ca_firm'
  ));

-- Admin: Can see everything
CREATE POLICY admin_view_all ON ca_clients FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM admin_users
    WHERE admin_users.auth_user_id = auth.uid()
  ));

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    changes
  ) VALUES (
    auth.uid(),
    TG_ARGV[0],
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_ca_clients AFTER INSERT OR UPDATE ON ca_clients
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes('modify');

CREATE TRIGGER audit_company_employees AFTER INSERT OR UPDATE ON company_employees
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes('modify');

CREATE TRIGGER audit_company_contracts AFTER INSERT OR UPDATE ON company_contracts
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes('modify');

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

COMMENT ON SCHEMA public IS 'Multi-Persona Dashboard System - Complete Schema with RLS and Audit Logging';
