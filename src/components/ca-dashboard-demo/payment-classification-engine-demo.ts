// ============================================================
// DEMO Payment Classification Engine
// Uses MOCK / SEED data only — no Supabase, no real API calls
// All data is deterministic based on client ID hash seed
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

export interface DemoTransaction {
  id: string;
  date: string;
  description: string;
  narration: string;
  amount: number;
  type: 'debit' | 'credit';
  bank: string;
  referenceNo: string;
  category: PaymentCategory;
  confidence: number; // 0-100
  classificationReason: string; // WHY this category was assigned (for Reason-for-Tagging feature)
  caOverride?: PaymentCategory;
}

export interface ClassificationSummary {
  category: PaymentCategory;
  totalAmount: number;
  count: number;
  color: string;
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
// Used to populate the "Reason for Tagging" tooltip on each transaction
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

// ── Category icons (lucide name strings) ─────────────────────
export const CATEGORY_ICONS: Record<PaymentCategory, string> = {
  'Salary / Payroll':        'Users',
  'Rent / Lease':            'Home',
  'Loan / EMI':              'CreditCard',
  'GST Payments':            'Receipt',
  'Utilities':               'Zap',
  'Food & Dining':           'Utensils',
  'Travel':                  'Car',
  'Business Expenses':       'Briefcase',
  'Capital Expenditure':     'Building2',
  'Inter-Company Transfer':  'ArrowLeftRight',
  'Tax Payments':            'Landmark',
  'Vendor / Supplier':       'Package',
  'Insurance':               'Heart',
  'Investment / SIP':        'TrendingUp',
  'Uncategorized':           'HelpCircle',
};

// ── Keyword -> category rules ─────────────────────────────────
interface ClassificationRule {
  keywords: string[];
  category: PaymentCategory;
  confidence: number;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    keywords: ['salary', 'payroll', 'wage', 'neft salary', 'emp pay', 'staff payment', 'hrms', 'payslip'],
    category: 'Salary / Payroll',
    confidence: 95,
  },
  {
    keywords: ['rent', 'lease', 'landlord', 'property', 'house rent', 'office rent', 'rental'],
    category: 'Rent / Lease',
    confidence: 92,
  },
  {
    keywords: ['emi', 'loan', 'hdfc_emi', 'sbi_loan', 'axis_emi', 'icici_emi', 'mortgage', 'repayment', 'lic_loan', 'home loan', 'car loan', 'vehicle loan'],
    category: 'Loan / EMI',
    confidence: 96,
  },
  {
    keywords: ['gstn', 'gst_pmt', 'gst challan', 'gst payment', 'igst', 'cgst', 'sgst', 'gstin challan', 'pmt-06'],
    category: 'GST Payments',
    confidence: 98,
  },
  {
    keywords: ['bses', 'msedcl', 'bescom', 'tata power', 'electricity', 'jio', 'bsnl', 'airtel', 'vodafone', 'vi bill', 'water board', 'utility', 'municipal'],
    category: 'Utilities',
    confidence: 90,
  },
  {
    keywords: ['zomato', 'swiggy', 'restaurant', 'hotel', 'cafe', 'food', 'dining', 'biryani', 'pizza', 'dominos', 'mcdonald', 'kfc', 'canteen'],
    category: 'Food & Dining',
    confidence: 88,
  },
  {
    keywords: ['ola', 'uber', 'irctc', 'makemytrip', 'airline', 'indigo', 'air india', 'spicejet', 'travel', 'taxi', 'cab', 'rapido', 'redbus'],
    category: 'Travel',
    confidence: 87,
  },
  {
    keywords: ['amazon', 'flipkart', 'meesho', 'office supplies', 'stationery', 'software', 'subscription', 'vendor payment', 'business purchase'],
    category: 'Business Expenses',
    confidence: 82,
  },
  {
    keywords: ['machinery', 'equipment', 'capital purchase', 'asset purchase', 'plant', 'capex', 'infrastructure', 'renovation'],
    category: 'Capital Expenditure',
    confidence: 85,
  },
  {
    keywords: ['inter company', 'intercompany', 'group transfer', 'related party', 'holding company', 'subsidiary', 'associate'],
    category: 'Inter-Company Transfer',
    confidence: 90,
  },
  {
    keywords: ['advance tax', 'tds challan', 'income tax', 'self assessment', 'itr payment', 'tax deposit', 'it dept', 'nsdl challan', '281 challan', '280 challan'],
    category: 'Tax Payments',
    confidence: 97,
  },
  {
    keywords: ['supplier', 'vendor', 'purchase payment', 'raw material', 'stock purchase', 'inventory', 'goods payment', 'neft vendor'],
    category: 'Vendor / Supplier',
    confidence: 80,
  },
  {
    keywords: ['insurance', 'lic', 'star health', 'hdfc life', 'bajaj allianz', 'policy premium', 'premium', 'new india', 'national insurance'],
    category: 'Insurance',
    confidence: 93,
  },
  {
    keywords: ['sip', 'mutual fund', 'mf sip', 'nps', 'ppf', 'fd deposit', 'investment', 'zerodha', 'groww', 'coin', 'demat', 'broker'],
    category: 'Investment / SIP',
    confidence: 91,
  },
];

// ── Classify a single transaction ─────────────────────────────
export function classifyTransaction(
  description: string,
  amount: number
): { category: PaymentCategory; confidence: number; classificationReason: string } {
  const lower = description.toLowerCase();

  for (const rule of CLASSIFICATION_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
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
  if (amount > 100000 && lower.includes('neft')) {
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

// ── Mock transaction templates ────────────────────────────────
const MOCK_TRANSACTION_TEMPLATES = [
  { desc: 'NEFT Salary Transfer - Employee Payroll Batch', narration: 'PAYROLL/FEB2026/BATCH01', type: 'debit' as const, amountRange: [150000, 800000], bank: 'HDFC Bank' },
  { desc: 'Staff Wages Payment via HRMS', narration: 'HRMS/WAGES/MAR2026', type: 'debit' as const, amountRange: [80000, 400000], bank: 'ICICI Bank' },
  { desc: 'Office Rent Payment - Landlord Sharma Properties', narration: 'RENT/OFFICE/MAR2026', type: 'debit' as const, amountRange: [45000, 250000], bank: 'SBI' },
  { desc: 'Lease Rental for Warehouse Unit B', narration: 'LEASE/WH-B/Q1FY26', type: 'debit' as const, amountRange: [30000, 120000], bank: 'Axis Bank' },
  { desc: 'HDFC_EMI Loan Repayment A/c 4521', narration: 'HDFC_EMI/LOAN4521/MAR', type: 'debit' as const, amountRange: [25000, 180000], bank: 'HDFC Bank' },
  { desc: 'SBI_LOAN Vehicle Loan EMI Auto1234', narration: 'SBI_LOAN/AUTO1234', type: 'debit' as const, amountRange: [18000, 60000], bank: 'SBI' },
  { desc: 'GSTN Challan Payment - IGST Output Tax Q3', narration: 'GSTN/IGST/Q3FY26/DRC03', type: 'debit' as const, amountRange: [50000, 500000], bank: 'HDFC Bank' },
  { desc: 'GST PMT-06 Monthly Payment CGST+SGST', narration: 'GST_PMT/PMT06/MAR2026', type: 'debit' as const, amountRange: [30000, 300000], bank: 'ICICI Bank' },
  { desc: 'MSEDCL Electricity Bill Payment Feb 2026', narration: 'MSEDCL/BILL/FEB2026', type: 'debit' as const, amountRange: [8000, 45000], bank: 'Axis Bank' },
  { desc: 'Jio Fiber Business Plan Monthly Subscription', narration: 'JIO/FIBER/MAR2026', type: 'debit' as const, amountRange: [2000, 8000], bank: 'SBI' },
  { desc: 'BSES Rajdhani Power Ltd Commercial Connection', narration: 'BSES/COMM/Q1/2026', type: 'debit' as const, amountRange: [12000, 60000], bank: 'HDFC Bank' },
  { desc: 'Zomato Business Canteen Meal Order', narration: 'ZOMATO/ORD/2845671', type: 'debit' as const, amountRange: [500, 5000], bank: 'ICICI Bank' },
  { desc: 'Swiggy Corporate Account Team Lunch', narration: 'SWIGGY/CORP/MAR15', type: 'debit' as const, amountRange: [800, 4000], bank: 'Axis Bank' },
  { desc: 'IRCTC Rail Booking Business Class Delhi Mumbai', narration: 'IRCTC/PNR/4456778', type: 'debit' as const, amountRange: [2000, 15000], bank: 'SBI' },
  { desc: 'Uber Corporate Account Client Meeting Travel', narration: 'UBER/CORP/MAR22', type: 'debit' as const, amountRange: [500, 3000], bank: 'HDFC Bank' },
  { desc: 'IndiGo Airlines Business Trip Mumbai Bengaluru', narration: 'INDIGO/6E4521/MAR26', type: 'debit' as const, amountRange: [5000, 25000], bank: 'ICICI Bank' },
  { desc: 'Amazon Business Office Supplies Purchase', narration: 'AMAZON/BUS/ORD9987', type: 'debit' as const, amountRange: [3000, 35000], bank: 'Axis Bank' },
  { desc: 'Software Subscription Adobe Acrobat Annual', narration: 'ADOBE/ANNUAL/2026', type: 'debit' as const, amountRange: [15000, 40000], bank: 'HDFC Bank' },
  { desc: 'Capital Purchase Heavy Machinery Unit M12', narration: 'CAPEX/MACH/M12/FY26', type: 'debit' as const, amountRange: [500000, 5000000], bank: 'SBI' },
  { desc: 'Office Renovation Work Phase 2 Contractor', narration: 'RENOVATION/PH2/MAR', type: 'debit' as const, amountRange: [200000, 1500000], bank: 'ICICI Bank' },
  { desc: 'Advance Tax Q4 Payment NSDL Challan 280', narration: 'ADVTAX/280/Q4FY26', type: 'debit' as const, amountRange: [100000, 1000000], bank: 'HDFC Bank' },
  { desc: 'TDS Challan 281 Salary TDS Deposit Mar 2026', narration: 'TDS/281/SALARY/MAR26', type: 'debit' as const, amountRange: [50000, 400000], bank: 'SBI' },
  { desc: 'Supplier Payment Gupta Raw Materials NEFT Vendor', narration: 'VENDOR/GUPTA/INV4521', type: 'debit' as const, amountRange: [80000, 600000], bank: 'Axis Bank' },
  { desc: 'Purchase Payment Steel Alloys Ltd Invoice 2281', narration: 'PURCH/STEEL/2281', type: 'debit' as const, amountRange: [150000, 900000], bank: 'ICICI Bank' },
  { desc: 'LIC Group Insurance Premium Policy LIC8821', narration: 'LIC/GRPINS/MAR2026', type: 'debit' as const, amountRange: [20000, 150000], bank: 'HDFC Bank' },
  { desc: 'Star Health Corporate Mediclaim Renewal FY26', narration: 'STARHEALTH/CORP/FY26', type: 'debit' as const, amountRange: [80000, 350000], bank: 'SBI' },
  { desc: 'MF SIP Axis Bluechip Fund Direct Growth', narration: 'MF_SIP/AXIS/BLUE/MAR', type: 'debit' as const, amountRange: [10000, 100000], bank: 'ICICI Bank' },
  { desc: 'Payment Received Customer Invoice INV2891', narration: 'CUST/PAY/INV2891', type: 'credit' as const, amountRange: [200000, 2000000], bank: 'HDFC Bank' },
  { desc: 'Export Proceeds USD Settlement Axis FX', narration: 'EXPORT/USD/FX/MAR26', type: 'credit' as const, amountRange: [500000, 5000000], bank: 'Axis Bank' },
  { desc: 'GST Refund RFD-01 Approved IGST FY25-26', narration: 'GSTREFUND/RFD01/IGST', type: 'credit' as const, amountRange: [50000, 500000], bank: 'SBI' },
  { desc: 'Inter-Company Fund Receipt Subsidiary TechCo', narration: 'INTERCO/TECHCO/FEB26', type: 'credit' as const, amountRange: [100000, 1000000], bank: 'ICICI Bank' },
];

// ── Seeded random number generator ───────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Generate mock transactions for a client ──────────────────
export function generateMockTransactions(clientId: string, clientName: string, financialYear: string): DemoTransaction[] {
  const seed = getHash(clientId + financialYear);
  const rng = seededRandom(seed);

  const count = 28 + Math.floor(rng() * 14); // 28-42 transactions
  const transactions: DemoTransaction[] = [];

  const fyStartYear = parseInt(financialYear.split('-')[0]);
  const months = [
    `${fyStartYear}-04`, `${fyStartYear}-05`, `${fyStartYear}-06`,
    `${fyStartYear}-07`, `${fyStartYear}-08`, `${fyStartYear}-09`,
    `${fyStartYear}-10`, `${fyStartYear}-11`, `${fyStartYear}-12`,
    `${fyStartYear + 1}-01`, `${fyStartYear + 1}-02`, `${fyStartYear + 1}-03`,
  ];

  const cleanName = clientName.replace(/(Inc\.|Ltd\.|Pvt\.|LLP|Co\.)/g, '').trim();
  const firstWord = cleanName.split(' ')[0] || 'Client';

  for (let i = 0; i < count; i++) {
    const templateIdx = Math.floor(rng() * MOCK_TRANSACTION_TEMPLATES.length);
    const template = MOCK_TRANSACTION_TEMPLATES[templateIdx];
    const monthIdx = Math.floor(rng() * months.length);
    const day = 1 + Math.floor(rng() * 28);
    const date = `${months[monthIdx]}-${String(day).padStart(2, '0')}`;

    const [minAmt, maxAmt] = template.amountRange;
    const amount = Math.round((minAmt + rng() * (maxAmt - minAmt)) / 100) * 100;

    let customizedDesc = template.desc
      .replace('Employee Payroll Batch', `${firstWord} Payroll Batch`)
      .replace('Staff Wages', `${firstWord} Staff Wages`)
      .replace('Sharma Properties', `${firstWord} Realtors`)
      .replace('Warehouse Unit B', `${firstWord} Warehouse B`)
      .replace('Gupta Raw Materials', `${firstWord} Supplies`)
      .replace('Steel Alloys Ltd', `${firstWord} Steel Co`)
      .replace('Subsidiary TechCo', `${firstWord} Subsidiary`);

    let customizedNarration = template.narration
      .replace('PAYROLL', `${firstWord.toUpperCase()}/PAY`)
      .replace('CUST', `${firstWord.toUpperCase()}/CUST`)
      .replace('VENDOR', `${firstWord.toUpperCase()}/VNDR`)
      .replace('INTERCO', `${firstWord.toUpperCase()}/GRP`);

    const classified = classifyTransaction(customizedDesc, amount);

    // Load CA override from localStorage if exists
    const overrideKey = `payment_override_${clientId}_txn-${clientId}-${i}`;
    const savedOverride = typeof window !== 'undefined'
      ? (localStorage.getItem(overrideKey) || localStorage.getItem(`payment_override_${clientId}_${i}`)) as PaymentCategory | null
      : null;

    transactions.push({
      id: `txn-${clientId}-${i}`,
      date,
      description: customizedDesc,
      narration: customizedNarration,
      amount,
      type: template.type,
      bank: template.bank,
      referenceNo: `REF${seed % 9000 + 1000}${i}`,
      category: classified.category,
      confidence: classified.confidence,
      classificationReason: classified.classificationReason,
      caOverride: savedOverride ?? undefined,
    });
  }

  // Sort by date descending
  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Summarize by category ─────────────────────────────────────
export function summarizeByCategory(transactions: DemoTransaction[]): ClassificationSummary[] {
  const map = new Map<PaymentCategory, { total: number; count: number }>();

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

export function getMonthlyTrends(transactions: DemoTransaction[]): MonthlyTrend[] {
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

// ── Save CA override to localStorage ─────────────────────────
export function saveCategoryOverride(clientId: string, txnId: string, category: PaymentCategory): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`payment_override_${clientId}_${txnId}`, category);
}

// ── Clear all overrides for a client ─────────────────────────
export function clearAllOverrides(clientId: string, count: number): void {
  if (typeof window === 'undefined') return;
  for (let i = 0; i < count; i++) {
    localStorage.removeItem(`payment_override_${clientId}_txn-${clientId}-${i}`);
    localStorage.removeItem(`payment_override_${clientId}_${i}`);
  }
}

// ── SHA-256 ledger hash (Audit Trail feature) ─────────────────
// Computes a deterministic hash of the entire categorised ledger state.
// If any category, amount, or description changes after "Finalize", the hash breaks.
export async function computeLedgerHash(transactions: DemoTransaction[]): Promise<string> {
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

// ── Audit lock helpers ────────────────────────────────────────
export interface AuditLock {
  hash: string;
  finalizedAt: string; // ISO timestamp
  transactionCount: number;
  caUser?: string; // email of the CA who finalised
}

export function saveAuditLock(clientId: string, financialYear: string, lock: AuditLock): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`audit_lock_${clientId}_${financialYear}`, JSON.stringify(lock));
}

export function loadAuditLock(clientId: string, financialYear: string): AuditLock | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`audit_lock_${clientId}_${financialYear}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuditLock; } catch { return null; }
}

export function clearAuditLock(clientId: string, financialYear: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`audit_lock_${clientId}_${financialYear}`);
}
