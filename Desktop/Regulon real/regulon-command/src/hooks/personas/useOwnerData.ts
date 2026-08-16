// Owner React Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOwnerData() {
  const queryClient = useQueryClient();

  const useCompanyKPIs = (companyId: string, enabled = true) => {
    return useQuery({
      queryKey: ['company-kpis', companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('company_kpis')
          .select('*')
          .eq('company_id', companyId);
        if (error) throw new Error(error.message);
        return data;
      },
      enabled: enabled && !!companyId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useComplianceScore = (companyId: string, enabled = true) => {
    return useQuery({
      queryKey: ['compliance-score', companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('company_compliance_scores')
          .select('*')
          .eq('company_id', companyId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
      enabled: enabled && !!companyId,
      staleTime: 10 * 60 * 1000,
    });
  };

  const useRiskAssessment = (companyId: string, enabled = true) => {
    return useQuery({
      queryKey: ['risk-assessment', companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('company_risk_assessments')
          .select('*')
          .eq('company_id', companyId);
        if (error) throw new Error(error.message);
        return data;
      },
      enabled: enabled && !!companyId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useDeadlineAlerts = (companyId: string, enabled = true) => {
    return useQuery({
      queryKey: ['deadline-alerts', companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('company_deadline_alerts')
          .select('*')
          .eq('company_id', companyId)
          .eq('alert_status', 'pending')
          .order('due_date', { ascending: true });
        if (error) throw new Error(error.message);
        return data;
      },
      enabled: enabled && !!companyId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useNotifications = (companyId: string, enabled = true) => {
    return useQuery({
      queryKey: ['notifications', companyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('company_notifications')
          .select('*')
          .eq('company_id', companyId)
          .is('read_at', null)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
      },
      enabled: enabled && !!companyId,
      staleTime: 1 * 60 * 1000,
      refetchInterval: 1 * 60 * 1000,
    });
  };

  return {
    useCompanyKPIs,
    useComplianceScore,
    useRiskAssessment,
    useDeadlineAlerts,
    useNotifications,
  };
}
