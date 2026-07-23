/**
 * DEMO DATA — Central Mock Data Store
 * =====================================
 * All mock data for the Demo Company Dashboard lives HERE.
 * Edit this file to change what's shown in the demo.
 * No mock data is scattered in individual component files.
 *
 * This represents a fictional company "Sannidh Demo Co. Pvt. Ltd."
 * Change the values below to demonstrate any scenario you want.
 */

// ─── Company Profile ─────────────────────────────────────────────────────────

export const DEMO_COMPANY = {
  name: "Sannidh Demo Co. Pvt. Ltd.",
  industry: "Manufacturing & Trading",
  gstin: "27AABCS1234M1ZP",
  pan: "AABCS1234M",
  cin: "U74999MH2020PTC123456",
  state: "Maharashtra",
  company_type: "Private Limited",
  compliance_score: 84,
  health_status: "yellow" as const,
  registration_date: "2020-03-15",
};

// ─── Sales Invoices ───────────────────────────────────────────────────────────

export const DEMO_INVOICES = [
  { id: "1", invoice_no: "INV-2025-0101", date: "2025-07-18", customer: "Alpha Distributors Pvt Ltd", gstin: "27AABCA5678K1ZS", items: 10, amount: 180000, gst: 32400, total: 212400, status: "paid" as const, due_date: "2025-08-17" },
  { id: "2", invoice_no: "INV-2025-0102", date: "2025-07-20", customer: "Beta Retail Chain", gstin: "29AABCB9012L1ZQ", items: 6, amount: 95000, gst: 17100, total: 112100, status: "pending" as const, due_date: "2025-08-19" },
  { id: "3", invoice_no: "INV-2025-0103", date: "2025-07-01", customer: "Gamma Wholesale Ltd", gstin: "24AABCG3456N1ZR", items: 20, amount: 310000, gst: 55800, total: 365800, status: "overdue" as const, due_date: "2025-07-31", days_overdue: 22 },
  { id: "4", invoice_no: "INV-2025-0104", date: "2025-07-22", customer: "Delta Exports Pvt Ltd", gstin: "07AABCD7890P1ZT", items: 4, amount: 65000, gst: 11700, total: 76700, status: "draft" as const, due_date: "2025-08-21" },
  { id: "5", invoice_no: "INV-2025-0105", date: "2025-07-23", customer: "Epsilon Tech Solutions", gstin: "29AABCE2345Q1ZU", items: 28, amount: 420000, gst: 75600, total: 495600, status: "pending" as const, due_date: "2025-08-22" },
];

// ─── Purchase Bills ───────────────────────────────────────────────────────────

export const DEMO_PURCHASES = [
  { id: "1", bill_no: "PB-2025-0201", date: "2025-07-19", vendor: "Zeta Raw Materials Pvt Ltd", gstin: "27AABCZ4567R1ZV", amount: 120000, gst: 21600, total: 141600, itc_eligible: true, itc_claimed: true, status: "processed" as const, ai_confidence: 98, category: "Raw Materials" },
  { id: "2", bill_no: "PB-2025-0202", date: "2025-07-20", vendor: "Eta IT Services", gstin: "29AABCE8901S1ZW", amount: 28000, gst: 5040, total: 33040, itc_eligible: true, itc_claimed: false, status: "pending_review" as const, ai_confidence: 89, category: "IT Services" },
  { id: "3", bill_no: "PB-2025-0203", date: "2025-07-21", vendor: "Theta Logistics", gstin: "27AABCT2345T1ZX", amount: 15000, gst: 2700, total: 17700, itc_eligible: true, itc_claimed: true, status: "processed" as const, ai_confidence: 99, category: "Freight" },
  { id: "4", bill_no: "CASH-2025-0041", date: "2025-07-22", vendor: "Local Supplier (Cash Memo)", gstin: "UNREGISTERED", amount: 3500, gst: 0, total: 3500, itc_eligible: false, itc_claimed: false, status: "pending_review" as const, ai_confidence: 72, category: "Office Supplies" },
  { id: "5", bill_no: "PB-2025-0204", date: "2025-07-22", vendor: "Bank Loan EMI", gstin: "N/A", amount: 75000, gst: 0, total: 75000, itc_eligible: false, itc_claimed: false, status: "processed" as const, ai_confidence: 100, category: "Loan Repayment" },
];

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const DEMO_EXPENSES = [
  { id: "1", date: "2025-07-23", description: "Office pantry & refreshments", category: "Office Expenses", amount: 2800, paid_by: "cash" as const, receipt_uploaded: true, tds_applicable: false },
  { id: "2", date: "2025-07-22", description: "Electricity Bill — Unit 4 Factory", category: "Utilities", amount: 21000, paid_by: "bank" as const, receipt_uploaded: true, tds_applicable: false },
  { id: "3", date: "2025-07-21", description: "Digital Marketing Agency — Monthly Retainer", category: "Marketing", amount: 40000, paid_by: "bank" as const, receipt_uploaded: true, tds_applicable: true, tds_amount: 4000 },
  { id: "4", date: "2025-07-20", description: "Staff travel — Pune client visit", category: "Travel", amount: 7200, paid_by: "card" as const, receipt_uploaded: false, tds_applicable: false },
  { id: "5", date: "2025-07-19", description: "CA Firm — Professional fees", category: "Professional Fees", amount: 18000, paid_by: "bank" as const, receipt_uploaded: true, tds_applicable: true, tds_amount: 1800 },
];

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const DEMO_PAYROLL = [
  { id: "1", employee: "Meera Joshi", designation: "Sr. Sales Manager", basic: 42000, hra: 16800, allowances: 6200, gross: 65000, pf: 5040, esic: 0, tds: 3800, net_pay: 56160, status: "paid" as const, bank_account: "HDFC ****7412" },
  { id: "2", employee: "Suresh Patil", designation: "Accountant", basic: 26000, hra: 10400, allowances: 3600, gross: 40000, pf: 3120, esic: 600, tds: 0, net_pay: 36280, status: "paid" as const, bank_account: "SBI ****3318" },
  { id: "3", employee: "Kavita Nair", designation: "Operations Head", basic: 52000, hra: 20800, allowances: 7200, gross: 80000, pf: 6240, esic: 0, tds: 7200, net_pay: 66560, status: "pending" as const, bank_account: "ICICI ****6621" },
  { id: "4", employee: "Raju Thakur", designation: "Factory Supervisor", basic: 20000, hra: 8000, allowances: 2000, gross: 30000, pf: 2400, esic: 450, tds: 0, net_pay: 27150, status: "paid" as const, bank_account: "BOB ****4409" },
];

// ─── Bank Transactions ────────────────────────────────────────────────────────

export const DEMO_BANK_TXNS = [
  { id: "1", date: "2025-07-23", description: "NEFT/212400/ALPHA DISTRIBUTORS", credit: 212400, balance: 1645000, matched: true, category: "Invoice Receipt", confidence: 99 },
  { id: "2", date: "2025-07-22", description: "UPI/TRANSFER/UNKNOWN PARTY", debit: 45000, balance: 1432600, matched: false, category: "Unknown", confidence: 0 },
  { id: "3", date: "2025-07-22", description: "IMPS/ZETA RAW MATERIALS", debit: 141600, balance: 1477600, matched: true, category: "Vendor Payment", confidence: 97 },
  { id: "4", date: "2025-07-21", description: "AUTO-DEBIT/BANK LOAN EMI", debit: 75000, balance: 1619200, matched: true, category: "Loan EMI", confidence: 100 },
  { id: "5", date: "2025-07-20", description: "SALARY/MEERA JOSHI/NEFT", debit: 56160, balance: 1694200, matched: true, category: "Salary", confidence: 100 },
  { id: "6", date: "2025-07-19", description: "GST PORTAL/TAX PMT/GSTR3B", debit: 98400, balance: 1750360, matched: true, category: "Tax Payment", confidence: 100 },
];

// ─── CFO Data ─────────────────────────────────────────────────────────────────

export const DEMO_CFO_SUMMARY = {
  total_revenue: 1262500,
  total_expenses: 786000,
  gross_profit: 476500,
  total_receivable: 574300,
  itc_claimed: 24300,
  itc_pending: 5040,
  bank_balance: 1645000,
  monthly_burn: 786000,
};

export const DEMO_CFO_ALERTS = [
  { id: "1", type: "critical" as const, title: "Cash Flow Dip Expected on August 1st", detail: "Three vendor payments totalling ₹6.5L are due simultaneously. Projected balance will drop to ₹95,000. Transfer funds before August 1.", amount: 95000, action: "View Cash Forecast", due_date: "Aug 1, 2025" },
  { id: "2", type: "warning" as const, title: "₹5,040 Input Tax Credit Blocked", detail: "Eta IT Services has not filed their GSTR-1 for June. Your ITC of ₹5,040 is blocked in GSTR-2B. Send them a reminder immediately.", amount: 5040, action: "Remind Vendor", due_date: "Jul 31, 2025" },
  { id: "3", type: "warning" as const, title: "TDS Deduction Required on 2 Payments", detail: "Marketing agency (₹40K) and CA firm (₹18K) require TDS @10% before payment. Deposit ₹5,800 as TDS by August 7.", amount: 5800, action: "View TDS Challan", due_date: "Aug 7, 2025" },
  { id: "4", type: "opportunity" as const, title: "Cancel Unused Subscriptions — Save ₹1.8L/year", detail: "Sannidh found 3 recurring software charges with zero usage in 60 days. Cancel them to save ₹15,000/month.", amount: 180000, action: "View Subscriptions" },
  { id: "5", type: "opportunity" as const, title: "Advance Tax Due September 15", detail: "Based on Q1 profit of ₹4.76L, estimated Advance Tax liability is ₹1.2L. Set aside funds now to avoid Section 234C interest.", amount: 120000, action: "Schedule Payment", due_date: "Sep 15, 2025" },
];

export const DEMO_CUSTOMERS = [
  { name: "Alpha Distributors", revenue_pct: 32, outstanding: 0, avg_days_to_pay: 20, risk: "low" as const },
  { name: "Epsilon Tech Solutions", revenue_pct: 25, outstanding: 495600, avg_days_to_pay: 34, risk: "medium" as const },
  { name: "Gamma Wholesale", revenue_pct: 19, outstanding: 365800, avg_days_to_pay: 54, risk: "high" as const },
  { name: "Beta Retail Chain", revenue_pct: 14, outstanding: 112100, avg_days_to_pay: 26, risk: "medium" as const },
  { name: "Delta Exports", revenue_pct: 10, outstanding: 76700, avg_days_to_pay: 18, risk: "low" as const },
];

export const DEMO_CASH_FORECAST = [
  { date: "Jul 24", projected_balance: 1645000 },
  { date: "Jul 26", projected_balance: 1857100 },
  { date: "Jul 28", projected_balance: 1782100 },
  { date: "Aug 1", projected_balance: 95000 },
  { date: "Aug 5", projected_balance: 607700 },
  { date: "Aug 10", projected_balance: 532700 },
  { date: "Aug 15", projected_balance: 1028300 },
];

// ─── Compliance Data ──────────────────────────────────────────────────────────

export const DEMO_EXPOSURES = [
  { regulator: "MCA", status: "active" as const, risk_level: "low" as const, notes: "Annual filings up to date. AOC-4 and MGT-7 filed on time." },
  { regulator: "GST", status: "active" as const, risk_level: "medium" as const, notes: "GSTR-3B filed. One vendor's GSTR-1 missing causing ITC block." },
  { regulator: "Income Tax", status: "active" as const, risk_level: "low" as const, notes: "Advance tax paid. ITR-6 filing due by September 30." },
  { regulator: "Labour", status: "potential" as const, risk_level: "medium" as const, notes: "PF challan due for July. ESIC filing pending." },
  { regulator: "FEMA", status: "inactive" as const, risk_level: "low" as const, notes: "No foreign transactions this quarter." },
];

export const DEMO_TASKS = [
  { id: "1", title: "GSTR-3B Filing — July 2025", regulator: "GST", priority: "high" as const, status: "in_progress" as const, due_date: "Aug 20, 2025" },
  { id: "2", title: "Advance Tax Q2 Payment", regulator: "Income Tax", priority: "critical" as const, status: "pending" as const, due_date: "Sep 15, 2025" },
  { id: "3", title: "PF Challan Deposit — July", regulator: "Labour", priority: "high" as const, status: "pending" as const, due_date: "Aug 15, 2025" },
  { id: "4", title: "Board Meeting — Approval of Q1 Accounts", regulator: "MCA", priority: "medium" as const, status: "pending" as const, due_date: "Aug 30, 2025" },
  { id: "5", title: "TDS Deposit on Professional Fees", regulator: "Income Tax", priority: "high" as const, status: "pending" as const, due_date: "Aug 7, 2025" },
  { id: "6", title: "GSTR-1 Filing — July 2025", regulator: "GST", priority: "medium" as const, status: "completed" as const, due_date: "Aug 11, 2025" },
];

export const DEMO_GAPS = [
  { id: "1", title: "Missing GSTR-2B reconciliation for June", severity: "high" as const, regulator: "GST", description: "One supplier has not filed, blocking your ITC. This causes a mismatch in your 2B statement." },
  { id: "2", title: "PF and ESIC filings overdue", severity: "medium" as const, regulator: "Labour", description: "PF ECR and ESIC return for July not yet submitted. Penalty interest begins accumulating." },
  { id: "3", title: "Director's KYC renewal pending", severity: "low" as const, regulator: "MCA", description: "DIR-3 KYC for one director expires in 15 days. File before DIN gets deactivated." },
];

export const DEMO_DOCUMENTS = [
  { id: "1", name: "Certificate of Incorporation", file_type: "pdf", regulator: "MCA", status: "approved" as const, uploaded_at: "2020-03-15" },
  { id: "2", name: "GST Registration Certificate", file_type: "pdf", regulator: "GST", status: "approved" as const, uploaded_at: "2020-04-01" },
  { id: "3", name: "GSTR-3B July 2025 Draft", file_type: "pdf", regulator: "GST", status: "under_review" as const, uploaded_at: "2025-07-22" },
  { id: "4", name: "Balance Sheet FY 2024-25", file_type: "xlsx", regulator: "Income Tax", status: "under_review" as const, uploaded_at: "2025-07-10" },
  { id: "5", name: "PF ECR Challan — June 2025", file_type: "pdf", regulator: "Labour", status: "submitted" as const, uploaded_at: "2025-07-05" },
  { id: "6", name: "Board Resolution — Authorised Signatory", file_type: "pdf", regulator: "MCA", status: "approved" as const, uploaded_at: "2025-01-10" },
];

// ─── Inventory / Stock Items ──────────────────────────────────────────────────

export const DEMO_INVENTORY = [
  { id: "1", name: "Industrial Grade Steel Rods (12mm)", hsn_code: "7213", unit: "KG", opening_qty: 5000, current_qty: 3420, rate: 68, reorder_level: 1000, category: "Raw Material" },
  { id: "2", name: "Copper Wire Coil (1.5mm)", hsn_code: "7408", unit: "KG", opening_qty: 800, current_qty: 312, rate: 720, reorder_level: 150, category: "Raw Material" },
  { id: "3", name: "Precision Bearings (6205)", hsn_code: "8482", unit: "PCS", opening_qty: 2000, current_qty: 875, rate: 145, reorder_level: 300, category: "Components" },
  { id: "4", name: "Assembled Motor Unit — Type A", hsn_code: "8501", unit: "PCS", opening_qty: 120, current_qty: 48, rate: 4800, reorder_level: 20, category: "Finished Goods" },
  { id: "5", name: "Assembled Motor Unit — Type B", hsn_code: "8501", unit: "PCS", opening_qty: 80, current_qty: 61, rate: 6200, reorder_level: 15, category: "Finished Goods" },
  { id: "6", name: "Packing Boxes (Standard)", hsn_code: "4819", unit: "PCS", opening_qty: 3000, current_qty: 1840, rate: 22, reorder_level: 500, category: "Packing Material" },
  { id: "7", name: "Industrial Lubricant (5L Can)", hsn_code: "2710", unit: "CAN", opening_qty: 200, current_qty: 67, rate: 385, reorder_level: 40, category: "Consumables" },
  { id: "8", name: "Safety Gloves (Pair)", hsn_code: "3926", unit: "PAIR", opening_qty: 500, current_qty: 188, rate: 95, reorder_level: 100, category: "Consumables" },
];

