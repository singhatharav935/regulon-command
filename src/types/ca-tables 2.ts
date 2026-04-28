// Type definitions for In-house CA Dashboard tables
export interface CompanyEmployee {
  id: string;
  company_id: string;
  employee_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  salary_amount?: number;
  date_of_joining?: string;
  aadhaar_number?: string;
  pan_number?: string;
  bank_account_number?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyPayroll {
  id: string;
  employee_id: string;
  payroll_month: string;
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
  tax_amount?: number;
  net_salary?: number;
  status?: string;
  processed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyGSTFiling {
  id: string;
  company_id: string;
  filing_period: string;
  gstr1_amount?: number;
  gstr2_amount?: number;
  gstr3b_amount?: number;
  tax_payable?: number;
  filing_status?: string;
  filing_date?: string;
  due_date?: string;
  late_fee?: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  invoice_date?: string;
  party_name?: string;
  party_gst?: string;
  invoice_amount?: number;
  tax_amount?: number;
  invoice_type?: string;
  payment_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyExpense {
  id: string;
  company_id: string;
  expense_category: string;
  expense_amount: number;
  expense_date: string;
  vendor_name?: string;
  description?: string;
  receipt_url?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyTaxPlan {
  id: string;
  company_id: string;
  plan_name: string;
  tax_year: string;
  estimated_tax_liability?: number;
  recommended_provisions?: number;
  investment_recommendations?: string;
  created_at: string;
  updated_at: string;
}
