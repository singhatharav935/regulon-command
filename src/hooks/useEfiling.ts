/**
 * useEfiling — React hooks for E-Filing Integration (Gap 2)
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchCredentials, createCredential, updateCredential, deleteCredential, verifyCredential,
  fetchFilingJobs, createFilingJob, updateFilingJob, deleteFilingJob,
  approveFilingJob, submitFilingJob, pollFilingStatus,
  fetchStatusLogs, fetchJobDocuments, uploadJobDocument, deleteJobDocument,
  fetchTemplates, createTemplate, fetchDashboardSummary,
  type EfilingCredential, type EfilingJob, type EfilingStatusLog,
  type EfilingDocument, type EfilingTemplate, type EfilingDashboardSummary,
  type EfilingPortal, type EfilingStatus, type EfilingType,
} from '@/services/efiling-service';

// ─── useEfilingCredentials ────────────────────────────────────────────────────

export function useEfilingCredentials(caUserId: string | null) {
  const [credentials, setCredentials] = useState<EfilingCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      setCredentials(await fetchCredentials(caUserId));
    } catch (err: any) {
      toast.error('Failed to load credentials', { description: err.message });
    } finally { setLoading(false); }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addCredential = useCallback(async (cred: Partial<EfilingCredential>) => {
    try {
      const c = await createCredential({ ...cred, ca_user_id: caUserId! } as any);
      setCredentials(prev => [c, ...prev]);
      toast.success(`Portal credentials added for ${c.portal}`);
      return c;
    } catch (err: any) {
      toast.error('Failed to add credentials', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editCredential = useCallback(async (id: string, updates: Partial<EfilingCredential>) => {
    try {
      const c = await updateCredential(id, updates);
      setCredentials(prev => prev.map(x => x.id === id ? c : x));
      toast.success('Credentials updated');
      return c;
    } catch (err: any) {
      toast.error('Failed to update', { description: err.message });
      throw err;
    }
  }, []);

  const removeCredential = useCallback(async (id: string) => {
    try {
      await deleteCredential(id);
      setCredentials(prev => prev.filter(x => x.id !== id));
      toast.success('Credentials deleted');
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.message });
      throw err;
    }
  }, []);

  const verify = useCallback(async (id: string) => {
    setVerifying(id);
    try {
      const result = await verifyCredential(id);
      await load();
      if (result.success) {
        toast.success('Portal credentials verified successfully');
      } else {
        toast.error('Verification failed', { description: result.error });
      }
    } finally { setVerifying(null); }
  }, [load]);

  return { credentials, loading, verifying, refetch: load, addCredential, editCredential, removeCredential, verify };
}

// ─── useFilingJobs ────────────────────────────────────────────────────────────

export function useFilingJobs(
  caUserId: string | null,
  filters?: { status?: EfilingStatus; portal?: EfilingPortal; entityId?: string }
) {
  const [jobs, setJobs] = useState<EfilingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [polling, setPolling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      setJobs(await fetchFilingJobs(caUserId, filters));
    } catch (err: any) {
      toast.error('Failed to load filings', { description: err.message });
    } finally { setLoading(false); }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const createJob = useCallback(async (job: Partial<EfilingJob>) => {
    try {
      const created = await createFilingJob({ ...job, ca_user_id: caUserId! } as any);
      setJobs(prev => [created, ...prev]);
      toast.success(`Filing "${created.filing_title}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create filing', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editJob = useCallback(async (id: string, updates: Partial<EfilingJob>) => {
    try {
      const updated = await updateFilingJob(id, updates);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      return updated;
    } catch (err: any) {
      toast.error('Failed to update filing', { description: err.message });
      throw err;
    }
  }, []);

  const removeJob = useCallback(async (id: string) => {
    try {
      await deleteFilingJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success('Filing deleted');
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.message });
      throw err;
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    if (!caUserId) return;
    try {
      const updated = await approveFilingJob(id, caUserId);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      toast.success('Filing approved — ready to submit');
      return updated;
    } catch (err: any) {
      toast.error('Failed to approve', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const submit = useCallback(async (id: string) => {
    setSubmitting(id);
    try {
      const result = await submitFilingJob(id);
      await load();
      if (result.success) {
        toast.success('Filing submitted successfully', {
          description: result.ack_number ? `ARN: ${result.ack_number}` : undefined,
        });
      } else {
        toast.warning('Filed — awaiting government portal response', {
          description: 'Status will update automatically when portal responds.',
        });
      }
      return result;
    } catch (err: any) {
      toast.error('Submission failed', { description: err.message });
      throw err;
    } finally { setSubmitting(null); }
  }, [load]);

  const poll = useCallback(async (id: string) => {
    setPolling(id);
    try {
      const updated = await pollFilingStatus(id);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      toast.info('Filing status refreshed');
      return updated;
    } catch (err: any) {
      toast.error('Failed to poll status', { description: err.message });
    } finally { setPolling(null); }
  }, []);

  return {
    jobs, loading, submitting, polling,
    refetch: load, createJob, editJob, removeJob, approve, submit, poll,
  };
}

// ─── useFilingJobDetail ───────────────────────────────────────────────────────

export function useFilingJobDetail(jobId: string | null) {
  const [logs, setLogs] = useState<EfilingStatusLog[]>([]);
  const [documents, setDocuments] = useState<EfilingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const [l, d] = await Promise.all([fetchStatusLogs(jobId), fetchJobDocuments(jobId)]);
      setLogs(l);
      setDocuments(d);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const uploadDoc = useCallback(async (caUserId: string, file: File, docType: string) => {
    if (!jobId) return;
    setUploading(true);
    try {
      const doc = await uploadJobDocument(jobId, caUserId, file, docType);
      setDocuments(prev => [doc, ...prev]);
      toast.success(`"${file.name}" uploaded`);
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message });
    } finally { setUploading(false); }
  }, [jobId]);

  const deleteDoc = useCallback(async (docId: string, filePath?: string) => {
    try {
      await deleteJobDocument(docId, filePath);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success('Document removed');
    } catch (err: any) {
      toast.error('Failed to delete document', { description: err.message });
    }
  }, []);

  return { logs, documents, loading, uploading, refetch: load, uploadDoc, deleteDoc };
}

// ─── useEfilingTemplates ──────────────────────────────────────────────────────

export function useEfilingTemplates(caUserId: string | null) {
  const [templates, setTemplates] = useState<EfilingTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try { setTemplates(await fetchTemplates(caUserId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addTemplate = useCallback(async (t: Partial<EfilingTemplate>) => {
    try {
      const created = await createTemplate({ ...t, ca_user_id: caUserId! });
      setTemplates(prev => [created, ...prev]);
      toast.success('Template saved');
      return created;
    } catch (err: any) {
      toast.error('Failed to save template', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  return { templates, loading, refetch: load, addTemplate };
}

// ─── useEfilingDashboard ──────────────────────────────────────────────────────

export function useEfilingDashboard(caUserId: string | null) {
  const [summary, setSummary] = useState<EfilingDashboardSummary>({
    total_filings: 0, draft_count: 0, ready_count: 0, submitted_count: 0,
    acknowledged_count: 0, approved_count: 0, rejected_count: 0,
    overdue_count: 0, due_this_week: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try { setSummary(await fetchDashboardSummary(caUserId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, refetch: load };
}
