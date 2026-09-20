/**
 * P&L ENGINE — Schedule III & Ind AS Compliant Statement of Profit & Loss
 * ========================================================================
 * Pure computation module. No React dependencies.
 *
 * Data flow:
 *   trialBalanceEngine.computeDoubleEntryTrialBalance() → TB Report
 *   TB Report ledger totals → P&L line items (Revenue, COGS, Expenses, etc.)
 *   Tax Audit Scanner → Sec 40A(3), Sec 43B(h) add-backs
 *   Tax Regime Engine → Current Tax Expense → PAT → EPS
 *
 * Principle: P&L is DERIVED from the Trial Balance ledger codes.
 *           This ensures mathematical consistency between TB and P&L.
 */

import {
  computeDoubleEntryTrialBalance,
  type TBDoubleEntryReport,
  type TBLedgerItem,
} from './trialBalanceEngine';
import type { PnLNoteDetail } from './PnLNoteDrawer';

// ── TYPES ─────────────────────────────────────────────────────────────────

export interface PnLComputeParams {
  companyId: string;
  invoices: any[];
  purchases: any[];
  bankTxns: any[];
  payroll: any[];
  expenses: any[];
  openingBalances: any;
  dateFilter?: string;
  taxRegime?: string;
  assetRegisterDepreciation?: number;
  deferredTaxCharge?: number;
  outstandingShares?: number;
  framework?: 'schedule3' | 'ind_as';
}

export interface TaxDisallowance {
  section: string;
  description: string;
  amount: number;
  date?: string;
  ref?: string;
}

export interface TaxAddBackResult {
  sec40A3_total: number;
  sec40A3_items: TaxDisallowance[];
  sec43Bh_total: number;
  sec43Bh_items: TaxDisallowance[];
  total_addbacks: number;
  adjusted_taxable_income: number;
}

export interface PnLReport {
  // Income
  revenue_from_operations: number;
  other_income: number;
  total_income: number;

  // Expenses
  cogs_direct_expenses: number;
  changes_in_inventories: number;
  employee_benefit_expense: number;
  depreciation_amortisation: number;
  finance_costs: number;
  other_expenses: number;
  total_expenses: number;

  // Profit calculations
  gross_profit: number;
  gross_margin_pct: number;
  ebitda: number;
  ebitda_margin_pct: number;
  ebit: number;
  pbt: number;
  exceptional_items: number;

  // Tax
  current_tax: number;
  deferred_tax_charge: number;
  total_tax: number;
  tax_regime_label: string;
  effective_tax_rate: number;

  // Bottom line
  pat: number;
  net_margin_pct: number;

  // Ind AS OCI
  oci_items: number;
  total_comprehensive_income: number;

  // EPS
  outstanding_shares: number;
  basic_eps: number;
  diluted_eps: number;

  // Tax Audit Scanner
  tax_addbacks: TaxAddBackResult;

  // Notes to Accounts
  notes: Record<number, PnLNoteDetail>;

  // Waterfall chart data
  waterfall: Array<{ name: string; value: number; color: string }>;

  // Source TB report (for reconciliation badge)
  tbReport: TBDoubleEntryReport;
}

// ── TAX RATE CONSTANTS ────────────────────────────────────────────────────

const TAX_RATES: Record<string, { rate: number; label: string }> = {
  'Section 115BAA (25.168%)': { rate: 0.25168, label: 'Sec 115BAA (25.168%)' },
  'Section 115BAB (17.16%)': { rate: 0.17160, label: 'Sec 115BAB (17.16%)' },
  'Regular Corporate (30%)': { rate: 0.3000, label: 'Regular Corporate (30%)' },
  'Presumptive 44AD (6%)': { rate: 0.06, label: 'Presumptive 44AD (6%)' },
  'MAT 115JB (15%)': { rate: 0.17472, label: 'MAT Sec 115JB (17.472%)' },
};

// ── HELPERS ───────────────────────────────────────────────────────────────

function toNum(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getLedgerTx(tbItems: TBLedgerItem[], code: string, side: 'dr' | 'cr'): number {
  const item = tbItems.find(r => r.code === code);
  if (!item) return 0;
  return side === 'dr' ? item.txDr : item.txCr;
}

function getLedgerVouchers(tbItems: TBLedgerItem[], code: string) {
  const item = tbItems.find(r => r.code === code);
  return item?.vouchers || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// TAX AUDIT ADD-BACK SCANNER
// ═══════════════════════════════════════════════════════════════════════════

function computeTaxAddBacks(
  bankTxns: any[],
  purchases: any[],
  pbt: number
): TaxAddBackResult {
  // ── Sec 40A(3): Cash payments > ₹10,000 in a single day ──
  const sec40A3_items: TaxDisallowance[] = [];
  const cashPayments: Record<string, number> = {};

  (Array.isArray(bankTxns) ? bankTxns : []).forEach((t: any) => {
    const debit = toNum(t.debit);
    const desc = (t.description || t.narration || '').toLowerCase();
    const isCash = /cash|atm|withdrawal|petty/i.test(desc);
    if (debit > 0 && isCash) {
      const date = t.date || 'unknown';
      cashPayments[date] = (cashPayments[date] || 0) + debit;
    }
  });

  for (const [date, total] of Object.entries(cashPayments)) {
    if (total > 10000) {
      sec40A3_items.push({
        section: '40A(3)',
        description: `Single-day cash disbursement exceeding ₹10,000`,
        amount: total,
        date,
      });
    }
  }

  const sec40A3_total = round2(sec40A3_items.reduce((s, i) => s + i.amount, 0));

  // ── Sec 43B(h): MSME vendor unpaid > 45 days ──
  const sec43Bh_items: TaxDisallowance[] = [];
  const now = new Date();

  (Array.isArray(purchases) ? purchases : []).forEach((p: any) => {
    const isMsme = p.is_msme || p.msme_registered || /msme|micro|small|medium/i.test(p.vendor_type || '');
    const isPaid = p.is_paid || p.payment_status === 'paid';
    const billDate = new Date(p.date || p.bill_date || '');

    if (isMsme && !isPaid && !isNaN(billDate.getTime())) {
      const daysDiff = Math.floor((now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 45) {
        const amt = toNum(p.grand_total || p.total || p.amount);
        if (amt > 0) {
          sec43Bh_items.push({
            section: '43B(h)',
            description: `MSME vendor "${p.party_name || p.vendor_name || 'Unknown'}" unpaid for ${daysDiff} days`,
            amount: amt,
            date: p.date || p.bill_date,
            ref: p.bill_no || p.id,
          });
        }
      }
    }
  });

  const sec43Bh_total = round2(sec43Bh_items.reduce((s, i) => s + i.amount, 0));
  const total_addbacks = round2(sec40A3_total + sec43Bh_total);

  return {
    sec40A3_total,
    sec40A3_items,
    sec43Bh_total,
    sec43Bh_items,
    total_addbacks,
    adjusted_taxable_income: round2(Math.max(0, pbt) + total_addbacks),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTES TO ACCOUNTS GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateNotes(
  tbItems: TBLedgerItem[],
  invoices: any[],
  purchases: any[],
  payroll: any[],
  expenses: any[],
  revenue: number,
  cogs: number,
  employeeBenefits: number,
  otherExpenses: number,
  otherIncome: number,
  financeCosts: number
): Record<number, PnLNoteDetail> {
  const notes: Record<number, PnLNoteDetail> = {};

  // ── Note 10: Revenue from Operations ──
  const revenueVouchers = getLedgerVouchers(tbItems, '1001');
  const revBreakup = revenueVouchers.length > 0
    ? aggregateByParticulars(revenueVouchers, 'credit')
    : [{ description: 'Sales Revenue (Net of GST)', current_year: revenue, previous_year: 0 }];
  notes[10] = {
    note_number: 10,
    note_title: 'Revenue from Operations',
    total_cy: revenue,
    total_py: 0,
    breakup: revBreakup,
  };

  // ── Note 11: Other Income ──
  const otherIncVouchers = getLedgerVouchers(tbItems, '1002');
  notes[11] = {
    note_number: 11,
    note_title: 'Other Income',
    total_cy: otherIncome,
    total_py: 0,
    breakup: otherIncVouchers.length > 0
      ? aggregateByParticulars(otherIncVouchers, 'credit')
      : [{ description: 'Interest & Miscellaneous Income', current_year: otherIncome, previous_year: 0 }],
  };

  // ── Note 12: Cost of Materials Consumed ──
  const cogsVouchers = getLedgerVouchers(tbItems, '2001');
  notes[12] = {
    note_number: 12,
    note_title: 'Cost of Materials Consumed / Direct Expenses',
    total_cy: cogs,
    total_py: 0,
    breakup: cogsVouchers.length > 0
      ? aggregateByParticulars(cogsVouchers, 'debit')
      : [{ description: 'Purchases (Net of GST)', current_year: cogs, previous_year: 0 }],
  };

  // ── Note 13: Employee Benefit Expenses ──
  const payrollVouchers = getLedgerVouchers(tbItems, '3002');
  notes[13] = {
    note_number: 13,
    note_title: 'Employee Benefit Expenses',
    total_cy: employeeBenefits,
    total_py: 0,
    breakup: payrollVouchers.length > 0
      ? aggregateByParticulars(payrollVouchers, 'debit')
      : [{ description: 'Salaries, Wages & Allowances', current_year: employeeBenefits, previous_year: 0 }],
  };

  // ── Note 14: Finance Costs ──
  notes[14] = {
    note_number: 14,
    note_title: 'Finance Costs (Interest)',
    total_cy: financeCosts,
    total_py: 0,
    breakup: [
      { description: 'Interest on Borrowings', current_year: financeCosts, previous_year: 0 },
    ],
  };

  // ── Note 15: Other Expenses ──
  const expVouchers = getLedgerVouchers(tbItems, '3001');
  notes[15] = {
    note_number: 15,
    note_title: 'Other Expenses (Admin + Marketing + Professional)',
    total_cy: otherExpenses,
    total_py: 0,
    breakup: expVouchers.length > 0
      ? aggregateByParticulars(expVouchers, 'debit')
      : [{ description: 'Operating & Administrative Expenses', current_year: otherExpenses, previous_year: 0 }],
  };

  return notes;
}

/** Aggregate voucher items by particulars for Note breakups */
function aggregateByParticulars(
  vouchers: Array<{ particulars: string; debit: number; credit: number }>,
  side: 'debit' | 'credit'
): Array<{ description: string; current_year: number; previous_year: number }> {
  const agg: Record<string, number> = {};
  for (const v of vouchers) {
    const key = v.particulars || 'Unclassified';
    agg[key] = (agg[key] || 0) + (side === 'debit' ? v.debit : v.credit);
  }
  return Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .map(([desc, amt]) => ({
      description: desc,
      current_year: round2(amt),
      previous_year: 0,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN P&L ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export function computeProfitAndLoss(params: PnLComputeParams): PnLReport {
  const invoices = Array.isArray(params.invoices) ? params.invoices : [];
  const purchases = Array.isArray(params.purchases) ? params.purchases : [];
  const bankTxns = Array.isArray(params.bankTxns) ? params.bankTxns : [];
  const payroll = Array.isArray(params.payroll) ? params.payroll : [];
  const expenses = Array.isArray(params.expenses) ? params.expenses : [];

  // ── Step 1: Compute Trial Balance first (single source of truth) ──
  const tbReport = computeDoubleEntryTrialBalance({
    companyId: params.companyId,
    invoices,
    purchases,
    bankTxns,
    payroll,
    expenses,
    openingBalances: params.openingBalances || {},
    dateFilter: params.dateFilter,
  });

  // ── Step 2: Derive P&L line items from TB ledger codes ──
  // Revenue = Credit side of Code 1001 (Sales/Revenue)
  const revenue = round2(getLedgerTx(tbReport.items, '1001', 'cr'));
  const otherIncome = round2(getLedgerTx(tbReport.items, '1002', 'cr'));
  const totalIncome = round2(revenue + otherIncome);

  // Expenses = Debit side of respective codes
  const cogs = round2(getLedgerTx(tbReport.items, '2001', 'dr'));
  const changesInInventories = 0; // Requires closing stock valuation
  const employeeBenefits = round2(getLedgerTx(tbReport.items, '3002', 'dr'));
  const depreciation = round2(params.assetRegisterDepreciation || 0);
  const financeCosts = 0; // Derived from loan interest — no dedicated ledger yet
  const otherExpenses = round2(getLedgerTx(tbReport.items, '3001', 'dr'));
  const totalExpenses = round2(cogs + changesInInventories + employeeBenefits + depreciation + financeCosts + otherExpenses);

  // ── Step 3: Profit calculations ──
  const grossProfit = round2(revenue - cogs);
  const ebitda = round2(totalIncome - (cogs + employeeBenefits + otherExpenses));
  const ebit = round2(ebitda - depreciation);
  const pbt = round2(totalIncome - totalExpenses);
  const exceptionalItems = 0;

  // ── Step 4: Tax Audit Add-Back Scanner ──
  const taxAddbacks = computeTaxAddBacks(bankTxns, purchases, pbt);

  // ── Step 5: Tax Calculation ──
  const regime = params.taxRegime || 'Section 115BAA (25.168%)';
  const taxConfig = TAX_RATES[regime] || TAX_RATES['Section 115BAA (25.168%)'];
  const taxableIncome = taxAddbacks.adjusted_taxable_income;
  const currentTax = round2(Math.max(0, taxableIncome * taxConfig.rate));
  const deferredTax = round2(params.deferredTaxCharge || 0);
  const totalTax = round2(currentTax + deferredTax);

  // ── Step 6: Bottom line ──
  const pat = round2(pbt - totalTax);
  const oci = 0;
  const totalComprehensiveIncome = round2(pat + oci);

  // ── Step 7: EPS ──
  const shares = params.outstandingShares || 10000;
  const basicEps = round2(shares > 0 ? pat / shares : 0);

  // ── Step 8: Margins ──
  const grossMarginPct = revenue > 0 ? round2((grossProfit / revenue) * 100) : 0;
  const ebitdaMarginPct = revenue > 0 ? round2((ebitda / revenue) * 100) : 0;
  const netMarginPct = revenue > 0 ? round2((pat / revenue) * 100) : 0;
  const effectiveTaxRate = pbt > 0 ? round2((totalTax / pbt) * 100) : 0;

  // ── Step 9: Notes to Accounts ──
  const notes = generateNotes(
    tbReport.items, invoices, purchases, payroll, expenses,
    revenue, cogs, employeeBenefits, otherExpenses, otherIncome, financeCosts
  );

  // ── Step 10: Waterfall chart data ──
  const waterfall = [
    { name: 'Revenue from Operations', value: revenue, color: '#22d3ee' },
    { name: 'Cost of Materials', value: -cogs, color: '#ef4444' },
    { name: 'Employee Benefits', value: -employeeBenefits, color: '#f97316' },
    { name: 'Depreciation', value: -depreciation, color: '#eab308' },
    { name: 'Finance Costs', value: -financeCosts, color: '#a855f7' },
    { name: 'Other Expenses', value: -otherExpenses, color: '#ec4899' },
    { name: 'Profit After Tax', value: pat, color: '#22c55e' },
  ];

  return {
    revenue_from_operations: revenue,
    other_income: otherIncome,
    total_income: totalIncome,
    cogs_direct_expenses: cogs,
    changes_in_inventories: changesInInventories,
    employee_benefit_expense: employeeBenefits,
    depreciation_amortisation: depreciation,
    finance_costs: financeCosts,
    other_expenses: otherExpenses,
    total_expenses: totalExpenses,
    gross_profit: grossProfit,
    gross_margin_pct: grossMarginPct,
    ebitda,
    ebitda_margin_pct: ebitdaMarginPct,
    ebit,
    pbt,
    exceptional_items: exceptionalItems,
    current_tax: currentTax,
    deferred_tax_charge: deferredTax,
    total_tax: totalTax,
    tax_regime_label: taxConfig.label,
    effective_tax_rate: effectiveTaxRate,
    pat,
    net_margin_pct: netMarginPct,
    oci_items: oci,
    total_comprehensive_income: totalComprehensiveIncome,
    outstanding_shares: shares,
    basic_eps: basicEps,
    diluted_eps: basicEps,
    tax_addbacks: taxAddbacks,
    notes,
    waterfall,
    tbReport,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: Excel (CSV)
// ═══════════════════════════════════════════════════════════════════════════

export function exportPnLToExcel(report: PnLReport, companyName: string, period: string) {
  const rows = [
    ['', 'Statement of Profit & Loss', ''],
    ['', `${companyName} — ${period}`, ''],
    ['', `Generated: ${new Date().toLocaleDateString('en-IN')}`, ''],
    ['', '', ''],
    ['Particulars', `${period} (₹)`, 'Previous FY (₹)'],
    ['', '', ''],
    ['I. INCOME', '', ''],
    ['  Revenue from Operations (Note 10)', report.revenue_from_operations.toFixed(2), '—'],
    ['  Other Income (Note 11)', report.other_income.toFixed(2), '—'],
    ['Total Income (I)', report.total_income.toFixed(2), '—'],
    ['', '', ''],
    ['II. EXPENSES', '', ''],
    ['  Cost of Materials Consumed (Note 12)', report.cogs_direct_expenses.toFixed(2), '—'],
    ['  Changes in Inventories', report.changes_in_inventories.toFixed(2), '—'],
    ['  Employee Benefit Expenses (Note 13)', report.employee_benefit_expense.toFixed(2), '—'],
    ['  Depreciation & Amortisation', report.depreciation_amortisation.toFixed(2), '—'],
    ['  Finance Costs (Note 14)', report.finance_costs.toFixed(2), '—'],
    ['  Other Expenses (Note 15)', report.other_expenses.toFixed(2), '—'],
    ['Total Expenses (II)', report.total_expenses.toFixed(2), '—'],
    ['', '', ''],
    ['III. Profit Before Exceptional Items & Tax (I - II)', report.pbt.toFixed(2), '—'],
    ['IV. Exceptional Items', report.exceptional_items.toFixed(2), '—'],
    ['V. Profit Before Tax (III + IV)', report.pbt.toFixed(2), '—'],
    ['', '', ''],
    ['VI. Tax Expense', '', ''],
    [`  Current Tax (${report.tax_regime_label})`, report.current_tax.toFixed(2), '—'],
    ['  Deferred Tax', report.deferred_tax_charge.toFixed(2), '—'],
    ['', '', ''],
    ['VII. PROFIT AFTER TAX (PAT)', report.pat.toFixed(2), '—'],
    ['', '', ''],
    ['Basic EPS (₹)', report.basic_eps.toFixed(2), '—'],
    ['Diluted EPS (₹)', report.diluted_eps.toFixed(2), '—'],
    ['', '', ''],
    ['--- Tax Audit Add-Backs ---', '', ''],
    ['Sec 40A(3) Disallowances', report.tax_addbacks.sec40A3_total.toFixed(2), ''],
    ['Sec 43B(h) MSME Disallowances', report.tax_addbacks.sec43Bh_total.toFixed(2), ''],
    ['Adjusted Taxable Income', report.tax_addbacks.adjusted_taxable_income.toFixed(2), ''],
  ];

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PnL_${companyName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: Schedule III PDF
// ═══════════════════════════════════════════════════════════════════════════

export function printPnLPDF(report: PnLReport, companyName: string, period: string) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: 'portrait' });
    let y = 15;

    // Title
    doc.setFontSize(14);
    doc.text(`Statement of Profit & Loss`, 14, y); y += 7;
    doc.setFontSize(10);
    doc.text(`${companyName} — ${period}`, 14, y); y += 5;
    doc.setFontSize(8);
    doc.text(`Schedule III (Companies Act 2013) | Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, y); y += 10;

    const fmtNum = (n: number) => n !== 0
      ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

    const addRow = (label: string, amount: number, bold = false, indent = 0) => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFontSize(8);
      doc.setFont(undefined as any, bold ? 'bold' : 'normal');
      doc.text(label, 14 + indent * 8, y);
      doc.text(fmtNum(amount), 180, y, { align: 'right' });
      y += 5;
    };

    const addHeader = (title: string) => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFontSize(9);
      doc.setFont(undefined as any, 'bold');
      doc.text(title, 14, y);
      y += 6;
    };

    addHeader('I. INCOME');
    addRow('Revenue from Operations', report.revenue_from_operations, false, 1);
    addRow('Other Income', report.other_income, false, 1);
    addRow('Total Income (I)', report.total_income, true);
    y += 3;

    addHeader('II. EXPENSES');
    addRow('Cost of Materials Consumed', report.cogs_direct_expenses, false, 1);
    addRow('Changes in Inventories', report.changes_in_inventories, false, 1);
    addRow('Employee Benefit Expenses', report.employee_benefit_expense, false, 1);
    addRow('Depreciation & Amortisation', report.depreciation_amortisation, false, 1);
    addRow('Finance Costs', report.finance_costs, false, 1);
    addRow('Other Expenses', report.other_expenses, false, 1);
    addRow('Total Expenses (II)', report.total_expenses, true);
    y += 3;

    addRow('III. Profit Before Exceptional Items & Tax (I - II)', report.pbt, true);
    addRow('IV. Exceptional Items', report.exceptional_items);
    addRow('V. Profit Before Tax (III + IV)', report.pbt, true);
    y += 3;

    addHeader('VI. Tax Expense');
    addRow(`Current Tax (${report.tax_regime_label})`, report.current_tax, false, 1);
    addRow('Deferred Tax Charge / (Credit)', report.deferred_tax_charge, false, 1);
    y += 3;

    addRow('VII. PROFIT AFTER TAX (PAT)', report.pat, true);
    y += 5;

    addRow('Basic Earnings Per Share (₹)', report.basic_eps);
    addRow('Diluted Earnings Per Share (₹)', report.diluted_eps);

    doc.save(`PnL_Schedule_III_${companyName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`);
  }).catch(() => {
    window.print();
  });
}
