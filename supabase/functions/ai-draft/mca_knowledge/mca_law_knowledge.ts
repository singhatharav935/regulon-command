export type McaReplyType =
  | "annual-filing-92-137"
  | "board-reporting-117"
  | "charge-77-79"
  | "beneficial-ownership-90"
  | "board-governance-173"
  | "board-report-134"
  | "related-party-188"
  | "managerial-kmp-203"
  | "deposits-73-76"
  | "general-mca";

type McaKnowledgeUnit = {
  statutoryFramework: string[];
  legalPositioning: string[];
  mandatoryEvidence: string[];
  mandatoryDraftBlocks: string[];
  riskControls: string[];
};

const MCA_COMMON_KNOWLEDGE: McaKnowledgeUnit = {
  statutoryFramework: [
    "Companies Act, 2013: Section 454 adjudication framework and Companies (Adjudication of Penalties) Rules, 2014.",
    "Section 403 delayed filing mechanism with additional fees (where filing provisions permit delayed filing).",
    "Section 446B reduced penalty logic only when company class qualification is factually established.",
  ],
  legalPositioning: [
    "Default classification must distinguish procedural delay from substantive non-disclosure/fraud.",
    "Penalty prayer must remain calibrated: 'drop or reduce' based on rectification, role, conduct, and mitigating facts.",
    "Officer-level submissions must be role-period specific and avoid blanket absolution claims.",
  ],
  mandatoryEvidence: [
    "Notice metadata: ROC office, notice number, DIN/RFN, notice date, period under adjudication.",
    "Chronology evidence: due/event dates, actual filing/action dates, SRN/challan/reference IDs.",
    "Authority records: MCA acknowledgments, challans, board authorisation, and support documents.",
  ],
  mandatoryDraftBlocks: [
    "Preliminary submissions and rectification status.",
    "Chronology table with due vs actual + reference IDs.",
    "Section-wise legal submissions (including Section 454 treatment).",
    "Officer-specific defense table.",
    "Annexure mapping and hearing request.",
  ],
  riskControls: [
    "Do not claim Section 446B unless paid-up capital/turnover/startup criteria are stated with date relevance.",
    "Do not use risky wording: waive/absolve/total immunity unless directly supported by statute/order facts.",
    "Do not leave factual placeholders unresolved in final output except explicit CA/Lawyer placeholders where data is pending.",
  ],
};

const MCA_TYPE_KNOWLEDGE: Record<McaReplyType, McaKnowledgeUnit> = {
  "annual-filing-92-137": {
    statutoryFramework: [
      "Section 92(4) annual return filing timeline (MGT-7) and Section 137(1)/(2) financial statement filing (AOC-4).",
      "Section 403 additional fee regime for delayed filing; legal effect is regularization of filing record, not automatic penalty immunity.",
      "Section 454(3) proviso (fact-dependent): if eligible rectification timeline conditions are satisfied, seek no-penalty conclusion.",
    ],
    legalPositioning: [
      "Must explicitly cover both AOC-4 and MGT-7 in chronology and legal submissions.",
      "Submission must state whether rectification occurred before notice issuance or within the statutory window.",
      "Prayer should seek calibrated adjudication outcome, not unsupported blanket relief.",
    ],
    mandatoryEvidence: [
      "AOC-4 filing acknowledgment/challan with SRN and date.",
      "MGT-7 filing acknowledgment/challan with SRN and date.",
      "AGM date proof and filing due-date derivation.",
    ],
    mandatoryDraftBlocks: [
      "Section 92/137 + Section 403 analysis block.",
      "Section 454 proviso (fact-dependent) block.",
      "AOC-4/MGT-7 chronology rows with due vs actual dates.",
    ],
    riskControls: [
      "Avoid over-claiming that additional fees alone extinguish adjudication in all cases.",
      "Avoid 'double jeopardy' style rhetoric unless narrowly framed and legally supportable.",
      "Ensure notice date consistency across heading, facts, and prayer.",
    ],
  },
  "board-reporting-117": {
    statutoryFramework: [
      "Section 117 and applicable rules for filing resolutions/agreements (including form/timeline context).",
      "Section 454 adjudication and role-based officer analysis.",
    ],
    legalPositioning: [
      "Distinguish delay in filing from non-passing of resolution.",
      "Tie timeline computation to resolution date and filing date with references.",
    ],
    mandatoryEvidence: [
      "Resolution date proof, board/meeting records, and filing acknowledgment.",
      "SRN/challan references for filing (e.g., MGT-14 where applicable).",
    ],
    mandatoryDraftBlocks: [
      "Resolution chronology table.",
      "Role-specific officer responsibilities during delay period.",
    ],
    riskControls: [
      "Do not assert filing form details unless notice/facts support them.",
      "Avoid generic text; map each allegation to documentary proof.",
    ],
  },
  "charge-77-79": {
    statutoryFramework: [
      "Sections 77/78/79 charge registration/modification/satisfaction framework.",
      "Rule-based timeline treatment and adjudication under Section 454.",
    ],
    legalPositioning: [
      "Separate creation/modification/satisfaction events; explain timeline causation.",
      "Use lender/charge-holder correspondence where relevant to delay context.",
    ],
    mandatoryEvidence: [
      "Charge instrument date, event date, filing date, and SRN evidence.",
      "Supporting bank/lender communication records where relied upon.",
    ],
    mandatoryDraftBlocks: [
      "Charge-event chronology table.",
      "Section-wise allegation rebuttal for each charge event.",
    ],
    riskControls: [
      "Avoid unsupported assertions about condonation unless specific order/route exists.",
      "Keep event-wise facts precise to avoid contradictions.",
    ],
  },
  "beneficial-ownership-90": {
    statutoryFramework: [
      "Section 90 SBO declaration/reporting obligations and connected rule framework.",
      "Adjudication under Section 454 with officer-level attribution discipline.",
    ],
    legalPositioning: [
      "Separate declaration receipt, register update, and filing timelines.",
      "Address ownership-structure complexity only with factual backing.",
    ],
    mandatoryEvidence: [
      "SBO declarations, internal register extracts, and filing evidence.",
      "Timeline references for declaration date vs filing date.",
    ],
    mandatoryDraftBlocks: [
      "SBO timeline and evidence map.",
      "Officer-specific conduct/knowledge narrative.",
    ],
    riskControls: [
      "Do not include beneficial ownership conclusions beyond record evidence.",
      "Avoid speculative reasons for delayed reporting.",
    ],
  },
  "board-governance-173": {
    statutoryFramework: [
      "Section 173 board meeting compliance obligations and related governance records.",
      "Section 454 adjudication principles for procedural governance defaults.",
    ],
    legalPositioning: [
      "Focus on meeting frequency, records, and curative actions.",
      "Tie each allegation to minutes/attendance/document trail.",
    ],
    mandatoryEvidence: [
      "Board calendar/minutes/attendance extracts.",
      "Corrective governance controls and evidence of implementation.",
    ],
    mandatoryDraftBlocks: [
      "Governance chronology with event dates and records.",
      "Control remediation paragraph with dates.",
    ],
    riskControls: [
      "Avoid asserting compliance history without records.",
      "Do not collapse multiple meeting-cycle allegations into one generic reply.",
    ],
  },
  "board-report-134": {
    statutoryFramework: [
      "Section 134 board report obligations and signature/adoption context.",
      "Section 454 adjudication and proportionality framing.",
    ],
    legalPositioning: [
      "Distinguish report-content allegations from timeline delays.",
      "Map remedial disclosures to specific board report elements.",
    ],
    mandatoryEvidence: [
      "Board approval date, report version references, and filing evidence.",
      "Documentary extracts tied to alleged omission points.",
    ],
    mandatoryDraftBlocks: [
      "Board report compliance matrix.",
      "Rectification and disclosure update timeline.",
    ],
    riskControls: [
      "Avoid unsupported claims that omission is immaterial without factual basis.",
      "Keep narrative tied to exact allegation language.",
    ],
  },
  "related-party-188": {
    statutoryFramework: [
      "Section 188 related party approval/disclosure framework.",
      "Section 454 adjudication and role-specific accountability.",
    ],
    legalPositioning: [
      "Differentiate approval process, disclosure process, and filing process.",
      "Use transaction-wise mapping where multiple RPT items exist.",
    ],
    mandatoryEvidence: [
      "Approval records, transaction references, disclosure extracts.",
      "If applicable, board/shareholder approval chronology.",
    ],
    mandatoryDraftBlocks: [
      "RPT compliance matrix (transaction vs approval/disclosure status).",
      "Officer role-by-role mitigation table.",
    ],
    riskControls: [
      "No broad assertion of arm's-length compliance without transaction records.",
      "Avoid generic statements that skip transaction-level mapping.",
    ],
  },
  "managerial-kmp-203": {
    statutoryFramework: [
      "Section 203 KMP appointment/continuity obligations and timeline implications.",
      "Section 454 adjudication with officer-role segmentation.",
    ],
    legalPositioning: [
      "Clarify vacancy/appointment transition timeline and practical constraints.",
      "Map responsibility period for each officer in default allegation.",
    ],
    mandatoryEvidence: [
      "Appointment/vacancy documents, board approvals, and filings.",
      "Role period data for each officer named in notice.",
    ],
    mandatoryDraftBlocks: [
      "KMP chronology table.",
      "Officer-wise role period and mitigation table.",
    ],
    riskControls: [
      "Avoid implying role periods without documentary support.",
      "Do not seek blanket officer relief without conduct analysis.",
    ],
  },
  "deposits-73-76": {
    statutoryFramework: [
      "Sections 73/74/76 deposit framework and compliance obligations as invoked.",
      "Section 454 adjudication with financial exposure sensitivity.",
    ],
    legalPositioning: [
      "Separate acceptance, repayment, and reporting allegations.",
      "Use strict chronology and documentary trail for each deposit-related event.",
    ],
    mandatoryEvidence: [
      "Deposit records, repayment proof, declarations/returns, and board records.",
      "Event-wise dates with filing/action references.",
    ],
    mandatoryDraftBlocks: [
      "Deposit-event chronology matrix.",
      "Exposure and mitigation block tied to statutory conditions.",
    ],
    riskControls: [
      "Avoid underplaying deposit-related allegations with generic procedural language.",
      "No unsupported statements on investor/public impact.",
    ],
  },
  "general-mca": {
    statutoryFramework: [
      "Infer invoked sections from notice text and map each allegation to statutory condition.",
      "Apply Section 454 adjudication principles with fact-first logic.",
    ],
    legalPositioning: [
      "Construct issue-wise analysis from notice paragraphs and documentary anchors.",
      "Use calibrated relief language with no overstatement.",
    ],
    mandatoryEvidence: [
      "Notice references, chronology references, and supporting records by issue.",
      "Officer role periods and conduct details where officer penalties are proposed.",
    ],
    mandatoryDraftBlocks: [
      "Issue matrix + chronology + officer defense + annexure map.",
      "Fact-dependent statutory relief requests.",
    ],
    riskControls: [
      "Do not copy annual-filing logic unless sections 92/137 are actually invoked.",
      "Avoid section references not present in notice/facts.",
    ],
  },
};

const listToBullets = (items: string[]) => items.map((v) => `- ${v}`).join("\n");

export const getMcaKnowledgeBlock = (mcaReplyType: McaReplyType): string => {
  const typeUnit = MCA_TYPE_KNOWLEDGE[mcaReplyType];
  return `MCA LEGAL KNOWLEDGE BASE (APPLY STRICTLY; FACT-DEPENDENT)
COMMON FRAMEWORK:
${listToBullets(MCA_COMMON_KNOWLEDGE.statutoryFramework)}

COMMON POSITIONING:
${listToBullets(MCA_COMMON_KNOWLEDGE.legalPositioning)}

COMMON EVIDENCE BASELINE:
${listToBullets(MCA_COMMON_KNOWLEDGE.mandatoryEvidence)}

COMMON REQUIRED BLOCKS:
${listToBullets(MCA_COMMON_KNOWLEDGE.mandatoryDraftBlocks)}

COMMON RISK CONTROLS:
${listToBullets(MCA_COMMON_KNOWLEDGE.riskControls)}

TYPE-SPECIFIC STATUTORY FRAMEWORK (${mcaReplyType}):
${listToBullets(typeUnit.statutoryFramework)}

TYPE-SPECIFIC LEGAL POSITIONING (${mcaReplyType}):
${listToBullets(typeUnit.legalPositioning)}

TYPE-SPECIFIC EVIDENCE EXPECTATION (${mcaReplyType}):
${listToBullets(typeUnit.mandatoryEvidence)}

TYPE-SPECIFIC DRAFT BLOCKS (${mcaReplyType}):
${listToBullets(typeUnit.mandatoryDraftBlocks)}

TYPE-SPECIFIC RISK CONTROLS (${mcaReplyType}):
${listToBullets(typeUnit.riskControls)}`;
};

export const getMcaPendingDataChecklist = (mcaReplyType: McaReplyType): string[] => {
  const common = [
    "Exact notice number, DIN/RFN, and notice date as served.",
    "Exact due/event date vs actual filing/action date entries.",
    "SRN/challan/reference IDs for each compliance action.",
    "Officer-wise role period and factual mitigating conduct notes.",
  ];
  const typeSpecific = MCA_TYPE_KNOWLEDGE[mcaReplyType].mandatoryEvidence;
  return Array.from(new Set([...common, ...typeSpecific]));
};

