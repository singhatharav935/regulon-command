/**
 * SANNIDH ACCOUNTING ENGINE — PUBLIC API
 * =======================================
 * Central export barrel for the accounting library.
 * Import from this file in all components.
 *
 * Usage in REAL dashboards:
 *   import { processVoucher, generateTrialBalance } from "@/lib/accounting";
 *   import { DoubleEntryService } from "@/services/double-entry-service";
 *
 * Usage in DEMO dashboards:
 *   import { demoAccounting, DEMO_CHART_OF_ACCOUNTS } from "@/data/demo-accounting-data";
 *   // DO NOT import double-entry-service in demo components
 */

// ── Types (shared between real & demo) ───────────────────────────────────────
export type {
  // Account Taxonomy
  FinancialNature,
  PrimaryGroupCode,
  SecondaryGroupCode,
  PrimaryGroup,
  SecondaryGroup,
  GoldenRuleType,
  GoldenRuleResult,
  GoldenRuleValidation,
  ChartOfAccount,
  // Vouchers
  VoucherType,
  VoucherCategory,
  VoucherTypeMeta,
  VoucherLeg,
  VoucherLineItem,
  Voucher,
  VoucherProcessingResult,
  // Ledger & Trial Balance
  LedgerPosting,
  GeneralLedger,
  TrialBalance,
  TrialBalanceLine,
  // GST
  GSTType,
  GSTLedgerType,
  GSTSetoffResult,
  GSTR2BReconciliationResult,
  GSTR2BMismatch,
  // TDS
  TDSSection,
  TDSDeductionResult,
  // MSME
  MSMECategory,
  MSMEVendorStatus,
  MSMEOutstandingBill,
  // Financial Statements
  TradingAccount,
  ProfitLossAccount,
  BalanceSheetScheduleIII,
  // Payroll
  PayrollEmployee,
  PayrollCalculation,
  // Business Model
  BusinessModelType,
  BusinessModelConfig,
  // Notice Parser
  StatutoryNoticeType,
  ParsedNotice,
  NoticeDraftResponse,
  LegalCitation,
  // Banking
  BankingScenario,
  BankingScenarioTemplate,
} from "./accounting-types";

// ── Master Data (pure reference — no side effects) ───────────────────────────
export {
  PRIMARY_GROUPS,
  SECONDARY_GROUPS,
  PRIMARY_GROUP_GOLDEN_RULE,
  VOUCHER_TYPE_REGISTRY,
  BANKING_SCENARIO_TEMPLATES,
  STATE_PROFESSIONAL_TAX,
  TDS_SECTION_RATES,
  BUSINESS_MODEL_CONFIGS,
  getGoldenRuleType,
  getFinancialNature,
  getNormalBalance,
  getGoldenRuleDescription,
} from "./chart-of-accounts";

// ── Engine Functions (pure logic — no Supabase, no React) ────────────────────
export {
  // Core validators
  enforceDoubleEntry,
  runGoldenRuleValidations,
  validateGoldenRule,
  // Statutory engines
  checkSec175BlockedITC,
  calculateGSTSetoff,
  reconcileGSTR2B,
  calculateMSMEDisallowance,
  calculateTDS,
  calculateProfessionalTax,
  calculateEPFESIC,
  calculatePayroll,
  // Financial computations
  computeTrialBalanceTotals,
  calculateDepreciation,
  calculateFinancialRatios,
  calculateGSTAmounts,
  // Utilities
  generateVoucherNumber,
  roundTo2,
  // Constants
  SEC_17_5_BLOCKED_CATEGORIES,
} from "./double-entry-engine";
