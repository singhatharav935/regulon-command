import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyEmployee {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  salary: number;
  joined_date: string;
  status: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  company_id: string;
  employee_id: string;
  month: string;
  salary: number;
  allowances: number;
  deductions: number;
  net_amount: number;
  status: string;
  created_at: string;
}

export interface GSTFiling {
  id: string;
  company_id: string;
  quarter: string;
  filing_date: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  date: string;
  due_date: string;
  status: string;
  created_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  created_at: string;
}

export interface TaxPlan {
  id: string;
  company_id: string;
  name: string;
  year: number;
  estimated_tax: number;
  status: string;
  created_at: string;
}

// Employee Management Hooks
export const useCompanyEmployees = (companyId: string | null) => {
  return useQuery({
    queryKey: ["company-employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_employees")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<CompanyEmployee, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("company_employees")
        .insert([employee])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-employees", variables.company_id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from("company_employees")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-employees", variables.companyId] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, companyId }: { id: string; updates: Partial<CompanyEmployee>; companyId: string }) => {
      const { data, error } = await supabase
        .from("company_employees")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-employees", variables.companyId] });
    },
  });
};

// Payroll Hooks
export const usePayrollRecords = (companyId: string | null) => {
  return useQuery({
    queryKey: ["payroll-records", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("payroll_records")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useCreatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payroll: Omit<PayrollRecord, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("payroll_records")
        .insert([payroll])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records", variables.company_id] });
    },
  });
};

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, companyId }: { id: string; updates: Partial<PayrollRecord>; companyId: string }) => {
      const { data, error } = await supabase
        .from("payroll_records")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records", variables.companyId] });
    },
  });
};

// GST Filing Hooks
export const useGSTFilings = (companyId: string | null) => {
  return useQuery({
    queryKey: ["gst-filings", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("gst_filings")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useCreateGSTFiling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filing: Omit<GSTFiling, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("gst_filings")
        .insert([filing])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gst-filings", variables.company_id] });
    },
  });
};

export const useUpdateGSTFiling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, companyId }: { id: string; updates: Partial<GSTFiling>; companyId: string }) => {
      const { data, error } = await supabase
        .from("gst_filings")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gst-filings", variables.companyId] });
    },
  });
};

// Invoice Hooks
export const useInvoices = (companyId: string | null) => {
  return useQuery({
    queryKey: ["invoices", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useAddInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("invoices")
        .insert([invoice])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.company_id] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, companyId }: { id: string; updates: Partial<Invoice>; companyId: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.companyId] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.companyId] });
    },
  });
};

// Expense Hooks
export const useExpenses = (companyId: string | null) => {
  return useQuery({
    queryKey: ["expenses", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert([expense])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.company_id] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, companyId }: { id: string; updates: Partial<Expense>; companyId: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.companyId] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.companyId] });
    },
  });
};

// Tax Plan Hooks
export const useTaxPlans = (companyId: string | null) => {
  return useQuery({
    queryKey: ["tax-plans", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("tax_plans")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
};

export const useCreateTaxPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<TaxPlan, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("tax_plans")
        .insert([plan])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tax-plans", variables.company_id] });
    },
  });
};

export const useUpdateTaxPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, companyId }: { id: string; updates: Partial<TaxPlan>; companyId: string }) => {
      const { data, error } = await supabase
        .from("tax_plans")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tax-plans", variables.companyId] });
    },
  });
};

export const useDeleteTaxPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from("tax_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tax-plans", variables.companyId] });
    },
  });
};

// Additional hooks from original implementation
export const useInhouseCAProjects = (caId: string | null) => {
  return useQuery({
    queryKey: ["inhouse-ca-projects", caId],
    queryFn: async () => {
      if (!caId) return [];
      const { data, error } = await supabase
        .from("inhouse_ca_projects")
        .select("*")
        .eq("ca_id", caId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!caId,
  });
};

export const useInhouseCAMetrics = (caId: string | null) => {
  return useQuery({
    queryKey: ["inhouse-ca-metrics", caId],
    queryFn: async () => {
      if (!caId) return null;
      const { data, error } = await supabase
        .from("inhouse_ca_metrics")
        .select("*")
        .eq("ca_id", caId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error?.code === "PGRST116") return null;
      if (error) throw error;
      return data;
    },
    enabled: !!caId,
  });
};

export const useInhouseCAAlerts = (caId: string | null) => {
  return useQuery({
    queryKey: ["inhouse-ca-alerts", caId],
    queryFn: async () => {
      if (!caId) return [];
      const { data, error } = await supabase
        .from("inhouse_ca_alerts")
        .select("*")
        .eq("ca_id", caId)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!caId,
  });
};
