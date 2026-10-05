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

    const { ca_user_id } = await req.json();

    if (!ca_user_id) {
      throw new Error("Missing ca_user_id");
    }

    // 1. Fetch all real active clients for this CA
    const { data: clients, error: clientsErr } = await supabaseClient
      .from('companies')
      .select('id, name')
      .eq('ca_user_id', ca_user_id);

    if (clientsErr) throw clientsErr;
    if (!clients || clients.length === 0) {
       return new Response(JSON.stringify({ deadlines: [], escalations: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Calculate real dynamic deadlines based on statutory law rules
    // GST: 20th of next month
    // TDS: 7th of next month
    // EPF: 15th of next month
    
    // We will generate the deadlines for the current active month
    let generatedDeadlines: any[] = [];
    let deadlineIdCounter = 1;

    // To make it fully real, we cross-reference client_statutory_inputs
    // to see if they even need these filings.
    const { data: inputs } = await supabaseClient
      .from('client_statutory_inputs')
      .select('company_id, total_employees, applicable_gst_rate')
      .in('company_id', clients.map(c => c.id));

    clients.forEach((client) => {
       const clientInput = inputs?.find(i => i.company_id === client.id);
       
       // GST Rule: If GST rate is provided or implicitly registered
       if (!clientInput || clientInput.applicable_gst_rate > 0) {
          const gstr3bDue = new Date(currentYear, currentMonth + 1, 20);
          generatedDeadlines.push({
             id: `ddl-${deadlineIdCounter++}`,
             title: `GSTR-3B (${client.name})`,
             type: 'GST Return',
             regulator: 'CBIC',
             due_date: gstr3bDue,
             client_id: client.id,
             client_name: client.name
          });

          const gstr1Due = new Date(currentYear, currentMonth + 1, 11);
          generatedDeadlines.push({
             id: `ddl-${deadlineIdCounter++}`,
             title: `GSTR-1 (${client.name})`,
             type: 'GST Return',
             regulator: 'CBIC',
             due_date: gstr1Due,
             client_id: client.id,
             client_name: client.name
          });
       }

       // Payroll Rule: Only if employees > 0
       if (clientInput && clientInput.total_employees > 0) {
          const epfDue = new Date(currentYear, currentMonth + 1, 15);
          generatedDeadlines.push({
             id: `ddl-${deadlineIdCounter++}`,
             title: `EPF/ESI Payment (${client.name})`,
             type: 'Labour Law',
             regulator: 'EPFO',
             due_date: epfDue,
             client_id: client.id,
             client_name: client.name
          });

          const tdsDue = new Date(currentYear, currentMonth + 1, 7);
          generatedDeadlines.push({
             id: `ddl-${deadlineIdCounter++}`,
             title: `TDS Deposit 24Q (${client.name})`,
             type: 'Income Tax',
             regulator: 'CBDT',
             due_date: tdsDue,
             client_id: client.id,
             client_name: client.name
          });
       }
    });

    // Compute Days Remaining and Sort
    generatedDeadlines = generatedDeadlines.map(d => {
       const diffMs = d.due_date.getTime() - now.getTime();
       const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
       let status = 'upcoming';
       if (daysRemaining < 0) status = 'overdue';
       else if (daysRemaining <= 7) status = 'urgent';

       return {
          ...d,
          deadline: d.due_date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          daysRemaining,
          status
       };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Generate real escalations based on overdue dynamic deadlines
    const overdue = generatedDeadlines.filter(d => d.status === 'overdue');
    const escalations = overdue.slice(0, 5).map((d, i) => ({
       id: `esc-${i}`,
       title: `${d.client_name} — Overdue ${d.type}`,
       summary: `${d.title} was due on ${d.deadline}. Penalty accumulating.`,
       type: 'warning'
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      deadlines: generatedDeadlines,
      escalations: escalations
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
