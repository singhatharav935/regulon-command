import { useState, useEffect, useMemo } from 'react';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  LayoutDashboard, Users, Building2, Receipt, ShieldCheck,
  FileArchive, LogOut, Bell, Settings, ChevronRight, Menu, X,
  TrendingUp, AlertTriangle, Clock, IndianRupee, Zap
} from 'lucide-react';
import { useFirmMembers, useFirmClients, useFirmInvoices } from '@/hooks/personas/useCAFirmData';
import { getStatutoryDeadlines } from '@/services/ca-supabase-service';

// Lazy-load heavy modules
import FirmPulseHome from '@/components/ca-firm-dashboard/FirmPulseHome';
import FirmClientManagement from '@/components/ca-firm-dashboard/FirmClientManagement';
import TeamResourceAllocation from '@/components/ca-firm-dashboard/TeamResourceAllocation';
import PracticeBillingWIP from '@/components/ca-firm-dashboard/PracticeBillingWIP';
import ICAIQualityControl from '@/components/ca-firm-dashboard/ICAIQualityControl';
import FirmDocumentVault from '@/components/ca-firm-dashboard/FirmDocumentVault';

function getStableFirmId(email: string): string {
  const key = `sfid_${email}`;
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  let h = 0x811c9dc5;
  for (let i = 0; i < email.length; i++) { h ^= email.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  const hex = h.toString(16).padStart(8, '0');
  const pre = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8).padEnd(8, '0').toLowerCase();
  const id = `${pre.slice(0,4)}-${pre.slice(4,8)}-${hex.slice(0,4)}-${hex.slice(4,8)}-${hex}${hex}`;
  localStorage.setItem(key, id);
  return id;
}

const NAV = [
  { id: 'home',     label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'clients',  label: 'Client Management',  icon: Building2 },
  { id: 'team',     label: 'Team & Allocation',  icon: Users },
  { id: 'billing',  label: 'Billing & WIP',      icon: Receipt },
  { id: 'quality',  label: 'ICAI / SQC-1',       icon: ShieldCheck },
  { id: 'vault',    label: 'Document Vault',      icon: FileArchive },
];

export function CAFirmDashboardReal() {
  const { currentUser, logout: personaLogout } = usePersonaAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  // Fetch Supabase user on mount (primary auth source)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setSupabaseUser(data.user);
    });
  }, []);

  // Role-based access control — redirect if not ca_firm
  useEffect(() => {
    const userRole = localStorage.getItem("current_user_role");
    if (userRole && userRole !== "ca_firm") {
      navigate("/dashboard");
      return;
    }
  }, [navigate]);

  // Use Supabase user email/id first, fallback to persona auth
  const email = supabaseUser?.email || currentUser?.email || '';
  const supabaseUid = supabaseUser?.id || null;
  const firmId = supabaseUid || (email ? getStableFirmId(email) : '');
  const firmName = supabaseUser?.user_metadata?.verification_entity_name || currentUser?.companyName || 'My CA Firm';

  const { data: members } = useFirmMembers(firmId);
  const { data: clients } = useFirmClients(firmId);
  const { data: invoices } = useFirmInvoices(firmId);
  const deadlines = useMemo(() => getStatutoryDeadlines(), []);
  const urgent = deadlines.filter(d => d.status === 'urgent' || d.status === 'overdue');

  const totalRevenue = useMemo(() =>
    (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);
  const unpaid = useMemo(() =>
    (invoices || []).filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);

  const kpis = [
    { label: 'Active Clients', value: (clients || []).length, sub: `${(clients||[]).filter(c=>c.status==='active').length} live`, icon: Building2, color: 'blue' },
    { label: 'Team Members', value: (members || []).length, sub: `${(members||[]).filter(m=>m.status==='active').length} active`, icon: Users, color: 'violet' },
    { label: 'Revenue Collected', value: `₹${(totalRevenue/100000).toFixed(1)}L`, sub: `₹${(unpaid/100000).toFixed(1)}L pending`, icon: IndianRupee, color: 'emerald' },
    { label: 'Urgent Deadlines', value: urgent.length, sub: 'next 7 days', icon: AlertTriangle, color: urgent.length > 0 ? 'rose' : 'slate' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-blue-400 shadow-blue-500/20',
    violet: 'from-violet-600 to-violet-400 shadow-violet-500/20',
    emerald: 'from-emerald-600 to-emerald-400 shadow-emerald-500/20',
    rose: 'from-rose-600 to-rose-400 shadow-rose-500/20',
    slate: 'from-slate-600 to-slate-400 shadow-slate-500/20',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Shared Navbar — matches External/InHouse CA dashboards */}
      <Navbar />

      {/* Dashboard body — sidebar + main content below navbar */}
      <div className="flex flex-1 pt-20 overflow-hidden" style={{ minHeight: 'calc(100vh - 5rem)' }}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex flex-col bg-card/60 backdrop-blur-md border-r border-border/40 overflow-hidden shrink-0 z-30"
            >
              {/* Firm identity */}
              <div className="px-5 py-5 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-sm leading-tight truncate max-w-[140px]">{firmName}</p>
                    <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-semibold">FirmOS · Enterprise</p>
                  </div>
                </div>
              </div>

              {/* KPI Mini Strip */}
              <div className="px-3 py-3 border-b border-border/30 grid grid-cols-2 gap-2">
                {kpis.map((k, i) => {
                  const Icon = k.icon;
                  return (
                    <div key={i} className="bg-background/40 rounded-lg p-2 text-center border border-border/20">
                      <p className="text-foreground font-bold text-base leading-none">{k.value}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{k.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(item => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-card/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className="truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                    </button>
                  );
                })}
              </nav>

              {/* Compact user indicator */}
              <div className="px-3 py-3 border-t border-border/30">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/30 border border-border/20">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                    {email?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{email || 'CA Partner'}</p>
                    <p className="text-[9px] text-muted-foreground">ca_firm · Admin</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Sub-header bar */}
          <header className="flex items-center gap-4 px-6 h-14 bg-card/40 backdrop-blur-xl border-b border-border/30 shrink-0">
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {NAV.find(n => n.id === tab)?.label}
              </span>
            </div>

            {/* Urgent alert */}
            {urgent.length > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs text-rose-400 font-medium">{urgent.length} Urgent Deadline{urgent.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {!firmId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground text-sm">Initialising your firm workspace...</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.16 }}
                  className="h-full"
                >
                  {tab === 'home'    && <FirmPulseHome firmId={firmId} kpis={kpis} colorMap={colorMap} urgent={urgent} />}
                  {tab === 'clients' && <FirmClientManagement firmId={firmId} />}
                  {tab === 'team'    && <TeamResourceAllocation firmId={firmId} />}
                  {tab === 'billing' && <PracticeBillingWIP firmId={firmId} />}
                  {tab === 'quality' && <ICAIQualityControl firmId={firmId} />}
                  {tab === 'vault'   && <FirmDocumentVault />}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>

      {/* Shared Footer — matches External/InHouse CA dashboards */}
      <Footer />
    </div>
  );
}

export default CAFirmDashboardReal;
