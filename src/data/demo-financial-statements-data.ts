/**
 * DEMO FINANCIAL STATEMENTS DATA — Phase 2
 * ==========================================
 * ⚠️  FOR DEMO DASHBOARDS ONLY — NOT CONNECTED TO ANY REAL DATABASE
 *
 * Provides realistic FY 2025-26 financial statement mock data for:
 *  — Demo Company Dashboard (/dashboard)
 *  — Demo CA Dashboard (/ca-dashboard)
 *
 * Based on Sannidh Technologies Pvt Ltd (Demo Entity)
 * CIN: U72900MH2020PTC345678
 * Industry: IT Services / SaaS
 * Turnover: ₹1.82 Crore (FY 2025-26)
 */

import type { FixedAsset, LeaseContract, RevenueContract, TemporaryDifference } from "@/lib/accounting/financial-statements-engine";
import {
  buildAssetRegister,
  calculateDeferredTax,
  recogniseRevenue,
  calculateLeaseAccounting,
  calculateFinancialRatios,
  generateCARO2020Template,
  generateNotesToAccounts,
  computeGrowthRates,
} from "@/lib/accounting/financial-statements-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: DEMO FIXED ASSETS — SCHEDULE II REGISTER
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_FIXED_ASSETS_RAW: FixedAsset[] = [
  {
    id: "FA-001", company_id: "demo", asset_name: "Office Building — Bandra East Wing",
    asset_category: "buildings_office", asset_block: "block_1_buildings_10",
    date_of_purchase: "2022-04-01", date_of_put_to_use: "2022-07-01",
    gross_cost: 2500000, additions_during_year: 0, disposals_during_year: 0,
    residual_value_pct: 5, opening_wdv: 2085417, depreciation_slm: 0,
    depreciation_wdv: 0, closing_wdv: 0, accumulated_depreciation: 414583,
    net_book_value: 0, useful_life_years: 60, remaining_life_years: 56,
    is_impaired: false, impairment_loss: 0,
  },
  {
    id: "FA-002", company_id: "demo", asset_name: "Dell PowerEdge R750 Server (2 units)",
    asset_category: "computers_servers", asset_block: "block_5_plant_40",
    date_of_purchase: "2023-10-15", date_of_put_to_use: "2023-11-01",
    gross_cost: 680000, additions_during_year: 0, disposals_during_year: 0,
    residual_value_pct: 5, opening_wdv: 572333, depreciation_slm: 0,
    depreciation_wdv: 0, closing_wdv: 0, accumulated_depreciation: 107667,
    net_book_value: 0, useful_life_years: 6, remaining_life_years: 4,
    is_impaired: false, impairment_loss: 0,
  },
  {
    id: "FA-003", company_id: "demo", asset_name: "MacBook Pro 16\" (12 units)",
    asset_category: "computers_end_user", asset_block: "block_5_plant_40",
    date_of_purchase: "2024-07-01", date_of_put_to_use: "2024-07-15",
    gross_cost: 396000, additions_during_year: 66000, disposals_during_year: 0,
    residual_value_pct: 5, opening_wdv: 396000, depreciation_slm: 0,
    depreciation_wdv: 0, closing_wdv: 0, accumulated_depreciation: 0,
    net_book_value: 0, useful_life_years: 3, remaining_life_years: 2,
    is_impaired: false, impairment_loss: 0,
  },
  {
    id: "FA-004", company_id: "demo", asset_name: "Office Furniture & Workstations",
    asset_category: "furniture_fittings", asset_block: "block_3_furniture_10",
    date_of_purchase: "2022-04-01", date_of_put_to_use: "2022-04-01",
    gross_cost: 185000, additions_during_year: 0, disposals_during_year: 0,
    residual_value_pct: 5, opening_wdv: 150638, depreciation_slm: 0,
    depreciation_wdv: 0, closing_wdv: 0, accumulated_depreciation: 34363,
    net_book_value: 0, useful_life_years: 10, remaining_life_years: 6,
    is_impaired: false, impairment_loss: 0,
  },
  {
    id: "FA-005", company_id: "demo", asset_name: "Honda City — MH01XY2356 (MD's Car)",
    asset_category: "vehicles_motor_cars", asset_block: "block_6_vehicles_15",
    date_of_purchase: "2023-03-31", date_of_put_to_use: "2023-04-01",
    gross_cost: 1250000, additions_during_year: 0, disposals_during_year: 0,
    residual_value_pct: 5, opening_wdv: 1136719, depreciation_slm: 0,
    depreciation_wdv: 0, closing_wdv: 0, accumulated_depreciation: 113281,
    net_book_value: 0, useful_life_years: 8, remaining_life_years: 5,
    is_impaired: false, impairment_loss: 0,
  },
  {
    id: "FA-006", company_id: "demo", asset_name: "Sannidh ERP — Custom Software License",
    asset_category: "intangible_software", asset_block: "block_5_plant_40",
    date_of_purchase: "2024-01-15", date_of_put_to_use: "2024-02-01",
    gross_cost: 250000, additions_during_year: 0, disposals_during_year: 0,
    residual_value_pct: 5, opening_wdv: 237500, depreciation_slm: 0,
    depreciation_wdv: 0, closing_wdv: 0, accumulated_depreciation: 12500,
    net_book_value: 0, useful_life_years: 3, remaining_life_years: 2,
    is_impaired: false, impairment_loss: 0,
  },
];

// Build the asset register with all computed depreciation
export const DEMO_ASSET_REGISTER = buildAssetRegister(DEMO_FIXED_ASSETS_RAW);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: DEMO DEFERRED TAX WORKINGS — IND AS 12
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_TIMING_DIFFERENCES: {
  description: string;
  category: "taxable" | "deductible";
  carrying_amount: number;
  tax_base: number;
}[] = [
  {
    description: "Depreciation — Book SLM vs IT Act WDV (Plant & Machinery, Computers, Vehicles)",
    category: "deductible",
    carrying_amount: 280000, // Book WDV per Ind AS 16
    tax_base: 320000,        // IT Act WDV (higher WDV due to higher IT block rates)
  },
  {
    description: "Provision for Doubtful Debts (not yet deductible — u/s 36(1)(vii) only on actual write-off)",
    category: "deductible",
    carrying_amount: 0,
    tax_base: 45000, // Tax base higher (deduction deferred to write-off year)
  },
  {
    description: "Lease Liability — Ind AS 116 (Finance lease treatment not applicable under IT Act)",
    category: "taxable",
    carrying_amount: 85000, // ROU Asset > Lease Liability creates taxable diff
    tax_base: 60000,
  },
  {
    description: "Unpaid Statutory Dues — Section 43B (PF/ESIC not yet deposited at year end)",
    category: "deductible",
    carrying_amount: 12500, // Book value of PF/ESIC payable
    tax_base: 25000,        // Tax base — deductible only on actual payment (43B)
  },
];

export const DEMO_DEFERRED_TAX = calculateDeferredTax({
  company_id: "demo",
  fiscal_year: "FY 2025-26",
  tax_rate: 0.25168, // 25% + 7% surcharge (for 1 Cr < income < 10 Cr) + 4% cess = 25.168%
  opening_dta: 18500,
  opening_dtl: 9200,
  timing_differences: DEMO_TIMING_DIFFERENCES,
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: DEMO REVENUE CONTRACTS — IND AS 115
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_REVENUE_CONTRACTS: RevenueContract[] = [
  {
    id: "RC-001", company_id: "demo",
    customer_name: "Mahindra Lifespaces Developers Ltd",
    contract_date: "2025-04-01",
    total_contract_value: 3600000, // ₹36L annual SaaS contract
    recognition_method: "over_time",
    variable_consideration: 180000, // Volume discount
    financing_component: false,
    performance_obligations: [
      {
        id: "POB-001-A", description: "SaaS Platform Subscription — 12 months (Apr 2025 - Mar 2026)",
        standalone_selling_price: 3000000,
        allocated_transaction_price: 2850000,
        is_satisfied: false, progress_pct: 100, // Full year elapsed
        recognised_revenue: 2850000, deferred_revenue: 0, unbilled_revenue: 0,
      },
      {
        id: "POB-001-B", description: "Implementation & Onboarding Services (one-time, point-in-time on go-live)",
        standalone_selling_price: 750000,
        allocated_transaction_price: 570000,
        is_satisfied: true, satisfaction_date: "2025-05-15",
        recognised_revenue: 570000, deferred_revenue: 0, unbilled_revenue: 0,
      },
    ],
  },
  {
    id: "RC-002", company_id: "demo",
    customer_name: "Zydus Pharmaceuticals Ltd",
    contract_date: "2025-07-01",
    total_contract_value: 1800000, // ₹18L 9-month project
    recognition_method: "over_time",
    variable_consideration: 0,
    financing_component: false,
    performance_obligations: [
      {
        id: "POB-002-A", description: "Custom ERP Development — Phase 1 to 3 (9-month project)",
        standalone_selling_price: 1800000,
        allocated_transaction_price: 1800000,
        is_satisfied: false, progress_pct: 75,
        recognised_revenue: 1350000, deferred_revenue: 0, unbilled_revenue: 250000,
      },
    ],
  },
  {
    id: "RC-003", company_id: "demo",
    customer_name: "Retail Customers — Software Licenses (Multiple)",
    contract_date: "2025-04-01",
    total_contract_value: 450000,
    recognition_method: "point_in_time",
    variable_consideration: 0,
    financing_component: false,
    performance_obligations: [
      {
        id: "POB-003-A", description: "Annual Software License Keys — Delivered on Purchase",
        standalone_selling_price: 450000,
        allocated_transaction_price: 450000,
        is_satisfied: true, satisfaction_date: "2025-09-30",
        recognised_revenue: 450000, deferred_revenue: 0, unbilled_revenue: 0,
      },
    ],
  },
];

export const DEMO_REVENUE_RECOGNITION = DEMO_REVENUE_CONTRACTS.map(c => ({
  contract: c,
  ...recogniseRevenue(c),
}));

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DEMO LEASE — IND AS 116
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_OFFICE_LEASE: LeaseContract = {
  id: "LEASE-001", company_id: "demo",
  lease_description: "Office Premises — 3rd Floor, Embassy Tech Park, Bandra-Kurla Complex, Mumbai",
  commencement_date: "2024-04-01",
  lease_term_months: 36, // 3-year lease
  monthly_lease_payment: 115000, // ₹1.15 lakh/month
  incremental_borrowing_rate: 0.10, // 10% per annum
  initial_direct_costs: 50000, // Stamp duty & registration
  lease_incentives_received: 115000, // 1 month rent-free
  is_short_term: false,
  is_low_value: false,
  // Computed fields (set after calculation)
  present_value_lease_liability: 0,
  rou_asset_cost: 0,
};

export const DEMO_LEASE_ACCOUNTING = calculateLeaseAccounting(DEMO_OFFICE_LEASE);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: DEMO FINANCIAL STATEMENTS — FULL SCHEDULE III BALANCE SHEET & P&L
// Sannidh Technologies Pvt Ltd — FY 2025-26
// ─────────────────────────────────────────────────────────────────────────────

// ── Income Statement Components ──────────────────────────────────────────────
const REVENUE_FROM_OPERATIONS = 18200000;  // ₹1.82 Cr
const REVENUE_PREV_YEAR       = 14930000;  // ₹1.49 Cr (PY)
const OTHER_INCOME             = 85000;
const OTHER_INCOME_PY          = 69700;
const TOTAL_INCOME             = REVENUE_FROM_OPERATIONS + OTHER_INCOME;

const COGS_DIRECT_EXPENSES     = 7098000;  // 39% of revenue
const GROSS_PROFIT             = TOTAL_INCOME - COGS_DIRECT_EXPENSES;

const EMPLOYEE_COSTS           = 4732000;  // 26% of revenue
const RENT_OFFICE_EXPENSE      = DEMO_LEASE_ACCOUNTING.annual_depreciation_rou; // Ind AS 116 ROU dep
const DEPRECIATION_CHARGE      = DEMO_ASSET_REGISTER.total_dep_for_year;
const FINANCE_COSTS            = 18750 + DEMO_LEASE_ACCOUNTING.annual_interest_on_lease;
const OTHER_EXPENSES           = 925000;   // Admin + Marketing + Professional fees

const TOTAL_EXPENSES           =
  COGS_DIRECT_EXPENSES + EMPLOYEE_COSTS + RENT_OFFICE_EXPENSE +
  DEPRECIATION_CHARGE + FINANCE_COSTS + OTHER_EXPENSES;

const EBIT                     = TOTAL_INCOME - TOTAL_EXPENSES + FINANCE_COSTS;
const EBITDA                   = EBIT + DEPRECIATION_CHARGE;
const PBT                      = TOTAL_INCOME - TOTAL_EXPENSES;
const CURRENT_TAX              = Math.max(0, PBT * 0.25168); // Normal provision
const DEFERRED_TAX_CHARGE      = DEMO_DEFERRED_TAX.deferred_tax_expense - DEMO_DEFERRED_TAX.deferred_tax_income;
const TOTAL_TAX                = CURRENT_TAX + DEFERRED_TAX_CHARGE;
const PAT                      = PBT - TOTAL_TAX;

// ── Balance Sheet Components ──────────────────────────────────────────────────
// EQUITY & LIABILITIES
const SHARE_CAPITAL            = 5000000;   // ₹50 lakh — 5,00,000 shares of ₹10 each
const RESERVES_SURPLUS         = 2850000;   // Opening retained earnings
const LONG_TERM_BORROWINGS     = 750000;    // HDFC Term Loan balance
const LEASE_LIABILITY_LT       = Math.max(0, DEMO_LEASE_ACCOUNTING.pv_lease_liability - (DEMO_OFFICE_LEASE.monthly_lease_payment * 12)); // Non-current portion
const LEASE_LIABILITY_ST       = Math.min(DEMO_LEASE_ACCOUNTING.pv_lease_liability, DEMO_OFFICE_LEASE.monthly_lease_payment * 12); // Current portion (12-month payments)
const TRADE_PAYABLES_MSME      = 271000;
const TRADE_PAYABLES_OTHERS    = 485000;
const GST_PAYABLE              = 182000;
const TDS_PAYABLE              = 47500;
const PF_ESIC_PAYABLE          = 38200;
const SALARY_PAYABLE           = 125000;
const ADVANCE_FROM_CUSTOMERS   = 350000;
const INCOME_TAX_PAYABLE       = Math.max(0, Math.round(CURRENT_TAX * 0.3)); // Balance after advance tax
const AUDIT_FEES_PAYABLE       = 25000;

const TOTAL_EQUITY             = SHARE_CAPITAL + RESERVES_SURPLUS + PAT;
const TOTAL_NCL                = LONG_TERM_BORROWINGS + LEASE_LIABILITY_LT + DEMO_DEFERRED_TAX.closing_dtl;
const TOTAL_CL                 = TRADE_PAYABLES_MSME + TRADE_PAYABLES_OTHERS + GST_PAYABLE + TDS_PAYABLE
                                  + PF_ESIC_PAYABLE + SALARY_PAYABLE + ADVANCE_FROM_CUSTOMERS
                                  + INCOME_TAX_PAYABLE + AUDIT_FEES_PAYABLE + LEASE_LIABILITY_ST;
const TOTAL_EQUITY_LIABILITIES = TOTAL_EQUITY + TOTAL_NCL + TOTAL_CL;

// ASSETS
const GROSS_BLOCK              = DEMO_ASSET_REGISTER.total_gross_block;
const ACCUMULATED_DEP          = DEMO_ASSET_REGISTER.total_accumulated_dep;
const NET_BLOCK                = DEMO_ASSET_REGISTER.total_net_block;
const ROU_ASSET_NBV            = Math.max(0, DEMO_LEASE_ACCOUNTING.rou_asset - DEMO_LEASE_ACCOUNTING.annual_depreciation_rou);
const CAPITAL_WIP              = 0;
const DEFERRED_TAX_ASSET_BS    = DEMO_DEFERRED_TAX.closing_dta;
const LONG_TERM_LOANS_ADV      = 115000;    // Security deposit — BKC office

const INVENTORIES              = 0;         // IT Services company — no inventory
const TRADE_RECEIVABLES_6M     = 1825000;   // Current debtors < 6 months
const TRADE_RECEIVABLES_6MPLUS = 273000;    // Overdue debtors > 6 months
const PROVISION_DOUBTFUL       = 54600;     // 20% ECL on >6M receivables
const NET_TRADE_RECEIVABLES    = TRADE_RECEIVABLES_6M + TRADE_RECEIVABLES_6MPLUS - PROVISION_DOUBTFUL;
const UNBILLED_REVENUE         = 250000;    // Contract Asset — Zydus project unbilled
const BANK_BALANCE             = 1875000;
const CASH_IN_HAND             = 18500;
const FD_BALANCE               = 500000;    // FD maturity < 3 months
const ADVANCE_SUPPLIERS        = 85000;
const PREPAID_EXPENSES         = 37500;
const INPUT_GST                = 45000;     // ITC balance in GSTR-2B
const TDS_RECEIVABLE           = 125000;    // TDS deducted by customers u/s 194J

const TOTAL_NCA                = NET_BLOCK + ROU_ASSET_NBV + CAPITAL_WIP + DEFERRED_TAX_ASSET_BS + LONG_TERM_LOANS_ADV;
const TOTAL_CA                 = INVENTORIES + NET_TRADE_RECEIVABLES + UNBILLED_REVENUE + BANK_BALANCE
                                  + CASH_IN_HAND + FD_BALANCE + ADVANCE_SUPPLIERS + PREPAID_EXPENSES
                                  + INPUT_GST + TDS_RECEIVABLE;
const TOTAL_ASSETS             = TOTAL_NCA + TOTAL_CA;

// Balance check
const BS_DIFFERENCE            = Math.abs(TOTAL_EQUITY_LIABILITIES - TOTAL_ASSETS);
const IS_BALANCED              = BS_DIFFERENCE < 10; // Within ₹10 rounding tolerance

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: FINANCIAL RATIOS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FINANCIAL_RATIOS = calculateFinancialRatios({
  revenue: REVENUE_FROM_OPERATIONS,
  gross_profit: GROSS_PROFIT,
  ebitda: EBITDA,
  ebit: EBIT,
  pbt: PBT,
  pat: PAT,
  interest_expense: FINANCE_COSTS,
  depreciation: DEPRECIATION_CHARGE,
  income_tax: TOTAL_TAX,
  total_assets: TOTAL_ASSETS,
  total_equity: TOTAL_EQUITY,
  total_debt: LONG_TERM_BORROWINGS,
  current_assets: TOTAL_CA,
  current_liabilities: TOTAL_CL,
  inventories: INVENTORIES,
  trade_receivables: NET_TRADE_RECEIVABLES,
  trade_payables: TRADE_PAYABLES_MSME + TRADE_PAYABLES_OTHERS,
  cash_and_equivalents: BANK_BALANCE + CASH_IN_HAND,
  operating_cash_flow: Math.round(PAT + DEPRECIATION_CHARGE), // Simplified CFO
  capex: DEMO_ASSET_REGISTER.total_additions,
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: NOTES TO ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_NOTES_TO_ACCOUNTS = generateNotesToAccounts({
  share_capital: SHARE_CAPITAL,
  reserves_surplus_opening: RESERVES_SURPLUS,
  pat: PAT,
  secured_loans: LONG_TERM_BORROWINGS,
  unsecured_loans: 0,
  plant_machinery_gross: 680000 + 66000, // Server + MacBook additions
  computers_gross: 396000,
  furniture_gross: 185000,
  vehicles_gross: 1250000,
  land_building_gross: 2500000,
  accumulated_dep: ACCUMULATED_DEP,
  raw_material: 0,
  wip: 0,
  finished_goods: 0,
  trade_receivables_less_6m: TRADE_RECEIVABLES_6M,
  trade_receivables_more_6m: TRADE_RECEIVABLES_6MPLUS,
  provision_doubtful: PROVISION_DOUBTFUL,
  bank_balance: BANK_BALANCE,
  cash_in_hand: CASH_IN_HAND,
  fd_balance: FD_BALANCE,
  input_gst: INPUT_GST,
  advance_to_suppliers: ADVANCE_SUPPLIERS,
  prepaid_expenses: PREPAID_EXPENSES,
  trade_payables_msme: TRADE_PAYABLES_MSME,
  trade_payables_others: TRADE_PAYABLES_OTHERS,
  output_gst_payable: GST_PAYABLE,
  tds_payable: TDS_PAYABLE,
  pf_esic_payable: PF_ESIC_PAYABLE,
  salary_payable: SALARY_PAYABLE,
  advance_from_customers: ADVANCE_FROM_CUSTOMERS,
  audit_fees: AUDIT_FEES_PAYABLE,
  income_tax_payable: INCOME_TAX_PAYABLE,
  deferred_tax_asset: DEFERRED_TAX_ASSET_BS,
  deferred_tax_liability: DEMO_DEFERRED_TAX.closing_dtl,
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: CARO 2020 CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

export let DEMO_CARO_2020 = generateCARO2020Template();
// Pre-fill some responses for demo
DEMO_CARO_2020 = DEMO_CARO_2020.map(clause => {
  if (clause.clause_no === "3(i)(a)") return { ...clause, response: "yes" as const, remarks: "Fixed Asset Register maintained in Sannidh ERP with all details" };
  if (clause.clause_no === "3(i)(b)") return { ...clause, response: "yes" as const, remarks: "Physical verification done in Q4 FY2025-26. No material discrepancies found." };
  if (clause.clause_no === "3(ii)(a)") return { ...clause, response: "not_applicable" as const, remarks: "IT Services company — no physical inventory maintained" };
  if (clause.clause_no === "3(ii)(b)") return { ...clause, response: "not_applicable" as const, remarks: "IT Services company — no inventory with third parties" };
  if (clause.clause_no === "3(vii)(a)") return { ...clause, response: "yes" as const, remarks: "All dues deposited within due dates. No outstanding for more than 6 months." };
  if (clause.clause_no === "3(x)(a)") return { ...clause, response: "no" as const, remarks: "No fraud noticed or reported during FY 2025-26." };
  if (clause.clause_no === "3(xix)") return { ...clause, response: "no" as const, remarks: `Company generated positive OCF of ₹${Math.round((PAT + DEPRECIATION_CHARGE) / 100000).toFixed(1)}L. No cash losses.` };
  return clause;
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: MULTI-PERIOD TREND DATA (QUARTERLY)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_PERIOD_FINANCIALS = [
  {
    period_label: "FY 2023-24", period_end_date: "2024-03-31",
    revenue: 9850000, gross_profit: 5912000, ebitda: 1872000, pat: 1050000,
    total_assets: 14500000, total_equity: 7200000, total_debt: 1500000, ocf: 1320000,
  },
  {
    period_label: "FY 2024-25", period_end_date: "2025-03-31",
    revenue: 14930000, gross_profit: 8951000, ebitda: 2987000, pat: 1756000,
    total_assets: 18200000, total_equity: 9150000, total_debt: 1100000, ocf: 2100000,
  },
  {
    period_label: "FY 2025-26", period_end_date: "2026-03-31",
    revenue: REVENUE_FROM_OPERATIONS, gross_profit: GROSS_PROFIT,
    ebitda: EBITDA, pat: PAT,
    total_assets: TOTAL_ASSETS, total_equity: TOTAL_EQUITY,
    total_debt: LONG_TERM_BORROWINGS, ocf: Math.round(PAT + DEPRECIATION_CHARGE),
  },
];

export const DEMO_GROWTH_RATES = computeGrowthRates(DEMO_PERIOD_FINANCIALS);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: FULL BALANCE SHEET & P&L EXPORT OBJECT
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_BALANCE_SHEET = {
  company_name: "Sannidh Technologies Pvt. Ltd.",
  cin: "U72900MH2020PTC345678",
  gstin: "27AAKCS1234F1Z5",
  pan: "AAKCS1234F",
  fiscal_year: "FY 2025-26",
  as_on_date: "31st March 2026",
  auditor: "Demo CA Firm LLP (ICAI Firm Reg: 123456W)",
  is_balanced: IS_BALANCED,
  balance_difference: BS_DIFFERENCE,

  // ── EQUITY & LIABILITIES ─────────────────────────────────────────────────
  equity: {
    share_capital: SHARE_CAPITAL,
    reserves_surplus: RESERVES_SURPLUS + PAT,
    total: TOTAL_EQUITY,
  },
  non_current_liabilities: {
    long_term_borrowings: LONG_TERM_BORROWINGS,
    lease_liability_lt: LEASE_LIABILITY_LT,
    deferred_tax_liability: DEMO_DEFERRED_TAX.closing_dtl,
    long_term_provisions: 0,
    total: TOTAL_NCL,
  },
  current_liabilities: {
    trade_payables_msme: TRADE_PAYABLES_MSME,
    trade_payables_others: TRADE_PAYABLES_OTHERS,
    gst_payable: GST_PAYABLE,
    tds_payable: TDS_PAYABLE,
    pf_esic_payable: PF_ESIC_PAYABLE,
    salary_payable: SALARY_PAYABLE,
    advance_from_customers: ADVANCE_FROM_CUSTOMERS,
    income_tax_payable: INCOME_TAX_PAYABLE,
    lease_liability_st: LEASE_LIABILITY_ST,
    other_payables: AUDIT_FEES_PAYABLE,
    total: TOTAL_CL,
  },
  total_equity_liabilities: TOTAL_EQUITY + TOTAL_NCL + TOTAL_CL,

  // ── ASSETS ───────────────────────────────────────────────────────────────
  non_current_assets: {
    gross_block: GROSS_BLOCK,
    accumulated_depreciation: ACCUMULATED_DEP,
    net_block: NET_BLOCK,
    rou_asset_nbv: ROU_ASSET_NBV,
    capital_wip: CAPITAL_WIP,
    deferred_tax_asset: DEFERRED_TAX_ASSET_BS,
    long_term_loans_advances: LONG_TERM_LOANS_ADV,
    total: TOTAL_NCA,
  },
  current_assets: {
    inventories: INVENTORIES,
    trade_receivables_net: NET_TRADE_RECEIVABLES,
    trade_receivables_gross: TRADE_RECEIVABLES_6M + TRADE_RECEIVABLES_6MPLUS,
    provision_doubtful: PROVISION_DOUBTFUL,
    unbilled_revenue: UNBILLED_REVENUE,
    bank_balance: BANK_BALANCE,
    cash_in_hand: CASH_IN_HAND,
    fixed_deposits: FD_BALANCE,
    advance_to_suppliers: ADVANCE_SUPPLIERS,
    prepaid_expenses: PREPAID_EXPENSES,
    input_gst_itc: INPUT_GST,
    tds_receivable: TDS_RECEIVABLE,
    total: TOTAL_CA,
  },
  total_assets: TOTAL_ASSETS,
};

export const DEMO_PROFIT_LOSS = {
  company_name: "Sannidh Technologies Pvt. Ltd.",
  fiscal_year: "FY 2025-26",
  period_from: "1st April 2025",
  period_to: "31st March 2026",

  // ── INCOME ───────────────────────────────────────────────────────────────
  revenue_from_operations: REVENUE_FROM_OPERATIONS,
  revenue_py: REVENUE_PREV_YEAR,
  other_income: OTHER_INCOME,
  total_income: TOTAL_INCOME,

  // ── EXPENSES ─────────────────────────────────────────────────────────────
  cogs_direct_expenses: COGS_DIRECT_EXPENSES,
  employee_benefit_expense: EMPLOYEE_COSTS,
  rou_depreciation_lease: RENT_OFFICE_EXPENSE,
  depreciation_amortisation: DEPRECIATION_CHARGE,
  finance_costs: FINANCE_COSTS,
  other_expenses: OTHER_EXPENSES,
  total_expenses: TOTAL_EXPENSES,

  // ── PROFITS ──────────────────────────────────────────────────────────────
  gross_profit: GROSS_PROFIT,
  ebitda: EBITDA,
  ebit: EBIT,
  pbt: PBT,
  current_tax: CURRENT_TAX,
  deferred_tax_charge: DEFERRED_TAX_CHARGE,
  total_tax: TOTAL_TAX,
  pat: PAT,

  // ── MARGINS ──────────────────────────────────────────────────────────────
  gross_margin_pct: Math.round((GROSS_PROFIT / TOTAL_INCOME) * 10000) / 100,
  ebitda_margin_pct: Math.round((EBITDA / TOTAL_INCOME) * 10000) / 100,
  net_margin_pct: Math.round((PAT / TOTAL_INCOME) * 10000) / 100,
};
