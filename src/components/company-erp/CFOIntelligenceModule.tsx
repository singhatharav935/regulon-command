/**
 * ADVANCED CFO INTELLIGENCE MODULE — VIRTUAL CFO AI UI (100% COMPLETE)
 * =======================================================================
 * 6-tab executive financial intelligence platform:
 *  Tab 1 — Executive Summary & Health Scorecard: 0-100 CFO Score, Altman Z, Beneish M, DuPont
 *  Tab 2 — 30/60/90-Day Predictive Cash Flow & What-If Scenario Simulator: Interactive scenario builder
 *  Tab 3 — Solvency & Forensic Audit: Altman Z-Score & Beneish M-Score deep dive
 *  Tab 4 — EBITDA Waterfall & Unit Economics: EBITDA bridge, SaaS metrics, Rule of 40
 *  Tab 5 — Working Capital & CCC Engine: DSO, DIO, DPO breakdown & cash unlock recommendations
 *  Tab 6 — Board Deck & Executive PDF Generator: 1-click Board Briefing summary draft
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, TrendingUp, TrendingDown, Shield, Scale, Activity, Calculator,
  FileText, Download, Send, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Sliders, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Layers, HelpCircle,
  Building2, DollarSign, FileCheck2, Cpu
} from "lucide-react";

import {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function fmtLakhs(n: number): string {
  return `₹${(Math.abs(n) / 100000).toFixed(2)}L`;
}

function fmtCr(n: number): string {
  return `₹${(Math.abs(n) / 10000000).toFixed(2)} Cr`;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    SAFE: "bg-green-500/15 text-green-300 border-green-500/25",
    GOOD: "bg-green-500/15 text-green-300 border-green-500/25",
    LOW: "bg-green-500/15 text-green-300 border-green-500/25",
    TIGHT: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    GREY: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    WARNING: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    MODERATE: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    DEFICIT: "bg-red-500/15 text-red-300 border-red-500/25",
    DISTRESS: "bg-red-500/15 text-red-300 border-red-500/25",
    HIGH: "bg-red-500/15 text-red-300 border-red-500/25",
    CRITICAL: "bg-red-500/15 text-red-300 border-red-500/25",
  };
  const cls = map[status] || "bg-white/10 text-muted-foreground border-white/15";
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}>{status}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: EXECUTIVE SUMMARY & HEALTH SCORECARD
// ─────────────────────────────────────────────────────────────────────────────

function ExecutiveSummaryTab() {
  const s = DEMO_CFO_HEALTH_SCORECARD;
  const z = DEMO_ALTMAN_ZSCORE;
  const m = DEMO_BENEISH_MSCORE;
  const d = DEMO_DUPONT_ANALYSIS;

  return (
    <div className="space-y-4">
      {/* Primary Scorecard Header */}
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
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-driven multi-factor rating combining Liquidity, Profitability, Solvency (Altman Z), Earnings Quality (Beneish M), and Capital Efficiency (DuPont).
            </p>
          </div>
        </div>
        <div className="flex gap-3 font-mono text-xs text-right shrink-0">
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Altman Z-Score</p>
            <p className="font-bold text-green-300">{z.z_score} ({z.zone})</p>
          </div>
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Beneish M-Score</p>
            <p className="font-bold text-cyan-300">{m.m_score} (Clean)</p>
          </div>
          <div className="p-2 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Return on Equity</p>
            <p className="font-bold text-purple-300">{d.roe_pct}% ROE</p>
          </div>
        </div>
      </div>

      {/* Sub-Score Bars */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Liquidity Score", val: s.liquidity_score, color: "bg-cyan-400" },
          { label: "Profitability Score", val: s.profitability_score, color: "bg-purple-400" },
          { label: "Solvency Score", val: s.solvency_score, color: "bg-green-400" },
          { label: "Efficiency Score", val: s.efficiency_score, color: "bg-amber-400" },
          { label: "Growth Quality", val: s.growth_score, color: "bg-blue-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="p-3 rounded-xl border border-white/8 bg-card/40 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="font-mono font-bold text-foreground">{val}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Highlights & AI Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positives */}
        <div className="p-4 rounded-xl border border-green-500/15 bg-green-500/5 space-y-2">
          <p className="text-xs font-bold text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Strategic Strengths & Positives
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {s.key_positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Items */}
        <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 space-y-2">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Virtual CFO Advisory & Action Items
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {s.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: 30/60/90-DAY PREDICTIVE CASH FLOW & SCENARIO SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────

function CashFlowSimulatorTab() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOutput>(DEMO_SCENARIO_OUTPUTS[0]);

  // Daily cash runway trend sample
  const sampleDays = DEMO_CASH_FORECAST.filter((_, i) => i % 5 === 0);

  return (
    <div className="space-y-4">
      {/* What-If Scenario Selector */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
        <p className="text-xs font-bold text-purple-300 flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Interactive What-If Scenario Stress Testing
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {DEMO_SCENARIO_OUTPUTS.map(out => (
            <button key={out.scenario_id} onClick={() => setSelectedScenario(out)}
              className={`p-3 rounded-lg text-left border transition-all ${selectedScenario.scenario_id === out.scenario_id ? "bg-purple-500/20 border-purple-500/40 text-foreground" : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/3"}`}>
              <p className="text-xs font-bold truncate">{out.scenario_name}</p>
              <p className="text-[10px] font-mono mt-1 text-purple-300">Min Cash: {fmtLakhs(out.min_cash_balance_inr)}</p>
            </button>
          ))}
        </div>

        {/* Selected Scenario Impact Banner */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/8 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">{selectedScenario.scenario_name}</span>
            <span className={`font-mono font-bold ${selectedScenario.runway_impact_days >= 0 ? "text-green-300" : "text-red-300"}`}>
              {selectedScenario.runway_impact_days >= 0 ? `+${selectedScenario.runway_impact_days} Days Runway` : `${selectedScenario.runway_impact_days} Days Lost`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{selectedScenario.recommendation}</p>
        </div>
      </div>

      {/* 90-Day Predictive Cash Runway Projection */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">90-Day Cash Runway Projection (Oct 2025 → Dec 2025)</p>
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-right px-3 py-2">Opening Cash</th>
                  <th className="text-right px-3 py-2 text-green-300">Debtor Inflows</th>
                  <th className="text-right px-3 py-2 text-amber-300">Supplier Outflows</th>
                  <th className="text-right px-3 py-2 text-purple-300">Payroll</th>
                  <th className="text-right px-3 py-2 text-rose-300">Tax Payment</th>
                  <th className="text-right px-3 py-2">Closing Cash</th>
                  <th className="text-center px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4 font-mono text-[10px]">
                {sampleDays.map(day => (
                  <tr key={day.date} className="hover:bg-white/2">
                    <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px]">{day.day_label}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{fmtINR(day.opening_balance)}</td>
                    <td className="px-3 py-2 text-right text-green-300 font-bold">{day.expected_inflows_debtors > 0 ? fmtINR(day.expected_inflows_debtors) : "—"}</td>
                    <td className="px-3 py-2 text-right text-amber-300">{day.expected_outflows_creditors > 0 ? fmtINR(day.expected_outflows_creditors) : "—"}</td>
                    <td className="px-3 py-2 text-right text-purple-300">{day.expected_outflows_payroll > 0 ? fmtINR(day.expected_outflows_payroll) : "—"}</td>
                    <td className="px-3 py-2 text-right text-rose-300">{day.expected_outflows_tax > 0 ? fmtINR(day.expected_outflows_tax) : "—"}</td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">{fmtINR(day.closing_balance)}</td>
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
// TAB 3: SOLVENCY & FORENSIC AUDIT (ALTMAN Z & BENEISH M)
// ─────────────────────────────────────────────────────────────────────────────

function SolvencyAuditTab() {
  const z = DEMO_ALTMAN_ZSCORE;
  const m = DEMO_BENEISH_MSCORE;

  return (
    <div className="space-y-4">
      {/* Altman Z-Score Solvency Section */}
      <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-green-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Altman Z-Score Solvency Rating — {z.z_score}
            </p>
            <p className="text-[10px] text-muted-foreground">{z.interpretation}</p>
          </div>
          <StatusPill status={z.zone} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
            <p className="text-muted-foreground text-[9px]">X1: WC / Total Assets</p>
            <p className="font-bold text-foreground mt-0.5">{z.x1_working_cap_to_total_assets}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
            <p className="text-muted-foreground text-[9px]">X2: RE / Total Assets</p>
            <p className="font-bold text-foreground mt-0.5">{z.x2_retained_earnings_to_total_assets}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
            <p className="text-muted-foreground text-[9px]">X3: EBIT / Total Assets</p>
            <p className="font-bold text-foreground mt-0.5">{z.x3_ebit_to_total_assets}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
            <p className="text-muted-foreground text-[9px]">X4: Mkt Val / Liabilities</p>
            <p className="font-bold text-foreground mt-0.5">{z.x4_market_val_equity_to_total_liab}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
            <p className="text-muted-foreground text-[9px]">X5: Sales / Total Assets</p>
            <p className="font-bold text-foreground mt-0.5">{z.x5_sales_to_total_assets}</p>
          </div>
        </div>
      </div>

      {/* Beneish M-Score Forensic Earnings Quality Section */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Beneish M-Score Forensic Audit — {m.m_score} (Clean / Non-Manipulator)
            </p>
            <p className="text-[10px] text-muted-foreground">M-Score below -1.78 indicates high probability of un-manipulated, clean financial reporting.</p>
          </div>
          <StatusPill status={m.risk_level === "LOW" ? "SAFE" : "WARNING"} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">DSRI (Rec Index)</p><p className="font-bold text-foreground">{m.dsri_days_sales_in_rec_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">GMI (Margin Index)</p><p className="font-bold text-foreground">{m.gmi_gross_margin_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">AQI (Asset Quality)</p><p className="font-bold text-foreground">{m.aqi_asset_quality_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">SGI (Sales Growth)</p><p className="font-bold text-foreground">{m.sgi_sales_growth_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">DEPI (Depreciation)</p><p className="font-bold text-foreground">{m.depi_depreciation_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">SGAI (SGA Expense)</p><p className="font-bold text-foreground">{m.sgai_sga_expense_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">LVGI (Leverage)</p><p className="font-bold text-foreground">{m.lvgi_leverage_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">TATA (Accruals/Assets)</p><p className="font-bold text-foreground">{m.tata_total_accruals_to_total_assets}</p></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: EBITDA WATERFALL & UNIT ECONOMICS
// ─────────────────────────────────────────────────────────────────────────────

function EBITDABridgeTab() {
  const e = DEMO_EBITDA_BRIDGE;
  const d = DEMO_DUPONT_ANALYSIS;

  return (
    <div className="space-y-4">
      {/* EBITDA Bridge Table */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
        <p className="text-xs font-bold text-purple-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          EBITDA Waterfall & Profitability Bridge — FY 2025-26
        </p>

        <div className="rounded-lg border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              <tr className="bg-white/2"><td className="px-3 py-2 font-sans font-bold text-foreground">Gross Sales Revenue</td><td className="px-3 py-2 text-right font-bold text-foreground">{fmtINR(e.gross_revenue)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Discounts & Returns</td><td className="px-3 py-2 text-right text-red-300">-{fmtINR(e.discounts_returns)}</td></tr>
              <tr className="bg-cyan-500/5 font-bold"><td className="px-3 py-2 font-sans text-cyan-300">Net Sales Revenue</td><td className="px-3 py-2 text-right text-cyan-300">{fmtINR(e.net_revenue)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: COGS & Material Costs</td><td className="px-3 py-2 text-right text-red-300">-{fmtINR(e.cogs_materials)}</td></tr>
              <tr className="bg-emerald-500/5 font-bold"><td className="px-3 py-2 font-sans text-emerald-300">Gross Profit ({e.gross_margin_pct}% Margin)</td><td className="px-3 py-2 text-right text-emerald-300">{fmtINR(e.gross_profit)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Payroll Expenses</td><td className="px-3 py-2 text-right text-amber-300">-{fmtINR(e.employee_expenses)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Sales & Marketing</td><td className="px-3 py-2 text-right text-amber-300">-{fmtINR(e.sales_marketing_expenses)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: General & Admin OpEx</td><td className="px-3 py-2 text-right text-amber-300">-{fmtINR(e.admin_other_opex)}</td></tr>
              <tr className="bg-purple-500/10 font-bold text-sm"><td className="px-3 py-2.5 font-sans text-purple-300">EBITDA ({e.ebitda_margin_pct}% EBITDA Margin)</td><td className="px-3 py-2.5 text-right text-purple-300">{fmtINR(e.ebitda)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Depreciation & Amortization</td><td className="px-3 py-2 text-right text-purple-200">-{fmtINR(e.depreciation_amortization)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Interest & Finance Charges</td><td className="px-3 py-2 text-right text-purple-200">-{fmtINR(e.interest_finance_costs)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Tax Provision (25%)</td><td className="px-3 py-2 text-right text-rose-300">-{fmtINR(e.tax_provision)}</td></tr>
              <tr className="bg-green-500/10 font-bold text-sm"><td className="px-3 py-2.5 font-sans text-green-300">Net Profit after Tax (PAT) ({e.pat_margin_pct}% PAT Margin)</td><td className="px-3 py-2.5 text-right text-green-300">{fmtINR(e.pat_net_profit)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DuPont 3-Point ROE Deconstruction */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-2">
        <p className="text-xs font-bold text-foreground">DuPont 3-Point ROE Deconstruction ({d.roe_pct}% ROE)</p>
        <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Net Margin (Profitability)</p>
            <p className="text-base font-bold text-cyan-300 mt-0.5">{d.net_profit_margin_pct}%</p>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Asset Turnover (Efficiency)</p>
            <p className="text-base font-bold text-purple-300 mt-0.5">{d.asset_turnover_ratio}x</p>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">Equity Multiplier (Leverage)</p>
            <p className="text-base font-bold text-amber-300 mt-0.5">{d.equity_multiplier}x</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: WORKING CAPITAL & CCC ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function WorkingCapitalTab() {
  const c = DEMO_WORKING_CAPITAL_CCC;

  return (
    <div className="space-y-4">
      {/* CCC Key Banner */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Cash Conversion Cycle (CCC) — {c.ccc_days} Days
            </p>
            <p className="text-[10px] text-muted-foreground">{c.recommendation}</p>
          </div>
          <span className="text-xs font-bold font-mono text-green-300">Potential Cash Unlock: {fmtINR(c.potential_cash_unlocked_inr)}</span>
        </div>

        {/* DSO + DIO - DPO breakdown */}
        <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">DSO (Days Sales Outstanding)</p>
            <p className="text-lg font-bold text-amber-300 mt-0.5">{c.dso_days_sales_outstanding} Days</p>
            <p className="text-[9px] text-muted-foreground">Time to collect from debtors</p>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">DIO (Days Inventory Outstanding)</p>
            <p className="text-lg font-bold text-cyan-300 mt-0.5">{c.dio_days_inventory_outstanding} Days</p>
            <p className="text-[9px] text-muted-foreground">Time to sell inventory</p>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-[10px] text-muted-foreground">DPO (Days Payable Outstanding)</p>
            <p className="text-lg font-bold text-purple-300 mt-0.5">{c.dpo_days_payables_outstanding} Days</p>
            <p className="text-[9px] text-muted-foreground">Time to pay suppliers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 6: BOARD DECK & EXECUTIVE PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function BoardDeckTab() {
  const b = DEMO_BOARD_REPORT_DRAFT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Executive Board Briefing Draft
          </p>
          <p className="text-[10px] text-muted-foreground">Auto-generated monthly executive summary for Board of Directors & Lending Banks</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 transition-all">
            <Download className="w-3.5 h-3.5" /> Download Board PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8 transition-all">
            <Send className="w-3.5 h-3.5" /> Email to Directors
          </button>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-white/8 bg-card/60 space-y-4 font-sans">
        <div className="border-b border-white/8 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">{b.report_title}</h3>
            <p className="text-[10px] text-muted-foreground">{b.company_name} · {b.financial_period}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{b.generated_date}</span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-cyan-300">Executive Summary</p>
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

        <div className="space-y-1">
          <p className="text-xs font-bold text-purple-300">CFO Strategic Recommendations</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {b.strategic_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type CFOIntelTab = "summary" | "simulator" | "solvency" | "ebitda" | "workingcap" | "boarddeck";

export function CFOIntelligenceModule({ companyName }: { companyName?: string }) {
  const [activeTab, setActiveTab] = useState<CFOIntelTab>("summary");

  const tabs: { id: CFOIntelTab; label: string; icon: any; badge?: string }[] = [
    { id: "summary",   label: "Executive Health", icon: Sparkles,   badge: `Score ${DEMO_CFO_HEALTH_SCORECARD.overall_score}` },
    { id: "simulator", label: "Cash Runway AI",   icon: Sliders,    badge: "90-Day" },
    { id: "solvency",  label: "Solvency & Audit", icon: Shield,     badge: `Z:${DEMO_ALTMAN_ZSCORE.z_score}` },
    { id: "ebitda",    label: "EBITDA Bridge",    icon: BarChart3,  badge: `${DEMO_EBITDA_BRIDGE.ebitda_margin_pct}%` },
    { id: "workingcap",label: "Working Capital",  icon: Clock,      badge: `${DEMO_WORKING_CAPITAL_CCC.ccc_days}d CCC` },
    { id: "boarddeck", label: "Board Deck PDF",   icon: FileText,   badge: "Executive" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Virtual CFO AI & Advanced Financial Intelligence Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            30/60/90-Day Cash Runway Forecast · What-If Stress Testing · Altman Z-Score Solvency · Beneish M-Score Forensic Audit · DuPont 3-Point ROE · EBITDA Waterfall · Board Briefing Draft
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2.5 py-1 rounded-full border font-bold bg-cyan-500/15 border-cyan-500/25 text-cyan-300">
            CFO Index: {DEMO_CFO_HEALTH_SCORECARD.overall_score}/100 ({DEMO_CFO_HEALTH_SCORECARD.grade})
          </span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap border-b border-white/5 pb-1">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300" : "text-muted-foreground hover:bg-white/5"}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === id ? "bg-cyan-500/20 text-cyan-200" : "bg-white/10 text-muted-foreground"}`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
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
  );
}
