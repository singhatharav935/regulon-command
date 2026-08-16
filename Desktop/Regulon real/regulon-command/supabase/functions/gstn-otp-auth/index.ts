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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, gstin, otp, company_id } = await req.json();

    if (!action || !gstin) {
      throw new Error("Missing required parameters (action, gstin).");
    }

    // REAL Integration: Must have actual GSP keys
    const gspApiKey = Deno.env.get("GSTN_GSP_API_KEY");
    if (!gspApiKey) {
      throw new Error("CRITICAL: GSTN_GSP_API_KEY missing. Cannot send real OTP from Indian Government Portal without live credentials.");
    }

    if (action === 'send_otp') {
      console.log(`[GST OTP] Sending real OTP request to GSTN for GSTIN: ${gstin}`);
      
      const gspApiUrl = `https://api.mastergst.com/public/search/send-otp?gstin=${gstin}`;
      const response = await fetch(gspApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${gspApiKey}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`GSTN API Error: ${await response.text()}`);
      }

      // If successful, GSTN usually returns a transaction ID or success message
      const data = await response.json();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "OTP successfully sent to the mobile number registered with this GSTIN.",
        transaction_id: data.txn_id || "txn_mock_until_live"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } 
    
    else if (action === 'verify_otp') {
      if (!otp) throw new Error("Missing OTP.");
      
      console.log(`[GST OTP] Verifying real OTP request to GSTN for GSTIN: ${gstin}`);
      
      const gspApiUrl = `https://api.mastergst.com/public/search/verify-otp?gstin=${gstin}`;
      const response = await fetch(gspApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${gspApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ otp })
      });

      if (!response.ok) {
        throw new Error(`GSTN API Error: Invalid OTP or session expired.`);
      }

      const data = await response.json();
      const authToken = data.auth_token;

      if (!authToken) {
        throw new Error("Failed to receive Auth Token from Government Portal.");
      }

      // Save the auth token securely for the backend to use for 2 years sync
      if (company_id) {
         await supabaseClient.from('client_portal_credentials').upsert({
            company_id: company_id,
            portal_type: 'GSTN_AUTH_TOKEN',
            username: gstin,
            encrypted_password: authToken, // Storing token in password field
            last_verified_at: new Date().toISOString()
         }, { onConflict: 'company_id, portal_type' });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "OTP Verified successfully. SANNIDH now has secure token access to 2 years of filings.",
        auth_token: authToken
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action parameter.");

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
