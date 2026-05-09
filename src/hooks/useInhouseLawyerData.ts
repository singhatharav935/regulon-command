import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LawyerReviewRequest {
  id: string;
  draft_run_id: string;
  company_id: string | null;
  sent_by: string;
  assigned_to: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  ca_notes: string | null;
  lawyer_comments: string | null;
  review_status: "pending" | "in_review" | "approved" | "changes_requested" | "rejected";
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  draft?: {
    id: string;
    document_type: string;
    draft_mode: string;
    draft_content: string;
    status: string;
    notice_input: string | null;
    qa: any;
    created_at: string;
  };
  sender_name?: string;
}

export interface LawyerContract {
  id: string;
  company_id: string | null;
  title: string;
  vendor_name: string;
  contract_type: string;
  contract_value: number | null;
  currency: string;
  start_date: string;
  end_date: string;
  status: "draft" | "negotiation" | "active" | "expired" | "archived";
  key_terms: string | null;
  risk_level: "low" | "medium" | "high" | null;
  created_by: string;
  created_at: string;
}

export interface LawyerCase {
  id: string;
  company_id: string | null;
  case_title: string;
  case_number: string;
  case_type: string;
  court_name: string | null;
  status: "ongoing" | "settled" | "completed" | "dismissed";
  next_hearing: string | null;
  assigned_lawyer: string | null;
  filing_date: string | null;
  created_at: string;
}

export interface LawyerNotice {
  id: string;
  company_id: string | null;
  subject: string;
  notice_type: string;
  issued_by: string;
  content: string | null;
  notice_date: string;
  response_due_date: string | null;
  status: "pending" | "responded" | "resolved" | "escalated";
  created_at: string;
}

export interface LawyerRisk {
  id: string;
  company_id: string | null;
  risk_title: string;
  risk_category: string;
  risk_description: string | null;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  status: "identified" | "mitigating" | "monitored" | "resolved";
  mitigation_plan: string | null;
  mitigation_owner: string | null;
  created_at: string;
}

// ─── Draft Review Requests ────────────────────────────────────────────────────

export const uselawyerReviewRequests = (companyId: string | null) => {
  return useQuery({
    queryKey: ["lawyer-review-requests", companyId],
    queryFn: async (): Promise<LawyerReviewRequest[]> => {
      // Review requests are always company-scoped (cross-user workflow)
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("lawyer_review_requests")
        .select(`
          *,
          draft:draft_run_id (
            id, document_type, draft_mode, draft_content, status,
            notice_input, qa, created_at
          )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[LawyerReview] Query error:", error.message);
        return [];
      }
      return (data || []) as LawyerReviewRequest[];
    },
    enabled: !!companyId,
    refetchInterval: 15000,
  });
};

export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      draftRunId,
      reviewStatus,
      lawyerComments,
      companyId,
    }: {
      requestId: string;
      draftRunId: string;
      reviewStatus: LawyerReviewRequest["review_status"];
      lawyerComments?: string;
      companyId: string;
    }) => {
      const now = new Date().toISOString();
      const { error: reqError } = await supabase
        .from("lawyer_review_requests")
        .update({ review_status: reviewStatus, lawyer_comments: lawyerComments, reviewed_at: now })
        .eq("id", requestId);
      if (reqError) throw new Error(reqError.message);

      const draftStatus =
        reviewStatus === "approved" ? "approved" :
        reviewStatus === "rejected" || reviewStatus === "changes_requested" ? "generated" :
        "under_review";
      await supabase.from("draft_runs").update({ status: draftStatus }).eq("id", draftRunId);
      return { requestId, reviewStatus };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyer-review-requests", variables.companyId] });
    },
  });
};

export const useSendDraftForReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      draftRunId, companyId, sentBy, priority = "normal", caNotes,
    }: {
      draftRunId: string; companyId: string; sentBy: string;
      priority?: LawyerReviewRequest["priority"]; caNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from("lawyer_review_requests")
        .insert([{ draft_run_id: draftRunId, company_id: companyId, sent_by: sentBy, priority, ca_notes: caNotes || null, review_status: "pending" }])
        .select().single();
      if (error) throw new Error(error.message);
      await supabase.from("draft_runs").update({ status: "under_review" }).eq("id", draftRunId);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyer-review-requests", variables.companyId] });
    },
  });
};

// ─── Contracts ────────────────────────────────────────────────────────────────
// companyId → company scope | userId fallback → personal scope

export const useLawyerContracts = (companyId: string | null, userId?: string) => {
  const enabled = !!(companyId || userId);
  return useQuery({
    queryKey: ["lawyer-contracts", companyId, userId],
    queryFn: async (): Promise<LawyerContract[]> => {
      let query = supabase.from("contracts").select("*").order("created_at", { ascending: false });
      if (companyId) {
        query = query.eq("company_id", companyId);
      } else if (userId) {
        query = query.eq("created_by", userId);
      } else {
        return [];
      }
      const { data, error } = await query;
      if (error) { console.warn("[Contracts]", error.message); return []; }
      return (data || []) as LawyerContract[];
    },
    enabled,
  });
};

export const useAddContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contract: Omit<LawyerContract, "id" | "created_at">) => {
      const { data, error } = await supabase.from("contracts").insert([contract]).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyer-contracts", variables.company_id, variables.created_by] });
    },
  });
};

// ─── Cases ────────────────────────────────────────────────────────────────────

export const useLawyerCases = (companyId: string | null, userId?: string) => {
  const enabled = !!(companyId || userId);
  return useQuery({
    queryKey: ["lawyer-cases", companyId, userId],
    queryFn: async (): Promise<LawyerCase[]> => {
      let query = supabase.from("legal_cases").select("*").order("created_at", { ascending: false });
      if (companyId) {
        query = query.eq("company_id", companyId);
      } else if (userId) {
        query = query.eq("created_by", userId);
      } else {
        return [];
      }
      const { data, error } = await query;
      if (error) { console.warn("[Cases]", error.message); return []; }
      return (data || []) as LawyerCase[];
    },
    enabled,
  });
};

export const useAddCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<LawyerCase, "id" | "created_at">) => {
      const { data, error } = await supabase.from("legal_cases").insert([c]).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["lawyer-cases", v.company_id] });
    },
  });
};

// ─── Notices ──────────────────────────────────────────────────────────────────

export const useLawyerNotices = (companyId: string | null, userId?: string) => {
  const enabled = !!(companyId || userId);
  return useQuery({
    queryKey: ["lawyer-notices", companyId, userId],
    queryFn: async (): Promise<LawyerNotice[]> => {
      let query = supabase.from("legal_notices").select("*").order("created_at", { ascending: false });
      if (companyId) {
        query = query.eq("company_id", companyId);
      } else if (userId) {
        query = query.eq("created_by", userId);
      } else {
        return [];
      }
      const { data, error } = await query;
      if (error) { console.warn("[Notices]", error.message); return []; }
      return (data || []) as LawyerNotice[];
    },
    enabled,
  });
};

// ─── Risks ────────────────────────────────────────────────────────────────────

export const useLawyerRisks = (companyId: string | null, userId?: string) => {
  const enabled = !!(companyId || userId);
  return useQuery({
    queryKey: ["lawyer-risks", companyId, userId],
    queryFn: async (): Promise<LawyerRisk[]> => {
      let query = supabase.from("legal_risks").select("*").order("created_at", { ascending: false });
      if (companyId) {
        query = query.eq("company_id", companyId);
      } else if (userId) {
        query = query.eq("created_by", userId);
      } else {
        return [];
      }
      const { data, error } = await query;
      if (error) { console.warn("[Risks]", error.message); return []; }
      return (data || []) as LawyerRisk[];
    },
    enabled,
  });
};
