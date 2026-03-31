// Admin API Client
import { SupabaseClient } from "@supabase/supabase-js";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "moderator";
  status: "active" | "suspended" | "inactive";
  permissions: string[];
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyRegistryRecord {
  id: string;
  company_name: string;
  registration_number: string;
  cin?: string;
  tan?: string;
  status: "active" | "inactive" | "suspended";
  industry: string;
  employees_count: number;
  contact_email: string;
  contact_phone: string;
  address: string;
  registered_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: "super_admin" | "admin" | "moderator" | "user";
  assigned_by: string;
  assigned_at: string;
  expires_at?: string;
}

export interface SystemAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, any>;
  ip_address: string;
  status: "success" | "failure";
  error_message?: string;
  timestamp: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  description: string;
  is_public: boolean;
  updated_by: string;
  updated_at: string;
}

export interface SystemHealthMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  threshold_warning: number;
  threshold_critical: number;
  status: "healthy" | "warning" | "critical";
  unit: string;
  measured_at: string;
}

export class AdminAPI {
  constructor(private supabase: SupabaseClient) {}

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    const { data, error } = await this.supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch admin users: ${error.message}`);
    return data || [];
  }

  async getAdminUser(id: string): Promise<AdminUser> {
    const { data, error } = await this.supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(`Failed to fetch admin user: ${error.message}`);
    return data;
  }

  async addAdminUser(user: Omit<AdminUser, "id" | "created_at" | "updated_at">): Promise<AdminUser> {
    const { data, error } = await this.supabase
      .from("admin_users")
      .insert([user])
      .select()
      .single();

    if (error) throw new Error(`Failed to create admin user: ${error.message}`);
    return data;
  }

  async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const { data, error } = await this.supabase
      .from("admin_users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update admin user: ${error.message}`);
    return data;
  }

  async deleteAdminUser(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete admin user: ${error.message}`);
  }

  // Company Registry
  async getCompanyRegistry(): Promise<CompanyRegistryRecord[]> {
    const { data, error } = await this.supabase
      .from("company_registry")
      .select("*")
      .order("registered_date", { ascending: false });

    if (error) throw new Error(`Failed to fetch company registry: ${error.message}`);
    return data || [];
  }

  async getCompanyById(id: string): Promise<CompanyRegistryRecord> {
    const { data, error } = await this.supabase
      .from("company_registry")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(`Failed to fetch company: ${error.message}`);
    return data;
  }

  async addCompany(company: Omit<CompanyRegistryRecord, "id" | "created_at" | "updated_at">): Promise<CompanyRegistryRecord> {
    const { data, error } = await this.supabase
      .from("company_registry")
      .insert([company])
      .select()
      .single();

    if (error) throw new Error(`Failed to register company: ${error.message}`);
    return data;
  }

  async updateCompany(id: string, updates: Partial<CompanyRegistryRecord>): Promise<CompanyRegistryRecord> {
    const { data, error } = await this.supabase
      .from("company_registry")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update company: ${error.message}`);
    return data;
  }

  // User Role Assignments
  async getUserRoles(userId?: string): Promise<UserRoleAssignment[]> {
    let query = this.supabase.from("user_role_assignments").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.order("assigned_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch user roles: ${error.message}`);
    return data || [];
  }

  async assignUserRole(assignment: Omit<UserRoleAssignment, "id" | "assigned_at">): Promise<UserRoleAssignment> {
    const { data, error } = await this.supabase
      .from("user_role_assignments")
      .insert([{ ...assignment, assigned_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw new Error(`Failed to assign user role: ${error.message}`);
    return data;
  }

  async updateUserRole(id: string, updates: Partial<UserRoleAssignment>): Promise<UserRoleAssignment> {
    const { data, error } = await this.supabase
      .from("user_role_assignments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user role: ${error.message}`);
    return data;
  }

  async removeUserRole(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("user_role_assignments")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to remove user role: ${error.message}`);
  }

  // Audit Logs
  async getAuditLogs(filters?: {
    userId?: string;
    resourceType?: string;
    status?: "success" | "failure";
    startDate?: string;
    endDate?: string;
  }): Promise<SystemAuditLog[]> {
    let query = this.supabase.from("system_audit_logs").select("*");

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.resourceType) {
      query = query.eq("resource_type", filters.resourceType);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDate) {
      query = query.gte("timestamp", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("timestamp", filters.endDate);
    }

    const { data, error } = await query.order("timestamp", { ascending: false });

    if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
    return data || [];
  }

  async createAuditLog(log: Omit<SystemAuditLog, "id" | "timestamp">): Promise<SystemAuditLog> {
    const { data, error } = await this.supabase
      .from("system_audit_logs")
      .insert([{ ...log, timestamp: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create audit log: ${error.message}`);
    return data;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    const { data, error } = await this.supabase
      .from("system_settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) throw new Error(`Failed to fetch system settings: ${error.message}`);
    return data || [];
  }

  async getSystemSetting(key: string): Promise<SystemSetting> {
    const { data, error } = await this.supabase
      .from("system_settings")
      .select("*")
      .eq("key", key)
      .single();

    if (error) throw new Error(`Failed to fetch system setting: ${error.message}`);
    return data;
  }

  async updateSystemSetting(id: string, updates: Partial<SystemSetting>): Promise<SystemSetting> {
    const { data, error } = await this.supabase
      .from("system_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update system setting: ${error.message}`);
    return data;
  }

  // System Health Metrics
  async getSystemHealth(): Promise<SystemHealthMetric[]> {
    const { data, error } = await this.supabase
      .from("system_health_metrics")
      .select("*")
      .order("measured_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch system health: ${error.message}`);
    return data || [];
  }

  async getHealthMetric(metricName: string): Promise<SystemHealthMetric> {
    const { data, error } = await this.supabase
      .from("system_health_metrics")
      .select("*")
      .eq("metric_name", metricName)
      .order("measured_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(`Failed to fetch health metric: ${error.message}`);
    return data;
  }

  async recordHealthMetric(metric: Omit<SystemHealthMetric, "id">): Promise<SystemHealthMetric> {
    const { data, error } = await this.supabase
      .from("system_health_metrics")
      .insert([metric])
      .select()
      .single();

    if (error) throw new Error(`Failed to record health metric: ${error.message}`);
    return data;
  }
}
