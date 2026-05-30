import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API Key is missing");

    const { base64Image, mimeType } = await req.json();
    if (!base64Image) throw new Error("Base64 Image is required for OCR");

    console.log(`[Vision OCR] Processing document (${mimeType})...`);

    // Use GPT-4o's natively strong vision capabilities for OCR
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an elite enterprise OCR engine specialized in reading complex, blurry, or scanned Indian government notices (GST, Income Tax, MCA). Extract ALL text, numbers, and tabular data perfectly. Do not summarize or add commentary. Return ONLY the raw extracted text."
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      throw new Error(`OpenAI Vision Error: ${await res.text()}`);
    }

    const data = await res.json();
    const extractedText = data.choices[0].message.content;

    console.log(`[Vision OCR] Extraction complete. Length: ${extractedText.length} characters.`);

    return new Response(JSON.stringify({ 
      success: true, 
      text: extractedText 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Vision OCR Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
