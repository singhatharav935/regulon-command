/**
 * INTELLIGENT TAX OPTIMIZATION — TYPE DEFINITIONS
 * ================================================
 * Shared TypeScript types for all tax optimization engines.
 */

export type OptimizationCategory = 'income_tax' | 'gst' | 'govt_scheme' | 'state_subsidy' | 'promoter_wealth';

export type OptimizationStatus = 'eligible' | 'partially_eligible' | 'action_required' | 'claimed' | 'not_eligible' | 'expired';

export type RiskLevel = 'safe' | 'moderate' | 'aggressive' | 'high';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface CompanyProfile {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  entity_type: string; // 'pvt_ltd' | 'llp' | 'partnership' | 'proprietorship' | 'opc' | 'public_ltd' | 'company' | 'huf'
  incorporation_date: string;
  state: string;
  industry: string;
  msme_category?: 'micro' | 'small' | 'medium' | 'none' | null;
  dipp_registered?: boolean;
  dipp_number?: string;
  is_manufacturing?: boolean;
  is_exporter?: boolean;
  special_zone?: 'sez' | 'eou' | 'stpi' | 'ne_state' | 'jk' | 'hp' | 'uttarakhand' | 'none' | null;
  annual_turnover: number;
  total_employees: number;
  new_employees_fy: number;
  new_employee_avg_salary: number;
  total_revenue: number;
  total_purchases: number;
  total_expenses: number;
  gross_profit: number;
  net_profit_before_tax: number;
  total_gst_itc_claimed: number;
  total_gst_itc_available: number;
  total_gst_output: number;
  gst_itc_mismatch_amount: number;
  gst_input_rate_avg: number;
  gst_output_rate_avg: number;
  new_machinery_investment: number;
  r_and_d_expenditure: number;
  total_exports: number;
  msme_vendor_payables: number;
  msme_overdue_payables: number;
  total_fixed_assets_cost: number;
  director_salary: number;
  dividend_distributed: number;
  preliminary_expenses: number;
  payroll_count: number;
}

export interface ActionItem {
  id: string;
  label: string;
  type: string;
  completed: boolean;
}

export interface TaxOptimization {
  id: string;
  category: OptimizationCategory;
  section: string;
  title: string;
  short_description: string;
  detailed_explanation: string;
  legal_reference: string;
  eligibility_criteria: string[];
  is_eligible: boolean;
  status: OptimizationStatus;
  risk_level: RiskLevel;
  priority: Priority;
  estimated_savings: number;
  savings_calculation: string;
  action_items: ActionItem[];
  documents_required: string[];
  deadline: string;
  fy_applicable: string;
  tags: string[];
  icon_name: string;
  color_accent: string;
}

export interface OptimizationSummary {
  total_savings: number;
  income_tax_savings: number;
  gst_recovery: number;
  govt_subsidies: number;
  state_subsidies: number;
  promoter_savings: number;
  total_optimizations: number;
  eligible_count: number;
  action_required_count: number;
  claimed_count: number;
  category_breakdown: { category: OptimizationCategory; count: number; amount: number }[];
}
