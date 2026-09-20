/**
 * CA PRACTICE INTELLIGENCE ENGINE — PHASE 5
 * ==========================================
 * Pure computation engine. Zero UI. Zero Supabase calls.
 * Shared between CA Dashboard tabs and CA Firm Dashboard.
 *
 * Implements:
 *  1. Multi-Client Statutory Compliance Aggregator
 *     — Aggregate notice inbox across all clients (GST + IT + MCA + EPFO)
 *     — Per-client compliance health scoring (0–100)
 *     — Firm-wide risk exposure summary
 *  2. CA Billing from Notice Work Engine
 *     — Auto-generate engagement letters and billing entries from notice work
 *     — WIP (Work-In-Progress) tracker per notice per client
 *     — Fee computation: Fixed + Time-based + Success-based models
 *  3. Client Compliance Health Score Engine
 *     — Income Tax health (returns filed, scrutiny risk, TDS compliance)
 *     — GST health (filing rate, ITC reconciliation score, demand history)
 *     — Corporate Law health (MCA filings, AGM compliance, ROC dues)
 *     — Labour Law health (PF/ESIC compliance, PT compliance)
 *  4. Due Date Intelligence Calendar
 *     — Statutory deadlines for all 12 return types across all clients
 *     — Days-to-deadline urgency tiering
 *     — Assignment suggestions based on team workload
 *  5. CA Team Workload Balancer
 *     — Staff assignment matrix across client notices
 *     — Utilization % per team member
 *     — Smart reassignment recommendations
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: MULTI-CLIENT AGGREGATOR TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CAClientProfile {
  client_id: string;
  client_name: string;
  pan: string;
  gstin?: string;
  tan?: string;
  cin?: string;
  sector: "technology" | "manufacturing" | "trading" | "services" | "real_estate" | "healthcare" | "hospitality" | "ngo";
  turnover_cr: number;                // Annual turnover in Crores
  is_audit_applicable: boolean;       // Sec 44AB threshold crossed
  is_transfer_pricing_applicable: boolean;
  gst_registration_type: "Regular" | "Composition" | "OIDAR" | "None";
  assigned_ca: string;
  assigned_article: string;
  client_since: string;               // ISO date
  last_sync_date: string;
}

export interface ClientComplianceHealth {
  client_id: string;
  client_name: string;
  overall_score: number;            // 0-100
  it_health: ITComplianceHealth;
  gst_health: GSTComplianceHealth;
  mca_health: MCAComplianceHealth;
  labour_health: LabourComplianceHealth;
  active_notice_count: number;
  critical_notice_count: number;
  total_demand_exposure: number;   // ₹ total demand across all active notices
  next_critical_deadline: string | null;
  risk_level: "GREEN" | "AMBER" | "RED";
  last_computed: string;           // ISO datetime
}

export interface ITComplianceHealth {
  score: number;                   // 0-25
  itr_filed: boolean;
  itr_verified: boolean;
  advance_tax_compliant: boolean;
  tds_returns_current: boolean;    // 26Q / Form 140 filed for last quarter
  has_pending_scrutiny: boolean;
  has_reassessment: boolean;
  defects: string[];
}

export interface GSTComplianceHealth {
  score: number;                   // 0-25
  gstr1_filing_pct: number;        // % months filed on time in last 12
  gstr3b_filing_pct: number;       // % months filed on time in last 12
  itc_reconciliation_score: number; // from GSTR-2B reconciler (Phase 3)
  has_active_demand: boolean;
  gstr9_filed: boolean;            // Annual return
  gstr9c_filed: boolean;           // Reconciliation statement (if applicable)
  defects: string[];
}

export interface MCAComplianceHealth {
  score: number;                   // 0-25
  aoc4_filed: boolean;             // Financial statements filing
  mgt7_filed: boolean;             // Annual return
  dir3_kyc_done: boolean;          // Director KYC
  inc20a_filed: boolean;           // Commencement of Business
  has_dis_qualifications: boolean;
  defects: string[];
}

export interface LabourComplianceHealth {
  score: number;                   // 0-25
  pf_ecr_current: boolean;         // ECR filed for last month
  esic_return_current: boolean;
  pt_return_current: boolean;
  defects: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: HEALTH SCORE COMPUTATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function computeClientComplianceHealth(
  client: CAClientProfile,
  notices: Array<{ severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; total_demand?: number; category: string; response_due_date: string }>,
  filing_data: {
    itr_filed: boolean;
    itr_verified: boolean;
    advance_tax_compliant: boolean;
    tds_returns_current: boolean;
    gstr1_pct: number;
    gstr3b_pct: number;
    itc_recon_score: number;
    gstr9_filed: boolean;
    gstr9c_filed: boolean;
    aoc4_filed: boolean;
    mgt7_filed: boolean;
    dir3_kyc: boolean;
    inc20a_filed: boolean;
    pf_ecr_current: boolean;
    esic_current: boolean;
    pt_current: boolean;
  }
): ClientComplianceHealth {

  // ── IT Health ──
  const it_defects: string[] = [];
  let it_score = 25;
  if (!filing_data.itr_filed) { it_score -= 8; it_defects.push("ITR not filed"); }
  if (!filing_data.itr_verified) { it_score -= 3; it_defects.push("ITR not verified (ITR-V pending)"); }
  if (!filing_data.advance_tax_compliant) { it_score -= 5; it_defects.push("Advance tax shortfall — Sec 234C interest accruing"); }
  if (!filing_data.tds_returns_current) { it_score -= 5; it_defects.push("TDS return (Form 140) not filed for last quarter"); }
  const has_it_scrutiny = notices.some(n => n.category === "IT_SCRUTINY" || n.category === "IT_REASSESSMENT");
  if (has_it_scrutiny) { it_score -= 4; it_defects.push("Active income tax scrutiny / reassessment"); }

  const it_health: ITComplianceHealth = {
    score: Math.max(0, it_score),
    itr_filed: filing_data.itr_filed,
    itr_verified: filing_data.itr_verified,
    advance_tax_compliant: filing_data.advance_tax_compliant,
    tds_returns_current: filing_data.tds_returns_current,
    has_pending_scrutiny: notices.some(n => n.category === "IT_SCRUTINY"),
    has_reassessment: notices.some(n => n.category === "IT_REASSESSMENT"),
    defects: it_defects,
  };

  // ── GST Health ──
  const gst_defects: string[] = [];
  let gst_score = 25;
  if (filing_data.gstr1_pct < 100) { const deduct = Math.round((100 - filing_data.gstr1_pct) / 20); gst_score -= deduct; gst_defects.push(`GSTR-1 filing rate: ${filing_data.gstr1_pct}% (${deduct} points deducted)`); }
  if (filing_data.gstr3b_pct < 100) { const deduct = Math.round((100 - filing_data.gstr3b_pct) / 20); gst_score -= deduct; gst_defects.push(`GSTR-3B filing rate: ${filing_data.gstr3b_pct}%`); }
  if (filing_data.itc_recon_score < 80) { gst_score -= 4; gst_defects.push(`GSTR-2B ITC reconciliation: ${filing_data.itc_recon_score}% — unreconciled ITC risk`); }
  const has_gst_demand = notices.some(n => n.category === "GST_DEMAND" || n.category === "GST_SCRUTINY");
  if (has_gst_demand) { gst_score -= 4; gst_defects.push("Active GST demand / scrutiny notice"); }
  if (!filing_data.gstr9_filed) { gst_score -= 3; gst_defects.push("GSTR-9 Annual Return not filed"); }

  const gst_health: GSTComplianceHealth = {
    score: Math.max(0, gst_score),
    gstr1_filing_pct: filing_data.gstr1_pct,
    gstr3b_filing_pct: filing_data.gstr3b_pct,
    itc_reconciliation_score: filing_data.itc_recon_score,
    has_active_demand: has_gst_demand,
    gstr9_filed: filing_data.gstr9_filed,
    gstr9c_filed: filing_data.gstr9c_filed,
    defects: gst_defects,
  };

  // ── MCA Health ──
  const mca_defects: string[] = [];
  let mca_score = 25;
  if (!filing_data.aoc4_filed) { mca_score -= 8; mca_defects.push("AOC-4 Financial Statements not filed"); }
  if (!filing_data.mgt7_filed) { mca_score -= 7; mca_defects.push("MGT-7 Annual Return not filed"); }
  if (!filing_data.dir3_kyc) { mca_score -= 6; mca_defects.push("DIR-3 KYC pending for directors — DIN at risk"); }
  if (!filing_data.inc20a_filed) { mca_score -= 4; mca_defects.push("INC-20A (Commencement) not filed"); }

  const mca_health: MCAComplianceHealth = {
    score: Math.max(0, mca_score),
    aoc4_filed: filing_data.aoc4_filed,
    mgt7_filed: filing_data.mgt7_filed,
    dir3_kyc_done: filing_data.dir3_kyc,
    inc20a_filed: filing_data.inc20a_filed,
    has_dis_qualifications: false,
    defects: mca_defects,
  };

  // ── Labour Health ──
  const labour_defects: string[] = [];
  let labour_score = 25;
  if (!filing_data.pf_ecr_current) { labour_score -= 10; labour_defects.push("EPF ECR not filed for last month"); }
  if (!filing_data.esic_current) { labour_score -= 8; labour_defects.push("ESIC Return overdue"); }
  if (!filing_data.pt_current) { labour_score -= 7; labour_defects.push("Professional Tax return overdue"); }

  const labour_health: LabourComplianceHealth = {
    score: Math.max(0, labour_score),
    pf_ecr_current: filing_data.pf_ecr_current,
    esic_return_current: filing_data.esic_current,
    pt_return_current: filing_data.pt_current,
    defects: labour_defects,
  };

  const overall = it_health.score + gst_health.score + mca_health.score + labour_health.score;
  const risk_level = overall >= 75 ? "GREEN" : overall >= 50 ? "AMBER" : "RED";
  const active_count = notices.length;
  const critical_count = notices.filter(n => n.severity === "CRITICAL").length;
  const total_demand = notices.reduce((s, n) => s + (n.total_demand || 0), 0);

  const sorted_by_due = [...notices].sort((a, b) => new Date(a.response_due_date).getTime() - new Date(b.response_due_date).getTime());
  const next_deadline = sorted_by_due.length > 0 ? sorted_by_due[0].response_due_date : null;

  return {
    client_id: client.client_id,
    client_name: client.client_name,
    overall_score: overall,
    it_health,
    gst_health,
    mca_health,
    labour_health,
    active_notice_count: active_count,
    critical_notice_count: critical_count,
    total_demand_exposure: total_demand,
    next_critical_deadline: next_deadline,
    risk_level,
    last_computed: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: CA BILLING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export type BillingModel = "FIXED_FEE" | "TIME_BASED" | "SUCCESS_BASED" | "RETAINER";

export interface NoticeEngagementBilling {
  id: string;
  client_id: string;
  client_name: string;
  notice_type: string;
  notice_number: string;
  assigned_ca: string;
  billing_model: BillingModel;
  // Fixed fee
  agreed_fixed_fee?: number;
  // Time-based
  hours_spent: number;
  hourly_rate: number;
  time_based_amount: number;
  // Success-based
  demand_amount: number;
  success_fee_pct: number;
  success_fee_amount: number;
  // Billing status
  status: "WIP" | "INVOICED" | "PAID" | "WRITTEN_OFF";
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  amount_billed: number;
  amount_received: number;
  outstanding: number;
  // Engagement letter
  engagement_date: string;
  scope_of_work: string;
  deliverables: string[];
}

export function computeNoticeBilling(inputs: {
  id: string;
  client_id: string;
  client_name: string;
  notice_type: string;
  notice_number: string;
  assigned_ca: string;
  demand_amount: number;
  billing_model: BillingModel;
  agreed_fixed_fee?: number;
  hours_spent?: number;
  hourly_rate?: number;
  success_fee_pct?: number;
  engagement_date: string;
}): NoticeEngagementBilling {

  const hours = inputs.hours_spent || 0;
  const rate = inputs.hourly_rate || 3500; // Default ₹3,500/hour for a qualified CA
  const time_based = Math.round(hours * rate);

  const suc_pct = inputs.success_fee_pct || 2.5;
  const success_fee = inputs.billing_model === "SUCCESS_BASED"
    ? Math.round(inputs.demand_amount * (suc_pct / 100))
    : 0;

  const fixed = inputs.agreed_fixed_fee || 0;

  const amount_billed = inputs.billing_model === "FIXED_FEE" ? fixed
    : inputs.billing_model === "TIME_BASED" ? time_based
    : inputs.billing_model === "SUCCESS_BASED" ? success_fee
    : fixed; // RETAINER

  const scope = generateScopeOfWork(inputs.notice_type);
  const deliverables = generateDeliverables(inputs.notice_type);

  return {
    id: inputs.id,
    client_id: inputs.client_id,
    client_name: inputs.client_name,
    notice_type: inputs.notice_type,
    notice_number: inputs.notice_number,
    assigned_ca: inputs.assigned_ca,
    billing_model: inputs.billing_model,
    agreed_fixed_fee: fixed,
    hours_spent: hours,
    hourly_rate: rate,
    time_based_amount: time_based,
    demand_amount: inputs.demand_amount,
    success_fee_pct: suc_pct,
    success_fee_amount: success_fee,
    status: "WIP",
    amount_billed,
    amount_received: 0,
    outstanding: amount_billed,
    engagement_date: inputs.engagement_date,
    scope_of_work: scope,
    deliverables,
  };
}

function generateScopeOfWork(notice_type: string): string {
  const scopes: Record<string, string> = {
    "ASMT-10": "Review of GST returns for the relevant tax period, preparation of detailed reply to ASMT-10 scrutiny notice, reconciliation of GSTR-1/3B/2B discrepancies, and filing of reply on GST Portal.",
    "SCN u/s 73": "Analysis of Show Cause Notice u/s 73, preparation of legal defense, computation of tax/interest liability, preparation and filing of detailed reply, and representation before Adjudicating Authority if required.",
    "SCN u/s 74": "Analysis of Show Cause Notice u/s 74 (alleging fraud/suppression), preparation of comprehensive legal reply with case law citations, representation before Additional Commissioner, and filing of appeal if required.",
    "DRC-01": "Review of DRC-01 demand order, verification of demand computation, filing of application for installment/waiver if applicable, and payment advice.",
    "Notice u/s 143(2)": "Review of ITR and supporting documents, preparation of detailed reply to scrutiny notice, compilation of books of accounts, and representation before Assessing Officer.",
    "Notice u/s 148": "Legal challenge to reassessment notice under Sec 148A procedure, filing of objections, preparation of detailed reply, and representation before AO and CIT(A) if required.",
    "Order u/s 201(1)": "Review of TDS default order, computation of correct TDS liability, verification of payee's return filing, preparation of reply citing Sec 201(1) proviso, and representation before TDS AO.",
    "DIR-3 KYC Notice": "Collection of KYC documents from directors, filing of DIR-3 KYC eForm on MCA V3 portal, OTP verification, and obtaining acknowledgment.",
    "EPFO Demand Notice u/s 7A": "Review of EPFO demand, verification of contractor EPF compliance, preparation of reply with supporting documents, and representation before RPFC.",
  };
  return scopes[notice_type] || `Professional services for response to ${notice_type} statutory notice, including preparation of reply, compilation of documents, and representation before the issuing authority.`;
}

function generateDeliverables(notice_type: string): string[] {
  const base = ["Written reply to the notice", "Document compilation folder", "Compliance checklist"];
  if (notice_type.includes("GST") || notice_type.includes("SCN") || notice_type.includes("ASMT")) {
    return [...base, "GST Return reconciliation statement", "ITC eligible/ineligible workings", "Case law memorandum", "Portal filing acknowledgment"];
  }
  if (notice_type.includes("143") || notice_type.includes("148")) {
    return [...base, "Written submissions before AO", "Books of accounts compilation", "Reconciliation with Form 138 (26AS)", "Case law memorandum", "Assessment order review note"];
  }
  if (notice_type.includes("201")) {
    return [...base, "TDS computation workings", "Form 16A / Form 140 copies", "Payee return verification", "Interest computation u/s 201(1A)"];
  }
  return [...base, "Filing acknowledgment", "Action taken report"];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: DUE DATE INTELLIGENCE CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

export type ReturnType =
  | "GSTR1" | "GSTR3B" | "GSTR9" | "GSTR9C"
  | "TDS_RETURN" | "TDS_DEPOSIT"
  | "ADVANCE_TAX_Q1" | "ADVANCE_TAX_Q2" | "ADVANCE_TAX_Q3" | "ADVANCE_TAX_Q4"
  | "ITR_COMPANY" | "ITR_AUDIT"
  | "AOC4" | "MGT7" | "DIR3_KYC"
  | "PF_ECR" | "ESIC_RETURN" | "PT_RETURN";

export interface StatutoryDueDate {
  id: string;
  return_type: ReturnType;
  label: string;
  category: "GST" | "INCOME_TAX" | "TDS" | "MCA" | "LABOUR";
  due_date: string;         // ISO date
  applicable_to: string;   // e.g. "All GST Registered" / "Companies > ₹5 Cr Turnover"
  late_fee_per_day?: number;
  section: string;
  days_remaining: number;
  urgency: "OVERDUE" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export function generateStatutoryCalendar(fiscal_year: string = "2025-26"): StatutoryDueDate[] {
  const today = new Date();

  function addDays(date: Date, d: number): Date {
    const r = new Date(date);
    r.setDate(r.getDate() + d);
    return r;
  }

  function makeDate(iso: string): { date: string; days_remaining: number; urgency: StatutoryDueDate["urgency"] } {
    const d = new Date(iso);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const urgency = diff < 0 ? "OVERDUE" : diff <= 3 ? "CRITICAL" : diff <= 7 ? "HIGH" : diff <= 15 ? "MEDIUM" : "LOW";
    return { date: iso, days_remaining: diff, urgency };
  }

  const FY = fiscal_year; // "2025-26"
  const AY = `${parseInt(FY.split("-")[0]) + 1}-${parseInt(FY.split("-")[1]) + 1}`;

  const deadlines: Omit<StatutoryDueDate, "days_remaining" | "urgency">[] = [
    // ── GST Monthly Returns ────────────────────────────────────────────────
    { id: "gstr1-q2-oct25", return_type: "GSTR1", label: "GSTR-1 — October 2025", category: "GST", due_date: "2025-11-11", applicable_to: "All GST Registered", late_fee_per_day: 50, section: "Section 37 CGST Act 2017" },
    { id: "gstr3b-q2-oct25", return_type: "GSTR3B", label: "GSTR-3B — October 2025", category: "GST", due_date: "2025-11-20", applicable_to: "All GST Registered", late_fee_per_day: 50, section: "Section 39 CGST Act 2017" },
    { id: "gstr1-nov25", return_type: "GSTR1", label: "GSTR-1 — November 2025", category: "GST", due_date: "2025-12-11", applicable_to: "All GST Registered", late_fee_per_day: 50, section: "Section 37 CGST Act 2017" },
    { id: "gstr3b-nov25", return_type: "GSTR3B", label: "GSTR-3B — November 2025", category: "GST", due_date: "2025-12-20", applicable_to: "All GST Registered", late_fee_per_day: 50, section: "Section 39 CGST Act 2017" },
    { id: "gstr9-fy2526", return_type: "GSTR9", label: "GSTR-9 Annual Return — FY 2024-25", category: "GST", due_date: "2025-12-31", applicable_to: "Turnover > ₹2 Crore", late_fee_per_day: 200, section: "Section 44 CGST Act 2017" },
    { id: "gstr9c-fy2526", return_type: "GSTR9C", label: "GSTR-9C Reconciliation Statement — FY 2024-25", category: "GST", due_date: "2025-12-31", applicable_to: "Turnover > ₹5 Crore", section: "Section 44 CGST Act 2017" },

    // ── TDS Returns & Deposits ─────────────────────────────────────────────
    { id: "tds-deposit-oct25", return_type: "TDS_DEPOSIT", label: "TDS Deposit — October 2025 (Challan 281)", category: "TDS", due_date: "2025-11-07", applicable_to: "All TDS Deductors", section: "Section 200 IT Act / Rule 30" },
    { id: "tds-return-q2-25", return_type: "TDS_RETURN", label: "TDS Return — Q2 (Form 140 / 26Q) Jul-Sep 2025", category: "TDS", due_date: "2025-10-31", applicable_to: "All TDS Deductors", late_fee_per_day: 200, section: "Section 200(3) IT Act / Rule 31A" },
    { id: "tds-deposit-nov25", return_type: "TDS_DEPOSIT", label: "TDS Deposit — November 2025 (Challan 281)", category: "TDS", due_date: "2025-12-07", applicable_to: "All TDS Deductors", section: "Section 200 IT Act / Rule 30" },
    { id: "tds-return-q3-25", return_type: "TDS_RETURN", label: "TDS Return — Q3 (Form 140 / 26Q) Oct-Dec 2025", category: "TDS", due_date: "2026-01-31", applicable_to: "All TDS Deductors", late_fee_per_day: 200, section: "Section 200(3) IT Act / Rule 31A" },

    // ── Advance Tax ────────────────────────────────────────────────────────
    { id: "adv-tax-q2-25", return_type: "ADVANCE_TAX_Q2", label: "Advance Tax — Q2 Instalment (45%) — FY 2025-26", category: "INCOME_TAX", due_date: "2025-09-15", applicable_to: "Net Tax Payable > ₹10,000 (Sec 208)", section: "Section 211 / 234C IT Act" },
    { id: "adv-tax-q3-25", return_type: "ADVANCE_TAX_Q3", label: "Advance Tax — Q3 Instalment (75%) — FY 2025-26", category: "INCOME_TAX", due_date: "2025-12-15", applicable_to: "Net Tax Payable > ₹10,000 (Sec 208)", section: "Section 211 / 234C IT Act" },
    { id: "adv-tax-q4-25", return_type: "ADVANCE_TAX_Q4", label: "Advance Tax — Q4 Instalment (100%) — FY 2025-26", category: "INCOME_TAX", due_date: "2026-03-15", applicable_to: "Net Tax Payable > ₹10,000 (Sec 208)", section: "Section 211 / 234C IT Act" },

    // ── Income Tax Returns ─────────────────────────────────────────────────
    { id: "itr-company-25", return_type: "ITR_COMPANY", label: "ITR Filing — Companies (Non-Audit) — AY 2025-26", category: "INCOME_TAX", due_date: "2025-10-31", applicable_to: "All Companies (Non-Audit)", section: "Section 139(1) IT Act" },
    { id: "itr-audit-25", return_type: "ITR_AUDIT", label: "ITR Filing — Tax Audit Cases — AY 2025-26", category: "INCOME_TAX", due_date: "2025-11-30", applicable_to: "Companies u/s 44AB — Turnover > ₹1 Cr / ₹10 Cr", section: "Section 139(1) / 44AB IT Act" },

    // ── MCA Filings ────────────────────────────────────────────────────────
    { id: "aoc4-fy25", return_type: "AOC4", label: "AOC-4 Financial Statements Filing — FY 2024-25", category: "MCA", due_date: "2025-10-29", applicable_to: "All Private/Public Companies", late_fee_per_day: 100, section: "Section 137 Companies Act 2013" },
    { id: "mgt7-fy25", return_type: "MGT7", label: "MGT-7 Annual Return — FY 2024-25", category: "MCA", due_date: "2025-11-28", applicable_to: "All Private/Public Companies", late_fee_per_day: 100, section: "Section 92 Companies Act 2013" },
    { id: "dir3-kyc-25", return_type: "DIR3_KYC", label: "DIR-3 KYC Annual Filing — FY 2025-26", category: "MCA", due_date: "2025-09-30", applicable_to: "All DIN Holders", section: "Rule 12A Companies (Appointment) Rules 2014" },

    // ── Labour Compliance ──────────────────────────────────────────────────
    { id: "pf-ecr-oct25", return_type: "PF_ECR", label: "EPF ECR Filing — October 2025", category: "LABOUR", due_date: "2025-11-15", applicable_to: "All EPF Registered Employers", section: "Section 6 / 7A EPF & MP Act 1952" },
    { id: "esic-half-25", return_type: "ESIC_RETURN", label: "ESIC Return — April–September 2025", category: "LABOUR", due_date: "2025-11-11", applicable_to: "All ESIC Registered Employers", section: "Section 40 ESI Act 1948" },
    { id: "pt-return-q2-25", return_type: "PT_RETURN", label: "Professional Tax Return — Q2 (Jul–Sep 2025)", category: "LABOUR", due_date: "2025-10-31", applicable_to: "Maharashtra / Karnataka / AP employers", section: "State PT Act" },
  ];

  return deadlines.map(d => {
    const { days_remaining, urgency } = makeDate(d.due_date);
    return { ...d, days_remaining, urgency };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: CA TEAM WORKLOAD BALANCER
// ─────────────────────────────────────────────────────────────────────────────

export interface CATeamMember {
  id: string;
  name: string;
  designation: "Partner" | "Manager" | "Senior CA" | "CA" | "Article Assistant";
  available_hours_per_week: number;
  specializations: string[];  // e.g. ["GST", "IT_SCRUTINY", "Transfer_Pricing"]
  current_assignments: number;
  utilization_pct: number;    // 0-100
}

export interface WorkloadAssignment {
  notice_id: string;
  notice_type: string;
  client_name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommended_assignee: CATeamMember;
  estimated_hours: number;
  reason: string;
}

export function assignWorkload(
  notices: Array<{ id: string; notice_type: string; client_name: string; severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; category: string }>,
  team: CATeamMember[]
): WorkloadAssignment[] {
  const assignments: WorkloadAssignment[] = [];

  const sortedTeam = [...team].sort((a, b) => a.utilization_pct - b.utilization_pct);

  const estimated_hours: Record<string, number> = {
    "ASMT-10": 8,
    "SCN u/s 73": 12,
    "SCN u/s 74": 20,
    "DRC-01": 6,
    "Notice u/s 143(2)": 16,
    "Notice u/s 148": 24,
    "Order u/s 201(1)": 8,
    "DIR-3 KYC Notice": 2,
    "EPFO Demand Notice u/s 7A": 10,
  };

  for (const notice of notices) {
    const hours = estimated_hours[notice.notice_type] || 10;

    // Find best match — lowest utilization + relevant specialization
    const category_map: Record<string, string> = {
      "GST_SCRUTINY": "GST", "GST_DEMAND": "GST", "GST_CANCELLATION": "GST",
      "IT_SCRUTINY": "IT_SCRUTINY", "IT_REASSESSMENT": "IT_SCRUTINY",
      "IT_TDS_DEFAULT": "TDS", "MCA_COMPLIANCE": "MCA", "LABOUR_DEMAND": "Labour",
    };
    const needed_spec = category_map[notice.category] || "";

    const specialized = sortedTeam.filter(m => m.specializations.includes(needed_spec) && m.utilization_pct < 90);
    const best = specialized.length > 0 ? specialized[0] : sortedTeam[0];

    // Critical notices → Partner or Manager only
    const assignee = notice.severity === "CRITICAL"
      ? (sortedTeam.find(m => (m.designation === "Partner" || m.designation === "Manager") && m.utilization_pct < 90) || best)
      : best;

    assignments.push({
      notice_id: notice.id,
      notice_type: notice.notice_type,
      client_name: notice.client_name,
      severity: notice.severity,
      recommended_assignee: assignee,
      estimated_hours: hours,
      reason: notice.severity === "CRITICAL"
        ? `Critical notice — assigned to ${assignee.designation} level`
        : `${assignee.name} has lowest utilization (${assignee.utilization_pct}%) with ${needed_spec} specialization`,
    });

    // Update utilization
    assignee.utilization_pct = Math.min(100, assignee.utilization_pct + Math.round(hours / assignee.available_hours_per_week * 100));
  }

  return assignments;
}
