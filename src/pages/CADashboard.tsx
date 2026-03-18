import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import CAHomeSection from "@/components/ca-dashboard/CAHomeSection";
import ClientPortfolioSection from "@/components/ca-dashboard/ClientPortfolioSection";
import TaskFilingManagement from "@/components/ca-dashboard/TaskFilingManagement";
import ClientDependencyTracker from "@/components/ca-dashboard/ClientDependencyTracker";
import CALawImpactSection from "@/components/ca-dashboard/CALawImpactSection";
import ComplianceChangeLog from "@/components/ca-dashboard/ComplianceChangeLog";
import CAAuditSupport from "@/components/ca-dashboard/CAAuditSupport";
import CACommunicationLogs from "@/components/ca-dashboard/CACommunicationLogs";
import CAAnalyticsSection from "@/components/ca-dashboard/CAAnalyticsSection";
import AIDraftingEngine from "@/components/ca-dashboard/AIDraftingEngine";
import ComplianceChatbot from "@/components/ca-dashboard/ComplianceChatbot";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";

const CADashboard = () => {
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
          <p className="text-muted-foreground">Loading CA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca" />
          
          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center"
          >
            <p className="text-sm text-cyan-400">
              <strong>CA Professional Dashboard</strong> — Manage all assigned companies and compliance tasks from one control center.
            </p>
          </motion.div>

          <AIVoiceBriefAgent
            dashboardId="demo-ca"
            actorName="CA"
            roleLabel="CA Professional Dashboard"
            pendingWork={[
              "Review pending MCA adjudication drafts and hearing asks",
              "Validate GST rebuttal evidence mapping before filing",
              "Update client dependency blockers for overdue tasks",
            ]}
            newRules={[
              "MCA: Prioritize date-anchored Section 454 proviso submissions",
              "GST: Keep accepted vs disputed computation matrix mandatory",
            ]}
            autopilotActions={[
              "Generated class-aware draft templates for active notices",
              "Flagged high-risk drafts for immediate CA review",
            ]}
            actionLedger={[
              {
                id: "ca-ledger-1",
                timeLabel: "05:42 AM",
                portal: "GST",
                action: "Scanned new GST mismatch notices and generated point-by-point reconciliations for 4 clients.",
                status: "completed",
              },
              {
                id: "ca-ledger-2",
                timeLabel: "05:58 AM",
                portal: "MCA",
                action: "Updated annual filing draft matrix with chronology, officer defense, and Section 454 anchors.",
                status: "completed",
              },
              {
                id: "ca-ledger-3",
                timeLabel: "06:06 AM",
                portal: "Income Tax",
                action: "Mapped 143(2) query points with AIS/TDS mismatch evidence bundle.",
                status: "needs_approval",
                approvalTitle: "Approve outward submission set for Income Tax hearing prep.",
              },
              {
                id: "ca-ledger-4",
                timeLabel: "06:17 AM",
                portal: "RBI/SEBI",
                action: "Refreshed compliance checklist for overnight circular updates and marked impacted clients.",
                status: "needs_approval",
                approvalTitle: "Approve client alerts for RBI/SEBI circular impact.",
              },
            ]}
          />

          <CAHomeSection />
          
          {/* AI Drafting Engine - CA Only */}
          <AIDraftingEngine demoMode />
          
          <ClientPortfolioSection />
          <TaskFilingManagement />
          <ClientDependencyTracker />
          <CALawImpactSection />
          <ComplianceChangeLog />
          <CAAuditSupport />
          <CACommunicationLogs />
          <CAAnalyticsSection />
        </div>
      </main>
      
      <Footer />
      
      {/* Compliance Chatbot - Floating */}
      <ComplianceChatbot />
    </div>
  );
};

export default CADashboard;
