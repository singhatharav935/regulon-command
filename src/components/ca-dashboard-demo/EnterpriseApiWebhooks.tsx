/**
 * EnterpriseApiWebhooks — Gap 6 UI Dashboard
 * 
 * Full enterprise API & Webhook management console.
 * Real Supabase data only. No mock data.
 * 
 * Tabs:
 *  1. API Keys — Create/revoke/manage API keys with permissions & rate limits
 *  2. Webhooks — Configure endpoints, subscribe to events, view health
 *  3. Deliveries — View webhook delivery history, retry failed deliveries
 *  4. Access Logs — Monitor API usage, request/response details
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  useApiKeys,
  useWebhooks,
  useWebhookDeliveries,
  useApiAccessLogs,
  useApiDashboard
} from '@/hooks/useEnterpriseApi';
import { useCAIdentity } from '@/hooks/useCAIdentity';
import {
  Key,
  Webhook,
  Send,
  Activity,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Lock,
  Zap,
  Server,
  BarChart3,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Settings,
  ToggleLeft,
  ToggleRight,
  Info,
  Code2,
  Play,
  Pause,
} from 'lucide-react';
import type {
  ApiKeyPermission,
  EnterpriseApiKey,
  WebhookEndpoint,
  WebhookDelivery,
  ApiAccessLog
} from '@/services/enterprise-api-service';

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type ApiTab = 'keys' | 'webhooks' | 'deliveries' | 'logs';

const AVAILABLE_PERMISSIONS: { value: ApiKeyPermission; label: string; description: string }[] = [
  { value: 'read:filings', label: 'Read Filings', description: 'View e-filing jobs and status' },
  { value: 'write:notices', label: 'Write Notices', description: 'Create and manage government notices' },
  { value: 'read:entities', label: 'Read Entities', description: 'View entity hierarchy and details' },
  { value: 'read:liabilities', label: 'Read Liabilities', description: 'View tax liabilities and computations' },
  { value: 'read:payments', label: 'Read Payments', description: 'View payment transactions and reconciliation' },
  { value: 'read:calendar', label: 'Read Calendar', description: 'View compliance deadlines and SLA timers' },
  { value: 'read:regulatory', label: 'Read Regulatory', description: 'View regulatory news and version history' },
  { value: 'write:webhooks', label: 'Manage Webhooks', description: 'Create and configure webhook endpoints' },
  { value: 'admin:full', label: 'Full Admin', description: 'Unrestricted access to all API endpoints' },
];

const AVAILABLE_EVENTS = [
  'filing.created', 'filing.status_changed',
  'notice.received', 'notice.resolved',
  'payment.completed', 'payment.failed',
  'deadline.approaching', 'deadline.breached',
  'entity.updated', 'entity.created',
  'regulatory.version_bumped', 'regulatory.evaluation_changed',
  'test.ping',
];

// ─── Status Badges ────────────────────────────────────────────────────────────

function DeliveryStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    delivered: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle },
    pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: Clock },
    delivering: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: Send },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
    retrying: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: RotateCcw },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <Badge className={`${c.bg} ${c.text} border-none gap-1`}>
      <Icon className="w-3 h-3" /> {status}
    </Badge>
  );
}

function HttpStatusBadge({ status }: { status: number | null | undefined }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const color = status >= 200 && status < 300 ? 'text-green-400' : status >= 400 ? 'text-red-400' : 'text-yellow-400';
  return <span className={`text-xs font-mono font-bold ${color}`}>{status}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EnterpriseApiWebhooks: React.FC = () => {
  const { caId } = useCAIdentity();
  const [activeTab, setActiveTab] = useState<ApiTab>('keys');
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const { apiKeys, loading: keysLoading, refetch: refetchKeys, createKey, revokeKey, deleteKey } = useApiKeys(caId || '');
  const { webhooks, loading: webhooksLoading, refetch: refetchWebhooks, createEndpoint, updateEndpoint, deleteEndpoint, toggleEndpoint, testEndpoint } = useWebhooks(caId || '');
  const { deliveries, loading: deliveriesLoading, refetch: refetchDeliveries, retry: retryDelivery } = useWebhookDeliveries(selectedWebhookId);
  const { logs, loading: logsLoading, refetch: refetchLogs } = useApiAccessLogs(selectedApiKeyId);
  const { keyUsage, webhookHealth, loading: dashLoading, refetch: refetchDash } = useApiDashboard(caId || '');

  // ─── Create API Key Modal State ─────────────────────────────────────────────
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<ApiKeyPermission[]>([]);
  const [newKeyRateMin, setNewKeyRateMin] = useState(60);
  const [newKeyRateDay, setNewKeyRateDay] = useState(10000);
  const [newKeyIps, setNewKeyIps] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [createdKeyPlaintext, setCreatedKeyPlaintext] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // ─── Create Webhook Modal State ─────────────────────────────────────────────
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookDesc, setNewWebhookDesc] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [newWebhookApiKeyId, setNewWebhookApiKeyId] = useState('');
  const [createdWebhookSecret, setCreatedWebhookSecret] = useState<string | null>(null);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

  // ─── Expanded delivery row ──────────────────────────────────────────────────
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim() || newKeyPerms.length === 0) {
      toast.error('Key name and at least one permission are required');
      return;
    }
    setIsCreatingKey(true);
    try {
      const result = await createKey({
        key_name: newKeyName.trim(),
        permissions: newKeyPerms,
        rate_limit_per_minute: newKeyRateMin,
        rate_limit_per_day: newKeyRateDay,
        allowed_ips: newKeyIps ? newKeyIps.split(',').map(s => s.trim()).filter(Boolean) : [],
        expires_at: newKeyExpiry || undefined,
      });
      setCreatedKeyPlaintext(result.plainTextKey);
      setNewKeyName('');
      setNewKeyPerms([]);
      setNewKeyRateMin(60);
      setNewKeyRateDay(10000);
      setNewKeyIps('');
      setNewKeyExpiry('');
    } catch {
      // toast shown by hook
    } finally {
      setIsCreatingKey(false);
    }
  }, [newKeyName, newKeyPerms, newKeyRateMin, newKeyRateDay, newKeyIps, newKeyExpiry, createKey]);

  const handleCreateWebhook = useCallback(async () => {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }
    setIsCreatingWebhook(true);
    try {
      const result = await createEndpoint({
        url: newWebhookUrl.trim(),
        description: newWebhookDesc.trim(),
        events: newWebhookEvents,
        api_key_id: newWebhookApiKeyId || undefined,
      });
      setCreatedWebhookSecret(result.signingSecret);
      setNewWebhookUrl('');
      setNewWebhookDesc('');
      setNewWebhookEvents([]);
      setNewWebhookApiKeyId('');
    } catch {
      // toast shown by hook
    } finally {
      setIsCreatingWebhook(false);
    }
  }, [newWebhookUrl, newWebhookDesc, newWebhookEvents, newWebhookApiKeyId, createEndpoint]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  // ─── Dashboard Stats ───────────────────────────────────────────────────────
  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter(k => k.is_active).length;
  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter(w => w.is_active).length;
  const totalRequests = apiKeys.reduce((s, k) => s + (k.total_requests || 0), 0);

  // ─── Tab Config ─────────────────────────────────────────────────────────────
  const tabs: { id: ApiTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'keys', label: 'API Keys', icon: Key, count: totalKeys },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, count: totalWebhooks },
    { id: 'deliveries', label: 'Deliveries', icon: Send },
    { id: 'logs', label: 'Access Logs', icon: Activity },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/15 via-orange-900/10 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-400">Enterprise API & Webhooks</h2>
              <p className="text-sm text-muted-foreground">Programmatic access for ERP, HRMS, and third-party integrations</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {[
              { label: 'API Keys', value: totalKeys, active: activeKeys, color: 'text-amber-400', icon: Key },
              { label: 'Webhooks', value: totalWebhooks, active: activeWebhooks, color: 'text-orange-400', icon: Webhook },
              { label: 'Total Requests', value: totalRequests.toLocaleString('en-IN'), color: 'text-cyan-400', icon: BarChart3 },
              { label: 'Avg Success Rate', value: webhookHealth.length > 0 ? `${Math.round(webhookHealth.reduce((s, w) => s + (w.success_rate || 0), 0) / webhookHealth.length)}%` : '—', color: 'text-green-400', icon: CheckCircle },
              { label: 'Avg Response', value: webhookHealth.length > 0 ? `${Math.round(webhookHealth.reduce((s, w) => s + (w.avg_response_time_ms || 0), 0) / webhookHealth.length)}ms` : '—', color: 'text-purple-400', icon: Zap },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-4 rounded-xl bg-background/40 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  {'active' in stat && typeof stat.active === 'number' && (
                    <p className="text-[10px] text-muted-foreground mt-1">{stat.active} active</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_-3px_rgba(245,158,11,0.2)]'
                  : 'border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50 hover:border-border/50'}
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge className={`text-[10px] h-5 ${isActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-card/50 text-muted-foreground border-border/30'}`}>
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: API KEYS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'keys' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Create Key Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">API Key Management</h3>
            <Button
              onClick={() => { setShowCreateKey(true); setCreatedKeyPlaintext(null); }}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Generate API Key
            </Button>
          </div>

          {/* ── Created Key Reveal ──────────────────────────────────────── */}
          <AnimatePresence>
            {createdKeyPlaintext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-400 mb-1">API Key Generated Successfully</p>
                      <p className="text-xs text-muted-foreground mb-3">Copy this key now — it will never be shown again.</p>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/30">
                        <code className="flex-1 text-sm font-mono text-foreground break-all">{createdKeyPlaintext}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdKeyPlaintext, 'API Key')}
                          className="shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setCreatedKeyPlaintext(null)}>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Create Key Form ─────────────────────────────────────────── */}
          <AnimatePresence>
            {showCreateKey && !createdKeyPlaintext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-amber-500/20 bg-card/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                      <Key className="w-5 h-5" /> New API Key
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Key Name *</label>
                        <Input
                          value={newKeyName}
                          onChange={e => setNewKeyName(e.target.value)}
                          placeholder="e.g. ERP Integration - Production"
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Expiry (optional)</label>
                        <Input
                          type="datetime-local"
                          value={newKeyExpiry}
                          onChange={e => setNewKeyExpiry(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Rate Limit / Minute</label>
                        <Input
                          type="number"
                          value={newKeyRateMin}
                          onChange={e => setNewKeyRateMin(Number(e.target.value))}
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Rate Limit / Day</label>
                        <Input
                          type="number"
                          value={newKeyRateDay}
                          onChange={e => setNewKeyRateDay(Number(e.target.value))}
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">IP Whitelist (comma-separated, empty = all)</label>
                      <Input
                        value={newKeyIps}
                        onChange={e => setNewKeyIps(e.target.value)}
                        placeholder="e.g. 203.0.113.5, 198.51.100.0/24"
                        className="bg-background/50"
                      />
                    </div>

                    {/* Permissions Grid */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Permissions *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {AVAILABLE_PERMISSIONS.map(perm => {
                          const selected = newKeyPerms.includes(perm.value);
                          return (
                            <button
                              key={perm.value}
                              onClick={() => {
                                setNewKeyPerms(prev =>
                                  selected ? prev.filter(p => p !== perm.value) : [...prev, perm.value]
                                );
                              }}
                              className={`
                                text-left p-3 rounded-lg border transition-all duration-150
                                ${selected
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                  : 'bg-background/30 border-border/30 text-muted-foreground hover:border-border/60'}
                              `}
                            >
                              <p className="text-xs font-semibold">{perm.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{perm.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleCreateKey}
                        disabled={isCreatingKey || !newKeyName.trim() || newKeyPerms.length === 0}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
                      >
                        {isCreatingKey ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                        Generate Key
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── API Key List ────────────────────────────────────────────── */}
          {keysLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Key className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No API keys configured</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Generate your first API key to enable programmatic access</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-4 rounded-xl border transition-all duration-200
                    ${key.is_active
                      ? 'border-border/30 bg-card/20 hover:border-amber-500/20'
                      : 'border-red-500/15 bg-red-500/5 opacity-60'}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Key className={`w-4 h-4 ${key.is_active ? 'text-amber-400' : 'text-red-400'}`} />
                        <span className="font-semibold text-sm text-foreground">{key.key_name}</span>
                        <Badge className={key.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}>
                          {key.is_active ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <code className="px-2 py-0.5 rounded bg-background/50 text-xs font-mono">{key.key_prefix}…</code>
                        <span>•</span>
                        <span>{key.total_requests?.toLocaleString('en-IN') || 0} requests</span>
                        <span>•</span>
                        <span>{key.rate_limit_per_minute}/min · {key.rate_limit_per_day}/day</span>
                        {key.expires_at && (
                          <>
                            <span>•</span>
                            <span className={new Date(key.expires_at) < new Date() ? 'text-red-400' : ''}>
                              Expires {new Date(key.expires_at).toLocaleDateString('en-IN')}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Permissions */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(key.permissions || []).map((perm: string) => (
                          <Badge key={perm} className="text-[9px] bg-amber-500/10 text-amber-300/80 border-amber-500/20">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                      {/* IP whitelist */}
                      {key.allowed_ips && key.allowed_ips.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          IP restricted: {key.allowed_ips.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedApiKeyId(key.id); setActiveTab('logs'); }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Activity className="w-3.5 h-3.5 mr-1" /> Logs
                      </Button>
                      {key.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => revokeKey(key.id)}
                          className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                        >
                          <Pause className="w-3.5 h-3.5 mr-1" /> Revoke
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteKey(key.id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: WEBHOOKS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'webhooks' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Webhook Endpoints</h3>
            <Button
              onClick={() => { setShowCreateWebhook(true); setCreatedWebhookSecret(null); }}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Add Webhook Endpoint
            </Button>
          </div>

          {/* ── Created Webhook Secret Reveal ───────────────────────────── */}
          <AnimatePresence>
            {createdWebhookSecret && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-400 mb-1">Webhook Signing Secret Created</p>
                      <p className="text-xs text-muted-foreground mb-3">Copy this secret now — it will never be shown again. Use it to verify webhook payloads.</p>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/30">
                        <code className="flex-1 text-sm font-mono text-foreground break-all">{createdWebhookSecret}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdWebhookSecret, 'Signing Secret')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setCreatedWebhookSecret(null)}>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Create Webhook Form ─────────────────────────────────────── */}
          <AnimatePresence>
            {showCreateWebhook && !createdWebhookSecret && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-orange-500/20 bg-card/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                      <Webhook className="w-5 h-5" /> New Webhook Endpoint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Endpoint URL *</label>
                        <Input
                          value={newWebhookUrl}
                          onChange={e => setNewWebhookUrl(e.target.value)}
                          placeholder="https://your-erp.example.com/webhooks/regulon"
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                        <Input
                          value={newWebhookDesc}
                          onChange={e => setNewWebhookDesc(e.target.value)}
                          placeholder="Production ERP webhook"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Linked API Key (optional)</label>
                      <select
                        value={newWebhookApiKeyId}
                        onChange={e => setNewWebhookApiKeyId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
                      >
                        <option value="">None</option>
                        {apiKeys.filter(k => k.is_active).map(k => (
                          <option key={k.id} value={k.id}>{k.key_name} ({k.key_prefix}…)</option>
                        ))}
                      </select>
                    </div>

                    {/* Event Subscriptions */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Subscribe to Events *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {AVAILABLE_EVENTS.map(evt => {
                          const selected = newWebhookEvents.includes(evt);
                          return (
                            <button
                              key={evt}
                              onClick={() => {
                                setNewWebhookEvents(prev =>
                                  selected ? prev.filter(e => e !== evt) : [...prev, evt]
                                );
                              }}
                              className={`
                                text-left p-2.5 rounded-lg border text-xs transition-all duration-150
                                ${selected
                                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 font-semibold'
                                  : 'bg-background/30 border-border/30 text-muted-foreground hover:border-border/60'}
                              `}
                            >
                              {evt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleCreateWebhook}
                        disabled={isCreatingWebhook || !newWebhookUrl.trim() || newWebhookEvents.length === 0}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
                      >
                        {isCreatingWebhook ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Webhook className="w-4 h-4 mr-2" />}
                        Create Endpoint
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreateWebhook(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Webhook List ────────────────────────────────────────────── */}
          {webhooksLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Webhook className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No webhook endpoints configured</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add an endpoint to receive real-time compliance event notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <motion.div
                  key={wh.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-4 rounded-xl border transition-all duration-200
                    ${wh.is_active
                      ? 'border-border/30 bg-card/20 hover:border-orange-500/20'
                      : 'border-red-500/15 bg-red-500/5 opacity-60'}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className={`w-4 h-4 ${wh.is_active ? 'text-orange-400' : 'text-red-400'}`} />
                        <code className="text-sm font-mono text-foreground truncate">{wh.url}</code>
                        <Badge className={wh.is_active ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}>
                          {wh.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      {wh.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{wh.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span>Secret: <code className="px-1 py-0.5 rounded bg-background/50 font-mono">{wh.secret_prefix}…</code></span>
                        <span>•</span>
                        <span>{wh.failure_count} failures / {wh.max_failures_before_disable} max</span>
                        {wh.last_triggered_at && (
                          <>
                            <span>•</span>
                            <span>Last triggered {new Date(wh.last_triggered_at).toLocaleString('en-IN')}</span>
                          </>
                        )}
                      </div>
                      {/* Subscribed events */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(wh.events || []).map((evt: string) => (
                          <Badge key={evt} className="text-[9px] bg-orange-500/10 text-orange-300/80 border-orange-500/20">
                            {evt}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedWebhookId(wh.id); setActiveTab('deliveries'); }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Deliveries
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testEndpoint(wh.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" /> Test
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleEndpoint(wh.id, !wh.is_active)}
                        className={`text-xs ${wh.is_active ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                      >
                        {wh.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEndpoint(wh.id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: DELIVERIES                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'deliveries' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Webhook Delivery History</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedWebhookId || ''}
                onChange={e => setSelectedWebhookId(e.target.value || null)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
              >
                <option value="">Select Webhook</option>
                {webhooks.map(w => (
                  <option key={w.id} value={w.id}>{w.url}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={refetchDeliveries}
                disabled={!selectedWebhookId}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!selectedWebhookId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Send className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a webhook endpoint to view delivery history</p>
            </div>
          ) : deliveriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Send className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No deliveries yet for this webhook</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.map((del) => (
                <motion.div
                  key={del.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-border/30 bg-card/20 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDeliveryId(prev => prev === del.id ? null : del.id)}
                    className="w-full p-4 flex items-center justify-between gap-4 hover:bg-card/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <DeliveryStatusBadge status={del.status} />
                      <Badge className="bg-card/50 text-foreground border-border/30 font-mono text-[10px]">{del.event_type}</Badge>
                      <HttpStatusBadge status={del.http_status} />
                      {del.response_time_ms && (
                        <span className="text-[10px] text-muted-foreground">{del.response_time_ms}ms</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Attempt {del.attempt_number}/{del.max_attempts}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{new Date(del.created_at).toLocaleString('en-IN')}</span>
                      {del.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); retryDelivery(del.id); }}
                          className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
                        </Button>
                      )}
                      {expandedDeliveryId === del.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedDeliveryId === del.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border/20"
                      >
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Event ID</p>
                            <code className="text-xs font-mono text-foreground">{del.event_id}</code>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Payload</p>
                            <pre className="text-xs font-mono p-3 rounded-lg bg-background/60 border border-border/20 overflow-x-auto max-h-48">
                              {JSON.stringify(del.payload, null, 2)}
                            </pre>
                          </div>
                          {del.response_body && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Response Body</p>
                              <pre className="text-xs font-mono p-3 rounded-lg bg-background/60 border border-border/20 overflow-x-auto max-h-32">
                                {del.response_body}
                              </pre>
                            </div>
                          )}
                          {del.error_message && (
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                              <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Error</p>
                              <p className="text-xs text-red-300">{del.error_message}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: ACCESS LOGS                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">API Access Logs</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedApiKeyId || ''}
                onChange={e => setSelectedApiKeyId(e.target.value || null)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
              >
                <option value="">Select API Key</option>
                {apiKeys.map(k => (
                  <option key={k.id} value={k.id}>{k.key_name} ({k.key_prefix}…)</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={refetchLogs}
                disabled={!selectedApiKeyId}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!selectedApiKeyId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select an API key to view access logs</p>
            </div>
          ) : logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-green-400 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No API access logs yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 bg-card/30">
                      <th className="p-3 text-left text-muted-foreground font-medium">Timestamp</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Method</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Endpoint</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Status</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Latency</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">IP</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/15 hover:bg-card/20 transition-colors">
                        <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-IN', { hour12: false })}
                        </td>
                        <td className="p-3">
                          <Badge className={`
                            font-mono text-[10px]
                            ${log.method === 'GET' ? 'bg-green-500/15 text-green-400' : ''}
                            ${log.method === 'POST' ? 'bg-blue-500/15 text-blue-400' : ''}
                            ${log.method === 'PUT' ? 'bg-yellow-500/15 text-yellow-400' : ''}
                            ${log.method === 'DELETE' ? 'bg-red-500/15 text-red-400' : ''}
                            border-none
                          `}>
                            {log.method}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-foreground">{log.endpoint}</td>
                        <td className="p-3"><HttpStatusBadge status={log.response_status} /></td>
                        <td className="p-3 text-muted-foreground">{log.response_time_ms ? `${log.response_time_ms}ms` : '—'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{log.ip_address || '—'}</td>
                        <td className="p-3 text-red-400 max-w-[200px] truncate">{log.error_message || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EnterpriseApiWebhooks;
