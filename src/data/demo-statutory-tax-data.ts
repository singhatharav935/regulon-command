/**
 * DEMO STATUTORY TAX DATA — PHASE 3
 * ====================================
 * ⚠️  FOR DEMO DASHBOARDS ONLY — NOT CONNECTED TO ANY REAL DATABASE
 *
 * Mock statutory tax data for Income Tax Act 2025 & GST Regulations:
 *  — Form 130: Advance Tax Calculation & Quarterly Schedules (FY 2025-26)
 *  — Form 138: Annual Tax Statement (replaces 26AS)
 *  — Form 140: TDS/TCS Quarterly Statement (replaces 26Q/27Q)
 *  — Form 143: Tax Audit Report (replaces 3CA/3CB-3CD)
 *  — Form 144: Transfer Pricing Statement (replaces 3CEB)
 *  — GSTR-1 & GSTR-3B Filing Summary
 *  — GSTR-2B vs Books Reconciliation Matrix
 */

import {
  calculateAdvanceTax,
  computeRule88ASetOff,
  reconcileGSTR2BWithBooks,
  type AdvanceTaxCalculation,
  type GSTR2BReconciliationSummary,
  type GSTSetOffHierarchy,
} from "@/lib/accounting/statutory-tax-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: FORM 130 — ADVANCE TAX CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_ADVANCE_TAX: AdvanceTaxCalculation = calculateAdvanceTax({
  company_id: "demo",
  fiscal_year: "FY 2025-26",
  estimated_income: 18200000, // ₹1.82 Crore estimated taxable income
  tds_credit: 125000,        // ₹1.25 Lakh TDS deducted by customers
  tax_paid_q1: 650000,       // Paid by 15th June 2025 (15%)
  tax_paid_q2: 1250000,      // Paid by 15th Sept 2025 (45%)
  tax_paid_q3: 1300000,      // Paid by 15th Dec 2025 (75%)
  tax_paid_q4: 1255000,      // Paid by 15th March 2026 (100%)
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: FORM 138 — ANNUAL TAX STATEMENT (REPLACES FORM 26AS)
// ─────────────────────────────────────────────────────────────────────────────

export interface Form138Entry {
  deductor_tan: string;
  deductor_name: string;
  section: string;
  transaction_date: string;
  total_amount_credited: number;
  tds_deducted: number;
  tds_deposited: number;
  booking_status: "matched" | "unmatched" | "provisional";
}

export const DEMO_FORM_138_ENTRIES: Form138Entry[] = [
  {
    deductor_tan: "MUMM12345A",
    deductor_name: "Mahindra Lifespaces Developers Ltd",
    section: "194J(b)",
    transaction_date: "2025-05-15",
    total_amount_credited: 3420000,
    tds_deducted: 34200,
    tds_deposited: 34200,
    booking_status: "matched",
  },
  {
    deductor_tan: "MUMZ98765B",
    deductor_name: "Zydus Pharmaceuticals Ltd",
    section: "194J(a)",
    transaction_date: "2025-08-20",
    total_amount_credited: 1800000,
    tds_deducted: 36000,
    tds_deposited: 36000,
    booking_status: "matched",
  },
  {
    deductor_tan: "MUMB45678C",
    deductor_name: "Beta Retail Chain Ltd",
    section: "194C",
    transaction_date: "2025-11-10",
    total_amount_credited: 1121000,
    tds_deducted: 22420,
    tds_deposited: 22420,
    booking_status: "matched",
  },
  {
    deductor_tan: "MUME33221D",
    deductor_name: "Epsilon Technologies India Pvt Ltd",
    section: "194J(a)",
    transaction_date: "2026-02-18",
    total_amount_credited: 1619000,
    tds_deducted: 32380,
    tds_deposited: 32380,
    booking_status: "matched",
  },
];

export const DEMO_FORM_138_SUMMARY = {
  pan: "AAKCS1234F",
  financial_year: "2025-26",
  assessment_year: "2026-27",
  total_income_reported: 7960000,
  total_tds_credit: 125000,
  entries: DEMO_FORM_138_ENTRIES,
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: FORM 140 — TDS/TCS QUARTERLY STATEMENT (REPLACES 26Q/27Q)
// ─────────────────────────────────────────────────────────────────────────────

export interface Form140Deductee {
  deductee_pan: string;
  deductee_name: string;
  section_code: string;
  payment_date: string;
  amount_paid: number;
  tds_deducted: number;
  challan_no: string;
  bsr_code: string;
  deposit_date: string;
}

export const DEMO_FORM_140_ENTRIES: Form140Deductee[] = [
  {
    deductee_pan: "AAACZ1234K",
    deductee_name: "Zeta Raw Materials Pvt Ltd",
    section_code: "194C",
    payment_date: "2025-07-10",
    amount_paid: 226600,
    tds_deducted: 4532,
    challan_no: "00145",
    bsr_code: "0510012",
    deposit_date: "2025-08-05",
  },
  {
    deductee_pan: "ABCDE5678F",
    deductee_name: "Adv. Rajesh Kumar (Legal Counsel)",
    section_code: "194J",
    payment_date: "2025-07-15",
    amount_paid: 150000,
    tds_deducted: 15000,
    challan_no: "00146",
    bsr_code: "0510012",
    deposit_date: "2025-08-05",
  },
  {
    deductee_pan: "AABCE9988G",
    deductee_name: "Embassy Tech Park Developers (Office Rent)",
    section_code: "194I",
    payment_date: "2025-07-31",
    amount_paid: 115000,
    tds_deducted: 11500,
    challan_no: "00147",
    bsr_code: "0510012",
    deposit_date: "2025-08-05",
  },
];

export const DEMO_FORM_140_SUMMARY = {
  tan: "MUMS12345T",
  quarter: "Q2 (Jul - Sep 2025)",
  total_deductions_count: 3,
  total_taxable_amount: 491600,
  total_tds_deducted: 31032,
  challan_281_ref: "CH-281-202508-00123",
  entries: DEMO_FORM_140_ENTRIES,
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: FORM 143 — TAX AUDIT REPORT (REPLACES 3CA/3CB-3CD)
// ─────────────────────────────────────────────────────────────────────────────

export interface TaxAuditClause {
  clause_no: number;
  clause_title: string;
  status: "compliant" | "qualification" | "observation" | "not_applicable";
  auditor_remarks: string;
}

export const DEMO_FORM_143_CLAUSES: TaxAuditClause[] = [
  { clause_no: 1, clause_title: "Name of the Assessee & Address", status: "compliant", auditor_remarks: "Sannidh Technologies Pvt. Ltd., Bandra East, Mumbai" },
  { clause_no: 8, clause_title: "Relevant Section under which Audit is Conducted", status: "compliant", auditor_remarks: "Section 44AB(a) — Business turnover exceeds ₹10 Crore threshold (non-cash < 95%)" },
  { clause_no: 16, clause_title: "Amounts Not Credited to P&L Account", status: "compliant", auditor_remarks: "Nil items found not credited to P&L" },
  { clause_no: 21, clause_title: "Disallowance under Section 40(a)(ia) — Non-deduction of TDS", status: "compliant", auditor_remarks: "All TDS deposited before due date specified u/s 139(1). No disallowance." },
  { clause_no: 22, clause_title: "MSME Payment Disallowance under Section 43B(h)", status: "compliant", auditor_remarks: "All MSME vendor payments made within 45 days per written agreement. Nil disallowance." },
  { clause_no: 26, clause_title: "Sum Referred to in Section 43B (PF/ESIC/GST)", status: "compliant", auditor_remarks: "Statutory dues paid before due date. Receipt challans verified." },
  { clause_no: 34, clause_title: "Compliance with TDS/TCS Provisions (Chapter XVII-B)", status: "compliant", auditor_remarks: "Assessee has deducted and paid tax at source for all applicable transactions." },
];

export const DEMO_FORM_143_SUMMARY = {
  auditor_name: "CA Vikramaditya Sharma, FCA",
  firm_name: "Sharma & Associates LLP (ICAI Reg: 109876W)",
  udin: "25109876AAAAAB1234",
  audit_date: "2026-09-15",
  opinion_type: "Unmodified / Clean Audit Report",
  clauses: DEMO_FORM_143_CLAUSES,
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: FORM 144 — TRANSFER PRICING REPORT (REPLACES 3CEB)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FORM_144_SUMMARY = {
  international_transactions_count: 2,
  associated_enterprise_name: "Sannidh Global Inc. (Delaware, USA)",
  total_transaction_value: 4500000,
  arm_length_method_used: "Transactional Net Margin Method (TNMM)",
  is_arm_length_compliant: true,
  adjustment_required: 0,
  udin: "25109876AAAAAC5678",
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: GST RETURNS — GSTR-3B COMPUTATION & RULE 88A SET-OFF
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_GSTR3B_OUTPUT = { igst: 180000, cgst: 151200, sgst: 151200 };
export const DEMO_GSTR3B_ITC = { igst: 240000, cgst: 43200, sgst: 43200 };

export const DEMO_GSTR3B_SET_OFF: GSTSetOffHierarchy = computeRule88ASetOff(
  DEMO_GSTR3B_OUTPUT,
  DEMO_GSTR3B_ITC
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: GSTR-2B VS BOOKS RECONCILIATION MATRIX
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_PURCHASE_BOOKS = [
  { vendor_gstin: "27AAACZ1234K1Z5", vendor_name: "Zeta Raw Materials Pvt Ltd", invoice_no: "INV-8891", date: "2025-07-05", taxable: 200000, tax: 36000, is_blocked: false },
  { vendor_gstin: "27ABCDE5678F1Z2", vendor_name: "Adv. Rajesh Kumar", invoice_no: "LEG-2025-01", date: "2025-07-12", taxable: 150000, tax: 27000, is_blocked: false },
  { vendor_gstin: "27AABCE9988G1Z9", vendor_name: "Embassy Tech Park (Office Rent)", invoice_no: "RENT-JUL25", date: "2025-07-01", taxable: 115000, tax: 20700, is_blocked: false },
  { vendor_gstin: "27AAACG9900H1Z3", vendor_name: "Honda Motor India (MD's Car Maintenance)", invoice_no: "SER-7712", date: "2025-07-20", taxable: 45000, tax: 8100, is_blocked: true }, // Sec 17(5) blocked
  { vendor_gstin: "27AABCF1122J1Z1", vendor_name: "Delta Office Supplies", invoice_no: "OFF-3321", date: "2025-07-25", taxable: 35000, tax: 6300, is_blocked: false },
];

const DEMO_GSTR2B_DATA = [
  { vendor_gstin: "27AAACZ1234K1Z5", invoice_no: "INV-8891", date: "2025-07-05", taxable: 200000, tax: 36000 },
  { vendor_gstin: "27ABCDE5678F1Z2", invoice_no: "LEG-2025-01", date: "2025-07-12", taxable: 150000, tax: 27000 },
  { vendor_gstin: "27AABCE9988G1Z9", invoice_no: "RENT-JUL25", date: "2025-07-01", taxable: 115000, tax: 20700 },
  { vendor_gstin: "27AAACG9900H1Z3", invoice_no: "SER-7712", date: "2025-07-20", taxable: 45000, tax: 8100 },
  // Note: Delta Office Supplies (OFF-3321) missing in 2B — vendor hasn't filed GSTR-1
];

export const DEMO_GSTR2B_RECONCILIATION: GSTR2BReconciliationSummary = reconcileGSTR2BWithBooks(
  DEMO_PURCHASE_BOOKS,
  DEMO_GSTR2B_DATA
);
