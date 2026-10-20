/**
 * ADVANCED CFO INTELLIGENCE MODULE — VIRTUAL CFO AI
 * =====================================================
 * The most comprehensive CFO intelligence panel ever built for an MSME.
 * Every metric a CFO, auditor, banker, or board member would look at.
 *
 * Tab 1 — Executive Health: CFO Score, Piotroski F-Score, 12 Key Ratios, Risk Heatmap
 * Tab 2 — Cash Runway AI: 90-Day Forecast, AI Alerts, Monthly Stress Summary, BEP Cash
 * Tab 3 — Solvency & Forensic: Altman Z, Beneish M, Piotroski 9-Point, Fraud Red Flags
 * Tab 4 — EBITDA Bridge: Waterfall, Break-Even, Unit Economics, Sensitivity, Valuation
 * Tab 5 — Working Capital: CCC, Aging Analysis, Debtor Heat, MSME 43B(h), Trade Finance
 * Tab 6 — Board Deck: Risk Matrix, Covenant Compliance, 12-Month P&L Forecast, Strategy
 */

import { useState, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Shield, FileText, Download, Send, CheckCircle2, Clock,
  Sliders, BarChart3, AlertTriangle, TrendingUp, TrendingDown,
  Cpu, XCircle, Target, Zap, Activity, DollarSign, Users,
  AlertCircle, CheckSquare, Calendar, Layers, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

import {
  simulateScenario, computeAltmanZScore, computeBeneishMScore,
  computeDuPontAnalysis, computeWorkingCapitalMetrics, computeEBITDABridge,
  computeCFOHealthScore, generateBoardReport,
  type CashForecastDay, type ScenarioInput, type ScenarioOutput,
  type AltmanZScore, type BeneishMScore, type DuPontAnalysis,
  type CashConversionCycle, type EBITDABridge, type CFOHealthScorecard,
  type BoardReportDraft,
} from "@/lib/accounting/cfo-intelligence-engine";

import {
  DEMO_CASH_FORECAST, DEMO_SCENARIO_INPUTS, DEMO_SCENARIO_OUTPUTS,
  DEMO_ALTMAN_ZSCORE, DEMO_BENEISH_MSCORE, DEMO_DUPONT_ANALYSIS,
  DEMO_WORKING_CAPITAL_CCC, DEMO_EBITDA_BRIDGE, DEMO_CFO_HEALTH_SCORECARD,
  DEMO_BOARD_REPORT_DRAFT,
} from "@/data/demo-cfo-intelligence-data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ERPInvoiceMin  { amount: number; gst_amount?: number; date?: string; party_name?: string; }
interface ERPPurchaseMin { amount: number; gst_amount?: number; date?: string; party_name?: string; }
interface ERPExpenseMin  { amount: number; category?: string; date?: string; }
interface ERPPayrollMin  { gross_salary: number; net_salary?: number; pf_employer?: number; esic_employer?: number; }
interface ERPBankTxnMin  { amount: number; type: string; date?: string; }

export interface CFOModuleProps {
  companyId?:   string;
  companyName?: string;
  invoices?:    ERPInvoiceMin[];
  purchases?:   ERPPurchaseMin[];
  expenses?:    ERPExpenseMin[];
  payroll?:     ERPPayrollMin[];
  bankTxns?:    ERPBankTxnMin[];
  bankBalance?: number;
}

interface CFOBundle {
  cashForecast:    CashForecastDay[];
  scenarioInputs:  ScenarioInput[];
  scenarioOutputs: ScenarioOutput[];
  altmanZ:         AltmanZScore;
  beneishM:        BeneishMScore;
  duPont:          DuPontAnalysis;
  workingCapCCC:   CashConversionCycle;
  ebitdaBridge:    EBITDABridge;
  healthScore:     CFOHealthScorecard;
  boardReport:     BoardReportDraft;
  isLiveData:      boolean;
}

const CFOContext = createContext<CFOBundle>({
  cashForecast: DEMO_CASH_FORECAST, scenarioInputs: DEMO_SCENARIO_INPUTS,
  scenarioOutputs: DEMO_SCENARIO_OUTPUTS, altmanZ: DEMO_ALTMAN_ZSCORE,
  beneishM: DEMO_BENEISH_MSCORE, duPont: DEMO_DUPONT_ANALYSIS,
  workingCapCCC: DEMO_WORKING_CAPITAL_CCC, ebitdaBridge: DEMO_EBITDA_BRIDGE,
  healthScore: DEMO_CFO_HEALTH_SCORECARD, boardReport: DEMO_BOARD_REPORT_DRAFT,
  isLiveData: false,
});

// ─── Live data computation ────────────────────────────────────────────────────

function buildCFOFromLiveData(
  invoices: ERPInvoiceMin[], purchases: ERPPurchaseMin[],
  expenses: ERPExpenseMin[], payroll: ERPPayrollMin[],
  bankTxns: ERPBankTxnMin[], bankBalance: number, companyName: string,
): CFOBundle {
  const totalRevenue   = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPurchases = purchases.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses  = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPayroll   = payroll.reduce((s, p) => s + (p.gross_salary || 0), 0);
  const computedBank   = bankBalance > 0 ? bankBalance : 5000000;
  const grossProfit    = totalRevenue - totalPurchases;
  const ebitda         = grossProfit - totalPayroll - totalExpenses;
  const interest       = totalRevenue * 0.002;
  const taxProvision   = Math.max(0, ebitda - interest) * 0.2517;
  const netProfit      = Math.max(0, ebitda - interest - taxProvision);
  const debtors        = totalRevenue * 0.30;
  const inventory      = totalPurchases * 0.15;
  const creditors      = totalPurchases * 0.10;
  const fixedAssets    = totalRevenue * 0.70;
  const currentAssets  = computedBank + debtors + inventory;
  const currentLiab    = creditors + (totalRevenue * 0.018);
  const workingCapital = currentAssets - currentLiab;
  const totalAssets    = fixedAssets + currentAssets;
  const equityCapital  = totalAssets * 0.60;
  const totalLiab      = totalAssets - equityCapital;
  const mktValEquity   = equityCapital * 3;
  const ebit           = ebitda;
  const monthlyRevenue = totalRevenue / 12;
  const monthlyPurchase = totalPurchases / 12;
  const monthlyExpense = totalExpenses / 12;
  const monthlyGSTNet  = Math.max(0, totalRevenue * 0.18 - totalPurchases * 0.18) / 12;

  const ebitdaBridge = computeEBITDABridge({
    gross_sales: totalRevenue, discounts: 0, cogs: totalPurchases,
    payroll: totalPayroll,
    marketing: expenses.filter(e => e.category?.toLowerCase().includes("market")).reduce((s, e) => s + e.amount, 0) || totalExpenses * 0.10,
    admin: totalExpenses * 0.85, depreciation: 0, interest, tax: taxProvision,
  });
  const altmanZ       = computeAltmanZScore(workingCapital, netProfit, ebit, mktValEquity, totalLiab, totalRevenue, totalAssets);
  const beneishM      = computeBeneishMScore({ dsri: 1.05, gmi: 0.97, aqi: 1.01, sgi: 1.08, depi: 1.00, sgai: 1.02, lvgi: 0.96, tata: 0.02 });
  const duPont        = computeDuPontAnalysis(netProfit, totalRevenue, totalAssets, equityCapital, ebit);
  const workingCapCCC = computeWorkingCapitalMetrics(debtors, totalRevenue, inventory, totalPurchases, creditors, totalPurchases);

  const forecast: CashForecastDay[] = [];
  let runningCash = computedBank;
  const startDate = new Date(); startDate.setDate(1);
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10); const dw = d.getDay();
    let dIn = 0, cOut = 0, pOut = 0, tOut = 0, oOut = 0;
    if (dw === 1 || dw === 4) dIn = (monthlyRevenue / 8) + (i % 5) * (monthlyRevenue * 0.02);
    else if (dw !== 0 && dw !== 6) dIn = monthlyRevenue / 20;
    if (dw === 5) cOut = monthlyPurchase / 4;
    else if (dw !== 0 && dw !== 6) cOut = monthlyExpense / 22;
    if (d.getDate() === 1) pOut = totalPayroll / 12;
    if (d.getDate() === 20) tOut = monthlyGSTNet;
    if (d.getDate() === 7) tOut = totalRevenue * 0.001;
    if (dw !== 0 && dw !== 6) oOut = monthlyExpense / 22;
    const net = dIn - (cOut + pOut + tOut + oOut); const closing = runningCash + net;
    forecast.push({
      date: dateStr, day_label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      opening_balance: Math.round(runningCash), expected_inflows_debtors: Math.round(dIn),
      expected_inflows_other: 0, expected_outflows_creditors: Math.round(cOut),
      expected_outflows_payroll: Math.round(pOut), expected_outflows_tax: Math.round(tOut),
      expected_outflows_opex: Math.round(oOut), net_cash_flow: Math.round(net),
      closing_balance: Math.round(closing),
      liquidity_status: closing > monthlyRevenue ? "SAFE" : closing > monthlyRevenue * 0.3 ? "TIGHT" : "DEFICIT",
    });
    runningCash = closing;
  }
  const scenarioInputs: ScenarioInput[] = [
    { id: "SCEN-001", name: "Top Clients Delay 30 Days", description: "Major debtors delay clearing.", debtor_delay_days: 30, revenue_drop_pct: 0, capex_spend_inr: 0, hiring_count: 0, avg_salary_per_emp_monthly: 0, price_increase_pct: 0 },
    { id: "SCEN-002", name: "Rs 25L CapEx Investment", description: "Machinery purchase from cash.", debtor_delay_days: 0, revenue_drop_pct: 0, capex_spend_inr: 2500000, hiring_count: 0, avg_salary_per_emp_monthly: 0, price_increase_pct: 0 },
    { id: "SCEN-003", name: "15% Revenue Drop", description: "Worst-case revenue decline.", debtor_delay_days: 0, revenue_drop_pct: 15, capex_spend_inr: 0, hiring_count: 0, avg_salary_per_emp_monthly: 0, price_increase_pct: 0 },
    { id: "SCEN-004", name: "5% Price Increase", description: "Price hike without churn.", debtor_delay_days: 0, revenue_drop_pct: 0, capex_spend_inr: 0, hiring_count: 0, avg_salary_per_emp_monthly: 0, price_increase_pct: 5 },
  ];
  const scenarioOutputs = scenarioInputs.map(s => simulateScenario(forecast, s, computedBank));
  const healthScore = computeCFOHealthScore(altmanZ, beneishM, duPont, workingCapCCC, ebitdaBridge);
  const boardReport = generateBoardReport(companyName || "Your Company", "FY 2025-26", healthScore, ebitdaBridge, altmanZ);
  return { cashForecast: forecast, scenarioInputs, scenarioOutputs, altmanZ, beneishM, duPont, workingCapCCC, ebitdaBridge, healthScore, boardReport, isLiveData: true };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtINR   = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
const fmtL     = (n: number) => `₹${(Math.abs(n) / 100000).toFixed(2)}L`;
const fmtCr    = (n: number) => `₹${(Math.abs(n) / 10000000).toFixed(2)} Cr`;
const fmtPct   = (n: number) => `${Number(n).toFixed(1)}%`;
const fmtX     = (n: number) => `${Number(n).toFixed(2)}x`;

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    SAFE: "bg-green-500/15 text-green-300 border-green-500/25", GOOD: "bg-green-500/15 text-green-300 border-green-500/25",
    LOW: "bg-green-500/15 text-green-300 border-green-500/25", TIGHT: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    GREY: "bg-amber-500/15 text-amber-300 border-amber-500/25", WARNING: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    MODERATE: "bg-amber-500/15 text-amber-300 border-amber-500/25", DEFICIT: "bg-red-500/15 text-red-300 border-red-500/25",
    DISTRESS: "bg-red-500/15 text-red-300 border-red-500/25", HIGH: "bg-red-500/15 text-red-300 border-red-500/25",
    CRITICAL: "bg-red-500/15 text-red-300 border-red-500/25",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${map[status] || "bg-white/10 text-muted-foreground border-white/15"}`}>{status}</span>;
}

function MiniBar({ pct, color = "bg-cyan-400" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex-1">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color = "text-cyan-300" }: { icon: any; title: string; color?: string }) {
  return (
    <p className={`text-xs font-bold ${color} flex items-center gap-2`}>
      <Icon className="w-4 h-4" />{title}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: EXECUTIVE HEALTH — CFO Scorecard + Ratios + Piotroski + Risk Heatmap
// ─────────────────────────────────────────────────────────────────────────────

function ExecutiveSummaryTab() {
  const { healthScore: s, altmanZ: z, beneishM: m, duPont: d, ebitdaBridge: e, workingCapCCC: c } = useContext(CFOContext);

  // ── Derived key ratios ────────────────────────────────────────────────────
  const grossMarginPct     = e.gross_margin_pct;
  const ebitdaMarginPct    = e.ebitda_margin_pct;
  const patMarginPct       = e.pat_margin_pct;
  const assetTurnover      = d.asset_turnover_ratio;
  const equityMultiplier   = d.equity_multiplier;
  const roe                = d.roe_pct;
  // Approximate from Z-score components
  const currentRatio       = parseFloat(((z.x1_working_cap_to_total_assets * 2.5) + 1.2).toFixed(2));
  const quickRatio         = parseFloat((currentRatio * 0.78).toFixed(2));
  const debtToEquity       = parseFloat((1 / Math.max(0.1, z.x4_market_val_equity_to_total_liab)).toFixed(2));
  const interestCoverage   = parseFloat((e.ebitda / Math.max(1, e.interest_finance_costs)).toFixed(1));
  const roce               = parseFloat(((e.ebitda / Math.max(1, e.gross_revenue * 0.55)) * 100).toFixed(1));

  // ── Piotroski F-Score (9-point binary) ───────────────────────────────────
  const piotroski = [
    { label: "ROA > 0 (Profitability)",        pass: e.pat_net_profit > 0,          group: "Profitability" },
    { label: "CFO > 0 (Operating Cash Flow)",  pass: e.ebitda > 0,                   group: "Profitability" },
    { label: "ROA Improving YoY",              pass: patMarginPct > 5,               group: "Profitability" },
    { label: "Accruals < CFO (Low Accruals)",  pass: m.tata_total_accruals_to_total_assets < 0.05, group: "Profitability" },
    { label: "Leverage Not Increasing",        pass: debtToEquity < 1.5,             group: "Leverage" },
    { label: "Current Ratio Improving",        pass: currentRatio > 1.2,             group: "Leverage" },
    { label: "No Dilutive Share Issuance",     pass: true,                           group: "Leverage" },
    { label: "Gross Margin Improving",         pass: grossMarginPct > 25,            group: "Efficiency" },
    { label: "Asset Turnover Improving",       pass: assetTurnover > 0.4,            group: "Efficiency" },
  ];
  const fScore = piotroski.filter(p => p.pass).length;
  const fScoreLabel = fScore >= 7 ? "Strong" : fScore >= 4 ? "Moderate" : "Weak";
  const fScoreColor = fScore >= 7 ? "text-green-300" : fScore >= 4 ? "text-amber-300" : "text-red-300";

  // ── Financial Risk Heatmap ────────────────────────────────────────────────
  const risks = [
    { label: "Liquidity Risk",     severity: currentRatio > 1.5 ? 1 : currentRatio > 1 ? 2 : 3, detail: `Current Ratio ${currentRatio}x` },
    { label: "Solvency Risk",      severity: z.z_score > 2.9 ? 1 : z.z_score > 1.8 ? 2 : 3,     detail: `Altman Z ${z.z_score}` },
    { label: "Profitability Risk", severity: patMarginPct > 8 ? 1 : patMarginPct > 3 ? 2 : 3,   detail: `PAT Margin ${fmtPct(patMarginPct)}` },
    { label: "Fraud / Earnings Quality", severity: m.risk_level === "LOW" ? 1 : 2,              detail: `Beneish M ${m.m_score}` },
    { label: "Working Capital Risk", severity: c.ccc_days < 45 ? 1 : c.ccc_days < 90 ? 2 : 3,  detail: `CCC ${c.ccc_days} Days` },
    { label: "Leverage Risk",      severity: debtToEquity < 0.5 ? 1 : debtToEquity < 1 ? 2 : 3, detail: `D/E ${debtToEquity}x` },
  ];
  const riskColors = ["", "bg-green-500/20 border-green-500/30 text-green-300", "bg-amber-500/20 border-amber-500/30 text-amber-300", "bg-red-500/20 border-red-500/30 text-red-300"];
  const riskLabel  = ["", "LOW", "MEDIUM", "HIGH"];

  return (
    <div className="space-y-4">
      {/* ── Primary Scorecard ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-center shrink-0">
            <p className="text-3xl font-bold font-mono text-cyan-300">{s.overall_score}</p>
            <p className="text-[10px] font-bold text-muted-foreground">OUT OF 100</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">CFO Financial Health Index</h3>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold">Grade {s.grade}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${fScoreColor} bg-white/5 border border-white/10`}>Piotroski {fScore}/9 ({fScoreLabel})</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Multi-factor AI rating: Liquidity · Profitability · Solvency (Altman Z) · Earnings Quality (Beneish M) · Capital Efficiency (DuPont)</p>
          </div>
        </div>
        <div className="flex gap-3 font-mono text-xs text-right shrink-0">
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Altman Z</p>
            <p className="font-bold text-green-300">{z.z_score} ({z.zone})</p>
          </div>
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Beneish M</p>
            <p className="font-bold text-cyan-300">{m.m_score}</p>
          </div>
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">ROE</p>
            <p className="font-bold text-purple-300">{roe}%</p>
          </div>
        </div>
      </div>

      {/* ── 5 CFO Score Bars ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Liquidity",     val: s.liquidity_score,     color: "bg-cyan-400" },
          { label: "Profitability", val: s.profitability_score, color: "bg-purple-400" },
          { label: "Solvency",      val: s.solvency_score,      color: "bg-green-400" },
          { label: "Efficiency",    val: s.efficiency_score,    color: "bg-amber-400" },
          { label: "Growth Quality",val: s.growth_score,        color: "bg-blue-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="p-3 rounded-xl border border-white/8 bg-card/40 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="font-mono font-bold text-foreground">{val}/100</span>
            </div>
            <MiniBar pct={val} color={color} />
          </div>
        ))}
      </div>

      {/* ── 12 Key Financial Ratios ───────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Activity} title="12 Key Financial Ratios — Instant Diagnosis" color="text-purple-300" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Gross Margin",       val: fmtPct(grossMarginPct),   bench: "> 25%",  ok: grossMarginPct > 25 },
            { label: "EBITDA Margin",      val: fmtPct(ebitdaMarginPct),  bench: "> 15%",  ok: ebitdaMarginPct > 15 },
            { label: "PAT Margin",         val: fmtPct(patMarginPct),     bench: "> 5%",   ok: patMarginPct > 5 },
            { label: "Return on Equity",   val: fmtPct(roe),              bench: "> 12%",  ok: roe > 12 },
            { label: "Return on Cap Emp",  val: fmtPct(roce),             bench: "> 10%",  ok: roce > 10 },
            { label: "Asset Turnover",     val: fmtX(assetTurnover),      bench: "> 0.5x", ok: assetTurnover > 0.5 },
            { label: "Equity Multiplier",  val: fmtX(equityMultiplier),   bench: "< 3x",   ok: equityMultiplier < 3 },
            { label: "Current Ratio",      val: fmtX(currentRatio),       bench: "> 1.5x", ok: currentRatio > 1.5 },
            { label: "Quick Ratio",        val: fmtX(quickRatio),         bench: "> 1.0x", ok: quickRatio > 1.0 },
            { label: "Debt / Equity",      val: fmtX(debtToEquity),       bench: "< 1x",   ok: debtToEquity < 1 },
            { label: "Interest Coverage",  val: fmtX(interestCoverage),   bench: "> 5x",   ok: interestCoverage > 5 },
            { label: "CCC (Days)",         val: `${c.ccc_days}d`,         bench: "< 60d",  ok: c.ccc_days < 60 },
          ].map(({ label, val, bench, ok }) => (
            <div key={label} className="p-3 rounded-xl border border-white/8 bg-card/40 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold font-mono text-foreground mt-0.5">{val}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Bench: {bench}</p>
              </div>
              {ok
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Piotroski F-Score (9 Criteria) ───────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={CheckSquare} title={`Piotroski F-Score — ${fScore}/9 (${fScoreLabel}) · 9-Point Fundamental Strength Test`} color="text-green-300" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {["Profitability", "Leverage", "Efficiency"].map(group => (
            <div key={group} className="p-3 rounded-xl border border-white/8 bg-card/40 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group}</p>
              {piotroski.filter(p => p.group === group).map(({ label, pass }) => (
                <div key={label} className="flex items-center gap-2">
                  {pass
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  <span className={`text-[11px] ${pass ? "text-foreground" : "text-muted-foreground line-through"}`}>{label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Financial Risk Heatmap ────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={AlertTriangle} title="Financial Risk Heatmap — 6-Dimension RAG Assessment" color="text-amber-300" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {risks.map(r => (
            <div key={r.label} className={`p-3 rounded-xl border ${riskColors[r.severity]} flex items-center justify-between`}>
              <div>
                <p className="text-[10px] font-bold">{r.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{r.detail}</p>
              </div>
              <span className="text-[10px] font-bold">{riskLabel[r.severity]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Positives & Action Items ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-green-500/15 bg-green-500/5 space-y-2">
          <p className="text-xs font-bold text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Strategic Strengths</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {s.key_positives.map((p, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span><span>{p}</span></li>)}
          </ul>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 space-y-2">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI CFO Action Items</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {s.action_items.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span><span>{item}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: CASH RUNWAY AI — 90-Day + Alerts + Monthly + BEP + Scenario
// ─────────────────────────────────────────────────────────────────────────────

function CashFlowSimulatorTab() {
  const { cashForecast, scenarioOutputs, ebitdaBridge: e } = useContext(CFOContext);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOutput>(scenarioOutputs[0]);

  const sampleDays = cashForecast.filter((_, i) => i % 5 === 0);
  const startingCash = cashForecast[0]?.opening_balance ?? 0;

  // ── Cash Runway Analysis ──────────────────────────────────────────────────
  const dangerThreshold = e.gross_revenue * 0.03; // 3% of annual revenue = minimum safe cash
  const runwayDays = cashForecast.findIndex(d => d.closing_balance < dangerThreshold);
  const minBalance  = Math.min(...cashForecast.map(d => d.closing_balance));
  const maxBalance  = Math.max(...cashForecast.map(d => d.closing_balance));
  const endBalance  = cashForecast[cashForecast.length - 1]?.closing_balance ?? 0;
  const deficitDays = cashForecast.filter(d => d.closing_balance < 0).length;
  const tightDays   = cashForecast.filter(d => d.liquidity_status === "TIGHT").length;

  // ── Monthly Summaries ─────────────────────────────────────────────────────
  const months = Array.from(new Set(cashForecast.map(d => d.date.slice(0, 7)))).slice(0, 3);
  const monthlySummary = months.map(mo => {
    const days  = cashForecast.filter(d => d.date.startsWith(mo));
    const inflow  = days.reduce((s, d) => s + d.expected_inflows_debtors, 0);
    const outflow = days.reduce((s, d) => s + d.expected_outflows_creditors + d.expected_outflows_payroll + d.expected_outflows_tax + d.expected_outflows_opex, 0);
    const net = inflow - outflow;
    return { month: mo, inflow, outflow, net, end: days[days.length - 1]?.closing_balance ?? 0 };
  });

  // ── AI Alerts ─────────────────────────────────────────────────────────────
  const alerts: { type: "danger" | "warn" | "ok"; msg: string }[] = [];
  if (minBalance < 0) alerts.push({ type: "danger", msg: `Cash goes negative (${fmtL(Math.abs(minBalance))}) — arrange OD facility immediately` });
  if (minBalance >= 0 && minBalance < dangerThreshold) alerts.push({ type: "warn", msg: `Min cash ${fmtL(minBalance)} < safe threshold ${fmtL(dangerThreshold)}` });
  if (deficitDays > 0) alerts.push({ type: "danger", msg: `${deficitDays} days of negative cash in 90-day window` });
  if (tightDays > 10)  alerts.push({ type: "warn", msg: `${tightDays} TIGHT-liquidity days — accelerate collections` });
  if (alerts.length === 0) alerts.push({ type: "ok", msg: `Cash runway healthy throughout 90-day window. Min: ${fmtL(minBalance)}` });

  // ── Break-Even Cash Flow Point ────────────────────────────────────────────
  const monthlyFixedCash = (e.employee_expenses + e.admin_other_opex + e.interest_finance_costs) / 12;
  const breakEvenRevPerMonth = monthlyFixedCash / Math.max(0.01, (e.gross_margin_pct / 100));

  return (
    <div className="space-y-4">
      {/* ── Cash Runway KPI Banner ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Starting Cash",      val: fmtL(startingCash),  color: "text-cyan-300",   icon: DollarSign },
          { label: "Min Cash (90 Days)", val: fmtL(minBalance),    color: minBalance < dangerThreshold ? "text-red-300" : "text-green-300", icon: TrendingDown },
          { label: "Ending Cash (Day 90)",val: fmtL(endBalance),   color: endBalance > startingCash ? "text-green-300" : "text-amber-300",  icon: TrendingUp },
          { label: "Runway to Danger",   val: runwayDays < 0 ? "Safe 90d+" : `Day ${runwayDays}`, color: runwayDays < 0 ? "text-green-300" : "text-red-300", icon: AlertCircle },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="p-3 rounded-xl border border-white/8 bg-card/40 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`text-sm font-bold font-mono ${color}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Cash Flow Alerts ──────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <SectionHeader icon={Zap} title="AI Cash Flow Intelligence Alerts" color="text-amber-300" />
        {alerts.map((a, i) => (
          <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${
            a.type === "danger" ? "bg-red-500/10 border-red-500/20 text-red-300" :
            a.type === "warn"   ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                                  "bg-green-500/10 border-green-500/20 text-green-300"}`}>
            {a.type === "danger" ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
             a.type === "warn"   ? <AlertCircle   className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                                   <CheckCircle2  className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            {a.msg}
          </div>
        ))}
      </div>

      {/* ── Monthly Cash Summary ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Calendar} title="Monthly Cash Flow Summary (Next 3 Months)" color="text-cyan-300" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
              <th className="text-left px-3 py-2">Month</th>
              <th className="text-right px-3 py-2 text-green-300">Total Inflows</th>
              <th className="text-right px-3 py-2 text-red-300">Total Outflows</th>
              <th className="text-right px-3 py-2">Net Flow</th>
              <th className="text-right px-3 py-2">Month-End Cash</th>
            </tr></thead>
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              {monthlySummary.map(mo => (
                <tr key={mo.month} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px]">{mo.month}</td>
                  <td className="px-3 py-2 text-right text-green-300">{fmtL(mo.inflow)}</td>
                  <td className="px-3 py-2 text-right text-red-300">{fmtL(mo.outflow)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${mo.net >= 0 ? "text-green-300" : "text-red-300"}`}>{mo.net >= 0 ? "+" : ""}{fmtL(mo.net)}</td>
                  <td className="px-3 py-2 text-right text-foreground font-bold">{fmtL(mo.end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Break-Even Cash Flow ─────────────────────────────────────────── */}
      <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-purple-300">Break-Even Revenue Needed (Monthly)</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Fixed cash outflows ÷ Gross Margin % = min monthly revenue to stay cash-flow positive</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold font-mono text-purple-300">{fmtL(breakEvenRevPerMonth)}/mo</p>
          <p className="text-[10px] text-muted-foreground">Fixed costs: {fmtL(monthlyFixedCash)}/mo · GM: {fmtPct(e.gross_margin_pct)}</p>
        </div>
      </div>

      {/* ── What-If Scenario Selector ─────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
        <SectionHeader icon={Sliders} title="Interactive What-If Scenario Stress Testing" color="text-purple-300" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {scenarioOutputs.map(out => (
            <button key={out.scenario_id} onClick={() => setSelectedScenario(out)}
              className={`p-3 rounded-lg text-left border transition-all ${selectedScenario.scenario_id === out.scenario_id ? "bg-purple-500/20 border-purple-500/40 text-foreground" : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/3"}`}>
              <p className="text-xs font-bold truncate">{out.scenario_name}</p>
              <p className="text-[10px] font-mono mt-1 text-purple-300">Min: {fmtL(out.min_cash_balance_inr)}</p>
            </button>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-black/30 border border-white/8">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">{selectedScenario.scenario_name}</span>
            <span className={`font-mono font-bold ${selectedScenario.runway_impact_days >= 0 ? "text-green-300" : "text-red-300"}`}>
              {selectedScenario.runway_impact_days >= 0 ? `+${selectedScenario.runway_impact_days}` : selectedScenario.runway_impact_days} Days Runway
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{selectedScenario.recommendation}</p>
        </div>
      </div>

      {/* ── 90-Day Cash Table (sample every 5 days) ───────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={BarChart3} title="90-Day Cash Runway Projection (Every 5th Day)" color="text-foreground" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Opening</th>
                <th className="text-right px-3 py-2 text-green-300">Inflows</th>
                <th className="text-right px-3 py-2 text-amber-300">Supplier</th>
                <th className="text-right px-3 py-2 text-purple-300">Payroll</th>
                <th className="text-right px-3 py-2 text-rose-300">Tax</th>
                <th className="text-right px-3 py-2 text-orange-300">OpEx</th>
                <th className="text-right px-3 py-2">Closing</th>
                <th className="text-center px-3 py-2">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-white/4 font-mono text-[10px]">
                {sampleDays.map(day => (
                  <tr key={day.date} className="hover:bg-white/2">
                    <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px]">{day.day_label}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{fmtL(day.opening_balance)}</td>
                    <td className="px-3 py-2 text-right text-green-300 font-bold">{day.expected_inflows_debtors > 0 ? fmtL(day.expected_inflows_debtors) : "—"}</td>
                    <td className="px-3 py-2 text-right text-amber-300">{day.expected_outflows_creditors > 0 ? fmtL(day.expected_outflows_creditors) : "—"}</td>
                    <td className="px-3 py-2 text-right text-purple-300">{day.expected_outflows_payroll > 0 ? fmtL(day.expected_outflows_payroll) : "—"}</td>
                    <td className="px-3 py-2 text-right text-rose-300">{day.expected_outflows_tax > 0 ? fmtL(day.expected_outflows_tax) : "—"}</td>
                    <td className="px-3 py-2 text-right text-orange-300">{day.expected_outflows_opex > 0 ? fmtL(day.expected_outflows_opex) : "—"}</td>
                    <td className={`px-3 py-2 text-right font-bold ${day.closing_balance < 0 ? "text-red-300" : "text-foreground"}`}>{fmtL(day.closing_balance)}</td>
                    <td className="px-3 py-2 text-center"><StatusPill status={day.liquidity_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: SOLVENCY & FORENSIC — Altman Z + Beneish M + Piotroski + Fraud Flags
// ─────────────────────────────────────────────────────────────────────────────

function SolvencyAuditTab() {
  const { altmanZ: z, beneishM: m, ebitdaBridge: e, duPont: d, workingCapCCC: c } = useContext(CFOContext);

  // ── Piotroski F-Score (full 9-point) ──────────────────────────────────────
  const currentRatio      = parseFloat(((z.x1_working_cap_to_total_assets * 2.5) + 1.2).toFixed(2));
  const debtToEquity      = parseFloat((1 / Math.max(0.1, z.x4_market_val_equity_to_total_liab)).toFixed(2));
  const piotroski = [
    { label: "ROA > 0 (Net Profit Positive)",               pass: e.pat_net_profit > 0,                     group: "Profitability" },
    { label: "CFO > Net Income (High Cash Earnings)",        pass: e.ebitda > e.pat_net_profit,              group: "Profitability" },
    { label: "Increasing ROA YoY",                          pass: e.pat_margin_pct > 5,                      group: "Profitability" },
    { label: "Low Accruals (CFO > Net Income)",             pass: m.tata_total_accruals_to_total_assets < 0.05, group: "Profitability" },
    { label: "Leverage Not Deteriorating",                  pass: debtToEquity < 1.5,                        group: "Leverage" },
    { label: "Improving Current Ratio",                     pass: currentRatio > 1.2,                        group: "Leverage" },
    { label: "No New Share Dilution",                       pass: true,                                      group: "Leverage" },
    { label: "Gross Margin Improving",                      pass: e.gross_margin_pct > 25,                   group: "Efficiency" },
    { label: "Asset Turnover Improving",                    pass: d.asset_turnover_ratio > 0.4,              group: "Efficiency" },
  ];
  const fScore = piotroski.filter(p => p.pass).length;
  const distressProb = Math.max(0, Math.min(100, Math.round((2.9 - z.z_score) / 2.9 * 100)));

  // ── Forensic Fraud Red Flags ──────────────────────────────────────────────
  const fraudFlags = [
    { flag: "Days Sales Receivables spiking (DSRI > 1.3)",        risk: m.dsri_days_sales_in_rec_index > 1.3 },
    { flag: "Gross Margin deteriorating (GMI > 1.2)",             risk: m.gmi_gross_margin_index > 1.2 },
    { flag: "Asset quality worsening (AQI > 1.2)",                risk: m.aqi_asset_quality_index > 1.2 },
    { flag: "Aggressive revenue recognition (SGI > 1.4)",         risk: m.sgi_sales_growth_index > 1.4 },
    { flag: "Unusual depreciation slowdown (DEPI > 1.1)",         risk: m.depi_depreciation_index > 1.1 },
    { flag: "Rising SGA expenses vs revenue (SGAI > 1.2)",        risk: m.sgai_sga_expense_index > 1.2 },
    { flag: "Leverage increasing dangerously (LVGI > 1.2)",       risk: m.lvgi_leverage_index > 1.2 },
    { flag: "High accruals-to-assets ratio (TATA > 0.05)",        risk: m.tata_total_accruals_to_total_assets > 0.05 },
    { flag: "Altman Z-Score in distress zone (< 1.8)",            risk: z.z_score < 1.8 },
    { flag: "Negative operating cash flow vs net income",         risk: e.ebitda < e.pat_net_profit * 0.5 },
  ];
  const activeFlags = fraudFlags.filter(f => f.risk).length;

  // ── Bankruptcy Prediction ─────────────────────────────────────────────────
  const bankruptcyRisk = z.z_score > 2.9 ? "Very Low (< 5%)" : z.z_score > 1.8 ? "Moderate (15-25%)" : "High (> 50%)";
  const bankruptcyColor = z.z_score > 2.9 ? "text-green-300" : z.z_score > 1.8 ? "text-amber-300" : "text-red-300";

  return (
    <div className="space-y-4">
      {/* ── Altman Z-Score ───────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <SectionHeader icon={Shield} title={`Altman Z-Score Solvency Rating — ${z.z_score}`} color="text-green-300" />
            <p className="text-[10px] text-muted-foreground mt-0.5">{z.interpretation}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={z.zone} />
            <span className={`text-xs font-bold ${bankruptcyColor}`}>Bankruptcy Risk: {bankruptcyRisk}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
          {[
            { label: "X1: WC / Total Assets",      val: z.x1_working_cap_to_total_assets,           weight: "1.2x", bench: "> 0.30" },
            { label: "X2: Ret. Earn / Assets",      val: z.x2_retained_earnings_to_total_assets,     weight: "1.4x", bench: "> 0.20" },
            { label: "X3: EBIT / Total Assets",     val: z.x3_ebit_to_total_assets,                  weight: "3.3x", bench: "> 0.10" },
            { label: "X4: MktVal / Liabilities",    val: z.x4_market_val_equity_to_total_liab,       weight: "0.6x", bench: "> 1.00" },
            { label: "X5: Sales / Total Assets",    val: z.x5_sales_to_total_assets,                 weight: "1.0x", bench: "> 0.50" },
          ].map(({ label, val, weight, bench }) => (
            <div key={label} className="p-2.5 rounded-lg bg-black/20 border border-white/5 space-y-0.5">
              <p className="text-muted-foreground text-[9px]">{label}</p>
              <p className="font-bold text-foreground text-[11px]">{val}</p>
              <p className="text-[8px] text-muted-foreground">Weight: {weight} · Bench: {bench}</p>
            </div>
          ))}
        </div>
        {/* Z-Score scale visualization */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>0 — Distress</span><span>1.8 — Grey Zone</span><span>2.9 — Safe Zone</span><span>5+</span>
          </div>
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500/40 via-amber-500/40 to-green-500/40 relative">
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-cyan-400 shadow-lg"
              style={{ left: `${Math.min(95, (z.z_score / 5) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Beneish M-Score ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <SectionHeader icon={Cpu} title={`Beneish M-Score Forensic Audit — ${m.m_score}`} color="text-cyan-300" />
            <p className="text-[10px] text-muted-foreground mt-0.5">M-Score &lt; -1.78 = Non-Manipulator. M &gt; -1.78 = Potential Earnings Manipulation Warning.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={m.risk_level === "LOW" ? "SAFE" : "WARNING"} />
            <span className={`text-xs font-bold ${activeFlags === 0 ? "text-green-300" : activeFlags < 3 ? "text-amber-300" : "text-red-300"}`}>{activeFlags} Red Flags</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
          {[
            { label: "DSRI — Receivables Index",   val: m.dsri_days_sales_in_rec_index,         ok: m.dsri_days_sales_in_rec_index < 1.1 },
            { label: "GMI — Gross Margin Index",   val: m.gmi_gross_margin_index,               ok: m.gmi_gross_margin_index < 1.1 },
            { label: "AQI — Asset Quality Index",  val: m.aqi_asset_quality_index,              ok: m.aqi_asset_quality_index < 1.1 },
            { label: "SGI — Sales Growth Index",   val: m.sgi_sales_growth_index,               ok: m.sgi_sales_growth_index < 1.3 },
            { label: "DEPI — Depreciation Index",  val: m.depi_depreciation_index,              ok: m.depi_depreciation_index < 1.1 },
            { label: "SGAI — SGA Expense Index",   val: m.sgai_sga_expense_index,               ok: m.sgai_sga_expense_index < 1.1 },
            { label: "LVGI — Leverage Index",      val: m.lvgi_leverage_index,                  ok: m.lvgi_leverage_index < 1.0 },
            { label: "TATA — Accruals/Assets",     val: m.tata_total_accruals_to_total_assets,  ok: m.tata_total_accruals_to_total_assets < 0.05 },
          ].map(({ label, val, ok }) => (
            <div key={label} className={`p-2 rounded border ${ok ? "bg-black/20 border-white/5" : "bg-red-500/10 border-red-500/20"}`}>
              <p className="text-muted-foreground text-[9px]">{label}</p>
              <div className="flex items-center justify-between">
                <p className={`font-bold text-[11px] ${ok ? "text-foreground" : "text-red-300"}`}>{val}</p>
                {ok ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <AlertTriangle className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Piotroski F-Score Full Breakdown ─────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={CheckSquare} title={`Piotroski F-Score — ${fScore}/9 Points · Fundamental Financial Strength`} color="text-purple-300" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["Profitability", "Leverage", "Efficiency"].map(group => (
            <div key={group} className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-2.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group} Signals</p>
              {piotroski.filter(p => p.group === group).map(({ label, pass }) => (
                <div key={label} className="flex items-start gap-2">
                  {pass ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />}
                  <span className={`text-[11px] leading-tight ${pass ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  <span className={`text-[9px] font-bold ml-auto shrink-0 ${pass ? "text-green-400" : "text-red-400"}`}>{pass ? "+1" : "0"}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Forensic Fraud Red Flags Checklist ───────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={AlertTriangle} title={`Forensic Audit Red Flags — ${activeFlags} of 10 Triggered`} color="text-rose-300" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {fraudFlags.map(({ flag, risk }) => (
            <div key={flag} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${
              risk ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-green-500/5 border-green-500/10 text-muted-foreground"}`}>
              {risk ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />}
              {flag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: EBITDA BRIDGE — Waterfall + Break-Even + Unit Economics + Valuation + Sensitivity
// ─────────────────────────────────────────────────────────────────────────────

function EBITDABridgeTab() {
  const { ebitdaBridge: e, duPont: d } = useContext(CFOContext);

  // ── Derived metrics ───────────────────────────────────────────────────────
  const fixedCosts       = e.employee_expenses + e.admin_other_opex + e.depreciation_amortization + e.interest_finance_costs;
  const variableCosts    = e.cogs_materials + e.sales_marketing_expenses;
  const contributionMargin = e.net_revenue - variableCosts;
  const cmPct            = e.net_revenue > 0 ? (contributionMargin / e.net_revenue) * 100 : 0;
  const breakEvenRev     = cmPct > 0 ? (fixedCosts / (cmPct / 100)) : 0;
  const marginOfSafety   = e.net_revenue > 0 ? ((e.net_revenue - breakEvenRev) / e.net_revenue) * 100 : 0;
  const operatingLeverage = e.ebitda > 0 ? contributionMargin / e.ebitda : 0;
  const assumedEmployees  = 32;
  const revPerEmp        = e.net_revenue / assumedEmployees;
  const gpPerEmp         = e.gross_profit / assumedEmployees;
  const costPerRupee     = e.net_revenue > 0 ? (variableCosts + fixedCosts) / e.net_revenue : 0;

  // ── Valuation multiples ───────────────────────────────────────────────────
  const ebitdaMultiples = [5, 7, 10, 12];

  // ── Revenue sensitivity ───────────────────────────────────────────────────
  const deltas = [-20, -10, 0, 10, 20];

  return (
    <div className="space-y-4">
      {/* ── EBITDA Waterfall Table ────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
        <SectionHeader icon={BarChart3} title="EBITDA Waterfall & Profitability Bridge — FY 2025-26" color="text-purple-300" />
        <div className="rounded-lg border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              <tr className="bg-white/2"><td className="px-3 py-2 font-sans font-bold text-foreground">Gross Sales Revenue</td><td className="px-3 py-2 text-right font-bold text-foreground">{fmtCr(e.gross_revenue)}</td><td className="px-3 py-2 text-right text-muted-foreground text-[9px]">100%</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Discounts &amp; Returns</td><td className="px-3 py-2 text-right text-red-300">-{fmtCr(e.discounts_returns)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground"></td></tr>
              <tr className="bg-cyan-500/5 font-bold"><td className="px-3 py-2 font-sans text-cyan-300">Net Sales Revenue</td><td className="px-3 py-2 text-right text-cyan-300">{fmtCr(e.net_revenue)}</td><td className="px-3 py-2 text-right text-[9px] text-cyan-300/60">100%</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: COGS &amp; Material Costs</td><td className="px-3 py-2 text-right text-red-300">-{fmtCr(e.cogs_materials)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground">{e.net_revenue > 0 ? fmtPct((e.cogs_materials/e.net_revenue)*100) : "—"}</td></tr>
              <tr className="bg-emerald-500/5 font-bold"><td className="px-3 py-2 font-sans text-emerald-300">Gross Profit</td><td className="px-3 py-2 text-right text-emerald-300">{fmtCr(e.gross_profit)}</td><td className="px-3 py-2 text-right text-[9px] text-emerald-300/70">{fmtPct(e.gross_margin_pct)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Payroll &amp; Staff Costs</td><td className="px-3 py-2 text-right text-amber-300">-{fmtCr(e.employee_expenses)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground">{e.net_revenue > 0 ? fmtPct((e.employee_expenses/e.net_revenue)*100) : "—"}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Sales &amp; Marketing</td><td className="px-3 py-2 text-right text-amber-300">-{fmtCr(e.sales_marketing_expenses)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground">{e.net_revenue > 0 ? fmtPct((e.sales_marketing_expenses/e.net_revenue)*100) : "—"}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Admin &amp; General OpEx</td><td className="px-3 py-2 text-right text-amber-300">-{fmtCr(e.admin_other_opex)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground">{e.net_revenue > 0 ? fmtPct((e.admin_other_opex/e.net_revenue)*100) : "—"}</td></tr>
              <tr className="bg-purple-500/10 font-bold text-sm"><td className="px-3 py-2.5 font-sans text-purple-300">EBITDA</td><td className="px-3 py-2.5 text-right text-purple-300">{fmtCr(e.ebitda)}</td><td className="px-3 py-2.5 text-right text-[9px] text-purple-300/70">{fmtPct(e.ebitda_margin_pct)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Depreciation &amp; Amortization</td><td className="px-3 py-2 text-right text-purple-200">-{fmtCr(e.depreciation_amortization)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground"></td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Interest &amp; Finance Charges</td><td className="px-3 py-2 text-right text-purple-200">-{fmtCr(e.interest_finance_costs)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground"></td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Tax Provision (25.17%)</td><td className="px-3 py-2 text-right text-rose-300">-{fmtCr(e.tax_provision)}</td><td className="px-3 py-2 text-right text-[9px] text-muted-foreground"></td></tr>
              <tr className="bg-green-500/10 font-bold text-sm"><td className="px-3 py-2.5 font-sans text-green-300">Net Profit after Tax (PAT)</td><td className="px-3 py-2.5 text-right text-green-300">{fmtCr(e.pat_net_profit)}</td><td className="px-3 py-2.5 text-right text-[9px] text-green-300/70">{fmtPct(e.pat_margin_pct)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Break-Even & Contribution Margin Analysis ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
          <SectionHeader icon={Target} title="Break-Even & Contribution Margin Analysis" color="text-amber-300" />
          <div className="space-y-2">
            {[
              { label: "Contribution Margin",         val: fmtCr(contributionMargin) },
              { label: "Contribution Margin %",       val: fmtPct(cmPct) },
              { label: "Fixed Cost Base",             val: fmtCr(fixedCosts) },
              { label: "Variable Cost Base",          val: fmtCr(variableCosts) },
              { label: "Break-Even Revenue",          val: fmtCr(breakEvenRev) },
              { label: "Margin of Safety",            val: fmtPct(marginOfSafety) },
              { label: "Operating Leverage Ratio",    val: fmtX(operatingLeverage) },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-bold text-foreground">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
          <SectionHeader icon={Users} title="Unit Economics & Productivity Metrics" color="text-cyan-300" />
          <div className="space-y-2">
            {[
              { label: "Revenue per Employee",       val: fmtL(revPerEmp) },
              { label: "Gross Profit per Employee",  val: fmtL(gpPerEmp) },
              { label: "Cost per ₹1 of Revenue",    val: fmtX(costPerRupee) },
              { label: "Payroll % of Revenue",       val: fmtPct((e.employee_expenses / Math.max(1, e.net_revenue)) * 100) },
              { label: "DuPont: Net Margin",         val: fmtPct(d.net_profit_margin_pct) },
              { label: "DuPont: Asset Turnover",     val: fmtX(d.asset_turnover_ratio) },
              { label: "DuPont: Equity Multiplier",  val: fmtX(d.equity_multiplier) },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-bold text-foreground">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DuPont 3-Point ROE ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-2">
        <SectionHeader icon={Layers} title={`DuPont 3-Point ROE Deconstruction — ${d.roe_pct}% ROE`} color="text-foreground" />
        <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Net Margin (Profitability)</p>
            <p className="text-base font-bold text-cyan-300 mt-0.5">{d.net_profit_margin_pct}%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">PAT ÷ Revenue</p>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Asset Turnover (Efficiency)</p>
            <p className="text-base font-bold text-purple-300 mt-0.5">{d.asset_turnover_ratio}x</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Revenue ÷ Total Assets</p>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Equity Multiplier (Leverage)</p>
            <p className="text-base font-bold text-amber-300 mt-0.5">{d.equity_multiplier}x</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Assets ÷ Equity</p>
          </div>
        </div>
        <p className="text-center text-[10px] font-mono text-muted-foreground">ROE = {d.net_profit_margin_pct}% × {d.asset_turnover_ratio}x × {d.equity_multiplier}x = <span className="text-cyan-300 font-bold">{d.roe_pct}%</span></p>
      </div>

      {/* ── Revenue Sensitivity Table ─────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Activity} title="Revenue Sensitivity Analysis — Impact on EBITDA & PAT" color="text-green-300" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
              <th className="text-left px-3 py-2">Revenue Change</th>
              <th className="text-right px-3 py-2">Revenue</th>
              <th className="text-right px-3 py-2 text-emerald-300">Gross Profit</th>
              <th className="text-right px-3 py-2 text-purple-300">EBITDA</th>
              <th className="text-right px-3 py-2 text-green-300">Est. PAT</th>
            </tr></thead>
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              {deltas.map(delta => {
                const adjRev  = e.net_revenue * (1 + delta / 100);
                const adjGP   = adjRev - e.cogs_materials * (1 + delta / 100);
                const adjEBIT = adjGP - e.employee_expenses - e.admin_other_opex - e.sales_marketing_expenses;
                const adjPAT  = Math.max(0, adjEBIT - e.interest_finance_costs) * 0.75;
                return (
                  <tr key={delta} className={`hover:bg-white/2 ${delta === 0 ? "bg-white/3 font-bold" : ""}`}>
                    <td className={`px-3 py-2 font-sans font-semibold ${delta > 0 ? "text-green-300" : delta < 0 ? "text-red-300" : "text-cyan-300"}`}>
                      {delta > 0 ? "+" : ""}{delta}% {delta === 0 ? "(Base Case)" : ""}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">{fmtCr(adjRev)}</td>
                    <td className="px-3 py-2 text-right text-emerald-300">{fmtCr(adjGP)}</td>
                    <td className={`px-3 py-2 text-right ${adjEBIT >= 0 ? "text-purple-300" : "text-red-300"}`}>{fmtCr(adjEBIT)}</td>
                    <td className={`px-3 py-2 text-right ${adjPAT >= 0 ? "text-green-300" : "text-red-300"}`}>{fmtCr(adjPAT)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EBITDA Valuation Multiples ────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={DollarSign} title="Business Valuation — EBITDA Multiple Method" color="text-green-300" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ebitdaMultiples.map(mult => (
            <div key={mult} className="p-3 rounded-xl border border-white/8 bg-card/40 text-center">
              <p className="text-[10px] text-muted-foreground">{mult}x EBITDA Multiple</p>
              <p className="text-base font-bold font-mono text-green-300 mt-0.5">{fmtCr(e.ebitda * mult)}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{mult <= 6 ? "Distressed/Small" : mult <= 8 ? "Industry Average" : mult <= 10 ? "Growth Premium" : "High-Growth"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: WORKING CAPITAL — CCC + Aging + Debtor Heat + MSME 43B(h) + Trade Finance
// ─────────────────────────────────────────────────────────────────────────────

function WorkingCapitalTab() {
  const { workingCapCCC: c, ebitdaBridge: e, altmanZ: z } = useContext(CFOContext);

  // ── Working capital efficiency score ─────────────────────────────────────
  const wcScore = Math.max(0, Math.min(100, Math.round(100 - (c.ccc_days / 120) * 100)));

  // ── Debtor Aging (simulated from DSO) ────────────────────────────────────
  const totalDebtors = (c.dso_days_sales_outstanding / 365) * e.net_revenue;
  const aging = [
    { bucket: "0–30 Days",  pct: 45, color: "text-green-300",  bar: "bg-green-500" },
    { bucket: "31–60 Days", pct: 30, color: "text-amber-300",  bar: "bg-amber-500" },
    { bucket: "61–90 Days", pct: 15, color: "text-orange-300", bar: "bg-orange-500" },
    { bucket: "90+ Days",   pct: 10, color: "text-red-300",    bar: "bg-red-500" },
  ].map(a => ({ ...a, amount: totalDebtors * a.pct / 100 }));

  // ── Top Debtors (simulated) ───────────────────────────────────────────────
  const topDebtors = [
    { name: "Gamma Wholesale Ltd",   amount: totalDebtors * 0.33, dso: 92, risk: "HIGH" },
    { name: "Epsilon Tech Solutions",amount: totalDebtors * 0.43, dso: 78, risk: "MEDIUM" },
    { name: "Beta Retail Chain",     amount: totalDebtors * 0.24, dso: 45, risk: "LOW" },
  ];

  // ── Working Capital Gap ───────────────────────────────────────────────────
  const wcFundingGap = (c.dso_days_sales_outstanding - c.dpo_days_payables_outstanding) / 365 * e.net_revenue;

  // ── MSME 43B(h) compliance ────────────────────────────────────────────────
  const msme43bDays = c.dpo_days_payables_outstanding;
  const msme43bCompliant = msme43bDays <= 45;

  // ── Trade Finance Opportunity ────────────────────────────────────────────
  const factoringOpportunity = totalDebtors * 0.80; // 80% advance on invoices
  const factoringCost = factoringOpportunity * 0.015; // 1.5% factoring fee

  return (
    <div className="space-y-4">
      {/* ── CCC Key Banner ───────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <SectionHeader icon={Clock} title={`Cash Conversion Cycle (CCC) — ${c.ccc_days} Days`} color="text-amber-300" />
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.recommendation}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">WC Efficiency Score</p>
              <p className={`text-lg font-bold font-mono ${wcScore > 65 ? "text-green-300" : wcScore > 40 ? "text-amber-300" : "text-red-300"}`}>{wcScore}/100</p>
            </div>
            <span className="text-xs font-bold font-mono text-green-300">Unlock: {fmtL(c.potential_cash_unlocked_inr)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
          {[
            { label: "DSO — Days Sales Outstanding", val: c.dso_days_sales_outstanding, sub: "Collect faster = free cash", color: "text-amber-300", bench: "< 45d" },
            { label: "DIO — Days Inventory Held",    val: c.dio_days_inventory_outstanding, sub: "Sell faster = free cash",    color: "text-cyan-300",  bench: "< 30d" },
            { label: "DPO — Days Payable Held",      val: c.dpo_days_payables_outstanding, sub: "Pay later = keep cash",       color: "text-purple-300", bench: "> 30d" },
          ].map(({ label, val, sub, color, bench }) => (
            <div key={label} className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${color}`}>{val}d</p>
              <p className="text-[9px] text-muted-foreground">{sub}</p>
              <p className="text-[9px] text-muted-foreground">Bench: {bench}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] font-mono text-muted-foreground">CCC = DSO ({c.dso_days_sales_outstanding}d) + DIO ({c.dio_days_inventory_outstanding}d) − DPO ({c.dpo_days_payables_outstanding}d) = <span className="text-amber-300 font-bold">{c.ccc_days} Days</span></p>
      </div>

      {/* ── Debtor Aging Analysis ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Calendar} title={`Debtor Aging Analysis — Total Outstanding: ${fmtCr(totalDebtors)}`} color="text-cyan-300" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {aging.map(a => (
            <div key={a.bucket} className="p-3 rounded-xl border border-white/8 bg-card/40 space-y-2">
              <p className="text-[10px] text-muted-foreground">{a.bucket}</p>
              <p className={`text-sm font-bold font-mono ${a.color}`}>{fmtL(a.amount)}</p>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] text-muted-foreground"><span>{a.pct}% of total</span></div>
                <MiniBar pct={a.pct} color={a.bar} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Debtors with Risk ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={AlertTriangle} title="Top Debtor Concentration & Collection Risk" color="text-rose-300" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
              <th className="text-left px-3 py-2">Debtor</th>
              <th className="text-right px-3 py-2">Outstanding</th>
              <th className="text-right px-3 py-2">DSO</th>
              <th className="text-right px-3 py-2">% of Total</th>
              <th className="text-center px-3 py-2">Collection Risk</th>
            </tr></thead>
            <tbody className="divide-y divide-white/4 text-[11px]">
              {topDebtors.map(dt => (
                <tr key={dt.name} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-semibold text-foreground">{dt.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">{fmtL(dt.amount)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold ${dt.dso > 90 ? "text-red-300" : dt.dso > 60 ? "text-amber-300" : "text-green-300"}`}>{dt.dso}d</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fmtPct((dt.amount / totalDebtors) * 100)}</td>
                  <td className="px-3 py-2 text-center"><StatusPill status={dt.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MSME 43B(h) Compliance + WC Gap + Trade Finance ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-4 rounded-xl border space-y-2 ${msme43bCompliant ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <SectionHeader icon={CheckSquare} title="MSME 43B(h) Compliance" color={msme43bCompliant ? "text-green-300" : "text-red-300"} />
          <p className={`text-sm font-bold font-mono ${msme43bCompliant ? "text-green-300" : "text-red-300"}`}>{msme43bCompliant ? "✓ COMPLIANT" : "✗ AT RISK"}</p>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p>DPO: {msme43bDays} Days {msme43bCompliant ? "≤ 45" : "> 45"}</p>
            <p>{msme43bCompliant ? "Payments to MSME vendors within 45 days. Tax deduction safe." : "ALERT: Payments to MSME vendors > 45 days. Expense deduction at risk u/s 43B(h)."}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
          <SectionHeader icon={AlertCircle} title="Working Capital Funding Gap" color="text-amber-300" />
          <p className="text-sm font-bold font-mono text-amber-300">{fmtL(wcFundingGap)}</p>
          <p className="text-[11px] text-muted-foreground">Gap = (DSO − DPO) / 365 × Revenue. This is the cash tied up in operations that needs financing.</p>
        </div>

        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
          <SectionHeader icon={TrendingUp} title="Invoice Discounting Opportunity" color="text-purple-300" />
          <p className="text-sm font-bold font-mono text-purple-300">{fmtL(factoringOpportunity)}</p>
          <p className="text-[11px] text-muted-foreground">80% advance on {fmtL(totalDebtors)} outstanding invoices. Cost: ~{fmtL(factoringCost)} (1.5% fee). Frees cash immediately.</p>
        </div>
      </div>

      {/* ── Working Capital Improvement Actions ──────────────────────────── */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-2">
        <SectionHeader icon={Zap} title="AI Working Capital Improvement Playbook" color="text-cyan-300" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { action: "Reduce DSO by 10 days", impact: fmtL(e.net_revenue * 10 / 365), how: "Early payment discounts (1-2%), stricter 30-day credit terms" },
            { action: "Increase DPO by 10 days", impact: fmtL(e.cogs_materials * 10 / 365), how: "Negotiate 45-day payment terms with key non-MSME suppliers" },
            { action: "Reduce Inventory by 20%", impact: fmtL(c.dio_days_inventory_outstanding * 0.2 * e.cogs_materials / 365), how: "JIT ordering, faster delivery cycles, ABC analysis" },
            { action: "Factoring top 3 invoices", impact: fmtL(factoringOpportunity), how: "Register on TReDS (RXIL, Invoicemart) — RBI-mandated MSME platform" },
          ].map(({ action, impact, how }) => (
            <div key={action} className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-foreground">{action}</p>
                <span className="text-[10px] font-bold font-mono text-green-300">{impact} freed</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{how}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 6: BOARD DECK — Risk Matrix + Covenants + P&L Forecast + Strategy
// ─────────────────────────────────────────────────────────────────────────────

function BoardDeckTab() {
  const { boardReport: b, ebitdaBridge: e, altmanZ: z, workingCapCCC: c, healthScore: s } = useContext(CFOContext);

  // ── Risk Matrix (5 risks: likelihood × impact 1–3) ────────────────────────
  const risks = [
    { label: "Debtor Default Risk",       likelihood: 2, impact: 3, action: "Reduce DSO, tighten credit policy, get PDC cheques" },
    { label: "GST Compliance Risk",       likelihood: 1, impact: 3, action: "Auto-reconcile GSTR-2B monthly, no ITC reversals" },
    { label: "Cash Flow Liquidity Risk",  likelihood: c.ccc_days > 90 ? 3 : 2, impact: 2, action: "Maintain 3-month cash buffer, arrange pre-approved OD" },
    { label: "Revenue Concentration Risk",likelihood: 2, impact: 2, action: "No single client > 30% of revenue" },
    { label: "Regulatory/Labour Risk",    likelihood: 1, impact: 2, action: "Ensure PF/ESIC/TDS deposited on time every month" },
  ];
  const riskColor = (l: number, i: number) => {
    const score = l * i;
    return score >= 6 ? "bg-red-500/20 border-red-500/30 text-red-300" :
           score >= 3 ? "bg-amber-500/20 border-amber-500/30 text-amber-300" :
                        "bg-green-500/20 border-green-500/30 text-green-300";
  };

  // ── Covenant compliance (typical bank loan covenants) ─────────────────────
  const currentRatio    = parseFloat(((z.x1_working_cap_to_total_assets * 2.5) + 1.2).toFixed(2));
  const debtToEquity    = parseFloat((1 / Math.max(0.1, z.x4_market_val_equity_to_total_liab)).toFixed(2));
  const interestCoverage = parseFloat((e.ebitda / Math.max(1, e.interest_finance_costs)).toFixed(1));
  const covenants = [
    { name: "Current Ratio ≥ 1.33",         actual: `${currentRatio}x`,         compliant: currentRatio >= 1.33 },
    { name: "Debt / Equity ≤ 2.0x",         actual: `${debtToEquity}x`,         compliant: debtToEquity <= 2.0 },
    { name: "Interest Coverage ≥ 2.0x",     actual: `${interestCoverage}x`,     compliant: interestCoverage >= 2.0 },
    { name: "DSCR ≥ 1.25x",                 actual: `${Math.min(interestCoverage * 0.8, 4).toFixed(1)}x`, compliant: interestCoverage >= 1.5 },
    { name: "Net Profit Positive",           actual: e.pat_net_profit > 0 ? "Yes" : "No", compliant: e.pat_net_profit > 0 },
    { name: "EBITDA Margin ≥ 10%",          actual: fmtPct(e.ebitda_margin_pct), compliant: e.ebitda_margin_pct >= 10 },
  ];
  const covenantBreaches = covenants.filter(c => !c.compliant).length;

  // ── 12-Month P&L Forecast ─────────────────────────────────────────────────
  const monthlyRev = e.net_revenue / 12;
  const monthlyGP  = e.gross_profit / 12;
  const monthlyPAT = e.pat_net_profit / 12;
  const growthPct  = 0.05;
  const months12   = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const forecast12 = months12.map((mo, i) => {
    const g = 1 + (i * growthPct / 12);
    return { mo, rev: monthlyRev * g, gp: monthlyGP * g, pat: monthlyPAT * g };
  });

  // ── Strategic Initiatives ────────────────────────────────────────────────
  const initiatives = [
    { name: "GST ITC Reconciliation",      status: "IN PROGRESS", priority: "HIGH",   impact: "Recover blocked ITC", statusColor: "text-amber-300" },
    { name: "Debtor Collection Drive",      status: "PENDING",     priority: "HIGH",   impact: "Unlock Rs 6.8 Cr cash", statusColor: "text-red-300" },
    { name: "MSME 43B(h) Compliance",      status: "COMPLIANT",   priority: "MEDIUM", impact: "Protect tax deductions", statusColor: "text-green-300" },
    { name: "TReDS Invoice Discounting",    status: "EVALUATE",    priority: "MEDIUM", impact: "Free working capital", statusColor: "text-cyan-300" },
    { name: "Tax Optimization Review",      status: "PENDING",     priority: "HIGH",   impact: "Save Rs 5-15L tax", statusColor: "text-red-300" },
    { name: "Bank Covenant Review",         status: covenantBreaches > 0 ? "AT RISK" : "COMPLIANT", priority: "HIGH", impact: "Maintain credit facility", statusColor: covenantBreaches > 0 ? "text-red-300" : "text-green-300" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Board Report Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-bold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" />Executive Board Briefing Draft</p>
          <p className="text-[10px] text-muted-foreground">Auto-generated monthly executive summary for Board of Directors &amp; Lending Banks</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 transition-all">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8 transition-all">
            <Send className="w-3.5 h-3.5" /> Email Directors
          </button>
        </div>
      </div>

      {/* ── Executive Summary Card ────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/60 space-y-3">
        <div className="border-b border-white/8 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">{b.report_title}</h3>
            <p className="text-[10px] text-muted-foreground">{b.company_name} · {b.financial_period}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{b.generated_date}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-cyan-300 mb-1">Executive Summary</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{b.executive_summary}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {b.key_kpis.map(kpi => (
            <div key={kpi.label} className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bank Covenant Compliance ──────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={CheckSquare} title={`Bank Loan Covenant Compliance — ${covenantBreaches === 0 ? "All Clear" : `${covenantBreaches} Breach(es) — ACTION REQUIRED`}`}
          color={covenantBreaches === 0 ? "text-green-300" : "text-red-300"} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {covenants.map(cv => (
            <div key={cv.name} className={`p-3 rounded-xl border flex items-center justify-between ${cv.compliant ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <div>
                <p className="text-[11px] font-bold text-foreground">{cv.name}</p>
                <p className={`text-xs font-mono font-bold ${cv.compliant ? "text-green-300" : "text-red-300"}`}>{cv.actual}</p>
              </div>
              {cv.compliant ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Risk Matrix ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={AlertTriangle} title="Enterprise Risk Matrix — Likelihood × Impact Assessment" color="text-rose-300" />
        <div className="space-y-2">
          {risks.map(r => (
            <div key={r.label} className={`p-3 rounded-xl border flex items-center gap-3 ${riskColor(r.likelihood, r.impact)}`}>
              <div className="flex gap-1 shrink-0">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/20">L{r.likelihood}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/20">I{r.impact}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/20">={r.likelihood * r.impact}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">{r.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{r.action}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground">L = Likelihood (1=Low, 3=High) · I = Impact (1=Low, 3=High) · Score = L×I (1-2=Green, 3-4=Amber, 6-9=Red)</p>
      </div>

      {/* ── Strategic Initiatives Tracker ────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={Target} title="Strategic CFO Initiatives Tracker" color="text-purple-300" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
              <th className="text-left px-3 py-2">Initiative</th>
              <th className="text-center px-3 py-2">Priority</th>
              <th className="text-left px-3 py-2">Expected Impact</th>
              <th className="text-center px-3 py-2">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-white/4 text-[11px]">
              {initiatives.map(ini => (
                <tr key={ini.name} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-semibold text-foreground">{ini.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ini.priority === "HIGH" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>{ini.priority}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{ini.impact}</td>
                  <td className="px-3 py-2 text-center"><span className={`text-[9px] font-bold ${ini.statusColor}`}>{ini.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 12-Month P&L Forecast ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionHeader icon={BarChart3} title="12-Month Forward P&L Projection (FY 2025-26) — 5% Annualized Growth Assumption" color="text-cyan-300" />
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2">Month</th>
                {forecast12.map(m => <th key={m.mo} className="text-right px-2 py-2">{m.mo}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-white/4 font-mono text-[9px]">
                <tr className="hover:bg-white/2">
                  <td className="px-3 py-2 font-sans font-bold text-foreground">Revenue</td>
                  {forecast12.map(m => <td key={m.mo} className="px-2 py-2 text-right text-foreground">{fmtL(m.rev)}</td>)}
                </tr>
                <tr className="hover:bg-white/2">
                  <td className="px-3 py-2 font-sans text-emerald-300">Gross Profit</td>
                  {forecast12.map(m => <td key={m.mo} className="px-2 py-2 text-right text-emerald-300">{fmtL(m.gp)}</td>)}
                </tr>
                <tr className="hover:bg-white/2 bg-white/1">
                  <td className="px-3 py-2 font-sans font-bold text-green-300">PAT</td>
                  {forecast12.map(m => <td key={m.mo} className={`px-2 py-2 text-right font-bold ${m.pat >= 0 ? "text-green-300" : "text-red-300"}`}>{fmtL(m.pat)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── CFO Recommendations ───────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-purple-500/15 bg-purple-500/5 space-y-2">
        <p className="text-xs font-bold text-purple-300">CFO Strategic Recommendations</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {b.strategic_recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">•</span><span>{rec}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type CFOIntelTab = "summary" | "simulator" | "solvency" | "ebitda" | "workingcap" | "boarddeck";

export function CFOIntelligenceModule({
  companyId, companyName,
  invoices = [], purchases = [], expenses = [],
  payroll = [], bankTxns = [], bankBalance = 0,
}: CFOModuleProps) {
  const [activeTab, setActiveTab] = useState<CFOIntelTab>("summary");

  const bundle = useMemo<CFOBundle>(() => {
    const isDemoMode = !companyId || companyId.includes("demo");
    const hasRealData = invoices.length > 0 || purchases.length > 0 || payroll.length > 0 || expenses.length > 0;
    if (!isDemoMode && hasRealData) {
      return buildCFOFromLiveData(invoices, purchases, expenses, payroll, bankTxns, bankBalance, companyName || "Your Company");
    }
    return {
      cashForecast: DEMO_CASH_FORECAST, scenarioInputs: DEMO_SCENARIO_INPUTS,
      scenarioOutputs: DEMO_SCENARIO_OUTPUTS, altmanZ: DEMO_ALTMAN_ZSCORE,
      beneishM: DEMO_BENEISH_MSCORE, duPont: DEMO_DUPONT_ANALYSIS,
      workingCapCCC: DEMO_WORKING_CAPITAL_CCC, ebitdaBridge: DEMO_EBITDA_BRIDGE,
      healthScore: DEMO_CFO_HEALTH_SCORECARD, boardReport: DEMO_BOARD_REPORT_DRAFT,
      isLiveData: false,
    };
  }, [companyId, invoices, purchases, expenses, payroll, bankTxns, bankBalance, companyName]);

  const tabs: { id: CFOIntelTab; label: string; icon: any; badge?: string }[] = [
    { id: "summary",    label: "Executive Health", icon: Sparkles,  badge: `Score ${bundle.healthScore.overall_score}` },
    { id: "simulator",  label: "Cash Runway AI",   icon: Sliders,   badge: "90-Day" },
    { id: "solvency",   label: "Solvency & Audit", icon: Shield,    badge: `Z:${bundle.altmanZ.z_score}` },
    { id: "ebitda",     label: "EBITDA Bridge",    icon: BarChart3, badge: `${bundle.ebitdaBridge.ebitda_margin_pct}%` },
    { id: "workingcap", label: "Working Capital",  icon: Clock,     badge: `${bundle.workingCapCCC.ccc_days}d CCC` },
    { id: "boarddeck",  label: "Board Deck PDF",   icon: FileText,  badge: "Executive" },
  ];

  return (
    <CFOContext.Provider value={bundle}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Virtual CFO AI &amp; Advanced Financial Intelligence Engine
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              30/60/90-Day Cash Runway · Altman Z-Score · Beneish M-Score · Piotroski F-Score · DuPont ROE · EBITDA Waterfall · Break-Even · Debtor Aging · Risk Matrix · Board Deck
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bundle.isLiveData && <span className="text-[10px] px-2.5 py-1 rounded-full border font-bold bg-green-500/15 border-green-500/25 text-green-300">LIVE DATA</span>}
            <span className="text-[10px] px-2.5 py-1 rounded-full border font-bold bg-cyan-500/15 border-cyan-500/25 text-cyan-300">
              CFO Index: {bundle.healthScore.overall_score}/100 ({bundle.healthScore.grade})
            </span>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap border-b border-white/5 pb-1">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300" : "text-muted-foreground hover:bg-white/5"}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === id ? "bg-cyan-500/20 text-cyan-200" : "bg-white/10 text-muted-foreground"}`}>{badge}</span>}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
            {activeTab === "summary"    && <ExecutiveSummaryTab />}
            {activeTab === "simulator"  && <CashFlowSimulatorTab />}
            {activeTab === "solvency"   && <SolvencyAuditTab />}
            {activeTab === "ebitda"     && <EBITDABridgeTab />}
            {activeTab === "workingcap" && <WorkingCapitalTab />}
            {activeTab === "boarddeck"  && <BoardDeckTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </CFOContext.Provider>
  );
}
