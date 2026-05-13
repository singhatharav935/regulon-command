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

      // 3. Construct the Legal LLM Prompt
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

${custom_prompt ? `CA Specific Instructions: ${custom_prompt}` : ''}

Output exactly 5 sections:
1. INTRODUCTION
2. FACTUAL BACKGROUND
3. LEGAL ARGUMENTS (Cite specific Sections/Rules)
4. FINANCIAL RECONCILIATION (Cross-reference the exact Swarm Data Room numbers provided above)
5. PRAYER`;

      // 4. Hit OpenAI
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

      // 5. Update Status to Review Pending and save draft
      await supabase.from('client_govt_notices').update({ 
        status: 'review_pending',
        draft_content: draftedText
      }).eq('id', notice_id);

      return new Response(JSON.stringify({ 
        success: true, 
        draft: draftedText,
        message: "Legal Draft generated successfully using verified Financial Ledgers & Data Room."
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
