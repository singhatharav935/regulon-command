/**
 * SANNIDH CORE ACCOUNTING ENGINE — TYPE DEFINITIONS
 * ===================================================
 * Master TypeScript interfaces for the entire double-entry accounting system.
 * Based on SANNIDH MASTER ENTERPRISE SYSTEM BUILD SPECIFICATION — Phase 1.
 *
 * DUAL-PLATFORM ARCHITECTURE:
 *   - Real dashboards (/real-company-dashboard, /dashboards/ca-firm):
 *       Use DoubleEntryService (Supabase) — real world data.
 *   - Demo dashboards (/dashboard, /ca-dashboard):
 *       Use demo-accounting-data.ts — mock data only, zero Supabase calls.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: ACCOUNT GROUP TAXONOMY
// 15 Primary Groups + 13 Secondary Groups (Part 2 of Build Spec)
// ─────────────────────────────────────────────────────────────────────────────

export type FinancialNature =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense"
  | "liability_or_equity"
  | "liability_or_asset";

export type PrimaryGroupCode =
  | "CAPITAL_ACCOUNT"
  | "LOANS_LIABILITIES"
  | "CURRENT_LIABILITIES"
  | "FIXED_ASSETS"
  | "INVESTMENTS"
  | "CURRENT_ASSETS"
  | "MISC_EXPENSES_ASSETS"
  | "SUSPENSE_ACCOUNT"
  | "BRANCH_DIVISION"
  | "SALES_ACCOUNT"
  | "PURCHASE_ACCOUNT"
  | "DIRECT_INCOME"
  | "DIRECT_EXPENSES"
  | "INDIRECT_INCOME"
  | "INDIRECT_EXPENSES";

export type SecondaryGroupCode =
  | "RESERVES_SURPLUS"
  | "BANK_OVERDRAFT"
  | "SECURED_LOANS"
  | "UNSECURED_LOANS"
  | "DUTIES_TAXES"
  | "PROVISIONS"
  | "SUNDRY_CREDITORS"
  | "SUNDRY_DEBTORS"
  | "DEPOSIT_ASSETS"
  | "LOANS_ADVANCE_ASSETS"
  | "CASH_IN_HAND"
  | "STOCK_IN_HAND"
  | "BANK_ACCOUNTS";

export interface PrimaryGroup {
  code: PrimaryGroupCode;
  name: string;
  nature: FinancialNature;
  affects_bs: boolean; // Balance Sheet group
  affects_pl: boolean; // P&L group
  normal_balance: "debit" | "credit"; // debit = asset/expense; credit = liability/equity/income
}

export interface SecondaryGroup {
  code: SecondaryGroupCode;
  name: string;
  parent_primary: PrimaryGroupCode;
  nature: FinancialNature;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

export type GoldenRuleType = "personal" | "real" | "nominal";

export interface ChartOfAccount {
  id: string;
  company_id: string;
  ledger_name: string;
  ledger_code: string; // e.g. "CA-001", "BA-101"
  primary_group: PrimaryGroupCode;
  secondary_group?: SecondaryGroupCode;
  golden_rule_type: GoldenRuleType;
  financial_nature: FinancialNature;
  normal_balance: "debit" | "credit";
  opening_balance: number;
  opening_balance_type: "debit" | "credit";
  current_balance: number;
  current_balance_type: "debit" | "credit";
  gstin?: string; // for debtors/creditors
  pan?: string;
  is_msme?: boolean;
  udyam_registration_no?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: GOLDEN RULES ENGINE
// Part 2-C of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export interface GoldenRuleValidation {
  ledger_name: string;
  golden_rule_type: GoldenRuleType;
  entry_side: "debit" | "credit";
  rule_description: string;
  is_valid: boolean;
  error_message?: string;
}

export type GoldenRuleResult =
  | { valid: true }
  | { valid: false; error: string; rule: GoldenRuleType };

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: 18 VOUCHER TYPES
// Part 3-A of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export type VoucherType =
  // Accounting Vouchers (8)
  | "CONTRA"          // F4 — Cash ↔ Bank internal transfers
  | "PAYMENT"         // F5 — All outgoing money
  | "RECEIPT"         // F6 — All incoming money
  | "JOURNAL"         // F7 — Non-cash adjustments, provisions, depreciation
  | "SALES"           // F8 — Tax Invoices & Supply Bills
  | "PURCHASE"        // F9 — Procurement Invoices & Supplier Bills
  | "CREDIT_NOTE"     // Ctrl+F8 — Sales Returns, Post-sale Discounts
  | "DEBIT_NOTE"      // Ctrl+F9 — Purchase Returns, Supplier Adjustments
  // Inventory Vouchers (8)
  | "RECEIPT_NOTE"    // Alt+F9 — GRN: Inward goods from vendor
  | "DELIVERY_NOTE"   // Alt+F8 — Outward dispatch to customer
  | "REJECTIONS_IN"   // Ctrl+F6 — Customer returns before Credit Note
  | "REJECTIONS_OUT"  // Ctrl+F5 — Supplier returns before Debit Note
  | "STOCK_JOURNAL"   // Alt+F7 — Inter-warehouse transfers, BOM consumption
  | "PHYSICAL_STOCK"  // Alt+F10 — Physical audit variance adjustments
  | "MATERIAL_IN"     // Job work inward inventory receipt
  | "MATERIAL_OUT"    // Job work outward inventory dispatch
  // Order Vouchers (2)
  | "PURCHASE_ORDER"  // Alt+F4 — Formal procurement order
  | "SALES_ORDER";    // Alt+F5 — Confirmed customer order

export type VoucherCategory = "accounting" | "inventory" | "order";

export interface VoucherTypeMeta {
  type: VoucherType;
  category: VoucherCategory;
  shortcut: string;
  affects_ledger: boolean;
  affects_inventory: boolean;
  is_order: boolean;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: DOUBLE-ENTRY VOUCHER — THE CORE TRANSACTION RECORD
// ─────────────────────────────────────────────────────────────────────────────

export interface VoucherLeg {
  id: string;
  ledger_id: string;        // FK → ChartOfAccount.id
  ledger_name: string;      // Denormalized for display speed
  ledger_code: string;
  side: "debit" | "credit";
  amount: number;           // Always positive; side determines Dr/Cr
  narration?: string;       // Leg-level narration
}

export interface VoucherLineItem {
  id: string;
  item_name: string;
  hsn_sac_code: string;
  quantity: number;
  unit: string;
  rate: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

export type GSTType = "intra_state" | "inter_state" | "exempt" | "zero_rated" | "export";
export type TDSSection =
  | "194C" | "194J" | "194I" | "194H" | "194Q" | "194A" | "194B"
  | "194D" | "194DA" | "194G" | "194LA" | "194LB" | "194LC" | "194N"
  | "206C_1H" | "52_TCS" | "194O_MARKETPLACE";

export interface Voucher {
  id: string;
  company_id: string;
  voucher_no: string;           // Auto-generated: "INV-2025-001", "PV-001", etc.
  voucher_type: VoucherType;
  voucher_date: string;         // ISO date string "YYYY-MM-DD"
  fiscal_year: string;          // "2025-26"
  reference_no?: string;        // PO number, bill number, etc.
  party_ledger_id?: string;     // Primary party (customer/vendor)
  party_ledger_name?: string;
  party_gstin?: string;
  party_pan?: string;

  // Line Items (for Sales/Purchase vouchers)
  line_items: VoucherLineItem[];

  // Double-Entry Legs — MUST balance (sum of Debit legs = sum of Credit legs)
  legs: VoucherLeg[];

  // Financial Totals
  gross_amount: number;
  total_discount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  tds_amount: number;
  tcs_amount: number;
  round_off: number;
  net_amount: number;

  // GST Classification
  gst_type?: GSTType;
  place_of_supply?: string;       // State code (e.g. "27" for Maharashtra)
  is_rcm?: boolean;               // Reverse Charge Mechanism

  // TDS/TCS
  tds_section?: TDSSection;
  tds_rate?: number;

  // Statutory Flags (auto-computed by engine)
  is_sec_17_5_blocked?: boolean;  // Section 17(5) ineligible ITC
  is_msme_vendor?: boolean;       // MSME vendor flag for Sec 43B(h)
  msme_due_date?: string;         // 15/45 day MSME payment deadline
  is_msme_overdue?: boolean;      // Sec 43B(h) disallowance flag

  // Audit & Traceability
  narration: string;              // Mandatory narration for every voucher
  created_by: string;             // user_id
  approved_by?: string;           // CA user_id for sign-off
  ca_udin?: string;               // ICAI UDIN attached by CA
  is_locked: boolean;             // WORM-locked after CA sign-off
  attachments: string[];          // File URLs (invoices, bills, bank stmts)
  source: "manual" | "ocr" | "bank_feed" | "api" | "system"; // How was this created

  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: LEDGER / T-ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerPosting {
  id: string;
  voucher_id: string;
  voucher_no: string;
  voucher_type: VoucherType;
  voucher_date: string;
  ledger_id: string;
  company_id: string;
  // "To Ledger Name" or "By Ledger Name"
  // "To" = Debit side label; "By" = Credit side label in Indian accounting
  side: "debit" | "credit";
  amount: number;
  running_balance: number;
  running_balance_type: "debit" | "credit";
  narration: string;
  fiscal_year: string;
}

export interface GeneralLedger {
  ledger_id: string;
  ledger_name: string;
  ledger_code: string;
  primary_group: PrimaryGroupCode;
  financial_nature: FinancialNature;
  opening_balance: number;
  opening_balance_type: "debit" | "credit";
  total_debits: number;
  total_credits: number;
  closing_balance: number;
  closing_balance_type: "debit" | "credit";
  postings: LedgerPosting[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: TRIAL BALANCE — 4-COLUMN FORMAT
// ─────────────────────────────────────────────────────────────────────────────

export interface TrialBalanceLine {
  ledger_id: string;
  ledger_name: string;
  ledger_code: string;
  primary_group: PrimaryGroupCode;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
}

export interface TrialBalance {
  company_id: string;
  fiscal_year: string;
  as_on_date: string;
  lines: TrialBalanceLine[];
  // Totals — must satisfy: total_debit = total_credit
  total_opening_debit: number;
  total_opening_credit: number;
  total_period_debit: number;
  total_period_credit: number;
  total_closing_debit: number;
  total_closing_credit: number;
  is_balanced: boolean; // total_closing_debit === total_closing_credit
  imbalance_amount?: number; // Non-zero if not balanced — must be fixed
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: GST RULE ENGINE TYPES
// Part 4-A of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export type GSTLedgerType =
  | "INPUT_CGST" | "INPUT_SGST" | "INPUT_IGST"
  | "OUTPUT_CGST" | "OUTPUT_SGST" | "OUTPUT_IGST"
  | "GST_PAYABLE" | "GST_REFUND_RECEIVABLE"
  | "RCM_CGST_PAYABLE" | "RCM_SGST_PAYABLE" | "RCM_IGST_PAYABLE"
  | "ITC_REVERSAL" | "GST_TDS_DEDUCTIBLE";

export interface GSTSetoffResult {
  // Rule 88A — mandatory IGST first sequence
  igst_used_against_igst: number;
  igst_used_against_cgst: number;
  igst_used_against_sgst: number;
  cgst_used_against_cgst: number;
  sgst_used_against_sgst: number;
  cash_cgst_required: number;
  cash_sgst_required: number;
  cash_igst_required: number;
  total_cash_payment: number;
  rule_86b_enforced: boolean; // 1% cash payment for turnover > ₹50L/month
}

export interface GSTR2BReconciliationResult {
  matched_invoices: number;
  mismatched_invoices: number;
  missing_in_2b: number;      // Present in Purchase Register, missing in GSTR-2B
  excess_in_2b: number;       // Present in GSTR-2B, missing in Purchase Register
  sec_17_5_blocked_itc: number;
  sec_16_4_time_limit_violation: number;
  eligible_itc: number;
  blocked_itc: number;
  mismatch_details: GSTR2BMismatch[];
}

export interface GSTR2BMismatch {
  bill_no: string;
  vendor_name: string;
  vendor_gstin: string;
  bill_date: string;
  bill_amount: number;
  our_itc: number;
  gstr2b_itc: number;
  difference: number;
  reason: "vendor_not_filed" | "rate_mismatch" | "amount_mismatch" | "date_mismatch" | "sec_17_5";
  action_required: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: TDS ENGINE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TDSDeductionResult {
  section: TDSSection;
  deductee_name: string;
  deductee_pan: string;
  payment_amount: number;
  threshold_limit: number;
  tds_rate: number;
  tds_amount: number;
  surcharge: number;
  cess: number;
  net_tds: number;
  challan_no?: string;
  deposit_due_date: string;
  is_lower_deduction_cert: boolean;
  lower_deduction_rate?: number;
  // New Income Tax Act 2025 mapping
  old_form: string;   // e.g., "Form 26Q"
  new_form: string;   // e.g., "Form 140"
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: MSME SECTION 43B(H) ENGINE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type MSMECategory = "micro" | "small" | "medium";

export interface MSMEVendorStatus {
  vendor_id: string;
  vendor_name: string;
  udyam_registration_no: string;
  msme_category: MSMECategory;
  payment_due_limit_days: 15 | 45; // 15 days if no agreement; 45 days with written agreement
  outstanding_bills: MSMEOutstandingBill[];
  total_outstanding: number;
  overdue_amount: number; // Amount that will be disallowed u/s 43B(h)
  disallowance_risk: boolean;
}

export interface MSMEOutstandingBill {
  bill_no: string;
  bill_date: string;
  amount: number;
  due_date: string;
  days_outstanding: number;
  is_overdue: boolean; // Beyond 45 days (or 15 days without agreement)
  disallowance_amount: number; // Will be added back to income at year-end
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11: VOUCHER PROCESSING ENGINE RESULTS
// ─────────────────────────────────────────────────────────────────────────────

export interface VoucherProcessingResult {
  success: boolean;
  voucher?: Voucher;
  error?: string;
  // Auto-computed validations
  is_balanced: boolean;           // debit total = credit total
  golden_rule_validations: GoldenRuleValidation[];
  gst_validation?: {
    is_valid: boolean;
    errors: string[];
  };
  tds_validation?: {
    tds_required: boolean;
    tds_amount: number;
    section: TDSSection;
  };
  msme_warning?: {
    is_msme: boolean;
    due_date: string;
    days_remaining: number;
  };
  sec_17_5_check?: {
    is_blocked: boolean;
    reason?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12: FINANCIAL STATEMENT TYPES
// Part 6 of Build Spec — 10-Step Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export interface TradingAccount {
  company_id: string;
  fiscal_year: string;
  // Debit Side
  opening_stock: number;
  net_purchases: number;
  direct_expenses: { name: string; amount: number }[];
  total_debit: number;
  // Credit Side
  net_sales: number;
  closing_stock: number;
  total_credit: number;
  // Result
  gross_profit: number;  // Credit > Debit
  gross_loss: number;    // Debit > Credit
}

export interface ProfitLossAccount {
  company_id: string;
  fiscal_year: string;
  // Debit Side
  gross_loss: number;
  indirect_expenses: { name: string; schedule_ref: string; amount: number }[];
  depreciation: number;
  finance_costs: number;
  total_debit: number;
  // Credit Side
  gross_profit: number;
  indirect_income: { name: string; amount: number }[];
  total_credit: number;
  // Result
  net_profit: number;
  net_loss: number;
}

export interface BalanceSheetScheduleIII {
  company_id: string;
  fiscal_year: string;
  as_on_date: string;
  // EQUITY & LIABILITIES
  shareholders_funds: {
    share_capital: number;
    reserves_surplus: number;
    total: number;
  };
  non_current_liabilities: {
    long_term_borrowings: number;
    deferred_tax_liabilities: number;
    other_long_term_liabilities: number;
    long_term_provisions: number;
    total: number;
  };
  current_liabilities: {
    short_term_borrowings: number;
    trade_payables_msme: number;
    trade_payables_others: number;
    other_current_liabilities: number;
    short_term_provisions: number;
    total: number;
  };
  total_equity_liabilities: number;
  // ASSETS
  non_current_assets: {
    fixed_assets_tangible: number;
    fixed_assets_intangible: number;
    cwip: number;
    long_term_investments: number;
    deferred_tax_assets: number;
    long_term_loans_advances: number;
    other_non_current_assets: number;
    total: number;
  };
  current_assets: {
    inventories: number;
    trade_receivables: number;
    cash_and_equivalents: number;
    short_term_loans_advances: number;
    other_current_assets: number;
    total: number;
  };
  total_assets: number;
  // Validation
  is_balanced: boolean; // total_equity_liabilities === total_assets
  // Financial Ratios
  ratios: {
    current_ratio: number;
    debt_equity_ratio: number;
    roce: number;
    gross_profit_pct: number;
    net_profit_pct: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13: 40 BANKING ENTRY SCENARIOS — Reference Types
// Part 3-B of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export type BankingScenario =
  | "cash_deposited_to_bank"
  | "cash_withdrawn_office"
  | "cash_withdrawn_personal"
  | "cheque_received_from_customer"
  | "cheque_deposited_for_collection"
  | "cheque_cleared_by_bank"
  | "cheque_issued_to_supplier"
  | "bank_charges_deducted"
  | "bank_interest_credited"
  | "bank_interest_debited"
  | "bank_commission_charged"
  | "loan_emi_payment"
  | "bank_loan_received"
  | "bank_loan_repaid"
  | "neft_rtgs_received_from_customer"
  | "neft_rtgs_paid_to_supplier"
  | "salary_paid_bank"
  | "rent_paid_bank"
  | "electricity_bill_paid"
  | "telephone_internet_paid"
  | "office_expenses_paid"
  | "insurance_premium_paid"
  | "gst_payment_bank"
  | "tds_deposited"
  | "advance_received_from_customer"
  | "advance_paid_to_supplier"
  | "tax_refund_received"
  | "dividend_received"
  | "fd_created"
  | "fd_matured"
  | "bank_od_received"
  | "bank_od_repaid"
  | "credit_card_bill_paid"
  | "pos_card_settlement"
  | "upi_payment_received"
  | "upi_payment_made"
  | "bank_charges_reversed"
  | "customer_cheque_bounced"
  | "supplier_cheque_bounced"
  | "direct_deposit_by_customer";

export interface BankingScenarioTemplate {
  scenario: BankingScenario;
  description: string;
  voucher_type: VoucherType;
  debit_ledger: string;
  credit_ledger: string;
  shortcut: string;
  narration_template: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 14: OCR & AI NOTICE PARSER TYPES
// Part 7 of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export type StatutoryNoticeType =
  | "GST_ASMT_10"
  | "GST_SCN_73"
  | "GST_SCN_74"
  | "GST_DRC_01"
  | "IT_142_1"
  | "IT_143_2"
  | "IT_148"
  | "IT_156"
  | "MCA_206"
  | "MCA_92"
  | "MCA_137";

export interface ParsedNotice {
  notice_type: StatutoryNoticeType;
  authority: string;
  reference_no: string;
  issue_date: string;
  response_due_date: string;
  demanded_amount: number;
  period_from: string;
  period_to: string;
  grounds: string[];
  raw_text: string;
  confidence_score: number;
}

export interface NoticeDraftResponse {
  notice_id: string;
  subject_line: string;
  opening_para: string;
  factual_grounds: string[];
  legal_citations: LegalCitation[];
  supporting_documents: string[];
  conclusion: string;
  ca_sign_off_required: boolean;
}

export interface LegalCitation {
  case_name: string;
  court: string;
  year: number;
  citation: string;
  relevance: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 15: PAYROLL ENGINE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollEmployee {
  id: string;
  company_id: string;
  employee_code: string;
  name: string;
  designation: string;
  department: string;
  date_of_joining: string;
  pan: string;
  aadhaar: string;
  uan: string;            // PF UAN number
  esic_ip_no: string;     // ESIC IP number
  bank_account_no: string;
  ifsc_code: string;
  // Salary Structure
  basic: number;
  hra: number;
  special_allowance: number;
  lta: number;
  medical_allowance: number;
  gross_ctc: number;
  // Tax Regime
  tax_regime: "old" | "new"; // Section 115BAC old vs new regime
  state_code: string;         // For Professional Tax lookup
}

export interface PayrollCalculation {
  employee_id: string;
  month: string;           // "2025-07"
  working_days: number;
  present_days: number;
  leaves_taken: number;
  // Gross Pay
  basic: number;
  hra: number;
  special_allowance: number;
  lta: number;
  medical_allowance: number;
  gross_pay: number;
  // Deductions
  epf_employee: number;     // 12% of basic
  epf_employer: number;     // 12% of basic (employer share posted to employer cost)
  esic_employee: number;    // 0.75% of gross (if gross ≤ ₹21,000/month)
  esic_employer: number;    // 3.25% of gross
  professional_tax: number; // As per state slab
  tds_sec_192: number;      // TDS on salary u/s 192
  other_deductions: number;
  total_deductions: number;
  // Net Pay
  net_pay: number;
  // Voucher generated
  voucher_id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 16: BUSINESS MODEL ADAPTOR TYPES
// Part 1 of Build Spec — Dynamic 20-Business Model Adaptor
// ─────────────────────────────────────────────────────────────────────────────

export type BusinessModelType =
  | "saas"
  | "d2c_ecommerce"
  | "manufacturing"
  | "marketplace"
  | "franchise"
  | "trading"
  | "professional_services"
  | "restaurant_hospitality"
  | "real_estate"
  | "healthcare"
  | "education"
  | "logistics_transport"
  | "export"
  | "import"
  | "banking_nbfc"
  | "ngo_trust"
  | "startup"
  | "retail"
  | "construction"
  | "agriculture";

export interface BusinessModelConfig {
  model: BusinessModelType;
  display_name: string;
  inventory_valuation_method: "fifo" | "weighted_avg" | "lifo" | "specific_identification";
  revenue_recognition_method: "point_in_time" | "over_time"; // Ind AS 115
  tds_sections_applicable: TDSSection[];
  tcs_applicable: boolean;
  tcs_section?: "206C_1H" | "52_TCS" | "194O_MARKETPLACE";
  deferred_revenue_applicable: boolean;  // SaaS deferred revenue
  mdr_gl_required: boolean;             // D2C payment gateway MDR charges
  bom_wip_required: boolean;            // Manufacturing BOM/WIP
  gst_type_default: GSTType;
  specific_ledgers: string[];           // Business-model specific ledger names to auto-create
}
