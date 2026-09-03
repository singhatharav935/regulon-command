/**
 * TRIAL BALANCE TAB — Enterprise CA-Grade UI
 * ============================================
 * Features:
 *  - Real data only (localStorage — zero random/demo data)
 *  - Debounced search filter (code, name, group)
 *  - Period selector (FY / Q1-Q4 / MTD)
 *  - View modes: Flat List / Schedule III Tree
 *  - Unit denomination: ₹ / ₹K / ₹L / ₹Cr
 *  - Hide zero balances toggle
 *  - Working Excel / Tally XML / PDF exports
 *  - Scrollable table with sticky header
 *  - Synchronized balanced/imbalanced badge
 *  - Imbalance Resolution Panel (slide-over)
 *  - Ledger drill-down drawer with real vouchers
 */

import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import {
  Scale, Filter, Download, Printer, Search, Eye, EyeOff,
  ChevronDown, AlertTriangle, X, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  computeDoubleEntryTrialBalance,
  exportTrialBalanceToExcel,
  exportTrialBalanceToTallyXML,
  printTrialBalancePDF,
  type TBDoubleEntryReport,
  type TBLedgerItem,
} from './trialBalanceEngine';
import { LedgerVoucherDrawer, type TrialBalanceItem } from './LedgerVoucherDrawer';

// ── TYPES ─────────────────────────────────────────────────────────────────

interface TrialBalanceTabProps {
  mode?: 'demo' | 'real';
  companyId?: string;
  companyName?: string;
  fiscalYear?: string;
}

type DateFilterType = 'FY 2025-26' | 'Q1 (Apr-Jun)' | 'Q2 (Jul-Sep)' | 'Q3 (Oct-Dec)' | 'Q4 (Jan-Mar)' | 'MTD';
type ViewModeType = 'flat' | 'schedule3';
type UnitMultiplierType = 1 | 1000 | 100000 | 10000000;

const UNIT_LABELS: Record<number, string> = {
  1: '₹ Actuals',
  1000: '₹ Thousands',
  100000: '₹ Lakhs',
  10000000: '₹ Crores',
};

const UNIT_SUFFIXES: Record<number, string> = {
  1: '',
  1000: 'K',
  100000: 'L',
  10000000: 'Cr',
};

// ── FORMATTING ────────────────────────────────────────────────────────────

function fmtRs(n: number, unit: number = 1): string {
  if (n === 0 || isNaN(n)) return '—';
  const val = n / unit;
  const suffix = UNIT_SUFFIXES[unit] || '';
  const abs = Math.abs(val);
  const prefix = val < 0 ? '-' : '';
  const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return suffix ? `${prefix}₹${formatted} ${suffix}` : `${prefix}₹${formatted}`;
}

// ── DEBOUNCE HOOK ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ── IMBALANCE RESOLUTION PANEL ────────────────────────────────────────────

function ImbalanceResolutionPanel({
  report, isOpen, onClose, unit,
}: {
  report: TBDoubleEntryReport; isOpen: boolean; onClose: () => void; unit: number;
}) {
  if (!isOpen) return null;

  const singleLeggedItems = report.items.filter(r => {
    const hasDr = r.txDr > 0;
    const hasCr = r.txCr > 0;
    return (hasDr && !hasCr) || (!hasDr && hasCr);
  });

  const suspenseItem = report.items.find(r => r.code === '9999');

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="w-full max-w-lg h-full bg-[#0d1117] border-l border-white/10 flex flex-col overflow-hidden"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-red-500/5">
            <div>
              <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Imbalance Diagnostic Inspector
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Difference: {fmtRs(report.differenceAmount, unit)}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                <p className="text-[10px] text-cyan-400 uppercase font-bold">Total Debits</p>
                <p className="text-sm font-mono font-bold text-foreground">{fmtRs(report.totalClosingDr, unit)}</p>
              </div>
              <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                <p className="text-[10px] text-indigo-400 uppercase font-bold">Total Credits</p>
                <p className="text-sm font-mono font-bold text-foreground">{fmtRs(report.totalClosingCr, unit)}</p>
              </div>
            </div>

            {/* Suspense Account */}
            {suspenseItem && (
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Suspense Account Active (Code 9999)
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {fmtRs(Math.max(suspenseItem.closingDr, suspenseItem.closingCr), unit)} routed to suspense to maintain double-entry balance.
                  This amount needs CA review and reclassification.
                </p>
              </div>
            )}

            {/* Single-Legged Entries */}
            {singleLeggedItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Single-Legged Ledgers ({singleLeggedItems.length})
                </p>
                {singleLeggedItems.map(item => (
                  <div key={item.code} className="flex items-center justify-between p-2 rounded-lg bg-white/2 border border-white/5 text-xs">
                    <div>
                      <span className="text-cyan-400 font-mono font-bold">{item.code}</span>
                      <span className="ml-2 text-foreground">{item.name}</span>
                    </div>
                    <div className="font-mono">
                      {item.txDr > 0 && <span className="text-cyan-300">Dr {fmtRs(item.txDr, unit)}</span>}
                      {item.txCr > 0 && <span className="text-indigo-300">Cr {fmtRs(item.txCr, unit)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resolution Tips */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/2">
              <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Resolution Steps</p>
              <ul className="space-y-1.5 text-[10px] text-muted-foreground">
                <li>• Verify all bank transactions have been classified correctly</li>
                <li>• Check for duplicate entries across invoices and bank statements</li>
                <li>• Review opening balances — ensure Debits = Credits</li>
                <li>• Reclassify Suspense Account (9999) entries to proper heads</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TrialBalanceTab({
  mode = 'real',
  companyId = 'company_real_default',
  companyName = 'Your Company',
  fiscalYear = 'FY 2025-26',
}: TrialBalanceTabProps) {
  const isReal = mode === 'real';

  // ── Local State ─────────────────────────────────────────────────────────
  const [dateFilter, setDateFilter] = useState<DateFilterType>('FY 2025-26');
  const [viewMode, setViewMode] = useState<ViewModeType>('flat');
  const [unitMultiplier, setUnitMultiplier] = useState<UnitMultiplierType>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideZeroBalances, setHideZeroBalances] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<TrialBalanceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImbalancePanelOpen, setIsImbalancePanelOpen] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 250);
  const activeCompanyId = companyId || localStorage.getItem('sannidh_company_id') || 'company_real_default';

  // ── Read real data from localStorage (dual-key pattern) ─────────────────
  const readLS = useCallback((key1: string, key2: string, fallback: any = '[]') => {
    if (!isReal) return JSON.parse(fallback);
    try {
      const raw = localStorage.getItem(key1) || localStorage.getItem(key2) || fallback;
      return JSON.parse(raw);
    } catch { return JSON.parse(fallback); }
  }, [isReal]);

  const liveInvoices = useMemo(
    () => readLS(`company_invoices_${activeCompanyId}`, `sannidh_invoices_${activeCompanyId}`),
    [activeCompanyId, readLS]
  );
  const livePurchases = useMemo(
    () => readLS(`company_purchases_${activeCompanyId}`, `sannidh_purchases_${activeCompanyId}`),
    [activeCompanyId, readLS]
  );
  const liveBankTxns = useMemo(
    () => readLS(`company_bank_transactions_${activeCompanyId}`, `sannidh_bank_txns_${activeCompanyId}`),
    [activeCompanyId, readLS]
  );
  const livePayroll = useMemo(
    () => readLS(`company_payroll_${activeCompanyId}`, `sannidh_payroll_${activeCompanyId}`),
    [activeCompanyId, readLS]
  );
  const liveExpenses = useMemo(
    () => readLS(`company_expenses_${activeCompanyId}`, `sannidh_expenses_${activeCompanyId}`),
    [activeCompanyId, readLS]
  );
  const openingBal = useMemo(
    () => readLS(`sannidh_opening_balances_${activeCompanyId}`, `company_opening_balances_${activeCompanyId}`, 'null'),
    [activeCompanyId, readLS]
  );

  // ── Compute Trial Balance ───────────────────────────────────────────────
  const report = useMemo<TBDoubleEntryReport>(() => {
    return computeDoubleEntryTrialBalance({
      companyId: activeCompanyId,
      invoices: liveInvoices,
      purchases: livePurchases,
      bankTxns: liveBankTxns,
      payroll: livePayroll,
      expenses: liveExpenses,
      openingBalances: openingBal,
      dateFilter,
    });
  }, [activeCompanyId, liveInvoices, livePurchases, liveBankTxns, livePayroll, liveExpenses, openingBal, dateFilter]);

  // ── Filtered items ──────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = report.items;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q)
      );
    }
    if (hideZeroBalances) {
      items = items.filter(r => r.closingDr > 0 || r.closingCr > 0);
    }
    return items;
  }, [report.items, debouncedSearch, hideZeroBalances]);

  // ── Grouped items for Schedule III Tree ──────────────────────────────────
  const groupedItems = useMemo(() => {
    const groups: Record<string, TBLedgerItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filteredItems]);

  // ── Row click → drill-down drawer ───────────────────────────────────────
  const handleRowClick = (item: TBLedgerItem) => {
    const drawerItem: TrialBalanceItem = {
      account_code: item.code,
      ledger_name: item.name,
      group: item.group,
      opening_dr: item.openingDr,
      opening_cr: item.openingCr,
      tx_dr: item.txDr,
      tx_cr: item.txCr,
      closing_dr: item.closingDr,
      closing_cr: item.closingCr,
      vouchers: item.vouchers.map(v => ({
        date: v.date,
        voucher_type: v.voucher_type,
        ref_no: v.ref_no,
        particulars: v.particulars,
        narration: v.narration,
        debit: v.debit,
        credit: v.credit,
        doc_url: v.doc_url,
      })),
    };
    setSelectedLedger(drawerItem);
    setIsDrawerOpen(true);
  };

  const unit = unitMultiplier;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* ── KPI & Controls Header ── */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Trial Balance Book — Group-wise & Ledger-wise ({dateFilter})
            </p>
            <p className="text-[10px] text-muted-foreground">
              Full Ind AS & Schedule III double-entry accounting engine · Click any row for voucher drill-down.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => !report.isBalanced && setIsImbalancePanelOpen(true)}
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono border transition-all ${
                report.isBalanced
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 cursor-default'
                  : 'bg-red-500/15 text-red-300 border-red-500/25 hover:bg-red-500/25 animate-pulse cursor-pointer'
              }`}
            >
              {report.isBalanced
                ? '✓ Books Balanced'
                : `▲ Imbalance (${fmtRs(report.differenceAmount, unit)})`}
            </button>
          </div>
        </div>

        {/* ── Controls Bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search code, name, group..."
                className="pl-7 pr-3 py-1 rounded-lg bg-background/60 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground w-48 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

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

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-background/60 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setViewMode('flat')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  viewMode === 'flat' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Flat List
              </button>
              <button
                onClick={() => setViewMode('schedule3')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                  viewMode === 'schedule3' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Schedule III Tree
              </button>
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

            {/* Hide Zero Balances */}
            <button
              onClick={() => setHideZeroBalances(!hideZeroBalances)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border ${
                hideZeroBalances
                  ? 'bg-amber-500/15 border-amber-500/25 text-amber-300'
                  : 'bg-background/60 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              {hideZeroBalances ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {hideZeroBalances ? 'Show All' : 'Hide Zero'}
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTrialBalanceToExcel(report, companyName, dateFilter)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Excel (.xlsx)
            </button>
            <button
              onClick={() => exportTrialBalanceToTallyXML(report, companyName)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Tally XML
            </button>
            <button
              onClick={() => printTrialBalancePDF(report, companyName, dateFilter)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* ── Trial Balance Table ── */}
      <div className="rounded-xl border border-white/8 overflow-hidden bg-card/40">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#0d1117]">
              <tr className="border-b border-white/8 text-[10px] text-muted-foreground bg-white/2">
                <th className="text-left px-3 py-2 font-mono">Code</th>
                <th className="text-left px-3 py-2">Ledger Account Name</th>
                <th className="text-left px-3 py-2">Schedule III Group</th>
                <th className="text-right px-3 py-2 text-muted-foreground">Opening Dr</th>
                <th className="text-right px-3 py-2 text-muted-foreground">Opening Cr</th>
                <th className="text-right px-3 py-2 text-cyan-300">Debit Tx</th>
                <th className="text-right px-3 py-2 text-cyan-300">Credit Tx</th>
                <th className="text-right px-3 py-2 text-emerald-300">Closing Dr</th>
                <th className="text-right px-3 py-2 text-emerald-300">Closing Cr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 font-mono text-[11px]">
              {viewMode === 'flat' ? (
                filteredItems.map(row => (
                  <tr
                    key={row.code}
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-2 text-cyan-400 font-bold group-hover:underline">{row.code}</td>
                    <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px] max-w-[220px] truncate">
                      {row.name}
                      {row.txnCount > 0 && (
                        <span className="ml-1.5 text-[9px] text-muted-foreground font-mono">({row.txnCount} txns)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground font-sans text-[10px]">{row.group}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{fmtRs(row.openingDr, unit)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{fmtRs(row.openingCr, unit)}</td>
                    <td className="px-3 py-2 text-right text-cyan-300">{fmtRs(row.txDr, unit)}</td>
                    <td className="px-3 py-2 text-right text-cyan-300">{fmtRs(row.txCr, unit)}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-300">{fmtRs(row.closingDr, unit)}</td>
                    <td className="px-3 py-2 text-right font-bold text-indigo-300">{fmtRs(row.closingCr, unit)}</td>
                  </tr>
                ))
              ) : (
                Object.entries(groupedItems).map(([grp, items]) => (
                  <Fragment key={grp}>
                    <tr className="bg-white/5 font-bold text-xs">
                      <td colSpan={9} className="px-3 py-2 text-cyan-400 font-sans uppercase tracking-wider border-y border-white/10">
                        📁 {grp} ({items.length} Ledgers)
                      </td>
                    </tr>
                    {items.map(row => (
                      <tr
                        key={row.code}
                        onClick={() => handleRowClick(row)}
                        className="hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <td className="px-3 py-2 text-cyan-400 font-bold pl-6">{row.code}</td>
                        <td className="px-3 py-2 font-sans font-semibold text-foreground text-[11px]">
                          {row.name}
                          {row.txnCount > 0 && (
                            <span className="ml-1.5 text-[9px] text-muted-foreground font-mono">({row.txnCount} txns)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground font-sans text-[10px]">{row.group}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{fmtRs(row.openingDr, unit)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{fmtRs(row.openingCr, unit)}</td>
                        <td className="px-3 py-2 text-right text-cyan-300">{fmtRs(row.txDr, unit)}</td>
                        <td className="px-3 py-2 text-right text-cyan-300">{fmtRs(row.txCr, unit)}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-300">{fmtRs(row.closingDr, unit)}</td>
                        <td className="px-3 py-2 text-right font-bold text-indigo-300">{fmtRs(row.closingCr, unit)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}

              {/* ── Total Row ── */}
              <tr className="bg-white/8 font-bold text-xs border-t-2 border-white/15">
                <td colSpan={3} className="px-3 py-3 text-foreground font-sans">
                  TOTAL TRIAL BALANCE
                  <span className="ml-2 text-[9px] text-muted-foreground font-normal">
                    ({filteredItems.length} ledgers)
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-muted-foreground">{fmtRs(report.totalOpeningDr, unit)}</td>
                <td className="px-3 py-3 text-right text-muted-foreground">{fmtRs(report.totalOpeningCr, unit)}</td>
                <td className="px-3 py-3 text-right text-cyan-300">{fmtRs(report.totalTxDr, unit)}</td>
                <td className="px-3 py-3 text-right text-cyan-300">{fmtRs(report.totalTxCr, unit)}</td>
                <td className="px-3 py-3 text-right text-emerald-300 font-mono font-bold">{fmtRs(report.totalClosingDr, unit)}</td>
                <td className="px-3 py-3 text-right text-indigo-300 font-mono font-bold">{fmtRs(report.totalClosingCr, unit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Suspense Info Bar ── */}
      {report.hasSuspense && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-300">Suspense Account Active</p>
            <p className="text-[10px] text-muted-foreground">
              {fmtRs(report.suspenseAmount, unit)} has been auto-routed to Suspense (9999) to maintain double-entry balance. Review and reclassify these entries.
            </p>
          </div>
          <button
            onClick={() => setIsImbalancePanelOpen(true)}
            className="px-2.5 py-1 text-[10px] rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 font-semibold"
          >
            Diagnose
          </button>
        </div>
      )}

      {/* ── Ledger Drill-Down Drawer ── */}
      <LedgerVoucherDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ledger={selectedLedger}
        companyName={companyName}
      />

      {/* ── Imbalance Resolution Panel ── */}
      <ImbalanceResolutionPanel
        report={report}
        isOpen={isImbalancePanelOpen}
        onClose={() => setIsImbalancePanelOpen(false)}
        unit={unitMultiplier}
      />
    </div>
  );
}
