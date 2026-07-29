/**
 * DEMO STATUTORY NOTICE DATA — PHASE 4
 * ======================================
 * ⚠️  FOR DEMO DASHBOARDS ONLY
 *
 * Realistic statutory notice dataset for:
 *  — GST ASMT-10 Scrutiny Notice
 *  — GST SCN u/s 74 (Fraud allegation)
 *  — GST DRC-01 Demand
 *  — IT Notice u/s 143(2) Scrutiny
 *  — IT Notice u/s 148 Reassessment
 *  — IT Order u/s 201(1) TDS Default
 *  — MCA DIR-3 KYC Notice
 *  — EPFO Demand u/s 7A
 */

import {
  classifyNotice,
  calculateDueDate,
  generateLegalDraftResponse,
  computeNoticeRiskScore,
  type StatutoryNotice,
  type LegalDraftResponse,
  type NoticeRiskScore,
  CASE_LAW_DATABASE,
} from "@/lib/accounting/statutory-notice-parser";

// ─────────────────────────────────────────────────────────────────────────────
// RAW NOTICE DATA
// ─────────────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

export const DEMO_STATUTORY_NOTICES: StatutoryNotice[] = [
  // ── 1. GST ASMT-10 SCRUTINY ──────────────────────────────────────────────
  {
    id: "NTC-001",
    notice_type: "ASMT-10",
    notice_number: "ZB2700CGST/SCR/2025-26/001234",
    notice_date: "2025-07-01",
    response_due_date: "2025-07-31",
    days_remaining: calculateDueDate("2025-07-01", 30).days_remaining,
    issuing_authority: "GST_DEPARTMENT",
    issuing_officer: "Shri Ramesh Nair, DCGST",
    issuing_office: "CGST & Central Excise Division — Mumbai West — Range III",
    category: "GST_SCRUTINY",
    severity: "HIGH",
    status: "RECEIVED",
    company_pan: "AAKCS1234F",
    company_gstin: "27AAKCS1234F1Z5",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    tax_period: "April 2024 – March 2025",
    demand_amount: 1820000,
    interest_amount: 182000,
    penalty_amount: 182000,
    total_demand: 2184000,
    legal_grounds: ["Section 61 CGST Act 2017", "Rule 99 CGST Rules 2017"],
    issues_raised: [
      {
        issue_id: "ISS-001-A",
        description: "Mismatch between GSTR-1 (outward supplies declared) and GSTR-3B (tax paid) — excess ITC claimed of ₹18,20,000",
        amount_involved: 1820000,
        section_invoked: "Section 61 CGST Act 2017",
        department_contention: "Your GSTR-3B for the period April 2024 – March 2025 reflects ITC claim of ₹43,20,000 whereas GSTR-2B auto-populated ITC is only ₹25,00,000. Excess ITC of ₹18,20,000 has been availed without matching vendor invoices in GSTR-2B.",
        taxpayer_defense: "The excess ITC of ₹18,20,000 represents invoices received from registered vendors whose GSTR-1 filings were delayed due to system issues on the GST portal. These invoices were subsequently reported in the next period GSTR-2B. The ITC has been correctly availed as all purchases are genuine, documented, and for business purposes. As held by the Supreme Court in Bharti Airtel Ltd (2024), ITC cannot be denied merely because the supplier has not filed GSTR-1 when the buyer's bonafide entitlement is established through valid tax invoices.",
        case_laws: CASE_LAW_DATABASE["GST_SCRUTINY"] || [],
      },
      {
        issue_id: "ISS-001-B",
        description: "Discrepancy in HSN-wise summary — HSN 998314 (IT Services) not matching between GSTR-1 and e-Invoice data",
        amount_involved: 0,
        section_invoked: "Rule 46 CGST Rules 2017",
        department_contention: "HSN code 998314 declared in GSTR-1 does not match with HSN codes in e-Invoices generated through IRP portal.",
        taxpayer_defense: "The discrepancy is a data entry error in GSTR-1 — the correct HSN code is 998314 (IT Software Development Services at 18% GST). The e-Invoice data is accurate. Amendment to GSTR-1 for the same has been filed in the subsequent month as permitted under Section 37(3) of the CGST Act. No revenue loss has occurred as tax has been correctly paid at 18%.",
        case_laws: [],
      },
    ],
    extracted_fields: [
      { field_name: "Notice Number", value: "ZB2700CGST/SCR/2025-26/001234", confidence: "high" },
      { field_name: "GSTIN", value: "27AAKCS1234F1Z5", confidence: "high" },
      { field_name: "Tax Period", value: "April 2024 – March 2025", confidence: "high" },
      { field_name: "Demand Amount (₹)", value: "18,20,000", confidence: "high" },
    ],
  },

  // ── 2. GST SCN u/s 74 ────────────────────────────────────────────────────
  {
    id: "NTC-002",
    notice_type: "SCN u/s 74",
    notice_number: "SCN/74/MUM/2025-26/0089",
    notice_date: "2025-06-15",
    response_due_date: "2025-07-15",
    days_remaining: calculateDueDate("2025-06-15", 30).days_remaining,
    issuing_authority: "GST_DEPARTMENT",
    issuing_officer: "Smt. Priya Desai, Addl. Commissioner GST",
    issuing_office: "GST Commissionerate Mumbai Central — Audit Circle II",
    category: "GST_DEMAND",
    severity: "CRITICAL",
    status: "RESPONSE_DRAFTED",
    company_pan: "AAKCS1234F",
    company_gstin: "27AAKCS1234F1Z5",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    tax_period: "FY 2023-24",
    demand_amount: 5400000,
    interest_amount: 1080000,
    penalty_amount: 5400000,
    total_demand: 11880000,
    legal_grounds: ["Section 74(1) CGST Act 2017", "Section 50 CGST Act 2017"],
    issues_raised: [
      {
        issue_id: "ISS-002-A",
        description: "Wrongful availment of ITC on blocked credit items — laptops and mobile phones treated as capital goods for IT business",
        amount_involved: 5400000,
        section_invoked: "Section 74(1) read with Section 17(5)(g) CGST Act",
        department_contention: "ITC of ₹54,00,000 availed on purchase of laptops and computer peripherals is ineligible under Section 17(5) as these are goods used for personal consumption. The same constitutes fraud / wilful misstatement attracting 100% penalty u/s 74.",
        taxpayer_defense: "The laptops and computer peripherals are used exclusively for software development — a core business activity of an IT company. Section 17(5) blocks ITC on 'goods for personal consumption' only. As per CBIC Circular 172/04/2022 dated 6th July 2022, electronic devices used as inputs in business processes are eligible for ITC. The allegation of fraud is baseless as these are legitimate business expenses duly documented in books. There is no element of fraud, wilful misstatement or suppression — hence the notice should be re-cast u/s 73, not 74.",
        case_laws: CASE_LAW_DATABASE["GST_DEMAND"] || [],
      },
    ],
    extracted_fields: [
      { field_name: "Notice Number", value: "SCN/74/MUM/2025-26/0089", confidence: "high" },
      { field_name: "Assessment Year", value: "FY 2023-24", confidence: "high" },
      { field_name: "Demand Amount (₹)", value: "54,00,000", confidence: "high" },
      { field_name: "Penalty Amount (₹)", value: "54,00,000 (100%)", confidence: "high" },
    ],
  },

  // ── 3. IT SEC 143(2) SCRUTINY ────────────────────────────────────────────
  {
    id: "NTC-003",
    notice_type: "Notice u/s 143(2)",
    notice_number: "ITBA/AST/S/143(2)/2025-26/1023456789",
    notice_date: "2025-09-15",
    response_due_date: "2025-10-15",
    days_remaining: calculateDueDate("2025-09-15", 30).days_remaining,
    issuing_authority: "INCOME_TAX_DEPARTMENT",
    issuing_officer: "Shri Suresh Kumar, ACIT Circle 2(2)",
    issuing_office: "ACIT Circle 2(2), Income Tax Ward, BKC Mumbai",
    category: "IT_SCRUTINY",
    severity: "HIGH",
    status: "RECEIVED",
    company_pan: "AAKCS1234F",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    assessment_year: "AY 2024-25",
    demand_amount: 0,
    legal_grounds: ["Section 143(2) Income Tax Act 1961", "Section 142(1) Income Tax Act 1961"],
    issues_raised: [
      {
        issue_id: "ISS-003-A",
        description: "Large cash deposits during FY 2023-24 requiring explanation — ₹45,00,000 deposited in savings accounts",
        amount_involved: 4500000,
        section_invoked: "Section 68 Income Tax Act 1961",
        department_contention: "During AY 2024-25, cash deposits of ₹45,00,000 were observed in the company's bank accounts which do not appear to be reflected in the declared income. These may represent unexplained cash credits u/s 68.",
        taxpayer_defense: "The cash deposits of ₹45,00,000 represent payments received from retail clients and cash sales which have been duly recorded in the books of accounts, included in total income, and taxes have been paid thereon. All transactions are supported by sale invoices, cash memos, and ledger entries. As held by ITAT Mumbai in M/s Sify Technologies Ltd (2023), addition u/s 68 cannot be made where identity, creditworthiness and genuineness of transactions are established.",
        case_laws: CASE_LAW_DATABASE["IT_SCRUTINY"] || [],
      },
      {
        issue_id: "ISS-003-B",
        description: "Disallowance proposed u/s 14A — investment in mutual funds and Section 14A Rule 8D disallowance",
        amount_involved: 280000,
        section_invoked: "Section 14A read with Rule 8D",
        department_contention: "The assessee has earned exempt income from mutual funds. Proportionate expenditure u/s 14A read with Rule 8D is to be disallowed from claimed business expenses.",
        taxpayer_defense: "The mutual fund investments are made from the company's surplus funds and do not require any borrowed capital or specific expenditure. Rule 8D disallowance cannot exceed the actual exempt income earned. As held by the Supreme Court in PCIT vs G&G Pharma (2022), disallowance u/s 14A cannot exceed the exempt income earned. In the present case, exempt income is ₹1,80,000 whereas proposed disallowance of ₹2,80,000 is in excess of the same and is unsustainable.",
        case_laws: CASE_LAW_DATABASE["IT_SCRUTINY"] || [],
      },
    ],
    extracted_fields: [
      { field_name: "Notice Number", value: "ITBA/AST/S/143(2)/2025-26/1023456789", confidence: "high" },
      { field_name: "PAN", value: "AAKCS1234F", confidence: "high" },
      { field_name: "Assessment Year", value: "AY 2024-25", confidence: "high" },
    ],
  },

  // ── 4. IT SEC 148 REASSESSMENT ───────────────────────────────────────────
  {
    id: "NTC-004",
    notice_type: "Notice u/s 148",
    notice_number: "ITBA/AST/S/148/2024-25/0045678",
    notice_date: "2025-03-28",
    response_due_date: "2025-04-28",
    days_remaining: calculateDueDate("2025-03-28", 30).days_remaining,
    issuing_authority: "INCOME_TAX_DEPARTMENT",
    issuing_officer: "Smt. Anita Sharma, ITO Ward 3(1)",
    issuing_office: "ITO Ward 3(1), Income Tax Department, Andheri Mumbai",
    category: "IT_REASSESSMENT",
    severity: "CRITICAL",
    status: "RESPONSE_FILED",
    company_pan: "AAKCS1234F",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    assessment_year: "AY 2021-22",
    demand_amount: 3200000,
    interest_amount: 640000,
    total_demand: 3840000,
    legal_grounds: ["Section 148A Income Tax Act 2025", "Section 148 Income Tax Act 2025", "Section 151 Income Tax Act"],
    issues_raised: [
      {
        issue_id: "ISS-004-A",
        description: "Reassessment initiated for AY 2021-22 alleging escaped income of ₹32,00,000 from undisclosed foreign remittances",
        amount_involved: 3200000,
        section_invoked: "Section 148 Income Tax Act",
        department_contention: "Based on information received from FEMA/banking channels, foreign remittances of USD 38,500 (approx. ₹32,00,000) received by the assessee have not been offered to tax.",
        taxpayer_defense: "The foreign remittances of USD 38,500 represent export of IT services under LUT (Letter of Undertaking) which are zero-rated exports and hence not taxable in India. The same has been declared in Form 15CA/15CB and reflected in our ITR under Schedule FSI and Schedule TR. The reassessment notice fails to comply with the mandatory pre-notice enquiry procedure u/s 148A(b) — no opportunity was granted to explain before issue of notice. As held by the Supreme Court in Union of India vs Ashish Agarwal (2021), all Sec 148 notices issued after 1 April 2021 must follow 148A procedure.",
        case_laws: CASE_LAW_DATABASE["IT_REASSESSMENT"] || [],
      },
    ],
    extracted_fields: [
      { field_name: "Notice Number", value: "ITBA/AST/S/148/2024-25/0045678", confidence: "high" },
      { field_name: "Assessment Year", value: "AY 2021-22", confidence: "high" },
      { field_name: "Demand Amount (₹)", value: "32,00,000", confidence: "high" },
    ],
  },

  // ── 5. TDS DEFAULT SEC 201(1) ────────────────────────────────────────────
  {
    id: "NTC-005",
    notice_type: "Order u/s 201(1)",
    notice_number: "TDS/201/MUM/2025-26/00789",
    notice_date: "2025-08-10",
    response_due_date: "2025-09-09",
    days_remaining: calculateDueDate("2025-08-10", 30).days_remaining,
    issuing_authority: "INCOME_TAX_DEPARTMENT",
    issuing_officer: "Shri Deepak Verma, ACIT TDS",
    issuing_office: "ACIT TDS Circle Mumbai — 2",
    category: "IT_TDS_DEFAULT",
    severity: "HIGH",
    status: "RECEIVED",
    company_pan: "AAKCS1234F",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    assessment_year: "AY 2024-25",
    demand_amount: 480000,
    interest_amount: 96000,
    total_demand: 576000,
    legal_grounds: ["Section 201(1) Income Tax Act", "Section 201(1A) Income Tax Act", "Section 194J Income Tax Act"],
    issues_raised: [
      {
        issue_id: "ISS-005-A",
        description: "TDS short-deduction on professional fees paid to freelance developers — deducted @ 2% instead of 10%",
        amount_involved: 480000,
        section_invoked: "Section 194J(b) Income Tax Act",
        department_contention: "Professional fees of ₹48,00,000 paid to individual software developers were subjected to TDS @ 2% u/s 194J(a) — Technical Services. The correct rate applicable is 10% u/s 194J(b) — Professional Services. TDS short-deducted is ₹4,80,000.",
        taxpayer_defense: "The payments made to software developers are for technical services (software coding and testing) which squarely fall under Section 194J(a) at 2%. CBDT Circular No. 1/2014 dated 13.01.2014 and multiple judicial precedents have clarified that software development services rendered by technical personnel are 'technical services' and not 'professional services'. Further, the payees have included all income in their ITR and paid taxes thereon. As held by the Supreme Court in CIT TDS vs Calcutta Club (2023), interest u/s 201(1A) runs only till date of filing of return by payee.",
        case_laws: CASE_LAW_DATABASE["IT_TDS_DEFAULT"] || [],
      },
    ],
    extracted_fields: [
      { field_name: "TAN", value: "MUMS12345T", confidence: "high" },
      { field_name: "Assessment Year", value: "AY 2024-25", confidence: "high" },
      { field_name: "Demand Amount (₹)", value: "4,80,000", confidence: "high" },
      { field_name: "Interest Amount (₹)", value: "96,000", confidence: "high" },
    ],
  },

  // ── 6. MCA DIR-3 KYC ─────────────────────────────────────────────────────
  {
    id: "NTC-006",
    notice_type: "DIR-3 KYC Notice",
    notice_number: "MCA/DIR3KYC/2025-26/003456",
    notice_date: "2025-08-01",
    response_due_date: "2025-09-30",
    days_remaining: calculateDueDate("2025-08-01", 60).days_remaining,
    issuing_authority: "MCA_ROC",
    issuing_officer: "Registrar of Companies Maharashtra",
    issuing_office: "ROC Mumbai — Ministry of Corporate Affairs",
    category: "MCA_COMPLIANCE",
    severity: "HIGH",
    status: "RECEIVED",
    company_pan: "AAKCS1234F",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    legal_grounds: ["Rule 12A Companies (Appointment & Qualification of Directors) Rules 2014"],
    issues_raised: [
      {
        issue_id: "ISS-006-A",
        description: "Annual KYC of Directors not filed — DIN will be deactivated if DIR-3 KYC not filed by 30th September",
        amount_involved: 0,
        section_invoked: "Rule 12A Companies (Appointment & Qualification of Directors) Rules 2014",
        department_contention: "The DIN holders of the company have not filed DIR-3 KYC for FY 2025-26. Non-filing by 30th September will result in deactivation of DIN and late fee of ₹5,000 per DIN.",
        taxpayer_defense: "N/A — Compliance action required. File DIR-3 KYC eForm on MCA21 V3 portal for each Director with OTP-verified Aadhaar and verified mobile/email.",
        case_laws: [],
      },
    ],
    extracted_fields: [
      { field_name: "Notice Number", value: "MCA/DIR3KYC/2025-26/003456", confidence: "high" },
      { field_name: "Response Due Date", value: "30-09-2025", confidence: "high" },
    ],
  },

  // ── 7. EPFO DEMAND u/s 7A ────────────────────────────────────────────────
  {
    id: "NTC-007",
    notice_type: "EPFO Demand Notice u/s 7A",
    notice_number: "RO/MH/BAN/7A/2025-26/0034",
    notice_date: "2025-07-15",
    response_due_date: "2025-08-14",
    days_remaining: calculateDueDate("2025-07-15", 30).days_remaining,
    issuing_authority: "EPFO",
    issuing_officer: "Enforcement Officer, EPFO Mumbai South",
    issuing_office: "EPFO Regional Office — Mumbai South, Bandra",
    category: "LABOUR_DEMAND",
    severity: "MEDIUM",
    status: "RECEIVED",
    company_pan: "AAKCS1234F",
    company_name: "Sannidh Technologies Pvt. Ltd.",
    demand_amount: 320000,
    interest_amount: 48000,
    penalty_amount: 64000,
    total_demand: 432000,
    legal_grounds: ["Section 7A EPF & MP Act 1952", "Section 14B EPF & MP Act 1952"],
    issues_raised: [
      {
        issue_id: "ISS-007-A",
        description: "EPF contribution on contractor wages not deposited — 6 contract staff treated as outsourced but EPFO claims they are direct employees",
        amount_involved: 320000,
        section_invoked: "Section 7A EPF & MP Act 1952",
        department_contention: "During inspection, 6 contract workers found working on company premises are deemed employees under Sec 2(f) EPF Act. EPF contributions on their wages for 24 months not deposited — principal employer liability.",
        taxpayer_defense: "The 6 contract workers are employees of a registered contractor with valid EPF code MH/BAN/0045678. The contractor has deposited PF on their wages as evidenced by contractor's ECR returns attached. As principal employer, we have ensured contractor compliance as required u/s 8A of EPF Act. No direct employment relationship exists as these workers work on a project basis under separate SOW agreements.",
        case_laws: [],
      },
    ],
    extracted_fields: [
      { field_name: "Notice Number", value: "RO/MH/BAN/7A/2025-26/0034", confidence: "high" },
      { field_name: "Demand Amount (₹)", value: "3,20,000", confidence: "high" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTED OUTPUTS — Legal Drafts & Risk Scores
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_LEGAL_DRAFTS: Record<string, LegalDraftResponse> = Object.fromEntries(
  DEMO_STATUTORY_NOTICES.map(n => [n.id, generateLegalDraftResponse(n)])
);

export const DEMO_RISK_SCORES: Record<string, NoticeRiskScore> = Object.fromEntries(
  DEMO_STATUTORY_NOTICES.map(n => [n.id, computeNoticeRiskScore(n)])
);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_NOTICE_DASHBOARD_SUMMARY = {
  total_notices: DEMO_STATUTORY_NOTICES.length,
  critical_notices: DEMO_STATUTORY_NOTICES.filter(n => n.severity === "CRITICAL").length,
  high_notices: DEMO_STATUTORY_NOTICES.filter(n => n.severity === "HIGH").length,
  overdue_notices: DEMO_STATUTORY_NOTICES.filter(n => n.days_remaining < 0).length,
  total_demand: DEMO_STATUTORY_NOTICES.reduce((s, n) => s + (n.total_demand || 0), 0),
  total_gst_demand: DEMO_STATUTORY_NOTICES.filter(n => n.issuing_authority === "GST_DEPARTMENT").reduce((s, n) => s + (n.total_demand || 0), 0),
  total_it_demand: DEMO_STATUTORY_NOTICES.filter(n => n.issuing_authority === "INCOME_TAX_DEPARTMENT").reduce((s, n) => s + (n.total_demand || 0), 0),
  notices_by_status: {
    received: DEMO_STATUTORY_NOTICES.filter(n => n.status === "RECEIVED").length,
    response_drafted: DEMO_STATUTORY_NOTICES.filter(n => n.status === "RESPONSE_DRAFTED").length,
    response_filed: DEMO_STATUTORY_NOTICES.filter(n => n.status === "RESPONSE_FILED").length,
  },
};
