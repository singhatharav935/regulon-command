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
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

export default useCAMetrics;
