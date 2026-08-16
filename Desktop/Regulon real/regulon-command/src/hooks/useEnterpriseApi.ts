/**
 * useEnterpriseApi — React Hooks for Gap 6: Enterprise API & Webhooks
 *
 * Real Supabase data hooks. No mock data.
 *
 * Exports:
 *  - useApiKeys          — CRUD for enterprise API keys
 *  - useWebhooks         — CRUD for webhook endpoints (create, toggle, test, delete)
 *  - useWebhookDeliveries — Delivery history + retry for a selected webhook
 *  - useApiAccessLogs    — Per-key API access audit logs
 *  - useApiDashboard     — Aggregated usage summary + webhook health stats
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook as deleteWebhookApi,
  toggleWebhook,
  testWebhookEndpoint,
  fetchDeliveries,
  retryDelivery as retryDeliveryApi,
  fetchAccessLogs,
  fetchApiKeyUsageSummary,
  fetchWebhookHealthSummary,
} from '@/services/enterprise-api-service';
import type {
  EnterpriseApiKey,
  ApiKeyPermission,
  WebhookEndpoint,
  WebhookDelivery,
  ApiAccessLog,
  ApiKeyUsageSummary,
  WebhookHealthSummary,
} from '@/services/enterprise-api-service';

// ─── useApiKeys ───────────────────────────────────────────────────────────────

export function useApiKeys(caUserId: string) {
  const [apiKeys, setApiKeys] = useState<EnterpriseApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const data = await fetchApiKeys(caUserId);
      setApiKeys(data);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
      toast.error('Failed to load API keys', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createKey = useCallback(
    async (params: {
      key_name: string;
      permissions: ApiKeyPermission[];
      rate_limit_per_minute?: number;
      rate_limit_per_day?: number;
      allowed_ips?: string[];
      allowed_origins?: string[];
      entity_id?: string;
      expires_at?: string;
    }) => {
      try {
        const result = await createApiKey(caUserId, params);
        toast.success('API key generated', { description: `Key "${params.key_name}" created` });
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to create API key', { description: err.message });
        throw err;
      }
    },
    [caUserId, refetch]
  );

  const revokeKey = useCallback(
    async (id: string) => {
      try {
        await revokeApiKey(id);
        toast.success('API key revoked');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to revoke API key', { description: err.message });
      }
    },
    [refetch]
  );

  const deleteKey = useCallback(
    async (id: string) => {
      try {
        await deleteApiKey(id);
        toast.success('API key deleted');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to delete API key', { description: err.message });
      }
    },
    [refetch]
  );

  return { apiKeys, loading, refetch, createKey, revokeKey, deleteKey };
}

// ─── useWebhooks ──────────────────────────────────────────────────────────────

export function useWebhooks(caUserId: string) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const data = await fetchWebhooks(caUserId);
      setWebhooks(data);
    } catch (err: any) {
      console.error('Failed to fetch webhooks:', err);
      toast.error('Failed to load webhooks', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createEndpoint = useCallback(
    async (params: {
      url: string;
      description?: string;
      events: string[];
      api_key_id?: string;
      max_failures_before_disable?: number;
    }) => {
      try {
        const result = await createWebhook(caUserId, params);
        toast.success('Webhook endpoint created', { description: params.url });
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to create webhook', { description: err.message });
        throw err;
      }
    },
    [caUserId, refetch]
  );

  const updateEndpoint = useCallback(
    async (id: string, updates: Partial<WebhookEndpoint>) => {
      try {
        const result = await updateWebhook(id, updates);
        toast.success('Webhook updated');
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to update webhook', { description: err.message });
        throw err;
      }
    },
    [refetch]
  );

  const deleteEndpoint = useCallback(
    async (id: string) => {
      try {
        await deleteWebhookApi(id);
        toast.success('Webhook endpoint deleted');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to delete webhook', { description: err.message });
      }
    },
    [refetch]
  );

  const toggleEndpoint = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        await toggleWebhook(id, isActive);
        toast.success(isActive ? 'Webhook enabled' : 'Webhook disabled');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to toggle webhook', { description: err.message });
      }
    },
    [refetch]
  );

  const testEndpoint = useCallback(
    async (webhookId: string) => {
      try {
        const delivery = await testWebhookEndpoint(webhookId);
        if (delivery.status === 'delivered') {
          toast.success('Test ping delivered successfully');
        } else {
          toast.info('Test ping queued', { description: delivery.error_message || 'Awaiting delivery' });
        }
        return delivery;
      } catch (err: any) {
        toast.error('Test ping failed', { description: err.message });
        throw err;
      }
    },
    []
  );

  return { webhooks, loading, refetch, createEndpoint, updateEndpoint, deleteEndpoint, toggleEndpoint, testEndpoint };
}

// ─── useWebhookDeliveries ─────────────────────────────────────────────────────

export function useWebhookDeliveries(webhookId: string | null) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!webhookId) {
      setDeliveries([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchDeliveries(webhookId);
      setDeliveries(data);
    } catch (err: any) {
      console.error('Failed to fetch deliveries:', err);
      toast.error('Failed to load deliveries', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const retry = useCallback(
    async (deliveryId: string) => {
      try {
        const result = await retryDeliveryApi(deliveryId);
        toast.success('Delivery retry initiated');
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Retry failed', { description: err.message });
        throw err;
      }
    },
    [refetch]
  );

  return { deliveries, loading, refetch, retry };
}

// ─── useApiAccessLogs ─────────────────────────────────────────────────────────

export function useApiAccessLogs(apiKeyId: string | null) {
  const [logs, setLogs] = useState<ApiAccessLog[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!apiKeyId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAccessLogs(apiKeyId);
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to fetch access logs:', err);
      toast.error('Failed to load access logs', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [apiKeyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { logs, loading, refetch };
}

// ─── useApiDashboard ──────────────────────────────────────────────────────────

export function useApiDashboard(caUserId: string) {
  const [keyUsage, setKeyUsage] = useState<ApiKeyUsageSummary[]>([]);
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealthSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const [usage, health] = await Promise.all([
        fetchApiKeyUsageSummary(caUserId),
        fetchWebhookHealthSummary(caUserId),
      ]);
      setKeyUsage(usage);
      setWebhookHealth(health);
    } catch (err: any) {
      console.error('Failed to fetch API dashboard:', err);
      toast.error('Failed to load API dashboard', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { keyUsage, webhookHealth, loading, refetch };
}
