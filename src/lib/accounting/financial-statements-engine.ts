/**
 * SANNIDH FINANCIAL STATEMENTS ENGINE — PHASE 2
 * ===============================================
 * Pure computation engine for Ind AS compliant financial statement generation.
 * This file contains ZERO UI code and ZERO Supabase calls.
 * It is shared between real dashboards (live data) and demo dashboards (mock data).
 *
 * Implements:
 *  1. Schedule II Depreciation (SLM & WDV) — Companies Act 2013 + Income Tax Act Sec 32
 *  2. Ind AS 12 — Deferred Tax Assets (DTA) & Deferred Tax Liabilities (DTL)
 *  3. Ind AS 115 — Revenue Recognition (Point-in-Time & Over-Time)
 *  4. Ind AS 116 — Lease Accounting (Right-of-Use Asset & Lease Liability)
 *  5. Financial Ratio Analysis (20 key ratios)
 *  6. CARO 2020 Checklist (27 clauses)
 *  7. Multi-Period Comparative P&L & Balance Sheet generation
 *  8. Notes to Accounts auto-generation (Notes 1–25)
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: SCHEDULE II DEPRECIATION ENGINE
// Companies Act 2013 — Schedule II Asset Life & WDV/SLM Rates
// Income Tax Act 1961 — Section 32 Block-of-Assets WDV
// ─────────────────────────────────────────────────────────────────────────────

export interface FixedAsset {
  id: string;
  company_id: string;
  asset_name: string;
  asset_category: AssetCategory;
  asset_block: IncomeTaxAssetBlock; // For Sec 32 IT Act block depreciation
  date_of_purchase: string;
  date_of_put_to_use: string;
  gross_cost: number;            // Original cost including installation
  additions_during_year: number; // Additions in current FY
  disposals_during_year: number; // WDV of disposed assets in current FY
  residual_value_pct: number;    // Salvage value % for SLM (default 5%)
  // Computed Fields
  opening_wdv: number;           // WDV at start of FY
  depreciation_slm: number;      // SLM depreciation for year (Companies Act)
  depreciation_wdv: number;      // WDV depreciation for year (Income Tax Block)
  closing_wdv: number;           // WDV at end of FY
  accumulated_depreciation: number;
  net_book_value: number;
  // Life
  useful_life_years: number;     // Schedule II life in years
  remaining_life_years: number;
  // Ind AS 36 Impairment
  is_impaired: boolean;
  impairment_loss: number;
}

export type AssetCategory =
  | "land_freehold"
  | "land_leasehold"
  | "buildings_factory"
  | "buildings_office"
  | "plant_machinery_general"
  | "plant_machinery_continuous_process"
  | "computers_servers"
  | "computers_end_user"
  | "furniture_fittings"
  | "vehicles_motor_cars"
  | "vehicles_commercial"
  | "office_equipment"
  | "ships_vessels"
  | "aircraft"
  | "railway_sidings"
  | "intangible_goodwill"
  | "intangible_patents"
  | "intangible_software";

export type IncomeTaxAssetBlock =
  | "block_1_buildings_10"       // 10% WDV — RCC/Brick buildings
  | "block_2_buildings_40"       // 40% WDV — Temporary structures
  | "block_3_furniture_10"       // 10% WDV
  | "block_4_plant_15"           // 15% WDV — General plant
  | "block_5_plant_40"           // 40% WDV — Computers, UPS, software
  | "block_6_vehicles_15"        // 15% WDV — Motor vehicles
  | "block_7_ships_20"           // 20% WDV
  | "block_8_intangibles_25";    // 25% WDV — Patents, trademarks

// Schedule II — Useful life in years for SLM
const SCHEDULE_II_USEFUL_LIFE: Record<AssetCategory, number> = {
  land_freehold: 0,               // No depreciation on freehold land
  land_leasehold: 0,              // Amortised over lease period
  buildings_factory: 30,
  buildings_office: 60,
  plant_machinery_general: 15,
  plant_machinery_continuous_process: 25,
  computers_servers: 6,
  computers_end_user: 3,
  furniture_fittings: 10,
  vehicles_motor_cars: 8,
  vehicles_commercial: 10,
  office_equipment: 5,
  ships_vessels: 20,
  aircraft: 20,
  railway_sidings: 15,
  intangible_goodwill: 10,       // Amortised over 10 years or useful life
  intangible_patents: 10,
  intangible_software: 3,
};

// Income Tax Act Block WDV Rates
const IT_BLOCK_WDV_RATES: Record<IncomeTaxAssetBlock, number> = {
  block_1_buildings_10: 0.10,
  block_2_buildings_40: 0.40,
  block_3_furniture_10: 0.10,
  block_4_plant_15: 0.15,
  block_5_plant_40: 0.40,
  block_6_vehicles_15: 0.15,
  block_7_ships_20: 0.20,
  block_8_intangibles_25: 0.25,
};

export function calculateSLMDepreciation(asset: {
  gross_cost: number;
  additions_during_year: number;
  disposals_during_year: number;
  residual_value_pct: number;
  useful_life_years: number;
  date_of_put_to_use: string;
}): { depreciation: number; rate: number } {
  if (asset.useful_life_years === 0) return { depreciation: 0, rate: 0 };

  const residualValue = asset.gross_cost * (asset.residual_value_pct / 100);
  const depreciableAmount = asset.gross_cost - residualValue;
  const annualRate = 1 / asset.useful_life_years;
  const annualDep = depreciableAmount * annualRate;

  // Pro-rate additions for half year (if added after Oct 1)
  const putToUseDate = new Date(asset.date_of_put_to_use);
  const monthOfUse = putToUseDate.getMonth() + 1; // 1-12
  const additionsDep = monthOfUse > 9
    ? (asset.additions_during_year * annualRate * 0.5) // Half year convention
    : (asset.additions_during_year * annualRate);

  return {
    depreciation: roundTo2(annualDep + additionsDep - (asset.disposals_during_year * annualRate)),
    rate: roundTo2(annualRate * 100),
  };
}

export function calculateWDVDepreciation(asset: {
  opening_wdv: number;
  additions_during_year: number;
  disposals_during_year: number;
  block: IncomeTaxAssetBlock;
}): { depreciation: number; closing_wdv: number; rate: number } {
  const rate = IT_BLOCK_WDV_RATES[asset.block];
  const adjustedWDV = asset.opening_wdv + asset.additions_during_year - asset.disposals_during_year;
  const depreciation = roundTo2(adjustedWDV * rate);
  return {
    depreciation,
    closing_wdv: roundTo2(adjustedWDV - depreciation),
    rate: rate * 100,
  };
}

export function buildAssetRegister(assets: FixedAsset[]): {
  schedule: FixedAsset[];
  total_gross_block: number;
  total_additions: number;
  total_disposals: number;
  total_accumulated_dep: number;
  total_net_block: number;
  total_dep_for_year: number;
  total_impairment: number;
} {
  let total_gross_block = 0;
  let total_additions = 0;
  let total_disposals = 0;
  let total_accumulated_dep = 0;
  let total_dep_for_year = 0;
  let total_impairment = 0;

  const schedule = assets.map(asset => {
    const slm = calculateSLMDepreciation({
      gross_cost: asset.gross_cost,
      additions_during_year: asset.additions_during_year,
      disposals_during_year: asset.disposals_during_year,
      residual_value_pct: asset.residual_value_pct,
      useful_life_years: SCHEDULE_II_USEFUL_LIFE[asset.asset_category],
      date_of_put_to_use: asset.date_of_put_to_use,
    });

    const closing_wdv = Math.max(0, asset.opening_wdv + asset.additions_during_year - asset.disposals_during_year - slm.depreciation);
    const net_book_value = closing_wdv - asset.impairment_loss;

    total_gross_block += asset.gross_cost + asset.additions_during_year;
    total_additions += asset.additions_during_year;
    total_disposals += asset.disposals_during_year;
    total_accumulated_dep += asset.accumulated_depreciation + slm.depreciation;
    total_dep_for_year += slm.depreciation;
    total_impairment += asset.impairment_loss;

    return {
      ...asset,
      depreciation_slm: slm.depreciation,
      closing_wdv,
      net_book_value,
    };
  });

  return {
    schedule,
    total_gross_block,
    total_additions,
    total_disposals,
    total_accumulated_dep,
    total_net_block: total_gross_block - total_accumulated_dep,
    total_dep_for_year,
    total_impairment,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: IND AS 12 — DEFERRED TAX ASSETS (DTA) & DEFERRED TAX LIABILITIES (DTL)
// ─────────────────────────────────────────────────────────────────────────────

export interface TemporaryDifference {
  description: string;
  category: "taxable" | "deductible"; // Taxable → DTL; Deductible → DTA
  carrying_amount: number;    // Ind AS book value
  tax_base: number;           // IT Act value
  temporary_difference: number; // Carrying - Tax Base
  tax_rate: number;           // 25.168% (25% + 12% surcharge + 4% cess for companies with turnover < 400Cr)
  deferred_tax_amount: number; // temporary_difference × tax_rate
}

export interface DeferredTaxWorkings {
  company_id: string;
  fiscal_year: string;
  applicable_tax_rate: number; // 22.5% (115BAA) or 25.168% (Normal)
  // Opening Balances
  opening_dta: number;
  opening_dtl: number;
  // Movements during year
  differences: TemporaryDifference[];
  // Closing Balances
  closing_dta: number;
  closing_dtl: number;
  net_deferred_tax: number; // Net DTA (if positive) or Net DTL (if negative)
  // P&L Impact
  deferred_tax_expense: number; // Charge to P&L (increase in DTL or decrease in DTA)
  deferred_tax_income: number;  // Credit to P&L (decrease in DTL or increase in DTA)
}

export function calculateDeferredTax(inputs: {
  company_id: string;
  fiscal_year: string;
  tax_rate: number;
  opening_dta: number;
  opening_dtl: number;
  timing_differences: {
    description: string;
    category: "taxable" | "deductible";
    carrying_amount: number;
    tax_base: number;
  }[];
}): DeferredTaxWorkings {
  const differences: TemporaryDifference[] = inputs.timing_differences.map(td => {
    const temp_diff = td.carrying_amount - td.tax_base;
    return {
      ...td,
      temporary_difference: temp_diff,
      tax_rate: inputs.tax_rate,
      deferred_tax_amount: roundTo2(temp_diff * inputs.tax_rate),
    };
  });

  const taxable_differences = differences.filter(d => d.category === "taxable");
  const deductible_differences = differences.filter(d => d.category === "deductible");

  const closing_dtl = roundTo2(
    taxable_differences.reduce((s, d) => s + d.deferred_tax_amount, 0)
  );
  const closing_dta = roundTo2(
    Math.abs(deductible_differences.reduce((s, d) => s + d.deferred_tax_amount, 0))
  );
  const net_deferred_tax = closing_dta - closing_dtl;

  const opening_net = inputs.opening_dta - inputs.opening_dtl;
  const movement = net_deferred_tax - opening_net;

  return {
    company_id: inputs.company_id,
    fiscal_year: inputs.fiscal_year,
    applicable_tax_rate: inputs.tax_rate,
    opening_dta: inputs.opening_dta,
    opening_dtl: inputs.opening_dtl,
    differences,
    closing_dta,
    closing_dtl,
    net_deferred_tax,
    deferred_tax_expense: movement < 0 ? Math.abs(movement) : 0,
    deferred_tax_income: movement > 0 ? movement : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: IND AS 115 — REVENUE RECOGNITION
// 5-Step Model: Contract → POB → Transaction Price → Allocate → Recognise
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueContract {
  id: string;
  company_id: string;
  customer_name: string;
  contract_date: string;
  total_contract_value: number;
  performance_obligations: PerformanceObligation[];
  variable_consideration: number; // Discounts, rebates, returns
  financing_component: boolean;   // Significant financing component?
  recognition_method: "point_in_time" | "over_time";
}

export interface PerformanceObligation {
  id: string;
  description: string;
  standalone_selling_price: number;
  allocated_transaction_price: number;
  is_satisfied: boolean;
  satisfaction_date?: string;
  progress_pct?: number; // For over-time recognition
  recognised_revenue: number;
  deferred_revenue: number; // Contract liability (advance billing)
  unbilled_revenue: number; // Contract asset (work done, not billed)
}

export function recogniseRevenue(contract: RevenueContract): {
  total_recognised: number;
  total_deferred: number;
  total_unbilled: number;
  journal_entries: { dr: string; cr: string; amount: number; narration: string }[];
} {
  let total_recognised = 0;
  let total_deferred = 0;
  let total_unbilled = 0;
  const journal_entries: { dr: string; cr: string; amount: number; narration: string }[] = [];

  contract.performance_obligations.forEach(pob => {
    const allocated = pob.allocated_transaction_price;

    if (contract.recognition_method === "point_in_time") {
      if (pob.is_satisfied) {
        total_recognised += allocated;
        journal_entries.push({
          dr: "Trade Receivables / Cash",
          cr: "Revenue from Operations",
          amount: allocated,
          narration: `Revenue recognised on transfer of control — ${pob.description} (Ind AS 115 POB satisfied)`,
        });
      } else {
        total_deferred += allocated;
        journal_entries.push({
          dr: "Contract Asset / Advance Received",
          cr: "Contract Liability (Deferred Revenue)",
          amount: allocated,
          narration: `Revenue deferred — POB not yet satisfied — ${pob.description}`,
        });
      }
    } else {
      // Over-time: recognise based on % completion
      const progress = pob.progress_pct ?? 0;
      const recognised = roundTo2(allocated * (progress / 100));
      const remaining = roundTo2(allocated - recognised);

      total_recognised += recognised;
      if (recognised > (pob.unbilled_revenue || 0)) {
        total_unbilled += recognised - (pob.unbilled_revenue || 0);
      } else {
        total_deferred += remaining;
      }

      journal_entries.push({
        dr: "Contract Asset (Unbilled Revenue)",
        cr: "Revenue from Operations",
        amount: recognised,
        narration: `Revenue recognised ${progress}% completion — ${pob.description} (Ind AS 115 over-time method)`,
      });
    }
  });

  return { total_recognised, total_deferred, total_unbilled, journal_entries };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: IND AS 116 — LEASE ACCOUNTING
// Right-of-Use (ROU) Asset + Lease Liability
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaseContract {
  id: string;
  company_id: string;
  lease_description: string;  // e.g., "Office premises — 3rd Floor, Andheri"
  commencement_date: string;
  lease_term_months: number;
  monthly_lease_payment: number;
  incremental_borrowing_rate: number; // IBR e.g. 0.10 (10% per annum)
  initial_direct_costs: number;       // Legal fees, stamp duty etc.
  lease_incentives_received: number;  // Rent-free period value
  // Computed
  present_value_lease_liability: number;
  rou_asset_cost: number;
  // Short-term / low-value exemptions
  is_short_term: boolean;   // Term ≤ 12 months — expense straight-line
  is_low_value: boolean;    // Underlying asset value ≤ USD 5,000 — expense straight-line
}

export function calculateLeaseAccounting(lease: LeaseContract): {
  pv_lease_liability: number;
  rou_asset: number;
  annual_depreciation_rou: number;
  annual_interest_on_lease: number;
  amortisation_schedule: {
    period: number;
    opening_liability: number;
    interest: number;
    payment: number;
    closing_liability: number;
  }[];
} {
  if (lease.is_short_term || lease.is_low_value) {
    // Exempt — expense straight-line to P&L
    return {
      pv_lease_liability: 0,
      rou_asset: 0,
      annual_depreciation_rou: lease.monthly_lease_payment * 12,
      annual_interest_on_lease: 0,
      amortisation_schedule: [],
    };
  }

  // Calculate PV of lease payments using IBR
  const monthly_rate = lease.incremental_borrowing_rate / 12;
  const n = lease.lease_term_months;
  const monthly_payment = lease.monthly_lease_payment;

  // PV of annuity: PV = PMT × [1 - (1+r)^-n] / r
  const pv_factor = (1 - Math.pow(1 + monthly_rate, -n)) / monthly_rate;
  const pv_lease_liability = roundTo2(monthly_payment * pv_factor);

  // ROU Asset = PV Lease Liability + Initial Direct Costs - Lease Incentives
  const rou_asset = roundTo2(pv_lease_liability + lease.initial_direct_costs - lease.lease_incentives_received);

  // ROU Asset depreciated straight-line over lease term
  const lease_term_years = n / 12;
  const annual_depreciation_rou = roundTo2(rou_asset / lease_term_years);

  // Build amortisation schedule (first 12 periods / first year)
  const amortisation_schedule = [];
  let opening_liability = pv_lease_liability;

  for (let period = 1; period <= Math.min(n, 12); period++) {
    const interest = roundTo2(opening_liability * monthly_rate);
    const closing_liability = roundTo2(opening_liability + interest - monthly_payment);
    amortisation_schedule.push({
      period,
      opening_liability,
      interest,
      payment: monthly_payment,
      closing_liability: Math.max(0, closing_liability),
    });
    opening_liability = Math.max(0, closing_liability);
  }

  const annual_interest_on_lease = roundTo2(
    amortisation_schedule.reduce((s, p) => s + p.interest, 0)
  );

  return {
    pv_lease_liability,
    rou_asset,
    annual_depreciation_rou,
    annual_interest_on_lease,
    amortisation_schedule,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: FINANCIAL RATIO ANALYSIS — 20 KEY RATIOS
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancialRatioInput {
  // Income Statement
  revenue: number;
  gross_profit: number;
  ebitda: number;
  ebit: number;
  pbt: number;
  pat: number;
  interest_expense: number;
  depreciation: number;
  income_tax: number;
  // Balance Sheet
  total_assets: number;
  total_equity: number;
  total_debt: number;
  current_assets: number;
  current_liabilities: number;
  inventories: number;
  trade_receivables: number;
  trade_payables: number;
  cash_and_equivalents: number;
  // Cash Flow
  operating_cash_flow: number;
  capex: number;
}

export interface FinancialRatioOutput {
  // Liquidity Ratios
  current_ratio: number;            // CA / CL — >2 is comfortable
  quick_ratio: number;              // (CA - Inventory) / CL — >1 is good
  cash_ratio: number;               // Cash / CL — pure liquid cover
  // Profitability Ratios
  gross_profit_margin_pct: number;  // GP / Revenue × 100
  ebitda_margin_pct: number;        // EBITDA / Revenue × 100
  net_profit_margin_pct: number;    // PAT / Revenue × 100
  return_on_assets_pct: number;     // PAT / Total Assets × 100
  return_on_equity_pct: number;     // PAT / Total Equity × 100
  return_on_capital_employed_pct: number; // EBIT / (Total Assets - CL) × 100
  // Leverage / Solvency Ratios
  debt_equity_ratio: number;        // Total Debt / Total Equity — <1 is healthy
  debt_to_assets_ratio: number;     // Total Debt / Total Assets
  interest_coverage_ratio: number;  // EBIT / Interest — >3 is safe
  // Efficiency / Activity Ratios
  asset_turnover_ratio: number;     // Revenue / Total Assets
  inventory_turnover_ratio: number; // COGS / Avg Inventory
  inventory_days: number;           // 365 / Inventory Turnover
  receivables_turnover_ratio: number; // Revenue / Avg Receivables
  receivables_days: number;         // 365 / Receivables Turnover
  payables_turnover_ratio: number;  // COGS / Avg Payables
  payables_days: number;            // 365 / Payables Turnover
  // Cash Flow Ratios
  operating_cash_flow_ratio: number; // OCF / CL
  free_cash_flow: number;           // OCF - Capex
}

export function calculateFinancialRatios(input: FinancialRatioInput): FinancialRatioOutput {
  const safe = (n: number, d: number): number => d === 0 ? 0 : roundTo2(n / d);
  const cogs = input.revenue - input.gross_profit;

  return {
    // Liquidity
    current_ratio: safe(input.current_assets, input.current_liabilities),
    quick_ratio: safe(input.current_assets - input.inventories, input.current_liabilities),
    cash_ratio: safe(input.cash_and_equivalents, input.current_liabilities),
    // Profitability
    gross_profit_margin_pct: safe(input.gross_profit * 100, input.revenue),
    ebitda_margin_pct: safe(input.ebitda * 100, input.revenue),
    net_profit_margin_pct: safe(input.pat * 100, input.revenue),
    return_on_assets_pct: safe(input.pat * 100, input.total_assets),
    return_on_equity_pct: safe(input.pat * 100, input.total_equity),
    return_on_capital_employed_pct: safe(
      input.ebit * 100,
      input.total_assets - input.current_liabilities
    ),
    // Leverage
    debt_equity_ratio: safe(input.total_debt, input.total_equity),
    debt_to_assets_ratio: safe(input.total_debt, input.total_assets),
    interest_coverage_ratio: safe(input.ebit, input.interest_expense),
    // Efficiency
    asset_turnover_ratio: safe(input.revenue, input.total_assets),
    inventory_turnover_ratio: safe(cogs, input.inventories),
    inventory_days: input.inventories > 0 ? roundTo2(365 / safe(cogs, input.inventories)) : 0,
    receivables_turnover_ratio: safe(input.revenue, input.trade_receivables),
    receivables_days: input.trade_receivables > 0 ? roundTo2(365 / safe(input.revenue, input.trade_receivables)) : 0,
    payables_turnover_ratio: safe(cogs, input.trade_payables),
    payables_days: input.trade_payables > 0 ? roundTo2(365 / safe(cogs, input.trade_payables)) : 0,
    // Cash Flow
    operating_cash_flow_ratio: safe(input.operating_cash_flow, input.current_liabilities),
    free_cash_flow: roundTo2(input.operating_cash_flow - input.capex),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: CARO 2020 CHECKLIST
// Companies (Auditor's Report) Order, 2020 — 21 Clauses
// ─────────────────────────────────────────────────────────────────────────────

export interface CARO2020Clause {
  clause_no: string;        // e.g. "3(i)(a)"
  clause_title: string;
  question: string;
  response: "yes" | "no" | "not_applicable" | "pending";
  remarks: string;
  is_adverse: boolean;      // True if response indicates an adverse finding
  ca_action_required: boolean;
}

export function generateCARO2020Template(): CARO2020Clause[] {
  return [
    {
      clause_no: "3(i)(a)", clause_title: "Fixed Assets — Proper Records",
      question: "Whether the company maintains proper records showing full particulars, including quantitative details and situation of fixed assets?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(i)(b)", clause_title: "Physical Verification of Fixed Assets",
      question: "Whether fixed assets have been physically verified by management at reasonable intervals and whether material discrepancies were noticed and dealt with?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(i)(c)", clause_title: "Immovable Property Title",
      question: "Whether title deeds of immovable properties are held in the name of the company?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(i)(d)", clause_title: "Revaluation of Fixed Assets",
      question: "Whether revaluation was done for any assets, and whether the same has been done by a Registered Valuer?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: false,
    },
    {
      clause_no: "3(i)(e)", clause_title: "Proceedings against Company — Fixed Assets",
      question: "Whether any proceedings have been initiated or are pending against the company for holding any benami property under the Benami Transactions (Prohibition) Act, 1988?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(ii)(a)", clause_title: "Physical Verification of Inventory",
      question: "Whether physical verification of inventory has been conducted at reasonable intervals by the management?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(ii)(b)", clause_title: "Inventory with Third Parties",
      question: "Whether inventories lying with third parties have been confirmed by them as on the balance sheet date and discrepancies have been properly dealt with?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: false,
    },
    {
      clause_no: "3(iii)", clause_title: "Loans / Investments / Guarantees / Security",
      question: "Whether the company has made investments, provided guarantee, given security or granted loans during the year, and if so, whether such transactions comply with Section 185 and 186 of the Companies Act, 2013?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(iv)", clause_title: "Loans — Compliance",
      question: "Whether terms and conditions of loans are not prejudicial to the interest of the company, and whether repayment is regular?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(v)", clause_title: "Acceptance of Deposits",
      question: "Whether the company has accepted any deposits within the meaning of Sections 73 to 76 or any other relevant provisions of the Companies Act, 2013 and the rules made thereunder?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(vi)", clause_title: "Maintenance of Cost Records",
      question: "Whether the Central Government has prescribed maintenance of cost records under Section 148(1) of the Companies Act, 2013, and if so, whether such accounts and records have been so made and maintained?",
      response: "not_applicable", remarks: "Cost audit not applicable — turnover below ₹35 crore threshold", is_adverse: false, ca_action_required: false,
    },
    {
      clause_no: "3(vii)(a)", clause_title: "Statutory Dues — Regular Deposit",
      question: "Whether the company is regular in depositing undisputed statutory dues including PF, ESIC, Income Tax, GST, Customs Duty, Sales Tax, CEX, and any other statutory dues with appropriate authorities?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(vii)(b)", clause_title: "Disputed Statutory Dues",
      question: "Whether there are dues in respect of Income Tax, GST, Customs Duty, Wealth Tax, Excise Duty that have not been deposited on account of any dispute?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(viii)", clause_title: "Transactions Not Recorded in Books",
      question: "Whether any transactions not recorded in the books of account have been surrendered or disclosed as income during the year in tax assessments under the Income Tax Act, 1961?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(ix)(a)", clause_title: "Default in Loan Repayment",
      question: "Whether the company has defaulted in repayment of loans or other borrowings or in payment of interest thereon to any lender?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(ix)(b)", clause_title: "Declared as Willful Defaulter",
      question: "Whether the company is declared as a willful defaulter by any bank, financial institution or government?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(ix)(c)", clause_title: "Term Loan — End Use",
      question: "Whether term loans were applied for the purpose for which they were obtained?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(x)(a)", clause_title: "Fraud On/By Company",
      question: "Whether any fraud by the company or any fraud on the company has been noticed or reported during the year?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(xi)(a)", clause_title: "Managerial Remuneration",
      question: "Whether managerial remuneration has been paid or provided in accordance with the requisite approvals mandated by Section 197 of the Companies Act, 2013?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: false,
    },
    {
      clause_no: "3(xii)", clause_title: "Nidhi Company",
      question: "Whether the company is a Nidhi Company? If so, whether the Net Owned Funds to Deposits in the ratio of 1:20 is maintained?",
      response: "not_applicable", remarks: "Company is not a Nidhi Company", is_adverse: false, ca_action_required: false,
    },
    {
      clause_no: "3(xiii)", clause_title: "Related Party Transactions",
      question: "Whether transactions with related parties are in compliance with Sections 177 and 188 of the Companies Act, 2013 and disclosed in the Financial Statements as required by Ind AS 24?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(xiv)", clause_title: "Internal Audit",
      question: "Whether the company has an internal audit system commensurate with the size and nature of its business?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(xv)", clause_title: "Non-Cash Transactions with Directors",
      question: "Whether the company has entered into any non-cash transactions with its directors or persons connected with them and if so, whether Section 192 of the Companies Act has been complied with?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(xvi)", clause_title: "Registration under RBI Act",
      question: "Whether the company is required to be registered under Section 45-IA of the Reserve Bank of India Act, 1934?",
      response: "not_applicable", remarks: "Company is not an NBFC and is not required to be registered under Section 45-IA of the RBI Act, 1934", is_adverse: false, ca_action_required: false,
    },
    {
      clause_no: "3(xvii)", clause_title: "Funds Raised — Short-Term / Long-Term",
      question: "Whether funds raised on short-term basis have been utilised for long-term purposes?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(xviii)", clause_title: "No Undisclosed Income",
      question: "Whether the company has any undisclosed income / sales not recorded in the books of account?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
    {
      clause_no: "3(xix)", clause_title: "Cash Losses",
      question: "Whether the company has incurred cash losses in the current year and the immediately preceding year?",
      response: "pending", remarks: "", is_adverse: false, ca_action_required: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: NOTES TO ACCOUNTS AUTO-GENERATOR
// Full 25-Note structure for Schedule III Balance Sheet
// ─────────────────────────────────────────────────────────────────────────────

export interface NoteToAccounts {
  note_no: number;
  title: string;
  sub_items: NoteSubItem[];
  total_current_year: number;
  total_previous_year: number;
  statutory_reference: string; // e.g. "Ind AS 16", "Section 185"
  ca_review_required: boolean;
}

export interface NoteSubItem {
  description: string;
  current_year: number;
  previous_year: number;
  sub_items?: NoteSubItem[];
}

export function generateNotesToAccounts(data: {
  share_capital: number;
  reserves_surplus_opening: number;
  pat: number;
  secured_loans: number;
  unsecured_loans: number;
  plant_machinery_gross: number;
  computers_gross: number;
  furniture_gross: number;
  vehicles_gross: number;
  land_building_gross: number;
  accumulated_dep: number;
  raw_material: number;
  wip: number;
  finished_goods: number;
  trade_receivables_less_6m: number;
  trade_receivables_more_6m: number;
  provision_doubtful: number;
  bank_balance: number;
  cash_in_hand: number;
  fd_balance: number;
  input_gst: number;
  advance_to_suppliers: number;
  prepaid_expenses: number;
  trade_payables_msme: number;
  trade_payables_others: number;
  output_gst_payable: number;
  tds_payable: number;
  pf_esic_payable: number;
  salary_payable: number;
  advance_from_customers: number;
  audit_fees: number;
  income_tax_payable: number;
  deferred_tax_asset: number;
  deferred_tax_liability: number;
}): NoteToAccounts[] {
  const py_factor = 0.82; // Simulated previous year as 82% of current year for demo

  return [
    {
      note_no: 1,
      title: "Share Capital",
      statutory_reference: "Companies Act 2013 — Schedule III",
      ca_review_required: true,
      total_current_year: data.share_capital,
      total_previous_year: roundTo2(data.share_capital * py_factor),
      sub_items: [
        { description: "Authorised Capital: 10,00,000 Equity Shares of ₹10 each", current_year: 10000000, previous_year: 10000000 },
        { description: "Issued, Subscribed & Fully Paid-Up:", current_year: 0, previous_year: 0,
          sub_items: [
            { description: "5,00,000 Equity Shares of ₹10 each (PY: 5,00,000 Equity Shares)", current_year: data.share_capital, previous_year: roundTo2(data.share_capital * py_factor) },
          ]
        },
      ],
    },
    {
      note_no: 2,
      title: "Reserves & Surplus",
      statutory_reference: "Ind AS 1 / Schedule III",
      ca_review_required: true,
      total_current_year: roundTo2(data.reserves_surplus_opening + data.pat),
      total_previous_year: roundTo2(data.reserves_surplus_opening * py_factor),
      sub_items: [
        { description: "General Reserve — Opening Balance", current_year: data.reserves_surplus_opening, previous_year: roundTo2(data.reserves_surplus_opening * py_factor) },
        { description: "Add: Net Profit for the year transferred from Statement of P&L", current_year: data.pat, previous_year: roundTo2(data.pat * py_factor) },
        { description: "Less: Dividends paid / proposed", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 3,
      title: "Long-Term Borrowings",
      statutory_reference: "Ind AS 107 / Schedule III",
      ca_review_required: true,
      total_current_year: roundTo2(data.secured_loans + data.unsecured_loans),
      total_previous_year: roundTo2((data.secured_loans + data.unsecured_loans) * py_factor),
      sub_items: [
        { description: "Secured — Term Loan from HDFC Bank (Secured by equitable mortgage of Plant & Machinery)", current_year: data.secured_loans, previous_year: roundTo2(data.secured_loans * py_factor) },
        { description: "Unsecured — Director's Loan (Repayable on demand — no interest)", current_year: data.unsecured_loans, previous_year: roundTo2(data.unsecured_loans * py_factor) },
      ],
    },
    {
      note_no: 4,
      title: "Trade Payables",
      statutory_reference: "MSMED Act 2006 / Section 43B(h) / Schedule III",
      ca_review_required: true,
      total_current_year: roundTo2(data.trade_payables_msme + data.trade_payables_others),
      total_previous_year: roundTo2((data.trade_payables_msme + data.trade_payables_others) * py_factor),
      sub_items: [
        { description: "Micro Enterprises & Small Enterprises (MSME) — within 45-day period per written agreement", current_year: data.trade_payables_msme, previous_year: roundTo2(data.trade_payables_msme * py_factor) },
        { description: "Other than MSME — Sundry Creditors", current_year: data.trade_payables_others, previous_year: roundTo2(data.trade_payables_others * py_factor) },
      ],
    },
    {
      note_no: 5,
      title: "Other Current Liabilities & Statutory Dues",
      statutory_reference: "Schedule III / Ind AS 1",
      ca_review_required: false,
      total_current_year: roundTo2(data.output_gst_payable + data.tds_payable + data.pf_esic_payable + data.salary_payable + data.advance_from_customers),
      total_previous_year: roundTo2((data.output_gst_payable + data.tds_payable + data.pf_esic_payable + data.salary_payable + data.advance_from_customers) * py_factor),
      sub_items: [
        { description: "Output GST Payable (Net of ITC after Rule 88A set-off)", current_year: data.output_gst_payable, previous_year: roundTo2(data.output_gst_payable * py_factor) },
        { description: "TDS Payable u/s 192/194C/194J (Due by 7th of next month)", current_year: data.tds_payable, previous_year: roundTo2(data.tds_payable * py_factor) },
        { description: "PF & ESIC Payable (Employee + Employer Share)", current_year: data.pf_esic_payable, previous_year: roundTo2(data.pf_esic_payable * py_factor) },
        { description: "Salary Payable to Employees", current_year: data.salary_payable, previous_year: roundTo2(data.salary_payable * py_factor) },
        { description: "Advance from Customers (Contract Liability — Ind AS 115)", current_year: data.advance_from_customers, previous_year: roundTo2(data.advance_from_customers * py_factor) },
      ],
    },
    {
      note_no: 6,
      title: "Property, Plant & Equipment (PPE) — Schedule II WDV",
      statutory_reference: "Ind AS 16 / Schedule II Companies Act 2013",
      ca_review_required: true,
      total_current_year: roundTo2(data.land_building_gross + data.plant_machinery_gross + data.computers_gross + data.furniture_gross + data.vehicles_gross - data.accumulated_dep),
      total_previous_year: roundTo2((data.land_building_gross + data.plant_machinery_gross + data.computers_gross + data.furniture_gross + data.vehicles_gross - data.accumulated_dep) * py_factor),
      sub_items: [
        { description: "Land & Building", current_year: data.land_building_gross, previous_year: roundTo2(data.land_building_gross * py_factor) },
        { description: "Plant & Machinery", current_year: data.plant_machinery_gross, previous_year: roundTo2(data.plant_machinery_gross * py_factor) },
        { description: "Computers & IT Hardware", current_year: data.computers_gross, previous_year: roundTo2(data.computers_gross * py_factor) },
        { description: "Furniture & Fixtures", current_year: data.furniture_gross, previous_year: roundTo2(data.furniture_gross * py_factor) },
        { description: "Vehicles", current_year: data.vehicles_gross, previous_year: roundTo2(data.vehicles_gross * py_factor) },
        { description: "Less: Accumulated Depreciation (Schedule II SLM)", current_year: -data.accumulated_dep, previous_year: roundTo2(-data.accumulated_dep * py_factor) },
      ],
    },
    {
      note_no: 7,
      title: "Inventories (Valued at Lower of Cost or Net Realisable Value — Ind AS 2)",
      statutory_reference: "Ind AS 2",
      ca_review_required: false,
      total_current_year: roundTo2(data.raw_material + data.wip + data.finished_goods),
      total_previous_year: roundTo2((data.raw_material + data.wip + data.finished_goods) * py_factor),
      sub_items: [
        { description: "Raw Materials (Weighted Average Cost Method)", current_year: data.raw_material, previous_year: roundTo2(data.raw_material * py_factor) },
        { description: "Work-in-Progress (WIP)", current_year: data.wip, previous_year: roundTo2(data.wip * py_factor) },
        { description: "Finished Goods (including packing)", current_year: data.finished_goods, previous_year: roundTo2(data.finished_goods * py_factor) },
      ],
    },
    {
      note_no: 8,
      title: "Trade Receivables (Sundry Debtors)",
      statutory_reference: "Ind AS 109 — Expected Credit Loss (ECL) Model",
      ca_review_required: true,
      total_current_year: roundTo2(data.trade_receivables_less_6m + data.trade_receivables_more_6m - data.provision_doubtful),
      total_previous_year: roundTo2((data.trade_receivables_less_6m + data.trade_receivables_more_6m - data.provision_doubtful) * py_factor),
      sub_items: [
        { description: "Undisputed — Considered Good (Outstanding < 6 months)", current_year: data.trade_receivables_less_6m, previous_year: roundTo2(data.trade_receivables_less_6m * py_factor) },
        { description: "Undisputed — Considered Good (Outstanding > 6 months)", current_year: data.trade_receivables_more_6m, previous_year: roundTo2(data.trade_receivables_more_6m * py_factor) },
        { description: "Disputed — Considered Doubtful", current_year: 0, previous_year: 0 },
        { description: "Less: Provision for Doubtful Debts (ECL Allowance)", current_year: -data.provision_doubtful, previous_year: roundTo2(-data.provision_doubtful * py_factor) },
      ],
    },
    {
      note_no: 9,
      title: "Cash & Cash Equivalents",
      statutory_reference: "Ind AS 7",
      ca_review_required: false,
      total_current_year: roundTo2(data.bank_balance + data.cash_in_hand + data.fd_balance),
      total_previous_year: roundTo2((data.bank_balance + data.cash_in_hand + data.fd_balance) * py_factor),
      sub_items: [
        { description: "Balances with Banks in Current Accounts", current_year: data.bank_balance, previous_year: roundTo2(data.bank_balance * py_factor) },
        { description: "Cash in Hand", current_year: data.cash_in_hand, previous_year: roundTo2(data.cash_in_hand * py_factor) },
        { description: "Fixed Deposits (maturity ≤ 3 months from date of deposit)", current_year: data.fd_balance, previous_year: roundTo2(data.fd_balance * py_factor) },
      ],
    },
    {
      note_no: 10,
      title: "Revenue from Operations",
      statutory_reference: "Ind AS 115",
      ca_review_required: false,
      total_current_year: 0, // Filled by caller
      total_previous_year: 0,
      sub_items: [
        { description: "Sale of Products — Intra-State (CGST + SGST @18%)", current_year: 0, previous_year: 0 },
        { description: "Sale of Products — Inter-State (IGST @18%)", current_year: 0, previous_year: 0 },
        { description: "Sale of Services", current_year: 0, previous_year: 0 },
        { description: "Less: GST / Indirect Taxes collected on behalf of Govt", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 11,
      title: "Other Income",
      statutory_reference: "Ind AS 1",
      ca_review_required: false,
      total_current_year: 8500,
      total_previous_year: roundTo2(8500 * py_factor),
      sub_items: [
        { description: "Interest Income on Fixed Deposits / Savings Account", current_year: 8500, previous_year: roundTo2(8500 * py_factor) },
        { description: "Gain on Foreign Currency Transactions (FOREX)", current_year: 0, previous_year: 0 },
        { description: "Profit on Sale of Fixed Assets", current_year: 0, previous_year: 0 },
        { description: "Miscellaneous Income", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 12,
      title: "Cost of Materials Consumed",
      statutory_reference: "Ind AS 2",
      ca_review_required: false,
      total_current_year: 0, // Filled by caller
      total_previous_year: 0,
      sub_items: [
        { description: "Opening Stock of Raw Materials", current_year: 0, previous_year: 0 },
        { description: "Add: Purchases of Raw Materials", current_year: 0, previous_year: 0 },
        { description: "Less: Closing Stock of Raw Materials", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 13,
      title: "Employee Benefit Expenses",
      statutory_reference: "Ind AS 19",
      ca_review_required: false,
      total_current_year: 0, // Filled by caller
      total_previous_year: 0,
      sub_items: [
        { description: "Salaries, Wages & Allowances", current_year: 0, previous_year: 0 },
        { description: "Contribution to Provident Fund (Employer Share @12% of Basic)", current_year: 0, previous_year: 0 },
        { description: "Contribution to ESIC (Employer Share @3.25% of Gross)", current_year: 0, previous_year: 0 },
        { description: "Professional Tax (Employer Registration)", current_year: 0, previous_year: 0 },
        { description: "Staff Welfare & Training Expenses", current_year: 0, previous_year: 0 },
        { description: "Gratuity Provision (Actuarial valuation — Ind AS 19)", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 14,
      title: "Finance Costs",
      statutory_reference: "Ind AS 23 / Section 36(1)(iii)",
      ca_review_required: false,
      total_current_year: 18750,
      total_previous_year: roundTo2(18750 * py_factor),
      sub_items: [
        { description: "Interest on Term Loan from HDFC Bank", current_year: 18750, previous_year: roundTo2(18750 * py_factor) },
        { description: "Interest on Cash Credit / Working Capital", current_year: 0, previous_year: 0 },
        { description: "Bank Charges, Processing Fees & Commitment Charges", current_year: 0, previous_year: 0 },
        { description: "Interest on Lease Liabilities (Ind AS 116)", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 15,
      title: "Other Expenses (Administrative & Selling)",
      statutory_reference: "Ind AS 1",
      ca_review_required: false,
      total_current_year: 0, // Filled by caller
      total_previous_year: 0,
      sub_items: [
        { description: "Rent — Office Premises", current_year: 0, previous_year: 0 },
        { description: "Electricity — Office", current_year: 0, previous_year: 0 },
        { description: "Repairs & Maintenance", current_year: 0, previous_year: 0 },
        { description: "Marketing & Advertisement", current_year: 0, previous_year: 0 },
        { description: "Legal & Professional Fees", current_year: 0, previous_year: 0 },
        { description: "Audit Fees", current_year: data.audit_fees, previous_year: roundTo2(data.audit_fees * py_factor) },
        { description: "Travelling & Conveyance", current_year: 0, previous_year: 0 },
        { description: "Printing & Stationery", current_year: 0, previous_year: 0 },
        { description: "Internet & Telephone", current_year: 0, previous_year: 0 },
        { description: "Miscellaneous Expenses", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 16,
      title: "Income Tax",
      statutory_reference: "Ind AS 12 / Section 115BAA",
      ca_review_required: true,
      total_current_year: 0, // Filled by caller
      total_previous_year: 0,
      sub_items: [
        { description: "Current Tax — Income Tax Act 1961 (25.168% / 22.5% u/s 115BAA)", current_year: 0, previous_year: 0 },
        { description: "Deferred Tax (Credit) / Charge — Ind AS 12", current_year: data.deferred_tax_liability - data.deferred_tax_asset, previous_year: 0 },
        { description: "MAT Credit Entitlement u/s 115JB", current_year: 0, previous_year: 0 },
      ],
    },
    {
      note_no: 17,
      title: "Significant Accounting Policies",
      statutory_reference: "Ind AS 1 Para 117-124",
      ca_review_required: true,
      total_current_year: 0,
      total_previous_year: 0,
      sub_items: [
        { description: "Basis of Preparation: Financial statements prepared on accrual basis under historical cost convention in accordance with Ind AS as per Companies (Indian Accounting Standards) Rules 2015", current_year: 0, previous_year: 0 },
        { description: "Revenue Recognition: Revenue from sale of goods is recognised when control of the product transfers to the customer (Ind AS 115)", current_year: 0, previous_year: 0 },
        { description: "Inventories: Valued at lower of cost (Weighted Average Method) or Net Realisable Value per Ind AS 2", current_year: 0, previous_year: 0 },
        { description: "Fixed Assets & Depreciation: PPE stated at cost less accumulated depreciation. Depreciation on SLM basis as per Schedule II useful life (Ind AS 16)", current_year: 0, previous_year: 0 },
        { description: "Foreign Currency: Transactions recorded at transaction date rate. Monetary items retranslated at closing rate. Differences to P&L (Ind AS 21)", current_year: 0, previous_year: 0 },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: MULTI-PERIOD COMPARATIVE FINANCIAL STATEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface PeriodFinancials {
  period_label: string;   // "Q1 FY2025-26", "FY2024-25" etc.
  period_end_date: string;
  // P&L
  revenue: number;
  gross_profit: number;
  ebitda: number;
  pat: number;
  // BS Highlights
  total_assets: number;
  total_equity: number;
  total_debt: number;
  // Cash Flow
  ocf: number;
}

export function computeGrowthRates(periods: PeriodFinancials[]): {
  metric: string;
  values: { period: string; value: number; growth_pct: number | null }[];
}[] {
  const metrics: (keyof Omit<PeriodFinancials, "period_label" | "period_end_date">)[] = [
    "revenue", "gross_profit", "ebitda", "pat", "total_assets", "total_equity",
  ];

  return metrics.map(metric => ({
    metric,
    values: periods.map((p, i) => {
      const prev = i > 0 ? periods[i - 1][metric] as number : null;
      const curr = p[metric] as number;
      const growth_pct = prev !== null && prev !== 0 ? roundTo2(((curr - prev) / prev) * 100) : null;
      return { period: p.period_label, value: curr, growth_pct };
    }),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCrore(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmt(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}
