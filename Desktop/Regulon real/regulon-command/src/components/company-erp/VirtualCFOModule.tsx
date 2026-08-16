/**
 * MASTER VIRTUAL CFO INTELLIGENCE CENTER
 * ========================================
 * Merged Virtual CFO Suite combining:
 *  - Original CFO Alerts, 7-Day Cash Forecast, Receivables DSO & Concentration, Vendor Price Creep, Tax Shield, MIS Generator
 *  - Advanced Virtual CFO AI: 0-100 CFO Health Scorecard (matching screenshot UI), 90-Day Cash Runway & What-If Stress Testing,
 *    Altman Z-Score Solvency, Beneish M-Score Forensic Audit, EBITDA Waterfall, DuPont ROE, Working Capital CCC, Board Deck PDF.
 *
 * Theme: Dark Violet/Purple Glassmorphism with violet-500 accents matching screenshot design language.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  IndianRupee, Calendar, Users, BarChart3, PieChart,
  LineChart, Activity, Shield, Zap, Sparkles, ArrowUpRight,
  ArrowDownRight, Clock, Download, RefreshCw, Eye,
  ChevronDown, ChevronUp, Bell, Target, Lightbulb,
  CreditCard, Landmark, AlertCircle, Star, Building2,
  Package, FileText, Briefcase, BrainCircuit, Gauge,
  Wallet, Sliders, Scale, Cpu
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  computeAltmanZScore, computeBeneishMScore, computeDuPontAnalysis,
  computeWorkingCapitalMetrics, computeEBITDABridge, computeCFOHealthScore,
  simulateScenario, generateBoardReport
} from "@/lib/accounting/cfo-intelligence-engine";

import {
  DEMO_CASH_FORECAST, DEMO_SCENARIO_INPUTS, DEMO_ALTMAN_ZSCORE,
  DEMO_BENEISH_MSCORE, DEMO_DUPONT_ANALYSIS, DEMO_WORKING_CAPITAL_CCC,
  DEMO_EBITDA_BRIDGE, DEMO_CFO_HEALTH_SCORECARD, DEMO_BOARD_REPORT_DRAFT
} from "@/data/demo-cfo-intelligence-data";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function fmtLakhs(n: number): string {
  return `₹${(Math.abs(n) / 100000).toFixed(2)}L`;
}

// ─── Mock Data for Original Features ─────────────────────────────────────────

interface CFOAlert {
  id: string;
  type: "critical" | "warning" | "opportunity" | "info";
  title: string;
  detail: string;
  amount?: number;
  action: string;
  due_date?: string;
}

interface Customer {
  name: string;
  revenue_pct: number;
  outstanding: number;
  avg_days_to_pay: number;
  risk: "low" | "medium" | "high";
}

interface VendorAlert {
  vendor: string;
  category: string;
  old_price: number;
  new_price: number;
  increase_pct: number;
  annual_impact: number;
}

const ORIGINAL_CFO_ALERTS: CFOAlert[] = [
  {
    id: "1", type: "critical",
    title: "Cash Flow Goes Negative in 9 Days",
    detail: "At your current burn rate of ₹12.4L/month, your projected balance on August 1st will be -₹2.1L due to 3 simultaneous vendor payments totalling ₹7.2L.",
    amount: -210000, action: "View Cash Forecast", due_date: "Aug 1, 2025"
  },
  {
    id: "2", type: "critical",
    title: "₹45,000 Input Tax Credit at Risk",
    detail: "Your supplier 'Tech Solutions India' has not filed their GSTR-1 for June 2025. This means ₹6,300 of ITC on their bill will be blocked in GSTR-2B. Call them immediately.",
    amount: 6300, action: "Send Reminder to Vendor", due_date: "Jul 31, 2025"
  },
  {
    id: "3", type: "warning",
    title: "Advance Tax Payment Due — ₹2.4L",
    detail: "Based on Q1 profit of ₹18.3L, you must pay ₹2.4L as Advance Tax by September 15th. Missing this will attract 1% interest per month under Section 234B/C.",
    amount: 240000, action: "Schedule Payment", due_date: "Sep 15, 2025"
  },
  {
    id: "4", type: "warning",
    title: "ECS Bounce Risk on 10th August",
    detail: "Your HDFC Loan EMI of ₹85,000 auto-debits on Aug 10th. Projected balance on Aug 9th is only ₹61,000. A bounce will cost ₹1,500 penalty + CIBIL score drop.",
    amount: 85000, action: "Transfer Funds", due_date: "Aug 9, 2025"
  },
  {
    id: "5", type: "opportunity",
    title: "Claim ₹38,500 in Unclaimed ITC",
    detail: "Sannidh found 3 purchase bills from last quarter where ITC was eligible but not claimed in the GST return. Your CA can file a GSTR-3B amendment to claim this.",
    amount: 38500, action: "Instruct CA to Claim"
  },
  {
    id: "6", type: "opportunity",
    title: "Cancel 4 Unused SaaS Subscriptions — Save ₹2.8L/year",
    detail: "Sannidh detected 4 recurring software charges (₹23,400/month) that have had zero usage logins in the past 60 days. Cancel to save ₹2.8L annually.",
    amount: 280000, action: "View Subscriptions"
  },
];

const TOP_CUSTOMERS: Customer[] = [
  { name: "Reliance Retail Ltd", revenue_pct: 34, outstanding: 0, avg_days_to_pay: 18, risk: "low" },
  { name: "Flipkart Internet Pvt Ltd", revenue_pct: 22, outstanding: 613600, avg_days_to_pay: 31, risk: "medium" },
  { name: "D-Mart Pvt Ltd", revenue_pct: 18, outstanding: 460200, avg_days_to_pay: 52, risk: "high" },
  { name: "Tata Consumer Products", revenue_pct: 14, outstanding: 214760, avg_days_to_pay: 28, risk: "medium" },
  { name: "Metro Cash & Carry", revenue_pct: 12, outstanding: 103250, avg_days_to_pay: 22, risk: "low" },
];

const VENDOR_ALERTS: VendorAlert[] = [
  { vendor: "Shreeji Raw Materials", category: "Steel & Metal", old_price: 10000, new_price: 10500, increase_pct: 5.0, annual_impact: 87000 },
  { vendor: "Prime Logistics", category: "Freight", old_price: 18500, new_price: 22000, increase_pct: 18.9, annual_impact: 42000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 1: EXECUTIVE HEALTH (EXACT MATCH TO USER SCREENSHOT)
// ─────────────────────────────────────────────────────────────────────────────

function ExecutiveHealthSection() {
  const s = DEMO_CFO_HEALTH_SCORECARD;
  const z = DEMO_ALTMAN_ZSCORE;
  const m = DEMO_BENEISH_MSCORE;
  const d = DEMO_DUPONT_ANALYSIS;

  return (
    <div className="space-y-4 font-sans">
      {/* Primary Health Score Banner — Matches Screenshot Layout */}
      <div className="p-4 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Big Score Box */}
          <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-center shrink-0 min-w-[90px]">
            <p className="text-3xl font-bold font-mono text-cyan-300">{s.overall_score}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">OUT OF 100</p>
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

        {/* Metric Badges Top Right */}
        <div className="flex gap-2 font-mono text-xs text-right shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/8 text-center">
            <p className="text-[9px] text-muted-foreground">Altman Z-Score</p>
            <p className="font-bold text-green-300">{z.z_score} ({z.zone})</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/8 text-center">
            <p className="text-[9px] text-muted-foreground">Beneish M-Score</p>
            <p className="font-bold text-cyan-300">{m.m_score} (Clean)</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/8 text-center">
            <p className="text-[9px] text-muted-foreground">Return on Equity</p>
            <p className="font-bold text-purple-300">{d.roe_pct}% ROE</p>
          </div>
        </div>
      </div>

      {/* 5 Sub-score Horizontal Progress Bars */}
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

      {/* 2-Column Grid: Strategic Strengths vs AI Advisory Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategic Strengths */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
          <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strategic Strengths & Positives
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {s.key_positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI Action Items */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> AI Virtual CFO Advisory & Action Items
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
// SUB-TAB 2: CFO ALERTS (ORIGINAL)
// ─────────────────────────────────────────────────────────────────────────────

function CFOAlertsSection() {
  const criticalCount = ORIGINAL_CFO_ALERTS.filter(a => a.type === "critical").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{ORIGINAL_CFO_ALERTS.length} active alerts — {criticalCount} require immediate attention</p>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh Alerts
        </Button>
      </div>

      {ORIGINAL_CFO_ALERTS.map((alert, i) => {
        const config = {
          critical: { bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle, iconColor: "text-red-400", badge: "bg-red-500/20 text-red-400" },
          warning:  { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock, iconColor: "text-amber-400", badge: "bg-amber-500/20 text-amber-400" },
          opportunity: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Lightbulb, iconColor: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400" },
          info:     { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Shield, iconColor: "text-blue-400", badge: "bg-blue-500/20 text-blue-400" },
        }[alert.type];

        const Icon = config.icon;

        return (
          <motion.div key={alert.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`p-3.5 rounded-xl border ${config.border} ${config.bg} space-y-2`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg bg-black/20 shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-foreground">{alert.title}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${config.badge}`}>{alert.type.toUpperCase()}</span>
                    {alert.due_date && <span className="text-[10px] text-muted-foreground font-mono">Due: {alert.due_date}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.detail}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {alert.amount !== undefined && (
                  <p className={`text-xs font-bold font-mono ${alert.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {alert.amount < 0 ? "-" : "+"}₹{Math.abs(alert.amount).toLocaleString("en-IN")}
                  </p>
                )}
                <Button size="sm" className={`mt-2 h-7 text-[10px] border ${config.border} ${config.badge} hover:opacity-80`}>
                  {alert.action} →
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 3: CASH RUNWAY & STRESS TESTING
// ─────────────────────────────────────────────────────────────────────────────

function CashRunwaySection() {
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIO_INPUTS[0]);

  const simulated = simulateScenario(DEMO_CASH_FORECAST, selectedScenario, 18500000);
  const sampleDays = DEMO_CASH_FORECAST.filter((_, i) => i % 5 === 0);

  return (
    <div className="space-y-4">
      {/* What-If Stress Testing Banner */}
      <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-3">
        <p className="text-xs font-bold text-violet-300 flex items-center gap-2">
          <Sliders className="w-4 h-4" /> Interactive What-If Scenario Stress Testing
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {DEMO_SCENARIO_INPUTS.map(scen => (
            <button key={scen.id} onClick={() => setSelectedScenario(scen)}
              className={`p-3 rounded-lg text-left border transition-all ${selectedScenario.id === scen.id ? "bg-violet-500/20 border-violet-500/40 text-foreground" : "bg-black/20 border-white/5 text-muted-foreground hover:bg-white/3"}`}>
              <p className="text-xs font-bold truncate">{scen.name}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-1">{scen.description}</p>
            </button>
          ))}
        </div>

        {/* Selected Scenario Output */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/8 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">{simulated.scenario_name}</span>
            <span className={`font-mono font-bold ${simulated.runway_impact_days >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {simulated.runway_impact_days >= 0 ? `+${simulated.runway_impact_days} Days Runway` : `${simulated.runway_impact_days} Days Lost`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{simulated.recommendation}</p>
        </div>
      </div>

      {/* 90-Day Cash Forecast Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-right px-3 py-2">Opening Cash</th>
                <th className="text-right px-3 py-2 text-emerald-300">Debtor Inflows</th>
                <th className="text-right px-3 py-2 text-amber-300">Supplier Outflows</th>
                <th className="text-right px-3 py-2 text-purple-300">Payroll</th>
                <th className="text-right px-3 py-2 text-rose-300">Tax Outflow</th>
                <th className="text-right px-3 py-2">Closing Cash</th>
                <th className="text-center px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              {sampleDays.map(day => (
                <tr key={day.date} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px]">{day.day_label}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fmtINR(day.opening_balance)}</td>
                  <td className="px-3 py-2 text-right text-emerald-300 font-bold">{day.expected_inflows_debtors > 0 ? fmtINR(day.expected_inflows_debtors) : "—"}</td>
                  <td className="px-3 py-2 text-right text-amber-300">{day.expected_outflows_creditors > 0 ? fmtINR(day.expected_outflows_creditors) : "—"}</td>
                  <td className="px-3 py-2 text-right text-purple-300">{day.expected_outflows_payroll > 0 ? fmtINR(day.expected_outflows_payroll) : "—"}</td>
                  <td className="px-3 py-2 text-right text-rose-300">{day.expected_outflows_tax > 0 ? fmtINR(day.expected_outflows_tax) : "—"}</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">{fmtINR(day.closing_balance)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      day.liquidity_status === "SAFE" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" : "bg-amber-500/15 text-amber-300 border-amber-500/25"
                    }`}>{day.liquidity_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 4: SOLVENCY & FORENSIC AUDIT
// ─────────────────────────────────────────────────────────────────────────────

function SolvencyAuditSection() {
  const z = DEMO_ALTMAN_ZSCORE;
  const m = DEMO_BENEISH_MSCORE;

  return (
    <div className="space-y-4">
      {/* Altman Z-Score */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Altman Z-Score Solvency Rating — {z.z_score}
            </p>
            <p className="text-[10px] text-muted-foreground">{z.interpretation}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{z.zone} ZONE</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5"><p className="text-muted-foreground text-[9px]">X1: WC / TA</p><p className="font-bold text-foreground mt-0.5">{z.x1_working_cap_to_total_assets}</p></div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5"><p className="text-muted-foreground text-[9px]">X2: RE / TA</p><p className="font-bold text-foreground mt-0.5">{z.x2_retained_earnings_to_total_assets}</p></div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5"><p className="text-muted-foreground text-[9px]">X3: EBIT / TA</p><p className="font-bold text-foreground mt-0.5">{z.x3_ebit_to_total_assets}</p></div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5"><p className="text-muted-foreground text-[9px]">X4: Mkt Val / Liab</p><p className="font-bold text-foreground mt-0.5">{z.x4_market_val_equity_to_total_liab}</p></div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5"><p className="text-muted-foreground text-[9px]">X5: Sales / TA</p><p className="font-bold text-foreground mt-0.5">{z.x5_sales_to_total_assets}</p></div>
        </div>
      </div>

      {/* Beneish M-Score */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> Beneish M-Score Forensic Audit — {m.m_score} (Clean / Non-Manipulator)
            </p>
            <p className="text-[10px] text-muted-foreground">M-Score below -1.78 confirms high financial reporting integrity.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">LOW RISK</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">DSRI (Rec Index)</p><p className="font-bold text-foreground">{m.dsri_days_sales_in_rec_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">GMI (Margin Index)</p><p className="font-bold text-foreground">{m.gmi_gross_margin_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">AQI (Asset Quality)</p><p className="font-bold text-foreground">{m.aqi_asset_quality_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">SGI (Sales Growth)</p><p className="font-bold text-foreground">{m.sgi_sales_growth_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">DEPI (Depreciation)</p><p className="font-bold text-foreground">{m.depi_depreciation_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">SGAI (SGA Expense)</p><p className="font-bold text-foreground">{m.sgai_sga_expense_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">LVGI (Leverage)</p><p className="font-bold text-foreground">{m.lvgi_leverage_index}</p></div>
          <div className="p-2 rounded bg-black/20"><p className="text-muted-foreground text-[9px]">TATA (Accruals/TA)</p><p className="font-bold text-foreground">{m.tata_total_accruals_to_total_assets}</p></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 5: EBITDA & DUPONT BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

function EBITDABridgeSection() {
  const e = DEMO_EBITDA_BRIDGE;
  const d = DEMO_DUPONT_ANALYSIS;

  return (
    <div className="space-y-4 font-sans">
      <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-3">
        <p className="text-xs font-bold text-violet-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" /> EBITDA Waterfall & Profitability Bridge — FY 2025-26
        </p>

        <div className="rounded-lg border border-white/8 overflow-hidden">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              <tr className="bg-white/2"><td className="px-3 py-2 font-sans font-bold text-foreground">Gross Sales Revenue</td><td className="px-3 py-2 text-right font-bold text-foreground">{fmtINR(e.gross_revenue)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Discounts & Returns</td><td className="px-3 py-2 text-right text-rose-300">-{fmtINR(e.discounts_returns)}</td></tr>
              <tr className="bg-cyan-500/5 font-bold"><td className="px-3 py-2 font-sans text-cyan-300">Net Sales Revenue</td><td className="px-3 py-2 text-right text-cyan-300">{fmtINR(e.net_revenue)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: COGS & Material Costs</td><td className="px-3 py-2 text-right text-rose-300">-{fmtINR(e.cogs_materials)}</td></tr>
              <tr className="bg-emerald-500/5 font-bold"><td className="px-3 py-2 font-sans text-emerald-300">Gross Profit ({e.gross_margin_pct}% Margin)</td><td className="px-3 py-2 text-right text-emerald-300">{fmtINR(e.gross_profit)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Payroll Expenses</td><td className="px-3 py-2 text-right text-amber-300">-{fmtINR(e.employee_expenses)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Sales & Marketing</td><td className="px-3 py-2 text-right text-amber-300">-{fmtINR(e.sales_marketing_expenses)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: General & Admin OpEx</td><td className="px-3 py-2 text-right text-amber-300">-{fmtINR(e.admin_other_opex)}</td></tr>
              <tr className="bg-violet-500/10 font-bold text-sm"><td className="px-3 py-2.5 font-sans text-violet-300">EBITDA ({e.ebitda_margin_pct}% Margin)</td><td className="px-3 py-2.5 text-right text-violet-300">{fmtINR(e.ebitda)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Depreciation & Amortization</td><td className="px-3 py-2 text-right text-purple-200">-{fmtINR(e.depreciation_amortization)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Interest & Finance Charges</td><td className="px-3 py-2 text-right text-purple-200">-{fmtINR(e.interest_finance_costs)}</td></tr>
              <tr><td className="px-3 py-2 font-sans text-muted-foreground">Less: Tax Provision (25%)</td><td className="px-3 py-2 text-right text-rose-300">-{fmtINR(e.tax_provision)}</td></tr>
              <tr className="bg-emerald-500/10 font-bold text-sm"><td className="px-3 py-2.5 font-sans text-emerald-300">Net Profit after Tax (PAT) ({e.pat_margin_pct}% Margin)</td><td className="px-3 py-2.5 text-right text-emerald-300">{fmtINR(e.pat_net_profit)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DuPont ROE */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-2">
        <p className="text-xs font-bold text-foreground">DuPont 3-Point ROE Deconstruction ({d.roe_pct}% ROE)</p>
        <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><p className="text-[10px] text-muted-foreground">Net Profit Margin</p><p className="text-base font-bold text-cyan-300 mt-0.5">{d.net_profit_margin_pct}%</p></div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><p className="text-[10px] text-muted-foreground">Asset Turnover Ratio</p><p className="text-base font-bold text-purple-300 mt-0.5">{d.asset_turnover_ratio}x</p></div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><p className="text-[10px] text-muted-foreground">Equity Multiplier</p><p className="text-base font-bold text-amber-300 mt-0.5">{d.equity_multiplier}x</p></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 6: RECEIVABLES (ORIGINAL + CONCENTRATION)
// ─────────────────────────────────────────────────────────────────────────────

function ReceivablesSection() {
  const totalOutstanding = TOP_CUSTOMERS.reduce((s, c) => s + c.outstanding, 0);
  const riskCustomers = TOP_CUSTOMERS.filter(c => c.risk === "high");

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-3 gap-3 font-mono">
        <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 text-center">
          <p className="text-lg font-bold text-amber-300">₹{(totalOutstanding / 100000).toFixed(1)}L</p>
          <p className="text-[10px] text-muted-foreground">Total Outstanding</p>
        </div>
        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-center">
          <p className="text-lg font-bold text-red-400">{riskCustomers.length}</p>
          <p className="text-[10px] text-muted-foreground">High Risk Customers</p>
        </div>
        <div className="rounded-xl p-3 border border-cyan-500/20 bg-cyan-500/5 text-center">
          <p className="text-lg font-bold text-cyan-300">31 Days</p>
          <p className="text-[10px] text-muted-foreground">Avg Days Sales Outstanding</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Revenue Concentration & Payment Speed</p>
        <div className="space-y-2">
          {TOP_CUSTOMERS.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 shrink-0"><p className="text-[10px] text-foreground font-medium truncate">{c.name}</p></div>
              <div className="flex-1">
                <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.revenue_pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                    className={`h-full rounded-full ${c.risk === "high" ? "bg-red-500/50" : c.risk === "medium" ? "bg-amber-500/40" : "bg-emerald-500/40"}`} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground w-8 text-right font-mono">{c.revenue_pct}%</p>
              <p className={`text-[10px] font-mono w-16 text-right ${c.avg_days_to_pay > 45 ? "text-red-400" : c.avg_days_to_pay > 30 ? "text-amber-400" : "text-emerald-400"}`}>{c.avg_days_to_pay}d pay</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium w-14 text-center ${
                c.risk === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" : c.risk === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>{c.risk} risk</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 7: VENDOR INTEL (ORIGINAL)
// ─────────────────────────────────────────────────────────────────────────────

function VendorIntelSection() {
  return (
    <div className="space-y-4 font-sans">
      <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <p className="text-xs font-semibold text-amber-300">Sannidh AI detected unannounced vendor price inflation</p>
        </div>
        <p className="text-[10px] text-amber-400/70">Automatic invoice history comparison detected cost increases across 2 major supply lines. Total annual impact: ₹1.29L.</p>
      </div>

      {VENDOR_ALERTS.map((v, i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-muted/5 p-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold text-foreground">{v.vendor}</p><p className="text-[10px] text-muted-foreground">{v.category}</p></div>
            <div className="text-right"><p className="text-xs font-bold text-red-400 font-mono">+{v.increase_pct}% hike</p><p className="text-[10px] text-red-400/70 font-mono">₹{v.annual_impact.toLocaleString("en-IN")}/yr</p></div>
          </div>
          <Button size="sm" className="h-7 text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">Negotiate / Compare Suppliers</Button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 8: WORKING CAPITAL & TAX SHIELD
// ─────────────────────────────────────────────────────────────────────────────

function WorkingCapitalTaxSection() {
  const c = DEMO_WORKING_CAPITAL_CCC;

  return (
    <div className="space-y-4 font-sans">
      {/* CCC Banner */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Cash Conversion Cycle (CCC) — {c.ccc_days} Days
            </p>
            <p className="text-[10px] text-muted-foreground">{c.recommendation}</p>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-300">Potential Cash Unlock: {fmtINR(c.potential_cash_unlocked_inr)}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><p className="text-[10px] text-muted-foreground">DSO</p><p className="text-lg font-bold text-amber-300 mt-0.5">{c.dso_days_sales_outstanding} Days</p></div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><p className="text-[10px] text-muted-foreground">DIO</p><p className="text-lg font-bold text-cyan-300 mt-0.5">{c.dio_days_inventory_outstanding} Days</p></div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5"><p className="text-[10px] text-muted-foreground">DPO</p><p className="text-lg font-bold text-purple-300 mt-0.5">{c.dpo_days_payables_outstanding} Days</p></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-TAB 9: MIS & BOARD DECK PDF
// ─────────────────────────────────────────────────────────────────────────────

function BoardDeckSection() {
  const b = DEMO_BOARD_REPORT_DRAFT;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" /> Executive Board Briefing & Solvency Draft
          </p>
          <p className="text-[10px] text-muted-foreground">Auto-generated monthly report for Board of Directors & Banking Partners</p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 gap-1.5">
          <Download className="w-3.5 h-3.5" /> Download Board PDF
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-3">
        <p className="text-xs font-bold text-cyan-300">Executive Summary</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{b.executive_summary}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MASTER VIRTUAL CFO MODULE
// ─────────────────────────────────────────────────────────────────────────────

export function VirtualCFOModule({ companyName }: { companyName?: string }) {
  const [activeTab, setActiveTab] = useState<string>("health");
  const [collapsed, setCollapsed] = useState(false);

  const tabs = [
    { id: "health",     label: "Executive Health", icon: Sparkles,   badge: `Score ${DEMO_CFO_HEALTH_SCORECARD.overall_score}` },
    { id: "alerts",     label: "CFO Alerts",       icon: Bell,       badge: `${ORIGINAL_CFO_ALERTS.length}` },
    { id: "cashrunway", label: "Cash Runway AI",   icon: Sliders,    badge: "90-Day" },
    { id: "solvency",   label: "Solvency Audit",   icon: Shield,     badge: `Z:${DEMO_ALTMAN_ZSCORE.z_score}` },
    { id: "ebitda",     label: "EBITDA Bridge",    icon: BarChart3,  badge: `${DEMO_EBITDA_BRIDGE.ebitda_margin_pct}%` },
    { id: "receivables",label: "Receivables DSO",  icon: Users,      badge: "DSO 31d" },
    { id: "vendors",    label: "Vendor Intel",     icon: Package,    badge: "2 Alerts" },
    { id: "workingcap", label: "Working Capital",  icon: Clock,      badge: `${DEMO_WORKING_CAPITAL_CCC.ccc_days}d CCC` },
    { id: "boarddeck",  label: "MIS & Board Deck", icon: FileText,   badge: "Executive" },
  ];

  return (
    <Card className="border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-0 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/15 border border-violet-500/20">
              <BrainCircuit className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 flex-wrap text-foreground">
                Virtual CFO AI & Advanced Financial Intelligence Engine
                <Badge className="text-[9px] bg-violet-500/15 text-violet-400 border-violet-500/25 font-bold px-1.5 py-0">VIRTUAL CFO</Badge>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                30/60/90-Day Cash Runway Forecast · What-If Stress Testing · Altman Z-Score Solvency · Beneish M-Score Forensic Audit · DuPont 3-Point ROE · EBITDA Waterfall · Board Briefing Draft
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full border font-bold bg-violet-500/15 border-violet-500/25 text-violet-300 font-mono">
              CFO Index: {DEMO_CFO_HEALTH_SCORECARD.overall_score}/100 ({DEMO_CFO_HEALTH_SCORECARD.grade})
            </span>
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sub-tab Bar */}
        {!collapsed && (
          <div className="flex gap-1 mt-4 overflow-x-auto pb-0 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                  activeTab === tab.id
                    ? "text-violet-400 border-violet-400 bg-white/4 font-bold"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/3"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${activeTab === tab.id ? "bg-violet-500/20 text-violet-200" : "bg-white/10 text-muted-foreground"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <CardContent className="pt-5">
              {activeTab === "health font-sans"     && <ExecutiveHealthSection />}
              {activeTab === "health"               && <ExecutiveHealthSection />}
              {activeTab === "alerts"               && <CFOAlertsSection />}
              {activeTab === "cashrunway"           && <CashRunwaySection />}
              {activeTab === "solvency"             && <SolvencyAuditSection />}
              {activeTab === "ebitda"               && <EBITDABridgeSection />}
              {activeTab === "receivables font-sans"&& <ReceivablesSection />}
              {activeTab === "receivables"          && <ReceivablesSection />}
              {activeTab === "vendors"              && <VendorIntelSection />}
              {activeTab === "workingcap font-sans" && <WorkingCapitalTaxSection />}
              {activeTab === "workingcap"           && <WorkingCapitalTaxSection />}
              {activeTab === "boarddeck"            && <BoardDeckSection />}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default VirtualCFOModule;
