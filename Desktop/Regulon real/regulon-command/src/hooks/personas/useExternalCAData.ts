import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Types
export interface CAClient {
  id: string;
  ca_user_id: string;
  company_name: string;
  registration_number: string;
  industry: string;
  annual_turnover: number;
  employees_count: number;
  status: 'active' | 'inactive';
  assigned_date: string;
  last_audit_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DCAudit {
  id: string;
  client_id: string;
  audit_type: string;
  scheduled_date: string;
  completion_deadline: string;
  completed_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  audit_score: number | null;
  findings_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceItem {
  id: string;
  audit_id: string;
  requirement: string;
  category: string;
  status: 'pending' | 'completed' | 'overdue';
  notes: string | null;
  due_date: string;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditDocument {
  id: string;
  audit_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
}

export interface AuditReport {
  id: string;
  audit_id: string;
  report_title: string;
  report_data: Record<string, any>;
  executive_summary: string;
  findings: string;
  recommendations: string;
  generated_at: string;
  pdf_url: string | null;
  created_at: string;
}

// useCAClients - List clients with filters
export const useCAClients = (searchTerm: string = '', status: string = 'all') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ca-clients', user?.id, searchTerm, status],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      let query = supabase
        .from('ca_clients')
        .select('*')
        .eq('ca_user_id', user.id);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by search term client-side
      if (searchTerm) {
        return (data as CAClient[]).filter(
          client =>
            client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return data as CAClient[];
    },
    enabled: !!user,
  });
};

// useAddClient - Add new client
export const useAddClient = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Omit<CAClient, 'id' | 'ca_user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('ca_clients')
        .insert({
          ...clientData,
          ca_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CAClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ca-clients'] });
      toast({
        title: 'Success',
        description: 'Client added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add client',
        variant: 'destructive',
      });
    },
  });
};

// useCAudits - List audits for a client
export const useCAudits = (clientId: string | null = null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ca-audits', clientId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      let query = supabase
        .from('ca_audits')
        .select('*');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query.order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data as DCAudit[];
    },
    enabled: !!user,
  });
};

// useScheduleAudit - Schedule new audit
export const useScheduleAudit = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auditData: Omit<DCAudit, 'id' | 'created_at' | 'updated_at' | 'completed_date' | 'audit_score' | 'findings_count'>) => {
      const { data, error } = await supabase
        .from('ca_audits')
        .insert({
          ...auditData,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as DCAudit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ca-audits'] });
      toast({
        title: 'Success',
        description: 'Audit scheduled successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule audit',
        variant: 'destructive',
      });
    },
  });
};

// useComplianceItems - List compliance items for an audit
export const useComplianceItems = (auditId: string | null = null) => {
  return useQuery({
    queryKey: ['compliance-items', auditId],
    queryFn: async () => {
      if (!auditId) return [];

      const { data, error } = await supabase
        .from('ca_compliance_items')
        .select('*')
        .eq('audit_id', auditId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as ComplianceItem[];
    },
    enabled: !!auditId,
  });
};

// useUpdateComplianceStatus - Mark items complete
export const useUpdateComplianceStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      status,
      notes,
    }: {
      itemId: string;
      status: 'pending' | 'completed' | 'overdue';
      notes?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('ca_compliance_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as ComplianceItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-items'] });
      toast({
        title: 'Success',
        description: 'Compliance item updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update item',
        variant: 'destructive',
      });
    },
  });
};

// useAuditDocuments - List uploaded documents
export const useAuditDocuments = (auditId: string | null = null) => {
  return useQuery({
    queryKey: ['audit-documents', auditId],
    queryFn: async () => {
      if (!auditId) return [];

      const { data, error } = await supabase
        .from('ca_audit_documents')
        .select('*')
        .eq('audit_id', auditId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as AuditDocument[];
    },
    enabled: !!auditId,
  });
};

// useUploadDocument - Upload new document
export const useUploadDocument = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auditId,
      file,
    }: {
      auditId: string;
      file: File;
    }) => {
      if (!user) throw new Error('No user');

      // Generate file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${auditId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('audit-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audit-documents')
        .getPublicUrl(fileName);

      // Insert record
      const { data, error } = await supabase
        .from('ca_audit_documents')
        .insert({
          audit_id: auditId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AuditDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-documents'] });
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    },
  });
};

// useAuditReports - Get generated reports
export const useAuditReports = (auditId: string | null = null) => {
  return useQuery({
    queryKey: ['audit-reports', auditId],
    queryFn: async () => {
      if (!auditId) return [];

      const { data, error } = await supabase
        .from('ca_audit_reports')
        .select('*')
        .eq('audit_id', auditId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data as AuditReport[];
    },
    enabled: !!auditId,
  });
};

// useGenerateAuditReport - Generate new report
export const useGenerateAuditReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auditId,
      reportTitle,
      executiveSummary,
      findings,
      recommendations,
    }: {
      auditId: string;
      reportTitle: string;
      executiveSummary: string;
      findings: string;
      recommendations: string;
    }) => {
      // Generate mock PDF
      const mockPdfUrl = `data:application/pdf;base64,JVBERi0xLjQKCjEgMCBvYmo...`;

      const { data, error } = await supabase
        .from('ca_audit_reports')
        .insert({
          audit_id: auditId,
          report_title: reportTitle,
          executive_summary: executiveSummary,
          findings,
          recommendations,
          report_data: { generated: true },
          pdf_url: mockPdfUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AuditReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-reports'] });
      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    },
  });
};

// useBulkScheduleAudits - Schedule multiple audits
export const useBulkScheduleAudits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auditsData: Array<Omit<DCAudit, 'id' | 'created_at' | 'updated_at' | 'completed_date' | 'audit_score' | 'findings_count'>>) => {
      const auditsWithStatus = auditsData.map(audit => ({
        ...audit,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('ca_audits')
        .insert(auditsWithStatus)
        .select();

      if (error) throw error;
      return data as DCAudit[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ca-audits'] });
      toast({
        title: 'Success',
        description: `${data.length} audits scheduled successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule audits',
        variant: 'destructive',
      });
    },
  });
};
