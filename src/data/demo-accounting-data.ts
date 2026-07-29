/**
 * DEMO ACCOUNTING DATA — Mock Double-Entry Data for Demo Dashboards
 * =================================================================
 * ⚠️  THIS FILE IS FOR DEMO DASHBOARDS ONLY (/dashboard, /ca-dashboard)
 *
 * ALL data here is MOCK data for demonstration purposes.
 * It works entirely on local arrays — ZERO Supabase calls.
 * When users interact with the demo dashboard, all accounting
 * operations (voucher creation, ledger updates, trial balance)
 * run against these in-memory arrays only.
 *
 * Real dashboards (/real-company-dashboard, /dashboards/ca-firm)
 * use double-entry-service.ts with live Supabase database.
 *
 * DO NOT import double-entry-service.ts anywhere in demo components.
 */

import type {
  ChartOfAccount,
  Voucher,
  GeneralLedger,
  LedgerPosting,
  TrialBalance,
  TrialBalanceLine,
  VoucherLeg,
  VoucherLineItem,
} from "@/lib/accounting/accounting-types";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO CHART OF ACCOUNTS
// Full taxonomy covering all 15 Primary Groups for a Manufacturing Company
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // ── CAPITAL ACCOUNT GROUP ─────────────────────────────────────────────────
  { id: "COA-001", company_id: "demo", ledger_name: "Capital Account — Promoters", ledger_code: "CA-001", primary_group: "CAPITAL_ACCOUNT", secondary_group: undefined, golden_rule_type: "personal", financial_nature: "equity", normal_balance: "credit", opening_balance: 5000000, opening_balance_type: "credit", current_balance: 5000000, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-002", company_id: "demo", ledger_name: "Reserves & Surplus", ledger_code: "CA-002", primary_group: "CAPITAL_ACCOUNT", secondary_group: "RESERVES_SURPLUS", golden_rule_type: "personal", financial_nature: "equity", normal_balance: "credit", opening_balance: 1200000, opening_balance_type: "credit", current_balance: 1200000, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-003", company_id: "demo", ledger_name: "Drawings Account — Director", ledger_code: "CA-003", primary_group: "CAPITAL_ACCOUNT", secondary_group: undefined, golden_rule_type: "personal", financial_nature: "equity", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 120000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── LOANS LIABILITIES ─────────────────────────────────────────────────────
  { id: "COA-010", company_id: "demo", ledger_name: "HDFC Bank Term Loan A/c", ledger_code: "LL-001", primary_group: "LOANS_LIABILITIES", secondary_group: "SECURED_LOANS", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 2500000, opening_balance_type: "credit", current_balance: 2425000, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-011", company_id: "demo", ledger_name: "Director Loan A/c — Ramesh Shah", ledger_code: "LL-002", primary_group: "LOANS_LIABILITIES", secondary_group: "UNSECURED_LOANS", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 500000, opening_balance_type: "credit", current_balance: 500000, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-012", company_id: "demo", ledger_name: "HDFC Bank OD Account", ledger_code: "LL-003", primary_group: "LOANS_LIABILITIES", secondary_group: "BANK_OVERDRAFT", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 0, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── CURRENT LIABILITIES ───────────────────────────────────────────────────
  { id: "COA-020", company_id: "demo", ledger_name: "Zeta Raw Materials Pvt Ltd (Creditor)", ledger_code: "CL-001", primary_group: "CURRENT_LIABILITIES", secondary_group: "SUNDRY_CREDITORS", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 85000, opening_balance_type: "credit", current_balance: 141600, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", gstin: "27AABCZ4567R1ZV", is_msme: true, udyam_registration_no: "UDYAM-MH-10-0012345" },
  { id: "COA-021", company_id: "demo", ledger_name: "Eta IT Services (Creditor)", ledger_code: "CL-002", primary_group: "CURRENT_LIABILITIES", secondary_group: "SUNDRY_CREDITORS", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 33040, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", gstin: "29AABCE8901S1ZW", is_msme: true, udyam_registration_no: "UDYAM-KA-05-0045678" },
  { id: "COA-022", company_id: "demo", ledger_name: "Output CGST Payable", ledger_code: "CL-010", primary_group: "CURRENT_LIABILITIES", secondary_group: "DUTIES_TAXES", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 75600, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-023", company_id: "demo", ledger_name: "Output SGST Payable", ledger_code: "CL-011", primary_group: "CURRENT_LIABILITIES", secondary_group: "DUTIES_TAXES", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 75600, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-024", company_id: "demo", ledger_name: "Output IGST Payable", ledger_code: "CL-012", primary_group: "CURRENT_LIABILITIES", secondary_group: "DUTIES_TAXES", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 0, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-025", company_id: "demo", ledger_name: "TDS Payable A/c (194J)", ledger_code: "CL-013", primary_group: "CURRENT_LIABILITIES", secondary_group: "DUTIES_TAXES", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 6300, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-026", company_id: "demo", ledger_name: "PF Payable A/c", ledger_code: "CL-014", primary_group: "CURRENT_LIABILITIES", secondary_group: "DUTIES_TAXES", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 16800, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-027", company_id: "demo", ledger_name: "ESIC Payable A/c", ledger_code: "CL-015", primary_group: "CURRENT_LIABILITIES", secondary_group: "DUTIES_TAXES", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 4050, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-028", company_id: "demo", ledger_name: "Salary Payable A/c", ledger_code: "CL-016", primary_group: "CURRENT_LIABILITIES", secondary_group: "PROVISIONS", golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 0, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-029", company_id: "demo", ledger_name: "Advance from Customers A/c", ledger_code: "CL-017", primary_group: "CURRENT_LIABILITIES", secondary_group: undefined, golden_rule_type: "personal", financial_nature: "liability", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 0, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── FIXED ASSETS ──────────────────────────────────────────────────────────
  { id: "COA-040", company_id: "demo", ledger_name: "Land & Building A/c", ledger_code: "FA-001", primary_group: "FIXED_ASSETS", secondary_group: undefined, golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 3500000, opening_balance_type: "debit", current_balance: 3500000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-041", company_id: "demo", ledger_name: "Plant & Machinery A/c", ledger_code: "FA-002", primary_group: "FIXED_ASSETS", secondary_group: undefined, golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 2200000, opening_balance_type: "debit", current_balance: 2200000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-042", company_id: "demo", ledger_name: "Office Computers & Laptops A/c", ledger_code: "FA-003", primary_group: "FIXED_ASSETS", secondary_group: undefined, golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 320000, opening_balance_type: "debit", current_balance: 320000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-043", company_id: "demo", ledger_name: "Furniture & Fixtures A/c", ledger_code: "FA-004", primary_group: "FIXED_ASSETS", secondary_group: undefined, golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 185000, opening_balance_type: "debit", current_balance: 185000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-044", company_id: "demo", ledger_name: "Vehicles A/c", ledger_code: "FA-005", primary_group: "FIXED_ASSETS", secondary_group: undefined, golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 680000, opening_balance_type: "debit", current_balance: 680000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-045", company_id: "demo", ledger_name: "Accumulated Depreciation A/c", ledger_code: "FA-006", primary_group: "FIXED_ASSETS", secondary_group: undefined, golden_rule_type: "real", financial_nature: "asset", normal_balance: "credit", opening_balance: 890000, opening_balance_type: "credit", current_balance: 890000, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── CURRENT ASSETS ────────────────────────────────────────────────────────
  { id: "COA-060", company_id: "demo", ledger_name: "Cash-in-Hand (Main Cashbox)", ledger_code: "BA-001", primary_group: "CURRENT_ASSETS", secondary_group: "CASH_IN_HAND", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 45000, opening_balance_type: "debit", current_balance: 41800, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-061", company_id: "demo", ledger_name: "HDFC Current Account ****4567", ledger_code: "BA-002", primary_group: "CURRENT_ASSETS", secondary_group: "BANK_ACCOUNTS", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 1500000, opening_balance_type: "debit", current_balance: 1645000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", bank_account_no: "XXXXXXXXX4567", ifsc_code: "HDFC0001234" },
  { id: "COA-062", company_id: "demo", ledger_name: "SBI Savings Account ****8901", ledger_code: "BA-003", primary_group: "CURRENT_ASSETS", secondary_group: "BANK_ACCOUNTS", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 250000, opening_balance_type: "debit", current_balance: 280000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", bank_account_no: "XXXXXXXXX8901", ifsc_code: "SBIN0001234" },

  // ── DEBTORS ───────────────────────────────────────────────────────────────
  { id: "COA-070", company_id: "demo", ledger_name: "Alpha Distributors Pvt Ltd (Debtor)", ledger_code: "DR-001", primary_group: "CURRENT_ASSETS", secondary_group: "SUNDRY_DEBTORS", golden_rule_type: "personal", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 0, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", gstin: "27AABCA5678K1ZS" },
  { id: "COA-071", company_id: "demo", ledger_name: "Beta Retail Chain (Debtor)", ledger_code: "DR-002", primary_group: "CURRENT_ASSETS", secondary_group: "SUNDRY_DEBTORS", golden_rule_type: "personal", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 112100, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", gstin: "29AABCB9012L1ZQ" },
  { id: "COA-072", company_id: "demo", ledger_name: "Gamma Wholesale Ltd (Debtor)", ledger_code: "DR-003", primary_group: "CURRENT_ASSETS", secondary_group: "SUNDRY_DEBTORS", golden_rule_type: "personal", financial_nature: "asset", normal_balance: "debit", opening_balance: 250000, opening_balance_type: "debit", current_balance: 365800, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", gstin: "24AABCG3456N1ZR" },
  { id: "COA-073", company_id: "demo", ledger_name: "Epsilon Tech Solutions (Debtor)", ledger_code: "DR-004", primary_group: "CURRENT_ASSETS", secondary_group: "SUNDRY_DEBTORS", golden_rule_type: "personal", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 495600, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23", gstin: "29AABCE2345Q1ZU" },

  // ── GST INPUT TAX CREDIT ──────────────────────────────────────────────────
  { id: "COA-080", company_id: "demo", ledger_name: "Input CGST A/c", ledger_code: "GST-001", primary_group: "CURRENT_ASSETS", secondary_group: "DEPOSIT_ASSETS", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 21600, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-081", company_id: "demo", ledger_name: "Input SGST A/c", ledger_code: "GST-002", primary_group: "CURRENT_ASSETS", secondary_group: "DEPOSIT_ASSETS", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 21600, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-082", company_id: "demo", ledger_name: "Input IGST A/c", ledger_code: "GST-003", primary_group: "CURRENT_ASSETS", secondary_group: "DEPOSIT_ASSETS", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 0, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-083", company_id: "demo", ledger_name: "TDS Receivable A/c", ledger_code: "TDS-001", primary_group: "CURRENT_ASSETS", secondary_group: "LOANS_ADVANCE_ASSETS", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 15000, opening_balance_type: "debit", current_balance: 15000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-084", company_id: "demo", ledger_name: "Stock-in-Hand — Raw Materials A/c", ledger_code: "STK-001", primary_group: "CURRENT_ASSETS", secondary_group: "STOCK_IN_HAND", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 580000, opening_balance_type: "debit", current_balance: 580000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-085", company_id: "demo", ledger_name: "Stock-in-Hand — Finished Goods A/c", ledger_code: "STK-002", primary_group: "CURRENT_ASSETS", secondary_group: "STOCK_IN_HAND", golden_rule_type: "real", financial_nature: "asset", normal_balance: "debit", opening_balance: 320000, opening_balance_type: "debit", current_balance: 320000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-086", company_id: "demo", ledger_name: "Advance to Supplier A/c", ledger_code: "ADV-001", primary_group: "CURRENT_ASSETS", secondary_group: "LOANS_ADVANCE_ASSETS", golden_rule_type: "personal", financial_nature: "asset", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 0, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── SALES ACCOUNTS (Nominal) ──────────────────────────────────────────────
  { id: "COA-100", company_id: "demo", ledger_name: "Sales — Intra-State (18% GST) A/c", ledger_code: "SAL-001", primary_group: "SALES_ACCOUNT", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "income", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 1050000, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-101", company_id: "demo", ledger_name: "Sales — Inter-State (18% IGST) A/c", ledger_code: "SAL-002", primary_group: "SALES_ACCOUNT", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "income", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 212500, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── PURCHASE ACCOUNTS (Nominal) ───────────────────────────────────────────
  { id: "COA-110", company_id: "demo", ledger_name: "Purchases — Raw Materials A/c", ledger_code: "PUR-001", primary_group: "PURCHASE_ACCOUNT", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 120000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── DIRECT EXPENSES (Nominal) ─────────────────────────────────────────────
  { id: "COA-120", company_id: "demo", ledger_name: "Carriage Inward A/c", ledger_code: "DE-001", primary_group: "DIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 15000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-121", company_id: "demo", ledger_name: "Wages — Factory Workers A/c", ledger_code: "DE-002", primary_group: "DIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 185000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-122", company_id: "demo", ledger_name: "Factory Overhead — Electricity A/c", ledger_code: "DE-003", primary_group: "DIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 42000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── INDIRECT EXPENSES (Nominal) ───────────────────────────────────────────
  { id: "COA-130", company_id: "demo", ledger_name: "Salaries & Staff Costs A/c", ledger_code: "IE-001", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 215000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-131", company_id: "demo", ledger_name: "Rent Expense A/c", ledger_code: "IE-002", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 75000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-132", company_id: "demo", ledger_name: "Marketing Expenses A/c", ledger_code: "IE-003", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 40000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-133", company_id: "demo", ledger_name: "Legal & Professional Fees A/c", ledger_code: "IE-004", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 43000, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-134", company_id: "demo", ledger_name: "Bank Charges A/c", ledger_code: "IE-005", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 1450, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-135", company_id: "demo", ledger_name: "Internet & Telecom Expenses A/c", ledger_code: "IE-006", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 4500, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-136", company_id: "demo", ledger_name: "Software & Subscription Expenses A/c", ledger_code: "IE-007", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 14400, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-137", company_id: "demo", ledger_name: "Travelling & Conveyance A/c", ledger_code: "IE-008", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 7200, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-138", company_id: "demo", ledger_name: "Staff Welfare & Refreshment A/c", ledger_code: "IE-009", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 2800, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-139", company_id: "demo", ledger_name: "Printing & Stationery A/c", ledger_code: "IE-010", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 3200, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-140", company_id: "demo", ledger_name: "Interest on Loan A/c", ledger_code: "IE-011", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 18750, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
  { id: "COA-141", company_id: "demo", ledger_name: "Depreciation A/c", ledger_code: "IE-012", primary_group: "INDIRECT_EXPENSES", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "expense", normal_balance: "debit", opening_balance: 0, opening_balance_type: "debit", current_balance: 0, current_balance_type: "debit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },

  // ── INDIRECT INCOME ───────────────────────────────────────────────────────
  { id: "COA-150", company_id: "demo", ledger_name: "Interest Received from Bank A/c", ledger_code: "II-001", primary_group: "INDIRECT_INCOME", secondary_group: undefined, golden_rule_type: "nominal", financial_nature: "income", normal_balance: "credit", opening_balance: 0, opening_balance_type: "credit", current_balance: 8500, current_balance_type: "credit", is_active: true, created_at: "2025-04-01", updated_at: "2025-07-23" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO VOUCHERS — 40 Banking + GST + Payroll entries
// Represents July 2025 transactions for Sannidh Demo Co. Pvt. Ltd.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_VOUCHERS: Voucher[] = [
  // ── SALES INVOICE — Intra-State, 18% GST ─────────────────────────────────
  {
    id: "V-001",
    company_id: "demo",
    voucher_no: "INV-202526-0101",
    voucher_type: "SALES",
    voucher_date: "2025-07-18",
    fiscal_year: "2025-26",
    reference_no: "INV-2025-0101",
    party_ledger_id: "COA-070",
    party_ledger_name: "Alpha Distributors Pvt Ltd (Debtor)",
    party_gstin: "27AABCA5678K1ZS",
    line_items: [
      { id: "LI-001", item_name: "Assembled Motor Unit — Type A", hsn_sac_code: "8501", quantity: 10, unit: "PCS", rate: 18000, taxable_amount: 180000, gst_rate: 18, cgst_amount: 16200, sgst_amount: 16200, igst_amount: 0, total_amount: 212400 },
    ],
    legs: [
      { id: "L-001a", ledger_id: "COA-070", ledger_name: "Alpha Distributors Pvt Ltd (Debtor)", ledger_code: "DR-001", side: "debit", amount: 212400 },
      { id: "L-001b", ledger_id: "COA-100", ledger_name: "Sales — Intra-State (18% GST) A/c", ledger_code: "SAL-001", side: "credit", amount: 180000 },
      { id: "L-001c", ledger_id: "COA-022", ledger_name: "Output CGST Payable", ledger_code: "CL-010", side: "credit", amount: 16200 },
      { id: "L-001d", ledger_id: "COA-023", ledger_name: "Output SGST Payable", ledger_code: "CL-011", side: "credit", amount: 16200 },
    ],
    gross_amount: 180000, total_discount: 0, taxable_amount: 180000,
    cgst_amount: 16200, sgst_amount: 16200, igst_amount: 0, cess_amount: 0,
    tds_amount: 0, tcs_amount: 0, round_off: 0, net_amount: 212400,
    gst_type: "intra_state", place_of_supply: "27", is_rcm: false,
    narration: "Tax invoice raised to Alpha Distributors Pvt Ltd for 10 units Assembled Motor Type A. CGST 9% + SGST 9% = 18% GST.",
    created_by: "demo-user",
    is_locked: false, attachments: [], source: "manual",
    created_at: "2025-07-18T10:00:00Z", updated_at: "2025-07-18T10:00:00Z",
  },

  // ── PURCHASE BILL — Raw Materials, Intra-State ────────────────────────────
  {
    id: "V-002",
    company_id: "demo",
    voucher_no: "PB-202526-0201",
    voucher_type: "PURCHASE",
    voucher_date: "2025-07-19",
    fiscal_year: "2025-26",
    reference_no: "PB-2025-0201",
    party_ledger_id: "COA-020",
    party_ledger_name: "Zeta Raw Materials Pvt Ltd (Creditor)",
    party_gstin: "27AABCZ4567R1ZV",
    line_items: [
      { id: "LI-002", item_name: "Industrial Grade Steel Rods (12mm)", hsn_sac_code: "7213", quantity: 500, unit: "KG", rate: 240, taxable_amount: 120000, gst_rate: 18, cgst_amount: 10800, sgst_amount: 10800, igst_amount: 0, total_amount: 141600 },
    ],
    legs: [
      { id: "L-002a", ledger_id: "COA-110", ledger_name: "Purchases — Raw Materials A/c", ledger_code: "PUR-001", side: "debit", amount: 120000 },
      { id: "L-002b", ledger_id: "COA-080", ledger_name: "Input CGST A/c", ledger_code: "GST-001", side: "debit", amount: 10800 },
      { id: "L-002c", ledger_id: "COA-081", ledger_name: "Input SGST A/c", ledger_code: "GST-002", side: "debit", amount: 10800 },
      { id: "L-002d", ledger_id: "COA-020", ledger_name: "Zeta Raw Materials Pvt Ltd (Creditor)", ledger_code: "CL-001", side: "credit", amount: 141600 },
    ],
    gross_amount: 120000, total_discount: 0, taxable_amount: 120000,
    cgst_amount: 10800, sgst_amount: 10800, igst_amount: 0, cess_amount: 0,
    tds_amount: 0, tcs_amount: 0, round_off: 0, net_amount: 141600,
    gst_type: "intra_state", place_of_supply: "27", is_rcm: false,
    is_msme_vendor: true, msme_due_date: "2025-09-02", is_msme_overdue: false,
    narration: "Purchase of 500 KG Steel Rods from Zeta Raw Materials (MSME Vendor). ITC eligible — CGST 9% + SGST 9%. Payment due by 02-Sep-2025 (45 days per written agreement u/s 43B(h)).",
    created_by: "demo-user",
    is_locked: false, attachments: [], source: "ocr",
    created_at: "2025-07-19T11:00:00Z", updated_at: "2025-07-19T11:00:00Z",
  },

  // ── PAYMENT VOUCHER — Salary ───────────────────────────────────────────────
  {
    id: "V-003",
    company_id: "demo",
    voucher_no: "PV-202526-0001",
    voucher_type: "PAYMENT",
    voucher_date: "2025-07-20",
    fiscal_year: "2025-26",
    reference_no: "SAL-JUL-2025",
    line_items: [],
    legs: [
      { id: "L-003a", ledger_id: "COA-130", ledger_name: "Salaries & Staff Costs A/c", ledger_code: "IE-001", side: "debit", amount: 215000 },
      { id: "L-003b", ledger_id: "COA-061", ledger_name: "HDFC Current Account ****4567", ledger_code: "BA-002", side: "credit", amount: 186150 },
      { id: "L-003c", ledger_id: "COA-026", ledger_name: "PF Payable A/c", ledger_code: "CL-014", side: "credit", amount: 16800 },
      { id: "L-003d", ledger_id: "COA-027", ledger_name: "ESIC Payable A/c", ledger_code: "CL-015", side: "credit", amount: 1050 },
      { id: "L-003e", ledger_id: "COA-025", ledger_name: "TDS Payable A/c (194J)", ledger_code: "CL-013", side: "credit", amount: 11000 },
    ],
    gross_amount: 215000, total_discount: 0, taxable_amount: 215000,
    cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0,
    tds_amount: 11000, tcs_amount: 0, round_off: 0, net_amount: 215000,
    narration: "Salary payment for July 2025 — 4 employees. Net salary paid: ₹1,86,150. PF payable: ₹16,800. ESIC payable: ₹1,050. TDS u/s 192: ₹11,000.",
    created_by: "demo-user",
    is_locked: false, attachments: [], source: "manual",
    created_at: "2025-07-20T09:00:00Z", updated_at: "2025-07-20T09:00:00Z",
  },

  // ── RECEIPT VOUCHER — Customer Payment Received ────────────────────────────
  {
    id: "V-004",
    company_id: "demo",
    voucher_no: "RV-202526-0001",
    voucher_type: "RECEIPT",
    voucher_date: "2025-07-23",
    fiscal_year: "2025-26",
    reference_no: "UTR2025073412345",
    party_ledger_id: "COA-070",
    party_ledger_name: "Alpha Distributors Pvt Ltd (Debtor)",
    line_items: [],
    legs: [
      { id: "L-004a", ledger_id: "COA-061", ledger_name: "HDFC Current Account ****4567", ledger_code: "BA-002", side: "debit", amount: 212400 },
      { id: "L-004b", ledger_id: "COA-070", ledger_name: "Alpha Distributors Pvt Ltd (Debtor)", ledger_code: "DR-001", side: "credit", amount: 212400 },
    ],
    gross_amount: 212400, total_discount: 0, taxable_amount: 212400,
    cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0,
    tds_amount: 0, tcs_amount: 0, round_off: 0, net_amount: 212400,
    narration: "NEFT of ₹2,12,400 received from Alpha Distributors Pvt Ltd against Invoice INV-2025-0101. UTR: UTR2025073412345.",
    created_by: "demo-user",
    is_locked: false, attachments: [], source: "bank_feed",
    created_at: "2025-07-23T14:00:00Z", updated_at: "2025-07-23T14:00:00Z",
  },

  // ── CONTRA VOUCHER — Cash to Bank ─────────────────────────────────────────
  {
    id: "V-005",
    company_id: "demo",
    voucher_no: "CON-202526-0001",
    voucher_type: "CONTRA",
    voucher_date: "2025-07-15",
    fiscal_year: "2025-26",
    line_items: [],
    legs: [
      { id: "L-005a", ledger_id: "COA-061", ledger_name: "HDFC Current Account ****4567", ledger_code: "BA-002", side: "debit", amount: 50000 },
      { id: "L-005b", ledger_id: "COA-060", ledger_name: "Cash-in-Hand (Main Cashbox)", ledger_code: "BA-001", side: "credit", amount: 50000 },
    ],
    gross_amount: 50000, total_discount: 0, taxable_amount: 50000,
    cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0,
    tds_amount: 0, tcs_amount: 0, round_off: 0, net_amount: 50000,
    narration: "Cash deposit of ₹50,000 from office cash box into HDFC Current Account ****4567.",
    created_by: "demo-user",
    is_locked: false, attachments: [], source: "manual",
    created_at: "2025-07-15T16:00:00Z", updated_at: "2025-07-15T16:00:00Z",
  },

  // ── PAYMENT — Marketing Agency (TDS 194J) ────────────────────────────────
  {
    id: "V-006",
    company_id: "demo",
    voucher_no: "PV-202526-0002",
    voucher_type: "PAYMENT",
    voucher_date: "2025-07-21",
    fiscal_year: "2025-26",
    tds_section: "194J",
    tds_rate: 10,
    line_items: [],
    legs: [
      { id: "L-006a", ledger_id: "COA-132", ledger_name: "Marketing Expenses A/c", ledger_code: "IE-003", side: "debit", amount: 40000 },
      { id: "L-006b", ledger_id: "COA-061", ledger_name: "HDFC Current Account ****4567", ledger_code: "BA-002", side: "credit", amount: 36000 },
      { id: "L-006c", ledger_id: "COA-025", ledger_name: "TDS Payable A/c (194J)", ledger_code: "CL-013", side: "credit", amount: 4000 },
    ],
    gross_amount: 40000, total_discount: 0, taxable_amount: 40000,
    cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0,
    tds_amount: 4000, tcs_amount: 0, round_off: 0, net_amount: 40000,
    narration: "Marketing retainer fee paid to agency. TDS u/s 194J @10% deducted = ₹4,000. Net paid = ₹36,000. TDS deposit due by 07-Aug-2025.",
    created_by: "demo-user",
    is_locked: false, attachments: [], source: "manual",
    created_at: "2025-07-21T11:00:00Z", updated_at: "2025-07-21T11:00:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO TRIAL BALANCE — Computed from above chart of accounts
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_TRIAL_BALANCE: TrialBalance = {
  company_id: "demo",
  fiscal_year: "2025-26",
  as_on_date: "2025-07-23",
  lines: [
    { ledger_id: "COA-001", ledger_name: "Capital Account — Promoters", ledger_code: "CA-001", primary_group: "CAPITAL_ACCOUNT", opening_debit: 0, opening_credit: 5000000, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 5000000 },
    { ledger_id: "COA-002", ledger_name: "Reserves & Surplus", ledger_code: "CA-002", primary_group: "CAPITAL_ACCOUNT", opening_debit: 0, opening_credit: 1200000, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 1200000 },
    { ledger_id: "COA-010", ledger_name: "HDFC Bank Term Loan A/c", ledger_code: "LL-001", primary_group: "LOANS_LIABILITIES", opening_debit: 0, opening_credit: 2500000, period_debit: 75000, period_credit: 0, closing_debit: 0, closing_credit: 2425000 },
    { ledger_id: "COA-020", ledger_name: "Zeta Raw Materials Pvt Ltd (Creditor)", ledger_code: "CL-001", primary_group: "CURRENT_LIABILITIES", opening_debit: 0, opening_credit: 85000, period_debit: 0, period_credit: 141600, closing_debit: 0, closing_credit: 226600 },
    { ledger_id: "COA-022", ledger_name: "Output CGST Payable", ledger_code: "CL-010", primary_group: "CURRENT_LIABILITIES", opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 75600, closing_debit: 0, closing_credit: 75600 },
    { ledger_id: "COA-023", ledger_name: "Output SGST Payable", ledger_code: "CL-011", primary_group: "CURRENT_LIABILITIES", opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 75600, closing_debit: 0, closing_credit: 75600 },
    { ledger_id: "COA-040", ledger_name: "Land & Building A/c", ledger_code: "FA-001", primary_group: "FIXED_ASSETS", opening_debit: 3500000, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 3500000, closing_credit: 0 },
    { ledger_id: "COA-041", ledger_name: "Plant & Machinery A/c", ledger_code: "FA-002", primary_group: "FIXED_ASSETS", opening_debit: 2200000, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 2200000, closing_credit: 0 },
    { ledger_id: "COA-060", ledger_name: "Cash-in-Hand (Main Cashbox)", ledger_code: "BA-001", primary_group: "CURRENT_ASSETS", opening_debit: 45000, opening_credit: 0, period_debit: 0, period_credit: 3200, closing_debit: 41800, closing_credit: 0 },
    { ledger_id: "COA-061", ledger_name: "HDFC Current Account ****4567", ledger_code: "BA-002", primary_group: "CURRENT_ASSETS", opening_debit: 1500000, opening_credit: 0, period_debit: 212400, period_credit: 348150, closing_debit: 1645000, closing_credit: 0 },
    { ledger_id: "COA-070", ledger_name: "Alpha Distributors Pvt Ltd (Debtor)", ledger_code: "DR-001", primary_group: "CURRENT_ASSETS", opening_debit: 0, opening_credit: 0, period_debit: 212400, period_credit: 212400, closing_debit: 0, closing_credit: 0 },
    { ledger_id: "COA-071", ledger_name: "Beta Retail Chain (Debtor)", ledger_code: "DR-002", primary_group: "CURRENT_ASSETS", opening_debit: 0, opening_credit: 0, period_debit: 112100, period_credit: 0, closing_debit: 112100, closing_credit: 0 },
    { ledger_id: "COA-072", ledger_name: "Gamma Wholesale Ltd (Debtor)", ledger_code: "DR-003", primary_group: "CURRENT_ASSETS", opening_debit: 250000, opening_credit: 0, period_debit: 365800, period_credit: 250000, closing_debit: 365800, closing_credit: 0 },
    { ledger_id: "COA-080", ledger_name: "Input CGST A/c", ledger_code: "GST-001", primary_group: "CURRENT_ASSETS", opening_debit: 0, opening_credit: 0, period_debit: 21600, period_credit: 0, closing_debit: 21600, closing_credit: 0 },
    { ledger_id: "COA-081", ledger_name: "Input SGST A/c", ledger_code: "GST-002", primary_group: "CURRENT_ASSETS", opening_debit: 0, opening_credit: 0, period_debit: 21600, period_credit: 0, closing_debit: 21600, closing_credit: 0 },
    { ledger_id: "COA-084", ledger_name: "Stock-in-Hand — Raw Materials A/c", ledger_code: "STK-001", primary_group: "CURRENT_ASSETS", opening_debit: 580000, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 580000, closing_credit: 0 },
    { ledger_id: "COA-085", ledger_name: "Stock-in-Hand — Finished Goods A/c", ledger_code: "STK-002", primary_group: "CURRENT_ASSETS", opening_debit: 320000, opening_credit: 0, period_debit: 0, period_credit: 0, closing_debit: 320000, closing_credit: 0 },
    { ledger_id: "COA-100", ledger_name: "Sales — Intra-State (18% GST) A/c", ledger_code: "SAL-001", primary_group: "SALES_ACCOUNT", opening_debit: 0, opening_credit: 0, period_debit: 0, period_credit: 1050000, closing_debit: 0, closing_credit: 1050000 },
    { ledger_id: "COA-110", ledger_name: "Purchases — Raw Materials A/c", ledger_code: "PUR-001", primary_group: "PURCHASE_ACCOUNT", opening_debit: 0, opening_credit: 0, period_debit: 120000, period_credit: 0, closing_debit: 120000, closing_credit: 0 },
    { ledger_id: "COA-121", ledger_name: "Wages — Factory Workers A/c", ledger_code: "DE-002", primary_group: "DIRECT_EXPENSES", opening_debit: 0, opening_credit: 0, period_debit: 185000, period_credit: 0, closing_debit: 185000, closing_credit: 0 },
    { ledger_id: "COA-130", ledger_name: "Salaries & Staff Costs A/c", ledger_code: "IE-001", primary_group: "INDIRECT_EXPENSES", opening_debit: 0, opening_credit: 0, period_debit: 215000, period_credit: 0, closing_debit: 215000, closing_credit: 0 },
    { ledger_id: "COA-131", ledger_name: "Rent Expense A/c", ledger_code: "IE-002", primary_group: "INDIRECT_EXPENSES", opening_debit: 0, opening_credit: 0, period_debit: 75000, period_credit: 0, closing_debit: 75000, closing_credit: 0 },
    { ledger_id: "COA-132", ledger_name: "Marketing Expenses A/c", ledger_code: "IE-003", primary_group: "INDIRECT_EXPENSES", opening_debit: 0, opening_credit: 0, period_debit: 40000, period_credit: 0, closing_debit: 40000, closing_credit: 0 },
  ],
  total_opening_debit: 8395000,
  total_opening_credit: 8785000,
  total_period_debit: 1680900,
  total_period_credit: 1285750,
  total_closing_debit: 9676950,
  total_closing_credit: 9676950,
  is_balanced: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO IN-MEMORY ACCOUNTING STATE
// Used by demo dashboard to simulate real accounting operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DemoAccountingState — In-memory state manager for demo dashboards.
 * All CRUD operations mutate this in-memory store.
 * ZERO Supabase calls.
 */
export class DemoAccountingState {
  private vouchers: Voucher[] = [...DEMO_VOUCHERS];
  private ledgers: ChartOfAccount[] = [...DEMO_CHART_OF_ACCOUNTS];
  private voucherSequences: Map<string, number> = new Map();

  // Get all vouchers (filtered by type optionally)
  getVouchers(voucherType?: string): Voucher[] {
    if (voucherType) {
      return this.vouchers.filter((v) => v.voucher_type === voucherType);
    }
    return [...this.vouchers].sort(
      (a, b) => new Date(b.voucher_date).getTime() - new Date(a.voucher_date).getTime()
    );
  }

  // Get all ledgers
  getLedgers(primaryGroup?: string): ChartOfAccount[] {
    if (primaryGroup) {
      return this.ledgers.filter((l) => l.primary_group === primaryGroup);
    }
    return this.ledgers;
  }

  // Get trial balance
  getTrialBalance(): TrialBalance {
    return DEMO_TRIAL_BALANCE;
  }

  // Add a new voucher (demo — in-memory only)
  addVoucher(voucher: Omit<Voucher, "id" | "created_at" | "updated_at">): Voucher {
    const seqKey = `${voucher.voucher_type}_${voucher.fiscal_year}`;
    const seq = (this.voucherSequences.get(seqKey) ?? this.vouchers.filter((v) => v.voucher_type === voucher.voucher_type).length) + 1;
    this.voucherSequences.set(seqKey, seq);

    const newVoucher: Voucher = {
      ...voucher,
      id: `V-DEMO-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.vouchers.unshift(newVoucher);
    return newVoucher;
  }

  // Summary stats for demo dashboard KPIs
  getSummary() {
    const sales = this.vouchers
      .filter((v) => v.voucher_type === "SALES")
      .reduce((s, v) => s + v.taxable_amount, 0);
    const purchases = this.vouchers
      .filter((v) => v.voucher_type === "PURCHASE")
      .reduce((s, v) => s + v.taxable_amount, 0);
    const itcCGST = this.ledgers.find((l) => l.id === "COA-080")?.current_balance ?? 0;
    const itcSGST = this.ledgers.find((l) => l.id === "COA-081")?.current_balance ?? 0;
    const bankBalance = this.ledgers.find((l) => l.id === "COA-061")?.current_balance ?? 0;

    return {
      total_sales: sales,
      total_purchases: purchases,
      gross_profit: sales - purchases,
      itc_available: itcCGST + itcSGST,
      bank_balance: bankBalance,
      vouchers_this_month: this.vouchers.length,
    };
  }
}

// Export a singleton instance for demo dashboards
export const demoAccounting = new DemoAccountingState();
