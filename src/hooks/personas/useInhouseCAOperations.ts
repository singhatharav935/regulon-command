import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for CA Operations
export interface CompanyEmployee {
  id?: string;
  company_id?: string;
  employee_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  salary_amount?: number;
  date_of_joining?: string;
  aadhaar_number?: string;
  pan_number?: string;
  bank_account_number?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyPayroll {
  id?: string;
  employee_id: string;
  payroll_month: string;
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
  tax_amount?: number;
  net_salary?: number;
  status?: string;
  processed_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyGSTFiling {
  id?: string;
  company_id?: string;
  filing_period: string;
  gstr1_amount?: number;
  gstr2_amount?: number;
  gstr3b_amount?: number;
  tax_payable?: number;
  filing_status?: string;
  filing_date?: string;
  due_date?: string;
  late_fee?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyInvoice {
  id?: string;
  company_id?: string;
  invoice_number: string;
  invoice_date?: string;
  party_name?: string;
  party_gst?: string;
  invoice_amount?: number;
  tax_amount?: number;
  invoice_type?: string;
  payment_status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyExpense {
  id?: string;
  company_id?: string;
  expense_category: string;
  expense_amount: number;
  expense_date: string;
  vendor_name?: string;
  description?: string;
  receipt_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyTaxPlan {
  id?: string;
  company_id?: string;
  plan_name: string;
  tax_year: string;
  estimated_tax_liability?: number;
  recommended_provisions?: number;
  investment_recommendations?: string;
  created_at?: string;
  updated_at?: string;
}

const QUERY_KEYS = {
  employees: ['company-employees'],
  payroll: ['company-payroll'],
  gstFilings: ['company-gst-filings'],
  invoices: ['company-invoices'],
  expenses: ['company-expenses'],
  taxPlans: ['company-tax-plans'],
};

// ===== EMPLOYEE HOOKS =====
export function useCompanyEmployees(companyId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: [...QUERY_KEYS.employees, companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      const { data, error } = await supabase
        .from('company_employees')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompanyEmployee[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Omit<CompanyEmployee, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_employees')
        .insert([employee])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyEmployee;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Employee ${data.employee_name} added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add employee',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: CompanyEmployee) => {
      const { data, error } = await supabase
        .from('company_employees')
        .update(employee)
        .eq('id', employee.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyEmployee;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Employee ${data.employee_name} updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update employee',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('company_employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;
      return employeeId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete employee',
        variant: 'destructive',
      });
    },
  });
}

// ===== PAYROLL HOOKS =====
export function usePayrollRecords(companyId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.payroll, companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_payroll')
        .select('*')
        .order('payroll_month', { ascending: false });

      if (error) throw error;
      return data as CompanyPayroll[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePayroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payroll: Omit<CompanyPayroll, 'id' | 'created_at' | 'updated_at'>) => {
      const netSalary =
        (payroll.basic_salary || 0) +
        (payroll.allowances || 0) -
        (payroll.deductions || 0) -
        (payroll.tax_amount || 0);

      const { data, error } = await supabase
        .from('company_payroll')
        .insert([{ ...payroll, net_salary: netSalary }])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyPayroll;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Payroll entry created successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payroll',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePayroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payroll: CompanyPayroll) => {
      const netSalary =
        (payroll.basic_salary || 0) +
        (payroll.allowances || 0) -
        (payroll.deductions || 0) -
        (payroll.tax_amount || 0);

      const { data, error } = await supabase
        .from('company_payroll')
        .update({ ...payroll, net_salary: netSalary })
        .eq('id', payroll.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyPayroll;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Payroll updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payroll',
        variant: 'destructive',
      });
    },
  });
}

// ===== GST FILING HOOKS =====
export function useGSTFilings(companyId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.gstFilings, companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_gst_filings')
        .select('*')
        .eq('company_id', companyId)
        .order('filing_period', { ascending: false });

      if (error) throw error;
      return data as CompanyGSTFiling[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGSTFiling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filing: Omit<CompanyGSTFiling, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_gst_filings')
        .insert([filing])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyGSTFiling;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'GST filing created successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gstFilings });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create GST filing',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGSTFiling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filing: CompanyGSTFiling) => {
      const { data, error } = await supabase
        .from('company_gst_filings')
        .update(filing)
        .eq('id', filing.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyGSTFiling;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'GST filing updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gstFilings });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update GST filing',
        variant: 'destructive',
      });
    },
  });
}

// ===== INVOICE HOOKS =====
export function useInvoices(companyId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.invoices, companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return data as CompanyInvoice[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: Omit<CompanyInvoice, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_invoices')
        .insert([invoice])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyInvoice;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Invoice ${data.invoice_number} created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: CompanyInvoice) => {
      const { data, error } = await supabase
        .from('company_invoices')
        .update(invoice)
        .eq('id', invoice.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyInvoice;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Invoice ${data.invoice_number} updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('company_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      return invoiceId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });
}

// ===== EXPENSE HOOKS =====
export function useExpenses(companyId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.expenses, companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_expenses')
        .select('*')
        .eq('company_id', companyId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data as CompanyExpense[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddExpense() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<CompanyExpense, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_expenses')
        .insert([expense])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyExpense;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add expense',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpense() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: CompanyExpense) => {
      const { data, error } = await supabase
        .from('company_expenses')
        .update(expense)
        .eq('id', expense.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyExpense;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update expense',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExpense() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('company_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      return expenseId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete expense',
        variant: 'destructive',
      });
    },
  });
}

// ===== TAX PLAN HOOKS =====
export function useTaxPlans(companyId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.taxPlans, companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_tax_plans')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompanyTaxPlan[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTaxPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<CompanyTaxPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_tax_plans')
        .insert([plan])
        .select()
        .single();

      if (error) throw error;
      return data as CompanyTaxPlan;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tax plan created successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taxPlans });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tax plan',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTaxPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: CompanyTaxPlan) => {
      const { data, error } = await supabase
        .from('company_tax_plans')
        .update(plan)
        .eq('id', plan.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanyTaxPlan;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tax plan updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taxPlans });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update tax plan',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTaxPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('company_tax_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      return planId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tax plan deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taxPlans });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete tax plan',
        variant: 'destructive',
      });
    },
  });
}
