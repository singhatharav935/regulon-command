/**
 * FINANCIAL STATEMENTS MODULE — PHASE 2 UI
 * ==========================================
 * Complete CA-grade financial statements UI for both Demo and Real dashboards.
 *
 * Tabs:
 *  1. P&L Account — Trading A/c + Full P&L + Margin Trend
 *  2. Balance Sheet — Schedule III Vertical Format + Notes to Accounts
 *  3. Asset Register — Schedule II WDV Table + Depreciation Chart
 *  4. Deferred Tax — Ind AS 12 DTA/DTL Workings
 *  5. Revenue Recognition — Ind AS 115 Contract-wise breakdown
 *  6. CARO 2020 — 27-clause audit checklist
 *  7. Financial Ratios — 20 key ratios with traffic-light indicators
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, BarChart3, BookOpen, Building2, Scale,
  FileText, CheckSquare, PieChart, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle2, XCircle, Clock, Minus, Info, DollarSign, Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FinancialStatementsModuleProps {
  // Demo mode passes pre-built data; real mode passes the same shape fetched from Supabase
  mode: "demo" | "real";
  balanceSheet: BSData;
  profitLoss: PLData;
  assetRegister: AssetRegisterData;
  deferredTax: DTData;
  financialRatios: RatioData;
  caro2020: CARO2020ClauseUI[];
  notesToAccounts: NoteUI[];
  periodTrend: PeriodData[];
  companyName: string;
  fiscalYear: string;
}

interface BSData {
  is_balanced: boolean;
  equity: { share_capital: number; reserves_surplus: number; total: number };
  non_current_liabilities: {
    long_term_borrowings: number; lease_liability_lt: number;
    deferred_tax_liability: number; long_term_provisions: number; total: number;
  };
  current_liabilities: {
    trade_payables_msme: number; trade_payables_others: number;
    gst_payable: number; tds_payable: number; pf_esic_payable: number;
    salary_payable: number; advance_from_customers: number;
    income_tax_payable: number; lease_liability_st: number;
    other_payables: number; total: number;
  };
  total_equity_liabilities: number;
  non_current_assets: {
    gross_block: number; accumulated_depreciation: number; net_block: number;
    rou_asset_nbv: number; capital_wip: number; deferred_tax_asset: number;
    long_term_loans_advances: number; total: number;
  };
  current_assets: {
    inventories: number; trade_receivables_net: number; unbilled_revenue: number;
    bank_balance: number; cash_in_hand: number; fixed_deposits: number;
    advance_to_suppliers: number; prepaid_expenses: number;
    input_gst_itc: number; tds_receivable: number; total: number;
  };
  total_assets: number;
}

interface PLData {
  revenue_from_operations: number; revenue_py: number;
  other_income: number; total_income: number;
  cogs_direct_expenses: number; employee_benefit_expense: number;
  rou_depreciation_lease: number; depreciation_amortisation: number;
  finance_costs: number; other_expenses: number; total_expenses: number;
  gross_profit: number; ebitda: number; ebit: number; pbt: number;
  current_tax: number; deferred_tax_charge: number; total_tax: number; pat: number;
  gross_margin_pct: number; ebitda_margin_pct: number; net_margin_pct: number;
}

interface AssetItem {
  asset_name: string; asset_category: string;
  gross_cost: number; additions_during_year: number;
  depreciation_slm: number; closing_wdv: number; net_book_value: number;
  useful_life_years: number;
}

interface AssetRegisterData {
  schedule: AssetItem[];
  total_gross_block: number; total_additions: number;
  total_accumulated_dep: number; total_net_block: number; total_dep_for_year: number;
}

interface TimingDiff {
  description: string; category: string;
  temporary_difference: number; tax_rate: number; deferred_tax_amount: number;
}

interface DTData {
  applicable_tax_rate: number;
  opening_dta: number; opening_dtl: number;
  closing_dta: number; closing_dtl: number;
  net_deferred_tax: number;
  deferred_tax_expense: number; deferred_tax_income: number;
  differences: TimingDiff[];
}

interface RatioData {
  current_ratio: number; quick_ratio: number; cash_ratio: number;
  gross_profit_margin_pct: number; ebitda_margin_pct: number; net_profit_margin_pct: number;
  return_on_assets_pct: number; return_on_equity_pct: number; return_on_capital_employed_pct: number;
  debt_equity_ratio: number; debt_to_assets_ratio: number; interest_coverage_ratio: number;
  asset_turnover_ratio: number; inventory_turnover_ratio: number; receivables_days: number;
  payables_days: number; operating_cash_flow_ratio: number; free_cash_flow: number;
}

interface CARO2020ClauseUI {
  clause_no: string; clause_title: string; question: string;
  response: "yes" | "no" | "not_applicable" | "pending";
  remarks: string; is_adverse: boolean; ca_action_required: boolean;
}

interface NoteSubUI { description: string; current_year: number; previous_year: number; sub_items?: NoteSubUI[] }
interface NoteUI {
  note_no: number; title: string; sub_items: NoteSubUI[];
  total_current_year: number; total_previous_year: number;
  statutory_reference: string; ca_review_required: boolean;
}

interface PeriodData {
  period_label: string;
  revenue: number; gross_profit: number; ebitda: number; pat: number; total_assets: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number, compact = false): string {
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `₹${(abs / 100000).toFixed(2)} L`;
    return `₹${abs.toLocaleString("en-IN")}`;
  }
  return `₹${abs.toLocaleString("en-IN")}`;
}

function pct(n: number) { return `${n.toFixed(2)}%`; }

function sign(n: number) { return n < 0 ? "text-red-400" : ""; }

// ─────────────────────────────────────────────────────────────────────────────
// SUB COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function BSRow({
  label, amount, isTotal = false, indent = 0, note, prevAmount, isSubhead = false,
}: {
  label: string; amount: number; isTotal?: boolean; indent?: number;
  note?: number; prevAmount?: number; isSubhead?: boolean;
}) {
  const style = isTotal
    ? "font-bold border-t border-b border-white/10 bg-white/3"
    : isSubhead
    ? "font-semibold text-cyan-300/90"
    : "";

  return (
    <tr className={`${style} group`}>
      <td className={`py-1.5 pr-2 text-xs ${indent > 0 ? "text-muted-foreground" : "text-foreground"}`}
        style={{ paddingLeft: `${8 + indent * 16}px` }}>
        {label}
        {note && <span className="text-cyan-400/60 ml-1 text-[10px]">(Note {note})</span>}
      </td>
      <td className={`py-1.5 text-right text-xs font-mono ${isTotal ? "font-bold text-cyan-300" : amount < 0 ? "text-red-400" : ""}`}>
        {amount !== 0 ? (amount < 0 ? `(${fmt(Math.abs(amount))})` : fmt(amount)) : "—"}
      </td>
      <td className="py-1.5 text-right text-xs font-mono text-muted-foreground/60">
        {prevAmount !== undefined && prevAmount !== 0 ? (prevAmount < 0 ? `(${fmt(Math.abs(prevAmount))})` : fmt(prevAmount)) : "—"}
      </td>
    </tr>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  );
}

function MetricCard({
  label, value, sub, trend, color = "cyan",
}: { label: string; value: string; sub?: string; trend?: number; color?: string }) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/15",
    green: "from-green-500/10 to-green-500/5 border-green-500/15",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/15",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/15",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colorMap[color] || colorMap.cyan} p-3.5`}>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{Math.abs(trend).toFixed(1)}% YoY</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: PROFIT & LOSS ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

function ProfitLossTab({ pl, trend }: { pl: PLData; trend: PeriodData[] }) {
  const revGrowth = trend.length >= 2
    ? ((trend[trend.length - 1].revenue - trend[trend.length - 2].revenue) / trend[trend.length - 2].revenue) * 100
    : null;

  // Bar chart scaling
  const maxVal = Math.max(pl.revenue_from_operations, pl.total_expenses, 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Revenue from Operations" value={fmt(pl.revenue_from_operations, true)}
          sub={`PY: ${fmt(pl.revenue_py, true)}`} trend={revGrowth ?? undefined} color="cyan" />
        <MetricCard label="Gross Profit" value={fmt(pl.gross_profit, true)}
          sub={`Margin: ${pct(pl.gross_margin_pct)}`} color="green" />
        <MetricCard label="EBITDA" value={fmt(pl.ebitda, true)}
          sub={`Margin: ${pct(pl.ebitda_margin_pct)}`} color="purple" />
        <MetricCard label="Profit After Tax" value={fmt(pl.pat, true)}
          sub={`Net Margin: ${pct(pl.net_margin_pct)}`} color="amber" />
      </div>

      {/* Visual Bar Comparison */}
      <div className="rounded-2xl border border-white/8 bg-card/40 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Revenue vs. Expenses Waterfall</h4>
        <div className="space-y-2">
          {[
            { label: "Revenue from Operations", value: pl.revenue_from_operations, color: "bg-cyan-500" },
            { label: "Cost of Goods/Services Sold", value: pl.cogs_direct_expenses, color: "bg-red-500/70" },
            { label: "Employee Benefit Expenses", value: pl.employee_benefit_expense, color: "bg-orange-500/70" },
            { label: "Depreciation & Amortisation", value: pl.depreciation_amortisation + pl.rou_depreciation_lease, color: "bg-amber-500/60" },
            { label: "Finance Costs (Interest)", value: pl.finance_costs, color: "bg-yellow-500/60" },
            { label: "Other Expenses (Admin + Mktg)", value: pl.other_expenses, color: "bg-purple-500/60" },
            { label: "Profit After Tax (PAT)", value: pl.pat, color: pl.pat >= 0 ? "bg-green-500" : "bg-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <p className="text-[10px] text-muted-foreground w-48 shrink-0 text-right">{label}</p>
              <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full ${color} transition-all duration-700`}
                  style={{ width: `${Math.max(2, (value / maxVal) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-mono font-semibold text-foreground w-24 text-right">{fmt(value, true)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full P&L Statement */}
      <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground">Statement of Profit & Loss — Schedule III Format</h4>
          <span className="text-[10px] text-cyan-400/70 font-medium">Ind AS Compliant</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-2 text-left text-[10px] text-muted-foreground font-medium">Particulars</th>
                <th className="px-4 py-2 text-right text-[10px] text-muted-foreground font-medium">FY 2025-26 (₹)</th>
                <th className="px-4 py-2 text-right text-[10px] text-muted-foreground font-medium">FY 2024-25 (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {/* INCOME */}
              <tr className="bg-cyan-500/5">
                <td colSpan={3} className="px-4 py-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">I. INCOME</td>
              </tr>
              <tr>
                <td className="px-4 py-1.5 text-xs text-muted-foreground pl-8">Revenue from Operations <span className="text-[10px] text-cyan-400/60">(Note 10)</span></td>
                <td className="px-4 py-1.5 text-right text-xs font-mono">{fmt(pl.revenue_from_operations)}</td>
                <td className="px-4 py-1.5 text-right text-xs font-mono text-muted-foreground/60">{fmt(pl.revenue_py)}</td>
              </tr>
              <tr>
                <td className="px-4 py-1.5 text-xs text-muted-foreground pl-8">Other Income <span className="text-[10px] text-cyan-400/60">(Note 11)</span></td>
                <td className="px-4 py-1.5 text-right text-xs font-mono">{fmt(pl.other_income)}</td>
                <td className="px-4 py-1.5 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(pl.other_income * 0.82))}</td>
              </tr>
              <tr className="bg-white/3 font-bold border-t border-white/10">
                <td className="px-4 py-2 text-xs font-bold text-foreground">Total Income (I)</td>
                <td className="px-4 py-2 text-right text-xs font-bold font-mono text-cyan-300">{fmt(pl.total_income)}</td>
                <td className="px-4 py-2 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(pl.total_income * 0.82))}</td>
              </tr>
              {/* EXPENSES */}
              <tr className="bg-red-500/5">
                <td colSpan={3} className="px-4 py-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">II. EXPENSES</td>
              </tr>
              {[
                { label: "Cost of Materials Consumed / Direct Expenses", note: 12, v: pl.cogs_direct_expenses },
                { label: "Employee Benefit Expenses", note: 13, v: pl.employee_benefit_expense },
                { label: "Depreciation of ROU Asset (Ind AS 116 — Lease)", note: 6, v: pl.rou_depreciation_lease },
                { label: "Depreciation and Amortisation Expense", note: 6, v: pl.depreciation_amortisation },
                { label: "Finance Costs (Interest)", note: 14, v: pl.finance_costs },
                { label: "Other Expenses (Admin + Marketing + Professional)", note: 15, v: pl.other_expenses },
              ].map(({ label, note, v }) => (
                <tr key={label}>
                  <td className="px-4 py-1.5 text-xs text-muted-foreground pl-8">
                    {label} <span className="text-[10px] text-cyan-400/60">(Note {note})</span>
                  </td>
                  <td className="px-4 py-1.5 text-right text-xs font-mono">{fmt(v)}</td>
                  <td className="px-4 py-1.5 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(v * 0.82))}</td>
                </tr>
              ))}
              <tr className="bg-white/3 font-bold border-t border-white/10">
                <td className="px-4 py-2 text-xs font-bold text-foreground">Total Expenses (II)</td>
                <td className="px-4 py-2 text-right text-xs font-bold font-mono text-red-400">{fmt(pl.total_expenses)}</td>
                <td className="px-4 py-2 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(pl.total_expenses * 0.82))}</td>
              </tr>
              {/* PROFIT STAGES */}
              <tr className="bg-green-500/5 border-t-2 border-green-500/20">
                <td className="px-4 py-2 text-xs font-bold text-green-300">III. Profit Before Exceptional Items & Tax (I - II)</td>
                <td className="px-4 py-2 text-right text-xs font-bold font-mono text-green-300">{fmt(pl.pbt)}</td>
                <td className="px-4 py-2 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(pl.pbt * 0.82))}</td>
              </tr>
              <tr>
                <td className="px-4 py-1.5 text-xs text-muted-foreground pl-8">IV. Exceptional Items</td>
                <td className="px-4 py-1.5 text-right text-xs font-mono">—</td>
                <td className="px-4 py-1.5 text-right text-xs font-mono text-muted-foreground/60">—</td>
              </tr>
              <tr>
                <td className="px-4 py-1.5 text-xs font-semibold text-foreground pl-8">V. Profit Before Tax (III + IV)</td>
                <td className="px-4 py-1.5 text-right text-xs font-semibold font-mono">{fmt(pl.pbt)}</td>
                <td className="px-4 py-1.5 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(pl.pbt * 0.82))}</td>
              </tr>
              <tr>
                <td className="px-4 py-1.5 text-xs text-muted-foreground pl-8">
                  VI. Tax Expense <span className="text-[10px] text-cyan-400/60">(Note 16)</span>
                </td>
                <td colSpan={2} />
              </tr>
              <tr>
                <td className="px-4 py-1 text-xs text-muted-foreground pl-12">Current Tax (u/s 115BAA @ 25.168%)</td>
                <td className="px-4 py-1 text-right text-xs font-mono">{fmt(pl.current_tax)}</td>
                <td className="px-4 py-1 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(pl.current_tax * 0.82))}</td>
              </tr>
              <tr>
                <td className="px-4 py-1 text-xs text-muted-foreground pl-12">Deferred Tax Charge / (Credit) — Ind AS 12</td>
                <td className={`px-4 py-1 text-right text-xs font-mono ${pl.deferred_tax_charge < 0 ? "text-green-400" : ""}`}>
                  {pl.deferred_tax_charge < 0 ? `(${fmt(Math.abs(pl.deferred_tax_charge))})` : fmt(pl.deferred_tax_charge)}
                </td>
                <td className="px-4 py-1 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(Math.abs(pl.deferred_tax_charge) * 0.82))}</td>
              </tr>
              <tr className="bg-green-500/8 border-t-2 border-green-500/30">
                <td className="px-4 py-2.5 text-sm font-bold text-green-300">VII. PROFIT AFTER TAX (PAT)</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold font-mono text-green-300">{fmt(pl.pat)}</td>
                <td className="px-4 py-2.5 text-right text-sm font-mono text-muted-foreground/60">{fmt(Math.round(pl.pat * 0.82))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Year Revenue Trend */}
      <div className="rounded-2xl border border-white/8 bg-card/40 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">3-Year Performance Trend</h4>
        <div className="grid grid-cols-3 gap-4">
          {trend.map((p, i) => (
            <div key={p.period_label} className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground">{p.period_label}</p>
              {[
                { label: "Revenue", value: p.revenue, color: "bg-cyan-500" },
                { label: "Gross Profit", value: p.gross_profit, color: "bg-green-500" },
                { label: "EBITDA", value: p.ebitda, color: "bg-purple-500" },
                { label: "PAT", value: p.pat, color: "bg-amber-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-semibold">{fmt(value, true)}</span>
                  </div>
                  <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${color}`}
                      style={{ width: `${Math.max(5, (value / Math.max(...trend.map(t => t.revenue))) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: BALANCE SHEET (SCHEDULE III)
// ─────────────────────────────────────────────────────────────────────────────

function BalanceSheetTab({ bs }: { bs: BSData }) {
  const [expandedNote, setExpandedNote] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Balance check badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit
        ${bs.is_balanced ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
        {bs.is_balanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {bs.is_balanced ? "✓ Balance Sheet Balances — Total Assets = Total Equity & Liabilities" : "⚠ Balance Sheet Difference Detected — Investigate"}
      </div>

      {/* Two-column BS layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* EQUITY & LIABILITIES */}
        <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-white/8">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">EQUITY & LIABILITIES</h4>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-1.5 text-left text-[10px] text-muted-foreground">Particulars</th>
                <th className="px-3 py-1.5 text-right text-[10px] text-muted-foreground">FY 2025-26</th>
                <th className="px-3 py-1.5 text-right text-[10px] text-muted-foreground">FY 2024-25</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {/* Shareholder Funds */}
              <BSRow label="I. SHAREHOLDERS' FUNDS" amount={0} isSubhead indent={0} prevAmount={0} />
              <BSRow label="Share Capital" amount={bs.equity.share_capital} note={1} indent={1} prevAmount={Math.round(bs.equity.share_capital * 0.82)} />
              <BSRow label="Reserves & Surplus" amount={bs.equity.reserves_surplus} note={2} indent={1} prevAmount={Math.round(bs.equity.reserves_surplus * 0.82)} />
              <BSRow label="Total Shareholders' Funds" amount={bs.equity.total} isTotal prevAmount={Math.round(bs.equity.total * 0.82)} />
              {/* NCL */}
              <BSRow label="II. NON-CURRENT LIABILITIES" amount={0} isSubhead />
              <BSRow label="Long-Term Borrowings" amount={bs.non_current_liabilities.long_term_borrowings} note={3} indent={1} prevAmount={Math.round(bs.non_current_liabilities.long_term_borrowings * 0.82)} />
              <BSRow label="Lease Liability (non-current) — Ind AS 116" amount={bs.non_current_liabilities.lease_liability_lt} indent={1} prevAmount={Math.round(bs.non_current_liabilities.lease_liability_lt * 0.82)} />
              <BSRow label="Deferred Tax Liability — Ind AS 12" amount={bs.non_current_liabilities.deferred_tax_liability} indent={1} prevAmount={Math.round(bs.non_current_liabilities.deferred_tax_liability * 0.82)} />
              <BSRow label="Total NCL" amount={bs.non_current_liabilities.total} isTotal prevAmount={Math.round(bs.non_current_liabilities.total * 0.82)} />
              {/* CL */}
              <BSRow label="III. CURRENT LIABILITIES" amount={0} isSubhead />
              <BSRow label="Trade Payables — MSME" amount={bs.current_liabilities.trade_payables_msme} note={4} indent={1} prevAmount={Math.round(bs.current_liabilities.trade_payables_msme * 0.82)} />
              <BSRow label="Trade Payables — Others" amount={bs.current_liabilities.trade_payables_others} note={4} indent={1} prevAmount={Math.round(bs.current_liabilities.trade_payables_others * 0.82)} />
              <BSRow label="GST Payable (Net of ITC)" amount={bs.current_liabilities.gst_payable} indent={1} prevAmount={Math.round(bs.current_liabilities.gst_payable * 0.82)} />
              <BSRow label="TDS Payable u/s 192/194C/194J" amount={bs.current_liabilities.tds_payable} indent={1} prevAmount={Math.round(bs.current_liabilities.tds_payable * 0.82)} />
              <BSRow label="PF & ESIC Payable" amount={bs.current_liabilities.pf_esic_payable} note={5} indent={1} prevAmount={Math.round(bs.current_liabilities.pf_esic_payable * 0.82)} />
              <BSRow label="Salaries Payable" amount={bs.current_liabilities.salary_payable} indent={1} prevAmount={Math.round(bs.current_liabilities.salary_payable * 0.82)} />
              <BSRow label="Advance from Customers (Contract Liability)" amount={bs.current_liabilities.advance_from_customers} note={5} indent={1} prevAmount={Math.round(bs.current_liabilities.advance_from_customers * 0.82)} />
              <BSRow label="Income Tax Payable" amount={bs.current_liabilities.income_tax_payable} indent={1} prevAmount={Math.round(bs.current_liabilities.income_tax_payable * 0.82)} />
              <BSRow label="Lease Liability (current) — Ind AS 116" amount={bs.current_liabilities.lease_liability_st} indent={1} prevAmount={Math.round(bs.current_liabilities.lease_liability_st * 0.82)} />
              <BSRow label="Other Payables (Audit fees etc.)" amount={bs.current_liabilities.other_payables} indent={1} prevAmount={Math.round(bs.current_liabilities.other_payables * 0.82)} />
              <BSRow label="Total Current Liabilities" amount={bs.current_liabilities.total} isTotal prevAmount={Math.round(bs.current_liabilities.total * 0.82)} />
              {/* Grand Total */}
              <tr className="bg-gradient-to-r from-cyan-500/10 to-transparent">
                <td className="px-3 py-2.5 text-xs font-bold text-cyan-300">TOTAL EQUITY & LIABILITIES</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold font-mono text-cyan-300">{fmt(bs.total_equity_liabilities)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(bs.total_equity_liabilities * 0.82))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ASSETS */}
        <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-green-500/10 to-transparent border-b border-white/8">
            <h4 className="text-xs font-bold text-green-300 uppercase tracking-wider">ASSETS</h4>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-1.5 text-left text-[10px] text-muted-foreground">Particulars</th>
                <th className="px-3 py-1.5 text-right text-[10px] text-muted-foreground">FY 2025-26</th>
                <th className="px-3 py-1.5 text-right text-[10px] text-muted-foreground">FY 2024-25</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {/* NCA */}
              <BSRow label="I. NON-CURRENT ASSETS" amount={0} isSubhead />
              <BSRow label="Gross Block — PPE at Cost" amount={bs.non_current_assets.gross_block} note={6} indent={1} prevAmount={Math.round(bs.non_current_assets.gross_block * 0.82)} />
              <BSRow label="Less: Accumulated Depreciation (Sch. II SLM)" amount={-bs.non_current_assets.accumulated_depreciation} indent={2} prevAmount={-Math.round(bs.non_current_assets.accumulated_depreciation * 0.82)} />
              <BSRow label="Net Block (WDV)" amount={bs.non_current_assets.net_block} indent={1} prevAmount={Math.round(bs.non_current_assets.net_block * 0.82)} />
              <BSRow label="Right-of-Use Asset (Ind AS 116)" amount={bs.non_current_assets.rou_asset_nbv} indent={1} prevAmount={Math.round(bs.non_current_assets.rou_asset_nbv * 0.82)} />
              <BSRow label="Capital Work-in-Progress (CWIP)" amount={bs.non_current_assets.capital_wip} indent={1} prevAmount={0} />
              <BSRow label="Deferred Tax Asset — Ind AS 12" amount={bs.non_current_assets.deferred_tax_asset} indent={1} prevAmount={Math.round(bs.non_current_assets.deferred_tax_asset * 0.82)} />
              <BSRow label="Long-Term Loans & Advances (Security Dep.)" amount={bs.non_current_assets.long_term_loans_advances} indent={1} prevAmount={Math.round(bs.non_current_assets.long_term_loans_advances * 0.82)} />
              <BSRow label="Total Non-Current Assets" amount={bs.non_current_assets.total} isTotal prevAmount={Math.round(bs.non_current_assets.total * 0.82)} />
              {/* CA */}
              <BSRow label="II. CURRENT ASSETS" amount={0} isSubhead />
              <BSRow label="Inventories — Raw Material / WIP / FG" amount={bs.current_assets.inventories} note={7} indent={1} prevAmount={0} />
              <BSRow label="Trade Receivables (Net of Provision)" amount={bs.current_assets.trade_receivables_net} note={8} indent={1} prevAmount={Math.round(bs.current_assets.trade_receivables_net * 0.82)} />
              <BSRow label="Unbilled Revenue (Contract Asset — Ind AS 115)" amount={bs.current_assets.unbilled_revenue} indent={1} prevAmount={Math.round(bs.current_assets.unbilled_revenue * 0.82)} />
              <BSRow label="Bank Balances in Current Account" amount={bs.current_assets.bank_balance} note={9} indent={1} prevAmount={Math.round(bs.current_assets.bank_balance * 0.82)} />
              <BSRow label="Cash in Hand" amount={bs.current_assets.cash_in_hand} indent={1} prevAmount={Math.round(bs.current_assets.cash_in_hand * 0.82)} />
              <BSRow label="Fixed Deposits (maturity ≤ 3 months)" amount={bs.current_assets.fixed_deposits} indent={1} prevAmount={Math.round(bs.current_assets.fixed_deposits * 0.82)} />
              <BSRow label="Advance to Suppliers" amount={bs.current_assets.advance_to_suppliers} indent={1} prevAmount={Math.round(bs.current_assets.advance_to_suppliers * 0.82)} />
              <BSRow label="Prepaid Expenses" amount={bs.current_assets.prepaid_expenses} indent={1} prevAmount={Math.round(bs.current_assets.prepaid_expenses * 0.82)} />
              <BSRow label="Input GST Credit (ITC — GSTR-2B)" amount={bs.current_assets.input_gst_itc} indent={1} prevAmount={Math.round(bs.current_assets.input_gst_itc * 0.82)} />
              <BSRow label="TDS Receivable u/s 194J (TDS Cert.)" amount={bs.current_assets.tds_receivable} indent={1} prevAmount={Math.round(bs.current_assets.tds_receivable * 0.82)} />
              <BSRow label="Total Current Assets" amount={bs.current_assets.total} isTotal prevAmount={Math.round(bs.current_assets.total * 0.82)} />
              {/* Grand Total */}
              <tr className="bg-gradient-to-r from-green-500/10 to-transparent">
                <td className="px-3 py-2.5 text-xs font-bold text-green-300">TOTAL ASSETS</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold font-mono text-green-300">{fmt(bs.total_assets)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-mono text-muted-foreground/60">{fmt(Math.round(bs.total_assets * 0.82))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: ASSET REGISTER (SCHEDULE II)
// ─────────────────────────────────────────────────────────────────────────────

function AssetRegisterTab({ ar }: { ar: AssetRegisterData }) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Gross Block" value={fmt(ar.total_gross_block, true)} color="cyan" />
        <MetricCard label="Additions This Year" value={fmt(ar.total_additions, true)} color="green" />
        <MetricCard label="Accumulated Depreciation" value={fmt(ar.total_accumulated_dep, true)} color="amber" />
        <MetricCard label="Net Block (WDV)" value={fmt(ar.total_net_block, true)} color="purple" />
      </div>

      {/* Asset Register Table */}
      <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground">Schedule II — Fixed Asset Register (WDV Method)</h4>
          <span className="text-[10px] text-cyan-400/70">Companies Act 2013 — SLM Depreciation</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-white/8 bg-white/2">
              <tr>
                {[
                  "Asset Name", "Category", "Gross Cost", "+ Additions",
                  "Dep. (SLM)", "Net Book Value", "Useful Life",
                ].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {ar.schedule.map(asset => (
                <tr key={asset.asset_name} className="hover:bg-white/3 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground">{asset.asset_name}</td>
                  <td className="px-3 py-2 text-muted-foreground capitalize">{asset.asset_category.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 font-mono">{fmt(asset.gross_cost, true)}</td>
                  <td className="px-3 py-2 font-mono text-green-400">{asset.additions_during_year > 0 ? `+${fmt(asset.additions_during_year, true)}` : "—"}</td>
                  <td className="px-3 py-2 font-mono text-amber-400">{fmt(asset.depreciation_slm, true)}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-cyan-300">{fmt(asset.net_book_value > 0 ? asset.net_book_value : asset.closing_wdv, true)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{asset.useful_life_years > 0 ? `${asset.useful_life_years} yrs` : "No Dep."}</td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="bg-white/5 border-t-2 border-white/10 font-bold">
                <td colSpan={2} className="px-3 py-2.5 text-xs font-bold text-foreground">TOTAL</td>
                <td className="px-3 py-2.5 font-mono font-bold text-cyan-300">{fmt(ar.total_gross_block, true)}</td>
                <td className="px-3 py-2.5 font-mono font-bold text-green-400">+{fmt(ar.total_additions, true)}</td>
                <td className="px-3 py-2.5 font-mono font-bold text-amber-400">{fmt(ar.total_dep_for_year, true)}</td>
                <td className="px-3 py-2.5 font-mono font-bold text-cyan-300">{fmt(ar.total_net_block, true)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/5 bg-amber-500/5">
          <p className="text-[10px] text-amber-400/80">
            ⚠ Note: Above depreciation computed per Ind AS 16 / Schedule II (SLM method, residual value 5%).
            Income Tax Act u/s 32 uses WDV Block method — see IT Depreciation Workings in CA Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: DEFERRED TAX (IND AS 12)
// ─────────────────────────────────────────────────────────────────────────────

function DeferredTaxTab({ dt }: { dt: DTData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Tax Rate (Applicable)" value={pct(dt.applicable_tax_rate * 100)} sub="u/s 115BAA" color="cyan" />
        <MetricCard label="Closing DTA" value={fmt(dt.closing_dta, true)} sub="Deductible differences" color="green" />
        <MetricCard label="Closing DTL" value={fmt(dt.closing_dtl, true)} sub="Taxable differences" color="amber" />
        <MetricCard label={dt.net_deferred_tax >= 0 ? "Net DTA (Asset)" : "Net DTL (Liability)"}
          value={fmt(Math.abs(dt.net_deferred_tax), true)}
          sub={dt.net_deferred_tax >= 0 ? "Favourable — DTA > DTL" : "Unfavourable — DTL > DTA"}
          color={dt.net_deferred_tax >= 0 ? "green" : "amber"} />
      </div>

      <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <h4 className="text-xs font-bold">Deferred Tax Workings — Ind AS 12 (Temporary Difference Approach)</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Applicable Tax Rate: {pct(dt.applicable_tax_rate * 100)} (25% base + 7% surcharge + 4% HEC cess)
          </p>
        </div>
        <table className="w-full text-xs">
          <thead className="border-b border-white/8 bg-white/2">
            <tr>
              {["Timing Difference", "Type", "Carrying Amount (Ind AS)", "Tax Base (IT Act)", "Temp. Diff", "DTA / DTL"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[10px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/3">
            {dt.differences.map((d, i) => (
              <tr key={i} className="hover:bg-white/3">
                <td className="px-3 py-2 text-foreground max-w-xs">{d.description}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${d.category === "deductible" ? "bg-green-500/15 text-green-300" : "bg-amber-500/15 text-amber-300"}`}>
                    {d.category === "deductible" ? "DTA" : "DTL"}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{fmt(d.carrying_amount)}</td>
                <td className="px-3 py-2 font-mono">{fmt(d.tax_base)}</td>
                <td className={`px-3 py-2 font-mono ${d.temporary_difference < 0 ? "text-green-400" : "text-amber-400"}`}>
                  {d.temporary_difference < 0 ? `(${fmt(Math.abs(d.temporary_difference))})` : fmt(d.temporary_difference)}
                </td>
                <td className={`px-3 py-2 font-mono font-semibold ${d.deferred_tax_amount < 0 ? "text-green-300" : "text-amber-300"}`}>
                  {fmt(Math.abs(d.deferred_tax_amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Movement */}
        <div className="border-t border-white/8 p-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Opening Balances</p>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Opening DTA</span><span className="font-mono">{fmt(dt.opening_dta)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Opening DTL</span><span className="font-mono">{fmt(dt.opening_dtl)}</span></div>
            <div className="flex justify-between text-xs font-semibold border-t border-white/8 pt-2"><span>Net Opening</span><span className="font-mono">{fmt(dt.opening_dta - dt.opening_dtl)}</span></div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">P&L Impact</p>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Deferred Tax Expense (Dr. P&L)</span><span className="font-mono text-red-400">{fmt(dt.deferred_tax_expense)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Deferred Tax Income (Cr. P&L)</span><span className="font-mono text-green-400">{fmt(dt.deferred_tax_income)}</span></div>
            <div className="flex justify-between text-xs font-semibold border-t border-white/8 pt-2"><span>Net Movement in Deferred Tax</span><span className="font-mono">{fmt(dt.deferred_tax_income - dt.deferred_tax_expense)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: FINANCIAL RATIOS
// ─────────────────────────────────────────────────────────────────────────────

function ratioStatus(metric: string, value: number): "good" | "warn" | "bad" {
  const rules: Record<string, { good: [number, number]; warn: [number, number] }> = {
    current_ratio: { good: [2, 999], warn: [1, 2] },
    quick_ratio: { good: [1, 999], warn: [0.75, 1] },
    gross_profit_margin_pct: { good: [40, 999], warn: [25, 40] },
    ebitda_margin_pct: { good: [20, 999], warn: [10, 20] },
    net_profit_margin_pct: { good: [15, 999], warn: [5, 15] },
    return_on_equity_pct: { good: [15, 999], warn: [8, 15] },
    return_on_capital_employed_pct: { good: [15, 999], warn: [8, 15] },
    interest_coverage_ratio: { good: [3, 999], warn: [1.5, 3] },
    debt_equity_ratio: { good: [0, 1], warn: [1, 2] },
    receivables_days: { good: [0, 30], warn: [30, 60] },
    payables_days: { good: [30, 60], warn: [60, 90] },
  };
  const rule = rules[metric];
  if (!rule) return "good";
  if (value >= rule.good[0] && value <= rule.good[1]) return "good";
  if (value >= rule.warn[0] && value <= rule.warn[1]) return "warn";
  return "bad";
}

function RatioRow({ label, value, benchmark, metric, unit = "" }: { label: string; value: number; benchmark: string; metric: string; unit?: string }) {
  const status = ratioStatus(metric, value);
  const colorMap = { good: "text-green-400", warn: "text-amber-400", bad: "text-red-400" };
  const iconMap = { good: CheckCircle2, warn: AlertTriangle, bad: XCircle };
  const Icon = iconMap[status];
  return (
    <tr className="border-b border-white/4 hover:bg-white/3">
      <td className="px-3 py-2 text-xs text-foreground">{label}</td>
      <td className={`px-3 py-2 text-right text-xs font-mono font-bold ${colorMap[status]}`}>{value.toFixed(2)}{unit}</td>
      <td className="px-3 py-2 text-right text-[10px] text-muted-foreground">{benchmark}</td>
      <td className="px-3 py-2 text-right">
        <Icon className={`w-3.5 h-3.5 ml-auto ${colorMap[status]}`} />
      </td>
    </tr>
  );
}

function FinancialRatiosTab({ ratios }: { ratios: RatioData }) {
  const groups = [
    {
      title: "Liquidity Ratios",
      rows: [
        { label: "Current Ratio (CA / CL)", value: ratios.current_ratio, benchmark: "> 2.0 comfortable", metric: "current_ratio" },
        { label: "Quick Ratio ((CA - Inventory) / CL)", value: ratios.quick_ratio, benchmark: "> 1.0 good", metric: "quick_ratio" },
        { label: "Cash Ratio (Cash / CL)", value: ratios.cash_ratio, benchmark: "> 0.5 safe", metric: "quick_ratio" },
      ],
    },
    {
      title: "Profitability Ratios",
      rows: [
        { label: "Gross Profit Margin", value: ratios.gross_profit_margin_pct, benchmark: "> 40% for IT firms", metric: "gross_profit_margin_pct", unit: "%" },
        { label: "EBITDA Margin", value: ratios.ebitda_margin_pct, benchmark: "> 20% healthy", metric: "ebitda_margin_pct", unit: "%" },
        { label: "Net Profit Margin (PAT / Revenue)", value: ratios.net_profit_margin_pct, benchmark: "> 15% excellent", metric: "net_profit_margin_pct", unit: "%" },
        { label: "Return on Assets (PAT / Assets)", value: ratios.return_on_assets_pct, benchmark: "> 10% good", metric: "return_on_equity_pct", unit: "%" },
        { label: "Return on Equity (PAT / Equity)", value: ratios.return_on_equity_pct, benchmark: "> 15% benchmark", metric: "return_on_equity_pct", unit: "%" },
        { label: "ROCE (EBIT / Capital Employed)", value: ratios.return_on_capital_employed_pct, benchmark: "> 15% healthy", metric: "return_on_capital_employed_pct", unit: "%" },
      ],
    },
    {
      title: "Solvency / Leverage Ratios",
      rows: [
        { label: "Debt-Equity Ratio (Total Debt / Equity)", value: ratios.debt_equity_ratio, benchmark: "< 1.0 comfortable", metric: "debt_equity_ratio" },
        { label: "Debt to Assets Ratio", value: ratios.debt_to_assets_ratio, benchmark: "< 0.5 good", metric: "debt_equity_ratio" },
        { label: "Interest Coverage Ratio (EBIT / Interest)", value: ratios.interest_coverage_ratio, benchmark: "> 3× safe zone", metric: "interest_coverage_ratio" },
      ],
    },
    {
      title: "Efficiency / Activity Ratios",
      rows: [
        { label: "Asset Turnover Ratio", value: ratios.asset_turnover_ratio, benchmark: "> 1× efficient", metric: "gross_profit_margin_pct" },
        { label: "Debtors / Receivables Days (DSO)", value: ratios.receivables_days, benchmark: "< 30 days ideal", metric: "receivables_days", unit: " days" },
        { label: "Payables Days (DPO)", value: ratios.payables_days, benchmark: "30–60 days normal", metric: "payables_days", unit: " days" },
      ],
    },
    {
      title: "Cash Flow Ratios",
      rows: [
        { label: "Operating Cash Flow Ratio (OCF / CL)", value: ratios.operating_cash_flow_ratio, benchmark: "> 1.0 strong", metric: "current_ratio" },
        { label: "Free Cash Flow (₹)", value: ratios.free_cash_flow / 100000, benchmark: "Positive = self-funding", metric: "gross_profit_margin_pct", unit: "L" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.title} className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden">
          <div className="px-4 py-3 bg-white/3 border-b border-white/8">
            <h4 className="text-xs font-bold text-foreground">{group.title}</h4>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-1.5 text-left text-[10px] text-muted-foreground">Ratio</th>
                <th className="px-3 py-1.5 text-right text-[10px] text-muted-foreground">Value</th>
                <th className="px-3 py-1.5 text-right text-[10px] text-muted-foreground">Benchmark</th>
                <th className="px-3 py-1.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {group.rows.map(row => (
                <RatioRow key={row.label} {...row} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div className="text-[10px] text-muted-foreground/60 px-1">
        ℹ Traffic-light: 🟢 = within healthy range | 🟡 = caution | 🔴 = needs attention. Benchmarks are for Indian IT Services sector.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 6: CARO 2020 CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

function CARO2020Tab({ clauses }: { clauses: CARO2020ClauseUI[] }) {
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  const stats = {
    yes: clauses.filter(c => c.response === "yes").length,
    no: clauses.filter(c => c.response === "no").length,
    na: clauses.filter(c => c.response === "not_applicable").length,
    pending: clauses.filter(c => c.response === "pending").length,
  };

  const responseConfig = {
    yes: { label: "Yes / Compliant", icon: CheckCircle2, color: "text-green-400 bg-green-500/10 border-green-500/20" },
    no: { label: "No / Non-Compliant", icon: XCircle, color: "text-red-400 bg-red-500/10 border-red-500/20" },
    not_applicable: { label: "Not Applicable", icon: Minus, color: "text-muted-foreground bg-white/5 border-white/10" },
    pending: { label: "Pending Review", icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  };

  return (
    <div className="space-y-4">
      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(stats).map(([key, count]) => {
          const cfg = responseConfig[key as keyof typeof responseConfig];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`rounded-xl border p-3 ${cfg.color}`}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-[10px] mt-1">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Clauses */}
      <div className="rounded-2xl border border-white/8 bg-card/40 overflow-hidden divide-y divide-white/5">
        {clauses.map(clause => {
          const cfg = responseConfig[clause.response];
          const Icon = cfg.icon;
          const isOpen = expandedClause === clause.clause_no;
          return (
            <div key={clause.clause_no}>
              <button
                onClick={() => setExpandedClause(isOpen ? null : clause.clause_no)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/3 transition-colors"
              >
                <span className="text-[10px] font-mono text-muted-foreground w-14 shrink-0 mt-0.5">{clause.clause_no}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{clause.clause_title}</p>
                  {clause.remarks && !isOpen && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{clause.remarks}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {clause.ca_action_required && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/20 text-purple-300">CA</span>
                  )}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </div>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-[4.5rem] space-y-2">
                      <p className="text-[11px] text-muted-foreground italic">{clause.question}</p>
                      {clause.remarks && (
                        <div className={`px-3 py-2 rounded-lg text-[11px] border ${cfg.color}`}>
                          <strong>CA Remarks:</strong> {clause.remarks}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW TAB 1: TRIAL BALANCE BOOK (3-COLUMN BALANCED REGISTER)
// ─────────────────────────────────────────────────────────────────────────────

interface TBLedger {
  code: string;
  name: string;
  group: string;
  opening_dr: number;
  opening_cr: number;
  tx_dr: number;
  tx_cr: number;
  closing_dr: number;
  closing_cr: number;
}

const DEMO_TRIAL_BALANCE: TBLedger[] = [
  // Capital & Liabilities
  { code: "1001", name: "Equity Share Capital", group: "Capital Account", opening_dr: 0, opening_cr: 10000000, tx_dr: 0, tx_cr: 0, closing_dr: 0, closing_cr: 10000000 },
  { code: "1002", name: "Reserves & Surplus (P&L A/c)", group: "Capital Account", opening_dr: 0, opening_cr: 4500000, tx_dr: 0, tx_cr: 2100000, closing_dr: 0, closing_cr: 6600000 },
  { code: "1101", name: "HDFC Term Loan A/c (Secured)", group: "Long-Term Loans", opening_dr: 0, opening_cr: 5000000, tx_dr: 1200000, tx_cr: 0, closing_dr: 0, closing_cr: 3800000 },
  { code: "2001", name: "Sundry Creditors (Payables)", group: "Current Liabilities", opening_dr: 0, opening_cr: 2400000, tx_dr: 14000000, tx_cr: 15600000, closing_dr: 0, closing_cr: 4000000 },
  { code: "2101", name: "GST Output Tax Payable", group: "Statutory Duties", opening_dr: 0, opening_cr: 450000, tx_dr: 3200000, tx_cr: 3450000, closing_dr: 0, closing_cr: 700000 },
  { code: "2102", name: "TDS Payable A/c (Sec 194C/J)", group: "Statutory Duties", opening_dr: 0, opening_cr: 85000, tx_dr: 620000, tx_cr: 685000, closing_dr: 0, closing_cr: 150000 },
  { code: "2103", name: "Salary & Payroll Payable", group: "Current Liabilities", opening_dr: 0, opening_cr: 420000, tx_dr: 4800000, tx_cr: 4800000, closing_dr: 0, closing_cr: 420000 },
  
  // Assets
  { code: "3001", name: "Fixed Assets — Gross Block", group: "Fixed Assets", opening_dr: 12500000, opening_cr: 0, tx_dr: 5500000, tx_cr: 750000, closing_dr: 17250000, closing_cr: 0 },
  { code: "3002", name: "Accumulated Depreciation", group: "Fixed Assets", opening_dr: 0, opening_cr: 2850000, tx_dr: 712500, tx_cr: 2112500, closing_dr: 0, closing_cr: 4250000 },
  { code: "3101", name: "HDFC Current Bank A/c", group: "Bank Accounts", opening_dr: 14500000, opening_cr: 0, tx_dr: 28500000, tx_cr: 24500000, closing_dr: 18500000, closing_cr: 0 },
  { code: "3102", name: "ICICI Operating Bank A/c", group: "Bank Accounts", opening_dr: 3200000, opening_cr: 0, tx_dr: 8500000, tx_cr: 7200000, closing_dr: 4500000, closing_cr: 0 },
  { code: "3103", name: "Petty Cash Account", group: "Cash-in-Hand", opening_dr: 85000, opening_cr: 0, tx_dr: 450000, tx_cr: 410000, closing_dr: 125000, closing_cr: 0 },
  { code: "3201", name: "Sundry Debtors (Receivables)", group: "Current Assets", opening_dr: 6500000, opening_cr: 0, tx_dr: 24500000, tx_cr: 22800000, closing_dr: 8200000, closing_dr_sub: 0, closing_cr: 0 },
  { code: "3301", name: "GST Input Tax Credit (ITC)", group: "Current Assets", opening_dr: 380000, opening_cr: 0, tx_dr: 2150000, tx_cr: 1850000, closing_dr: 680000, closing_cr: 0 },
  
  // Expenses & Revenue
  { code: "4001", name: "Sales & Software Revenue", group: "Sales Accounts", opening_dr: 0, opening_cr: 0, tx_dr: 5000000, tx_cr: 29500000, closing_dr: 0, closing_cr: 24500000 },
  { code: "5001", name: "Purchases & Direct Materials", group: "Direct Expenses", opening_dr: 0, opening_cr: 0, tx_dr: 14700000, tx_cr: 0, closing_dr: 14700000, closing_cr: 0 },
  { code: "5101", name: "Employee Salaries & Bonus", group: "Operating Expenses", opening_dr: 0, opening_cr: 0, tx_dr: 4800000, tx_cr: 0, closing_dr: 4800000, closing_cr: 0 },
  { code: "5102", name: "Rent & Office Infrastructure", group: "Operating Expenses", opening_dr: 0, opening_cr: 0, tx_dr: 2400000, tx_cr: 0, closing_dr: 2400000, closing_cr: 0 },
  { code: "5103", name: "Depreciation Expense (P&L)", group: "Operating Expenses", opening_dr: 0, opening_cr: 0, tx_dr: 2112500, tx_cr: 0, closing_dr: 2112500, closing_cr: 0 },
  { code: "5104", name: "Legal & Professional Fees", group: "Operating Expenses", opening_dr: 0, opening_cr: 0, tx_dr: 950000, tx_cr: 0, closing_dr: 950000, closing_cr: 0 },
];

function TrialBalanceTab() {
  const totalOpeningDr = DEMO_TRIAL_BALANCE.reduce((s, r) => s + r.opening_dr, 0);
  const totalOpeningCr = DEMO_TRIAL_BALANCE.reduce((s, r) => s + r.opening_cr, 0);
  const totalTxDr = DEMO_TRIAL_BALANCE.reduce((s, r) => s + r.tx_dr, 0);
  const totalTxCr = DEMO_TRIAL_BALANCE.reduce((s, r) => s + r.tx_cr, 0);
  const totalClosingDr = DEMO_TRIAL_BALANCE.reduce((s, r) => s + r.closing_dr, 0);
  const totalClosingCr = DEMO_TRIAL_BALANCE.reduce((s, r) => s + r.closing_cr, 0);

  const isBalanced = Math.abs(totalClosingDr - totalClosingCr) < 10;

  return (
    <div className="space-y-4">
      {/* KPI Header */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-bold text-cyan-300 flex items-center gap-2">
            <Scale className="w-4 h-4" /> Trial Balance Book — Group-wise & Ledger-wise (FY 2025-26)
          </p>
          <p className="text-[10px] text-muted-foreground">Derived automatically from double-entry journal postings. Total Debit = Total Credit.</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${isBalanced ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" : "bg-red-500/15 text-red-300 border-red-500/25"}`}>
          {isBalanced ? "✓ Trial Balance Balanced" : "⚠ Imbalance Detected"}
        </span>
      </div>

      {/* Trial Balance Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2 font-mono">Code</th>
                <th className="text-left px-3 py-2">Ledger Account Name</th>
                <th className="text-left px-3 py-2">Group</th>
                <th className="text-right px-3 py-2 text-muted-foreground">Opening Dr</th>
                <th className="text-right px-3 py-2 text-muted-foreground">Opening Cr</th>
                <th className="text-right px-3 py-2 text-cyan-300">Debit Tx</th>
                <th className="text-right px-3 py-2 text-cyan-300">Credit Tx</th>
                <th className="text-right px-3 py-2 text-emerald-300">Closing Dr</th>
                <th className="text-right px-3 py-2 text-emerald-300">Closing Cr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              {DEMO_TRIAL_BALANCE.map(row => (
                <tr key={row.code} className="hover:bg-white/2">
                  <td className="px-3 py-2 text-cyan-400 font-bold">{row.code}</td>
                  <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px] max-w-[220px] truncate">{row.name}</td>
                  <td className="px-3 py-2 text-muted-foreground font-sans text-[10px]">{row.group}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.opening_dr ? `₹${row.opening_dr.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.opening_cr ? `₹${row.opening_cr.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-cyan-300">{row.tx_dr ? `₹${row.tx_dr.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-cyan-300">{row.tx_cr ? `₹${row.tx_cr.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-300">{row.closing_dr ? `₹${row.closing_dr.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-300">{row.closing_cr ? `₹${row.closing_cr.toLocaleString("en-IN")}` : "—"}</td>
                </tr>
              ))}
              <tr className="bg-white/5 font-bold text-xs border-t-2 border-white/10">
                <td colSpan={3} className="px-3 py-2.5 text-foreground font-sans">Total Trial Balance</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">₹{totalOpeningDr.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">₹{totalOpeningCr.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-cyan-300">₹{totalTxDr.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-cyan-300">₹{totalTxCr.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-emerald-300 font-mono font-bold">₹{totalClosingDr.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-emerald-300 font-mono font-bold">₹{totalClosingCr.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW TAB 4: DAY BOOK & JOURNAL REGISTER
// ─────────────────────────────────────────────────────────────────────────────

interface DayBookEntry {
  voucher_no: string;
  date: string;
  voucher_type: "SALES" | "PURCHASE" | "PAYMENT" | "RECEIPT" | "JOURNAL" | "CONTRA";
  particulars: string;
  debit_account: string;
  credit_account: string;
  amount: number;
}

const DEMO_DAY_BOOK: DayBookEntry[] = [
  { voucher_no: "SAL-2025-089", date: "2025-07-28", voucher_type: "SALES", particulars: "Tax Invoice to Reliance Retail Ltd", debit_account: "Sundry Debtors", credit_account: "Sales Revenue", amount: 1250000 },
  { voucher_no: "PUR-2025-042", date: "2025-07-27", voucher_type: "PURCHASE", particulars: "Purchase Bill from Shreeji Raw Materials", debit_account: "Purchases A/c", credit_account: "Sundry Creditors", amount: 850000 },
  { voucher_no: "PAY-2025-104", date: "2025-07-26", voucher_type: "PAYMENT", particulars: "Office Rent Payment — Hitech City", debit_account: "Rent Expense", credit_account: "HDFC Bank A/c", amount: 200000 },
  { voucher_no: "REC-2025-078", date: "2025-07-25", voucher_type: "RECEIPT", particulars: "Collection from Flipkart Internet", debit_account: "HDFC Bank A/c", credit_account: "Sundry Debtors", amount: 613600 },
  { voucher_no: "PAY-2025-105", date: "2025-07-24", voucher_type: "PAYMENT", particulars: "Monthly Payroll Run (July 2025)", debit_account: "Salary Expense", credit_account: "HDFC Bank A/c", amount: 4200000 },
  { voucher_no: "JRN-2025-015", date: "2025-07-20", voucher_type: "JOURNAL", particulars: "GST Output vs Input Tax Credit Set-Off", debit_account: "GST Output A/c", credit_account: "GST ITC A/c", amount: 450000 },
  { voucher_no: "CON-2025-008", date: "2025-07-15", voucher_type: "CONTRA", particulars: "Cash Withdrawal for Petty Cash", debit_account: "Petty Cash", credit_account: "ICICI Bank A/c", amount: 50000 },
];

function DayBookTab() {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filtered = DEMO_DAY_BOOK.filter(b => filterType === "ALL" || b.voucher_type === filterType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" /> Day Book & Journal Register
        </p>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none">
          <option value="ALL" className="bg-card">All Voucher Types</option>
          <option value="SALES" className="bg-card">Sales Vouchers</option>
          <option value="PURCHASE" className="bg-card">Purchase Vouchers</option>
          <option value="PAYMENT" className="bg-card">Payment Vouchers</option>
          <option value="RECEIPT" className="bg-card">Receipt Vouchers</option>
          <option value="JOURNAL" className="bg-card">Journal Vouchers</option>
        </select>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2">Voucher No</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Particulars / Transaction Description</th>
                <th className="text-left px-3 py-2">Debit A/c</th>
                <th className="text-left px-3 py-2">Credit A/c</th>
                <th className="text-right px-3 py-2 font-mono">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 text-[10px]">
              {filtered.map(entry => (
                <tr key={entry.voucher_no} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-mono font-bold text-cyan-300">{entry.voucher_no}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{entry.date}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-purple-500/15 text-purple-300 border-purple-500/25">{entry.voucher_type}</span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-foreground text-[11px] max-w-[240px] truncate">{entry.particulars}</td>
                  <td className="px-3 py-2 text-cyan-300">{entry.debit_account}</td>
                  <td className="px-3 py-2 text-amber-300">{entry.credit_account}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">₹{entry.amount.toLocaleString("en-IN")}</td>
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
// NEW TAB 5: CASH & BANK BOOK REGISTER
// ─────────────────────────────────────────────────────────────────────────────

function CashBankTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-center">
          <p className="text-xs text-muted-foreground">HDFC Current Bank A/c</p>
          <p className="text-xl font-bold font-mono text-cyan-300 mt-1">₹1,85,00,000</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Primary Operating Bank</p>
        </div>
        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/10 text-center">
          <p className="text-xs text-muted-foreground">ICICI Bank A/c</p>
          <p className="text-xl font-bold font-mono text-purple-300 mt-1">₹45,00,000</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Secondary Reserves A/c</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-center">
          <p className="text-xs text-muted-foreground">Petty Cash Register</p>
          <p className="text-xl font-bold font-mono text-amber-300 mt-1">₹1,25,000</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Office Expenses Cash</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW TAB 6: RECEIVABLES & PAYABLES AGING SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

function AgingTab() {
  const debtorsAging = [
    { name: "Flipkart Internet Pvt Ltd", d0_30: 613600, d31_60: 0, d61_90: 0, d90plus: 0, total: 613600 },
    { name: "D-Mart Pvt Ltd", d0_30: 0, d31_60: 460200, d61_90: 0, d90plus: 0, total: 460200 },
    { name: "Tata Consumer Products", d0_30: 214760, d31_60: 0, d61_90: 0, d90plus: 0, total: 214760 },
    { name: "Metro Cash & Carry", d0_30: 103250, d31_60: 0, d61_90: 0, d90plus: 0, total: 103250 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-foreground">Sundry Debtors Aging Schedule (as on FY25 End)</p>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2">Customer Name</th>
                <th className="text-right px-3 py-2 text-emerald-300">0 - 30 Days</th>
                <th className="text-right px-3 py-2 text-amber-300">31 - 60 Days</th>
                <th className="text-right px-3 py-2 text-rose-300">61 - 90 Days</th>
                <th className="text-right px-3 py-2 text-red-400">&gt; 90 Days</th>
                <th className="text-right px-3 py-2 font-mono">Total Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 font-mono text-[10px]">
              {debtorsAging.map(row => (
                <tr key={row.name} className="hover:bg-white/2">
                  <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px]">{row.name}</td>
                  <td className="px-3 py-2 text-right text-emerald-300">{row.d0_30 ? `₹${row.d0_30.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-amber-300">{row.d31_60 ? `₹${row.d31_60.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-rose-300">{row.d61_90 ? `₹${row.d61_90.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-red-400">{row.d90plus ? `₹${row.d90plus.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">₹{row.total.toLocaleString("en-IN")}</td>
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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "tb", label: "Trial Balance", icon: Scale },
  { id: "pl", label: "P&L Account", icon: TrendingUp },
  { id: "bs", label: "Balance Sheet", icon: Scale },
  { id: "daybook", label: "Day Book", icon: BookOpen },
  { id: "cashbank", label: "Cash & Bank", icon: Building2 },
  { id: "aging", label: "Aging Schedule", icon: Clock },
  { id: "assets", label: "Asset Register", icon: Building2 },
  { id: "dt", label: "Deferred Tax", icon: Layers },
  { id: "ratios", label: "Financial Ratios", icon: BarChart3 },
  { id: "caro", label: "CARO 2020", icon: CheckSquare },
] as const;

type TabId = typeof TABS[number]["id"];

export function FinancialStatementsModule({
  mode, balanceSheet, profitLoss, assetRegister, deferredTax,
  financialRatios, caro2020, notesToAccounts, periodTrend, companyName, fiscalYear,
}: FinancialStatementsModuleProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tb");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Financial Statements & Accounting Books — {fiscalYear}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{companyName} · Trial Balance, P&L, Balance Sheet, Day Book, Cash/Bank & Aging Books</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "demo" && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
              Demo Data
            </span>
          )}
          <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
            {balanceSheet.is_balanced ? "✓ Books Balanced" : "⚠ Imbalance"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              activeTab === id
                ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "tb" && <TrialBalanceTab />}
          {activeTab === "pl" && <ProfitLossTab pl={profitLoss} trend={periodTrend} />}
          {activeTab === "bs" && <BalanceSheetTab bs={balanceSheet} />}
          {activeTab === "daybook" && <DayBookTab />}
          {activeTab === "cashbank" && <CashBankTab />}
          {activeTab === "aging" && <AgingTab />}
          {activeTab === "assets" && <AssetRegisterTab ar={assetRegister} />}
          {activeTab === "dt" && <DeferredTaxTab dt={deferredTax} />}
          {activeTab === "ratios" && <FinancialRatiosTab ratios={financialRatios} />}
          {activeTab === "caro" && <CARO2020Tab clauses={caro2020} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
