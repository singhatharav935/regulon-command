/**
 * DEMO BANK RECONCILIATION DATASETS — PHASE 7 (COMPLETE)
 * ========================================================
 * 30+ realistic bank transactions across ICICI, HDFC, SBI, Axis, Kotak,
 * RazorpayX covering ALL payment types:
 * UPI (P2P/P2M/VPA), NEFT, RTGS, IMPS, Card POS, PG Net Settlement (MDR),
 * NACH/ECS Auto-Debit, Cheque Clearing, Bank Charges, Tax Challans, SWIFT FX
 */

import {
  parseNarration,
  matchStatementToDocuments,
  computeReconciliationSummary,
  type BankStatementLine,
  type SystemDocument,
  type MatchCandidate,
  type ReconciliationSummary,
} from "@/lib/accounting/bank-statement-reconciler";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: BANK STATEMENT LINES — 30 TRANSACTIONS ALL TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_BANK_STATEMENT_LINES: BankStatementLine[] = [
  // 1. NEFT Credit — Sales Invoice receipt
  {
    id: "STMT-001", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-05", post_date: "2025-10-05",
    narration: "NEFT-N27825001-TECHSOFT CONSULTING-MUMBAI",
    ref_number: "N27825001", type: "CREDIT", amount: 450000, balance_after: 2300000,
    ...parseNarration("NEFT-N27825001-TECHSOFT CONSULTING-MUMBAI", "CREDIT"),
  },
  // 2. Tax Challan 281 TDS Payment
  {
    id: "STMT-002", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-07", post_date: "2025-10-07",
    narration: "CHALLAN 281/CBDT/TDS DEPOSIT Q2/BS0210001",
    ref_number: "BS0210001", type: "DEBIT", amount: 9600, balance_after: 2290400,
    ...parseNarration("CHALLAN 281/CBDT/TDS DEPOSIT Q2/BS0210001", "DEBIT"),
  },
  // 3. UPI Credit — B2B customer payment
  {
    id: "STMT-003", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-12", post_date: "2025-10-12",
    narration: "UPI/528512349012/INFOSYS LTD/pay@icici",
    ref_number: "528512349012", type: "CREDIT", amount: 820000, balance_after: 3110400,
    ...parseNarration("UPI/528512349012/INFOSYS LTD/pay@icici", "CREDIT"),
  },
  // 4. NEFT Debit — Purchase bill payment
  {
    id: "STMT-004", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-15", post_date: "2025-10-15",
    narration: "NEFT-N28825099-DELL INDIA PVT LTD-BANGALORE",
    ref_number: "N28825099", type: "DEBIT", amount: 320000, balance_after: 2790400,
    ...parseNarration("NEFT-N28825099-DELL INDIA PVT LTD-BANGALORE", "DEBIT"),
  },
  // 5. Razorpay PG Net Settlement with MDR
  {
    id: "STMT-005", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-18", post_date: "2025-10-18",
    narration: "RAZORPAY POS SETTLEMENT/RZP992012/NET",
    ref_number: "RZP992012", type: "CREDIT", amount: 147000, balance_after: 2937400,
    ...parseNarration("RAZORPAY POS SETTLEMENT/RZP992012/NET", "CREDIT"),
  },
  // 6. GST PMT-06 Tax Payment
  {
    id: "STMT-006", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-20", post_date: "2025-10-20",
    narration: "GST PMT-06/ONLINE/27AAKCS1234F1Z5/CPIN9012",
    ref_number: "CPIN9012", type: "DEBIT", amount: 81000, balance_after: 2856400,
    ...parseNarration("GST PMT-06/ONLINE/27AAKCS1234F1Z5/CPIN9012", "DEBIT"),
  },
  // 7. IMPS Payroll disbursement
  {
    id: "STMT-007", bank_name: "HDFC", account_number: "50200012345678",
    value_date: "2025-10-25", post_date: "2025-10-25",
    narration: "IMPS/529810992301/SALARY OCT 2025 BATCH",
    ref_number: "529810992301", type: "DEBIT", amount: 450000, balance_after: 2406400,
    ...parseNarration("IMPS/529810992301/SALARY OCT 2025 BATCH", "DEBIT"),
  },
  // 8. Bank Charges + GST
  {
    id: "STMT-008", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-28", post_date: "2025-10-28",
    narration: "BANK COMM & GST ON ONLINE NEFT/RTGS CHG",
    ref_number: "CHG-OCT25", type: "DEBIT", amount: 1475, balance_after: 2404925,
    ...parseNarration("BANK COMM & GST ON ONLINE NEFT/RTGS CHG", "DEBIT"),
  },
  // 9. SWIFT FX Inward Remittance (USD)
  {
    id: "STMT-009", bank_name: "RAZORPAYX", account_number: "RZPX-998822",
    value_date: "2025-10-30", post_date: "2025-10-30",
    narration: "SWIFT TT INWARD/USD 10000/ACME CORP USA",
    ref_number: "SWF9012384", type: "CREDIT", amount: 835000, balance_after: 3239925,
    ...parseNarration("SWIFT TT INWARD/USD 10000/ACME CORP USA", "CREDIT"),
  },
  // 10. RTGS Payment — Large vendor
  {
    id: "STMT-010", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-02", post_date: "2025-10-02",
    narration: "RTGS/ICIC42012001/AWS INDIA PVT LTD/INFRAST",
    ref_number: "ICIC42012001", type: "DEBIT", amount: 1250000, balance_after: 1050000,
    ...parseNarration("RTGS/ICIC42012001/AWS INDIA PVT LTD/INFRAST", "DEBIT"),
  },
  // 11. RTGS Credit — Large customer
  {
    id: "STMT-011", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-03", post_date: "2025-10-03",
    narration: "RTGS/HDFC23001/WIPRO LTD/PO-2025-091",
    ref_number: "HDFC23001", type: "CREDIT", amount: 2100000, balance_after: 3150000,
    ...parseNarration("RTGS/HDFC23001/WIPRO LTD/PO-2025-091", "CREDIT"),
  },
  // 12. UPI Debit — Office supplies payment via GPay
  {
    id: "STMT-012", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-08", post_date: "2025-10-08",
    narration: "UPI/529001920311/AMAZON BUSINESS/amazon@upi",
    ref_number: "529001920311", type: "DEBIT", amount: 45000, balance_after: 3105000,
    ...parseNarration("UPI/529001920311/AMAZON BUSINESS/amazon@upi", "DEBIT"),
  },
  // 13. Cheque Clearing — Inward
  {
    id: "STMT-013", bank_name: "SBI", account_number: "30051234567",
    value_date: "2025-10-10", post_date: "2025-10-11",
    narration: "CHQ CLG/123456/MAHINDRA STEEL ALLOYS",
    ref_number: "123456", type: "CREDIT", amount: 380000, balance_after: 1480000,
    ...parseNarration("CHQ CLG/123456/MAHINDRA STEEL ALLOYS", "CREDIT"),
  },
  // 14. Cheque Clearing — Outward
  {
    id: "STMT-014", bank_name: "SBI", account_number: "30051234567",
    value_date: "2025-10-11", post_date: "2025-10-12",
    narration: "CHQ CLG OUT/789012/OFFICE RENT PAYMENT",
    ref_number: "789012", type: "DEBIT", amount: 120000, balance_after: 1360000,
    ...parseNarration("CHQ CLG OUT/789012/OFFICE RENT PAYMENT", "DEBIT"),
  },
  // 15. NACH / ECS — Loan EMI Auto-Debit
  {
    id: "STMT-015", bank_name: "HDFC", account_number: "50200012345678",
    value_date: "2025-10-05", post_date: "2025-10-05",
    narration: "NACH DR/HDFC LOAN/EMI-OCT25/LN90012345",
    ref_number: "LN90012345", type: "DEBIT", amount: 85000, balance_after: 715000,
    ...parseNarration("NACH DR/HDFC LOAN/EMI-OCT25/LN90012345", "DEBIT"),
  },
  // 16. NACH / ECS — SIP Investment Debit
  {
    id: "STMT-016", bank_name: "HDFC", account_number: "50200012345678",
    value_date: "2025-10-07", post_date: "2025-10-07",
    narration: "ECS DR/HDFC MUTUAL FUND/SIP/FOLIO8821",
    ref_number: "FOLIO8821", type: "DEBIT", amount: 25000, balance_after: 690000,
    ...parseNarration("ECS DR/HDFC MUTUAL FUND/SIP/FOLIO8821", "DEBIT"),
  },
  // 17. Cashfree PG Settlement
  {
    id: "STMT-017", bank_name: "AXIS", account_number: "9200001234567",
    value_date: "2025-10-19", post_date: "2025-10-19",
    narration: "CASHFREE SETTLEMENT/CF20251019/NET",
    ref_number: "CF20251019", type: "CREDIT", amount: 67500, balance_after: 1167500,
    ...parseNarration("CASHFREE SETTLEMENT/CF20251019/NET", "CREDIT"),
  },
  // 18. Paytm UPI P2M
  {
    id: "STMT-018", bank_name: "KOTAK", account_number: "1234567890",
    value_date: "2025-10-22", post_date: "2025-10-22",
    narration: "UPI/5301234567890/PAYTM MERCHANT/paytm@upi",
    ref_number: "5301234567890", type: "CREDIT", amount: 15000, balance_after: 895000,
    ...parseNarration("UPI/5301234567890/PAYTM MERCHANT/paytm@upi", "CREDIT"),
  },
  // 19. Interest Credited — Bank FD
  {
    id: "STMT-019", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-15", post_date: "2025-10-15",
    narration: "INT.PD ON FD/FD90012/QUARTERLY INTEREST",
    ref_number: "FD90012", type: "CREDIT", amount: 12500, balance_after: 3162500,
    ...parseNarration("INT.PD ON FD/FD90012/QUARTERLY INTEREST", "CREDIT"),
  },
  // 20. SMS Alert Charges
  {
    id: "STMT-020", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-31", post_date: "2025-10-31",
    narration: "SMS CHG OCT 2025 + GST",
    ref_number: "SMSCHG-OCT25", type: "DEBIT", amount: 59, balance_after: 3239925,
    ...parseNarration("SMS CHG OCT 2025 + GST", "DEBIT"),
  },
  // 21. NEFT from YES Bank — Consulting Receipt
  {
    id: "STMT-021", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-09", post_date: "2025-10-09",
    narration: "NEFT-N29100012-ZETA RAW MATERIALS-DELHI",
    ref_number: "N29100012", type: "CREDIT", amount: 680000, balance_after: 3785000,
    ...parseNarration("NEFT-N29100012-ZETA RAW MATERIALS-DELHI", "CREDIT"),
  },
  // 22. TDS Challan 280 Advance Tax
  {
    id: "STMT-022", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-15", post_date: "2025-10-15",
    narration: "CHALLAN 280/CBDT/ADVANCE TAX Q2/CHL280-0091",
    ref_number: "CHL280-0091", type: "DEBIT", amount: 135000, balance_after: 3650000,
    ...parseNarration("CHALLAN 280/CBDT/ADVANCE TAX Q2/CHL280-0091", "DEBIT"),
  },
  // 23. Kotak Bank IMPS — Vendor Payment
  {
    id: "STMT-023", bank_name: "KOTAK", account_number: "1234567890",
    value_date: "2025-10-16", post_date: "2025-10-16",
    narration: "IMPS/530120922001/ORACLE INDIA PVT LTD",
    ref_number: "530120922001", type: "DEBIT", amount: 198000, balance_after: 697000,
    ...parseNarration("IMPS/530120922001/ORACLE INDIA PVT LTD", "DEBIT"),
  },
  // 24. Card POS Settlement — Retail terminals
  {
    id: "STMT-024", bank_name: "AXIS", account_number: "9200001234567",
    value_date: "2025-10-23", post_date: "2025-10-23",
    narration: "POS SETTLEMENT/EDC TID:89022/NET AMOUNT",
    ref_number: "EDC89022", type: "CREDIT", amount: 42500, balance_after: 1210000,
    ...parseNarration("POS SETTLEMENT/EDC TID:89022/NET AMOUNT", "CREDIT"),
  },
  // 25. NEFT Debit — Professional Fee Payment
  {
    id: "STMT-025", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-17", post_date: "2025-10-17",
    narration: "NEFT-N29001991-CA FIRM RETAINER/OCT25",
    ref_number: "N29001991", type: "DEBIT", amount: 55000, balance_after: 3595000,
    ...parseNarration("NEFT-N29001991-CA FIRM RETAINER/OCT25", "DEBIT"),
  },
  // 26. Inward SWIFT — Export client EUR
  {
    id: "STMT-026", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-21", post_date: "2025-10-21",
    narration: "SWIFT INWARD/EUR 8500/TECHGIANT GMBH GERMANY",
    ref_number: "SWF9012911", type: "CREDIT", amount: 770000, balance_after: 4365000,
    ...parseNarration("SWIFT INWARD/EUR 8500/TECHGIANT GMBH GERMANY", "CREDIT"),
  },
  // 27. UPI Debit — Restaurant / Petty Cash
  {
    id: "STMT-027", bank_name: "HDFC", account_number: "50200012345678",
    value_date: "2025-10-14", post_date: "2025-10-14",
    narration: "UPI/5288119923/ZOMATO ORDER/zomato@icici",
    ref_number: "5288119923", type: "DEBIT", amount: 1850, balance_after: 688150,
    ...parseNarration("UPI/5288119923/ZOMATO ORDER/zomato@icici", "DEBIT"),
  },
  // 28. NACH Credit — Insurance Premium Refund
  {
    id: "STMT-028", bank_name: "HDFC", account_number: "50200012345678",
    value_date: "2025-10-26", post_date: "2025-10-26",
    narration: "ACH CR/HDFC ERGO/INSURANCE REFUND/POL9921",
    ref_number: "POL9921", type: "CREDIT", amount: 12000, balance_after: 700150,
    ...parseNarration("ACH CR/HDFC ERGO/INSURANCE REFUND/POL9921", "CREDIT"),
  },
  // 29. IndusInd RTGS — Big Client
  {
    id: "STMT-029", bank_name: "ICICI", account_number: "000405012345",
    value_date: "2025-10-24", post_date: "2025-10-24",
    narration: "RTGS/INDB88012/EMBASSY HEALTHCARE/INV-USD-101",
    ref_number: "INDB88012", type: "CREDIT", amount: 1580000, balance_after: 5945000,
    ...parseNarration("RTGS/INDB88012/EMBASSY HEALTHCARE/INV-USD-101", "CREDIT"),
  },
  // 30. Processing Fee — Loan Setup
  {
    id: "STMT-030", bank_name: "AXIS", account_number: "9200001234567",
    value_date: "2025-10-01", post_date: "2025-10-01",
    narration: "LOAN PROC FEE + GST/AXIS BANK/LAC20012",
    ref_number: "LAC20012", type: "DEBIT", amount: 59000, balance_after: 1100000,
    ...parseNarration("LOAN PROC FEE + GST/AXIS BANK/LAC20012", "DEBIT"),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: OPEN SYSTEM DOCUMENTS (25 records)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_SYSTEM_DOCUMENTS: SystemDocument[] = [
  { id: "DOC-INV-001", doc_type: "SALES_INVOICE", doc_number: "INV-2025-001", doc_date: "2025-10-05", party_name: "TechSoft Consulting", party_pan: "AABCP1234K", party_gstin: "27AABCM5678G1Z3", amount: 450000, tax_amount: 81000, outstanding_amount: 450000, status: "OPEN", ref_pattern: "N27825001" },
  { id: "DOC-INV-002", doc_type: "SALES_INVOICE", doc_number: "INV-2025-002", doc_date: "2025-10-12", party_name: "Infosys Ltd", party_pan: "AAACZ1234K", party_gstin: "29AAACZ1234K1Z5", amount: 820000, tax_amount: 147600, outstanding_amount: 820000, status: "OPEN", ref_pattern: "528512349012" },
  { id: "DOC-BILL-001", doc_type: "PURCHASE_BILL", doc_number: "BILL-2025-089", doc_date: "2025-10-14", party_name: "Dell India Pvt Ltd", party_pan: "AAACD9988G", amount: 320000, tax_amount: 57600, outstanding_amount: 320000, status: "OPEN", ref_pattern: "N28825099" },
  { id: "DOC-INV-003", doc_type: "SALES_INVOICE", doc_number: "INV-2025-003", doc_date: "2025-10-18", party_name: "Razorpay POS Customers", amount: 150000, tax_amount: 27000, outstanding_amount: 150000, status: "OPEN", ref_pattern: "RZP992012" },
  { id: "DOC-CHL-001", doc_type: "TAX_CHALLAN", doc_number: "CHL-TDS-Q2", doc_date: "2025-10-07", party_name: "Income Tax Department (TDS)", amount: 9600, outstanding_amount: 9600, status: "OPEN", ref_pattern: "BS0210001" },
  { id: "DOC-CHL-002", doc_type: "TAX_CHALLAN", doc_number: "CHL-GST-OCT25", doc_date: "2025-10-20", party_name: "GST Treasury (PMT-06)", amount: 81000, outstanding_amount: 81000, status: "OPEN", ref_pattern: "CPIN9012" },
  { id: "DOC-PAYROLL-001", doc_type: "PAYROLL_SLIP", doc_number: "PAY-OCT-2025", doc_date: "2025-10-25", party_name: "Company Employee Payroll", amount: 450000, outstanding_amount: 450000, status: "OPEN", ref_pattern: "529810992301" },
  { id: "DOC-INV-004", doc_type: "SALES_INVOICE", doc_number: "INV-USD-101", doc_date: "2025-10-29", party_name: "Acme Corp USA", amount: 835000, outstanding_amount: 835000, status: "OPEN", ref_pattern: "SWF9012384" },
  { id: "DOC-BILL-002", doc_type: "PURCHASE_BILL", doc_number: "BILL-AWS-OCT25", doc_date: "2025-10-01", party_name: "Amazon Web Services India", amount: 1250000, tax_amount: 225000, outstanding_amount: 1250000, status: "OPEN", ref_pattern: "ICIC42012001" },
  { id: "DOC-INV-005", doc_type: "SALES_INVOICE", doc_number: "INV-2025-005", doc_date: "2025-10-02", party_name: "Wipro Limited", party_gstin: "29AAACW0035C1Z8", amount: 2100000, tax_amount: 378000, outstanding_amount: 2100000, status: "OPEN", ref_pattern: "HDFC23001" },
  { id: "DOC-INV-006", doc_type: "SALES_INVOICE", doc_number: "INV-2025-006", doc_date: "2025-10-09", party_name: "Zeta Raw Materials", amount: 680000, tax_amount: 122400, outstanding_amount: 680000, status: "OPEN", ref_pattern: "N29100012" },
  { id: "DOC-CHL-003", doc_type: "TAX_CHALLAN", doc_number: "CHL-ADV-Q2", doc_date: "2025-10-15", party_name: "Income Tax Department (Advance Tax)", amount: 135000, outstanding_amount: 135000, status: "OPEN", ref_pattern: "CHL280-0091" },
  { id: "DOC-BILL-003", doc_type: "PURCHASE_BILL", doc_number: "BILL-ORACLE-001", doc_date: "2025-10-15", party_name: "Oracle India Pvt Ltd", amount: 198000, tax_amount: 35640, outstanding_amount: 198000, status: "OPEN", ref_pattern: "530120922001" },
  { id: "DOC-INV-007", doc_type: "SALES_INVOICE", doc_number: "INV-EUR-001", doc_date: "2025-10-20", party_name: "TechGiant GmbH Germany", amount: 770000, outstanding_amount: 770000, status: "OPEN", ref_pattern: "SWF9012911" },
  { id: "DOC-INV-008", doc_type: "SALES_INVOICE", doc_number: "INV-2025-008", doc_date: "2025-10-23", party_name: "Embassy Healthcare", amount: 1580000, tax_amount: 284400, outstanding_amount: 1580000, status: "OPEN", ref_pattern: "INDB88012" },
  { id: "DOC-INV-009", doc_type: "SALES_INVOICE", doc_number: "INV-MCH-001", doc_date: "2025-10-21", party_name: "Mahindra Steel & Alloys", amount: 380000, tax_amount: 68400, outstanding_amount: 380000, status: "OPEN", ref_pattern: "123456" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: COMPUTED RECONCILIATION MATCHES & SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_MATCH_CANDIDATES: MatchCandidate[] = matchStatementToDocuments(
  DEMO_BANK_STATEMENT_LINES,
  DEMO_SYSTEM_DOCUMENTS
);

export const DEMO_RECON_SUMMARY: ReconciliationSummary = computeReconciliationSummary(
  DEMO_BANK_STATEMENT_LINES,
  DEMO_MATCH_CANDIDATES,
  1850000
);

// Unmatched lines = lines that have no candidate
export const DEMO_UNMATCHED_LINES: BankStatementLine[] = DEMO_BANK_STATEMENT_LINES.filter(
  line => !DEMO_MATCH_CANDIDATES.some(c => c.statement_id === line.id)
);

// Statement import history (mock)
export interface StatementImportRecord {
  id: string;
  bank_name: string;
  account_number: string;
  import_date: string;
  period: string;
  total_lines: number;
  matched: number;
  unmatched: number;
  status: "Completed" | "Partial" | "Error";
  file_name: string;
}

export const DEMO_IMPORT_HISTORY: StatementImportRecord[] = [
  { id: "IMP-001", bank_name: "ICICI Bank", account_number: "000405012345", import_date: "2025-11-01", period: "Oct 2025", total_lines: 22, matched: 19, unmatched: 3, status: "Completed", file_name: "ICICI_Oct2025.csv" },
  { id: "IMP-002", bank_name: "HDFC Bank", account_number: "50200012345678", import_date: "2025-11-01", period: "Oct 2025", total_lines: 8, matched: 7, unmatched: 1, status: "Completed", file_name: "HDFC_Oct2025.xlsx" },
  { id: "IMP-003", bank_name: "RazorpayX", account_number: "RZPX-998822", import_date: "2025-11-01", period: "Oct 2025", total_lines: 1, matched: 1, unmatched: 0, status: "Completed", file_name: "RazorpayX_Oct2025.csv" },
  { id: "IMP-004", bank_name: "ICICI Bank", account_number: "000405012345", import_date: "2025-10-01", period: "Sep 2025", total_lines: 20, matched: 18, unmatched: 2, status: "Completed", file_name: "ICICI_Sep2025.csv" },
  { id: "IMP-005", bank_name: "SBI", account_number: "30051234567", import_date: "2025-10-02", period: "Sep 2025", total_lines: 5, matched: 4, unmatched: 1, status: "Partial", file_name: "SBI_Sep2025.pdf" },
];
