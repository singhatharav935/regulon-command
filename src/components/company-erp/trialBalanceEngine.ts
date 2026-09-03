/**
 * TRIAL BALANCE ENGINE — Auto-Balancing Double-Entry System
 * ==========================================================
 * Pure computation module. No React dependencies.
 *
 * Core principle: Every debit has an equal credit. Always.
 *
 * Data flows:
 *   localStorage/Zustand → this engine → TBDoubleEntryReport
 *   TBDoubleEntryReport → TrialBalanceTab (UI)
 *   TBDoubleEntryReport → Excel / Tally XML / PDF exporters
 */

// ── TYPES ─────────────────────────────────────────────────────────────────

export interface TBVoucher {
  date: string;
  voucher_type: string;
  ref_no: string;
  particulars: string;
  narration?: string;
  debit: number;
  credit: number;
  doc_url?: string;
}

export interface TBLedgerItem {
  code: string;
  name: string;
  group: string;
  scheduleIIIGroup: string;
  parentGroup: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  openingDr: number;
  openingCr: number;
  txDr: number;
  txCr: number;
  closingDr: number;
  closingCr: number;
  txnCount: number;
  vouchers: TBVoucher[];
}

export interface TBDoubleEntryReport {
  isBalanced: boolean;
  differenceAmount: number;
  totalOpeningDr: number;
  totalOpeningCr: number;
  totalTxDr: number;
  totalTxCr: number;
  totalClosingDr: number;
  totalClosingCr: number;
  items: TBLedgerItem[];
  groupedItems: Record<string, TBLedgerItem[]>;
  hasSuspense: boolean;
  suspenseAmount: number;
}

export interface TBComputeParams {
  companyId: string;
  invoices: any[];
  purchases: any[];
  bankTxns: any[];
  payroll: any[];
  expenses: any[];
  openingBalances: any;
  dateFilter?: string;
}

// ── HELPERS ───────────────────────────────────────────────────────────────

function toNum(v: any): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function getDateRange(filter: string): { start: Date; end: Date } | null {
  const fy = 2025; // FY 2025-26
  switch (filter) {
    case 'Q1 (Apr-Jun)': return { start: new Date(fy, 3, 1), end: new Date(fy, 5, 30) };
    case 'Q2 (Jul-Sep)': return { start: new Date(fy, 6, 1), end: new Date(fy, 8, 30) };
    case 'Q3 (Oct-Dec)': return { start: new Date(fy, 9, 1), end: new Date(fy, 11, 31) };
    case 'Q4 (Jan-Mar)': return { start: new Date(fy + 1, 0, 1), end: new Date(fy + 1, 2, 31) };
    case 'MTD': {
      const now = new Date();
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    }
    default: return null; // Full FY — no filter
  }
}

function isInDateRange(dateStr: string, range: { start: Date; end: Date } | null): boolean {
  if (!range) return true;
  if (!dateStr) return true; // Include if no date (safe default)
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  return d >= range.start && d <= range.end;
}

// ── CHART OF ACCOUNTS ─────────────────────────────────────────────────────

interface LedgerAccum {
  code: string;
  name: string;
  group: string;
  scheduleIIIGroup: string;
  parentGroup: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  openingDr: number;
  openingCr: number;
  txDr: number;
  txCr: number;
  vouchers: TBVoucher[];
}

const CHART_OF_ACCOUNTS: Array<{
  code: string; name: string; group: string;
  scheduleIIIGroup: string; parentGroup: LedgerAccum['parentGroup'];
  obField?: string; obSide?: 'dr' | 'cr';
}> = [
  { code: '1001', name: 'Sales / Revenue Account', group: 'Revenue', scheduleIIIGroup: 'Revenue from Operations', parentGroup: 'Revenue' },
  { code: '1002', name: 'Other Income', group: 'Revenue', scheduleIIIGroup: 'Other Income', parentGroup: 'Revenue' },
  { code: '2001', name: 'Purchase Account', group: 'Direct Expenses', scheduleIIIGroup: 'Cost of Materials Consumed', parentGroup: 'Expenses' },
  { code: '3001', name: 'Operating Expenses Account', group: 'Indirect Expenses', scheduleIIIGroup: 'Other Expenses', parentGroup: 'Expenses' },
  { code: '3002', name: 'Salary & Wages', group: 'Indirect Expenses', scheduleIIIGroup: 'Employee Benefit Expense', parentGroup: 'Expenses' },
  { code: '3101', name: 'Bank Account (Primary)', group: 'Bank Accounts', scheduleIIIGroup: 'Cash and Cash Equivalents', parentGroup: 'Assets', obField: 'bank_balance', obSide: 'dr' },
  { code: '3102', name: 'Cash in Hand', group: 'Cash', scheduleIIIGroup: 'Cash and Cash Equivalents', parentGroup: 'Assets', obField: 'cash_balance', obSide: 'dr' },
  { code: '4001', name: 'Trade Receivables (Sundry Debtors)', group: 'Current Assets', scheduleIIIGroup: 'Trade Receivables', parentGroup: 'Assets', obField: 'debtors', obSide: 'dr' },
  { code: '4002', name: 'Inventory / Stock-in-Trade', group: 'Current Assets', scheduleIIIGroup: 'Inventories', parentGroup: 'Assets', obField: 'stock', obSide: 'dr' },
  { code: '5001', name: 'Trade Payables (Sundry Creditors)', group: 'Current Liabilities', scheduleIIIGroup: 'Trade Payables', parentGroup: 'Liabilities', obField: 'creditors', obSide: 'cr' },
  { code: '7001', name: 'Share Capital', group: 'Equity', scheduleIIIGroup: "Shareholders' Funds", parentGroup: 'Equity', obField: 'share_capital', obSide: 'cr' },
  { code: '7002', name: 'Reserves & Surplus', group: 'Equity', scheduleIIIGroup: "Shareholders' Funds", parentGroup: 'Equity', obField: 'reserves', obSide: 'cr' },
  { code: '6001', name: 'Long-Term Borrowings', group: 'Non-Current Liabilities', scheduleIIIGroup: 'Long-term Borrowings', parentGroup: 'Liabilities', obField: 'long_term_loans', obSide: 'cr' },
  { code: '8001', name: 'Fixed Assets (Gross Block)', group: 'Non-Current Assets', scheduleIIIGroup: 'Property, Plant and Equipment', parentGroup: 'Assets', obField: 'fixed_assets_gross', obSide: 'dr' },
  { code: '8002', name: 'Accumulated Depreciation', group: 'Non-Current Assets', scheduleIIIGroup: 'Property, Plant and Equipment', parentGroup: 'Assets', obField: 'accumulated_depreciation', obSide: 'cr' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export function computeDoubleEntryTrialBalance(params: TBComputeParams): TBDoubleEntryReport {
  const invoices = Array.isArray(params.invoices) ? params.invoices : [];
  const purchases = Array.isArray(params.purchases) ? params.purchases : [];
  const expenses = Array.isArray(params.expenses) ? params.expenses : [];
  const payroll = Array.isArray(params.payroll) ? params.payroll : [];
  const bankTxns = Array.isArray(params.bankTxns) ? params.bankTxns : [];
  const ob = params.openingBalances || {};
  const dateRange = getDateRange(params.dateFilter || 'FY 2025-26');

  // ── Initialize ledger accumulators ──────────────────────────────────────
  const ledgers: Record<string, LedgerAccum> = {};

  for (const acct of CHART_OF_ACCOUNTS) {
    let opDr = 0, opCr = 0;
    if (acct.obField && ob[acct.obField] != null) {
      const val = toNum(ob[acct.obField]);
      if (acct.obSide === 'dr') {
        if (val >= 0) opDr = val; else opCr = Math.abs(val);
      } else {
        if (val >= 0) opCr = val; else opDr = Math.abs(val);
      }
    }
    ledgers[acct.code] = {
      code: acct.code, name: acct.name, group: acct.group,
      scheduleIIIGroup: acct.scheduleIIIGroup, parentGroup: acct.parentGroup,
      openingDr: opDr, openingCr: opCr, txDr: 0, txCr: 0, vouchers: [],
    };
  }

  // ── Balance opening balances ────────────────────────────────────────────
  const totalObDr = Object.values(ledgers).reduce((s, l) => s + l.openingDr, 0);
  const totalObCr = Object.values(ledgers).reduce((s, l) => s + l.openingCr, 0);
  const obDiff = Math.round((totalObDr - totalObCr) * 100) / 100;
  if (Math.abs(obDiff) > 0.01) {
    ledgers['9999'] = {
      code: '9999', name: 'Suspense Account (Auto-Balance)', group: 'Suspense',
      scheduleIIIGroup: 'Suspense', parentGroup: 'Liabilities',
      openingDr: obDiff < 0 ? Math.abs(obDiff) : 0,
      openingCr: obDiff > 0 ? obDiff : 0,
      txDr: 0, txCr: 0, vouchers: [],
    };
  }

  // ── Helper: post a double-entry journal ─────────────────────────────────
  function postJournal(
    drCode: string, crCode: string, amount: number,
    voucher: Omit<TBVoucher, 'debit' | 'credit'>
  ) {
    if (amount <= 0) return;
    const drLedger = ledgers[drCode];
    const crLedger = ledgers[crCode];
    if (!drLedger || !crLedger) return;
    drLedger.txDr += amount;
    drLedger.vouchers.push({ ...voucher, debit: amount, credit: 0 });
    crLedger.txCr += amount;
    crLedger.vouchers.push({ ...voucher, debit: 0, credit: amount });
  }

  // ── Detect data availability ────────────────────────────────────────────
  const hasInvoiceData = invoices.length > 0;
  const hasPurchaseData = purchases.length > 0;
  const hasExpenseData = expenses.length > 0;
  const hasPayrollData = payroll.length > 0;
  const hasBankData = bankTxns.length > 0;

  // ═══════════════════════════════════════════════════════════════════════
  // 1. SALES INVOICES: Dr Debtors 4001, Cr Revenue 1001
  // ═══════════════════════════════════════════════════════════════════════
  invoices.forEach((inv: any, i: number) => {
    const amt = toNum(inv.grand_total || inv.total || inv.amount);
    const vDate = inv.date || inv.invoice_date || '';
    const vRef = inv.invoice_no || inv.id || `INV-${i + 1}`;
    const vParty = inv.party_name || inv.customer_name || inv.client || 'Customer';
    if (amt > 0 && isInDateRange(vDate, dateRange)) {
      postJournal('4001', '1001', amt, {
        date: vDate, voucher_type: 'Sales Invoice', ref_no: vRef,
        particulars: vParty, narration: `Sale to ${vParty}`,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. PURCHASES: Dr Purchases 2001, Cr Creditors 5001
  // ═══════════════════════════════════════════════════════════════════════
  purchases.forEach((pur: any, i: number) => {
    const amt = toNum(pur.grand_total || pur.total || pur.amount);
    const vDate = pur.date || pur.bill_date || '';
    const vRef = pur.bill_no || pur.id || `PUR-${i + 1}`;
    const vParty = pur.party_name || pur.vendor_name || pur.supplier || 'Vendor';
    if (amt > 0 && isInDateRange(vDate, dateRange)) {
      postJournal('2001', '5001', amt, {
        date: vDate, voucher_type: 'Purchase Invoice', ref_no: vRef,
        particulars: vParty, narration: `Purchase from ${vParty}`,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. EXPENSES: Dr Expenses 3001, Cr Bank 3101 (ONLY if no bank data)
  // ═══════════════════════════════════════════════════════════════════════
  if (hasExpenseData && !hasBankData) {
    expenses.forEach((exp: any, i: number) => {
      const amt = toNum(exp.amount || exp.total);
      const vDate = exp.date || '';
      const vRef = exp.id || `EXP-${i + 1}`;
      const vDesc = exp.description || exp.category || 'Operating Expense';
      if (amt > 0 && isInDateRange(vDate, dateRange)) {
        postJournal('3001', '3101', amt, {
          date: vDate, voucher_type: 'Payment', ref_no: vRef,
          particulars: vDesc, narration: `Expense: ${vDesc}`,
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. PAYROLL: Dr Salary 3002, Cr Bank 3101 (ONLY if no bank data)
  // ═══════════════════════════════════════════════════════════════════════
  if (hasPayrollData && !hasBankData) {
    payroll.forEach((p: any, i: number) => {
      const amt = toNum(p.net_salary || p.gross_salary || p.amount);
      const vDate = p.date || p.month || '';
      const vRef = p.id || `PAY-${i + 1}`;
      const vParty = p.employee_name || p.name || 'Employee';
      if (amt > 0 && isInDateRange(vDate, dateRange)) {
        postJournal('3002', '3101', amt, {
          date: vDate, voucher_type: 'Payroll', ref_no: vRef,
          particulars: vParty, narration: `Salary: ${vParty}`,
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. BANK TRANSACTIONS — Auto-Contra Double-Entry
  //    Every bank debit/credit generates an equal and opposite entry.
  // ═══════════════════════════════════════════════════════════════════════
  if (hasBankData) {
    bankTxns.forEach((t: any, i: number) => {
      const credit = toNum(t.credit); // money IN to bank account
      const debit = toNum(t.debit);   // money OUT from bank account
      const vDate = t.date || '';
      const vRef = t.id || t.ref || `BANK-${i + 1}`;
      const vDesc = t.description || t.narration || '';

      if (!isInDateRange(vDate, dateRange)) return;

      // ── Bank CREDIT (money coming IN) ──
      if (credit > 0) {
        if (hasInvoiceData) {
          // Settlement of debtor: Dr Bank 3101, Cr Debtors 4001
          postJournal('3101', '4001', credit, {
            date: vDate, voucher_type: 'Bank Receipt', ref_no: vRef,
            particulars: vDesc || 'Receipt from Customer',
            narration: `Bank receipt: ${vDesc}`,
          });
        } else {
          // No invoices — treat as direct revenue: Dr Bank 3101, Cr Revenue 1001
          postJournal('3101', '1001', credit, {
            date: vDate, voucher_type: 'Bank Receipt', ref_no: vRef,
            particulars: vDesc || 'Revenue Receipt',
            narration: `Revenue receipt: ${vDesc}`,
          });
        }
      }

      // ── Bank DEBIT (money going OUT) ──
      if (debit > 0) {
        if (hasPurchaseData) {
          // Settlement of creditor: Dr Creditors 5001, Cr Bank 3101
          postJournal('5001', '3101', debit, {
            date: vDate, voucher_type: 'Bank Payment', ref_no: vRef,
            particulars: vDesc || 'Payment to Vendor',
            narration: `Bank payment: ${vDesc}`,
          });
        } else {
          // No purchases — auto-classify by description keywords
          const descLower = (vDesc || '').toLowerCase();
          const isSalary = /salary|wages|payroll|employee|staff|pf\b|epf|esic|esi\b/.test(descLower);
          const isPurchase = /purchase|material|raw|stock|inventory|goods/.test(descLower);

          if (isSalary) {
            postJournal('3002', '3101', debit, {
              date: vDate, voucher_type: 'Bank Payment', ref_no: vRef,
              particulars: vDesc, narration: `Salary payment: ${vDesc}`,
            });
          } else if (isPurchase) {
            postJournal('2001', '3101', debit, {
              date: vDate, voucher_type: 'Bank Payment', ref_no: vRef,
              particulars: vDesc, narration: `Purchase payment: ${vDesc}`,
            });
          } else {
            // General operating expense
            postJournal('3001', '3101', debit, {
              date: vDate, voucher_type: 'Bank Payment', ref_no: vRef,
              particulars: vDesc || 'Operating Expense',
              narration: `Expense: ${vDesc}`,
            });
          }
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTE CLOSING BALANCES
  // Formula: netClosing = (openingDr - openingCr) + (txDr - txCr)
  //   netClosing > 0 → closingDr
  //   netClosing < 0 → closingCr (absolute value)
  // ═══════════════════════════════════════════════════════════════════════
  const items: TBLedgerItem[] = Object.values(ledgers)
    .filter(l => l.openingDr > 0 || l.openingCr > 0 || l.txDr > 0 || l.txCr > 0)
    .map(l => {
      const netOpening = l.openingDr - l.openingCr;
      const netMovement = l.txDr - l.txCr;
      const netClosing = netOpening + netMovement;
      return {
        code: l.code,
        name: l.name,
        group: l.group,
        scheduleIIIGroup: l.scheduleIIIGroup,
        parentGroup: l.parentGroup,
        openingDr: l.openingDr,
        openingCr: l.openingCr,
        txDr: l.txDr,
        txCr: l.txCr,
        closingDr: netClosing > 0 ? Math.round(netClosing * 100) / 100 : 0,
        closingCr: netClosing < 0 ? Math.round(Math.abs(netClosing) * 100) / 100 : 0,
        txnCount: l.vouchers.length,
        vouchers: l.vouchers,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  // ── Compute totals ──
  const totalOpeningDr = Math.round(items.reduce((s, r) => s + r.openingDr, 0) * 100) / 100;
  const totalOpeningCr = Math.round(items.reduce((s, r) => s + r.openingCr, 0) * 100) / 100;
  const totalTxDr = Math.round(items.reduce((s, r) => s + r.txDr, 0) * 100) / 100;
  const totalTxCr = Math.round(items.reduce((s, r) => s + r.txCr, 0) * 100) / 100;
  const totalClosingDr = Math.round(items.reduce((s, r) => s + r.closingDr, 0) * 100) / 100;
  const totalClosingCr = Math.round(items.reduce((s, r) => s + r.closingCr, 0) * 100) / 100;

  const closingDiff = Math.round(Math.abs(totalClosingDr - totalClosingCr) * 100) / 100;
  const isBalanced = closingDiff < 0.01;

  const hasSuspense = items.some(r => r.code === '9999');
  const suspenseItem = items.find(r => r.code === '9999');
  const suspenseAmount = suspenseItem ? Math.max(suspenseItem.closingDr, suspenseItem.closingCr) : 0;

  // ── Group items by Schedule III group ──
  const groupedItems: Record<string, TBLedgerItem[]> = {};
  for (const item of items) {
    const key = item.group;
    if (!groupedItems[key]) groupedItems[key] = [];
    groupedItems[key].push(item);
  }

  return {
    isBalanced,
    differenceAmount: closingDiff,
    totalOpeningDr, totalOpeningCr,
    totalTxDr, totalTxCr,
    totalClosingDr, totalClosingCr,
    items, groupedItems,
    hasSuspense, suspenseAmount,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: Excel (CSV)
// ═══════════════════════════════════════════════════════════════════════════

export function exportTrialBalanceToExcel(
  report: TBDoubleEntryReport, companyName: string, period: string
) {
  const headers = ['Code', 'Ledger Account', 'Schedule III Group',
    'Opening Dr', 'Opening Cr', 'Debit Tx', 'Credit Tx', 'Closing Dr', 'Closing Cr'];

  const rows = report.items.map(r => [
    r.code, `"${r.name}"`, `"${r.group}"`,
    r.openingDr.toFixed(2), r.openingCr.toFixed(2),
    r.txDr.toFixed(2), r.txCr.toFixed(2),
    r.closingDr.toFixed(2), r.closingCr.toFixed(2),
  ]);

  rows.push([
    '', '"TOTAL TRIAL BALANCE"', '',
    report.totalOpeningDr.toFixed(2), report.totalOpeningCr.toFixed(2),
    report.totalTxDr.toFixed(2), report.totalTxCr.toFixed(2),
    report.totalClosingDr.toFixed(2), report.totalClosingCr.toFixed(2),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TrialBalance_${companyName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: Tally XML
// ═══════════════════════════════════════════════════════════════════════════

export function exportTrialBalanceToTallyXML(
  report: TBDoubleEntryReport, companyName: string
) {
  const ledgerXml = report.items.map(r => {
    const net = r.closingDr - r.closingCr;
    return `      <LEDGER NAME="${r.name}" RESERVEDNAME="">
        <PARENT>${r.group}</PARENT>
        <OPENINGBALANCE>${(r.openingDr - r.openingCr).toFixed(2)}</OPENINGBALANCE>
        <CLOSINGBALANCE>${net.toFixed(2)}</CLOSINGBALANCE>
      </LEDGER>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Trial Balance</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
${ledgerXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TrialBalance_${companyName.replace(/\s+/g, '_')}_Tally.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: PDF Report (via jsPDF)
// ═══════════════════════════════════════════════════════════════════════════

export function printTrialBalancePDF(
  report: TBDoubleEntryReport, companyName: string, period: string
) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Title
    doc.setFontSize(14);
    doc.text(`Trial Balance — ${companyName}`, 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Period: ${period}  |  Generated: ${new Date().toLocaleDateString('en-IN')}  |  Status: ${report.isBalanced ? 'BALANCED ✓' : 'IMBALANCED ⚠'}`,
      14, 22
    );

    // Table
    const headers = ['Code', 'Ledger Account', 'Group', 'Opening Dr', 'Opening Cr', 'Debit Tx', 'Credit Tx', 'Closing Dr', 'Closing Cr'];
    const colWidths = [18, 60, 40, 26, 26, 26, 26, 26, 26];
    let y = 32;
    const startX = 10;
    const fmtNum = (n: number) =>
      n > 0 ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

    // Header row
    doc.setFontSize(7);
    doc.setFont(undefined as any, 'bold');
    let x = startX;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 2;
    doc.line(startX, y, 284, y);
    y += 5;

    // Data rows
    doc.setFont(undefined as any, 'normal');
    report.items.forEach(r => {
      if (y > 190) { doc.addPage(); y = 15; }
      x = startX;
      const vals = [
        r.code, r.name.substring(0, 28), r.group.substring(0, 18),
        fmtNum(r.openingDr), fmtNum(r.openingCr),
        fmtNum(r.txDr), fmtNum(r.txCr),
        fmtNum(r.closingDr), fmtNum(r.closingCr),
      ];
      vals.forEach((v, i) => { doc.text(String(v), x, y); x += colWidths[i]; });
      y += 5;
    });

    // Total row
    y += 2;
    doc.line(startX, y, 284, y);
    y += 5;
    doc.setFont(undefined as any, 'bold');
    x = startX;
    const totals = [
      '', 'TOTAL TRIAL BALANCE', '',
      fmtNum(report.totalOpeningDr), fmtNum(report.totalOpeningCr),
      fmtNum(report.totalTxDr), fmtNum(report.totalTxCr),
      fmtNum(report.totalClosingDr), fmtNum(report.totalClosingCr),
    ];
    totals.forEach((v, i) => { doc.text(String(v), x, y); x += colWidths[i]; });

    doc.save(`TrialBalance_${companyName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`);
  }).catch(() => {
    // Fallback: browser print
    window.print();
  });
}
