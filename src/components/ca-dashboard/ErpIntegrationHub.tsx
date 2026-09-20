/**
 * ErpIntegrationHub — Gap 7 UI Dashboard
 *
 * Full ERP / Accounting System integration console.
 * Real Supabase data only. No mock data.
 *
 * Tabs:
 *  1. Connections — Add/manage ERP connections (Tally, Zoho, QB, SAP, etc.)
 *  2. Field Mappings — Configure data mapping between ERP ↔ Regulon
 *  3. Sync Jobs — Monitor sync operations, trigger new syncs
 *  4. Sync Logs — Per-record sync audit trail
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  useErpConnections,
  useErpFieldMappings,
  useErpSyncJobs,
  useErpSyncLogs,
} from '@/hooks/useErpIntegration';
import { ERP_PLATFORMS } from '@/services/erp-integration-service';
import type { ErpPlatform, ErpAuthType, ErpSyncDirection } from '@/services/erp-integration-service';
import { useCAIdentity } from '@/hooks/useCAIdentity';
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Settings,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  Globe,
  Shield,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Activity,
  FileText,
  Link2,
  Unlink,
  Plug,
  Server,
  Download,
  Upload,
  Search,
  Layers,
  GitBranch,
  Eye,
  X,
} from 'lucide-react';

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type ErpTab = 'connections' | 'mappings' | 'sync-jobs' | 'sync-logs';

// ─── Status Helpers ───────────────────────────────────────────────────────────

function ConnectionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    connected: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle },
    disconnected: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', icon: Unlink },
    error: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
    syncing: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: RefreshCw },
    auth_expired: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: AlertTriangle },
  };
  const c = config[status] || config.disconnected;
  const Icon = c.icon;
  return (
    <Badge className={`${c.bg} ${c.text} border-none gap-1`}>
      <Icon className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} /> {status.replace('_', ' ')}
    </Badge>
  );
}

function SyncJobStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    queued: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', icon: Clock },
    running: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: RefreshCw },
    completed: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
    cancelled: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: Pause },
    partial: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: AlertTriangle },
  };
  const c = config[status] || config.queued;
  const Icon = c.icon;
  return (
    <Badge className={`${c.bg} ${c.text} border-none gap-1`}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} /> {status}
    </Badge>
  );
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === 'pull') return <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-400" />;
  if (direction === 'push') return <ArrowUpFromLine className="w-3.5 h-3.5 text-orange-400" />;
  return <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />;
}

function PlatformIcon({ platform }: { platform: string }) {
  const meta = ERP_PLATFORMS.find((p) => p.id === platform);
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${platform === 'tally' ? 'blue' : platform === 'zoho_books' ? 'green' : platform === 'quickbooks' ? 'emerald' : platform === 'sap' ? 'indigo' : 'cyan'}-500/20 to-transparent border border-border/30 flex items-center justify-center`}>
      <Database className={`w-5 h-5 ${meta?.color ?? 'text-cyan-400'}`} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ErpIntegrationHub: React.FC = () => {
  const { caId } = useCAIdentity();
  const [activeTab, setActiveTab] = useState<ErpTab>('connections');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const {
    connections,
    dashboard,
    loading: connsLoading,
    refetch: refetchConns,
    addConnection,
    removeConnection,
    testConnection,
  } = useErpConnections(caId || '');

  const {
    mappings,
    loading: mappingsLoading,
    refetch: refetchMappings,
    addMapping,
    removeMapping,
    seedDefaults,
  } = useErpFieldMappings(selectedConnectionId);

  const {
    jobs,
    loading: jobsLoading,
    refetch: refetchJobs,
    triggerSync,
    cancelJob,
  } = useErpSyncJobs(caId || '', selectedConnectionId);

  const {
    logs: syncLogs,
    loading: logsLoading,
    refetch: refetchLogs,
  } = useErpSyncLogs(selectedJobId);

  // ─── Create Connection Modal State ──────────────────────────────────────────
  const [showCreateConn, setShowCreateConn] = useState(false);
  const [newConnPlatform, setNewConnPlatform] = useState<ErpPlatform>('tally');
  const [newConnName, setNewConnName] = useState('');
  const [newConnCompany, setNewConnCompany] = useState('');
  const [newConnUrl, setNewConnUrl] = useState('');
  const [newConnPort, setNewConnPort] = useState('');
  const [newConnAuthType, setNewConnAuthType] = useState<ErpAuthType>('api_key');
  const [newConnApiKey, setNewConnApiKey] = useState('');
  const [newConnDirection, setNewConnDirection] = useState<ErpSyncDirection>('pull');
  const [newConnFrequency, setNewConnFrequency] = useState('60');
  const [isCreatingConn, setIsCreatingConn] = useState(false);

  // ─── Create Mapping Modal State ─────────────────────────────────────────────
  const [showCreateMapping, setShowCreateMapping] = useState(false);
  const [newMapErpEntity, setNewMapErpEntity] = useState('');
  const [newMapErpField, setNewMapErpField] = useState('');
  const [newMapRegEntity, setNewMapRegEntity] = useState('');
  const [newMapRegField, setNewMapRegField] = useState('');
  const [isCreatingMapping, setIsCreatingMapping] = useState(false);

  // ─── Expanded job row ──────────────────────────────────────────────────────
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateConnection = useCallback(async () => {
    if (!newConnName.trim()) {
      toast.error('Connection name is required');
      return;
    }
    setIsCreatingConn(true);
    try {
      const platformMeta = ERP_PLATFORMS.find((p) => p.id === newConnPlatform);
      await addConnection({
        platform: newConnPlatform,
        connection_name: newConnName.trim(),
        company_name: newConnCompany.trim() || undefined,
        auth_type: newConnAuthType,
        credentials_encrypted: newConnApiKey ? { api_key: newConnApiKey } : {},
        base_url: newConnUrl.trim() || undefined,
        port: newConnPort ? parseInt(newConnPort) : (platformMeta?.defaultPort ?? undefined),
        sync_direction: newConnDirection,
        sync_frequency_minutes: parseInt(newConnFrequency) || 60,
      });
      setShowCreateConn(false);
      setNewConnName('');
      setNewConnCompany('');
      setNewConnUrl('');
      setNewConnPort('');
      setNewConnApiKey('');
    } catch {
      // toast shown by hook
    } finally {
      setIsCreatingConn(false);
    }
  }, [newConnPlatform, newConnName, newConnCompany, newConnUrl, newConnPort, newConnAuthType, newConnApiKey, newConnDirection, newConnFrequency, addConnection]);

  const handleCreateMapping = useCallback(async () => {
    if (!newMapErpEntity.trim() || !newMapErpField.trim() || !newMapRegEntity.trim() || !newMapRegField.trim()) {
      toast.error('All mapping fields are required');
      return;
    }
    setIsCreatingMapping(true);
    try {
      await addMapping({
        erp_entity: newMapErpEntity.trim(),
        erp_field: newMapErpField.trim(),
        regulon_entity: newMapRegEntity.trim(),
        regulon_field: newMapRegField.trim(),
      });
      setShowCreateMapping(false);
      setNewMapErpEntity('');
      setNewMapErpField('');
      setNewMapRegEntity('');
      setNewMapRegField('');
    } catch {
      // toast shown by hook
    } finally {
      setIsCreatingMapping(false);
    }
  }, [newMapErpEntity, newMapErpField, newMapRegEntity, newMapRegField, addMapping]);

  // ─── Dashboard Stats ───────────────────────────────────────────────────────
  const totalConnections = connections.length;
  const connectedCount = connections.filter((c) => c.status === 'connected').length;
  const syncingCount = connections.filter((c) => c.status === 'syncing').length;
  const errorCount = connections.filter((c) => c.status === 'error').length;
  const totalRecordsSynced = dashboard.reduce((s, d) => s + (d.total_records_synced || 0), 0);

  // ─── Tab Config ─────────────────────────────────────────────────────────────
  const tabs: { id: ErpTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'connections', label: 'Connections', icon: Plug, count: totalConnections },
    { id: 'mappings', label: 'Field Mappings', icon: GitBranch },
    { id: 'sync-jobs', label: 'Sync Jobs', icon: RefreshCw },
    { id: 'sync-logs', label: 'Sync Logs', icon: FileText },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-900/15 via-cyan-900/10 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-teal-400">ERP & Accounting Integration</h2>
              <p className="text-sm text-muted-foreground">Connect Tally, Zoho Books, QuickBooks, SAP and sync financial data</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {[
              { label: 'Connections', value: totalConnections, sub: `${connectedCount} active`, color: 'text-teal-400', icon: Plug },
              { label: 'Syncing', value: syncingCount, color: 'text-blue-400', icon: RefreshCw },
              { label: 'Errors', value: errorCount, color: errorCount > 0 ? 'text-red-400' : 'text-green-400', icon: errorCount > 0 ? AlertTriangle : CheckCircle },
              { label: 'Records Synced', value: totalRecordsSynced.toLocaleString('en-IN'), color: 'text-cyan-400', icon: BarChart3 },
              { label: 'Total Jobs', value: jobs.length, color: 'text-purple-400', icon: Activity },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-4 rounded-xl bg-background/40 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  {'sub' in stat && stat.sub && (
                    <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
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
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-[0_0_12px_-3px_rgba(20,184,166,0.2)]'
                  : 'border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50 hover:border-border/50'}
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge className={`text-[10px] h-5 ${isActive ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-card/50 text-muted-foreground border-border/30'}`}>
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CONNECTIONS                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'connections' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">ERP Connections</h3>
            <Button
              onClick={() => setShowCreateConn(true)}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Add Connection
            </Button>
          </div>

          {/* ── Create Connection Form ─────────────────────────────────── */}
          <AnimatePresence>
            {showCreateConn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-teal-500/20 bg-card/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-teal-400 flex items-center gap-2">
                      <Plug className="w-5 h-5" /> New ERP Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Platform Selection */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Platform *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {ERP_PLATFORMS.map((p) => {
                          const selected = newConnPlatform === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                setNewConnPlatform(p.id);
                                setNewConnAuthType(p.defaultAuthType);
                                if (p.defaultPort) setNewConnPort(String(p.defaultPort));
                              }}
                              className={`
                                text-left p-3 rounded-lg border transition-all duration-150
                                ${selected
                                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                                  : 'bg-background/30 border-border/30 text-muted-foreground hover:border-border/60'}
                              `}
                            >
                              <p className={`text-xs font-semibold ${selected ? p.color : ''}`}>{p.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Connection Name *</label>
                        <Input
                          value={newConnName}
                          onChange={(e) => setNewConnName(e.target.value)}
                          placeholder="e.g. Production Tally Server"
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Company Name</label>
                        <Input
                          value={newConnCompany}
                          onChange={(e) => setNewConnCompany(e.target.value)}
                          placeholder="e.g. ABC Enterprises Pvt Ltd"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Base URL / Host</label>
                        <Input
                          value={newConnUrl}
                          onChange={(e) => setNewConnUrl(e.target.value)}
                          placeholder={newConnPlatform === 'tally' ? 'http://localhost' : 'https://api.example.com'}
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Port</label>
                        <Input
                          type="number"
                          value={newConnPort}
                          onChange={(e) => setNewConnPort(e.target.value)}
                          placeholder="9000"
                          className="bg-background/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">API Key / Token</label>
                        <Input
                          type="password"
                          value={newConnApiKey}
                          onChange={(e) => setNewConnApiKey(e.target.value)}
                          placeholder="Enter API key or token"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Auth Type</label>
                        <select
                          value={newConnAuthType}
                          onChange={(e) => setNewConnAuthType(e.target.value as ErpAuthType)}
                          className="w-full p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
                        >
                          <option value="api_key">API Key</option>
                          <option value="oauth2">OAuth 2.0</option>
                          <option value="basic_auth">Basic Auth</option>
                          <option value="certificate">Certificate</option>
                          <option value="tally_xml">Tally XML Server</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sync Direction</label>
                        <select
                          value={newConnDirection}
                          onChange={(e) => setNewConnDirection(e.target.value as ErpSyncDirection)}
                          className="w-full p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
                        >
                          <option value="pull">Pull (ERP → Regulon)</option>
                          <option value="push">Push (Regulon → ERP)</option>
                          <option value="bidirectional">Bidirectional</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sync Frequency (minutes)</label>
                        <Input
                          type="number"
                          value={newConnFrequency}
                          onChange={(e) => setNewConnFrequency(e.target.value)}
                          placeholder="60"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleCreateConnection}
                        disabled={isCreatingConn || !newConnName.trim()}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white"
                      >
                        {isCreatingConn ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plug className="w-4 h-4 mr-2" />}
                        Create Connection
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreateConn(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Connection List ────────────────────────────────────────── */}
          {connsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No ERP connections configured</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Connect your accounting system to sync financial data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => {
                const platformMeta = ERP_PLATFORMS.find((p) => p.id === conn.platform);
                const dashItem = dashboard.find((d) => d.connection_id === conn.id);
                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      p-5 rounded-xl border transition-all duration-200
                      ${conn.status === 'connected' ? 'border-green-500/20 bg-card/20 hover:border-teal-500/30' :
                        conn.status === 'error' ? 'border-red-500/20 bg-red-500/5' :
                        conn.status === 'syncing' ? 'border-blue-500/20 bg-blue-500/5' :
                        'border-border/30 bg-card/20 hover:border-border/50'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <PlatformIcon platform={conn.platform} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{conn.connection_name}</span>
                            <ConnectionStatusBadge status={conn.status} />
                            <Badge className="text-[9px] bg-card/50 text-muted-foreground border-border/30">
                              {platformMeta?.name ?? conn.platform}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            {conn.company_name && (
                              <>
                                <span className="flex items-center gap-1"><Server className="w-3 h-3" />{conn.company_name}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="flex items-center gap-1"><DirectionIcon direction={conn.sync_direction} />{conn.sync_direction}</span>
                            <span>•</span>
                            <span>Every {conn.sync_frequency_minutes}min</span>
                            {conn.last_sync_at && (
                              <>
                                <span>•</span>
                                <span>Last sync: {new Date(conn.last_sync_at).toLocaleString('en-IN')}</span>
                              </>
                            )}
                          </div>
                          {/* Sync stats from dashboard */}
                          {dashItem && (dashItem.total_sync_jobs > 0 || dashItem.field_mapping_count > 0) && (
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 mt-2">
                              <span>{dashItem.total_sync_jobs} jobs ({dashItem.successful_sync_jobs} ok, {dashItem.failed_sync_jobs} failed)</span>
                              <span>•</span>
                              <span>{dashItem.total_records_synced.toLocaleString('en-IN')} records</span>
                              <span>•</span>
                              <span>{dashItem.field_mapping_count} mappings</span>
                            </div>
                          )}
                          {conn.last_error && (
                            <div className="flex items-start gap-1.5 mt-2 text-[10px] text-red-400 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{conn.last_error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => testConnection(conn.id)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" /> Test
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedConnectionId(conn.id);
                            triggerSync(conn.id, { sync_type: 'incremental' });
                          }}
                          className="text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedConnectionId(conn.id); setActiveTab('mappings'); }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <GitBranch className="w-3.5 h-3.5 mr-1" /> Map
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeConnection(conn.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: FIELD MAPPINGS                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mappings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-foreground">Field Mappings</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedConnectionId || ''}
                onChange={(e) => setSelectedConnectionId(e.target.value || null)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
              >
                <option value="">Select Connection</option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>{c.connection_name} ({c.platform})</option>
                ))}
              </select>
              {selectedConnectionId && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const conn = connections.find((c) => c.id === selectedConnectionId);
                      if (conn) seedDefaults(conn.platform);
                    }}
                    className="text-xs border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Seed Defaults
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateMapping(true)}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Mapping
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── Create Mapping Form ──────────────────────────────────────── */}
          <AnimatePresence>
            {showCreateMapping && selectedConnectionId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-teal-500/20 bg-card/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-teal-400 flex items-center gap-2">
                      <GitBranch className="w-4 h-4" /> New Field Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">ERP Entity *</label>
                        <Input value={newMapErpEntity} onChange={(e) => setNewMapErpEntity(e.target.value)} placeholder="e.g. ledger" className="bg-background/50" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">ERP Field *</label>
                        <Input value={newMapErpField} onChange={(e) => setNewMapErpField(e.target.value)} placeholder="e.g. Name" className="bg-background/50" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Regulon Entity *</label>
                        <Input value={newMapRegEntity} onChange={(e) => setNewMapRegEntity(e.target.value)} placeholder="e.g. client_companies" className="bg-background/50" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Regulon Field *</label>
                        <Input value={newMapRegField} onChange={(e) => setNewMapRegField(e.target.value)} placeholder="e.g. company_name" className="bg-background/50" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={handleCreateMapping} disabled={isCreatingMapping} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                        {isCreatingMapping ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add Mapping
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreateMapping(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedConnectionId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <GitBranch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a connection to manage field mappings</p>
            </div>
          ) : mappingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <GitBranch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No field mappings configured</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click "Seed Defaults" to populate standard mappings or add custom ones</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 bg-card/30">
                      <th className="p-3 text-left text-muted-foreground font-medium">ERP Entity</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">ERP Field</th>
                      <th className="p-3 text-center text-muted-foreground font-medium">→</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Regulon Entity</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Regulon Field</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Transform</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Status</th>
                      <th className="p-3 text-right text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((m) => (
                      <tr key={m.id} className="border-b border-border/15 hover:bg-card/20 transition-colors">
                        <td className="p-3 font-mono text-foreground">{m.erp_entity}</td>
                        <td className="p-3 font-mono text-cyan-400">{m.erp_field}</td>
                        <td className="p-3 text-center"><ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground inline-block" /></td>
                        <td className="p-3 font-mono text-foreground">{m.regulon_entity}</td>
                        <td className="p-3 font-mono text-teal-400">{m.regulon_field}</td>
                        <td className="p-3">
                          <Badge className="text-[9px] bg-card/50 text-muted-foreground border-border/30">{m.transform_type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={m.is_active ? 'bg-green-500/15 text-green-400 border-none text-[9px]' : 'bg-zinc-500/15 text-zinc-400 border-none text-[9px]'}>
                            {m.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => removeMapping(m.id)} className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SYNC JOBS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sync-jobs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-foreground">Sync Jobs</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedConnectionId || ''}
                onChange={(e) => setSelectedConnectionId(e.target.value || null)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
              >
                <option value="">All Connections</option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>{c.connection_name}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={refetchJobs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <RefreshCw className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No sync jobs yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Trigger a sync from the Connections tab</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const conn = connections.find((c) => c.id === job.connection_id);
                const isExpanded = expandedJobId === job.id;
                const totalRecords = job.records_created + job.records_updated + job.records_skipped + job.records_failed;
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-border/30 bg-card/20 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="w-full p-4 flex items-center justify-between gap-4 hover:bg-card/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-wrap">
                        <SyncJobStatusBadge status={job.status} />
                        <Badge className="bg-card/50 text-foreground border-border/30 text-[10px] font-mono">{job.sync_type}</Badge>
                        <DirectionIcon direction={job.direction} />
                        {conn && <span className="text-xs text-muted-foreground">{conn.connection_name}</span>}
                        {job.status === 'running' && (
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={job.progress_pct} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground">{job.progress_pct}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="text-green-400">+{job.records_created}</span>
                          <span className="text-blue-400">↺{job.records_updated}</span>
                          <span className="text-zinc-400">⊘{job.records_skipped}</span>
                          <span className="text-red-400">✗{job.records_failed}</span>
                        </div>
                        {job.duration_ms && <span className="text-[10px] text-muted-foreground">{(job.duration_ms / 1000).toFixed(1)}s</span>}
                        <span className="text-[10px] text-muted-foreground">{new Date(job.created_at).toLocaleString('en-IN')}</span>
                        {(job.status === 'queued' || job.status === 'running') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); cancelJob(job.id); }}
                            className="text-xs text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {job.status === 'failed' || job.status === 'completed' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); setActiveTab('sync-logs'); }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Logs
                          </Button>
                        ) : null}
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border/20"
                        >
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {[
                                { label: 'Fetched', value: job.records_fetched, color: 'text-foreground' },
                                { label: 'Created', value: job.records_created, color: 'text-green-400' },
                                { label: 'Updated', value: job.records_updated, color: 'text-blue-400' },
                                { label: 'Skipped', value: job.records_skipped, color: 'text-zinc-400' },
                                { label: 'Failed', value: job.records_failed, color: 'text-red-400' },
                              ].map((s) => (
                                <div key={s.label} className="p-2 rounded-lg bg-background/40 border border-border/20 text-center">
                                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                            {job.entities_synced && job.entities_synced.length > 0 && (
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Entities Synced</p>
                                <div className="flex flex-wrap gap-1">
                                  {job.entities_synced.map((e) => (
                                    <Badge key={e} className="text-[9px] bg-teal-500/10 text-teal-300 border-teal-500/20">{e}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {job.error_message && (
                              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Error</p>
                                <p className="text-xs text-red-300">{job.error_message}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: SYNC LOGS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sync-logs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-foreground">Sync Audit Logs</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedJobId || ''}
                onChange={(e) => setSelectedJobId(e.target.value || null)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground max-w-xs"
              >
                <option value="">Select Sync Job</option>
                {jobs.map((j) => {
                  const conn = connections.find((c) => c.id === j.connection_id);
                  return (
                    <option key={j.id} value={j.id}>
                      {conn?.connection_name ?? 'Unknown'} — {j.sync_type} — {new Date(j.created_at).toLocaleString('en-IN')}
                    </option>
                  );
                })}
              </select>
              <Button size="sm" variant="outline" onClick={refetchLogs} disabled={!selectedJobId}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!selectedJobId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a sync job to view per-record audit logs</p>
            </div>
          ) : logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No sync log entries for this job</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 bg-card/30">
                      <th className="p-3 text-left text-muted-foreground font-medium">Timestamp</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">ERP Entity</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Record ID</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Operation</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Status</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Regulon Target</th>
                      <th className="p-3 text-left text-muted-foreground font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border/15 hover:bg-card/20 transition-colors">
                        <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-IN', { hour12: false })}
                        </td>
                        <td className="p-3 font-mono text-foreground">{log.erp_entity}</td>
                        <td className="p-3 font-mono text-cyan-400 max-w-[120px] truncate">{log.erp_record_id}</td>
                        <td className="p-3">
                          <Badge className={`
                            text-[10px] border-none
                            ${log.operation === 'create' ? 'bg-green-500/15 text-green-400' : ''}
                            ${log.operation === 'update' ? 'bg-blue-500/15 text-blue-400' : ''}
                            ${log.operation === 'skip' ? 'bg-zinc-500/15 text-zinc-400' : ''}
                            ${log.operation === 'delete' ? 'bg-red-500/15 text-red-400' : ''}
                            ${log.operation === 'error' ? 'bg-red-500/15 text-red-400' : ''}
                          `}>
                            {log.operation}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`
                            text-[10px] border-none
                            ${log.status === 'success' ? 'bg-green-500/15 text-green-400' : ''}
                            ${log.status === 'failed' ? 'bg-red-500/15 text-red-400' : ''}
                            ${log.status === 'skipped' ? 'bg-zinc-500/15 text-zinc-400' : ''}
                            ${log.status === 'conflict' ? 'bg-orange-500/15 text-orange-400' : ''}
                          `}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-teal-400 text-[10px]">
                          {log.regulon_entity ? `${log.regulon_entity}` : '—'}
                        </td>
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

export default ErpIntegrationHub;
