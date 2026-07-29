/**
 * SANNIDH CHART OF ACCOUNTS — MASTER TAXONOMY
 * =============================================
 * 15 Primary Groups + 13 Secondary Groups with full financial nature.
 * Golden Rules auto-classifier.
 * All 40 Banking Scenario Templates.
 *
 * This file is PURE DATA — zero imports, no side effects.
 * Used by BOTH real and demo dashboards for reference lookup.
 */

import type {
  PrimaryGroup,
  PrimaryGroupCode,
  SecondaryGroup,
  SecondaryGroupCode,
  GoldenRuleType,
  FinancialNature,
  VoucherTypeMeta,
  VoucherType,
  BankingScenarioTemplate,
  BusinessModelConfig,
  BusinessModelType,
} from "./accounting-types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. THE 15 PRIMARY GROUPS
// Part 2-A of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY_GROUPS: Record<PrimaryGroupCode, PrimaryGroup> = {
  CAPITAL_ACCOUNT: {
    code: "CAPITAL_ACCOUNT",
    name: "Capital Account",
    nature: "liability_or_equity",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "credit",
  },
  LOANS_LIABILITIES: {
    code: "LOANS_LIABILITIES",
    name: "Loans (Liabilities)",
    nature: "liability",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "credit",
  },
  CURRENT_LIABILITIES: {
    code: "CURRENT_LIABILITIES",
    name: "Current Liabilities",
    nature: "liability",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "credit",
  },
  FIXED_ASSETS: {
    code: "FIXED_ASSETS",
    name: "Fixed Assets",
    nature: "asset",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "debit",
  },
  INVESTMENTS: {
    code: "INVESTMENTS",
    name: "Investments",
    nature: "asset",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "debit",
  },
  CURRENT_ASSETS: {
    code: "CURRENT_ASSETS",
    name: "Current Assets",
    nature: "asset",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "debit",
  },
  MISC_EXPENSES_ASSETS: {
    code: "MISC_EXPENSES_ASSETS",
    name: "Miscellaneous Expenses (Assets)",
    nature: "asset",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "debit",
  },
  SUSPENSE_ACCOUNT: {
    code: "SUSPENSE_ACCOUNT",
    name: "Suspense Account",
    nature: "liability_or_asset",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "debit",
  },
  BRANCH_DIVISION: {
    code: "BRANCH_DIVISION",
    name: "Branch / Division",
    nature: "liability_or_asset",
    affects_bs: true,
    affects_pl: false,
    normal_balance: "debit",
  },
  SALES_ACCOUNT: {
    code: "SALES_ACCOUNT",
    name: "Sales Account",
    nature: "income",
    affects_bs: false,
    affects_pl: true,
    normal_balance: "credit",
  },
  PURCHASE_ACCOUNT: {
    code: "PURCHASE_ACCOUNT",
    name: "Purchase Account",
    nature: "expense",
    affects_bs: false,
    affects_pl: true,
    normal_balance: "debit",
  },
  DIRECT_INCOME: {
    code: "DIRECT_INCOME",
    name: "Direct Income",
    nature: "income",
    affects_bs: false,
    affects_pl: true,
    normal_balance: "credit",
  },
  DIRECT_EXPENSES: {
    code: "DIRECT_EXPENSES",
    name: "Direct Expenses",
    nature: "expense",
    affects_bs: false,
    affects_pl: true,
    normal_balance: "debit",
  },
  INDIRECT_INCOME: {
    code: "INDIRECT_INCOME",
    name: "Indirect Income",
    nature: "income",
    affects_bs: false,
    affects_pl: true,
    normal_balance: "credit",
  },
  INDIRECT_EXPENSES: {
    code: "INDIRECT_EXPENSES",
    name: "Indirect Expenses",
    nature: "expense",
    affects_bs: false,
    affects_pl: true,
    normal_balance: "debit",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. THE 13 SECONDARY GROUPS
// Part 2-B of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export const SECONDARY_GROUPS: Record<SecondaryGroupCode, SecondaryGroup> = {
  RESERVES_SURPLUS: {
    code: "RESERVES_SURPLUS",
    name: "Reserves & Surplus",
    parent_primary: "CAPITAL_ACCOUNT",
    nature: "equity",
  },
  BANK_OVERDRAFT: {
    code: "BANK_OVERDRAFT",
    name: "Bank OD Accounts",
    parent_primary: "LOANS_LIABILITIES",
    nature: "liability",
  },
  SECURED_LOANS: {
    code: "SECURED_LOANS",
    name: "Secured Loans",
    parent_primary: "LOANS_LIABILITIES",
    nature: "liability",
  },
  UNSECURED_LOANS: {
    code: "UNSECURED_LOANS",
    name: "Unsecured Loans",
    parent_primary: "LOANS_LIABILITIES",
    nature: "liability",
  },
  DUTIES_TAXES: {
    code: "DUTIES_TAXES",
    name: "Duties & Taxes",
    parent_primary: "CURRENT_LIABILITIES",
    nature: "liability",
  },
  PROVISIONS: {
    code: "PROVISIONS",
    name: "Provisions",
    parent_primary: "CURRENT_LIABILITIES",
    nature: "liability",
  },
  SUNDRY_CREDITORS: {
    code: "SUNDRY_CREDITORS",
    name: "Sundry Creditors",
    parent_primary: "CURRENT_LIABILITIES",
    nature: "liability",
  },
  SUNDRY_DEBTORS: {
    code: "SUNDRY_DEBTORS",
    name: "Sundry Debtors",
    parent_primary: "CURRENT_ASSETS",
    nature: "asset",
  },
  DEPOSIT_ASSETS: {
    code: "DEPOSIT_ASSETS",
    name: "Deposits (Assets)",
    parent_primary: "CURRENT_ASSETS",
    nature: "asset",
  },
  LOANS_ADVANCE_ASSETS: {
    code: "LOANS_ADVANCE_ASSETS",
    name: "Loans & Advances (Assets)",
    parent_primary: "CURRENT_ASSETS",
    nature: "asset",
  },
  CASH_IN_HAND: {
    code: "CASH_IN_HAND",
    name: "Cash-in-Hand",
    parent_primary: "CURRENT_ASSETS",
    nature: "asset",
  },
  STOCK_IN_HAND: {
    code: "STOCK_IN_HAND",
    name: "Stock-in-Hand",
    parent_primary: "CURRENT_ASSETS",
    nature: "asset",
  },
  BANK_ACCOUNTS: {
    code: "BANK_ACCOUNTS",
    name: "Bank Accounts",
    parent_primary: "CURRENT_ASSETS",
    nature: "asset",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GOLDEN RULES AUTO-CLASSIFIER
// Part 2-C of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps Primary Group → Golden Rule Type automatically.
 * Used by the engine to validate every Dr/Cr entry.
 *
 * Personal Accounts → Debit the Receiver, Credit the Giver.
 * Real Accounts     → Debit what comes in, Credit what goes out.
 * Nominal Accounts  → Debit all Expenses & Losses, Credit all Incomes & Gains.
 */
export const PRIMARY_GROUP_GOLDEN_RULE: Record<PrimaryGroupCode, GoldenRuleType> = {
  CAPITAL_ACCOUNT:     "personal",   // Owner's capital is personal
  LOANS_LIABILITIES:   "personal",   // Banks/lenders are personal accounts
  CURRENT_LIABILITIES: "personal",   // Creditors, statutory payables are personal
  FIXED_ASSETS:        "real",       // PPE, intangibles are real accounts
  INVESTMENTS:         "real",       // Financial investments are real
  CURRENT_ASSETS:      "real",       // Cash, bank, debtors, stock are real
  MISC_EXPENSES_ASSETS: "nominal",   // Preliminary/fictitious assets → nominal
  SUSPENSE_ACCOUNT:    "personal",   // Temporary personal account
  BRANCH_DIVISION:     "personal",   // Branch is treated as personal
  SALES_ACCOUNT:       "nominal",    // Revenue → nominal (Credit = Income)
  PURCHASE_ACCOUNT:    "nominal",    // Purchases → nominal (Debit = Expense)
  DIRECT_INCOME:       "nominal",    // Direct income → nominal
  DIRECT_EXPENSES:     "nominal",    // Direct expenses → nominal
  INDIRECT_INCOME:     "nominal",    // Indirect income → nominal
  INDIRECT_EXPENSES:   "nominal",    // Indirect expenses → nominal
};

/**
 * getGoldenRuleType — Derives golden rule type from primary group code.
 */
export function getGoldenRuleType(primaryGroup: PrimaryGroupCode): GoldenRuleType {
  return PRIMARY_GROUP_GOLDEN_RULE[primaryGroup];
}

/**
 * getFinancialNature — Returns financial nature for a primary group.
 */
export function getFinancialNature(primaryGroup: PrimaryGroupCode): FinancialNature {
  return PRIMARY_GROUPS[primaryGroup].nature;
}

/**
 * getNormalBalance — Returns the normal balance side for a primary group.
 * Asset/Expense groups → Debit normal balance.
 * Liability/Equity/Income groups → Credit normal balance.
 */
export function getNormalBalance(primaryGroup: PrimaryGroupCode): "debit" | "credit" {
  return PRIMARY_GROUPS[primaryGroup].normal_balance;
}

/**
 * getGoldenRuleDescription — Returns the human-readable rule for any entry.
 */
export function getGoldenRuleDescription(
  goldenRuleType: GoldenRuleType,
  side: "debit" | "credit"
): string {
  if (goldenRuleType === "personal") {
    return side === "debit"
      ? "Personal Account: Debit the Receiver"
      : "Personal Account: Credit the Giver";
  }
  if (goldenRuleType === "real") {
    return side === "debit"
      ? "Real Account: Debit what comes in"
      : "Real Account: Credit what goes out";
  }
  // nominal
  return side === "debit"
    ? "Nominal Account: Debit all Expenses & Losses"
    : "Nominal Account: Credit all Incomes & Gains";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 18 VOUCHER TYPE METADATA REGISTRY
// Part 3-A of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export const VOUCHER_TYPE_REGISTRY: Record<VoucherType, VoucherTypeMeta> = {
  CONTRA: {
    type: "CONTRA",
    category: "accounting",
    shortcut: "F4",
    affects_ledger: true,
    affects_inventory: false,
    is_order: false,
    description: "Internal Cash ↔ Bank transfers, Bank ↔ Bank transfers",
  },
  PAYMENT: {
    type: "PAYMENT",
    category: "accounting",
    shortcut: "F5",
    affects_ledger: true,
    affects_inventory: false,
    is_order: false,
    description: "All outgoing money (vendor payments, expenses, tax deposits, salaries)",
  },
  RECEIPT: {
    type: "RECEIPT",
    category: "accounting",
    shortcut: "F6",
    affects_ledger: true,
    affects_inventory: false,
    is_order: false,
    description: "All incoming money (customer receipts, loans received, interest income)",
  },
  JOURNAL: {
    type: "JOURNAL",
    category: "accounting",
    shortcut: "F7",
    affects_ledger: true,
    affects_inventory: false,
    is_order: false,
    description: "Non-cash adjustments, year-end provisions, depreciation, cheque bounces",
  },
  SALES: {
    type: "SALES",
    category: "accounting",
    shortcut: "F8",
    affects_ledger: true,
    affects_inventory: true,
    is_order: false,
    description: "Tax Invoices & Supply Bills (Intra-state, Inter-state, Exports, SEZ)",
  },
  PURCHASE: {
    type: "PURCHASE",
    category: "accounting",
    shortcut: "F9",
    affects_ledger: true,
    affects_inventory: true,
    is_order: false,
    description: "Procurement Invoices & Supplier Bills",
  },
  CREDIT_NOTE: {
    type: "CREDIT_NOTE",
    category: "accounting",
    shortcut: "Ctrl+F8",
    affects_ledger: true,
    affects_inventory: true,
    is_order: false,
    description: "Sales Returns, Post-sale Discounts, Rate Adjustments",
  },
  DEBIT_NOTE: {
    type: "DEBIT_NOTE",
    category: "accounting",
    shortcut: "Ctrl+F9",
    affects_ledger: true,
    affects_inventory: true,
    is_order: false,
    description: "Purchase Returns, Supplier Price Adjustments, Penalty Levies",
  },
  RECEIPT_NOTE: {
    type: "RECEIPT_NOTE",
    category: "inventory",
    shortcut: "Alt+F9",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "GRN — Inward goods receipt from vendor before Purchase bill",
  },
  DELIVERY_NOTE: {
    type: "DELIVERY_NOTE",
    category: "inventory",
    shortcut: "Alt+F8",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Outward dispatch to customer before Sales invoice",
  },
  REJECTIONS_IN: {
    type: "REJECTIONS_IN",
    category: "inventory",
    shortcut: "Ctrl+F6",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Goods returned by customer prior to Credit Note",
  },
  REJECTIONS_OUT: {
    type: "REJECTIONS_OUT",
    category: "inventory",
    shortcut: "Ctrl+F5",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Goods returned to supplier prior to Debit Note",
  },
  STOCK_JOURNAL: {
    type: "STOCK_JOURNAL",
    category: "inventory",
    shortcut: "Alt+F7",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Inter-warehouse stock transfers & Manufacturing BOM Consumption",
  },
  PHYSICAL_STOCK: {
    type: "PHYSICAL_STOCK",
    category: "inventory",
    shortcut: "Alt+F10",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Physical audit variance adjustments",
  },
  MATERIAL_IN: {
    type: "MATERIAL_IN",
    category: "inventory",
    shortcut: "",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Job work inward inventory receipt",
  },
  MATERIAL_OUT: {
    type: "MATERIAL_OUT",
    category: "inventory",
    shortcut: "",
    affects_ledger: false,
    affects_inventory: true,
    is_order: false,
    description: "Job work outward inventory dispatch",
  },
  PURCHASE_ORDER: {
    type: "PURCHASE_ORDER",
    category: "order",
    shortcut: "Alt+F4",
    affects_ledger: false,
    affects_inventory: false,
    is_order: true,
    description: "Formal procurement order to vendor",
  },
  SALES_ORDER: {
    type: "SALES_ORDER",
    category: "order",
    shortcut: "Alt+F5",
    affects_ledger: false,
    affects_inventory: false,
    is_order: true,
    description: "Confirmed customer order",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. 40 BANKING ENTRY SCENARIO TEMPLATES
// Part 3-B of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export const BANKING_SCENARIO_TEMPLATES: BankingScenarioTemplate[] = [
  { scenario: "cash_deposited_to_bank",         description: "Cash Deposited into Bank",                       voucher_type: "CONTRA",   shortcut: "F4", debit_ledger: "Bank A/c",                 credit_ledger: "Cash-in-Hand",             narration_template: "Cash deposited into {bank_name} — Rs. {amount}" },
  { scenario: "cash_withdrawn_office",           description: "Cash Withdrawn for Office Use",                  voucher_type: "CONTRA",   shortcut: "F4", debit_ledger: "Cash-in-Hand",              credit_ledger: "Bank A/c",                 narration_template: "Cash withdrawn from {bank_name} for office use — Rs. {amount}" },
  { scenario: "cash_withdrawn_personal",         description: "Cash Withdrawn for Personal/Drawings",           voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Drawings A/c",              credit_ledger: "Bank A/c",                 narration_template: "Cash withdrawn for personal use by {owner_name} — Rs. {amount}" },
  { scenario: "cheque_received_from_customer",   description: "Cheque Received from Customer",                  voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Cheque-in-Hand A/c",        credit_ledger: "{Customer A/c}",           narration_template: "Cheque no. {cheque_no} received from {customer_name} against {invoice_no}" },
  { scenario: "cheque_deposited_for_collection", description: "Cheque Deposited for Collection",                voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Cheque-in-Hand A/c",       narration_template: "Cheque no. {cheque_no} deposited in {bank_name} for collection" },
  { scenario: "cheque_cleared_by_bank",          description: "Cheque Cleared by Bank",                         voucher_type: "JOURNAL",  shortcut: "F7", debit_ledger: "Bank A/c",                  credit_ledger: "Cheque Clearing A/c",      narration_template: "Cheque no. {cheque_no} cleared by bank on {date}" },
  { scenario: "cheque_issued_to_supplier",       description: "Cheque Issued to Supplier",                      voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "{Supplier A/c}",            credit_ledger: "Bank A/c",                 narration_template: "Cheque no. {cheque_no} issued to {supplier_name} against {bill_no}" },
  { scenario: "bank_charges_deducted",           description: "Bank Charges Deducted by Bank",                  voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Bank Charges A/c",          credit_ledger: "Bank A/c",                 narration_template: "Bank charges deducted by {bank_name} — Rs. {amount}" },
  { scenario: "bank_interest_credited",          description: "Interest Credited by Bank",                      voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Interest Received A/c",    narration_template: "Interest credited by {bank_name} for {period}" },
  { scenario: "bank_interest_debited",           description: "Interest Debited by Bank on Loan/OD",            voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Interest Paid A/c",          credit_ledger: "Bank A/c",                 narration_template: "Interest charged by {bank_name} on {loan_type} for {period}" },
  { scenario: "bank_commission_charged",         description: "Bank Commission/Service Charges",                voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Bank Commission A/c",        credit_ledger: "Bank A/c",                 narration_template: "Bank commission charged by {bank_name} — Rs. {amount}" },
  { scenario: "loan_emi_payment",                description: "Loan EMI Payment (Principal + Interest split)",  voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Loan A/c + Interest Exp",   credit_ledger: "Bank A/c",                 narration_template: "EMI paid to {bank_name} — Principal Rs. {principal}, Interest Rs. {interest}" },
  { scenario: "bank_loan_received",              description: "Bank Loan/Term Loan Received",                   voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Bank Loan A/c",            narration_template: "Term loan of Rs. {amount} received from {bank_name} — Loan A/c no. {loan_no}" },
  { scenario: "bank_loan_repaid",                description: "Bank Loan Principal Repaid",                     voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Bank Loan A/c",             credit_ledger: "Bank A/c",                 narration_template: "Loan principal Rs. {amount} repaid to {bank_name} — Loan A/c no. {loan_no}" },
  { scenario: "neft_rtgs_received_from_customer",description: "Customer Payment via NEFT/RTGS/IMPS",            voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "{Customer A/c}",           narration_template: "NEFT/RTGS of Rs. {amount} received from {customer_name} — UTR {utr_no}" },
  { scenario: "neft_rtgs_paid_to_supplier",      description: "Supplier Payment via NEFT/RTGS/IMPS",            voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "{Supplier A/c}",            credit_ledger: "Bank A/c",                 narration_template: "NEFT/RTGS of Rs. {amount} paid to {supplier_name} — UTR {utr_no}" },
  { scenario: "salary_paid_bank",                description: "Salary Paid through Bank Transfer",              voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Salaries & Wages A/c",      credit_ledger: "Bank A/c",                 narration_template: "Salary for {month} paid to {employee_name} — Net Rs. {amount}" },
  { scenario: "rent_paid_bank",                  description: "Rent Paid through Bank",                         voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Rent Expense A/c",           credit_ledger: "Bank A/c",                 narration_template: "Rent for {month} paid to {landlord_name} — Rs. {amount}" },
  { scenario: "electricity_bill_paid",           description: "Electricity Bill Paid",                          voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Electricity Expenses A/c",   credit_ledger: "Bank A/c",                 narration_template: "Electricity bill for {month} paid to {discom_name} — Rs. {amount}" },
  { scenario: "telephone_internet_paid",         description: "Telephone / Internet Bill Paid",                 voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Telephone Expenses A/c",     credit_ledger: "Bank A/c",                 narration_template: "Telephone/Internet bill for {month} — Rs. {amount}" },
  { scenario: "office_expenses_paid",            description: "General Office Expenses Paid",                   voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Office Expenses A/c",        credit_ledger: "Bank A/c",                 narration_template: "Office expenses — {description} — Rs. {amount}" },
  { scenario: "insurance_premium_paid",          description: "Insurance Premium Paid",                         voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Insurance Premium A/c",      credit_ledger: "Bank A/c",                 narration_template: "Insurance premium for policy {policy_no} — Rs. {amount}" },
  { scenario: "gst_payment_bank",                description: "GST Paid to Government via Bank",                voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "GST Payable A/c",            credit_ledger: "Bank A/c",                 narration_template: "GST payment for {period} — CGST Rs. {cgst} + SGST Rs. {sgst} + IGST Rs. {igst}" },
  { scenario: "tds_deposited",                   description: "TDS Deposited to Government",                    voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "TDS Payable A/c",            credit_ledger: "Bank A/c",                 narration_template: "TDS deposit u/s {section} for {period} — Challan no. {challan_no}" },
  { scenario: "advance_received_from_customer",  description: "Advance Received from Customer",                 voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Advance from Customer A/c",narration_template: "Advance received from {customer_name} against order {order_no} — Rs. {amount}" },
  { scenario: "advance_paid_to_supplier",        description: "Advance Paid to Supplier",                       voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Advance to Supplier A/c",   credit_ledger: "Bank A/c",                 narration_template: "Advance paid to {supplier_name} against PO {po_no} — Rs. {amount}" },
  { scenario: "tax_refund_received",             description: "Income Tax / GST Refund Received",               voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Tax Refund Receivable A/c",narration_template: "Tax refund for AY/Period {period} received — Rs. {amount}" },
  { scenario: "dividend_received",               description: "Dividend Received on Investments",                voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Dividend Income A/c",      narration_template: "Dividend received on {investment_name} — Rs. {amount}" },
  { scenario: "fd_created",                      description: "Fixed Deposit Created",                           voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Fixed Deposit A/c",         credit_ledger: "Bank A/c",                 narration_template: "FD created with {bank_name} — FD no. {fd_no} — Rs. {amount}" },
  { scenario: "fd_matured",                      description: "Fixed Deposit Matured (Principal + Interest)",   voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "FD A/c + Interest Income", narration_template: "FD no. {fd_no} matured — Principal Rs. {principal}, Interest Rs. {interest}" },
  { scenario: "bank_od_received",                description: "Bank Overdraft / CC Limit Utilised",             voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Bank Overdraft A/c",       narration_template: "OD facility of Rs. {amount} utilised from {bank_name}" },
  { scenario: "bank_od_repaid",                  description: "Bank Overdraft Repaid",                           voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Bank Overdraft A/c",        credit_ledger: "Bank A/c",                 narration_template: "OD of Rs. {amount} repaid to {bank_name}" },
  { scenario: "credit_card_bill_paid",           description: "Credit Card Outstanding Bill Paid",               voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "Credit Card Payable A/c",   credit_ledger: "Bank A/c",                 narration_template: "Credit card bill for {month} paid — Card ending {last4} — Rs. {amount}" },
  { scenario: "pos_card_settlement",             description: "POS Card Settlement Received",                    voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "POS/Card Sales Clearing",  narration_template: "POS settlement for {date} — Rs. {amount} net of MDR Rs. {mdr}" },
  { scenario: "upi_payment_received",            description: "UPI Payment Received from Customer",              voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "{Customer/Sales A/c}",     narration_template: "UPI payment of Rs. {amount} received from {party_name} — UPI ref {ref}" },
  { scenario: "upi_payment_made",                description: "UPI Payment Made to Supplier/Expense",            voucher_type: "PAYMENT",  shortcut: "F5", debit_ledger: "{Supplier/Expense A/c}",    credit_ledger: "Bank A/c",                 narration_template: "UPI payment of Rs. {amount} made to {party_name} — UPI ref {ref}" },
  { scenario: "bank_charges_reversed",           description: "Bank Charges Reversed/Credited Back",             voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "Bank Charges A/c",         narration_template: "Bank charges of Rs. {amount} reversed by {bank_name}" },
  { scenario: "customer_cheque_bounced",         description: "Customer Cheque Dishonoured / Bounced",           voucher_type: "JOURNAL",  shortcut: "F7", debit_ledger: "{Customer A/c}",            credit_ledger: "Bank A/c",                 narration_template: "Cheque no. {cheque_no} of Rs. {amount} from {customer_name} returned dishonoured" },
  { scenario: "supplier_cheque_bounced",         description: "Cheque Issued to Supplier Returned",              voucher_type: "JOURNAL",  shortcut: "F7", debit_ledger: "Bank A/c",                  credit_ledger: "{Supplier A/c}",           narration_template: "Our cheque no. {cheque_no} of Rs. {amount} to {supplier_name} returned dishonoured" },
  { scenario: "direct_deposit_by_customer",      description: "Direct Bank Deposit by Customer",                 voucher_type: "RECEIPT",  shortcut: "F6", debit_ledger: "Bank A/c",                  credit_ledger: "{Customer A/c}",           narration_template: "Direct deposit of Rs. {amount} by {customer_name} — Ref {ref}" },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. PROFESSIONAL TAX — 28 STATE SLABS
// ─────────────────────────────────────────────────────────────────────────────

export interface PTSlab {
  from: number;
  to: number | null; // null = no upper limit
  monthly_pt: number;
}

export interface StatePT {
  state_code: string;
  state_name: string;
  pt_applicable: boolean;
  frequency: "monthly" | "annual" | "half_yearly";
  slabs: PTSlab[];
}

export const STATE_PROFESSIONAL_TAX: StatePT[] = [
  {
    state_code: "27", state_name: "Maharashtra", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,      to: 7500,  monthly_pt: 0 },
      { from: 7501,   to: 10000, monthly_pt: 175 },
      { from: 10001,  to: null,  monthly_pt: 200 }, // 300 in February
    ],
  },
  {
    state_code: "19", state_name: "West Bengal", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 10000, monthly_pt: 0 },
      { from: 10001, to: 15000, monthly_pt: 110 },
      { from: 15001, to: 25000, monthly_pt: 130 },
      { from: 25001, to: 40000, monthly_pt: 150 },
      { from: 40001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "29", state_name: "Karnataka", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 15000, monthly_pt: 0 },
      { from: 15001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "33", state_name: "Tamil Nadu", pt_applicable: true, frequency: "half_yearly",
    slabs: [
      { from: 0,      to: 21000, monthly_pt: 0 },
      { from: 21001,  to: 30000, monthly_pt: 135 },
      { from: 30001,  to: 45000, monthly_pt: 315 },
      { from: 45001,  to: 60000, monthly_pt: 690 },
      { from: 60001,  to: 75000, monthly_pt: 1025 },
      { from: 75001,  to: null,  monthly_pt: 1250 },
    ],
  },
  {
    state_code: "36", state_name: "Andhra Pradesh", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 15000, monthly_pt: 0 },
      { from: 15001, to: 20000, monthly_pt: 150 },
      { from: 20001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "37", state_name: "Telangana", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 15000, monthly_pt: 0 },
      { from: 15001, to: 20000, monthly_pt: 150 },
      { from: 20001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "24", state_name: "Gujarat", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 12000, monthly_pt: 0 },
      { from: 12001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "03", state_name: "Punjab", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 7500,  monthly_pt: 0 },
      { from: 7501,  to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "23", state_name: "Madhya Pradesh", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 18750, monthly_pt: 0 },
      { from: 18751, to: null,  monthly_pt: 208 },
    ],
  },
  {
    state_code: "22", state_name: "Chhattisgarh", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 12000, monthly_pt: 0 },
      { from: 12001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "21", state_name: "Odisha", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 5000,  monthly_pt: 0 },
      { from: 5001,  to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "32", state_name: "Kerala", pt_applicable: true, frequency: "half_yearly",
    slabs: [
      { from: 0,     to: 11999, monthly_pt: 0 },
      { from: 12000, to: 17999, monthly_pt: 120 },
      { from: 18000, to: 29999, monthly_pt: 180 },
      { from: 30000, to: 44999, monthly_pt: 300 },
      { from: 45000, to: 59999, monthly_pt: 450 },
      { from: 60000, to: 74999, monthly_pt: 600 },
      { from: 75000, to: 99999, monthly_pt: 750 },
      { from: 100000,to: null,  monthly_pt: 1250 },
    ],
  },
  {
    state_code: "02", state_name: "Himachal Pradesh", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "01", state_name: "Jammu & Kashmir", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "07", state_name: "Delhi", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "08", state_name: "Rajasthan", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "09", state_name: "Uttar Pradesh", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "05", state_name: "Uttarakhand", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "10", state_name: "Bihar", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "20", state_name: "Jharkhand", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "11", state_name: "Sikkim", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "14", state_name: "Manipur", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "17", state_name: "Meghalaya", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 4166,  monthly_pt: 0 },
      { from: 4167,  to: null,  monthly_pt: 208 },
    ],
  },
  {
    state_code: "18", state_name: "Assam", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 10000, monthly_pt: 0 },
      { from: 10001, to: null,  monthly_pt: 208 },
    ],
  },
  {
    state_code: "30", state_name: "Goa", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 15000, monthly_pt: 0 },
      { from: 15001, to: null,  monthly_pt: 200 },
    ],
  },
  {
    state_code: "28", state_name: "Andaman & Nicobar", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "34", state_name: "Puducherry", pt_applicable: false, frequency: "monthly",
    slabs: [],
  },
  {
    state_code: "16", state_name: "Tripura", pt_applicable: true, frequency: "monthly",
    slabs: [
      { from: 0,     to: 7500,  monthly_pt: 0 },
      { from: 7501,  to: null,  monthly_pt: 150 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 7. TDS SECTION RATE TABLE
// Part 4-B of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export interface TDSSectionRate {
  section: string;
  description: string;
  threshold_limit: number;      // Below this, no TDS required
  rate_individual: number;      // % for individuals / HUF
  rate_company: number;         // % for companies / firms
  new_act_form: string;         // New Income Tax Act 2025 form
  old_act_form: string;         // Old Income Tax Act 1961 form
  deposit_due: string;          // "7th of next month" etc.
}

export const TDS_SECTION_RATES: TDSSectionRate[] = [
  { section: "194C",      description: "Payment to Contractors",          threshold_limit: 30000,   rate_individual: 1,  rate_company: 2,  new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194J",      description: "Professional / Technical Fees",   threshold_limit: 30000,   rate_individual: 10, rate_company: 10, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194I",      description: "Rent of Land, Building, Plant",   threshold_limit: 240000,  rate_individual: 10, rate_company: 10, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194H",      description: "Commission or Brokerage",         threshold_limit: 15000,   rate_individual: 5,  rate_company: 5,  new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194A",      description: "Interest (Banks / Others)",       threshold_limit: 40000,   rate_individual: 10, rate_company: 10, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194Q",      description: "Purchase of Goods (Buyer > 10Cr TurnOver)", threshold_limit: 5000000, rate_individual: 0.1, rate_company: 0.1, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194B",      description: "Winnings from Lottery",           threshold_limit: 10000,   rate_individual: 30, rate_company: 30, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "At the time of payment" },
  { section: "194D",      description: "Insurance Commission",            threshold_limit: 15000,   rate_individual: 5,  rate_company: 10, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194DA",     description: "Payment on Life Insurance Policy",threshold_limit: 100000,  rate_individual: 5,  rate_company: 5,  new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194G",      description: "Commission on Lottery Tickets",   threshold_limit: 15000,   rate_individual: 5,  rate_company: 5,  new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194LA",     description: "Compensation on Immovable Property", threshold_limit: 250000, rate_individual: 10, rate_company: 10, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "194N",      description: "Cash Withdrawal (Bank/Post Office)", threshold_limit: 2000000, rate_individual: 2, rate_company: 2, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "206C_1H",   description: "TCS on Sale of Goods (Seller > 10Cr TurnOver)", threshold_limit: 5000000, rate_individual: 0.1, rate_company: 0.1, new_act_form: "Form 143", old_act_form: "Form 27EQ", deposit_due: "7th of next month" },
  { section: "52_TCS",    description: "TCS on E-Commerce (Sec 52 GST)",   threshold_limit: 0, rate_individual: 1, rate_company: 1, new_act_form: "Form 143", old_act_form: "Form 27EQ", deposit_due: "10th of next month" },
  { section: "194O_MARKETPLACE", description: "TDS on E-Commerce Operator Payments (Sec 194O)", threshold_limit: 500000, rate_individual: 1, rate_company: 1, new_act_form: "Form 140", old_act_form: "Form 26Q", deposit_due: "7th of next month" },
  { section: "24Q",       description: "Salary TDS (Section 192)",         threshold_limit: 0, rate_individual: 0, rate_company: 0, new_act_form: "Form 138", old_act_form: "Form 24Q", deposit_due: "7th of next month" },
  { section: "27Q",       description: "TDS on Payments to Non-Residents", threshold_limit: 0, rate_individual: 20, rate_company: 20, new_act_form: "Form 144", old_act_form: "Form 27Q", deposit_due: "7th of next month" },
];

// ─────────────────────────────────────────────────────────────────────────────
// 8. 20 BUSINESS MODEL ADAPTOR CONFIGS
// Part 1 of Build Spec
// ─────────────────────────────────────────────────────────────────────────────

export const BUSINESS_MODEL_CONFIGS: Record<BusinessModelType, BusinessModelConfig> = {
  saas: {
    model: "saas",
    display_name: "SaaS / Software as a Service",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194J", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Deferred Revenue A/c", "Subscription Revenue A/c", "ARR Tracking A/c", "MDR Charges A/c"],
  },
  d2c_ecommerce: {
    model: "d2c_ecommerce",
    display_name: "D2C / Direct-to-Consumer E-commerce",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194C", "194J", "194O_MARKETPLACE"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "inter_state",
    specific_ledgers: ["MDR / Gateway Charges A/c", "Returns & Refunds A/c", "Marketplace Commission A/c", "Shipping Charges A/c"],
  },
  manufacturing: {
    model: "manufacturing",
    display_name: "Manufacturing / Factory",
    inventory_valuation_method: "weighted_avg",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194C", "194I", "194H"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: true,
    gst_type_default: "intra_state",
    specific_ledgers: ["Raw Material Consumed A/c", "WIP Opening A/c", "WIP Closing A/c", "Factory Overhead A/c", "BOM Variance A/c"],
  },
  marketplace: {
    model: "marketplace",
    display_name: "Marketplace / Aggregator Platform",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194O_MARKETPLACE", "194J", "194C"],
    tcs_applicable: true,
    tcs_section: "52_TCS",
    deferred_revenue_applicable: false,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "inter_state",
    specific_ledgers: ["Marketplace Commission Income A/c", "TCS Payable u/s 52 A/c", "Seller Payable A/c", "Escrow A/c"],
  },
  franchise: {
    model: "franchise",
    display_name: "Franchise Business",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194H", "194C", "194J"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Franchise Fee Income A/c", "Royalty Income A/c", "Franchise Payable A/c"],
  },
  trading: {
    model: "trading",
    display_name: "Trading / Distribution",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194Q", "206C_1H", "194C"],
    tcs_applicable: true,
    tcs_section: "206C_1H",
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Trading Stock A/c", "Purchase Returns A/c", "Sales Returns A/c", "Discount Received A/c"],
  },
  professional_services: {
    model: "professional_services",
    display_name: "Professional Services / Consulting",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194J", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Consulting Revenue A/c", "WIP (Unbilled Revenue) A/c", "Retainer Income A/c"],
  },
  restaurant_hospitality: {
    model: "restaurant_hospitality",
    display_name: "Restaurant / Hotel / Hospitality",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194C", "194I"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Food & Beverage Revenue A/c", "Room Rent Revenue A/c", "Kitchen Material Consumed A/c", "CGST 2.5% A/c", "SGST 2.5% A/c"],
  },
  real_estate: {
    model: "real_estate",
    display_name: "Real Estate / Construction",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194IA", "194I", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: false,
    bom_wip_required: true,
    gst_type_default: "intra_state",
    specific_ledgers: ["Land Cost A/c", "Construction WIP A/c", "Project Revenue A/c", "Advance from Buyers A/c", "TDS on Property Purchase 194IA A/c"],
  },
  healthcare: {
    model: "healthcare",
    display_name: "Healthcare / Clinic / Hospital",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194J", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "exempt",
    specific_ledgers: ["Medical Service Revenue A/c", "Pharmacy Sales A/c (GST 12%)", "Doctor Consultancy Payable A/c"],
  },
  education: {
    model: "education",
    display_name: "Education / EdTech",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194J", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "exempt",
    specific_ledgers: ["Tuition Fee Revenue A/c", "Course Fee Deferred A/c", "Scholarship Expense A/c"],
  },
  logistics_transport: {
    model: "logistics_transport",
    display_name: "Logistics / Transport",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194C", "194I"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Freight Revenue A/c", "Diesel & Fuel Expense A/c", "Vehicle Maintenance A/c", "Driver Salary A/c", "RTO Expenses A/c"],
  },
  export: {
    model: "export",
    display_name: "Exporter (Goods / Services)",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194Q", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "zero_rated",
    specific_ledgers: ["Export Revenue A/c (USD)", "Forex Gain/Loss A/c", "EDPMS Tracking A/c", "Letter of Credit A/c", "Export Freight A/c"],
  },
  import: {
    model: "import",
    display_name: "Importer",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["27Q", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "inter_state",
    specific_ledgers: ["Import Purchases A/c (USD)", "Customs Duty A/c", "IGST on Imports A/c", "Forex Gain/Loss A/c", "Bill of Entry A/c"],
  },
  banking_nbfc: {
    model: "banking_nbfc",
    display_name: "NBFC / Microfinance",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194A", "194J"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "exempt",
    specific_ledgers: ["Loan Disbursed A/c", "EMI Received A/c", "Interest Income A/c", "NPA Provision A/c", "ECL Provision A/c (Ind AS 109)"],
  },
  ngo_trust: {
    model: "ngo_trust",
    display_name: "NGO / Trust / Section 8 Company",
    inventory_valuation_method: "specific_identification",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194J", "194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "exempt",
    specific_ledgers: ["Donation Received A/c", "Grant Received A/c (12A)", "Corpus Fund A/c", "CSR Funds Received A/c", "Trust Expense A/c"],
  },
  startup: {
    model: "startup",
    display_name: "DPIIT Startup",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194J", "194C", "194O_MARKETPLACE"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Venture Capital Received A/c", "ESOP Reserve A/c", "Burn Rate Tracker A/c", "ARR A/c", "MRR A/c"],
  },
  retail: {
    model: "retail",
    display_name: "Retail / Kirana / Supermarket",
    inventory_valuation_method: "fifo",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194Q"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: true,
    bom_wip_required: false,
    gst_type_default: "intra_state",
    specific_ledgers: ["Cash Sales A/c", "POS Settlement A/c", "Loyalty Points Liability A/c", "Stock Shrinkage A/c"],
  },
  construction: {
    model: "construction",
    display_name: "Construction / Infra",
    inventory_valuation_method: "weighted_avg",
    revenue_recognition_method: "over_time",
    tds_sections_applicable: ["194C", "194I", "194J"],
    tcs_applicable: false,
    deferred_revenue_applicable: true,
    mdr_gl_required: false,
    bom_wip_required: true,
    gst_type_default: "intra_state",
    specific_ledgers: ["Contract Revenue A/c", "Materials at Site A/c", "Sub-Contractor Payable A/c", "Retention Money Payable A/c", "Mobilization Advance A/c"],
  },
  agriculture: {
    model: "agriculture",
    display_name: "Agriculture / Agri-Business",
    inventory_valuation_method: "weighted_avg",
    revenue_recognition_method: "point_in_time",
    tds_sections_applicable: ["194C"],
    tcs_applicable: false,
    deferred_revenue_applicable: false,
    mdr_gl_required: false,
    bom_wip_required: false,
    gst_type_default: "exempt",
    specific_ledgers: ["Produce Stock A/c (Ind AS 41)", "Biological Assets A/c", "Farm Revenue A/c", "Agricultural Subsidy Income A/c"],
  },
};
