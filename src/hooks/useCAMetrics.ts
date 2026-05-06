/**
 * useCAMetrics Hook
 * Fetches real CA dashboard metrics from backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { getCAMetrics } from '@/services/api';
import { isCABackendConfigured } from '@/lib/ca-backend-guard';

export interface CAMetrics {
  assigned_companies: number;
  high_risk_alerts: number;
  pending_filings_week: number;
  active_tasks: number;
  monthly_revenue: number;
  overdue_dependencies: number;
  last_updated: string;
}

export interface UseCAMetricsReturn {
  metrics: CAMetrics | null;
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
  const [metrics, setMetrics] = useState<CAMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    // Skip network request entirely when no CA backend URL is configured
    if (!isCABackendConfigured()) {
      setMetrics(DEFAULT_METRICS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getCAMetrics();
      
      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        // If API fails, use default metrics (backend not connected yet)
        setMetrics(DEFAULT_METRICS);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch metrics');
      setError(error);
      
      // Use default metrics if API fails
      setMetrics(DEFAULT_METRICS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch metrics on mount
  useEffect(() => {
    fetchMetrics();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics: metrics || DEFAULT_METRICS,
    loading,
    error,
    refetch: fetchMetrics,
  };
};

export default useCAMetrics;
