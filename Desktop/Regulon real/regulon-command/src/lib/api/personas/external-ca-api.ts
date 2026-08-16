// External CA API Client
import { SupabaseClient } from "@supabase/supabase-js";

export interface CAClient {
  id: string;
  company_name: string;
  registration_number: string;
  industry: string;
  employees_count: number;
  status: "active" | "inactive";
  last_audit_date?: string;
}

export interface CAAudit {
  id: string;
  client_id: string;
  audit_type: string;
  scheduled_date: string;
  completed_date?: string;
  status: "pending" | "in_progress" | "completed";
  audit_score?: number;
  findings_count: number;
}

export interface ComplianceItem {
  id: string;
  audit_id: string;
  requirement: string;
  status: "pending" | "completed";
  due_date: string;
}

export class ExternalCAAPI {
  constructor(private supabase: SupabaseClient) {}

  // Clients
  async getClients(): Promise<CAClient[]> {
    const { data, error } = await this.supabase
      .from("ca_clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
    return data || [];
  }

  async addClient(client: Omit<CAClient, "id">): Promise<CAClient> {
    const { data, error } = await this.supabase
      .from("ca_clients")
      .insert([client])
      .select()
      .single();

    if (error) throw new Error(`Failed to add client: ${error.message}`);
    return data;
  }

  async updateClient(id: string, updates: Partial<CAClient>): Promise<CAClient> {
    const { data, error } = await this.supabase
      .from("ca_clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update client: ${error.message}`);
    return data;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("ca_clients")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete client: ${error.message}`);
  }

  // Audits
  async getAudits(clientId?: string): Promise<CAAudit[]> {
    let query = this.supabase.from("ca_audits").select("*");

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query.order("scheduled_date", { ascending: false });
    if (error) throw new Error(`Failed to fetch audits: ${error.message}`);
    return data || [];
  }

  async scheduleAudit(audit: Omit<CAAudit, "id">): Promise<CAAudit> {
    const { data, error } = await this.supabase
      .from("ca_audits")
      .insert([audit])
      .select()
      .single();

    if (error) throw new Error(`Failed to schedule audit: ${error.message}`);
    return data;
  }

  async updateAuditStatus(
    id: string,
    status: "pending" | "in_progress" | "completed"
  ): Promise<void> {
    const { error } = await this.supabase
      .from("ca_audits")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(`Failed to update audit: ${error.message}`);
  }

  // Compliance Items
  async getComplianceItems(auditId: string): Promise<ComplianceItem[]> {
    const { data, error } = await this.supabase
      .from("ca_compliance_items")
      .select("*")
      .eq("audit_id", auditId);

    if (error) throw new Error(`Failed to fetch compliance items: ${error.message}`);
    return data || [];
  }

  async addComplianceItem(item: Omit<ComplianceItem, "id">): Promise<ComplianceItem> {
    const { data, error } = await this.supabase
      .from("ca_compliance_items")
      .insert([item])
      .select()
      .single();

    if (error) throw new Error(`Failed to add compliance item: ${error.message}`);
    return data;
  }

  async markComplianceComplete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("ca_compliance_items")
      .update({ status: "completed", completed_date: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`Failed to update compliance item: ${error.message}`);
  }

  // Documents
  async uploadDocument(
    auditId: string,
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number
  ): Promise<void> {
    const { error } = await this.supabase.from("ca_audit_documents").insert([
      {
        audit_id: auditId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
      },
    ]);

    if (error) throw new Error(`Failed to upload document: ${error.message}`);
  }

  async getAuditDocuments(auditId: string) {
    const { data, error } = await this.supabase
      .from("ca_audit_documents")
      .select("*")
      .eq("audit_id", auditId);

    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    return data || [];
  }

  // Reports
  async generateAuditReport(auditId: string, reportData: any): Promise<void> {
    const { error } = await this.supabase.from("ca_audit_reports").insert([
      {
        audit_id: auditId,
        report_data: reportData,
        generated_at: new Date().toISOString(),
      },
    ]);

    if (error) throw new Error(`Failed to generate report: ${error.message}`);
  }

  async getAuditReport(auditId: string) {
    const { data, error } = await this.supabase
      .from("ca_audit_reports")
      .select("*")
      .eq("audit_id", auditId)
      .single();

    if (error) throw new Error(`Failed to fetch report: ${error.message}`);
    return data;
  }
}
