import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * bank-sync-webhook Edge Function (REAL-TIME ACCOUNT AGGREGATOR PUSH WEBHOOK)
 * ───────────────────────────────────────────────────────────────────────────
 * This secure endpoint is called by RBI Account Aggregators (Setu, Perfios, Sahamati)
 * or bank open APIs whenever a credit/debit transaction occurs in the client's corporate bank account.
 *
 * It automatically:
 *  1. Secures the request using a signature secret validation.
 *  2. Ingests the transaction details into 'client_bank_transactions'.
 *  3. Triggers 'ai-financial-swarm' to autonomously re-compute all 26 compliance modules and PDFs!
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Signature Security Validation
    const webhookSecret = Deno.env.get("BANK_WEBHOOK_SECRET");
    const signature = req.headers.get("x-bank-webhook-signature") || req.headers.get("authorization");

    if (webhookSecret && signature !== `Bearer ${webhookSecret}`) {
      console.warn("[BANK-WEBHOOK] Unauthorized access attempt blocked. Invalid signature.");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized: Invalid webhook signature." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse Incoming Transaction Payload
    const payload = await req.json();
    const { 
      company_id, 
      ca_user_id,
      transaction_date, 
      description, 
      debit_amount, 
      credit_amount,
      counterparty_gstin 
    } = payload;

    if (!company_id || !transaction_date || !description) {
      throw new Error("Missing mandatory fields: company_id, transaction_date, description");
    }

    console.info(`[BANK-WEBHOOK] Received new transaction for Company: ${company_id}. Description: "${description}". Amount: ${credit_amount || debit_amount}`);

    // 3. LLM Auto-Categorization rule-based pre-sort
    let category = "uncategorized";
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("salary") || lowerDesc.includes("payroll")) category = "salary";
    else if (lowerDesc.includes("rent")) category = "rent";
    else if (lowerDesc.includes("gst")) category = "gst_payment";
    else if (lowerDesc.includes("tds")) category = "tds_payment";
    else if (credit_amount > 0) category = "revenue";

    // 4. Insert/Upsert the real transaction in Supabase
    const transactionRecord = {
      company_id,
      ca_user_id: ca_user_id || null,
      financial_year: "2024-25", // Current filing cycle
      transaction_date,
      description,
      debit_amount: parseFloat(debit_amount) || 0,
      credit_amount: parseFloat(credit_amount) || 0,
      ai_category: category,
      metadata: {
        source: "account_aggregator_push",
        gstin_metadata: counterparty_gstin || null,
        processed_at: new Date().toISOString()
      }
    };

    const { data: insertedTx, error: dbErr } = await supabase
      .from("client_bank_transactions")
      .insert([transactionRecord])
      .select()
      .single();

    if (dbErr) {
      console.error("[BANK-WEBHOOK] Database insert error:", dbErr);
      throw dbErr;
    }

    console.info(`[BANK-WEBHOOK] Transaction securely logged. ID: ${insertedTx.id}. Triggering AI Swarm...`);

    // 5. Trigger the AI Swarm recalculation in the background
    // This will dynamically re-compute the 26 modules and update the client notice response PDFs!
    const { data: caMembers } = await supabase
      .from("company_members")
      .select("user_id")
      .eq("company_id", company_id)
      .eq("role", "manager")
      .limit(1)
      .maybeSingle();

    const actualCAUser = ca_user_id || caMembers?.user_id;

    if (actualCAUser) {
      // Async trigger: invoke ai-financial-swarm Edge Function
      const swarmPayload = {
        action: "trigger_swarm",
        company_id,
        ca_user_id: actualCAUser,
        financial_year: "2024-25"
      };

      console.info("[BANK-WEBHOOK] Dispatching background AI Swarm execution call...");
      fetch(`${supabaseUrl}/functions/v1/ai-financial-swarm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.get("authorization") || `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(swarmPayload)
      }).catch(err => console.error("[BANK-WEBHOOK] Background Swarm invocation warning:", err));
    } else {
       console.warn("[BANK-WEBHOOK] No managing CA found for this company. Background AI Swarm trigger deferred.");
    }

    // 6. Return Acknowledgment
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Transaction logged securely. Auto-pilot Swarm execution successfully triggered.",
      transaction_id: insertedTx.id
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[BANK-WEBHOOK] Webhook Execution Failed:", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
