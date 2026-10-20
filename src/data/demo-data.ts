/**
 * DEMO DATA — Central Mock Data Store
 * =====================================
 * Single source of truth for ALL demo numbers across the entire dashboard.
 *
 * COMPANY  : Sannidh Demo Co. Pvt. Ltd. — Manufacturing & Trading
 * STATE    : Maharashtra | FY: 2025-26
 *
 * ── KEY FINANCIALS ──────────────────────────────────────────────────────────
 *  Annual Revenue (ex-GST)   : Rs 10,00,00,000  (Rs 10.00 Cr)
 *  Annual Purchases (ex-GST) : Rs  6,10,00,000  (Rs  6.10 Cr)  61% of revenue
 *  Gross Profit              : Rs  3,90,00,000  (Rs  3.90 Cr)  39% margin
 *  Annual Operating Expenses : Rs  1,85,00,000  (Rs  1.85 Cr)
 *  Annual Payroll            : Rs  1,05,00,000  (Rs  1.05 Cr)  32 employees
 *  Net Profit Before Tax     : Rs  1,00,00,000  (Rs  1.00 Cr)  10% margin
 *  GST Output Tax (18%)      : Rs  1,80,00,000  (Rs  1.80 Cr)
 *  GST ITC Available         : Rs  1,09,80,000  (Rs  1.098 Cr)
 *  GST ITC Blocked (Eta IT)  : Rs      5,40,000
 *  Bank Balance (current)    : Rs  1,85,00,000  (Rs  1.85 Cr)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// === Company Profile =========================================================

export const DEMO_COMPANY = {
  name: "Sannidh Demo Co. Pvt. Ltd.",
  industry: "Manufacturing & Trading",
  gstin: "27AABCS1234M1ZP",
  pan: "AABCS1234M",
  cin: "U74999MH2020PTC123456",
  state: "Maharashtra",
  company_type: "Private Limited",
  msme_category: "Small",
  udyam_no: "MH-27-0012345",
  compliance_score: 84,
  health_status: "yellow" as const,
  registration_date: "2020-03-15",
};

// === Sales Invoices — FY 2025-26 (5 invoices, Rs 10 Cr total ex-GST) =========
// Customer split: Alpha 32% + Epsilon 25% + Gamma 19% + Beta 14% + Delta 10%
// All GST at 18% (HSN 8501 — Assembled Motor Units)

export const DEMO_INVOICES = [
  {
    id: "1",
    invoice_no: "INV-2026-0101",
    date: "2025-07-18",
    customer: "Alpha Distributors Pvt Ltd",
    gstin: "27AABCA5678K1ZS",
    items: 10,
    amount: 32000000,
    gst: 5760000,
    total: 37760000,
    status: "paid" as const,
    due_date: "2025-08-17",
  },
  {
    id: "2",
    invoice_no: "INV-2026-0102",
    date: "2025-09-20",
    customer: "Beta Retail Chain",
    gstin: "29AABCB9012L1ZQ",
    items: 6,
    amount: 14000000,
    gst: 2520000,
    total: 16520000,
    status: "pending" as const,
    due_date: "2025-10-20",
  },
  {
    id: "3",
    invoice_no: "INV-2026-0103",
    date: "2025-07-01",
    customer: "Gamma Wholesale Ltd",
    gstin: "24AABCG3456N1ZR",
    items: 20,
    amount: 19000000,
    gst: 3420000,
    total: 22420000,
    status: "overdue" as const,
    due_date: "2025-07-31",
    days_overdue: 22,
  },
  {
    id: "4",
    invoice_no: "INV-2026-0104",
    date: "2026-01-22",
    customer: "Delta Exports Pvt Ltd",
    gstin: "07AABCD7890P1ZT",
    items: 4,
    amount: 10000000,
    gst: 1800000,
    total: 11800000,
    status: "draft" as const,
    due_date: "2026-02-21",
  },
  {
    id: "5",
    invoice_no: "INV-2026-0105",
    date: "2025-11-23",
    customer: "Epsilon Tech Solutions",
    gstin: "29AABCE2345Q1ZU",
    items: 28,
    amount: 25000000,
    gst: 4500000,
    total: 29500000,
    status: "pending" as const,
    due_date: "2025-12-22",
  },
];
// Total amount: Rs 10,00,00,000 | GST: Rs 1,80,00,000 | Total with GST: Rs 11,80,00,000

// === Purchase Bills — FY 2025-26 (Rs 6.10 Cr total ex-GST) ==================
// ITC available: Rs 1,09,80,000 (18% of Rs 6.10 Cr)
// ITC blocked  : Rs    5,40,000 (Eta IT — vendor GSTR-1 not filed)

export const DEMO_PURCHASES = [
  {
    id: "1",
    bill_no: "PB-2026-0201",
    date: "2025-07-19",
    vendor: "Zeta Raw Materials Pvt Ltd",
    gstin: "27AABCZ4567R1ZV",
    amount: 48000000,
    gst: 8640000,
    total: 56640000,
    itc_eligible: true,
    itc_claimed: true,
    status: "processed" as const,
    ai_confidence: 98,
    category: "Raw Materials",
  },
  {
    id: "2",
    bill_no: "PB-2026-0202",
    date: "2025-07-20",
    vendor: "Eta IT Services",
    gstin: "29AABCE8901S1ZW",
    amount: 3000000,
    gst: 540000,
    total: 3540000,
    itc_eligible: true,
    itc_claimed: false,
    status: "pending_review" as const,
    ai_confidence: 89,
    category: "IT Services",
  },
  {
    id: "3",
    bill_no: "PB-2026-0203",
    date: "2025-07-21",
    vendor: "Theta Logistics",
    gstin: "27AABCT2345T1ZX",
    amount: 6000000,
    gst: 1080000,
    total: 7080000,
    itc_eligible: true,
    itc_claimed: true,
    status: "processed" as const,
    ai_confidence: 99,
    category: "Freight & Logistics",
  },
  {
    id: "4",
    bill_no: "CASH-2026-0041",
    date: "2025-07-22",
    vendor: "Local Supplier (Cash Memo)",
    gstin: "UNREGISTERED",
    amount: 1200000,
    gst: 0,
    total: 1200000,
    itc_eligible: false,
    itc_claimed: false,
    status: "pending_review" as const,
    ai_confidence: 72,
    category: "Consumables",
  },
  {
    id: "5",
    bill_no: "PB-2026-0205",
    date: "2025-10-15",
    vendor: "Precision Components Pvt Ltd",
    gstin: "27AABCP3421U1ZK",
    amount: 2800000,
    gst: 504000,
    total: 3304000,
    itc_eligible: true,
    itc_claimed: true,
    status: "processed" as const,
    ai_confidence: 97,
    category: "Components",
  },
];
// Total amount: Rs 6,10,00,000 | ITC available: Rs 1,09,80,000 | Blocked: Rs 5,40,000

// === Expenses — July 2025 (monthly, Rs 15.42L/month = Rs 1.85 Cr/year) =======

export const DEMO_EXPENSES = [
  {
    id: "1",
    date: "2025-07-23",
    description: "Factory Electricity Bill — Unit 4 (Monthly)",
    category: "Electricity Expenses",
    amount: 200000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: false,
  },
  {
    id: "2",
    date: "2025-07-01",
    description: "Factory & Office Rent — July 2025",
    category: "Rent Expenses",
    amount: 400000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: true,
    tds_amount: 40000,
  },
  {
    id: "3",
    date: "2025-07-15",
    description: "Factory Consumables, Tools & Spare Parts",
    category: "Factory Expenses",
    amount: 350000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: false,
  },
  {
    id: "4",
    date: "2025-07-21",
    description: "Digital Marketing Agency — Monthly Retainer",
    category: "Marketing Expenses",
    amount: 75000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: true,
    tds_amount: 7500,
  },
  {
    id: "5",
    date: "2025-07-20",
    description: "Staff Travel & Client Visits — Pune, Mumbai",
    category: "Travelling Expenses",
    amount: 70000,
    paid_by: "card" as const,
    receipt_uploaded: false,
    tds_applicable: false,
  },
  {
    id: "6",
    date: "2025-07-19",
    description: "Statutory Auditor Fees — Half Yearly (M/s Joshi & Co.)",
    category: "Audit Fees",
    amount: 150000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: true,
    tds_amount: 15000,
  },
  {
    id: "7",
    date: "2025-07-10",
    description: "Legal Retainer — Advocate V. Sharma",
    category: "Legal & Professional Fees",
    amount: 100000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: true,
    tds_amount: 10000,
  },
  {
    id: "8",
    date: "2025-07-18",
    description: "ERP, Software & IT Subscriptions",
    category: "Software Expenses",
    amount: 25000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: false,
  },
  {
    id: "9",
    date: "2025-07-17",
    description: "Vehicle Fuel & Maintenance (Delivery + Field)",
    category: "Vehicle Expenses",
    amount: 50000,
    paid_by: "card" as const,
    receipt_uploaded: true,
    tds_applicable: false,
  },
  {
    id: "10",
    date: "2025-07-15",
    description: "Office Admin — Stationery, Printing, Bank Charges, Internet, Insurance",
    category: "Office Administration",
    amount: 122000,
    paid_by: "bank" as const,
    receipt_uploaded: true,
    tds_applicable: false,
  },
];
// Monthly total: Rs 15,42,000 | Annual: Rs 1,85,04,000 approx Rs 1.85 Cr

// === Payroll — July 2025 (8 senior employees shown of 32 total) ==============
// Full workforce: 32 employees | Annual payroll: Rs 1,05,00,000
// Monthly payroll of all 32: Rs 8,75,000 avg Rs 27,344 per employee

export const DEMO_PAYROLL = [
  {
    id: "1",
    employee: "Kavita Nair",
    designation: "Operations Head",
    basic: 90000, hra: 36000, allowances: 24000, gross: 150000,
    pf: 10800, esic: 0, tds: 12000, net_pay: 127200,
    status: "paid" as const,
    bank_account: "ICICI ****6621",
  },
  {
    id: "2",
    employee: "Meera Joshi",
    designation: "Sr. Sales Manager",
    basic: 55000, hra: 22000, allowances: 8000, gross: 85000,
    pf: 6600, esic: 0, tds: 5500, net_pay: 72900,
    status: "paid" as const,
    bank_account: "HDFC ****7412",
  },
  {
    id: "3",
    employee: "Sunita Rao",
    designation: "HR & Admin Manager",
    basic: 55000, hra: 22000, allowances: 8000, gross: 85000,
    pf: 6600, esic: 0, tds: 5000, net_pay: 73400,
    status: "paid" as const,
    bank_account: "HDFC ****9231",
  },
  {
    id: "4",
    employee: "Raju Thakur",
    designation: "Production Manager",
    basic: 48000, hra: 14400, allowances: 9600, gross: 72000,
    pf: 5760, esic: 0, tds: 0, net_pay: 66240,
    status: "paid" as const,
    bank_account: "SBI ****4409",
  },
  {
    id: "5",
    employee: "Suresh Patil",
    designation: "Sr. Accountant",
    basic: 38000, hra: 15200, allowances: 8800, gross: 62000,
    pf: 4560, esic: 0, tds: 0, net_pay: 57440,
    status: "pending" as const,
    bank_account: "SBI ****3318",
  },
  {
    id: "6",
    employee: "Priya Sharma",
    designation: "Quality Control Inspector",
    basic: 28000, hra: 11200, allowances: 5800, gross: 45000,
    pf: 3360, esic: 1125, tds: 0, net_pay: 40515,
    status: "paid" as const,
    bank_account: "BOB ****2211",
  },
  {
    id: "7",
    employee: "Amit Kulkarni",
    designation: "Sales Executive",
    basic: 25000, hra: 10000, allowances: 7000, gross: 42000,
    pf: 3000, esic: 1050, tds: 0, net_pay: 37950,
    status: "paid" as const,
    bank_account: "AXIS ****8834",
  },
  {
    id: "8",
    employee: "Deepak More",
    designation: "CNC Machine Operator",
    basic: 20000, hra: 8000, allowances: 7000, gross: 35000,
    pf: 2400, esic: 875, tds: 0, net_pay: 31725,
    status: "paid" as const,
    bank_account: "BOB ****7761",
  },
];

// === Bank Transactions — July 2025 ==========================================

export const DEMO_BANK_TXNS = [
  { id: "1", date: "2025-07-23", description: "NEFT/37760000/ALPHA DISTRIBUTORS", credit: 37760000, balance: 18500000, matched: true, category: "Invoice Receipt", confidence: 99 },
  { id: "2", date: "2025-07-22", description: "UPI/TRANSFER/UNKNOWN PARTY", debit: 450000, balance: 14300000, matched: false, category: "Unknown", confidence: 0 },
  { id: "3", date: "2025-07-22", description: "NEFT/ZETA RAW MATERIALS/PB-2026-0201", debit: 5664000, balance: 14750000, matched: true, category: "Vendor Payment", confidence: 97 },
  { id: "4", date: "2025-07-01", description: "AUTO-DEBIT/HDFC BANK TERM LOAN EMI", debit: 1250000, balance: 19200000, matched: true, category: "Loan EMI", confidence: 100 },
  { id: "5", date: "2025-07-05", description: "SALARY/BATCH/JULY 2025 — 8 EMPLOYEES", debit: 576000, balance: 20450000, matched: true, category: "Salary", confidence: 100 },
  { id: "6", date: "2025-07-19", description: "GST PORTAL/PMT-06/GSTR3B JULY 2025", debit: 984000, balance: 21026000, matched: true, category: "Tax Payment", confidence: 100 },
];

// === CFO Summary =============================================================

export const DEMO_CFO_SUMMARY = {
  total_revenue: 100000000,
  total_expenses: 29000000,
  gross_profit: 39000000,
  net_profit: 10000000,
  total_receivable: 80242000,
  itc_claimed: 10440000,
  itc_pending: 540000,
  bank_balance: 18500000,
  monthly_burn: 2420000,
};

// === CFO Alerts ==============================================================

export const DEMO_CFO_ALERTS = [
  {
    id: "1",
    type: "critical" as const,
    title: "Gamma Wholesale Overdue — Rs 2.24 Cr Outstanding",
    detail: "Invoice INV-2026-0103 for Rs 2,24,20,000 is 22 days overdue. Send WhatsApp reminder + legal notice immediately.",
    amount: 22420000,
    action: "Send Legal Notice",
    due_date: "Jul 31, 2025",
  },
  {
    id: "2",
    type: "warning" as const,
    title: "Rs 5,40,000 Input Tax Credit Blocked",
    detail: "Eta IT Services has NOT filed their GSTR-1. Your ITC of Rs 5,40,000 is blocked in GSTR-2B. Send registered notice to vendor.",
    amount: 540000,
    action: "Remind Vendor",
    due_date: "Jul 31, 2025",
  },
  {
    id: "3",
    type: "warning" as const,
    title: "TDS Deduction Required on 3 Payments",
    detail: "Rent (Rs 4L x 10% = Rs 40K), Marketing (Rs 75K x 10% = Rs 7.5K), Legal (Rs 1L x 10% = Rs 10K). Total TDS: Rs 57,500 by August 7th.",
    amount: 57500,
    action: "View TDS Challan",
    due_date: "Aug 7, 2025",
  },
  {
    id: "4",
    type: "opportunity" as const,
    title: "Advance Tax Q2 Due — Rs 6.5L Estimated",
    detail: "Based on Q1 net profit of Rs 25L, Q2 Advance Tax is due September 15. Set aside Rs 6.5L now to avoid Section 234C interest.",
    amount: 650000,
    action: "Schedule Payment",
    due_date: "Sep 15, 2025",
  },
  {
    id: "5",
    type: "opportunity" as const,
    title: "Claim MSME Udyam Benefits — Est. Rs 18L in subsidies",
    detail: "Sannidh detected eligibility for Maharashtra PSI 2019 power tariff subsidy, CGTMSE credit guarantee, and GeM portal procurement.",
    amount: 1800000,
    action: "View Schemes",
  },
];

// === Customers ===============================================================

export const DEMO_CUSTOMERS = [
  { name: "Alpha Distributors", revenue_pct: 32, outstanding: 0, avg_days_to_pay: 20, risk: "low" as const },
  { name: "Epsilon Tech Solutions", revenue_pct: 25, outstanding: 29500000, avg_days_to_pay: 34, risk: "medium" as const },
  { name: "Gamma Wholesale", revenue_pct: 19, outstanding: 22420000, avg_days_to_pay: 54, risk: "high" as const },
  { name: "Beta Retail Chain", revenue_pct: 14, outstanding: 16520000, avg_days_to_pay: 26, risk: "medium" as const },
  { name: "Delta Exports", revenue_pct: 10, outstanding: 11800000, avg_days_to_pay: 18, risk: "low" as const },
];

// === Cash Forecast ===========================================================

export const DEMO_CASH_FORECAST = [
  { date: "Jul 24", projected_balance: 18500000 },
  { date: "Jul 28", projected_balance: 21200000 },
  { date: "Aug 1",  projected_balance: 9500000  },
  { date: "Aug 5",  projected_balance: 12800000 },
  { date: "Aug 10", projected_balance: 10200000 },
  { date: "Aug 15", projected_balance: 16300000 },
  { date: "Aug 20", projected_balance: 14100000 },
];

// === Compliance ==============================================================

export const DEMO_EXPOSURES = [
  { regulator: "MCA", status: "active" as const, risk_level: "low" as const, notes: "Annual filings up to date. AOC-4 and MGT-7 filed. Director KYC due in 15 days." },
  { regulator: "GST", status: "active" as const, risk_level: "medium" as const, notes: "GSTR-3B filed. Eta IT Services GSTR-1 missing — Rs 5.4L ITC blocked." },
  { regulator: "Income Tax", status: "active" as const, risk_level: "low" as const, notes: "Advance tax Q1 paid Rs 2.6L. Q2 (Rs 6.5L) due September 15. ITR-6 by October 31." },
  { regulator: "Labour", status: "potential" as const, risk_level: "medium" as const, notes: "PF ECR for July pending. ESIC return for 3 employees due August 15." },
  { regulator: "FEMA", status: "inactive" as const, risk_level: "low" as const, notes: "No foreign transactions this quarter." },
];

export const DEMO_TASKS = [
  { id: "1", title: "GSTR-3B Filing — July 2025", regulator: "GST", priority: "high" as const, status: "in_progress" as const, due_date: "Aug 20, 2025" },
  { id: "2", title: "Advance Tax Q2 Payment — Rs 6.5L", regulator: "Income Tax", priority: "critical" as const, status: "pending" as const, due_date: "Sep 15, 2025" },
  { id: "3", title: "PF ECR Challan Deposit — July", regulator: "Labour", priority: "high" as const, status: "pending" as const, due_date: "Aug 15, 2025" },
  { id: "4", title: "Board Meeting — Approval of Q1 Accounts", regulator: "MCA", priority: "medium" as const, status: "pending" as const, due_date: "Aug 30, 2025" },
  { id: "5", title: "TDS Deposit on Rent, Marketing & Legal", regulator: "Income Tax", priority: "high" as const, status: "pending" as const, due_date: "Aug 7, 2025" },
  { id: "6", title: "GSTR-1 Filing — July 2025", regulator: "GST", priority: "medium" as const, status: "completed" as const, due_date: "Aug 11, 2025" },
];

export const DEMO_GAPS = [
  { id: "1", title: "GSTR-2B ITC mismatch — Eta IT Services (Rs 5.4L blocked)", severity: "high" as const, regulator: "GST", description: "Eta IT Services has not filed GSTR-1. ITC of Rs 5,40,000 blocked. Send reminder + debit note." },
  { id: "2", title: "PF and ESIC filings overdue", severity: "medium" as const, regulator: "Labour", description: "PF ECR and ESIC return for July not submitted. Penalty interest accumulates from the 16th." },
  { id: "3", title: "Director KYC renewal pending", severity: "low" as const, regulator: "MCA", description: "DIR-3 KYC for one director expires in 15 days. File before DIN deactivates (penalty Rs 5,000)." },
];

export const DEMO_DOCUMENTS = [
  { id: "1", name: "Certificate of Incorporation", file_type: "pdf", regulator: "MCA", status: "approved" as const, uploaded_at: "2020-03-15" },
  { id: "2", name: "GST Registration Certificate (27AABCS1234M1ZP)", file_type: "pdf", regulator: "GST", status: "approved" as const, uploaded_at: "2020-04-01" },
  { id: "3", name: "Udyam Registration (MH-27-0012345)", file_type: "pdf", regulator: "MSME", status: "approved" as const, uploaded_at: "2021-06-15" },
  { id: "4", name: "GSTR-3B July 2025 Draft", file_type: "pdf", regulator: "GST", status: "under_review" as const, uploaded_at: "2025-07-22" },
  { id: "5", name: "Balance Sheet FY 2024-25 (Audited)", file_type: "xlsx", regulator: "Income Tax", status: "under_review" as const, uploaded_at: "2025-07-10" },
  { id: "6", name: "PF ECR Challan — June 2025", file_type: "pdf", regulator: "Labour", status: "submitted" as const, uploaded_at: "2025-07-05" },
  { id: "7", name: "Board Resolution — Authorised Signatory", file_type: "pdf", regulator: "MCA", status: "approved" as const, uploaded_at: "2025-01-10" },
];

// === Inventory (Rs 1.28 Cr stock value) =====================================

export const DEMO_INVENTORY = [
  { id: "1", name: "Industrial Grade Steel Rods (12mm)", hsn_code: "7213", unit: "KG", opening_qty: 50000, current_qty: 34200, rate: 68, reorder_level: 10000, category: "Raw Material" },
  { id: "2", name: "Copper Wire Coil (1.5mm)", hsn_code: "7408", unit: "KG", opening_qty: 8000, current_qty: 3120, rate: 720, reorder_level: 1500, category: "Raw Material" },
  { id: "3", name: "Precision Bearings (6205)", hsn_code: "8482", unit: "PCS", opening_qty: 20000, current_qty: 8750, rate: 145, reorder_level: 3000, category: "Components" },
  { id: "4", name: "Assembled Motor Unit — Type A", hsn_code: "8501", unit: "PCS", opening_qty: 1200, current_qty: 480, rate: 4800, reorder_level: 200, category: "Finished Goods" },
  { id: "5", name: "Assembled Motor Unit — Type B", hsn_code: "8501", unit: "PCS", opening_qty: 800, current_qty: 610, rate: 6200, reorder_level: 150, category: "Finished Goods" },
  { id: "6", name: "Packing Boxes (Standard)", hsn_code: "4819", unit: "PCS", opening_qty: 30000, current_qty: 18400, rate: 22, reorder_level: 5000, category: "Packing Material" },
  { id: "7", name: "Industrial Lubricant (5L Can)", hsn_code: "2710", unit: "CAN", opening_qty: 2000, current_qty: 670, rate: 385, reorder_level: 400, category: "Consumables" },
  { id: "8", name: "Safety Gloves (Pair)", hsn_code: "3926", unit: "PAIR", opening_qty: 5000, current_qty: 1880, rate: 95, reorder_level: 1000, category: "Consumables" },
];
