/**
 * DEMO COMPANY DASHBOARD
 * ======================
 * Full tab-based demo dashboard showing all Sannidh features.
 * ALL mock data comes from src/data/demo-data.ts — edit that file to change what's shown.
 * No hardcoded data in this file.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { SmartERPModule } from "@/components/company-erp/SmartERPModule";
import { CFOIntelligenceModule } from "@/components/company-erp/CFOIntelligenceModule";
import { VirtualCFOModule } from "@/components/company-erp/VirtualCFOModule";
import { IntelligentTaxOptimization } from "@/components/tax-optimization/IntelligentTaxOptimization";

// All demo data — edit src/data/demo-data.ts to change what's shown
import {
  DEMO_COMPANY, DEMO_EXPOSURES, DEMO_TASKS, DEMO_DOCUMENTS,
  DEMO_GAPS, DEMO_INVOICES, DEMO_PURCHASES, DEMO_EXPENSES,
  DEMO_PAYROLL, DEMO_BANK_TXNS, DEMO_INVENTORY
} from "@/data/demo-data";

// ─── Tab Content Components ───────────────────────────────────────────────────

function OverviewTab() {
  const deadlines = [
    { id: "1", title: "TDS Return Filing", regulator: "Income Tax", dueDate: "Aug 7, 2025", isRecurring: true, daysLeft: 15 },
    { id: "2", title: "GSTR-3B July Return", regulator: "GST", dueDate: "Aug 20, 2025", isRecurring: true, daysLeft: 28 },
    { id: "3", title: "PF Challan Deposit", regulator: "Labour", dueDate: "Aug 15, 2025", isRecurring: true, daysLeft: 23 },
    { id: "4", title: "Advance Tax Q2", regulator: "Income Tax", dueDate: "Sep 15, 2025", isRecurring: false, daysLeft: 54 },
  ];

  const pendingTasks = DEMO_TASKS.filter(t => t.status !== "completed");

  return (
    <div className="space-y-6">
      {/* Health Score + Company Header */}
      <DashboardHeader
        companyName={DEMO_COMPANY.name}
        industry={DEMO_COMPANY.industry}
        complianceHealth={DEMO_COMPANY.compliance_score}
      />

      {/* CA Data Sync Card — Send all data to connected CA */}
      <CompanyCADataSyncCard />

      {/* Quick Actions */}
      <QuickActions />

      {/* AI Business Intelligence */}
      <AIBusinessIntelligencePanel
        companyName={DEMO_COMPANY.name}
        industry={DEMO_COMPANY.industry}
        complianceHealth={DEMO_COMPANY.compliance_score}
        exposures={DEMO_EXPOSURES.map(e => ({ regulator: e.regulator, status: e.status, notes: e.notes }))}
        tasks={DEMO_TASKS.map(t => ({ id: t.id, title: t.title, regulator: t.regulator, priority: t.priority, status: t.status, dueDate: t.due_date }))}
        deadlines={deadlines}
      />

      {/* Upcoming Deadlines */}
      <UpcomingDeadlines deadlines={deadlines} />
    </div>
  );
}

function ComplianceTab() {
  const regulatoryUpdates = [
    { id: "u1", title: "GST e-invoicing threshold lowered to ₹5 Crore", source: "gstn", sourceLabel: "GSTN", announcedBy: "GST Council", announcedOn: "Jul 10, 2025", effectiveDate: "Aug 1, 2025", actionDeadline: "Jul 31, 2025", impactScore: 7.2, companyExposure: "high" as const, actionOwner: "Indirect Tax Lead", originalUrl: "https://www.gst.gov.in" },
    { id: "u2", title: "MCA Form AOC-4 deadline extension", source: "mca", sourceLabel: "MCA", announcedBy: "Ministry of Corporate Affairs", announcedOn: "Jul 5, 2025", effectiveDate: "Sep 30, 2025", actionDeadline: "Sep 30, 2025", impactScore: 4.0, companyExposure: "medium" as const, actionOwner: "Company Secretary", originalUrl: "https://www.mca.gov.in" },
  ];
  return (
    <div className="space-y-6">
      <RegulatoryExposurePanel exposures={DEMO_EXPOSURES.map(e => ({ regulator: e.regulator, status: e.status, notes: e.notes }))} />
      <RegulatoryIntelligenceCenter currentHealthScore={DEMO_COMPANY.compliance_score} updates={regulatoryUpdates} />
      <ComplianceGapSection useDemoFallback={true} />
      <UpcomingLawImpactSection useDemoFallback={true} />
      <AuditEvidenceVault useDemoFallback={true} />
      <ComplianceTasksTable tasks={DEMO_TASKS.map(t => ({ id: t.id, title: t.title, regulator: t.regulator, priority: t.priority, status: t.status, dueDate: t.due_date }))} />
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
  return (
    <RealERPModule
      companyId="demo-company-101"
      companyName={DEMO_COMPANY.name}
    />
  );
}

function CFOTab() {
  return (
    <CFOIntelligenceModule companyName={DEMO_COMPANY.name} />
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
  return (
    <IntelligentTaxOptimization
      companyId="demo-company-101"
      companyName="Sannidh Precision Machinery Pvt Ltd"
      demoMode={true}
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

// ─── Main Demo Dashboard ──────────────────────────────────────────────────────

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Listen for programmatic tab switch from CompanyCADataSyncCard
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as DashboardTab;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('company:switch-tab', handler);
    return () => window.removeEventListener('company:switch-tab', handler);
  }, []);

  const pendingAlerts = DEMO_GAPS.filter(g => g.severity === "high").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16">
        {/* Dashboard Type Nav */}
        <div className="container mx-auto px-4 max-w-7xl pt-4">
          <DashboardTypeNav activeType="company" />

          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mb-2 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-between gap-3"
          >
            <p className="text-xs text-amber-400">
              🎭 <strong>Demo Dashboard</strong> — Showing sample data for{" "}
              <span className="font-semibold">{DEMO_COMPANY.name}</span>.{" "}
              <span className="text-amber-400/70">Sign in to access your company's live data.</span>
            </p>
            <span className="text-[10px] text-amber-400/50 shrink-0">Edit: src/data/demo-data.ts</span>
          </motion.div>

          {/* Command Center Header — 1:1 mirror of real company dashboard */}
          <CommandCenterHeader 
            companyName={DEMO_COMPANY.name}
            complianceScore={DEMO_COMPANY.compliance_score}
            healthStatus={DEMO_COMPANY.health_status}
          />
          {/* AI Action Inbox */}
          <CompanyActionInbox />
        </div>

        {/* Tab Shell + Content — full width below */}
        <CompanyDashboardShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          companyName={DEMO_COMPANY.name}
          complianceScore={DEMO_COMPANY.compliance_score}
          healthStatus={DEMO_COMPANY.health_status}
          alertCount={pendingAlerts}
          isDemo
        >
          <TabErrorBoundary fallbackName={activeTab}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "compliance" && <ComplianceTab />}
            {activeTab === "news" && <NewsTab />}
            {activeTab === "erp" && <ERPTab />}
            {activeTab === "cfo" && <CFOTab />}
            {activeTab === "tax-optimization" && <TaxOptimizationTab />}
            {activeTab === "documents" && <DocumentsTab />}
            {activeTab === "ca-settings" && <CaSettingsTab />}
          </TabErrorBoundary>
        </CompanyDashboardShell>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
