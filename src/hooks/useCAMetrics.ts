/**
 * useCAMetrics Hook
 * Fetches real CA dashboard metrics directly from Supabase.
 * No backend server required.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCAMetricsFromDB, type CAMetrics } from '@/services/ca-supabase-service';

export type { CAMetrics };

export interface UseCAMetricsReturn {
  metrics: CAMetrics;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_METRICS: CAMetrics = {
  assigned_companies: 0,
  high_risk_alerts: 0,
  pending_filings_week: 0,
  active_tasks: 0,
  monthly_revenue: 0,
  overdue_dependencies: 0,
  last_updated: new Date().toISOString(),
};

export const useCAMetrics = (): UseCAMetricsReturn => {
  const [metrics, setMetrics] = useState<CAMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCAMetricsFromDB();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
      setMetrics(DEFAULT_METRICS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute

    // Refetch when tab becomes visible (catches changes from other sessions)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMetrics();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchMetrics);
    
    // Refetch on custom events
    window.addEventListener('swarm-completed-event', fetchMetrics);
    window.addEventListener('swarm-status-changed', fetchMetrics);
    window.addEventListener('ca:metrics-updated', fetchMetrics);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchMetrics);
      window.removeEventListener('swarm-completed-event', fetchMetrics);
      window.removeEventListener('swarm-status-changed', fetchMetrics);
      window.removeEventListener('ca:metrics-updated', fetchMetrics);
    };
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

export default useCAMetrics;
