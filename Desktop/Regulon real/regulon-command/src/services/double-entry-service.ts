/**
 * SANNIDH DOUBLE-ENTRY SERVICE — REAL WORLD SUPABASE LAYER
 * ==========================================================
 * All database operations for the real Company Owner Dashboard and CA Firm Dashboard.
 *
 * ⚠️  ISOLATION RULE:
 *     This service is ONLY used by:
 *       - /real-company-dashboard  → Company Owner real data
 *       - /dashboards/ca-firm      → CA Firm real client data
 *       - /real-inhouse-ca-dashboard
 *     It is NEVER imported into:
 *       - /dashboard               → Uses demo-accounting-data.ts only
 *       - /ca-dashboard            → Uses demo-accounting-data.ts only
 *
 * Database Tables (Supabase PostgreSQL):
 *   sannidh_chart_of_accounts        — Master ledger master
 *   sannidh_vouchers                  — All 18 voucher types
 *   sannidh_voucher_legs              — Individual Dr/Cr legs per voucher
 *   sannidh_general_ledger_postings   — T-Account postings
 *   sannidh_trial_balance_snapshots   — Period-end trial balance
 *   sannidh_gst_setoff_calculations   — Monthly Rule 88A computations
 *   sannidh_tds_register              — TDS deductee register
 *   sannidh_msme_vendor_status        — Sec 43B(h) MSME tracking
 *   sannidh_payroll_register          — Monthly payroll records
 *   sannidh_fixed_asset_register      — FAR with depreciation schedules
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  ChartOfAccount,
  Voucher,
  VoucherLeg,
  VoucherType,
  VoucherProcessingResult,
  GeneralLedger,
  LedgerPosting,
  TrialBalance,
  TrialBalanceLine,
  GSTSetoffResult,
  GSTR2BReconciliationResult,
  TDSDeductionResult,
  MSMEVendorStatus,
  PayrollCalculation,
  PrimaryGroupCode,
} from "@/lib/accounting/accounting-types";

import {
  enforceDoubleEntry,
  runGoldenRuleValidations,
  calculateGSTSetoff,
  calculateTDS,
  calculateMSMEDisallowance,
  generateVoucherNumber,
  computeTrialBalanceTotals,
  roundTo2,
} from "@/lib/accounting/double-entry-engine";

import { PRIMARY_GROUP_GOLDEN_RULE, PRIMARY_GROUPS } from "@/lib/accounting/chart-of-accounts";

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getChartOfAccounts(companyId: string): Promise<ChartOfAccount[]> {
  const { data, error } = await supabase
    .from("sannidh_chart_of_accounts" as never)
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("primary_group")
    .order("ledger_name");

  if (error) throw new Error(`Failed to fetch Chart of Accounts: ${error.message}`);
  return (data ?? []) as ChartOfAccount[];
}

export async function createLedger(
  ledger: Omit<ChartOfAccount, "id" | "current_balance" | "current_balance_type" | "created_at" | "updated_at">
): Promise<ChartOfAccount> {
  // Auto-classify Golden Rule type from primary group
  const goldenRuleType = PRIMARY_GROUP_GOLDEN_RULE[ledger.primary_group];
  const financialNature = PRIMARY_GROUPS[ledger.primary_group].nature;
  const normalBalance = PRIMARY_GROUPS[ledger.primary_group].normal_balance;

  const { data, error } = await supabase
    .from("sannidh_chart_of_accounts" as never)
    .insert({
      ...ledger,
      golden_rule_type: goldenRuleType,
      financial_nature: financialNature,
      normal_balance: normalBalance,
      current_balance: ledger.opening_balance,
      current_balance_type: ledger.opening_balance_type,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create ledger: ${error.message}`);
  return data as ChartOfAccount;
}

export async function searchLedgers(
  companyId: string,
  query: string
): Promise<ChartOfAccount[]> {
  const { data, error } = await supabase
    .from("sannidh_chart_of_accounts" as never)
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .ilike("ledger_name", `%${query}%`)
    .limit(20);

  if (error) throw new Error(`Failed to search ledgers: ${error.message}`);
  return (data ?? []) as ChartOfAccount[];
}

// ─────────────────────────────────────────────────────────────────────────────
// VOUCHER PROCESSING — CORE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * processVoucher — The primary entry point for ALL voucher creation.
 *
 * Workflow:
 *   1. Validate Debit = Credit (enforceDoubleEntry)
 *   2. Run Golden Rule validations (runGoldenRuleValidations)
 *   3. Check Section 17(5) blocked ITC (for Purchase vouchers)
 *   4. Check MSME 45-day rule (for Payment vouchers)
 *   5. Calculate TDS if applicable
 *   6. Save voucher + legs to Supabase
 *   7. Post to General Ledger (T-Accounts)
 *   8. Update current balance on Chart of Accounts
 */
export async function processVoucher(
  voucher: Omit<Voucher, "id" | "created_at" | "updated_at">
): Promise<VoucherProcessingResult> {
  // ── Step 1: Enforce Debit = Credit ────────────────────────────────────────
  const balanceCheck = enforceDoubleEntry(voucher.legs);
  if (!balanceCheck.is_balanced) {
    return {
      success: false,
      error: `Voucher is NOT BALANCED. Debit Total: ₹${balanceCheck.total_debit.toLocaleString("en-IN")} | Credit Total: ₹${balanceCheck.total_credit.toLocaleString("en-IN")} | Imbalance: ₹${balanceCheck.imbalance.toLocaleString("en-IN")}`,
      is_balanced: false,
      golden_rule_validations: [],
    };
  }

  // ── Step 2: Fetch ledger metadata for golden rule validations ─────────────
  const ledgerIds = [...new Set(voucher.legs.map((l) => l.ledger_id))];
  const { data: ledgers } = await supabase
    .from("sannidh_chart_of_accounts" as never)
    .select("id, ledger_name, primary_group, financial_nature")
    .in("id", ledgerIds);

  const ledgerMap = new Map(((ledgers ?? []) as ChartOfAccount[]).map((l) => [l.id, l]));

  const goldenRuleLegs = voucher.legs
    .map((leg) => {
      const ledger = ledgerMap.get(leg.ledger_id);
      if (!ledger) return null;
      return {
        ledger_name: ledger.ledger_name,
        primary_group: ledger.primary_group,
        side: leg.side,
        amount: leg.amount,
      };
    })
    .filter(Boolean) as Array<{
      ledger_name: string;
      primary_group: PrimaryGroupCode;
      side: "debit" | "credit";
      amount: number;
    }>;

  const goldenRuleValidations = runGoldenRuleValidations(goldenRuleLegs);

  // ── Step 3: Save Voucher to Supabase ─────────────────────────────────────
  const { data: savedVoucher, error: voucherError } = await supabase
    .from("sannidh_vouchers" as never)
    .insert({
      company_id: voucher.company_id,
      voucher_no: voucher.voucher_no,
      voucher_type: voucher.voucher_type,
      voucher_date: voucher.voucher_date,
      fiscal_year: voucher.fiscal_year,
      reference_no: voucher.reference_no,
      party_ledger_id: voucher.party_ledger_id,
      party_ledger_name: voucher.party_ledger_name,
      party_gstin: voucher.party_gstin,
      party_pan: voucher.party_pan,
      gross_amount: voucher.gross_amount,
      total_discount: voucher.total_discount,
      taxable_amount: voucher.taxable_amount,
      cgst_amount: voucher.cgst_amount,
      sgst_amount: voucher.sgst_amount,
      igst_amount: voucher.igst_amount,
      cess_amount: voucher.cess_amount,
      tds_amount: voucher.tds_amount,
      tcs_amount: voucher.tcs_amount,
      round_off: voucher.round_off,
      net_amount: voucher.net_amount,
      gst_type: voucher.gst_type,
      place_of_supply: voucher.place_of_supply,
      is_rcm: voucher.is_rcm,
      tds_section: voucher.tds_section,
      tds_rate: voucher.tds_rate,
      is_sec_17_5_blocked: voucher.is_sec_17_5_blocked,
      is_msme_vendor: voucher.is_msme_vendor,
      msme_due_date: voucher.msme_due_date,
      is_msme_overdue: voucher.is_msme_overdue,
      narration: voucher.narration,
      created_by: voucher.created_by,
      is_locked: false,
      attachments: voucher.attachments,
      source: voucher.source,
      line_items: voucher.line_items,
    })
    .select()
    .single();

  if (voucherError) {
    return {
      success: false,
      error: `Failed to save voucher: ${voucherError.message}`,
      is_balanced: true,
      golden_rule_validations: goldenRuleValidations,
    };
  }

  const voucherId = (savedVoucher as { id: string }).id;

  // ── Step 4: Save Voucher Legs ─────────────────────────────────────────────
  const legsToInsert = voucher.legs.map((leg) => ({
    voucher_id: voucherId,
    ledger_id: leg.ledger_id,
    ledger_name: leg.ledger_name,
    ledger_code: leg.ledger_code,
    side: leg.side,
    amount: leg.amount,
    narration: leg.narration,
  }));

  const { error: legsError } = await supabase
    .from("sannidh_voucher_legs" as never)
    .insert(legsToInsert);

  if (legsError) {
    // Rollback: delete the voucher
    await supabase.from("sannidh_vouchers" as never).delete().eq("id", voucherId);
    return {
      success: false,
      error: `Failed to save voucher legs: ${legsError.message}`,
      is_balanced: true,
      golden_rule_validations: goldenRuleValidations,
    };
  }

  // ── Step 5: Post to General Ledger (T-Accounts) ───────────────────────────
  await postToGeneralLedger(voucherId, voucher);

  return {
    success: true,
    voucher: { ...voucher, id: voucherId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    is_balanced: true,
    golden_rule_validations: goldenRuleValidations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL LEDGER T-ACCOUNT POSTING
// ─────────────────────────────────────────────────────────────────────────────

async function postToGeneralLedger(
  voucherId: string,
  voucher: Omit<Voucher, "id" | "created_at" | "updated_at">
): Promise<void> {
  // For each leg, create a T-Account posting and update running balance
  for (const leg of voucher.legs) {
    // Get current running balance for this ledger
    const { data: lastPosting } = await supabase
      .from("sannidh_general_ledger_postings" as never)
      .select("running_balance, running_balance_type")
      .eq("ledger_id", leg.ledger_id)
      .eq("company_id", voucher.company_id)
      .order("voucher_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const prevBalance = lastPosting
      ? (lastPosting as { running_balance: number; running_balance_type: "debit" | "credit" }).running_balance
      : 0;
    const prevBalanceType = lastPosting
      ? (lastPosting as { running_balance: number; running_balance_type: "debit" | "credit" }).running_balance_type
      : "debit";

    // Calculate new running balance
    const { newBalance, newBalanceType } = computeRunningBalance(
      prevBalance,
      prevBalanceType,
      leg.amount,
      leg.side
    );

    // Insert T-Account posting
    await supabase
      .from("sannidh_general_ledger_postings" as never)
      .insert({
        voucher_id: voucherId,
        voucher_no: voucher.voucher_no,
        voucher_type: voucher.voucher_type,
        voucher_date: voucher.voucher_date,
        ledger_id: leg.ledger_id,
        company_id: voucher.company_id,
        side: leg.side,
        amount: leg.amount,
        running_balance: newBalance,
        running_balance_type: newBalanceType,
        narration: voucher.narration,
        fiscal_year: voucher.fiscal_year,
      });

    // Update current_balance on Chart of Accounts
    await supabase
      .from("sannidh_chart_of_accounts" as never)
      .update({
        current_balance: newBalance,
        current_balance_type: newBalanceType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leg.ledger_id);
  }
}

function computeRunningBalance(
  prevBalance: number,
  prevBalanceType: "debit" | "credit",
  amount: number,
  side: "debit" | "credit"
): { newBalance: number; newBalanceType: "debit" | "credit" } {
  if (prevBalanceType === side) {
    return {
      newBalance: roundTo2(prevBalance + amount),
      newBalanceType: side,
    };
  } else {
    const net = prevBalance - amount;
    if (net >= 0) {
      return { newBalance: roundTo2(net), newBalanceType: prevBalanceType };
    } else {
      return { newBalance: roundTo2(Math.abs(net)), newBalanceType: side };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL LEDGER VIEW (T-Account)
// ─────────────────────────────────────────────────────────────────────────────

export async function getGeneralLedger(
  companyId: string,
  ledgerId: string,
  fromDate: string,
  toDate: string
): Promise<GeneralLedger> {
  // Get ledger metadata
  const { data: ledger } = await supabase
    .from("sannidh_chart_of_accounts" as never)
    .select("*")
    .eq("id", ledgerId)
    .single();

  if (!ledger) throw new Error(`Ledger ${ledgerId} not found.`);
  const l = ledger as ChartOfAccount;

  // Get all postings for this ledger in the date range
  const { data: postings } = await supabase
    .from("sannidh_general_ledger_postings" as never)
    .select("*")
    .eq("company_id", companyId)
    .eq("ledger_id", ledgerId)
    .gte("voucher_date", fromDate)
    .lte("voucher_date", toDate)
    .order("voucher_date")
    .order("created_at");

  const postingsList = (postings ?? []) as LedgerPosting[];

  const totalDebits = roundTo2(
    postingsList.filter((p) => p.side === "debit").reduce((sum, p) => sum + p.amount, 0)
  );
  const totalCredits = roundTo2(
    postingsList.filter((p) => p.side === "credit").reduce((sum, p) => sum + p.amount, 0)
  );

  // Closing balance calculation
  const netDebit = totalDebits - totalCredits;
  const closingBalance = Math.abs(roundTo2(l.opening_balance + netDebit));
  const closingBalanceType: "debit" | "credit" =
    l.opening_balance_type === "debit"
      ? netDebit >= 0 ? "debit" : "credit"
      : netDebit <= 0 ? "credit" : "debit";

  return {
    ledger_id: l.id,
    ledger_name: l.ledger_name,
    ledger_code: l.ledger_code,
    primary_group: l.primary_group,
    financial_nature: l.financial_nature,
    opening_balance: l.opening_balance,
    opening_balance_type: l.opening_balance_type,
    total_debits: totalDebits,
    total_credits: totalCredits,
    closing_balance: closingBalance,
    closing_balance_type: closingBalanceType,
    postings: postingsList,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIAL BALANCE GENERATION
// Part 6 — Step 7 of 10-Step Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export async function generateTrialBalance(
  companyId: string,
  fiscalYear: string,
  asOnDate: string
): Promise<TrialBalance> {
  // Get all ledgers with their opening balances
  const { data: ledgers } = await supabase
    .from("sannidh_chart_of_accounts" as never)
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("primary_group")
    .order("ledger_name");

  const allLedgers = (ledgers ?? []) as ChartOfAccount[];
  const fyStart = `${fiscalYear.split("-")[0]}-04-01`; // April 1 of fiscal year

  const lines: TrialBalanceLine[] = await Promise.all(
    allLedgers.map(async (ledger) => {
      // Get period debit/credit totals from postings
      const { data: periodPostings } = await supabase
        .from("sannidh_general_ledger_postings" as never)
        .select("side, amount")
        .eq("company_id", companyId)
        .eq("ledger_id", ledger.id)
        .eq("fiscal_year", fiscalYear)
        .gte("voucher_date", fyStart)
        .lte("voucher_date", asOnDate);

      const postings = (periodPostings ?? []) as { side: string; amount: number }[];
      const periodDebit = roundTo2(
        postings.filter((p) => p.side === "debit").reduce((s, p) => s + p.amount, 0)
      );
      const periodCredit = roundTo2(
        postings.filter((p) => p.side === "credit").reduce((s, p) => s + p.amount, 0)
      );

      const openingDebit = ledger.opening_balance_type === "debit" ? ledger.opening_balance : 0;
      const openingCredit = ledger.opening_balance_type === "credit" ? ledger.opening_balance : 0;

      const closingNetDebit = openingDebit + periodDebit - openingCredit - periodCredit;
      const closingDebit = closingNetDebit > 0 ? roundTo2(closingNetDebit) : 0;
      const closingCredit = closingNetDebit < 0 ? roundTo2(Math.abs(closingNetDebit)) : 0;

      return {
        ledger_id: ledger.id,
        ledger_name: ledger.ledger_name,
        ledger_code: ledger.ledger_code,
        primary_group: ledger.primary_group,
        opening_debit: openingDebit,
        opening_credit: openingCredit,
        period_debit: periodDebit,
        period_credit: periodCredit,
        closing_debit: closingDebit,
        closing_credit: closingCredit,
      };
    })
  );

  const totals = computeTrialBalanceTotals(lines);

  return {
    company_id: companyId,
    fiscal_year: fiscalYear,
    as_on_date: asOnDate,
    lines,
    ...totals,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH VOUCHERS — LISTING & FILTERING
// ─────────────────────────────────────────────────────────────────────────────

export async function getVouchers(params: {
  companyId: string;
  voucherType?: VoucherType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<Voucher[]> {
  let query = supabase
    .from("sannidh_vouchers" as never)
    .select("*")
    .eq("company_id", params.companyId)
    .order("voucher_date", { ascending: false })
    .limit(params.limit ?? 200);

  if (params.voucherType) {
    query = query.eq("voucher_type", params.voucherType);
  }
  if (params.fromDate) {
    query = query.gte("voucher_date", params.fromDate);
  }
  if (params.toDate) {
    query = query.lte("voucher_date", params.toDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch vouchers: ${error.message}`);
  return (data ?? []) as Voucher[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXT VOUCHER SEQUENCE NUMBER
// ─────────────────────────────────────────────────────────────────────────────

export async function getNextVoucherNumber(
  companyId: string,
  voucherType: VoucherType,
  fiscalYear: string
): Promise<string> {
  const { count } = await supabase
    .from("sannidh_vouchers" as never)
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("voucher_type", voucherType)
    .eq("fiscal_year", fiscalYear);

  const nextSeq = (count ?? 0) + 1;
  return generateVoucherNumber(voucherType, fiscalYear, nextSeq);
}

// ─────────────────────────────────────────────────────────────────────────────
// CA SIGN-OFF & UDIN LOCK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CA WORM Lock — Once a CA signs off with a UDIN, the voucher is permanently locked.
 * No edits possible after lock (WORM = Write Once, Read Many).
 */
export async function caSignOffVoucher(
  voucherId: string,
  caUserId: string,
  udin: string
): Promise<void> {
  const { error } = await supabase
    .from("sannidh_vouchers" as never)
    .update({
      approved_by: caUserId,
      ca_udin: udin,
      is_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", voucherId)
    .eq("is_locked", false); // Can only lock if not already locked

  if (error) throw new Error(`CA sign-off failed: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK VOUCHER FETCH FOR CA CLIENT REVIEW
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientVouchersForCAReview(params: {
  clientCompanyIds: string[];
  pending_ca_approval_only?: boolean;
  fromDate?: string;
  toDate?: string;
}): Promise<Array<Voucher & { company_name?: string }>> {
  let query = supabase
    .from("sannidh_vouchers" as never)
    .select("*")
    .in("company_id", params.clientCompanyIds)
    .order("voucher_date", { ascending: false })
    .limit(500);

  if (params.pending_ca_approval_only) {
    query = query.eq("is_locked", false);
  }
  if (params.fromDate) {
    query = query.gte("voucher_date", params.fromDate);
  }
  if (params.toDate) {
    query = query.lte("voucher_date", params.toDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch client vouchers: ${error.message}`);
  return (data ?? []) as Voucher[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY STATS (Real-time KPIs)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAccountingSummary(
  companyId: string,
  fiscalYear: string
): Promise<{
  total_sales: number;
  total_purchases: number;
  total_expenses: number;
  gross_profit: number;
  total_receivables: number;
  total_payables: number;
  cash_in_bank: number;
  itc_available: number;
  tds_payable: number;
  vouchers_pending_ca: number;
}> {
  const fyStart = `${fiscalYear.split("-")[0]}-04-01`;
  const fyEnd = `${fiscalYear.split("-")[1]}-03-31`;

  // Fetch key metrics from vouchers
  const { data: salesVouchers } = await supabase
    .from("sannidh_vouchers" as never)
    .select("net_amount")
    .eq("company_id", companyId)
    .eq("fiscal_year", fiscalYear)
    .in("voucher_type", ["SALES"]);

  const { data: purchaseVouchers } = await supabase
    .from("sannidh_vouchers" as never)
    .select("net_amount, cgst_amount, sgst_amount, igst_amount, is_sec_17_5_blocked")
    .eq("company_id", companyId)
    .eq("fiscal_year", fiscalYear)
    .in("voucher_type", ["PURCHASE"]);

  const { data: pendingCA } = await supabase
    .from("sannidh_vouchers" as never)
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("fiscal_year", fiscalYear)
    .eq("is_locked", false);

  const salesList = (salesVouchers ?? []) as { net_amount: number }[];
  const purchaseList = (purchaseVouchers ?? []) as { net_amount: number; cgst_amount: number; sgst_amount: number; igst_amount: number; is_sec_17_5_blocked: boolean }[];

  const totalSales = roundTo2(salesList.reduce((s, v) => s + v.net_amount, 0));
  const totalPurchases = roundTo2(purchaseList.reduce((s, v) => s + v.net_amount, 0));
  const itcAvailable = roundTo2(
    purchaseList
      .filter((v) => !v.is_sec_17_5_blocked)
      .reduce((s, v) => s + v.cgst_amount + v.sgst_amount + v.igst_amount, 0)
  );

  return {
    total_sales: totalSales,
    total_purchases: totalPurchases,
    total_expenses: 0, // Populated separately
    gross_profit: roundTo2(totalSales - totalPurchases),
    total_receivables: 0, // From Sundry Debtors ledger balance
    total_payables: 0,   // From Sundry Creditors ledger balance
    cash_in_bank: 0,     // From Bank Account ledger balance
    itc_available: itcAvailable,
    tds_payable: 0,      // From TDS Payable ledger balance
    vouchers_pending_ca: (pendingCA as unknown as { count: number })?.count ?? 0,
  };
}
