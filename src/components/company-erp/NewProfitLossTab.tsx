/**
 * PROFIT & LOSS TAB — Enterprise CA-Grade UI
 * =============================================
 * Features:
 *  - Real data only (localStorage — zero random/demo data)
 *  - Derived from Trial Balance engine (TB↔P&L mathematical consistency)
 *  - Period selector (FY / Q1-Q4 / MTD)
 *  - Framework switcher (Schedule III / Ind AS with OCI)
 *  - Tax regime selector (115BAA / 115BAB / Regular / Presumptive)
 *  - Unit denomination (₹ / ₹K / ₹L / ₹Cr)
 *  - Recharts waterfall chart
 *  - Interactive Schedule III table with clickable Notes (Note 10–15)
 *  - Tax Audit Add-Back Scanner (Sec 40A(3) & Sec 43B(h))
 *  - KPI cards (Revenue, Gross Profit, EBITDA, PAT)
 *  - Working Excel / PDF exports
 *  - Period locking
 *  - EPS calculation (Basic & Diluted)
 */

import { useState, useMemo, Fragment } from 'react';
import {
  BookOpen, Download, Printer, Filter, Lock, Unlock, ChevronDown,
  AlertTriangle, Shield, TrendingUp, TrendingDown, Zap, ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { PnLNoteDrawer, type PnLNoteDetail } from './PnLNoteDrawer';
import {
  computeProfitAndLoss,
  exportPnLToExcel,
  printPnLPDF,
  type PnLReport,
} from './pnlEngine';

// ── TYPES ─────────────────────────────────────────────────────────────────

interface ProfitLossTabProps {
  mode?: 'demo' | 'real';
  companyId?: string;
  companyName?: string;
  fiscalYear?: string;
  assetRegisterDepreciation?: number;
  deferredTaxCharge?: number;
  // Direct data props from parent Zustand store (first priority)
  invoices?: any[];
  purchases?: any[];
  bankTxns?: any[];
  payroll?: any[];
  expenses?: any[];
  openingBalances?: any;
}

type DateFilterType = 'FY 2025-26' | 'Q1 (Apr-Jun)' | 'Q2 (Jul-Sep)' | 'Q3 (Oct-Dec)' | 'Q4 (Jan-Mar)' | 'MTD';
type FrameworkType = 'Schedule III' | 'Ind AS';
type UnitMultiplierType = 1 | 1000 | 100000 | 10000000;

const UNIT_LABELS: Record<number, string> = {
  1: '₹ Actuals', 1000: '₹ Thousands', 100000: '₹ Lakhs', 10000000: '₹ Crores',
};

const UNIT_SUFFIXES: Record<number, string> = {
  1: '', 1000: 'K', 100000: 'L', 10000000: 'Cr',
};

// ── FORMATTING ────────────────────────────────────────────────────────────

function fmtRs(n: number, unit: number = 1): string {
  if (n === 0 || isNaN(n)) return '₹0.00';
  const val = n / unit;
  const suffix = UNIT_SUFFIXES[unit] || '';
  const abs = Math.abs(val);
  const prefix = val < 0 ? '-' : '';
  const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return suffix ? `${prefix}₹${formatted} ${suffix}` : `${prefix}₹${formatted}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

// ── P&L ROW COMPONENT ────────────────────────────────────────────────────

function PnLRow({
  label, amount, prevAmount, isTotal = false, isSection = false, indent = 0,
  note, onNoteClick, unit, linkLabel, onLinkClick, className = '',
}: {
  label: string; amount: number; prevAmount?: number;
  isTotal?: boolean; isSection?: boolean; indent?: number;
  note?: number; onNoteClick?: (n: number) => void;
  unit: number; linkLabel?: string; onLinkClick?: () => void;
  className?: string;
}) {
  if (isSection) {
    return (
      <tr className="bg-white/3 border-y border-white/8">
        <td colSpan={3} className="px-3 py-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
          {label}
        </td>
      </tr>
    );
  }

  const rowStyle = isTotal
    ? 'font-bold border-t border-b border-white/10 bg-white/3'
    : '';

  return (
    <tr className={`${rowStyle} hover:bg-white/3 transition-colors ${className}`}>
      <td
        className={`py-2 pr-2 text-xs ${indent > 0 ? 'text-muted-foreground' : 'text-foreground'} ${isTotal ? 'font-bold' : ''}`}
        style={{ paddingLeft: `${12 + indent * 16}px` }}
      >
        {label}
        {note && onNoteClick && (
          <button
            onClick={() => onNoteClick(note)}
            className="text-cyan-400/70 ml-1.5 text-[10px] hover:text-cyan-300 hover:underline cursor-pointer transition-colors font-semibold"
          >
            (Note {note})
          </button>
        )}
        {linkLabel && onLinkClick && (
          <button
            onClick={onLinkClick}
            className="ml-1.5 text-[10px] text-amber-400/70 hover:text-amber-300 cursor-pointer inline-flex items-center gap-0.5"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            {linkLabel}
          </button>
        )}
      </td>
      <td className={`py-2 text-right text-xs font-mono ${isTotal ? 'font-bold text-cyan-300' : amount < 0 ? 'text-red-400' : ''}`}>
        {amount !== 0 ? fmtRs(amount, unit) : '—'}
      </td>
      <td className="py-2 text-right text-xs font-mono text-muted-foreground/60">
        {prevAmount !== undefined && prevAmount !== 0 ? fmtRs(prevAmount, unit) : '—'}
      </td>
    </tr>
  );
}

// ── KPI CARD COMPONENT ────────────────────────────────────────────────────

function KPICard({
  label, value, sub, color = 'cyan',
}: { label: string; value: string; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/15',
    green: 'from-green-500/10 to-green-500/5 border-green-500/15',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/15',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/15',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colorMap[color] || colorMap.cyan} p-3.5`}>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NewProfitLossTab({
  mode = 'real',
  companyId = 'company_real_default',
  companyName = 'Your Company',
  fiscalYear = 'FY 2025-26',
  assetRegisterDepreciation = 0,
  deferredTaxCharge = 0,
  invoices: invoicesProp,
  purchases: purchasesProp,
  bankTxns: bankTxnsProp,
  payroll: payrollProp,
  expenses: expensesProp,
  openingBalances: openingBalProp,
}: ProfitLossTabProps) {
  const isReal = mode === 'real';

  // ── Local State ─────────────────────────────────────────────────────────
  const [dateFilter, setDateFilter] = useState<DateFilterType>('FY 2025-26');
  const [framework, setFramework] = useState<FrameworkType>('Schedule III');
  const [taxRegime, setTaxRegime] = useState<string>('Section 115BAA (25.168%)');
  const [unitMultiplier, setUnitMultiplier] = useState<UnitMultiplierType>(1);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [selectedNote, setSelectedNote] = useState<PnLNoteDetail | null>(null);
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(`sannidh_pnl_locked_${companyId}`);
      return raw ? JSON.parse(raw).isLocked : false;
    } catch { return false; }
  });

  const activeCompanyId = companyId || localStorage.getItem('sannidh_company_id') || 'company_real_default';

  // ── Data: props from Zustand store take priority; fallback to localStorage ──
  const liveInvoices = useMemo(() => {
    if (!isReal) return [];
    if (invoicesProp && invoicesProp.length > 0) return invoicesProp;
    try { return JSON.parse(localStorage.getItem(`company_invoices_${activeCompanyId}`) || localStorage.getItem(`sannidh_invoices_${activeCompanyId}`) || '[]'); } catch { return []; }
  }, [isReal, activeCompanyId, invoicesProp]);

  const livePurchases = useMemo(() => {
    if (!isReal) return [];
    if (purchasesProp && purchasesProp.length > 0) return purchasesProp;
    try { return JSON.parse(localStorage.getItem(`company_purchases_${activeCompanyId}`) || localStorage.getItem(`sannidh_purchases_${activeCompanyId}`) || '[]'); } catch { return []; }
  }, [isReal, activeCompanyId, purchasesProp]);

  const liveBankTxns = useMemo(() => {
    if (!isReal) return [];
    if (bankTxnsProp && bankTxnsProp.length > 0) return bankTxnsProp;
    try { return JSON.parse(localStorage.getItem(`company_bank_transactions_${activeCompanyId}`) || localStorage.getItem(`sannidh_bank_txns_${activeCompanyId}`) || '[]'); } catch { return []; }
  }, [isReal, activeCompanyId, bankTxnsProp]);

  const livePayroll = useMemo(() => {
    if (!isReal) return [];
    if (payrollProp && payrollProp.length > 0) return payrollProp;
    try { return JSON.parse(localStorage.getItem(`company_payroll_${activeCompanyId}`) || localStorage.getItem(`sannidh_payroll_${activeCompanyId}`) || '[]'); } catch { return []; }
  }, [isReal, activeCompanyId, payrollProp]);

  const liveExpenses = useMemo(() => {
    if (!isReal) return [];
    if (expensesProp && expensesProp.length > 0) return expensesProp;
    try { return JSON.parse(localStorage.getItem(`company_expenses_${activeCompanyId}`) || localStorage.getItem(`sannidh_expenses_${activeCompanyId}`) || '[]'); } catch { return []; }
  }, [isReal, activeCompanyId, expensesProp]);

  const openingBal = useMemo(() => {
    if (!isReal) return null;
    if (openingBalProp) return openingBalProp;
    try { return JSON.parse(localStorage.getItem(`sannidh_opening_balances_${activeCompanyId}`) || 'null'); } catch { return null; }
  }, [isReal, activeCompanyId, openingBalProp]);

  // ── Compute P&L ─────────────────────────────────────────────────────────
  const report = useMemo<PnLReport>(() => {
    return computeProfitAndLoss({
      companyId: activeCompanyId,
      invoices: liveInvoices,
      purchases: livePurchases,
      bankTxns: liveBankTxns,
      payroll: livePayroll,
      expenses: liveExpenses,
      openingBalances: openingBal,
      dateFilter,
      taxRegime,
      assetRegisterDepreciation,
      deferredTaxCharge,
      outstandingShares: 10000,
      framework: framework === 'Ind AS' ? 'ind_as' : 'schedule3',
    });
  }, [activeCompanyId, liveInvoices, livePurchases, liveBankTxns, livePayroll, liveExpenses, openingBal, dateFilter, taxRegime, assetRegisterDepreciation, deferredTaxCharge, framework]);

  const unit = unitMultiplier;
  const isBalanced = report.tbReport.isBalanced;

  // ── Note click handler ──────────────────────────────────────────────────
  const handleOpenNote = (noteNum: number) => {
    const n = report.notes[noteNum];
    if (n) {
      setSelectedNote(n);
      setIsNoteDrawerOpen(true);
    }
  };

  // ── Lock P&L ────────────────────────────────────────────────────────────
  const handleToggleLock = () => {
    const newState = !isLocked;
    setIsLocked(newState);
    if (newState) {
      localStorage.setItem(
        `sannidh_pnl_locked_${activeCompanyId}`,
        JSON.stringify({ isLocked: true, lockedAt: new Date().toISOString(), lockedBy: 'Assigned CA / Admin' })
      );
    } else {
      localStorage.removeItem(`sannidh_pnl_locked_${activeCompanyId}`);
    }
  };

  // ── Waterfall chart data ────────────────────────────────────────────────
  const waterfallData = report.waterfall.map(w => ({
    ...w,
    displayValue: Math.abs(w.value) / unit,
    label: w.value >= 0 ? fmtRs(Math.abs(w.value), unit) : `-${fmtRs(Math.abs(w.value), unit)}`,
  }));

  const maxVal = Math.max(...waterfallData.map(d => d.displayValue), 1);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-5">
      {/* ── Header & Controls ── */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Statement of Profit & Loss ({dateFilter})
              </h3>
              <Badge variant="outline" className={`text-[10px] ${
                framework === 'Schedule III'
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10'
              }`}>
                {framework === 'Schedule III' ? 'Companies Act Schedule III Compliant' : 'Ind AS Framework (with OCI)'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Net Taxable Accounting (GST Excluded) · Click note tags to inspect raw uploaded vouchers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
              isBalanced
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-red-500/15 text-red-300 border-red-500/25 animate-pulse'
            }`}>
              {isBalanced ? '✓ P&L Reconciled' : '▲ TB Imbalance Detected'}
            </span>
            <button
              onClick={handleToggleLock}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isLocked
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5" />}
              {isLocked ? '🔒 P&L Locked' : 'Lock P&L Period'}
            </button>
          </div>
        </div>

        {/* ── Controls Bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period Tabs */}
            <div className="flex items-center gap-1 bg-background/60 p-1 rounded-lg border border-white/10 text-xs">
              <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1" />
              {(['FY 2025-26', 'Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)', 'MTD'] as const).map(lbl => (
                <button
                  key={lbl}
                  onClick={() => setDateFilter(lbl)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    dateFilter === lbl ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Framework Toggle */}
            <div className="flex items-center gap-1 bg-background/60 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setFramework('Schedule III')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  framework === 'Schedule III' ? 'bg-cyan-500/20 text-cyan-300' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Schedule III (MSME)
              </button>
              <button
                onClick={() => setFramework('Ind AS')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  framework === 'Ind AS' ? 'bg-cyan-500/20 text-cyan-300' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Ind AS Framework
              </button>
            </div>

            {/* Tax Section Selector */}
            <div className="flex items-center gap-1 bg-background/60 px-2 py-1 rounded-lg border border-white/10">
              <span className="text-[10px] text-muted-foreground">Tax Section:</span>
              <select
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value)}
                className="bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Section 115BAA (25.168%)" className="bg-slate-900 text-foreground">Sec 115BAA (25.168%)</option>
                <option value="Section 115BAB (17.16%)" className="bg-slate-900 text-foreground">Sec 115BAB (17.16%)</option>
                <option value="Regular Corporate (30%)" className="bg-slate-900 text-foreground">Regular Corp (30%)</option>
                <option value="Presumptive 44AD (6%)" className="bg-slate-900 text-foreground">Presumptive 44AD (6%)</option>
                <option value="MAT 115JB (15%)" className="bg-slate-900 text-foreground">MAT Sec 115JB (17.47%)</option>
              </select>
            </div>

            {/* Unit Denomination */}
            <div className="relative">
              <button
                onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/60 border border-white/10 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {UNIT_LABELS[unitMultiplier]}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showUnitDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-[#0d1117] border border-white/15 rounded-lg shadow-xl z-20 min-w-[120px]">
                  {([1, 1000, 100000, 10000000] as UnitMultiplierType[]).map(m => (
                    <button
                      key={m}
                      onClick={() => { setUnitMultiplier(m); setShowUnitDropdown(false); }}
                      className={`block w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/5 ${
                        unitMultiplier === m ? 'text-cyan-300 font-bold' : 'text-muted-foreground'
                      }`}
                    >
                      {UNIT_LABELS[m]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPnLToExcel(report, companyName, dateFilter)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
            </button>
            <button
              onClick={() => printPnLPDF(report, companyName, dateFilter)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Schedule III PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard
          label="Revenue from Operations (Net)"
          value={fmtRs(report.revenue_from_operations, unit)}
          sub="Net Taxable Sales"
          color="cyan"
        />
        <KPICard
          label="Gross Profit"
          value={fmtRs(report.gross_profit, unit)}
          sub={`Margin: ${fmtPct(report.gross_margin_pct)}`}
          color="green"
        />
        <KPICard
          label="EBITDA"
          value={fmtRs(report.ebitda, unit)}
          sub={`Margin: ${fmtPct(report.ebitda_margin_pct)}`}
          color="amber"
        />
        <KPICard
          label="Profit After Tax (PAT)"
          value={fmtRs(report.pat, unit)}
          sub={`Net Margin: ${fmtPct(report.net_margin_pct)}`}
          color="purple"
        />
      </div>

      {/* ── Waterfall Chart ── */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/40">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Revenue vs. Expenses Waterfall
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                tickFormatter={(v: number) => {
                  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
                  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
                  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
                  return v.toString();
                }}
              />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                formatter={(value: number) => [fmtRs(value * unit, 1), 'Amount']}
                labelStyle={{ color: '#94a3b8', fontSize: 10 }}
              />
              <Bar dataKey="displayValue" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Schedule III P&L Table ── */}
      <div className="rounded-xl border border-white/8 overflow-hidden bg-card/40">
        <div className="bg-white/2 px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">
            Statement of Profit & Loss — Schedule III Format
          </p>
          <span className="text-[10px] text-cyan-400 font-mono">{dateFilter}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#0d1117]">
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2">Particulars</th>
                <th className="text-right px-3 py-2">{dateFilter} (₹)</th>
                <th className="text-right px-3 py-2">FY 2024-25 (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {/* I. INCOME */}
              <PnLRow label="I. INCOME" amount={0} isSection unit={unit} />
              <PnLRow label="Revenue from Operations" amount={report.revenue_from_operations} indent={1} note={10} onNoteClick={handleOpenNote} unit={unit} />
              <PnLRow label="Other Income" amount={report.other_income} indent={1} note={11} onNoteClick={handleOpenNote} unit={unit} />
              <PnLRow label="Total Income (I)" amount={report.total_income} isTotal unit={unit} />

              {/* II. EXPENSES */}
              <PnLRow label="II. EXPENSES" amount={0} isSection unit={unit} />
              <PnLRow label="Cost of Materials Consumed / Direct Expenses" amount={report.cogs_direct_expenses} indent={1} note={12} onNoteClick={handleOpenNote} unit={unit} />
              <PnLRow label="Changes in Inventories of Finished Goods, WIP & Stock-in-Trade" amount={report.changes_in_inventories} indent={1} unit={unit} className="text-muted-foreground" />
              <PnLRow label="Employee Benefit Expenses" amount={report.employee_benefit_expense} indent={1} note={13} onNoteClick={handleOpenNote} unit={unit} />
              <PnLRow
                label="Depreciation and Amortisation Expense"
                amount={report.depreciation_amortisation}
                indent={1}
                unit={unit}
                linkLabel="Linked to Asset Register"
              />
              <PnLRow label="Finance Costs (Interest)" amount={report.finance_costs} indent={1} note={14} onNoteClick={handleOpenNote} unit={unit} />
              <PnLRow label="Other Expenses (Admin + Marketing + Professional)" amount={report.other_expenses} indent={1} note={15} onNoteClick={handleOpenNote} unit={unit} />
              <PnLRow label="Total Expenses (II)" amount={report.total_expenses} isTotal unit={unit} />

              {/* Profit Lines */}
              <PnLRow label="III. Profit Before Exceptional Items & Tax (I - II)" amount={report.pbt} isTotal unit={unit} className="text-emerald-300" />
              <PnLRow label="IV. Exceptional Items" amount={report.exceptional_items} indent={1} unit={unit} />
              <PnLRow label="V. Profit Before Tax (III + IV)" amount={report.pbt} isTotal unit={unit} />

              {/* Tax */}
              <PnLRow label="VI. Tax Expense" amount={0} isSection unit={unit} />
              <PnLRow
                label={`Current Income Tax Expense (${report.tax_regime_label})`}
                amount={report.current_tax}
                indent={1}
                unit={unit}
              />
              <PnLRow
                label="Deferred Tax Charge / (Credit)"
                amount={report.deferred_tax_charge}
                indent={1}
                unit={unit}
                linkLabel="Linked to Deferred Tax Tab"
              />

              {/* PAT */}
              <tr className="bg-emerald-500/5 border-t-2 border-emerald-500/20">
                <td className="px-3 py-3 text-sm font-bold text-emerald-300">
                  VII. PROFIT AFTER TAX (PAT)
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold font-mono text-emerald-300">
                  {fmtRs(report.pat, unit)}
                </td>
                <td className="px-3 py-3 text-right text-xs font-mono text-muted-foreground">—</td>
              </tr>

              {/* Ind AS: OCI Section */}
              {framework === 'Ind AS' && (
                <>
                  <PnLRow label="VIII. Other Comprehensive Income (OCI)" amount={0} isSection unit={unit} />
                  <PnLRow label="Items that will not be reclassified to profit or loss" amount={report.oci_items} indent={1} unit={unit} />
                  <PnLRow label="IX. Total Comprehensive Income (VII + VIII)" amount={report.total_comprehensive_income} isTotal unit={unit} />
                </>
              )}

              {/* EPS */}
              <PnLRow label="EARNINGS PER SHARE (EPS) — MANDATORY MCA DISCLOSURE" amount={0} isSection unit={unit} />
              <PnLRow
                label={`Basic Earnings Per Share (₹) (Net Profit ÷ ${report.outstanding_shares.toLocaleString()} shares)`}
                amount={report.basic_eps}
                indent={1}
                unit={1}
              />
              <PnLRow label="Diluted Earnings Per Share (₹)" amount={report.diluted_eps} indent={1} unit={1} />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tax Audit Add-Back Scanner ── */}
      <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Tax Audit Add-Back Scanner (Income Tax Act Disallowances)
          </p>
          <Badge variant="outline" className={`text-[10px] ${
            report.tax_addbacks.total_addbacks === 0
              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
              : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
          }`}>
            {report.tax_addbacks.total_addbacks === 0 ? 'No Disallowances Flagged' : `${report.tax_addbacks.sec40A3_items.length + report.tax_addbacks.sec43Bh_items.length} Disallowances Found`}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Sec 40A(3) */}
          <div className="p-3 rounded-xl border border-white/8 bg-white/2">
            <p className="text-xs font-bold text-foreground">Section 40A(3) — Cash Payments {'>'} ₹10,000</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Single-day cash disbursements over ₹10k disallowed from taxable expenses.
            </p>
            {report.tax_addbacks.sec40A3_items.length > 0 ? (
              <div className="mt-2 space-y-1">
                {report.tax_addbacks.sec40A3_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[10px] text-amber-300">
                    <span>{item.date}: {item.description}</span>
                    <span className="font-mono font-bold">{fmtRs(item.amount, unit)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-amber-300 pt-1 border-t border-white/8">
                  <span>Total 40A(3) Disallowance</span>
                  <span className="font-mono">{fmtRs(report.tax_addbacks.sec40A3_total, unit)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Zero cash payments {'>'} ₹10k detected.
              </p>
            )}
          </div>

          {/* Sec 43B(h) */}
          <div className="p-3 rounded-xl border border-white/8 bg-white/2">
            <p className="text-xs font-bold text-foreground">Section 43B(h) — MSME Vendor Unpaid {'>'} 45 Days</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Unpaid MSME supplier invoices beyond 45 days added back to taxable profit.
            </p>
            {report.tax_addbacks.sec43Bh_items.length > 0 ? (
              <div className="mt-2 space-y-1">
                {report.tax_addbacks.sec43Bh_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[10px] text-amber-300">
                    <span>{item.description}</span>
                    <span className="font-mono font-bold">{fmtRs(item.amount, unit)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-amber-300 pt-1 border-t border-white/8">
                  <span>Total 43B(h) Disallowance</span>
                  <span className="font-mono">{fmtRs(report.tax_addbacks.sec43Bh_total, unit)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Zero overdue MSME payables {'>'} 45 days.
              </p>
            )}
          </div>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
          <span className="text-xs text-muted-foreground">
            Book Profit Before Tax: <span className="font-mono font-bold text-foreground">{fmtRs(report.pbt, unit)}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Adjusted Taxable Income: <span className="font-mono font-bold text-cyan-300">{fmtRs(report.tax_addbacks.adjusted_taxable_income, unit)}</span>
          </span>
        </div>
      </div>

      {/* ── Note Drawer ── */}
      <PnLNoteDrawer
        isOpen={isNoteDrawerOpen}
        onClose={() => setIsNoteDrawerOpen(false)}
        note={selectedNote}
        companyName={companyName}
      />
    </div>
  );
}
