import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FirmMember {
  id: string;
  firm_id: string;
  name: string;
  email: string;
  role: string;
  specialization: string;
  status: string;
  created_at: string;
}

export interface FirmClient {
  id: string;
  firm_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  status: string;
  created_at: string;
}

export interface CAAssignment {
  id: string;
  ca_id: string;
  client_id: string;
  assigned_date: string;
  status: string;
  created_at: string;
}

export interface FirmInvoice {
  id: string;
  firm_id: string;
  client_id: string;
  amount: number;
  date: string;
  status: string;
  created_at: string;
}

export interface FirmAnalytics {
  total_clients: number;
  total_revenue: number;
  active_cases: number;
  team_utilization: number;
}

// Firm Members
export const useFirmMembers = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-members", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("firm_members")
        .select("*")
        .eq("firm_id", firmId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });
};

export const useAddFirmMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: Omit<FirmMember, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("firm_members")
        .insert([member])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-members", variables.firm_id] });
    },
  });
};

// Firm Clients
export const useFirmClients = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-clients", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("firm_clients")
        .select("*")
        .eq("firm_id", firmId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });
};

export const useAddFirmClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<FirmClient, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("firm_clients")
        .insert([client])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-clients", variables.firm_id] });
    },
  });
};

// CA Assignments
export const useCAAssignments = (firmId: string | null) => {
  return useQuery({
    queryKey: ["ca-assignments", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("ca_assignments")
        .select("*")
        .eq("firm_id", firmId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });
};

export const useAssignCA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: Omit<CAAssignment, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("ca_assignments")
        .insert([assignment])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
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
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ca-assignments"] });
    },
  });
};

// Firm Invoices
export const useFirmInvoices = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-invoices", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("firm_invoices")
        .select("*")
        .eq("firm_id", firmId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Omit<FirmInvoice, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("firm_invoices")
        .insert([invoice])
        .select();
      if (error) throw error;
      return data[0];
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
      const { error } = await supabase
        .from("firm_invoices")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["firm-invoices", variables.firmId] });
    },
  });
};

// Analytics
export const useFirmAnalytics = (firmId: string | null) => {
  return useQuery({
    queryKey: ["firm-analytics", firmId],
    queryFn: async () => {
      if (!firmId) return null;
      const { data, error } = await supabase.rpc("get_firm_analytics", {
        firm_id: firmId,
      });
      if (error) {
        return {
          total_clients: 0,
          total_revenue: 0,
          active_cases: 0,
          team_utilization: 0,
        };
      }
      return data;
    },
    enabled: !!firmId,
  });
};

export const useTeamUtilization = (firmId: string | null) => {
  return useQuery({
    queryKey: ["team-utilization", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase.rpc("get_team_utilization", {
        firm_id: firmId,
      });
      if (error) {
        return [];
      }
      return data || [];
    },
    enabled: !!firmId,
  });
};
