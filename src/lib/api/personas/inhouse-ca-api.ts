// In-house CA API Client
import { SupabaseClient } from "@supabase/supabase-js";

export interface Employee {
  id: string;
  employee_name: string;
  designation: string;
  salary_amount: number;
  date_of_joining: string;
  status: "active" | "inactive";
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  payroll_month: string;
  basic_salary: number;
  allowances: number;
  tax_amount: number;
  net_salary: number;
  status: "draft" | "processed";
}

export interface GSTFiling {
  id: string;
  filing_period: string;
  gstr1_amount: number;
  gstr3b_amount: number;
  status: "pending" | "filed" | "overdue";
  due_date: string;
}

export class InhouseCAAPI {
  constructor(private supabase: SupabaseClient) {}

  // Employees
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await this.supabase
      .from("company_employees")
      .select("*")
      .order("employee_name");

    if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
    return data || [];
  }

  async addEmployee(employee: Omit<Employee, "id">): Promise<Employee> {
    const { data, error } = await this.supabase
      .from("company_employees")
      .insert([employee])
      .select()
      .single();

    if (error) throw new Error(`Failed to add employee: ${error.message}`);
    return data;
  }

  // Payroll
  async getPayrollRecords(employeeId?: string): Promise<PayrollRecord[]> {
    let query = this.supabase.from("company_payroll").select("*");

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query.order("payroll_month", { ascending: false });
    if (error) throw new Error(`Failed to fetch payroll: ${error.message}`);
    return data || [];
  }

  async createPayroll(record: Omit<PayrollRecord, "id">): Promise<PayrollRecord> {
    const { data, error } = await this.supabase
      .from("company_payroll")
      .insert([record])
      .select()
      .single();

    if (error) throw new Error(`Failed to create payroll: ${error.message}`);
    return data;
  }

  // GST Filings
  async getGSTFilings(): Promise<GSTFiling[]> {
    const { data, error } = await this.supabase
      .from("company_gst_filings")
      .select("*")
      .order("filing_period", { ascending: false });

    if (error) throw new Error(`Failed to fetch GST filings: ${error.message}`);
    return data || [];
  }

  async updateGSTFiling(id: string, updates: Partial<GSTFiling>): Promise<void> {
    const { error } = await this.supabase
      .from("company_gst_filings")
      .update(updates)
      .eq("id", id);

    if (error) throw new Error(`Failed to update GST filing: ${error.message}`);
  }

  // Invoices
  async getInvoices() {
    const { data, error } = await this.supabase
      .from("company_invoices")
      .select("*")
      .order("invoice_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
    return data || [];
  }

  async addInvoice(invoice: any): Promise<void> {
    const { error } = await this.supabase
      .from("company_invoices")
      .insert([invoice]);

    if (error) throw new Error(`Failed to add invoice: ${error.message}`);
  }

  // Expenses
  async getExpenses() {
    const { data, error } = await this.supabase
      .from("company_expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch expenses: ${error.message}`);
    return data || [];
  }

  async addExpense(expense: any): Promise<void> {
    const { error } = await this.supabase
      .from("company_expenses")
      .insert([expense]);

    if (error) throw new Error(`Failed to add expense: ${error.message}`);
  }

  // Tax Plans
  async getTaxPlans() {
    const { data, error } = await this.supabase
      .from("company_tax_plans")
      .select("*")
      .order("planning_period", { ascending: false });

    if (error) throw new Error(`Failed to fetch tax plans: ${error.message}`);
    return data || [];
  }

  async updateTaxPlan(id: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from("company_tax_plans")
      .update(updates)
      .eq("id", id);

    if (error) throw new Error(`Failed to update tax plan: ${error.message}`);
  }
}
