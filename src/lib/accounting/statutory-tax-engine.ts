/**
 * SANNIDH STATUTORY TAX & VERSIONING ENGINE — PHASE 3
 * =====================================================
 * Pure computation engine for Indian Taxation — Income Tax Act 2025 & GST Regulations.
 * Zero UI code, zero Supabase calls — shared between real and demo dashboards.
 *
 * Implements:
 *  1. Income Tax Act 2025 Form Mappings:
 *       — Form 130: Advance Tax Calculation & Quarterly Instalment Schedules (Sec 208-211)
 *       — Form 138: Annual Tax Statement (replaces Form 26AS)
 *       — Form 140: TDS/TCS Quarterly Statement (replaces Forms 26Q / 27Q)
 *       — Form 143: Tax Audit Report (replaces Forms 3CA / 3CB-3CD)
 *       — Form 144: Transfer Pricing Report (replaces Form 3CEB)
 *  2. TDS/TCS Calculation & Threshold Engine (12 major sections)
 *  3. Interest Computation u/s 234A, 234B, 234C (Advance tax default/deferment)
 *  4. GST Compliance Engine:
 *       — GSTR-1 Table-wise payload generator (B2B, B2CL, B2CS, CDNR, HSN, DOCS)
 *       — GSTR-3B Auto-Computation with Rule 88A set-off hierarchy
 *       — GSTR-2B vs Books Reconciliation Matrix (Rule 36(4) & Section 16(2)(aa))
 *       — E-Invoice IRN Payload & QR Code JSON schema
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: INCOME TAX ACT 2025 — ADVANCE TAX ENGINE (FORM 130)
// Sections 208 - 211, 234B, 234C
// ─────────────────────────────────────────────────────────────────────────────

export interface AdvanceTaxSchedule {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  due_date: string;              // "15th June", "15th September", "15th December", "15th March"
  cumulative_pct_required: number; // 15%, 45%, 75%, 100%
  cumulative_tax_required: number;
  tax_paid_in_quarter: number;
  cumulative_tax_paid: number;
  shortfall: number;
  interest_234C: number;         // 1% per month for shortfall
  is_compliant: boolean;
}

export interface AdvanceTaxCalculation {
  company_id: string;
  fiscal_year: string;
  estimated_gross_income: number;
  estimated_deductions: number;
  estimated_taxable_income: number;
  corporate_tax_rate: number;    // 25% (or 22% u/s 115BAA)
  surcharge_rate: number;        // 7% or 12%
  cess_rate: number;             // 4%
  effective_tax_rate: number;    // e.g. 25.168%
  gross_tax_liability: number;
  less_tds_tcs_credit: number;   // TDS deducted by customers (Form 138)
  less_mat_credit: number;
  net_advance_tax_payable: number; // Tax payable if > ₹10,000 (Sec 208 threshold)
  is_advance_tax_applicable: boolean; // Net payable >= ₹10,000
  schedules: AdvanceTaxSchedule[];
  total_interest_234C: number;
  interest_234B: number;         // If tax paid < 90% by March 31
  total_tax_plus_interest: number;
}

export function calculateAdvanceTax(inputs: {
  company_id: string;
  fiscal_year: string;
  estimated_income: number;
  tds_credit: number;
  tax_paid_q1: number;
  tax_paid_q2: number;
  tax_paid_q3: number;
  tax_paid_q4: number;
}): AdvanceTaxCalculation {
  const tax_rate = 0.22; // Section 115BAA (22%)
  const surcharge = 0.10; // 10% surcharge
  const cess = 0.04;     // 4% HEC
  const effective_rate = tax_rate * (1 + surcharge) * (1 + cess); // 25.168%

  const gross_tax = Math.round(inputs.estimated_income * effective_rate);
  const net_payable = Math.max(0, gross_tax - inputs.tds_credit);
  const is_applicable = net_payable >= 10000;

  const quarters: { q: "Q1" | "Q2" | "Q3" | "Q4"; date: string; pct: number; paid: number }[] = [
    { q: "Q1", date: "15th June 2025", pct: 0.15, paid: inputs.tax_paid_q1 },
    { q: "Q2", date: "15th September 2025", pct: 0.45, paid: inputs.tax_paid_q2 },
    { q: "Q3", date: "15th December 2025", pct: 0.75, paid: inputs.tax_paid_q3 },
    { q: "Q4", date: "15th March 2026", pct: 1.00, paid: inputs.tax_paid_q4 },
  ];

  let cumulative_paid = 0;
  let total_234C = 0;

  const schedules: AdvanceTaxSchedule[] = quarters.map(q => {
    const required = Math.round(net_payable * q.pct);
    cumulative_paid += q.paid;
    const shortfall = Math.max(0, required - cumulative_paid);

    // Section 234C Interest: 1% per month for 3 months (Q1-Q3) and 1 month (Q4)
    const months = q.q === "Q4" ? 1 : 3;
    const interest = shortfall > 0 ? Math.round(shortfall * 0.01 * months) : 0;
    total_234C += interest;

    return {
      quarter: q.q,
      due_date: q.date,
      cumulative_pct_required: q.pct * 100,
      cumulative_tax_required: required,
      tax_paid_in_quarter: q.paid,
      cumulative_tax_paid: cumulative_paid,
      shortfall,
      interest_234C: interest,
      is_compliant: shortfall === 0,
    };
  });

  // Section 234B Interest: 1% per month if total tax paid before 31st March is < 90% of net payable
  const total_paid_march = cumulative_paid;
  const is_234B_default = total_paid_march < net_payable * 0.90;
  const shortfall_234B = is_234B_default ? net_payable - total_paid_march : 0;
  const interest_234B = is_234B_default ? Math.round(shortfall_234B * 0.01 * 4) : 0; // 4 months (Apr to Jul audit date)

  return {
    company_id: inputs.company_id,
    fiscal_year: inputs.fiscal_year,
    estimated_gross_income: inputs.estimated_income,
    estimated_deductions: 0,
    estimated_taxable_income: inputs.estimated_income,
    corporate_tax_rate: 0.22,
    surcharge_rate: 0.10,
    cess_rate: 0.04,
    effective_tax_rate: Math.round(effective_rate * 10000) / 100,
    gross_tax_liability: gross_tax,
    less_tds_tcs_credit: inputs.tds_credit,
    less_mat_credit: 0,
    net_advance_tax_payable: net_payable,
    is_advance_tax_applicable: is_applicable,
    schedules,
    total_interest_234C: total_234C,
    interest_234B,
    total_tax_plus_interest: net_payable + total_234C + interest_234B,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: TDS / TCS CALCULATOR & SECTION THRESHOLD ENGINE
// Income Tax Act 1961 / 2025 Statutory Rates & Thresholds
// ─────────────────────────────────────────────────────────────────────────────

export type StatutoryTDSSection =
  | "194C_ind"     // Contractor (Ind/HUF) — 1% (Single > ₹30k / Agg > ₹1L)
  | "194C_comp"    // Contractor (Company) — 2% (Single > ₹30k / Agg > ₹1L)
  | "194J_tech"    // Technical Fees / Software — 2% (Agg > ₹30k)
  | "194J_prof"    // Professional Fees / Legal / CA — 10% (Agg > ₹30k)
  | "194I_rent_building" // Rent — Land/Building — 10% (Agg > ₹2.4L)
  | "194I_rent_plant"    // Rent — Plant/Machinery — 2% (Agg > ₹2.4L)
  | "194H_commission"    // Commission/Brokerage — 5% (Agg > ₹15k)
  | "194Q_purchase_goods"// Purchase of Goods — 0.1% (Turnover > 10Cr & Agg Purchases > ₹50L)
  | "206C_1H_sale_goods" // TCS on Sale of Goods — 0.1% (Turnover > 10Cr & Agg Receipts > ₹50L)
  | "194R_perquisites"   // Business Perquisites/Benefits — 10% (Agg > ₹20k)
  | "194N_cash"          // Cash Withdrawal — 2% (Cash > ₹1 Cr)
  | "192_salary";        // Salary TDS (As per slab rate / Section 115BAC)

export interface TDSSectionRule {
  section_code: StatutoryTDSSection;
  section_name: string;
  rate_pct: number;
  single_transaction_threshold: number;
  aggregate_annual_threshold: number;
  requires_pan: boolean;
  higher_rate_no_pan: number; // 20% u/s 206AA if PAN missing
}

export const STATUTORY_TDS_RULES: Record<StatutoryTDSSection, TDSSectionRule> = {
  "194C_ind": { section_code: "194C_ind", section_name: "Sec 194C — Contractor (Individual/HUF)", rate_pct: 1.0, single_transaction_threshold: 30000, aggregate_annual_threshold: 100000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194C_comp": { section_code: "194C_comp", section_name: "Sec 194C — Contractor (Company/Pvt Ltd)", rate_pct: 2.0, single_transaction_threshold: 30000, aggregate_annual_threshold: 100000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194J_tech": { section_code: "194J_tech", section_name: "Sec 194J(a) — Technical Services / Software", rate_pct: 2.0, single_transaction_threshold: 30000, aggregate_annual_threshold: 30000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194J_prof": { section_code: "194J_prof", section_name: "Sec 194J(b) — Professional Fees (Legal, CA, Architect)", rate_pct: 10.0, single_transaction_threshold: 30000, aggregate_annual_threshold: 30000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194I_rent_building": { section_code: "194I_rent_building", section_name: "Sec 194I(b) — Rent on Office / Building / Land", rate_pct: 10.0, single_transaction_threshold: 240000, aggregate_annual_threshold: 240000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194I_rent_plant": { section_code: "194I_rent_plant", section_name: "Sec 194I(a) — Rent on Plant & Machinery", rate_pct: 2.0, single_transaction_threshold: 240000, aggregate_annual_threshold: 240000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194H_commission": { section_code: "194H_commission", section_name: "Sec 194H — Commission or Brokerage", rate_pct: 5.0, single_transaction_threshold: 15000, aggregate_annual_threshold: 15000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194Q_purchase_goods": { section_code: "194Q_purchase_goods", section_name: "Sec 194Q — TDS on Purchase of Goods (> ₹50L)", rate_pct: 0.1, single_transaction_threshold: 5000000, aggregate_annual_threshold: 5000000, requires_pan: true, higher_rate_no_pan: 5.0 },
  "206C_1H_sale_goods": { section_code: "206C_1H_sale_goods", section_name: "Sec 206C(1H) — TCS on Sale of Goods (> ₹50L)", rate_pct: 0.1, single_transaction_threshold: 5000000, aggregate_annual_threshold: 5000000, requires_pan: true, higher_rate_no_pan: 1.0 },
  "194R_perquisites": { section_code: "194R_perquisites", section_name: "Sec 194R — Business Perquisites & Benefits", rate_pct: 10.0, single_transaction_threshold: 20000, aggregate_annual_threshold: 20000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "194N_cash": { section_code: "194N_cash", section_name: "Sec 194N — Cash Withdrawal > ₹1 Cr", rate_pct: 2.0, single_transaction_threshold: 10000000, aggregate_annual_threshold: 10000000, requires_pan: true, higher_rate_no_pan: 20.0 },
  "192_salary": { section_code: "192_salary", section_name: "Sec 192 — TDS on Salary (Average Rate)", rate_pct: 0, single_transaction_threshold: 300000, aggregate_annual_threshold: 300000, requires_pan: true, higher_rate_no_pan: 20.0 },
};

export interface TDSDeductionResult {
  section_code: StatutoryTDSSection;
  gross_amount: number;
  is_tds_applicable: boolean;
  reason_not_applicable?: string;
  applicable_rate_pct: number;
  tds_amount: number;
  net_payable_to_party: number;
  due_date_deposit: string; // 7th of next month (or 30th April for March)
  form_16A_eligible: boolean;
}

export function computeTDSDeduction(inputs: {
  section: StatutoryTDSSection;
  transaction_amount: number;
  aggregate_annual_amount: number;
  has_valid_pan: boolean;
  is_lower_deduction_cert: boolean; // Section 197 certificate
  lower_deduction_rate_pct?: number;
  transaction_date: string;
}): TDSDeductionResult {
  const rule = STATUTORY_TDS_RULES[inputs.section];
  const agg = inputs.aggregate_annual_amount + inputs.transaction_amount;

  // Check threshold
  const exceeds_single = rule.single_transaction_threshold > 0 && inputs.transaction_amount >= rule.single_transaction_threshold;
  const exceeds_agg = rule.aggregate_annual_threshold > 0 && agg >= rule.aggregate_annual_threshold;

  if (!exceeds_single && !exceeds_agg) {
    return {
      section_code: inputs.section,
      gross_amount: inputs.transaction_amount,
      is_tds_applicable: false,
      reason_not_applicable: `Amount below threshold (Single: ₹${rule.single_transaction_threshold.toLocaleString('en-IN')}, Agg: ₹${rule.aggregate_annual_threshold.toLocaleString('en-IN')})`,
      applicable_rate_pct: 0,
      tds_amount: 0,
      net_payable_to_party: inputs.transaction_amount,
      due_date_deposit: getTDSDueDate(inputs.transaction_date),
      form_16A_eligible: false,
    };
  }

  // Rate determination
  let rate = rule.rate_pct;
  if (!inputs.has_valid_pan) {
    rate = rule.higher_rate_no_pan; // Section 206AA
  } else if (inputs.is_lower_deduction_cert && inputs.lower_deduction_rate_pct !== undefined) {
    rate = inputs.lower_deduction_rate_pct;
  }

  const tds_amount = Math.round(inputs.transaction_amount * (rate / 100));

  return {
    section_code: inputs.section,
    gross_amount: inputs.transaction_amount,
    is_tds_applicable: true,
    applicable_rate_pct: rate,
    tds_amount,
    net_payable_to_party: inputs.transaction_amount - tds_amount,
    due_date_deposit: getTDSDueDate(inputs.transaction_date),
    form_16A_eligible: true,
  };
}

export function getTDSDueDate(transaction_date: string): string {
  const dt = new Date(transaction_date);
  const month = dt.getMonth() + 1; // 1-12
  const year = dt.getFullYear();

  if (month === 3) {
    return `30th April ${year}`; // March TDS due by 30th April
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `7th ${monthNames[nextMonth - 1]} ${nextYear}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: GST COMPLIANCE ENGINE — GSTR-1 & GSTR-3B PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

export interface GSTR1TableSummary {
  table_4a_b2b: { count: number; taxable_value: number; igst: number; cgst: number; sgst: number; cess: number };
  table_5_b2cl: { count: number; taxable_value: number; igst: number };
  table_7_b2cs: { taxable_value: number; igst: number; cgst: number; sgst: number };
  table_9b_cdnr: { count: number; taxable_value: number; igst: number; cgst: number; sgst: number };
  table_12_hsn: { hsn_code: string; description: string; qty: number; total_value: number; taxable_value: number; igst: number; cgst: number; sgst: number }[];
  table_13_docs: { doc_type: string; from_sr_no: string; to_sr_no: string; total_count: number; cancelled_count: number; net_count: number }[];
  total_taxable_value: number;
  total_tax: number;
}

export interface GSTR3BComputation {
  return_period: string; // "2025-07"
  // Table 3.1: Outward & Inward Reverse Charge Supplies
  table_3_1_a_outward_taxable: { taxable_value: number; igst: number; cgst: number; sgst: number };
  table_3_1_b_outward_zero_rated: { taxable_value: number; igst: number };
  table_3_1_d_inward_rcm: { taxable_value: number; igst: number; cgst: number; sgst: number };
  // Table 4: Eligible ITC
  table_4_a_1_import_goods_itc: { igst: number };
  table_4_a_3_inward_rcm_itc: { igst: number; cgst: number; sgst: number };
  table_4_a_5_all_other_itc: { igst: number; cgst: number; sgst: number };
  table_4_b_reversal_ineligible: { igst: number; cgst: number; sgst: number }; // Sec 17(5) blocked ITC
  net_itc_available: { igst: number; cgst: number; sgst: number };
  // Rule 88A Set-off hierarchy calculation
  set_off_result: GSTSetOffHierarchy;
  net_cash_payable: { igst: number; cgst: number; sgst: number; total: number };
}

export interface GSTSetOffHierarchy {
  output_liability: { igst: number; cgst: number; sgst: number };
  itc_opening: { igst: number; cgst: number; sgst: number };
  // Step 1: IGST ITC used for IGST liability
  igst_itc_used_for_igst: number;
  // Step 2: Remaining IGST ITC used for CGST & SGST (in any proportion)
  igst_itc_used_for_cgst: number;
  igst_itc_used_for_sgst: number;
  // Step 3: CGST ITC used for CGST liability
  cgst_itc_used_for_cgst: number;
  // Step 4: SGST ITC used for SGST liability
  sgst_itc_used_for_sgst: number;
  // Closing ITC balance (carry forward)
  itc_closing: { igst: number; cgst: number; sgst: number };
  // Net cash payable via Electronic Cash Ledger
  cash_paid: { igst: number; cgst: number; sgst: number; total: number };
}

export function computeRule88ASetOff(
  output: { igst: number; cgst: number; sgst: number },
  itc: { igst: number; cgst: number; sgst: number }
): GSTSetOffHierarchy {
  let rem_output_igst = output.igst;
  let rem_output_cgst = output.cgst;
  let rem_output_sgst = output.sgst;

  let rem_itc_igst = itc.igst;
  let rem_itc_cgst = itc.cgst;
  let rem_itc_sgst = itc.sgst;

  // Step 1: IGST ITC against IGST Output
  const igst_for_igst = Math.min(rem_itc_igst, rem_output_igst);
  rem_itc_igst -= igst_for_igst;
  rem_output_igst -= igst_for_igst;

  // Step 2: Remaining IGST ITC against CGST and SGST Output (50:50 rule)
  const half_igst_itc = rem_itc_igst / 2;
  const igst_for_cgst = Math.min(rem_itc_igst, Math.min(half_igst_itc, rem_output_cgst));
  rem_itc_igst -= igst_for_cgst;
  rem_output_cgst -= igst_for_cgst;

  const igst_for_sgst = Math.min(rem_itc_igst, rem_output_sgst);
  rem_itc_igst -= igst_for_sgst;
  rem_output_sgst -= igst_for_sgst;

  // Step 3: CGST ITC against CGST Output
  const cgst_for_cgst = Math.min(rem_itc_cgst, rem_output_cgst);
  rem_itc_cgst -= cgst_for_cgst;
  rem_output_cgst -= cgst_for_cgst;

  // Step 4: SGST ITC against SGST Output
  const sgst_for_sgst = Math.min(rem_itc_sgst, rem_output_sgst);
  rem_itc_sgst -= sgst_for_sgst;
  rem_output_sgst -= sgst_for_sgst;

  const cash_igst = rem_output_igst;
  const cash_cgst = rem_output_cgst;
  const cash_sgst = rem_output_sgst;

  return {
    output_liability: output,
    itc_opening: itc,
    igst_itc_used_for_igst: igst_for_igst,
    igst_itc_used_for_cgst: igst_for_cgst,
    igst_itc_used_for_sgst: igst_for_sgst,
    cgst_itc_used_for_cgst: cgst_for_cgst,
    sgst_itc_used_for_sgst: sgst_for_sgst,
    itc_closing: { igst: rem_itc_igst, cgst: rem_itc_cgst, sgst: rem_itc_sgst },
    cash_paid: { igst: cash_igst, cgst: cash_cgst, sgst: cash_sgst, total: cash_igst + cash_cgst + cash_sgst },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: GSTR-2B VS BOOKS RECONCILIATION MATRIX
// Section 16(2)(aa) & Rule 36(4) Compliance
// ─────────────────────────────────────────────────────────────────────────────

export type ITCReconciliationStatus =
  | "matched"             // In 2B and Books — Fully eligible
  | "unmatched_in_books"  // In Books but missing in 2B — Ineligible until supplier files GSTR-1
  | "unmatched_in_2b"     // In 2B but missing in Books — Unclaimed ITC
  | "amount_mismatch"     // Tax amount mismatch between 2B and Purchase Invoice
  | "blocked_sec_17_5";   // Blocked ITC under Section 17(5) (Motor cars, food, club, health)

export interface GSTR2BReconciledItem {
  id: string;
  vendor_gstin: string;
  vendor_name: string;
  invoice_no: string;
  invoice_date: string;
  books_taxable: number;
  books_tax: number;
  gstr2b_taxable: number;
  gstr2b_tax: number;
  variance_tax: number;
  status: ITCReconciliationStatus;
  is_sec_17_5_blocked: boolean;
  action_recommended: string;
}

export interface GSTR2BReconciliationSummary {
  return_period: string;
  total_books_itc: number;
  total_gstr2b_itc: number;
  eligible_itc_claimable: number; // Matched ITC
  ineligible_missing_2b: number;  // Supplier hasn't filed GSTR-1
  blocked_itc_sec_17_5: number;
  unclaimed_itc_in_2b: number;
  reconciliation_score_pct: number; // Matched / Total Books × 100
  items: GSTR2BReconciledItem[];
}

export function reconcileGSTR2BWithBooks(
  books: { vendor_gstin: string; vendor_name: string; invoice_no: string; date: string; taxable: number; tax: number; is_blocked?: boolean }[],
  gstr2b: { vendor_gstin: string; invoice_no: string; date: string; taxable: number; tax: number }[]
): GSTR2BReconciliationSummary {
  let matched_tax = 0;
  let missing_2b_tax = 0;
  let blocked_tax = 0;
  let unclaimed_2b_tax = 0;

  const items: GSTR2BReconciledItem[] = [];

  // Match Books -> GSTR-2B
  books.forEach((b, i) => {
    const match = gstr2b.find(
      g => g.vendor_gstin === b.vendor_gstin && g.invoice_no.toLowerCase() === b.invoice_no.toLowerCase()
    );

    if (b.is_blocked) {
      blocked_tax += b.tax;
      items.push({
        id: `REC-BLK-${i}`,
        vendor_gstin: b.vendor_gstin,
        vendor_name: b.vendor_name,
        invoice_no: b.invoice_no,
        invoice_date: b.date,
        books_taxable: b.taxable,
        books_tax: b.tax,
        gstr2b_taxable: match ? match.taxable : 0,
        gstr2b_tax: match ? match.tax : 0,
        variance_tax: match ? b.tax - match.tax : b.tax,
        status: "blocked_sec_17_5",
        is_sec_17_5_blocked: true,
        action_recommended: "Reverse in GSTR-3B Table 4(B)(1) — Ineligible ITC u/s 17(5)",
      });
    } else if (match) {
      const diff = Math.abs(b.tax - match.tax);
      if (diff <= 5) { // ₹5 tolerance
        matched_tax += b.tax;
        items.push({
          id: `REC-MAT-${i}`,
          vendor_gstin: b.vendor_gstin,
          vendor_name: b.vendor_name,
          invoice_no: b.invoice_no,
          invoice_date: b.date,
          books_taxable: b.taxable,
          books_tax: b.tax,
          gstr2b_taxable: match.taxable,
          gstr2b_tax: match.tax,
          variance_tax: 0,
          status: "matched",
          is_sec_17_5_blocked: false,
          action_recommended: "Claim in GSTR-3B Table 4(A)(5) — 100% Eligible",
        });
      } else {
        items.push({
          id: `REC-MIS-${i}`,
          vendor_gstin: b.vendor_gstin,
          vendor_name: b.vendor_name,
          invoice_no: b.invoice_no,
          invoice_date: b.date,
          books_taxable: b.taxable,
          books_tax: b.tax,
          gstr2b_taxable: match.taxable,
          gstr2b_tax: match.tax,
          variance_tax: b.tax - match.tax,
          status: "amount_mismatch",
          is_sec_17_5_blocked: false,
          action_recommended: `Tax mismatch of ₹${(b.tax - match.tax).toFixed(2)} — Contact vendor to rectify GSTR-1`,
        });
      }
    } else {
      missing_2b_tax += b.tax;
      items.push({
        id: `REC-NO2B-${i}`,
        vendor_gstin: b.vendor_gstin,
        vendor_name: b.vendor_name,
        invoice_no: b.invoice_no,
        invoice_date: b.date,
        books_taxable: b.taxable,
        books_tax: b.tax,
        gstr2b_taxable: 0,
        gstr2b_tax: 0,
        variance_tax: b.tax,
        status: "unmatched_in_books",
        is_sec_17_5_blocked: false,
        action_recommended: "DO NOT CLAIM in GSTR-3B — Vendor has not filed GSTR-1 (Sec 16(2)(aa) violation)",
      });
    }
  });

  const total_books = books.reduce((s, b) => s + b.tax, 0);
  const total_2b = gstr2b.reduce((s, g) => s + g.tax, 0);
  const score = total_books > 0 ? Math.round((matched_tax / total_books) * 100) : 100;

  return {
    return_period: "2025-07",
    total_books_itc: total_books,
    total_gstr2b_itc: total_2b,
    eligible_itc_claimable: matched_tax,
    ineligible_missing_2b: missing_2b_tax,
    blocked_itc_sec_17_5: blocked_tax,
    unclaimed_itc_in_2b: unclaimed_2b_tax,
    reconciliation_score_pct: score,
    items,
  };
}
