/**
 * Enterprise API & Webhooks — Service Layer (Gap 6)
 * Real Supabase queries + Web Crypto API key generation.
 * No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiKeyPermission =
  | 'read:filings' | 'write:notices' | 'read:entities' | 'read:liabilities'
  | 'write:webhooks' | 'read:payments' | 'read:calendar' | 'read:regulatory'
  | 'admin:full';

export interface EnterpriseApiKey {
  id: string;
  ca_user_id: string;
  entity_id?: string;
  key_name: string;
  key_prefix: string;
  permissions: ApiKeyPermission[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  allowed_ips: string[];
  allowed_origins: string[];
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  total_requests: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookEndpoint {
  id: string;
  ca_user_id: string;
  api_key_id?: string;
  url: string;
  description: string;
  secret_prefix: string;
  events: string[];
  is_active: boolean;
  failure_count: number;
  max_failures_before_disable: number;
  last_triggered_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown>;
  http_status?: number;
  response_body?: string;
  response_time_ms?: number;
  attempt_number: number;
  max_attempts: number;
  status: string;
  next_retry_at?: string;
  delivered_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface ApiAccessLog {
  id: string;
  api_key_id: string;
  method: string;
  endpoint: string;
  request_body?: Record<string, unknown>;
  response_status: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  created_at: string;
}

export interface ApiKeyUsageSummary {
  id: string;
  key_name: string;
  key_prefix: string;
  is_active: boolean;
  total_requests: number;
  last_used_at?: string;
  active_webhook_count: number;
}

export interface WebhookHealthSummary {
  id: string;
  url: string;
  is_active: boolean;
  total_deliveries: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_response_time_ms: number;
}

// ─── Crypto Helpers (Web Crypto API) ──────────────────────────────────────────

/**
 * SHA-256 hex digest using Web Crypto API.
 */
export async function hashSecret(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically-random API key.
 * Format: rk_live_<32 hex chars>
 */
export async function generateApiKey(): Promise<{
  plainText: string;
  hash: string;
  prefix: string;
}> {
  const bytes = new Uint8Array(16); // 16 bytes = 32 hex chars
  crypto.getRandomValues(bytes);
  const hexStr = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const plainText = `rk_live_${hexStr}`;
  const prefix = plainText.slice(0, 12); // "rk_live_XXXX"
  const hash = await hashSecret(plainText);
  return { plainText, hash, prefix };
}

/**
 * Generate a webhook signing secret.
 * Format: whsec_<32 hex chars>
 */
export async function generateWebhookSecret(): Promise<{
  plainText: string;
  hash: string;
  prefix: string;
}> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hexStr = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const plainText = `whsec_${hexStr}`;
  const prefix = plainText.slice(0, 10); // "whsec_XXXX"
  const hash = await hashSecret(plainText);
  return { plainText, hash, prefix };
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export async function fetchApiKeys(caUserId: string): Promise<EnterpriseApiKey[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('enterprise_api_keys')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createApiKey(
  caUserId: string,
  params: {
    key_name: string;
    permissions: ApiKeyPermission[];
    rate_limit_per_minute?: number;
    rate_limit_per_day?: number;
    allowed_ips?: string[];
    allowed_origins?: string[];
    entity_id?: string;
    expires_at?: string;
  }
): Promise<{ apiKey: EnterpriseApiKey; plainTextKey: string }> {
  if (!isValidUUID(caUserId)) throw new Error('Not authenticated');
  const { plainText, hash, prefix } = await generateApiKey();

  const { data, error } = await (supabase as any)
    .from('enterprise_api_keys')
    .insert([
      {
        ca_user_id: caUserId,
        entity_id: params.entity_id ?? null,
        key_name: params.key_name,
        key_hash: hash,
        key_prefix: prefix,
        permissions: params.permissions,
        rate_limit_per_minute: params.rate_limit_per_minute ?? 60,
        rate_limit_per_day: params.rate_limit_per_day ?? 10000,
        allowed_ips: params.allowed_ips ?? [],
        allowed_origins: params.allowed_origins ?? [],
        is_active: true,
        expires_at: params.expires_at ?? null,
        total_requests: 0,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { apiKey: data, plainTextKey: plainText };
}

export async function revokeApiKey(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('enterprise_api_keys')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteApiKey(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('enterprise_api_keys')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updateApiKey(
  id: string,
  updates: Partial<EnterpriseApiKey>
): Promise<EnterpriseApiKey> {
  // Strip fields that should never be mutated directly
  const { id: _id, ca_user_id: _ca, key_prefix: _kp, created_at: _ca2, ...safeUpdates } = updates as any;

  const { data, error } = await (supabase as any)
    .from('enterprise_api_keys')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchApiKeyUsageSummary(
  caUserId: string
): Promise<ApiKeyUsageSummary[]> {
  // Query from a DB view if available, otherwise build from joins
  const { data: viewData, error: viewError } = await (supabase as any)
    .from('api_key_usage_summary')
    .select('*')
    .eq('ca_user_id', caUserId);

  if (!viewError && viewData) return viewData;

  // Fallback: build summary from the keys table + webhook counts
  const { data: keys, error: keysErr } = await (supabase as any)
    .from('enterprise_api_keys')
    .select('id, key_name, key_prefix, is_active, total_requests, last_used_at')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (keysErr) throw new Error(keysErr.message);
  if (!keys || keys.length === 0) return [];

  const keyIds = keys.map((k: any) => k.id);

  const { data: webhookCounts, error: wcErr } = await (supabase as any)
    .from('webhook_endpoints')
    .select('api_key_id')
    .in('api_key_id', keyIds)
    .eq('is_active', true);

  if (wcErr) throw new Error(wcErr.message);

  // Count webhooks per key
  const countMap: Record<string, number> = {};
  (webhookCounts ?? []).forEach((w: any) => {
    countMap[w.api_key_id] = (countMap[w.api_key_id] ?? 0) + 1;
  });

  return keys.map((k: any) => ({
    id: k.id,
    key_name: k.key_name,
    key_prefix: k.key_prefix,
    is_active: k.is_active,
    total_requests: k.total_requests,
    last_used_at: k.last_used_at,
    active_webhook_count: countMap[k.id] ?? 0,
  }));
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export async function fetchWebhooks(caUserId: string): Promise<WebhookEndpoint[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('webhook_endpoints')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createWebhook(
  caUserId: string,
  params: {
    url: string;
    description?: string;
    events: string[];
    api_key_id?: string;
    max_failures_before_disable?: number;
  }
): Promise<{ webhook: WebhookEndpoint; signingSecret: string }> {
  if (!isValidUUID(caUserId)) throw new Error('Not authenticated');
  const { plainText, hash, prefix } = await generateWebhookSecret();

  const { data, error } = await (supabase as any)
    .from('webhook_endpoints')
    .insert([
      {
        ca_user_id: caUserId,
        api_key_id: params.api_key_id ?? null,
        url: params.url,
        description: params.description ?? '',
        secret_hash: hash,
        secret_prefix: prefix,
        events: params.events,
        is_active: true,
        failure_count: 0,
        max_failures_before_disable: params.max_failures_before_disable ?? 10,
        metadata: {},
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { webhook: data, signingSecret: plainText };
}

export async function updateWebhook(
  id: string,
  updates: Partial<WebhookEndpoint>
): Promise<WebhookEndpoint> {
  const { id: _id, ca_user_id: _ca, secret_prefix: _sp, created_at: _ca2, ...safeUpdates } = updates as any;

  const { data, error } = await (supabase as any)
    .from('webhook_endpoints')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWebhook(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('webhook_endpoints')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function toggleWebhook(id: string, isActive: boolean): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  // Reset failure count when re-enabling
  if (isActive) {
    updatePayload.failure_count = 0;
  }

  const { error } = await (supabase as any)
    .from('webhook_endpoints')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Send a test ping to a webhook endpoint.
 * Creates a real delivery record with event_type 'test.ping'.
 */
export async function testWebhookEndpoint(webhookId: string): Promise<WebhookDelivery> {
  const eventId = crypto.randomUUID();
  const now = new Date().toISOString();

  const testPayload = {
    event: 'test.ping',
    event_id: eventId,
    timestamp: now,
    data: { message: 'Webhook test ping from Regulon' },
  };

  // Insert delivery record as 'pending'
  const { data: delivery, error: insertErr } = await (supabase as any)
    .from('webhook_deliveries')
    .insert([
      {
        webhook_id: webhookId,
        event_type: 'test.ping',
        event_id: eventId,
        payload: testPayload,
        attempt_number: 1,
        max_attempts: 1,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  // Try to trigger via edge function
  try {
    const { data: result, error: fnErr } = await supabase.functions.invoke(
      'deliver-webhook',
      {
        body: { delivery_id: delivery.id, webhook_id: webhookId, payload: testPayload },
      }
    );

    if (fnErr) throw fnErr;

    // Update delivery with edge function result
    const { data: updated, error: updateErr } = await (supabase as any)
      .from('webhook_deliveries')
      .update({
        http_status: result?.http_status ?? null,
        response_body: result?.response_body ?? null,
        response_time_ms: result?.response_time_ms ?? null,
        status: result?.success ? 'delivered' : 'failed',
        delivered_at: result?.success ? new Date().toISOString() : null,
        failed_at: result?.success ? null : new Date().toISOString(),
        error_message: result?.error ?? null,
      })
      .eq('id', delivery.id)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);
    return updated;
  } catch {
    // Edge function not deployed — mark as pending for manual verification
    const { data: fallback, error: fbErr } = await (supabase as any)
      .from('webhook_deliveries')
      .update({
        status: 'pending',
        error_message: 'Edge function not available — delivery queued',
      })
      .eq('id', delivery.id)
      .select()
      .single();

    if (fbErr) throw new Error(fbErr.message);
    return fallback;
  }
}

export async function fetchWebhookHealthSummary(
  caUserId: string
): Promise<WebhookHealthSummary[]> {
  // Try DB view first
  const { data: viewData, error: viewError } = await (supabase as any)
    .from('webhook_health_summary')
    .select('*')
    .eq('ca_user_id', caUserId);

  if (!viewError && viewData) return viewData;

  // Fallback: build from webhook_endpoints + deliveries
  const { data: webhooks, error: whErr } = await (supabase as any)
    .from('webhook_endpoints')
    .select('id, url, is_active')
    .eq('ca_user_id', caUserId);

  if (whErr) throw new Error(whErr.message);
  if (!webhooks || webhooks.length === 0) return [];

  const webhookIds = webhooks.map((w: any) => w.id);

  const { data: deliveries, error: delErr } = await (supabase as any)
    .from('webhook_deliveries')
    .select('webhook_id, status, response_time_ms')
    .in('webhook_id', webhookIds);

  if (delErr) throw new Error(delErr.message);

  // Aggregate per webhook
  const statsMap: Record<string, { total: number; success: number; failure: number; totalTime: number; timeCount: number }> = {};
  (deliveries ?? []).forEach((d: any) => {
    if (!statsMap[d.webhook_id]) {
      statsMap[d.webhook_id] = { total: 0, success: 0, failure: 0, totalTime: 0, timeCount: 0 };
    }
    const s = statsMap[d.webhook_id];
    s.total++;
    if (d.status === 'delivered') s.success++;
    if (d.status === 'failed') s.failure++;
    if (d.response_time_ms != null) {
      s.totalTime += d.response_time_ms;
      s.timeCount++;
    }
  });

  return webhooks.map((w: any) => {
    const s = statsMap[w.id] ?? { total: 0, success: 0, failure: 0, totalTime: 0, timeCount: 0 };
    return {
      id: w.id,
      url: w.url,
      is_active: w.is_active,
      total_deliveries: s.total,
      success_count: s.success,
      failure_count: s.failure,
      success_rate: s.total > 0 ? Math.round((s.success / s.total) * 10000) / 100 : 0,
      avg_response_time_ms: s.timeCount > 0 ? Math.round(s.totalTime / s.timeCount) : 0,
    };
  });
}

// ─── Deliveries ───────────────────────────────────────────────────────────────

export async function fetchDeliveries(
  webhookId: string,
  filters?: { status?: string; event_type?: string; limit?: number }
): Promise<WebhookDelivery[]> {
  let q = (supabase as any)
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId);

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.event_type) q = q.eq('event_type', filters.event_type);

  q = q.order('created_at', { ascending: false });

  if (filters?.limit) q = q.limit(filters.limit);
  else q = q.limit(100);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
  // Fetch current delivery to increment attempt
  const { data: existing, error: fetchErr } = await (supabase as any)
    .from('webhook_deliveries')
    .select('*')
    .eq('id', deliveryId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const nextAttempt = (existing.attempt_number ?? 1) + 1;

  const { data, error } = await (supabase as any)
    .from('webhook_deliveries')
    .update({
      status: 'retrying',
      attempt_number: nextAttempt,
      error_message: null,
      failed_at: null,
      next_retry_at: null,
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Attempt re-delivery via edge function
  try {
    const { data: result, error: fnErr } = await supabase.functions.invoke(
      'deliver-webhook',
      {
        body: {
          delivery_id: data.id,
          webhook_id: data.webhook_id,
          payload: data.payload,
        },
      }
    );

    if (fnErr) throw fnErr;

    const { data: updated, error: updateErr } = await (supabase as any)
      .from('webhook_deliveries')
      .update({
        http_status: result?.http_status ?? null,
        response_body: result?.response_body ?? null,
        response_time_ms: result?.response_time_ms ?? null,
        status: result?.success ? 'delivered' : 'failed',
        delivered_at: result?.success ? new Date().toISOString() : null,
        failed_at: result?.success ? null : new Date().toISOString(),
        error_message: result?.error ?? null,
      })
      .eq('id', data.id)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);
    return updated;
  } catch {
    // Edge fn unavailable — keep status as 'retrying' for background processor
    return data;
  }
}

// ─── Access Logs ──────────────────────────────────────────────────────────────

export async function fetchAccessLogs(
  apiKeyId: string,
  opts?: { limit?: number; offset?: number }
): Promise<ApiAccessLog[]> {
  let q = (supabase as any)
    .from('api_access_logs')
    .select('*')
    .eq('api_key_id', apiKeyId)
    .order('created_at', { ascending: false });

  if (opts?.limit) q = q.limit(opts.limit);
  else q = q.limit(100);

  if (opts?.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 100) - 1);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchRecentActivity(
  caUserId: string,
  limit: number = 50
): Promise<ApiAccessLog[]> {
  if (!isValidUUID(caUserId)) return [];
  // Fetch all key IDs for this CA user first
  const { data: keys, error: keysErr } = await (supabase as any)
    .from('enterprise_api_keys')
    .select('id')
    .eq('ca_user_id', caUserId);

  if (keysErr) throw new Error(keysErr.message);
  if (!keys || keys.length === 0) return [];

  const keyIds = keys.map((k: any) => k.id);

  const { data, error } = await (supabase as any)
    .from('api_access_logs')
    .select('*')
    .in('api_key_id', keyIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
