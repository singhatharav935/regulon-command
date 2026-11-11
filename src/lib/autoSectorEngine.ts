/**
 * AUTO SECTOR ENGINE
 * ==================
 * Generates mathematically consistent, sector-specific financial data
 * for the Sannidh demo dashboard personalizer.
 *
 * Same company name + sector always produces the same numbers (deterministic seed).
 * No API calls — all generated in-memory.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectorAlert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  dueDate: string;
  section: string;
  amount?: number;
}

// Simplified shapes used by CFOIntelligenceModule
export interface SectorInvoice {
  amount: number;
  gst_amount: number;
  date: string;
  party_name: string;
}

export interface SectorExpense {
  amount: number;
  category: string;
  date: string;
}

export interface SectorPayroll {
  gross_salary: number;
  net_salary: number;
  pf_employer: number;
  esic_employer: number;
}

export interface SectorBankTxn {
  amount: number;
  type: "credit" | "debit";
  date: string;
}

// Full ERP-typed shapes used by RealERPModule / SmartERPModule
export interface ERPInvoiceShape {
  id: string; invoice_no: string; date: string; customer: string; gstin: string;
  items: number; amount: number; gst: number; total: number;
  status: "paid" | "pending" | "overdue" | "draft"; due_date: string;
}
export interface ERPPurchaseShape {
  id: string; bill_no: string; date: string; vendor: string; gstin: string;
  amount: number; gst: number; total: number; itc_eligible: boolean;
  itc_claimed: boolean; status: "processed" | "pending_review" | "rejected";
  ai_confidence: number; category: string;
}
export interface ERPExpenseShape {
  id: string; date: string; description: string; category: string;
  amount: number; paid_by: "cash" | "bank" | "card";
  receipt_uploaded: boolean; tds_applicable: boolean; tds_amount?: number;
}
export interface ERPPayrollShape {
  id: string; employee: string; designation: string;
  basic: number; hra: number; allowances: number; gross: number;
  pf: number; esic: number; tds: number; net_pay: number;
  status: "paid" | "pending"; bank_account: string;
}
export interface ERPBankTxnShape {
  id: string; date: string; description: string;
  debit?: number; credit?: number; balance: number;
  matched: boolean; category: string; confidence: number;
}

export interface SectorProfile {
  companyName: string;
  sector: string;
  gstin: string;
  pan: string;
  state: string;
  companyType: string;
  msmeCategory: string;
  complianceScore: number;
  healthStatus: "green" | "yellow" | "red";

  // Key financials
  annualRevenue: number;
  annualPurchases: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  ebitda: number;
  ebitdaMarginPct: number;
  netProfit: number;
  gstOutput: number;
  gstItc: number;
  bankBalance: number;
  employees: number;

  // Scores
  piotroskiScore: number;
  altmanZScore: number;
  cashRunwayDays: number;

  // Feature flags
  hasInventory: boolean;
  hasEwayBill: boolean;
  hasIrn: boolean;
  hasExport: boolean;
  hasImport: boolean;
  hasRera: boolean;
  hasMsme43bh: boolean;
  hasDualGst: boolean;
  hasSez: boolean;
  hasFema: boolean;
  hasComposition: boolean;
  hasLut: boolean;
  hasF15CaCb: boolean;

  // AI inbox alerts
  alerts: SectorAlert[];

  // CFO module arrays (simplified shape)
  invoices: SectorInvoice[];
  purchases: SectorInvoice[];
  expenses: SectorExpense[];
  payroll: SectorPayroll[];
  bankTxns: SectorBankTxn[];

  // ERP module arrays (fully typed ERP shape)
  erpData: {
    invoices: ERPInvoiceShape[];
    purchases: ERPPurchaseShape[];
    expenses: ERPExpenseShape[];
    payroll: ERPPayrollShape[];
    bankTxns: ERPBankTxnShape[];
  };
}

// ─── All 35 Indian Industry Sectors ─────────────────────────────────────────

export const ALL_SECTORS = [
  "Manufacturing & Engineering",
  "IT Services & Software",
  "HealthTech & Healthcare",
  "Logistics & Warehousing",
  "Facility Management & Security",
  "Real Estate & Construction",
  "Education & EdTech",
  "E-commerce & Online Retail",
  "Pharma & Life Sciences",
  "NBFC & Fintech",
  "Food & Beverage",
  "FMCG & Consumer Goods",
  "Textile & Apparel",
  "Hospitality & Hotels",
  "Agriculture & Agritech",
  "Media & Entertainment",
  "Automobile & Auto Components",
  "Infrastructure & EPC",
  "Renewable Energy & Solar",
  "Import & Export Trading",
  "Professional Services (CA/Legal/Consulting)",
  "Telecom & Internet Services",
  "Insurance",
  "Jewellery & Gems",
  "Steel & Metals",
  "Oil & Gas",
  "Chemicals & Petrochemicals",
  "Printing & Publishing",
  "Defense & Aerospace",
  "Shipping & Marine",
  "Electronics & Hardware",
  "Offline Retail & Distribution",
  "Event Management",
  "Architecture & Interior Design",
  "Travel & Tourism",
] as const;

export type Sector = typeof ALL_SECTORS[number];

// ─── Sector Base Configurations ───────────────────────────────────────────────

interface SectorBaseConfig {
  revenueBase: number;       // Annual revenue in Rs
  grossMargin: number;       // 0–1
  ebitdaMargin: number;      // 0–1
  gstRate: number;           // primary GST rate
  employees: number;
  complianceScore: number;
  features: {
    hasInventory: boolean;
    hasEwayBill: boolean;
    hasIrn: boolean;
    hasExport: boolean;
    hasImport: boolean;
    hasRera: boolean;
    hasMsme43bh: boolean;
    hasDualGst: boolean;
    hasSez: boolean;
    hasFema: boolean;
    hasComposition: boolean;
    hasLut: boolean;
    hasF15CaCb: boolean;
  };
  alertTemplates: Omit<SectorAlert, "id">[];
  expenseCategories: string[];
  customerNames: string[];
  vendorNames: string[];
}

const SECTOR_CONFIGS: Record<string, SectorBaseConfig> = {
  "Manufacturing & Engineering": {
    revenueBase: 100_000_000,
    grossMargin: 0.35,
    ebitdaMargin: 0.14,
    gstRate: 0.18,
    employees: 65,
    complianceScore: 81,
    features: { hasInventory: true, hasEwayBill: true, hasIrn: true, hasExport: false, hasImport: true, hasRera: false, hasMsme43bh: true, hasDualGst: false, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "GSTR-2B Mismatch Detected", description: "₹4.2L ITC mismatch found across 7 vendor invoices. Reversal required before 30th.", dueDate: "Nov 30, 2025", section: "Sec 16(2) CGST Act", amount: 420000 },
      { type: "warning", title: "MSME Vendor Payment — Day 38", description: "3 MSME vendors unpaid beyond 38 days. Loss of Sec 43B(h) deduction risk of ₹8.1L.", dueDate: "Dec 5, 2025", section: "Sec 43B(h) IT Act", amount: 810000 },
      { type: "critical", title: "E-way Bill Validity Expiring", description: "14 e-way bills expiring today. Goods in transit — extend immediately.", dueDate: "Today", section: "Rule 138 CGST Rules" },
      { type: "warning", title: "TDS on Job Work — Sec 194C", description: "₹22L contractor payments pending TDS deduction this month.", dueDate: "Nov 30, 2025", section: "Sec 194C IT Act", amount: 220000 },
      { type: "info", title: "Advance Tax Q3 Due", description: "Q3 advance tax installment of ₹5.8L due Dec 15. Based on estimated profit.", dueDate: "Dec 15, 2025", section: "Sec 208 IT Act", amount: 580000 },
    ],
    expenseCategories: ["Raw Materials", "Factory Overhead", "Machine Maintenance", "Quality Testing", "Freight Outward"],
    customerNames: ["Alpha Engineering Works", "Bharat Heavy Enterprises", "Dhruv Industries Pvt Ltd", "Esteem Components Ltd", "Fabtech Solutions"],
    vendorNames: ["Prime Steel Suppliers", "Omega Alloys Pvt Ltd", "National Hardware Trading", "Bharat Polymers Ltd"],
  },
  "IT Services & Software": {
    revenueBase: 80_000_000,
    grossMargin: 0.62,
    ebitdaMargin: 0.24,
    gstRate: 0.18,
    employees: 42,
    complianceScore: 88,
    features: { hasInventory: false, hasEwayBill: false, hasIrn: true, hasExport: true, hasImport: false, hasRera: false, hasMsme43bh: false, hasDualGst: false, hasSez: true, hasFema: true, hasComposition: false, hasLut: true, hasF15CaCb: true },
    alertTemplates: [
      { type: "critical", title: "LUT Renewal Due", description: "Letter of Undertaking for zero-rated export of services expires in 12 days. File LUT immediately.", dueDate: "Nov 30, 2025", section: "Sec 16(3) IGST Act" },
      { type: "warning", title: "TDS on Professional Fees — Sec 194J", description: "₹18.4L freelancer payments pending TDS @ 10%. Deduct before payment.", dueDate: "Nov 30, 2025", section: "Sec 194J IT Act", amount: 184000 },
      { type: "warning", title: "Form 15CA/15CB Required", description: "2 foreign vendor payments above $50K require Form 15CA/15CB before FEMA remittance.", dueDate: "Dec 10, 2025", section: "Sec 195 IT Act" },
      { type: "info", title: "ESOP Perquisite Tax — Q3", description: "Stock option exercise by 4 employees triggers perquisite tax of ₹3.2L. Include in salary TDS.", dueDate: "Jan 7, 2026", section: "Sec 17(2) IT Act", amount: 320000 },
      { type: "success", title: "SEZ Unit Annual Compliance", description: "Annual performance report to Development Commissioner due March. Prepare export data now.", dueDate: "Mar 31, 2026", section: "SEZ Act 2005" },
    ],
    expenseCategories: ["Cloud Infrastructure", "Software Licenses", "Employee Training", "Client Acquisition", "Office & Admin"],
    customerNames: ["Global Tech Solutions Inc", "DataBridge Analytics", "Nexus Systems Pvt Ltd", "Spectrum Digital", "CloudBase Corp"],
    vendorNames: ["AWS India Pvt Ltd", "Microsoft India", "GitHub Enterprise", "Zoom Communications"],
  },
  "HealthTech & Healthcare": {
    revenueBase: 60_000_000,
    grossMargin: 0.52,
    ebitdaMargin: 0.18,
    gstRate: 0.05,
    employees: 55,
    complianceScore: 79,
    features: { hasInventory: true, hasEwayBill: false, hasIrn: false, hasExport: false, hasImport: true, hasRera: false, hasMsme43bh: false, hasDualGst: true, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "Dual GST Split Required — OPD vs Pharmacy", description: "OPD consultation (exempt under health services) + pharmacy sales (12% GST) must be invoiced separately. ₹6.8L may be wrongly combined.", dueDate: "Nov 30, 2025", section: "Notification 12/2017 CGST (Rate)", amount: 680000 },
      { type: "warning", title: "ITC Block on Clinical Equipment", description: "Medical equipment ITC of ₹2.1L blocked u/s 17(5)(h) as used for exempt health services. Must be reversed.", dueDate: "Nov 30, 2025", section: "Sec 17(5) CGST Act", amount: 210000 },
      { type: "warning", title: "PCPNDT Annual Report Due", description: "Annual report to District Appropriate Authority under PCPNDT Act due before Dec 31.", dueDate: "Dec 31, 2025", section: "PCPNDT Act 1994" },
      { type: "info", title: "TDS on Medical Professional Fees", description: "₹9.2L consulting fees to visiting doctors — TDS @ 10% u/s 194J applicable.", dueDate: "Nov 30, 2025", section: "Sec 194J IT Act", amount: 92000 },
      { type: "info", title: "Bio-Medical Waste Authorization Renewal", description: "Annual authorization for bio-medical waste treatment expires Dec 15.", dueDate: "Dec 15, 2025", section: "Bio-Medical Waste Rules 2016" },
    ],
    expenseCategories: ["Medical Equipment", "Pharma & Consumables", "Doctor Fees", "Lab Reagents", "Facility Maintenance"],
    customerNames: ["National Insurance Corp", "Star Health Insurance", "CGHS Empanelment", "Corporate Health Plan"],
    vendorNames: ["Abbott India Ltd", "Sun Pharma", "BD Medical India", "Siemens Healthineers"],
  },
  "Logistics & Warehousing": {
    revenueBase: 75_000_000,
    grossMargin: 0.28,
    ebitdaMargin: 0.11,
    gstRate: 0.18,
    employees: 95,
    complianceScore: 76,
    features: { hasInventory: false, hasEwayBill: true, hasIrn: true, hasExport: false, hasImport: false, hasRera: false, hasMsme43bh: true, hasDualGst: false, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "Reverse Charge on GTA Services", description: "Freight received from GTA (non-GST registered) of ₹7.4L — RCM @ 5% applicable. ₹37K payable.", dueDate: "Nov 20, 2025", section: "Notification 13/2017 CGST (Rate)", amount: 37000 },
      { type: "warning", title: "ISD Credit Distribution Pending", description: "Common input services worth ₹3.2L at HO level — distribute to branches via ISD mechanism before month end.", dueDate: "Nov 30, 2025", section: "Sec 20 CGST Act", amount: 320000 },
      { type: "warning", title: "Driver PF Compliance — Contract Labour", description: "52 contract drivers via 3 contractors — verify contractors' PF remittance. Principal employer liability risk.", dueDate: "Dec 15, 2025", section: "CLRA Act 1970" },
      { type: "critical", title: "E-way Bill Mismatch Alert", description: "12 deliveries flagged by GSTN for e-way bill vs GSTR-1 mismatch. Reply required within 7 days.", dueDate: "Nov 25, 2025", section: "Rule 138C CGST Rules" },
      { type: "info", title: "TDS on Truck Hire — Sec 194C", description: "₹14.2L truck hire payments — TDS @ 1% (individual) or 2% (company) must be deducted.", dueDate: "Nov 30, 2025", section: "Sec 194C IT Act", amount: 142000 },
    ],
    expenseCategories: ["Fuel & Fleet", "Driver Wages", "Warehouse Rent", "Vehicle Maintenance", "GPS & Tracking"],
    customerNames: ["Flipkart Supply Chain", "Amazon Logistics", "BigBasket Fulfilment", "D-Mart Distribution"],
    vendorNames: ["Ashok Leyland Finance", "BPCL Fuel Station", "Panasonic Cold Chain", "Mahindra Logistics"],
  },
  "Facility Management & Security": {
    revenueBase: 55_000_000,
    grossMargin: 0.22,
    ebitdaMargin: 0.09,
    gstRate: 0.18,
    employees: 180,
    complianceScore: 72,
    features: { hasInventory: false, hasEwayBill: false, hasIrn: false, hasExport: false, hasImport: false, hasRera: false, hasMsme43bh: true, hasDualGst: false, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "PF/ESI Challan Due — 180 Employees", description: "PF challan of ₹4.3L and ESI challan of ₹1.8L due by 15th. 180 contract + on-roll staff.", dueDate: "Nov 15, 2025", section: "PF Act 1952 / ESI Act 1948", amount: 430000 },
      { type: "critical", title: "TDS on Contract Labour — Sec 194C", description: "₹32L housekeeping/security contractor payments — TDS @ 2% = ₹64K pending deduction.", dueDate: "Nov 30, 2025", section: "Sec 194C IT Act", amount: 64000 },
      { type: "warning", title: "PSARA License Renewal — Security Wing", description: "Private Security Agencies Regulation Act license for 3 states expires Dec 31. Renew 45 days prior.", dueDate: "Nov 15, 2025", section: "PSARA Act 2005" },
      { type: "warning", title: "Minimum Wages Revision Alert", description: "Maharashtra revised minimum wages effective Oct 1 — ensure all 95 security guards' wages updated. Risk of ₹12L backpay.", dueDate: "Nov 30, 2025", section: "Minimum Wages Act 1948", amount: 1200000 },
      { type: "info", title: "Professional Tax — Mumbai Municipal Corp", description: "Professional tax for 180 employees due before Nov 30 — ₹43,200 payable.", dueDate: "Nov 30, 2025", section: "MPTP Act 1975", amount: 43200 },
    ],
    expenseCategories: ["Manpower", "Uniforms & Equipment", "Cleaning Supplies", "Training", "Transport Reimbursement"],
    customerNames: ["DLF Commercial Spaces", "Embassy Office Parks", "Phoenix Malls Ltd", "Godrej Properties"],
    vendorNames: ["Uniform Factory India", "Godrej Security Solutions", "Johnson Controls", "Eco-Green Supplies"],
  },
  "Real Estate & Construction": {
    revenueBase: 120_000_000,
    grossMargin: 0.42,
    ebitdaMargin: 0.18,
    gstRate: 0.05,
    employees: 38,
    complianceScore: 74,
    features: { hasInventory: false, hasEwayBill: false, hasIrn: false, hasExport: false, hasImport: false, hasRera: true, hasMsme43bh: true, hasDualGst: false, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "RERA Quarterly Report Due", description: "MahaRERA Q3 progress report for 3 ongoing projects due by Dec 10. Non-filing penalty ₹5000/day.", dueDate: "Dec 10, 2025", section: "Sec 11 RERA Act 2016" },
      { type: "critical", title: "TDS on Property Purchase — Sec 194IA", description: "Buyer of commercial property must deduct 1% TDS of ₹1.8L on ₹1.8Cr payment. File Form 26QB within 30 days.", dueDate: "Dec 5, 2025", section: "Sec 194IA IT Act", amount: 180000 },
      { type: "warning", title: "Joint Development Agreement — GST Timing", description: "JDA with landowner — GST @ 5% on ₹8.4Cr construction value becomes payable on OC receipt. Plan cash flow.", dueDate: "Dec 31, 2025", section: "Notification 3/2019 CGST (Rate)", amount: 420000 },
      { type: "warning", title: "ITC Restricted — Residential vs Commercial", description: "Mixed project: ITC on common construction cost must be apportioned. ₹3.1L residential ITC blocked.", dueDate: "Nov 30, 2025", section: "Sec 17(5)(d) CGST Act", amount: 310000 },
      { type: "info", title: "TDS on Rent — Sec 194I", description: "Office rent of ₹1.5L/month — TDS @ 10% = ₹15K/month. Deduct from landlord payment.", dueDate: "Nov 30, 2025", section: "Sec 194I IT Act", amount: 15000 },
    ],
    expenseCategories: ["Construction Materials", "Labour Contracts", "Architect Fees", "Site Management", "Legal & Approvals"],
    customerNames: ["Nexus Home Buyers", "Commercial Leases Corp", "HDFC Home Finance", "Tata Housing Deals"],
    vendorNames: ["UltraTech Cement", "JSW Steel", "L&T Construction", "GreenBuild Materials"],
  },
  "Education & EdTech": {
    revenueBase: 45_000_000,
    grossMargin: 0.58,
    ebitdaMargin: 0.21,
    gstRate: 0.0,
    employees: 48,
    complianceScore: 82,
    features: { hasInventory: false, hasEwayBill: false, hasIrn: false, hasExport: true, hasImport: false, hasRera: false, hasMsme43bh: false, hasDualGst: true, hasSez: false, hasFema: true, hasComposition: false, hasLut: false, hasF15CaCb: true },
    alertTemplates: [
      { type: "warning", title: "GST Exemption vs Online Content — Split Required", description: "Live tutoring (exempt) vs recorded content sold online (18% GST) must be invoiced separately. ₹2.8L mismatch found.", dueDate: "Nov 30, 2025", section: "Notification 12/2017 CGST (Rate)", amount: 280000 },
      { type: "info", title: "Foreign Student Fees — FEMA Compliance", description: "₹14L received from NRI/foreign students — ensure Foreign Inward Remittance Certificate (FIRC) obtained and FEMA compliant.", dueDate: "Dec 15, 2025", section: "FEMA 1999" },
      { type: "warning", title: "TDS on Faculty Fees — Sec 194J", description: "Guest faculty payments of ₹6.8L — TDS @ 10% = ₹68K applicable. Not deducted in October.", dueDate: "Nov 30, 2025", section: "Sec 194J IT Act", amount: 68000 },
      { type: "info", title: "Sec 10(23C) Exemption Annual Audit", description: "Annual audit report required to maintain income tax exemption for educational institution. File by Sept 30.", dueDate: "Sep 30, 2026", section: "Sec 10(23C) IT Act" },
      { type: "critical", title: "FCRA Renewal for Foreign Grants", description: "FCRA registration for receiving international educational grants expires Dec 31. File renewal 6 months prior.", dueDate: "Jun 30, 2026", section: "FCRA Act 2010" },
    ],
    expenseCategories: ["Faculty Salaries", "Platform Technology", "Content Creation", "Student Acquisition", "Campus Facilities"],
    customerNames: ["CBSE School Group", "Corporate Training Clients", "Govt Skills Program", "NSDC Contracts"],
    vendorNames: ["Zoom India", "Adobe Creative Cloud", "Pearson Education", "Coursera Partnership"],
  },
  "E-commerce & Online Retail": {
    revenueBase: 90_000_000,
    grossMargin: 0.32,
    ebitdaMargin: 0.08,
    gstRate: 0.18,
    employees: 35,
    complianceScore: 77,
    features: { hasInventory: true, hasEwayBill: true, hasIrn: true, hasExport: false, hasImport: true, hasRera: false, hasMsme43bh: true, hasDualGst: false, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "TCS from Marketplace — GSTR-8 Mismatch", description: "Amazon/Flipkart deducted ₹1.8L TCS but only ₹1.3L reflected in GSTR-8. ₹50K discrepancy to resolve.", dueDate: "Nov 30, 2025", section: "Sec 52 CGST Act", amount: 50000 },
      { type: "warning", title: "Return-Linked ITC Reversal", description: "High return rate (18%) means ITC on returned goods must be reversed. ₹2.4L reversal pending.", dueDate: "Nov 30, 2025", section: "Sec 16(2) CGST Act", amount: 240000 },
      { type: "critical", title: "Inventory Reconciliation — 3 Warehouses", description: "Physical stock count mismatch of ₹8.2L across Mumbai, Delhi, Bangalore warehouses. Adjust before GST audit.", dueDate: "Nov 25, 2025", section: "Sec 35 CGST Act", amount: 820000 },
      { type: "warning", title: "MSME Supplier Payments — 45 Day Breach", description: "14 MSME dropship suppliers unpaid beyond 45 days. ₹5.6L expense deduction at risk.", dueDate: "Dec 1, 2025", section: "Sec 43B(h) IT Act", amount: 560000 },
      { type: "info", title: "BIS Certification for Electronics Listed", description: "3 electronic products listed without BIS certificate — remove or add certificate within 15 days.", dueDate: "Nov 25, 2025", section: "BIS Act 2016" },
    ],
    expenseCategories: ["Inventory Purchase", "Marketplace Commissions", "Packaging & Dispatch", "Returns Processing", "Digital Marketing"],
    customerNames: ["Direct Consumers (D2C)", "Amazon Marketplace", "Flipkart Seller Hub", "Myntra Fashion"],
    vendorNames: ["Alibaba Imports", "Domestic Manufacturers Pvt", "India Post Logistics", "Delhivery Courier"],
  },
  "Pharma & Life Sciences": {
    revenueBase: 95_000_000,
    grossMargin: 0.58,
    ebitdaMargin: 0.22,
    gstRate: 0.12,
    employees: 72,
    complianceScore: 83,
    features: { hasInventory: true, hasEwayBill: true, hasIrn: true, hasExport: true, hasImport: true, hasRera: false, hasMsme43bh: true, hasDualGst: true, hasSez: false, hasFema: true, hasComposition: false, hasLut: true, hasF15CaCb: true },
    alertTemplates: [
      { type: "critical", title: "DPCO Price Compliance — Scheduled Drugs", description: "4 scheduled drug formulations priced above NPPA ceiling. Penalty of 3x excess amount. Revise immediately.", dueDate: "Nov 20, 2025", section: "DPCO 2013" },
      { type: "warning", title: "Drug License Renewal — Form 20/21", description: "Retail and wholesale drug license expires Dec 31. Apply 90 days prior through State FDA.", dueDate: "Nov 30, 2025", section: "Drugs & Cosmetics Act 1940" },
      { type: "critical", title: "GSTR-2B Reconciliation — API Import ITC", description: "₹6.8L ITC on API imports not matching GSTR-2B. Custom duty IGST credit also unreconciled.", dueDate: "Nov 30, 2025", section: "Sec 16(2) CGST Act", amount: 680000 },
      { type: "warning", title: "Clinical Trial Expense — Sec 35(2AB)", description: "In-house R&D deduction claim of 150% under Sec 35(2AB) requires DSIR annual report filing by Dec 31.", dueDate: "Dec 31, 2025", section: "Sec 35(2AB) IT Act" },
      { type: "info", title: "Export — ARE-1 Bond Reconciliation", description: "12 ARE-1 bonds for drug exports pending reconciliation with Central Excise/Customs. Clear backlog.", dueDate: "Dec 31, 2025", section: "Central Excise Rules" },
    ],
    expenseCategories: ["API & Raw Materials", "Packaging Materials", "Quality Control", "R&D Expenses", "Regulatory Affairs"],
    customerNames: ["IQVIA Distributors", "Cipla Distribution Network", "MedPlus Pharmacy Chain", "Apollo Hospitals Supply"],
    vendorNames: ["BASF India", "Merck Specialties", "Piramal Raw Materials", "Custom Lab Equipment"],
  },
  "NBFC & Fintech": {
    revenueBase: 110_000_000,
    grossMargin: 0.68,
    ebitdaMargin: 0.28,
    gstRate: 0.18,
    employees: 52,
    complianceScore: 86,
    features: { hasInventory: false, hasEwayBill: false, hasIrn: false, hasExport: false, hasImport: false, hasRera: false, hasMsme43bh: false, hasDualGst: false, hasSez: false, hasFema: true, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "RBI NBFC Return — NBS-7 Quarterly", description: "RBI NBFC-ND return NBS-7 for Q2 FY26 due Nov 30. Capital adequacy ratio and exposure reporting.", dueDate: "Nov 30, 2025", section: "RBI NBFC Master Directions 2016" },
      { type: "critical", title: "ALM Report — Maturity Pattern Analysis", description: "Asset Liability Management quarterly report to Board mandatory. Interest rate risk gap analysis pending.", dueDate: "Nov 25, 2025", section: "RBI ALM Guidelines" },
      { type: "warning", title: "TDS on Interest Payments — Sec 194A", description: "₹28L interest paid to depositors — TDS @ 10% = ₹2.8L deductible where PAN provided. Missing PAN for 12 depositors.", dueDate: "Nov 30, 2025", section: "Sec 194A IT Act", amount: 280000 },
      { type: "warning", title: "FEMA — External Commercial Borrowing Report", description: "ECB drawdown of $2M last quarter — Form ECB-2 monthly return to RBI due within 7 working days.", dueDate: "Nov 15, 2025", section: "FEMA ECB Master Circular" },
      { type: "info", title: "Credit Concentration Risk — Sec 25(1)", description: "Single borrower exposure approaching 15% of Tier-1 capital limit. Diversify before RBI inspection.", dueDate: "Dec 31, 2025", section: "RBI NBFC Prudential Norms" },
    ],
    expenseCategories: ["Interest Cost", "Credit Loss Provision", "Compliance & Legal", "Technology Platform", "Collection Operations"],
    customerNames: ["MSME Borrowers Portfolio", "Personal Loan Clients", "Vehicle Finance Accounts", "Gold Loan Customers"],
    vendorNames: ["CIBIL / Equifax", "LegalEdge Recovery", "NIC Cloud Platform", "Enstoa Risk Analytics"],
  },
  "Food & Beverage": {
    revenueBase: 70_000_000,
    grossMargin: 0.38,
    ebitdaMargin: 0.12,
    gstRate: 0.05,
    employees: 85,
    complianceScore: 75,
    features: { hasInventory: true, hasEwayBill: true, hasIrn: false, hasExport: false, hasImport: true, hasRera: false, hasMsme43bh: true, hasDualGst: true, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
    alertTemplates: [
      { type: "critical", title: "FSSAI Annual Return — FBO Renewal", description: "FSSAI annual return for all 3 manufacturing units due Nov 30. License fee ₹7,500 per unit.", dueDate: "Nov 30, 2025", section: "FSS Act 2006" },
      { type: "warning", title: "GST Rate Split — Restaurant vs Packaged Food", description: "Dine-in (5% no ITC) vs packaged retail (12% with ITC) must be invoiced separately. ₹3.2L combined.", dueDate: "Nov 30, 2025", section: "Notification 11/2017 CGST (Rate)", amount: 320000 },
      { type: "critical", title: "Cold Chain Compliance — FSSAI Inspection", description: "Temperature logs for cold storage units not maintained for Oct. FSSAI inspection scheduled Dec 5.", dueDate: "Nov 30, 2025", section: "FSSAI Food Safety Standards" },
      { type: "warning", title: "Ingredient Labelling Non-Compliance", description: "Revised FSSAI allergen labelling norms effective Dec 1. 4 SKU labels require immediate update.", dueDate: "Nov 30, 2025", section: "FSSAI Labelling Regulations 2019" },
      { type: "info", title: "Advance Tax Q3 — Projected ₹4.2L", description: "Based on current P&L, Q3 advance tax installment of ₹4.2L due Dec 15.", dueDate: "Dec 15, 2025", section: "Sec 208 IT Act", amount: 420000 },
    ],
    expenseCategories: ["Raw Ingredients", "Packaging", "Cold Chain Logistics", "Quality Lab", "Retail Commissions"],
    customerNames: ["BigBasket FMCG", "D-Mart Supermarkets", "Metro Cash & Carry", "Swiggy/Zomato B2B"],
    vendorNames: ["Mother Dairy Ingredients", "ITC Agro", "Tetra Pak India", "Amul Cooperative"],
  },
};

// Fallback config for sectors not specifically defined
const DEFAULT_CONFIG: SectorBaseConfig = {
  revenueBase: 65_000_000,
  grossMargin: 0.40,
  ebitdaMargin: 0.14,
  gstRate: 0.18,
  employees: 45,
  complianceScore: 80,
  features: { hasInventory: false, hasEwayBill: false, hasIrn: false, hasExport: false, hasImport: false, hasRera: false, hasMsme43bh: false, hasDualGst: false, hasSez: false, hasFema: false, hasComposition: false, hasLut: false, hasF15CaCb: false },
  alertTemplates: [
    { type: "warning", title: "GSTR-3B Filing Due", description: "Monthly GST return for November due by Nov 20. Reconcile books first.", dueDate: "Nov 20, 2025", section: "Sec 39 CGST Act" },
    { type: "critical", title: "TDS Payment Due", description: "TDS collected last month must be deposited by 7th of this month.", dueDate: "Nov 7, 2025", section: "Sec 192-194 IT Act" },
    { type: "warning", title: "Advance Tax Q3", description: "Q3 advance tax installment due Dec 15 to avoid Sec 234C interest.", dueDate: "Dec 15, 2025", section: "Sec 208 IT Act" },
    { type: "info", title: "PF/ESI Challan", description: "Monthly PF and ESI challans due by 15th for all employees.", dueDate: "Nov 15, 2025", section: "PF Act / ESI Act" },
  ],
  expenseCategories: ["Operations", "Salaries", "Office Rent", "Marketing", "Professional Fees"],
  customerNames: ["Enterprise Client A", "Corporate Client B", "SME Client C", "Retail Client D"],
  vendorNames: ["Supplier Alpha", "Vendor Beta", "Service Provider Gamma", "Contractor Delta"],
};

// ─── Deterministic Seed Function ─────────────────────────────────────────────

function seededMultiplier(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Returns multiplier between 0.88 and 1.12
  return 0.88 + (Math.abs(hash) % 24) / 100;
}

function seededInt(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return min + (Math.abs(hash) % (max - min + 1));
}

function generateGSTIN(seed: string): string {
  const stateCodes = ["27", "29", "24", "19", "36", "09", "07", "33"];
  const stateCode = stateCodes[seededInt(seed, 0, stateCodes.length - 1)];
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
  const pan = Array.from({ length: 5 }, (_, i) => letters[seededInt(seed + i, 0, letters.length - 1)]).join("") +
    seededInt(seed + "num", 1000, 9999).toString() +
    letters[seededInt(seed + "l1", 0, letters.length - 1)] +
    "1" +
    letters[seededInt(seed + "l2", 0, letters.length - 1)];
  return `${stateCode}${pan}`;
}

// ─── Main Generator Function ──────────────────────────────────────────────────

export function generateSectorProfile(companyName: string, sector: string): SectorProfile {
  const config = SECTOR_CONFIGS[sector] ?? DEFAULT_CONFIG;
  const seed = `${companyName}::${sector}`;
  const multiplier = seededMultiplier(seed);

  // Financial calculations
  const annualRevenue = Math.round(config.revenueBase * multiplier);
  const annualPurchases = Math.round(annualRevenue * (1 - config.grossMargin) * 0.72);
  const grossProfit = annualRevenue - annualPurchases;
  const grossMarginPct = Math.round((grossProfit / annualRevenue) * 100);
  const operatingExpenses = Math.round(annualRevenue * (config.grossMargin - config.ebitdaMargin) * 0.9);
  const ebitda = Math.round(annualRevenue * config.ebitdaMargin);
  const ebitdaMarginPct = Math.round(config.ebitdaMargin * 100);
  const netProfit = Math.round(ebitda * 0.68);
  const gstOutput = Math.round(annualRevenue * config.gstRate);
  const gstItc = Math.round(annualPurchases * config.gstRate * 0.88);
  const bankBalance = Math.round(annualRevenue * 0.18 * multiplier);
  const employees = Math.round(config.employees * multiplier);

  // Scores
  const piotroskiScore = seededInt(seed + "piot", 6, 9);
  const altmanZScore = parseFloat((2.4 + seededInt(seed + "altman", 0, 24) / 10).toFixed(1));
  const cashRunwayDays = seededInt(seed + "cash", 65, 180);
  const complianceScore = Math.round(config.complianceScore * multiplier * 1.05);

  // Generate invoices (5 entries)
  const invoices: SectorInvoice[] = config.customerNames.slice(0, 5).map((name, i) => {
    const amount = Math.round((annualRevenue / 5) * seededMultiplier(seed + name + i));
    return {
      amount,
      gst_amount: Math.round(amount * config.gstRate),
      date: `2025-${String(seededInt(seed + name, 7, 11)).padStart(2, "0")}-${String(seededInt(seed + name + i, 1, 28)).padStart(2, "0")}`,
      party_name: name,
    };
  });

  // Generate purchases (4 entries)
  const purchases: SectorInvoice[] = config.vendorNames.slice(0, 4).map((name, i) => {
    const amount = Math.round((annualPurchases / 4) * seededMultiplier(seed + name + i));
    return {
      amount,
      gst_amount: Math.round(amount * config.gstRate),
      date: `2025-${String(seededInt(seed + name, 7, 11)).padStart(2, "0")}-${String(seededInt(seed + name + i, 1, 28)).padStart(2, "0")}`,
      party_name: name,
    };
  });

  // Generate expenses (5 entries)
  const expenses: SectorExpense[] = config.expenseCategories.slice(0, 5).map((category, i) => ({
    amount: Math.round((operatingExpenses / 5) * seededMultiplier(seed + category + i)),
    category,
    date: `2025-${String(seededInt(seed + category, 7, 11)).padStart(2, "0")}-01`,
  }));

  // Generate payroll (3 entries — representative)
  const avgSalary = Math.round(annualRevenue * 0.14 / employees / 12);
  const payroll: SectorPayroll[] = [
    { gross_salary: Math.round(avgSalary * 2.5), net_salary: Math.round(avgSalary * 2.1), pf_employer: Math.round(avgSalary * 2.5 * 0.12), esic_employer: 0 },
    { gross_salary: Math.round(avgSalary * 1.4), net_salary: Math.round(avgSalary * 1.18), pf_employer: Math.round(avgSalary * 1.4 * 0.12), esic_employer: Math.round(avgSalary * 1.4 * 0.0325) },
    { gross_salary: Math.round(avgSalary * 0.9), net_salary: Math.round(avgSalary * 0.76), pf_employer: 0, esic_employer: Math.round(avgSalary * 0.9 * 0.0325) },
  ];

  // Generate bank transactions (5 entries)
  const bankTxns: SectorBankTxn[] = [
    { amount: Math.round(annualRevenue / 24), type: "credit", date: "2025-11-05" },
    { amount: Math.round(annualPurchases / 20), type: "debit", date: "2025-11-08" },
    { amount: Math.round(annualRevenue / 30), type: "credit", date: "2025-11-12" },
    { amount: Math.round(operatingExpenses / 15), type: "debit", date: "2025-11-15" },
    { amount: Math.round(annualRevenue / 20), type: "credit", date: "2025-11-20" },
  ];

  // Add IDs to alert templates
  const alerts: SectorAlert[] = config.alertTemplates.map((a, i) => ({
    ...a,
    id: `${sector.substring(0, 4).replace(/\s/g, "")}-alert-${i + 1}`,
  }));

  const stateCodes: Record<string, string> = {
    "27": "Maharashtra", "29": "Karnataka", "24": "Gujarat",
    "19": "West Bengal", "36": "Telangana", "09": "Uttar Pradesh",
    "07": "Delhi", "33": "Tamil Nadu",
  };
  const gstin = generateGSTIN(seed);
  const stateCode = gstin.substring(0, 2);
  const state = stateCodes[stateCode] ?? "Maharashtra";

  // ─── Build full ERP-typed arrays ─────────────────────────────────────────────
  const shortCode = (sector.substring(0, 3).toUpperCase().replace(/\s/g, ""));
  const statuses: Array<"paid" | "pending" | "overdue"> = ["paid", "paid", "pending", "paid", "overdue"];
  const erpInvoices: ERPInvoiceShape[] = config.customerNames.slice(0, 5).map((name, i) => {
    const amt = Math.round((annualRevenue / 5) * seededMultiplier(seed + name + i));
    const gstAmt = Math.round(amt * config.gstRate);
    const mo = String(seededInt(seed + name, 7, 11)).padStart(2, "0");
    const dy = String(seededInt(seed + name + i, 1, 28)).padStart(2, "0");
    return {
      id: `${shortCode}-INV-${i + 1}`,
      invoice_no: `INV-2026-${shortCode}${String(i + 1).padStart(2, "0")}`,
      date: `2025-${mo}-${dy}`,
      customer: name,
      gstin: generateGSTIN(seed + name),
      items: seededInt(seed + name + "items", 2, 20),
      amount: amt,
      gst: gstAmt,
      total: amt + gstAmt,
      status: statuses[i % statuses.length],
      due_date: `2025-${String(Number(mo) + 1 > 12 ? 12 : Number(mo) + 1).padStart(2, "0")}-${dy}`,
    };
  });

  const purchaseStatuses: Array<"processed" | "pending_review"> = ["processed", "processed", "pending_review", "processed"];
  const erpPurchases: ERPPurchaseShape[] = config.vendorNames.slice(0, 4).map((name, i) => {
    const amt = Math.round((annualPurchases / 4) * seededMultiplier(seed + name + i));
    const gstAmt = Math.round(amt * config.gstRate);
    const mo = String(seededInt(seed + name, 7, 11)).padStart(2, "0");
    const dy = String(seededInt(seed + name + i, 1, 28)).padStart(2, "0");
    return {
      id: `${shortCode}-PUR-${i + 1}`,
      bill_no: `BILL-2026-${shortCode}${String(i + 1).padStart(2, "0")}`,
      date: `2025-${mo}-${dy}`,
      vendor: name,
      gstin: generateGSTIN(seed + name + "vendor"),
      amount: amt,
      gst: gstAmt,
      total: amt + gstAmt,
      itc_eligible: true,
      itc_claimed: i !== 2,
      status: purchaseStatuses[i % purchaseStatuses.length],
      ai_confidence: seededInt(seed + name + "conf", 85, 99),
      category: config.expenseCategories[i % config.expenseCategories.length],
    };
  });

  const erpExpenses: ERPExpenseShape[] = config.expenseCategories.slice(0, 5).map((cat, i) => {
    const amt = Math.round((operatingExpenses / 5) * seededMultiplier(seed + cat + i));
    const mo = String(seededInt(seed + cat, 7, 11)).padStart(2, "0");
    return {
      id: `${shortCode}-EXP-${i + 1}`,
      date: `2025-${mo}-01`,
      description: `${cat} — Nov 2025`,
      category: cat,
      amount: amt,
      paid_by: (i % 3 === 0 ? "cash" : "bank") as "cash" | "bank",
      receipt_uploaded: i !== 3,
      tds_applicable: cat.toLowerCase().includes("professional") || cat.toLowerCase().includes("rent"),
      tds_amount: cat.toLowerCase().includes("professional") ? Math.round(amt * 0.1) : undefined,
    };
  });

  const designations = ["Director", "General Manager", "Senior Executive", "Executive", "Supervisor", "Assistant"];
  const erpPayroll: ERPPayrollShape[] = Array.from({ length: Math.min(6, Math.round(employees / 10)) }, (_, i) => {
    const basic = Math.round((annualRevenue * 0.14 / employees / 12) * [2.5, 1.8, 1.4, 1.1, 0.9, 0.75][i] || 1);
    const hra = Math.round(basic * 0.4);
    const allowances = Math.round(basic * 0.2);
    const gross = basic + hra + allowances;
    const pf = gross > 15000 ? Math.round(1800) : Math.round(gross * 0.12);
    const esic = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const tds = i === 0 ? Math.round(gross * 0.1) : 0;
    return {
      id: `${shortCode}-PAY-${i + 1}`,
      employee: `Employee ${String.fromCharCode(65 + i)} ${companyName.split(" ")[0] || "Kumar"}`,
      designation: designations[i] ?? "Staff",
      basic, hra, allowances, gross, pf, esic, tds,
      net_pay: gross - pf - esic - tds,
      status: "paid",
      bank_account: `HDFC****${1000 + i * 111}`,
    };
  });

  let runningBalance = bankBalance;
  const erpBankTxns: ERPBankTxnShape[] = [
    { id: `${shortCode}-BNK-1`, date: "2025-11-05", description: `Payment received — ${config.customerNames[0]}`, credit: Math.round(annualRevenue / 24), balance: (runningBalance += Math.round(annualRevenue / 24)), debit: undefined, matched: true, category: "Sales Receipt", confidence: 97 },
    { id: `${shortCode}-BNK-2`, date: "2025-11-08", description: `Payment to ${config.vendorNames[0]}`, debit: Math.round(annualPurchases / 20), balance: (runningBalance -= Math.round(annualPurchases / 20)), credit: undefined, matched: true, category: "Purchase Payment", confidence: 95 },
    { id: `${shortCode}-BNK-3`, date: "2025-11-12", description: `Payment received — ${config.customerNames[1] ?? config.customerNames[0]}`, credit: Math.round(annualRevenue / 30), balance: (runningBalance += Math.round(annualRevenue / 30)), debit: undefined, matched: true, category: "Sales Receipt", confidence: 94 },
    { id: `${shortCode}-BNK-4`, date: "2025-11-15", description: "Salary disbursement — Nov 2025", debit: Math.round(annualRevenue * 0.14 / employees / 12 * employees), balance: (runningBalance -= Math.round(annualRevenue * 0.14 / employees / 12 * employees)), credit: undefined, matched: true, category: "Payroll", confidence: 100 },
    { id: `${shortCode}-BNK-5`, date: "2025-11-20", description: `Payment received — ${config.customerNames[2] ?? config.customerNames[0]}`, credit: Math.round(annualRevenue / 20), balance: (runningBalance += Math.round(annualRevenue / 20)), debit: undefined, matched: false, category: "Sales Receipt", confidence: 88 },
  ];

  return {
    companyName: companyName || `${sector} Co. Pvt. Ltd.`,
    sector,
    gstin,
    pan: gstin.substring(2, 12),
    state,
    companyType: "Private Limited",
    msmeCategory: annualRevenue < 50_000_000 ? "Micro" : annualRevenue < 250_000_000 ? "Small" : "Medium",
    complianceScore: Math.min(96, Math.max(62, complianceScore)),
    healthStatus: complianceScore >= 85 ? "green" : complianceScore >= 72 ? "yellow" : "red",
    annualRevenue,
    annualPurchases,
    grossProfit,
    grossMarginPct,
    operatingExpenses,
    ebitda,
    ebitdaMarginPct,
    netProfit,
    gstOutput,
    gstItc,
    bankBalance,
    employees,
    piotroskiScore,
    altmanZScore,
    cashRunwayDays,
    ...config.features,
    alerts,
    invoices,
    purchases,
    expenses,
    payroll,
    bankTxns,
    erpData: {
      invoices: erpInvoices,
      purchases: erpPurchases,
      expenses: erpExpenses,
      payroll: erpPayroll,
      bankTxns: erpBankTxns,
    },
  };
}

