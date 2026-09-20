// In-house Lawyer API Client
import { SupabaseClient } from "@supabase/supabase-js";

export interface Contract {
  id: string;
  contract_number: string;
  contract_type: string;
  other_party_name: string;
  contract_amount: number;
  expiry_date: string;
  status: "active" | "expired" | "terminated";
}

export interface LegalCase {
  id: string;
  case_number: string;
  case_type: string;
  opposing_party: string;
  case_status: "ongoing" | "resolved" | "dismissed";
  filing_date: string;
  next_hearing_date?: string;
}

export interface LegalNotice {
  id: string;
  notice_date: string;
  from_party: string;
  subject: string;
  response_due_date: string;
  response_status: "pending" | "responded";
}

export interface LegalRisk {
  id: string;
  risk_type: string;
  severity_level: "low" | "medium" | "high";
  mitigation_strategy: string;
  status: "open" | "mitigated" | "resolved";
}

export class LawyerAPI {
  constructor(private supabase: SupabaseClient) {}

  // Contracts
  async getContracts(): Promise<Contract[]> {
    const { data, error } = await this.supabase
      .from("company_contracts")
      .select("*")
      .order("expiry_date");

    if (error) throw new Error(`Failed to fetch contracts: ${error.message}`);
    return data || [];
  }

  async addContract(contract: Omit<Contract, "id">): Promise<Contract> {
    const { data, error } = await this.supabase
      .from("company_contracts")
      .insert([contract])
      .select()
      .single();

    if (error) throw new Error(`Failed to add contract: ${error.message}`);
    return data;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<void> {
    const { error } = await this.supabase
      .from("company_contracts")
      .update(updates)
      .eq("id", id);

    if (error) throw new Error(`Failed to update contract: ${error.message}`);
  }

  // Cases
  async getCases(): Promise<LegalCase[]> {
    const { data, error } = await this.supabase
      .from("company_cases")
      .select("*")
      .order("filing_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch cases: ${error.message}`);
    return data || [];
  }

  async addCase(legalCase: Omit<LegalCase, "id">): Promise<LegalCase> {
    const { data, error } = await this.supabase
      .from("company_cases")
      .insert([legalCase])
      .select()
      .single();

    if (error) throw new Error(`Failed to add case: ${error.message}`);
    return data;
  }

  async updateCaseStatus(id: string, status: LegalCase["case_status"]): Promise<void> {
    const { error } = await this.supabase
      .from("company_cases")
      .update({ case_status: status })
      .eq("id", id);

    if (error) throw new Error(`Failed to update case: ${error.message}`);
  }

  // Legal Notices
  async getNotices(): Promise<LegalNotice[]> {
    const { data, error } = await this.supabase
      .from("company_legal_notices")
      .select("*")
      .order("notice_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch notices: ${error.message}`);
    return data || [];
  }

  async addNotice(notice: Omit<LegalNotice, "id">): Promise<LegalNotice> {
    const { data, error } = await this.supabase
      .from("company_legal_notices")
      .insert([notice])
      .select()
      .single();

    if (error) throw new Error(`Failed to add notice: ${error.message}`);
    return data;
  }

  async updateNoticeStatus(id: string, status: "pending" | "responded"): Promise<void> {
    const { error } = await this.supabase
      .from("company_legal_notices")
      .update({ response_status: status })
      .eq("id", id);

    if (error) throw new Error(`Failed to update notice: ${error.message}`);
  }

  // Legal Risks
  async getRisks(): Promise<LegalRisk[]> {
    const { data, error } = await this.supabase
      .from("company_legal_risks")
      .select("*")
      .order("severity_level");

    if (error) throw new Error(`Failed to fetch risks: ${error.message}`);
    return data || [];
  }

  async addRisk(risk: Omit<LegalRisk, "id">): Promise<LegalRisk> {
    const { data, error } = await this.supabase
      .from("company_legal_risks")
      .insert([risk])
      .select()
      .single();

    if (error) throw new Error(`Failed to add risk: ${error.message}`);
    return data;
  }

  async updateRiskStatus(id: string, status: LegalRisk["status"]): Promise<void> {
    const { error } = await this.supabase
      .from("company_legal_risks")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(`Failed to update risk: ${error.message}`);
  }
}
