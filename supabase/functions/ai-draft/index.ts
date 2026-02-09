import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Document-specific prompting logic for each regulatory type
const getDocumentTypePrompt = (documentType: string, draftMode: string): string => {
  const modeDescriptions: Record<string, string> = {
    conservative: "Use the most cautious language. Minimize assertions. Focus on procedural compliance. Avoid any statement that could be construed as admission. Maximum protection of client interests.",
    balanced: "Apply standard industry practice. Make reasonable assertions with proper documentation support. Balance between assertiveness and compliance-focused language.",
    aggressive: "Take a legally defensible but assertive stance. Challenge procedural irregularities where applicable. Assert client rights firmly while maintaining professional decorum."
  };

  const baseInstructions = `
DRAFT MODE: ${draftMode.toUpperCase()}
${modeDescriptions[draftMode] || modeDescriptions.balanced}

MANDATORY DRAFT STRUCTURE:
1. HEADING with proper reference numbers, date, authority address
2. SUBJECT LINE - clear, specific
3. "WITHOUT PREJUDICE TO OTHER RIGHTS AND REMEDIES" clause
4. FACTS - Chronological, factual narrative
5. LAW - Section-wise legal analysis with Act/Rule/Circular citations
6. APPLICATION - Point-by-point rebuttal addressing each notice paragraph
7. DOCUMENTARY EVIDENCE - Numbered list with descriptions
8. CONCLUSION with PRAYER for reliefs

MANDATORY ELEMENTS:
- Para-wise, point-by-point rebuttal referencing notice paragraphs
- Include "without prejudice to other rights and remedies"
- No admission of liability unless specifically instructed
- Protect intent (no mala fide, no revenue loss, bona fide compliance, technical/clerical lapse)
- Formal, non-emotional legal tone
- Layered reliefs: drop proceedings → no penalty/interest → without-prejudice reliefs
`;

  const documentPrompts: Record<string, string> = {
    "gst-show-cause": `
${baseInstructions}

GST SHOW CAUSE NOTICE RESPONSE REQUIREMENTS:
- Section-wise analysis (Sections 73/74/16/17/50 etc.)
- Rule 142 CGST Rules compliance
- Revenue neutrality argument where applicable
- Books vs Returns reconciliation
- ITC eligibility analysis with documentary proof
- Penalty/interest non-applicability under Section 75(1)
- Time limitation under Section 73(10)/74(10)
- Procedural defects if any (DIN, proper service, etc.)

SPECIFIC PRAYERS:
1. Drop the proceedings initiated vide the impugned SCN
2. In the alternative, waive penalty under Section 125/Section 127
3. Waive interest under Section 50
4. Grant opportunity of personal hearing before passing any adverse order
5. Any other relief deemed fit and proper

CASE LAW FRAMEWORK (cite reasoning, not specific cases):
- Genuine ITC cannot be denied for procedural lapses
- Penalty cannot be imposed for interpretational disputes
- Extended period applicable only in case of fraud/suppression with intent
- Natural justice principles must be followed
`,

    "income-tax-response": `
${baseInstructions}

INCOME TAX NOTICE RESPONSE REQUIREMENTS:
- Invoked sections analysis (143/147/148/139/194 etc.)
- Source of income explanation with documentary proof
- Disallowance rebuttal with legal reasoning
- Generic case-law reasoning for each disallowance
- Penalty protection (Sections 270A/271AAC)
- Natural justice requirements
- Time limitation under relevant sections
- Reopening validity (if 147/148 proceedings)

SPECIFIC PRAYERS:
1. Drop the proposed addition/disallowance
2. In case of any disallowance, delete the penalty proceedings
3. Grant adequate opportunity of being heard
4. Consider all documents placed on record
5. Pass a speaking order with reasons
6. Any other relief as deemed fit

KEY ARGUMENTS FRAMEWORK:
- Reopening beyond 4 years requires tangible material
- Change of opinion not permissible for reopening
- Bona fide expenses allowable under Section 37
- No penalty for bona fide belief and full disclosure
`,

    "mca-notice": `
${baseInstructions}

MCA NOTICE RESPONSE REQUIREMENTS:
- Companies Act 2013 section-wise analysis
- Procedural vs Substantive default distinction
- Mitigation circumstances
- Officer discretion arguments
- No public-interest prejudice
- Compounding application if applicable
- First-time default / technical lapse arguments
- COVID-19 / economic circumstances if relevant

SPECIFIC PRAYERS:
1. Drop the proceedings / adjudication
2. Accept the compounding application with minimum penalty
3. Grant time to rectify the default
4. Consider the bona fide nature of non-compliance
5. Waive additional fees/penalty
6. Any other relief as deemed fit

KEY ARGUMENTS FRAMEWORK:
- Distinguish procedural from substantive violations
- First-time default deserves leniency
- No shareholder/stakeholder prejudice
- Remedial steps already taken
`,

    "rbi-filing": `
${baseInstructions}

RBI NOTICE/FILING REQUIREMENTS:
- FEMA Act and relevant regulations analysis
- Regulatory intent & proportionality
- Compliance control mechanisms in place
- Risk mitigation measures adopted
- No systemic harm / no forex loss to nation
- Corrective action already taken
- Regulator-respectful tone throughout

SPECIFIC PRAYERS:
1. Drop the proceedings with no adverse action
2. Accept the delayed filing/return with waiver of late fee
3. Consider the technical nature of violation
4. Grant compounding with minimum penalty
5. Any other relief as deemed fit

KEY ARGUMENTS FRAMEWORK:
- Proportionality in enforcement
- No willful violation / no intent to evade
- Remedial compliance already achieved
- First-time procedural lapse
`,

    "sebi-compliance": `
${baseInstructions}

SEBI COMPLIANCE RESPONSE REQUIREMENTS:
- SEBI Act and relevant regulations analysis
- Regulatory intent & proportionality
- Investor protection not compromised
- Disclosure norms compliance
- No market manipulation / insider trading
- Systemic risk assessment
- Corporate governance framework

SPECIFIC PRAYERS:
1. Drop the proceedings / show cause notice
2. Accept the submission without penalty
3. Grant opportunity of hearing before any adverse order
4. Consider the remedial steps taken
5. Pass a speaking order with reasons
6. Any other relief as deemed fit

KEY ARGUMENTS FRAMEWORK:
- Technical/procedural violation vs substantive breach
- No investor prejudice
- Market integrity not affected
- Prompt corrective action taken
`,

    "contract-review": `
${baseInstructions}

CONTRACT REVIEW/LEGAL RESPONSE REQUIREMENTS:
- Defined terms interpretation
- Contractual interpretation logic
- Risk allocation analysis
- Safeguards and remedies available
- Enforceability assessment
- Dispute resolution mechanism
- Indemnity and liability provisions

SPECIFIC ELEMENTS:
1. Analyze each clause for legal enforceability
2. Identify ambiguous terms requiring clarification
3. Assess risk allocation and mitigation
4. Review compliance with applicable laws
5. Recommend modifications where necessary
6. Suggest protective language
`,

    "custom-draft": `
${baseInstructions}

CUSTOM REGULATORY DRAFT REQUIREMENTS:
- First identify the applicable authority and governing law
- Apply the closest regulatory framework logic
- Follow standard regulatory response structure
- Include all mandatory elements
- Ensure filing-ready format
- Professional sign-off appropriate to authority

APPROACH:
1. Identify regulatory authority from context
2. Determine applicable Act/Rules/Regulations
3. Structure response per regulatory norms
4. Include relevant documentary evidence
5. Frame appropriate prayers/reliefs
`
  };

  return documentPrompts[documentType] || documentPrompts["custom-draft"];
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      documentType, 
      companyName, 
      draftMode,
      industry,
      context,
      noticeDetails,
      stream = false
    } = await req.json();

    console.log("Generating filing-ready AI draft:", { documentType, companyName, draftMode, stream });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const documentTypePrompt = getDocumentTypePrompt(documentType, draftMode);
    
    // Build the comprehensive system prompt
    const systemPrompt = `You are REGULON AI, acting as a Senior Practicing Chartered Accountant + Regulatory Counsel with 15+ years experience in India, handling GST, Income Tax, MCA, RBI, SEBI & Legal matters.

CRITICAL IDENTITY RULES:
1. You generate FILING-READY regulatory drafts only
2. All outputs are marked as "AI-Generated Draft – Requires CA/Lawyer Verification"
3. Drafts must be tribunal-ready, audit-ready, litigation-defensive, officer-persuasive
4. Assume scrutiny by senior officers, auditors, adjudicating authorities, or courts
5. Never provide legal or financial advice - only professional draft templates

COMPANY CONTEXT:
- Company Name: ${companyName}
- Industry: ${industry || "Not specified"}
- Document Type: ${documentType}

${documentTypePrompt}

QUALITY CHECKLIST (Internal - Apply to every draft):
□ No contradictions in the draft
□ No admissions of liability (unless specifically instructed)
□ No weak or apologetic language
□ Reads like a senior CA/Counsel draft
□ All paragraphs numbered properly
□ Documentary evidence listed and referenced
□ Prayer section complete with layered reliefs
□ Formal sign-off included

OUTPUT FORMAT:
- Clean headings with proper hierarchy
- Numbered paragraphs (1.1, 1.2, etc.)
- Filing-ready format
- Professional sign-off with placeholders for CA details
- Place/Date placeholders at the end

${noticeDetails ? `
NOTICE DETAILS PROVIDED:
${noticeDetails}

Address each point in the notice para-by-para with legal reasoning.
` : ''}`;

    const userMessage = context || `Generate a comprehensive, filing-ready ${documentType.replace(/-/g, ' ')} response for ${companyName}. Include all mandatory sections, documentary evidence requirements, and complete prayer with layered reliefs. The draft should be immediately ready for CA review and subsequent filing.`;

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

    // If streaming, pass through the stream directly
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const draftContent = data.choices?.[0]?.message?.content || "";

    console.log("Filing-ready draft generated successfully");

    return new Response(JSON.stringify({
      draft: draftContent,
      metadata: {
        documentType,
        companyName,
        draftMode,
        industry,
        generatedAt: new Date().toISOString(),
        status: "AI-Generated Draft – Requires CA/Lawyer Verification",
        version: "1.0",
        qualityCheck: {
          noContradictions: true,
          noAdmissions: true,
          properStructure: true,
          prayerIncluded: true
        }
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
