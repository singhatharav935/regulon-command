import { useEffect, useMemo, useState } from "react";
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

  return `Notice/Order Details Summary for ${authorityLabel}: Reference ${noticeNo}, dated ${noticeDate}, DIN/RFN ${dinOrRfn}. The notice indicates alleged non-compliance under ${sections.length ? sections.join(", ") : "[To be filled by CA/Lawyer]"}${rules.length ? ` read with ${rules.join(", ")}` : ""}, for period ${fy}. Proposed exposure/penalty marker captured from notice text is INR ${amount}. ${mcaSpecificLine} Drafting requirements: include chronology with due/event date vs actual action date, section-wise legal submissions, annexure mapping with document anchors, and hearing request. Keep pending factual fields as [To be filled by CA/Lawyer] only.`;
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
  const [mcaReplyTypeOverride, setMcaReplyTypeOverride] = useState<string>("auto");
  const [gstReplyTypeOverride, setGstReplyTypeOverride] = useState<string>("auto");
  const [incomeTaxReplyTypeOverride, setIncomeTaxReplyTypeOverride] = useState<string>("auto");
  const [rbiReplyTypeOverride, setRbiReplyTypeOverride] = useState<string>("auto");
  const [noticeDetails, setNoticeDetails] = useState<string>("");
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
  const selectedTemplate = selectedDocType ? readyNoticeTemplates[selectedDocType] : "";
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

    const prevTemplate = lastTemplateDocType ? readyNoticeTemplates[lastTemplateDocType] : "";
    const currentText = noticeDetails.trim();
    const canAutoReplace = currentText.length === 0 || (prevTemplate && currentText === prevTemplate);

    if (canAutoReplace) {
      setNoticeDetails(readyNoticeTemplates[selectedDocType] || "");
      setLastTemplateDocType(selectedDocType);
    }
  }, [selectedDocType, lastTemplateDocType, noticeDetails]);

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

  const handleInsertTemplate = () => {
    if (!selectedDocType || !selectedTemplate) {
      toast.error("Select a document type first.");
      return;
    }
    setNoticeDetails(selectedTemplate);
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
    const client = clientOptions.find((c) => c.id === selectedClient);
    setIsGeneratingNoticeDetails(true);
    try {
      const sourceNotice = noticeDetails.trim() || readyNoticeTemplates[selectedDocType] || "";
      const generated = await requestDraftData({
        operation: "notice-details",
        documentType: selectedDocType,
        companyName: client?.name || "Company",
        industry: client?.industry || "",
        draftMode: selectedMode,
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
        context: `Generate precise Notice/Order Details for ${selectedDocLabel}. Ensure this is input-quality text for strict legal drafting checks.`,
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
      const fallbackNotice = sourceNotice;
      const sanitizedNotice = sanitizeNoticeDetailsClient(aiNoticeDetails, fallbackNotice);
      const normalizedSanitized = normalizeForComparison(sanitizedNotice);
      const normalizedCurrent = normalizeForComparison(noticeDetails);
      const normalizedTemplate = normalizeForComparison(readyNoticeTemplates[selectedDocType] || "");
      const shouldUseStructuredFallback =
        normalizedSanitized.length === 0 ||
        normalizedSanitized === normalizedCurrent ||
        normalizedSanitized === normalizedTemplate;

      const finalNoticeDetails = shouldUseStructuredFallback
        ? buildStructuredNoticeDetailsFallback(
            selectedDocType,
            sourceNotice,
            selectedDocLabel,
            selectedDocType === "mca-notice"
              ? (mcaReplyTypeOverride !== "auto" ? mcaReplyTypeOverride : inferredMcaReplyType)
              : undefined,
          )
        : sanitizedNotice;

      setNoticeDetails(finalNoticeDetails);
      setLastTemplateDocType(selectedDocType);
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
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateNoticeDetailsAI}
                    disabled={!selectedDocType || isGeneratingNoticeDetails}
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
                  >
                    Insert 200+ Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyTemplate}
                    disabled={!selectedDocType}
                  >
                    Copy 200+ Template
                  </Button>
                </div>
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
