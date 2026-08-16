import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for lawyer data
export interface Contract {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  contract_type: string;
  vendor_name: string;
  contract_value: number | null;
  currency: string | null;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  status: 'active' | 'expired' | 'pending' | 'archived';
  key_terms: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  company_id: string;
  case_title: string;
  case_number: string;
  case_type: string;
  court_name: string;
  plaintiff: string | null;
  defendant: string | null;
  hearing_date: string | null;
  next_hearing: string | null;
  status: 'ongoing' | 'completed' | 'settled' | 'dismissed';
  assigned_lawyer: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalNotice {
  id: string;
  company_id: string;
  notice_date: string;
  notice_type: string;
  issued_by: string;
  subject: string;
  content: string;
  response_due_date: string | null;
  response_submitted: boolean | null;
  response_content: string | null;
  status: 'pending' | 'responded' | 'resolved' | 'escalated';
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  document_name: string;
  document_type: string;
  file_url: string | null;
  uploaded_by: string | null;
  document_date: string | null;
  status: 'draft' | 'submitted' | 'approved';
  created_at: string;
}

export interface LegalRisk {
  id: string;
  company_id: string;
  risk_title: string;
  risk_description: string | null;
  risk_category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  exposure: number | null;
  mitigation_plan: string | null;
  mitigation_owner: string | null;
  status: 'identified' | 'mitigating' | 'monitored' | 'resolved';
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

// Contracts Hooks
export const useContracts = (companyId: string | null, filters?: { status?: string; type?: string }) => {
  return useQuery({
    queryKey: ['contracts', companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('company_contracts')
        .select('*')
        .eq('company_id', companyId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('contract_type', filters.type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Contract[]) || [];
    },
    enabled: !!companyId,
  });
};

export const useAddContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_contracts')
        .insert([contract])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.company_id] });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('company_contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contractDetail', data.id] });
    },
  });
};

// Cases Hooks
export const useCases = (companyId: string | null, filters?: { status?: string; type?: string }) => {
  return useQuery({
    queryKey: ['cases', companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('company_cases')
        .select('*')
        .eq('company_id', companyId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('case_type', filters.type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Case[]) || [];
    },
    enabled: !!companyId,
  });
};

export const useAddCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: Omit<Case, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_cases')
        .insert([caseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases', variables.company_id] });
    },
  });
};

export const useCaseDetail = (caseId: string | null) => {
  return useQuery({
    queryKey: ['caseDetail', caseId],
    queryFn: async () => {
      if (!caseId) return null;

      const { data, error } = await supabase
        .from('company_cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (error) throw error;
      return data as Case;
    },
    enabled: !!caseId,
  });
};

export const useUpdateCaseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Case['status'] }) => {
      const { data, error } = await supabase
        .from('company_cases')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['caseDetail', data.id] });
    },
  });
};

// Legal Notices Hooks
export const useLegalNotices = (companyId: string | null, filters?: { status?: string; type?: string }) => {
  return useQuery({
    queryKey: ['legalNotices', companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('company_legal_notices')
        .select('*')
        .eq('company_id', companyId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('notice_type', filters.type);
      }

      const { data, error } = await query.order('notice_date', { ascending: false });
      if (error) throw error;
      return (data as LegalNotice[]) || [];
    },
    enabled: !!companyId,
  });
};

export const useAddNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notice: Omit<LegalNotice, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_legal_notices')
        .insert([notice])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['legalNotices', variables.company_id] });
    },
  });
};

export const useUpdateNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LegalNotice> & { id: string }) => {
      const { data, error } = await supabase
        .from('company_legal_notices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalNotices'] });
    },
  });
};

// Case Documents Hooks
export const useCaseDocuments = (caseId: string | null) => {
  return useQuery({
    queryKey: ['caseDocuments', caseId],
    queryFn: async () => {
      if (!caseId) return [];

      const { data, error } = await supabase
        .from('company_case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as CaseDocument[]) || [];
    },
    enabled: !!caseId,
  });
};

export const useAddCaseDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: Omit<CaseDocument, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('company_case_documents')
        .insert([doc])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caseDocuments', variables.case_id] });
    },
  });
};

// Legal Risks Hooks
export const useLegalRisks = (companyId: string | null, filters?: { status?: string; category?: string }) => {
  return useQuery({
    queryKey: ['legalRisks', companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('company_legal_risks')
        .select('*')
        .eq('company_id', companyId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('risk_category', filters.category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data as LegalRisk[]) || [];
    },
    enabled: !!companyId,
  });
};

export const useAddRisk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (risk: Omit<LegalRisk, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_legal_risks')
        .insert([risk])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['legalRisks', variables.company_id] });
    },
  });
};

export const useUpdateRisk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LegalRisk> & { id: string }) => {
      const { data, error } = await supabase
        .from('company_legal_risks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalRisks'] });
    },
  });
};
