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
    aggressive: "Take a legally defensible but assertive stance. Challenge procedural irregularities where supported by facts. Assert client rights firmly while maintaining professional decorum."
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
- ITC Defense (2026 Benchmark): For Section 16(2)(c) mismatches, cite Sahil Enterprises vs. Union of India (Tripura HC, Jan 2026). Argue that a bona fide purchaser cannot be penalized for a supplier's failure to remit tax; "reading down" the provision to protect genuine transactions is now the settled legal standard.
- Penalty & interest non-applicability under Section 75(1)
- Time limitation under Section 73(10)/74(10)

PRAYERS:
1. Drop the proceedings initiated vide the impugned SCN
2. In the alternative, waive penalty under Section 125/Section 127
3. Waive interest under Section 50
4. Grant opportunity of personal hearing before passing any adverse order
5. Any other relief deemed fit and proper
`,
    "income-tax-response": `
INCOME TAX-SPECIFIC INTELLIGENCE (apply only where relevant):
- Invoked sections analysis (143/147/148/139/194 etc.)
- Source of income explanation with documentary proof
- Disallowance rebuttal with legal reasoning
- Penalty protection (Sections 270A/271AAC) where applicable
- Natural justice requirements and hearing rights
- Time limitation and reopening validity (if 147/148 proceedings)

PRAYERS:
1. Drop the proposed addition/disallowance
2. In case of any disallowance, delete the penalty proceedings
3. Grant adequate opportunity of being heard
4. Consider all documents placed on record
5. Pass a speaking order with reasons
6. Any other relief as deemed fit
`,
    "mca-notice": `
MCA-SPECIFIC INTELLIGENCE (apply only where relevant):
- Companies Act 2013 section-wise analysis of sections invoked
- Clearly distinguish procedural vs substantive default
- Highlight mitigating factors, officer discretion, absence of public-interest prejudice
- Compounding / leniency where permissible
- First-time default / technical lapse arguments
- COVID-19 / economic circumstances if relevant

PRAYERS:
1. Drop the proceedings / adjudication
2. Accept the compounding application with minimum penalty
3. Grant time to rectify the default
4. Consider the bona fide nature of non-compliance
5. Waive additional fees/penalty
6. Any other relief as deemed fit
`,
    "rbi-filing": `
RBI-SPECIFIC INTELLIGENCE (apply only where relevant):
- FEMA Act and relevant regulations analysis
- Regulatory intent & proportionality
- Compliance control mechanisms and internal controls in place
- Risk mitigation measures adopted
- No systemic harm / no forex loss to nation
- Corrective action already taken
- Regulator-respectful tone throughout

PRAYERS:
1. Drop the proceedings with no adverse action
2. Accept the delayed filing/return with waiver of late fee
3. Consider the technical nature of violation
4. Grant compounding with minimum penalty
5. Any other relief as deemed fit
`,
    "sebi-compliance": `
SEBI-SPECIFIC INTELLIGENCE (apply only where relevant):
- SEBI Act and relevant regulations analysis
- Regulatory intent & proportionality
- Investor protection not compromised
- Disclosure norms compliance
- No market manipulation / insider trading
- Corporate governance framework and internal controls
- Corrective actions taken

PRAYERS:
1. Drop the proceedings / show cause notice
2. Accept the submission without penalty
3. Grant opportunity of hearing before any adverse order
4. Consider the remedial steps taken
5. Pass a speaking order with reasons
6. Any other relief as deemed fit
`,
    "customs-response": `
CUSTOMS-SPECIFIC INTELLIGENCE (apply only where relevant):
- Customs Act 1962 section-wise analysis of sections invoked
- Classification, valuation, exemption logic as applicable
- Limitation under Section 28 / extended period applicability
- Absence of mens rea / suppression / misstatement
- Proportional penalty principles under Section 112/114/114A/114AA
- Revenue neutrality where credit is available
- Reliance on HSN explanatory notes, trade notices, Board circulars

PRAYERS:
1. Drop the proceedings initiated vide the impugned SCN
2. In the alternative, reduce the duty demand / penalty proportionally
3. Waive interest under Section 28AA
4. Set aside confiscation / redemption fine
5. Grant opportunity of personal hearing
6. Any other relief as deemed fit
`,
    "contract-review": `
CONTRACT/LEGAL REVIEW INTELLIGENCE (apply only where relevant):
- Defined terms interpretation
- Contractual interpretation logic and enforceability
- Risk allocation analysis
- Safeguards and remedies available
- Dispute resolution mechanism
- Indemnity and liability provisions
- Statutory compliance analysis

SPECIFIC ELEMENTS:
1. Analyze each clause for legal enforceability
2. Identify ambiguous terms requiring clarification
3. Assess risk allocation and mitigation
4. Review compliance with applicable laws
5. Recommend modifications where necessary
6. Suggest protective language
`,
    "custom-draft": `
CUSTOM REGULATORY DRAFT:
- First identify the applicable authority and governing law from the context provided
- Apply the closest regulatory framework logic
- Follow standard regulatory response structure
- Ensure filing-ready format with professional sign-off

APPROACH:
1. Identify regulatory authority from context
2. Determine applicable Act/Rules/Regulations
3. Structure response per regulatory norms
4. Include relevant documentary evidence
5. Frame appropriate prayers/reliefs
`
  };
  return prompts[documentType] || prompts["custom-draft"];
};

const getAdvancedDraftingRequirements = () => `
ADVANCED QUALITY GATES (MANDATORY WHEN ENABLED):
1. Start with "Notice Intelligence Snapshot" capturing: authority, notice no., DIN/RFN, period, sections/rules invoked, total proposed demand, response deadline.
2. Add "Para-wise Rebuttal Matrix" with columns: SCN Para/Issue -> Department Allegation -> Noticee Rebuttal -> Evidence Annexure -> Legal Basis.
3. Add "Demand Computation Reconciliation" table: duty/tax, interest, penalty, confiscation/redemption fine with item-wise acceptance/rejection reasoning.
4. Add "Procedural Validity Check" section (jurisdiction, limitation, service validity, natural justice), but raise objections only if fact-supported.
5. Add "RUD vs Defence Evidence Mapping" section.
6. Add "Missing Data Flags" section ONLY if critical data points are absent; do not fabricate unknown facts.
7. Output must be hearing-ready and filing-ready in one document with complete layered prayer reliefs.
8. Each major contention must cite at least one supporting factual input or annexure reference.
`;

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
        const canDraft = roleSet.has("manager") || roleSet.has("admin");

        if (!canDraft) {
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
      stream = false
    } = await req.json();

    console.log("Generating filing-ready draft:", { documentType, companyName, draftMode, stream, userId });

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
    const advancedRequirements = advancedMode ? getAdvancedDraftingRequirements() : "";
    
    const systemPrompt = `ROLE & AUTHORITY
You are a Senior Practicing Chartered Accountant & Regulatory Counsel with 15+ years experience in India, handling GST, Income Tax, MCA, RBI, SEBI, Customs, and Legal matters.
Generate final, directly fileable regulatory drafts that are audit-ready, litigation-defensive, officer-persuasive, and professionally authored, assuming scrutiny by adjudicating authorities, senior officers, auditors, or courts.

NON-NEGOTIABLE OUTPUT RULES
1. NEVER include words such as "AI-generated", "draft only", "requires verification", "system generated", or any similar disclaimers.
2. Do NOT include CA countersignature, UDIN, certification, or firm verification unless explicitly instructed.
3. Default sign-off must be: "For and on behalf of ${companyName}" / "Authorized Signatory" with placeholders for Name, Designation, Date, Place.
4. The draft must read as professionally authored by the Noticee, not by any tool or system.

DRAFT MODE: ${draftMode.toUpperCase()}
${modeDescription}

UNIVERSAL DRAFTING STANDARDS (apply to every draft):
1. Follow Facts → Law → Application → Conclusion structure.
2. Provide para-wise, point-by-point rebuttal ONLY where allegations exist in the notice; do NOT invent allegations.
3. Include "Without prejudice to other rights and remedies" clause.
4. No admission of liability unless expressly instructed.
5. Protect intent by emphasizing (where factually supported):
   - No mala fide intent
   - No revenue loss to the exchequer
   - Bona fide compliance
   - Technical / clerical lapse
6. Maintain formal, precise, non-emotional, officer-friendly legal tone (never aggressive by default).
7. Always provide layered reliefs: Drop proceedings → Alternative relief (no penalty/interest/leniency) → Without-prejudice relief.

TECHNICAL OBJECTIONS RULE (CRITICAL SAFETY LOGIC):
- Raise objections relating to jurisdiction, limitation, DIN/RFN, procedural lapses, or violation of natural justice ONLY IF such defects are clearly supported by the notice text, dates, or records provided.
- Do NOT raise technical objections by default or as a standard opening strategy.
- RFN vs. DIN Rule: Per Circular 249/06/2025, portal-generated notices bearing a verifiable Reference Number (RFN) are valid service. Do NOT raise DIN-based objections if a valid RFN is present in the notice. Only challenge service validity where neither DIN nor RFN is traceable.
- If no procedural defect is evident, proceed directly with substantive factual and legal defence.

COMPANY CONTEXT:
- Company Name: ${companyName}
- Industry: ${industry || "Not specified"}
- Document Type: ${documentType}

${documentTypePrompt}

DOCUMENTARY EVIDENCE:
- Always list and contextually refer to documentary evidence (corroborative, not defensive).
- Number each document in an Annexure list at the end.

MANDATORY FINAL PRAYER:
End every draft with a comprehensive prayer section containing layered reliefs:
1. Drop proceedings
2. No penalty
3. No interest
4. Natural justice / opportunity of hearing
5. Any other relief as deemed fit and proper

OUTPUT FORMAT:
- Clean headings with proper hierarchy
- Numbered paragraphs (1.1, 1.2, etc.)
- Filing-ready format
- Professional sign-off: "For and on behalf of [Company Name]" with Name/Designation/Date/Place placeholders
- The document must pass this internal quality check:
  □ No contradictions
  □ No admissions of liability
  □ No weak or apologetic language
  □ Reads like a senior CA/Counsel authored document
  □ All paragraphs numbered properly
  □ Documentary evidence listed and referenced
  □ Prayer section complete with layered reliefs

${advancedRequirements}

${noticeDetails ? `
NOTICE DETAILS PROVIDED BY CA:
${noticeDetails}

Address each point raised in the notice para-by-para with legal reasoning. Only raise technical/procedural objections if supported by the notice content above.
` : ''}`;

    const userMessage = context || `Generate a comprehensive, filing-ready ${documentType.replace(/-/g, " ")} for ${companyName}${industry ? ` (${industry} sector)` : ""}. Include all mandatory sections, documentary evidence requirements, and complete prayer with layered reliefs.${advancedMode ? " Advanced Mode is enabled, so include Notice Intelligence Snapshot, para-wise rebuttal matrix, demand reconciliation table, and RUD-to-annexure mapping." : ""} The document must be immediately ready for filing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits exhausted. Please add credits to continue." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
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
        generatedAt: new Date().toISOString(),
        version: "1.0",
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI draft error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
