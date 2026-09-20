/**
 * useAuditTrail — React hooks for Audit Trail & Compliance Reporting (Gap 12)
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchAuditEvents,
  logAuditEvent,
  fetchComplianceScores,
  upsertComplianceScore,
  deleteComplianceScore,
  fetchComplianceReports,
  generateComplianceReport,
  updateReportStatus,
  deleteReport,
  fetchRetentionPolicies,
  updateRetentionPolicy,
  fetchAuditAlerts,
  createAuditAlert,
  toggleAuditAlert,
  deleteAuditAlert,
  fetchAuditDashboard,
  type AuditTrailEvent,
  type ComplianceScore,
  type ComplianceReport,
  type DataRetentionPolicy,
  type AuditAlertSubscription,
  type AuditDashboard,
  type AuditModule,
  type AuditSeverity,
  type ReportType,
  type ReportFormat,
  type ReportStatus,
} from '@/services/audit-trail-service';

// ─── useAuditDashboard ────────────────────────────────────────────────────────

export function useAuditDashboard(caUserId: string | null) {
  const [dashboard, setDashboard] = useState<AuditDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setDashboard(await fetchAuditDashboard(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  return { dashboard, loading, error, refetch: load };
}

// ─── useAuditEvents ──────────────────────────────────────────────────────────

export function useAuditEvents(
  caUserId: string | null,
  filters: {
    module?: AuditModule;
    severity?: AuditSeverity;
    search?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  } = {}
) {
  const [events, setEvents] = useState<AuditTrailEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAuditEvents(caUserId, { ...filters, limit: filters.limit ?? 200 });
      setEvents(result.events);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId, filters.module, filters.severity, filters.search, filters.fromDate, filters.toDate]);

  useEffect(() => { load(); }, [load]);

  const appendEvent = useCallback(async (
    event: Omit<AuditTrailEvent, 'id' | 'event_id' | 'hash' | 'previous_hash' | 'created_at'>
  ) => {
    try {
      const created = await logAuditEvent(event);
      setEvents((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      return created;
    } catch (err: any) {
      toast.error('Failed to log audit event', { description: err.message });
      throw err;
    }
  }, []);

  return { events, total, loading, error, refetch: load, appendEvent };
}

// ─── useComplianceScores ──────────────────────────────────────────────────────

export function useComplianceScores(caUserId: string | null) {
  const [scores, setScores] = useState<ComplianceScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setScores(await fetchComplianceScores(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const saveScore = useCallback(async (score: Omit<ComplianceScore, 'id' | 'overall_score' | 'score_delta' | 'created_at' | 'updated_at'>) => {
    try {
      await upsertComplianceScore({ ...score, ca_user_id: caUserId! });
      await load();
      toast.success(`Compliance score saved for ${score.entity_name}`);
    } catch (err: any) {
      toast.error('Failed to save compliance score', { description: err.message });
      throw err;
    }
  }, [caUserId, load]);

  const removeScore = useCallback(async (id: string) => {
    try {
      await deleteComplianceScore(id);
      setScores((prev) => prev.filter((s) => s.id !== id));
      toast.success('Score record deleted');
    } catch (err: any) {
      toast.error('Failed to delete score', { description: err.message });
    }
  }, []);

  return { scores, loading, error, refetch: load, saveScore, removeScore };
}

// ─── useComplianceReports ─────────────────────────────────────────────────────

export function useComplianceReports(caUserId: string | null) {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setReports(await fetchComplianceReports(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const createReport = useCallback(async (opts: {
    reportName: string;
    reportType: ReportType;
    periodStart: string;
    periodEnd: string;
    modulesIncluded?: string[];
    format?: ReportFormat;
    isConfidential?: boolean;
  }) => {
    if (!caUserId) return;
    setGenerating(true);
    try {
      const report = await generateComplianceReport(caUserId, opts);
      setReports((prev) => [report, ...prev]);
      toast.success(`Report "${opts.reportName}" generated successfully`);
      return report;
    } catch (err: any) {
      toast.error('Failed to generate report', { description: err.message });
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [caUserId]);

  const changeStatus = useCallback(async (id: string, status: ReportStatus) => {
    try {
      await updateReportStatus(id, status);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Report status updated to: ${status}`);
    } catch (err: any) {
      toast.error('Failed to update report status', { description: err.message });
    }
  }, []);

  const removeReport = useCallback(async (id: string) => {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success('Report deleted');
    } catch (err: any) {
      toast.error('Failed to delete report', { description: err.message });
    }
  }, []);

  return { reports, loading, generating, error, refetch: load, createReport, changeStatus, removeReport };
}

// ─── useRetentionPolicies ─────────────────────────────────────────────────────

export function useRetentionPolicies(caUserId: string | null) {
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setPolicies(await fetchRetentionPolicies(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const editPolicy = useCallback(async (id: string, updates: Partial<DataRetentionPolicy>) => {
    try {
      const updated = await updateRetentionPolicy(id, updates);
      setPolicies((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Retention policy updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update retention policy', { description: err.message });
      throw err;
    }
  }, []);

  return { policies, loading, error, refetch: load, editPolicy };
}

// ─── useAuditAlerts ───────────────────────────────────────────────────────────

export function useAuditAlerts(caUserId: string | null) {
  const [alerts, setAlerts] = useState<AuditAlertSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setAlerts(await fetchAuditAlerts(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addAlert = useCallback(async (alert: Partial<AuditAlertSubscription>) => {
    try {
      const created = await createAuditAlert({ ...alert, ca_user_id: caUserId! });
      setAlerts((prev) => [...prev, created]);
      toast.success(`Audit alert "${created.alert_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create audit alert', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const toggleAlert = useCallback(async (id: string, isActive: boolean) => {
    try {
      await toggleAuditAlert(id, isActive);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a)));
      toast.success(isActive ? 'Alert activated' : 'Alert deactivated');
    } catch (err: any) {
      toast.error('Failed to toggle alert', { description: err.message });
    }
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    try {
      await deleteAuditAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Alert subscription deleted');
    } catch (err: any) {
      toast.error('Failed to delete alert', { description: err.message });
    }
  }, []);

  return { alerts, loading, error, refetch: load, addAlert, toggleAlert, removeAlert };
}

// ─── Re-export constants & types ──────────────────────────────────────────────

export {
  MODULE_LABELS,
  REPORT_TYPE_LABELS,
  SEVERITY_COLORS,
  type AuditTrailEvent,
  type ComplianceScore,
  type ComplianceReport,
  type DataRetentionPolicy,
  type AuditAlertSubscription,
  type AuditDashboard,
  type AuditModule,
  type AuditSeverity,
  type ReportType,
  type ReportFormat,
  type ReportStatus,
} from '@/services/audit-trail-service';
