/**
 * DEMO DATA — ADVANCED CFO INTELLIGENCE & VIRTUAL CFO AI
 * =========================================================
 * Populates 90-day predictive cash flow, 4 What-If scenarios,
 * Altman Z-Score, Beneish M-Score, DuPont Analysis, Working Capital / CCC,
 * EBITDA Waterfall, CFO Health Scorecard, and Board Report Draft.
 */

import {
  simulateScenario, computeAltmanZScore, computeBeneishMScore,
  computeDuPontAnalysis, computeWorkingCapitalMetrics, computeEBITDABridge,
  computeCFOHealthScore, generateBoardReport,
  type CashForecastDay, type ScenarioInput, type ScenarioOutput,
  type AltmanZScore, type BeneishMScore, type DuPontAnalysis,
  type CashConversionCycle, type EBITDABridge, type CFOHealthScorecard,
  type BoardReportDraft,
} from "@/lib/accounting/cfo-intelligence-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: 90-DAY PREDICTIVE CASH FLOW (Daily projection for next 90 days)
// ─────────────────────────────────────────────────────────────────────────────

const CURRENT_CASH_BALANCE = 18500000; // ₹1.85 Cr in Bank

export function generate90DayCashForecast(startingCash: number = CURRENT_CASH_BALANCE): CashForecastDay[] {
  const forecast: CashForecastDay[] = [];
  let runningCash = startingCash;
  const startDate = new Date(2025, 9, 1); // Oct 1, 2025

  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();

    // Standard business collections & payables pattern
    let debtorsInflow = 0;
    let otherInflow = 0;
    let creditorsOutflow = 0;
    let payrollOutflow = 0;
    let taxOutflow = 0;
    let opexOutflow = 0;

    // Collections peak on Mondays & Thursdays
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      debtorsInflow = 1250000 + (i % 5) * 80000;
    } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      debtorsInflow = 350000 + (i % 3) * 40000;
    }

    // Weekly supplier payables on Fridays
    if (dayOfWeek === 5) {
      creditorsOutflow = 980000 + (i % 4) * 60000;
    } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      creditorsOutflow = 220000;
    }

    // Payroll on 1st of month
    if (d.getDate() === 1) {
      payrollOutflow = 4200000; // ₹42L payroll
    }

    // GST/TDS tax payment on 20th & 7th of month
    if (d.getDate() === 20) {
      taxOutflow = 1850000; // GST GSTR-3B payment
    } else if (d.getDate() === 7) {
      taxOutflow = 620000;  // TDS payment
    }

    // Daily OpEx
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      opexOutflow = 85000;
    }

    const net = debtorsInflow + otherInflow - (creditorsOutflow + payrollOutflow + taxOutflow + opexOutflow);
    const closing = runningCash + net;

    forecast.push({
      date: dateStr,
      day_label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      opening_balance: Math.round(runningCash),
      expected_inflows_debtors: Math.round(debtorsInflow),
      expected_inflows_other: Math.round(otherInflow),
      expected_outflows_creditors: Math.round(creditorsOutflow),
      expected_outflows_payroll: Math.round(payrollOutflow),
      expected_outflows_tax: Math.round(taxOutflow),
      expected_outflows_opex: Math.round(opexOutflow),
      net_cash_flow: Math.round(net),
      closing_balance: Math.round(closing),
      liquidity_status: closing > 10000000 ? "SAFE" : closing > 3000000 ? "TIGHT" : "DEFICIT",
    });

    runningCash = closing;
  }

  return forecast;
}

export const DEMO_CASH_FORECAST = generate90DayCashForecast();

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: WHAT-IF SCENARIOS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_SCENARIO_INPUTS: ScenarioInput[] = [
  {
    id: "SCEN-001",
    name: "Top 2 Clients Delay Payment by 30 Days",
    description: "Simulates cash runway impact if top enterprise clients delay invoice clearing by 30 days due to quarter-end approval cycles.",
    debtor_delay_days: 30,
    revenue_drop_pct: 0,
    capex_spend_inr: 0,
    hiring_count: 0,
    avg_salary_per_emp_monthly: 0,
    price_increase_pct: 0,
  },
  {
    id: "SCEN-002",
    name: "₹50L CapEx Machinery Purchase in Nov 2025",
    description: "Simulates purchasing new CNC machinery with ₹50L upfront cash payment.",
    debtor_delay_days: 0,
    revenue_drop_pct: 0,
    capex_spend_inr: 5000000,
    hiring_count: 0,
    avg_salary_per_emp_monthly: 0,
    price_increase_pct: 0,
  },
  {
    id: "SCEN-003",
    name: "15% Sales Slump + 10 Senior Engineers Hired",
    description: "Stress test combining a 15% revenue drop with aggressive hiring of 10 senior engineers @ ₹1.2L/month each.",
    debtor_delay_days: 0,
    revenue_drop_pct: 15,
    capex_spend_inr: 0,
    hiring_count: 10,
    avg_salary_per_emp_monthly: 120000,
    price_increase_pct: 0,
  },
  {
    id: "SCEN-004",
    name: "5% Price Increase Across Product Catalog",
    description: "Optimistic scenario testing a 5% baseline price increase without customer churn.",
    debtor_delay_days: 0,
    revenue_drop_pct: 0,
    capex_spend_inr: 0,
    hiring_count: 0,
    avg_salary_per_emp_monthly: 0,
    price_increase_pct: 5,
  },
];

export const DEMO_SCENARIO_OUTPUTS: ScenarioOutput[] = DEMO_SCENARIO_INPUTS.map(scen =>
  simulateScenario(DEMO_CASH_FORECAST, scen, CURRENT_CASH_BALANCE)
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: ALTMAN Z-SCORE (SOLVENCY)
// ─────────────────────────────────────────────────────────────────────────────

// Balance Sheet & P&L Parameters for Sannidh Technologies:
// Working Cap = ₹4.2Cr, Retained Earnings = ₹6.8Cr, EBIT = ₹2.85Cr,
// Market Value Equity = ₹35Cr, Total Liabilities = ₹12Cr, Sales = ₹24.5Cr, Total Assets = ₹18Cr
export const DEMO_ALTMAN_ZSCORE: AltmanZScore = computeAltmanZScore(
  42000000,   // Working Capital
  68000000,   // Retained Earnings
  28500000,   // EBIT
  350000000,  // Market Value of Equity
  120000000,  // Total Liabilities
  245000000,  // Sales
  180000000,  // Total Assets
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: BENEISH M-SCORE (FORENSIC EARNINGS QUALITY)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_BENEISH_MSCORE: BeneishMScore = computeBeneishMScore({
  dsri: 1.05,  // Days Sales in Receivables Index (1.05 = healthy)
  gmi:  0.98,  // Gross Margin Index
  aqi:  1.02,  // Asset Quality Index
  sgi:  1.18,  // Sales Growth Index (18% growth)
  depi: 0.96,  // Depreciation Index
  sgai: 1.01,  // SGA Expense Index
  lvgi: 0.94,  // Leverage Index
  tata: 0.02,  // Total Accruals to Total Assets (2% low accrual risk)
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: DUPONT ANALYSIS (3-POINT & 5-POINT ROE)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_DUPONT_ANALYSIS: DuPontAnalysis = computeDuPontAnalysis(
  21000000,   // PAT (Net Profit) ₹2.1Cr
  245000000,  // Sales ₹24.5Cr
  180000000,  // Total Assets ₹18Cr
  105000000,  // Shareholders' Equity ₹10.5Cr
  28500000,   // EBIT ₹2.85Cr
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: WORKING CAPITAL & CASH CONVERSION CYCLE (CCC)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_WORKING_CAPITAL_CCC: CashConversionCycle = computeWorkingCapitalMetrics(
  28200000,   // Debtors ₹2.82Cr
  245000000,  // Sales ₹24.5Cr
  14100000,   // Inventory ₹1.41Cr
  147000000,  // COGS ₹14.7Cr
  16800000,   // Creditors ₹1.68Cr
  140000000,  // Purchases ₹14Cr
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: EBITDA WATERFALL & PROFITABILITY BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_EBITDA_BRIDGE: EBITDABridge = computeEBITDABridge({
  gross_sales: 250000000,  // ₹25 Cr
  discounts:   5000000,    // ₹50L discounts
  cogs:        147000000,  // ₹14.7 Cr
  payroll:     48000000,   // ₹4.8 Cr
  marketing:   12000000,   // ₹1.2 Cr
  admin:       9500000,    // ₹95L
  depreciation:4500000,    // ₹45L
  interest:    3000000,    // ₹30L
  tax:         7000000,    // ₹70L
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: OVERALL CFO HEALTH SCORECARD
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CFO_HEALTH_SCORECARD: CFOHealthScorecard = computeCFOHealthScore(
  DEMO_ALTMAN_ZSCORE,
  DEMO_BENEISH_MSCORE,
  DEMO_DUPONT_ANALYSIS,
  DEMO_WORKING_CAPITAL_CCC,
  DEMO_EBITDA_BRIDGE,
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: EXECUTIVE BOARD REPORT DRAFT
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_BOARD_REPORT_DRAFT: BoardReportDraft = generateBoardReport(
  "Sannidh Technologies Pvt. Ltd.",
  "FY 2025-26 (Q2 Review)",
  DEMO_CFO_HEALTH_SCORECARD,
  DEMO_EBITDA_BRIDGE,
  DEMO_ALTMAN_ZSCORE,
);
