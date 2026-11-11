/**
 * DEMO COMPANY DASHBOARD
 * ======================
 * Full tab-based demo dashboard showing all Sannidh features.
 * ALL mock data comes from src/data/demo-data.ts — edit that file to change what's shown.
 * Sector Demo Personalizer: "See Your Business Here" button lets visitors
 * swap in their own company name + sector and see sector-specific numbers & alerts.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { CompanyDashboardShell, DashboardTab } from "@/components/company-dashboard/CompanyDashboardShell";
import { CompanyCADataSyncCard, CompanyCASettingsPanel } from "@/components/company-dashboard/DemoCompanyCASync";

// Tab content components
import RegulatoryExposurePanel from "@/components/dashboard/RegulatoryExposurePanel";
import ComplianceTasksTable from "@/components/dashboard/ComplianceTasksTable";
import DocumentVault from "@/components/dashboard/DocumentVault";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import QuickActions from "@/components/dashboard/QuickActions";
import ComplianceGapSection from "@/components/dashboard/ComplianceGapSection";
import UpcomingLawImpactSection from "@/components/dashboard/UpcomingLawImpactSection";
import AuditEvidenceVault from "@/components/dashboard/AuditEvidenceVault";
import AIBusinessIntelligencePanel from "@/components/dashboard/AIBusinessIntelligencePanel";
import RegulatoryIntelligenceCenter from "@/components/dashboard/RegulatoryIntelligenceCenter";
import RegulatoryNewsPanel from "@/components/dashboard/RegulatoryNewsPanel";
import TabErrorBoundary from "@/components/dashboard/TabErrorBoundary";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CommandCenterHeader } from "@/components/agents/CommandCenterHeader";
import { CompanyActionInbox } from "@/components/agents-demo/CompanyActionInbox";

// ERP + CFO (mock-data versions driven by demo-data.ts)
import { RealERPModule } from "@/components/company-erp/RealERPModule";
import { CFOIntelligenceModule } from "@/components/company-erp/CFOIntelligenceModule";
import { IntelligentTaxOptimization } from "@/components/tax-optimization/IntelligentTaxOptimization";

// Sector Demo Personalizer
import { SectorDemoProvider, useSectorDemo } from "@/contexts/SectorDemoContext";
import { SectorDemoModal } from "@/components/dashboard/SectorDemoModal";

// All demo data — edit src/data/demo-data.ts to change what's shown
import {
  DEMO_COMPANY, DEMO_EXPOSURES, DEMO_TASKS, DEMO_DOCUMENTS,
  DEMO_GAPS, DEMO_INVOICES, DEMO_PURCHASES, DEMO_EXPENSES,
  DEMO_PAYROLL, DEMO_BANK_TXNS, DEMO_INVENTORY
} from "@/data/demo-data";

// ─── Stable mapped arrays (module-level = created once, never recreated) ────
const CFO_INVOICES   = DEMO_INVOICES.map(i  => ({ amount: i.amount,       gst_amount:  i.gst_amount,  date: i.date, party_name: i.party_name }));
const CFO_PURCHASES  = DEMO_PURCHASES.map(p => ({ amount: p.amount,       gst_amount:  p.gst_amount,  date: p.date, party_name: p.party_name }));
const CFO_EXPENSES   = DEMO_EXPENSES.map(e  => ({ amount: e.amount,       category:    e.category,    date: e.date }));
const CFO_PAYROLL    = DEMO_PAYROLL.map(p   => ({ gross_salary: p.gross_salary, net_salary: p.net_salary, pf_employer: p.pf_employer, esic_employer: p.esic_employer }));
const CFO_BANK_TXNS  = DEMO_BANK_TXNS.map(t => ({ amount: t.amount,       type:        t.type,        date: t.date }));
const CFO_BANK_BAL   = DEMO_COMPANY.bank_balance ?? 18500000;

// ─── Sector Alert Inbox (injected INSIDE the AI inbox section below CompanyActionInbox) ──

function SectorAlertInbox() {
  const { profile } = useSectorDemo();
  if (!profile || profile.alerts.length === 0) return null;

  const colorMap = {
    critical: "border-red-500/30 bg-red-500/5 text-red-300",
    warning:  "border-amber-500/30 bg-amber-500/5 text-amber-300",
    info:     "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",
    success:  "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
  };
  const dotMap = {
    critical: "bg-red-500",
    warning:  "bg-amber-500",
    info:     "bg-cyan-500",
    success:  "bg-emerald-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2 pb-1"
    >
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-0.5 pt-2">
        ⚡ Sector-Specific Alerts — {profile.sector}
      </p>
      {profile.alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colorMap[alert.type]}`}
        >
          <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dotMap[alert.type]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold truncate">{alert.title}</p>
              <span className="text-[10px] opacity-70 shrink-0">{alert.dueDate}</span>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{alert.description}</p>
            <span className="inline-block mt-1 text-[10px] opacity-60 font-mono">{alert.section}</span>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function OverviewTab() {
  const { profile } = useSectorDemo();

  const companyName = profile?.companyName ?? DEMO_COMPANY.name;
  const industry    = profile?.sector      ?? DEMO_COMPANY.industry;
  const compScore   = profile?.complianceScore ?? DEMO_COMPANY.compliance_score;

  const deadlines = [
    { id: "1", title: "TDS Return Filing",   regulator: "Income Tax", dueDate: "Aug 7, 2025",  isRecurring: true,  daysLeft: 15 },
    { id: "2", title: "GSTR-3B July Return", regulator: "GST",        dueDate: "Aug 20, 2025", isRecurring: true,  daysLeft: 28 },
    { id: "3", title: "PF Challan Deposit",  regulator: "Labour",     dueDate: "Aug 15, 2025", isRecurring: true,  daysLeft: 23 },
    { id: "4", title: "Advance Tax Q2",      regulator: "Income Tax", dueDate: "Sep 15, 2025", isRecurring: false, daysLeft: 54 },
  ];

  const pendingTasks = DEMO_TASKS.filter(t => t.status !== "completed");

  return (
    <div className="space-y-6">
      <DashboardHeader
        companyName={companyName}
        industry={industry}
        complianceHealth={compScore}
      />
      <CompanyCADataSyncCard />
      <QuickActions />
      <AIBusinessIntelligencePanel
        companyName={companyName}
        industry={industry}
        complianceHealth={compScore}
        exposures={DEMO_EXPOSURES.map(e => ({ regulator: e.regulator, status: e.status, notes: e.notes }))}
        tasks={DEMO_TASKS.map(t => ({ id: t.id, title: t.title, regulator: t.regulator, priority: t.priority, status: t.status, dueDate: t.due_date }))}
        deadlines={deadlines}
      />
      <UpcomingDeadlines deadlines={deadlines} />
    </div>
  );
}

function ComplianceTab() {
  const { profile } = useSectorDemo();

  const compScore = profile?.complianceScore ?? DEMO_COMPANY.compliance_score;

  // Generate sector-specific compliance tasks from alerts, or fall back to demo
  const tasks = profile
    ? profile.alerts.map((a) => ({
        id: a.id,
        title: a.title,
        regulator:
          a.section.includes("GST") || a.section.includes("CGST") || a.section.includes("IGST")
            ? "GST"
            : a.section.includes("IT Act") || a.section.includes("Sec 19") || a.section.includes("Sec 20") || a.section.includes("Sec 20") || a.section.includes("Sec 21") || a.section.includes("Sec 23") || a.section.includes("Sec 24") || a.section.includes("Sec 20") || a.section.includes("Sec 44")
            ? "Income Tax"
            : a.section.includes("PF") || a.section.includes("ESI") || a.section.includes("Labour") || a.section.includes("Minimum Wages") || a.section.includes("CLRA")
            ? "Labour"
            : a.section.includes("MCA") || a.section.includes("Companies Act") || a.section.includes("RERA")
            ? "MCA"
            : a.section.includes("FEMA") || a.section.includes("RBI")
            ? "RBI / FEMA"
            : "Regulatory",
        priority: (a.type === "critical" ? "high" : a.type === "warning" ? "medium" : "low") as "high" | "medium" | "low",
        status: "pending" as const,
        dueDate: a.dueDate,
      }))
    : DEMO_TASKS.map(t => ({ id: t.id, title: t.title, regulator: t.regulator, priority: t.priority as "high" | "medium" | "low", status: t.status as any, dueDate: t.due_date }));

  // Sector-specific regulatory updates
  const regulatoryUpdates = profile
    ? [
        { id: "u1", title: `GST compliance update affecting ${profile.sector}`, source: "gstn", sourceLabel: "GSTN", announcedBy: "GST Council", announcedOn: "Nov 1, 2025", effectiveDate: "Dec 1, 2025", actionDeadline: "Nov 30, 2025", impactScore: 7.0, companyExposure: "high" as const, actionOwner: "Indirect Tax Lead", originalUrl: "https://www.gst.gov.in" },
        { id: "u2", title: `Income Tax circular — ${profile.sector} sector provisions`, source: "cbdt", sourceLabel: "CBDT", announcedBy: "CBDT", announcedOn: "Oct 20, 2025", effectiveDate: "Nov 1, 2025", actionDeadline: "Dec 31, 2025", impactScore: 5.5, companyExposure: "medium" as const, actionOwner: "Direct Tax Lead", originalUrl: "https://www.incometax.gov.in" },
      ]
    : [
        { id: "u1", title: "GST e-invoicing threshold lowered to ₹5 Crore", source: "gstn", sourceLabel: "GSTN", announcedBy: "GST Council", announcedOn: "Jul 10, 2025", effectiveDate: "Aug 1, 2025", actionDeadline: "Jul 31, 2025", impactScore: 7.2, companyExposure: "high" as const, actionOwner: "Indirect Tax Lead", originalUrl: "https://www.gst.gov.in" },
        { id: "u2", title: "MCA Form AOC-4 deadline extension", source: "mca", sourceLabel: "MCA", announcedBy: "Ministry of Corporate Affairs", announcedOn: "Jul 5, 2025", effectiveDate: "Sep 30, 2025", actionDeadline: "Sep 30, 2025", impactScore: 4.0, companyExposure: "medium" as const, actionOwner: "Company Secretary", originalUrl: "https://www.mca.gov.in" },
      ];

  return (
    <div className="space-y-6">
      <RegulatoryExposurePanel exposures={DEMO_EXPOSURES.map(e => ({ regulator: e.regulator, status: e.status, notes: e.notes }))} />
      <RegulatoryIntelligenceCenter currentHealthScore={compScore} updates={regulatoryUpdates} />
      <ComplianceGapSection useDemoFallback={true} />
      <UpcomingLawImpactSection useDemoFallback={true} />
      <AuditEvidenceVault useDemoFallback={true} />
      <ComplianceTasksTable tasks={tasks} />
    </div>
  );
}

function NewsTab() {
  return (
    <div className="space-y-6">
      <RegulatoryNewsPanel />
    </div>
  );
}

function ERPTab() {
  const { profile } = useSectorDemo();
  return (
    <RealERPModule
      companyId="demo-company-101"
      companyName={profile?.companyName ?? DEMO_COMPANY.name}
      companyGstin={profile?.gstin ?? "27AABCS1234M1ZP"}
      companyState={profile?.state ?? "Maharashtra"}
      overrideData={profile?.erpData ?? undefined}
    />
  );
}

function CFOTab() {
  const { profile } = useSectorDemo();

  const invoices   = profile ? profile.invoices   : CFO_INVOICES;
  const purchases  = profile ? profile.purchases  : CFO_PURCHASES;
  const expenses   = profile ? profile.expenses   : CFO_EXPENSES;
  const payroll    = profile ? profile.payroll    : CFO_PAYROLL;
  const bankTxns   = profile ? profile.bankTxns   : CFO_BANK_TXNS;
  const bankBal    = profile ? profile.bankBalance : CFO_BANK_BAL;
  const companyName = profile?.companyName ?? DEMO_COMPANY.name;

  return (
    <CFOIntelligenceModule
      companyId="demo"
      companyName={companyName}
      invoices={invoices}
      purchases={purchases}
      expenses={expenses}
      payroll={payroll}
      bankTxns={bankTxns}
      bankBalance={bankBal}
    />
  );
}

function DocumentsTab() {
  return (
    <DocumentVault
      documents={DEMO_DOCUMENTS.map(d => ({
        id: d.id,
        name: d.name,
        fileType: d.file_type,
        regulator: d.regulator,
        status: d.status as any,
        uploadedAt: d.uploaded_at,
      }))}
    />
  );
}

function TaxOptimizationTab() {
  const { profile } = useSectorDemo();
  return (
    <IntelligentTaxOptimization
      companyId="demo-company-101"
      companyName={profile?.companyName ?? DEMO_COMPANY.name}
      demoMode={true}
      sectorData={profile ? {
        annualRevenue:    profile.annualRevenue,
        annualPurchases:  profile.annualPurchases,
        operatingExpenses: profile.operatingExpenses,
        grossProfit:      profile.grossProfit,
        netProfit:        profile.netProfit,
        gstOutput:        profile.gstOutput,
        gstItc:           profile.gstItc,
        employees:        profile.employees,
        sector:           profile.sector,
        gstin:            profile.gstin,
        state:            profile.state,
        msmeCategory:     profile.msmeCategory,
        companyName:      profile.companyName,
      } : undefined}
    />
  );
}

function CaSettingsTab() {
  return (
    <div className="space-y-6">
      <CompanyCASettingsPanel />
    </div>
  );
}

// ─── Inner Dashboard (needs access to SectorDemoContext) ──────────────────────

function DashboardInner() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const { profile, setModalOpen, setProfile } = useSectorDemo();

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as DashboardTab;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('company:switch-tab', handler);
    return () => window.removeEventListener('company:switch-tab', handler);
  }, []);

  const pendingAlerts = DEMO_GAPS.filter(g => g.severity === "high").length;

  const effectiveCompany = {
    name:             profile?.companyName    ?? DEMO_COMPANY.name,
    industry:         profile?.sector         ?? DEMO_COMPANY.industry,
    compliance_score: profile?.complianceScore ?? DEMO_COMPANY.compliance_score,
    health_status:    profile?.healthStatus    ?? DEMO_COMPANY.health_status,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl pt-4">
          <DashboardTypeNav activeType="company" />

          {/* Demo Banner + Personalizer Button */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-2 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-between gap-3"
          >
            <p className="text-xs text-amber-400">
              🎭 <strong>Demo Dashboard</strong> —{" "}
              {profile
                ? <>Showing <span className="font-semibold">{profile.companyName}</span> ({profile.sector})</>
                : <>Showing sample data for <span className="font-semibold">{DEMO_COMPANY.name}</span>. Sign in to access your live data.</>
              }
            </p>

            <div className="flex items-center gap-2 shrink-0">
              {/* Reset button — only when sector is active */}
              {profile && (
                <button
                  onClick={() => setProfile(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}

              {/* Main personalizer button */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/40 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                {profile ? "Change Sector" : "See Your Business Here →"}
              </button>
            </div>
          </motion.div>

          {/* Command Center Header — same position as before */}
          <CommandCenterHeader
            companyName={effectiveCompany.name}
            complianceScore={effectiveCompany.compliance_score}
            healthStatus={effectiveCompany.health_status}
          />

          {/* AI Action Inbox + Sector Alerts below it (same visual section) */}
          <CompanyActionInbox />
          <SectorAlertInbox />
        </div>

        {/* Tab Shell + Content */}
        <CompanyDashboardShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          companyName={effectiveCompany.name}
          complianceScore={effectiveCompany.compliance_score}
          healthStatus={effectiveCompany.health_status}
          alertCount={pendingAlerts}
          isDemo
        >
          <TabErrorBoundary fallbackName={activeTab}>
            {activeTab === "overview"         && <OverviewTab />}
            {activeTab === "compliance"       && <ComplianceTab />}
            {activeTab === "news"             && <NewsTab />}
            {activeTab === "erp"              && <ERPTab />}
            {activeTab === "cfo"              && <CFOTab />}
            {activeTab === "tax-optimization" && <TaxOptimizationTab />}
            {activeTab === "documents"        && <DocumentsTab />}
            {activeTab === "ca-settings"      && <CaSettingsTab />}
          </TabErrorBoundary>
        </CompanyDashboardShell>
      </main>

      <Footer />

      {/* Sector Demo Modal — rendered here so it overlays everything */}
      <SectorDemoModal />
    </div>
  );
}

// ─── Main Export — wrapped with provider ─────────────────────────────────────

const Dashboard = () => (
  <SectorDemoProvider>
    <DashboardInner />
  </SectorDemoProvider>
);

export default Dashboard;
