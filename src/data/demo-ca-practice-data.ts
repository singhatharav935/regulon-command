/**
 * DEMO CA PRACTICE DATA — PHASE 5
 * =================================
 * ⚠️ FOR DEMO DASHBOARDS ONLY
 *
 * Realistic multi-client CA practice dataset for:
 *  — 5 demo client companies with full profiles
 *  — Per-client compliance health scores (4-quadrant: IT + GST + MCA + Labour)
 *  — CA billing entries for notice work
 *  — Statutory due date calendar (FY 2025-26)
 *  — CA team assignments
 */

import {
  computeClientComplianceHealth,
  computeNoticeBilling,
  generateStatutoryCalendar,
  assignWorkload,
  type CAClientProfile,
  type ClientComplianceHealth,
  type NoticeEngagementBilling,
  type StatutoryDueDate,
  type WorkloadAssignment,
  type CATeamMember,
} from "@/lib/accounting/ca-practice-intelligence";

import { DEMO_STATUTORY_NOTICES } from "./demo-statutory-notice-data";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: DEMO CLIENT PROFILES (5 COMPANIES)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CA_CLIENTS: CAClientProfile[] = [
  {
    client_id: "CLT-001",
    client_name: "Sannidh Technologies Pvt. Ltd.",
    pan: "AAKCS1234F",
    gstin: "27AAKCS1234F1Z5",
    tan: "MUMS12345T",
    cin: "U72900MH2018PTC312456",
    sector: "technology",
    turnover_cr: 18.2,
    is_audit_applicable: true,
    is_transfer_pricing_applicable: true,
    gst_registration_type: "Regular",
    assigned_ca: "CA Vikramaditya Sharma",
    assigned_article: "Riya Mehta",
    client_since: "2022-04-01",
  },
  {
    client_id: "CLT-002",
    client_name: "Mahindra Steels & Alloys Pvt. Ltd.",
    pan: "AABCM5678G",
    gstin: "27AABCM5678G1Z3",
    tan: "MUML56789U",
    cin: "U27310MH2015PTC287654",
    sector: "manufacturing",
    turnover_cr: 45.8,
    is_audit_applicable: true,
    is_transfer_pricing_applicable: false,
    gst_registration_type: "Regular",
    assigned_ca: "CA Ananya Krishnan",
    assigned_article: "Arjun Patel",
    client_since: "2020-06-15",
  },
  {
    client_id: "CLT-003",
    client_name: "Zeta Raw Materials Ltd.",
    pan: "AAACZ1234K",
    gstin: "27AAACZ1234K1Z5",
    tan: "MUMZ09876Z",
    cin: "U51100MH2019PLC345678",
    sector: "trading",
    turnover_cr: 12.4,
    is_audit_applicable: true,
    is_transfer_pricing_applicable: false,
    gst_registration_type: "Regular",
    assigned_ca: "CA Vikramaditya Sharma",
    assigned_article: "Riya Mehta",
    client_since: "2021-01-10",
  },
  {
    client_id: "CLT-004",
    client_name: "Embassy Healthcare Services Pvt. Ltd.",
    pan: "AABCE9988G",
    gstin: "27AABCE9988G1Z9",
    tan: "MUME11223E",
    cin: "U85100MH2020PTC398765",
    sector: "healthcare",
    turnover_cr: 8.6,
    is_audit_applicable: false,
    is_transfer_pricing_applicable: false,
    gst_registration_type: "Regular",
    assigned_ca: "CA Ananya Krishnan",
    assigned_article: "Arjun Patel",
    client_since: "2023-03-20",
  },
  {
    client_id: "CLT-005",
    client_name: "Delta Office Supplies LLP",
    pan: "AABCF1122J",
    gstin: "27AABCF1122J1Z1",
    tan: "MUMD33445D",
    cin: undefined,
    sector: "trading",
    turnover_cr: 3.2,
    is_audit_applicable: false,
    is_transfer_pricing_applicable: false,
    gst_registration_type: "Regular",
    assigned_ca: "CA Vikramaditya Sharma",
    assigned_article: "Siddharth Joshi",
    client_since: "2024-07-01",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: FILING DATA PER CLIENT (used to compute health scores)
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_FILING_DATA: Record<string, Parameters<typeof computeClientComplianceHealth>[2]> = {
  "CLT-001": { itr_filed: true, itr_verified: true, advance_tax_compliant: true, tds_returns_current: true, gstr1_pct: 100, gstr3b_pct: 100, itc_recon_score: 78, gstr9_filed: true, gstr9c_filed: true, aoc4_filed: true, mgt7_filed: true, dir3_kyc: true, inc20a_filed: true, pf_ecr_current: true, esic_current: true, pt_current: true },
  "CLT-002": { itr_filed: true, itr_verified: true, advance_tax_compliant: false, tds_returns_current: true, gstr1_pct: 91, gstr3b_pct: 100, itc_recon_score: 92, gstr9_filed: true, gstr9c_filed: true, aoc4_filed: true, mgt7_filed: false, dir3_kyc: true, inc20a_filed: true, pf_ecr_current: true, esic_current: false, pt_current: true },
  "CLT-003": { itr_filed: true, itr_verified: false, advance_tax_compliant: true, tds_returns_current: false, gstr1_pct: 83, gstr3b_pct: 83, itc_recon_score: 65, gstr9_filed: false, gstr9c_filed: false, aoc4_filed: true, mgt7_filed: true, dir3_kyc: false, inc20a_filed: true, pf_ecr_current: false, esic_current: true, pt_current: false },
  "CLT-004": { itr_filed: false, itr_verified: false, advance_tax_compliant: false, tds_returns_current: true, gstr1_pct: 100, gstr3b_pct: 100, itc_recon_score: 100, gstr9_filed: false, gstr9c_filed: false, aoc4_filed: false, mgt7_filed: false, dir3_kyc: true, inc20a_filed: true, pf_ecr_current: true, esic_current: true, pt_current: true },
  "CLT-005": { itr_filed: true, itr_verified: true, advance_tax_compliant: true, tds_returns_current: true, gstr1_pct: 100, gstr3b_pct: 100, itc_recon_score: 100, gstr9_filed: true, gstr9c_filed: false, aoc4_filed: false, mgt7_filed: false, dir3_kyc: false, inc20a_filed: true, pf_ecr_current: true, esic_current: true, pt_current: true },
};

// Map notices to clients (CLT-001 has real notices from Phase 4, others have none)
const CLIENT_NOTICES: Record<string, typeof DEMO_STATUTORY_NOTICES> = {
  "CLT-001": DEMO_STATUTORY_NOTICES,
  "CLT-002": [DEMO_STATUTORY_NOTICES[1]],  // SCN 74
  "CLT-003": [],
  "CLT-004": [DEMO_STATUTORY_NOTICES[2]],  // IT 143(2)
  "CLT-005": [],
};

export const DEMO_CLIENT_HEALTH_SCORES: ClientComplianceHealth[] = DEMO_CA_CLIENTS.map(client => {
  const notices = CLIENT_NOTICES[client.client_id] || [];
  const filing = CLIENT_FILING_DATA[client.client_id];
  return computeClientComplianceHealth(
    client,
    notices.map(n => ({ severity: n.severity, total_demand: n.total_demand, category: n.category, response_due_date: n.response_due_date })),
    filing
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: CA BILLING ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_BILLING_ENTRIES: NoticeEngagementBilling[] = [
  computeNoticeBilling({
    id: "BILL-001",
    client_id: "CLT-001",
    client_name: "Sannidh Technologies Pvt. Ltd.",
    notice_type: "ASMT-10",
    notice_number: "ZB2700CGST/SCR/2025-26/001234",
    assigned_ca: "CA Vikramaditya Sharma",
    demand_amount: 2184000,
    billing_model: "FIXED_FEE",
    agreed_fixed_fee: 35000,
    hours_spent: 10,
    hourly_rate: 3500,
    engagement_date: "2025-07-02",
  }),
  computeNoticeBilling({
    id: "BILL-002",
    client_id: "CLT-001",
    client_name: "Sannidh Technologies Pvt. Ltd.",
    notice_type: "SCN u/s 74",
    notice_number: "SCN/74/MUM/2025-26/0089",
    assigned_ca: "CA Vikramaditya Sharma",
    demand_amount: 11880000,
    billing_model: "SUCCESS_BASED",
    success_fee_pct: 1.5,
    hours_spent: 22,
    hourly_rate: 3500,
    engagement_date: "2025-06-16",
  }),
  computeNoticeBilling({
    id: "BILL-003",
    client_id: "CLT-001",
    client_name: "Sannidh Technologies Pvt. Ltd.",
    notice_type: "Notice u/s 143(2)",
    notice_number: "ITBA/AST/S/143(2)/2025-26/1023456789",
    assigned_ca: "CA Vikramaditya Sharma",
    demand_amount: 0,
    billing_model: "TIME_BASED",
    hours_spent: 18,
    hourly_rate: 4000,
    engagement_date: "2025-09-16",
  }),
  computeNoticeBilling({
    id: "BILL-004",
    client_id: "CLT-001",
    client_name: "Sannidh Technologies Pvt. Ltd.",
    notice_type: "Notice u/s 148",
    notice_number: "ITBA/AST/S/148/2024-25/0045678",
    assigned_ca: "CA Vikramaditya Sharma",
    demand_amount: 3840000,
    billing_model: "TIME_BASED",
    hours_spent: 26,
    hourly_rate: 4000,
    engagement_date: "2025-03-29",
  }),
  {
    ...computeNoticeBilling({
      id: "BILL-005",
      client_id: "CLT-002",
      client_name: "Mahindra Steels & Alloys Pvt. Ltd.",
      notice_type: "SCN u/s 74",
      notice_number: "SCN/74/MUM/2025-26/0089",
      assigned_ca: "CA Ananya Krishnan",
      demand_amount: 11880000,
      billing_model: "FIXED_FEE",
      agreed_fixed_fee: 75000,
      hours_spent: 28,
      hourly_rate: 4000,
      engagement_date: "2025-06-16",
    }),
    status: "INVOICED" as const,
    invoice_number: "INV-2025-089",
    invoice_date: "2025-07-01",
    due_date: "2025-07-31",
    amount_received: 0,
    outstanding: 75000,
    amount_billed: 75000,
  },
  {
    ...computeNoticeBilling({
      id: "BILL-006",
      client_id: "CLT-004",
      client_name: "Embassy Healthcare Services Pvt. Ltd.",
      notice_type: "Notice u/s 143(2)",
      notice_number: "ITBA/AST/S/143(2)/2025-26/1023456789",
      assigned_ca: "CA Ananya Krishnan",
      demand_amount: 0,
      billing_model: "FIXED_FEE",
      agreed_fixed_fee: 28000,
      hours_spent: 12,
      hourly_rate: 3500,
      engagement_date: "2025-09-16",
    }),
    status: "PAID" as const,
    invoice_number: "INV-2025-092",
    invoice_date: "2025-09-20",
    due_date: "2025-10-20",
    amount_received: 28000,
    outstanding: 0,
    amount_billed: 28000,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: STATUTORY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_STATUTORY_CALENDAR: StatutoryDueDate[] = generateStatutoryCalendar("2025-26");

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: CA TEAM
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CA_TEAM: CATeamMember[] = [
  { id: "CA-001", name: "CA Vikramaditya Sharma", designation: "Partner", available_hours_per_week: 30, specializations: ["GST", "IT_SCRUTINY", "Transfer_Pricing", "MCA"], current_assignments: 4, utilization_pct: 72 },
  { id: "CA-002", name: "CA Ananya Krishnan", designation: "Manager", available_hours_per_week: 40, specializations: ["GST", "IT_SCRUTINY", "Labour"], current_assignments: 3, utilization_pct: 58 },
  { id: "CA-003", name: "CA Rohan Joshi", designation: "Senior CA", available_hours_per_week: 45, specializations: ["TDS", "IT_SCRUTINY", "MCA"], current_assignments: 2, utilization_pct: 40 },
  { id: "CA-004", name: "Riya Mehta", designation: "Article Assistant", available_hours_per_week: 48, specializations: ["GST", "MCA"], current_assignments: 5, utilization_pct: 65 },
  { id: "CA-005", name: "Arjun Patel", designation: "Article Assistant", available_hours_per_week: 48, specializations: ["TDS", "Labour"], current_assignments: 3, utilization_pct: 45 },
  { id: "CA-006", name: "Siddharth Joshi", designation: "Article Assistant", available_hours_per_week: 48, specializations: ["GST", "MCA"], current_assignments: 1, utilization_pct: 20 },
];

export const DEMO_WORKLOAD_ASSIGNMENTS: WorkloadAssignment[] = assignWorkload(
  DEMO_STATUTORY_NOTICES.map(n => ({
    id: n.id,
    notice_type: n.notice_type,
    client_name: n.company_name,
    severity: n.severity,
    category: n.category,
  })),
  DEMO_CA_TEAM
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: FIRM SUMMARY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const total_billing = DEMO_BILLING_ENTRIES.reduce((s, b) => s + b.amount_billed, 0);
const received = DEMO_BILLING_ENTRIES.reduce((s, b) => s + b.amount_received, 0);
const outstanding = DEMO_BILLING_ENTRIES.reduce((s, b) => s + b.outstanding, 0);
const wip = DEMO_BILLING_ENTRIES.filter(b => b.status === "WIP").reduce((s, b) => s + b.amount_billed, 0);

export const DEMO_FIRM_SUMMARY = {
  total_clients: DEMO_CA_CLIENTS.length,
  red_risk_clients: DEMO_CLIENT_HEALTH_SCORES.filter(c => c.risk_level === "RED").length,
  amber_risk_clients: DEMO_CLIENT_HEALTH_SCORES.filter(c => c.risk_level === "AMBER").length,
  green_risk_clients: DEMO_CLIENT_HEALTH_SCORES.filter(c => c.risk_level === "GREEN").length,
  total_active_notices: DEMO_STATUTORY_NOTICES.length,
  critical_notices: DEMO_STATUTORY_NOTICES.filter(n => n.severity === "CRITICAL").length,
  total_demand_exposure: DEMO_STATUTORY_NOTICES.reduce((s, n) => s + (n.total_demand || 0), 0),
  overdue_deadlines: DEMO_STATUTORY_CALENDAR.filter(d => d.urgency === "OVERDUE").length,
  critical_deadlines: DEMO_STATUTORY_CALENDAR.filter(d => d.urgency === "CRITICAL").length,
  billing_total_billed: total_billing,
  billing_received: received,
  billing_outstanding: outstanding,
  billing_wip: wip,
  avg_client_health: Math.round(DEMO_CLIENT_HEALTH_SCORES.reduce((s, c) => s + c.overall_score, 0) / DEMO_CLIENT_HEALTH_SCORES.length),
};
