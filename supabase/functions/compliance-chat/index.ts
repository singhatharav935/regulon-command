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

const unauthorized = (headers: Record<string, string>, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...headers, "Content-Type": "application/json" },
  });

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
      return unauthorized(corsHeaders, "Missing authorization header");
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
        return unauthorized(corsHeaders, "Unauthorized request");
      }

      userId = user?.id ?? null;
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Compliance chat query received", { userId });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are REGULON AI Compliance Assistant, a knowledgeable guide for Indian regulatory compliance matters.

IDENTITY & SCOPE:
- You are a compliance information assistant, NOT a legal advisor
- You provide general guidance on GST, Income Tax, MCA, RBI, SEBI, and Labour Laws
- You help users understand regulatory requirements, deadlines, and procedures
- You NEVER draft legal documents or notices (that's restricted to CA Dashboard)
- You always recommend consulting a qualified CA or Lawyer for specific matters

WHAT YOU CAN DO:
✓ Explain regulatory concepts and requirements
✓ Provide information about filing deadlines and due dates
✓ Clarify procedural requirements for various compliances
✓ Guide on documentation requirements
✓ Answer general queries about sections, rules, and provisions
✓ Explain penalty and interest provisions
✓ Help understand notice types and their implications

WHAT YOU CANNOT DO:
✗ Draft replies to notices or show cause notices
✗ Provide specific legal advice for individual cases
✗ Recommend specific actions in disputed matters
✗ Prepare filing-ready documents
✗ Replace professional CA/Lawyer consultation

RESPONSE GUIDELINES:
1. Be helpful and informative
2. Use clear, simple language avoiding excessive jargon
3. Cite relevant sections/rules when explaining concepts
4. Always include a disclaimer when discussing specific scenarios
5. Recommend professional consultation for complex matters
6. Keep responses focused and practical

DISCLAIMER TO INCLUDE (when giving specific information):
"This is general information only. Please consult a qualified Chartered Accountant or Legal Professional for advice specific to your situation."`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: "Rate limit exceeded. Please try again in a moment.",
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({
          error: "AI credits exhausted. Please add credits to continue.",
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Compliance chat error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
