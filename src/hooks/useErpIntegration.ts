/**
 * useErpIntegration — React Hooks for Gap 7: ERP / Accounting Integration
 *
 * Real Supabase data hooks. No mock data.
 *
 * Exports:
 *  - useErpConnections      — CRUD for ERP connections + test + dashboard stats
 *  - useErpFieldMappings    — CRUD for field mappings + seeding defaults
 *  - useErpSyncJobs         — List sync jobs, trigger new ones, cancel
 *  - useErpSyncLogs         — Per-job sync audit logs
 *  - useErpDataCache        — Cached ERP data preview
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchErpConnections,
  createErpConnection,
  updateErpConnection,
  deleteErpConnection,
  testErpConnection,
  fetchConnectionDashboard,
  fetchFieldMappings,
  createFieldMapping,
  updateFieldMapping,
  deleteFieldMapping,
  seedDefaultMappings,
  fetchSyncJobs,
  fetchAllSyncJobs,
  triggerSyncJob,
  cancelSyncJob,
  fetchSyncLogs,
  fetchCachedData,
  clearCache,
} from '@/services/erp-integration-service';
import type {
  ErpConnection,
  ErpPlatform,
  ErpAuthType,
  ErpEnvironment,
  ErpSyncDirection,
  ErpSyncJobStatus,
  ErpTransformType,
  ErpFieldMapping,
  ErpSyncJob,
  ErpSyncLog,
  ErpDataCache,
  ErpConnectionDashboard,
} from '@/services/erp-integration-service';

// ─── useErpConnections ────────────────────────────────────────────────────────

export function useErpConnections(caUserId: string) {
  const [connections, setConnections] = useState<ErpConnection[]>([]);
  const [dashboard, setDashboard] = useState<ErpConnectionDashboard[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const [conns, dash] = await Promise.all([
        fetchErpConnections(caUserId),
        fetchConnectionDashboard(caUserId),
      ]);
      setConnections(conns);
      setDashboard(dash);
    } catch (err: any) {
      console.error('Failed to fetch ERP connections:', err);
      toast.error('Failed to load ERP connections', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addConnection = useCallback(
    async (params: Parameters<typeof createErpConnection>[1]) => {
      try {
        const result = await createErpConnection(caUserId, params);
        toast.success('ERP connection created', { description: `${params.connection_name} (${params.platform})` });
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to create connection', { description: err.message });
        throw err;
      }
    },
    [caUserId, refetch]
  );

  const editConnection = useCallback(
    async (id: string, updates: Partial<ErpConnection>) => {
      try {
        const result = await updateErpConnection(id, updates);
        toast.success('Connection updated');
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to update connection', { description: err.message });
        throw err;
      }
    },
    [refetch]
  );

  const removeConnection = useCallback(
    async (id: string) => {
      try {
        await deleteErpConnection(id);
        toast.success('ERP connection removed');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to delete connection', { description: err.message });
      }
    },
    [refetch]
  );

  const testConnection = useCallback(
    async (connectionId: string) => {
      try {
        const result = await testErpConnection(connectionId);
        if (result.success) {
          toast.success('Connection successful', { description: `${result.latency_ms}ms latency` });
        } else {
          toast.warning('Connection test', { description: result.message });
        }
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Connection test failed', { description: err.message });
        throw err;
      }
    },
    [refetch]
  );

  return {
    connections,
    dashboard,
    loading,
    refetch,
    addConnection,
    editConnection,
    removeConnection,
    testConnection,
  };
}

// ─── useErpFieldMappings ─────────────────────────────────────────────────────

export function useErpFieldMappings(connectionId: string | null) {
  const [mappings, setMappings] = useState<ErpFieldMapping[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!connectionId) {
      setMappings([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchFieldMappings(connectionId);
      setMappings(data);
    } catch (err: any) {
      console.error('Failed to fetch field mappings:', err);
      toast.error('Failed to load field mappings', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addMapping = useCallback(
    async (params: Parameters<typeof createFieldMapping>[1]) => {
      if (!connectionId) return;
      try {
        const result = await createFieldMapping(connectionId, params);
        toast.success('Field mapping added');
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to add mapping', { description: err.message });
        throw err;
      }
    },
    [connectionId, refetch]
  );

  const editMapping = useCallback(
    async (id: string, updates: Partial<ErpFieldMapping>) => {
      try {
        const result = await updateFieldMapping(id, updates);
        toast.success('Mapping updated');
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to update mapping', { description: err.message });
        throw err;
      }
    },
    [refetch]
  );

  const removeMapping = useCallback(
    async (id: string) => {
      try {
        await deleteFieldMapping(id);
        toast.success('Field mapping removed');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to delete mapping', { description: err.message });
      }
    },
    [refetch]
  );

  const seedDefaults = useCallback(
    async (platform: ErpPlatform) => {
      if (!connectionId) return;
      try {
        const result = await seedDefaultMappings(connectionId, platform);
        toast.success(`${result.length} default mappings seeded for ${platform}`);
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to seed mappings', { description: err.message });
        throw err;
      }
    },
    [connectionId, refetch]
  );

  return { mappings, loading, refetch, addMapping, editMapping, removeMapping, seedDefaults };
}

// ─── useErpSyncJobs ──────────────────────────────────────────────────────────

export function useErpSyncJobs(caUserId: string, connectionId: string | null) {
  const [jobs, setJobs] = useState<ErpSyncJob[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      let data: ErpSyncJob[];
      if (connectionId) {
        data = await fetchSyncJobs(connectionId);
      } else if (caUserId) {
        data = await fetchAllSyncJobs(caUserId);
      } else {
        data = [];
      }
      setJobs(data);
    } catch (err: any) {
      console.error('Failed to fetch sync jobs:', err);
      toast.error('Failed to load sync jobs', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId, connectionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const triggerSync = useCallback(
    async (
      connId: string,
      params?: { sync_type?: 'full' | 'incremental' | 'selective'; direction?: ErpSyncDirection; entities?: string[] }
    ) => {
      try {
        const result = await triggerSyncJob(caUserId, connId, params);
        toast.success('Sync job triggered', { description: `Job ${result.id.slice(0, 8)}… queued` });
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to trigger sync', { description: err.message });
        throw err;
      }
    },
    [caUserId, refetch]
  );

  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        await cancelSyncJob(jobId);
        toast.success('Sync job cancelled');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to cancel job', { description: err.message });
      }
    },
    [refetch]
  );

  return { jobs, loading, refetch, triggerSync, cancelJob };
}

// ─── useErpSyncLogs ──────────────────────────────────────────────────────────

export function useErpSyncLogs(syncJobId: string | null) {
  const [logs, setLogs] = useState<ErpSyncLog[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!syncJobId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSyncLogs(syncJobId);
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to fetch sync logs:', err);
      toast.error('Failed to load sync logs', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [syncJobId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { logs, loading, refetch };
}

// ─── useErpDataCache ─────────────────────────────────────────────────────────

export function useErpDataCache(connectionId: string | null, erpEntity: string | null) {
  const [cachedData, setCachedData] = useState<ErpDataCache[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!connectionId || !erpEntity) {
      setCachedData([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCachedData(connectionId, erpEntity);
      setCachedData(data);
    } catch (err: any) {
      console.error('Failed to fetch cached data:', err);
      toast.error('Failed to load cached data', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [connectionId, erpEntity]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const clearEntityCache = useCallback(async () => {
    if (!connectionId) return;
    try {
      await clearCache(connectionId, erpEntity ?? undefined);
      toast.success('Cache cleared');
      await refetch();
    } catch (err: any) {
      toast.error('Failed to clear cache', { description: err.message });
    }
  }, [connectionId, erpEntity, refetch]);

  return { cachedData, loading, refetch, clearEntityCache };
}

// Re-export types for convenience
export type {
  ErpConnection,
  ErpPlatform,
  ErpAuthType,
  ErpEnvironment,
  ErpSyncDirection,
  ErpSyncJobStatus,
  ErpTransformType,
  ErpFieldMapping,
  ErpSyncJob,
  ErpSyncLog,
  ErpDataCache,
  ErpConnectionDashboard,
};
