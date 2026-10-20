/**
 * DEMO DATA — ADVANCED CFO INTELLIGENCE & VIRTUAL CFO AI
 * =========================================================
 * ALL numbers aligned to: Sannidh Demo Co. Pvt. Ltd.
 * Revenue: Rs 10 Cr | Purchases: Rs 6.10 Cr | Net PBT: Rs 1 Cr
 * Bank: Rs 1.85 Cr | FY 2025-26 | Manufacturing & Trading | Maharashtra
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
// SECTION 1: 90-DAY PREDICTIVE CASH FLOW
// Based on Rs 10 Cr annual revenue => Rs 83.3L/month avg inflow
// ─────────────────────────────────────────────────────────────────────────────

const CURRENT_CASH_BALANCE = 18500000; // Rs 1.85 Cr — matches DEMO_COMPANY bank_balance

export function generate90DayCashForecast(startingCash: number = CURRENT_CASH_BALANCE): CashForecastDay[] {
  const forecast: CashForecastDay[] = [];
  let runningCash = startingCash;
  const startDate = new Date(2025, 9, 1); // Oct 1, 2025

  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();

    let debtorsInflow = 0;
    let otherInflow = 0;
    let creditorsOutflow = 0;
    let payrollOutflow = 0;
    let taxOutflow = 0;
    let opexOutflow = 0;

    // Collections: Rs 10 Cr annual => Rs 83.3L/month => Rs 19.2L/week
    // Peak on Mon & Thu (payment processing days)
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      debtorsInflow = 1500000 + (i % 5) * 100000; // Rs 15L-20L on peak days
    } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      debtorsInflow = 450000 + (i % 3) * 50000;   // Rs 4.5L-6L on normal days
    }

    // Supplier payments: Rs 6.10 Cr annual => Rs 50.8L/month
    // Weekly on Fridays (major payments) + daily small outflows
    if (dayOfWeek === 5) {
      creditorsOutflow = 1200000 + (i % 4) * 80000; // Rs 12L-14.4L on Fridays
    } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      creditorsOutflow = 280000; // Rs 2.8L daily routine (utilities, freight etc.)
    }

    // Payroll on 1st of month: 32 employees @ avg Rs 27,344/month = Rs 8.75L
    if (d.getDate() === 1) {
      payrollOutflow = 875000;
    }

    // GST on 20th: Output Rs 1.80 Cr - ITC Rs 1.044 Cr = Rs 75.6L net annual => Rs 6.3L/month
    // TDS on 7th: Rs 57,500 as per accounting data
    if (d.getDate() === 20) {
      taxOutflow = 630000; // GSTR-3B net GST payment Rs 6.3L/month
    } else if (d.getDate() === 7) {
      taxOutflow = 57500;  // TDS deposit
    }

    // Daily OpEx: Rs 2.90 Cr total annual opex / 250 working days = Rs 1.16L/day
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      opexOutflow = 116000;
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
    description: "Simulates cash runway impact if Beta Retail & Gamma Wholesale delay clearing by 30 days (Rs 3.89 Cr stuck).",
    debtor_delay_days: 30,
    revenue_drop_pct: 0,
    capex_spend_inr: 0,
    hiring_count: 0,
    avg_salary_per_emp_monthly: 0,
    price_increase_pct: 0,
  },
  {
    id: "SCEN-002",
    name: "Rs 50L CapEx Machinery Purchase in Nov 2025",
    description: "Simulates purchasing new production line machinery with Rs 50L upfront cash payment.",
    debtor_delay_days: 0,
    revenue_drop_pct: 0,
    capex_spend_inr: 5000000,
    hiring_count: 0,
    avg_salary_per_emp_monthly: 0,
    price_increase_pct: 0,
  },
  {
    id: "SCEN-003",
    name: "15% Sales Slump + 5 Workers Hired",
    description: "Stress test: 15% revenue drop (Rs 8.5 Cr instead of Rs 10 Cr) + 5 new factory workers @ Rs 22,000/month each.",
    debtor_delay_days: 0,
    revenue_drop_pct: 15,
    capex_spend_inr: 0,
    hiring_count: 5,
    avg_salary_per_emp_monthly: 22000,
    price_increase_pct: 0,
  },
  {
    id: "SCEN-004",
    name: "5% Price Increase Across Product Catalog",
    description: "Optimistic scenario: 5% price hike on all products -> revenue Rs 10.5 Cr with same volume.",
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

// Balance Sheet derived from demo-accounting-data.ts (Rs 10 Cr Mfg Company):
// Working Capital = Current Assets(10.68 Cr) - Current Liabilities(2.455 Cr) = Rs 8.22 Cr
// Retained Earnings = Reserves & Surplus = Rs 1.20 Cr
// EBIT = Net PBT(1 Cr) + Interest(18.75L) = Rs 1.1875 Cr
// Total Assets = Fixed(6.95 Cr) + Current(10.68 Cr) + Other(0.95 Cr) = Rs 18.58 Cr
// Total Liabilities = Term Loan(2.425) + Director Loan(0.50) + GST Payable(1.80) + Creditors(0.60) + Other(0.55) = Rs 5.875 Cr
// Market Value of Equity (Pvt Ltd est. @ 4x Book Value Rs 6.20 Cr) = Rs 24.8 Cr
// Sales = Rs 10 Cr
export const DEMO_ALTMAN_ZSCORE: AltmanZScore = computeAltmanZScore(
  82200000,   // Working Capital Rs 8.22 Cr
  12000000,   // Retained Earnings Rs 1.20 Cr
  11875000,   // EBIT Rs 1.1875 Cr
  248000000,  // Market Value of Equity Rs 24.8 Cr (4x Book)
  58750000,   // Total Liabilities Rs 5.875 Cr
  100000000,  // Sales Rs 10 Cr
  185800000,  // Total Assets Rs 18.58 Cr
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: BENEISH M-SCORE (FORENSIC EARNINGS QUALITY)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_BENEISH_MSCORE: BeneishMScore = computeBeneishMScore({
  dsri: 1.05,  // Days Sales in Receivables Index (1.05 = healthy — debtors are high but consistent)
  gmi:  0.97,  // Gross Margin Index (39% gross margin, stable)
  aqi:  1.01,  // Asset Quality Index (negligible intangibles)
  sgi:  1.10,  // Sales Growth Index (10% YoY growth assumed for demo)
  depi: 1.00,  // Depreciation Index (stable depreciation rate)
  sgai: 1.02,  // SGA Expense Index (slight admin cost increase)
  lvgi: 0.96,  // Leverage Index (low leverage — good sign)
  tata: 0.01,  // Total Accruals to Total Assets (1% — very low accrual risk)
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: DUPONT ANALYSIS (3-POINT & 5-POINT ROE)
// ─────────────────────────────────────────────────────────────────────────────

// DuPont for Sannidh Demo Co. Pvt. Ltd. (Rs 10 Cr Mfg):
// PAT = Rs 1 Cr | Sales = Rs 10 Cr | Total Assets = Rs 18.58 Cr
// Shareholders Equity = Capital(5 Cr) + Reserves(1.20 Cr) = Rs 6.20 Cr
// EBIT = Rs 1.1875 Cr
export const DEMO_DUPONT_ANALYSIS: DuPontAnalysis = computeDuPontAnalysis(
  10000000,   // PAT Rs 1 Cr (Net Profit after tax)
  100000000,  // Sales Rs 10 Cr
  185800000,  // Total Assets Rs 18.58 Cr
  62000000,   // Shareholders Equity Rs 6.20 Cr
  11875000,   // EBIT Rs 1.1875 Cr
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: WORKING CAPITAL & CASH CONVERSION CYCLE (CCC)
// ─────────────────────────────────────────────────────────────────────────────

// Working Capital & CCC for Sannidh Demo Co. Pvt. Ltd. (Rs 10 Cr Mfg):
// Debtors = Beta(1.652 Cr) + Gamma(2.242 Cr) + Epsilon(2.95 Cr) = Rs 6.844 Cr
// Sales = Rs 10 Cr | Inventory = Raw(58L) + FG(32L) = Rs 90L
// COGS = Rs 6.10 Cr (purchases) | Creditors = Zeta(56.64L) + Eta(3.54L) = Rs 60.18L
export const DEMO_WORKING_CAPITAL_CCC: CashConversionCycle = computeWorkingCapitalMetrics(
  68440000,   // Debtors Rs 6.844 Cr
  100000000,  // Sales Rs 10 Cr
  9000000,    // Inventory Rs 90L (Raw 58L + FG 32L)
  61000000,   // COGS Rs 6.10 Cr
  60180000,   // Creditors Rs 60.18L
  61000000,   // Purchases Rs 6.10 Cr
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: EBITDA WATERFALL & PROFITABILITY BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

// EBITDA Waterfall for Sannidh Demo Co. Pvt. Ltd. (Rs 10 Cr Mfg FY 2025-26):
// Revenue Rs 10 Cr -> COGS Rs 6.10 Cr -> Gross Profit Rs 3.90 Cr (39%)
// Payroll Rs 1.45 Cr (Staff 57.6L + Factory Wages 87.5L) + Marketing 7.5L + Admin 32.5L
// EBITDA Rs 2.04 Cr -> Interest 1.875L -> PBT Rs 1 Cr -> Tax Rs 25L -> PAT Rs 75L
export const DEMO_EBITDA_BRIDGE: EBITDABridge = computeEBITDABridge({
  gross_sales:  100000000,  // Rs 10 Cr gross revenue
  discounts:    0,          // No trade discounts
  cogs:         61000000,   // Rs 6.10 Cr (raw material + components)
  payroll:      14500000,   // Rs 1.45 Cr (Staff 57.6L + Factory Wages 87.5L)
  marketing:    750000,     // Rs 7.50L
  admin:        3250000,    // Rs 32.5L (Rent 40L + Legal 10L + Telecom 5L + Software 2.5L + others)
  depreciation: 0,          // Minimal depreciation in demo
  interest:     187500,     // Rs 1.875L (HDFC Term Loan interest)
  tax:          2500000,    // Rs 25L (estimated tax on Rs 1 Cr PBT @ 25.17%)
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
  "Sannidh Demo Co. Pvt. Ltd.",
  "FY 2025-26 (Q2 Review)",
  DEMO_CFO_HEALTH_SCORECARD,
  DEMO_EBITDA_BRIDGE,
  DEMO_ALTMAN_ZSCORE,
);
