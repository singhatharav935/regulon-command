import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowOrigin = allowlist.length === 0
    ? "*"
    : allowlist.includes(origin)
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

const aiRequest = async ({
  apiKey,
  messages,
  stream,
}: {
  apiKey: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  stream: boolean;
}) => {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
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

const hasPlaceholders = (content: string) =>
  /\[insert[^\]]*\]|\[to be filled\]|<insert|placeholder/i.test(content);

const buildRiskBand = (score: number): "low" | "medium" | "high" => {
  if (score >= 75) return "low";
  if (score >= 45) return "medium";
  return "high";
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
        apiKey: LOVABLE_API_KEY,
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

COMPANY CONTEXT
- Company: ${companyName}
- Industry: ${industry || "Not specified"}
- Document Type: ${documentType}

${extractedNotice ? `EXTRACTED NOTICE INTELLIGENCE (use as primary structure source):\n${JSON.stringify(extractedNotice, null, 2)}` : ""}

${noticeDetails ? `RAW NOTICE DETAILS:\n${noticeDetails}` : ""}
`;

    const userMessage = context || `Generate a comprehensive, filing-ready ${documentType.replace(/-/g, " ")} for ${companyName}${industry ? ` (${industry} sector)` : ""}. Include SCN para-wise rebuttal matrix, allegation-wise computation challenge with accepted/disputed columns, annexure mapping per issue, calibrated legal language, and complete layered prayer.`;

    if (!advancedMode) {
      const response = await aiRequest({
        apiKey: LOVABLE_API_KEY,
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

    // Advanced Mode: two-pass generation + quality review
    const draftResp = await aiRequest({
      apiKey: LOVABLE_API_KEY,
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
    const firstDraft = draftData.choices?.[0]?.message?.content || "";

    const reviewerSystemPrompt = `You are final quality control counsel.
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
      apiKey: LOVABLE_API_KEY,
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
      apiKey: LOVABLE_API_KEY,
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
      no_placeholders: !hasPlaceholders(finalDraft),
      para_wise_matrix_present: /para[- ]wise rebuttal matrix|scn para/i.test(finalDraft),
      computation_table_present: /computation|reconciliation|accepted|disputed/i.test(finalDraft),
      annexure_mapping_present: /annexure/i.test(finalDraft),
      prayer_complete: /prayer|relief|personal hearing/i.test(finalDraft),
    };

    const mandatoryGates = qaPayload?.mandatory_gates ?? fallbackGates;
    const noPlaceholderGate = mandatoryGates.no_placeholders && !hasPlaceholders(finalDraft);

    const gateFailures: string[] = [];
    if (!noPlaceholderGate) gateFailures.push("no_placeholders");
    if (!mandatoryGates.para_wise_matrix_present) gateFailures.push("para_wise_matrix_present");
    if (!mandatoryGates.computation_table_present) gateFailures.push("computation_table_present");
    if (!mandatoryGates.annexure_mapping_present) gateFailures.push("annexure_mapping_present");
    if (!mandatoryGates.prayer_complete) gateFailures.push("prayer_complete");

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
