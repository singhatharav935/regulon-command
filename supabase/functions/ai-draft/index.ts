import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getMcaKnowledgeBlock, getMcaPendingDataChecklist } from "./mca_knowledge/mca_law_knowledge.ts";

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const isLocalOrigin =
    origin.startsWith("http://localhost:") ||
    origin.startsWith("https://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("https://127.0.0.1:");

  const hasWildcard = allowlist.includes("*");
  const isAllowlisted = allowlist.includes(origin);

  const allowOrigin = allowlist.length === 0
    ? "*"
    : (isLocalOrigin || hasWildcard || isAllowlisted)
      ? origin
      : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
};

const getModeDescription = (draftMode: string): string => {
  const modes: Record<string, string> = {
    conservative: "Use cautious, compliance-first language. Minimize assertions. Focus on procedural compliance. Maximum protection of client interests. Formal, officer-friendly tone.",
    balanced: "Apply standard industry practice. Make reasonable assertions with proper documentation support. Balance assertiveness with compliance-focused language.",
    aggressive: "Take a legally defensible but assertive stance. Challenge procedural irregularities where supported by facts. Assert client rights firmly while maintaining professional decorum.",
  };
  return modes[draftMode] || modes.balanced;
};

const getDocumentTypePrompt = (documentType: string): string => {
  const prompts: Record<string, string> = {
    "gst-show-cause": `
GST-SPECIFIC INTELLIGENCE (apply only where relevant to the facts):
- Section-wise analysis: Sections 73/74/16/17/50 etc. as invoked in the notice
- Rule 142 CGST Rules compliance
- Revenue neutrality argument where applicable
- Books vs Returns reconciliation, ITC eligibility with 2A/2B vs 3B analysis
- Penalty & interest non-applicability where law/facts support
- Time limitation under the correct statutory framework

MANDATORY GST OUTPUT BLOCKS:
1. Allegation-wise rebuttal matrix against DRC/SCN computation
2. ITC condition testing matrix under Section 16(2)
3. Interest/penalty computation challenge table
4. Annexure mapping for each disputed line item
`,
    "income-tax-response": `
INCOME TAX-SPECIFIC INTELLIGENCE (apply only where relevant):
- Invoked sections analysis (143/147/148/139/194 etc.)
- Source of income explanation with documentary proof
- Disallowance rebuttal with legal reasoning
- Penalty protection where applicable
- Natural justice requirements and hearing rights
- Time limitation and reopening validity (if applicable)
`,
    "mca-notice": `
MCA-SPECIFIC INTELLIGENCE (apply only where relevant):
- Companies Act 2013 section-wise analysis of sections invoked
- Distinguish procedural vs substantive default
- Mitigating factors and rectification status
- Compounding / leniency where permissible
`,
    "rbi-filing": `
RBI-SPECIFIC INTELLIGENCE (apply only where relevant):
- FEMA/RBI regulations analysis
- Regulatory intent and proportionality
- Internal control and corrective action mapping
`,
    "sebi-compliance": `
SEBI-SPECIFIC INTELLIGENCE (apply only where relevant):
- SEBI Act and regulations analysis
- Investor protection impact
- Disclosure and governance controls
`,
    "customs-response": `
CUSTOMS-SPECIFIC INTELLIGENCE (apply only where relevant):
- Customs Act section-wise analysis
- Classification/valuation/exemption logic
- Limitation and extended period challenge where fact-supported
- Penalty/confiscation and redemption fine challenge table
`,
    "contract-review": `
CONTRACT/LEGAL REVIEW INTELLIGENCE:
- Clause-by-clause risk analysis
- Enforceability and ambiguity checks
- Liability/indemnity/dispute risk mapping
`,
    "custom-draft": `
CUSTOM REGULATORY DRAFT:
- Infer authority and governing framework from facts
- Build a filing-ready legal response structure
`,
  };

  return prompts[documentType] || prompts["custom-draft"];
};

type McaReplyType =
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

const MCA_REPLY_TYPES: McaReplyType[] = [
  "annual-filing-92-137",
  "board-reporting-117",
  "charge-77-79",
  "beneficial-ownership-90",
  "board-governance-173",
  "board-report-134",
  "related-party-188",
  "managerial-kmp-203",
  "deposits-73-76",
  "general-mca",
];

const normalizeMcaReplyType = (value: string | null | undefined): McaReplyType | null => {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  return (MCA_REPLY_TYPES as string[]).includes(cleaned) ? (cleaned as McaReplyType) : null;
};

const extractNoticeDateFromText = (noticeText?: string): string | null => {
  const source = noticeText ?? "";
  const matches = [
    source.match(/dated\s+([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i),
    source.match(/dated\s+([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i),
    source.match(/notice\s+date\s*[:\-]\s*([0-9]{1,2}\s+[a-zA-Z]+\s+[0-9]{4})/i),
  ];
  for (const m of matches) {
    const v = (m?.[1] ?? "").trim();
    if (v) return v;
  }
  return null;
};

const inferMcaReplyType = (noticeDetails?: string, extractedNotice?: NoticeIntelligence | null): McaReplyType => {
  const corpus = `${noticeDetails ?? ""}\n${JSON.stringify(extractedNotice?.notice_snapshot?.invoked_provisions ?? [])}`.toLowerCase();
  if (/\bsection\s*92\b|\bsection\s*137\b|\bmgt-?7\b|\baoc-?4\b/.test(corpus)) return "annual-filing-92-137";
  if (/\bsection\s*117\b|\bmgt-?14\b|\bboard resolution\b/.test(corpus)) return "board-reporting-117";
  if (/\bsection\s*77\b|\bsection\s*78\b|\bsection\s*79\b|\bchg-?1\b|\bcharge\b/.test(corpus)) return "charge-77-79";
  if (/\bsection\s*90\b|\bben-?2\b|\bbeneficial owner\b|\bsbo\b/.test(corpus)) return "beneficial-ownership-90";
  if (/\bsection\s*173\b|\bboard meeting\b|\bminutes\b/.test(corpus)) return "board-governance-173";
  if (/\bsection\s*134\b|\bboard'?s report\b/.test(corpus)) return "board-report-134";
  if (/\bsection\s*188\b|\brelated party\b|\baoc-?2\b/.test(corpus)) return "related-party-188";
  if (/\bsection\s*203\b|\bkmp\b|company secretary|managing director|whole-time director/.test(corpus)) return "managerial-kmp-203";
  if (/\bsection\s*73\b|\bsection\s*74\b|\bsection\s*76\b|\bdeposit\b/.test(corpus)) return "deposits-73-76";
  return "general-mca";
};

const getMcaTypeSpecificRequirements = (mcaReplyType: McaReplyType) => {
  const map: Record<McaReplyType, string> = {
    "annual-filing-92-137": `TYPE-SPECIFIC:
- Cover Sections 92/137 with Section 403 and Section 454 framing.
- Include chronology rows for AOC-4 and MGT-7 with due date, filing date, SRN/challan.`,
    "board-reporting-117": `TYPE-SPECIFIC:
- Cover Section 117 read with applicable rules and filing timeline.
- Include chronology rows for resolution date, due date, filing date, SRN/challan (MGT-14 where applicable).`,
    "charge-77-79": `TYPE-SPECIFIC:
- Cover Sections 77/78/79 and charge-registration timeline.
- Include chronology rows for charge creation/modification/satisfaction events, due dates, and filing references.`,
    "beneficial-ownership-90": `TYPE-SPECIFIC:
- Cover Section 90 and SBO reporting obligations.
- Include chronology rows for declaration date, register update, filing date, and form references.`,
    "board-governance-173": `TYPE-SPECIFIC:
- Cover Section 173 and board-governance timeline obligations.
- Include chronology rows for meeting dates, compliance actions, and evidentiary records.`,
    "board-report-134": `TYPE-SPECIFIC:
- Cover Section 134 obligations and board's report compliance context.
- Include chronology rows for board approval date, circulation/adoption milestones, and filing references.`,
    "related-party-188": `TYPE-SPECIFIC:
- Cover Section 188 and related-party approval/disclosure framework.
- Include chronology rows for approval, contract execution, disclosure, and supporting record references.`,
    "managerial-kmp-203": `TYPE-SPECIFIC:
- Cover Section 203 and KMP appointment/continuity obligations.
- Include chronology rows for vacancy/appointment dates, board action dates, and filing references.`,
    "deposits-73-76": `TYPE-SPECIFIC:
- Cover deposit-related obligations under Sections 73/74/76 as applicable.
- Include chronology rows for acceptance/repayment/compliance events with documentary references.`,
    "general-mca": `TYPE-SPECIFIC:
- Infer relevant MCA sections from notice and build section-wise defense accordingly.
- Include chronology rows tied to key compliance milestones in the notice.`,
  };
  return map[mcaReplyType];
};

const getMcaHardRequirements = (mcaReplyType: McaReplyType) => `
MCA ADJUDICATION HARD REQUIREMENTS (MANDATORY FOR MCA NOTICE DRAFTS):
1. Identify and use the exact ROC jurisdiction from notice facts (do not guess multiple jurisdictions).
2. Include a chronology table with due dates vs actual dates and filing references for the specific notice type.
3. Explicitly address invoked MCA sections and Section 454 in legal analysis.
4. Add officer-specific defense: identify "officer in default", role period, and absence/presence of willful default based on records.
5. If rectification occurred before notice OR within 30 days of notice, include a specific Section 454 proviso submission seeking no-penalty treatment (fact-dependent, no over-claim).
6. Mention Section 446B only when factual qualification is shown in the draft (e.g., paid-up capital/turnover/startup recognition date).
7. Never use "waive penalty for officers"; instead use "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts."
8. Use this output skeleton: heading + notice metadata + preliminary submissions + chronology table + legal submissions + officer-specific defense + 446B block (if eligible) + annexures + layered prayer + sign-off.
9. If filing-critical data is unavailable, placeholders are allowed only as "[To be filled by CA/Lawyer]" or simple metadata placeholders (CIN/address/signatory fields).
10. If critical details remain unavailable, append "Data Required to Finalize Filing".
11. Ensure these five quality anchors are always covered where factually relevant: (a) Section 454 proviso request, (b) due-vs-actual chronology with reference IDs, (c) officer-specific defense table, (d) safe prayer wording using "drop/reduce" instead of "waive", and (e) no over-strong penalty rhetoric.
${getMcaTypeSpecificRequirements(mcaReplyType)}

${getMcaKnowledgeBlock(mcaReplyType)}
`;

const getAdvancedDraftingRequirements = () => `
ADVANCED QUALITY GATES (MANDATORY):
1. Notice Intelligence Snapshot with authority, notice no., DIN/RFN, period, invoked provisions, demand breakup, response deadline.
2. Para-wise Rebuttal Matrix: SCN para -> allegation -> rebuttal -> evidence -> legal basis.
3. Computation Reconciliation table: tax/duty, interest, penalty, fine with accepted/disputed reasoning.
4. Procedural validity checks (jurisdiction, limitation, service, natural justice) only if fact-supported.
5. RUD-to-Annexure mapping and missing-data flags (never fabricate facts).
6. Complete layered prayer and hearing request.
7. Avoid absolute legal claims ("settled law") unless clearly supportable from provided record.
8. Use exact amounts, dates, and reference IDs from the notice/worksheet wherever available.
9. If mandatory fields remain unavailable, include "Data Required to Finalize Filing" at the end.
10. Interest and penalty conclusions must be tied to explicit computation facts and statutory conditions.
`;

const safeJsonParse = <T,>(raw: string): T | null => {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
};

const extractAssistantText = (payload: any): string => {
  const messageContent = payload?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string") return messageContent.trim();
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part: any) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .join("")
      .trim();
  }

  const outputText = payload?.output_text;
  if (typeof outputText === "string") return outputText.trim();
  if (Array.isArray(outputText)) return outputText.join("").trim();

  return "";
};

const buildNoticeDetailsFallback = ({
  documentType,
  companyName,
  industry,
  noticeDetails,
}: {
  documentType: string;
  companyName: string;
  industry?: string;
  noticeDetails?: string;
}) => {
  const base = (noticeDetails ?? "").trim();
  const extractedDate = extractNoticeDateFromText(base) ?? "[To be filled by CA/Lawyer]";
  const extractedNoticeNo = base.match(/(?:Notice\s*No\.?|Ref\.?\s*No\.?)\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i)?.[1] ?? "[To be filled by CA/Lawyer]";
  const extractedDin = base.match(/DIN\/?RFN?\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i)?.[1] ?? "[To be filled by CA/Lawyer]";
  const sections = Array.from(new Set((base.match(/\bSection\s+\d+(?:\(\d+\))?/gi) ?? []))).join(", ") || "[To be filled by CA/Lawyer]";
  const amount = base.match(/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d+)?)/i)?.[1] ?? "[To be filled by CA/Lawyer]";
  const period = base.match(/FY\s*[0-9]{4}\s*-\s*[0-9]{2}|FY\s*[0-9]{4}-[0-9]{2}/i)?.[0] ?? "[To be filled by CA/Lawyer]";

  const mcaBlock = documentType === "mca-notice"
    ? `The matter concerns alleged delay in filing AOC-4 and MGT-7 for ${period}; AGM was held on [To be filled by CA/Lawyer], statutory due dates and actual filing dates with SRNs/challans are to be confirmed from MCA records, and the noticee position is that filings were completed with additional fees under Section 403 with no mala fide intent or stakeholder prejudice.`
    : `The noticee contests the allegations on facts and law, seeks evidence-linked adjudication, and requests proportionate relief based on completed compliance actions and documentary record.`;

  return `Notice/Order input summary for drafting: Authority has issued ${documentType} proceedings against ${companyName}${industry ? ` (${industry})` : ""}; notice reference is ${extractedNoticeNo}, dated ${extractedDate}, with DIN/RFN ${extractedDin}. Invoked provisions identified from available record are ${sections}. Proposed exposure/penalty includes amount marker ${amount} and relevant period ${period}. ${mcaBlock} The draft must include chronology anchors, allegation-wise legal response, annexure mapping, and hearing request, with placeholders only as [To be filled by CA/Lawyer] where records are pending confirmation.`;
};

const sanitizeNoticeDetailsInput = (raw: string, fallback: string) => {
  const text = (raw ?? "").trim();
  if (!text) return fallback;

  const looksLikeReply =
    /before the registrar|adjudicating officer|most respectfully|to,\s*the registrar|prayer|for and on behalf|authorized signatory|annexure/i.test(text) ||
    /\*\*|###|\n\s*\d+\.\s+[A-Z]/.test(text);

  // Remove markdown/salutation style noise and flatten into one dense paragraph.
  let cleaned = text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean).length;

  // If output still looks like a reply, or too short to be useful intake text, return deterministic fallback.
  if (looksLikeReply || words < 140) {
    return fallback;
  }

  // Keep notice-details intake concise and parser-friendly.
  return cleaned;
};

type AIProvider = "lovable" | "openai";

const resolveAIConfig = (): { provider: AIProvider; apiKey: string; model: string; endpoint: string } => {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableApiKey) {
    return {
      provider: "lovable",
      apiKey: lovableApiKey,
      model: Deno.env.get("LOVABLE_MODEL") ?? "google/gemini-3-flash-preview",
      endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    };
  }

  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (openAiApiKey) {
    return {
      provider: "openai",
      apiKey: openAiApiKey,
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
      endpoint: "https://api.openai.com/v1/chat/completions",
    };
  }

  throw new Error("No AI provider key configured. Set LOVABLE_API_KEY or OPENAI_API_KEY.");
};

const aiRequest = async ({
  apiKey,
  model,
  endpoint,
  messages,
  stream,
}: {
  apiKey: string;
  model: string;
  endpoint: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  stream: boolean;
}) => {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
    }),
  });
};

interface NoticeIntelligence {
  notice_snapshot: {
    authority: string | null;
    notice_number: string | null;
    din_rfn: string | null;
    period: string | null;
    response_deadline: string | null;
    invoked_provisions: string[];
    demand_total: string | null;
  };
  allegations: Array<{
    scn_para: string;
    allegation: string;
    amount: string | null;
    department_basis: string;
    rebuttal_direction: string;
    evidence_expected: string[];
    legal_hooks: string[];
  }>;
  critical_missing_fields: string[];
}

interface McaDraftBlueprint {
  mca_reply_type?: McaReplyType;
  subject_line?: string;
  heading: {
    forum: string;
    matter: string;
  };
  notice_meta: {
    notice_number: string;
    notice_date: string;
    din: string;
    company_name: string;
    cin: string;
    registered_office: string;
    officers_in_default: string[];
  };
  preliminary_submissions: string[];
  chronology_rows: Array<{
    particulars: string;
    section: string;
    due_date: string;
    filing_date: string;
    srn_challan: string;
    status: string;
  }>;
  legal_submissions: {
    sections_92_137_403: string;
    invoked_sections_analysis?: string;
    section_454_proviso: string;
    procedural_vs_substantive: string;
    proportionality: string;
  };
  officer_defense_rows: Array<{
    name: string;
    role_period: string;
    alleged_responsibility: string;
    mitigating_facts: string;
  }>;
  section_446b_submission: string;
  annexures: Array<{
    annexure_id: string;
    description: string;
  }>;
  prayer: string[];
  signoff: {
    signatory_name: string;
    designation: string;
    din_or_membership: string;
    date: string;
    place: string;
  };
  data_required_to_finalize_filing: string[];
}

interface RecheckFlag {
  severity: "high" | "medium" | "low";
  issue: string;
  fix: string;
  source: "rule" | "ai";
}

const captureMcaTrainingCase = async ({
  authClient,
  userId,
  companyId,
  draftRunId,
  noticeClass,
  noticeDetails,
  generatedDraft,
  qaPayload,
  companyName,
  industry,
  draftMode,
  previousCaseId,
}: {
  authClient: any;
  userId: string | null;
  companyId?: string | null;
  draftRunId?: string | null;
  noticeClass: string;
  noticeDetails?: string | null;
  generatedDraft: string;
  qaPayload?: unknown;
  companyName?: string | null;
  industry?: string | null;
  draftMode?: string | null;
  previousCaseId?: string | null;
}): Promise<string | null> => {
  if (!userId || !generatedDraft?.trim()) return null;

  const payload = {
    draft_run_id: draftRunId ?? null,
    user_id: userId,
    company_id: companyId ?? null,
    notice_class: noticeClass || "general-mca",
    notice_snapshot: (noticeDetails || "Notice details not provided.").slice(0, 16000),
    generated_draft: generatedDraft.slice(0, 120000),
    filing_score: typeof (qaPayload as any)?.filing_score === "number" ? (qaPayload as any).filing_score : null,
    risk_band: (qaPayload as any)?.risk_band ?? null,
    qa_payload: qaPayload ?? null,
    metadata: {
      source_operation: "draft",
      company_name: companyName ?? null,
      industry: industry ?? null,
      draft_mode: draftMode ?? null,
      captured_at: new Date().toISOString(),
    },
  };

  if (previousCaseId) {
    const { data, error } = await authClient
      .from("mca_training_cases")
      .update(payload)
      .eq("id", previousCaseId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (!error && data?.id) return data.id as string;
  }

  const { data, error } = await authClient
    .from("mca_training_cases")
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("MCA training capture failed:", error.message);
    return null;
  }
  return (data?.id as string) ?? null;
};

const captureMcaRecheckIssues = async ({
  authClient,
  userId,
  caseId,
  flags,
  summary,
}: {
  authClient: any;
  userId: string | null;
  caseId?: string | null;
  flags: RecheckFlag[];
  summary?: string;
}) => {
  if (!userId || !caseId) return;

  if (!flags.length) {
    await authClient
      .from("mca_training_cases")
      .update({
        status: "reviewed",
        metadata: {
          recheck_summary: summary ?? "Recheck passed",
          recheck_flags_count: 0,
          rechecked_at: new Date().toISOString(),
        },
      })
      .eq("id", caseId)
      .eq("user_id", userId);
    return;
  }

  const rows = flags.map((f) => ({
    case_id: caseId,
    severity: f.severity,
    detector_source: f.source === "ai" ? "ai" : "rule",
    issue_text: f.issue,
    suggested_fix: f.fix,
  }));

  const { error } = await authClient.from("mca_training_issues").insert(rows);
  if (error) {
    console.error("MCA recheck issue capture failed:", error.message);
  }

  await authClient
    .from("mca_training_cases")
    .update({
      status: "reviewed",
      metadata: {
        recheck_summary: summary ?? "Recheck completed",
        recheck_flags_count: flags.length,
        rechecked_at: new Date().toISOString(),
      },
    })
    .eq("id", caseId)
    .eq("user_id", userId);
};

const normalizeSimilarityText = (input: string) =>
  (input || "")
    .toLowerCase()
    .replace(/[`*_#>|~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildNgramSet = (input: string, n = 3): Set<string> => {
  const words = normalizeSimilarityText(input)
    .split(" ")
    .filter((w) => w.length > 1);
  const grams = new Set<string>();
  for (let i = 0; i <= words.length - n; i += 1) {
    grams.add(words.slice(i, i + n).join(" "));
  }
  return grams;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
};

const assessMcaTrainingCopyRisk = async ({
  authClient,
  userId,
  noticeClass,
  draftText,
  currentCaseId,
}: {
  authClient: any;
  userId: string | null;
  noticeClass: string;
  draftText: string;
  currentCaseId?: string | null;
}): Promise<{ score: number; matchedCaseId: string | null }> => {
  if (!userId || !draftText?.trim()) return { score: 0, matchedCaseId: null };

  const { data, error } = await authClient
    .from("mca_training_cases")
    .select("id, generated_draft, corrected_draft")
    .eq("user_id", userId)
    .eq("notice_class", noticeClass)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error || !Array.isArray(data) || data.length === 0) {
    return { score: 0, matchedCaseId: null };
  }

  const targetSet = buildNgramSet(draftText, 3);
  let maxScore = 0;
  let matchedCaseId: string | null = null;

  for (const row of data) {
    if (currentCaseId && row.id === currentCaseId) continue;
    const candidate = (row.corrected_draft || row.generated_draft || "").toString();
    if (!candidate.trim()) continue;
    const score = jaccard(targetSet, buildNgramSet(candidate, 3));
    if (score > maxScore) {
      maxScore = score;
      matchedCaseId = row.id as string;
    }
  }

  return { score: maxScore, matchedCaseId };
};

const ensureMcaValue = (value: string | null | undefined, fallback: string) => {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const buildMcaDraftFromBlueprint = (bp: McaDraftBlueprint) => {
  const officers = (bp.notice_meta.officers_in_default ?? []).length > 0
    ? bp.notice_meta.officers_in_default.map((officer) => `- ${officer}`).join("\n")
    : "- [To be filled by CA/Lawyer]";

  const chronology = (bp.chronology_rows ?? []).length > 0
    ? bp.chronology_rows
      .map((row) => `| ${row.particulars} | ${row.section} | ${row.due_date} | ${row.filing_date} | ${row.srn_challan} | ${row.status} |`)
      .join("\n")
    : `| AOC-4 filing | Section 137(1) | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Completed |
| MGT-7 filing | Section 92(4) | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Completed |`;

  const officerDefenseRows = (bp.officer_defense_rows ?? []).length > 0
    ? bp.officer_defense_rows
      .map((row) => `| ${row.name} | ${row.role_period} | ${row.alleged_responsibility} | ${row.mitigating_facts} |`)
      .join("\n")
    : `| [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] |`;

  const annexures = (bp.annexures ?? []).length > 0
    ? bp.annexures.map((item, idx) => `${idx + 1}. **${item.annexure_id}:** ${item.description}`).join("\n")
    : `1. **Annexure A:** AOC-4 acknowledgment, SRN, challan, and filing receipt.
2. **Annexure B:** MGT-7 acknowledgment, SRN, challan, and filing receipt.
3. **Annexure C:** Board Resolution/authority letter for signatory.
4. **Annexure D:** Supporting explanation note and record extracts.`;

  const prelims = (bp.preliminary_submissions ?? []).length > 0
    ? bp.preliminary_submissions.map((line, idx) => `${idx + 1}. ${line}`).join("\n")
    : `1. The proceedings relate to alleged delay in filing AOC-4 and MGT-7 for FY 2023-24 under Sections 137 and 92.
2. Filings stand completed with applicable additional fees under Section 403.
3. The delay was procedural and unintentional, without mala fide intent.`;

  const prayers = (bp.prayer ?? []).length > 0
    ? bp.prayer.map((line, idx) => `${idx + 1}. ${line}`).join("\n")
    : `1. Drop proceedings in light of completed compliance and facts on record.
2. Alternatively, impose only minimal/nominal penalty proportionate to the procedural nature of default.
3. Drop or reduce penalty on officers in default based on role, conduct, and mitigating facts.
4. Grant opportunity of personal hearing before passing any adverse order.`;

  const dataRequired = (bp.data_required_to_finalize_filing ?? []).length > 0
    ? `\n### Data Required to Finalize Filing\n${bp.data_required_to_finalize_filing.map((line, idx) => `${idx + 1}. ${line}`).join("\n")}\n`
    : "";

  const replySubject = ensureMcaValue(
    bp.subject_line,
    bp.mca_reply_type === "annual-filing-92-137"
      ? "REPLY TO ADJUDICATION NOTICE FOR ALLEGED NON-COMPLIANCE OF SECTIONS 92 AND 137 OF THE COMPANIES ACT, 2013"
      : "REPLY TO ADJUDICATION NOTICE UNDER THE COMPANIES ACT, 2013",
  );

  return `**${ensureMcaValue(bp.heading?.forum, "BEFORE THE ADJUDICATING OFFICER / REGISTRAR OF COMPANIES, KARNATAKA")}**  
**${ensureMcaValue(bp.heading?.matter, "In the matter of adjudication under Section 454 of the Companies Act, 2013")}**

**Notice No:** ${ensureMcaValue(bp.notice_meta?.notice_number, "[To be filled by CA/Lawyer]")}  
**Date:** ${ensureMcaValue(bp.notice_meta?.notice_date, "[To be filled by CA/Lawyer]")}  
**DIN:** ${ensureMcaValue(bp.notice_meta?.din, "[To be filled by CA/Lawyer]")}

**In the matter of:**  
**${ensureMcaValue(bp.notice_meta?.company_name, "[To be filled by CA/Lawyer]")}**  
(CIN: ${ensureMcaValue(bp.notice_meta?.cin, "[To be filled by CA/Lawyer]")})  
Registered Office: ${ensureMcaValue(bp.notice_meta?.registered_office, "[To be filled by CA/Lawyer]")}  
…Company/Noticee

**Officers in Default (as alleged):**  
${officers}

### **${replySubject}**

**To,**  
The Registrar of Companies / Adjudicating Officer, Karnataka  
[Insert Office Address]

**Most Respectfully Submitted,**

This reply is submitted without prejudice to all rights and remedies available in law.

### 1. Preliminary Submissions
${prelims}

### 2. Chronology of Compliance
| Particulars | Section | Due Date | Actual Filing Date | SRN/Challan | Status |
|---|---|---|---|---|---|
${chronology}

### 3. Legal Submissions
${bp.mca_reply_type === "annual-filing-92-137"
    ? `1. **Sections 92, 137 and 403:** ${ensureMcaValue(bp.legal_submissions?.sections_92_137_403, "Section 403 permits delayed filing upon payment of additional fees; completed filing with additional fees is a material mitigating circumstance in adjudication.")}`
    : `1. **Invoked MCA Sections Analysis:** ${ensureMcaValue(bp.legal_submissions?.invoked_sections_analysis, "The Noticee addresses each invoked section on facts, timeline, and documentary record, with relief sought under Section 454 adjudicatory discretion.")}`}
2. **Section 454 Proviso (fact-dependent):** ${ensureMcaValue(bp.legal_submissions?.section_454_proviso, "Where default is rectified before notice dated 15 January 2026 or within 30 days thereof, the Noticee seeks consideration under the proviso to Section 454 subject to statutory satisfaction.")}
3. **Procedural vs Substantive Default:** ${ensureMcaValue(bp.legal_submissions?.procedural_vs_substantive, "The lapse is procedural timeline non-compliance and not a case of fraud or suppression.")}
4. **Proportionality:** ${ensureMcaValue(bp.legal_submissions?.proportionality, "Penalty may be calibrated based on nature of default, rectification status, role-specific responsibility, and mitigating facts.")}

### 4. Officer-Specific Defense
| Officer | Role Period | Alleged Responsibility | Mitigating Facts |
|---|---|---|---|
${officerDefenseRows}

### 5. Section 446B Submission (Only if Factually Eligible)
${ensureMcaValue(bp.section_446b_submission, "If the Company qualifies under Section 2(85) and related criteria on the relevant date, benefit under Section 446B may be considered based on paid-up capital/turnover/startup evidence.")}

### 6. Annexures
${annexures}

### 7. Prayer
${prayers}

**For and on behalf of ${ensureMcaValue(bp.notice_meta?.company_name, "[To be filled by CA/Lawyer]")}**

__________________________  
**Authorized Signatory**  
Name: ${ensureMcaValue(bp.signoff?.signatory_name, "[To be filled by CA/Lawyer]")}  
Designation: ${ensureMcaValue(bp.signoff?.designation, "[To be filled by CA/Lawyer]")}  
DIN/Membership No.: ${ensureMcaValue(bp.signoff?.din_or_membership, "[To be filled by CA/Lawyer]")}  
Date: ${ensureMcaValue(bp.signoff?.date, "[To be filled by CA/Lawyer]")}  
Place: ${ensureMcaValue(bp.signoff?.place, "[To be filled by CA/Lawyer]")}
${dataRequired}`;
};

const hasPlaceholderMarkers = (content: string) =>
  /\[insert[^\]]*\]|\[to be filled[^\]]*\]|<insert|placeholder/i.test(content);

const hasDisallowedMcaPlaceholders = (content: string) => {
  const placeholderTokens = (content.match(/\[[^\]]+\]|<insert[^>]*>/gi) ?? []).filter((token) =>
    /(insert|to be filled|placeholder)/i.test(token)
  );

  if (placeholderTokens.length === 0) return false;

  const allowedPatterns = [
    /^\[\s*to be filled by ca\/lawyer\s*\]$/i,
    /^\[\s*insert\s+(cin|full address|office address|name|designation|din\/membership no\.?|date|place|city|srn|filing date|received on)\s*\]$/i,
  ];

  return placeholderTokens.some((token) => !allowedPatterns.some((pattern) => pattern.test(token)));
};

const detectMcaRecheckFlags = (
  draft: string,
  noticeDetails: string,
  mcaReplyType: McaReplyType,
): RecheckFlag[] => {
  const flags: RecheckFlag[] = [];
  const addFlag = (condition: boolean, severity: RecheckFlag["severity"], issue: string, fix: string) => {
    if (condition) flags.push({ severity, issue, fix, source: "rule" });
  };

  const hasChronology =
    /\|\s*(Particulars|Event|Date|Compliance Event)\s*\|\s*(Section|Provision|Relevant Provision)\s*\|/i.test(draft) &&
    /due\/event date|due date|statutory due date/i.test(draft) &&
    /actual filing|actual date|action date|date of filing|filing date/i.test(draft);

  const hasOfficerTable =
    /\|\s*(Officer(?:\s+in\s+Default)?|Name of Officer)\s*\|\s*(Role\s*Period|Designation|Period of Responsibility)\s*\|/i.test(draft) &&
    /\|\s*(Alleged Responsibility|Responsibility|Allegation|Role|Monitoring Compliance)\s*\|\s*(Mitigating Facts|Defense|Remarks|Explanation)\s*\|/i.test(draft);

  addFlag(
    !/section\s*454/i.test(draft) || !/proviso to section 454|within 30 days|rectified before notice|before issuance of notice/i.test(draft),
    "high",
    "Section 454 / proviso submission is missing or weak.",
    "Add a fact-dependent Section 454 paragraph with rectification timing and proviso request.",
  );
  addFlag(
    !hasChronology,
    "high",
    "Chronology table is missing or incomplete (due vs actual fields).",
    "Include chronology columns: Particulars, Section, Due/Event Date, Actual Filing/Action Date, SRN/Challan/Reference, Status.",
  );
  addFlag(
    !hasOfficerTable,
    "high",
    "Officer-specific defense table is missing.",
    "Add officer-wise table with role period, alleged responsibility, and mitigating facts.",
  );
  addFlag(
    /\bwaive\b[^.\n]{0,60}\bpenalt/i.test(draft) || /\babsolve\b[^.\n]{0,120}\bofficer|personal liability/i.test(draft),
    "medium",
    "Risky prayer wording detected (waive/absolve language).",
    "Rewrite to calibrated wording: drop or reduce penalty based on role, conduct, and mitigating facts.",
  );
  addFlag(
    /\[(insert|to be filled)[^\]]*\]/i.test(draft),
    "medium",
    "Unresolved placeholders remain in draft.",
    "Replace remaining placeholders with actual facts and references before filing.",
  );
  if (mcaReplyType === "annual-filing-92-137") {
    addFlag(
      !/aoc-?4/i.test(draft) || !/mgt-?7/i.test(draft),
      "high",
      "Annual filing draft does not clearly cover both AOC-4 and MGT-7.",
      "Explicitly include both forms in chronology and legal submissions with due vs actual dates.",
    );
    addFlag(
      !/section\s*403/i.test(draft),
      "medium",
      "Section 403 delayed filing regularization submission is missing.",
      "Add Section 403 submission with additional fee / SRN-challan references.",
    );
  }

  const din = noticeDetails.match(/\b(?:DIN|RFN)\s*[:\-]?\s*([A-Z0-9\/\-.]+)/i)?.[1];
  if (din) {
    addFlag(
      !new RegExp(din.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(draft),
      "low",
      "Notice DIN/RFN from notice text is not reflected in draft metadata.",
      "Insert the exact DIN/RFN from notice in heading/metadata block.",
    );
  }

  return flags;
};

const isNoPlaceholderGatePassed = (content: string, documentType: string) => {
  if (documentType === "mca-notice") {
    if (!hasPlaceholderMarkers(content)) return true;
    return !hasDisallowedMcaPlaceholders(content);
  }
  return !hasPlaceholderMarkers(content);
};

const buildRiskBand = (score: number): "low" | "medium" | "high" => {
  if (score >= 75) return "low";
  if (score >= 45) return "medium";
  return "high";
};

type DomainGateResult = {
  gates: Record<string, boolean>;
  failed: string[];
};

const runMcaDomainGates = (draft: string, mcaReplyType: McaReplyType): DomainGateResult => {
  const has446bMention = /\b446B\b/i.test(draft);
  const typeGates: Record<McaReplyType, Record<string, boolean>> = {
    "annual-filing-92-137": {
      mentions_92_137: /\bSection\s*92\b/i.test(draft) && /\bSection\s*137\b/i.test(draft),
      mentions_403: /\bSection\s*403\b/i.test(draft),
      has_type_chronology: /\bAOC-?4\b/i.test(draft) && /\bMGT-?7\b/i.test(draft),
    },
    "board-reporting-117": {
      mentions_117: /\bSection\s*117\b/i.test(draft),
      has_type_chronology: /\bMGT-?14\b|board resolution|resolution date/i.test(draft),
    },
    "charge-77-79": {
      mentions_77_79: /\bSection\s*77\b|\bSection\s*78\b|\bSection\s*79\b/i.test(draft),
      has_type_chronology: /\bCHG-?1\b|charge creation|satisfaction/i.test(draft),
    },
    "beneficial-ownership-90": {
      mentions_90: /\bSection\s*90\b/i.test(draft),
      has_type_chronology: /\bBEN-?2\b|beneficial owner|SBO/i.test(draft),
    },
    "board-governance-173": {
      mentions_173: /\bSection\s*173\b/i.test(draft),
      has_type_chronology: /board meeting|minutes|quorum/i.test(draft),
    },
    "board-report-134": {
      mentions_134: /\bSection\s*134\b/i.test(draft),
      has_type_chronology: /board'?s report|board approval date|director'?s responsibility/i.test(draft),
    },
    "related-party-188": {
      mentions_188: /\bSection\s*188\b/i.test(draft),
      has_type_chronology: /related party|aoc-?2|approval/i.test(draft),
    },
    "managerial-kmp-203": {
      mentions_203: /\bSection\s*203\b/i.test(draft),
      has_type_chronology: /kmp|appointment|vacancy|board action/i.test(draft),
    },
    "deposits-73-76": {
      mentions_73_76: /\bSection\s*73\b|\bSection\s*74\b|\bSection\s*76\b/i.test(draft),
      has_type_chronology: /deposit|repayment|acceptance/i.test(draft),
    },
    "general-mca": {
      has_type_chronology: /due date|filing date|timeline|chronology/i.test(draft),
    },
  };

  const gates: Record<string, boolean> = {
    ...typeGates[mcaReplyType],
    mentions_454: /\bSection\s*454\b/i.test(draft),
    has_454_proviso_submission: /proviso to section 454|within 30 days|before notice dated/i.test(draft),
    has_chronology_table: (/chronology of compliance|chronology|timeline/i.test(draft) || /\|\s*Particulars\s*\|\s*Section\s*\|/i.test(draft))
      && /due date|due\/event date/i.test(draft)
      && /actual filing|actual date|action date|filing date/i.test(draft),
    has_officer_defense: /officer-specific defense|officer in default/i.test(draft)
      && /\|\s*Officer\s*\|\s*Role Period\s*\|/i.test(draft),
    avoids_waive_penalty_phrase: !/\bwaive\b[^.\n]{0,40}\bpenalt/i.test(draft),
    avoids_waive_officer_penalty_phrase: !/waive penalty for officers/i.test(draft),
    avoids_absolve_officer_phrase: !/\babsolve\b[^.\n]{0,120}\bofficer|personal liability/i.test(draft),
    avoids_overstrong_penalty_phrases: !/double jeopardy|maximum sequestration of penalties|total waiver/i.test(draft),
    qualifies_446b_if_used: !has446bMention || /(paid-?up capital|turnover|startup recognition|section 2\(85\))/i.test(draft),
  };

  return {
    gates,
    failed: Object.entries(gates)
      .filter(([, passed]) => !passed)
      .map(([name]) => name),
  };
};

const validateMcaBlueprint = (bp: McaDraftBlueprint, mcaReplyType: McaReplyType): string[] => {
  const missing: string[] = [];
  if (!(bp.notice_meta?.notice_number || "").trim()) missing.push("notice_meta.notice_number");
  if (!(bp.notice_meta?.notice_date || "").trim()) missing.push("notice_meta.notice_date");
  if (!(bp.notice_meta?.din || "").trim()) missing.push("notice_meta.din");
  if (!(bp.notice_meta?.company_name || "").trim()) missing.push("notice_meta.company_name");
  if ((bp.chronology_rows ?? []).length < 2) missing.push("chronology_rows(minimum 2 entries)");
  if (mcaReplyType === "annual-filing-92-137" && !(bp.legal_submissions?.sections_92_137_403 || "").trim()) {
    missing.push("legal_submissions.sections_92_137_403");
  }
  if (mcaReplyType !== "annual-filing-92-137" && !(bp.legal_submissions?.invoked_sections_analysis || "").trim()) {
    missing.push("legal_submissions.invoked_sections_analysis");
  }
  if (!(bp.legal_submissions?.section_454_proviso || "").trim()) missing.push("legal_submissions.section_454_proviso");
  if (mcaReplyType === "annual-filing-92-137") {
    const hasAoc4 = (bp.chronology_rows ?? []).some((r) => /aoc-?4/i.test(r.particulars));
    const hasMgt7 = (bp.chronology_rows ?? []).some((r) => /mgt-?7/i.test(r.particulars));
    if (!hasAoc4 || !hasMgt7) missing.push("chronology_rows(AOC-4 and MGT-7 required for annual filing notices)");
  }
  if ((bp.prayer ?? []).length < 3) missing.push("prayer(minimum 3 points)");
  return missing;
};

const buildMcaFallbackChronologyRows = (mcaReplyType: McaReplyType) => {
  if (mcaReplyType === "annual-filing-92-137") {
    return `| AOC-4 filing | Section 137(1) | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Completed |
| MGT-7 filing | Section 92(4) | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Completed |`;
  }
  return `| Compliance event 1 | [Invoked Section] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Completed |
| Compliance event 2 | [Invoked Section] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Completed |`;
};

const buildMca454ProvisoText = (noticeDate?: string | null) => {
  const anchoredDate = (noticeDate ?? "").trim();
  if (anchoredDate) {
    return `Without prejudice, if the default stood rectified before issuance of notice dated ${anchoredDate}, or within 30 days from notice service, the Noticee seeks consideration under the proviso to Section 454, subject to statutory satisfaction.`;
  }
  return "Without prejudice, if the default stood rectified before issuance of notice, or within 30 days from notice service, the Noticee seeks consideration under the proviso to Section 454, subject to statutory satisfaction.";
};

const normalizeMcaNoticeDateMentions = (draft: string, noticeDate?: string | null) => {
  const anchoredDate = (noticeDate ?? "").trim();
  if (!anchoredDate) return draft;

  let fixed = draft;
  const datePattern = "([0-9]{1,2}\\s+[A-Za-z]+\\s+[0-9]{4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})";

  // Normalize explicit notice-reference date phrases to the extracted notice date.
  fixed = fixed.replace(
    new RegExp(`(Notice\\s*(?:No\\.?|number)?[^\\n]{0,120}?dated\\s+)${datePattern}`, "gi"),
    `$1${anchoredDate}`,
  );
  fixed = fixed.replace(
    new RegExp(`(Adjudication\\s+Notice[^\\n]{0,120}?dated\\s+)${datePattern}`, "gi"),
    `$1${anchoredDate}`,
  );
  fixed = fixed.replace(
    new RegExp(`(SUBJECT:[^\\n]{0,180}?dated\\s+)${datePattern}`, "gi"),
    `$1${anchoredDate}`,
  );

  return fixed;
};

const removeDuplicateMarkdownSection = (input: string, heading: string) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(`(^###\\s+${escaped}[\\s\\S]*?)(?=\\n###\\s+|$)`, "gmi");
  const matches = Array.from(input.matchAll(blockRegex));
  if (matches.length <= 1) return input;

  let fixed = input;
  for (let i = 1; i < matches.length; i++) {
    const full = matches[i]?.[0];
    if (full) fixed = fixed.replace(full, "");
  }
  return fixed.replace(/\n{3,}/g, "\n\n").trim();
};

const enforceUniversalDraftLanguage = (draft: string) => {
  let fixed = draft || "";
  fixed = fixed.replace(/\bwe\s+contextually\s+submit\b/gi, "we respectfully submit");
  fixed = fixed.replace(/\bcontextually\s+submit\b/gi, "respectfully submit");
  fixed = fixed.replace(/\[Select\s*:[^\]]+\]/gi, "[To be filled by CA/Lawyer]");
  fixed = fixed.replace(/\bpenaltyy\b/gi, "penalty");
  fixed = fixed.replace(/\n{3,}/g, "\n\n").trim();
  return fixed;
};

const enforceCrossRegulatorySafetyLanguage = (draft: string, documentType: string) => {
  let fixed = enforceUniversalDraftLanguage(draft);
  const isRegulatory = [
    "mca-notice",
    "gst-show-cause",
    "income-tax-response",
    "rbi-filing",
    "sebi-compliance",
    "customs-response",
    "custom-draft",
  ].includes(documentType);

  if (!isRegulatory) return fixed;

  fixed = fixed.replace(/\bwaive\b[^.\n]{0,80}\bpenalt/gi, "drop or reduce penalty");
  fixed = fixed.replace(/\babsolve\b[^.\n]{0,120}\bofficer[s]?/gi, "apply role-based mitigation for officers in default");
  fixed = fixed.replace(/\bimpose\s+no\s+penalty\b/gi, "drop or reduce penalty");
  fixed = fixed.replace(/\bdrop\s+the\s+proceedings[^.\n]*in\s+entirety\b/gi, "drop the proceedings, or alternatively reduce penalty based on facts and rectification status");
  fixed = fixed.replace(/\bdouble jeopardy\b/gi, "disproportionate duplication of monetary burden");
  fixed = fixed.replace(/\btotal waiver\b/gi, "substantial reduction");
  return enforceUniversalDraftLanguage(fixed);
};

const buildGstFallbackParaWiseMatrix = () => `| Allegation | Department Position | Noticee Rebuttal | Evidence |
|---|---|---|---|
| ITC mismatch / ineligible credit | Proposed disallowance based on mismatch indicators | Eligibility must be tested on invoice, receipt of goods/services, tax payment trail, and return records | Annexure A/B |
| Demand computation | Aggregate demand proposed | Recompute after invoice-wise reconciliation and timing alignment | Annexure C |
| Interest and penalty | Consequential levy proposed | Contingent on sustainable principal demand and statutory conditions | Annexure D |`;

const buildGstFallbackComputationTable = () => `| Particulars | Department Figure | Accepted | Disputed | Basis of Dispute |
|---|---:|---:|---:|---|
| Principal tax demand | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Invoice-wise reconciliation required |
| Interest | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Depends on sustainable principal amount |
| Penalty | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | Challenge on facts, intent, and proportionality |`;

const enforceGstDraftMinimumStructure = (draft: string) => {
  let fixed = enforceCrossRegulatorySafetyLanguage(draft, "gst-show-cause");

  if (!/without prejudice/i.test(fixed)) {
    fixed = `Without prejudice to all rights and remedies, the Noticee submits as under.\n\n${fixed}`;
  }

  const hasParaWiseMatrix = /para[-\s]*wise rebuttal|allegation[-\s]*wise rebuttal/i.test(fixed)
    || /\|\s*Allegation\s*\|\s*Department Position\s*\|\s*Noticee Rebuttal\s*\|/i.test(fixed);
  if (!hasParaWiseMatrix) {
    fixed += `\n\n### Para-Wise Rebuttal Matrix\n${buildGstFallbackParaWiseMatrix()}`;
  }

  const hasComputationTable = /accepted\s*\|\s*disputed|computation|reconciliation/i.test(fixed)
    && /\|\s*[-:]+\s*\|\s*[-:]+\s*\|/.test(fixed);
  if (!hasComputationTable) {
    fixed += `\n\n### Computation Reconciliation Table\n${buildGstFallbackComputationTable()}`;
  }

  if (!/prayer|relief/i.test(fixed)) {
    fixed += `\n\n### Prayer\n1. Drop unsustainable demand components after reconciliation.\n2. Drop or reduce interest and penalty to the extent not legally sustainable.\n3. Grant personal hearing and permit additional submissions.\n4. Pass any other order deemed fit in the interest of justice.`;
  }

  if (!/hearing/i.test(fixed)) {
    fixed += `\n\n### Hearing Request\nThe Noticee requests an opportunity of personal hearing before any adverse order is passed.`;
  }

  fixed = removeDuplicateMarkdownSection(fixed, "Para-Wise Rebuttal Matrix");
  fixed = removeDuplicateMarkdownSection(fixed, "Computation Reconciliation Table");
  fixed = removeDuplicateMarkdownSection(fixed, "Prayer");
  return enforceCrossRegulatorySafetyLanguage(fixed, "gst-show-cause");
};

const enforceMcaDraftMinimumStructure = (
  draft: string,
  mcaReplyType: McaReplyType,
  noticeDate?: string | null,
): string => {
  let fixed = enforceUniversalDraftLanguage(draft);

  // Hard safety phrase replacement
  fixed = fixed.replace(/waive(?:\s+or\s+reduce)?\s+the\s+penalty/gi, "drop or reduce penalty");
  fixed = fixed.replace(/waive\s+or\s+substantially\s+reduce(?:\s+the)?\s+proposed\s+penalty/gi, "drop or reduce penalty");
  fixed = fixed.replace(/waive\s+or\s+reduce(?:\s+the)?\s+proposed\s+penalty/gi, "drop or reduce penalty");
  fixed = fixed.replace(/\babsolve\b[^.\n]{0,60}\bofficer[s]?\s+in\s+default/gi, "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/\babsolve\b[^.\n]{0,120}\bpersonal liability/gi, "consider role-based mitigation for officers in default");
  fixed = fixed.replace(/\bimpose\s+no\s+penalty\b/gi, "drop or reduce penalty");
  fixed = fixed.replace(/\bwaive\s+or\s+substantially\s+reduce\s+the\s+proposed\s+penalty\b/gi, "drop or reduce penalty on the Company and officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/\bwaive\s+or\s+substantially\s+reduce\s+the\s+penalty\b/gi, "drop or reduce penalty on the Company and officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/\bwaive\s+or\s+reduce\s+the\s+penalty\b/gi, "drop or reduce penalty on the Company and officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/\bdrop the adjudication proceedings against the company and its officers in default\b/gi, "drop or reduce penalty on the Company and officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/waive penalty for officers/gi, "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/waive\s+the\s+penalty\s+on\s+the\s+officers\s+in\s+default/gi, "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts");
  fixed = fixed.replace(/\bdrop\s+the\s+adjudication\s+proceedings[^.\n]*in\s+entirety\b/gi, "drop the adjudication proceedings, or alternatively reduce penalty based on rectification and mitigating facts");
  fixed = fixed.replace(/\bdrop\s+the\s+proceedings[^.\n]*in\s+entirety\b/gi, "drop the proceedings, or alternatively reduce penalty based on rectification and mitigating facts");
  fixed = fixed.replace(/total waiver/gi, "substantial reduction");
  fixed = fixed.replace(/maximum sequestration of penalties/gi, "maximum penalties");
  fixed = fixed.replace(/double jeopardy/gi, "disproportionate duplication of monetary burden for a procedural lapse");
  fixed = fixed.replace(
    /section\s*137\(\s*3\s*\)\s*provides\s*for\s*a\s*penalty\s*only\s*where\s*the\s*default\s*is\s*willful\.?/gi,
    "Section 137 is addressed on facts, timeline, and rectification status; the Noticee seeks proportionate adjudication based on bona fide conduct and completed compliance.",
  );
  fixed = fixed.replace(
    /no\s+further\s+prosecution\s+or\s+proceedings\s+be\s+initiated\s+against\s+the\s+company\s+or\s+its\s+officers?\s+in\s+default[^.\n]*/gi,
    "drop or reduce penalty on the Company and officers in default based on role, conduct, and mitigating facts",
  );

  if (!/Section\s*454/i.test(fixed)) {
    fixed += `\n\n### Section 454 Submission\nThe Noticee seeks adjudicatory consideration under Section 454 based on rectification status, role-specific responsibility, and mitigating facts on record.`;
  }

  if (!/proviso to section 454|within 30 days|before notice dated/i.test(fixed)) {
    fixed += `\n\n### Section 454 Proviso (Fact-Dependent)\n${buildMca454ProvisoText(noticeDate)}`;
  }

  const hasChronologyTable = /\|\s*Particulars\s*\|\s*Section\s*\|\s*(Due Date|Due\/Event Date)\s*\|/i.test(fixed)
    && /\|\s*---\s*\|\s*---\s*\|/i.test(fixed);
  if (!hasChronologyTable) {
    fixed += `\n\n### Chronology of Compliance\n| Particulars | Section | Due/Event Date | Actual Filing/Action Date | SRN/Challan/Reference | Status |\n|---|---|---|---|---|---|\n${buildMcaFallbackChronologyRows(mcaReplyType)}`;
  }

  const hasOfficerTable = /\|\s*Officer\s*\|\s*Role Period\s*\|\s*Alleged Responsibility\s*\|\s*Mitigating Facts\s*\|/i.test(fixed);
  if (!hasOfficerTable) {
    fixed += `\n\n### Officer-Specific Defense\n| Officer | Role Period | Alleged Responsibility | Mitigating Facts |\n|---|---|---|---|\n| [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | [To be filled by CA/Lawyer] | No willful default; actions were bona fide and compliance-focused. |`;
  }

  // Ensure prayer section uses drop/reduce language
  fixed = fixed.replace(/\bPRAYER[^]*?$/i, (block) =>
    block
      .replace(/\bwaive\b[^.\n]{0,60}\bpenalt/gi, "drop or reduce penalty")
      .replace(/\babsolve\b[^.\n]{0,80}\bofficer[s]?\b/gi, "drop or reduce penalty on officers in default")
      .replace(/\bimpose\s+no\s+penalty\b/gi, "drop or reduce penalty")
  );

  if (mcaReplyType === "annual-filing-92-137" && !/\bSection\s*403\b/i.test(fixed)) {
    fixed += `\n\n### Section 403 Submission\nThe Noticee submits that delayed filing, where applicable, was completed with prescribed additional fees under Section 403, and the filing records stand regularized on MCA portal subject to adjudication discretion under Section 454.`;
  }

  fixed = normalizeMcaNoticeDateMentions(fixed, noticeDate);
  fixed = removeDuplicateMarkdownSection(fixed, "Section 454 Proviso (Fact-Dependent)");
  fixed = removeDuplicateMarkdownSection(fixed, "Chronology of Compliance");
  fixed = removeDuplicateMarkdownSection(fixed, "Officer-Specific Defense");

  if (!/personal hearing|hearing/i.test(fixed)) {
    fixed += `\n\n### Hearing Request\nThe Noticee requests an opportunity of personal hearing (physical/VC mode) before any adverse order is passed.`;
  }

  return enforceUniversalDraftLanguage(fixed);
};

const runMcaRepairAndGate = (
  initialDraft: string,
  mcaReplyType: McaReplyType,
  noticeDate?: string | null,
) => {
  // Multi-pass deterministic repair: first pass adds missing blocks, second pass normalizes prayer language.
  const repairedOnce = enforceMcaDraftMinimumStructure(initialDraft, mcaReplyType, noticeDate);
  const repairedTwice = enforceMcaDraftMinimumStructure(repairedOnce, mcaReplyType, noticeDate);
  const gateResult = runMcaDomainGates(repairedTwice, mcaReplyType);
  return { repairedDraft: repairedTwice, gateResult };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (corsHeaders["Access-Control-Allow-Origin"] === "null") {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const enforceAuth = Deno.env.get("ENFORCE_AUTH") === "true";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing");
    }

    if (enforceAuth && !authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string | null = null;

    if (authHeader) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser();

      if (enforceAuth && (authError || !user)) {
        return new Response(JSON.stringify({ error: "Unauthorized request" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = user?.id ?? null;

      if (enforceAuth && user) {
        const { data: roleRows, error: roleError } = await authClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (roleError) {
          return new Response(JSON.stringify({ error: "Unable to verify user role" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const roleSet = new Set((roleRows ?? []).map((row) => row.role));
        if (!roleSet.has("manager") && !roleSet.has("admin")) {
          return new Response(JSON.stringify({ error: "Only CA/Admin users can generate drafts" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const {
      operation = "draft",
      documentType,
      companyName,
      companyId,
      draftMode,
      industry,
      context,
      noticeDetails,
      draftContent,
      draftRunId,
      trainingCaseId,
      evidenceContext,
      mcaReplyTypeOverride,
      advancedMode = false,
      strictValidation = false,
      stream = false,
    } = await req.json();

    const normalizedOperation = typeof operation === "string" ? operation.trim().toLowerCase() : "draft";
    const aiConfig = resolveAIConfig();

    if (normalizedOperation === "recheck") {
      if (!draftContent || typeof draftContent !== "string" || draftContent.trim().length < 40) {
        return new Response(JSON.stringify({ error: "Draft content is required for AI recheck." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mcaReplyType: McaReplyType = documentType === "mca-notice"
        ? (normalizeMcaReplyType(mcaReplyTypeOverride) ?? inferMcaReplyType(noticeDetails, null))
        : "general-mca";

      const ruleFlags = documentType === "mca-notice"
        ? detectMcaRecheckFlags(draftContent, noticeDetails || "", mcaReplyType)
        : [];

      const recheckSystemPrompt = `You are a legal QA reviewer for Indian regulatory draft filings.
Return STRICT JSON only:
{
  "flags": [
    {
      "severity": "high|medium|low",
      "issue": "string",
      "fix": "string"
    }
  ],
  "summary": "string"
}
Rules:
- Flag only material drafting/compliance issues.
- Focus on factual mismatch risk, section mismatch, timeline inconsistency, risky prayer language, or evidence linkage gaps.
- Keep fixes specific and actionable.
- Do not repeat duplicate flags.`;

      const recheckUserPrompt = `Recheck this draft for correctness and filing-readiness.
Document Type: ${documentType}
MCA Reply Type: ${mcaReplyType}

NOTICE/ORDER DETAILS:
${noticeDetails || "Not provided"}

DRAFT TO RECHECK:
${draftContent}

SUPPORTING EVIDENCE / PDF EXTRACT NOTES (if provided):
${evidenceContext || "None provided"}`;

      let aiFlags: RecheckFlag[] = [];
      let summary = "Recheck completed.";

      const recheckResp = await aiRequest({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        stream: false,
        messages: [
          { role: "system", content: recheckSystemPrompt },
          { role: "user", content: recheckUserPrompt },
        ],
      });

      if (recheckResp.ok) {
        const recheckData = await recheckResp.json();
        const parsed = safeJsonParse<{ flags?: Array<{ severity?: string; issue?: string; fix?: string }>; summary?: string }>(
          extractAssistantText(recheckData),
        );
        if (parsed?.flags?.length) {
          aiFlags = parsed.flags
            .filter((f) => f.issue && f.fix)
            .map((f) => ({
              severity: f.severity === "high" || f.severity === "medium" ? f.severity : "low",
              issue: f.issue as string,
              fix: f.fix as string,
              source: "ai" as const,
            }));
        }
        if (parsed?.summary) summary = parsed.summary;
      }

      const merged = [...ruleFlags, ...aiFlags];
      const dedup = Array.from(
        merged.reduce((acc, item) => {
          const key = `${item.issue.toLowerCase()}::${item.fix.toLowerCase()}`;
          if (!acc.has(key)) acc.set(key, item);
          return acc;
        }, new Map<string, RecheckFlag>()),
      ).map(([, value]) => value);

      if (documentType === "mca-notice") {
        await captureMcaRecheckIssues({
          authClient,
          userId,
          caseId: typeof trainingCaseId === "string" ? trainingCaseId : null,
          flags: dedup,
          summary,
        });
      }

      return new Response(JSON.stringify({
        ok: dedup.length === 0,
        flags: dedup,
        summary,
        checkedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (normalizedOperation === "notice-details") {
      const mcaReplyType: McaReplyType | null = documentType === "mca-notice"
        ? (normalizeMcaReplyType(mcaReplyTypeOverride) ?? inferMcaReplyType(noticeDetails, null))
        : null;
      const mcaKnowledge = mcaReplyType ? getMcaKnowledgeBlock(mcaReplyType) : "";
      const mcaChecklist = mcaReplyType ? getMcaPendingDataChecklist(mcaReplyType).map((item) => `- ${item}`).join("\n") : "";

      const noticeDetailsSystemPrompt = `You are a legal intake drafting assistant for Indian regulatory replies.
Generate ONLY "Notice / Order Details" input text to be pasted into a drafting engine.
Rules:
1) 220-420 words.
2) One dense paragraph block with clear facts and numbers/dates where available.
3) Include authority, notice reference, DIN/RFN, date, invoked sections/rules, period, proposed penalty/demand, and noticee position.
4) For MCA annual filing notices, include AOC-4/MGT-7 chronology anchors and SRN/date placeholders only when unavailable.
5) Do not include headings, salutations, captions, markdown tables, prayer, annexure list, or signature block.
6) Do not fabricate; if unavailable, mark as "[To be filled by CA/Lawyer]".
${mcaReplyType ? `\nMCA KNOWLEDGE CONTEXT:\n${mcaKnowledge}\n\nMCA DATA CHECKLIST TO CAPTURE IN NOTICE DETAILS:\n${mcaChecklist}` : ""}`;

      const noticeDetailsUserPrompt = `Prepare Notice/Order Details for:
- Document Type: ${documentType}
- Company: ${companyName}
- Industry: ${industry || "Not specified"}
${documentType === "mca-notice" && mcaReplyType ? `- MCA Reply Type: ${mcaReplyType}` : ""}

Use this context if provided:
${context || "No extra context provided."}

Existing notice text (if any):
${noticeDetails || "None provided."}`;

      const detailsResp = await aiRequest({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        stream: false,
        messages: [
          { role: "system", content: noticeDetailsSystemPrompt },
          { role: "user", content: noticeDetailsUserPrompt },
        ],
      });

      if (!detailsResp.ok) {
        const errorText = await detailsResp.text();
        throw new Error(`Notice details generation failed: ${detailsResp.status} ${errorText}`);
      }

      const detailsData = await detailsResp.json();
      const fallbackNoticeDetails = buildNoticeDetailsFallback({
        documentType,
        companyName,
        industry,
        noticeDetails,
      });
      const generatedNoticeDetails = sanitizeNoticeDetailsInput(
        extractAssistantText(detailsData),
        fallbackNoticeDetails,
      );

      return new Response(JSON.stringify({
        noticeDetails: generatedNoticeDetails,
        metadata: {
          operation: "notice-details",
          documentType,
          companyName,
          industry,
          mcaReplyType,
          generatedAt: new Date().toISOString(),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (strictValidation && (!noticeDetails || noticeDetails.trim().length < 200)) {
      return new Response(JSON.stringify({
        error: "Advanced mode requires detailed notice/order content (minimum 200 characters).",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modeDescription = getModeDescription(draftMode);
    const documentTypePrompt = getDocumentTypePrompt(documentType);

    let extractedNotice: NoticeIntelligence | null = null;

    if (advancedMode && noticeDetails) {
      const extractionSystemPrompt = `You are a legal drafting pre-processor for Indian compliance disputes.
Return STRICT JSON only, no markdown.
Schema:
{
  "notice_snapshot": {
    "authority": string|null,
    "notice_number": string|null,
    "din_rfn": string|null,
    "period": string|null,
    "response_deadline": string|null,
    "invoked_provisions": string[],
    "demand_total": string|null
  },
  "allegations": [{
    "scn_para": string,
    "allegation": string,
    "amount": string|null,
    "department_basis": string,
    "rebuttal_direction": string,
    "evidence_expected": string[],
    "legal_hooks": string[]
  }],
  "critical_missing_fields": string[]
}
If notice data is missing, list specific missing items in critical_missing_fields.`;

      const extractionUserPrompt = `Extract notice intelligence for ${documentType} dispute.\n\nNOTICE TEXT:\n${noticeDetails}`;

      const extractionResp = await aiRequest({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        stream: false,
        messages: [
          { role: "system", content: extractionSystemPrompt },
          { role: "user", content: extractionUserPrompt },
        ],
      });

      if (!extractionResp.ok) {
        const errorText = await extractionResp.text();
        throw new Error(`Notice extraction failed: ${extractionResp.status} ${errorText}`);
      }

      const extractionJson = await extractionResp.json();
      const rawExtraction = extractionJson.choices?.[0]?.message?.content ?? "";
      extractedNotice = safeJsonParse<NoticeIntelligence>(rawExtraction);

      if (!extractedNotice) {
        return new Response(JSON.stringify({
          error: "Advanced extraction failed. Please paste the notice text with clear sections and amounts.",
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (strictValidation && extractedNotice.critical_missing_fields.length > 0) {
        return new Response(JSON.stringify({
          error: `Missing critical details: ${extractedNotice.critical_missing_fields.join(", ")}`,
          missing: extractedNotice.critical_missing_fields,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const mcaReplyType: McaReplyType | null = documentType === "mca-notice"
      ? (normalizeMcaReplyType(mcaReplyTypeOverride) ?? inferMcaReplyType(noticeDetails, extractedNotice))
      : null;
    const extractedNoticeDate = extractNoticeDateFromText(noticeDetails);
    const mcaPendingChecklistText = mcaReplyType
      ? getMcaPendingDataChecklist(mcaReplyType).map((item) => `- ${item}`).join("\n")
      : "";

    const systemPrompt = `ROLE & AUTHORITY
You are a Senior Practicing Chartered Accountant & Regulatory Counsel with 15+ years experience in India.
Generate a final filing-ready legal draft that is adjudication-ready.

NON-NEGOTIABLE OUTPUT RULES
1. No AI/self references or disclaimers.
2. No fabricated facts or fabricated authorities.
3. Do not overstate legal certainty; phrase disputed issues with defensible precision.
4. Default sign-off: "For and on behalf of ${companyName}" and "Authorized Signatory" with placeholders.
5. Mention case-law only where fact-applicable and framed with appropriate caution.

DRAFT MODE: ${draftMode.toUpperCase()}
${modeDescription}

UNIVERSAL STANDARDS
1. Facts -> Law -> Application -> Conclusion.
2. Para-wise rebuttal only for allegations present.
3. "Without prejudice" clause.
4. No admission unless expressly instructed.
5. Layered reliefs in final prayer.
6. Map each major contention to annexure/document references.
7. Include accepted vs disputed columns in demand/interest/penalty rebuttal table.

${getAdvancedDraftingRequirements()}

DOMAIN DIRECTIVES
${documentTypePrompt}
${documentType === "mca-notice" && mcaReplyType ? getMcaHardRequirements(mcaReplyType) : ""}
${documentType === "mca-notice" && mcaPendingChecklistText ? `\nMCA DATA-CAPTURE CHECKLIST (enforce where facts are available):\n${mcaPendingChecklistText}` : ""}

COMPANY CONTEXT
- Company: ${companyName}
- Industry: ${industry || "Not specified"}
- Document Type: ${documentType}
${documentType === "mca-notice" && mcaReplyType ? `- MCA Reply Type: ${mcaReplyType}` : ""}

${extractedNotice ? `EXTRACTED NOTICE INTELLIGENCE (use as primary structure source):\n${JSON.stringify(extractedNotice, null, 2)}` : ""}

${noticeDetails ? `RAW NOTICE DETAILS:\n${noticeDetails}` : ""}
`;

    const userMessage = context || (documentType === "mca-notice"
      ? `Generate a final adjudication-ready MCA reply for ${companyName}${industry ? ` (${industry} sector)` : ""}.
Detected notice class: ${mcaReplyType ?? "general-mca"}.
Mandatory structure:
1) Heading + exact ROC jurisdiction from notice
2) Notice metadata (notice no, date, DIN, company block, officers in default block)
3) Preliminary submissions
4) Chronology table with due date/event date vs filing/action date and reference IDs
5) Legal submissions under invoked sections + Section 454 (with fact-dependent proviso request)
6) Officer-specific defense table
7) Section 446B block only if factual qualification is shown
8) Annexure index
9) Layered prayer with hearing request
10) Sign-off
Avoid unsupported case law. Use controlled placeholders only where unavoidable.
Dataset policy:
- Use prior dataset patterns only for structure and quality patterns.
- Never reproduce long sentence blocks or paragraph chunks from prior stored drafts.
- The output must be freshly written and specific to the current notice facts.`
      : `Generate a comprehensive, filing-ready ${documentType.replace(/-/g, " ")} for ${companyName}${industry ? ` (${industry} sector)` : ""}. Include SCN para-wise rebuttal matrix, allegation-wise computation challenge with accepted/disputed columns, annexure mapping per issue, calibrated legal language, and complete layered prayer.`);

    if (!advancedMode) {
      const response = await aiRequest({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream,
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status} ${errorText}`);
      }

      if (stream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      const data = await response.json();
      let draftContent = enforceUniversalDraftLanguage(data.choices?.[0]?.message?.content || "");
      if (documentType === "gst-show-cause") {
        draftContent = enforceGstDraftMinimumStructure(draftContent);
      } else {
        draftContent = enforceCrossRegulatorySafetyLanguage(draftContent, documentType);
      }
      return new Response(JSON.stringify({
        draft: draftContent,
        metadata: {
          documentType,
          companyName,
          draftMode,
          industry,
          mcaReplyType,
          advancedMode,
          generatedAt: new Date().toISOString(),
          version: "2.0",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Advanced Mode: domain-structured generation + quality review
    let firstDraft = "";
    if (documentType === "mca-notice") {
      const blueprintSystemPrompt = `You are an expert legal drafting engine for MCA adjudication replies.
Return STRICT JSON only (no markdown).
Generate a complete object with this exact schema:
{
  "mca_reply_type": string,
  "subject_line": string,
  "heading": { "forum": string, "matter": string },
  "notice_meta": {
    "notice_number": string,
    "notice_date": string,
    "din": string,
    "company_name": string,
    "cin": string,
    "registered_office": string,
    "officers_in_default": string[]
  },
  "preliminary_submissions": string[],
  "chronology_rows": [{
    "particulars": string,
    "section": string,
    "due_date": string,
    "filing_date": string,
    "srn_challan": string,
    "status": string
  }],
  "legal_submissions": {
    "sections_92_137_403": string,
    "invoked_sections_analysis": string,
    "section_454_proviso": string,
    "procedural_vs_substantive": string,
    "proportionality": string
  },
  "officer_defense_rows": [{
    "name": string,
    "role_period": string,
    "alleged_responsibility": string,
    "mitigating_facts": string
  }],
  "section_446b_submission": string,
  "annexures": [{ "annexure_id": string, "description": string }],
  "prayer": string[],
  "signoff": {
    "signatory_name": string,
    "designation": string,
    "din_or_membership": string,
    "date": string,
    "place": string
  },
  "data_required_to_finalize_filing": string[]
}

Hard constraints:
- Use invoked sections and Section 454 with correct legal framing.
- Match chronology rows to detected MCA notice class.
- Include officer-specific defense entries.
- Never use phrase "waive penalty for officers"; use "drop or reduce penalty on officers in default...".
- Use placeholders only where truly unavailable, and keep them CA/Lawyer-fillable.
- Do not add unsupported case law.
Detected notice class: ${mcaReplyType ?? "general-mca"}
${mcaReplyType ? getMcaTypeSpecificRequirements(mcaReplyType) : ""}
${mcaReplyType ? getMcaKnowledgeBlock(mcaReplyType) : ""}
${mcaPendingChecklistText ? `\nMCA CHECKLIST (ensure represented in object fields where data exists):\n${mcaPendingChecklistText}` : ""}
`;

      const blueprintResp = await aiRequest({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        stream: false,
        messages: [
          { role: "system", content: blueprintSystemPrompt },
          { role: "user", content: userMessage + `\n\nNOTICE DETAILS:\n${noticeDetails || ""}` },
        ],
      });

      if (!blueprintResp.ok) {
        const errorText = await blueprintResp.text();
        throw new Error(`Advanced MCA blueprint generation failed: ${blueprintResp.status} ${errorText}`);
      }

      const blueprintData = await blueprintResp.json();
      const blueprintRaw = blueprintData.choices?.[0]?.message?.content || "";
      const parsedBlueprint = safeJsonParse<McaDraftBlueprint>(blueprintRaw);
      if (!parsedBlueprint) {
        return new Response(JSON.stringify({
          error: "MCA blueprint parsing failed. Please provide clearer notice facts and retry.",
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const missingBlueprintFields = validateMcaBlueprint(parsedBlueprint, mcaReplyType ?? "general-mca");
      if (strictValidation && missingBlueprintFields.length > 0) {
        return new Response(JSON.stringify({
          error: `MCA blueprint incomplete: ${missingBlueprintFields.join(", ")}`,
          missing: missingBlueprintFields,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      firstDraft = buildMcaDraftFromBlueprint({
        ...parsedBlueprint,
        mca_reply_type: parsedBlueprint.mca_reply_type ?? (mcaReplyType ?? "general-mca"),
      });
    } else {
      const draftResp = await aiRequest({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        endpoint: aiConfig.endpoint,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      if (!draftResp.ok) {
        const errorText = await draftResp.text();
        throw new Error(`Advanced draft generation failed: ${draftResp.status} ${errorText}`);
      }

      const draftData = await draftResp.json();
      firstDraft = draftData.choices?.[0]?.message?.content || "";
    }

    const reviewerSystemPrompt = documentType === "mca-notice"
      ? `You are final quality control counsel for MCA adjudication replies.
Return ONLY improved final draft text (no commentary).
Checklist:
- exact ROC jurisdiction from notice, no multi-jurisdiction guess
- chronology table aligned to detected notice class (${mcaReplyType ?? "general-mca"}) with due/event dates and filing/action dates
- invoked MCA sections and section 454 properly addressed
- section 454 proviso submission framed as fact-dependent
- officer-specific defense table present
- section 446B included only if qualification basis is stated
- never use "waive penalty for officers"; use "drop or reduce penalty on officers in default..."
- never use "waive penalty" or "absolve officers/personal liability" phrasing; use calibrated drop/reduce language
- avoid over-strong penalty rhetoric like "double jeopardy", "total waiver", or similar absolute phrasing
- keep placeholders only for CA/Lawyer-fillable metadata
- add "Data Required to Finalize Filing" if critical details are unavailable
${mcaReplyType ? `\nMCA KNOWLEDGE ENFORCEMENT:\n${getMcaKnowledgeBlock(mcaReplyType)}` : ""}
${mcaPendingChecklistText ? `\nMCA DATA CHECKLIST ENFORCEMENT:\n${mcaPendingChecklistText}` : ""}`
      : `You are final quality control counsel.
Return ONLY improved final draft text (no commentary).
Checklist:
- complete notice snapshot
- para-wise matrix present
- computation rebuttal table present
- procedural objections only if fact-supported
- annexure mapping present
- no placeholders unless truly unavailable
- no contradictions or unsupported assertions
- avoid absolute legal-claim language unless demonstrably supportable
- use exact amounts/dates/reference IDs where available
- add "Data Required to Finalize Filing" when critical details are missing`;

    const reviewerResp = await aiRequest({
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      endpoint: aiConfig.endpoint,
      stream: false,
      messages: [
        { role: "system", content: reviewerSystemPrompt },
        { role: "user", content: firstDraft },
      ],
    });

    if (!reviewerResp.ok) {
      const errorText = await reviewerResp.text();
      throw new Error(`Advanced review pass failed: ${reviewerResp.status} ${errorText}`);
    }

    const reviewedData = await reviewerResp.json();
    const reviewedDraft = reviewedData.choices?.[0]?.message?.content || firstDraft;
    let finalDraft = enforceUniversalDraftLanguage(reviewedDraft);
    let repairedMcaGateResult: DomainGateResult | null = null;
    let copyRiskScore = 0;
    let copyRiskMatchedCaseId: string | null = null;
    if (documentType === "mca-notice") {
      const repairResult = runMcaRepairAndGate(
        reviewedDraft,
        mcaReplyType ?? "general-mca",
        extractedNoticeDate,
      );
      finalDraft = repairResult.repairedDraft;
      repairedMcaGateResult = repairResult.gateResult;

      const similarity = await assessMcaTrainingCopyRisk({
        authClient,
        userId,
        noticeClass: mcaReplyType ?? "general-mca",
        draftText: finalDraft,
        currentCaseId: typeof trainingCaseId === "string" ? trainingCaseId : null,
      });
      copyRiskScore = similarity.score;
      copyRiskMatchedCaseId = similarity.matchedCaseId;

      if (copyRiskScore >= 0.72) {
        const antiCopyResp = await aiRequest({
          apiKey: aiConfig.apiKey,
          model: aiConfig.model,
          endpoint: aiConfig.endpoint,
          stream: false,
          messages: [
            {
              role: "system",
              content:
                "Rewrite the draft to remain legally equivalent but freshly worded. " +
                "Do not copy any long phrase blocks from prior drafts. " +
                "Keep all facts, chronology anchors, section references, and prayer logic intact.",
            },
            {
              role: "user",
              content:
                `NOTICE DETAILS:\n${noticeDetails || ""}\n\nDRAFT TO REWRITE (ANTI-COPY):\n${finalDraft}`,
            },
          ],
        });

        if (antiCopyResp.ok) {
          const antiCopyData = await antiCopyResp.json();
          const rewritten = extractAssistantText(antiCopyData).trim();
          if (rewritten) {
            const repairedRewrite = runMcaRepairAndGate(
              rewritten,
              mcaReplyType ?? "general-mca",
              extractedNoticeDate,
            );
            finalDraft = repairedRewrite.repairedDraft;
            repairedMcaGateResult = repairedRewrite.gateResult;
            const postRewriteSimilarity = await assessMcaTrainingCopyRisk({
              authClient,
              userId,
              noticeClass: mcaReplyType ?? "general-mca",
              draftText: finalDraft,
              currentCaseId: typeof trainingCaseId === "string" ? trainingCaseId : null,
            });
            copyRiskScore = postRewriteSimilarity.score;
            copyRiskMatchedCaseId = postRewriteSimilarity.matchedCaseId;
          }
        }
      }
    }
    if (documentType === "gst-show-cause") {
      finalDraft = enforceGstDraftMinimumStructure(finalDraft);
    } else if (documentType !== "mca-notice") {
      finalDraft = enforceCrossRegulatorySafetyLanguage(finalDraft, documentType);
    } else {
      finalDraft = enforceUniversalDraftLanguage(finalDraft);
    }

    const qaSystemPrompt = `You are a legal QA auditor for filing readiness.
Return STRICT JSON only, no markdown.
Schema:
{
  "filing_score": number,
  "mandatory_gates": {
    "no_placeholders": boolean,
    "para_wise_matrix_present": boolean,
    "computation_table_present": boolean,
    "annexure_mapping_present": boolean,
    "prayer_complete": boolean
  },
  "citation_review": [{
    "citation": string,
    "jurisdiction_fit": "high" | "medium" | "low",
    "confidence": number,
    "note": string
  }],
  "explainability": [{
    "legal_point": string,
    "why_included": string,
    "evidence_anchor": string
  }],
  "hearing_notes": string,
  "argument_script": string[],
  "annexure_index": [{
    "annexure_id": string,
    "purpose": string,
    "linked_issue": string
  }],
  "missing_for_final_filing": string[]
}`;

    const qaResp = await aiRequest({
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      endpoint: aiConfig.endpoint,
      stream: false,
      messages: [
        { role: "system", content: qaSystemPrompt },
        { role: "user", content: finalDraft },
      ],
    });

    let qaPayload: any = null;
    if (qaResp.ok) {
      const qaData = await qaResp.json();
      qaPayload = safeJsonParse<any>(qaData.choices?.[0]?.message?.content ?? "");
    }

    const fallbackGates = {
      no_placeholders: isNoPlaceholderGatePassed(finalDraft, documentType),
      para_wise_matrix_present: documentType === "mca-notice" ? true : /para[- ]wise rebuttal matrix|scn para/i.test(finalDraft),
      computation_table_present: documentType === "mca-notice" ? true : /computation|reconciliation|accepted|disputed/i.test(finalDraft),
      annexure_mapping_present: /annexure/i.test(finalDraft),
      prayer_complete: /prayer|relief|personal hearing/i.test(finalDraft),
    };

    const mandatoryGates = qaPayload?.mandatory_gates ?? fallbackGates;
    const noPlaceholderGate = mandatoryGates.no_placeholders && isNoPlaceholderGatePassed(finalDraft, documentType);

    const gateFailures: string[] = [];
    if (!noPlaceholderGate) gateFailures.push("no_placeholders");
    if (documentType !== "mca-notice" && !mandatoryGates.para_wise_matrix_present) gateFailures.push("para_wise_matrix_present");
    if (documentType !== "mca-notice" && !mandatoryGates.computation_table_present) gateFailures.push("computation_table_present");
    if (!mandatoryGates.annexure_mapping_present) gateFailures.push("annexure_mapping_present");
    if (!mandatoryGates.prayer_complete) gateFailures.push("prayer_complete");

    let domainGates: Record<string, boolean> = {};
    if (documentType === "mca-notice") {
      const mcaGateResult = repairedMcaGateResult ?? runMcaDomainGates(finalDraft, mcaReplyType ?? "general-mca");
      domainGates = mcaGateResult.gates;
      gateFailures.push(...mcaGateResult.failed);
    }

    if (strictValidation && gateFailures.length > 0) {
      return new Response(JSON.stringify({
        error: `Filing gates not satisfied: ${gateFailures.join(", ")}`,
        failed_gates: gateFailures,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filingScore = Math.max(
      0,
      Math.min(100, Number(qaPayload?.filing_score ?? (gateFailures.length === 0 ? 78 : 52)))
    );
    const riskBand = buildRiskBand(filingScore);
    const mcaChecklistMissing = documentType === "mca-notice" && mcaReplyType
      ? getMcaPendingDataChecklist(mcaReplyType)
          .filter((item) => finalDraft.includes("[To be filled by CA/Lawyer]") || finalDraft.includes("[Insert"))
      : [];
    const mergedMissingForFiling = Array.from(new Set([...(qaPayload?.missing_for_final_filing ?? []), ...mcaChecklistMissing]));
    const finalQaPayload = {
      filing_score: filingScore,
      risk_band: riskBand,
      copy_risk_score: copyRiskScore,
      mandatory_gates: {
        ...mandatoryGates,
        no_placeholders: noPlaceholderGate,
      },
      domain_gates: domainGates,
      citation_review: qaPayload?.citation_review ?? [],
      explainability: qaPayload?.explainability ?? [],
      missing_for_final_filing: mergedMissingForFiling,
    };

    const capturedTrainingCaseId = documentType === "mca-notice"
      ? await captureMcaTrainingCase({
          authClient,
          userId,
          companyId: typeof companyId === "string" ? companyId : null,
          draftRunId: typeof draftRunId === "string" ? draftRunId : null,
          noticeClass: mcaReplyType ?? "general-mca",
          noticeDetails: noticeDetails ?? null,
          generatedDraft: finalDraft,
          qaPayload: finalQaPayload,
          companyName,
          industry,
          draftMode,
          previousCaseId: typeof trainingCaseId === "string" ? trainingCaseId : null,
        })
      : null;

    return new Response(JSON.stringify({
      draft: finalDraft,
      metadata: {
        documentType,
        companyName,
        draftMode,
        industry,
        mcaReplyType,
        advancedMode,
        userId,
        trainingCaseId: capturedTrainingCaseId,
        copyRiskScore,
        copyRiskMatchedCaseId,
        generatedAt: new Date().toISOString(),
        version: "3.0-advanced",
      },
      qa: {
        ...finalQaPayload,
      },
      package: {
        reply: finalDraft,
        annexure_index: qaPayload?.annexure_index ?? [],
        hearing_notes: qaPayload?.hearing_notes ?? "Prepare hearing note from para-wise rebuttal matrix and computation table.",
        argument_script: qaPayload?.argument_script ?? [],
      },
      intelligence: extractedNotice,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI draft error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
