import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RegulatoryExposurePanel from "@/components/dashboard/RegulatoryExposurePanel";
import ComplianceTasksTable from "@/components/dashboard/ComplianceTasksTable";
import DocumentVault from "@/components/dashboard/DocumentVault";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import QuickActions from "@/components/dashboard/QuickActions";
import ComplianceGapSection from "@/components/dashboard/ComplianceGapSection";
import UpcomingLawImpactSection from "@/components/dashboard/UpcomingLawImpactSection";
import AuditEvidenceVault from "@/components/dashboard/AuditEvidenceVault";
import AIBusinessIntelligencePanel from "@/components/dashboard/AIBusinessIntelligencePanel";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";

// University-specific demo data
const demoUniversity = {
  name: "Nalanda Central University",
  industry: "Higher Education · Deemed University",
  complianceHealth: 82,
};

const demoExposures = [
  { regulator: "MCA", status: "active" as const, notes: "Society / Section-8 company filings current" },
  { regulator: "GST", status: "active" as const, notes: "Research & consultancy GST returns filed" },
  { regulator: "Income Tax", status: "active" as const, notes: "80G / 12A exemptions maintained; TDS filed" },
  { regulator: "RBI", status: "evaluated" as const, notes: "Foreign grants under FEMA monitored" },
  { regulator: "SEBI", status: "not_applicable" as const, notes: "Not applicable for this institution type" },
];

const demoTasks = [
  { id: "1", title: "NAAC Self-Study Report Submission", regulator: "UGC", priority: "critical" as const, status: "in_progress" as const, dueDate: "Apr 15, 2026" },
  { id: "2", title: "NBA Accreditation Renewal – Engineering", regulator: "NBA", priority: "high" as const, status: "pending" as const, dueDate: "Apr 30, 2026" },
  { id: "3", title: "UGC Annual Return Filing", regulator: "UGC", priority: "high" as const, status: "under_review" as const, dueDate: "Mar 31, 2026" },
  { id: "4", title: "TDS Deduction on Salary (Q4)", regulator: "Income Tax", priority: "medium" as const, status: "pending" as const, dueDate: "Apr 7, 2026" },
  { id: "5", title: "AICTE Compliance Report FY 2025-26", regulator: "AICTE", priority: "high" as const, status: "pending" as const, dueDate: "May 15, 2026" },
  { id: "6", title: "EPF/ESI Monthly Contribution Filing", regulator: "Labour", priority: "medium" as const, status: "completed" as const, dueDate: "Mar 15, 2026" },
  { id: "7", title: "Income Tax Return (Form 10B)", regulator: "Income Tax", priority: "critical" as const, status: "in_progress" as const, dueDate: "Sep 30, 2026" },
];

const demoDocuments = [
  { id: "1", name: "NAAC Self-Study Report Draft", fileType: "pdf", regulator: "UGC", status: "under_review" as const, uploadedAt: "Mar 10, 2026" },
  { id: "2", name: "UGC Annual Return 2025", fileType: "pdf", regulator: "UGC", status: "submitted" as const, uploadedAt: "Mar 02, 2026" },
  { id: "3", name: "80G Exemption Certificate", fileType: "pdf", regulator: "Income Tax", status: "approved" as const, uploadedAt: "Jan 15, 2026" },
  { id: "4", name: "NBA Programme Evaluation Report", fileType: "docx", regulator: "NBA", status: "under_review" as const, uploadedAt: "Feb 28, 2026" },
  { id: "5", name: "AICTE Compliance Evidence Pack", fileType: "pdf", regulator: "AICTE", status: "draft" as const, uploadedAt: "Mar 20, 2026" },
  { id: "6", name: "EPF/ESI Payment Receipts Q4", fileType: "pdf", regulator: "Labour", status: "approved" as const, uploadedAt: "Mar 16, 2026" },
];

const demoDeadlines = [
  { id: "1", title: "UGC Annual Return Filing", regulator: "UGC", dueDate: "Mar 31, 2026", isRecurring: true, daysLeft: 3 },
  { id: "2", title: "TDS on Salaries Q4", regulator: "Income Tax", dueDate: "Apr 7, 2026", isRecurring: true, daysLeft: 10 },
  { id: "3", title: "NAAC SSR Submission", regulator: "UGC", dueDate: "Apr 15, 2026", isRecurring: false, daysLeft: 18 },
  { id: "4", title: "NBA Accreditation Renewal", regulator: "NBA", dueDate: "Apr 30, 2026", isRecurring: false, daysLeft: 33 },
  { id: "5", title: "AICTE Compliance Report", regulator: "AICTE", dueDate: "May 15, 2026", isRecurring: true, daysLeft: 48 },
];

const UniversityDemoDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Demo dashboard must always open, independent of auth/env state.
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading University Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Dashboard Type Navigation */}
          <DashboardTypeNav activeType="university" />

          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
          >
            <p className="text-sm text-emerald-400">
              <strong>University Demo Dashboard</strong> — Sample data for a higher-education institution.{" "}
              <span className="text-muted-foreground ml-2">Sign in to access your institution's actual compliance data.</span>
            </p>
          </motion.div>

          <AIVoiceBriefAgent
            dashboardId="demo-university"
            actorName="Compliance Registrar"
            roleLabel="University Dashboard"
            pendingWork={demoTasks
              .filter((t) => t.status !== "completed")
              .slice(0, 3)
              .map((t) => `${t.title} due ${t.dueDate}`)}
            newRules={demoExposures.slice(0, 3).map((e) => `${e.regulator}: ${e.notes}`)}
            autopilotActions={[
              "Queued NAAC submission reminder to Registrar and Academic Affairs team",
              "Prepared UGC filing checklist with supporting evidence mapped",
            ]}
            actionLedger={[
              {
                id: "uni-ledger-1",
                timeLabel: "07:10 AM",
                portal: "UGC",
                action: "Drafted NAAC Self-Study Report section checklist and linked accreditation evidence.",
                status: "completed",
              },
              {
                id: "uni-ledger-2",
                timeLabel: "07:24 AM",
                portal: "Income Tax",
                action: "Validated TDS deduction records for Q4 salary payroll.",
                status: "completed",
              },
              {
                id: "uni-ledger-3",
                timeLabel: "07:38 AM",
                portal: "NBA",
                action: "Prepared programme evaluation summary for accreditation renewal.",
                status: "needs_approval",
                approvalTitle: "Approve circulation of NBA evaluation summary to Heads of Department.",
              },
            ]}
          />

          <DashboardHeader
            companyName={demoUniversity.name}
            industry={demoUniversity.industry}
            complianceHealth={demoUniversity.complianceHealth}
          />

          <RegulatoryExposurePanel exposures={demoExposures} />

          <AIBusinessIntelligencePanel
            companyName={demoUniversity.name}
            industry={demoUniversity.industry}
            complianceHealth={demoUniversity.complianceHealth}
            exposures={demoExposures}
            tasks={demoTasks}
            deadlines={demoDeadlines}
          />

          {/* Compliance Gap & Law Impact */}
          <ComplianceGapSection />
          <UpcomingLawImpactSection />
          <AuditEvidenceVault />

          <QuickActions />

          <ComplianceTasksTable tasks={demoTasks} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DocumentVault documents={demoDocuments} />
            </div>
            <div className="lg:col-span-1">
              <UpcomingDeadlines deadlines={demoDeadlines} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UniversityDemoDashboard;
