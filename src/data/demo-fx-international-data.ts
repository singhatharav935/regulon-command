/**
 * DEMO DATA — CROSS-BORDER FX, FEMA & INTERNATIONAL TAX (PHASE 8)
 * =================================================================
 * 15 realistic FX transactions, FIRC records, LUT register,
 * Form 15CA/15CB drafts, RFD-01 claims, TP records, TRC register
 */

import {
  computeForexGainLoss, computePortfolioSummary, generateForm15CA, generateForm15CB,
  computeRFD01Claim, lookupDTAARate, RBI_EXCHANGE_RATES,
  type FXTransaction, type FIRCRecord, type LUTRecord, type ZeroRatedSupply,
  type RFD01Claim, type Form15CA, type Form15CB, type TransferPricingRecord,
  type TRCRecord, type ForexGainLoss,
} from "@/lib/accounting/fx-international-tax-engine";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: FX TRANSACTIONS (15 transactions, all types & currencies)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FX_TRANSACTIONS: FXTransaction[] = [
  // 1. Export receipt — USD — SETTLED (Realized Gain)
  {
    id: "FX-001", date: "2025-08-15", transaction_type: "EXPORT_RECEIPT",
    currency: "USD", fc_amount: 50000, inr_rate_at_booking: 83.42,
    inr_rate_at_settlement: 83.97, inr_amount_booked: 4171000,
    inr_amount_settled: 4198500, counterparty_name: "Acme Corp USA",
    counterparty_country: "United States", invoice_number: "INV-EXP-001",
    purpose_code: "P0101", ad_code: "AD0012345", bank_ref: "SWF9012384",
    firc_number: "FIRC-2025-001", firc_status: "RECEIVED",
    dtaa_country: "United States", dtaa_benefit: "NOT_APPLICABLE",
    lut_reference: "LUT-2025-001", is_settled: true, settlement_date: "2025-09-10",
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 2. Export receipt — EUR — OPEN (Unrealized Gain)
  {
    id: "FX-002", date: "2025-09-01", transaction_type: "EXPORT_RECEIPT",
    currency: "EUR", fc_amount: 30000, inr_rate_at_booking: 90.85,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.EUR.rbi_reference,
    inr_amount_booked: 2725500, counterparty_name: "TechGiant GmbH Germany",
    counterparty_country: "Germany", invoice_number: "INV-EXP-002",
    purpose_code: "P0101", ad_code: "AD0012345", bank_ref: "SWF9012911",
    firc_status: "PENDING", dtaa_country: "Germany", dtaa_benefit: "NOT_APPLICABLE",
    lut_reference: "LUT-2025-001", is_settled: false,
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 3. Import payment — USD — SETTLED (Realized Loss on payable)
  {
    id: "FX-003", date: "2025-07-20", transaction_type: "IMPORT_PAYMENT",
    currency: "USD", fc_amount: 20000, inr_rate_at_booking: 83.42,
    inr_rate_at_settlement: 84.10, inr_amount_booked: 1668400,
    inr_amount_settled: 1682000, counterparty_name: "AWS Inc USA",
    counterparty_country: "United States", invoice_number: "BILL-AWS-2025",
    purpose_code: "S0202", ad_code: "AD0012345", bank_ref: "ICIC42012001",
    firc_status: "NOT_REQUIRED", form15ca_ref: "15CA-FX-003",
    form15cb_ref: "15CB-FX-003", dtaa_country: "United States",
    dtaa_benefit: "NOT_APPLICABLE", is_settled: true, settlement_date: "2025-08-05",
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 4. Professional fee payment — GBP — SETTLED (WHT applicable, DTAA benefit)
  {
    id: "FX-004", date: "2025-09-05", transaction_type: "PROFESSIONAL_FEE",
    currency: "GBP", fc_amount: 5000, inr_rate_at_booking: 105.90,
    inr_rate_at_settlement: 106.80, inr_amount_booked: 529500,
    inr_amount_settled: 534000, counterparty_name: "Deloitte UK Advisory LLP",
    counterparty_country: "United Kingdom", invoice_number: "BILL-DLT-2025",
    purpose_code: "S0299", ad_code: "AD0012345", bank_ref: "SWF-UK-001",
    firc_status: "NOT_REQUIRED", form15ca_ref: "15CA-FX-004",
    form15cb_ref: "15CB-FX-004", dtaa_country: "United Kingdom",
    dtaa_benefit: "REDUCED_WHT", withholding_tax_rate: 15, withholding_tax_fc: 750,
    is_settled: true, settlement_date: "2025-09-10",
  },
  // 5. Export receipt — SGD — OPEN (Unrealized)
  {
    id: "FX-005", date: "2025-10-01", transaction_type: "EXPORT_RECEIPT",
    currency: "SGD", fc_amount: 80000, inr_rate_at_booking: 61.85,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.SGD.rbi_reference,
    inr_amount_booked: 4948000, counterparty_name: "Singtel Ventures Pte Ltd",
    counterparty_country: "Singapore", invoice_number: "INV-EXP-003",
    purpose_code: "P0101", ad_code: "AD0012345", bank_ref: "SWF-SG-001",
    firc_status: "PENDING", dtaa_country: "Singapore", dtaa_benefit: "NIL_WHT",
    lut_reference: "LUT-2025-001", is_settled: false,
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 6. Royalty payment — USD — OPEN (Form 15CA/CB required)
  {
    id: "FX-006", date: "2025-10-10", transaction_type: "ROYALTY_PAYMENT",
    currency: "USD", fc_amount: 15000, inr_rate_at_booking: 83.85,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.USD.rbi_reference,
    inr_amount_booked: 1257750, counterparty_name: "Oracle Corp USA",
    counterparty_country: "United States", invoice_number: "BILL-ORC-ROY-2025",
    purpose_code: "S0801", ad_code: "AD0012345", bank_ref: "SWF-US-ROY",
    firc_status: "NOT_REQUIRED", form15ca_ref: "15CA-FX-006",
    form15cb_ref: "15CB-FX-006", dtaa_country: "United States",
    dtaa_benefit: "REDUCED_WHT", withholding_tax_rate: 15, withholding_tax_fc: 2250,
    is_settled: false,
  },
  // 7. Export receipt — AED — SETTLED (UAE DTAA)
  {
    id: "FX-007", date: "2025-08-01", transaction_type: "EXPORT_RECEIPT",
    currency: "AED", fc_amount: 200000, inr_rate_at_booking: 22.72,
    inr_rate_at_settlement: 22.87, inr_amount_booked: 4544000,
    inr_amount_settled: 4574000, counterparty_name: "Emirates Group IT Solutions",
    counterparty_country: "UAE", invoice_number: "INV-EXP-004",
    purpose_code: "P0101", ad_code: "AD0012345", bank_ref: "SWF-AE-001",
    firc_number: "FIRC-2025-002", firc_status: "RECEIVED",
    dtaa_country: "UAE", dtaa_benefit: "NOT_APPLICABLE",
    lut_reference: "LUT-2025-001", is_settled: true, settlement_date: "2025-08-20",
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 8. Advance received — USD — OPEN
  {
    id: "FX-008", date: "2025-10-15", transaction_type: "ADVANCE_RECEIVED",
    currency: "USD", fc_amount: 25000, inr_rate_at_booking: 83.85,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.USD.rbi_reference,
    inr_amount_booked: 2096250, counterparty_name: "Microsoft Corp USA",
    counterparty_country: "United States", purpose_code: "P0101",
    ad_code: "AD0012345", bank_ref: "SWF-MS-ADV",
    firc_number: "FIRC-2025-003", firc_status: "RECEIVED",
    lut_reference: "LUT-2025-001", is_settled: false,
    firc_status: "RECEIVED", withholding_tax_rate: 0, withholding_tax_fc: 0,
    dtaa_benefit: "NOT_APPLICABLE",
  },
  // 9. Import payment — EUR — SETTLED (Realized Gain on payable — EUR weakened)
  {
    id: "FX-009", date: "2025-08-10", transaction_type: "IMPORT_PAYMENT",
    currency: "EUR", fc_amount: 10000, inr_rate_at_booking: 91.05,
    inr_rate_at_settlement: 90.85, inr_amount_booked: 910500,
    inr_amount_settled: 908500, counterparty_name: "SAP SE Germany",
    counterparty_country: "Germany", invoice_number: "BILL-SAP-2025",
    purpose_code: "S0202", ad_code: "AD0012345", bank_ref: "SWF-SAP-001",
    firc_status: "NOT_REQUIRED", form15ca_ref: "15CA-FX-009",
    form15cb_ref: "15CB-FX-009", dtaa_country: "Germany",
    dtaa_benefit: "NOT_APPLICABLE", is_settled: true, settlement_date: "2025-09-01",
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 10. Export receipt — JPY — SETTLED
  {
    id: "FX-010", date: "2025-07-15", transaction_type: "EXPORT_RECEIPT",
    currency: "JPY", fc_amount: 5000000, inr_rate_at_booking: 0.552,
    inr_rate_at_settlement: 0.560, inr_amount_booked: 2760000,
    inr_amount_settled: 2800000, counterparty_name: "Sony Interactive Japan",
    counterparty_country: "Japan", invoice_number: "INV-EXP-005",
    purpose_code: "P0101", ad_code: "AD0012345", bank_ref: "SWF-JP-001",
    firc_number: "FIRC-2025-004", firc_status: "RECEIVED",
    dtaa_country: "Japan", dtaa_benefit: "NOT_APPLICABLE",
    lut_reference: "LUT-2025-001", is_settled: true, settlement_date: "2025-08-05",
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 11. Dividend repatriation — USD — Form 15CA/CB
  {
    id: "FX-011", date: "2025-10-20", transaction_type: "DIVIDEND_REPATRIATION",
    currency: "USD", fc_amount: 100000, inr_rate_at_booking: 83.97,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.USD.rbi_reference,
    inr_amount_booked: 8397000, counterparty_name: "Sequoia Capital Global",
    counterparty_country: "United States", purpose_code: "P0007",
    ad_code: "AD0012345", bank_ref: "SWF-SEQ-DIV",
    firc_status: "NOT_REQUIRED", form15ca_ref: "15CA-FX-011",
    form15cb_ref: "15CB-FX-011", dtaa_country: "United States",
    dtaa_benefit: "REDUCED_WHT", withholding_tax_rate: 15, withholding_tax_fc: 15000,
    is_settled: false,
  },
  // 12. ECB Loan receipt — USD
  {
    id: "FX-012", date: "2025-06-01", transaction_type: "LOAN_RECEIPT",
    currency: "USD", fc_amount: 500000, inr_rate_at_booking: 83.20,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.USD.rbi_reference,
    inr_amount_booked: 41600000, counterparty_name: "Silicon Valley Bank Offshore",
    counterparty_country: "United States", purpose_code: "ECB01",
    ad_code: "AD0012345", bank_ref: "ECB-SVB-2025",
    firc_number: "FIRC-2025-005", firc_status: "RECEIVED",
    dtaa_benefit: "NOT_APPLICABLE", is_settled: false,
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 13. Technical service fee — SGD — WHT
  {
    id: "FX-013", date: "2025-09-15", transaction_type: "PROFESSIONAL_FEE",
    currency: "SGD", fc_amount: 12000, inr_rate_at_booking: 62.00,
    inr_rate_at_settlement: 62.22, inr_amount_booked: 744000,
    inr_amount_settled: 746640, counterparty_name: "Accenture Singapore Pte",
    counterparty_country: "Singapore", purpose_code: "S0299",
    ad_code: "AD0012345", bank_ref: "SWF-SG-TES",
    firc_status: "NOT_REQUIRED", form15ca_ref: "15CA-FX-013",
    dtaa_country: "Singapore", dtaa_benefit: "REDUCED_WHT",
    withholding_tax_rate: 10, withholding_tax_fc: 1200,
    is_settled: true, settlement_date: "2025-10-01",
  },
  // 14. Export receipt — AUD — OPEN
  {
    id: "FX-014", date: "2025-10-05", transaction_type: "EXPORT_RECEIPT",
    currency: "AUD", fc_amount: 40000, inr_rate_at_booking: 53.92,
    inr_rate_at_period_end: RBI_EXCHANGE_RATES.AUD.rbi_reference,
    inr_amount_booked: 2156800, counterparty_name: "ANZ Bank Australia",
    counterparty_country: "Australia", invoice_number: "INV-EXP-006",
    purpose_code: "P0101", ad_code: "AD0012345", bank_ref: "SWF-AU-001",
    firc_status: "PENDING", dtaa_country: "Australia", dtaa_benefit: "NOT_APPLICABLE",
    lut_reference: "LUT-2025-001", is_settled: false,
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
  // 15. Advance paid — USD — SETTLED
  {
    id: "FX-015", date: "2025-09-20", transaction_type: "ADVANCE_PAID",
    currency: "USD", fc_amount: 8000, inr_rate_at_booking: 83.72,
    inr_rate_at_settlement: 83.85, inr_amount_booked: 669760,
    inr_amount_settled: 670800, counterparty_name: "Cloudflare Inc USA",
    counterparty_country: "United States", purpose_code: "S0202",
    ad_code: "AD0012345", bank_ref: "SWF-CF-ADV",
    firc_status: "NOT_REQUIRED", dtaa_benefit: "NOT_APPLICABLE",
    is_settled: true, settlement_date: "2025-10-02",
    withholding_tax_rate: 0, withholding_tax_fc: 0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: COMPUTED FX GAIN / LOSS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FX_GL_RESULTS: ForexGainLoss[] = DEMO_FX_TRANSACTIONS
  .map(t => computeForexGainLoss(t))
  .filter(Boolean) as ForexGainLoss[];

export const DEMO_PORTFOLIO_SUMMARY = computePortfolioSummary(DEMO_FX_TRANSACTIONS);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: FIRC RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_FIRC_RECORDS: FIRCRecord[] = [
  { id: "FIRC-001", firc_number: "FIRC-2025-001", bank_name: "SBI EEFC Branch", date_of_receipt: "2025-09-10", currency: "USD", fc_amount: 50000, inr_equivalent: 4198500, remitter_name: "Acme Corp USA", remitter_country: "United States", purpose: "Export of IT Services", purpose_code: "P0101", linked_invoice: "INV-EXP-001", ad_code: "AD0012345", status: "Utilized" },
  { id: "FIRC-002", firc_number: "FIRC-2025-002", bank_name: "ICICI Bank, Hitech City", date_of_receipt: "2025-08-20", currency: "AED", fc_amount: 200000, inr_equivalent: 4574000, remitter_name: "Emirates Group IT Solutions", remitter_country: "UAE", purpose: "Export of Software Services", purpose_code: "P0101", linked_invoice: "INV-EXP-004", ad_code: "AD0012345", status: "Utilized" },
  { id: "FIRC-003", firc_number: "FIRC-2025-003", bank_name: "HDFC Bank, EEFC", date_of_receipt: "2025-10-16", currency: "USD", fc_amount: 25000, inr_equivalent: 2096250, remitter_name: "Microsoft Corp USA", remitter_country: "United States", purpose: "Advance for IT Services", purpose_code: "P0101", ad_code: "AD0012345", status: "Received" },
  { id: "FIRC-004", firc_number: "FIRC-2025-004", bank_name: "SBI EEFC Branch", date_of_receipt: "2025-08-05", currency: "JPY", fc_amount: 5000000, inr_equivalent: 2800000, remitter_name: "Sony Interactive Japan", remitter_country: "Japan", purpose: "Export of Game Development Services", purpose_code: "P0101", linked_invoice: "INV-EXP-005", ad_code: "AD0012345", status: "Utilized" },
  { id: "FIRC-005", firc_number: "FIRC-2025-005", bank_name: "ICICI Bank, ECB Desk", date_of_receipt: "2025-06-02", currency: "USD", fc_amount: 500000, inr_equivalent: 41600000, remitter_name: "Silicon Valley Bank Offshore", remitter_country: "United States", purpose: "External Commercial Borrowing (ECB)", purpose_code: "ECB01", ad_code: "AD0012345", status: "Received" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: LUT / BOND REGISTER & ZERO-RATED SUPPLIES
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_ZERO_RATED_SUPPLIES: ZeroRatedSupply[] = [
  { id: "ZRS-001", invoice_number: "INV-EXP-001", invoice_date: "2025-08-15", buyer_name: "Acme Corp USA", buyer_country: "United States", currency: "USD", fc_amount: 50000, inr_value: 4171000, igst_applicable: 750780, lut_reference: "LUT-2025-001", firc_number: "FIRC-2025-001", refund_status: "FILED", rfd01_ref: "ARN-RFD01-001" },
  { id: "ZRS-002", invoice_number: "INV-EXP-002", invoice_date: "2025-09-01", buyer_name: "TechGiant GmbH Germany", buyer_country: "Germany", currency: "EUR", fc_amount: 30000, inr_value: 2725500, igst_applicable: 490590, lut_reference: "LUT-2025-001", refund_status: "NOT_FILED" },
  { id: "ZRS-003", invoice_number: "INV-EXP-003", invoice_date: "2025-10-01", buyer_name: "Singtel Ventures Pte Ltd", buyer_country: "Singapore", currency: "SGD", fc_amount: 80000, inr_value: 4948000, igst_applicable: 890640, lut_reference: "LUT-2025-001", refund_status: "NOT_FILED" },
  { id: "ZRS-004", invoice_number: "INV-EXP-004", invoice_date: "2025-08-01", buyer_name: "Emirates Group IT Solutions", buyer_country: "UAE", currency: "AED", fc_amount: 200000, inr_value: 4544000, igst_applicable: 817920, lut_reference: "LUT-2025-001", firc_number: "FIRC-2025-002", refund_status: "SANCTIONED", rfd01_ref: "ARN-RFD01-001" },
  { id: "ZRS-005", invoice_number: "INV-EXP-005", invoice_date: "2025-07-15", buyer_name: "Sony Interactive Japan", buyer_country: "Japan", currency: "JPY", fc_amount: 5000000, inr_value: 2760000, igst_applicable: 496800, lut_reference: "LUT-2025-001", firc_number: "FIRC-2025-004", refund_status: "PAID", rfd01_ref: "ARN-RFD01-002" },
  { id: "ZRS-006", invoice_number: "INV-EXP-006", invoice_date: "2025-10-05", buyer_name: "ANZ Bank Australia", buyer_country: "Australia", currency: "AUD", fc_amount: 40000, inr_value: 2156800, igst_applicable: 388224, lut_reference: "LUT-2025-001", refund_status: "NOT_FILED" },
];

export const DEMO_LUT_RECORDS: LUTRecord[] = [
  {
    id: "LUT-001", lut_number: "LUT-2025-001", financial_year: "2025-26",
    date_of_filing: "2025-04-01", date_of_validity: "2026-03-31",
    status: "ACTIVE", gstin: "27AAKCS1234F1Z5",
    cumulative_export_value: DEMO_ZERO_RATED_SUPPLIES.reduce((s, z) => s + z.inr_value, 0),
    zero_rated_supplies: DEMO_ZERO_RATED_SUPPLIES,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: RFD-01 REFUND CLAIMS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_RFD01_CLAIMS: RFD01Claim[] = [
  {
    id: "RFD-001", arn_number: "ARN-RFD01-001", filing_date: "2025-09-15",
    period_from: "2025-07-01", period_to: "2025-08-31",
    refund_type: "EXPORT_ZERO_RATED",
    total_igst_claimed: 1568700, total_cess_claimed: 0,
    bank_account: "ICICI-000405012345",
    status: "SANCTIONED", sanction_order_number: "SCN-2025-0881",
    amount_sanctioned: 1568700,
  },
  {
    id: "RFD-002", arn_number: "ARN-RFD01-002", filing_date: "2025-08-10",
    period_from: "2025-07-01", period_to: "2025-07-31",
    refund_type: "EXPORT_ZERO_RATED",
    total_igst_claimed: 496800, total_cess_claimed: 0,
    bank_account: "ICICI-000405012345",
    status: "PAID", sanction_order_number: "SCN-2025-0712",
    amount_sanctioned: 496800, amount_paid: 496800, payment_date: "2025-09-05",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: FORM 15CA & 15CB DRAFTS (for IMPORT payments & royalties)
// ─────────────────────────────────────────────────────────────────────────────

const royaltyTxn = DEMO_FX_TRANSACTIONS.find(t => t.id === "FX-006")!;
const profFeeGBP  = DEMO_FX_TRANSACTIONS.find(t => t.id === "FX-004")!;
const divTxn      = DEMO_FX_TRANSACTIONS.find(t => t.id === "FX-011")!;

export const DEMO_FORM15CA_LIST: Form15CA[] = [
  generateForm15CA(royaltyTxn, 15, "PART_C"),
  generateForm15CA(profFeeGBP, 15, "PART_C"),
  generateForm15CA(divTxn, 15, "PART_C"),
];

export const DEMO_FORM15CB_LIST: Form15CB[] = DEMO_FORM15CA_LIST.map(f15ca => generateForm15CB(f15ca));

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: TRANSFER PRICING RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_TP_RECORDS: TransferPricingRecord[] = [
  {
    id: "TP-001", financial_year: "2025-26",
    transaction_type: "Export of IT Services (ITES) to AE",
    associated_enterprise_name: "Sannidh Technologies Inc (USA subsidiary)",
    associated_enterprise_country: "United States",
    transaction_currency: "USD", transaction_value_fc: 180000,
    transaction_value_inr: 15102000, arms_length_price: 15200000,
    method_used: "TNMM", adjustment: 98000,
    form3ceb_filed: true, form3ceb_date: "2025-10-31",
    audit_report_date: "2025-10-31", is_safe_harbour_eligible: true,
  },
  {
    id: "TP-002", financial_year: "2025-26",
    transaction_type: "Payment of Royalty to Foreign AE",
    associated_enterprise_name: "Oracle Corp USA (IP Licensor)",
    associated_enterprise_country: "United States",
    transaction_currency: "USD", transaction_value_fc: 15000,
    transaction_value_inr: 1257750, arms_length_price: 1280000,
    method_used: "CUP", adjustment: 22250,
    form3ceb_filed: false, is_safe_harbour_eligible: false,
  },
  {
    id: "TP-003", financial_year: "2025-26",
    transaction_type: "Management Fee from Parent AE",
    associated_enterprise_name: "Sannidh Global Holdings BV (Netherlands)",
    associated_enterprise_country: "Netherlands",
    transaction_currency: "EUR", transaction_value_fc: 8000,
    transaction_value_inr: 726800, arms_length_price: 730000,
    method_used: "TNMM", adjustment: 3200,
    form3ceb_filed: true, form3ceb_date: "2025-10-31",
    audit_report_date: "2025-10-31", is_safe_harbour_eligible: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: TRC REGISTER
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_TRC_RECORDS: TRCRecord[] = [
  {
    id: "TRC-001", entity_name: "Oracle Corp USA", country_of_residence: "United States",
    trc_number: "TRC-IRS-2025-A1234", issuing_authority: "US Internal Revenue Service",
    validity_from: "2025-01-01", validity_to: "2025-12-31",
    currency_of_benefit: "USD", dtaa_articles_claimed: ["Article 12 (Royalties)", "Article 13 (FTS)"],
    form10f_reference: "FORM10F-US-2025", linked_transactions: ["FX-006"],
    status: "VALID",
  },
  {
    id: "TRC-002", entity_name: "Deloitte UK Advisory LLP", country_of_residence: "United Kingdom",
    trc_number: "TRC-HMRC-2025-B5678", issuing_authority: "HM Revenue & Customs UK",
    validity_from: "2025-01-01", validity_to: "2025-12-31",
    currency_of_benefit: "GBP", dtaa_articles_claimed: ["Article 15 (Fees for Technical Services)"],
    form10f_reference: "FORM10F-UK-2025", linked_transactions: ["FX-004"],
    status: "VALID",
  },
  {
    id: "TRC-003", entity_name: "Accenture Singapore Pte", country_of_residence: "Singapore",
    trc_number: "TRC-IRAS-2025-C9012", issuing_authority: "Inland Revenue Authority of Singapore",
    validity_from: "2025-01-01", validity_to: "2025-12-31",
    currency_of_benefit: "SGD", dtaa_articles_claimed: ["Article 12 (FTS)"],
    form10f_reference: "FORM10F-SG-2025", linked_transactions: ["FX-013"],
    status: "VALID",
  },
  {
    id: "TRC-004", entity_name: "Sequoia Capital Global", country_of_residence: "United States",
    trc_number: "TRC-IRS-2024-D3456", issuing_authority: "US Internal Revenue Service",
    validity_from: "2024-01-01", validity_to: "2024-12-31",
    currency_of_benefit: "USD", dtaa_articles_claimed: ["Article 10 (Dividends)"],
    form10f_reference: "FORM10F-SEQ-2024", linked_transactions: ["FX-011"],
    status: "EXPIRED",
  },
];
