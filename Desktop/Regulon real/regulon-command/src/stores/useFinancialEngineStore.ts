/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SANNIDH FINANCIAL ENGINE STORE  ·  Zustand Global State Manager
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  SINGLE SOURCE OF TRUTH for the entire Smart ERP System.
 *
 *  All tabs (Trial Balance, P&L, Balance Sheet, Day Book, Cash & Bank,
 *  Aging Schedule, Asset Register, Deferred Tax, Financial Ratios, CARO 2020)
 *  derive their numbers from this store.
 *
 *  Data flows in via:
 *    1. DataIngestionModal → ingestBankTxns / ingestInvoices / ingestPurchases / etc.
 *    2. RealERPModule → hydrateFromLocalStorage() on mount
 *    3. Props from parent → syncFromProps()
 *
 *  Data is persisted to localStorage as a backup.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import type {
  ERPInvoice, ERPPurchase, ERPExpense, ERPPayroll, ERPBankTxn
} from '@/components/company-erp/erp-types';

// ─── CORE TYPES ──────────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  date: string;
  voucherType: 'Sales' | 'Purchase' | 'Payment' | 'Receipt' | 'Journal' | 'Contra';
  accountHead: string;
  accountGroup: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  debit: number;
  credit: number;
  partyName?: string;
  gstin?: string;
  entityType?: 'MSME_Micro' | 'MSME_Small' | 'MSME_Medium' | 'Corporate' | 'General';
  invoiceDate?: string;
  paymentDueDate?: string;
  assetCategory?: 'Plant_Machinery' | 'Furniture' | 'Vehicles' | 'Computers' | 'Intangibles' | null;
  isClearedInBank: boolean;
  bankClearanceDate?: string;
  referenceNo?: string;
  narration?: string;
}

export interface OpeningBalances {
  cash_balance: number;
  bank_balance: number;
  debtors: number;
  creditors: number;
  stock: number;
  share_capital: number;
  reserves: number;
  long_term_loans: number;
  fixed_assets_gross: number;
  accumulated_depreciation: number;
}

export interface DepreciationPolicy {
  method_book: 'SLM' | 'WDV';
  method_tax: 'WDV';
  rates: Record<string, { book_rate: number; tax_rate: number; useful_life_years: number }>;
}

export interface FixedAssetEntry {
  id: string;
  name: string;
  category: string;
  date_acquired: string;
  cost: number;
  useful_life_years: number;
  book_dep_rate: number;
  tax_dep_rate: number;
  book_accumulated_dep: number;
  tax_accumulated_dep: number;
}

// ─── COMPUTED OUTPUT TYPES ───────────────────────────────────────────────────

export interface TrialBalanceRow {
  code: string;
  name: string;
  group: string;
  parentGroup: string;
  openingDr: number;
  openingCr: number;
  txDr: number;
  txCr: number;
  closingDr: number;
  closingCr: number;
  vouchers: any[];
}

export interface TrialBalanceResult {
  isBalanced: boolean;
  differenceAmount: number;
  totalOpeningDr: number;
  totalOpeningCr: number;
  totalTxDr: number;
  totalTxCr: number;
  totalClosingDr: number;
  totalClosingCr: number;
  items: TrialBalanceRow[];
  groupedItems: Record<string, TrialBalanceRow[]>;
}

export interface ProfitLossResult {
  revenueFromOperations: number;
  otherIncome: number;
  totalIncome: number;
  cogsDirectExpenses: number;
  employeeBenefitExpense: number;
  depreciationAmortisation: number;
  financeCosts: number;
  otherExpenses: number;
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  ebit: number;
  pbt: number;
  currentTax: number;
  deferredTaxCharge: number;
  totalTax: number;
  pat: number;
  grossMarginPct: number;
  ebitdaMarginPct: number;
  netMarginPct: number;
}

export interface BalanceSheetResult {
  isBalanced: boolean;
  totalAssets: number;
  totalEquityLiabilities: number;
  difference: number;
  equity: { shareCapital: number; reservesSurplus: number; total: number };
  nonCurrentLiabilities: { longTermBorrowings: number; deferredTaxLiability: number; total: number };
  currentLiabilities: {
    tradePayables: number; tradePayablesMsme: number; tradePayablesOthers: number;
    gstPayable: number; tdsPayable: number; pfEsicPayable: number;
    salaryPayable: number; incomeTaxPayable: number; total: number;
  };
  nonCurrentAssets: { grossBlock: number; accumulatedDep: number; netBlock: number; deferredTaxAsset: number; total: number };
  currentAssets: {
    tradeReceivables: number; bankBalance: number; cashInHand: number;
    inputGstItc: number; tdsReceivable: number; inventories: number; total: number;
  };
}

export interface AgingParty {
  partyId: string;
  partyName: string;
  gstin: string;
  totalOutstanding: number;
  notDue: number;
  b1_30: number;
  b31_45: number;
  b46_90: number;
  b91_180: number;
  bOver180: number;
  msmeCategory: string | null;
  isSec43bh: boolean;
  invoices: any[];
}

export interface FinancialRatiosResult {
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  grossProfitMarginPct: number;
  ebitdaMarginPct: number;
  netProfitMarginPct: number;
  returnOnAssetsPct: number;
  returnOnEquityPct: number;
  returnOnCapitalEmployedPct: number;
  debtEquityRatio: number;
  debtToAssetsRatio: number;
  interestCoverageRatio: number;
  assetTurnoverRatio: number;
  inventoryTurnoverRatio: number;
  receivablesDays: number;
  payablesDays: number;
  operatingCashFlowRatio: number;
  freeCashFlow: number;
}

// ─── STORE STATE ─────────────────────────────────────────────────────────────

interface FinancialEngineState {
  // ─ Company Context
  companyId: string;
  companyName: string;
  fiscalYear: string;
  isDemoMode: boolean;

  // ─ Raw Data (Single Source of Truth)
  invoices: ERPInvoice[];
  purchases: ERPPurchase[];
  expenses: ERPExpense[];
  payroll: ERPPayroll[];
  bankTxns: ERPBankTxn[];
  openingBalances: OpeningBalances;
  depreciationPolicy: DepreciationPolicy;
  fixedAssets: FixedAssetEntry[];

  // ─ Ingestion timestamp (triggers re-renders)
  lastIngestionTimestamp: number;

  // ─ Actions
  setCompanyContext: (companyId: string, companyName?: string, fiscalYear?: string, isDemo?: boolean) => void;
  ingestBankTxns: (txns: ERPBankTxn[]) => void;
  ingestInvoices: (invoices: ERPInvoice[]) => void;
  ingestPurchases: (purchases: ERPPurchase[]) => void;
  ingestExpenses: (expenses: ERPExpense[]) => void;
  ingestPayroll: (payroll: ERPPayroll[]) => void;
  setOpeningBalances: (ob: Partial<OpeningBalances>) => void;
  setDepreciationPolicy: (dp: Partial<DepreciationPolicy>) => void;
  addFixedAsset: (asset: FixedAssetEntry) => void;
  removeFixedAsset: (id: string) => void;
  syncFromProps: (props: {
    invoices?: ERPInvoice[];
    purchases?: ERPPurchase[];
    expenses?: ERPExpense[];
    payroll?: ERPPayroll[];
    bankTxns?: ERPBankTxn[];
  }) => void;
  hydrateFromLocalStorage: (companyId: string, isDemo?: boolean) => void;
  resetAllData: () => void;
  resetStoreForCompany: (companyId: string, isDemo?: boolean) => void;

  // ─ Persist helper
  _persistToLocalStorage: () => void;
}

// ─── DEFAULT VALUES ──────────────────────────────────────────────────────────

const DEFAULT_OPENING_BALANCES: OpeningBalances = {
  cash_balance: 0,
  bank_balance: 0,
  debtors: 0,
  creditors: 0,
  stock: 0,
  share_capital: 0,
  reserves: 0,
  long_term_loans: 0,
  fixed_assets_gross: 0,
  accumulated_depreciation: 0,
};

const DEFAULT_DEP_POLICY: DepreciationPolicy = {
  method_book: 'SLM',
  method_tax: 'WDV',
  rates: {
    Plant_Machinery: { book_rate: 6.33, tax_rate: 15, useful_life_years: 15 },
    Furniture: { book_rate: 9.52, tax_rate: 10, useful_life_years: 10 },
    Vehicles: { book_rate: 11.31, tax_rate: 15, useful_life_years: 8 },
    Computers: { book_rate: 31.67, tax_rate: 40, useful_life_years: 3 },
    Intangibles: { book_rate: 16.67, tax_rate: 25, useful_life_years: 6 },
  },
};

// Helper for strict key prefixing
const getStoragePrefix = (companyId: string, isDemo: boolean): string => {
  if (isDemo) return 'sannidh_demo';
  const cleanId = companyId || 'default_real';
  return `sannidh_real_${cleanId}`;
};

// ─── STORE CREATION ──────────────────────────────────────────────────────────

export const useFinancialEngineStore = create<FinancialEngineState>((set, get) => ({
  // Defaults
  companyId: '',
  companyName: '',
  fiscalYear: 'FY 2025-26',
  isDemoMode: false,
  invoices: [],
  purchases: [],
  expenses: [],
  payroll: [],
  bankTxns: [],
  openingBalances: { ...DEFAULT_OPENING_BALANCES },
  depreciationPolicy: { ...DEFAULT_DEP_POLICY },
  fixedAssets: [],
  lastIngestionTimestamp: 0,

  // ─ Set company context
  setCompanyContext: (companyId, companyName, fiscalYear, isDemo = false) => set({
    companyId,
    isDemoMode: isDemo,
    ...(companyName ? { companyName } : {}),
    ...(fiscalYear ? { fiscalYear } : {}),
  }),

  // ─ Ingest bank transactions (merge + deduplicate)
  ingestBankTxns: (txns) => {
    set(state => {
      const existingIds = new Set(state.bankTxns.map(t => t.id));
      const newTxns = txns.filter(t => !existingIds.has(t.id));
      const merged = [...state.bankTxns, ...newTxns];
      return { bankTxns: merged, lastIngestionTimestamp: Date.now() };
    });
    get()._persistToLocalStorage();
  },

  // ─ Ingest invoices (replace all)
  ingestInvoices: (invoices) => {
    set({ invoices, lastIngestionTimestamp: Date.now() });
    get()._persistToLocalStorage();
  },

  // ─ Ingest purchases (replace all)
  ingestPurchases: (purchases) => {
    set({ purchases, lastIngestionTimestamp: Date.now() });
    get()._persistToLocalStorage();
  },

  // ─ Ingest expenses (replace all)
  ingestExpenses: (expenses) => {
    set({ expenses, lastIngestionTimestamp: Date.now() });
    get()._persistToLocalStorage();
  },

  // ─ Ingest payroll (replace all)
  ingestPayroll: (payroll) => {
    set({ payroll, lastIngestionTimestamp: Date.now() });
    get()._persistToLocalStorage();
  },

  // ─ Opening balances
  setOpeningBalances: (ob) => {
    set(state => ({
      openingBalances: { ...state.openingBalances, ...ob },
      lastIngestionTimestamp: Date.now(),
    }));
    get()._persistToLocalStorage();
  },

  // ─ Depreciation policy
  setDepreciationPolicy: (dp) => {
    set(state => ({
      depreciationPolicy: { ...state.depreciationPolicy, ...dp },
      lastIngestionTimestamp: Date.now(),
    }));
    get()._persistToLocalStorage();
  },

  // ─ Fixed assets
  addFixedAsset: (asset) => {
    set(state => ({
      fixedAssets: [...state.fixedAssets, asset],
      lastIngestionTimestamp: Date.now(),
    }));
    get()._persistToLocalStorage();
  },

  removeFixedAsset: (id) => {
    set(state => ({
      fixedAssets: state.fixedAssets.filter(a => a.id !== id),
      lastIngestionTimestamp: Date.now(),
    }));
    get()._persistToLocalStorage();
  },

  // ─ Sync from props (for SmartERPModule → store bridge)
  syncFromProps: (props) => {
    const updates: Partial<FinancialEngineState> = {};
    if (props.invoices && props.invoices.length > 0) updates.invoices = props.invoices;
    if (props.purchases && props.purchases.length > 0) updates.purchases = props.purchases;
    if (props.expenses && props.expenses.length > 0) updates.expenses = props.expenses;
    if (props.payroll && props.payroll.length > 0) updates.payroll = props.payroll;
    if (props.bankTxns && props.bankTxns.length > 0) updates.bankTxns = props.bankTxns;
    if (Object.keys(updates).length > 0) {
      set({ ...updates, lastIngestionTimestamp: Date.now() });
    }
  },

  // ─ Hydrate from localStorage on mount (strictly namespaced)
  hydrateFromLocalStorage: (companyId, isDemo = false) => {
    if (typeof window === 'undefined') return;
    const prefix = getStoragePrefix(companyId, isDemo);

    const tryParse = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    };

    const bankTxns = tryParse(`${prefix}_bank_txns`) || [];
    const invoices = tryParse(`${prefix}_invoices`) || [];
    const purchases = tryParse(`${prefix}_purchases`) || [];
    const expenses = tryParse(`${prefix}_expenses`) || [];
    const payroll = tryParse(`${prefix}_payroll`) || [];
    const openingBalances = tryParse(`${prefix}_opening_balances`) || DEFAULT_OPENING_BALANCES;
    const depPolicy = tryParse(`${prefix}_dep_policy`);
    const fixedAssets = tryParse(`${prefix}_fixed_assets`) || [];

    set({
      companyId,
      isDemoMode: isDemo,
      bankTxns,
      invoices,
      purchases,
      expenses,
      payroll,
      openingBalances: { ...DEFAULT_OPENING_BALANCES, ...openingBalances },
      depreciationPolicy: depPolicy ? { ...DEFAULT_DEP_POLICY, ...depPolicy } : DEFAULT_DEP_POLICY,
      fixedAssets,
      lastIngestionTimestamp: Date.now(),
    });
  },

  // ─ Reset store for company switch
  resetStoreForCompany: (companyId, isDemo = false) => {
    set({
      companyId,
      isDemoMode: isDemo,
      invoices: [],
      purchases: [],
      expenses: [],
      payroll: [],
      bankTxns: [],
      openingBalances: { ...DEFAULT_OPENING_BALANCES },
      depreciationPolicy: { ...DEFAULT_DEP_POLICY },
      fixedAssets: [],
      lastIngestionTimestamp: Date.now(),
    });
    get().hydrateFromLocalStorage(companyId, isDemo);
  },

  // ─ Reset all data for current environment
  resetAllData: () => {
    const { companyId, isDemoMode } = get();
    if (typeof window !== 'undefined') {
      const prefix = getStoragePrefix(companyId, isDemoMode);
      const keys = [
        `${prefix}_bank_txns`,
        `${prefix}_invoices`,
        `${prefix}_purchases`,
        `${prefix}_expenses`,
        `${prefix}_payroll`,
        `${prefix}_opening_balances`,
        `${prefix}_dep_policy`,
        `${prefix}_fixed_assets`,
      ];
      keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    }

    set({
      invoices: [],
      purchases: [],
      expenses: [],
      payroll: [],
      bankTxns: [],
      fixedAssets: [],
      openingBalances: { ...DEFAULT_OPENING_BALANCES },
      depreciationPolicy: { ...DEFAULT_DEP_POLICY },
      lastIngestionTimestamp: Date.now(),
    });
  },

  // ─ Persist helper (strictly namespaced)
  _persistToLocalStorage: () => {
    const { companyId, isDemoMode, bankTxns, invoices, purchases, expenses, payroll, openingBalances, depreciationPolicy, fixedAssets } = get();
    if (typeof window === 'undefined') return;
    const prefix = getStoragePrefix(companyId, isDemoMode);

    try {
      localStorage.setItem(`${prefix}_bank_txns`, JSON.stringify(bankTxns));
      localStorage.setItem(`${prefix}_invoices`, JSON.stringify(invoices));
      localStorage.setItem(`${prefix}_purchases`, JSON.stringify(purchases));
      localStorage.setItem(`${prefix}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${prefix}_payroll`, JSON.stringify(payroll));
      localStorage.setItem(`${prefix}_opening_balances`, JSON.stringify(openingBalances));
      localStorage.setItem(`${prefix}_dep_policy`, JSON.stringify(depreciationPolicy));
      localStorage.setItem(`${prefix}_fixed_assets`, JSON.stringify(fixedAssets));
    } catch {}
  },

  // ─ Persist to localStorage
  _persistToLocalStorage: () => {
    const { companyId, bankTxns, invoices, purchases, expenses, payroll, openingBalances, depreciationPolicy, fixedAssets } = get();
    if (typeof window === 'undefined' || !companyId) return;
    try {
      if (bankTxns.length > 0) {
        localStorage.setItem(`company_bank_transactions_${companyId}`, JSON.stringify(bankTxns));
        localStorage.setItem(`sannidh_bank_txns_${companyId}`, JSON.stringify(bankTxns));
      }
      if (invoices.length > 0) {
        localStorage.setItem(`company_invoices_${companyId}`, JSON.stringify(invoices));
        localStorage.setItem(`sannidh_invoices_${companyId}`, JSON.stringify(invoices));
      }
      if (purchases.length > 0) {
        localStorage.setItem(`company_purchases_${companyId}`, JSON.stringify(purchases));
        localStorage.setItem(`sannidh_purchases_${companyId}`, JSON.stringify(purchases));
      }
      if (expenses.length > 0) {
        localStorage.setItem(`company_expenses_${companyId}`, JSON.stringify(expenses));
        localStorage.setItem(`sannidh_expenses_${companyId}`, JSON.stringify(expenses));
      }
      if (payroll.length > 0) {
        localStorage.setItem(`company_payroll_${companyId}`, JSON.stringify(payroll));
        localStorage.setItem(`sannidh_payroll_${companyId}`, JSON.stringify(payroll));
      }
      localStorage.setItem(`sannidh_opening_balances_${companyId}`, JSON.stringify(openingBalances));
      localStorage.setItem(`sannidh_dep_policy_${companyId}`, JSON.stringify(depreciationPolicy));
      if (fixedAssets.length > 0) {
        localStorage.setItem(`company_fixed_assets_${companyId}`, JSON.stringify(fixedAssets));
      }
    } catch (e) {
      console.warn('[FinancialEngine] localStorage persist failed:', e);
    }
  },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// COMPUTED SELECTORS — Pure functions that derive financial statements
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute Trial Balance from raw transaction arrays.
 * Groups into standard Chart of Accounts → Debit / Credit columns.
 */
export function computeTrialBalance(state: Pick<FinancialEngineState, 'invoices' | 'purchases' | 'expenses' | 'payroll' | 'bankTxns' | 'openingBalances'>): TrialBalanceResult {
  const { invoices, purchases, expenses, payroll, bankTxns, openingBalances: ob } = state;

  const invTotal = invoices.reduce((s, i) => s + Number(i.total || i.amount || 0), 0);
  const purTotal = purchases.reduce((s, p) => s + Number(p.total || p.amount || 0), 0);
  const expTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const payrollGross = payroll.reduce((s, p) => s + Number(p.gross || 0), 0);
  const bankCredits = bankTxns.reduce((s, t) => s + (Number(t.credit) || 0), 0);
  const bankDebits = bankTxns.reduce((s, t) => s + (Number(t.debit) || 0), 0);
  const closingBankBal = bankTxns.length > 0 ? Number(bankTxns[0]?.balance || 0) : ob.bank_balance;

  // GST components
  const outputGST = invoices.reduce((s, i) => s + Number(i.gst || 0), 0);
  const inputGST = purchases.filter(p => p.itc_eligible).reduce((s, p) => s + Number(p.gst || 0), 0);

  // TDS deducted from expenses
  const tdsOnExpenses = expenses.filter(e => e.tds_applicable).reduce((s, e) => s + Number(e.tds_amount || 0), 0);

  // PF & ESIC
  const pfTotal = payroll.reduce((s, p) => s + Number(p.pf || 0), 0);
  const esicTotal = payroll.reduce((s, p) => s + Number(p.esic || 0), 0);
  const tdsOnSalary = payroll.reduce((s, p) => s + Number(p.tds || 0), 0);

  const buildRow = (code: string, name: string, group: string, parentGroup: string, dr: number, cr: number, vouchers: any[] = []): TrialBalanceRow => ({
    code, name, group, parentGroup,
    openingDr: 0, openingCr: 0,
    txDr: dr, txCr: cr,
    closingDr: dr > cr ? dr - cr : 0,
    closingCr: cr > dr ? cr - dr : 0,
    vouchers,
  });

  const items: TrialBalanceRow[] = [
    // Revenue
    buildRow('4001', 'Sales / Revenue', 'Revenue from Operations', 'Revenue', 0, invTotal,
      invoices.map(i => ({ id: i.id, date: i.date, voucher_type: 'Sales', ref_no: i.invoice_no, party_name: i.customer, debit: 0, credit: Number(i.total || 0), narration: `Invoice ${i.invoice_no}` }))),
    // Direct Expenses
    buildRow('5001', 'Purchase Account', 'Cost of Materials Consumed', 'Expenses', purTotal, 0,
      purchases.map(p => ({ id: p.id, date: p.date, voucher_type: 'Purchase', ref_no: p.bill_no, party_name: p.vendor, debit: Number(p.total || 0), credit: 0, narration: `Bill ${p.bill_no}` }))),
    // Employee Benefits
    ...(payrollGross > 0 ? [buildRow('5101', 'Salaries & Wages', 'Employee Benefit Expense', 'Expenses', payrollGross, 0,
      payroll.map(p => ({ id: p.id, date: '', voucher_type: 'Journal', ref_no: '', party_name: p.employee, debit: Number(p.gross || 0), credit: 0, narration: `Salary - ${p.employee}` })))] : []),
    // Other Expenses
    ...(expTotal > 0 ? [buildRow('5201', 'Operating Expenses', 'Other Expenses', 'Expenses', expTotal, 0,
      expenses.map(e => ({ id: e.id, date: e.date, voucher_type: 'Payment', ref_no: '', party_name: e.description, debit: Number(e.amount || 0), credit: 0, narration: `${e.category}: ${e.description}` })))] : []),
    // Assets
    buildRow('1001', 'Trade Receivables (Sundry Debtors)', 'Trade Receivables', 'Assets', invTotal, 0),
    ...(bankTxns.length > 0 ? [buildRow('1101', 'Bank Account (Primary)', 'Bank Accounts', 'Assets',
      bankCredits, bankDebits,
      bankTxns.map(t => ({ id: t.id, date: t.date, voucher_type: (Number(t.credit) || 0) > 0 ? 'Receipt' : 'Payment', ref_no: t.id, party_name: t.description, debit: Number(t.credit) || 0, credit: Number(t.debit) || 0, narration: `${t.category}: ${t.description}` }))
    )] : []),
    // Liabilities
    buildRow('2001', 'Trade Payables (Sundry Creditors)', 'Trade Payables', 'Liabilities', 0, purTotal),
    // Statutory
    ...(outputGST > 0 ? [buildRow('2101', 'GST Output Tax (Payable)', 'Statutory Dues', 'Liabilities', 0, outputGST)] : []),
    ...(inputGST > 0 ? [buildRow('1201', 'GST Input Tax Credit (ITC)', 'Current Assets', 'Assets', inputGST, 0)] : []),
    ...(tdsOnExpenses > 0 ? [buildRow('2102', 'TDS Payable', 'Statutory Dues', 'Liabilities', 0, tdsOnExpenses)] : []),
    ...(pfTotal > 0 ? [buildRow('2103', 'PF Payable', 'Statutory Dues', 'Liabilities', 0, pfTotal * 2)] : []), // employer + employee
    ...(esicTotal > 0 ? [buildRow('2104', 'ESIC Payable', 'Statutory Dues', 'Liabilities', 0, esicTotal)] : []),
    ...(tdsOnSalary > 0 ? [buildRow('2105', 'TDS on Salary Payable', 'Statutory Dues', 'Liabilities', 0, tdsOnSalary)] : []),
  ];

  const totalTxDr = items.reduce((s, r) => s + r.txDr, 0);
  const totalTxCr = items.reduce((s, r) => s + r.txCr, 0);
  const totalClosingDr = items.reduce((s, r) => s + r.closingDr, 0);
  const totalClosingCr = items.reduce((s, r) => s + r.closingCr, 0);

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, TrialBalanceRow[]>);

  return {
    isBalanced: Math.abs(totalClosingDr - totalClosingCr) < 1,
    differenceAmount: Math.abs(totalClosingDr - totalClosingCr),
    totalOpeningDr: 0,
    totalOpeningCr: 0,
    totalTxDr,
    totalTxCr,
    totalClosingDr,
    totalClosingCr,
    items,
    groupedItems,
  };
}

/**
 * Compute Profit & Loss Statement from raw data.
 */
export function computeProfitLoss(state: Pick<FinancialEngineState, 'invoices' | 'purchases' | 'expenses' | 'payroll' | 'bankTxns' | 'fixedAssets' | 'depreciationPolicy' | 'openingBalances'>): ProfitLossResult {
  const { invoices, purchases, expenses, payroll, fixedAssets, depreciationPolicy } = state;

  // Revenue
  const revenueFromOperations = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const otherIncome = 0; // Will be populated from bank interest, misc income categorized from bank txns
  const totalIncome = revenueFromOperations + otherIncome;

  // Expenses
  const cogsDirectExpenses = purchases.reduce((s, p) => s + Number(p.amount || 0), 0);
  const employeeBenefitExpense = payroll.reduce((s, p) => s + Number(p.gross || 0), 0);

  // Depreciation from fixed assets
  const depreciationAmortisation = fixedAssets.reduce((s, a) => {
    const rate = depreciationPolicy.rates[a.category]?.book_rate || 10;
    return s + (a.cost * rate / 100);
  }, 0);

  // Finance costs: interest expenses from expense category
  const financeCosts = expenses
    .filter(e => (e.category || '').toLowerCase().includes('interest'))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  // Other expenses (everything not interest)
  const otherExpenses = expenses
    .filter(e => !(e.category || '').toLowerCase().includes('interest'))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalExpenses = cogsDirectExpenses + employeeBenefitExpense + depreciationAmortisation + financeCosts + otherExpenses;

  // Profitability cascade
  const grossProfit = revenueFromOperations - cogsDirectExpenses;
  const ebitda = totalIncome - (cogsDirectExpenses + employeeBenefitExpense + otherExpenses);
  const ebit = ebitda - depreciationAmortisation;
  const pbt = ebit - financeCosts;

  // Tax @ Section 115BAA (25.168%)
  const taxRate = 0.25168;
  const currentTax = Math.max(0, pbt * taxRate);
  const deferredTaxCharge = 0; // Will be computed by DT engine
  const totalTax = currentTax + deferredTaxCharge;
  const pat = pbt - totalTax;

  // Margins
  const rev = revenueFromOperations || 1;
  return {
    revenueFromOperations,
    otherIncome,
    totalIncome,
    cogsDirectExpenses,
    employeeBenefitExpense,
    depreciationAmortisation,
    financeCosts,
    otherExpenses,
    totalExpenses,
    grossProfit,
    ebitda,
    ebit,
    pbt,
    currentTax,
    deferredTaxCharge,
    totalTax,
    pat,
    grossMarginPct: Number(((grossProfit / rev) * 100).toFixed(2)),
    ebitdaMarginPct: Number(((ebitda / rev) * 100).toFixed(2)),
    netMarginPct: Number(((pat / rev) * 100).toFixed(2)),
  };
}

/**
 * Compute Balance Sheet from raw data + P&L result.
 */
export function computeBalanceSheet(
  state: Pick<FinancialEngineState, 'invoices' | 'purchases' | 'expenses' | 'payroll' | 'bankTxns' | 'openingBalances' | 'fixedAssets' | 'depreciationPolicy'>,
  pl: ProfitLossResult
): BalanceSheetResult {
  const { invoices, purchases, payroll, bankTxns, openingBalances: ob, fixedAssets, depreciationPolicy } = state;

  // Current Assets
  const receivables = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total || 0), 0);
  const bankBal = bankTxns.length > 0 ? Number(bankTxns[0]?.balance || 0) : ob.bank_balance;
  const inputGST = purchases.filter(p => p.itc_eligible).reduce((s, p) => s + Number(p.gst || 0), 0);
  const totalCA = receivables + Math.max(0, bankBal) + ob.cash_balance + inputGST + ob.stock;

  // Non-Current Assets
  const grossBlock = ob.fixed_assets_gross + fixedAssets.reduce((s, a) => s + a.cost, 0);
  const accDep = ob.accumulated_depreciation + fixedAssets.reduce((s, a) => {
    const rate = depreciationPolicy.rates[a.category]?.book_rate || 10;
    return s + (a.cost * rate / 100);
  }, 0);
  const netBlock = grossBlock - accDep;
  const totalNCA = netBlock;
  const totalAssets = totalCA + totalNCA;

  // Current Liabilities
  const payables = purchases.filter(p => p.status !== 'processed').reduce((s, p) => s + Number(p.total || 0), 0);
  const outputGST = invoices.reduce((s, i) => s + Number(i.gst || 0), 0);
  const netGST = Math.max(0, outputGST - inputGST);
  const tdsPayable = expenses.filter(e => e.tds_applicable).reduce((s, e) => s + Number(e.tds_amount || 0), 0);
  const pfPayable = payroll.reduce((s, p) => s + Number(p.pf || 0), 0) * 2; // employer + employee
  const salaryPayable = payroll.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.net_pay || 0), 0);
  const incomeTaxPayable = Math.max(0, pl.currentTax);
  const totalCL = payables + netGST + tdsPayable + pfPayable + salaryPayable + incomeTaxPayable;

  // Non-Current Liabilities
  const totalNCL = ob.long_term_loans;

  // Equity
  const shareCapital = ob.share_capital;
  const reservesSurplus = ob.reserves + pl.pat;
  const totalEquity = shareCapital + reservesSurplus;
  const totalEqLiab = totalEquity + totalNCL + totalCL;
  const diff = Math.abs(totalAssets - totalEqLiab);

  return {
    isBalanced: diff < 1,
    totalAssets,
    totalEquityLiabilities: totalEqLiab,
    difference: diff,
    equity: { shareCapital, reservesSurplus, total: totalEquity },
    nonCurrentLiabilities: { longTermBorrowings: ob.long_term_loans, deferredTaxLiability: 0, total: totalNCL },
    currentLiabilities: {
      tradePayables: payables, tradePayablesMsme: 0, tradePayablesOthers: payables,
      gstPayable: netGST, tdsPayable, pfEsicPayable: pfPayable,
      salaryPayable, incomeTaxPayable, total: totalCL,
    },
    nonCurrentAssets: { grossBlock, accumulatedDep: accDep, netBlock, deferredTaxAsset: 0, total: totalNCA },
    currentAssets: {
      tradeReceivables: receivables, bankBalance: Math.max(0, bankBal),
      cashInHand: ob.cash_balance, inputGstItc: inputGST,
      tdsReceivable: 0, inventories: ob.stock, total: totalCA,
    },
  };
}

/**
 * Compute Financial Ratios from P&L and Balance Sheet.
 */
export function computeFinancialRatios(pl: ProfitLossResult, bs: BalanceSheetResult): FinancialRatiosResult {
  const safeDivide = (num: number, den: number, fallback = 0) => den !== 0 ? num / den : fallback;

  const ca = bs.currentAssets.total;
  const cl = bs.currentLiabilities.total;
  const cash = bs.currentAssets.bankBalance + bs.currentAssets.cashInHand;
  const inv = bs.currentAssets.inventories;
  const ta = bs.totalAssets || 1;
  const eq = bs.equity.total || 1;
  const debt = bs.nonCurrentLiabilities.longTermBorrowings;
  const rec = bs.currentAssets.tradeReceivables;
  const pay = bs.currentLiabilities.tradePayables;
  const rev = pl.revenueFromOperations || 1;
  const cogs = pl.cogsDirectExpenses || 1;

  return {
    currentRatio: safeDivide(ca, cl),
    quickRatio: safeDivide(ca - inv, cl),
    cashRatio: safeDivide(cash, cl),
    grossProfitMarginPct: pl.grossMarginPct,
    ebitdaMarginPct: pl.ebitdaMarginPct,
    netProfitMarginPct: pl.netMarginPct,
    returnOnAssetsPct: safeDivide(pl.pat, ta) * 100,
    returnOnEquityPct: safeDivide(pl.pat, eq) * 100,
    returnOnCapitalEmployedPct: safeDivide(pl.ebit, ta - cl) * 100,
    debtEquityRatio: safeDivide(debt, eq),
    debtToAssetsRatio: safeDivide(debt, ta),
    interestCoverageRatio: safeDivide(pl.ebit, pl.financeCosts || 1),
    assetTurnoverRatio: safeDivide(rev, ta),
    inventoryTurnoverRatio: safeDivide(cogs, inv || 1),
    receivablesDays: safeDivide(rec, rev) * 365,
    payablesDays: safeDivide(pay, cogs) * 365,
    operatingCashFlowRatio: safeDivide(pl.ebitda, cl),
    freeCashFlow: pl.ebitda - pl.financeCosts,
  };
}

/**
 * Compute Aging Schedule for receivables and payables.
 */
export function computeAgingSchedule(
  invoices: ERPInvoice[],
  purchases: ERPPurchase[],
  today: Date = new Date()
): { receivables: AgingParty[]; payables: AgingParty[] } {
  const daysBetween = (dateStr: string) => {
    const d = new Date(dateStr);
    return Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000));
  };

  const toBucket = (days: number, amount: number) => ({
    notDue: days <= 0 ? amount : 0,
    b1_30: days >= 1 && days <= 30 ? amount : 0,
    b31_45: days >= 31 && days <= 45 ? amount : 0,
    b46_90: days >= 46 && days <= 90 ? amount : 0,
    b91_180: days >= 91 && days <= 180 ? amount : 0,
    bOver180: days > 180 ? amount : 0,
  });

  // Receivables (unpaid invoices grouped by customer)
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
  const recMap = new Map<string, AgingParty>();
  for (const inv of unpaidInvoices) {
    const key = inv.customer || 'Unknown';
    const days = daysBetween(inv.due_date || inv.date);
    const amt = Number(inv.total || 0);
    const buckets = toBucket(days, amt);
    const existing = recMap.get(key);
    if (existing) {
      existing.totalOutstanding += amt;
      existing.notDue += buckets.notDue;
      existing.b1_30 += buckets.b1_30;
      existing.b31_45 += buckets.b31_45;
      existing.b46_90 += buckets.b46_90;
      existing.b91_180 += buckets.b91_180;
      existing.bOver180 += buckets.bOver180;
      existing.invoices.push(inv);
    } else {
      recMap.set(key, {
        partyId: `rec_${key}`,
        partyName: key,
        gstin: inv.gstin || '',
        totalOutstanding: amt,
        ...buckets,
        msmeCategory: null,
        isSec43bh: false,
        invoices: [inv],
      });
    }
  }

  // Payables (unpaid purchases grouped by vendor)
  const unpaidPurchases = purchases.filter(p => p.status !== 'processed');
  const payMap = new Map<string, AgingParty>();
  for (const pur of unpaidPurchases) {
    const key = pur.vendor || 'Unknown';
    const days = daysBetween(pur.date);
    const amt = Number(pur.total || 0);
    const buckets = toBucket(days, amt);
    const existing = payMap.get(key);
    if (existing) {
      existing.totalOutstanding += amt;
      existing.notDue += buckets.notDue;
      existing.b1_30 += buckets.b1_30;
      existing.b31_45 += buckets.b31_45;
      existing.b46_90 += buckets.b46_90;
      existing.b91_180 += buckets.b91_180;
      existing.bOver180 += buckets.bOver180;
      existing.invoices.push(pur);
    } else {
      // Check if vendor is MSME (would need MSME directory lookup - for now flag based on category)
      const isMsme = (pur.category || '').toLowerCase().includes('msme');
      const isSec43bh = isMsme && days > 45;
      payMap.set(key, {
        partyId: `pay_${key}`,
        partyName: key,
        gstin: pur.gstin || '',
        totalOutstanding: amt,
        ...buckets,
        msmeCategory: isMsme ? 'MICRO' : null,
        isSec43bh,
        invoices: [pur],
      });
    }
  }

  return {
    receivables: Array.from(recMap.values()),
    payables: Array.from(payMap.values()),
  };
}

/**
 * Compute Deferred Tax (DTA/DTL) from Book vs Tax depreciation timing differences.
 */
export function computeDeferredTax(
  fixedAssets: FixedAssetEntry[],
  depPolicy: DepreciationPolicy,
  taxRate: number = 0.25168
) {
  let totalBookDep = 0;
  let totalTaxDep = 0;

  const differences = fixedAssets.map(asset => {
    const bookRate = depPolicy.rates[asset.category]?.book_rate || 10;
    const taxRateForAsset = depPolicy.rates[asset.category]?.tax_rate || 15;
    const bookDep = asset.cost * bookRate / 100;
    const taxDep = asset.cost * taxRateForAsset / 100;
    totalBookDep += bookDep;
    totalTaxDep += taxDep;
    const tempDiff = bookDep - taxDep;
    return {
      description: `${asset.name} — Book (${depPolicy.method_book} ${bookRate}%) vs Tax (WDV ${taxRateForAsset}%)`,
      category: tempDiff < 0 ? 'deductible' : 'taxable',
      temporary_difference: tempDiff,
      tax_rate: taxRate,
      deferred_tax_amount: Math.abs(tempDiff) * taxRate,
      carrying_amount: asset.cost - bookDep,
      tax_base: asset.cost - taxDep,
      source: 'auto',
    };
  });

  const closingDTA = differences.filter(d => d.category === 'deductible').reduce((s, d) => s + d.deferred_tax_amount, 0);
  const closingDTL = differences.filter(d => d.category === 'taxable').reduce((s, d) => s + d.deferred_tax_amount, 0);
  const netDT = closingDTA - closingDTL;

  return {
    applicable_tax_rate: taxRate * 100,
    opening_dta: 0,
    opening_dtl: 0,
    closing_dta: closingDTA,
    closing_dtl: closingDTL,
    net_deferred_tax: netDT,
    deferred_tax_expense: netDT < 0 ? Math.abs(netDT) : 0,
    deferred_tax_income: netDT > 0 ? netDT : 0,
    differences,
  };
}

/**
 * Check if the store has any real data loaded.
 */
export function hasAnyData(state: Pick<FinancialEngineState, 'invoices' | 'purchases' | 'expenses' | 'payroll' | 'bankTxns'>) {
  return (
    state.invoices.length > 0 ||
    state.purchases.length > 0 ||
    state.expenses.length > 0 ||
    state.payroll.length > 0 ||
    state.bankTxns.length > 0
  );
}
