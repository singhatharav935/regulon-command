// CA Firm API Client
import { SupabaseClient } from "@supabase/supabase-js";

export interface FirmMember {
  id: string;
  member_name: string;
  role: string;
  specialization: string;
  status: "active" | "inactive";
}

export interface FirmClient {
  id: string;
  company_name: string;
  registration_number: string;
  primary_ca_id?: string;
  status: "active" | "inactive";
}

export interface CAAssignment {
  id: string;
  ca_member_id: string;
  firm_client_id: string;
  service_type: string;
  status: "active" | "completed";
  hours_allocated: number;
  hours_utilized: number;
}

export interface FirmAnalytics {
  id: string;
  analytics_month: string;
  total_revenue: number;
  client_count: number;
  active_cases: number;
}

export class CAFirmAPI {
  constructor(private supabase: SupabaseClient) {}

  async getFirmMembers() {
    const { data, error } = await this.supabase
      .from("ca_firm_members")
      .select("*")
      .order("member_name");

    if (error) throw new Error(`Failed to fetch firm members: ${error.message}`);
    return data || [];
  }

  async addFirmMember(member: Omit<FirmMember, 'id'>) {
    const { data, error } = await this.supabase
      .from("ca_firm_members")
      .insert([member])
      .select()
      .single();

    if (error) throw new Error(`Failed to add firm member: ${error.message}`);
    return data;
  }

  async getFirmClients() {
    const { data, error } = await this.supabase
      .from("ca_firm_clients")
      .select("*")
      .order("company_name");

    if (error) throw new Error(`Failed to fetch firm clients: ${error.message}`);
    return data || [];
  }

  async addFirmClient(client: Omit<FirmClient, 'id'>) {
    const { data, error } = await this.supabase
      .from("ca_firm_clients")
      .insert([client])
      .select()
      .single();

    if (error) throw new Error(`Failed to add firm client: ${error.message}`);
    return data;
  }

  async getCAAssignments() {
    const { data, error } = await this.supabase
      .from("ca_assignments")
      .select("*")
      .order("assignment_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch assignments: ${error.message}`);
    return data || [];
  }

  async createAssignment(assignment: Omit<CAAssignment, 'id'>) {
    const { data, error } = await this.supabase
      .from("ca_assignments")
      .insert([assignment])
      .select()
      .single();

    if (error) throw new Error(`Failed to create assignment: ${error.message}`);
    return data;
  }

  async getFirmInvoices() {
    const { data, error } = await this.supabase
      .from("ca_firm_invoices")
      .select("*")
      .order("invoice_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch firm invoices: ${error.message}`);
    return data || [];
  }

  async getFirmAnalytics(limit = 12) {
    const { data, error } = await this.supabase
      .from("ca_firm_analytics")
      .select("*")
      .order("analytics_month", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch analytics: ${error.message}`);
    return data || [];
  }
}
