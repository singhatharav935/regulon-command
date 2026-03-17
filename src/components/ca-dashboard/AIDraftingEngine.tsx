import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  Shield,
  Sparkles,
  ChevronRight,
  FileWarning,
  Book,
  Loader2,
  Edit3,
  Eye,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const documentTypes = [
  { id: "mca-notice", label: "MCA Notice Response", authority: "MCA" },
  { id: "gst-show-cause", label: "GST Show Cause Reply", authority: "GST" },
  { id: "income-tax-response", label: "Income Tax Response", authority: "Income Tax" },
  { id: "rbi-filing", label: "RBI Filing", authority: "RBI" },
  { id: "sebi-compliance", label: "SEBI Compliance", authority: "SEBI" },
  { id: "customs-response", label: "Customs Response", authority: "Customs" },
  { id: "contract-review", label: "Contract Review", authority: "Legal" },
  { id: "custom-draft", label: "Custom Regulatory Draft", authority: "Custom" },
];

const demoClients = [
  { id: "1", name: "Acme Technologies Pvt. Ltd.", industry: "FinTech" },
  { id: "2", name: "GlobalTrade India Ltd.", industry: "E-Commerce" },
  { id: "3", name: "SecurePay Solutions", industry: "Payments" },
  { id: "4", name: "DataSync Analytics", industry: "IT Services" },
  { id: "5", name: "NovaRetail Ventures Pvt. Ltd.", industry: "Retail" },
  { id: "6", name: "Orbit Health Systems Pvt. Ltd.", industry: "Healthcare" },
  { id: "7", name: "Apex Logistics India Pvt. Ltd.", industry: "Logistics" },
  { id: "8", name: "BluePeak Manufacturing Pvt. Ltd.", industry: "Manufacturing" },
  { id: "9", name: "Vertex EduTech Solutions Pvt. Ltd.", industry: "EdTech" },
  { id: "10", name: "GreenGrid Energy Pvt. Ltd.", industry: "Energy" },
  { id: "11", name: "Skyline Infra Projects Pvt. Ltd.", industry: "Infrastructure" },
  { id: "12", name: "Quantum Agro Foods Pvt. Ltd.", industry: "AgriTech" },
  { id: "13", name: "MetroMed Devices Pvt. Ltd.", industry: "Medical Devices" },
  { id: "14", name: "Zenith Media Labs Pvt. Ltd.", industry: "Media & Advertising" },
];

type ClientOption = {
  id: string;
  name: string;
  industry: string;
};

const draftModes = [
  { id: "conservative", label: "Conservative", description: "Lowest risk, compliance-first language", color: "text-green-500" },
  { id: "balanced", label: "Balanced", description: "Standard industry practice", color: "text-yellow-500" },
  { id: "aggressive", label: "Assertive", description: "Legally defensible, assertive stance", color: "text-orange-500" },
];

const mcaReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "annual-filing-92-137", label: "Annual Filing (92/137)" },
  { id: "commencement-10a", label: "Commencement of Business (10A)" },
  { id: "registered-office-12", label: "Registered Office Compliance (12)" },
  { id: "agm-96", label: "AGM Compliance (96)" },
  { id: "board-reporting-117", label: "Board Resolution Filing (117)" },
  { id: "auditor-139-140", label: "Auditor Appointment/Removal (139/140)" },
  { id: "director-appointment-152-170", label: "Director Appointment/Registers (152/170)" },
  { id: "director-kyc", label: "Director KYC / Disqualification-linked (DIR-3 KYC / 164/167 context)" },
  { id: "charge-77-79", label: "Charge Registration (77/78/79)" },
  { id: "allotment-39-42", label: "Allotment / PAS-3 / Private Placement (39/42)" },
  { id: "registers-88", label: "Registers / MGT-1 / MGT-7A context (88)" },
  { id: "beneficial-ownership-90", label: "SBO / Beneficial Ownership (90)" },
  { id: "board-governance-173", label: "Board Meetings & Governance (173)" },
  { id: "board-report-134", label: "Board Report Compliance (134)" },
  { id: "csr-135", label: "CSR Compliance (135)" },
  { id: "related-party-188", label: "Related Party Transactions (188)" },
  { id: "loans-investments-185-186", label: "Loans/Guarantees/Investments (185/186)" },
  { id: "managerial-kmp-203", label: "KMP / Managerial Personnel (203)" },
  { id: "deposits-73-76", label: "Deposits (73/74/76)" },
  { id: "general-mca", label: "General MCA Adjudication" },
];

const gstReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "drc-01-scn-73-74", label: "DRC-01 SCN (73/74)" },
  { id: "drc-01a-pre-scn", label: "DRC-01A (Pre-SCN Intimation)" },
  { id: "asmt-10-discrepancy", label: "ASMT-10 Discrepancy Notice" },
  { id: "itc-mismatch", label: "ITC Mismatch / Ineligible Credit" },
  { id: "section-73-short-payment", label: "Section 73 Short Payment" },
  { id: "section-74-fraud-allegation", label: "Section 74 Fraud Allegation" },
  { id: "reg-17-cancellation-scn", label: "REG-17 Cancellation SCN" },
  { id: "registration-cancellation-29", label: "Registration Cancellation (29)" },
  { id: "reg-23-cancellation-reply", label: "REG-23 Cancellation Reply" },
  { id: "revocation-30", label: "Revocation of Cancellation (30)" },
  { id: "rcm-dispute", label: "RCM Dispute" },
  { id: "detention-seizure-129-130", label: "Detention/Seizure/Confiscation (129/130)" },
  { id: "e-way-bill-122-125", label: "E-way Bill / Penalty (122/125)" },
  { id: "drc-07-demand-order", label: "DRC-07 Demand Order" },
  { id: "refund-recovery", label: "Refund Recovery / Wrong Refund" },
  { id: "refund-rejection-54", label: "Refund Rejection (54)" },
  { id: "gstr-reconciliation", label: "GSTR Reconciliation Mismatch" },
  { id: "annual-return-44-80", label: "Annual Return / Reconciliation (44/80)" },
  { id: "tds-tcs-51-52", label: "TDS/TCS Credit Dispute (51/52)" },
  { id: "classification-valuation", label: "Classification / Valuation" },
  { id: "place-of-supply", label: "Place of Supply Dispute" },
  { id: "anti-profiteering-171", label: "Anti-Profiteering (171)" },
  { id: "transitional-credit-140", label: "Transitional Credit (140)" },
  { id: "interest-penalty-only", label: "Interest/Penalty Only" },
  { id: "gst-general", label: "General GST Show Cause" },
];

const incomeTaxReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "intimation-143-1", label: "Intimation / Summary Assessment (143(1))" },
  { id: "defective-return-139-9", label: "Defective Return Notice (139(9))" },
  { id: "inquiry-142-1", label: "Inquiry Before Assessment (142(1))" },
  { id: "scrutiny-143-2", label: "Scrutiny Notice (143(2))" },
  { id: "best-judgment-144", label: "Best Judgment (144)" },
  { id: "reassessment-147-148", label: "Reassessment (147/148)" },
  { id: "reassessment-148a", label: "148A Proceedings (148A(b)/148A(d))" },
  { id: "rectification-154", label: "Rectification Notice (154)" },
  { id: "demand-156", label: "Notice of Demand (156)" },
  { id: "refund-adjustment-245", label: "Refund Adjustment Notice (245)" },
  { id: "tds-default-201", label: "TDS Default (201)" },
  { id: "tcs-default-206c", label: "TCS Default (206C)" },
  { id: "tds-disallowance-40a-ia", label: "TDS Disallowance (40(a)(ia))" },
  { id: "cash-deposit-69-69a", label: "Cash Deposit / Unexplained (69/69A)" },
  { id: "transfer-pricing-92", label: "Transfer Pricing (92/ALP)" },
  { id: "penalty-270a", label: "Penalty Proceedings (270A)" },
  { id: "faceless-appeal-250", label: "Faceless Appeal (250)" },
  { id: "income-tax-general", label: "General Income-tax Response" },
];

const rbiReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "fema-13-delay-reporting", label: "FEMA Section 13 Delay/Contravention" },
  { id: "fema-30-odi-reporting", label: "ODI Reporting (FEMA 120 / Reg 30 context)" },
  { id: "fema-20-fdi-pricing", label: "FDI / Pricing / Valuation (FEMA 20)" },
  { id: "fema-3-ecb-reporting", label: "ECB Reporting (FEMA 3)" },
  { id: "fla-return-delay", label: "FLA Return Delay" },
  { id: "apr-delay", label: "APR Delay" },
  { id: "fc-gpr-delay", label: "FC-GPR Delay" },
  { id: "fc-trs-delay", label: "FC-TRS Delay" },
  { id: "lsf-compounding-advisory", label: "LSF / Compounding Advisory" },
  { id: "kyc-aml-pmla-observation", label: "KYC / AML / PMLA Observation" },
  { id: "payment-aggregator-authorization", label: "Payment Aggregator Authorization" },
  { id: "nbfc-returns-delay", label: "NBFC Return / DNBR Delay" },
  { id: "rbi-general", label: "General RBI / FEMA Reply" },
];

const sebiReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "lodr-30-disclosure-delay", label: "LODR Regulation 30 Disclosure Delay" },
  { id: "lodr-33-financial-results-delay", label: "LODR Regulation 33 Financial Results Delay" },
  { id: "lodr-13-investor-grievance", label: "LODR Regulation 13 Investor Grievance" },
  { id: "lodr-17-governance", label: "LODR Regulation 17 Corporate Governance" },
  { id: "lodr-23-rpt", label: "LODR Regulation 23 Related Party Transactions" },
  { id: "lodr-31-shareholding-pattern", label: "LODR Regulation 31 Shareholding Pattern" },
  { id: "lodr-34-annual-report", label: "LODR Regulation 34 Annual Report" },
  { id: "lodr-44-voting-results", label: "LODR Regulation 44 Voting Results" },
  { id: "lodr-46-website-disclosure", label: "LODR Regulation 46 Website Disclosure" },
  { id: "pit-violation", label: "PIT Regulations Violation" },
  { id: "pit-code-of-conduct", label: "PIT Code of Conduct / UPSI Controls" },
  { id: "sast-disclosure", label: "SAST Disclosure Violation" },
  { id: "pfutp-market-manipulation", label: "PFUTP / Market Manipulation Allegation" },
  { id: "icdr-disclosure-issue", label: "ICDR Disclosure / Issue Document Violation" },
  { id: "ia-research-analyst-compliance", label: "IA / Research Analyst Compliance" },
  { id: "stock-broker-compliance", label: "Stock Broker Compliance" },
  { id: "merchant-banker-compliance", label: "Merchant Banker Compliance" },
  { id: "depository-participant-compliance", label: "Depository Participant Compliance" },
  { id: "rta-compliance", label: "Registrar & Share Transfer Agent Compliance" },
  { id: "credit-rating-agency-compliance", label: "Credit Rating Agency Compliance" },
  { id: "aif-pms-compliance", label: "AIF / PMS Compliance" },
  { id: "mutual-fund-amc-compliance", label: "Mutual Fund / AMC Compliance" },
  { id: "invit-reit-compliance", label: "InvIT / REIT Compliance" },
  { id: "alternative-data-finfluencer-advisory", label: "Finfluencer / Advisory / Unregistered Activity" },
  { id: "icdr-takeover-issue", label: "ICDR / Takeover-related Issue" },
  { id: "mutual-fund-distributor-compliance", label: "Mutual Fund / Distributor Compliance" },
  { id: "sebi-adjudication-ao", label: "SEBI Adjudication Officer Proceedings" },
  { id: "sebi-settlement-proceedings", label: "SEBI Settlement Proceedings" },
  { id: "sebi-summons-investigation", label: "SEBI Summons / Investigation Notice" },
  { id: "sebi-general", label: "General SEBI Compliance" },
];

const customsReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "section-28-demand", label: "Section 28 Demand / Short Levy" },
  { id: "valuation-rule-12", label: "Valuation Dispute (Rule 12)" },
  { id: "classification-cth", label: "Classification / CTH Dispute" },
  { id: "exemption-denial", label: "Exemption Notification Denial" },
  { id: "svb-valuation", label: "SVB / Related Party Valuation" },
  { id: "anti-dumping-cvd-safeguard", label: "Anti-dumping / CVD / Safeguard Duty" },
  { id: "drawback-rodtep-recovery", label: "Drawback / RoDTEP Recovery" },
  { id: "eou-epcg-noncompliance", label: "EOU / EPCG Non-compliance" },
  { id: "misdeclaration-111-112", label: "Misdeclaration (111/112)" },
  { id: "confiscation-redemption-125", label: "Confiscation / Redemption Fine (125)" },
  { id: "smuggling-123", label: "Smuggling (Section 123)" },
  { id: "baggage-courier", label: "Baggage / Courier Notice" },
  { id: "origin-fta-misuse", label: "COO / FTA Misuse" },
  { id: "provisional-assessment-18", label: "Provisional Assessment (18)" },
  { id: "refund-rebate-27", label: "Refund / Rebate (27)" },
  { id: "interest-penalty-only", label: "Interest / Penalty-only Demand" },
  { id: "seizure-detention-110", label: "Seizure / Detention (110)" },
  { id: "customs-audit-caap", label: "Customs Audit / Post-Clearance Audit" },
  { id: "driu-investigation", label: "DRI / Investigation Proceedings" },
  { id: "customs-general", label: "General Customs Response" },
];

const contractReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from contract context" },
  { id: "msa-general", label: "MSA / SOW Review" },
  { id: "nda-confidentiality", label: "NDA / Confidentiality" },
  { id: "saas-license", label: "SaaS / License Terms" },
  { id: "employment-consultancy", label: "Employment / Consultancy Agreement" },
  { id: "vendor-procurement", label: "Vendor / Procurement Contract" },
  { id: "ip-assignment-licensing", label: "IP Assignment / Licensing" },
  { id: "loan-financing", label: "Loan / Financing Documents" },
  { id: "shareholders-jv", label: "SHA / JV Arrangement" },
  { id: "lease-rent", label: "Lease / Rent Agreement" },
  { id: "franchise-distribution", label: "Franchise / Distribution Agreement" },
  { id: "data-processing-dpa", label: "DPA / Data Processing" },
  { id: "privacy-cybersecurity", label: "Privacy / Cybersecurity Clauses" },
  { id: "indemnity-liability-cap", label: "Indemnity / Liability Cap" },
  { id: "termination-exit", label: "Termination / Exit Terms" },
  { id: "non-compete-non-solicit", label: "Non-compete / Non-solicit" },
  { id: "arbitration-dispute-resolution", label: "Arbitration / Dispute Resolution" },
  { id: "settlement-release", label: "Settlement / Release Deed" },
  { id: "regulatory-compliance-sanctions", label: "Compliance / Anti-bribery / Sanctions" },
  { id: "cross-border-tax-fx", label: "Cross-border Tax / FX Clauses" },
  { id: "contract-general", label: "General Contract Review" },
];

const customReplyTypeOptions = [
  { id: "auto", label: "Auto-detect from notice" },
  { id: "regulatory-scn-reply", label: "Regulatory SCN Reply" },
  { id: "adjudication-order-appeal", label: "Adjudication Order / Appeal" },
  { id: "license-registration-compliance", label: "License / Registration Compliance" },
  { id: "late-filing-delay-condonation", label: "Late Filing / Delay Condonation" },
  { id: "tax-demand-computation", label: "Tax / Demand Computation Dispute" },
  { id: "penalty-interest-mitigation", label: "Penalty / Interest Mitigation" },
  { id: "refund-rejection-recovery", label: "Refund Rejection / Recovery" },
  { id: "show-cause-natural-justice", label: "Show Cause / Natural Justice" },
  { id: "investigation-summons-response", label: "Investigation / Summons Response" },
  { id: "inspection-audit-objection", label: "Inspection / Audit Objection" },
  { id: "classification-valuation-dispute", label: "Classification / Valuation Dispute" },
  { id: "input-credit-deduction-dispute", label: "Input Credit / Deduction Dispute" },
  { id: "procedural-noncompliance", label: "Procedural Non-compliance" },
  { id: "documentation-evidence-deficiency", label: "Documentation / Evidence Deficiency" },
  { id: "jurisdiction-limitation-objection", label: "Jurisdiction / Limitation Objection" },
  { id: "rectification-revision", label: "Rectification / Revision" },
  { id: "appeal-stay-interim-relief", label: "Appeal / Stay / Interim Relief" },
  { id: "cross-border-forex-trade", label: "Cross-border / Forex / Trade" },
  { id: "industry-specific-compliance", label: "Industry-specific Compliance" },
  { id: "custom-general", label: "General Custom Regulatory Reply" },
];

const inferMcaReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/\bsection\s*92\b|\bsection\s*137\b|\bmgt-?7\b|\baoc-?4\b/.test(corpus)) return "annual-filing-92-137";
  if (/\bsection\s*10a\b|\binc-?20a\b|commencement of business/i.test(corpus)) return "commencement-10a";
  if (/\bsection\s*12\b|\binc-?22\b|registered office/i.test(corpus)) return "registered-office-12";
  if (/\bsection\s*96\b|annual general meeting|\bagm\b/i.test(corpus)) return "agm-96";
  if (/\bsection\s*117\b|\bmgt-?14\b|\bboard resolution\b/.test(corpus)) return "board-reporting-117";
  if (/\bsection\s*139\b|\bsection\s*140\b|\badt-?1\b|\badt-?2\b|auditor appointment|auditor removal/i.test(corpus)) return "auditor-139-140";
  if (/\bsection\s*152\b|\bsection\s*170\b|\bdir-?12\b|director appointment|register of directors/i.test(corpus)) return "director-appointment-152-170";
  if (/dir-?3 kyc|section\s*164|section\s*167|director kyc|disqualification/i.test(corpus)) return "director-kyc";
  if (/\bsection\s*77\b|\bsection\s*78\b|\bsection\s*79\b|\bchg-?1\b|\bcharge\b/.test(corpus)) return "charge-77-79";
  if (/\bsection\s*39\b|\bsection\s*42\b|\bpas-?3\b|allotment|private placement/i.test(corpus)) return "allotment-39-42";
  if (/\bsection\s*88\b|\bmgt-?1\b|register of members|register maintenance/i.test(corpus)) return "registers-88";
  if (/\bsection\s*90\b|\bben-?2\b|\bbeneficial owner\b|\bsbo\b/.test(corpus)) return "beneficial-ownership-90";
  if (/\bsection\s*173\b|\bboard meeting\b|\bminutes\b/.test(corpus)) return "board-governance-173";
  if (/\bsection\s*134\b|\bboard'?s report\b/.test(corpus)) return "board-report-134";
  if (/\bsection\s*135\b|\bcsr\b|corporate social responsibility/i.test(corpus)) return "csr-135";
  if (/\bsection\s*188\b|\brelated party\b|\baoc-?2\b/.test(corpus)) return "related-party-188";
  if (/\bsection\s*185\b|\bsection\s*186\b|loan to director|inter-corporate loan|guarantee|investment limit/i.test(corpus)) return "loans-investments-185-186";
  if (/\bsection\s*203\b|\bkmp\b|company secretary|managing director|whole-time director/.test(corpus)) return "managerial-kmp-203";
  if (/\bsection\s*73\b|\bsection\s*74\b|\bsection\s*76\b|\bdeposit\b/.test(corpus)) return "deposits-73-76";
  return "general-mca";
};

const inferGstReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/\bdrc-?01\b|show cause notice|form gst drc-?01/i.test(corpus)) return "drc-01-scn-73-74";
  if (/\bdrc-?01a\b|pre[-\s]*scn|intimation before show cause/i.test(corpus)) return "drc-01a-pre-scn";
  if (/\basmt-?10\b|discrepancy notice/i.test(corpus)) return "asmt-10-discrepancy";
  if (/\bitc\b|\bgstr-?2b\b|\bgstr-?3b\b|\bsection\s*16\b/.test(corpus)) return "itc-mismatch";
  if (/\bsection\s*73\b/.test(corpus)) return "section-73-short-payment";
  if (/\bsection\s*74\b|fraud|suppression|wilful/i.test(corpus)) return "section-74-fraud-allegation";
  if (/\breg-?17\b|show cause.*cancellation of registration/i.test(corpus)) return "reg-17-cancellation-scn";
  if (/\bsection\s*29\b|registration cancellation|cancel registration/i.test(corpus)) return "registration-cancellation-29";
  if (/\breg-?23\b|reply for revocation|reply to cancellation notice/i.test(corpus)) return "reg-23-cancellation-reply";
  if (/\bsection\s*30\b|revocation of cancellation|revocation application/i.test(corpus)) return "revocation-30";
  if (/\brcm\b|reverse charge|section\s*9\(3\)|section\s*9\(4\)/i.test(corpus)) return "rcm-dispute";
  if (/\bsection\s*129\b|\bsection\s*130\b|detention|seizure|confiscation/i.test(corpus)) return "detention-seizure-129-130";
  if (/\be-?way bill\b|\bsection\s*122\b|\bsection\s*125\b|mov-0?\d+/i.test(corpus)) return "e-way-bill-122-125";
  if (/\bdrc-?07\b|summary of order|demand order/i.test(corpus)) return "drc-07-demand-order";
  if (/\brefund rejection\b|rfd-?06|rfd-?08|deficiency memo/i.test(corpus)) return "refund-rejection-54";
  if (/\brefund\b|wrong refund|section\s*54/i.test(corpus)) return "refund-recovery";
  if (/\breconciliation\b|mismatch|2a|2b|3b/i.test(corpus)) return "gstr-reconciliation";
  if (/\bgstr-?9\b|\bgstr-?9c\b|section\s*44|rule\s*80|annual return/i.test(corpus)) return "annual-return-44-80";
  if (/\bsection\s*51\b|\bsection\s*52\b|tds|tcs credit|gstr-?7|gstr-?8/i.test(corpus)) return "tds-tcs-51-52";
  if (/\bclassification\b|hsn|valuation|section\s*15/i.test(corpus)) return "classification-valuation";
  if (/\bplace of supply\b|igst|cgst|sgst/i.test(corpus)) return "place-of-supply";
  if (/\bsection\s*171\b|anti[-\s]*profiteering/i.test(corpus)) return "anti-profiteering-171";
  if (/\bsection\s*140\b|transitional credit|tran-?1|tran-?2/i.test(corpus)) return "transitional-credit-140";
  if (/\binterest\b|\bpenalty\b|\bsection\s*50\b/.test(corpus)) return "interest-penalty-only";
  return "gst-general";
};

const inferIncomeTaxReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/\b143\(?1\)?\b|intimation|summary assessment/i.test(corpus)) return "intimation-143-1";
  if (/\b139\(?9\)?\b|defective return/i.test(corpus)) return "defective-return-139-9";
  if (/\b142\(?1\)?\b|inquiry before assessment|details called for/i.test(corpus)) return "inquiry-142-1";
  if (/\b143\(?2\)?\b|scrutiny|questionnaire|notice u\/s 143/i.test(corpus)) return "scrutiny-143-2";
  if (/\b144\b|best judgment/i.test(corpus)) return "best-judgment-144";
  if (/\b147\b|\b148\b|reassessment|income escaping/i.test(corpus)) return "reassessment-147-148";
  if (/\b148a\b|\b148a\(?b\)?\b|\b148a\(?d\)?\b|show cause before issue of notice under 148/i.test(corpus)) return "reassessment-148a";
  if (/\b154\b|rectification/i.test(corpus)) return "rectification-154";
  if (/\b156\b|notice of demand|demand notice/i.test(corpus)) return "demand-156";
  if (/\b245\b|refund adjustment|set off refund/i.test(corpus)) return "refund-adjustment-245";
  if (/\b201\b|tds default|assessee in default/i.test(corpus)) return "tds-default-201";
  if (/\b206c\b|tcs default|collector in default/i.test(corpus)) return "tcs-default-206c";
  if (/\b40\(a\)\(ia\)\b|40aia|tds disallowance/i.test(corpus)) return "tds-disallowance-40a-ia";
  if (/\b69\b|\b69a\b|unexplained cash|cash deposit/i.test(corpus)) return "cash-deposit-69-69a";
  if (/\b92\b|transfer pricing|alp|arm'?s length/i.test(corpus)) return "transfer-pricing-92";
  if (/\b270a\b|under-reporting|misreporting|penalty proceeding/i.test(corpus)) return "penalty-270a";
  if (/\b250\b|faceless appeal|cita|appeal proceeding/i.test(corpus)) return "faceless-appeal-250";
  return "income-tax-general";
};

const inferRbiReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/\bfema\b[^.\n]{0,80}\bsection\s*13\b|section\s*13\b[^.\n]{0,80}\bfema\b|contravention.*fema|delay in reporting/i.test(corpus)) return "fema-13-delay-reporting";
  if (/\bodi\b|overseas direct investment|fema\s*120|schedule\s*i|form odi/i.test(corpus)) return "fema-30-odi-reporting";
  if (/\bfdi\b|fc-gpr|pricing guidelines|valuation certificate|fema\s*20/i.test(corpus)) return "fema-20-fdi-pricing";
  if (/\becb\b|external commercial borrowing|form ecb|fema\s*3/i.test(corpus)) return "fema-3-ecb-reporting";
  if (/\bfla\b|foreign liabilities and assets|fla return/i.test(corpus)) return "fla-return-delay";
  if (/\bapr\b|annual performance report/i.test(corpus)) return "apr-delay";
  if (/\bfc-?gpr\b|foreign currency-gpr|gpr filing/i.test(corpus)) return "fc-gpr-delay";
  if (/\bfc-?trs\b|share transfer.*non[-\s]*resident|trs filing/i.test(corpus)) return "fc-trs-delay";
  if (/\blsf\b|late submission fee|compounding advisory|compounding proceedings/i.test(corpus)) return "lsf-compounding-advisory";
  if (/\bkyc\b|\baml\b|\bpmla\b|suspicious transaction|cdd|due diligence/i.test(corpus)) return "kyc-aml-pmla-observation";
  if (/\bpayment aggregator\b|\bpa[-\s]*pg\b|authorization|rbi digital payments/i.test(corpus)) return "payment-aggregator-authorization";
  if (/\bnbfc\b|dnbr|nbs[-\s]*\d+|prudential return|xbrl return/i.test(corpus)) return "nbfc-returns-delay";
  return "rbi-general";
};

const inferSebiReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/\bregulation\s*30\b|\blodr\b|material event|disclosure delay/i.test(corpus)) return "lodr-30-disclosure-delay";
  if (/\bregulation\s*33\b|\bfinancial results\b|quarterly results|q[1-4]/i.test(corpus)) return "lodr-33-financial-results-delay";
  if (/\bregulation\s*13\b|investor grievance|scores|complaint redressal/i.test(corpus)) return "lodr-13-investor-grievance";
  if (/\bregulation\s*17\b|corporate governance|independent director|board composition/i.test(corpus)) return "lodr-17-governance";
  if (/\bregulation\s*23\b|related party transaction|rpt/i.test(corpus)) return "lodr-23-rpt";
  if (/\bregulation\s*31\b|shareholding pattern|promoter holding/i.test(corpus)) return "lodr-31-shareholding-pattern";
  if (/\bregulation\s*34\b|annual report|business responsibility report|integrated report/i.test(corpus)) return "lodr-34-annual-report";
  if (/\bregulation\s*44\b|voting results|e-voting/i.test(corpus)) return "lodr-44-voting-results";
  if (/\bregulation\s*46\b|website disclosure|website compliance/i.test(corpus)) return "lodr-46-website-disclosure";
  if (/\bpit\b|insider trading|unpublished price sensitive information|upsi/i.test(corpus)) return "pit-violation";
  if (/code of conduct|trading window closure|structured digital database|sdd/i.test(corpus)) return "pit-code-of-conduct";
  if (/\bsast\b|substantial acquisition|takeover disclosure|regulation\s*29/i.test(corpus)) return "sast-disclosure";
  if (/\bpfutp\b|fraudulent and unfair trade|market manipulation|front running|circular trading/i.test(corpus)) return "pfutp-market-manipulation";
  if (/\bicdr\b|issue document|prospectus|red herring|drhp|rhp/i.test(corpus)) return "icdr-disclosure-issue";
  if (/\binvestment adviser\b|\bresearch analyst\b|\bia regulations\b|\bra regulations\b/i.test(corpus)) return "ia-research-analyst-compliance";
  if (/\bstock broker\b|broker regulations|client funds|margin reporting/i.test(corpus)) return "stock-broker-compliance";
  if (/\bmerchant banker\b|mb regulations|due diligence certificate/i.test(corpus)) return "merchant-banker-compliance";
  if (/\bdepository participant\b|\bdp regulations\b|demat account/i.test(corpus)) return "depository-participant-compliance";
  if (/\bregistrar and share transfer|rta regulations|share transfer agent/i.test(corpus)) return "rta-compliance";
  if (/\bcredit rating agency\b|\bcra regulations\b|rating rationale/i.test(corpus)) return "credit-rating-agency-compliance";
  if (/\baif\b|\bpms\b|portfolio management|alternative investment fund/i.test(corpus)) return "aif-pms-compliance";
  if (/\bmutual fund\b|\bamc\b|scheme information document|sid|key information memorandum|kim/i.test(corpus)) return "mutual-fund-amc-compliance";
  if (/\binvit\b|\breit\b|infrastructure investment trust|real estate investment trust/i.test(corpus)) return "invit-reit-compliance";
  if (/finfluencer|unregistered adviser|unregistered analyst|digital advisory/i.test(corpus)) return "alternative-data-finfluencer-advisory";
  if (/\bicdr\b|issue of capital|preferential issue|rights issue|takeover/i.test(corpus)) return "icdr-takeover-issue";
  if (/\bmutual fund\b|distributor|arn|commission disclosure/i.test(corpus)) return "mutual-fund-distributor-compliance";
  if (/adjudicating officer|ao proceedings|show cause under section 15/i.test(corpus)) return "sebi-adjudication-ao";
  if (/settlement regulations|settlement application|chapter v/i.test(corpus)) return "sebi-settlement-proceedings";
  if (/summons|investigation|section 11c|appearance before investigating authority/i.test(corpus)) return "sebi-summons-investigation";
  return "sebi-general";
};

const inferCustomsReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/\bsection\s*28\b|differential duty|short levy|not levied/i.test(corpus)) return "section-28-demand";
  if (/rule\s*12|customs valuation rules|transaction value rejection|valuation dispute/i.test(corpus)) return "valuation-rule-12";
  if (/classification|cth|hsn|tariff heading/i.test(corpus)) return "classification-cth";
  if (/exemption notification|benefit denied|notification no/i.test(corpus)) return "exemption-denial";
  if (/\bsvb\b|related party import|special valuation branch/i.test(corpus)) return "svb-valuation";
  if (/anti[-\s]*dumping|countervailing duty|safeguard duty|trade remedy/i.test(corpus)) return "anti-dumping-cvd-safeguard";
  if (/drawback|rodtep|rosctl|export incentive recovery/i.test(corpus)) return "drawback-rodtep-recovery";
  if (/\beou\b|\bepcg\b|advance authori[sz]ation|export obligation/i.test(corpus)) return "eou-epcg-noncompliance";
  if (/\bsection\s*111\b|\bsection\s*112\b|misdeclaration/i.test(corpus)) return "misdeclaration-111-112";
  if (/\bsection\s*125\b|redemption fine|confiscation/i.test(corpus)) return "confiscation-redemption-125";
  if (/\bsection\s*123\b|smuggling/i.test(corpus)) return "smuggling-123";
  if (/baggage|courier import|courier regulations/i.test(corpus)) return "baggage-courier";
  if (/certificate of origin|fta|preferential duty|origin criteria/i.test(corpus)) return "origin-fta-misuse";
  if (/\bsection\s*18\b|provisional assessment/i.test(corpus)) return "provisional-assessment-18";
  if (/\bsection\s*27\b|refund claim|rebate claim/i.test(corpus)) return "refund-rebate-27";
  if (/interest|penalty only|section\s*28aa|section\s*114a/i.test(corpus)) return "interest-penalty-only";
  if (/\bsection\s*110\b|seizure|detention/i.test(corpus)) return "seizure-detention-110";
  if (/audit|post clearance audit|caap/i.test(corpus)) return "customs-audit-caap";
  if (/\bdri\b|directorate of revenue intelligence|investigation summons/i.test(corpus)) return "driu-investigation";
  return "customs-general";
};

const inferContractReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/master services agreement|msa|statement of work|sow/i.test(corpus)) return "msa-general";
  if (/nda|non-disclosure|confidential information|confidentiality/i.test(corpus)) return "nda-confidentiality";
  if (/saas|software license|subscription service|uptime|sla/i.test(corpus)) return "saas-license";
  if (/employment agreement|consultancy agreement|service provider|retainer/i.test(corpus)) return "employment-consultancy";
  if (/vendor agreement|purchase order|procurement|supply agreement/i.test(corpus)) return "vendor-procurement";
  if (/intellectual property|ip assignment|license grant|ownership of work product/i.test(corpus)) return "ip-assignment-licensing";
  if (/loan agreement|facility agreement|interest covenant|security creation/i.test(corpus)) return "loan-financing";
  if (/shareholders agreement|sha|joint venture|jv/i.test(corpus)) return "shareholders-jv";
  if (/lease deed|rent agreement|lock-in|security deposit/i.test(corpus)) return "lease-rent";
  if (/franchise|distribution agreement|territory rights|minimum purchase/i.test(corpus)) return "franchise-distribution";
  if (/data processing agreement|dpa|processor|controller|sub-processor/i.test(corpus)) return "data-processing-dpa";
  if (/privacy policy|data breach|cybersecurity|information security/i.test(corpus)) return "privacy-cybersecurity";
  if (/indemnity|limitation of liability|cap on liability|consequential damages/i.test(corpus)) return "indemnity-liability-cap";
  if (/termination|exit|survival|transition assistance/i.test(corpus)) return "termination-exit";
  if (/non-compete|non solicitation|restrictive covenant/i.test(corpus)) return "non-compete-non-solicit";
  if (/arbitration|dispute resolution|governing law|jurisdiction/i.test(corpus)) return "arbitration-dispute-resolution";
  if (/settlement agreement|release and discharge|full and final settlement/i.test(corpus)) return "settlement-release";
  if (/anti-bribery|sanctions|fcp[a]?|ukba|compliance representation/i.test(corpus)) return "regulatory-compliance-sanctions";
  if (/withholding tax|transfer pricing|forex|exchange control|cross-border/i.test(corpus)) return "cross-border-tax-fx";
  return "contract-general";
};

const inferCustomReplyTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();
  if (/show cause notice|scn|reply to notice|pre-adjudication/i.test(corpus)) return "regulatory-scn-reply";
  if (/adjudication order|order-in-original|appeal memo|appellate authority/i.test(corpus)) return "adjudication-order-appeal";
  if (/license|registration|authorization|renewal|suspension/i.test(corpus)) return "license-registration-compliance";
  if (/delay condonation|late filing|condonation of delay/i.test(corpus)) return "late-filing-delay-condonation";
  if (/demand|computation|short payment|short levy|quantification/i.test(corpus)) return "tax-demand-computation";
  if (/penalty|interest|mitigation|leniency|proportionality/i.test(corpus)) return "penalty-interest-mitigation";
  if (/refund|recovery|rejection|withheld refund/i.test(corpus)) return "refund-rejection-recovery";
  if (/natural justice|hearing|opportunity of being heard|procedural fairness/i.test(corpus)) return "show-cause-natural-justice";
  if (/summons|statement|investigation|inquiry|enforcement/i.test(corpus)) return "investigation-summons-response";
  if (/inspection|audit|observation|audit memo|non-conformance/i.test(corpus)) return "inspection-audit-objection";
  if (/classification|valuation|rate dispute|tariff/i.test(corpus)) return "classification-valuation-dispute";
  if (/credit|deduction|set-off|input credit/i.test(corpus)) return "input-credit-deduction-dispute";
  if (/procedural lapse|procedural non[-\s]*compliance|filing defect/i.test(corpus)) return "procedural-noncompliance";
  if (/documentary deficiency|evidence deficiency|supporting documents/i.test(corpus)) return "documentation-evidence-deficiency";
  if (/jurisdiction|limitation|time barred|barred by limitation/i.test(corpus)) return "jurisdiction-limitation-objection";
  if (/rectification|revision|correction/i.test(corpus)) return "rectification-revision";
  if (/stay|interim relief|status quo|appeal and stay/i.test(corpus)) return "appeal-stay-interim-relief";
  if (/cross[-\s]*border|forex|exchange control|trade compliance|fema/i.test(corpus)) return "cross-border-forex-trade";
  if (/industry specific|sectoral guideline|domain regulation/i.test(corpus)) return "industry-specific-compliance";
  return "custom-general";
};

const inferDocumentTypeFromNotice = (noticeText: string): string => {
  const corpus = (noticeText || "").toLowerCase();

  if (/gst|cgst|sgst|igst|drc-?01|asmt-?10|gstr-?3b|gstr-?2b|itc|e-?way bill/i.test(corpus)) {
    return "gst-show-cause";
  }
  if (/income[-\s]*tax|assessee|assessment year|ay\s*\d{4}-\d{2}|section\s*143|section\s*142|section\s*148|itr/i.test(corpus)) {
    return "income-tax-response";
  }
  if (/sebi|lodr|pit regulations|sast|pfutp|adjudicating officer/i.test(corpus)) {
    return "sebi-compliance";
  }
  if (/rbi|fema|fc-?gpr|fc-?trs|fla return|nbfc|payment aggregator/i.test(corpus)) {
    return "rbi-filing";
  }
  if (/customs|bill of entry|boe|section\s*28\b|dri|cth|tariff heading/i.test(corpus)) {
    return "customs-response";
  }
  if (/agreement|contract|clause|indemnity|termination|arbitration|governing law/i.test(corpus)) {
    return "contract-review";
  }
  if (/companies act|mca|roc|adjudication notice|section\s*92|section\s*137|aoc-?4|mgt-?7|director kyc/i.test(corpus)) {
    return "mca-notice";
  }

  return "custom-draft";
};

const extractNoticeDateFromText = (noticeText: string): string => {
  const source = noticeText || "";
  const match =
    source.match(/dated\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i) ||
    source.match(/dated\s+([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i);
  return match?.[1] || "15 January 2026";
};

const sanitizeNoticeDetailsClient = (raw: string, fallback: string) => {
  let text = (raw || "").trim();
  if (!text) return fallback;

  const looksLikeReply = /before the registrar|adjudicating officer|most respectfully|prayer|for and on behalf|authorized signatory|annexure|reply to the adjudication notice|showeth/i.test(text);
  if (looksLikeReply) {
    text = text
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^.*?(Subject:|SUBJECT:)/is, "Subject:")
      .replace(/###?\s*PRAYER[\s\S]*/i, "")
      .replace(/For and on behalf[\s\S]*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const disallowedReplySignals = /(most respectfully|prayer|for and on behalf|authorized signatory|annexure-|list of annexures|without prejudice)/i;
  const hasIntakeCore = /(notice\s*(no|number|reference|ref\.?)|din|rfn|dated|section\s*\d+|rule\s*\d+|proposed penalty|alleging|financial year|fy)/i.test(text);
  if (disallowedReplySignals.test(text) || !hasIntakeCore) return fallback;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 120) return fallback;
  return text;
};

const normalizeForComparison = (value: string) =>
  (value || "").replace(/\s+/g, " ").trim().toLowerCase();

type TemplatePackId = string;
type TemplatePackDefinition = {
  id: TemplatePackId;
  label: string;
  description: string;
  instructions: string;
};

const AUTO_TEMPLATE_PACK: TemplatePackDefinition = {
  id: "auto",
  label: "Auto (By Class)",
  description: "Automatically selects the best class-specific template baseline.",
  instructions: "Use class-specific baseline with mandatory drafting anchors for the selected notice class.",
};

const UNIVERSAL_TEMPLATE_PACKS: TemplatePackDefinition[] = [
  { id: "class-core", label: "Class Core", description: "Default class baseline", instructions: "Use a neutral class-specific structure with complete mandatory blocks." },
  { id: "facts-heavy", label: "Facts-Heavy", description: "Detailed factual narrative", instructions: "Prioritize chronology, factual record, and documentary sequence before law blocks." },
  { id: "timeline-first", label: "Timeline First", description: "Due vs actual driven", instructions: "Lead with due/event vs actual action timeline and date-anchored compliance matrix." },
  { id: "evidence-led", label: "Evidence-Led", description: "Annexure-first rebuttal", instructions: "Map each rebuttal point to explicit annexure/document anchors and proof trail." },
  { id: "computation-first", label: "Computation First", description: "Amount reconciliation focus", instructions: "Include accepted vs disputed amount analysis and recomputation logic early." },
  { id: "procedural-objection", label: "Procedural Objection", description: "Procedure and natural justice focus", instructions: "Emphasize service defects, limitation, hearing rights, and procedural fairness where factually available." },
  { id: "leniency-focused", label: "Leniency Focus", description: "Mitigation-first structure", instructions: "Prioritize mitigation factors, bona fide conduct, and proportional penalty submissions." },
  { id: "hearing-focused", label: "Hearing Focus", description: "Oral hearing prep style", instructions: "Structure draft for hearing with concise issue matrix and hearing ask in every relief block." },
  { id: "conservative", label: "Conservative", description: "Lowest risk language", instructions: "Use compliance-first, low-risk language and avoid aggressive legal claims." },
  { id: "balanced", label: "Balanced", description: "Standard professional tone", instructions: "Use standard adjudication-ready structure with proportionate legal challenge." },
  { id: "assertive", label: "Assertive", description: "Strong but defensible", instructions: "Use assertive but legally defensible language with burden-of-proof challenge." },
];

const DOCUMENT_TEMPLATE_PACKS: Record<string, TemplatePackDefinition[]> = {
  "mca-notice": [
    { id: "mca-454-proviso", label: "Section 454 Proviso", description: "454 proviso anchored", instructions: "Add clear 454 proviso paragraph with date-anchored rectification eligibility." },
    { id: "mca-chronology-srn", label: "Chronology + SRN", description: "Filing chronology focus", instructions: "Mandatory chronology table with due vs actual date and SRN/challan details." },
    { id: "mca-officer-defense", label: "Officer Defense", description: "Officer-wise role matrix", instructions: "Include officer-specific role period, allegation, and mitigating facts table." },
    { id: "mca-446b-eligibility", label: "Section 446B", description: "Lesser penalty eligibility", instructions: "Use 446B block only with factual qualification support and date-linked eligibility." },
    { id: "mca-board-governance", label: "Governance Matrix", description: "Board/compliance controls", instructions: "Highlight governance controls, compliance calendar, and recurrence-prevention actions." },
  ],
  "gst-show-cause": [
    { id: "gst-drc-matrix", label: "DRC Matrix", description: "DRC allegation matrix", instructions: "Create allegation-wise matrix mapped to DRC issues and statutory hooks." },
    { id: "gst-itc-reconciliation", label: "ITC Reconciliation", description: "ITC mismatch focus", instructions: "Lead with invoice-level ITC reconciliation and GSTR-2B/3B tie-out." },
    { id: "gst-computation-challenge", label: "Demand Computation", description: "Tax/interest/penalty split", instructions: "Add accepted vs disputed tax, interest and penalty computation challenge table." },
    { id: "gst-natural-justice", label: "Natural Justice", description: "Procedural fairness angle", instructions: "Emphasize hearing opportunity and evidence confrontation before demand confirmation." },
    { id: "gst-registration-defense", label: "Registration Defense", description: "REG-17/23 type focus", instructions: "Use registration cancellation/revocation specific defense flow with operational continuity facts." },
  ],
  "income-tax-response": [
    { id: "it-addition-matrix", label: "Addition Matrix", description: "Issue-wise addition rebuttal", instructions: "Use issue/addition-wise matrix: AO position vs assessee rebuttal with evidence." },
    { id: "it-books-reconciliation", label: "Books Reconciliation", description: "Books and ledger focus", instructions: "Prioritize books, ledger, AIS/TIS/26AS reconciliation before legal submissions." },
    { id: "it-penalty-defense", label: "Penalty Defense", description: "270A and mens rea angle", instructions: "Use penalty-defense template with under-reporting/misreporting challenge and bona fide position." },
    { id: "it-reassessment-defense", label: "Reassessment Defense", description: "147/148/148A flow", instructions: "Structure around jurisdiction, reasons, and reopening threshold challenge." },
  ],
  "rbi-filing": [
    { id: "rbi-fema-contravention", label: "FEMA Contravention", description: "Contravention regularization focus", instructions: "Map allegations to FEMA provisions and corrective reporting actions." },
    { id: "rbi-reporting-delay", label: "Reporting Delay", description: "Delay condonation flow", instructions: "Use delay-cause, corrective filing, and LSF/compounding mitigation structure." },
    { id: "rbi-authorization-controls", label: "Control Framework", description: "Compliance controls focus", instructions: "Highlight internal controls, maker-checker, and compliance monitoring mechanisms." },
  ],
  "sebi-compliance": [
    { id: "sebi-lodr-disclosure", label: "LODR Disclosure", description: "Disclosure timeline defense", instructions: "Focus on disclosure timeline, materiality assessment, and exchange filing records." },
    { id: "sebi-pit-upsi", label: "PIT/UPSI Controls", description: "Insider controls framework", instructions: "Emphasize code of conduct, UPSI controls, and structured digital database evidence." },
    { id: "sebi-allegation-matrix", label: "Allegation Matrix", description: "Regulation-wise rebuttal", instructions: "Create allegation-wise matrix with regulation hook and documentary proof mapping." },
    { id: "sebi-settlement-style", label: "Settlement Style", description: "Mitigated adjudication posture", instructions: "Use calibrated mitigation and compliance-remediation posture for adjudication/settlement style responses." },
  ],
  "customs-response": [
    { id: "customs-classification", label: "Classification Defense", description: "CTH/HSN dispute focus", instructions: "Center draft on classification rationale, technical notes, and tariff interpretation." },
    { id: "customs-valuation", label: "Valuation Defense", description: "Valuation rejection challenge", instructions: "Use transaction value defense with valuation-rule anchored submissions." },
    { id: "customs-demand-recompute", label: "Demand Recompute", description: "Duty/interest/fine split", instructions: "Add duty-interest-penalty-redemption fine recomputation challenge table." },
    { id: "customs-seizure-procedure", label: "Seizure Procedure", description: "110/111/112 procedural focus", instructions: "Focus on seizure/confiscation procedural compliance and evidentiary thresholds." },
  ],
  "contract-review": [
    { id: "contract-clause-risk", label: "Clause Risk Matrix", description: "Clause-wise risk review", instructions: "Structure as clause-wise risk matrix with recommended replacement language." },
    { id: "contract-redline-heavy", label: "Redline Heavy", description: "Drafting replacement focus", instructions: "Provide strong redline-ready replacement language for all high-risk clauses." },
    { id: "contract-commercial-balance", label: "Commercial Balance", description: "Legal + business tradeoff", instructions: "Balance legal risk with commercial feasibility and negotiation fallbacks." },
    { id: "contract-dispute-ready", label: "Dispute Ready", description: "Enforceability and dispute posture", instructions: "Prioritize enforceability, jurisdiction, arbitration, and breach-remedy clauses." },
  ],
  "custom-draft": [
    { id: "custom-general-matrix", label: "General Matrix", description: "Issue-wise matrix baseline", instructions: "Use issue-wise matrix with statutory anchors and evidence mapping." },
    { id: "custom-provision-heavy", label: "Provision Heavy", description: "Law-first template", instructions: "Prioritize section/rule/regulation mapping and legal threshold analysis." },
    { id: "custom-remediation", label: "Remediation Focus", description: "Corrective action heavy", instructions: "Lead with corrective actions, compliance remediation, and prevention controls." },
  ],
};

const getReplyTypeOptionsByDocumentType = (documentType: string) => {
  if (documentType === "mca-notice") return mcaReplyTypeOptions;
  if (documentType === "gst-show-cause") return gstReplyTypeOptions;
  if (documentType === "income-tax-response") return incomeTaxReplyTypeOptions;
  if (documentType === "rbi-filing") return rbiReplyTypeOptions;
  if (documentType === "sebi-compliance") return sebiReplyTypeOptions;
  if (documentType === "customs-response") return customsReplyTypeOptions;
  if (documentType === "contract-review") return contractReplyTypeOptions;
  if (documentType === "custom-draft") return customReplyTypeOptions;
  return [];
};

const buildClassAwareTemplate = ({
  documentType,
  documentLabel,
  classId,
  classLabel,
  pack,
}: {
  documentType: string;
  documentLabel: string;
  classId: string;
  classLabel: string;
  pack: TemplatePackDefinition;
}) => {
  return `Notice/Order intake template for ${documentLabel}. Auto class: ${classLabel} (${classId}).
Reference fields to fill: Notice No./Reference, DIN/RFN, notice date, issuing authority, period under dispute, proposed demand/penalty, invoked provisions, and response due date.
Drafting scope required: allegation-wise rebuttal, section/rule/regulation anchors, chronology with due/event date vs actual action date, computation challenge where amount is involved, officer-specific defense where relevant, annexure mapping, and calibrated prayer language (drop/reduce, not waive/absolve).
Template pack selected: ${pack.label} - ${pack.description}
Template directive: ${pack.instructions}
Facts block to include: factual background, chronology, specific allegations from notice, noticee position, and documentary anchors.
Evidence block to include: filing acknowledgements/SRN/challan (if filing case), returns/invoices/reconciliation (if tax), governance/control records (if regulatory), or clause-wise evidence matrix (if contract review).
Prayer block to include: drop/reduce unsustainable demand or penalty, hearing opportunity request, and such further orders as deemed fit.
Mandatory placeholders allowed only as [To be filled by CA/Lawyer] for missing factual data.
This template is generated for ${documentType} :: ${classId} to keep downstream AI drafting class-specific and filing-ready.`;
};

const getTemplatePackOptionsBySelection = (
  documentType: string,
  classId: string,
): TemplatePackDefinition[] => {
  const pools = [
    AUTO_TEMPLATE_PACK,
    ...UNIVERSAL_TEMPLATE_PACKS,
    ...(DOCUMENT_TEMPLATE_PACKS[documentType] || []),
  ];

  const classLower = (classId || "").toLowerCase();
  const filtered = pools.filter((pack) => {
    if (pack.id === "auto") return true;
    if (documentType === "mca-notice" && classLower.includes("annual")) {
      return !["mca-board-governance"].includes(pack.id);
    }
    if (documentType === "gst-show-cause" && /(itc|reconciliation|drc)/.test(classLower)) {
      return !["gst-registration-defense"].includes(pack.id);
    }
    return true;
  });

  const seen = new Set<string>();
  return filtered.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const buildStructuredNoticeDetailsFallback = (
  documentType: string,
  sourceText: string,
  authorityLabel: string,
  mcaType?: string,
) => {
  const src = sourceText || "";
  const noticeNo =
    src.match(/(?:notice\s*(?:no\.?|number)?|ref\.?\s*no\.?|reference\s*no\.?)\s*[:\-]?\s*([a-z0-9\/\-_]+)/i)?.[1] ||
    "[To be filled by CA/Lawyer]";
  const dinOrRfn =
    src.match(/\b(?:din|rfn)\s*[:\-]?\s*([a-z0-9\/\-_]+)/i)?.[1] || "[To be filled by CA/Lawyer]";
  const noticeDate =
    src.match(/dated\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i)?.[1] ||
    src.match(/dated\s+([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i)?.[1] ||
    "[To be filled by CA/Lawyer]";
  const amount =
    src.match(/(?:inr|rs\.?|₹)\s*([0-9,]+(?:\.\d+)?)/i)?.[1] || "[To be filled by CA/Lawyer]";
  const sections = Array.from(new Set((src.match(/section\s*\d+[a-z]*/gi) || []).map((s) => s.replace(/\s+/g, " ").trim()))).slice(0, 6);
  const rules = Array.from(new Set((src.match(/rule\s*\d+[a-z]*/gi) || []).map((s) => s.replace(/\s+/g, " ").trim()))).slice(0, 4);
  const fy =
    src.match(/\bfy\s*[0-9]{4}\s*-\s*[0-9]{2,4}\b/i)?.[0] ||
    src.match(/\bfinancial year\s*[0-9]{4}\s*-\s*[0-9]{2,4}\b/i)?.[0] ||
    "[To be filled by CA/Lawyer]";

  const mcaSpecificLine =
    documentType === "mca-notice"
      ? `Auto-detected MCA class is ${mcaType || "general-mca"}. Ensure draft explicitly covers allegation-wise legal response, chronology evidence, officer-wise defense, and calibrated prayer language.`
      : "Ensure the draft remains allegation-wise, evidence-linked, and proportionate in relief prayer.";

  return `Notice/Order Details Summary for ${authorityLabel}: Reference ${noticeNo}, dated ${noticeDate}, DIN/RFN ${dinOrRfn}. The extracted notice narrative indicates alleged non-compliance under ${sections.length ? sections.join(", ") : "[To be filled by CA/Lawyer]"}${rules.length ? ` read with ${rules.join(", ")}` : ""}, for period ${fy}, with a currently captured exposure marker of INR ${amount}. On a drafting-readiness basis, the department position appears to rely on mismatch/delay/incorrect treatment assertions and consequential levy framing, while the noticee position should be structured as allegation-wise rebuttal supported by verifiable documents and timeline evidence. ${mcaSpecificLine} Required drafting anchors: notice snapshot (authority, notice reference, date, DIN/RFN, period, invoked provisions); chronology fields with due/event date versus actual filing/action date; section/rule/regulation-wise legal submissions tied to facts; accepted-versus-disputed computation framing where demand/exposure is proposed; and annexure mapping that clearly links each rebuttal to documentary proof. Use calibrated language for relief and hearing request, avoid over-claims, and keep unresolved factual fields strictly as [To be filled by CA/Lawyer]. The resulting notice-details block should be adjudication-ready, specific, and free from generic filler text so downstream AI drafting remains precise and defensible.`;
};

type StepStatus = "pending" | "completed" | "current";
type WorkflowStatus = "generated" | "under_review" | "approved" | "signed_off";

interface AIDraftingEngineProps {
  demoMode?: boolean;
  includeLawyerReview?: boolean;
}

interface ReviewStep {
  id: number;
  label: string;
  status: StepStatus;
}

interface DraftQA {
  filing_score: number;
  risk_band: "low" | "medium" | "high";
  mandatory_gates?: Record<string, boolean>;
  domain_gates?: Record<string, boolean>;
  citation_review?: Array<{
    citation: string;
    jurisdiction_fit: "high" | "medium" | "low";
    confidence: number;
    note: string;
  }>;
  explainability?: Array<{
    legal_point: string;
    why_included: string;
    evidence_anchor: string;
  }>;
  missing_for_final_filing?: string[];
}

interface DraftPackage {
  reply: string;
  annexure_index?: Array<{
    annexure_id: string;
    purpose: string;
    linked_issue: string;
  }>;
  hearing_notes?: string;
  argument_script?: string[];
}

type McaIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  advancedSuggestions?: Array<{ title: string; suggestion: string; implemented: boolean }>;
  checkedAt: string;
};

type McaRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type McaRecheckReport = {
  ok: boolean;
  flags: McaRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type GstIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type GstRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type GstRecheckReport = {
  ok: boolean;
  flags: GstRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type IncomeTaxIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type IncomeTaxRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type IncomeTaxRecheckReport = {
  ok: boolean;
  flags: IncomeTaxRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type RbiIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type RbiRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type RbiRecheckReport = {
  ok: boolean;
  flags: RbiRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type SebiIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type SebiRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type SebiRecheckReport = {
  ok: boolean;
  flags: SebiRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type CustomsIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type CustomsRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type CustomsRecheckReport = {
  ok: boolean;
  flags: CustomsRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type ContractIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type ContractRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type ContractRecheckReport = {
  ok: boolean;
  flags: ContractRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

type CustomIssueReport = {
  ok: boolean;
  items: Array<{ issue: string; suggestion: string }>;
  issues: string[];
  checkedAt: string;
};

type CustomRecheckFlag = {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source?: "rule" | "ai";
};

type CustomRecheckReport = {
  ok: boolean;
  flags: CustomRecheckFlag[];
  summary?: string;
  checkedAt?: string;
};

const buildOfflineDraft = ({
  documentType,
  authority,
  companyName,
  noticeText,
  modeLabel,
}: {
  documentType: string;
  authority: string;
  companyName: string;
  noticeText: string;
  modeLabel: string;
}) => {
  const trimmed = (noticeText || "").trim();
  const noticeSnapshot = trimmed.length > 0 ? trimmed.slice(0, 3200) : "Notice text not provided.";
  const compactNotice = noticeSnapshot.replace(/\s+/g, " ").trim();

  const extract = (regex: RegExp, fallback = "Not clearly stated in notice text") => {
    const match = noticeSnapshot.match(regex);
    return (match?.[1] || fallback).trim();
  };

  const extractNoticeNo = () =>
    extract(
      /(?:Show\s*Cause\s*Notice\s*No\.?|SCN\s*No\.?|Notice\s*No\.?|Reference\s*No\.?|Ref\s*No\.?)\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i,
      "Not specified",
    );
  const extractDin = () =>
    extract(
      /DIN\/RFN\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i,
      extract(/DIN\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i, extract(/RFN\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i, "Not specified")),
    );

  const noticeNo = extractNoticeNo();
  const din = extractDin();
  const amount = extract(/(?:Proposed(?:\s+tax)?\s+demand\s+is\s+)?(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d+)?)/i, "To be quantified");
  const period = extract(/(?:for\s+period|period)\s+([A-Za-z0-9,\-\s]+?(?:to|–|-)\s*[A-Za-z0-9,\-\s]+?)(?:\s+under|,|\.|$)/i, "Not clearly stated");
  const noticeDate = extract(/dated\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i, "Not clearly stated");
  const adjudicatingOffice = extract(
    /issued\s+by\s+([A-Za-z0-9,\s\-&()/.]+?)(?:,|\s+under|\s+for|\s+dated)/i,
    `The Competent ${authority} Authority`,
  );

  const sectionMatches = Array.from(compactNotice.matchAll(/\bSection\s+\d+(?:\(\d+\))?(?:\([a-zA-Z0-9]+\))?/gi)).map((m) => m[0]);
  const ruleMatches = Array.from(compactNotice.matchAll(/\bRule\s+\d+(?:\(\d+\))?(?:[A-Z])?/gi)).map((m) => m[0]);
  const provisions = Array.from(new Set([...sectionMatches, ...ruleMatches])).slice(0, 10);
  const provisionsLine = provisions.length > 0 ? provisions.join(", ") : "Applicable provisions to be read from the notice record";

  const allegationSentence =
    compactNotice
      .split(/[.!?]/)
      .map((line) => line.trim())
      .find((line) => /(alleges|wrongful|default|non[- ]compliance|mismatch|demand|penalty|interest|disallow|violation)/i.test(line)) ??
    "The notice alleges statutory non-compliance and proposes demand with consequential interest and penalty.";

  const rebuttalFocus = Array.from(
    new Set(
      compactNotice
        .split(/[.!?]/)
        .map((line) => line.trim())
        .filter((line) => /(invoice|return|payment|reconciliation|ledger|filing|timeline|evidence|computation|classification|valuation)/i.test(line))
        .slice(0, 4),
    ),
  );
  const rebuttalFocusLine =
    rebuttalFocus.length > 0
      ? rebuttalFocus.map((line, idx) => `${idx + 1}. ${line}.`).join("\n")
      : `1. Invoice and filing trail reconciliation.
2. Computation working challenge and arithmetic verification.
3. Statutory interpretation and burden-of-proof response.
4. Penalty and interest sustainability challenge.`;

  if (documentType === "gst-show-cause") {
    return `**BEFORE THE ADJUDICATING AUTHORITY / PROPER OFFICER**

**IN THE MATTER OF:** ${companyName}  
**SUBJECT:** Detailed Reply to Show Cause Notice under GST  
**Notice No.:** ${noticeNo}  
**DIN/RFN:** ${din}  
**Date:** ${noticeDate}  
**Period:** ${period}

### WRITTEN SUBMISSIONS ON BEHALF OF THE NOTICEE

**MOST RESPECTFULLY SUBMITTED:**

1. This reply is filed against the above notice issued by ${adjudicatingOffice}. Unless specifically admitted, every allegation, inference, and quantification proposed in the notice is denied.
2. The impugned demand appears to be founded on portal mismatch/computation assumptions and not on complete transaction-level verification.
3. The statutory provisions appearing from the notice are: ${provisionsLine}.

### 1. BRIEF FACTUAL BACKGROUND
1.1 The Noticee is a compliant registered taxpayer and has maintained regular return filing and books of account.
1.2 The notice alleges wrongful availment / inadmissibility of credit and proposes demand of INR ${amount}, with consequential interest and penalty.
1.3 The principal observation in the notice is: "${allegationSentence}".

### 2. PRELIMINARY LEGAL OBJECTIONS
2.1 Demand confirmation requires para-wise allegation proof, invoice-level linkage, and legally sustainable computation.
2.2 A mechanical variance between portal statements and returns cannot, by itself, establish evasion or deliberate contravention.
2.3 Interest and penalty are consequential and cannot survive if principal demand is not legally established.

### 3. PARA-WISE REBUTTAL FRAMEWORK
| Notice Allegation | Department Position | Noticee Rebuttal | Evidence Support |
|---|---|---|---|
| ITC inadmissibility / mismatch | Credit treated as ineligible based on mismatch logic | Credit eligibility is to be tested on document + receipt + tax nexus + return compliance, not only mismatch flags | Annexure A, B |
| Computation in DRC working | Gross demand proposed without transaction reconciliation | Reconciliation requires invoice-wise validation, timing alignment, and duplicate exclusion | Annexure C |
| Interest and penalty | Automatically proposed | Not automatic; dependent on sustainable principal liability and statutory thresholds | Annexure D |

### 4. COMPUTATION RECONCILIATION CHALLENGE
4.1 Proposed principal demand: INR ${amount}.  
4.2 Noticee requests recomputation after:
1. Invoice-wise tie-out with books and return data.
2. Period-wise reconciliation and timing variance adjustment.
3. Removal of duplicated / non-actionable line items.
4. Exclusion of unsupported assumptions not backed by documentary evidence.

### 5. EVIDENCE AND ANNEXURE MAPPING
1. **Annexure A:** Notice set, DIN/RFN, and chronology table.
2. **Annexure B:** Invoice set, return extracts, and payment trail.
3. **Annexure C:** Reconciliation workbook and computation challenge matrix.
4. **Annexure D:** Legal submissions, circular/case support, and penalty challenge.

### 6. PRAYER
In view of the above, the Noticee respectfully prays that this Hon'ble Authority may be pleased to:
1. Drop or substantially reduce the proposed demand after proper reconciliation.
2. Set aside / suitably restrict interest and penalty to the extent unsustainable in law.
3. Grant personal hearing and permit filing of additional documentary submissions.
4. Pass such further order(s) as deemed fit in the interest of justice.

**Notice Extract Used for Drafting:**  
${noticeSnapshot}
`;
  }

  return `**BEFORE THE ADJUDICATING AUTHORITY / PROPER OFFICER**

**IN THE MATTER OF:** ${companyName}
**SUBJECT:** Reply to ${authority} Proceedings
**NOTICE REFERENCE:** ${noticeNo}
**DIN/RFN:** ${din}
**NOTICE DATE:** ${noticeDate}
**PERIOD UNDER DISPUTE:** ${period}

### WRITTEN SUBMISSIONS ON BEHALF OF THE NOTICEE

**Most Respectfully Submitted:**

The Noticee submits this reply to contest the allegations raised in the above proceedings. This submission is drafted in **${modeLabel.toUpperCase()}** mode, with a filing-first structure intended for adjudication readiness. Unless expressly admitted, every allegation and computation in the notice is denied.

### 1. Notice Summary and Jurisdictional Context
1. Issuing authority: ${adjudicatingOffice}.
2. Nature of allegation: ${allegationSentence}
3. Core statutory framework involved: ${provisionsLine}.
4. Proposed exposure indicated in notice: INR ${amount}.
5. Primary observation from notice text: ${allegationSentence}

### 2. Preliminary Legal Position
1. The notice must sustain allegation-wise burden of proof on facts, law, and quantification.
2. A mismatch, delay, or third-party irregularity cannot automatically establish enforceable liability against the Noticee without evidence-linked adjudication.
3. The impugned computation requires strict line-item testing before confirmation of any demand.
4. Consequential interest/penalty cannot survive where foundational demand is unproven or overstated.

### 3. Issue-Wise Defence Matrix
1. **Issue A - Foundational allegation challenge:** Allegation-wise proof and applicability challenge based on record.
2. **Issue B - Computation and proportionality challenge:** Demand working and consequential levy challenge.
3. **Issue C - Documentary substantiation:** Noticee relies on invoices/returns/contracts, payment trail, and internal reconciliations mapped annexure-wise.
4. **Issue D - Relief calibration:** Demand, interest, and penalty must be dropped or proportionately reduced based on verified facts.

### 4. Para-Wise Rebuttal Framework
| Notice Component | Department Position | Noticee Response | Documentary Anchor | Adjudication Ask |
|---|---|---|---|---|
| Jurisdiction and allegation setup | Breach asserted in broad terms | Requires allegation-wise proof and legal linkage | Annexure A | Restrict to evidenced issues only |
| Factual narrative | Selective interpretation of records | Full transaction/factual chronology materially differs | Annexure B | Consider complete record set |
| Quantification and working | Demand proposed at gross level | Reconciliation reveals adjustments and overstatement risk | Annexure C | Recompute before confirmation |
| Interest / penalty proposal | Consequential imposition proposed | Not maintainable where base demand is disputed/unsupported | Annexure D | Drop or proportionately curtail |

### 5. Computation Reconciliation Position
| Particulars | Notice Position | Noticee Position | Reconciliation Note |
|---|---|---|---|
| Principal amount | INR ${amount} | Subject to verified recomputation | Requires invoice-wise and period-wise tie-out |
| Interest | Proposed consequentially | Disputed in principle and quantum | Contingent on sustainable principal |
| Penalty | Proposed | Contested on law and facts | Threshold conditions not established |

### 6. Evidence-Linked Rebuttal Points
${rebuttalFocusLine}

### 7. Annexure Mapping (For Final Filing Pack)
1. **Annexure A:** Notice set, DIN/RFN, notice chronology, and scope mapping.
2. **Annexure B:** Primary factual evidence pack (invoices, returns, filings, contracts, correspondence as applicable).
3. **Annexure C:** Computation workbook, mismatch reconciliation, and period-wise adjustment statement.
4. **Annexure D:** Legal authorities and procedural compliance material relied upon.

### 8. Prayer
In view of the above, the Noticee respectfully prays that this Hon'ble Authority may be pleased to:
1. Set aside, drop, or materially reduce the impugned demand after full reconciliation.
2. Drop or substantially curtail interest and penalty proposals to the extent unsustainable in law.
3. Grant a personal hearing and permit further documentary submissions.
4. Pass such further order(s), including consequential reliefs, as may be deemed fit in the interest of justice.

### 9. Notice Text Used for Drafting
${noticeSnapshot}
`;
};

const buildInitialReviewSteps = (includeLawyerReview: boolean): ReviewStep[] => {
  const steps: ReviewStep[] = [
    { id: 1, label: "Draft Generated", status: "pending" },
    { id: 2, label: "CA Review & Edit", status: "pending" },
  ];

  if (includeLawyerReview) {
    steps.push({ id: 3, label: "Lawyer Review", status: "pending" });
  }

  steps.push(
    { id: includeLawyerReview ? 4 : 3, label: "Final Approval", status: "pending" },
    { id: includeLawyerReview ? 5 : 4, label: "Ready for Submission", status: "pending" },
  );

  return steps;
};

const documentFormatModules: Record<string, string[]> = {
  "mca-notice": [
    "Company law section mapping and default classification (procedural vs substantive).",
    "Compounding/leniency pathway and rectification-status mapping.",
  ],
  "gst-show-cause": [
    "Section-wise ITC and demand challenge matrix.",
    "GSTR reconciliation and DRC computation rebuttal.",
  ],
  "income-tax-response": [
    "Issue-wise addition/disallowance response mapping.",
    "Penalty defense and reassessment validity block (where applicable).",
  ],
  "rbi-filing": [
    "FEMA/RBI compliance narrative with proportionality framing.",
    "Control-failure remediation and risk-mitigation matrix.",
  ],
  "sebi-compliance": [
    "Disclosure and investor-impact framing under applicable regulations.",
    "Governance-control and corrective-action matrix.",
  ],
  "customs-response": [
    "Classification/valuation/exemption defense with section mapping.",
    "Duty/interest/penalty/confiscation computation rebuttal table.",
  ],
  "contract-review": [
    "Clause-by-clause enforceability and risk allocation analysis.",
    "Redline recommendations with legal exposure notes.",
  ],
  "custom-draft": [
    "Authority and governing law inference block from provided facts.",
    "General regulatory response format with layered reliefs.",
  ],
};

const readyNoticeTemplates: Record<string, string> = {
  "gst-show-cause": "Show Cause Notice No. ZD070226019874A dated 07 February 2026 issued by State GST Bengaluru South, DIN/RFN GST/SCN/2026/BLR-S/44721, alleges wrongful ITC availment for period April 2024 to December 2025 under Section 73 read with Section 16(2)(c), Rule 36 and Rule 42 with Rule 86A risk reference. Proposed tax demand is INR 18,46,920, interest under Section 50 and penalty under Section 73(9). Department relies on DRC-01 working sheet dated 31 January 2026, GSTR-3B vs GSTR-2B mismatch, and vendor filing gaps. Noticee has valid invoices, receipt proof, banking payment trail, and return compliance. Prepare para-wise rebuttal matrix, allegation-wise computation challenge, annexure mapping, and complete prayer for dropping demand, interest and penalty with hearing request.",
  "mca-notice": "Adjudication Notice No. ROC/KA/ADJ/2026/112 dated 15 January 2026, DIN MCA/ROC/2026/44718, issued by Registrar of Companies under Companies Act, 2013 alleging non-compliance of Section 92 read with Rule 11 and Section 137 read with Rule 12 for FY 2023-24. Proposed penalty is INR 5,00,000 on company and INR 1,00,000 on each officer in default. Department alleges delayed statutory filing and seeks adjudication under penalty provisions. Noticee submits delay is procedural, filings have been completed with additional fees, and no stakeholder prejudice occurred. Draft issue-wise response with chronology, section-wise defense, mitigation and compounding submissions, annexure mapping, and prayer for dropping or substantial reduction of penalty with personal hearing.",
  "income-tax-response": "Income-tax Notice No. ITBA/AST/S/143(2)/2026-27/1049982 dated 28 June 2026, DIN ITD/1432/2026/88217, issued by ACIT Circle-5 for AY 2025-26 in assessment proceedings alleging disallowance under Section 37(1) and mismatch under Section 194C with proposed addition of INR 27,80,000. Department relies on AIS/TDS mismatch, ledger variance and invoice scrutiny, and proposes consequential tax, interest and penalty proceedings. Noticee provides audited books, bank trail, vendor invoices, TDS reconciliation and contract evidence showing business purpose and correct reporting. Draft para-wise rebuttal for each allegation, computation challenge table, annexure mapping, and final prayer for deletion of additions, dropping penalty initiation, and grant of personal hearing before any adverse order.",
  "rbi-filing": "RBI communication Ref No. RBI/FED/2026-27/245 dated 19 August 2026 regarding FEMA reporting for period April 2025 to March 2026 alleges delayed filing under Regulation 7 read with Regulation 10 and non-alignment in remittance disclosures. Proposed monetary implication is INR 12,00,000. Department notes delayed submission in returns and control lapses in internal compliance workflow. Noticee submits transactions are bona fide, remittances are fully bank-backed, and corrective filings were completed on 25 August 2026 with strengthened internal controls. Draft regulation-wise rebuttal, timeline table, exposure computation challenge, annexure mapping (AD bank certificates, board approvals, return acknowledgements), and layered prayer seeking closure or minimum compounding with personal hearing.",
  "sebi-compliance": "SEBI Notice Ref No. SEBI/HO/CFD/SCN/2026/311 dated 09 September 2026 alleges non-compliance with Regulation 30 read with Regulation 33 of SEBI LODR for period Q1-Q3 FY 2025-26, with proposed penalty of INR 15,00,000. Reference ID: SEBI/CFD/2026/88421. Department alleges delayed disclosure, governance reporting deficiency, and inconsistency in submitted statements. Noticee submits investor prejudice is absent, corrective disclosures were made on 14 September 2026, and governance controls were strengthened through board-approved SOP updates. Prepare allegation-wise legal rebuttal with regulation text linkage, chronology of filings, evidence mapping to exchange disclosures and board records, computation/exposure challenge, and prayer for dropping or reducing proposed action with hearing request.",
  "customs-response": "Show Cause Notice No. SCN/CUS/2026/114 dated 12 February 2026, DIN/RFN CUS/MUM/2026/99172, issued by Assistant Commissioner of Customs Mumbai-II for imports during April 2024 to December 2025 alleges misclassification under Section 28 with related valuation dispute. Proposed differential duty is INR 48,72,430, interest under Section 28AA, penalty under Sections 112 and 114A, and confiscation proposal under Section 111 with redemption fine under Section 125. Department relies on NIDB comparison and selected Bills of Entry. Noticee submits declared classification and transaction value are correct based on technical literature, invoices and banking proof, with no suppression. Draft para-wise rebuttal, duty-interest-penalty-fine computation challenge, annexure mapping, and prayer for dropping proceedings with personal hearing.",
  "contract-review": "Contract review for Master Services Agreement dated 11 March 2026 between Acme Technologies Pvt. Ltd. and Orion Systems LLP. Key concern clauses: Clause 4.2 (payment), Clause 7.1 (indemnity), Clause 9.3 (limitation of liability), Clause 12.4 (termination), Clause 14.2 (arbitration). Estimated commercial exposure is INR 3,50,00,000. Dispute risk includes one-sided indemnity, uncapped liability, delayed payment triggers, and ambiguous IP ownership language. Governing law is India and seat proposed as Bengaluru. Draft clause-wise risk table, enforceability analysis, redline recommendations, fallback negotiation positions, annexure references (term sheet, email trail, board note), and final execution-readiness summary with priority fixes.",
  "custom-draft": "Regulatory Notice Ref No. REG/2026/551 dated 21 July 2026 issued by [Authority Name], DIN/RFN REG/AUTH/2026/55121, for period April 2025 to March 2026 under Section 73 read with Rule 42 and Regulation 10 (as applicable). Proposed tax/penalty exposure is INR 22,40,000 with interest component and hearing compliance timeline. Department allegations include reporting mismatch, delayed filing, and incorrect disclosure treatment based on internal audit observations. Noticee position is bona fide compliance supported by invoices, reconciliations, and banking records, with identified differences attributable to timing and interpretation. Generate filing-ready draft with notice snapshot, para-wise rebuttal matrix, computation challenge table, annexure mapping, procedural validity check (fact-supported only), and layered prayer with hearing request.",
};

type AdvancedCheck = {
  label: string;
  regex: RegExp;
};

const advancedChecksByType: Record<string, AdvancedCheck[]> = {
  "gst-show-cause": [
    { label: "DIN/RFN reference", regex: /(DIN|RFN|Reference\s*No|Ref\.?\s*No)/i },
    { label: "Section/Rule references", regex: /(Section|Sec\.|Rule)\s*\d+/i },
    { label: "Demand/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "GST return/context indicators", regex: /(GSTR-3B|GSTR-2B|DRC-01|ITC)/i },
  ],
  "mca-notice": [
    { label: "Notice reference/DIN", regex: /(DIN|SRN|Reference\s*No|Ref\.?\s*No|ROC)/i },
    { label: "Section/Rule references", regex: /(Section|Sec\.|Rule)\s*\d+/i },
    { label: "Penalty/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "MCA/ROC context", regex: /(Companies Act|ROC|MCA|adjudication|compounding)/i },
  ],
  "income-tax-response": [
    { label: "Notice reference/DIN", regex: /(DIN|Notice\s*No|Ref\.?\s*No|AY)/i },
    { label: "Section references", regex: /(Section|Sec\.)\s*\d+/i },
    { label: "Tax/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Income-tax context", regex: /(Income-tax|assessment|reassessment|CPC|AO)/i },
  ],
  "rbi-filing": [
    { label: "Reference number", regex: /(Ref\.?\s*No|Reference\s*No|letter|communication)/i },
    { label: "Regulation references", regex: /(Regulation|Section|Rule)\s*\d+/i },
    { label: "Exposure/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "RBI/FEMA context", regex: /(RBI|FEMA|authorized dealer|compounding)/i },
  ],
  "sebi-compliance": [
    { label: "Reference number", regex: /(Ref\.?\s*No|Reference\s*No|SEBI)/i },
    { label: "Regulation references", regex: /(Regulation|Section|Rule)\s*\d+/i },
    { label: "Exposure/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "SEBI/disclosure context", regex: /(SEBI|listing|disclosure|governance|investor)/i },
  ],
  "customs-response": [
    { label: "DIN/RFN reference", regex: /(DIN|RFN|SCN|Ref\.?\s*No)/i },
    { label: "Section references", regex: /(Section|Sec\.)\s*\d+/i },
    { label: "Duty/amount details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Customs context", regex: /(Bill of Entry|BOE|classification|valuation|Section 28|Section 111)/i },
  ],
  "contract-review": [
    { label: "Agreement/contract reference", regex: /(agreement|contract|clause|party|effective date)/i },
    { label: "Clause/legal references", regex: /(clause|section)\s*\d+(\.\d+)*/i },
    { label: "Commercial exposure details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+|liability|damages/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Dispute/risk context", regex: /(indemnity|termination|dispute|arbitration|liability)/i },
  ],
  "custom-draft": [
    { label: "Reference identifier", regex: /(DIN|RFN|Ref\.?\s*No|Reference\s*No|notice)/i },
    { label: "Provision references", regex: /(Section|Sec\.|Rule|Regulation)\s*\d+/i },
    { label: "Amount/exposure details", regex: /(?:Rs\.?|INR|₹)\s?[\d,]+/i },
    { label: "Date timeline evidence", regex: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/ },
    { label: "Authority/law context", regex: /(authority|department|act|regulation|notice|order)/i },
  ],
};

const AIDraftingEngine = ({ demoMode = false, includeLawyerReview = true }: AIDraftingEngineProps) => {
  const initialReviewSteps = useMemo(
    () => buildInitialReviewSteps(includeLawyerReview),
    [includeLawyerReview],
  );
  const [clientOptions, setClientOptions] = useState<ClientOption[]>(demoClients);
  const [clientSource, setClientSource] = useState<"demo" | "live">("demo");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [lastTemplateDocType, setLastTemplateDocType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("balanced");
  const [templatePackOverride, setTemplatePackOverride] = useState<TemplatePackId>("auto");
  const [mcaReplyTypeOverride, setMcaReplyTypeOverride] = useState<string>("auto");
  const [gstReplyTypeOverride, setGstReplyTypeOverride] = useState<string>("auto");
  const [incomeTaxReplyTypeOverride, setIncomeTaxReplyTypeOverride] = useState<string>("auto");
  const [rbiReplyTypeOverride, setRbiReplyTypeOverride] = useState<string>("auto");
  const [sebiReplyTypeOverride, setSebiReplyTypeOverride] = useState<string>("auto");
  const [customsReplyTypeOverride, setCustomsReplyTypeOverride] = useState<string>("auto");
  const [contractReplyTypeOverride, setContractReplyTypeOverride] = useState<string>("auto");
  const [customReplyTypeOverride, setCustomReplyTypeOverride] = useState<string>("auto");
  const [noticeDetails, setNoticeDetails] = useState<string>("");
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<string>("");
  const noticeUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessingNoticeUpload, setIsProcessingNoticeUpload] = useState(false);
  const [uploadedNoticeFileName, setUploadedNoticeFileName] = useState<string>("");
  const [isGeneratingNoticeDetails, setIsGeneratingNoticeDetails] = useState(false);
  const [preferPiiMasking, setPreferPiiMasking] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [mcaTrainingCaseId, setMcaTrainingCaseId] = useState<string | null>(null);
  const [gstTrainingCaseId, setGstTrainingCaseId] = useState<string | null>(null);
  const [incomeTaxTrainingCaseId, setIncomeTaxTrainingCaseId] = useState<string | null>(null);
  const [rbiTrainingCaseId, setRbiTrainingCaseId] = useState<string | null>(null);
  const [sebiTrainingCaseId, setSebiTrainingCaseId] = useState<string | null>(null);
  const [customsTrainingCaseId, setCustomsTrainingCaseId] = useState<string | null>(null);
  const [contractTrainingCaseId, setContractTrainingCaseId] = useState<string | null>(null);
  const [customTrainingCaseId, setCustomTrainingCaseId] = useState<string | null>(null);
  const [showFormatDetails, setShowFormatDetails] = useState(false);
  const [currentDraftRunId, setCurrentDraftRunId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("generated");
  const [auditEvents, setAuditEvents] = useState<Array<{ event_type: string; created_at: string }>>([]);
  const [draftQA, setDraftQA] = useState<DraftQA | null>(null);
  const [draftPackage, setDraftPackage] = useState<DraftPackage | null>(null);
  const [mcaHasChecked, setMcaHasChecked] = useState(false);
  const [mcaLastCheckedAt, setMcaLastCheckedAt] = useState<string | null>(null);
  const [mcaUserFixNotes, setMcaUserFixNotes] = useState("");
  const [isApplyingMcaFix, setIsApplyingMcaFix] = useState(false);
  const [mcaEvidenceContext, setMcaEvidenceContext] = useState("");
  const [mcaRecheckReport, setMcaRecheckReport] = useState<McaRecheckReport | null>(null);
  const [isRecheckingMca, setIsRecheckingMca] = useState(false);
  const [gstHasChecked, setGstHasChecked] = useState(false);
  const [gstLastCheckedAt, setGstLastCheckedAt] = useState<string | null>(null);
  const [gstUserFixNotes, setGstUserFixNotes] = useState("");
  const [gstEvidenceContext, setGstEvidenceContext] = useState("");
  const [gstRecheckReport, setGstRecheckReport] = useState<GstRecheckReport | null>(null);
  const [isRecheckingGst, setIsRecheckingGst] = useState(false);
  const [isApplyingGstFix, setIsApplyingGstFix] = useState(false);
  const [incomeTaxHasChecked, setIncomeTaxHasChecked] = useState(false);
  const [incomeTaxLastCheckedAt, setIncomeTaxLastCheckedAt] = useState<string | null>(null);
  const [incomeTaxUserFixNotes, setIncomeTaxUserFixNotes] = useState("");
  const [incomeTaxEvidenceContext, setIncomeTaxEvidenceContext] = useState("");
  const [incomeTaxRecheckReport, setIncomeTaxRecheckReport] = useState<IncomeTaxRecheckReport | null>(null);
  const [isRecheckingIncomeTax, setIsRecheckingIncomeTax] = useState(false);
  const [isApplyingIncomeTaxFix, setIsApplyingIncomeTaxFix] = useState(false);
  const [rbiHasChecked, setRbiHasChecked] = useState(false);
  const [rbiLastCheckedAt, setRbiLastCheckedAt] = useState<string | null>(null);
  const [rbiUserFixNotes, setRbiUserFixNotes] = useState("");
  const [rbiEvidenceContext, setRbiEvidenceContext] = useState("");
  const [rbiRecheckReport, setRbiRecheckReport] = useState<RbiRecheckReport | null>(null);
  const [isRecheckingRbi, setIsRecheckingRbi] = useState(false);
  const [isApplyingRbiFix, setIsApplyingRbiFix] = useState(false);
  const [sebiHasChecked, setSebiHasChecked] = useState(false);
  const [sebiLastCheckedAt, setSebiLastCheckedAt] = useState<string | null>(null);
  const [sebiUserFixNotes, setSebiUserFixNotes] = useState("");
  const [sebiEvidenceContext, setSebiEvidenceContext] = useState("");
  const [sebiRecheckReport, setSebiRecheckReport] = useState<SebiRecheckReport | null>(null);
  const [isRecheckingSebi, setIsRecheckingSebi] = useState(false);
  const [isApplyingSebiFix, setIsApplyingSebiFix] = useState(false);
  const [customsHasChecked, setCustomsHasChecked] = useState(false);
  const [customsLastCheckedAt, setCustomsLastCheckedAt] = useState<string | null>(null);
  const [customsUserFixNotes, setCustomsUserFixNotes] = useState("");
  const [customsEvidenceContext, setCustomsEvidenceContext] = useState("");
  const [customsRecheckReport, setCustomsRecheckReport] = useState<CustomsRecheckReport | null>(null);
  const [isRecheckingCustoms, setIsRecheckingCustoms] = useState(false);
  const [isApplyingCustomsFix, setIsApplyingCustomsFix] = useState(false);
  const [contractHasChecked, setContractHasChecked] = useState(false);
  const [contractLastCheckedAt, setContractLastCheckedAt] = useState<string | null>(null);
  const [contractUserFixNotes, setContractUserFixNotes] = useState("");
  const [contractEvidenceContext, setContractEvidenceContext] = useState("");
  const [contractRecheckReport, setContractRecheckReport] = useState<ContractRecheckReport | null>(null);
  const [isRecheckingContract, setIsRecheckingContract] = useState(false);
  const [isApplyingContractFix, setIsApplyingContractFix] = useState(false);
  const [customHasChecked, setCustomHasChecked] = useState(false);
  const [customLastCheckedAt, setCustomLastCheckedAt] = useState<string | null>(null);
  const [customUserFixNotes, setCustomUserFixNotes] = useState("");
  const [customEvidenceContext, setCustomEvidenceContext] = useState("");
  const [customRecheckReport, setCustomRecheckReport] = useState<CustomRecheckReport | null>(null);
  const [isRecheckingCustom, setIsRecheckingCustom] = useState(false);
  const [isApplyingCustomFix, setIsApplyingCustomFix] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<ReviewStep[]>(initialReviewSteps);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const DRAFT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-draft`;
  const hasDraftEndpoint = typeof import.meta.env.VITE_SUPABASE_URL === "string" && import.meta.env.VITE_SUPABASE_URL.startsWith("http");
  const secureFunctionAuth = import.meta.env.VITE_ENABLE_SECURE_FUNCTION_AUTH === "true";
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
  const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";
  const noticeLength = noticeDetails.trim().length;
  const activeChecks = selectedDocType
    ? (advancedChecksByType[selectedDocType] || advancedChecksByType["custom-draft"])
    : [];
  const checkResults = activeChecks.map((check) => ({
    ...check,
    passed: check.regex.test(noticeDetails),
  }));
  const selectedDocLabel = documentTypes.find(doc => doc.id === selectedDocType)?.label || "Selected Draft";
  const docSpecificFormat = documentFormatModules[selectedDocType] || documentFormatModules["custom-draft"];
  const inferredMcaReplyType = useMemo(
    () => inferMcaReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredGstReplyType = useMemo(
    () => inferGstReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredIncomeTaxReplyType = useMemo(
    () => inferIncomeTaxReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredRbiReplyType = useMemo(
    () => inferRbiReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredSebiReplyType = useMemo(
    () => inferSebiReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredCustomsReplyType = useMemo(
    () => inferCustomsReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredContractReplyType = useMemo(
    () => inferContractReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const inferredCustomReplyType = useMemo(
    () => inferCustomReplyTypeFromNotice(noticeDetails),
    [noticeDetails],
  );
  const effectiveNoticeClass = useMemo(() => {
    if (!selectedDocType) return "auto";
    if (selectedDocType === "mca-notice") return mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType;
    if (selectedDocType === "gst-show-cause") return gstReplyTypeOverride !== "auto" ? gstReplyTypeOverride : inferredGstReplyType;
    if (selectedDocType === "income-tax-response") return incomeTaxReplyTypeOverride !== "auto" ? incomeTaxReplyTypeOverride : inferredIncomeTaxReplyType;
    if (selectedDocType === "rbi-filing") return rbiReplyTypeOverride !== "auto" ? rbiReplyTypeOverride : inferredRbiReplyType;
    if (selectedDocType === "sebi-compliance") return sebiReplyTypeOverride !== "auto" ? sebiReplyTypeOverride : inferredSebiReplyType;
    if (selectedDocType === "customs-response") return customsReplyTypeOverride !== "auto" ? customsReplyTypeOverride : inferredCustomsReplyType;
    if (selectedDocType === "contract-review") return contractReplyTypeOverride !== "auto" ? contractReplyTypeOverride : inferredContractReplyType;
    if (selectedDocType === "custom-draft") return customReplyTypeOverride !== "auto" ? customReplyTypeOverride : inferredCustomReplyType;
    return "auto";
  }, [
    selectedDocType,
    mcaReplyTypeOverride, inferredMcaReplyType,
    gstReplyTypeOverride, inferredGstReplyType,
    incomeTaxReplyTypeOverride, inferredIncomeTaxReplyType,
    rbiReplyTypeOverride, inferredRbiReplyType,
    sebiReplyTypeOverride, inferredSebiReplyType,
    customsReplyTypeOverride, inferredCustomsReplyType,
    contractReplyTypeOverride, inferredContractReplyType,
    customReplyTypeOverride, inferredCustomReplyType,
  ]);
  const templatePackOptions = useMemo(
    () => getTemplatePackOptionsBySelection(selectedDocType, effectiveNoticeClass),
    [selectedDocType, effectiveNoticeClass],
  );
  const effectiveTemplatePack = useMemo(() => {
    const defaultPack = templatePackOptions.find((pack) => pack.id === "class-core") || templatePackOptions.find((pack) => pack.id !== "auto");
    if (!defaultPack) return AUTO_TEMPLATE_PACK;
    if (templatePackOverride === "auto") return defaultPack;
    return templatePackOptions.find((pack) => pack.id === templatePackOverride) || defaultPack;
  }, [templatePackOverride, templatePackOptions]);
  const selectedClassLabel = useMemo(() => {
    const options = getReplyTypeOptionsByDocumentType(selectedDocType);
    return options.find((opt) => opt.id === effectiveNoticeClass)?.label || "General Class";
  }, [selectedDocType, effectiveNoticeClass]);
  const selectedTemplate = useMemo(() => {
    if (!selectedDocType) return "";
    const baseTemplate = readyNoticeTemplates[selectedDocType] || "";
    const classAware = buildClassAwareTemplate({
      documentType: selectedDocType,
      documentLabel: selectedDocLabel,
      classId: effectiveNoticeClass,
      classLabel: selectedClassLabel,
      pack: effectiveTemplatePack,
    });
    return normalizeForComparison(baseTemplate) === normalizeForComparison(classAware)
      ? baseTemplate
      : `${classAware}\n\n${baseTemplate}`;
  }, [selectedDocType, selectedDocLabel, effectiveNoticeClass, selectedClassLabel, effectiveTemplatePack]);
  const supabaseAny = supabase as any;
  const getMcaAutoFixNotes = (
    issues: Array<{ issue: string; suggestion: string }>,
    suggestions: Array<{ title: string; suggestion: string; implemented: boolean }>,
  ) => {
    const issueNotes = issues.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = suggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  };

  const evaluateMcaDraftIssues = (
    content: string,
    qa?: DraftQA | null,
    mcaType?: string,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> => {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const hasChronologyTable =
      /\|\s*(Particulars|Event|Date|Compliance Event)\s*\|\s*(Section|Provision|Relevant Provision)\s*\|/i.test(content) &&
      /due date|due\/event date|statutory due date/i.test(content) &&
      /actual filing|actual date|action date|date of filing|filing date/i.test(content) &&
      /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);

    const hasOfficerDefenseTable =
      /\|\s*(Officer(?:\s+in\s+Default)?|Name of Officer)\s*\|\s*(Role\s*Period|Designation|Period of Responsibility)\s*\|/i.test(content) &&
      /\|\s*(Alleged Responsibility|Responsibility|Allegation|Role|Monitoring Compliance)\s*\|\s*(Mitigating Facts|Defense|Remarks|Explanation)\s*\|/i.test(content) &&
      /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);

    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    addIssue(
      !/section\s*454/i.test(content) || !/proviso to section 454|within 30 days|before issuance of notice|prior to issuance of notice|rectified before notice/i.test(content),
      "Missing or weak Section 454 proviso submission.",
      "Add a fact-dependent paragraph: if default was rectified before notice dated 15 January 2026 or within 30 days of service, seek proviso benefit under Section 454.",
    );
    addIssue(
      !hasChronologyTable,
      "Chronology table is missing or does not contain due vs actual filing/action fields.",
      "Include a chronology table with columns: Particulars, Section, Due/Event Date, Actual Filing/Action Date, SRN/Challan/Reference, Status.",
    );
    addIssue(
      !hasOfficerDefenseTable,
      "Officer-specific defense table is missing.",
      "Add officer table: Officer | Role Period | Alleged Responsibility | Mitigating Facts, with no-willful-default basis.",
    );
    addIssue(
      /\bwaive\b[^.\n]{0,60}\bpenalt/i.test(content) || /\babsolve\b[^.\n]{0,120}\bofficer/i.test(content),
      "Prayer wording is risky. Use 'drop or reduce penalty' language instead of 'waive/absolve'.",
      "Rewrite prayer to: 'drop or reduce penalty on the Company and officers in default based on role, conduct, and mitigating facts.'",
    );
    addIssue(
      /double jeopardy|maximum sequestration of penalties|total waiver/i.test(content),
      "Over-strong legal rhetoric detected; use calibrated proportionality language.",
      "Replace over-strong terms with proportionality wording tied to facts and rectification status.",
    );

    addIssue(
      /dated\s+15\s+january\s+2024/i.test(content),
      "Notice date mismatch detected (2024 found for this 2026 notice pattern).",
      "Correct all notice-date references to the actual notice date from the notice text.",
    );

    addIssue(
      /\[(insert|to be filled)[^\]]*\]/i.test(content),
      "Unresolved placeholders detected in draft.",
      "Replace [Insert ...] / [To be filled ...] placeholders with notice-specific facts before marking this draft as compliant.",
    );

    if (mcaType === "annual-filing-92-137" || /section\s*92|section\s*137|aoc-?4|mgt-?7/i.test(content)) {
      addIssue(
        !/aoc-?4/i.test(content) || !/mgt-?7/i.test(content),
        "Annual filing draft must explicitly cover both AOC-4 and MGT-7.",
        "Ensure chronology and legal submissions include both forms with due vs actual filing details.",
      );
    }

    if (includeQaGates) {
      const badDomainGates = Object.entries(qa?.domain_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Domain gate failed: ${gate}`,
          suggestion: "Regenerate with missing legal block and evidence-linked language for this gate.",
        }));
      items.push(...badDomainGates);

      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }
    return items;
  };

  const evaluateMcaAdvancedSuggestions = (
    content: string,
    mcaType?: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> => {
    const checks: Array<{ title: string; suggestion: string; implemented: boolean }> = [
      {
        title: "Strengthen Statutory Anchor",
        suggestion: "Add a focused paragraph on Section 454(3) discretion and proportionality linked to rectification facts.",
        implemented: /section\s*454(3)/i.test(content),
      },
      {
        title: "Improve Evidence Mapping",
        suggestion: "Add annexure-to-issue mapping so each rebuttal paragraph has a direct document anchor.",
        implemented: /annexure[-\s]*(a|1|i)/i.test(content),
      },
      {
        title: "Add Hearing Strategy",
        suggestion: "Include preferred hearing mode (VC/physical), authorized representative details, and concise hearing ask.",
        implemented: /hearing/i.test(content),
      },
      {
        title: "Individual Officer Positioning",
        suggestion: "Add role-period responsibility breakup to separate company lapse from individual officer conduct.",
        implemented: /officer/i.test(content),
      },
      {
        title: "Add Section 403 Framing",
        suggestion: "Explicitly tie delayed filing regularization to Section 403 with challan/SRN reference language.",
        implemented: mcaType !== "annual-filing-92-137" || /section\s*403/i.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Tighten chronology precision (exact due date vs actual date vs SRN) and prune generic statements.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
    return checks;
  };

  const liveMcaIssueItems = useMemo(
    () => evaluateMcaDraftIssues(draftContent || "", draftQA, inferredMcaReplyType, true),
    [draftContent, draftQA, inferredMcaReplyType],
  );

  const liveMcaAdvancedSuggestions = useMemo(
    () => evaluateMcaAdvancedSuggestions(draftContent || "", inferredMcaReplyType, draftQA),
    [draftContent, inferredMcaReplyType, draftQA],
  );

  const mcaAutoFixNotes = useMemo(
    () => getMcaAutoFixNotes(liveMcaIssueItems, liveMcaAdvancedSuggestions),
    [liveMcaIssueItems, liveMcaAdvancedSuggestions],
  );
  const mcaPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveMcaIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveMcaAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveMcaIssueItems, liveMcaAdvancedSuggestions]);

  const mcaPendingFixCount = useMemo(() => {
    const issueCount = liveMcaIssueItems.length;
    const advancedPending = liveMcaAdvancedSuggestions.filter((item) => !item.implemented).length;
    return issueCount + advancedPending;
  }, [liveMcaIssueItems, liveMcaAdvancedSuggestions]);
  const mcaRecheckNotes = useMemo(
    () => (mcaRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\nFix: ${flag.fix}`)
      .join("\n\n"),
    [mcaRecheckReport],
  );
  const liveGstIssueItems = useMemo(
    () => evaluateGstDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveGstAdvancedSuggestions = useMemo(
    () => evaluateGstAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const gstComputedIssueReport: GstIssueReport = useMemo(() => ({
    ok: liveGstIssueItems.length === 0,
    items: liveGstIssueItems,
    issues: liveGstIssueItems.map((item) => item.issue),
    checkedAt: gstLastCheckedAt || new Date().toISOString(),
  }), [liveGstIssueItems, gstLastCheckedAt]);

  const gstAutoFixNotes = useMemo(() => {
    const issueNotes = liveGstIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveGstAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveGstIssueItems, liveGstAdvancedSuggestions]);

  const gstPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveGstIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveGstAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveGstIssueItems, liveGstAdvancedSuggestions]);

  const gstPendingFixCount = useMemo(
    () => liveGstIssueItems.length + liveGstAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveGstIssueItems, liveGstAdvancedSuggestions],
  );

  const liveIncomeTaxIssueItems = useMemo(
    () => evaluateIncomeTaxDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveIncomeTaxAdvancedSuggestions = useMemo(
    () => evaluateIncomeTaxAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const incomeTaxComputedIssueReport: IncomeTaxIssueReport = useMemo(() => ({
    ok: liveIncomeTaxIssueItems.length === 0,
    items: liveIncomeTaxIssueItems,
    issues: liveIncomeTaxIssueItems.map((item) => item.issue),
    checkedAt: incomeTaxLastCheckedAt || new Date().toISOString(),
  }), [liveIncomeTaxIssueItems, incomeTaxLastCheckedAt]);

  const incomeTaxAutoFixNotes = useMemo(() => {
    const issueNotes = liveIncomeTaxIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveIncomeTaxAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveIncomeTaxIssueItems, liveIncomeTaxAdvancedSuggestions]);

  const incomeTaxPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveIncomeTaxIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveIncomeTaxAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveIncomeTaxIssueItems, liveIncomeTaxAdvancedSuggestions]);

  const incomeTaxPendingFixCount = useMemo(
    () => liveIncomeTaxIssueItems.length + liveIncomeTaxAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveIncomeTaxIssueItems, liveIncomeTaxAdvancedSuggestions],
  );

  function evaluateRbiDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasTimelineTable = /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasRegulationAnchors = /\bfema\b|\brbi\b|regulation\s*\d+|master direction|authorized dealer/i.test(content);
    const hasComputation = /accepted\s*\|\s*disputed|computation|exposure|lsf|penalty/i.test(content)
      && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasEvidenceMapping = /annexure|ad bank|utr|board resolution|filing acknowledgement|return acknowledgement/i.test(content);

    addIssue(
      !hasTimelineTable,
      "RBI/FEMA chronology timeline table is missing.",
      "Add timeline table: Compliance Event | Invoked Regulation | Due/Event Date | Actual Filing/Action Date | Reference ID | Status.",
    );
    addIssue(
      !hasRegulationAnchors,
      "RBI/FEMA regulation anchors are weak or missing.",
      "Map each allegation to invoked FEMA/RBI regulation/circular with concise legal framing.",
    );
    addIssue(
      !hasComputation,
      "Exposure/penalty/LSF computation table is missing.",
      "Add accepted vs disputed exposure table and recomputation rationale.",
    );
    addIssue(
      !hasEvidenceMapping,
      "Evidence mapping is weak for RBI draft.",
      "Add annexure mapping with AD bank certificates, filing acknowledgements, and control records.",
    );
    addIssue(
      /\bwaive\b[^.\n]{0,70}\bpenalt/i.test(content) || /\babsolve\b/i.test(content),
      "Risky prayer wording detected.",
      "Use calibrated wording: drop or reduce unsustainable penalty based on facts and proportionality.",
    );
    addIssue(
      /\[(insert|to be filled)[^\]]*\]/i.test(content),
      "Unresolved placeholders detected in RBI draft.",
      "Replace placeholders with notice-specific data before final filing.",
    );

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }

    return items;
  }

  function evaluateRbiAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    return [
      {
        title: "Strengthen FEMA/RBI Regulation Anchoring",
        suggestion: "Tie each allegation to specific FEMA regulation/RBI circular text used in notice.",
        implemented: /\bfema\b|\brbi\b|regulation\s*\d+|master direction/i.test(content),
      },
      {
        title: "Improve Timeline Precision",
        suggestion: "Add due/event date vs actual filing/action dates with reference IDs.",
        implemented: /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content),
      },
      {
        title: "Exposure Reconciliation Quality",
        suggestion: "Add accepted vs disputed exposure/LSF/penalty computation table.",
        implemented: /accepted\s*\|\s*disputed|computation|lsf|exposure/i.test(content),
      },
      {
        title: "Evidence-Anchored Defense",
        suggestion: "Map AD bank records, acknowledgements, and board/control docs to each rebuttal.",
        implemented: /annexure|ad bank|utr|acknowledgement|board resolution/i.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Tighten regulation-wise factual mapping and remove generic repetitive language.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
  }

  const liveRbiIssueItems = useMemo(
    () => evaluateRbiDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveRbiAdvancedSuggestions = useMemo(
    () => evaluateRbiAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const rbiComputedIssueReport: RbiIssueReport = useMemo(() => ({
    ok: liveRbiIssueItems.length === 0,
    items: liveRbiIssueItems,
    issues: liveRbiIssueItems.map((item) => item.issue),
    checkedAt: rbiLastCheckedAt || new Date().toISOString(),
  }), [liveRbiIssueItems, rbiLastCheckedAt]);

  const rbiAutoFixNotes = useMemo(() => {
    const issueNotes = liveRbiIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveRbiAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveRbiIssueItems, liveRbiAdvancedSuggestions]);

  const rbiPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveRbiIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveRbiAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveRbiIssueItems, liveRbiAdvancedSuggestions]);

  const rbiPendingFixCount = useMemo(
    () => liveRbiIssueItems.length + liveRbiAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveRbiIssueItems, liveRbiAdvancedSuggestions],
  );

  function evaluateSebiDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasAllegationMatrix = /allegation[-\s]*wise rebuttal|issue[-\s]*wise rebuttal/i.test(content)
      || /\|\s*Allegation\s*\|\s*Department Position\s*\|\s*(Noticee|Entity) Rebuttal\s*\|/i.test(content);
    const hasTimelineTable = /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasRegulationAnchors = /\bsebi\b|lodr|pit|sast|icdr|regulation\s*\d+/i.test(content);
    const hasEvidenceMapping = /annexure|exchange filing|board minutes|disclosure copy|intimation/i.test(content);
    const hasPrayerSafety = !/\bwaive\b[^.\n]{0,70}\bpenalt/i.test(content) && !/\babsolve\b/i.test(content);

    addIssue(
      !hasAllegationMatrix,
      "SEBI allegation-wise rebuttal matrix is missing.",
      "Add matrix: Allegation | Department Position | Noticee Rebuttal | Evidence | Relief Sought.",
    );
    addIssue(
      !hasTimelineTable,
      "SEBI compliance timeline table is missing.",
      "Add timeline table: Compliance Event | Invoked Regulation | Due/Event Date | Actual Disclosure/Action Date | Reference | Status.",
    );
    addIssue(
      !hasRegulationAnchors,
      "SEBI regulation anchors are weak or missing.",
      "Map each allegation to invoked SEBI regulation/circular (LODR/PIT/SAST/ICDR etc.) with concise legal framing.",
    );
    addIssue(
      !hasEvidenceMapping,
      "Evidence/annexure mapping is weak for SEBI draft.",
      "Add annexure mapping to exchange filings, board records, disclosure proofs, and correspondence.",
    );
    addIssue(
      !hasPrayerSafety,
      "Risky prayer wording detected.",
      "Use calibrated wording: drop or reduce proposed action/penalty based on facts and proportionality.",
    );
    addIssue(
      /\[(insert|to be filled)[^\]]*\]/i.test(content),
      "Unresolved placeholders detected in SEBI draft.",
      "Replace placeholders with notice-specific data before final filing.",
    );

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }

    return items;
  }

  function evaluateSebiAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    return [
      {
        title: "Strengthen Regulation Mapping",
        suggestion: "Tie each allegation to specific SEBI regulations invoked in notice with fact-led rebuttal.",
        implemented: /\bsebi\b|lodr|pit|sast|icdr|regulation\s*\d+/i.test(content),
      },
      {
        title: "Improve Disclosure Timeline Precision",
        suggestion: "Add due/event vs actual disclosure/action dates with exchange reference IDs.",
        implemented: /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content),
      },
      {
        title: "Add Governance-Control Narrative",
        suggestion: "Include board-approved corrective controls and investor-impact mitigation framing.",
        implemented: /governance|board|control|investor/i.test(content),
      },
      {
        title: "Evidence-Anchored Defense",
        suggestion: "Map each rebuttal to annexure evidence (exchange filing, board minutes, disclosure proofs).",
        implemented: /annexure|exchange filing|board minutes|disclosure copy/i.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Tighten regulation-wise legal/factual mapping and remove repetitive generic language.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
  }

  const liveSebiIssueItems = useMemo(
    () => evaluateSebiDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveSebiAdvancedSuggestions = useMemo(
    () => evaluateSebiAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const sebiComputedIssueReport: SebiIssueReport = useMemo(() => ({
    ok: liveSebiIssueItems.length === 0,
    items: liveSebiIssueItems,
    issues: liveSebiIssueItems.map((item) => item.issue),
    checkedAt: sebiLastCheckedAt || new Date().toISOString(),
  }), [liveSebiIssueItems, sebiLastCheckedAt]);

  const sebiAutoFixNotes = useMemo(() => {
    const issueNotes = liveSebiIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveSebiAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveSebiIssueItems, liveSebiAdvancedSuggestions]);

  const sebiPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveSebiIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveSebiAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveSebiIssueItems, liveSebiAdvancedSuggestions]);

  const sebiPendingFixCount = useMemo(
    () => liveSebiIssueItems.length + liveSebiAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveSebiIssueItems, liveSebiAdvancedSuggestions],
  );

  function evaluateCustomsDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasMatrix = /allegation[-\s]*wise rebuttal|issue[-\s]*wise rebuttal/i.test(content)
      || /\|\s*Allegation\s*\|\s*Department Position\s*\|\s*(Noticee|Entity) Rebuttal\s*\|/i.test(content);
    const hasTimeline = /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasSectionAnchor = /\bsection\s*28\b|\bsection\s*28aa\b|\bsection\s*111\b|\bsection\s*112\b|\bsection\s*114a\b|\bsection\s*125\b/i.test(content);
    const hasComputation = /duty|interest|penalty|redemption fine|accepted\s*\|\s*disputed|computation/i.test(content);
    const hasEvidence = /annexure|bill of entry|boe|invoice|coo|test report|valuation/i.test(content);

    addIssue(!hasMatrix, "Customs allegation-wise rebuttal matrix is missing.", "Add matrix: Allegation | Department Position | Noticee Rebuttal | Evidence | Relief Sought.");
    addIssue(!hasTimeline, "Customs chronology/timeline table is missing.", "Add chronology table with event date vs action date and reference IDs.");
    addIssue(!hasSectionAnchor, "Customs section anchors are weak or missing.", "Anchor each key submission to invoked Customs provisions from notice.");
    addIssue(!hasComputation, "Duty/interest/penalty/fine computation rebuttal is missing.", "Add accepted-vs-disputed computation table with recalculation basis.");
    addIssue(!hasEvidence, "Evidence/annexure mapping is weak for customs draft.", "Map BoE, invoices, valuation documents, CoO/test reports and supporting evidence.");
    addIssue(/\bwaive\b[^.\n]{0,70}\bpenalt/i.test(content) || /\babsolve\b/i.test(content), "Risky prayer wording detected.", "Use calibrated wording: drop or reduce unsustainable demand/penalty.");
    addIssue(/\[(insert|to be filled)[^\]]*\]/i.test(content), "Unresolved placeholders detected in customs draft.", "Replace placeholders with notice-specific data before filing.");

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }

    return items;
  }

  function evaluateCustomsAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    return [
      {
        title: "Strengthen Provision Anchoring",
        suggestion: "Tie each allegation to invoked Customs Act sections/rules in notice with factual rebuttal.",
        implemented: /\bsection\s*28\b|\bsection\s*111\b|\bsection\s*112\b|\bsection\s*114a\b|\bsection\s*125\b/i.test(content),
      },
      {
        title: "Improve Duty Computation Reconciliation",
        suggestion: "Add accepted-vs-disputed duty/interest/penalty/fine table with recalculation basis.",
        implemented: /accepted\s*\|\s*disputed|duty|interest|penalty|redemption fine|computation/i.test(content),
      },
      {
        title: "Evidence-Anchored Defense",
        suggestion: "Map every major rebuttal to annexure evidence (BoE, invoices, valuation docs, CoO/test reports).",
        implemented: /annexure|bill of entry|boe|invoice|coo|test report/i.test(content),
      },
      {
        title: "Timeline Precision",
        suggestion: "Add event-date vs action-date chronology with reference IDs and filing trail.",
        implemented: /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Tighten issue-wise legal/factual mapping and remove repetitive generic language.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
  }

  const liveCustomsIssueItems = useMemo(
    () => evaluateCustomsDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveCustomsAdvancedSuggestions = useMemo(
    () => evaluateCustomsAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const customsComputedIssueReport: CustomsIssueReport = useMemo(() => ({
    ok: liveCustomsIssueItems.length === 0,
    items: liveCustomsIssueItems,
    issues: liveCustomsIssueItems.map((item) => item.issue),
    checkedAt: customsLastCheckedAt || new Date().toISOString(),
  }), [liveCustomsIssueItems, customsLastCheckedAt]);

  const customsAutoFixNotes = useMemo(() => {
    const issueNotes = liveCustomsIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveCustomsAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveCustomsIssueItems, liveCustomsAdvancedSuggestions]);

  const customsPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveCustomsIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveCustomsAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveCustomsIssueItems, liveCustomsAdvancedSuggestions]);

  const customsPendingFixCount = useMemo(
    () => liveCustomsIssueItems.length + liveCustomsAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveCustomsIssueItems, liveCustomsAdvancedSuggestions],
  );

  function evaluateContractDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasClauseMatrix = /clause[-\s]*wise risk/i.test(content) || /\|\s*Clause\s*\|\s*Risk\s*\|\s*Recommendation\s*\|/i.test(content);
    const hasNegotiation = /fallback position|negotiation position|counter[-\s]*proposal/i.test(content);
    const hasRedline = /redline|suggested drafting language|replacement language/i.test(content);
    const hasDispute = /arbitration|governing law|jurisdiction|dispute resolution/i.test(content);
    const hasCommercialImpact = /commercial impact|financial exposure|liability cap|risk ranking/i.test(content);

    addIssue(!hasClauseMatrix, "Clause-wise risk matrix is missing.", "Add table: Clause | Risk | Why risky | Proposed revision | Priority.");
    addIssue(!hasNegotiation, "Negotiation fallback positions are missing.", "Add primary + fallback negotiation positions for high-risk clauses.");
    addIssue(!hasRedline, "Redline-ready suggested language is missing.", "Add concrete replacement language for key risky clauses.");
    addIssue(!hasDispute, "Dispute-resolution/governing-law review is weak.", "Add arbitration, governing law, jurisdiction assessment with recommendation.");
    addIssue(!hasCommercialImpact, "Commercial exposure/risk ranking is weak.", "Add quantified or tiered risk impact analysis.");
    addIssue(/\[(insert|to be filled)[^\]]*\]/i.test(content), "Unresolved placeholders detected in contract review output.", "Replace unresolved placeholders before final client delivery.");

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }
    return items;
  }

  function evaluateContractAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    return [
      {
        title: "Strengthen Clause-Level Legal Framing",
        suggestion: "Map each risky clause to enforceability rationale and practical downside.",
        implemented: /enforceability|legal position|risk rationale/i.test(content),
      },
      {
        title: "Add Structured Redline Pack",
        suggestion: "Provide replacement language for indemnity, liability cap, termination, and dispute clauses.",
        implemented: /redline|replacement language|draft wording/i.test(content),
      },
      {
        title: "Improve Negotiation Strategy",
        suggestion: "Include primary ask, fallback ask, and walk-away threshold for each critical clause.",
        implemented: /fallback position|walk-away|negotiation position/i.test(content),
      },
      {
        title: "Commercial Risk Quantification",
        suggestion: "Add exposure prioritization (P1/P2/P3) with business impact summary.",
        implemented: /p1|p2|p3|commercial impact|financial exposure/i.test(content),
      },
      {
        title: "Raise Review-Readiness Score",
        suggestion: "Tighten clause references and remove repetitive generic observations.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
  }

  const liveContractIssueItems = useMemo(
    () => evaluateContractDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveContractAdvancedSuggestions = useMemo(
    () => evaluateContractAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const contractComputedIssueReport: ContractIssueReport = useMemo(() => ({
    ok: liveContractIssueItems.length === 0,
    items: liveContractIssueItems,
    issues: liveContractIssueItems.map((item) => item.issue),
    checkedAt: contractLastCheckedAt || new Date().toISOString(),
  }), [liveContractIssueItems, contractLastCheckedAt]);

  const contractAutoFixNotes = useMemo(() => {
    const issueNotes = liveContractIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveContractAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveContractIssueItems, liveContractAdvancedSuggestions]);

  const contractPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveContractIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveContractAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveContractIssueItems, liveContractAdvancedSuggestions]);

  const contractPendingFixCount = useMemo(
    () => liveContractIssueItems.length + liveContractAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveContractIssueItems, liveContractAdvancedSuggestions],
  );

  function evaluateCustomDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasMatrix = /allegation[-\s]*wise rebuttal|issue[-\s]*wise rebuttal|para[-\s]*wise rebuttal/i.test(content)
      || /\|\s*Issue\s*\|\s*Department Position\s*\|\s*(Noticee|Entity) Rebuttal\s*\|/i.test(content);
    const hasTimeline = /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasProvisionAnchor = /\bsection\s*\d+|rule\s*\d+|regulation\s*\d+/i.test(content);
    const hasComputation = /accepted\s*\|\s*disputed|computation|tax|duty|interest|penalty|exposure/i.test(content);
    const hasEvidence = /annexure|evidence|document/i.test(content);

    addIssue(!hasMatrix, "Issue/allegation-wise rebuttal matrix is missing.", "Add matrix: Issue/Allegation | Department Position | Noticee Rebuttal | Evidence | Relief.");
    addIssue(!hasTimeline, "Chronology/timeline table is missing.", "Add chronology table with event date vs action date and reference IDs.");
    addIssue(!hasProvisionAnchor, "Provision anchors are weak/missing.", "Anchor each key submission to invoked sections/rules/regulations from notice.");
    addIssue(!hasComputation, "Computation/exposure reconciliation is weak.", "Add accepted-vs-disputed computation table with recalculation basis.");
    addIssue(!hasEvidence, "Evidence/annexure mapping is weak.", "Map each major rebuttal to supporting documentary evidence.");
    addIssue(/\bwaive\b[^.\n]{0,70}\bpenalt/i.test(content) || /\babsolve\b/i.test(content), "Risky prayer wording detected.", "Use calibrated wording: drop or reduce unsustainable demand/penalty.");
    addIssue(/\[(insert|to be filled)[^\]]*\]/i.test(content), "Unresolved placeholders detected in custom draft.", "Replace placeholders with notice-specific data before filing.");

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }

    return items;
  }

  function evaluateCustomAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    return [
      {
        title: "Strengthen Provision Anchoring",
        suggestion: "Tie each allegation to invoked sections/rules/regulations in notice with factual rebuttal.",
        implemented: /\bsection\s*\d+|rule\s*\d+|regulation\s*\d+/i.test(content),
      },
      {
        title: "Improve Computation Reconciliation",
        suggestion: "Add accepted-vs-disputed exposure table with recalculation basis.",
        implemented: /accepted\s*\|\s*disputed|computation|tax|duty|interest|penalty|exposure/i.test(content),
      },
      {
        title: "Evidence-Anchored Defense",
        suggestion: "Map every major rebuttal to annexure evidence and documentary references.",
        implemented: /annexure|evidence|document/i.test(content),
      },
      {
        title: "Timeline Precision",
        suggestion: "Add event-date vs action-date chronology with reference IDs and filing trail.",
        implemented: /timeline|chronology/i.test(content) && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Tighten issue-wise legal/factual mapping and remove repetitive generic language.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
  }

  const liveCustomIssueItems = useMemo(
    () => evaluateCustomDraftIssues(draftContent || "", draftQA, true),
    [draftContent, draftQA],
  );

  const liveCustomAdvancedSuggestions = useMemo(
    () => evaluateCustomAdvancedSuggestions(draftContent || "", draftQA),
    [draftContent, draftQA],
  );

  const customComputedIssueReport: CustomIssueReport = useMemo(() => ({
    ok: liveCustomIssueItems.length === 0,
    items: liveCustomIssueItems,
    issues: liveCustomIssueItems.map((item) => item.issue),
    checkedAt: customLastCheckedAt || new Date().toISOString(),
  }), [liveCustomIssueItems, customLastCheckedAt]);

  const customAutoFixNotes = useMemo(() => {
    const issueNotes = liveCustomIssueItems.map((item, idx) => `${idx + 1}. ${item.issue}\nSuggestion: ${item.suggestion}`);
    const pendingAdvanced = liveCustomAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1 + issueNotes.length}. ${item.title}\nSuggestion: ${item.suggestion}`);
    return [...issueNotes, ...pendingAdvanced].join("\n\n");
  }, [liveCustomIssueItems, liveCustomAdvancedSuggestions]);

  const customPendingFixPlaybook = useMemo(() => {
    const issuePlaybook = liveCustomIssueItems.map((item) => ({
      title: item.issue,
      solution: item.suggestion,
    }));
    const advancedPlaybook = liveCustomAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item) => ({
        title: item.title,
        solution: item.suggestion,
      }));
    return [...issuePlaybook, ...advancedPlaybook];
  }, [liveCustomIssueItems, liveCustomAdvancedSuggestions]);

  const customPendingFixCount = useMemo(
    () => liveCustomIssueItems.length + liveCustomAdvancedSuggestions.filter((item) => !item.implemented).length,
    [liveCustomIssueItems, liveCustomAdvancedSuggestions],
  );

  const enforceMcaLocalFallback = (rawContent: string, mcaType?: string) => {
    let content = rawContent || "";

    content = content
      .replace(/\bwaive\b[^.\n]{0,60}\bpenalt/gi, "drop or reduce penalty")
      .replace(/\babsolve\b[^.\n]{0,120}\bofficer[s]?|personal liability/gi, "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts");

    const hasChronologyTable =
      /\|\s*(Particulars|Event|Date)\s*\|\s*(Section|Provision)\s*\|/i.test(content) &&
      /due date|due\/event date|statutory due date/i.test(content) &&
      /actual filing|actual date|action date|date of filing|filing date/i.test(content);

    if (!hasChronologyTable) {
      const chronologyRows = mcaType === "annual-filing-92-137"
        ? `| Financial Statements (AOC-4) | 137 | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Rectified |
| Annual Return (MGT-7) | 92 | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Rectified |`
        : `| Compliance event 1 | [Invoked Section] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Rectified |
| Compliance event 2 | [Invoked Section] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Rectified |`;

      content += `\n\n### Chronology of Compliance\n| Particulars | Section | Due/Event Date | Actual Filing/Action Date | SRN/Challan/Reference | Status |\n|---|---|---|---|---|---|\n${chronologyRows}`;
    }

    const has454Proviso = /section\s*454/i.test(content) && /proviso to section 454|within 30 days|before notice dated|before issuance of notice/i.test(content);
    if (!has454Proviso) {
      content += `\n\n### Section 454 Proviso (Fact-Dependent)\nWithout prejudice, if the default stood rectified before issuance of notice dated 15 January 2026, or within 30 days from notice service, the Noticee seeks consideration under the proviso to Section 454, subject to statutory satisfaction.`;
    }

    const hasOfficerDefenseTable =
      /\|\s*Officer(?:\s+in\s+Default)?\s*\|\s*Role\s*Period\s*\|/i.test(content) &&
      /\|\s*(Alleged Responsibility|Responsibility|Allegation)\s*\|\s*(Mitigating Facts|Defense|Remarks)\s*\|/i.test(content);

    if (!hasOfficerDefenseTable) {
      content += `\n\n### Officer-Specific Defense\n| Officer | Role Period | Alleged Responsibility | Mitigating Facts |\n|---|---|---|---|\n| [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | No willful default; delay was procedural and corrected in good faith. |`;
    }

    return content;
  };

  const enforceMcaHardFixes = (rawContent: string, noticeText: string, mcaType?: string) => {
    let content = rawContent || "";
    const noticeDate = extractNoticeDateFromText(noticeText);

    // Date normalization for notice references.
    content = content.replace(
      /(Notice\s*(?:No\.?|number)?[^\n]{0,120}?dated\s+)([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/gi,
      `$1${noticeDate}`,
    );

    // Hard language normalization.
    content = content
      .replace(/\bwaive\b[^.\n]{0,80}\bpenalt/gi, "drop or reduce penalty")
      .replace(/\bimpose\s+no\s+penalty\b/gi, "drop or reduce penalty")
      .replace(/\babsolve\b[^.\n]{0,140}\bofficer[s]?|personal liability/gi, "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts")
      .replace(/double jeopardy/gi, "disproportionate duplication of monetary burden for a procedural lapse");

    // Ensure 454 proviso anchor.
    if (!/proviso to section 454|within 30 days|before issuance of notice|before notice dated/i.test(content)) {
      content += `\n\n### Section 454 Proviso (Fact-Dependent)\nWithout prejudice, if the default stood rectified before issuance of notice dated ${noticeDate}, or within 30 days from notice service, the Noticee seeks consideration under the proviso to Section 454, subject to statutory satisfaction.`;
    }

    // Ensure annual filing forms explicitly covered.
    if ((mcaType === "annual-filing-92-137" || /section\s*92|section\s*137/i.test(content)) && (!/aoc-?4/i.test(content) || !/mgt-?7/i.test(content))) {
      content += `\n\nThe Noticee confirms that compliance discussion above covers both Form AOC-4 (Section 137) and Form MGT-7 (Section 92), with due and actual filing references to be read with chronology records and annexures.`;
    }

    return enforceMcaLocalFallback(content, mcaType);
  };

  const mcaComputedIssueReport: McaIssueReport = useMemo(() => ({
    ok: liveMcaIssueItems.length === 0,
    items: liveMcaIssueItems,
    issues: liveMcaIssueItems.map((item) => item.issue),
    advancedSuggestions: liveMcaAdvancedSuggestions,
    checkedAt: mcaLastCheckedAt || new Date().toISOString(),
  }), [liveMcaIssueItems, liveMcaAdvancedSuggestions, mcaLastCheckedAt]);

  const runMcaDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateMcaDraftIssues(content, effectiveQa, inferredMcaReplyType, true);
    setMcaHasChecked(true);
    setMcaLastCheckedAt(new Date().toISOString());
  };

  function evaluateGstDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasParaWise = /para[-\s]*wise rebuttal|allegation[-\s]*wise rebuttal/i.test(content)
      || /\|\s*Allegation\s*\|\s*Department Position\s*\|\s*Noticee Rebuttal\s*\|/i.test(content);
    const hasComputation = /accepted\s*\|\s*disputed|computation|reconciliation/i.test(content)
      && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasGstContext = /\bGSTR-?3B\b|\bGSTR-?2B\b|\bITC\b|\bDRC-?01\b/i.test(content);

    addIssue(
      !hasParaWise,
      "GST para-wise rebuttal matrix is missing.",
      "Add allegation-wise matrix: Allegation | Department Position | Noticee Rebuttal | Evidence.",
    );
    addIssue(
      !hasComputation,
      "GST computation/reconciliation table is missing.",
      "Add accepted vs disputed table for tax, interest, and penalty with reconciliation basis.",
    );
    addIssue(
      !hasGstContext,
      "GST context (GSTR/ITC/DRC references) is weak.",
      "Add GSTR-3B/GSTR-2B/ITC or DRC references where relevant to allegations.",
    );
    addIssue(
      /\bwaive\b[^.\n]{0,70}\bpenalt/i.test(content) || /\babsolve\b/i.test(content),
      "Risky prayer wording detected.",
      "Use calibrated wording: drop or reduce unsustainable penalty based on facts and law.",
    );
    addIssue(
      /\[(insert|to be filled)[^\]]*\]/i.test(content),
      "Unresolved placeholders detected in GST draft.",
      "Replace placeholders with notice-specific data before final filing.",
    );

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }

    return items;
  }

  function evaluateGstAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    const checks: Array<{ title: string; suggestion: string; implemented: boolean }> = [
      {
        title: "Strengthen Statutory Section Anchor",
        suggestion: "Explicitly anchor invoked sections/rules with allegation-wise legal analysis.",
        implemented: /(section\s*73|section\s*74|section\s*16|section\s*50|rule\s*36|rule\s*42)/i.test(content),
      },
      {
        title: "Improve GST Return Linkage",
        suggestion: "Map allegations to GSTR-3B, GSTR-2B, ITC trail, and DRC references where applicable.",
        implemented: /\bGSTR-?3B\b|\bGSTR-?2B\b|\bITC\b|\bDRC-?01\b/i.test(content),
      },
      {
        title: "Evidence-Anchored Rebuttal",
        suggestion: "Add annexure-linked evidence anchors for each major rebuttal point.",
        implemented: /annexure[-\s]*(a|1|i)/i.test(content),
      },
      {
        title: "Hearing Strategy",
        suggestion: "Include explicit personal hearing request and authority to submit further records.",
        implemented: /personal hearing|grant hearing|opportunity of hearing/i.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Tighten accepted-vs-disputed computation table and remove generic repetitive language.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
    return checks;
  }

  function evaluateIncomeTaxDraftIssues(
    content: string,
    qa?: DraftQA | null,
    includeQaGates = true,
  ): Array<{ issue: string; suggestion: string }> {
    const items: Array<{ issue: string; suggestion: string }> = [];
    const addIssue = (condition: boolean, issue: string, suggestion: string) => {
      if (condition) items.push({ issue, suggestion });
    };

    const hasIssueMatrix = /issue[-\s]*wise|addition\/disallowance matrix|para[-\s]*wise rebuttal/i.test(content)
      || /\|\s*(Issue|Addition|Disallowance)\s*\|\s*(AO\/Department Position|Department Position)\s*\|\s*(Assessee Rebuttal|Noticee Rebuttal)\s*\|/i.test(content);
    const hasComputation = /tax effect|addition amount|accepted\s*\|\s*disputed|computation|reconciliation/i.test(content)
      && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(content);
    const hasIncomeTaxContext = /\b143\(?2\)?\b|\b147\b|\b148\b|\b139\b|\b40\(a\)\(ia\)\b|\b201\b|\b270a\b|\b69a?\b|\bassessee\b|\bao\b/i.test(content);

    addIssue(
      !hasIssueMatrix,
      "Income-tax issue-wise rebuttal matrix is missing.",
      "Add matrix: Issue/Addition | AO Position | Assessee Rebuttal | Evidence | Relief Sought.",
    );
    addIssue(
      !hasComputation,
      "Income-tax computation/tax-effect table is missing.",
      "Add accepted vs disputed computation table with addition amount, tax effect, and basis of dispute.",
    );
    addIssue(
      !hasIncomeTaxContext,
      "Income-tax statutory context is weak.",
      "Add invoked section anchors (143(2)/147/148/201/40(a)(ia)/270A etc.) as applicable from notice.",
    );
    addIssue(
      /\bwaive\b[^.\n]{0,70}\bpenalt/i.test(content) || /\babsolve\b/i.test(content),
      "Risky prayer wording detected.",
      "Use calibrated wording: drop or reduce unsustainable additions/penalty based on facts and law.",
    );
    addIssue(
      /\[(insert|to be filled)[^\]]*\]/i.test(content),
      "Unresolved placeholders detected in income-tax draft.",
      "Replace placeholders with notice-specific data before final filing.",
    );

    if (includeQaGates) {
      const badMandatoryGates = Object.entries(qa?.mandatory_gates || {})
        .filter(([, passed]) => !passed)
        .map(([gate]) => ({
          issue: `Mandatory gate failed: ${gate}`,
          suggestion: "Add the missing mandatory section and re-run draft checks.",
        }));
      items.push(...badMandatoryGates);
    }

    return items;
  }

  function evaluateIncomeTaxAdvancedSuggestions(
    content: string,
    qa?: DraftQA | null,
  ): Array<{ title: string; suggestion: string; implemented: boolean }> {
    return [
      {
        title: "Strengthen Invoked Section Anchoring",
        suggestion: "Explicitly tie each addition/disallowance to invoked Income-tax section and factual rebuttal.",
        implemented: /\b143\(?2\)?\b|\b147\b|\b148\b|\b201\b|\b40\(a\)\(ia\)\b|\b270a\b/i.test(content),
      },
      {
        title: "Evidence-Anchored Additions Rebuttal",
        suggestion: "Add annexure links for each issue-wise rebuttal point and tax-effect challenge.",
        implemented: /annexure[-\s]*(a|1|i)/i.test(content),
      },
      {
        title: "Tax-Effect Precision",
        suggestion: "Add accepted vs disputed table for additions, tax impact, interest, and penalty.",
        implemented: /tax effect|accepted\s*\|\s*disputed|computation|reconciliation/i.test(content),
      },
      {
        title: "Hearing Strategy",
        suggestion: "Include explicit personal hearing request and right to submit additional evidence.",
        implemented: /personal hearing|grant hearing|opportunity of hearing/i.test(content),
      },
      {
        title: "Raise Filing-Readiness Score",
        suggestion: "Remove repetitive generic language and tighten issue-wise factual/legal mapping.",
        implemented: (qa?.filing_score ?? 100) >= 95,
      },
    ];
  }

  const runGstDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateGstDraftIssues(content, effectiveQa, true);
    setGstHasChecked(true);
    setGstLastCheckedAt(new Date().toISOString());
  };

  const runIncomeTaxDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateIncomeTaxDraftIssues(content, effectiveQa, true);
    setIncomeTaxHasChecked(true);
    setIncomeTaxLastCheckedAt(new Date().toISOString());
  };

  const runRbiDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateRbiDraftIssues(content, effectiveQa, true);
    setRbiHasChecked(true);
    setRbiLastCheckedAt(new Date().toISOString());
  };

  const runSebiDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateSebiDraftIssues(content, effectiveQa, true);
    setSebiHasChecked(true);
    setSebiLastCheckedAt(new Date().toISOString());
  };

  const runCustomsDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateCustomsDraftIssues(content, effectiveQa, true);
    setCustomsHasChecked(true);
    setCustomsLastCheckedAt(new Date().toISOString());
  };

  const runContractDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateContractDraftIssues(content, effectiveQa, true);
    setContractHasChecked(true);
    setContractLastCheckedAt(new Date().toISOString());
  };

  const runCustomDraftIssueCheck = (contentOverride?: string, qaOverride?: DraftQA | null) => {
    const content = contentOverride ?? draftContent ?? "";
    const effectiveQa = qaOverride ?? draftQA;
    evaluateCustomDraftIssues(content, effectiveQa, true);
    setCustomHasChecked(true);
    setCustomLastCheckedAt(new Date().toISOString());
  };

  const handleRecheckMcaDraft = async () => {
    if (selectedDocType !== "mca-notice" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit an MCA draft first.");
      return;
    }

    setIsRecheckingMca(true);
    try {
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "mca-notice",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: mcaTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: mcaEvidenceContext || undefined,
        mcaReplyTypeOverride: mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : undefined,
        stream: false,
      });

      const report: McaRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setMcaRecheckReport(report);

      if (report.ok) toast.success("Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingMca(false);
    }
  };

  const handleRecheckGstDraft = async () => {
    if (selectedDocType !== "gst-show-cause" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit a GST draft first.");
      return;
    }

    setIsRecheckingGst(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "gst-show-cause",
        gstReplyTypeOverride: gstReplyTypeOverride !== "auto" ? gstReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: gstTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: gstEvidenceContext || undefined,
        stream: false,
      });

      const report: GstRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setGstRecheckReport(report);

      if (report.ok) toast.success("GST Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`GST Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "GST Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingGst(false);
    }
  };

  const handleRecheckIncomeTaxDraft = async () => {
    if (selectedDocType !== "income-tax-response" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit an Income-tax draft first.");
      return;
    }

    setIsRecheckingIncomeTax(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "income-tax-response",
        incomeTaxReplyTypeOverride: incomeTaxReplyTypeOverride !== "auto" ? incomeTaxReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: incomeTaxTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: incomeTaxEvidenceContext || undefined,
        stream: false,
      });

      const report: IncomeTaxRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setIncomeTaxRecheckReport(report);

      if (report.ok) toast.success("Income-tax Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`Income-tax Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Income-tax Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingIncomeTax(false);
    }
  };

  const handleRecheckRbiDraft = async () => {
    if (selectedDocType !== "rbi-filing" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit an RBI draft first.");
      return;
    }

    setIsRecheckingRbi(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "rbi-filing",
        rbiReplyTypeOverride: rbiReplyTypeOverride !== "auto" ? rbiReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: rbiTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: rbiEvidenceContext || undefined,
        stream: false,
      });

      const report: RbiRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setRbiRecheckReport(report);

      if (report.ok) toast.success("RBI Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`RBI Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "RBI Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingRbi(false);
    }
  };

  const handleRecheckSebiDraft = async () => {
    if (selectedDocType !== "sebi-compliance" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit a SEBI draft first.");
      return;
    }

    setIsRecheckingSebi(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "sebi-compliance",
        sebiReplyTypeOverride: sebiReplyTypeOverride !== "auto" ? sebiReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: sebiTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: sebiEvidenceContext || undefined,
        stream: false,
      });

      const report: SebiRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setSebiRecheckReport(report);

      if (report.ok) toast.success("SEBI Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`SEBI Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "SEBI Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingSebi(false);
    }
  };

  const handleRecheckCustomsDraft = async () => {
    if (selectedDocType !== "customs-response" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit a Customs draft first.");
      return;
    }

    setIsRecheckingCustoms(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "customs-response",
        customsReplyTypeOverride: customsReplyTypeOverride !== "auto" ? customsReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: customsTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: customsEvidenceContext || undefined,
        stream: false,
      });

      const report: CustomsRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setCustomsRecheckReport(report);

      if (report.ok) toast.success("Customs Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`Customs Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Customs Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingCustoms(false);
    }
  };

  const handleRecheckContractDraft = async () => {
    if (selectedDocType !== "contract-review" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit a Contract Review draft first.");
      return;
    }

    setIsRecheckingContract(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "contract-review",
        contractReplyTypeOverride: contractReplyTypeOverride !== "auto" ? contractReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: contractTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: contractEvidenceContext || undefined,
        stream: false,
      });

      const report: ContractRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setContractRecheckReport(report);

      if (report.ok) toast.success("Contract Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`Contract Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Contract Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingContract(false);
    }
  };

  const handleRecheckCustomDraft = async () => {
    if (selectedDocType !== "custom-draft" || !draftGenerated || !draftContent.trim()) {
      toast.error("Generate and edit a Custom Regulatory draft first.");
      return;
    }

    setIsRecheckingCustom(true);
    try {
      const client = clientOptions.find((c) => c.id === selectedClient);
      const data = await requestDraftData({
        operation: "recheck",
        documentType: "custom-draft",
        customReplyTypeOverride: customReplyTypeOverride !== "auto" ? customReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: customTrainingCaseId || undefined,
        noticeDetails: maskPII(noticeDetails) || undefined,
        draftContent,
        evidenceContext: customEvidenceContext || undefined,
        stream: false,
      });

      const report: CustomRecheckReport = {
        ok: Boolean(data?.ok),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        summary: typeof data?.summary === "string" ? data.summary : undefined,
        checkedAt: typeof data?.checkedAt === "string" ? data.checkedAt : new Date().toISOString(),
      };
      setCustomRecheckReport(report);

      if (report.ok) toast.success("Custom Recheck AI passed. No critical mismatches detected.");
      else toast.warning(`Custom Recheck AI flagged ${report.flags.length} item(s).`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Custom Recheck AI failed";
      toast.error(msg);
    } finally {
      setIsRecheckingCustom(false);
    }
  };

  useEffect(() => {
    if (selectedDocType !== "mca-notice" || !draftGenerated || !draftContent.trim()) return;
    runMcaDraftIssueCheck(draftContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "gst-show-cause" || !draftGenerated || !draftContent.trim()) return;
    runGstDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "income-tax-response" || !draftGenerated || !draftContent.trim()) return;
    runIncomeTaxDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "rbi-filing" || !draftGenerated || !draftContent.trim()) return;
    runRbiDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "sebi-compliance" || !draftGenerated || !draftContent.trim()) return;
    runSebiDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "customs-response" || !draftGenerated || !draftContent.trim()) return;
    runCustomsDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "contract-review" || !draftGenerated || !draftContent.trim()) return;
    runContractDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  useEffect(() => {
    if (selectedDocType !== "custom-draft" || !draftGenerated || !draftContent.trim()) return;
    runCustomDraftIssueCheck(draftContent, draftQA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocType, draftGenerated, draftContent, draftQA]);

  const getProjectRefFromUrl = (url: string) => {
    const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
    return match?.[1] ?? null;
  };

  const getProjectRefFromJwt = (jwt: string) => {
    try {
      const parts = jwt.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload?.ref ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setCurrentSteps(initialReviewSteps);
  }, [initialReviewSteps]);

  const maskPII = (text: string) => {
    if (!preferPiiMasking) return text;
    return text
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
      .replace(/\b\d{10}\b/g, "[REDACTED_PHONE]")
      .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[REDACTED_PAN]")
      .replace(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]\b/gi, "[REDACTED_GSTIN]");
  };

  const recordAudit = async (draftRunId: string, eventType: string, payload?: Record<string, unknown>) => {
    if (demoMode) {
      setAuditEvents((prev) => [
        { event_type: eventType, created_at: new Date().toISOString() },
        ...prev,
      ].slice(0, 10));
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabaseAny.from("draft_audit_events").insert({
        draft_run_id: draftRunId,
        user_id: user.id,
        event_type: eventType,
        payload: payload ?? null,
      });
      const { data } = await supabaseAny
        .from("draft_audit_events")
        .select("event_type, created_at")
        .eq("draft_run_id", draftRunId)
        .order("created_at", { ascending: false })
        .limit(10);
      setAuditEvents(data ?? []);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    if (demoMode) {
      setClientOptions(demoClients);
      setClientSource("demo");
      setIsLoadingClients(false);
      return;
    }

    let mounted = true;

    const loadLiveClients = async () => {
      setIsLoadingClients(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setClientOptions(demoClients);
          setClientSource("demo");
          return;
        }

        const { data: memberships, error: membershipError } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id);

        if (membershipError) {
          throw membershipError;
        }

        const companyIds = Array.from(new Set((memberships ?? []).map((row) => row.company_id)));

        if (companyIds.length === 0) {
          setClientOptions(demoClients);
          setClientSource("demo");
          return;
        }

        const { data: companies, error: companyError } = await supabase
          .from("companies")
          .select("id, name, industry")
          .in("id", companyIds)
          .order("name", { ascending: true });

        if (companyError) {
          throw companyError;
        }

        if ((companies ?? []).length === 0) {
          setClientOptions(demoClients);
          setClientSource("demo");
          return;
        }

        const mappedCompanies: ClientOption[] = (companies ?? []).map((company) => ({
          id: company.id,
          name: company.name,
          industry: company.industry ?? "General",
        }));

        setClientOptions(mappedCompanies);
        setClientSource("live");
      } catch {
        if (!mounted) return;
        setClientOptions(demoClients);
        setClientSource("demo");
      } finally {
        if (mounted) {
          setIsLoadingClients(false);
        }
      }
    };

    loadLiveClients();

    return () => {
      mounted = false;
    };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return;

    let mounted = true;
    const loadPreferences = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !mounted) return;
        const { data } = await supabaseAny
          .from("practice_preferences")
          .select("preferred_mode, preferred_document_type, prefer_pii_masking")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!mounted || !data) return;
        if (data.preferred_mode) setSelectedMode(data.preferred_mode);
        if (data.preferred_document_type) setSelectedDocType(data.preferred_document_type);
        if (typeof data.prefer_pii_masking === "boolean") setPreferPiiMasking(data.prefer_pii_masking);
      } catch {
        // best effort only
      }
    };
    loadPreferences();
    return () => {
      mounted = false;
    };
  }, [demoMode]);

  useEffect(() => {
    if (!selectedClient) return;
    const exists = clientOptions.some((client) => client.id === selectedClient);
    if (!exists) {
      setSelectedClient("");
    }
  }, [clientOptions, selectedClient]);

  useEffect(() => {
    if (!selectedDocType) return;

    const prevTemplate = lastTemplateDocType ? lastAppliedTemplate : "";
    const currentText = noticeDetails.trim();
    const canAutoReplace = currentText.length === 0 || (prevTemplate && currentText === prevTemplate);

    if (canAutoReplace) {
      setNoticeDetails(selectedTemplate || "");
      setLastAppliedTemplate(selectedTemplate || "");
      setLastTemplateDocType(selectedDocType);
    }
  }, [selectedDocType, lastTemplateDocType, selectedTemplate, lastAppliedTemplate]);

  useEffect(() => {
    if (selectedDocType !== "mca-notice") {
      setMcaReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "gst-show-cause") {
      setGstReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "income-tax-response") {
      setIncomeTaxReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "rbi-filing") {
      setRbiReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "sebi-compliance") {
      setSebiReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "customs-response") {
      setCustomsReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "contract-review") {
      setContractReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    if (selectedDocType !== "custom-draft") {
      setCustomReplyTypeOverride("auto");
    }
  }, [selectedDocType]);

  useEffect(() => {
    setTemplatePackOverride("auto");
  }, [selectedDocType]);

  useEffect(() => {
    if (!templatePackOverride || templatePackOverride === "auto") return;
    const valid = templatePackOptions.some((item) => item.id === templatePackOverride);
    if (!valid) {
      setTemplatePackOverride("auto");
    }
  }, [templatePackOverride, templatePackOptions]);

  const normalizeUploadedNoticeText = (value: string) =>
    value
      .replace(/\u0000/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const decodePdfEscapes = (value: string) =>
    value
      .replace(/\\([\\()])/g, "$1")
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));

  const extractTextFromPdfHeuristic = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
    const chunks: string[] = [];

    const tjRegex = /\(([^()]*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null = null;
    while ((tjMatch = tjRegex.exec(raw)) !== null) {
      const text = decodePdfEscapes(tjMatch[1] || "");
      if (text.trim().length > 1) chunks.push(text);
    }

    const tjArrayRegex = /\[(.*?)\]\s*TJ/gs;
    let arrMatch: RegExpExecArray | null = null;
    while ((arrMatch = tjArrayRegex.exec(raw)) !== null) {
      const segment = arrMatch[1] || "";
      const textRegex = /\(([^()]*)\)/g;
      let textMatch: RegExpExecArray | null = null;
      while ((textMatch = textRegex.exec(segment)) !== null) {
        const text = decodePdfEscapes(textMatch[1] || "");
        if (text.trim().length > 1) chunks.push(text);
      }
    }

    const heuristicJoined = normalizeUploadedNoticeText(chunks.join(" "));
    if (heuristicJoined.length >= 200) {
      return heuristicJoined.slice(0, 28000);
    }

    const asciiRuns = raw.match(/[A-Za-z][A-Za-z0-9,.:;()\/\-\s]{24,}/g) || [];
    const fallback = normalizeUploadedNoticeText(asciiRuns.join(" "));
    return fallback.slice(0, 28000);
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read uploaded file."));
      reader.readAsDataURL(file);
    });

  const extractNoticeTextFromUploadedFile = async (file: File): Promise<string> => {
    const ext = file.name.toLowerCase().split(".").pop() || "";
    const mime = (file.type || "").toLowerCase();

    if (
      mime.startsWith("text/") ||
      ["txt", "md", "csv", "json", "xml", "html", "htm", "log"].includes(ext)
    ) {
      return normalizeUploadedNoticeText(await file.text()).slice(0, 28000);
    }

    if (mime === "application/pdf" || ext === "pdf") {
      return extractTextFromPdfHeuristic(file);
    }

    if (mime.startsWith("image/")) {
      const imageDataUrl = await fileToDataUrl(file);
      const ocrResp = await requestDraftData({
        operation: "notice-ocr",
        documentType: selectedDocType || undefined,
        context: `OCR extraction for uploaded notice image: ${file.name}`,
        imageDataUrl,
      });
      const extracted = ((ocrResp as Record<string, unknown>)?.text as string | undefined)?.trim();
      if (!extracted) {
        throw new Error("Could not read text from image notice. Try a clearer image or paste the notice text.");
      }
      return normalizeUploadedNoticeText(extracted).slice(0, 28000);
    }

    if (["doc", "docx"].includes(ext)) {
      throw new Error("DOC/DOCX parsing is not enabled yet. Save/export as text-based PDF or paste notice text.");
    }

    return normalizeUploadedNoticeText(await file.text()).slice(0, 28000);
  };

  const inferClassForDocumentType = (docType: string, sourceNotice: string): string => {
    if (docType === "mca-notice") return inferMcaReplyTypeFromNotice(sourceNotice);
    if (docType === "gst-show-cause") return inferGstReplyTypeFromNotice(sourceNotice);
    if (docType === "income-tax-response") return inferIncomeTaxReplyTypeFromNotice(sourceNotice);
    if (docType === "rbi-filing") return inferRbiReplyTypeFromNotice(sourceNotice);
    if (docType === "sebi-compliance") return inferSebiReplyTypeFromNotice(sourceNotice);
    if (docType === "customs-response") return inferCustomsReplyTypeFromNotice(sourceNotice);
    if (docType === "contract-review") return inferContractReplyTypeFromNotice(sourceNotice);
    if (docType === "custom-draft") return inferCustomReplyTypeFromNotice(sourceNotice);
    return "auto";
  };

  const applyClassOverrideForDocType = (docType: string, inferredClass: string) => {
    if (docType === "mca-notice") setMcaReplyTypeOverride(inferredClass || "auto");
    if (docType === "gst-show-cause") setGstReplyTypeOverride(inferredClass || "auto");
    if (docType === "income-tax-response") setIncomeTaxReplyTypeOverride(inferredClass || "auto");
    if (docType === "rbi-filing") setRbiReplyTypeOverride(inferredClass || "auto");
    if (docType === "sebi-compliance") setSebiReplyTypeOverride(inferredClass || "auto");
    if (docType === "customs-response") setCustomsReplyTypeOverride(inferredClass || "auto");
    if (docType === "contract-review") setContractReplyTypeOverride(inferredClass || "auto");
    if (docType === "custom-draft") setCustomReplyTypeOverride(inferredClass || "auto");
  };

  const generateNoticeDetailsForDoc = async (docType: string, sourceNoticeInput: string, inferredClassOverride?: string) => {
    const client = clientOptions.find((c) => c.id === selectedClient);
    const sourceNotice = sourceNoticeInput.trim() || readyNoticeTemplates[docType] || "";
    const docLabel = documentTypes.find((doc) => doc.id === docType)?.label || "Selected Draft";
    const effectiveMcaType = docType === "mca-notice"
      ? (inferredClassOverride && inferredClassOverride !== "auto"
          ? inferredClassOverride
          : inferMcaReplyTypeFromNotice(sourceNotice))
      : undefined;

    const generated = await requestDraftData({
      operation: "notice-details",
      documentType: docType,
      companyName: client?.name || "Company",
      industry: client?.industry || "",
      draftMode: selectedMode,
      mcaReplyTypeOverride: docType === "mca-notice" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "mca-notice" && mcaReplyTypeOverride !== "auto"
          ? mcaReplyTypeOverride
          : undefined,
      gstReplyTypeOverride: docType === "gst-show-cause" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "gst-show-cause" && gstReplyTypeOverride !== "auto"
          ? gstReplyTypeOverride
          : undefined,
      incomeTaxReplyTypeOverride: docType === "income-tax-response" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "income-tax-response" && incomeTaxReplyTypeOverride !== "auto"
          ? incomeTaxReplyTypeOverride
          : undefined,
      rbiReplyTypeOverride: docType === "rbi-filing" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "rbi-filing" && rbiReplyTypeOverride !== "auto"
          ? rbiReplyTypeOverride
          : undefined,
      sebiReplyTypeOverride: docType === "sebi-compliance" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "sebi-compliance" && sebiReplyTypeOverride !== "auto"
          ? sebiReplyTypeOverride
          : undefined,
      customsReplyTypeOverride: docType === "customs-response" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "customs-response" && customsReplyTypeOverride !== "auto"
          ? customsReplyTypeOverride
          : undefined,
      contractReplyTypeOverride: docType === "contract-review" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "contract-review" && contractReplyTypeOverride !== "auto"
          ? contractReplyTypeOverride
          : undefined,
      customReplyTypeOverride: docType === "custom-draft" && inferredClassOverride && inferredClassOverride !== "auto"
        ? inferredClassOverride
        : docType === "custom-draft" && customReplyTypeOverride !== "auto"
          ? customReplyTypeOverride
          : undefined,
      context: `Generate precise Notice/Order Details for ${docLabel}. Ensure this is input-quality text for strict legal drafting checks.`,
      noticeDetails: sourceNotice || undefined,
      stream: false,
    });

    const aiNoticeDetails = (
      (generated?.noticeDetails as string | undefined) ||
      (generated?.draft as string | undefined)
    )?.trim();
    if (!aiNoticeDetails) {
      throw new Error("AI did not return notice details.");
    }

    const sanitizedNotice = sanitizeNoticeDetailsClient(aiNoticeDetails, sourceNotice);
    const normalizedSanitized = normalizeForComparison(sanitizedNotice);
    const normalizedCurrent = normalizeForComparison(noticeDetails);
    const normalizedTemplate = normalizeForComparison(readyNoticeTemplates[docType] || "");
    const shouldUseStructuredFallback =
      normalizedSanitized.length === 0 ||
      normalizedSanitized === normalizedCurrent ||
      normalizedSanitized === normalizedTemplate;

    const finalNoticeDetails = shouldUseStructuredFallback
      ? buildStructuredNoticeDetailsFallback(docType, sourceNotice, docLabel, effectiveMcaType)
      : sanitizedNotice;

    setNoticeDetails(finalNoticeDetails);
    setLastTemplateDocType(docType);

    return { shouldUseStructuredFallback };
  };

  const handleUploadNoticeAndAutoFill = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsProcessingNoticeUpload(true);
    setUploadedNoticeFileName(file.name);
    try {
      const extractedText = await extractNoticeTextFromUploadedFile(file);
      if (!extractedText || extractedText.length < 80) {
        throw new Error("Uploaded file does not have enough readable text. Use a text-based PDF/TXT or paste notice text.");
      }

      const autoDocType = inferDocumentTypeFromNotice(extractedText);
      const autoClass = inferClassForDocumentType(autoDocType, extractedText);

      setSelectedDocType(autoDocType);
      applyClassOverrideForDocType(autoDocType, autoClass);
      setNoticeDetails(extractedText);
      setLastTemplateDocType(autoDocType);

      await generateNoticeDetailsForDoc(autoDocType, extractedText, autoClass);
      const docTypeLabel = documentTypes.find((doc) => doc.id === autoDocType)?.label || autoDocType;
      toast.success(`Notice uploaded and processed. Auto-selected ${docTypeLabel}. You can still edit manually.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to process uploaded notice.";
      toast.error(msg);
    } finally {
      setIsProcessingNoticeUpload(false);
    }
  };

  const handleInsertTemplate = () => {
    if (!selectedDocType || !selectedTemplate) {
      toast.error("Select a document type first.");
      return;
    }
    setNoticeDetails(selectedTemplate);
    setLastAppliedTemplate(selectedTemplate);
    setLastTemplateDocType(selectedDocType);
    toast.success("Ready 200+ template inserted.");
  };

  const handleCopyTemplate = async () => {
    if (!selectedDocType || !selectedTemplate) {
      toast.error("Select a document type first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedTemplate);
      toast.success("Template copied. Paste it in Notice / Order Details.");
    } catch {
      toast.error("Clipboard access failed. Use Insert Template instead.");
    }
  };

  const handleGenerateNoticeDetailsAI = async () => {
    if (!selectedDocType) {
      toast.error("Select document type first.");
      return;
    }
    setIsGeneratingNoticeDetails(true);
    try {
      const sourceNotice = noticeDetails.trim() || readyNoticeTemplates[selectedDocType] || "";
      const { shouldUseStructuredFallback } = await generateNoticeDetailsForDoc(selectedDocType, sourceNotice);
      toast.success(
        shouldUseStructuredFallback
          ? "Notice/Order Details generated with structured AI-safe fallback."
          : "AI Notice/Order Details generated.",
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to generate notice details.";
      const sourceNotice = noticeDetails.trim() || readyNoticeTemplates[selectedDocType] || "";
      if (sourceNotice) {
        const fallbackText = buildStructuredNoticeDetailsFallback(
          selectedDocType,
          sourceNotice,
          selectedDocLabel,
          selectedDocType === "mca-notice"
            ? (mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType)
            : undefined,
        );
        setNoticeDetails(fallbackText);
        setLastTemplateDocType(selectedDocType);
        toast.warning(`AI notice details failed; inserted structured fallback. ${msg}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsGeneratingNoticeDetails(false);
    }
  };

  const getEffectiveAuthToken = async () => {
    let authToken = supabasePublishableKey;
    if (secureFunctionAuth) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      authToken = session?.access_token ?? authToken;
    }
    return authToken;
  };

  const requestDraftData = async (requestBody: Record<string, unknown>) => {
    const authToken = await getEffectiveAuthToken();
    const body = JSON.stringify(requestBody);

    const tryRequest = async (withAuthHeaders: boolean) =>
      fetch(DRAFT_URL, {
        method: "POST",
        headers: withAuthHeaders
          ? {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
              apikey: supabasePublishableKey,
            }
          : {
              "Content-Type": "application/json",
            },
        body,
      });

    let response: Response;
    try {
      response = await tryRequest(true);
    } catch (networkError) {
      if (secureFunctionAuth) throw networkError;
      response = await tryRequest(false);
    }

    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
    if (!response.ok) {
      let serverError = `Draft request failed (${response.status}).`;
      try {
        const data = await response.json();
        serverError = data?.error ? `${serverError} ${data.error}` : serverError;
      } catch {
        const text = await response.text();
        if (text) serverError = `${serverError} ${text.slice(0, 240)}`;
      }
      throw new Error(serverError);
    }

    return response.json();
  };

  const handleApplyMcaFix = async () => {
    if (selectedDocType !== "mca-notice" || !draftContent.trim()) {
      toast.error("Generate an MCA draft first.");
      return;
    }

    if (!mcaHasChecked) {
      runMcaDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const effectiveIssueItems = liveMcaIssueItems;
    const effectiveAdvancedSuggestions = liveMcaAdvancedSuggestions;
    const issueText = effectiveIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = effectiveAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");

    const combinedFixNotes = [mcaAutoFixNotes, mcaRecheckNotes, mcaUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = mcaPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving an MCA adjudication draft.
Task: Regenerate a corrected final draft by merging the existing draft with required fixes.
Non-negotiable fixes:
1) Section 454 proviso submission (fact-dependent, date-aware)
2) Chronology table with due vs actual and reference IDs
3) Officer-specific defense table
4) Safe prayer language using "drop or reduce" (never "waive/absolve")
5) Remove over-strong rhetoric

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "None provided"}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA/LAWYER ADDITIONAL FIX NOTES:
${combinedFixNotes || "Use the detected issues and suggestions above as mandatory corrections."}

Return only the revised final draft text.`;

    setIsApplyingMcaFix(true);
    setGenerationError(null);
    try {
      if (!hasDraftEndpoint) {
        throw new Error("Draft endpoint is not configured. Set VITE_SUPABASE_URL correctly.");
      }
      const urlRef = getProjectRefFromUrl(supabaseUrl);
      const keyRef = getProjectRefFromJwt(supabasePublishableKey);
      if (urlRef && keyRef && urlRef !== keyRef) {
        throw new Error(
          `Supabase config mismatch: URL project (${urlRef}) and publishable key project (${keyRef}) are different. Update VITE_SUPABASE_PUBLISHABLE_KEY.`,
        );
      }

      const data = await requestDraftData({
        documentType: "mca-notice",
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: mcaTrainingCaseId || undefined,
        draftMode: selectedMode,
        mcaReplyTypeOverride: mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : undefined,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      let content = data?.draft as string | undefined;
      if (!content) {
        throw new Error("AI fix regeneration returned empty content.");
      }

      let qaPayload = (data?.qa ?? null) as DraftQA | null;
      let remaining = evaluateMcaDraftIssues(content, qaPayload, inferredMcaReplyType, false);

      if (remaining.length > 0) {
        const retryContext = `${fixContext}\n\nREMAINING ISSUES AFTER FIRST FIX:\n${remaining
          .map((item, idx) => `${idx + 1}. ${item.issue}\n   Suggestion: ${item.suggestion}`)
          .join("\n")}\n\nRegenerate again and fully resolve remaining issues.`;

        const retryData = await requestDraftData({
          documentType: "mca-notice",
          companyName: client?.name || "Company",
          companyId: clientSource === "live" ? selectedClient : undefined,
          industry: client?.industry || "",
          draftRunId: currentDraftRunId || undefined,
          trainingCaseId: mcaTrainingCaseId || undefined,
          draftMode: selectedMode,
          mcaReplyTypeOverride: mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : undefined,
          advancedMode: true,
          strictValidation: true,
          context: retryContext,
          noticeDetails: maskPII(noticeDetails) || undefined,
          stream: false,
        });

        const retryContent = retryData?.draft as string | undefined;
        if (retryContent) {
          content = retryContent;
          qaPayload = (retryData?.qa ?? null) as DraftQA | null;
          remaining = evaluateMcaDraftIssues(content, qaPayload, inferredMcaReplyType, false);
        }
      }

      if (remaining.length > 0) {
        content = enforceMcaLocalFallback(content, inferredMcaReplyType);
        remaining = evaluateMcaDraftIssues(content, qaPayload, inferredMcaReplyType, false);
      }

      content = enforceMcaHardFixes(
        content,
        noticeDetails,
        mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType,
      );
      remaining = evaluateMcaDraftIssues(content, qaPayload, inferredMcaReplyType, false);

      setDraftContent(content);
      setDraftQA(qaPayload);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setMcaTrainingCaseId(nextCaseId);
      runMcaDraftIssueCheck(content, qaPayload);
      setMcaUserFixNotes("");
      if (remaining.length === 0) {
        toast.success("MCA draft corrected and regenerated.");
      } else {
        toast.warning("MCA draft regenerated, but some issues still need CA review.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to apply AI fix";
      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsApplyingMcaFix(false);
    }
  };

  const handleApplyGstFix = async () => {
    if (selectedDocType !== "gst-show-cause" || !draftContent.trim()) {
      toast.error("Generate a GST draft first.");
      return;
    }
    if (!gstHasChecked) {
      runGstDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueItems = liveGstIssueItems;
    const issueText = issueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveGstAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (gstRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [gstAutoFixNotes, recheckNotes, gstUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = gstPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving a GST show-cause reply draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add para-wise/allegation-wise rebuttal matrix if missing
2) Add accepted vs disputed computation/reconciliation table
3) Ensure GSTR/ITC/DRC references are present where factually relevant
4) Use safe prayer wording (drop/reduce), avoid waive/absolve language
5) Keep output notice-specific and filing-ready

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingGstFix(true);
    try {
      const data = await requestDraftData({
        documentType: "gst-show-cause",
        gstReplyTypeOverride: gstReplyTypeOverride !== "auto" ? gstReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: gstTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("GST AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setGstTrainingCaseId(nextCaseId);
      setGstUserFixNotes("");
      runGstDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("GST draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply GST AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingGstFix(false);
    }
  };

  const handleApplyIncomeTaxFix = async () => {
    if (selectedDocType !== "income-tax-response" || !draftContent.trim()) {
      toast.error("Generate an Income-tax draft first.");
      return;
    }
    if (!incomeTaxHasChecked) {
      runIncomeTaxDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueText = liveIncomeTaxIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveIncomeTaxAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (incomeTaxRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [incomeTaxAutoFixNotes, recheckNotes, incomeTaxUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = incomeTaxPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving an Income-tax response draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add issue-wise/addition-wise rebuttal matrix
2) Add computation/tax-effect accepted-vs-disputed table
3) Ensure invoked section context and legal framing are present
4) Use safe prayer wording (drop/reduce), avoid waive/absolve language
5) Keep output notice-specific and filing-ready

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingIncomeTaxFix(true);
    try {
      const data = await requestDraftData({
        documentType: "income-tax-response",
        incomeTaxReplyTypeOverride: incomeTaxReplyTypeOverride !== "auto" ? incomeTaxReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: incomeTaxTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("Income-tax AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setIncomeTaxTrainingCaseId(nextCaseId);
      setIncomeTaxUserFixNotes("");
      runIncomeTaxDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("Income-tax draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply Income-tax AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingIncomeTaxFix(false);
    }
  };

  const handleApplyRbiFix = async () => {
    if (selectedDocType !== "rbi-filing" || !draftContent.trim()) {
      toast.error("Generate an RBI draft first.");
      return;
    }
    if (!rbiHasChecked) {
      runRbiDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueText = liveRbiIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveRbiAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (rbiRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [rbiAutoFixNotes, recheckNotes, rbiUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = rbiPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving an RBI/FEMA response draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add regulation-wise legal response against notice allegations
2) Add timeline/chronology (due/event vs actual action date + reference IDs)
3) Add accepted vs disputed exposure/penalty/LSF table
4) Add evidence/annexure mapping (AD bank, acknowledgements, board/control records)
5) Use safe prayer wording (drop/reduce), avoid waive/absolve language

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingRbiFix(true);
    try {
      const data = await requestDraftData({
        documentType: "rbi-filing",
        rbiReplyTypeOverride: rbiReplyTypeOverride !== "auto" ? rbiReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: rbiTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("RBI AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setRbiTrainingCaseId(nextCaseId);
      setRbiUserFixNotes("");
      runRbiDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("RBI draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply RBI AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingRbiFix(false);
    }
  };

  const handleApplySebiFix = async () => {
    if (selectedDocType !== "sebi-compliance" || !draftContent.trim()) {
      toast.error("Generate a SEBI draft first.");
      return;
    }
    if (!sebiHasChecked) {
      runSebiDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueText = liveSebiIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveSebiAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (sebiRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [sebiAutoFixNotes, recheckNotes, sebiUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = sebiPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving a SEBI compliance response draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add allegation-wise rebuttal matrix with regulation mapping
2) Add compliance chronology table (due/event vs actual disclosure/action dates)
3) Add evidence/annexure mapping (exchange filings, board records, disclosures)
4) Keep legal framing proportional and defensible (no over-strong rhetoric)
5) Use safe prayer wording (drop/reduce), avoid waive/absolve language

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingSebiFix(true);
    try {
      const data = await requestDraftData({
        documentType: "sebi-compliance",
        sebiReplyTypeOverride: sebiReplyTypeOverride !== "auto" ? sebiReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: sebiTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("SEBI AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setSebiTrainingCaseId(nextCaseId);
      setSebiUserFixNotes("");
      runSebiDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("SEBI draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply SEBI AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingSebiFix(false);
    }
  };

  const handleApplyContractFix = async () => {
    if (selectedDocType !== "contract-review" || !draftContent.trim()) {
      toast.error("Generate a Contract Review draft first.");
      return;
    }
    if (!contractHasChecked) {
      runContractDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueText = liveContractIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveContractAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (contractRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [contractAutoFixNotes, recheckNotes, contractUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = contractPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving a Contract Review advisory draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add clause-wise risk matrix
2) Add negotiation fallback positions for high-risk clauses
3) Add redline-ready replacement language
4) Add dispute resolution/governing law assessment
5) Add commercial risk ranking and implementation checklist

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingContractFix(true);
    try {
      const data = await requestDraftData({
        documentType: "contract-review",
        contractReplyTypeOverride: contractReplyTypeOverride !== "auto" ? contractReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: contractTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("Contract AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setContractTrainingCaseId(nextCaseId);
      setContractUserFixNotes("");
      runContractDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("Contract draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply Contract AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingContractFix(false);
    }
  };

  const handleApplyCustomsFix = async () => {
    if (selectedDocType !== "customs-response" || !draftContent.trim()) {
      toast.error("Generate a Customs draft first.");
      return;
    }
    if (!customsHasChecked) {
      runCustomsDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueText = liveCustomsIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveCustomsAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (customsRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [customsAutoFixNotes, recheckNotes, customsUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = customsPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving a Customs response draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add allegation-wise rebuttal matrix with section-wise legal anchors
2) Add chronology/timeline table with event vs action dates and reference IDs
3) Add duty/interest/penalty/fine accepted-vs-disputed computation table
4) Add evidence/annexure mapping (BoE/invoices/valuation/CoO/test reports)
5) Use safe prayer wording (drop/reduce), avoid waive/absolve language

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingCustomsFix(true);
    try {
      const data = await requestDraftData({
        documentType: "customs-response",
        customsReplyTypeOverride: customsReplyTypeOverride !== "auto" ? customsReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: customsTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("Customs AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setCustomsTrainingCaseId(nextCaseId);
      setCustomsUserFixNotes("");
      runCustomsDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("Customs draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply Customs AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingCustomsFix(false);
    }
  };

  const handleApplyCustomFix = async () => {
    if (selectedDocType !== "custom-draft" || !draftContent.trim()) {
      toast.error("Generate a Custom Regulatory draft first.");
      return;
    }
    if (!customHasChecked) {
      runCustomDraftIssueCheck();
    }

    const client = clientOptions.find((c) => c.id === selectedClient);
    const issueText = liveCustomIssueItems
      .map((item, idx) => `${idx + 1}. Issue: ${item.issue}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const advancedSuggestionText = liveCustomAdvancedSuggestions
      .filter((item) => !item.implemented)
      .map((item, idx) => `${idx + 1}. Upgrade: ${item.title}\n   Suggestion: ${item.suggestion}`)
      .join("\n");
    const recheckNotes = (customRecheckReport?.flags || [])
      .map((flag, idx) => `${idx + 1}. [${flag.severity.toUpperCase()}] ${flag.issue}\n   Fix: ${flag.fix}`)
      .join("\n");
    const combinedFixNotes = [customAutoFixNotes, recheckNotes, customUserFixNotes.trim()]
      .filter((entry) => entry && entry.trim().length > 0)
      .join("\n\n");
    const pendingPlaybookText = customPendingFixPlaybook
      .map((item, idx) => `${idx + 1}. Pending: ${item.title}\n   Solution: ${item.solution}`)
      .join("\n");

    const fixContext = `You are improving a Custom Regulatory response draft.
Task: Regenerate a corrected final draft by merging current draft with required fixes.
Mandatory fixes:
1) Add issue/allegation-wise rebuttal matrix with provision-wise legal anchors
2) Add chronology/timeline table with event vs action dates and reference IDs
3) Add accepted-vs-disputed computation/exposure table
4) Add evidence/annexure mapping for each major submission
5) Use safe prayer wording (drop/reduce), avoid waive/absolve language

CURRENT DRAFT:
${draftContent}

DETECTED ISSUES:
${issueText || "No local issue detector items."}

ADVANCED UPGRADE SUGGESTIONS:
${advancedSuggestionText || "No additional upgrades detected."}

RECHECK FLAGS:
${recheckNotes || "No recheck flags."}

PENDING FIX PLAYBOOK (MANDATORY ACTION STEPS):
${pendingPlaybookText || "No pending actions."}

CA NOTES:
${combinedFixNotes || "None"}

Return only revised final draft text.`;

    setIsApplyingCustomFix(true);
    try {
      const data = await requestDraftData({
        documentType: "custom-draft",
        customReplyTypeOverride: customReplyTypeOverride !== "auto" ? customReplyTypeOverride : undefined,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: customTrainingCaseId || undefined,
        draftMode: selectedMode,
        advancedMode: true,
        strictValidation: true,
        context: fixContext,
        noticeDetails: maskPII(noticeDetails) || undefined,
        stream: false,
      });

      const content = (data?.draft as string | undefined) || "";
      if (!content) throw new Error("Custom AI fix regeneration returned empty content.");
      setDraftContent(content);
      setDraftQA((data?.qa ?? null) as DraftQA | null);
      setDraftPackage((data?.package ?? null) as DraftPackage | null);
      const nextCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
      if (nextCaseId) setCustomTrainingCaseId(nextCaseId);
      setCustomUserFixNotes("");
      runCustomDraftIssueCheck(content, (data?.qa ?? null) as DraftQA | null);
      toast.success("Custom draft corrected and regenerated.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply Custom AI fix";
      toast.error(msg);
    } finally {
      setIsApplyingCustomFix(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedClient || !selectedDocType) return;

    if (selectedDocType === "mca-notice" && !advancedMode) {
      toast.error("MCA drafting requires Advanced Mode for strict legal quality gates.");
      return;
    }

    if (advancedMode && noticeLength < 200) {
      toast.error("Advanced Mode requires detailed notice/order text (minimum 200 characters).");
      return;
    }

    if (advancedMode && checkResults.length > 0) {
      const missing = checkResults.filter((item) => !item.passed).map((item) => item.label);
      if (missing.length > 0) {
        toast.error(`Advanced Mode missing: ${missing.join(", ")}`);
        return;
      }
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setDraftContent("");
    setMcaTrainingCaseId(null);
    setGstTrainingCaseId(null);
    setIncomeTaxTrainingCaseId(null);
    setRbiTrainingCaseId(null);
    setSebiTrainingCaseId(null);
    setCustomsTrainingCaseId(null);
    setContractTrainingCaseId(null);
    setCustomTrainingCaseId(null);
    setDraftQA(null);
    setDraftPackage(null);
    setMcaHasChecked(false);
    setMcaLastCheckedAt(null);
    setMcaUserFixNotes("");
    setMcaRecheckReport(null);
    setGstHasChecked(false);
    setGstLastCheckedAt(null);
    setGstUserFixNotes("");
    setGstRecheckReport(null);
    setIncomeTaxHasChecked(false);
    setIncomeTaxLastCheckedAt(null);
    setIncomeTaxUserFixNotes("");
    setIncomeTaxRecheckReport(null);
    setRbiHasChecked(false);
    setRbiLastCheckedAt(null);
    setRbiUserFixNotes("");
    setRbiRecheckReport(null);
    setSebiHasChecked(false);
    setSebiLastCheckedAt(null);
    setSebiUserFixNotes("");
    setSebiRecheckReport(null);
    setCustomsHasChecked(false);
    setCustomsLastCheckedAt(null);
    setCustomsUserFixNotes("");
    setCustomsRecheckReport(null);
    setContractHasChecked(false);
    setContractLastCheckedAt(null);
    setContractUserFixNotes("");
    setContractRecheckReport(null);
    setCustomHasChecked(false);
    setCustomLastCheckedAt(null);
    setCustomUserFixNotes("");
    setCustomRecheckReport(null);
    
    const client = clientOptions.find(c => c.id === selectedClient);
    const maskedNoticeDetails = noticeDetails ? maskPII(noticeDetails) : undefined;

    const applyOfflineFallback = async (reason?: string) => {
      const offlineContent = buildOfflineDraft({
        authority: selectedDocLabel,
        companyName: client?.name || "Company",
        noticeText: maskedNoticeDetails || noticeDetails,
        modeLabel: selectedMode,
      });

      const passedChecks = checkResults.filter((item) => item.passed).length;
      const totalChecks = checkResults.length || 1;
      const score = Math.max(58, Math.min(88, Math.round((passedChecks / totalChecks) * 100)));
      const riskBand: DraftQA["risk_band"] = score >= 80 ? "low" : score >= 65 ? "medium" : "high";

      const patchedOffline = selectedDocType === "mca-notice"
        ? enforceMcaHardFixes(offlineContent, noticeDetails, mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType)
        : offlineContent;
      setDraftContent(patchedOffline);
      setDraftQA({
        filing_score: score,
        risk_band: riskBand,
        mandatory_gates: Object.fromEntries(checkResults.map((item) => [item.label, item.passed])),
        missing_for_final_filing: checkResults.filter((item) => !item.passed).map((item) => item.label),
      });
      setDraftPackage({
        reply: offlineContent,
        annexure_index: [
          { annexure_id: "Annexure A", purpose: "Notice + reference proof", linked_issue: "Notice baseline" },
          { annexure_id: "Annexure B", purpose: "Invoice/ledger/payment support", linked_issue: "Fact proof" },
          { annexure_id: "Annexure C", purpose: "Computation reconciliation", linked_issue: "Demand rebuttal" },
        ],
        hearing_notes: "Focus on allegation-wise rebuttal, computation mismatch, and evidence sequence.",
        argument_script: [
          "Department must prove allegation and quantification with evidence.",
          "Noticee records support bona fide compliance and reconciliation.",
          "Without prejudice, relief sought includes demand recalculation and penalty waiver.",
        ],
      });
      setDraftGenerated(true);
      setShowFormatDetails(false);
      setWorkflowStatus("generated");
      setCurrentSteps(prev => prev.map(step => {
        if (step.id === 1) return { ...step, status: "completed" as StepStatus };
        if (step.id === 2) return { ...step, status: "current" as StepStatus };
        return step;
      }));
      setGenerationError(null);
      if (reason) {
        toast.warning(reason);
      } else if (demoMode) {
        toast.success("Demo filing-ready draft generated.");
      }
    };
    
    try {
      if (!hasDraftEndpoint) {
        throw new Error("Draft endpoint is not configured. Set VITE_SUPABASE_URL correctly.");
      }

      const urlRef = getProjectRefFromUrl(supabaseUrl);
      const keyRef = getProjectRefFromJwt(supabasePublishableKey);
      if (urlRef && keyRef && urlRef !== keyRef) {
        throw new Error(
          `Supabase config mismatch: URL project (${urlRef}) and publishable key project (${keyRef}) are different. Update VITE_SUPABASE_PUBLISHABLE_KEY.`,
        );
      }

      let authToken = supabasePublishableKey;
      if (secureFunctionAuth) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        authToken = session?.access_token ?? authToken;
      }

      const requestBody = JSON.stringify({
        documentType: selectedDocType,
        companyName: client?.name || "Company",
        companyId: clientSource === "live" ? selectedClient : undefined,
        industry: client?.industry || "",
        draftMode: selectedMode,
        draftRunId: currentDraftRunId || undefined,
        trainingCaseId: selectedDocType === "mca-notice"
          ? (mcaTrainingCaseId || undefined)
          : selectedDocType === "gst-show-cause"
            ? (gstTrainingCaseId || undefined)
            : selectedDocType === "income-tax-response"
              ? (incomeTaxTrainingCaseId || undefined)
              : selectedDocType === "rbi-filing"
                ? (rbiTrainingCaseId || undefined)
              : selectedDocType === "sebi-compliance"
                ? (sebiTrainingCaseId || undefined)
              : selectedDocType === "customs-response"
                ? (customsTrainingCaseId || undefined)
              : selectedDocType === "contract-review"
                ? (contractTrainingCaseId || undefined)
              : selectedDocType === "custom-draft"
                ? (customTrainingCaseId || undefined)
            : undefined,
        mcaReplyTypeOverride: selectedDocType === "mca-notice" && mcaReplyTypeOverride !== "auto"
          ? mcaReplyTypeOverride
          : undefined,
        gstReplyTypeOverride: selectedDocType === "gst-show-cause" && gstReplyTypeOverride !== "auto"
          ? gstReplyTypeOverride
          : undefined,
        incomeTaxReplyTypeOverride: selectedDocType === "income-tax-response" && incomeTaxReplyTypeOverride !== "auto"
          ? incomeTaxReplyTypeOverride
          : undefined,
        rbiReplyTypeOverride: selectedDocType === "rbi-filing" && rbiReplyTypeOverride !== "auto"
          ? rbiReplyTypeOverride
          : undefined,
        sebiReplyTypeOverride: selectedDocType === "sebi-compliance" && sebiReplyTypeOverride !== "auto"
          ? sebiReplyTypeOverride
          : undefined,
        customsReplyTypeOverride: selectedDocType === "customs-response" && customsReplyTypeOverride !== "auto"
          ? customsReplyTypeOverride
          : undefined,
        contractReplyTypeOverride: selectedDocType === "contract-review" && contractReplyTypeOverride !== "auto"
          ? contractReplyTypeOverride
          : undefined,
        customReplyTypeOverride: selectedDocType === "custom-draft" && customReplyTypeOverride !== "auto"
          ? customReplyTypeOverride
          : undefined,
        advancedMode,
        strictValidation: advancedMode,
        noticeDetails: maskedNoticeDetails || undefined,
        stream: !advancedMode,
      });

      const tryRequest = async (withAuthHeaders: boolean) =>
        fetch(DRAFT_URL, {
          method: "POST",
          headers: withAuthHeaders
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                apikey: supabasePublishableKey,
              }
            : {
                "Content-Type": "application/json",
              },
          body: requestBody,
        });

      let response: Response;
      try {
        response = await tryRequest(true);
      } catch (networkError) {
        if (secureFunctionAuth) {
          throw networkError;
        }
        response = await tryRequest(false);
      }

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      if (!response.ok) {
        let serverError = `Draft request failed (${response.status}).`;
        try {
          const data = await response.json();
          serverError = data?.error ? `${serverError} ${data.error}` : serverError;
        } catch {
          try {
            const text = await response.text();
            if (text) {
              serverError = `${serverError} ${text.slice(0, 240)}`;
            }
          } catch {
            // ignore secondary parse failures
          }
        }
        throw new Error(serverError);
      }
      if (advancedMode) {
        const data = await response.json();
        const content = data?.draft as string | undefined;
        if (!content) {
          throw new Error("Advanced draft generation returned empty content.");
        }
        const patched = selectedDocType === "mca-notice"
          ? enforceMcaHardFixes(content, noticeDetails, mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType)
          : content;
        setDraftContent(patched);
        setDraftQA((data?.qa ?? null) as DraftQA | null);
        setDraftPackage((data?.package ?? null) as DraftPackage | null);
        const generatedCaseId = (data?.metadata as { trainingCaseId?: string } | undefined)?.trainingCaseId;
        if (selectedDocType === "mca-notice") setMcaTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "gst-show-cause") setGstTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "income-tax-response") setIncomeTaxTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "rbi-filing") setRbiTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "sebi-compliance") setSebiTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "customs-response") setCustomsTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "contract-review") setContractTrainingCaseId(generatedCaseId || null);
        if (selectedDocType === "custom-draft") setCustomTrainingCaseId(generatedCaseId || null);
        setDraftGenerated(true);
        setShowFormatDetails(false);
        setWorkflowStatus("generated");
        setCurrentSteps(prev => prev.map(step => {
          if (step.id === 1) return { ...step, status: "completed" as StepStatus };
          if (step.id === 2) return { ...step, status: "current" as StepStatus };
          return step;
        }));
        try {
          if (demoMode) {
            const demoRunId = `demo-${Date.now()}`;
            setCurrentDraftRunId(demoRunId);
            await recordAudit(demoRunId, "draft_generated", {
              document_type: selectedDocType,
              draft_mode: selectedMode,
              advanced_mode: advancedMode,
              mode: "demo",
            });
          } else {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              throw new Error("No authenticated user for persistence.");
            }

            const { data: draftRun } = await supabaseAny
              .from("draft_runs")
              .insert({
                user_id: user.id,
                company_id: clientSource === "live" ? selectedClient : null,
                document_type: selectedDocType,
                draft_mode: selectedMode,
                status: "generated",
                notice_input: maskedNoticeDetails ?? null,
                draft_content: content,
                qa: data?.qa ?? null,
                package: data?.package ?? null,
              })
              .select("id")
              .single();
            if (draftRun?.id) {
              setCurrentDraftRunId(draftRun.id);
              await recordAudit(draftRun.id, "draft_generated", {
                document_type: selectedDocType,
                draft_mode: selectedMode,
                advanced_mode: advancedMode,
              });
            }
            await supabaseAny.from("practice_preferences").upsert({
              user_id: user.id,
              preferred_mode: selectedMode,
              preferred_document_type: selectedDocType,
              prefer_pii_masking: preferPiiMasking,
            });
          }
        } catch {
          // non-blocking persistence
        }
        toast.success("Advanced filing-ready draft generated successfully!");
        return;
      }

      if (!response.body) {
        throw new Error("Failed to generate draft stream. Please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              const patchedStreaming = selectedDocType === "mca-notice"
                ? enforceMcaHardFixes(fullContent, noticeDetails, mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType)
                : fullContent;
              setDraftContent(patchedStreaming);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setDraftGenerated(true);
      setShowFormatDetails(false);
      setCurrentSteps(prev => prev.map(step => {
        if (step.id === 1) return { ...step, status: "completed" as StepStatus };
        if (step.id === 2) return { ...step, status: "current" as StepStatus };
        return step;
      }));
      toast.success("Filing-ready draft generated successfully!");

    } catch (error) {
      console.error("Draft generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      const networkLikeFailure =
        /failed to fetch/i.test(errorMessage) ||
        /networkerror/i.test(errorMessage) ||
        /load failed/i.test(errorMessage) ||
        /aborterror/i.test(errorMessage);

      if (networkLikeFailure) {
        setGenerationError("Live drafting service unreachable. Check Supabase function deployment and API keys.");
        toast.error("Live drafting service unreachable. Fix backend configuration.");
        return;
      }

      setGenerationError(errorMessage);
      toast.error(errorMessage || "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-cyan-500/10">
          <Sparkles className="w-6 h-6 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">AI Drafting Engine</h2>
          <p className="text-sm text-muted-foreground">
            Generate filing-ready regulatory drafts — Facts → Law → Application → Conclusion
          </p>
        </div>
        <Badge className="ml-auto bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
          CA-Only Access
        </Badge>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="create">Create Draft</TabsTrigger>
          <TabsTrigger value="review">Review Workflow</TabsTrigger>
          <TabsTrigger value="legal-basis">Legal Basis</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 inline-block mr-2" />
                  Select Client
                </label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.industry})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingClients
                    ? "Loading client list..."
                    : clientSource === "live"
                      ? "Live clients loaded from your account."
                      : "Using demo clients (no live company mapping found)."}
                </p>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 inline-block mr-2" />
                  Document Type
                </label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select document type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.label}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {doc.authority}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Draft Mode */}
              {selectedDocType === "mca-notice" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    MCA Notice Class
                  </label>
                  <Select value={mcaReplyTypeOverride} onValueChange={setMcaReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose MCA notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mcaReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {mcaReplyTypeOptions.find((o) => o.id === inferredMcaReplyType)?.label || "General MCA Adjudication"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "gst-show-cause" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    GST Notice Class
                  </label>
                  <Select value={gstReplyTypeOverride} onValueChange={setGstReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose GST notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gstReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {gstReplyTypeOptions.find((o) => o.id === inferredGstReplyType)?.label || "General GST Show Cause"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "income-tax-response" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    Income Tax Notice Class
                  </label>
                  <Select value={incomeTaxReplyTypeOverride} onValueChange={setIncomeTaxReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose income-tax notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeTaxReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {incomeTaxReplyTypeOptions.find((o) => o.id === inferredIncomeTaxReplyType)?.label || "General Income-tax Response"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "rbi-filing" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    RBI Notice Class
                  </label>
                  <Select value={rbiReplyTypeOverride} onValueChange={setRbiReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose RBI notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rbiReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {rbiReplyTypeOptions.find((o) => o.id === inferredRbiReplyType)?.label || "General RBI / FEMA Reply"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "sebi-compliance" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    SEBI Notice Class
                  </label>
                  <Select value={sebiReplyTypeOverride} onValueChange={setSebiReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose SEBI notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sebiReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {sebiReplyTypeOptions.find((o) => o.id === inferredSebiReplyType)?.label || "General SEBI Compliance"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "customs-response" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    Customs Notice Class
                  </label>
                  <Select value={customsReplyTypeOverride} onValueChange={setCustomsReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose Customs notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customsReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {customsReplyTypeOptions.find((o) => o.id === inferredCustomsReplyType)?.label || "General Customs Response"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "contract-review" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    Contract Review Class
                  </label>
                  <Select value={contractReplyTypeOverride} onValueChange={setContractReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose contract review class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contractReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {contractReplyTypeOptions.find((o) => o.id === inferredContractReplyType)?.label || "General Contract Review"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType === "custom-draft" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Book className="w-4 h-4 inline-block mr-2" />
                    Custom Notice Class
                  </label>
                  <Select value={customReplyTypeOverride} onValueChange={setCustomReplyTypeOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose custom notice class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customReplyTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-detected class:{" "}
                    <span className="text-foreground font-medium">
                      {customReplyTypeOptions.find((o) => o.id === inferredCustomReplyType)?.label || "General Custom Regulatory Reply"}
                    </span>
                  </p>
                </div>
              )}

              {selectedDocType && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <FileText className="w-4 h-4 inline-block mr-2" />
                    Template Pack
                  </label>
                  <Select value={templatePackOverride} onValueChange={setTemplatePackOverride}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose template pack..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templatePackOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto template tracks class:{" "}
                    <span className="text-foreground font-medium">{selectedClassLabel}</span>. Available packs:{" "}
                    <span className="text-foreground font-medium">{templatePackOptions.length - 1}</span> for this class.
                  </p>
                </div>
              )}

              {/* Draft Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Scale className="w-4 h-4 inline-block mr-2" />
                  Draft Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {draftModes.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedMode === mode.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <p className={`font-medium text-sm ${mode.color}`}>{mode.label}</p>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Details */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Upload className="w-4 h-4 inline-block mr-2" />
                  Notice / Order Details
                </label>
                <Textarea 
                  placeholder="Paste notice content, order text, or key facts for para-by-para rebuttal. Technical objections will only be raised if supported by the content provided here."
                  value={noticeDetails}
                  onChange={(e) => setNoticeDetails(e.target.value)}
                  className="min-h-[100px] bg-background/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Providing notice details enables point-by-point rebuttal. Procedural objections are raised only if evidence supports them.
                </p>
                <input
                  ref={noticeUploadInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md,.csv,.json,.xml,.html,.htm,.log,.png,.jpg,.jpeg,.webp"
                  onChange={handleUploadNoticeAndAutoFill}
                />
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => noticeUploadInputRef.current?.click()}
                    disabled={isProcessingNoticeUpload}
                    className="w-full h-auto min-h-11 py-2 whitespace-normal text-center leading-tight"
                  >
                    {isProcessingNoticeUpload ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Notice"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateNoticeDetailsAI}
                    disabled={!selectedDocType || isGeneratingNoticeDetails}
                    className="w-full h-auto min-h-11 py-2 whitespace-normal text-center leading-tight"
                  >
                    {isGeneratingNoticeDetails ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate AI Notice Details"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleInsertTemplate}
                    disabled={!selectedDocType}
                    className="w-full h-auto min-h-11 py-2 whitespace-normal text-center leading-tight"
                  >
                    Insert 200+ Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyTemplate}
                    disabled={!selectedDocType}
                    className="w-full h-auto min-h-11 py-2 whitespace-normal text-center leading-tight"
                  >
                    Copy 200+ Template
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Upload notice auto-detects class/type and regenerates Notice/Order Details. You can still edit everything manually.
                </p>
                {uploadedNoticeFileName ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last uploaded notice: <span className="text-foreground">{uploadedNoticeFileName}</span>
                  </p>
                ) : null}
                <div className="mt-2 p-2 rounded-lg border border-border/50 bg-background/40 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">PII Masking before generation</p>
                  <button
                    type="button"
                    onClick={() => setPreferPiiMasking((prev) => !prev)}
                    className={`px-2 py-1 rounded text-xs border ${
                      preferPiiMasking
                        ? "bg-green-500/20 text-green-300 border-green-500/40"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {preferPiiMasking ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/50 bg-background/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Advanced Draft Mode</p>
                  <button
                    type="button"
                    onClick={() => setAdvancedMode(prev => !prev)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      advancedMode
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {advancedMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Enabled: document-specific para-wise matrix, computation rebuttal, annexure mapping, and quality gates.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className={noticeLength >= 200 ? "text-green-400" : "text-yellow-400"}>
                    {noticeLength >= 200 ? "✓" : "!"} Detailed notice text (200+)
                  </p>
                  {selectedDocType ? (
                    checkResults.map((item) => (
                      <p key={item.label} className={item.passed ? "text-green-400" : "text-yellow-400"}>
                        {item.passed ? "✓" : "!"} {item.label}
                      </p>
                    ))
                  ) : (
                    <p className="text-yellow-400">! Select document type to load specific checks</p>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                size="lg" 
                className="w-full btn-glow"
                disabled={!selectedClient || !selectedDocType || isGenerating}
                onClick={handleGenerateDraft}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Filing-Ready Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Draft
                  </>
                )}
              </Button>

              {generationError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {generationError}
                </div>
              )}
            </div>

            {/* Right: Draft Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  <Edit3 className="w-4 h-4 inline-block mr-2" />
                  Draft Content
                </label>
                {draftGenerated && (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    Filing-Ready
                  </Badge>
                )}
              </div>
              <Textarea 
                placeholder="Draft will appear here after generation. The engine produces a filing-ready document with proper legal structure, section citations, and prayer for reliefs..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="min-h-[400px] bg-background/50 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                All edits are tracked line-by-line for audit compliance. Structure: Facts → Law → Application → Conclusion.
              </p>

              {draftGenerated && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowFormatDetails(prev => !prev)}
                  >
                    {showFormatDetails ? "Hide Draft Format Followed" : "View Draft Format Followed"}
                  </Button>
                </div>
              )}

              {draftGenerated && showFormatDetails && (
                <div className="mt-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-sm space-y-3">
                  <p className="font-medium text-cyan-300">
                    Format Blueprint: {selectedDocLabel} ({advancedMode ? "Advanced Mode" : "Standard Mode"})
                  </p>
                  <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                    <li>Notice Header and Filing Caption</li>
                    <li>Preliminary Submissions</li>
                    <li>Facts and Chronology</li>
                    <li>Issue-Wise Legal Submissions</li>
                    <li>Evidence and Annexure Mapping</li>
                    <li>Prayer / Relief Section with layered requests</li>
                    <li>Authorized Signatory Block</li>
                  </ul>
                  {advancedMode && (
                    <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                      <li>Notice Intelligence Snapshot</li>
                      <li>Para-wise Rebuttal Matrix</li>
                      <li>Computation Reconciliation Table</li>
                      <li>Procedural Validity Check (fact-supported only)</li>
                      <li>RUD vs Annexure Mapping</li>
                    </ul>
                  )}
                  <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                    {docSpecificFormat.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draftGenerated && selectedDocType === "mca-notice" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runMcaDraftIssueCheck}
                  >
                    Check What Is Wrong In This MCA Draft
                  </Button>
                  {mcaHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        mcaComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {mcaComputedIssueReport.ok ? (
                        <p>All MCA checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {mcaComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">
                                  Suggestion: {item.suggestion}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {liveMcaAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveMcaAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (MCA)</p>
                    <p className="text-xs text-muted-foreground">
                      Auto-detected pending fixes are synced from Issue Detector. Add optional CA notes, then regenerate.
                    </p>
                    <Textarea
                      value={mcaEvidenceContext}
                      onChange={(e) => setMcaEvidenceContext(e.target.value)}
                      placeholder="Optional: paste key extracted PDF/evidence text here (SRN/challan, filing dates, officer role records) for Recheck AI cross-validation."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckMcaDraft}
                      disabled={isRecheckingMca || !draftGenerated}
                    >
                      {isRecheckingMca ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking AI...
                        </>
                      ) : (
                        "Recheck AI (Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {mcaRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        mcaRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{mcaRecheckReport.ok ? "Recheck AI: Passed" : "Recheck AI: Flags Detected"}</p>
                        {mcaRecheckReport.summary ? <p>{mcaRecheckReport.summary}</p> : null}
                        {!mcaRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {mcaRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">
                      Pending fixes: {mcaPendingFixCount}
                    </p>
                    <Textarea
                      value={mcaAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {mcaPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {mcaPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={mcaUserFixNotes}
                      onChange={(e) => setMcaUserFixNotes(e.target.value)}
                      placeholder="Optional CA note: add custom drafting instructions here."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyMcaFix}
                      disabled={isApplyingMcaFix || !draftGenerated || (mcaPendingFixCount === 0 && mcaUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingMcaFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate MCA Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "gst-show-cause" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runGstDraftIssueCheck}
                  >
                    Check What Is Wrong In This GST Draft
                  </Button>
                  {gstHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        gstComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {gstComputedIssueReport.ok ? (
                        <p>All GST checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {gstComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveGstAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveGstAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (GST)</p>
                    <p className="text-xs text-muted-foreground">
                      GST issue detector and recheck are separate from MCA. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={gstEvidenceContext}
                      onChange={(e) => setGstEvidenceContext(e.target.value)}
                      placeholder="Optional: paste GST evidence text (DRC/GSTR/ITC reconciliation extracts) for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckGstDraft}
                      disabled={isRecheckingGst || !draftGenerated}
                    >
                      {isRecheckingGst ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking GST AI...
                        </>
                      ) : (
                        "Recheck AI (GST Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {gstRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        gstRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{gstRecheckReport.ok ? "GST Recheck AI: Passed" : "GST Recheck AI: Flags Detected"}</p>
                        {gstRecheckReport.summary ? <p>{gstRecheckReport.summary}</p> : null}
                        {!gstRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {gstRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending GST fixes: {gstPendingFixCount}</p>
                    <Textarea
                      value={gstAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {gstPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {gstPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={gstUserFixNotes}
                      onChange={(e) => setGstUserFixNotes(e.target.value)}
                      placeholder="Optional CA note for GST AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyGstFix}
                      disabled={isApplyingGstFix || !draftGenerated || (gstPendingFixCount === 0 && gstUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingGstFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying GST AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate GST Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "income-tax-response" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runIncomeTaxDraftIssueCheck}
                  >
                    Check What Is Wrong In This Income Tax Draft
                  </Button>
                  {incomeTaxHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        incomeTaxComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {incomeTaxComputedIssueReport.ok ? (
                        <p>All Income-tax checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {incomeTaxComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveIncomeTaxAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveIncomeTaxAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (Income Tax)</p>
                    <p className="text-xs text-muted-foreground">
                      Income-tax issue detector and recheck are separate from MCA/GST. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={incomeTaxEvidenceContext}
                      onChange={(e) => setIncomeTaxEvidenceContext(e.target.value)}
                      placeholder="Optional: paste assessment extracts, ledger/tax-effect sheets, or supporting evidence for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckIncomeTaxDraft}
                      disabled={isRecheckingIncomeTax || !draftGenerated}
                    >
                      {isRecheckingIncomeTax ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking Income-tax AI...
                        </>
                      ) : (
                        "Recheck AI (Income Tax Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {incomeTaxRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        incomeTaxRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{incomeTaxRecheckReport.ok ? "Income-tax Recheck AI: Passed" : "Income-tax Recheck AI: Flags Detected"}</p>
                        {incomeTaxRecheckReport.summary ? <p>{incomeTaxRecheckReport.summary}</p> : null}
                        {!incomeTaxRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {incomeTaxRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending Income-tax fixes: {incomeTaxPendingFixCount}</p>
                    <Textarea
                      value={incomeTaxAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {incomeTaxPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {incomeTaxPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={incomeTaxUserFixNotes}
                      onChange={(e) => setIncomeTaxUserFixNotes(e.target.value)}
                      placeholder="Optional CA note for Income-tax AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyIncomeTaxFix}
                      disabled={isApplyingIncomeTaxFix || !draftGenerated || (incomeTaxPendingFixCount === 0 && incomeTaxUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingIncomeTaxFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying Income-tax AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate Income Tax Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "rbi-filing" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runRbiDraftIssueCheck}
                  >
                    Check What Is Wrong In This RBI Draft
                  </Button>
                  {rbiHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        rbiComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {rbiComputedIssueReport.ok ? (
                        <p>All RBI checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {rbiComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveRbiAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveRbiAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (RBI)</p>
                    <p className="text-xs text-muted-foreground">
                      RBI issue detector and recheck are separate from MCA/GST/Income-tax. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={rbiEvidenceContext}
                      onChange={(e) => setRbiEvidenceContext(e.target.value)}
                      placeholder="Optional: paste FEMA/RBI evidence text (AD bank records, acknowledgements, filing trail) for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckRbiDraft}
                      disabled={isRecheckingRbi || !draftGenerated}
                    >
                      {isRecheckingRbi ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking RBI AI...
                        </>
                      ) : (
                        "Recheck AI (RBI Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {rbiRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        rbiRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{rbiRecheckReport.ok ? "RBI Recheck AI: Passed" : "RBI Recheck AI: Flags Detected"}</p>
                        {rbiRecheckReport.summary ? <p>{rbiRecheckReport.summary}</p> : null}
                        {!rbiRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {rbiRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending RBI fixes: {rbiPendingFixCount}</p>
                    <Textarea
                      value={rbiAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {rbiPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {rbiPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={rbiUserFixNotes}
                      onChange={(e) => setRbiUserFixNotes(e.target.value)}
                      placeholder="Optional CA note for RBI AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyRbiFix}
                      disabled={isApplyingRbiFix || !draftGenerated || (rbiPendingFixCount === 0 && rbiUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingRbiFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying RBI AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate RBI Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "sebi-compliance" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runSebiDraftIssueCheck}
                  >
                    Check What Is Wrong In This SEBI Draft
                  </Button>
                  {sebiHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        sebiComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {sebiComputedIssueReport.ok ? (
                        <p>All SEBI checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {sebiComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveSebiAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveSebiAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (SEBI)</p>
                    <p className="text-xs text-muted-foreground">
                      SEBI issue detector and recheck are separate from MCA/GST/Income-tax/RBI. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={sebiEvidenceContext}
                      onChange={(e) => setSebiEvidenceContext(e.target.value)}
                      placeholder="Optional: paste SEBI evidence text (exchange disclosures, board records, filing proofs) for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckSebiDraft}
                      disabled={isRecheckingSebi || !draftGenerated}
                    >
                      {isRecheckingSebi ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking SEBI AI...
                        </>
                      ) : (
                        "Recheck AI (SEBI Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {sebiRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        sebiRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{sebiRecheckReport.ok ? "SEBI Recheck AI: Passed" : "SEBI Recheck AI: Flags Detected"}</p>
                        {sebiRecheckReport.summary ? <p>{sebiRecheckReport.summary}</p> : null}
                        {!sebiRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {sebiRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending SEBI fixes: {sebiPendingFixCount}</p>
                    <Textarea
                      value={sebiAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {sebiPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {sebiPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={sebiUserFixNotes}
                      onChange={(e) => setSebiUserFixNotes(e.target.value)}
                      placeholder="Optional CA note for SEBI AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplySebiFix}
                      disabled={isApplyingSebiFix || !draftGenerated || (sebiPendingFixCount === 0 && sebiUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingSebiFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying SEBI AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate SEBI Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "customs-response" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runCustomsDraftIssueCheck}
                  >
                    Check What Is Wrong In This Customs Draft
                  </Button>
                  {customsHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        customsComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {customsComputedIssueReport.ok ? (
                        <p>All Customs checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {customsComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveCustomsAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveCustomsAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (Customs)</p>
                    <p className="text-xs text-muted-foreground">
                      Customs issue detector and recheck are separate from other regulators. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={customsEvidenceContext}
                      onChange={(e) => setCustomsEvidenceContext(e.target.value)}
                      placeholder="Optional: paste customs evidence text (BoE, invoices, valuation docs, CoO, test reports) for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckCustomsDraft}
                      disabled={isRecheckingCustoms || !draftGenerated}
                    >
                      {isRecheckingCustoms ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking Customs AI...
                        </>
                      ) : (
                        "Recheck AI (Customs Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {customsRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        customsRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{customsRecheckReport.ok ? "Customs Recheck AI: Passed" : "Customs Recheck AI: Flags Detected"}</p>
                        {customsRecheckReport.summary ? <p>{customsRecheckReport.summary}</p> : null}
                        {!customsRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {customsRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending Customs fixes: {customsPendingFixCount}</p>
                    <Textarea
                      value={customsAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {customsPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {customsPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={customsUserFixNotes}
                      onChange={(e) => setCustomsUserFixNotes(e.target.value)}
                      placeholder="Optional CA note for Customs AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyCustomsFix}
                      disabled={isApplyingCustomsFix || !draftGenerated || (customsPendingFixCount === 0 && customsUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingCustomsFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying Customs AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate Customs Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "contract-review" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runContractDraftIssueCheck}
                  >
                    Check What Is Wrong In This Contract Draft
                  </Button>
                  {contractHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        contractComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {contractComputedIssueReport.ok ? (
                        <p>All Contract checks passed. This draft is structurally aligned for legal/CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {contractComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveContractAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveContractAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (Contract)</p>
                    <p className="text-xs text-muted-foreground">
                      Contract issue detector and recheck are separate from other regulators. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={contractEvidenceContext}
                      onChange={(e) => setContractEvidenceContext(e.target.value)}
                      placeholder="Optional: paste contract evidence/context clauses for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckContractDraft}
                      disabled={isRecheckingContract || !draftGenerated}
                    >
                      {isRecheckingContract ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking Contract AI...
                        </>
                      ) : (
                        "Recheck AI (Contract Draft + Context + Evidence)"
                      )}
                    </Button>
                    {contractRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        contractRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{contractRecheckReport.ok ? "Contract Recheck AI: Passed" : "Contract Recheck AI: Flags Detected"}</p>
                        {contractRecheckReport.summary ? <p>{contractRecheckReport.summary}</p> : null}
                        {!contractRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {contractRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending Contract fixes: {contractPendingFixCount}</p>
                    <Textarea
                      value={contractAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {contractPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {contractPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={contractUserFixNotes}
                      onChange={(e) => setContractUserFixNotes(e.target.value)}
                      placeholder="Optional legal/CA note for Contract AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyContractFix}
                      disabled={isApplyingContractFix || !draftGenerated || (contractPendingFixCount === 0 && contractUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingContractFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying Contract AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate Contract Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && selectedDocType === "custom-draft" && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={runCustomDraftIssueCheck}
                  >
                    Check What Is Wrong In This Custom Draft
                  </Button>
                  {customHasChecked && (
                    <div
                      className={`p-4 rounded-lg border text-sm ${
                        customComputedIssueReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      }`}
                    >
                      {customComputedIssueReport.ok ? (
                        <p>All Custom checks passed. This draft is structurally aligned for CA review.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">Issues detected:</p>
                          <ul className="list-disc pl-5 space-y-2">
                            {customComputedIssueReport.items.map((item, idx) => (
                              <li key={`${item.issue}-${idx}`}>
                                <p>{item.issue}</p>
                                <p className="text-xs text-yellow-100/90 mt-1">Suggestion: {item.suggestion}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {liveCustomAdvancedSuggestions.length > 0 && (
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-sm">
                      <p className="font-medium mb-2">Advanced Suggestions:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        {liveCustomAdvancedSuggestions.map((item, idx) => (
                          <li key={`${item.title}-${idx}`}>
                            <p className={item.implemented ? "text-green-300" : "text-cyan-200"}>
                              {item.implemented ? "✓ " : ""}{item.title}
                              <span className={`ml-2 text-[11px] ${item.implemented ? "text-green-300" : "text-yellow-200"}`}>
                                [{item.implemented ? "Implemented" : "Pending"}]
                              </span>
                            </p>
                            <p className="text-xs text-cyan-100/90 mt-1">Suggestion: {item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
                    <p className="text-sm font-medium text-foreground">AI Fix Assistant (Custom)</p>
                    <p className="text-xs text-muted-foreground">
                      Custom issue detector and recheck are separate from other regulators. Add optional notes, then regenerate.
                    </p>
                    <Textarea
                      value={customEvidenceContext}
                      onChange={(e) => setCustomEvidenceContext(e.target.value)}
                      placeholder="Optional: paste additional evidence text for Recheck AI."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRecheckCustomDraft}
                      disabled={isRecheckingCustom || !draftGenerated}
                    >
                      {isRecheckingCustom ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rechecking Custom AI...
                        </>
                      ) : (
                        "Recheck AI (Custom Draft + Notice + Evidence)"
                      )}
                    </Button>
                    {customRecheckReport && (
                      <div className={`rounded-lg border p-3 text-xs space-y-2 ${
                        customRecheckReport.ok
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}>
                        <p className="font-medium">{customRecheckReport.ok ? "Custom Recheck AI: Passed" : "Custom Recheck AI: Flags Detected"}</p>
                        {customRecheckReport.summary ? <p>{customRecheckReport.summary}</p> : null}
                        {!customRecheckReport.ok && (
                          <ul className="list-disc pl-4 space-y-2">
                            {customRecheckReport.flags.map((flag, idx) => (
                              <li key={`${flag.issue}-${idx}`}>
                                <p>[{flag.severity.toUpperCase()}] {flag.issue}</p>
                                <p className="text-rose-100/90">Fix: {flag.fix}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-cyan-300">Pending Custom fixes: {customPendingFixCount}</p>
                    <Textarea
                      value={customAutoFixNotes || "No pending issue-detector fixes right now."}
                      readOnly
                      className="min-h-[90px] bg-background/40 text-muted-foreground"
                    />
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs space-y-2">
                      <p className="font-medium text-cyan-200">Pending Fix Solutions (AI)</p>
                      {customPendingFixPlaybook.length === 0 ? (
                        <p className="text-cyan-100/80">No pending solutions. Draft is clear on current checks.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-2 text-cyan-100/90">
                          {customPendingFixPlaybook.map((item, idx) => (
                            <li key={`${item.title}-${idx}`}>
                              <p>{item.title}</p>
                              <p className="text-cyan-100/75">How to fix: {item.solution}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Textarea
                      value={customUserFixNotes}
                      onChange={(e) => setCustomUserFixNotes(e.target.value)}
                      placeholder="Optional CA note for Custom AI fix."
                      className="min-h-[90px] bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyCustomFix}
                      disabled={isApplyingCustomFix || !draftGenerated || (customPendingFixCount === 0 && customUserFixNotes.trim().length === 0)}
                    >
                      {isApplyingCustomFix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying Custom AI Fix...
                        </>
                      ) : (
                        "Apply AI Fix & Regenerate Custom Draft"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {draftGenerated && draftQA && (
                <div className="mt-3 p-4 rounded-lg border border-border/50 bg-background/30 text-sm space-y-2">
                  <p className="font-medium text-foreground">
                    Filing Score: {draftQA.filing_score}/100
                    <span className="ml-2 text-xs uppercase text-muted-foreground">Risk: {draftQA.risk_band}</span>
                  </p>
                  {draftQA.missing_for_final_filing && draftQA.missing_for_final_filing.length > 0 && (
                    <ul className="list-disc pl-5 text-yellow-400">
                      {draftQA.missing_for_final_filing.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="review">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Mandatory Review Workflow
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {includeLawyerReview
                  ? "Every draft must pass through CA and lawyer verification before final sign-off."
                  : "Every draft must pass through CA verification and final sign-off. No step can be skipped."}
              </p>
              {draftGenerated && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline">Status: {workflowStatus}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!currentDraftRunId || workflowStatus !== "generated"}
                    onClick={async () => {
                      if (!currentDraftRunId) return;
                      if (!demoMode) {
                        await supabaseAny.from("draft_runs").update({ status: "under_review" }).eq("id", currentDraftRunId);
                      }
                      setWorkflowStatus("under_review");
                      await recordAudit(currentDraftRunId, "submitted_for_review");
                    }}
                  >
                    Submit for Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!currentDraftRunId || workflowStatus !== "under_review"}
                    onClick={async () => {
                      if (!currentDraftRunId) return;
                      if (!demoMode) {
                        await supabaseAny.from("draft_runs").update({ status: "approved" }).eq("id", currentDraftRunId);
                      }
                      setWorkflowStatus("approved");
                      await recordAudit(currentDraftRunId, "approved_by_senior");
                    }}
                  >
                    Mark Approved
                  </Button>
                  <Button
                    size="sm"
                    disabled={!currentDraftRunId || workflowStatus !== "approved"}
                    onClick={async () => {
                      if (!currentDraftRunId) return;
                      if (!demoMode) {
                        await supabaseAny.from("draft_runs").update({ status: "signed_off" }).eq("id", currentDraftRunId);
                      }
                      setWorkflowStatus("signed_off");
                      await recordAudit(currentDraftRunId, "final_sign_off");
                    }}
                  >
                    Final Sign-off
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/50" />
                
                <div className="space-y-6">
                  {currentSteps.map((step) => (
                    <div key={step.id} className="flex items-start gap-4 relative">
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                        step.status === "completed" 
                          ? "bg-green-500/20 text-green-500" 
                          : step.status === "current"
                            ? "bg-primary/20 text-primary ring-2 ring-primary"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {step.status === "completed" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <span className="font-bold">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className={`font-medium ${
                          step.status === "completed" 
                            ? "text-green-500" 
                            : step.status === "current"
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </p>
                        {step.status === "current" && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Currently awaiting your review and approval
                          </p>
                        )}
                      </div>
                      {step.status === "current" && (
                        <Button size="sm" className="shrink-0">
                          <Eye className="w-4 h-4 mr-2" />
                          Review Now
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {auditEvents.length > 0 && (
                <div className="mt-6 p-4 rounded-lg border border-border/50 bg-background/30">
                  <p className="text-sm font-medium mb-2">Recent Audit Trail</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {auditEvents.map((event, idx) => (
                      <li key={`${event.event_type}-${idx}`}>
                        {event.event_type} • {new Date(event.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal-basis">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Legal Basis Panel
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Every draft includes transparent regulatory citations
              </p>
            </CardHeader>
            <CardContent>
              {draftGenerated ? (
                <div className="space-y-4">
                  {draftQA && draftQA.explainability && draftQA.explainability.length > 0 && (
                    <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                      <h4 className="font-medium text-foreground mb-3">Explainability Panel</h4>
                      <ul className="space-y-2 text-sm">
                        {draftQA.explainability.slice(0, 5).map((item) => (
                          <li key={`${item.legal_point}-${item.evidence_anchor}`} className="text-muted-foreground">
                            <strong className="text-foreground">{item.legal_point}:</strong> {item.why_included}
                            <span className="block text-xs text-cyan-300">Evidence: {item.evidence_anchor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {draftPackage && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-medium text-foreground mb-3">Multi-Output Package</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>Reply Draft: Ready</li>
                        <li>Annexure Index: {(draftPackage.annexure_index ?? []).length} items</li>
                        <li>Hearing Notes: {draftPackage.hearing_notes ? "Generated" : "Pending"}</li>
                        <li>Argument Script: {(draftPackage.argument_script ?? []).length} talking points</li>
                      </ul>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium text-foreground mb-3">Draft prepared under:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Act:</strong> Central Goods and Services Tax Act, 2017</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Section:</strong> Section 73 (Determination of tax not paid or short paid)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Rule:</strong> Rule 142 of CGST Rules, 2017</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span><strong>Circular:</strong> Circular No. 185/2022-GST dated 27.12.2022</span>
                      </li>
                    </ul>
                  </div>

                  {/* Risk Highlights */}
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-destructive" />
                      Risk & Gap Highlights
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span>Missing disclosure: Bank reconciliation statement not attached</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <span>Penalty exposure: ₹2,50,000 if notice not addressed within 30 days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <span>Filing delay: Response deadline is February 15, 2026</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generate a draft to see the legal basis panel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AIDraftingEngine;
