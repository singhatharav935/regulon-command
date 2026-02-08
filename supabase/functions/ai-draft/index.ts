import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      context 
    } = await req.json();

    console.log("Generating AI draft:", { documentType, companyName, draftMode });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the system prompt for regulatory drafting
    const systemPrompt = `You are REGULON AI, a specialized regulatory compliance drafting assistant for Indian regulations.

CRITICAL RULES:
1. You generate DRAFTS only - all outputs require mandatory CA and Lawyer verification
2. Every draft must clearly identify the applicable laws, sections, rules, and circulars
3. Include a "Legal Basis" section at the start of every draft
4. Highlight any risks, gaps, or missing information
5. Never provide legal or financial advice - only draft templates
6. All outputs are marked as "AI-Generated Draft – Requires CA/Lawyer Verification"

DRAFT MODE: ${draftMode}
- Conservative: Use most cautious language, minimize assertions, focus on procedural compliance
- Balanced: Standard industry practice, reasonable assertions with proper documentation
- Assertive: Legally defensible but assertive stance, challenge procedural irregularities where applicable

Company: ${companyName}
Document Type: ${documentType}

Generate a professional regulatory draft with:
1. Proper heading and reference numbers
2. Clear Legal Basis section citing specific Acts, Sections, Rules
3. Factual background
4. Point-by-point submissions
5. Documentary evidence list
6. Prayer/conclusion
7. Risk highlights if any gaps exist`;

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
          { role: "user", content: context || "Generate a draft response based on the document type and mode specified." }
        ],
        stream: false,
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

    const data = await response.json();
    const draftContent = data.choices?.[0]?.message?.content || "";

    console.log("Draft generated successfully");

    return new Response(JSON.stringify({
      draft: draftContent,
      metadata: {
        documentType,
        companyName,
        draftMode,
        generatedAt: new Date().toISOString(),
        status: "AI-Generated Draft – Requires CA/Lawyer Verification"
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
