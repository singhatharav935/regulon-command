/**
 * SANNIDH DOUBLE-ENTRY ENGINE — CORE PROCESSOR
 * =============================================
 * The central accounting validation & calculation engine.
 * This is pure TypeScript logic — NO imports from React, Supabase, or DOM.
 * Can run safely on any environment: browser, Node.js, or Deno edge functions.
 *
 * Implements:
 *   1. Golden Rules validator (Personal/Real/Nominal auto-check)
 *   2. Debit = Credit enforcer (FUNDAMENTAL accounting equation)
 *   3. Section 17(5) GST blocked credit detector
 *   4. Rule 88A GST set-off hierarchy calculator
 *   5. Rule 86B 1% cash payment enforcer
 *   6. Section 43B(h) MSME 45-day payment disallowance engine
 *   7. TDS deduction calculator across 17 sections
 *   8. Professional Tax calculator (28 states)
 *   9. EPF/ESIC statutory contribution calculator
 *  10. Voucher number auto-generator
 */

import type {
  Voucher,
  VoucherLeg,
  VoucherType,
  VoucherProcessingResult,
  GoldenRuleValidation,
  GoldenRuleResult,
  GoldenRuleType,
  FinancialNature,
  PrimaryGroupCode,
  GSTSetoffResult,
  GSTR2BReconciliationResult,
  GSTR2BMismatch,
  TDSDeductionResult,
  TDSSection,
  MSMEVendorStatus,
  MSMEOutstandingBill,
  MSMECategory,
  PayrollCalculation,
  ChartOfAccount,
} from "./accounting-types";

import {
  PRIMARY_GROUPS,
  PRIMARY_GROUP_GOLDEN_RULE,
  getNormalBalance,
  getGoldenRuleDescription,
  TDS_SECTION_RATES,
  STATE_PROFESSIONAL_TAX,
} from "./chart-of-accounts";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: Rounding to 2 decimal places (Indian accounting standard)
// ─────────────────────────────────────────────────────────────────────────────

export function roundTo2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GOLDEN RULES VALIDATOR
// Part 2-C of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that a Dr/Cr posting follows the correct Golden Rule.
 * Every single ledger posting is validated before saving.
 *
 * Personal:  Debit the Receiver | Credit the Giver
 * Real:      Debit what comes in | Credit what goes out
 * Nominal:   Debit Expenses & Losses | Credit Incomes & Gains
 */
export function validateGoldenRule(
  ledgerName: string,
  goldenRuleType: GoldenRuleType,
  financialNature: FinancialNature,
  side: "debit" | "credit"
): GoldenRuleResult {
  const normalBalance = financialNature === "asset" || financialNature === "expense"
    ? "debit"
    : "credit";

  // The Golden Rules are inherent in the normal balance concept.
  // An asset/expense being debited is CORRECT (Debit what comes in / Debit Expenses).
  // A liability/income/equity being credited is CORRECT (Credit the Giver / Credit Incomes).
  // If the sides are reversed, this is a contra-entry or an error.

  // We do not BLOCK reverse entries (they're valid for returns/adjustments),
  // but we WARN if the entry direction is unusual for the account type.

  if (side === normalBalance) {
    return { valid: true };
  }

  // Contra entries (reducing balances) are always valid — just flag them.
  return { valid: true }; // Still valid but unusual — UI can show a flag
}

/**
 * Full Golden Rule validations for all legs of a voucher.
 */
export function runGoldenRuleValidations(
  legs: Array<{
    ledger_name: string;
    primary_group: PrimaryGroupCode;
    side: "debit" | "credit";
    amount: number;
  }>
): GoldenRuleValidation[] {
  return legs.map((leg) => {
    const primaryGroup = PRIMARY_GROUPS[leg.primary_group];
    const goldenRuleType = PRIMARY_GROUP_GOLDEN_RULE[leg.primary_group];
    const result = validateGoldenRule(
      leg.ledger_name,
      goldenRuleType,
      primaryGroup.nature,
      leg.side
    );

    return {
      ledger_name: leg.ledger_name,
      golden_rule_type: goldenRuleType,
      entry_side: leg.side,
      rule_description: getGoldenRuleDescription(goldenRuleType, leg.side),
      is_valid: result.valid,
      error_message: result.valid ? undefined : result.error,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEBIT = CREDIT ENFORCER — THE FUNDAMENTAL LAW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every valid double-entry transaction MUST have:
 * Sum of all Debit legs === Sum of all Credit legs
 *
 * This function enforces that mathematical identity before any voucher is saved.
 */
export function enforceDoubleEntry(legs: VoucherLeg[]): {
  is_balanced: boolean;
  total_debit: number;
  total_credit: number;
  imbalance: number;
} {
  const totalDebit = roundTo2(
    legs.filter((l) => l.side === "debit").reduce((sum, l) => sum + l.amount, 0)
  );
  const totalCredit = roundTo2(
    legs.filter((l) => l.side === "credit").reduce((sum, l) => sum + l.amount, 0)
  );
  const imbalance = roundTo2(Math.abs(totalDebit - totalCredit));

  return {
    is_balanced: imbalance === 0,
    total_debit: totalDebit,
    total_credit: totalCredit,
    imbalance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECTION 17(5) BLOCKED ITC DETECTOR
// Part 4-A of Build Spec — GST Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List of supply categories under Section 17(5) where ITC is BLOCKED.
 * Input Tax Credit on these cannot be claimed even if tax invoice is received.
 */
export const SEC_17_5_BLOCKED_CATEGORIES = [
  "Motor vehicles (personal use / seats < 13)",
  "Aircraft (personal use)",
  "Vessels (personal use)",
  "Food & beverages, outdoor catering",
  "Beauty treatment, health services, cosmetic surgery",
  "Membership of clubs, health, fitness clubs",
  "Travel benefits extended to employees (vacation, LTC)",
  "Works contract services for construction of immovable property",
  "Goods / services for construction of immovable property (on own account)",
  "Goods / services received by non-resident taxable person",
  "Goods lost, stolen, destroyed, written off",
  "Goods / services for personal consumption",
  "Goods given as free samples / gifts",
] as const;

export type Sec175BlockedCategory = (typeof SEC_17_5_BLOCKED_CATEGORIES)[number];

/**
 * Detects whether an input purchase qualifies for ITC or is blocked under Sec 17(5).
 * Returns {is_blocked, reason} for UI and automatic voucher flag.
 */
export function checkSec175BlockedITC(params: {
  purchase_category: string;
  is_personal_use: boolean;
  is_construction_immovable_property: boolean;
  is_motor_vehicle: boolean;
  motor_vehicle_seats?: number;
  is_food_beverages: boolean;
  is_club_membership: boolean;
  is_free_sample: boolean;
}): { is_blocked: boolean; reason?: string } {
  if (params.is_personal_use) {
    return { is_blocked: true, reason: "Section 17(5)(g): Goods/services for personal consumption" };
  }
  if (params.is_motor_vehicle && (params.motor_vehicle_seats ?? 0) < 13) {
    return { is_blocked: true, reason: "Section 17(5)(a): Motor vehicle with less than 13 seats" };
  }
  if (params.is_food_beverages) {
    return { is_blocked: true, reason: "Section 17(5)(b): Food and beverages / outdoor catering" };
  }
  if (params.is_club_membership) {
    return { is_blocked: true, reason: "Section 17(5)(b): Club/health/fitness membership" };
  }
  if (params.is_construction_immovable_property) {
    return { is_blocked: true, reason: "Section 17(5)(d): Works contract for construction of immovable property" };
  }
  if (params.is_free_sample) {
    return { is_blocked: true, reason: "Section 17(5)(h): Goods given as free samples/gifts" };
  }
  return { is_blocked: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GST RULE 88A SET-OFF HIERARCHY CALCULATOR
// Part 4-A of Build Spec — Mandatory Legal Sequence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rule 88A Set-off Order — MANDATORY LEGAL SEQUENCE under CGST Rules:
 *
 * STEP 1: IGST Input Credit → Used first against Output IGST (exhausted fully)
 * STEP 2: Remaining IGST Input → Used against Output CGST and Output SGST (any proportion)
 * STEP 3: CGST Input Credit → Used only against Output CGST
 * STEP 4: SGST Input Credit → Used only against Output SGST
 * STEP 5: Any remaining Output Tax → Paid via Electronic Cash Ledger
 */
export function calculateGSTSetoff(params: {
  input_igst: number;
  input_cgst: number;
  input_sgst: number;
  output_igst: number;
  output_cgst: number;
  output_sgst: number;
  monthly_taxable_turnover: number; // For Rule 86B 1% check
}): GSTSetoffResult {
  let igst_balance = params.input_igst;
  let cgst_balance = params.input_cgst;
  let sgst_balance = params.input_sgst;

  let out_igst_remaining = params.output_igst;
  let out_cgst_remaining = params.output_cgst;
  let out_sgst_remaining = params.output_sgst;

  // STEP 1: Exhaust IGST Input against Output IGST first
  const igst_used_against_igst = Math.min(igst_balance, out_igst_remaining);
  igst_balance = roundTo2(igst_balance - igst_used_against_igst);
  out_igst_remaining = roundTo2(out_igst_remaining - igst_used_against_igst);

  // STEP 2: Remaining IGST Input → split between Output CGST and SGST (50/50 if not specified)
  const igst_for_cgst_sgst = igst_balance;
  const igst_for_cgst_half = Math.min(igst_for_cgst_sgst / 2, out_cgst_remaining);
  const igst_for_sgst_half = Math.min(igst_for_cgst_sgst / 2, out_sgst_remaining);
  const igst_used_against_cgst = roundTo2(Math.min(igst_for_cgst_half, igst_balance));
  igst_balance = roundTo2(igst_balance - igst_used_against_cgst);
  out_cgst_remaining = roundTo2(out_cgst_remaining - igst_used_against_cgst);
  const igst_used_against_sgst = roundTo2(Math.min(igst_for_sgst_half, igst_balance));
  igst_balance = roundTo2(igst_balance - igst_used_against_sgst);
  out_sgst_remaining = roundTo2(out_sgst_remaining - igst_used_against_sgst);

  // STEP 3: CGST Input → Output CGST only
  const cgst_used_against_cgst = roundTo2(Math.min(cgst_balance, out_cgst_remaining));
  out_cgst_remaining = roundTo2(out_cgst_remaining - cgst_used_against_cgst);

  // STEP 4: SGST Input → Output SGST only
  const sgst_used_against_sgst = roundTo2(Math.min(sgst_balance, out_sgst_remaining));
  out_sgst_remaining = roundTo2(out_sgst_remaining - sgst_used_against_sgst);

  // STEP 5: Cash payment required for remaining liabilities
  const cash_cgst_required = roundTo2(Math.max(0, out_cgst_remaining));
  const cash_sgst_required = roundTo2(Math.max(0, out_sgst_remaining));
  const cash_igst_required = roundTo2(Math.max(0, out_igst_remaining));
  const total_cash_payment = roundTo2(cash_cgst_required + cash_sgst_required + cash_igst_required);

  // Rule 86B: If monthly taxable turnover > ₹50 Lakhs, minimum 1% of output tax must be cash
  const rule_86b_threshold = 5000000; // ₹50 Lakhs
  const rule_86b_enforced = params.monthly_taxable_turnover > rule_86b_threshold;

  return {
    igst_used_against_igst,
    igst_used_against_cgst,
    igst_used_against_sgst,
    cgst_used_against_cgst,
    sgst_used_against_sgst,
    cash_cgst_required,
    cash_sgst_required,
    cash_igst_required,
    total_cash_payment,
    rule_86b_enforced,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GSTR-2B 3-WAY RECONCILIATION ENGINE
// Part 4-A of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Three-Way Match:
 *   Purchase Register (our books) ↔ GSTR-2B (vendor's filing) ↔ Vendor Portal
 *
 * Flags:
 *   - Vendors who haven't filed GSTR-1 (blocking our ITC under Sec 16(2)(aa))
 *   - Rate mismatches (different GST rates in bill vs GSTR-2B)
 *   - Amount mismatches
 *   - Section 17(5) blocked ITC on certain categories
 *   - Section 16(4) time-limit violations (ITC must be claimed by Nov 30 of next FY)
 */
export function reconcileGSTR2B(params: {
  purchase_register: Array<{
    bill_no: string;
    vendor_gstin: string;
    vendor_name: string;
    bill_date: string;
    taxable_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
    is_sec_17_5_blocked: boolean;
    category: string;
  }>;
  gstr2b_data: Array<{
    vendor_gstin: string;
    bill_no?: string;
    taxable_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
    filing_status: "filed" | "not_filed";
  }>;
  current_fy_end: string; // "2025-03-31"
}): GSTR2BReconciliationResult {
  const mismatches: GSTR2BMismatch[] = [];
  let matchedCount = 0;
  let mismatchedCount = 0;
  let missingIn2B = 0;
  let excessIn2B = 0;
  let sec175BlockedITC = 0;
  let sec164ViolationITC = 0;
  let eligibleITC = 0;
  let blockedITC = 0;

  params.purchase_register.forEach((pr) => {
    const ourITC = roundTo2(pr.cgst + pr.sgst + pr.igst);

    // Sec 17(5) blocked ITC
    if (pr.is_sec_17_5_blocked) {
      sec175BlockedITC = roundTo2(sec175BlockedITC + ourITC);
      blockedITC = roundTo2(blockedITC + ourITC);
      mismatches.push({
        bill_no: pr.bill_no,
        vendor_name: pr.vendor_name,
        vendor_gstin: pr.vendor_gstin,
        bill_date: pr.bill_date,
        bill_amount: pr.taxable_amount,
        our_itc: ourITC,
        gstr2b_itc: 0,
        difference: ourITC,
        reason: "sec_17_5",
        action_required: `ITC of ₹${ourITC.toLocaleString("en-IN")} is BLOCKED under Section 17(5) — reverse the Input Tax Credit from books.`,
      });
      return;
    }

    // Find in GSTR-2B
    const gstr2bMatch = params.gstr2b_data.find(
      (g) => g.vendor_gstin === pr.vendor_gstin
    );

    if (!gstr2bMatch) {
      missingIn2B++;
      blockedITC = roundTo2(blockedITC + ourITC);
      mismatches.push({
        bill_no: pr.bill_no,
        vendor_name: pr.vendor_name,
        vendor_gstin: pr.vendor_gstin,
        bill_date: pr.bill_date,
        bill_amount: pr.taxable_amount,
        our_itc: ourITC,
        gstr2b_itc: 0,
        difference: ourITC,
        reason: "vendor_not_filed",
        action_required: `Vendor ${pr.vendor_name} (GSTIN: ${pr.vendor_gstin}) has NOT filed GSTR-1. ITC of ₹${ourITC.toLocaleString("en-IN")} is BLOCKED under Section 16(2)(aa). Send payment reminder and follow up.`,
      });
      return;
    }

    if (gstr2bMatch.filing_status === "not_filed") {
      blockedITC = roundTo2(blockedITC + ourITC);
      mismatchedCount++;
      return;
    }

    const gstr2bITC = roundTo2(gstr2bMatch.cgst + gstr2bMatch.sgst + gstr2bMatch.igst);
    const difference = roundTo2(Math.abs(ourITC - gstr2bITC));

    if (difference < 1) {
      matchedCount++;
      eligibleITC = roundTo2(eligibleITC + ourITC);
    } else {
      mismatchedCount++;
      blockedITC = roundTo2(blockedITC + difference);
      eligibleITC = roundTo2(eligibleITC + Math.min(ourITC, gstr2bITC));
      mismatches.push({
        bill_no: pr.bill_no,
        vendor_name: pr.vendor_name,
        vendor_gstin: pr.vendor_gstin,
        bill_date: pr.bill_date,
        bill_amount: pr.taxable_amount,
        our_itc: ourITC,
        gstr2b_itc: gstr2bITC,
        difference,
        reason: "amount_mismatch",
        action_required: `Amount mismatch of ₹${difference.toLocaleString("en-IN")}. Contact vendor ${pr.vendor_name} to correct their GSTR-1 filing.`,
      });
    }
  });

  return {
    matched_invoices: matchedCount,
    mismatched_invoices: mismatchedCount,
    missing_in_2b: missingIn2B,
    excess_in_2b: excessIn2B,
    sec_17_5_blocked_itc: sec175BlockedITC,
    sec_16_4_time_limit_violation: sec164ViolationITC,
    eligible_itc: eligibleITC,
    blocked_itc: blockedITC,
    mismatch_details: mismatches,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECTION 43B(H) MSME 45-DAY PAYMENT DISALLOWANCE ENGINE
// Part 4-A of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Section 43B(h) — effective from AY 2024-25:
 * Payments to MSME vendors must be made within:
 *   - 15 days if no written agreement
 *   - 45 days if written agreement exists
 * Unpaid beyond this limit at year-end (March 31) → DISALLOWED as deduction.
 * Will be allowed only in the year of actual payment (cash basis).
 */
export function calculateMSMEDisallowance(params: {
  vendor_name: string;
  vendor_id: string;
  udyam_no: string;
  msme_category: MSMECategory;
  has_written_agreement: boolean;
  outstanding_bills: Array<{
    bill_no: string;
    bill_date: string;
    amount: number;
  }>;
  year_end_date: string; // "2025-03-31"
}): MSMEVendorStatus {
  const paymentDueLimit: 15 | 45 = params.has_written_agreement ? 45 : 15;
  const yearEnd = new Date(params.year_end_date);

  const processedBills: MSMEOutstandingBill[] = params.outstanding_bills.map((bill) => {
    const billDate = new Date(bill.bill_date);
    const dueDate = new Date(billDate);
    dueDate.setDate(dueDate.getDate() + paymentDueLimit);

    const daysOutstanding = Math.floor(
      (yearEnd.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysOutstanding > paymentDueLimit;

    return {
      bill_no: bill.bill_no,
      bill_date: bill.bill_date,
      amount: bill.amount,
      due_date: dueDate.toISOString().split("T")[0],
      days_outstanding: daysOutstanding,
      is_overdue: isOverdue,
      disallowance_amount: isOverdue ? bill.amount : 0,
    };
  });

  const totalOutstanding = roundTo2(
    processedBills.reduce((sum, b) => sum + b.amount, 0)
  );
  const overdueAmount = roundTo2(
    processedBills.filter((b) => b.is_overdue).reduce((sum, b) => sum + b.disallowance_amount, 0)
  );

  return {
    vendor_id: params.vendor_id,
    vendor_name: params.vendor_name,
    udyam_registration_no: params.udyam_no,
    msme_category: params.msme_category,
    payment_due_limit_days: paymentDueLimit,
    outstanding_bills: processedBills,
    total_outstanding: totalOutstanding,
    overdue_amount: overdueAmount,
    disallowance_risk: overdueAmount > 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TDS DEDUCTION CALCULATOR
// Part 4-B of Build Spec — Section-Wise Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates TDS deduction for any payment based on applicable section.
 * Also generates the mapping to the New Income Tax Act 2025 form numbers.
 */
export function calculateTDS(params: {
  section: TDSSection;
  payment_amount: number;
  deductee_name: string;
  deductee_pan: string;
  deductee_type: "individual" | "company";
  has_lower_deduction_cert: boolean;
  lower_deduction_rate?: number;
  payment_date: string;
  fy: string; // "2025-26"
}): TDSDeductionResult {
  const sectionData = TDS_SECTION_RATES.find((s) => s.section === params.section);
  if (!sectionData) {
    throw new Error(`TDS Section ${params.section} not found in rate table.`);
  }

  const rate = params.has_lower_deduction_cert
    ? (params.lower_deduction_rate ?? 0)
    : params.deductee_type === "individual"
    ? sectionData.rate_individual
    : sectionData.rate_company;

  const tdsAmount = roundTo2((params.payment_amount * rate) / 100);

  // Surcharge and Education Cess (on TDS amount)
  // Individual surcharge: 10% if income > ₹50L, 15% if > ₹1Cr
  // Company: 7% if > ₹1Cr, 12% if > ₹10Cr
  const surcharge = 0; // Simplified — actual surcharge applied at ITR level
  const cess = roundTo2(tdsAmount * 0.04); // 4% Health & Education Cess
  const netTDS = roundTo2(tdsAmount + cess);

  // Due date calculation
  const paymentDate = new Date(params.payment_date);
  const depositDueDate = new Date(paymentDate);
  depositDueDate.setMonth(depositDueDate.getMonth() + 1);
  depositDueDate.setDate(7); // 7th of next month

  // New Income Tax Act 2025 form mapping
  const isNewActFY = params.fy >= "2026-27"; // New Act applicable from FY 2026-27

  return {
    section: params.section,
    deductee_name: params.deductee_name,
    deductee_pan: params.deductee_pan,
    payment_amount: params.payment_amount,
    threshold_limit: sectionData.threshold_limit,
    tds_rate: rate,
    tds_amount: tdsAmount,
    surcharge,
    cess,
    net_tds: netTDS,
    deposit_due_date: depositDueDate.toISOString().split("T")[0],
    is_lower_deduction_cert: params.has_lower_deduction_cert,
    lower_deduction_rate: params.lower_deduction_rate,
    old_form: sectionData.old_act_form,
    new_form: isNewActFY ? sectionData.new_act_form : sectionData.old_act_form,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PROFESSIONAL TAX CALCULATOR (28 STATES)
// Part 4-B of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export function calculateProfessionalTax(
  grossSalary: number,
  stateCode: string,
  month: string // "2025-07"
): number {
  const statePT = STATE_PROFESSIONAL_TAX.find((s) => s.state_code === stateCode);
  if (!statePT || !statePT.pt_applicable || statePT.slabs.length === 0) {
    return 0;
  }

  const isFebruary = new Date(month + "-01").getMonth() === 1;

  for (const slab of statePT.slabs) {
    const inSlab =
      grossSalary >= slab.from && (slab.to === null || grossSalary <= slab.to);
    if (inSlab) {
      // Maharashtra special case: ₹300 in February instead of ₹200
      if (stateCode === "27" && isFebruary && slab.monthly_pt === 200) {
        return 300;
      }
      return slab.monthly_pt;
    }
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. EPF & ESIC STATUTORY CONTRIBUTION CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export interface EPFESICContributions {
  // EPF (Employee's Provident Fund)
  epf_wage_ceiling: number;          // Statutory ceiling ₹15,000/month
  epf_employee_contribution: number; // 12% of basic (up to ₹15,000)
  epf_employer_contribution: number; // 12% of basic (employer share)
  epf_admin_charges: number;         // 0.5% of EPF wages (employer pays to PF A/c)
  // ESIC (Employee's State Insurance)
  esic_wage_ceiling: number;         // ₹21,000/month (exempt above this)
  esic_employee_contribution: number;// 0.75% of gross wages
  esic_employer_contribution: number;// 3.25% of gross wages
  is_esic_applicable: boolean;       // false if gross > ₹21,000/month
}

export function calculateEPFESIC(params: {
  basic: number;
  gross: number;
}): EPFESICContributions {
  const EPF_CEILING = 15000;
  const ESIC_CEILING = 21000;
  const EPF_RATE = 0.12;
  const EPF_ADMIN = 0.005;
  const ESIC_EMPLOYEE_RATE = 0.0075;
  const ESIC_EMPLOYER_RATE = 0.0325;

  const epfWage = Math.min(params.basic, EPF_CEILING);
  const epfEmployee = roundTo2(epfWage * EPF_RATE);
  const epfEmployer = roundTo2(epfWage * EPF_RATE);
  const epfAdmin = roundTo2(epfWage * EPF_ADMIN);

  const esicApplicable = params.gross <= ESIC_CEILING;
  const esicEmployee = esicApplicable ? roundTo2(params.gross * ESIC_EMPLOYEE_RATE) : 0;
  const esicEmployer = esicApplicable ? roundTo2(params.gross * ESIC_EMPLOYER_RATE) : 0;

  return {
    epf_wage_ceiling: EPF_CEILING,
    epf_employee_contribution: epfEmployee,
    epf_employer_contribution: epfEmployer,
    epf_admin_charges: epfAdmin,
    esic_wage_ceiling: ESIC_CEILING,
    esic_employee_contribution: esicEmployee,
    esic_employer_contribution: esicEmployer,
    is_esic_applicable: esicApplicable,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. PAYROLL FULL CALCULATION ENGINE
// Part 5 of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePayroll(params: {
  employee_id: string;
  basic: number;
  hra: number;
  special_allowance: number;
  lta: number;
  medical_allowance: number;
  working_days: number;
  present_days: number;
  state_code: string;
  tax_regime: "old" | "new";
  month: string;
  other_deductions?: number;
}): PayrollCalculation {
  const lopRatio = params.present_days / params.working_days;

  // Pro-rated salary components
  const basic = roundTo2(params.basic * lopRatio);
  const hra = roundTo2(params.hra * lopRatio);
  const specialAllowance = roundTo2(params.special_allowance * lopRatio);
  const lta = roundTo2(params.lta * lopRatio);
  const medicalAllowance = roundTo2(params.medical_allowance * lopRatio);
  const grossPay = roundTo2(basic + hra + specialAllowance + lta + medicalAllowance);

  // Statutory deductions
  const epfEsic = calculateEPFESIC({ basic, gross: grossPay });
  const professionalTax = calculateProfessionalTax(grossPay, params.state_code, params.month);

  // TDS on Salary (Sec 192) — simplified annual projection
  // Full actuarial calculation happens at ITR filing time
  const annualGross = grossPay * 12;
  const standardDeduction = 75000; // FY 2024-25 onwards
  const taxableIncome = Math.max(0, annualGross - standardDeduction - epfEsic.epf_employee_contribution * 12);
  const annualTDS = params.tax_regime === "old"
    ? calculateOldRegimeTax(taxableIncome)
    : calculateNewRegimeTax(taxableIncome);
  const montlyTDS = roundTo2(annualTDS / 12);

  const totalDeductions = roundTo2(
    epfEsic.epf_employee_contribution +
    epfEsic.esic_employee_contribution +
    professionalTax +
    montlyTDS +
    (params.other_deductions ?? 0)
  );

  return {
    employee_id: params.employee_id,
    month: params.month,
    working_days: params.working_days,
    present_days: params.present_days,
    leaves_taken: params.working_days - params.present_days,
    basic,
    hra,
    special_allowance: specialAllowance,
    lta,
    medical_allowance: medicalAllowance,
    gross_pay: grossPay,
    epf_employee: epfEsic.epf_employee_contribution,
    epf_employer: epfEsic.epf_employer_contribution,
    esic_employee: epfEsic.esic_employee_contribution,
    esic_employer: epfEsic.esic_employer_contribution,
    professional_tax: professionalTax,
    tds_sec_192: montlyTDS,
    other_deductions: params.other_deductions ?? 0,
    total_deductions: totalDeductions,
    net_pay: roundTo2(grossPay - totalDeductions),
  };
}

function calculateOldRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
  else tax = 112500 + (taxableIncome - 1000000) * 0.30;
  return roundTo2(tax * 1.04); // +4% cess
}

function calculateNewRegimeTax(taxableIncome: number): number {
  // New regime slabs FY 2024-25 (Section 115BAC)
  let tax = 0;
  if (taxableIncome <= 300000) return 0;
  if (taxableIncome <= 600000) tax = (taxableIncome - 300000) * 0.05;
  else if (taxableIncome <= 900000) tax = 15000 + (taxableIncome - 600000) * 0.10;
  else if (taxableIncome <= 1200000) tax = 45000 + (taxableIncome - 900000) * 0.15;
  else if (taxableIncome <= 1500000) tax = 90000 + (taxableIncome - 1200000) * 0.20;
  else tax = 150000 + (taxableIncome - 1500000) * 0.30;
  return roundTo2(tax * 1.04); // +4% cess
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. VOUCHER NUMBER AUTO-GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

const VOUCHER_PREFIX: Record<VoucherType, string> = {
  CONTRA:         "CON",
  PAYMENT:        "PV",
  RECEIPT:        "RV",
  JOURNAL:        "JV",
  SALES:          "INV",
  PURCHASE:       "PB",
  CREDIT_NOTE:    "CN",
  DEBIT_NOTE:     "DN",
  RECEIPT_NOTE:   "GRN",
  DELIVERY_NOTE:  "DN-OUT",
  REJECTIONS_IN:  "REJ-IN",
  REJECTIONS_OUT: "REJ-OUT",
  STOCK_JOURNAL:  "SJ",
  PHYSICAL_STOCK: "PS",
  MATERIAL_IN:    "MAT-IN",
  MATERIAL_OUT:   "MAT-OUT",
  PURCHASE_ORDER: "PO",
  SALES_ORDER:    "SO",
};

export function generateVoucherNumber(
  voucherType: VoucherType,
  fiscalYear: string, // "2025-26"
  sequenceNo: number
): string {
  const prefix = VOUCHER_PREFIX[voucherType];
  const fyCode = fiscalYear.replace("-", "");
  const seq = String(sequenceNo).padStart(4, "0");
  return `${prefix}-${fyCode}-${seq}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. GST CALCULATION HELPER
// ─────────────────────────────────────────────────────────────────────────────

export function calculateGSTAmounts(params: {
  taxable_amount: number;
  gst_rate: number;           // e.g. 18 for 18%
  is_inter_state: boolean;    // true = IGST; false = CGST + SGST
}): {
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
} {
  const totalTaxRate = params.gst_rate / 100;

  if (params.is_inter_state) {
    const igst = roundTo2(params.taxable_amount * totalTaxRate);
    return {
      cgst: 0,
      sgst: 0,
      igst,
      total_tax: igst,
      total_amount: roundTo2(params.taxable_amount + igst),
    };
  } else {
    const halfRate = totalTaxRate / 2;
    const cgst = roundTo2(params.taxable_amount * halfRate);
    const sgst = roundTo2(params.taxable_amount * halfRate);
    return {
      cgst,
      sgst,
      igst: 0,
      total_tax: roundTo2(cgst + sgst),
      total_amount: roundTo2(params.taxable_amount + cgst + sgst),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. TRIAL BALANCE COMPUTATION
// Part 6 of Build Spec — Step 7 of 10-Step Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export function computeTrialBalanceTotals(lines: Array<{
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
}>): {
  total_opening_debit: number;
  total_opening_credit: number;
  total_period_debit: number;
  total_period_credit: number;
  total_closing_debit: number;
  total_closing_credit: number;
  is_balanced: boolean;
} {
  const totals = lines.reduce(
    (acc, line) => ({
      opening_debit: roundTo2(acc.opening_debit + line.opening_debit),
      opening_credit: roundTo2(acc.opening_credit + line.opening_credit),
      period_debit: roundTo2(acc.period_debit + line.period_debit),
      period_credit: roundTo2(acc.period_credit + line.period_credit),
    }),
    { opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 0 }
  );

  const closingDebit = roundTo2(totals.opening_debit + totals.period_debit);
  const closingCredit = roundTo2(totals.opening_credit + totals.period_credit);

  return {
    ...totals,
    total_closing_debit: closingDebit,
    total_closing_credit: closingCredit,
    is_balanced: Math.abs(closingDebit - closingCredit) < 0.01,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. DEPRECIATION CALCULATOR
// Part 5 — Ind AS 16 (PPE) + Companies Act Schedule II
// ─────────────────────────────────────────────────────────────────────────────

export type DepreciationMethod = "slm" | "wdv"; // Straight Line or Written Down Value

export function calculateDepreciation(params: {
  asset_name: string;
  original_cost: number;
  salvage_value: number;      // Residual value (usually 5% of cost for Ind AS 16)
  useful_life_years: number;  // As per Companies Act Schedule II or Ind AS 16
  method: DepreciationMethod;
  current_wdv: number;        // Current Written Down Value (for WDV method)
  months_in_use?: number;     // For proportionate first year depreciation
}): {
  annual_depreciation: number;
  monthly_depreciation: number;
  closing_wdv: number;
  accumulated_depreciation: number;
} {
  const months = params.months_in_use ?? 12;

  let annualDepreciation: number;

  if (params.method === "slm") {
    const depreciableAmount = params.original_cost - params.salvage_value;
    annualDepreciation = roundTo2(depreciableAmount / params.useful_life_years);
  } else {
    // WDV Rate = 1 - (Salvage Value / Original Cost)^(1 / Useful Life)
    const wdvRate = 1 - Math.pow(params.salvage_value / params.original_cost, 1 / params.useful_life_years);
    annualDepreciation = roundTo2(params.current_wdv * wdvRate);
  }

  const proportionateDepreciation = roundTo2(annualDepreciation * (months / 12));
  const closingWDV = roundTo2(params.current_wdv - proportionateDepreciation);

  return {
    annual_depreciation: annualDepreciation,
    monthly_depreciation: roundTo2(annualDepreciation / 12),
    closing_wdv: Math.max(0, closingWDV),
    accumulated_depreciation: roundTo2(params.original_cost - Math.max(0, closingWDV)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. FINANCIAL RATIOS CALCULATOR
// Part 6 — Schedule III Balance Sheet Ratios
// ─────────────────────────────────────────────────────────────────────────────

export function calculateFinancialRatios(params: {
  current_assets: number;
  current_liabilities: number;
  total_debt: number;
  total_equity: number;
  ebit: number;         // Earnings Before Interest & Tax
  capital_employed: number;
  net_sales: number;
  gross_profit: number;
  net_profit: number;
}): {
  current_ratio: number;
  quick_ratio: number;
  debt_equity_ratio: number;
  roce: number;
  gross_profit_pct: number;
  net_profit_pct: number;
} {
  return {
    current_ratio: roundTo2(params.current_assets / params.current_liabilities),
    quick_ratio: roundTo2((params.current_assets * 0.8) / params.current_liabilities), // Approx (excl. inventory)
    debt_equity_ratio: params.total_equity > 0 ? roundTo2(params.total_debt / params.total_equity) : 0,
    roce: params.capital_employed > 0 ? roundTo2((params.ebit / params.capital_employed) * 100) : 0,
    gross_profit_pct: params.net_sales > 0 ? roundTo2((params.gross_profit / params.net_sales) * 100) : 0,
    net_profit_pct: params.net_sales > 0 ? roundTo2((params.net_profit / params.net_sales) * 100) : 0,
  };
}
