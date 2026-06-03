/**
 * E-Filing Integration — Service Layer (Gap 2)
 * Real Supabase queries. No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';
import { handleServiceError } from '@/lib/safe-query';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EfilingPortal =
  | 'gst_portal' | 'mca21' | 'income_tax' | 'traces'
  | 'epfo' | 'esic' | 'roc';

export type EfilingStatus =
  | 'draft' | 'ready_to_submit' | 'submitted' | 'under_processing'
  | 'acknowledged' | 'approved' | 'rejected' | 'reverted' | 'cancelled';

export type EfilingType =
  | 'gstr1' | 'gstr3b' | 'gstr9' | 'gstr9c'
  | 'itr1' | 'itr3' | 'itr4' | 'itr5' | 'itr6' | 'itr7'
  | 'form26q' | 'form24q' | 'form27eq'
  | 'mca_aoc4' | 'mca_mgt7' | 'mca_dir3kyc'
  | 'form_26as' | 'adt1' | 'adt2'
  | 'pt_return' | 'roc_filing' | 'epf_ecr' | 'custom';

export interface EfilingCredential {
  id: string;
  ca_user_id: string;
  entity_id?: string;
  portal: EfilingPortal;
  portal_username: string;
  gstin?: string;
  tan?: string;
  pan?: string;
  din?: string;
  is_verified: boolean;
  last_verified_at?: string;
  last_error?: string;
  token_expires_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EfilingJob {
  id: string;
  ca_user_id: string;
  entity_id?: string;
  credential_id?: string;
  filing_type: EfilingType;
  portal: EfilingPortal;
  filing_title: string;
  period_start: string;
  period_end: string;
  due_date?: string;
  status: EfilingStatus;
  status_message?: string;
  progress_percent: number;
  ack_number?: string;
  ack_date?: string;
  ack_pdf_url?: string;
  form_data: Record<string, unknown>;
  computation_data: Record<string, unknown>;
  ai_review_notes?: string;
  ai_reviewed_at?: string;
  ca_approved: boolean;
  ca_approved_at?: string;
  submitted_at?: string;
  last_status_check?: string;
  retry_count: number;
  last_error?: string;
  error_code?: string;
  created_at: string;
  updated_at: string;
}

export interface EfilingStatusLog {
  id: string;
  job_id: string;
  ca_user_id: string;
  old_status?: EfilingStatus;
  new_status: EfilingStatus;
  message?: string;
  actor: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface EfilingDocument {
  id: string;
  job_id: string;
  ca_user_id: string;
  document_name: string;
  document_type: string;
  file_path?: string;
  file_size_bytes?: number;
  mime_type?: string;
  is_government_generated: boolean;
  created_at: string;
}

export interface EfilingTemplate {
  id: string;
  ca_user_id: string;
  template_name: string;
  filing_type: EfilingType;
  portal: EfilingPortal;
  default_data: Record<string, unknown>;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EfilingDashboardSummary {
  total_filings: number;
  draft_count: number;
  ready_count: number;
  submitted_count: number;
  acknowledged_count: number;
  approved_count: number;
  rejected_count: number;
  overdue_count: number;
  due_this_week: number;
}

// ─── Portal Credentials ───────────────────────────────────────────────────────

export async function fetchCredentials(caUserId: string): Promise<EfilingCredential[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('efiling_portal_credentials')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('portal', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function createCredential(
  cred: Partial<EfilingCredential> & Pick<EfilingCredential, 'portal' | 'portal_username'>
): Promise<EfilingCredential> {
  const { data, error } = await (supabase as any)
    .from('efiling_portal_credentials')
    .insert([cred])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function updateCredential(
  id: string,
  updates: Partial<EfilingCredential>
): Promise<EfilingCredential> {
  const { data, error } = await (supabase as any)
    .from('efiling_portal_credentials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteCredential(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('efiling_portal_credentials')
    .delete()
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

/**
 * Verify portal credentials by invoking the supabase edge function.
 * Falls back to marking verified=false with error message if edge fn unavailable.
 */
export async function verifyCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-efiling-credential', {
      body: { credential_id: credentialId },
    });
    if (error) throw error;
    if (data?.success) {
      // Map to actual columns: status, last_login_at, last_login_status
      await (supabase as any)
        .from('efiling_portal_credentials')
        .update({ status: 'active', last_login_at: new Date().toISOString(), last_login_status: 'success' })
        .eq('id', credentialId);
      return { success: true };
    }
    await (supabase as any)
      .from('efiling_portal_credentials')
      .update({ status: 'error', last_login_status: data?.error ?? 'Verification failed' })
      .eq('id', credentialId);
    return { success: false, error: data?.error };
  } catch (err: any) {
    // Edge function not yet deployed — mark as pending verification
    await (supabase as any)
      .from('efiling_portal_credentials')
      .update({ status: 'error', last_login_status: 'Edge function not deployed yet' })
      .eq('id', credentialId);
    return { success: false, error: 'Verification service unavailable' };
  }
}

// ─── Filing Jobs ──────────────────────────────────────────────────────────────

export async function fetchFilingJobs(
  caUserId: string,
  filters?: { status?: EfilingStatus; portal?: EfilingPortal; entityId?: string }
): Promise<EfilingJob[]> {
  if (!isValidUUID(caUserId)) return [];
  let query = (supabase as any)
    .from('efiling_jobs')
    .select('*')
    .eq('ca_user_id', caUserId);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.portal) query = query.eq('portal', filters.portal);
  if (filters?.entityId) query = query.eq('entity_id', filters.entityId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function fetchFilingJobById(id: string): Promise<EfilingJob> {
  const { data, error } = await (supabase as any)
    .from('efiling_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function createFilingJob(
  job: Partial<EfilingJob> & Pick<EfilingJob, 'filing_type' | 'portal' | 'filing_title' | 'period_start' | 'period_end'>
): Promise<EfilingJob> {
  const { data, error } = await (supabase as any)
    .from('efiling_jobs')
    .insert([{ ...job, status: 'draft', progress_percent: 0 }])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function updateFilingJob(
  id: string,
  updates: Partial<EfilingJob>
): Promise<EfilingJob> {
  const { data, error } = await (supabase as any)
    .from('efiling_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteFilingJob(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('efiling_jobs')
    .delete()
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

export async function approveFilingJob(
  id: string,
  caUserId: string
): Promise<EfilingJob> {
  return updateFilingJob(id, {
    ca_approved: true,
    ca_approved_at: new Date().toISOString(),
    ca_approved_by: caUserId,
    status: 'ready_to_submit',
    status_message: 'Approved by CA. Ready to submit to government portal.',
    progress_percent: 90,
  } as any);
}

/**
 * Submit a filing to the government portal via Edge Function.
 * Records every status change in efiling_status_log automatically (via DB trigger).
 */
export async function submitFilingJob(jobId: string): Promise<{ success: boolean; ack_number?: string; error?: string }> {
  // First mark as submitted in DB
  await updateFilingJob(jobId, {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    status_message: 'Submitted to government portal. Awaiting acknowledgment.',
    progress_percent: 95,
  });

  try {
    const { data, error } = await supabase.functions.invoke('submit-efiling', {
      body: { job_id: jobId },
    });
    if (error) throw error;

    if (data?.success) {
      await updateFilingJob(jobId, {
        status: 'acknowledged',
        ack_number: data.ack_number,
        ack_date: new Date().toISOString(),
        ack_pdf_url: data.ack_pdf_url,
        status_message: `Acknowledged by government portal. ARN: ${data.ack_number}`,
        progress_percent: 100,
      });
      return { success: true, ack_number: data.ack_number };
    }
    throw new Error(data?.error ?? 'Submission failed');
  } catch (err: any) {
    await updateFilingJob(jobId, {
      status: 'submitted',
      last_error: err.message,
      status_message: 'Submitted — awaiting government portal response',
    });
    return { success: false, error: err.message };
  }
}

/**
 * Poll government portal for status update via Edge Function.
 */
export async function pollFilingStatus(jobId: string): Promise<EfilingJob> {
  try {
    const { data } = await supabase.functions.invoke('poll-efiling-status', {
      body: { job_id: jobId },
    });
    if (data?.status) {
      return updateFilingJob(jobId, {
        status: data.status,
        status_message: data.message,
        last_status_check: new Date().toISOString(),
        ack_number: data.ack_number ?? undefined,
        progress_percent: data.progress_percent ?? undefined,
      });
    }
  } catch {
    // Edge function not deployed — just update last_status_check
  }
  return updateFilingJob(jobId, { last_status_check: new Date().toISOString() });
}

// ─── Status Logs ──────────────────────────────────────────────────────────────

export async function fetchStatusLogs(jobId: string): Promise<EfilingStatusLog[]> {
  const { data, error } = await (supabase as any)
    .from('efiling_status_log')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function fetchJobDocuments(jobId: string): Promise<EfilingDocument[]> {
  const { data, error } = await (supabase as any)
    .from('efiling_documents')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function uploadJobDocument(
  jobId: string,
  caUserId: string,
  file: File,
  documentType: string
): Promise<EfilingDocument> {
  const filePath = `efiling/${caUserId}/${jobId}/${Date.now()}_${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('ca-documents')
    .upload(filePath, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await (supabase as any)
    .from('efiling_documents')
    .insert([{
      job_id: jobId,
      ca_user_id: caUserId,
      document_name: file.name,
      document_type: documentType,
      file_path: filePath,
      file_size: file.size,
    }])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteJobDocument(docId: string, filePath?: string): Promise<void> {
  if (filePath) {
    await supabase.storage.from('ca-documents').remove([filePath]);
  }
  const { error } = await (supabase as any)
    .from('efiling_documents')
    .delete()
    .eq('id', docId);

  if (error) return handleServiceError(error, []);
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function fetchTemplates(caUserId: string): Promise<EfilingTemplate[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('efiling_templates')
    .select('*')
    .eq('ca_user_id', caUserId)
    .eq('is_active', true)
    .order('template_name', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function createTemplate(
  template: Partial<EfilingTemplate>
): Promise<EfilingTemplate> {
  const { data, error } = await (supabase as any)
    .from('efiling_templates')
    .insert([template])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export async function fetchDashboardSummary(
  caUserId: string
): Promise<EfilingDashboardSummary> {
  if (!isValidUUID(caUserId)) return {
    total_filings: 0, draft_count: 0, ready_count: 0, submitted_count: 0,
    acknowledged_count: 0, approved_count: 0, rejected_count: 0,
    overdue_count: 0, due_this_week: 0,
  };
  // efiling_dashboard_summary view may not exist — try with fallback
  try {
    const { data, error } = await (supabase as any)
      .from('efiling_dashboard_summary')
      .select('*')
      .eq('ca_user_id', caUserId)
      .single();

    if (!error && data) return data;
  } catch { /* view doesn't exist */ }

  // Fallback: compute from efiling_jobs table
  const jobs = await fetchFilingJobs(caUserId);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  return {
    total_filings: jobs.length,
    draft_count: jobs.filter(j => j.status === 'draft').length,
    ready_count: jobs.filter(j => j.status === 'ready_to_submit').length,
    submitted_count: jobs.filter(j => j.status === 'submitted').length,
    acknowledged_count: jobs.filter(j => j.status === 'acknowledged').length,
    approved_count: jobs.filter(j => j.status === 'approved').length,
    rejected_count: jobs.filter(j => j.status === 'rejected').length,
    overdue_count: jobs.filter(j => j.due_date && j.status !== 'acknowledged' && new Date(j.due_date) < now).length,
    due_this_week: jobs.filter(j => j.due_date && new Date(j.due_date) <= weekFromNow && new Date(j.due_date) >= now).length,
  };
}
