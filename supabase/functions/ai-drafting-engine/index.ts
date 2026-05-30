import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, notice_id, company_id, ca_user_id, financial_year, custom_prompt } = await req.json();

    if (!action) throw new Error("Action is required");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API Key is missing. System halted.");

    if (action === "generate_draft") {
      // 1. Fetch Notice Content
      const { data: notice, error: noticeErr } = await supabase
        .from('client_govt_notices')
        .select('*')
        .eq('id', notice_id)
        .single();
        
      if (noticeErr) throw noticeErr;

      // Update notice status
      await supabase.from('client_govt_notices').update({ status: 'analyzing' }).eq('id', notice_id);

      // 2. WIRING TO AI SWARM FINANCIAL ENGINE: Fetch Data Room & Books & Inputs
      console.log(`[Drafting Engine] Connecting to Swarm Data Room for company ${company_id}...`);

      const { data: dataRoom } = await supabase
        .from('client_notice_data_room')
        .select('compiled_bs, compiled_pl, executive_summary')
        .eq('company_id', company_id)
        .eq('financial_year', financial_year)
        .maybeSingle();

      const { data: modules } = await supabase
        .from('client_module_calculations')
        .select('module_id, module_label, calculation_data')
        .eq('company_id', company_id)
        .eq('financial_year', financial_year);

      // Fetch the RAW financial ledgers (Balance Sheet & P&L Books)
      const { data: finBooks } = await supabase
        .from('client_financial_books')
        .select('book_type, book_data, summary_metrics')
        .eq('company_id', company_id)
        .eq('financial_year', financial_year);

      // Fetch CA override inputs (verified math)
      const { data: statInputs } = await supabase
        .from('client_statutory_inputs')
        .select('*')
        .eq('company_id', company_id)
        .eq('financial_year', financial_year)
        .maybeSingle();

      await supabase.from('client_govt_notices').update({ status: 'drafting_reply' }).eq('id', notice_id);

      // 3. RAG: Retrieve Legal Context from Vector DB
      console.log(`[Drafting Engine] Searching Legal Vector Database for relevant laws...`);
      let legalContext = "No specific legal precedent retrieved.";
      
      try {
        // Embed the notice text to search for matching laws
        const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: notice.raw_text_content ? notice.raw_text_content.substring(0, 1000) : notice.notice_type
          })
        });
        
        if (embedRes.ok) {
          const embedData = await embedRes.json();
          const queryEmbedding = embedData.data[0].embedding;
          
          // Call Supabase RPC for similarity search
          const { data: matchedLaws, error: matchErr } = await supabase.rpc('match_legal_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.3, // low threshold to catch broad topics
            match_count: 3
          });
          
          if (!matchErr && matchedLaws && matchedLaws.length > 0) {
            legalContext = matchedLaws.map((l: any) => `${l.act_name}, ${l.section_reference}: ${l.content}`).join("\n\n");
            console.log(`[Drafting Engine] Found ${matchedLaws.length} matching laws.`);
          }
        }
      } catch (ragErr) {
        console.error("RAG Legal Search Failed, continuing without it:", ragErr);
      }

      // 4. Construct the Legal LLM Prompt
      const systemPrompt = `You are an elite Indian Chartered Accountant and Legal Counsel. You are writing an official response to a ${notice.department} Notice (${notice.notice_type}).
You have direct backend access to the exact verified financial ledgers and compliance math calculated by the AI Financial Swarm.
You MUST draft a highly professional, legal response referencing the exact sections of the CGST Act, 2017, Income Tax Act, 1961, or Companies Act, 2013 where applicable.

Notice Context:
Department: ${notice.department}
Type: ${notice.notice_type}
Issue Date: ${notice.issue_date}
Raw Notice Text (if any): ${notice.raw_text_content || 'Notice uploaded via PDF. Address general compliance for ' + notice.notice_type}

--- REAL-TIME SWARM DATA ROOM (Use these EXACT numbers to defend the client) ---
Financial Summary: ${dataRoom?.executive_summary || 'N/A'}
Statutory Verified Inputs (ITC, Advance Tax, TDS): ${JSON.stringify(statInputs)}
Financial Books (P&L, Balance Sheet Summary): ${JSON.stringify(finBooks?.map(b => b.summary_metrics))}
Calculated Compliance Modules: ${JSON.stringify(modules)}
--------------------------------------------------------------------------------

--- RETRIEVED INDIAN LEGAL PRECEDENT (Vector Database Memory) ---
The following sections of law match the context of the notice. USE THESE EXPLICITLY in your legal arguments:
${legalContext}
--------------------------------------------------------------------------------

${custom_prompt ? `CA Specific Instructions: ${custom_prompt}` : ''}

--- ZERO-HALLUCINATION GUARDRAIL (CRITICAL) ---
You are bound by strict legal liability. You may only cite sections of the CGST Act, Income Tax Act, or Corporate Law that you know with 100% absolute certainty from your training data or the Vector Database. 
If a specific sub-section is ambiguous or you cannot remember the exact clause number, you MUST omit the exact number and explicitly flag the paragraph with [CA VERIFICATION REQUIRED]. 
NEVER invent, hallucinate, or guess a legal section.

Output exactly 5 sections:
1. INTRODUCTION
2. FACTUAL BACKGROUND
3. LEGAL ARGUMENTS (Cite specific Sections/Rules)
4. FINANCIAL RECONCILIATION (Cross-reference the exact Swarm Data Room numbers provided above)
5. PRAYER`;

      // 5. Hit OpenAI
      const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o", // Using full model for complex legal drafting
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.2, // Low temp for factual legal accuracy
        })
      });

      if (!llmRes.ok) {
        throw new Error(await llmRes.text());
      }

      const llmData = await llmRes.json();
      const draftedText = llmData.choices[0].message.content;

      // 6. PHASE 4: MULTI-AGENT DEBATE (Senior Partner Review)
      console.log(`[Drafting Engine] Agent 1 complete. Passing to Agent 2 (Senior Partner) for strict review...`);
      
      const reviewerPrompt = `You are a strict, highly experienced Senior Partner at a top-tier Indian CA firm. 
A junior AI agent just drafted the following response to a ${notice.department} notice. 
Your job is to mercilessly review this draft for legal loopholes, weak arguments, or hallucinated sections.
1. Provide a harsh 'critique' of any weak points.
2. Rewrite the draft into a 'final_draft' that is mathematically and legally flawless, incorporating your critique.
Return a JSON object strictly matching this schema: { "critique": "string", "final_draft": "string" }`;

      const reviewerRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: reviewerPrompt },
            { role: "user", content: draftedText }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        })
      });

      if (!reviewerRes.ok) {
        throw new Error(`Reviewer Agent Failed: ${await reviewerRes.text()}`);
      }

      const reviewerData = await reviewerRes.json();
      const reviewJSON = JSON.parse(reviewerData.choices[0].message.content);
      
      const finalPolishedDraft = reviewJSON.final_draft;
      const agentCritique = reviewJSON.critique;

      console.log(`[Drafting Engine] Senior Partner Review Complete. Critique: ${agentCritique.substring(0, 100)}...`);

      // 7. Update Status to Review Pending and save both draft and critique
      await supabase.from('client_govt_notices').update({ 
        status: 'review_pending',
        draft_content: finalPolishedDraft,
        ai_summary: agentCritique // Saving the critique so the human CA can see the AI debate
      }).eq('id', notice_id);

      return new Response(JSON.stringify({ 
        success: true, 
        draft: finalPolishedDraft,
        critique: agentCritique,
        message: "Multi-Agent Debate complete. Senior Partner approved final draft."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });

  } catch (err: any) {
    console.error("Drafting Engine Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
