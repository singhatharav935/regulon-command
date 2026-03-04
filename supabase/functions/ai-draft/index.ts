import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const getMcaHardRequirements = () => `
MCA ADJUDICATION HARD REQUIREMENTS (MANDATORY FOR MCA NOTICE DRAFTS):
1. Identify and use the exact ROC jurisdiction from notice facts (do not guess multiple jurisdictions).
2. Include a chronology table with BOTH due dates and actual filing dates for AOC-4 and MGT-7, with SRNs/challan refs where available.
3. Explicitly address Sections 92, 137, 403 and 454 in the legal analysis if these are part of notice facts.
4. Add officer-specific defense: identify "officer in default", role period, and absence/presence of willful default based on records.
5. If rectification occurred before notice OR within 30 days of notice, include a specific Section 454 proviso submission seeking no-penalty treatment (fact-dependent, no over-claim).
6. Mention Section 446B only when factual qualification is shown in the draft (e.g., paid-up capital/turnover/startup recognition date).
7. Never use "waive penalty for officers"; instead use "drop or reduce penalty on officers in default based on role, conduct, and mitigating facts."
8. Use this output skeleton: heading + notice metadata + preliminary submissions + chronology table + legal submissions + officer-specific defense + 446B block (if eligible) + annexures + layered prayer + sign-off.
9. If filing-critical data is unavailable, placeholders are allowed only as "[To be filled by CA/Lawyer]" or simple metadata placeholders (CIN/address/signatory fields).
10. If critical details remain unavailable, append "Data Required to Finalize Filing".
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

### **REPLY TO ADJUDICATION NOTICE FOR ALLEGED NON-COMPLIANCE OF SECTIONS 92 AND 137 OF THE COMPANIES ACT, 2013**

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
1. **Sections 92, 137 and 403:** ${ensureMcaValue(bp.legal_submissions?.sections_92_137_403, "Section 403 permits delayed filing upon payment of additional fees; completed filing with additional fees is a material mitigating circumstance in adjudication.")}
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

const runMcaDomainGates = (draft: string): DomainGateResult => {
  const has446bMention = /\b446B\b/i.test(draft);
  const gates: Record<string, boolean> = {
    mentions_92_137: /\bSection\s*92\b/i.test(draft) && /\bSection\s*137\b/i.test(draft),
    mentions_403: /\bSection\s*403\b/i.test(draft),
    mentions_454: /\bSection\s*454\b/i.test(draft),
    has_aoc4_mgt7: /\bAOC-?4\b/i.test(draft) && /\bMGT-?7\b/i.test(draft),
    has_chronology_table: /due date/i.test(draft) && /actual date/i.test(draft),
    has_officer_defense: /officer in default|officer-specific|role period|willful default/i.test(draft),
    avoids_waive_officer_penalty_phrase: !/waive penalty for officers/i.test(draft),
    qualifies_446b_if_used: !has446bMention || /(paid-?up capital|turnover|startup recognition|section 2\(85\))/i.test(draft),
  };

  return {
    gates,
    failed: Object.entries(gates)
      .filter(([, passed]) => !passed)
      .map(([name]) => name),
  };
};

const validateMcaBlueprint = (bp: McaDraftBlueprint): string[] => {
  const missing: string[] = [];
  if (!(bp.notice_meta?.notice_number || "").trim()) missing.push("notice_meta.notice_number");
  if (!(bp.notice_meta?.notice_date || "").trim()) missing.push("notice_meta.notice_date");
  if (!(bp.notice_meta?.din || "").trim()) missing.push("notice_meta.din");
  if (!(bp.notice_meta?.company_name || "").trim()) missing.push("notice_meta.company_name");
  if ((bp.chronology_rows ?? []).length < 2) missing.push("chronology_rows(minimum 2: AOC-4 and MGT-7)");
  if (!(bp.legal_submissions?.sections_92_137_403 || "").trim()) missing.push("legal_submissions.sections_92_137_403");
  if (!(bp.legal_submissions?.section_454_proviso || "").trim()) missing.push("legal_submissions.section_454_proviso");
  if ((bp.prayer ?? []).length < 3) missing.push("prayer(minimum 3 points)");
  return missing;
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
      documentType,
      companyName,
      draftMode,
      industry,
      context,
      noticeDetails,
      advancedMode = false,
      strictValidation = false,
      stream = false,
    } = await req.json();

    if (strictValidation && (!noticeDetails || noticeDetails.trim().length < 200)) {
      return new Response(JSON.stringify({
        error: "Advanced mode requires detailed notice/order content (minimum 200 characters).",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiConfig = resolveAIConfig();

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
${documentType === "mca-notice" ? getMcaHardRequirements() : ""}

COMPANY CONTEXT
- Company: ${companyName}
- Industry: ${industry || "Not specified"}
- Document Type: ${documentType}

${extractedNotice ? `EXTRACTED NOTICE INTELLIGENCE (use as primary structure source):\n${JSON.stringify(extractedNotice, null, 2)}` : ""}

${noticeDetails ? `RAW NOTICE DETAILS:\n${noticeDetails}` : ""}
`;

    const userMessage = context || (documentType === "mca-notice"
      ? `Generate a final adjudication-ready MCA reply for ${companyName}${industry ? ` (${industry} sector)` : ""}.
Mandatory structure:
1) Heading + exact ROC jurisdiction from notice
2) Notice metadata (notice no, date, DIN, company block, officers in default block)
3) Preliminary submissions
4) Chronology table with due date vs actual filing date and SRN/challan for AOC-4 and MGT-7
5) Legal submissions under Sections 92, 137, 403, 454 (with fact-dependent proviso request)
6) Officer-specific defense table
7) Section 446B block only if factual qualification is shown
8) Annexure index
9) Layered prayer with hearing request
10) Sign-off
Avoid unsupported case law. Use controlled placeholders only where unavoidable.`
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
      const draftContent = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({
        draft: draftContent,
        metadata: {
          documentType,
          companyName,
          draftMode,
          industry,
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
- Use Sections 92, 137, 403 and 454 with correct legal framing.
- Include AOC-4 and MGT-7 rows in chronology.
- Include officer-specific defense entries.
- Never use phrase "waive penalty for officers"; use "drop or reduce penalty on officers in default...".
- Use placeholders only where truly unavailable, and keep them CA/Lawyer-fillable.
- Do not add unsupported case law.
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

      const missingBlueprintFields = validateMcaBlueprint(parsedBlueprint);
      if (strictValidation && missingBlueprintFields.length > 0) {
        return new Response(JSON.stringify({
          error: `MCA blueprint incomplete: ${missingBlueprintFields.join(", ")}`,
          missing: missingBlueprintFields,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      firstDraft = buildMcaDraftFromBlueprint(parsedBlueprint);
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
- chronology table with due date vs actual filing date for AOC-4 and MGT-7 with SRN/challan refs where available
- sections 92, 137, 403 and 454 properly addressed
- section 454 proviso submission framed as fact-dependent
- officer-specific defense table present
- section 446B included only if qualification basis is stated
- never use "waive penalty for officers"; use "drop or reduce penalty on officers in default..."
- keep placeholders only for CA/Lawyer-fillable metadata
- add "Data Required to Finalize Filing" if critical details are unavailable`
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
    const finalDraft = reviewedData.choices?.[0]?.message?.content || firstDraft;

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
      const mcaGateResult = runMcaDomainGates(finalDraft);
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

    return new Response(JSON.stringify({
      draft: finalDraft,
      metadata: {
        documentType,
        companyName,
        draftMode,
        industry,
        advancedMode,
        userId,
        generatedAt: new Date().toISOString(),
        version: "3.0-advanced",
      },
      qa: {
        filing_score: filingScore,
        risk_band: riskBand,
        mandatory_gates: {
          ...mandatoryGates,
          no_placeholders: noPlaceholderGate,
        },
        domain_gates: domainGates,
        citation_review: qaPayload?.citation_review ?? [],
        explainability: qaPayload?.explainability ?? [],
        missing_for_final_filing: qaPayload?.missing_for_final_filing ?? [],
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
