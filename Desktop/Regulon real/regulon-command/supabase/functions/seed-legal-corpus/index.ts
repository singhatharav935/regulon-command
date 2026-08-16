import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Foundational Indian Legal Corpus (Seed Data)
const legalCorpus = [
  {
    act_name: "CGST Act 2017",
    section_reference: "Section 16(2)",
    category: "GST",
    content: "Conditions for taking input tax credit (ITC): No registered person shall be entitled to the credit of any input tax in respect of any supply of goods or services or both to him unless he is in possession of a tax invoice or debit note issued by a supplier, he has received the goods or services, the tax charged has been actually paid to the Government, and he has furnished the return under section 39."
  },
  {
    act_name: "CGST Act 2017",
    section_reference: "Section 73",
    category: "GST",
    content: "Determination of tax not paid or short paid or erroneously refunded or input tax credit wrongly availed or utilised for any reason other than fraud or any wilful-misstatement or suppression of facts."
  },
  {
    act_name: "CGST Act 2017",
    section_reference: "Section 74",
    category: "GST",
    content: "Determination of tax not paid or short paid or erroneously refunded or input tax credit wrongly availed or utilised by reason of fraud or any wilful-misstatement or suppression of facts to evade tax."
  },
  {
    act_name: "Income Tax Act 1961",
    section_reference: "Section 143(1)",
    category: "Direct Tax",
    content: "Intimation processing of return of income: Where a return has been made under section 139, or in response to a notice under sub-section (1) of section 142, such return shall be processed to compute total income/loss after making adjustments for arithmetical errors, incorrect claims, disallowance of loss claimed, and disallowance of expenditure indicated in the audit report."
  },
  {
    act_name: "Income Tax Act 1961",
    section_reference: "Section 143(2)",
    category: "Direct Tax",
    content: "Scrutiny Assessment Notice: Where a return has been furnished under section 139, the Assessing Officer or the prescribed income-tax authority, if he considers it necessary or expedient to ensure that the assessee has not understated the income or has not computed excessive loss or has not under-paid the tax in any manner, shall serve on the assessee a notice requiring him to attend his office or to produce any evidence on which the assessee may rely in support of the return."
  },
  {
    act_name: "Companies Act 2013",
    section_reference: "Section 134",
    category: "Corporate Law",
    content: "Financial statement, Board's report, etc. The financial statement, including consolidated financial statement, if any, shall be approved by the Board of Directors before they are signed on behalf of the Board by the chairperson of the company where he is authorised by the Board or by two directors out of which one shall be managing director, if any, and the Chief Executive Officer."
  },
  {
    act_name: "Companies Act 2013",
    section_reference: "Section 92",
    category: "Corporate Law",
    content: "Annual Return: Every company shall prepare a return (hereinafter referred to as the annual return) in the prescribed form containing the particulars as they stood on the close of the financial year regarding its registered office, principal business activities, particulars of its holding, subsidiary and associate companies, and its shares, debentures and other securities and shareholding pattern."
  },
  {
    act_name: "FEMA 1999",
    section_reference: "Section 3",
    category: "Foreign Exchange",
    content: "Dealing in foreign exchange, etc.: Save as otherwise provided in this Act, rules or regulations made thereunder, or with the general or special permission of the Reserve Bank, no person shall deal in or transfer any foreign exchange or foreign security to any person not being an authorised person."
  },
  {
    act_name: "EPF and MP Act 1952",
    section_reference: "Section 7A",
    category: "Labour Law",
    content: "Determination of moneys due from employers: The Central Provident Fund Commissioner, any Additional Central Provident Fund Commissioner, any Deputy Provident Fund Commissioner, any Regional Provident Fund Commissioner, or any Assistant Provident Fund Commissioner may, by order, determine the amount due from any employer under any provision of this Act, the Scheme or the Pension Scheme or the Insurance Scheme, as the case may be."
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""; // Must use service role to bypass RLS for inserts
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) throw new Error("OPENAI_API_KEY is missing");

    const supabase = createClient(supabaseUrl, supabaseKey);
    let insertedCount = 0;

    console.log("Starting to seed Legal Corpus...");

    for (const law of legalCorpus) {
      // 1. Generate Embedding via OpenAI
      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "text-embedding-3-small", // 1536 dimensions
          input: `${law.act_name} - ${law.section_reference}: ${law.content}`
        })
      });

      if (!embedRes.ok) {
        console.error("OpenAI Embedding Failed:", await embedRes.text());
        continue;
      }

      const embedData = await embedRes.json();
      const vector = embedData.data[0].embedding;

      // 2. Insert into Supabase
      const { error } = await supabase.from('legal_corpus_vectors').insert({
        act_name: law.act_name,
        section_reference: law.section_reference,
        category: law.category,
        content: law.content,
        embedding: vector
      });

      if (error) {
        console.error(`Error inserting ${law.section_reference}:`, error);
      } else {
        insertedCount++;
        console.log(`Inserted: ${law.act_name} - ${law.section_reference}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully seeded ${insertedCount} Indian Laws into the Vector Database.` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Seed Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
