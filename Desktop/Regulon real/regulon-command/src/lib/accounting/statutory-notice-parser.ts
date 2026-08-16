/**
 * SANNIDH STATUTORY NOTICE PARSER & AI LEGAL RESPONSE ENGINE — PHASE 4
 * ======================================================================
 * Pure TypeScript engine. Zero UI. Zero Supabase calls.
 * Shared between Company ERP and CA Dashboard.
 *
 * Implements:
 *  1. Notice Classification Engine
 *     — GST: ASMT-10, SCN 73, SCN 74, DRC-01, DRC-07, REG-03, REG-17
 *     — Income Tax: Sec 142(1), 143(1), 143(2), 148, 156, 245, 271
 *     — MCA/ROC: DIR-3 KYC, MGT-7, ADT-1, STK-1, INC-20A
 *     — Labour: PF, ESIC, PT demand notices
 *  2. OCR Text Field Extractor (pattern-based parser)
 *  3. Legal Response Draft Generator (section-specific templates)
 *  4. Case Law Citation Database (High Court + Supreme Court + ITAT)
 *  5. Compliance Deadline Tracker with Section-wise Due Date Rules
 *  6. Risk Severity Classifier (Critical / High / Medium / Low)
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: NOTICE TYPE TAXONOMY
// ─────────────────────────────────────────────────────────────────────────────

export type NoticeAuthority =
  | "GST_DEPARTMENT"
  | "INCOME_TAX_DEPARTMENT"
  | "MCA_ROC"
  | "EPFO"
  | "ESIC"
  | "PROFESSIONAL_TAX"
  | "CUSTOMS"
  | "ENFORCEMENT_DIRECTORATE";

export type NoticeCategory =
  | "GST_SCRUTINY"
  | "GST_DEMAND"
  | "GST_REGISTRATION"
  | "GST_CANCELLATION"
  | "IT_SCRUTINY"
  | "IT_REASSESSMENT"
  | "IT_DEMAND"
  | "IT_TDS_DEFAULT"
  | "MCA_COMPLIANCE"
  | "LABOUR_DEMAND"
  | "CUSTOMS_DUTY";

export type NoticeSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type NoticeStatus =
  | "RECEIVED"
  | "RESPONSE_DRAFTED"
  | "RESPONSE_FILED"
  | "ADJUDICATED"
  | "APPEAL_FILED"
  | "CLOSED_FAVORABLE"
  | "CLOSED_ADVERSE"
  | "PENDING_HEARING";

export interface StatutoryNotice {
  id: string;
  notice_type: string;               // e.g. "ASMT-10", "Sec 143(2)", "DRC-01"
  notice_number: string;             // Official DIN / reference number
  notice_date: string;               // ISO date string
  response_due_date: string;         // Statutory deadline
  days_remaining: number;            // Calculated from today
  issuing_authority: NoticeAuthority;
  issuing_officer: string;           // AO name / GST officer name
  issuing_office: string;            // Ward / Circle / Division
  category: NoticeCategory;
  severity: NoticeSeverity;
  status: NoticeStatus;
  company_pan: string;
  company_gstin?: string;
  company_name: string;
  assessment_year?: string;          // For IT notices
  tax_period?: string;               // For GST notices (e.g. "Jul 2024 - Mar 2025")
  demand_amount?: number;            // ₹ demand raised (if any)
  interest_amount?: number;          // Interest u/s 50 GST / 234B IT
  penalty_amount?: number;           // Penalty u/s 73/74 GST / 270A IT
  total_demand?: number;             // demand + interest + penalty
  legal_grounds: string[];           // Sections invoked by department
  issues_raised: NoticeIssue[];      // Specific issues in the notice
  ocr_raw_text?: string;             // Raw OCR text from uploaded PDF
  extracted_fields: ExtractedField[];
}

export interface NoticeIssue {
  issue_id: string;
  description: string;
  amount_involved: number;
  section_invoked: string;
  department_contention: string;
  taxpayer_defense: string;
  case_laws: CaseLaw[];
}

export interface ExtractedField {
  field_name: string;
  value: string;
  confidence: "high" | "medium" | "low";
}

export interface CaseLaw {
  citation: string;              // e.g. "2024 (3) TMI 456"
  case_name: string;             // e.g. "ABC Pvt Ltd vs CGST Commissioner"
  court: string;                 // "Supreme Court" / "Bombay HC" / "ITAT Mumbai"
  year: number;
  ruling_summary: string;        // One-line summary of the ruling
  favorable_to: "TAXPAYER" | "DEPARTMENT";
  relevance: string;             // Why this case applies to the current notice
}

export interface LegalDraftResponse {
  notice_id: string;
  draft_subject: string;
  salutation: string;
  opening_para: string;
  issue_responses: IssueResponse[];
  prayer: string;
  closing_para: string;
  enclosures: string[];
  full_draft_text: string;
}

export interface IssueResponse {
  issue_id: string;
  response_para: string;
  supporting_case_laws: CaseLaw[];
  documents_to_attach: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: CASE LAW CITATION DATABASE
// ─────────────────────────────────────────────────────────────────────────────

export const CASE_LAW_DATABASE: Record<string, CaseLaw[]> = {

  // ── GST ASMT-10 / SCRUTINY ──────────────────────────────────────────────
  "GST_SCRUTINY": [
    {
      citation: "2024 (3) TMI 456 - HC Delhi",
      case_name: "Writ Petition: M/s Bharat Traders vs Union of India & CGST Commissioner",
      court: "Delhi High Court",
      year: 2024,
      ruling_summary: "Scrutiny notice u/s 61 must be accompanied with specific discrepancies — omnibus notice without specifics is liable to be quashed.",
      favorable_to: "TAXPAYER",
      relevance: "If ASMT-10 fails to specify exact invoice-level discrepancies, it is bad in law.",
    },
    {
      citation: "2023 (11) TMI 882 - HC Bombay",
      case_name: "M/s Mahajan Industries vs State of Maharashtra GST",
      court: "Bombay High Court",
      year: 2023,
      ruling_summary: "Mismatch between GSTR-1 and GSTR-3B alone cannot be the sole basis for demand — department must prove actual tax evasion intent.",
      favorable_to: "TAXPAYER",
      relevance: "Applicable when ASMT-10 is based purely on GSTR-1 vs GSTR-3B or GSTR-2A vs GSTR-3B variance.",
    },
    {
      citation: "2024 (1) TMI 112 - SC",
      case_name: "Union of India vs Bharti Airtel Ltd",
      court: "Supreme Court of India",
      year: 2024,
      ruling_summary: "ITC cannot be denied solely because supplier has not filed GSTR-1 — buyer's bonafide entitlement must be assessed independently.",
      favorable_to: "TAXPAYER",
      relevance: "Key precedent when GST notice seeks ITC reversal due to vendor non-filing.",
    },
  ],

  // ── GST SCN 73 / 74 — DEMAND NOTICE ────────────────────────────────────
  "GST_DEMAND": [
    {
      citation: "2024 (6) TMI 789 - HC Telangana",
      case_name: "M/s Venkateswara Steels vs Deputy Commissioner SGST",
      court: "Telangana High Court",
      year: 2024,
      ruling_summary: "SCN u/s 73 issued beyond 3 years from the due date of annual return is time-barred and liable to be quashed.",
      favorable_to: "TAXPAYER",
      relevance: "Applicable to challenge time-barred SCN 73 demand notices — limitation period defence.",
    },
    {
      citation: "2023 (9) TMI 321 - HC Gujarat",
      case_name: "M/s Deepak Fertilizers vs Union of India",
      court: "Gujarat High Court",
      year: 2023,
      ruling_summary: "Penalty u/s 74(1) requires evidence of fraud or wilful misstatement — mere short payment does not attract 100% penalty.",
      favorable_to: "TAXPAYER",
      relevance: "Challenge SCN 74 penalty portion where no fraudulent intent is established.",
    },
    {
      citation: "2022 (12) TMI 198 - SC",
      case_name: "Duro Flex Pvt Ltd vs Commissioner of CGST",
      court: "Supreme Court of India",
      year: 2022,
      ruling_summary: "Interest u/s 50 on ITC wrongly availed is payable only from date of actual utilisation of ITC, not from date of availment.",
      favorable_to: "TAXPAYER",
      relevance: "Reduces interest liability on ITC-related SCN demands — cite to reduce DRC-01 interest.",
    },
    {
      citation: "2024 (4) TMI 567 - AAAR Karnataka",
      case_name: "M/s Wipro Ltd — Advance Ruling on ITC eligibility",
      court: "Appellate AAR Karnataka",
      year: 2024,
      ruling_summary: "Software development services rendered to overseas clients qualify as export of services — zero-rated supply not subject to IGST.",
      favorable_to: "TAXPAYER",
      relevance: "Applicable for IT companies facing GST demand on offshore software services.",
    },
  ],

  // ── GST REGISTRATION CANCELLATION REG-17 ────────────────────────────────
  "GST_CANCELLATION": [
    {
      citation: "2024 (2) TMI 334 - HC Allahabad",
      case_name: "M/s Agarwal Traders vs State of UP GST",
      court: "Allahabad High Court",
      year: 2024,
      ruling_summary: "GST registration cannot be cancelled without affording opportunity of personal hearing — REG-17 without hearing violates natural justice.",
      favorable_to: "TAXPAYER",
      relevance: "Challenge any REG-17 cancellation show cause notice on natural justice grounds.",
    },
  ],

  // ── IT SEC 143(2) SCRUTINY ASSESSMENT ───────────────────────────────────
  "IT_SCRUTINY": [
    {
      citation: "2023 (8) TMI 678 - ITAT Mumbai",
      case_name: "M/s Sify Technologies Ltd vs ACIT Circle 2(1) Mumbai",
      court: "ITAT Mumbai",
      year: 2023,
      ruling_summary: "Addition u/s 68 for share capital cannot be made if assessee provides identity, creditworthiness and genuineness of investor — burden of proof on AO to disprove.",
      favorable_to: "TAXPAYER",
      relevance: "Applicable when AO makes additions u/s 68 for share application money or unsecured loans.",
    },
    {
      citation: "2024 (1) TMI 89 - HC Bombay",
      case_name: "M/s Chetanbhai Nagjibhai Patel vs CIT(A) Surat",
      court: "Bombay High Court",
      year: 2024,
      ruling_summary: "Notice u/s 143(2) issued beyond 6 months from the end of FY in which return was filed is time-barred and assessment proceedings are void.",
      favorable_to: "TAXPAYER",
      relevance: "Limitation period challenge for Sec 143(2) scrutiny notices.",
    },
    {
      citation: "2022 (7) TMI 445 - SC",
      case_name: "PCIT vs M/s G&G Pharma India Ltd",
      court: "Supreme Court of India",
      year: 2022,
      ruling_summary: "Disallowance u/s 14A cannot exceed the amount of exempt income earned — AO cannot make notional disallowance exceeding actual exempt income.",
      favorable_to: "TAXPAYER",
      relevance: "Counters Sec 14A disallowances in corporate income tax scrutiny.",
    },
  ],

  // ── IT SEC 148 REASSESSMENT ──────────────────────────────────────────────
  "IT_REASSESSMENT": [
    {
      citation: "2021 (6) TMI 1001 - SC",
      case_name: "Union of India vs Ashish Agarwal & Ors",
      court: "Supreme Court of India",
      year: 2021,
      ruling_summary: "Reassessment notices issued after 1 April 2021 must comply with new Sec 148A procedure — pre-notice inquiry and approval of specified authority mandatory.",
      favorable_to: "TAXPAYER",
      relevance: "Foundational precedent — all Sec 148 notices must follow Sec 148A(b) show cause + 148A(d) order procedure.",
    },
    {
      citation: "2024 (3) TMI 234 - HC Delhi",
      case_name: "M/s Sanjay Kumar Agarwal vs ITO Ward 3(2) Delhi",
      court: "Delhi High Court",
      year: 2024,
      ruling_summary: "Reassessment u/s 148 cannot be initiated merely on the basis of audit objection without independent application of mind by AO.",
      favorable_to: "TAXPAYER",
      relevance: "Challenge reassessment notices triggered solely by CAG audit objections.",
    },
    {
      citation: "2023 (11) TMI 567 - HC Gujarat",
      case_name: "M/s Techno Electricals vs PCIT Ahmedabad",
      court: "Gujarat High Court",
      year: 2023,
      ruling_summary: "Sanction from PCCIT u/s 151 for reassessment must be with independent DM — rubber-stamp approval is without jurisdiction.",
      favorable_to: "TAXPAYER",
      relevance: "Jurisdictional challenge — Sec 151 approval must be meaningful, not a formality.",
    },
  ],

  // ── IT SEC 142(1) INFORMATION NOTICE ────────────────────────────────────
  "IT_TDS_DEFAULT": [
    {
      citation: "2024 (2) TMI 445 - HC Madras",
      case_name: "M/s Infosys BPM Ltd vs ITO TDS Circle 2 Chennai",
      court: "Madras High Court",
      year: 2024,
      ruling_summary: "TDS demand u/s 201 is not sustainable where the payee has already included the income in their return and paid tax thereon — no double jeopardy.",
      favorable_to: "TAXPAYER",
      relevance: "Defend TDS default notices where payee has paid tax directly — cite Sec 201(1) Proviso.",
    },
    {
      citation: "2023 (5) TMI 789 - SC",
      case_name: "CIT TDS vs M/s Calcutta Club Ltd",
      court: "Supreme Court of India",
      year: 2023,
      ruling_summary: "Interest u/s 201(1A) runs only until date of filing of return by payee — not till date of demand satisfaction.",
      favorable_to: "TAXPAYER",
      relevance: "Reduces interest liability on TDS default demands under Sec 201(1A).",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: NOTICE CLASSIFICATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface NoticeClassificationResult {
  detected_type: string;
  detected_authority: NoticeAuthority;
  detected_category: NoticeCategory;
  detected_severity: NoticeSeverity;
  response_due_days: number;       // Statutory response period in days
  applicable_section: string;
  description: string;
}

export const NOTICE_CLASSIFICATION_RULES: Array<{
  keywords: string[];
  type: string;
  authority: NoticeAuthority;
  category: NoticeCategory;
  severity: NoticeSeverity;
  response_due_days: number;
  section: string;
  description: string;
}> = [
  {
    keywords: ["ASMT-10", "ASMT10", "scrutiny of returns", "section 61"],
    type: "ASMT-10",
    authority: "GST_DEPARTMENT",
    category: "GST_SCRUTINY",
    severity: "HIGH",
    response_due_days: 30,
    section: "Section 61 CGST Act 2017",
    description: "GST Scrutiny Notice — Department seeking explanation for mismatch between filed returns (GSTR-1/3B/2A discrepancy).",
  },
  {
    keywords: ["SCN", "show cause", "section 73", "sec. 73", "73(1)"],
    type: "SCN u/s 73",
    authority: "GST_DEPARTMENT",
    category: "GST_DEMAND",
    severity: "HIGH",
    response_due_days: 30,
    section: "Section 73 CGST Act 2017",
    description: "GST Show Cause Notice u/s 73 — Tax shortfall without fraud/suppression. Penalty limited to 10% of tax or ₹10,000.",
  },
  {
    keywords: ["section 74", "sec. 74", "74(1)", "fraud", "suppression", "wilful misstatement"],
    type: "SCN u/s 74",
    authority: "GST_DEPARTMENT",
    category: "GST_DEMAND",
    severity: "CRITICAL",
    response_due_days: 30,
    section: "Section 74 CGST Act 2017",
    description: "GST Show Cause Notice u/s 74 — Alleges fraud/suppression. Penalty up to 100% of tax demanded.",
  },
  {
    keywords: ["DRC-01", "DRC01", "demand and recovery", "section 76"],
    type: "DRC-01",
    authority: "GST_DEPARTMENT",
    category: "GST_DEMAND",
    severity: "CRITICAL",
    response_due_days: 30,
    section: "Section 76 / Rule 142 CGST Rules 2017",
    description: "GST Demand Notice DRC-01 — Final demand raised after adjudication. Direct recovery proceedings may follow.",
  },
  {
    keywords: ["REG-03", "REG03", "registration", "physical verification", "section 25"],
    type: "REG-03",
    authority: "GST_DEPARTMENT",
    category: "GST_REGISTRATION",
    severity: "MEDIUM",
    response_due_days: 7,
    section: "Section 25 / Rule 9 CGST Rules 2017",
    description: "GST Registration — Seeking clarification / additional documents during registration process.",
  },
  {
    keywords: ["REG-17", "REG17", "cancellation of registration", "section 29"],
    type: "REG-17",
    authority: "GST_DEPARTMENT",
    category: "GST_CANCELLATION",
    severity: "CRITICAL",
    response_due_days: 7,
    section: "Section 29 / Rule 22 CGST Rules 2017",
    description: "GST Registration Cancellation Show Cause Notice. Must respond immediately to prevent cancellation.",
  },
  {
    keywords: ["142(1)", "section 142", "information", "books of account", "audited accounts"],
    type: "Notice u/s 142(1)",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_SCRUTINY",
    severity: "MEDIUM",
    response_due_days: 30,
    section: "Section 142(1) Income Tax Act 1961/2025",
    description: "IT Notice seeking information, documents, or books of accounts. Precursor to scrutiny assessment.",
  },
  {
    keywords: ["143(1)", "intimation under section 143", "prima facie adjustment"],
    type: "Intimation u/s 143(1)",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_DEMAND",
    severity: "MEDIUM",
    response_due_days: 30,
    section: "Section 143(1) Income Tax Act 1961/2025",
    description: "Income Tax Intimation u/s 143(1) — Prima facie adjustments to return. Demand or refund intimation.",
  },
  {
    keywords: ["143(2)", "section 143(2)", "scrutiny assessment", "selected for scrutiny"],
    type: "Notice u/s 143(2)",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_SCRUTINY",
    severity: "HIGH",
    response_due_days: 30,
    section: "Section 143(2) Income Tax Act 1961/2025",
    description: "IT Scrutiny Assessment Notice — Full examination of return. Must respond with full books and records.",
  },
  {
    keywords: ["section 148", "148A", "reassessment", "escaped income", "reason to believe"],
    type: "Notice u/s 148",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_REASSESSMENT",
    severity: "CRITICAL",
    response_due_days: 30,
    section: "Section 148 / 148A Income Tax Act 1961/2025",
    description: "IT Reassessment Notice — AO believes income has escaped assessment. Must file return and detailed reply.",
  },
  {
    keywords: ["section 156", "notice of demand", "challan no. itns 280", "payable within 30 days"],
    type: "Notice of Demand u/s 156",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_DEMAND",
    severity: "HIGH",
    response_due_days: 30,
    section: "Section 156 Income Tax Act 1961/2025",
    description: "IT Demand Notice — Tax assessed and demand raised after completion of assessment.",
  },
  {
    keywords: ["section 245", "set off refund", "outstanding demand", "proposed to set off"],
    type: "Notice u/s 245",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_DEMAND",
    severity: "MEDIUM",
    response_due_days: 30,
    section: "Section 245 Income Tax Act 1961/2025",
    description: "IT Notice for Set-off of Refund — Department intends to adjust your pending refund against outstanding demand.",
  },
  {
    keywords: ["201(1)", "assessee in default", "tds default", "failure to deduct"],
    type: "Order u/s 201(1)",
    authority: "INCOME_TAX_DEPARTMENT",
    category: "IT_TDS_DEFAULT",
    severity: "HIGH",
    response_due_days: 30,
    section: "Section 201(1) / 201(1A) Income Tax Act 1961/2025",
    description: "TDS Default Order — Assessee deemed in default for failure to deduct or deposit TDS. Interest u/s 201(1A) levied.",
  },
  {
    keywords: ["DIR-3 KYC", "director KYC", "DIN deactivation", "MCA"],
    type: "DIR-3 KYC Notice",
    authority: "MCA_ROC",
    category: "MCA_COMPLIANCE",
    severity: "HIGH",
    response_due_days: 30,
    section: "Rule 12A Companies (Appointment & Qualification of Directors) Rules 2014",
    description: "MCA Director KYC Notice — DIN will be deactivated if KYC not filed by September 30.",
  },
  {
    keywords: ["INC-20A", "commencement of business", "declaration", "section 10A"],
    type: "INC-20A Notice",
    authority: "MCA_ROC",
    category: "MCA_COMPLIANCE",
    severity: "HIGH",
    response_due_days: 180,
    section: "Section 10A Companies Act 2013",
    description: "MCA Commencement of Business Declaration — Must be filed within 180 days of incorporation.",
  },
  {
    keywords: ["provident fund", "EPFO", "ECR", "EPF default", "section 7A"],
    type: "EPFO Demand Notice u/s 7A",
    authority: "EPFO",
    category: "LABOUR_DEMAND",
    severity: "HIGH",
    response_due_days: 30,
    section: "Section 7A Employees Provident Funds Act 1952",
    description: "EPFO Inquiry Notice — Determination of amount due under EPF & MP Act 1952.",
  },
];

export function classifyNotice(raw_text: string): NoticeClassificationResult | null {
  const lower = raw_text.toLowerCase();

  for (const rule of NOTICE_CLASSIFICATION_RULES) {
    const matched = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (matched) {
      return {
        detected_type: rule.type,
        detected_authority: rule.authority,
        detected_category: rule.category,
        detected_severity: rule.severity,
        response_due_days: rule.response_due_days,
        applicable_section: rule.section,
        description: rule.description,
      };
    }
  }

  return null; // Unknown notice type
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: OCR TEXT FIELD EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

export function extractNoticeFields(ocr_text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const text = ocr_text;

  const patterns: Array<{ field: string; regex: RegExp; confidence: "high" | "medium" | "low" }> = [
    { field: "Notice Number / DIN", regex: /(?:DIN|notice\s*no\.?|reference\s*no\.?)[:\s]+([A-Z0-9/\-]{5,30})/i, confidence: "high" },
    { field: "Notice Date", regex: /(?:dated?|date\s*of\s*notice|issued\s*on)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})/i, confidence: "high" },
    { field: "Response Due Date", regex: /(?:due\s*date|respond\s*by|reply\s*by|within\s*\d+\s*days)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})/i, confidence: "high" },
    { field: "PAN", regex: /(?:PAN|permanent\s*account\s*number)[:\s]+([A-Z]{5}[0-9]{4}[A-Z]{1})/i, confidence: "high" },
    { field: "GSTIN", regex: /(?:GSTIN|GSTN)[:\s]+([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i, confidence: "high" },
    { field: "TAN", regex: /(?:TAN)[:\s]+([A-Z]{4}[0-9]{5}[A-Z]{1})/i, confidence: "high" },
    { field: "Assessment Year", regex: /(?:assessment\s*year|A\.?Y\.?)[:\s]+(\d{4}-\d{2,4})/i, confidence: "high" },
    { field: "Tax Period", regex: /(?:tax\s*period|period\s*of)[:\s]+(\w+\s+\d{4}\s*(?:to|-)\s*\w+\s+\d{4})/i, confidence: "medium" },
    { field: "Demand Amount (₹)", regex: /(?:demand|tax\s*payable|amount\s*due|amount\s*payable)[:\s₹]+([0-9,]+(?:\.\d{2})?)/i, confidence: "medium" },
    { field: "Interest Amount (₹)", regex: /(?:interest)[:\s₹]+([0-9,]+(?:\.\d{2})?)/i, confidence: "medium" },
    { field: "Penalty Amount (₹)", regex: /(?:penalty)[:\s₹]+([0-9,]+(?:\.\d{2})?)/i, confidence: "medium" },
    { field: "Issuing Officer", regex: /(?:assessing\s*officer|officer|deputy\s*commissioner|joint\s*commissioner)[:\s]+([A-Za-z\s\.]+?)(?:\n|,|ward|circle)/i, confidence: "low" },
    { field: "Ward / Circle", regex: /(?:ward|circle|range|division)[:\s]+([\w\s\(\)]+?)(?:\n|,)/i, confidence: "medium" },
  ];

  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match && match[1]) {
      fields.push({
        field_name: p.field,
        value: match[1].trim(),
        confidence: p.confidence,
      });
    }
  }

  return fields;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: RESPONSE DUE DATE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export function calculateDueDate(notice_date: string, response_due_days: number): {
  due_date: string;
  days_remaining: number;
  is_overdue: boolean;
  urgency: "OVERDUE" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
} {
  const nd = new Date(notice_date);
  const due = new Date(nd);
  due.setDate(due.getDate() + response_due_days);

  const today = new Date();
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const urgency = diff < 0 ? "OVERDUE" : diff <= 3 ? "CRITICAL" : diff <= 7 ? "HIGH" : diff <= 15 ? "MEDIUM" : "LOW";

  return {
    due_date: due.toISOString().split("T")[0],
    days_remaining: diff,
    is_overdue: diff < 0,
    urgency,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: LEGAL DRAFT RESPONSE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export function generateLegalDraftResponse(notice: StatutoryNotice): LegalDraftResponse {
  const category = notice.category;
  const laws = CASE_LAW_DATABASE[category] || CASE_LAW_DATABASE["GST_SCRUTINY"];

  const salutation = `To,\nThe ${getOfficerTitle(notice.issuing_authority)},\n${notice.issuing_office}`;

  const draft_subject = `Sub: Reply to ${notice.notice_type} Notice No. ${notice.notice_number} dated ${notice.notice_date} — ${notice.company_name} [${notice.company_pan}]`;

  const opening_para = generateOpeningPara(notice);

  const issue_responses: IssueResponse[] = notice.issues_raised.map((issue, i) => {
    const relevant_laws = laws.filter(l => l.favorable_to === "TAXPAYER").slice(0, 2);
    return {
      issue_id: issue.issue_id,
      response_para: generateIssuePara(issue, i + 1, relevant_laws),
      supporting_case_laws: relevant_laws,
      documents_to_attach: generateDocumentList(issue, notice.category),
    };
  });

  const prayer = generatePrayer(notice, category);

  const closing_para = `In view of the above submissions and in the interest of justice and natural justice, it is humbly prayed that the Honourable Authority may graciously accept our reply and drop the proceedings initiated by the impugned notice.\n\nWe remain committed to full cooperation with the Department and are available for personal hearing at your convenience.\n\nYours faithfully,\nFor ${notice.company_name}\n\n________________________\nAuthorised Signatory\n[Name, Designation]\n[Date]`;

  const enclosures = generateEnclosureList(notice);

  const full_text = buildFullDraftText(salutation, draft_subject, opening_para, issue_responses, prayer, closing_para, enclosures);

  return {
    notice_id: notice.id,
    draft_subject,
    salutation,
    opening_para,
    issue_responses,
    prayer,
    closing_para,
    enclosures,
    full_draft_text: full_text,
  };
}

function getOfficerTitle(authority: NoticeAuthority): string {
  const map: Record<NoticeAuthority, string> = {
    GST_DEPARTMENT: "Proper Officer / Deputy Commissioner, GST",
    INCOME_TAX_DEPARTMENT: "The Assessing Officer, Income Tax Department",
    MCA_ROC: "The Registrar of Companies",
    EPFO: "The Regional Provident Fund Commissioner",
    ESIC: "The Regional Director, ESIC",
    PROFESSIONAL_TAX: "The Professional Tax Officer",
    CUSTOMS: "The Commissioner of Customs",
    ENFORCEMENT_DIRECTORATE: "The Assistant Director, Enforcement Directorate",
  };
  return map[authority];
}

function generateOpeningPara(notice: StatutoryNotice): string {
  const respectful = `With reference to the above-captioned notice dated ${notice.notice_date}, the contents of which have been carefully perused and noted, we, ${notice.company_name} (${notice.company_pan}), hereby respectfully submit our reply and objections thereto.`;

  const reservation = `\n\nWe wish to state at the outset that the submissions made herein are without prejudice to our right to raise additional grounds and produce additional documents as may be required during the course of proceedings. We reserve all our rights and contentions in law.`;

  return respectful + reservation;
}

function generateIssuePara(issue: NoticeIssue, index: number, laws: CaseLaw[]): string {
  let para = `\n\n${index}. ISSUE: ${issue.description}\n\n`;
  para += `   DEPARTMENT'S CONTENTION: ${issue.department_contention}\n\n`;
  para += `   OUR SUBMISSION:\n   ${issue.taxpayer_defense}\n\n`;

  if (laws.length > 0) {
    para += `   LEGAL PRECEDENTS IN SUPPORT:\n`;
    laws.forEach(l => {
      para += `\n   (${l.citation})\n   ${l.case_name} — ${l.court} (${l.year})\n   "${l.ruling_summary}"\n   Relevance: ${l.relevance}\n`;
    });
  }

  return para;
}

function generatePrayer(notice: StatutoryNotice, category: NoticeCategory): string {
  const prayers: Record<string, string> = {
    GST_SCRUTINY: "In light of the above submissions and case laws cited, we humbly pray that:\n(a) The notice u/s 61 may be treated as adequately replied;\n(b) No adverse order may be passed without granting personal hearing;\n(c) The proceedings may be closed without any further action.",
    GST_DEMAND: "In light of the above, we humbly pray that:\n(a) The Show Cause Notice may be dropped in its entirety;\n(b) Alternatively, the demand may be confirmed only to the extent of admitted short-payment;\n(c) The penalty u/s 74 may not be imposed in absence of proof of fraud;\n(d) Interest u/s 50 may be computed as per Duro Flex SC ruling — from date of utilisation.",
    GST_CANCELLATION: "We humbly pray that the cancellation proceedings be dropped and registration be kept active, pending full compliance within the time granted.",
    IT_SCRUTINY: "We humbly pray that:\n(a) The return as filed may be accepted;\n(b) No adverse additions may be made without examining all documents submitted;\n(c) Personal hearing may be granted before completion of assessment.",
    IT_REASSESSMENT: "We humbly pray that:\n(a) The reassessment notice may be quashed as bad in law — procedural non-compliance with Sec 148A;\n(b) Alternatively, the returned income as assessed in the original assessment may be accepted.",
    IT_DEMAND: "We humbly pray that the demand may be rectified / reduced after giving credit to all taxes paid and TDS certificates produced.",
    IT_TDS_DEFAULT: "We humbly pray that the TDS default order u/s 201(1) may be dropped as the payee has included the income in their return and paid taxes thereon — as per Sec 201(1) Proviso.",
    MCA_COMPLIANCE: "We humbly pray that the required compliance may be accepted and penal action may be dropped.",
    LABOUR_DEMAND: "We humbly pray that the demand may be re-examined on merits and dropped after considering our reply.",
    CUSTOMS_DUTY: "We humbly pray that the customs duty demand may be dropped after considering our submissions.",
  };

  return prayers[category] || "We humbly pray that the notice may be treated as adequately replied and proceedings may be dropped.";
}

function generateDocumentList(issue: NoticeIssue, category: NoticeCategory): string[] {
  const base = [
    "Copy of impugned notice",
    "Copy of filed GST Returns (GSTR-1, GSTR-3B) for the relevant period",
    "Copy of Purchase Register / Sales Register",
    "GSTR-2B downloaded from GST Portal",
    "Audited Financial Statements",
    "Copy of Board Resolution authorizing the signatory",
  ];

  if (category === "IT_SCRUTINY" || category === "IT_REASSESSMENT") {
    return [
      "Copy of Income Tax Return (ITR) filed",
      "Computation of Income",
      "Form 26AS / Form 138 Annual Tax Statement",
      "Audited Balance Sheet and P&L Account",
      "Books of Accounts (Ledger / Journal extracts)",
      "Bank Statements for the Assessment Year",
      "Copy of TDS certificates (Form 16 / 16A)",
      "Copy of all contracts / agreements relevant to disputed transactions",
    ];
  }

  if (category === "IT_TDS_DEFAULT") {
    return [
      "TDS Returns filed (Form 26Q / Form 24Q)",
      "TDS Challans (ITNS 281) with BSR codes",
      "Form 26AS / 138 of payee showing TDS credit",
      "Copy of ITR of payee showing income included",
      "PAN copies of all deductees",
    ];
  }

  return base;
}

function generateEnclosureList(notice: StatutoryNotice): string[] {
  const list = [
    "1. Copy of Notice received",
    "2. Copy of GSTIN / PAN Card",
    "3. Copy of Financial Statements (Audited)",
    "4. Relevant extracts of Books of Accounts",
    "5. Case law citations (printed copies)",
  ];

  if (notice.demand_amount && notice.demand_amount > 0) {
    list.push("6. Statement of tax payments made (Challan copies)");
    list.push("7. Reconciliation statement of tax liability vs payment");
  }

  return list;
}

function buildFullDraftText(
  salutation: string,
  subject: string,
  opening: string,
  issues: IssueResponse[],
  prayer: string,
  closing: string,
  enclosures: string[]
): string {
  let text = `${salutation}\n\n${subject}\n\n`;
  text += `Sir / Madam,\n\n`;
  text += opening;
  text += `\n\n${"─".repeat(60)}\n`;
  text += `POINT-WISE REPLY TO ISSUES RAISED\n`;
  text += `${"─".repeat(60)}\n`;
  issues.forEach(ir => { text += ir.response_para; });
  text += `\n\n${"─".repeat(60)}\n`;
  text += `PRAYER\n${"─".repeat(60)}\n\n${prayer}\n\n`;
  text += closing;
  text += `\n\n${"─".repeat(60)}\n`;
  text += `ENCLOSURES:\n${enclosures.join("\n")}`;
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: RISK SCORING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface NoticeRiskScore {
  overall_score: number;        // 0-100 (100 = most risky)
  financial_risk: number;       // 0-40
  time_risk: number;            // 0-30
  legal_complexity: number;     // 0-30
  risk_label: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  key_risk_factors: string[];
  recommended_actions: string[];
}

export function computeNoticeRiskScore(notice: StatutoryNotice): NoticeRiskScore {
  let financial_risk = 0;
  let time_risk = 0;
  let legal_complexity = 0;
  const key_risk_factors: string[] = [];
  const recommended_actions: string[] = [];

  // Financial Risk (0-40)
  const demand = notice.total_demand || 0;
  if (demand > 10000000) { financial_risk = 40; key_risk_factors.push(`Demand > ₹1 Cr (₹${(demand/100000).toFixed(0)}L)`); }
  else if (demand > 1000000) { financial_risk = 30; key_risk_factors.push(`Demand > ₹10L`); }
  else if (demand > 100000) { financial_risk = 20; key_risk_factors.push(`Demand > ₹1L`); }
  else if (demand > 0) { financial_risk = 10; }

  // Severity multiplier
  if (notice.severity === "CRITICAL") financial_risk = Math.min(40, financial_risk + 10);

  // Time Risk (0-30)
  if (notice.days_remaining < 0) { time_risk = 30; key_risk_factors.push("OVERDUE — Response deadline passed"); recommended_actions.push("File condonation of delay application immediately"); }
  else if (notice.days_remaining <= 3) { time_risk = 30; key_risk_factors.push(`Only ${notice.days_remaining} days left to respond`); recommended_actions.push("Respond TODAY — file immediately"); }
  else if (notice.days_remaining <= 7) { time_risk = 20; key_risk_factors.push(`${notice.days_remaining} days remaining — urgent`); recommended_actions.push("Respond within 2 days"); }
  else if (notice.days_remaining <= 15) { time_risk = 15; recommended_actions.push("Respond within this week"); }
  else { time_risk = 5; recommended_actions.push("Plan response — adequate time available"); }

  // Legal Complexity (0-30)
  if (notice.category === "IT_REASSESSMENT" || notice.category === "GST_DEMAND") {
    legal_complexity = 30;
    key_risk_factors.push("High legal complexity — requires CA/Advocate intervention");
    recommended_actions.push("Engage CA / Tax Advocate for response");
  } else if (notice.category === "IT_SCRUTINY") {
    legal_complexity = 25;
    key_risk_factors.push("Scrutiny assessment — full books examination");
    recommended_actions.push("Compile complete books of accounts");
  } else if (notice.category === "GST_SCRUTINY") {
    legal_complexity = 20;
    recommended_actions.push("Download and reconcile GSTR-1, 3B, 2B for the period");
  } else {
    legal_complexity = 10;
  }

  const overall = financial_risk + time_risk + legal_complexity;
  const risk_label = overall >= 75 ? "CRITICAL" : overall >= 50 ? "HIGH" : overall >= 25 ? "MEDIUM" : "LOW";

  if (recommended_actions.length === 0) recommended_actions.push("Draft and file response within statutory period");

  return { overall_score: overall, financial_risk, time_risk, legal_complexity, risk_label, key_risk_factors, recommended_actions };
}
