import { useState, useEffect } from 'react';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Activity, Users, FileText, ShieldCheck, FolderLock,
  Building2, Menu, X, LogOut, ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Firm Dashboard Modules
import FirmOverviewPulse from '@/components/ca-firm-dashboard/FirmOverviewPulse';
import TeamResourceAllocation from '@/components/ca-firm-dashboard/TeamResourceAllocation';
import PracticeBillingWIP from '@/components/ca-firm-dashboard/PracticeBillingWIP';
import ICAIQualityControl from '@/components/ca-firm-dashboard/ICAIQualityControl';
import FirmDocumentVault from '@/components/ca-firm-dashboard/FirmDocumentVault';
import FirmClientManagement from '@/components/ca-firm-dashboard/FirmClientManagement';

const menuItems = [
  { id: 'pulse', label: 'Firm Overview', icon: Activity },
  { id: 'clients', label: 'Client Management', icon: Building2 },
  { id: 'team', label: 'Resource Allocation', icon: Users },
  { id: 'billing', label: 'WIP & Billing', icon: FileText },
  { id: 'quality', label: 'ICAI / SQC-1', icon: ShieldCheck },
  { id: 'vault', label: 'Document Vault', icon: FolderLock },
];

export function CAFirmDashboardReal() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pulse');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Resolve actual Supabase user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setSupabaseUserId(data.user.id);
      }
    });
  }, []);

  // firmId: prefer real Supabase user ID, fall back to persona session ID
  const firmId = supabaseUserId || currentUser?.id || currentUser?.companyId || '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const firmName = currentUser?.companyName || 'CA Firm';
  const userEmail = currentUser?.email || '';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-300 font-sans">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full bg-[#0c0c14]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Firm Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-bold text-base leading-none block">{firmName}</span>
                <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">
                  Sannidh FirmOS · CA Firm Dashboard
                </span>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/50 rounded-full px-3 py-1.5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-300 truncate max-w-[160px]">{userEmail}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/5"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>

            {/* Mobile Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/5 bg-slate-900/80 backdrop-blur-lg z-30 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === item.id
                        ? 'bg-indigo-500/15 text-indigo-300'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="border-t border-white/5 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24 space-y-0.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {!firmId ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading your firm workspace...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'pulse' && <FirmOverviewPulse firmId={firmId} />}
                {activeTab === 'clients' && <FirmClientManagement firmId={firmId} />}
                {activeTab === 'team' && <TeamResourceAllocation firmId={firmId} />}
                {activeTab === 'billing' && <PracticeBillingWIP firmId={firmId} />}
                {activeTab === 'quality' && <ICAIQualityControl firmId={firmId} />}
                {activeTab === 'vault' && <FirmDocumentVault />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
