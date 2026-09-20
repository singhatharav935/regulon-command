import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types matching the real DB schema ───────────────────────────────────────

export interface FirmMember {
  id: string;
  firm_id: string;
  user_id?: string;
  name: string;        // mapped from member_name
  email: string;
  role: string;
  specialization: string;
  phone?: string;
  license_number?: string;
  status: string;
  created_at: string;
}

export interface FirmClient {
  id: string;
  firm_id: string;
  company_name: string;
  contact_person?: string;  // stored in registration_number field (repurposed)
  email?: string;           // stored in industry field (we add extra contact cols)
  industry?: string;
  status: string;
  created_at: string;
}

export interface CAAssignment {
  id: string;
  ca_id: string;        // maps to ca_member_id
  client_id: string;    // maps to firm_client_id
  assigned_date?: string;
  status: string;
  created_at: string;
}

export interface FirmInvoice {
  id: string;
  firm_id: string;
  client_id: string;    // maps to firm_client_id
  amount: number;       // maps to total_amount
  date: string;         // maps to invoice_date
  status: string;       // maps to payment_status
  invoice_number?: string;
  due_date?: string;
  created_at: string;
}

export interface FirmAnalytics {
  total_clients: number;
  total_revenue: number;
  active_cases: number;
  team_utilization: number;
}

// ─── Firm Members ─────────────────────────────────────────────────────────────

export const useFirmMembers = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-members", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("ca_firm_members")
        .select("*")
        .eq("firm_id", firmId)
        .order("created_at", { ascending: true });
      if (error) {
        console.warn("[FirmMembers] Query error:", error.message);
        return [];
      }
      // Normalize member_name → name
      return (data || []).map((m: any) => ({
        ...m,
        name: m.member_name || m.name || "Unknown",
      })) as FirmMember[];
    },
    enabled: !!firmId,
  });
};

export const useAddFirmMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: {
      firm_id: string;
      name: string;
      email: string;
      role: string;
      specialization?: string;
      status?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("ca_firm_members")
        .insert([{
          firm_id: member.firm_id,
          user_id: user?.id || member.firm_id,
          member_name: member.name,
          email: member.email,
          role: member.role,
          specialization: member.specialization || "",
          status: member.status || "active",
          joining_date: new Date().toISOString().split("T")[0],
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ...data, name: data.member_name } as FirmMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-members", variables.firm_id] });
    },
  });
};

// ─── Firm Clients ─────────────────────────────────────────────────────────────

export const useFirmClients = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-clients", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("ca_firm_clients")
        .select("*")
        .eq("firm_id", firmId)
        .order("created_at", { ascending: true });
      if (error) {
        console.warn("[FirmClients] Query error:", error.message);
        return [];
      }
      // Remap fields
      return (data || []).map((c: any) => ({
        id: c.id,
        firm_id: c.firm_id,
        company_name: c.company_name,
        contact_person: c.contact_person || "",
        email: c.contact_email || "",
        industry: c.industry || "",
        status: c.status || "active",
        created_at: c.created_at,
      })) as FirmClient[];
    },
    enabled: !!firmId,
  });
};

export const useAddFirmClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: {
      firm_id: string;
      company_name: string;
      contact_person?: string;
      email?: string;
      industry?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("ca_firm_clients")
        .insert([{
          firm_id: client.firm_id,
          company_name: client.company_name,
          // contact_person / contact_email added by migration 20260509
          // Fallback: store in registration_number until migration runs
          registration_number: client.email || "",   // contact email stored here temporarily
          industry: client.industry || "General",
          status: client.status || "active",
          last_service_date: new Date().toISOString().split("T")[0],
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FirmClient;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-clients", variables.firm_id] });
    },
  });
};

// ─── CA Assignments ───────────────────────────────────────────────────────────

export const useCAAssignments = (firmId: string | null) => {
  return useQuery({
    queryKey: ["ca-assignments", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      // Join through ca_firm_members to filter by firm
      const { data: members } = await supabase
        .from("ca_firm_members")
        .select("id")
        .eq("firm_id", firmId);
      const memberIds = (members || []).map((m: any) => m.id);
      if (!memberIds.length) return [];
      const { data, error } = await supabase
        .from("ca_assignments")
        .select("*")
        .in("ca_member_id", memberIds);
      if (error) {
        console.warn("[CAAssignments] Query error:", error.message);
        return [];
      }
      return (data || []).map((a: any) => ({
        id: a.id,
        ca_id: a.ca_member_id,
        client_id: a.firm_client_id,
        assigned_date: a.assignment_date,
        status: a.status,
        created_at: a.created_at,
      })) as CAAssignment[];
    },
    enabled: !!firmId,
  });
};

export const useAssignCA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: {
      ca_id: string;
      client_id: string;
      assigned_date?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from("ca_assignments")
        .insert([{
          ca_member_id: assignment.ca_id,
          firm_client_id: assignment.client_id,
          assignment_date: assignment.assigned_date || new Date().toISOString().split("T")[0],
          status: assignment.status || "active",
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ca-assignments"] });
    },
  });
};

export const useUnassignCA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("ca_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ca-assignments"] });
    },
  });
};

// ─── Firm Invoices ────────────────────────────────────────────────────────────

export const useFirmInvoices = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-invoices", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("ca_firm_invoices")
        .select("*")
        .eq("firm_id", firmId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[FirmInvoices] Query error:", error.message);
        return [];
      }
      return (data || []).map((inv: any) => ({
        id: inv.id,
        firm_id: inv.firm_id,
        client_id: inv.firm_client_id,
        amount: inv.total_amount || inv.invoice_amount || 0,
        date: inv.invoice_date,
        status: inv.payment_status || "pending",
        invoice_number: inv.invoice_number,
        due_date: inv.due_date,
        created_at: inv.created_at,
      })) as FirmInvoice[];
    },
    enabled: !!firmId,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: {
      firm_id: string;
      client_id: string;
      amount: number;
      date: string;
      status?: string;
    }) => {
      // Generate invoice number
      const invNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
      const { data, error } = await supabase
        .from("ca_firm_invoices")
        .insert([{
          firm_id: invoice.firm_id,
          firm_client_id: invoice.client_id,
          invoice_number: invNumber,
          invoice_amount: invoice.amount,
          tax_amount: Math.round(invoice.amount * 0.18),        // 18% GST
          total_amount: Math.round(invoice.amount * 1.18),       // incl. GST
          invoice_date: invoice.date,
          due_date: new Date(new Date(invoice.date).setDate(new Date(invoice.date).getDate() + 30)).toISOString().split("T")[0],
          payment_status: invoice.status || "draft",
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-invoices", variables.firm_id] });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, firmId }: { id: string; status: string; firmId: string }) => {
      const update: any = { payment_status: status };
      if (status === "paid") {
        update.payment_received_date = new Date().toISOString().split("T")[0];
      }
      const { error } = await supabase
        .from("ca_firm_invoices")
        .update(update)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-invoices", variables.firmId] });
    },
  });
};

// ─── Analytics (computed client-side for now) ─────────────────────────────────

export const useFirmAnalytics = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-analytics", firmId],
    queryFn: async (): Promise<FirmAnalytics> => {
      if (!firmId) return { total_clients: 0, total_revenue: 0, active_cases: 0, team_utilization: 0 };
      const [membersRes, clientsRes, invoicesRes] = await Promise.all([
        supabase.from("ca_firm_members").select("id, status").eq("firm_id", firmId),
        supabase.from("ca_firm_clients").select("id, status").eq("firm_id", firmId),
        supabase.from("ca_firm_invoices").select("total_amount, payment_status").eq("firm_id", firmId),
      ]);
      const clients = clientsRes.data || [];
      const invoices = invoicesRes.data || [];
      const members = membersRes.data || [];
      const totalRevenue = invoices
        .filter((i: any) => i.payment_status === "paid")
        .reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
      return {
        total_clients: clients.length,
        total_revenue: totalRevenue,
        active_cases: clients.filter((c: any) => c.status === "active").length,
        team_utilization: members.length > 0 ? Math.round((clients.length / members.length) * 10) : 0,
      };
    },
    enabled: !!firmId,
  });
};

export const useDeleteFirmClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, firmId }: { id: string; firmId: string }) => {
      // Remove related assignments first
      await supabase.from("ca_assignments").delete().eq("firm_client_id", id);
      const { error } = await supabase.from("ca_firm_clients").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return firmId;
    },
    onSuccess: (firmId) => {
      queryClient.invalidateQueries({ queryKey: ["firm-clients", firmId] });
      queryClient.invalidateQueries({ queryKey: ["ca-assignments"] });
    },
  });
};

export const useUpdateFirmClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: {
      id: string;
      firm_id: string;
      company_name?: string;
      contact_person?: string;
      email?: string;
      industry?: string;
      status?: string;
    }) => {
      const update: any = {};
      if (client.company_name) update.company_name = client.company_name;
      if (client.contact_person !== undefined) update.contact_person = client.contact_person;
      if (client.email !== undefined) update.contact_email = client.email;
      if (client.industry !== undefined) update.industry = client.industry;
      if (client.status) update.status = client.status;
      const { error } = await supabase
        .from("ca_firm_clients")
        .update(update)
        .eq("id", client.id);
      if (error) throw new Error(error.message);
      return client.firm_id;
    },
    onSuccess: (firmId) => {
      queryClient.invalidateQueries({ queryKey: ["firm-clients", firmId] });
    },
  });
};

export const useTeamUtilization = (firmId: string | null) => {
  return useQuery({
    queryKey: ["team-utilization", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      // Get members + their assignment counts
      const { data: members } = await supabase
        .from("ca_firm_members")
        .select("id, member_name, role, status, specialization, email")
        .eq("firm_id", firmId);
      if (!members?.length) return [];
      const memberIds = members.map((m: any) => m.id);
      const { data: assignments } = await supabase
        .from("ca_assignments")
        .select("ca_member_id, status")
        .in("ca_member_id", memberIds);
      return members.map((m: any) => {
        const count = (assignments || []).filter((a: any) => a.ca_member_id === m.id).length;
        return {
          id: m.id,
          name: m.member_name || m.name || "Unknown",
          role: m.role,
          status: m.status,
          specialization: m.specialization || "",
          email: m.email || "",
          assignedClients: count,
          utilization: Math.min(100, count * 12),
        };
      });
    },
    enabled: !!firmId,
  });
};
