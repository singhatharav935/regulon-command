-- =============================================================================
-- SANNIDH REAL COMPANY OWNER DASHBOARD — DATABASE MIGRATION
-- Schema for Real ERP, Autonomous Ingestion, and CA Exception Inbox
-- =============================================================================

-- 1. Real Company Profile & Status
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  compliance_score INT DEFAULT 100,
  health_status TEXT DEFAULT 'green',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sales Invoices (General Ledger Debit Customer / Credit Sales)
CREATE TABLE IF NOT EXISTS public.company_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_gstin TEXT,
  date DATE NOT NULL,
  due_date DATE,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'unpaid', -- unpaid, paid, overdue, cancelled
  items JSONB DEFAULT '[]'::jsonb,
  ingestion_channel TEXT DEFAULT 'sannidh_erp', -- sannidh_erp, api_webhook, bank_signal
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Purchase Bills & GSTR-2B Records
CREATE TABLE IF NOT EXISTS public.company_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  bill_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_gstin TEXT,
  date DATE NOT NULL,
  due_date DATE,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  itc_status TEXT DEFAULT 'eligible', -- eligible, ineligible, blocked, verified_gstr2b
  gstr2b_matched BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue
  items JSONB DEFAULT '[]'::jsonb,
  ingestion_channel TEXT DEFAULT 'gstr2b_api', -- gstr2b_api, email_parser, manual_entry
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expenses & Petty Cash Vouchers
CREATE TABLE IF NOT EXISTS public.company_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  expense_number TEXT NOT NULL,
  category TEXT NOT NULL, -- Rent, Utilities, Salary, Fuel, Printing, Legal, etc.
  description TEXT,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tds_section TEXT, -- 194C, 194J, 194I
  tds_amount NUMERIC(15, 2) DEFAULT 0.00,
  date DATE NOT NULL,
  payment_status TEXT DEFAULT 'paid',
  payment_method TEXT DEFAULT 'bank_transfer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payroll & Salary Register
CREATE TABLE IF NOT EXISTS public.company_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  employee_id TEXT,
  employee TEXT NOT NULL,
  role TEXT,
  department TEXT,
  basic_salary NUMERIC(15, 2) DEFAULT 0.00,
  hra NUMERIC(15, 2) DEFAULT 0.00,
  allowances NUMERIC(15, 2) DEFAULT 0.00,
  gross_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  pf_deduction NUMERIC(15, 2) DEFAULT 0.00,
  esic_deduction NUMERIC(15, 2) DEFAULT 0.00,
  pt_deduction NUMERIC(15, 2) DEFAULT 0.00,
  tds_deduction NUMERIC(15, 2) DEFAULT 0.00,
  net_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  month TEXT NOT NULL,
  status TEXT DEFAULT 'processed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bank Transactions & Reconciliation Ledger
CREATE TABLE IF NOT EXISTS public.company_bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  narration TEXT,
  amount NUMERIC(15, 2) NOT NULL, -- Positive for Credit (Deposit), Negative for Debit (Payout)
  type TEXT NOT NULL, -- credit, debit
  ai_category TEXT,
  utr_number TEXT,
  cheque_number TEXT,
  status TEXT DEFAULT 'reconciled', -- reconciled, pending, flagged_mismatch
  matched_voucher_id UUID,
  ingestion_channel TEXT DEFAULT 'fiu_bank_feed', -- fiu_bank_feed, netbanking_webhook, csv_upload
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inventory Stock Register
CREATE TABLE IF NOT EXISTS public.company_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  hsn TEXT,
  category TEXT,
  stock INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit_price NUMERIC(15, 2) DEFAULT 0.00,
  valuation NUMERIC(15, 2) DEFAULT 0.00,
  unit TEXT DEFAULT 'Pcs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CA Exception Inbox & Compliance Alerts (Layer 2 Safeguard)
CREATE TABLE IF NOT EXISTS public.company_exception_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  rule_id TEXT NOT NULL, -- TB_IMBALANCE, GSTR2B_MISMATCH, TDS_MISSING, AMBIGUOUS_BANK_LINE
  severity TEXT DEFAULT 'warning', -- critical, warning, info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discrepancy_amount NUMERIC(15, 2) DEFAULT 0.00,
  action_required TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, resolved, ca_approved
  ca_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_exception_alerts ENABLE ROW LEVEL SECURITY;

-- Permissive policy for active authenticated users (scoped by application logic)
CREATE POLICY "Allow authenticated read/write company_profiles" ON public.company_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_invoices" ON public.company_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_purchases" ON public.company_purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_expenses" ON public.company_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_payroll" ON public.company_payroll FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_bank_transactions" ON public.company_bank_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_inventory" ON public.company_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write company_exception_alerts" ON public.company_exception_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
