// React Query hooks for Admin Dashboard
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminAPI, AdminUser, CompanyRegistryRecord, UserRoleAssignment, SystemAuditLog, SystemSetting, SystemHealthMetric } from "@/lib/api/personas/admin-api";
import { useToast } from "@/hooks/use-toast";

const adminAPI = new AdminAPI(supabase);

// Admin Users Hooks
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminAPI.getAdminUsers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddAdminUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (user: Omit<AdminUser, "id" | "created_at" | "updated_at">) =>
      adminAPI.addAdminUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Success", description: "Admin user created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AdminUser> }) =>
      adminAPI.updateAdminUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Success", description: "Admin user updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminAPI.deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Success", description: "Admin user deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Company Registry Hooks
export function useCompanyRegistry() {
  return useQuery({
    queryKey: ["company-registry"],
    queryFn: () => adminAPI.getCompanyRegistry(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (company: Omit<CompanyRegistryRecord, "id" | "created_at" | "updated_at">) =>
      adminAPI.addCompany(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-registry"] });
      toast({ title: "Success", description: "Company registered successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CompanyRegistryRecord> }) =>
      adminAPI.updateCompany(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-registry"] });
      toast({ title: "Success", description: "Company updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// User Roles Hooks
export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => adminAPI.getUserRoles(userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UserRoleAssignment> }) =>
      adminAPI.updateUserRole(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (assignment: Omit<UserRoleAssignment, "id" | "assigned_at">) =>
      adminAPI.assignUserRole(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Success", description: "Role assigned successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminAPI.removeUserRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Success", description: "Role removed successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Audit Logs Hooks
export function useAuditLogs(filters?: {
  userId?: string;
  resourceType?: string;
  status?: "success" | "failure";
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => adminAPI.getAuditLogs(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (log: Omit<SystemAuditLog, "id" | "timestamp">) =>
      adminAPI.createAuditLog(log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

// System Settings Hooks
export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: () => adminAPI.getSystemSettings(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ["system-setting", key],
    queryFn: () => adminAPI.getSystemSetting(key),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SystemSetting> }) =>
      adminAPI.updateSystemSetting(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({ title: "Success", description: "System setting updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// System Health Hooks
export function useSystemHealth() {
  return useQuery({
    queryKey: ["system-health"],
    queryFn: () => adminAPI.getSystemHealth(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useHealthMetric(metricName: string) {
  return useQuery({
    queryKey: ["health-metric", metricName],
    queryFn: () => adminAPI.getHealthMetric(metricName),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useRecordHealthMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metric: Omit<SystemHealthMetric, "id">) =>
      adminAPI.recordHealthMetric(metric),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-health"] });
    },
  });
}
