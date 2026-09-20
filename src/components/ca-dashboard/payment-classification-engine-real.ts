// ============================================================
// REAL Payment Classification Engine
// Works on REAL data from Supabase (AA feeds, uploaded statements)
// No mock data — all data comes from actual client bank feeds
// ============================================================

export type PaymentCategory =
  | 'Salary / Payroll'
  | 'Rent / Lease'
  | 'Loan / EMI'
  | 'GST Payments'
  | 'Utilities'
  | 'Food & Dining'
  | 'Travel'
  | 'Business Expenses'
  | 'Capital Expenditure'
  | 'Inter-Company Transfer'
  | 'Tax Payments'
  | 'Vendor / Supplier'
  | 'Insurance'
  | 'Investment / SIP'
  | 'Uncategorized';

export interface RealTransaction {
  id: string;
  date: string;
  description: string;
  narration: string;
  amount: number;
  type: 'debit' | 'credit';
  bank: string;
  referenceNo: string;
  accountNumber?: string;
  // Classification result
  category: PaymentCategory;
  confidence: number;
  classificationReason: string; // WHY this category was assigned (Reason-for-Tagging feature)
  caOverride?: PaymentCategory;
  overrideBy?: string;  // CA user email
  overrideAt?: string;  // ISO timestamp
  isManuallyClassified?: boolean;
}

export interface RealClassificationSummary {
  category: PaymentCategory;
  totalAmount: number;
  count: number;
  color: string;
  percentageOfTotal: number;
}

// ── Category colour map ──────────────────────────────────────
export const CATEGORY_COLORS: Record<PaymentCategory, string> = {
  'Salary / Payroll':        '#6366f1',
  'Rent / Lease':            '#f59e0b',
  'Loan / EMI':              '#ef4444',
  'GST Payments':            '#8b5cf6',
  'Utilities':               '#06b6d4',
  'Food & Dining':           '#f97316',
  'Travel':                  '#10b981',
  'Business Expenses':       '#3b82f6',
  'Capital Expenditure':     '#dc2626',
  'Inter-Company Transfer':  '#64748b',
  'Tax Payments':            '#7c3aed',
  'Vendor / Supplier':       '#059669',
  'Insurance':               '#0ea5e9',
  'Investment / SIP':        '#84cc16',
  'Uncategorized':           '#6b7280',
};

// ── Statutory section associated with each category ──────────
// Used to populate the "Reason for Tagging" tooltip
export const CATEGORY_TAX_SECTION: Record<PaymentCategory, string> = {
  'Salary / Payroll':        'Sec 192 TDS on Salary · EPF 12% employer · ESI 4% employer',
  'Rent / Lease':            'Sec 194-I TDS on Rent (10%) · GST RCM 18% if commercial',
  'Loan / EMI':              'Interest deductible u/s 36(1)(iii) · Verify OD/CC limit',
  'GST Payments':            'GST Act 2017 · GSTR-3B / PMT-06 output liability',
  'Utilities':               'Business expense u/s 37(1) · Input GST eligible if B2B',
  'Food & Dining':           'Perquisite u/s 17 · Disallowed u/s 37 if personal nature',
  'Travel':                  'Sec 10(14) Travel Allowance · LTCA/STCA applicable',
  'Business Expenses':       'Sec 37(1) General Business Expenditure · Input GST check',
  'Capital Expenditure':     'Sec 32 Depreciation Schedule · Must capitalise, not expense',
  'Inter-Company Transfer':  'Sec 40A(2)(b) Related Party · Transfer Pricing documentation',
  'Tax Payments':            'Advance Tax u/s 208 · TDS Challan 280/281 · Self-Assessment',
  'Vendor / Supplier':       'Sec 194C TDS 2% / Sec 194J TDS 10% if professional fee',
  'Insurance':               'Sec 80C / 80D deduction check · Premium >₹20K verify TDS',
  'Investment / SIP':        'Sec 80C / 80CCC eligible · Capital Gains on redemption',
  'Uncategorized':           'No rule matched — manual CA review required before filing',
};

// ── Classification rules ──────────────────────────────────────
interface ClassificationRule {
  keywords: string[];
  category: PaymentCategory;
  confidence: number;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    keywords: ['salary', 'payroll', 'wage', 'neft salary', 'emp pay', 'staff payment', 'hrms', 'payslip', 'monthly salary', 'stipend', 'managerial pay', 'director remuneration'],
    category: 'Salary / Payroll',
    confidence: 95,
  },
  {
    keywords: ['rent', 'lease', 'landlord', 'property', 'house rent', 'office rent', 'rental', 'building rent', 'godown rent'],
    category: 'Rent / Lease',
    confidence: 92,
  },
  {
    keywords: ['emi', 'loan', 'hdfc_emi', 'sbi_loan', 'axis_emi', 'icici_emi', 'mortgage', 'repayment', 'lic_loan', 'home loan', 'car loan', 'vehicle loan', 'term loan', 'cc limit', 'od interest', 'overdraft'],
    category: 'Loan / EMI',
    confidence: 96,
  },
  {
    keywords: ['gstn', 'gst_pmt', 'gst challan', 'gst payment', 'igst', 'cgst', 'sgst', 'gstin challan', 'pmt-06', 'gst liability', 'gst portal'],
    category: 'GST Payments',
    confidence: 98,
  },
  {
    keywords: ['bses', 'msedcl', 'bescom', 'tata power', 'electricity', 'jio', 'bsnl', 'airtel', 'vodafone', 'vi bill', 'water board', 'utility', 'bescom challan', 'municipal', 'broadband', 'fiber bill'],
    category: 'Utilities',
    confidence: 90,
  },
  {
    keywords: ['zomato', 'swiggy', 'restaurant', 'hotel', 'cafe', 'food', 'dining', 'biryani', 'pizza', 'dominos', 'mcdonald', 'kfc', 'canteen'],
    category: 'Food & Dining',
    confidence: 88,
  },
  {
    keywords: ['ola', 'uber', 'irctc', 'makemytrip', 'airline', 'indigo', 'air india', 'spicejet', 'travel', 'taxi', 'cab', 'rapido', 'redbus', 'yatra', 'cleartrip', 'flight'],
    category: 'Travel',
    confidence: 87,
  },
  {
    keywords: ['amazon', 'flipkart', 'meesho', 'office supplies', 'stationery', 'software', 'subscription', 'saas', 'cloud', 'business purchase', 'shopify', 'razorpay'],
    category: 'Business Expenses',
    confidence: 82,
  },
  {
    keywords: ['machinery', 'equipment', 'capital purchase', 'asset purchase', 'plant', 'capex', 'infrastructure', 'renovation', 'fitout', 'construction'],
    category: 'Capital Expenditure',
    confidence: 85,
  },
  {
    keywords: ['inter company', 'intercompany', 'group transfer', 'related party', 'holding company', 'subsidiary', 'associate', 'group entity'],
    category: 'Inter-Company Transfer',
    confidence: 90,
  },
  {
    keywords: ['advance tax', 'tds challan', 'income tax', 'self assessment', 'itr payment', 'tax deposit', 'it dept', 'nsdl challan', '281 challan', '280 challan', 'professional tax', 'pt payment'],
    category: 'Tax Payments',
    confidence: 97,
  },
  {
    keywords: ['supplier', 'vendor', 'purchase payment', 'raw material', 'stock purchase', 'inventory', 'goods payment', 'neft vendor', 'creditor payment', 'trade payable'],
    category: 'Vendor / Supplier',
    confidence: 80,
  },
  {
    keywords: ['insurance', 'lic', 'star health', 'hdfc life', 'bajaj allianz', 'policy premium', 'premium', 'new india', 'national insurance', 'oriental insurance', 'mediclaim', 'group health'],
    category: 'Insurance',
    confidence: 93,
  },
  {
    keywords: ['sip', 'mutual fund', 'mf sip', 'nps', 'ppf', 'fd deposit', 'investment', 'zerodha', 'groww', 'coin', 'demat', 'broker', 'shares', 'equity'],
    category: 'Investment / SIP',
    confidence: 91,
  },
];

// ── Classify a single transaction description ─────────────────
export function classifyTransaction(
  description: string,
  narration: string,
  amount: number
): { category: PaymentCategory; confidence: number; classificationReason: string } {
  const combined = `${description} ${narration}`.toLowerCase();

  for (const rule of CLASSIFICATION_RULES) {
    for (const keyword of rule.keywords) {
      if (combined.includes(keyword)) {
        return {
          category: rule.category,
          confidence: rule.confidence,
          classificationReason: `Keyword matched: "${keyword}" → ${rule.category} · ${CATEGORY_TAX_SECTION[rule.category]}`,
        };
      }
    }
  }

  // Amount-based heuristics
  if (amount > 500000) {
    return {
      category: 'Capital Expenditure',
      confidence: 55,
      classificationReason: `Amount ₹${amount.toLocaleString('en-IN')} > ₹5,00,000 heuristic — possible Capital Expenditure · ${CATEGORY_TAX_SECTION['Capital Expenditure']}`,
    };
  }
  if (amount > 100000 && combined.includes('neft')) {
    return {
      category: 'Vendor / Supplier',
      confidence: 50,
      classificationReason: `NEFT + Amount ₹${amount.toLocaleString('en-IN')} > ₹1,00,000 heuristic — possible Vendor / Supplier · ${CATEGORY_TAX_SECTION['Vendor / Supplier']}`,
    };
  }

  return {
    category: 'Uncategorized',
    confidence: 40,
    classificationReason: 'No keyword or heuristic matched — requires manual CA review before ledger finalisation',
  };
}

// ── Parse AA transaction format to RealTransaction ────────────
// AA transactions follow the Account Aggregator FIP format
export function parseAATransaction(rawTx: any): RealTransaction {
  const desc = rawTx.narration || rawTx.description || rawTx.remarks || '';
  const narration = rawTx.txnNarration || rawTx.narration || '';
  const amount = parseFloat(rawTx.amount || rawTx.txnAmt || '0');
  const type = rawTx.type === 'CREDIT' || rawTx.txnType === 'CREDIT' ? 'credit' : 'debit';

  const classified = classifyTransaction(desc, narration, amount);

  return {
    id: rawTx.id || rawTx.txnId || `tx-${Date.now()}-${Math.random()}`,
    date: rawTx.valueDate || rawTx.date || rawTx.txnDate || new Date().toISOString().split('T')[0],
    description: desc,
    narration: narration || desc,
    amount,
    type,
    bank: rawTx.bankName || rawTx.fipName || rawTx.bank || 'Unknown Bank',
    referenceNo: rawTx.mode || rawTx.reference || rawTx.refNo || '',
    accountNumber: rawTx.accountNumber || rawTx.maskedAccNumber || '',
    category: classified.category,
    confidence: classified.confidence,
    classificationReason: classified.classificationReason,
  };
}

// ── Parse uploaded bank statement CSV rows ───────────────────
export function parseStatementRow(row: Record<string, string>, bank?: string): RealTransaction | null {
  const date =
    row['Date'] || row['VALUE DATE'] || row['Txn Date'] || row['Transaction Date'] || '';
  const desc =
    row['Description'] || row['Narration'] || row['Particulars'] || row['TRANSACTION DETAILS'] || '';
  const creditStr =
    row['Credit'] || row['CR Amount'] || row['Deposit Amt.'] || row['CREDIT'] || '0';
  const debitStr =
    row['Debit'] || row['DR Amount'] || row['Withdrawal Amt.'] || row['DEBIT'] || '0';
  const ref = row['Ref No'] || row['Reference No'] || row['Chq./Ref.No.'] || '';

  if (!date || !desc) return null;

  const credit = parseFloat(creditStr.replace(/,/g, '') || '0');
  const debit = parseFloat(debitStr.replace(/,/g, '') || '0');

  const amount = credit > 0 ? credit : debit;
  const type: 'credit' | 'debit' = credit > 0 ? 'credit' : 'debit';

  const classified = classifyTransaction(desc, desc, amount);

  return {
    id: `stmt-${Date.now()}-${Math.random()}`,
    date,
    description: desc,
    narration: desc,
    amount,
    type,
    bank: bank || 'Uploaded Statement',
    referenceNo: ref,
    category: classified.category,
    confidence: classified.confidence,
    classificationReason: classified.classificationReason,
  };
}

// ── Apply CA overrides from Supabase ──────────────────────────
export function applyOverrides(
  transactions: RealTransaction[],
  overrides: Array<{ txn_id: string; category: PaymentCategory; override_by: string; override_at: string }>
): RealTransaction[] {
  const overrideMap = new Map(overrides.map(o => [o.txn_id, o]));
  return transactions.map(tx => {
    const override = overrideMap.get(tx.id);
    if (override) {
      return {
        ...tx,
        caOverride: override.category,
        overrideBy: override.override_by,
        overrideAt: override.override_at,
        isManuallyClassified: true,
      };
    }
    return tx;
  });
}

// ── Summarize by category ─────────────────────────────────────
export function summarizeByCategory(transactions: RealTransaction[]): RealClassificationSummary[] {
  const map = new Map<PaymentCategory, { total: number; count: number }>();

  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  for (const tx of transactions) {
    const cat = tx.caOverride ?? tx.category;
    const existing = map.get(cat) ?? { total: 0, count: 0 };
    map.set(cat, {
      total: existing.total + (tx.type === 'debit' ? tx.amount : 0),
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.total > 0)
    .map(([cat, v]) => ({
      category: cat,
      totalAmount: v.total,
      count: v.count,
      color: CATEGORY_COLORS[cat],
      percentageOfTotal: totalDebit > 0 ? Math.round((v.total / totalDebit) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

// ── Monthly trend data ─────────────────────────────────────────
export interface MonthlyTrend {
  month: string;
  debit: number;
  credit: number;
  topCategory: string;
}

export function getMonthlyTrends(transactions: RealTransaction[]): MonthlyTrend[] {
  const map = new Map<string, { debit: number; credit: number; catMap: Map<string, number> }>();

  for (const tx of transactions) {
    const month = tx.date.substring(0, 7);
    const existing = map.get(month) ?? { debit: 0, credit: 0, catMap: new Map() };
    if (tx.type === 'debit') {
      existing.debit += tx.amount;
      const cat = tx.caOverride ?? tx.category;
      existing.catMap.set(cat, (existing.catMap.get(cat) ?? 0) + tx.amount);
    } else {
      existing.credit += tx.amount;
    }
    map.set(month, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => {
      let topCat = 'Uncategorized';
      let topAmt = 0;
      v.catMap.forEach((amt, cat) => {
        if (amt > topAmt) { topAmt = amt; topCat = cat; }
      });
      return { month, debit: v.debit, credit: v.credit, topCategory: topCat };
    });
}

// ── SHA-256 ledger hash (Audit Trail feature) ─────────────────
// Computes a deterministic hash of the entire categorised ledger state.
// If any category, amount, or description changes after "Finalize", the hash breaks.
export async function computeLedgerHash(transactions: RealTransaction[]): Promise<string> {
  const payload = transactions.map(tx => ({
    id: tx.id,
    date: tx.date,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category: tx.caOverride ?? tx.category,
  }));
  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
