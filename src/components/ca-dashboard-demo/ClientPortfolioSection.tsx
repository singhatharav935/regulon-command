import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Building2, Clock, Plus, X, ChevronRight, Shield, Send, Loader,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Mail, MessageSquare, Zap, Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  loadCAClients, type CAClient, type CAClientForm,
  initiateConsentRequest, getPendingConsentRequests, type ConsentRequest,
  triggerSync, triggerSwarm, getSwarmStatus,
} from "@/services/ca-supabase-service";
import { validateGSTIN, isGSTINFormatValid } from "@/lib/gstin-validator";
import { useCAAgentOrchestrator } from "@/components/agents-demo/CAAgentOrchestrator";
import { DemoClientSectorBadge } from "@/components/ca-dashboard-demo/ClientSectorBadge";
import { type ClientSector, SELECTABLE_SECTORS, getSectorConfig } from "@/lib/client-sector";

const riskColors: Record<string, string> = {
  Low:    "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High:   "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors: Record<string, string> = {
  "Waiting for CA":     "text-yellow-400",
  "Waiting for Client": "text-orange-400",
  "Filed":              "text-blue-400",
  "Verified":           "text-green-400",
};

const CONSENT_STATUS_CONFIG = {
  pending:  { label: "Awaiting Response", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",  icon: Clock },
  approved: { label: "Authorized",        cls: "bg-green-500/20 text-green-400 border-green-500/30",  icon: CheckCircle },
  rejected: { label: "Declined",          cls: "bg-red-500/20 text-red-400 border-red-500/30",        icon: XCircle },
};

interface ClientPortfolioSectionProps {
  governmentApiEnabled?: boolean;
}

const ClientPortfolioSection = ({
  governmentApiEnabled = false,
}: ClientPortfolioSectionProps) => {
  const { isRunning } = useCAAgentOrchestrator();
  const [clients, setClients] = useState<CAClient[]>([]);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [swarmingIds, setSwarmingIds] = useState<Set<string>>(new Set());
  const [swarmProgress, setSwarmProgress] = useState<Record<string, { progress: number; step: string }>>({}); 
  const [swarmDoneIds, setSwarmDoneIds] = useState<Set<string>>(new Set());
  const [onboardForm, setOnboardForm] = useState<CAClientForm>({
    gstin: '', pan: '', cin: '', client_name: '', client_email: '', client_phone: '',
    sector: 'general',
  });

  // ── Government verification state ───────────────────────────────────────
  type VerifyState = null | 'checking' | { ok: boolean; data: Record<string, string> };
  const [gstinVerify, setGstinVerify] = useState<VerifyState>(null);
  const [panVerify,   setPanVerify]   = useState<VerifyState>(null);
  const [cinVerify,   setCinVerify]   = useState<VerifyState>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-identifier`;

  const verifyField = useCallback(
    (type: 'gstin' | 'pan' | 'cin', value: string, setter: (s: VerifyState) => void) => {
      clearTimeout(debounceRef.current[type]);
      if (!value || value.length < 10) { setter(null); return; }
      debounceRef.current[type] = setTimeout(async () => {
        setter('checking');
        try {
          const res = await fetch(`${VERIFY_URL}?type=${type}&value=${encodeURIComponent(value)}`);
          const d = await res.json();
          setter({ ok: d.success === true, data: d });
          // Auto-fill company name from GSTIN lookup
          if (type === 'gstin' && d.success && (d.legal_name || d.trade_name)) {
            setOnboardForm(prev =>
              prev.client_name ? prev : { ...prev, client_name: d.legal_name || d.trade_name }
            );
          }
        } catch {
          setter({ ok: false, data: { error: 'Verification service unavailable' } });
        }
      }, 700);
    },
    [VERIFY_URL]
  );

  // GSTIN checksum validation (instant, no network)
  const gstinValidation = onboardForm.gstin
    ? (onboardForm.gstin.length === 15 ? validateGSTIN(onboardForm.gstin) : null)
    : null;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [clientData, consentData] = await Promise.all([
      loadCAClients(),
      getPendingConsentRequests(),
    ]);
    
    // Fallback to rich mock portfolio if the Supabase database is fresh/empty
    if (!clientData || clientData.length === 0) {
      setClients([]);
    } else {
      setClients(clientData);
    }
    
    setConsentRequests(consentData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const handleSyncEvents = () => {
      fetchData();
    };
    window.addEventListener('demo-client-added', handleSyncEvents);
    window.addEventListener('swarm-completed-event', handleSyncEvents);
    return () => {
      window.removeEventListener('demo-client-added', handleSyncEvents);
      window.removeEventListener('swarm-completed-event', handleSyncEvents);
    };
  }, [fetchData]);

  // Poll every 30s for consent status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await getPendingConsentRequests();
      setConsentRequests(data);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Demo-mode detection: ONLY /ca-dashboard is demo ──────────────────────
  const isInDemoMode = () => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    return p === '/ca-dashboard' || p === '/ca-dashboard/' || p.startsWith('/ca-dashboard/');
  };

  const handleOnboardClient = async () => {
    // ── Production validation (real dashboards) ──────────────────────────
    if (!isInDemoMode()) {
      const name = onboardForm.client_name.trim();
      const email = onboardForm.client_email.trim();
      const phone = onboardForm.client_phone.trim();
      const gstin = onboardForm.gstin.trim().toUpperCase();
      const pan = onboardForm.pan.trim().toUpperCase();
      const cin = onboardForm.cin.trim().toUpperCase();

      // Block dummy keywords
      const isDummyText = (str: string) => /dummy|test|mock|fake|temp|placeholder|chutiya/i.test(str);
      const isDummyPhone = (num: string) => {
        const cleaned = num.replace(/[\s+-]/g, '');
        return /^(.)\1+$/.test(cleaned) || cleaned.includes('123456') || cleaned.length < 10;
      };

      if (!name) {
        toast.error('Company Name is required');
        return;
      }
      if (name.length < 3 || isDummyText(name)) {
        toast.error('Invalid Company Name', {
          description: 'Please enter a valid, real company name. Dummy or test names are blocked in production.',
        });
        return;
      }

      // Enforce at least one identifier in production
      if (!gstin && !pan && !cin) {
        toast.error('Identifier Required', {
          description: 'Please enter at least one valid company identifier (GSTIN, PAN, or CIN) to onboard.',
        });
        return;
      }

      // Enforce format validation on identifiers if provided
      if (gstin) {
        const gstinVal = validateGSTIN(gstin);
        if (!gstinVal.valid) {
          toast.error('Invalid GSTIN', { description: gstinVal.error || 'Please enter a valid GSTIN.' });
          return;
        }
      }
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        toast.error('Invalid PAN Format', { description: 'PAN must contain 5 letters, 4 digits, and 1 letter.' });
        return;
      }
      if (cin && !/^[ULM][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin)) {
        toast.error('Invalid CIN Format', { description: 'CIN must be a valid 21-digit Corporate Identification Number.' });
        return;
      }

      // Enforce contact
      if (!email && !phone) {
        toast.error('Contact Info Required', {
          description: 'Provide at least one contact method (Email or WhatsApp) to send the consent request.',
        });
        return;
      }

      // Validate contact formats
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || isDummyText(email) || email.includes('@example.com')) {
          toast.error('Invalid Email Address', { description: 'Please enter a valid, real client email address.' });
          return;
        }
      }
      if (phone) {
        const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
        if (!phoneRegex.test(phone) || isDummyText(phone) || isDummyPhone(phone)) {
          toast.error('Invalid Phone Number', { description: 'Please enter a valid 10-digit WhatsApp number.' });
          return;
        }
      }

      const clientName = name;
      setIsOnboarding(true);

      try {
        const result = await initiateConsentRequest({
          gstin: gstin || undefined,
          pan: pan || undefined,
          cin: cin || undefined,
          client_name: clientName,
          client_email: email || undefined,
          client_phone: phone || undefined,
        });

        if (!result.success) {
          toast.error('Failed to onboard client', { description: result.error });
          setIsOnboarding(false);
          return;
        }

        toast.success('Consent Request Sent!', {
          description: `${clientName} will receive an Email${phone ? ' & WhatsApp' : ''} consent link. They appear in your portfolio once authorized.`,
        });

        if (result.emailSent) {
          toast.info('Email dispatched', { description: `Consent email sent to ${email}` });
        }
        if (result.whatsappSent) {
          toast.info('WhatsApp sent', { description: `Consent message sent to ${phone}` });
        }

        // Refresh portfolio + consent list from real DB
        await fetchData();
        setShowOnboardModal(false);
        setIsOnboarding(false);
        setOnboardForm({ gstin: '', pan: '', cin: '', client_name: '', client_email: '', client_phone: '' });
      } catch (err: any) {
        toast.error('Onboarding failed', { description: err?.message || 'Unexpected error. Please try again.' });
        setIsOnboarding(false);
      }
      return;
    }

    // ── DEMO SIMULATION FLOW (CA Demo Dashboard /ca-dashboard only) ───────
    const clientName = onboardForm.client_name.trim() || 'New Client';
    toast.info('Consent Request Sent!', { description: `Waiting for ${clientName} to authorize via Aadhar OTP...` });
    
    setTimeout(() => {
      // Step 2: Client Approves
      toast.success(`${clientName} Approved Consent!`, { description: 'Account Aggregator connection established.' });
      
      setTimeout(() => {
        // Step 3 & 4: Fetch Data & Update Dashboard
        toast.info('AI Swarm Fetching Data...', { description: 'Retrieving 5 years of financial ledgers and tax filings.' });
        
        const newClient: CAClient = {
          id: `demo-auto-${Date.now()}`,
          name: clientName,
          industry: "Technology & Software",
          health: 100,
          risk: "Low",
          gaps: 0,
          deadline: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
          status: "Verified",
          gstin: onboardForm.gstin || "27AABCT1234Q1Z5",
          pan: onboardForm.pan || "AABCT1234Q",
          created_at: new Date().toISOString(),
        };

        setClients(prev => {
          const updated = [newClient, ...prev];
          localStorage.setItem('demo_clients', JSON.stringify(updated));
          localStorage.removeItem('sannidh:ca-swarm-messages');
          localStorage.removeItem('sannidh:ca-swarm-agents');
          localStorage.removeItem('sannidh:ca-swarm-system-status');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('demo-client-added'));
            window.dispatchEvent(new CustomEvent('ca:metrics-updated'));
          }, 100);
          return updated;
        });
        setShowOnboardModal(false);
        setIsOnboarding(false);
        setOnboardForm({ gstin: '', pan: '', cin: '', client_name: '', client_email: '', client_phone: '' });
        
        toast.success('Data Room Populated Successfully', { description: `All 26 modules updated with ${clientName}'s financial data.` });

        // Trigger AI Swarm simulation visually if swarm engine is running and mode is automatic
        const isAutoMode = localStorage.getItem('sannidh:dashboard-mode') === 'auto';
        if (isRunning && isAutoMode) {
          handleSwarm(newClient.id, clientName);
        } else {
          toast.info('Swarm run pending', { 
            description: !isRunning 
              ? 'Swarm engine is off. Please enable it in Settings.' 
              : 'Swarm mode is manual. Run it using the "Run Swarm" button.'
          });
        }

        // Step 5: Simulate Live Bank Transaction after 12 seconds
        setTimeout(() => {
          toast.message('Real-Time Bank Sync Active', { description: 'Monitoring account aggregator streams...' });
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('simulate-bank-transaction', { detail: { client: clientName } }));
          }, 3000);
        }, 12000);

        // Step 6: Simulate Govt Notice scraping after 35 seconds
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('simulate-govt-notice', { detail: { client: clientName } }));
        }, 35000);

      }, 4000); // 4 sec after approval

    }, 3000); // 3 sec after request sent
  };

  const handleSync = async (clientId: string, clientName: string) => {
    setSyncingIds(prev => new Set(prev).add(clientId));
    const result = await triggerSync(clientId);
    if (result.success) {
      toast.success(`Syncing ${clientName}`, {
        description: '⚡ Fetching compliance data from GST Portal & MCA...',
      });

      // Real DB Polling (Every 3 seconds)
      const pollId = setInterval(async () => {
        const { getSyncStatus } = await import('@/services/ca-supabase-service');
        const status = await getSyncStatus(clientId);
        if (status && (status.status === 'completed' || status.status === 'failed')) {
          clearInterval(pollId);
          setSyncingIds(prev => { const s = new Set(prev); s.delete(clientId); return s; });
          if (status.status === 'completed') {
            setSyncedIds(prev => new Set(prev).add(clientId));
            toast.success(`Sync Complete for ${clientName}`);
            fetchData(); // Refresh with new real health score
          } else {
            toast.error(`Sync Failed for ${clientName}`, { description: status.error_message || 'Government API error' });
          }
        }
      }, 3000);
    } else {
      setSyncingIds(prev => { const s = new Set(prev); s.delete(clientId); return s; });
      toast.error('Sync failed', { description: result.error || 'No pending sync job found for this client.' });
    }
  };

  const pendingCount = consentRequests.filter(r => r.consent_status === 'pending').length;

  const getCurrentFY = () => {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${y}-${String(y + 1).slice(-2)}`;
  };

  const handleSwarm = async (clientId: string, clientName: string) => {
    if (!isRunning) {
      toast.error("Swarm engine is off", {
        description: "Please activate the AI Swarm engine in Profile Settings to run the compliance pipeline."
      });
      return;
    }
    const fy = getCurrentFY();
    setSwarmingIds(prev => new Set(prev).add(clientId));
    setSwarmProgress(prev => ({ ...prev, [clientId]: { progress: 0, step: 'starting' } }));
    
    // DEMO BYPASS: Simulate swarm progress for automatically added demo clients
    if (clientId.startsWith('demo-auto-')) {
      toast.success(`AI Swarm started for ${clientName}`, {
        description: `Processing FY ${fy}: bank categorization → books → 26 modules → data room`,
      });
      let progress = 0;
      const steps = ['Reading Ledgers...', 'Categorizing Bank Txns...', 'Populating 26 Modules...', 'Generating Drafts...', 'Finalizing Data Room'];
      
      const interval = setInterval(() => {
        progress += 20;
        const step = steps[Math.min(Math.floor(progress / 20), 4)];
        setSwarmProgress(prev => ({ ...prev, [clientId]: { progress, step } }));
        
        if (progress >= 100) {
          clearInterval(interval);
          setSwarmingIds(prev => { const s = new Set(prev); s.delete(clientId); return s; });
          setSwarmDoneIds(prev => new Set(prev).add(clientId));
          localStorage.setItem(`swarm_completed_${clientId}`, 'true');
          toast.success(`AI Swarm processed for ${clientName}`, { description: 'Data Room Ready' });
        }
      }, 1500);
      return;
    }

    // REAL FLOW
    const result = await triggerSwarm(clientId, fy);
    if (result.success) {
      toast.success(`AI Swarm started for ${clientName}`, {
        description: `Processing FY ${fy}: bank categorization → books → 26 modules → data room`,
      });
      
      // Real DB Polling
      const pollId = setInterval(async () => {
        const status = await getSwarmStatus(clientId);
        if (status) {
          setSwarmProgress(prev => ({ ...prev, [clientId]: { progress: status.progress, step: status.current_step || '' } }));
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'pending_ca_review') {
            clearInterval(pollId);
            setSwarmingIds(prev => { const s = new Set(prev); s.delete(clientId); return s; });
            if (status.status === 'completed' || status.status === 'pending_ca_review') {
              setSwarmDoneIds(prev => new Set(prev).add(clientId));
              toast.success(`AI Swarm processed for ${clientName}`, { description: status.current_step });
            } else {
              toast.error(`Swarm failed for ${clientName}`, { description: status.error_message || 'Unknown error' });
            }
          }
        }
      }, 3000);
    } else {
      setSwarmingIds(prev => { const s = new Set(prev); s.delete(clientId); return s; });
      toast.error('Swarm failed', { description: result.error });
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-foreground">Client Portfolio</h2>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400">Live Database Sync Active</span>
              {governmentApiEnabled && <Badge variant="outline" className="text-xs">Gov API Active</Badge>}
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border text-xs">
                {pendingCount} Pending Consent{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Live client portfolio with consent-based onboarding. Email & WhatsApp notifications sent automatically.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <Button variant="outline" size="sm" onClick={fetchData} className="border-border/50">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
            onClick={() => setShowOnboardModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Pending Consent Requests Panel */}
      {consentRequests.length > 0 && (
        <div className="mb-6 border border-amber-500/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPending(p => !p)}
            className="w-full flex items-center justify-between p-3 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left"
          >
            <span className="text-amber-400 font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Consent Requests ({consentRequests.length})
            </span>
            <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${showPending ? 'rotate-90' : ''}`} />
          </button>
          {showPending && (
            <div className="divide-y divide-amber-500/10">
              {consentRequests.map(req => {
                const cfg = CONSENT_STATUS_CONFIG[req.consent_status];
                const Icon = cfg.icon;
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-amber-500/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{req.client_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {req.client_email && (
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <Mail className="w-3 h-3" />{req.email_sent ? '✓' : '✗'}
                          </span>
                        )}
                        {req.client_phone && (
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <MessageSquare className="w-3 h-3" />{req.whatsapp_sent ? '✓' : '✗'}
                          </span>
                        )}
                        {req.gstin && <span className="text-slate-500 text-xs font-mono">{req.gstin}</span>}
                      </div>
                    </div>
                    <Badge className={`${cfg.cls} border text-xs flex items-center gap-1 ml-3`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Client Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center border border-border/30 rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No clients yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Client" to onboard your first client</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Sector</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Health</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Gaps</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Next Deadline</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Gov Sync</TableHead>
                <TableHead className="text-muted-foreground font-semibold">AI Swarm</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Data Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => {
                    // Fire demo-specific event so CADashboard.tsx can gate features
                    window.dispatchEvent(new CustomEvent('ca:demo-client-sector-selected', {
                      detail: { clientId: client.id, clientName: client.name, sector: client.sector || 'general' }
                    }));
                  }}
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DemoClientSectorBadge
                      clientId={client.id}
                      currentSector={client.sector || 'general'}
                      onSectorChange={(newSector) => {
                        setClients(prev => prev.map(c =>
                          c.id === client.id ? { ...c, sector: newSector } : c
                        ));
                        window.dispatchEvent(new CustomEvent('ca:demo-client-sector-selected', {
                          detail: { clientId: client.id, clientName: client.name, sector: newSector }
                        }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${client.health}%` }} />
                      </div>
                      <span className="text-sm text-foreground">{client.health}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${riskColors[client.risk]} border`}>{client.risk}</Badge>
                  </TableCell>
                  <TableCell><span className="text-foreground font-medium">{client.gaps}</span></TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{client.deadline}
                    </div>
                  </TableCell>
                  <TableCell className={statusColors[client.status] || 'text-muted-foreground'}>{client.status}</TableCell>
                  <TableCell>
                    {syncingIds.has(client.id) ? (
                      <div className="flex items-center gap-1.5 text-cyan-400 text-xs">
                        <Loader className="w-3 h-3 animate-spin" />Syncing...
                      </div>
                    ) : syncedIds.has(client.id) ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" />Synced
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSync(client.id, client.name)}
                        className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        title="Fetch real compliance data from GST Portal & MCA"
                      >
                        <Zap className="w-3 h-3 mr-1" />Sync
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {swarmingIds.has(client.id) ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-purple-400 text-xs">
                          <Loader className="w-3 h-3 animate-spin" />
                          {swarmProgress[client.id]?.step || 'Starting...'}
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${swarmProgress[client.id]?.progress || 0}%` }} />
                        </div>
                      </div>
                    ) : swarmDoneIds.has(client.id) || localStorage.getItem(`swarm_completed_${client.id}`) === 'true' ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3" />Done
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSwarm(client.id, client.name)}
                        className={`h-7 px-2 text-xs hover:bg-purple-500/10 ${
                          !isRunning ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300'
                        }`}
                        title={!isRunning ? "AI Swarm Engine is offline" : "Run AI financial pipeline: categorize → books → 26 modules → data room"}
                      >
                        <Zap className="w-3 h-3 mr-1" />Run Swarm
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {swarmDoneIds.has(client.id) || localStorage.getItem(`swarm_completed_${client.id}`) === 'true' ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">Ready</Badge>
                    ) : swarmingIds.has(client.id) ? (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs">Building...</Badge>
                    ) : (
                      <Badge className="bg-muted/30 text-muted-foreground border-border/30 border text-xs">—</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Client Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showOnboardModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
              onClick={() => setShowOnboardModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Onboard New Client</h3>
                    <p className="text-sm text-muted-foreground">Consent link sent via Email & WhatsApp</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowOnboardModal(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Steps — shown only in CA Demo Dashboard to illustrate workflow simulation */}
                {isInDemoMode() && (
                  <div className="flex items-center gap-2 mb-6 text-xs">
                    {["Enter Details", "Client Consent", "Data Fetch", "Health Score"].map((step, i) => (
                      <div key={step} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        <div className={`flex items-center gap-1 ${i === 0 ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-cyan-500/20' : 'bg-muted/20'}`}>{i + 1}</div>
                          <span className="hidden sm:inline">{step}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Company Identifiers */}
                  <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">Company Identifiers (at least one)</h4>
                    <div className="space-y-3">

                      {/* GSTIN with real-time GST Portal lookup */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">GSTIN</label>
                        <div className="relative">
                          <Input
                            placeholder="e.g., 27AABCA1234C1ZS"
                            value={onboardForm.gstin}
                            onChange={e => {
                              const v = e.target.value.toUpperCase();
                              setOnboardForm(prev => ({ ...prev, gstin: v }));
                              if (v.length === 15 && validateGSTIN(v).valid) {
                                verifyField('gstin', v, setGstinVerify);
                              } else {
                                setGstinVerify(null);
                              }
                            }}
                            className={`bg-card border-border/50 pr-9 font-mono ${
                              gstinValidation?.valid ? 'border-green-500/50' :
                              gstinValidation !== null ? 'border-red-500/50' : ''
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {gstinVerify === 'checking'
                              ? <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                              : gstinVerify && typeof gstinVerify === 'object'
                                ? gstinVerify.ok
                                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                                  : <AlertCircle className="w-4 h-4 text-amber-400" />
                                : onboardForm.gstin.length > 0
                                  ? gstinValidation?.valid
                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                    : onboardForm.gstin.length === 15
                                      ? <XCircle className="w-4 h-4 text-red-400" />
                                      : <AlertCircle className="w-4 h-4 text-amber-400" />
                                  : null}
                          </div>
                        </div>
                        {/* Verification result badges */}
                        {gstinVerify === 'checking' && (
                          <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                            <Loader className="w-3 h-3 animate-spin" />
                            Verifying with Government GST Records...
                          </p>
                        )}
                        {gstinVerify && typeof gstinVerify === 'object' && gstinVerify.ok && (
                          <div className="mt-1.5 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs space-y-0.5">
                            <p className="text-green-400 font-semibold">✅ Verified — {gstinVerify.data.legal_name || gstinVerify.data.trade_name}</p>
                            {gstinVerify.data.trade_name && gstinVerify.data.trade_name !== gstinVerify.data.legal_name && (
                              <p className="text-green-300/70">Trade Name: {gstinVerify.data.trade_name}</p>
                            )}
                            <div className="flex gap-3 mt-1 flex-wrap">
                              {gstinVerify.data.status && <span className="text-green-300/70">Status: {gstinVerify.data.status}</span>}
                              {gstinVerify.data.registration_date && <span className="text-green-300/70">Since: {gstinVerify.data.registration_date}</span>}
                              {gstinVerify.data.business_type && <span className="text-green-300/70">{gstinVerify.data.business_type}</span>}
                            </div>
                            {gstinVerify.data.source && <p className="text-green-300/40 text-[10px]">Source: {gstinVerify.data.source}</p>}
                          </div>
                        )}
                        {gstinVerify && typeof gstinVerify === 'object' && !gstinVerify.ok && (
                          <p className="text-xs text-amber-400 mt-1">⚠️ {gstinVerify.data.error || 'Not found in government records'}</p>
                        )}
                        {!gstinVerify && gstinValidation?.valid && (
                          <p className="text-xs text-green-400 mt-1">✓ Format Valid — {gstinValidation.stateName} · PAN: {gstinValidation.pan}</p>
                        )}
                        {gstinValidation && !gstinValidation.valid && (
                          <p className="text-xs text-red-400 mt-1">✗ {gstinValidation.error}</p>
                        )}
                      </div>

                      {/* PAN with entity-type decode */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">PAN</label>
                          <Input
                            placeholder="e.g., AABCA1234C"
                            value={onboardForm.pan}
                            onChange={e => {
                              const v = e.target.value.toUpperCase();
                              setOnboardForm(prev => ({ ...prev, pan: v }));
                              verifyField('pan', v, setPanVerify);
                            }}
                            className={`bg-card border-border/50 font-mono ${
                              panVerify && typeof panVerify === 'object'
                                ? panVerify.ok ? 'border-green-500/50' : 'border-red-500/50'
                                : ''
                            }`}
                          />
                          {panVerify === 'checking' && (
                            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" />Checking...</p>
                          )}
                          {panVerify && typeof panVerify === 'object' && panVerify.ok && (
                            <p className="text-xs text-green-400 mt-1">✅ {panVerify.data.entity_type}</p>
                          )}
                          {panVerify && typeof panVerify === 'object' && !panVerify.ok && (
                            <p className="text-xs text-red-400 mt-1">✗ Invalid PAN format</p>
                          )}
                        </div>

                        {/* CIN with company metadata decode */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">CIN</label>
                          <Input
                            placeholder="e.g., U74999KA2020PTC..."
                            value={onboardForm.cin}
                            onChange={e => {
                              const v = e.target.value.toUpperCase();
                              setOnboardForm(prev => ({ ...prev, cin: v }));
                              verifyField('cin', v, setCinVerify);
                            }}
                            className={`bg-card border-border/50 font-mono ${
                              cinVerify && typeof cinVerify === 'object'
                                ? cinVerify.ok ? 'border-green-500/50' : 'border-red-500/50'
                                : ''
                            }`}
                          />
                          {cinVerify === 'checking' && (
                            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" />Checking...</p>
                          )}
                          {cinVerify && typeof cinVerify === 'object' && cinVerify.ok && (
                            <p className="text-xs text-green-400 mt-1">✅ {cinVerify.data.entity_type} · {cinVerify.data.state} · Est. {cinVerify.data.incorporated_year}</p>
                          )}
                          {cinVerify && typeof cinVerify === 'object' && !cinVerify.ok && (
                            <p className="text-xs text-red-400 mt-1">✗ Invalid CIN format</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Contact */}
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3">
                      Client Contact (for consent notification)
                      {!isInDemoMode() && <span className="text-red-400 ml-1 font-normal text-xs">— at least Email or WhatsApp required</span>}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                        <Input
                          placeholder="e.g., Acme Technologies Pvt. Ltd."
                          value={onboardForm.client_name}
                          onChange={e => setOnboardForm(prev => ({ ...prev, client_name: e.target.value }))}
                          className="bg-card border-border/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1 block">
                            <Mail className="w-3 h-3" /> Email {!isInDemoMode() && <span className="text-red-400">*</span>}
                          </label>
                          <Input
                            placeholder="finance@company.com"
                            type="email"
                            value={onboardForm.client_email}
                            onChange={e => setOnboardForm(prev => ({ ...prev, client_email: e.target.value }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1 block">
                            <MessageSquare className="w-3 h-3" /> WhatsApp {!isInDemoMode() && <span className="text-red-400">*</span>}
                          </label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={onboardForm.client_phone}
                            onChange={e => setOnboardForm(prev => ({ ...prev, client_phone: e.target.value }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                      </div>
                      {!isInDemoMode() && (
                        <p className="text-xs text-amber-400/80">* At least one of Email or WhatsApp is required so the consent request can be delivered to your client.</p>
                      )}
                    </div>
                  </div>

                  {/* Sector Selection (Demo) */}
                  <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Client Sector
                    </h4>
                    <Select
                      value={onboardForm.sector || 'general'}
                      onValueChange={(val) => setOnboardForm(prev => ({ ...prev, sector: val as ClientSector }))}
                    >
                      <SelectTrigger className="bg-card border-border/50">
                        <SelectValue placeholder="Select sector..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/60">
                        {SELECTABLE_SECTORS.map((s) => {
                          const sc = getSectorConfig(s);
                          return (
                            <SelectItem key={s} value={s} className="text-sm">
                              <span className="mr-2">{sc.emoji}</span>
                              <span className={sc.color}>{sc.label}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Controls which demo features are shown for this mock client.
                    </p>
                  </div>

                  {/* Info */}
                  <div className="p-3 rounded-lg border text-xs bg-blue-500/10 border-blue-500/20 text-blue-300">
                    <p className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {isInDemoMode()
                        ? <span>A secure consent link is sent via Email &amp; WhatsApp. Data is only fetched after the client authorizes.</span>
                        : <span>A real consent link will be sent to your client via Email / WhatsApp. They must approve before their data is fetched. No data is accessed without consent.</span>
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowOnboardModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white border-0"
                      onClick={handleOnboardClient}
                      disabled={isOnboarding}
                    >
                      {isOnboarding
                        ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                        : <><Send className="w-4 h-4 mr-2" />Send Consent Request</>}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

export default ClientPortfolioSection;
