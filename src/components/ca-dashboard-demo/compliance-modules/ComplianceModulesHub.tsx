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
  component: React.ComponentType<{ clientId?: string; isDemo?: boolean }>;
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

export default function ComplianceModulesHub({ demoClients, isDemo }: { demoClients?: { id: string, name: string }[]; isDemo?: boolean }) {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // RBI AA & AI Swarm simulation states
  const [runningAnimationFor, setRunningAnimationFor] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationLogs, setAnimationLogs] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number>(0);

  React.useEffect(() => {
    // Explicit prop takes ABSOLUTE priority over URL detection
    const isDemoMode = isDemo !== undefined
      ? isDemo
      : (typeof window !== 'undefined' && (
          window.location.pathname === '/ca-dashboard' || 
          window.location.pathname === '/ca-dashboard/' || 
          window.location.pathname.startsWith('/ca-dashboard/')
        ));

    if (demoClients) {
      setClients(demoClients);
      setLoading(false);
      return;
    }

    const loadClients = async () => {
      if (isDemoMode) {
        // DEMO ONLY: load from localStorage
        try {
          const saved = localStorage.getItem('demo_clients');
          if (saved) {
            const parsed = JSON.parse(saved);
            setClients(parsed.map((c: any) => ({
              id: c.id || c.client_name || 'demo-client',
              name: c.name || c.client_name || 'Demo Client'
            })));
          }
        } catch (e) {}
        setLoading(false);
      } else {
        // PRODUCTION: load from real Supabase database only
        try {
          const { loadCAClients } = await import('@/services/ca-supabase-service');
          const dbClients = await loadCAClients();
          setClients(dbClients.map((c: any) => ({ id: c.id, name: c.name })));
        } catch (error) {
          console.error("Error loading CA clients:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadClients();
  }, [demoClients, isDemo]);

  // Handle module selection and trigger animation in demo mode
  const handleSelectModule = (modId: string) => {
    setActiveModule(modId);
    
    const isDemoMode = isDemo !== undefined
      ? isDemo
      : (typeof window !== 'undefined' && (
          window.location.pathname === '/ca-dashboard' || 
          window.location.pathname === '/ca-dashboard/' || 
          window.location.pathname.startsWith('/ca-dashboard/')
        ));

    if (selectedClient && isDemoMode) {
      setRunningAnimationFor(modId);
      setAnimationProgress(0);
      setAnimationLogs([]);
      setCompletedSteps(0);
    }
  };

  // Run progress animation and compile custom logs
  React.useEffect(() => {
    if (!runningAnimationFor || !selectedClient) return;

    const activeInfo = MODULES.find(m => m.id === runningAnimationFor);
    const clientName = clients.find(c => c.id === selectedClient)?.name || "Active Client";
    const label = activeInfo?.label || "Module";

    const customLogs: Record<string, string[]> = {
      gstr1: [
        `Establishing secure session with RBI Account Aggregator (AA) for ${clientName}...`,
        "AA Consent verification check: AUTHORIZED (Valid until 2028)",
        "Syncing bank stream GST collection accounts...",
        "Fetching sales ledger records & invoice database...",
        "Syncing 14 sales invoices with GSTIN records...",
        "Validating buyer GSTIN checksums...",
        "Computing CGST (9%), SGST (9%), and IGST (18%) portions...",
        "Formulating B2B, B2C, and HSN summary sections...",
        "Sannidh AI Audit swarm: Verification checks PASSED.",
        "GSTR-1 Draft ready for portal integration."
      ],
      gstr2b: [
        `Connecting to RBI Account Aggregator (AA) platform for ${clientName}...`,
        "Establishing authentication handshakes with GSTN gateway...",
        "Fetching GSTR-2B JSON statement from GST Portal...",
        "Downloading buyer GSTR-1 filings for current period...",
        "Comparing GSTR-2B portal record with Purchase Register...",
        "Running reconciliation checks (invoice by invoice)...",
        "Mismatch flagged: INV-001 has difference of ₹10,000...",
        "Missing record flagged: INV-EXTRA not filed by supplier...",
        "Drafting notification reminders for vendor compliance..."
      ],
      gstr3b: [
        `Connecting to RBI Account Aggregator (AA) stream for ${clientName}...`,
        "Retrieving GSTR-1 outward liability data...",
        "Retrieving GSTR-2B eligible ITC credits...",
        "Verifying Rule 86B utilization limits (max 99% ITC)...",
        "Matching CGST/SGST/IGST accounts...",
        "Calculating net tax liability payable in cash...",
        "Validating RCM liabilities from purchase ledgers...",
        "GSTR-3B tax computation finalized."
      ],
      itr: [
        `Initiating secure handshake with RBI Account Aggregator (AA) for ${clientName}...`,
        "Retrieving Form 26AS, AIS (Annual Information Statement)...",
        "Downloading tax deducted at source (TDS) receipts...",
        "Syncing business P&L account & balance sheet audit trail...",
        "Checking disallowable expenditures under Sec 37...",
        "Computing depreciation under IT Act Dual Schedule...",
        "Applying slab rates & health/education cess (4%)...",
        "ITR computation draft generated."
      ],
      'epf-esi': [
        `Connecting to payroll register database via AA for ${clientName}...`,
        "Extracting monthly employee wage statements...",
        "Filtering employees with basic wage <= ₹15,000 (EPF threshold)...",
        "Filtering employees with gross wage <= ₹21,000 (ESI threshold)...",
        "Calculating EPF contributions (12% employee + 12% employer)...",
        "Calculating ESI contributions (0.75% employee + 3.25% employer)...",
        "Validating UANs and ESI numbers...",
        "EPF & ESI payroll computation complete."
      ],
      financials: [
        `Retrieving trial balance and general ledger from synced ERP for ${clientName}...`,
        "Running ledger verification checks...",
        "Validating accounting equation: Assets = Liabilities + Equity...",
        "Compiling Schedule III Balance Sheet format...",
        "Preparing Profit & Loss Statement with margin ratios...",
        "Constructing Cash Flow Statement (Indirect Method)...",
        "All statements validated and balanced successfully."
      ],
      notices: [
        `Scanning GST, Income Tax, and MCA portals via API key for ${clientName}...`,
        "Detecting notice alerts and cause notices...",
        "Parsing PDF notices using Sannidh OCR parser...",
        "Extracting reference IDs, amounts, and due dates...",
        "Mapping notices to compliance calendars...",
        "Creating task timeline reminders."
      ],
      'advance-tax': [
        `Retrieving YTD profit and loss statements for ${clientName}...`,
        "Extrapolating projected annual revenue based on run rate...",
        "Calculating estimated gross tax liability...",
        "Deducting TDS credits and advance tax installments already paid...",
        "Checking interest liability under Section 234B & 234C...",
        "Compiling quarterly installment schedule."
      ],
      'regime-optimizer': [
        `Fetching employee salary structures and tax declarations for ${clientName}...`,
        "Decoding rent receipts, HRA claims, and 80C/80D proofs...",
        "Simulating old tax regime slabs with deductions...",
        "Simulating new tax regime slabs with standard deduction...",
        "Calculating side-by-side comparison and net tax savings...",
        "Optimizing tax filing regime recommendation."
      ],
      'capital-gains': [
        `Establishing connection to broker portfolio feeds via AA for ${clientName}...`,
        "Importing equity, mutual fund, and debt trade sheets...",
        "Calculating holding periods (STCG vs LTCG criteria)...",
        "Applying CII indexation for debt/gold assets...",
        "Applying Sec 112A Grandfathering FMV for pre-2018 equity...",
        "Calculating net gains and taxable capital gains."
      ]
    };

    const logs = customLogs[runningAnimationFor] || [
      `Establishing secure session with RBI Account Aggregator (AA) for ${clientName}...`,
      `Retrieving ledger records and bank statements for ${label}...`,
      "Initializing Sannidh AI swarm compliance agents...",
      `Analyzing regulatory guidelines for ${label}...`,
      "Compiling variables and verifying calculations...",
      "Drafting official filing and audit logs...",
      "Verification complete. Workspace initialized."
    ];

    let currentLogIndex = 0;
    const intervalTime = 3000 / logs.length;

    const timer = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setAnimationLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
        
        const progress = Math.min(100, Math.round((currentLogIndex / logs.length) * 100));
        setAnimationProgress(progress);
        
        if (progress >= 90) setCompletedSteps(4);
        else if (progress >= 65) setCompletedSteps(3);
        else if (progress >= 35) setCompletedSteps(2);
        else setCompletedSteps(1);
      } else {
        clearInterval(timer);
        setTimeout(() => {
          // Tell the child panel that it can auto-calculate and display immediately
          localStorage.setItem(`sannidh:auto-calculate:${selectedClient}:${runningAnimationFor}`, "true");
          setRunningAnimationFor(null);
        }, 500);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [runningAnimationFor, selectedClient, clients]);

  const handleSkip = () => {
    if (runningAnimationFor) {
      localStorage.setItem(`sannidh:auto-calculate:${selectedClient}:${runningAnimationFor}`, "true");
      setRunningAnimationFor(null);
    }
  };

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
                onClick={() => handleSelectModule(mod.id)}
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
            ) : runningAnimationFor ? (
              /* Simulated Account Aggregator & AI Swarm animation overlay */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 border border-cyan-500/30 rounded-2xl bg-slate-950/80 backdrop-blur-md space-y-6 relative overflow-hidden"
              >
                {/* Glowing border effects */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Radar Scanner Animation */}
                  <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-pulse" />
                    <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_8s_linear_infinite]" />
                    <div className="absolute inset-8 rounded-full bg-cyan-950/50 border border-cyan-500/50 flex items-center justify-center">
                      <ScanLine className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] animate-pulse">RBI AA INTEGRATION</Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px]">AI SWARM RUNNING</Badge>
                    </div>
                    <h4 className="text-lg font-bold text-white">Sannidh Compliance Auto-Pilot</h4>
                    <p className="text-xs text-muted-foreground">
                      Running secure handshake with Account Aggregator and executing regulatory validation engines for <span className="text-cyan-400 font-semibold">{clients.find(c => c.id === selectedClient)?.name}</span>.
                    </p>
                  </div>

                  <Button variant="ghost" size="sm" onClick={handleSkip} className="absolute top-4 right-4 text-xs text-slate-500 hover:text-slate-300">
                    Skip →
                  </Button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-cyan-400">Compliance Workspace Compiling...</span>
                    <span className="text-cyan-400">{animationProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-border/20">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${animationProgress}%` }}
                    />
                  </div>
                </div>

                {/* Grid checklist + console */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Checklist */}
                  <div className="md:col-span-1 space-y-2 p-3 bg-slate-900/40 rounded-xl border border-border/20">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Execution Pipeline</p>
                    {[
                      { label: "RBI AA Consent Verification", step: 1 },
                      { label: "Ledger & Bank Feed Fetch", step: 2 },
                      { label: "AI Swarm Calculation Engine", step: 3 },
                      { label: "Workspace Render Init", step: 4 }
                    ].map(st => (
                      <div key={st.step} className="flex items-center gap-2 text-xs">
                        {completedSteps >= st.step ? (
                          <Badge className="p-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 shrink-0 animate-scale-in">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          </Badge>
                        ) : completedSteps + 1 === st.step ? (
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <span className={completedSteps >= st.step ? "text-slate-300 font-medium" : "text-slate-500"}>{st.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal console logs */}
                  <div className="md:col-span-2 bg-slate-950 border border-border/30 rounded-xl p-3 h-36 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
                    {animationLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span className="text-cyan-500/70 shrink-0">sannidh:~$</span>
                        <span className={i === animationLogs.length - 1 ? "text-cyan-400" : "text-slate-300"}>{log}</span>
                      </div>
                    ))}
                    {animationProgress < 100 && (
                      <div className="flex items-center gap-1 text-cyan-400/50">
                        <span className="text-cyan-500/70 shrink-0">sannidh:~$</span>
                        <span className="animate-pulse">_</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <Suspense fallback={<PanelFallback />}>
                {ActiveComponent && (
                  <ActiveComponent 
                    clientId={selectedClient} 
                    isDemo={
                      isDemo !== undefined
                        ? isDemo  // Explicit prop wins always
                        : demoClients !== undefined 
                          ? !!demoClients 
                          : (typeof window !== 'undefined' && (
                              window.location.pathname === '/ca-dashboard' || 
                              window.location.pathname === '/ca-dashboard/' || 
                              window.location.pathname.startsWith('/ca-dashboard/')
                            ))
                    }
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
