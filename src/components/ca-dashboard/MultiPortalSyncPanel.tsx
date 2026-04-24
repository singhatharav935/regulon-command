import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Shield, Key, RefreshCw, Download, Bell, Database,
  Lock, AlertTriangle, CheckCircle, Clock, UploadCloud, FileText,
  Check, ChevronRight, Loader, InboxIcon, Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';
import { useAsyncPolling } from '@/hooks/useAsyncPolling';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';

const PORTALS = [
  { id: 'gst',       name: 'GST Portal',  url: 'gst.gov.in',       color: 'text-green-400',  bg: 'bg-green-500/20' },
  { id: 'incometax', name: 'Income Tax',  url: 'incometax.gov.in', color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  { id: 'mca',       name: 'MCA21',       url: 'mca.gov.in',       color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'epfo',      name: 'EPFO India',  url: 'epfo.in',          color: 'text-violet-400', bg: 'bg-violet-500/20' },
  { id: 'esi',       name: 'ESIC',        url: 'esic.in',          color: 'text-orange-400', bg: 'bg-orange-500/20' },
];

interface SyncUpdate {
  type: string;
  msg: string;
  time: string;
  level: 'success' | 'info' | 'warning';
}

interface VaultDoc {
  name: string;
  portal: string;
  size: string;
}

interface PortalStatus {
  id: string;
  connected: boolean;
}

interface ClientCredential {
  id: string;
  name: string;
  gst: string;
  has_gstn: boolean;
  has_it: boolean;
  has_mca: boolean;
  has_epf: boolean;
}

export default function MultiPortalSyncPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'credentials' | 'reconciliation'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncUpdates, setSyncUpdates] = useState<SyncUpdate[]>([]);
  const [vaultDocs, setVaultDocs] = useState<VaultDoc[]>([]);
  const [portalStatuses, setPortalStatuses] = useState<PortalStatus[]>([]);
  const [clientCredentials, setClientCredentials] = useState<ClientCredential[]>([]);
  const [reconciliationItems, setReconciliationItems] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const { status, data, error, progress, startPolling } = useAsyncPolling<any>();

  // Fetch real sync data from backend
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [updatesRes, docsRes, statusRes] = await Promise.all([
        fetch(`${CA_API}/api/portal-sync/recent-updates`),
        fetch(`${CA_API}/api/portal-sync/vault-docs`),
        fetch(`${CA_API}/api/portal-sync/status`),
      ]);
      if (updatesRes.ok) { const d = await updatesRes.json(); setSyncUpdates(d.updates || []); }
      if (docsRes.ok)    { const d = await docsRes.json();    setVaultDocs(d.docs || []); }
      if (statusRes.ok)  {
        const d = await statusRes.json();
        setPortalStatuses(d.portals || []);
        if (d.last_sync) setLastSync(d.last_sync);
      }
    } catch {
      // Backend offline — show empty state
      setSyncUpdates([]);
      setVaultDocs([]);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await fetch(`${CA_API}/api/portal-sync/credentials`);
      if (res.ok) { const d = await res.json(); setClientCredentials(d.clients || []); }
    } catch { setClientCredentials([]); }
  };

  const fetchReconciliation = async () => {
    try {
      const res = await fetch(`${CA_API}/api/portal-sync/reconciliation`);
      if (res.ok) { const d = await res.json(); setReconciliationItems(d.items || []); }
    } catch { setReconciliationItems([]); }
  };

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => { if (activeTab === 'credentials') fetchCredentials(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'reconciliation') fetchReconciliation(); }, [activeTab]);

  useEffect(() => {
    if (status === 'polling') { setIsSyncing(true); setSyncProgress(progress); }
    else if (status === 'success') {
      setIsSyncing(false); setSyncProgress(100);
      setLastSync(data?.reconciliation?.db_sync_time || new Date().toISOString());
      toast.success('Hourly sync complete. Local DB updated.');
      fetchDashboardData();
    } else if (status === 'error') {
      setIsSyncing(false);
      toast.error(`Sync failed: ${error}`);
    }
  }, [status, progress, data, error]);

  const handleMasterSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true); setSyncProgress(0);
    toast.info('Initiating secure AES-256 multi-portal sync...');
    try {
      const caId = localStorage.getItem('current_user_id') || 'ca-local';
      const res = await fetch(`${CA_API}/api/v1/portal-sync/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ca_firm_id: caId })
      });
      const result = await res.json();
      if (result.success && result.job_id) {
        startPolling(result.job_id, `${CA_API}/api/v1/portal-sync/status`, 500);
      } else {
        toast.error('Failed to start sync job'); setIsSyncing(false);
      }
    } catch {
      toast.error('Backend connection failed'); setIsSyncing(false);
    }
  };

  const getPortalConnected = (portalId: string) =>
    portalStatuses.find(p => p.id === portalId)?.connected ?? false;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center mb-2">
            <Globe className="w-6 h-6 mr-2 text-cyan-400" />
            Multi-Portal Government Sync
            <span className="ml-3"><CASectionAgentBadge agentId="A1_PRIME" /></span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Centralized auto-login (AES-256), daily fetch, and reconciliation across all 5 govt portals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            <Archive className="w-4 h-4 mr-2" />
            Archive FY25-26
          </Button>
          <Button onClick={handleMasterSync} disabled={isSyncing} className="bg-cyan-600 hover:bg-cyan-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? `Syncing (${syncProgress}%)` : 'Sync All Portals Now'}
          </Button>
        </div>
      </div>

      {/* Portal status row — real connection state */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PORTALS.map(p => {
          const connected = portalStatuses.length > 0 ? getPortalConnected(p.id) : null;
          return (
            <div key={p.id} className="p-3 bg-card/30 border border-border/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${p.bg}`}><Shield className={`w-3.5 h-3.5 ${p.color}`} /></div>
                <div>
                  <p className="text-xs font-bold">{p.name}</p>
                  <p className="text-[9px] text-muted-foreground">{p.url}</p>
                </div>
              </div>
              {connected === null ? (
                <Badge variant="outline" className="text-[9px] bg-muted/20 text-muted-foreground">—</Badge>
              ) : connected ? (
                <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-400 border-green-500/20">Connected</Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20">Offline</Badge>
              )}
            </div>
          );
        })}
      </div>

      <Card className="border-border/50 bg-card/20">
        <CardHeader className="p-4 border-b border-border/30">
          <div className="flex items-center gap-4">
            {(['dashboard', 'reconciliation', 'credentials'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-1.5 border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'dashboard' ? 'Unified Dashboard' : tab === 'reconciliation' ? 'Auto-Reconciliation' : 'AES-256 Vault'}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* ─── DASHBOARD TAB ─── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Local DB Sync Status: {lastSync ? `Updated ${new Date(lastSync).toLocaleTimeString('en-IN')} (Hourly Schedule Active)` : 'Not synced yet — click Sync All Portals'}
                  </span>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400">Audit Log Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auto-Fetched Updates */}
                <div className="border border-border/30 rounded-lg bg-card/30 overflow-hidden">
                  <div className="p-2 border-b border-border/30 bg-muted/20 font-semibold text-xs flex justify-between">
                    <span>Recent Auto-Fetched Updates</span>
                    <span className="text-muted-foreground">(Live GST/ITR/EPF logs)</span>
                  </div>
                  <div className="p-2 min-h-[120px]">
                    {loadingDashboard ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs">
                        <Loader className="w-4 h-4 animate-spin" /> Loading...
                      </div>
                    ) : syncUpdates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center text-muted-foreground">
                        <InboxIcon className="w-6 h-6 opacity-30" />
                        <p className="text-xs">No sync updates yet.</p>
                        <p className="text-[10px] opacity-60">Click "Sync All Portals" to fetch live data from govt portals.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {syncUpdates.map((up, i) => (
                          <div key={i} className={`p-2 rounded flex items-center justify-between ${up.level === 'warning' ? 'bg-orange-500/10' : up.level === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${up.level === 'warning' ? 'text-orange-400' : up.level === 'success' ? 'text-green-400' : 'text-blue-400'}`}>[{up.type}]</span>
                              <span>{up.msg}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{up.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-Downloaded Documents Vault */}
                <div className="border border-border/30 rounded-lg bg-card/30 overflow-hidden">
                  <div className="p-2 border-b border-border/30 bg-muted/20 font-semibold text-xs">
                    Auto-Downloaded Documents Vault
                  </div>
                  <div className="p-2 min-h-[120px]">
                    {loadingDashboard ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs">
                        <Loader className="w-4 h-4 animate-spin" /> Loading...
                      </div>
                    ) : vaultDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center text-muted-foreground">
                        <FileText className="w-6 h-6 opacity-30" />
                        <p className="text-xs">No documents downloaded yet.</p>
                        <p className="text-[10px] opacity-60">Government portal documents will appear here after syncing.</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs">
                        {vaultDocs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded border border-transparent hover:border-border/50 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-blue-400 hover:underline truncate max-w-[160px]">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                              <span>{doc.portal}</span>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-2">
                          <UploadCloud className="w-3 h-3 mr-1" /> View Full Vault (AES Encrypted)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── RECONCILIATION TAB ─── */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-4">
              {reconciliationItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-center">
                  <CheckCircle className="w-10 h-10 opacity-30" />
                  <p className="font-semibold">No reconciliation mismatches detected</p>
                  <p className="text-sm opacity-70">
                    Variances between govt portal data and your books will appear here after a sync.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <Bell className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-400">Reconciliation Mismatches Detected</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reconciliationItems.length} items require your attention.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {reconciliationItems.map((rec, i) => (
                      <div key={i} className="p-3 border border-border/30 rounded-lg bg-card/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{rec.client}</span>
                            <Badge variant="outline" className="text-[10px]">{rec.type}</Badge>
                          </div>
                          <Badge className={`text-[10px] ${rec.status === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{rec.diff}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-2 rounded text-xs mb-2">
                          <div><span className="text-muted-foreground mr-1">Govt Portal:</span><span className="font-medium">{rec.portal}</span></div>
                          <div><span className="text-muted-foreground mr-1">Local Books:</span><span className="font-medium">{rec.books}</span></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {rec.desc}</p>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] border-cyan-500/30 text-cyan-400">Launch AI Agent Resolver</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── CREDENTIALS / AES-256 VAULT TAB ─── */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-indigo-400 flex items-center gap-1"><Lock className="w-4 h-4" /> AES-256 Encrypted Credential Vault</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Zero-knowledge architecture. Keys are securely hashed and never exposed.</p>
                </div>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8"><Key className="w-3.5 h-3.5 mr-1" /> Add Portal Login</Button>
              </div>

              {clientCredentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground text-center border border-border/30 rounded-lg bg-card/30">
                  <Lock className="w-8 h-8 opacity-30" />
                  <p className="font-semibold text-sm">No client credentials stored yet</p>
                  <p className="text-xs opacity-70 max-w-sm">
                    Add your clients' government portal logins here. They are encrypted with AES-256 and never stored in plaintext.
                  </p>
                </div>
              ) : (
                <div className="border border-border/30 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Client</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center">GSTN</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center">Income Tax</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center">MCA21</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center">EPF/ESI</th>
                        <th className="p-3 font-semibold text-muted-foreground text-right">Audit Log</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientCredentials.map(c => (
                        <tr key={c.id} className="border-t border-border/30">
                          <td className="p-3"><p className="font-medium">{c.name}</p><p className="text-[10px] font-mono text-muted-foreground">{c.gst}</p></td>
                          {[c.has_gstn, c.has_it, c.has_mca, c.has_epf].map((has, i) => (
                            <td key={i} className="p-3 text-center">
                              <Badge variant="outline" className={has ? 'bg-green-500/10 text-green-400 border-green-500/20 text-[10px]' : 'bg-muted/50 text-muted-foreground text-[10px]'}>
                                {has ? 'Stored 🔒' : 'Missing'}
                              </Badge>
                            </td>
                          ))}
                          <td className="p-3 text-right"><span className="text-[10px] text-blue-400 hover:underline cursor-pointer">View Access Log</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
