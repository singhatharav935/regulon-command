/**
 * ComplianceModulesHub
 * Master hub — all 19 compliance feature modules across 11 panels.
 * Integrated into the AI Drafting Engine → "Calculators & Forms" tab.
 * No existing features modified.
 */
import React, { useState, Suspense, lazy } from 'react';
import { isCABackendConfigured } from '@/lib/ca-backend-guard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, FileText, Users, BarChart3, PieChart,
  FolderCheck, AlertTriangle, Building2, IndianRupee,
  ChevronRight, Sparkles, GitCompare, Calendar, ScanLine, Globe, Anchor,
  DollarSign, FileSignature, Fingerprint, Database, Landmark, TrendingUp
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Lazy load all 11 panels
const GSTR1Panel       = lazy(() => import('./GSTR1Panel'));
const GSTR2BPanel      = lazy(() => import('./GSTR2BPanel'));
const GSTR3BPanel      = lazy(() => import('./GSTR3BPanel'));
const ITRPanel         = lazy(() => import('./ITRPanel'));
const EPFESIPanel      = lazy(() => import('./EPFESIPanel'));
const FinancialsPanel  = lazy(() => import('./FinancialsPanel'));
const NoticeTrackerPanel  = lazy(() => import('./NoticeTrackerPanel'));
const DebtorsAgingPanel   = lazy(() => import('./DebtorsAgingPanel'));
const AuditFilePanel      = lazy(() => import('./AuditFilePanel'));
const BoardMeetingsPanel  = lazy(() => import('./BoardMeetingsPanel'));
const InvoiceParserPanel  = lazy(() => import('./InvoiceParserPanel'));
const FEMASEBIPanel       = lazy(() => import('./FEMASEBIPanel'));
const ImportExportPanel   = lazy(() => import('./ImportExportPanel'));
const ProfessionalCQCPanel= lazy(() => import('./ProfessionalCQCPanel'));

// The final 6 100% Completion Modules
const SalaryTDSPanel      = lazy(() => import('./SalaryTDSPanel'));
const GratuityPanel       = lazy(() => import('./GratuityPanel'));
const BoardResolutionsPanel= lazy(() => import('./BoardResolutionsPanel'));
const AGMMinutesPanel     = lazy(() => import('./AGMMinutesPanel'));
const MCAForm20BPanel     = lazy(() => import('./MCAForm20BPanel'));
const DINTANRenewalPanel  = lazy(() => import('./DINTANRenewalPanel'));

// Phase 5: Advanced Setup
const AccountingSoftwareSync = lazy(() => import('./AccountingSoftwareSync'));
const BankReconciliationAutomator = lazy(() => import('./BankReconciliationAutomator'));

// Phase 6: Advanced Optimizer Suite
const RegimeOptimizerPanel       = lazy(() => import('./RegimeOptimizerPanel'));
const CapitalGainsPanel          = lazy(() => import('./CapitalGainsPanel'));
const AdvanceTaxRadarPanel       = lazy(() => import('./AdvanceTaxRadarPanel'));
const DeferredTaxDepreciationPanel = lazy(() => import('./DeferredTaxDepreciationPanel'));

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string);

interface Module {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  badge?: string;
  isNew?: boolean;
  component: React.ComponentType<{ clientId?: string }>;
}

const MODULES: Module[] = [
  // ... (keeping MODULES exactly as they were)
  // ── GST ────────────────────────────────────────────────
  {
    id: 'gstr1',
    label: 'GSTR-1 Generator',
    description: 'Upload invoice CSV → auto-calculate CGST/SGST/IGST, validate GSTINs, flag duplicates',
    icon: Calculator, color: 'text-green-400', bgColor: 'bg-green-500/20', badge: 'GST',
    component: GSTR1Panel,
  },
  {
    id: 'gstr2b',
    label: 'GSTR-2B Reconciliation',
    description: 'Purchase Register vs Portal → flag missing invoices & ITC mismatches with action steps',
    icon: GitCompare, color: 'text-violet-400', bgColor: 'bg-violet-500/20', badge: 'GST', isNew: true,
    component: GSTR2BPanel,
  },
  {
    id: 'gstr3b',
    label: 'GSTR-3B Net Tax Calculator',
    description: 'Outward Tax − ITC = Net Payable. DRC-01 alert automatically if ITC > 50%',
    icon: IndianRupee, color: 'text-blue-400', bgColor: 'bg-blue-500/20', badge: 'GST',
    component: GSTR3BPanel,
  },
  // ── Income Tax ─────────────────────────────────────────
  {
    id: 'itr',
    label: 'ITR Generator (3 & 4)',
    description: 'ITR-3 full books with disallowances + ITR-4 presumptive (6%/8%). Real slab tax.',
    icon: FileText, color: 'text-purple-400', bgColor: 'bg-purple-500/20', badge: 'Income Tax',
    component: ITRPanel,
  },
  // ── Payroll ────────────────────────────────────────────
  {
    id: 'epf-esi',
    label: 'EPF & ESI Calculator',
    description: 'EPF: 12% capped ₹15K wages (EPS + EDLI + Admin). ESI: 4.25% capped ₹21K wages.',
    icon: Users, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', badge: 'Payroll',
    component: EPFESIPanel,
  },
  // ── Accounts ───────────────────────────────────────────
  {
    id: 'financials',
    label: 'Financial Statements',
    description: 'Balance Sheet (A=L+E validated) • P&L with margins • Cash Flow statement',
    icon: BarChart3, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', badge: 'Accounts',
    component: FinancialsPanel,
  },
  // ── Corporate Governance ───────────────────────────────
  {
    id: 'board',
    label: 'Corporate Governance Suite',
    description: 'Board Meeting scheduler • 8 resolution templates • AGM deadline • MCA MGT-7',
    icon: Calendar, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', badge: 'MCA', isNew: true,
    component: BoardMeetingsPanel,
  },
  // ── Compliance Management ──────────────────────────────
  {
    id: 'notices',
    label: 'Notice Tracker',
    description: 'All-department regulatory notices with traffic-light deadlines and status workflow',
    icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20', badge: 'All Depts',
    component: NoticeTrackerPanel,
  },
  // ── Finance ────────────────────────────────────────────
  {
    id: 'debtors',
    label: 'Debtors Aging Analysis',
    description: '0-30/31-60/61-90/90+ day buckets. Auto 25%/50% provision. Recovery alerts.',
    icon: PieChart, color: 'text-orange-400', bgColor: 'bg-orange-500/20', badge: 'Finance',
    component: DebtorsAgingPanel,
  },
  // ── Invoice & Registry ────────────────────────────────
  {
    id: 'invoice',
    label: 'Invoice Parser & DIN/TAN Registry',
    description: 'OCR invoice upload (Textract-ready) + DIN/TAN expiry tracker with DIR-3 KYC alerts',
    icon: ScanLine, color: 'text-pink-400', bgColor: 'bg-pink-500/20', badge: 'Multi', isNew: true,
    component: InvoiceParserPanel,
  },
  // ── Audit ─────────────────────────────────────────────
  {
    id: 'audit',
    label: 'Audit File Preparation',
    description: '19-document statutory checklist. Completion % tracking. Marks audit-ready status.',
    icon: FolderCheck, color: 'text-teal-400', bgColor: 'bg-teal-500/20', badge: 'Audit',
    component: AuditFilePanel,
  },
  // ── Advanced Regulatory Compliance ────────────────────
  {
    id: 'fema-sebi',
    label: 'RBI, FEMA & SEBI Hub',
    description: 'FDI/ODI processing, Export Realization, LODR Tracker & Insider Trading DB.',
    icon: Globe, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', badge: 'Apex', isNew: true,
    component: FEMASEBIPanel,
  },
  // ── Import/Export ────────────────────────────────────
  {
    id: 'import-export',
    label: 'Customs & EXIM Tool',
    description: 'ICEGATE Sync: Bills of Entry tracking, IGST ITC reconciliation, and Shipping Bills.',
    icon: Anchor, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', badge: 'Trade', isNew: true,
    component: ImportExportPanel,
  },
  // ── Practice Management ──────────────────────────────
  {
    id: 'prof-cqc',
    label: 'CA Quality & Compliance (ICAI)',
    description: 'CPE Hours tracker, Indemnity Insurance tracking, and Audit Peer Review prep (SQC 1).',
    icon: Sparkles, color: 'text-pink-400', bgColor: 'bg-pink-500/20', badge: 'Firm', isNew: true,
    component: ProfessionalCQCPanel,
  },
  // ── 100% Completion Expansion Pack (Phase 1 Checklist) ──
  {
    id: 'salary-tds',
    label: 'Salary & TDS Forms (16/24Q/27Q)',
    description: 'Auto-generation of salary certificates and quarterly TDS returns.',
    icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/20', badge: 'Payroll', isNew: true,
    component: SalaryTDSPanel,
  },
  {
    id: 'gratuity',
    label: 'Gratuity Calculator & Rules',
    description: 'Calculations based on Payment of Gratuity Act and Sec 10(10) exemptions.',
    icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/20', badge: 'Payroll', isNew: true,
    component: GratuityPanel,
  },
  {
    id: 'board-res',
    label: 'Board Resolution Repository',
    description: 'AI-assisted templates for corporate resolutions and approvals.',
    icon: FileSignature, color: 'text-purple-400', bgColor: 'bg-purple-500/20', badge: 'Gov', isNew: true,
    component: BoardResolutionsPanel,
  },
  {
    id: 'agm-minutes',
    label: 'AGM Notice & Minutes Tracking',
    description: '21-day notice workflows and AGM minute documentation repository.',
    icon: Users, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', badge: 'Gov', isNew: true,
    component: AGMMinutesPanel,
  },
  {
    id: 'mca-20b',
    label: 'MCA Form 20-B Extract',
    description: 'Auto-compilation of Annual Return variables for ROC filing.',
    icon: Building2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', badge: 'ROC', isNew: true,
    component: MCAForm20BPanel,
  },
  {
    id: 'din-tan',
    label: 'DIN & TAN Renewal Status',
    description: 'Track DIN expiry, DIR-3 KYC compliance, and TAN status.',
    icon: Fingerprint, color: 'text-orange-400', bgColor: 'bg-orange-500/20', badge: 'Identity', isNew: true,
    component: DINTANRenewalPanel,
  },
  // ── Phase 5: Advanced Automation ──
  {
    id: 'accounting-sync',
    label: 'Accounting Software Sync Hub',
    description: 'API Links to Tally Prime, Zoho Books, and QuickBooks Online.',
    icon: Database, color: 'text-zinc-400', bgColor: 'bg-zinc-500/20', badge: 'Data', isNew: true,
    component: AccountingSoftwareSync,
  },
  {
    id: 'bank-rec-auto',
    label: 'Bank Statement Auto-Recon AI',
    description: 'Upload PDF statements for automated parsing and suspense ledger analysis.',
    icon: Landmark, color: 'text-teal-400', bgColor: 'bg-teal-500/20', badge: 'Finance', isNew: true,
    component: BankReconciliationAutomator,
  },
  // ── Phase 6: Advanced Optimizer Suite ─────────────────────────────────────
  {
    id: 'regime-optimizer',
    label: 'Tax Regime Optimizer (Old vs New)',
    description: 'Side-by-side Old vs New Regime comparison. Auto-calculates optimal regime and shows exact savings.',
    icon: TrendingUp, color: 'text-violet-400', bgColor: 'bg-violet-500/20', badge: 'Income Tax', isNew: true,
    component: RegimeOptimizerPanel,
  },
  {
    id: 'capital-gains',
    label: 'Capital Gains Calculator (Broker Sync)',
    description: 'STCG / LTCG with CII indexation, Grandfathering clause (Jan 31, 2018 FMV), and Sec 112A exemption.',
    icon: BarChart3, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', badge: 'Income Tax', isNew: true,
    component: CapitalGainsPanel,
  },
  {
    id: 'advance-tax-radar',
    label: 'Advance Tax Radar (234B/C Predictor)',
    description: 'Projects full-year tax from YTD profit. Shows per-installment dues and interest risk under Sec 234B/C.',
    icon: AlertTriangle, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', badge: 'Income Tax', isNew: true,
    component: AdvanceTaxRadarPanel,
  },
  {
    id: 'deferred-tax',
    label: 'Deferred Tax & Dual Depreciation',
    description: 'Generates dual depreciation schedules (Companies Act vs IT Act) and computes DTL / DTA for balance sheet.',
    icon: FileText, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', badge: 'Audit', isNew: true,
    component: DeferredTaxDepreciationPanel,
  },
];

const PanelFallback = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center text-muted-foreground">
      <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse opacity-50" />
      <p className="text-sm">Loading module...</p>
    </div>
  </div>
);

export default function ComplianceModulesHub({ demoClients }: { demoClients?: { id: string, name: string }[] }) {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (demoClients) {
      setClients(demoClients);
      setLoading(false);
      return;
    }

    if (!isCABackendConfigured()) {
      setLoading(false);
      return;
    }

    const fetchClients = async () => {
      try {
        const response = await fetch(`${CA_API}/api/v1/ca/clients/list`);
        const result = await response.json();
        if (result.success) {
          setClients(result.data);
        }
      } catch (error) {
        // Backend unavailable — silently use empty state
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const ActiveComponent = activeModule ? MODULES.find(m => m.id === activeModule)?.component : null;
  const activeInfo = activeModule ? MODULES.find(m => m.id === activeModule) : null;

  return (
    <div className="space-y-4">
      {/* Client Selector */}
      <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30">
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
              <SelectValue placeholder={loading ? "Loading clients..." : "Select client to run calculations..."} />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              {!loading && clients.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground text-center">No clients found. Sync in portfolio.</div>
              )}
            </SelectContent>
          </Select>
        </div>
        {selectedClient && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">Active</Badge>}
      </div>

      {/* Module Count */}
      {!activeModule && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">{MODULES.length} modules — covering all 19 compliance features</p>
          <Badge variant="outline" className="text-[10px]">
            {MODULES.filter(m => m.isNew).length} new this session
          </Badge>
        </div>
      )}

      {/* Module Grid or Active Panel */}
      <AnimatePresence mode="wait">
        {!activeModule ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {MODULES.map((mod, i) => (
              <motion.button
                key={mod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                onClick={() => setActiveModule(mod.id)}
                className="text-left p-4 rounded-xl border border-border/30 bg-card/30 hover:bg-card/60 hover:border-border/60 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${mod.bgColor} shrink-0 mt-0.5`}>
                    <mod.icon className={`w-4 h-4 ${mod.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{mod.label}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{mod.badge}</Badge>
                      {mod.isNew && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Back button + header */}
            <button
              onClick={() => setActiveModule(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to all modules
            </button>
            <div className="flex items-center gap-3 pb-3 border-b border-border/30">
              {activeInfo && (
                <>
                  <div className={`p-2 rounded-lg ${activeInfo.bgColor}`}>
                    <activeInfo.icon className={`w-5 h-5 ${activeInfo.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{activeInfo.label}</h3>
                      {activeInfo.isNew && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{activeInfo.description}</p>
                  </div>
                </>
              )}
            </div>
            {!selectedClient ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/30 rounded-xl bg-card/10">
                <Building2 className="w-10 h-10 mb-3 text-muted-foreground opacity-30" />
                <h4 className="text-base font-semibold text-muted-foreground text-opacity-80">Select a Client First</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mx-auto">Please select an active client from the dropdown above to initialize the {activeInfo?.label} workspace.</p>
              </div>
            ) : (
              <Suspense fallback={<PanelFallback />}>
                {ActiveComponent && (
                  <ActiveComponent 
                    clientId={selectedClient} 
                    isDemo={!!demoClients}
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
