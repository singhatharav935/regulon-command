/**
 * ComplianceModulesHub — REAL PRODUCTION v2.0
 * ✅ THIS FILE IS FOR THE REAL EXTERNAL CA DASHBOARD ONLY.
 * Data source: Supabase (real company/client data) — no localStorage.
 * Demo version: src/components/ca-dashboard-demo/compliance-modules/ComplianceModulesHub.tsx
 *
 * 70+ compliance forms in 5 department tabs.
 * Includes Auto-Pilot mode: calculate all forms → save PDFs to client data room.
 */
import React, { useState, useCallback, useRef, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calculator, FileText, Users, BarChart3, PieChart,
  FolderCheck, AlertTriangle, Building2, IndianRupee,
  ChevronRight, Sparkles, GitCompare, Calendar, ScanLine,
  Globe, Anchor, DollarSign, FileSignature, Fingerprint,
  Database, Landmark, TrendingUp, Shield, Scale,
  Receipt, CreditCard, ArrowLeftRight, FileCog, UserCheck,
  FileCheck, BookOpen, Layers, Lock, BadgeCheck,
  ClipboardList, HeartHandshake, Banknote, ScrollText,
  Bot, Play, Square, ExternalLink, CheckCircle2, Clock3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const GSTR1Panel                  = lazy(() => import('./GSTR1Panel'));
const GSTR2BPanel                 = lazy(() => import('./GSTR2BPanel'));
const GSTR3BPanel                 = lazy(() => import('./GSTR3BPanel'));
const ITRPanel                    = lazy(() => import('./ITRPanel'));
const EPFESIPanel                 = lazy(() => import('./EPFESIPanel'));
const FinancialsPanel             = lazy(() => import('./FinancialsPanel'));
const NoticeTrackerPanel          = lazy(() => import('./NoticeTrackerPanel'));
const DebtorsAgingPanel           = lazy(() => import('./DebtorsAgingPanel'));
const AuditFilePanel              = lazy(() => import('./AuditFilePanel'));
const BoardMeetingsPanel          = lazy(() => import('./BoardMeetingsPanel'));
const InvoiceParserPanel          = lazy(() => import('./InvoiceParserPanel'));
const FEMASEBIPanel               = lazy(() => import('./FEMASEBIPanel'));
const ImportExportPanel           = lazy(() => import('./ImportExportPanel'));
const ProfessionalCQCPanel        = lazy(() => import('./ProfessionalCQCPanel'));
const SalaryTDSPanel              = lazy(() => import('./SalaryTDSPanel'));
const GratuityPanel               = lazy(() => import('./GratuityPanel'));
const BoardResolutionsPanel       = lazy(() => import('./BoardResolutionsPanel'));
const AGMMinutesPanel             = lazy(() => import('./AGMMinutesPanel'));
const MCAForm20BPanel             = lazy(() => import('./MCAForm20BPanel'));
const DINTANRenewalPanel          = lazy(() => import('./DINTANRenewalPanel'));
const AccountingSoftwareSync      = lazy(() => import('./AccountingSoftwareSync'));
const BankReconciliationAutomator = lazy(() => import('./BankReconciliationAutomator'));
const RegimeOptimizerPanel        = lazy(() => import('./RegimeOptimizerPanel'));
const CapitalGainsPanel           = lazy(() => import('./CapitalGainsPanel'));
const AdvanceTaxRadarPanel        = lazy(() => import('./AdvanceTaxRadarPanel'));
const DeferredTaxDepreciationPanel= lazy(() => import('./DeferredTaxDepreciationPanel'));

import {
  DIRECT_TAX as DT_META,
  INDIRECT_TAX as IT_META,
  CORPORATE_LAW as CL_META,
  LABOR_LAWS as LL_META,
  FEMA_RBI as FR_META,
  FormModuleMetadata
} from '@/lib/compliance-modules-metadata';

const GenericCompliancePanel = lazy(() => import('./GenericCompliancePanel'));

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  'itr34': ITRPanel,
  'form3cd': AuditFilePanel,
  'deferred-tax': DeferredTaxDepreciationPanel,
  'form24q': SalaryTDSPanel,
  'form26q': SalaryTDSPanel,
  'challan280': AdvanceTaxRadarPanel,
  'regime-optimizer': RegimeOptimizerPanel,
  'capital-gains': CapitalGainsPanel,
  'advance-tax-radar': AdvanceTaxRadarPanel,
  'notices': NoticeTrackerPanel,
  'gstr1': GSTR1Panel,
  'gstr2b': GSTR2BPanel,
  'gstr3b': GSTR3BPanel,
  'gst-import-export': ImportExportPanel,
  'mgt7': MCAForm20BPanel,
  'mgt15': AGMMinutesPanel,
  'pas3': BoardResolutionsPanel,
  'dir3kyc': DINTANRenewalPanel,
  'mgt14': BoardResolutionsPanel,
  'financials': FinancialsPanel,
  'debtors': DebtorsAgingPanel,
  'bank-rec-auto': BankReconciliationAutomator,
  'prof-cqc': ProfessionalCQCPanel,
  'invoice': InvoiceParserPanel,
  'epf-ecr': EPFESIPanel,
  'pf12a': EPFESIPanel,
  'esic-return': EPFESIPanel,
  'salary-tds': SalaryTDSPanel,
  'gratuity': GratuityPanel,
  'board-meetings': BoardMeetingsPanel,
  'fema-sebi': FEMASEBIPanel,
  'accounting-sync': AccountingSoftwareSync,
};

interface FormModule {
  id: string;
  label: string;
  subLabel: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  badge?: string;
  isNew?: boolean;
  isLive?: boolean;
  component?: React.ComponentType<{ 
    clientId?: string; 
    isDemo?: boolean; 
    formId?: string;
    formCode?: string;
    formLabel?: string;
    formDescription?: string;
    onSaved?: () => void 
  }>;
}

interface DepartmentTab {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  modules: FormModule[];
}

const buildModules = (metaList: FormModuleMetadata[]): FormModule[] => {
  return metaList.map(m => ({
    ...m,
    isLive: true,
    component: COMPONENT_MAP[m.id] || GenericCompliancePanel
  }));
};

const DIRECT_TAX = buildModules(DT_META);
const INDIRECT_TAX = buildModules(IT_META);
const CORPORATE_LAW = buildModules(CL_META);
const LABOR_LAWS = buildModules(LL_META);
const FEMA_RBI = buildModules(FR_META);

const DEPARTMENT_TABS: DepartmentTab[] = [
  { id:'direct-tax',  label:'Direct Tax',         shortLabel:'Direct Tax', icon:FileText,    color:'text-purple-400', bgColor:'bg-purple-500/20', borderColor:'border-purple-500/40', modules:DIRECT_TAX },
  { id:'indirect-tax',label:'Indirect Tax (GST)', shortLabel:'GST',        icon:IndianRupee, color:'text-green-400',  bgColor:'bg-green-500/20',  borderColor:'border-green-500/40',  modules:INDIRECT_TAX },
  { id:'corporate',   label:'Corporate Law',      shortLabel:'Corp Law',   icon:Building2,   color:'text-amber-400', bgColor:'bg-amber-500/20',  borderColor:'border-amber-500/40',  modules:CORPORATE_LAW },
  { id:'labor',       label:'Labor Laws',         shortLabel:'Labor',      icon:Users,       color:'text-cyan-400',  bgColor:'bg-cyan-500/20',   borderColor:'border-cyan-500/40',   modules:LABOR_LAWS },
  { id:'fema-rbi',    label:'FEMA & RBI',         shortLabel:'FEMA/RBI',   icon:Globe,       color:'text-emerald-400',bgColor:'bg-emerald-500/20',borderColor:'border-emerald-500/40',modules:FEMA_RBI },
];

const TOTAL_FORMS = DEPARTMENT_TABS.reduce((acc, d) => acc + d.modules.length, 0);
const LIVE_COUNT  = DEPARTMENT_TABS.reduce((acc, d) => acc + d.modules.filter(m => m.isLive).length, 0);

const PanelFallback = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center text-muted-foreground">
      <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse opacity-50" />
      <p className="text-sm">Loading module...</p>
    </div>
  </div>
);


export default function ComplianceModulesHub({
  demoClients,
  isDemo,
}: {
  demoClients?: { id: string; name: string }[];
  isDemo?: boolean;
}) {
  const [activeDept,    setActiveDept]    = useState<string>('direct-tax');
  const [activeModule,  setActiveModule]  = useState<string | null>(null);
  const [selectedClient,setSelectedClient]= useState<string>('');
  const [clients,       setClients]       = useState<{ id: string; name: string }[]>([]);
  const [loading,       setLoading]       = useState(true);

  // ── Auto-Pilot state (real dashboard only) ───────────────────────────────
  const [autoPilotOn,   setAutoPilotOn]   = useState(false);
  const [autoRunning,   setAutoRunning]   = useState(false);
  const [autoProgress,  setAutoProgress]  = useState({ completed: 0, total: 0, current: '', done: false, errors: [] as string[] });
  const [completions,   setCompletions]   = useState<Record<string, { pdf_url: string; calculated_at: string }>>({});
  const [financialYear, setFinancialYear] = useState<string>('2024-25');
  const autoAbort = useRef(false);

  // Load completions when client changes
  useEffect(() => {
    if (!selectedClient || isDemo) return;
    import('@/lib/form-pdf-utils').then(({ getClientFormCompletions }) => {
      getClientFormCompletions(selectedClient, financialYear).then(setCompletions);
    });
  }, [selectedClient, financialYear, isDemo]);

  const startAutoPilot = useCallback(async () => {
    if (!selectedClient) { toast.error('Select a client first'); return; }
    const clientName = clients.find(c => c.id === selectedClient)?.name ?? selectedClient;
    autoAbort.current = false;
    setAutoRunning(true);
    setAutoProgress({ completed: 0, total: 0, current: 'Initialising...', done: false, errors: [] });
    toast.info(`Auto-Pilot started for ${clientName} · FY ${financialYear}`);
    try {
      const { runAutoPilot } = await import('@/services/compliance-auto-engine');
      await runAutoPilot(selectedClient, clientName, financialYear, (progress) => {
        if (autoAbort.current) return;
        setAutoProgress(progress);
        if (progress.done) {
          setAutoRunning(false);
          toast.success(`Auto-Pilot complete! ${progress.completed} forms calculated and saved to data room.`);
          // Refresh completions
          import('@/lib/form-pdf-utils').then(({ getClientFormCompletions }) => {
            getClientFormCompletions(selectedClient, financialYear).then(setCompletions);
          });
        }
      });
    } catch (err) {
      setAutoRunning(false);
      toast.error('Auto-Pilot encountered an error. Check console.');
    }
  }, [selectedClient, clients, financialYear, isDemo]);

  const stopAutoPilot = useCallback(() => {
    autoAbort.current = true;
    setAutoRunning(false);
    toast.warning('Auto-Pilot stopped.');
  }, []);

  React.useEffect(() => {
    const isDemoMode = isDemo !== undefined
      ? isDemo
      : typeof window !== 'undefined' && window.location.pathname.startsWith('/ca-dashboard');

    if (demoClients) { setClients(demoClients); setLoading(false); return; }

    const loadClients = async () => {
      if (isDemoMode) {
        try {
          const saved = localStorage.getItem('demo_clients');
          if (saved) {
            const parsed = JSON.parse(saved);
            setClients(parsed.map((c: any) => ({ id: c.id || 'demo-client', name: c.name || c.client_name || 'Demo Client' })));
          }
        } catch (e) {}
        setLoading(false);
      } else {
        try {
          const { loadCAClients } = await import('@/services/ca-supabase-service');
          const dbClients = await loadCAClients();
          setClients(dbClients.map((c: any) => ({ id: c.id, name: c.name })));
        } catch (error) { console.error('Error loading CA clients:', error); }
        finally { setLoading(false); }
      }
    };
    loadClients();
  }, [demoClients, isDemo]);

  const currentDept     = DEPARTMENT_TABS.find(d => d.id === activeDept)!;
  const activeModInfo   = activeModule ? currentDept.modules.find(m => m.id === activeModule) : null;
  const ActiveComponent = activeModInfo?.component ?? null;

  const handleDeptChange = (deptId: string) => { setActiveDept(deptId); setActiveModule(null); };

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold">Statutory Forms Console</h3>
          <p className="text-xs text-muted-foreground">{TOTAL_FORMS} forms across 5 departments · Auto-populated from Sannidh ledger</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{LIVE_COUNT} Live Panels</Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{TOTAL_FORMS} Total Forms</Badge>
          {Object.keys(completions).length > 0 && (
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1 inline" />
              {Object.keys(completions).length} Saved to Data Room
            </Badge>
          )}
        </div>
      </div>

      {/* ── Client + FY Selector ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30 flex-1 min-w-[200px]">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
                <SelectValue placeholder={loading ? 'Loading clients...' : 'Select client to run calculations...'} />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                {!loading && clients.length === 0 && (
                  <div className="p-2 text-xs text-muted-foreground text-center">No clients found. Add clients in portfolio.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedClient && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">Active</Badge>}
        </div>

        <div className="flex items-center gap-2 p-3 bg-card/30 rounded-xl border border-border/30">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={financialYear} onValueChange={setFinancialYear}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['2024-25','2023-24','2022-23'].map(fy => (
                <SelectItem key={fy} value={fy}>FY {fy}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── AUTO-PILOT / MANUAL MODE CONTROL ── */}
      <div className={`rounded-xl border p-4 transition-all duration-200 ${
        autoPilotOn ? 'border-violet-500/40 bg-violet-500/5' : 'border-border/30 bg-card/20'
      }`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${autoPilotOn ? 'bg-violet-500/20' : 'bg-muted/30'}`}>
              <Bot className={`w-4 h-4 ${autoPilotOn ? 'text-violet-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Sannidh Auto-Pilot</span>
                <Badge className={`text-[9px] px-1.5 py-0 ${
                  autoPilotOn
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                    : 'bg-muted/50 text-muted-foreground border-border/30'
                }`}>
                  {autoPilotOn ? 'AUTOMATIC' : 'MANUAL'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {autoPilotOn
                  ? autoRunning
                    ? `⚙ Processing: ${autoProgress.current}`
                    : autoProgress.done
                      ? `✅ ${autoProgress.completed}/${autoProgress.total} forms done · PDFs saved to client data room`
                      : 'Ready — click "Run All" to auto-calculate every form'
                  : 'Manual Mode: click any LIVE panel to calculate and export individually'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ON/OFF Toggle */}
            <button
              onClick={() => setAutoPilotOn(prev => !prev)}
              aria-label="Toggle Auto-Pilot"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${autoPilotOn ? 'bg-violet-500' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${autoPilotOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>

            {autoPilotOn && !autoRunning && (
              <Button
                size="sm"
                onClick={startAutoPilot}
                disabled={!selectedClient}
                className="bg-violet-500 hover:bg-violet-600 text-white text-xs h-8 px-3 gap-1.5"
              >
                <Play className="w-3 h-3" />
                Run All
              </Button>
            )}

            {autoRunning && (
              <Button
                size="sm"
                variant="outline"
                onClick={stopAutoPilot}
                className="text-xs h-8 px-3 gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                <Square className="w-3 h-3" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar — visible while running or after completion */}
        {autoPilotOn && (autoRunning || autoProgress.done) && autoProgress.total > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span className="font-medium">{autoProgress.completed} / {autoProgress.total} forms calculated</span>
              <span>{Math.round((autoProgress.completed / autoProgress.total) * 100)}%</span>
            </div>
            <Progress value={(autoProgress.completed / autoProgress.total) * 100} className="h-2" />
            {autoProgress.errors.length > 0 && (
              <p className="text-[10px] text-amber-400 mt-1">
                ⚠ {autoProgress.errors.length} form(s) had errors — check Supabase Storage bucket &amp; permissions
              </p>
            )}
          </div>
        )}

        {/* Manual mode explanation */}
        {!autoPilotOn && (
          <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/20">
            <span className="font-medium text-foreground/80">How it works:</span> Click a{' '}
            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">LIVE</Badge>{' '}
            form card below → fill/verify data → click "Export Government PDF" → PDF is automatically saved to this client's data room.
          </p>
        )}
      </div>

      {/* ── Department Tabs ── */}
      {!activeModule && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DEPARTMENT_TABS.map(dept => {
            const DeptIcon = dept.icon;
            const isActive = activeDept === dept.id;
            const deptCompleted = dept.modules.filter(m => completions[m.id]).length;
            return (
              <button
                key={dept.id}
                onClick={() => handleDeptChange(dept.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? `${dept.bgColor} ${dept.color} ${dept.borderColor} shadow-sm`
                    : 'bg-card/30 text-muted-foreground border-border/30 hover:bg-card/60 hover:text-foreground'
                }`}
              >
                <DeptIcon className="w-3.5 h-3.5 shrink-0" />
                {dept.shortLabel}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-border/40'}`}>
                  {dept.modules.length}
                </span>
                {deptCompleted > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    ✓{deptCompleted}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content Area ── */}
      <AnimatePresence mode="wait">
        {!activeModule ? (
          /* GRID VIEW */
          <motion.div
            key={`grid-${activeDept}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* Dept sub-header */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${currentDept.borderColor} ${currentDept.bgColor} mb-4`}>
              <currentDept.icon className={`w-5 h-5 ${currentDept.color}`} />
              <div className="flex-1">
                <h4 className={`font-bold text-sm ${currentDept.color}`}>{currentDept.label} Console</h4>
                <p className="text-xs text-muted-foreground">
                  {currentDept.modules.length} forms · {currentDept.modules.filter(m => m.isLive).length} live panels
                  {currentDept.modules.filter(m => completions[m.id]).length > 0 && (
                    <span className="text-emerald-400 ml-2">
                      · {currentDept.modules.filter(m => completions[m.id]).length} in data room
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Form cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentDept.modules.map((mod, i) => {
                const completion = completions[mod.id];
                const isCompleted = !!completion;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.022 }}
                    className={`relative rounded-xl border transition-all group ${
                      isCompleted
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : mod.isLive
                          ? 'border-border/30 bg-card/30 hover:bg-card/60 hover:border-border/60'
                          : 'border-border/20 bg-card/10 opacity-65'
                    }`}
                  >
                    {/* Completion tick */}
                    {isCompleted && (
                      <div className="absolute top-2.5 right-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}

                    <button
                      onClick={() => mod.isLive && setActiveModule(mod.id)}
                      className={`w-full text-left p-4 ${mod.isLive ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${mod.bgColor} shrink-0 mt-0.5`}>
                          <mod.icon className={`w-4 h-4 ${mod.color}`} />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm leading-tight">{mod.label}</span>
                            {mod.isLive && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">LIVE</Badge>}
                            {mod.isNew && <Badge className="text-[9px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>}
                            {isCompleted && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Calculated</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 mb-1">
                            <code className="text-[10px] text-muted-foreground/60 bg-muted/30 px-1.5 rounded">{mod.subLabel}</code>
                            {mod.badge && <Badge variant="outline" className="text-[9px] px-1.5 py-0 opacity-70">{mod.badge}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{mod.description}</p>
                        </div>
                        {mod.isLive && !isCompleted && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>

                    {/* PDF link for completed forms */}
                    {isCompleted && completion.pdf_url && (
                      <div className="px-4 pb-3 flex items-center gap-2 -mt-1">
                        <a
                          href={completion.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View PDF in Data Room
                        </a>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          <Clock3 className="w-2.5 h-2.5 inline mr-0.5" />
                          {new Date(completion.calculated_at).toLocaleDateString('en-IN')}
                        </span>
                        {mod.isLive && (
                          <button
                            onClick={() => setActiveModule(mod.id)}
                            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Re-calculate →
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* PANEL VIEW — manual mode */
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <button
              onClick={() => setActiveModule(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to {currentDept.label} console
            </button>

            {activeModInfo && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${currentDept.borderColor} ${currentDept.bgColor}`}>
                <div className={`p-2 rounded-lg ${activeModInfo.bgColor}`}>
                  <activeModInfo.icon className={`w-5 h-5 ${activeModInfo.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{activeModInfo.label}</h3>
                    <code className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 rounded">{activeModInfo.subLabel}</code>
                    {activeModInfo.isNew && <Badge className="text-[9px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30">New</Badge>}
                    {completions[activeModInfo.id] && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✓ In Data Room</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{activeModInfo.description}</p>
                </div>
                {completions[activeModInfo.id]?.pdf_url && (
                  <a
                    href={completions[activeModInfo.id].pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg px-3 py-1.5 shrink-0 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Saved PDF
                  </a>
                )}
              </div>
            )}

            {!selectedClient ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/30 rounded-xl bg-card/10">
                <Building2 className="w-10 h-10 mb-3 text-muted-foreground opacity-30" />
                <h4 className="text-base font-semibold text-muted-foreground">Select a Client First</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mx-auto">
                  Select an active client above to load the {activeModInfo?.label} workspace.
                </p>
              </div>
            ) : (
              <Suspense fallback={<PanelFallback />}>
                {ActiveComponent && (
                  /* REAL DASHBOARD: isDemo=false — Supabase data only, saves PDF to data room */
                  <ActiveComponent
                    clientId={selectedClient}
                    isDemo={false}
                    formId={activeModule ?? undefined}
                    formCode={activeModInfo?.subLabel}
                    formLabel={activeModInfo?.label}
                    formDescription={activeModInfo?.description}
                    onSaved={() => {
                      import('@/lib/form-pdf-utils').then(({ getClientFormCompletions }) => {
                        getClientFormCompletions(selectedClient, financialYear).then(setCompletions);
                      });
                    }}
                  />
                )}
              </Suspense>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
