/**
 * useRegulatoryVersion — React hooks for Version-Control & Client Re-evaluation (Gap 5)
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchRegulatoryNewsList,
  fetchRegulatoryNewsItem,
  createRegulatoryNews,
  updateRegulatoryNews,
  fetchNewsVersions,
  fetchCompanyEvaluations,
  updateEvaluationStatus,
  sendRegulatoryNotification,
  type RegulatoryNews,
  type RegulatoryNewsVersion,
  type CompanyEvaluation
} from '@/services/regulatory-version-service';

// ─── useRegulatoryNewsList ───────────────────────────────────────────────────

export function useRegulatoryNewsList() {
  const [news, setNews] = useState<RegulatoryNews[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRegulatoryNewsList();
      setNews(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addNews = useCallback(async (item: Partial<RegulatoryNews>) => {
    try {
      const created = await createRegulatoryNews(item);
      setNews(prev => [created, ...prev]);
      toast.success(`Regulatory notice "${created.title}" published`);
      return created;
    } catch (err: any) {
      toast.error('Failed to publish regulatory notice', { description: err.message });
      throw err;
    }
  }, []);

  const editNews = useCallback(async (id: string, updates: Partial<RegulatoryNews>, changeSummary: string) => {
    try {
      const updated = await updateRegulatoryNews(id, updates, changeSummary);
      setNews(prev => prev.map(n => n.id === id ? updated : n));
      toast.success(`Regulatory notice updated to version ${updated.version}`);
      return updated;
    } catch (err: any) {
      toast.error('Failed to update regulatory notice', { description: err.message });
      throw err;
    }
  }, []);

  return {
    news,
    loading,
    error,
    refetch: load,
    addNews,
    editNews
  };
}

// ─── useRegulatoryNewsVersions ───────────────────────────────────────────────

export function useRegulatoryNewsVersions(newsId: string | null) {
  const [versions, setVersions] = useState<RegulatoryNewsVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!newsId) { setVersions([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNewsVersions(newsId);
      setVersions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    versions,
    loading,
    error,
    refetch: load
  };
}

// ─── useCompanyEvaluations ───────────────────────────────────────────────────

export function useCompanyEvaluations(newsId: string | null) {
  const [evaluations, setEvaluations] = useState<CompanyEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!newsId) { setEvaluations([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanyEvaluations(newsId);
      setEvaluations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = useCallback(async (
    evaluationId: string,
    result: string,
    notes?: string
  ) => {
    try {
      const updated = await updateEvaluationStatus(evaluationId, result, notes);
      setEvaluations(prev => prev.map(ev => ev.id === evaluationId ? { ...ev, result: updated?.result, notes: updated?.notes } : ev));
      toast.success('Client compliance evaluation status updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update compliance evaluation status', { description: err.message });
      throw err;
    }
  }, []);

  const notifyClient = useCallback(async (evaluationId: string) => {
    try {
      await sendRegulatoryNotification(evaluationId);
      toast.success('Regulatory change alert sent to client');
    } catch (err: any) {
      toast.error('Failed to notify client', { description: err.message });
      throw err;
    }
  }, []);

  return {
    evaluations,
    loading,
    error,
    refetch: load,
    changeStatus,
    notifyClient
  };
}
