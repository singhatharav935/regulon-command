import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import CAHomeSection from "@/components/ca-dashboard/CAHomeSection";
import ClientPortfolioSection from "@/components/ca-dashboard/ClientPortfolioSection";
import TaskFilingManagement from "@/components/ca-dashboard/TaskFilingManagement";
import ClientDependencyTracker from "@/components/ca-dashboard/ClientDependencyTracker";
import RegulatoryNewsRuleImpact from "@/components/ca-dashboard/RegulatoryNewsRuleImpact";
import ComplianceChangeLog from "@/components/ca-dashboard/ComplianceChangeLog";
import CAAuditSupport from "@/components/ca-dashboard/CAAuditSupport";
import CACommunicationLogs from "@/components/ca-dashboard/CACommunicationLogs";
import CAAnalyticsSection from "@/components/ca-dashboard/CAAnalyticsSection";
import AIDraftingEngine from "@/components/ca-dashboard/AIDraftingEngine";
import ComplianceChatbot from "@/components/ca-dashboard/ComplianceChatbot";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";
import SannidhLiveAgent from "@/components/ai/SannidhLiveAgent";
import ComplianceModulesHub from "@/components/ca-dashboard/compliance-modules/ComplianceModulesHub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { CAAgentProvider } from "@/components/agents/CAAgentOrchestrator";

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
    <CAAgentProvider>
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

            {/* Sannidh Live AI Agent - Conversational like Siri/Alexa */}
            <SannidhLiveAgent
              dashboardId="demo-ca"
              dashboardType="ca"
              userName="CA Professional"
              companyName="Your Clients"
            />

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
            
            {/* Calculators & Forms Section */}
            <section className="mt-16 mb-16">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-rose-400 flex items-center gap-2">
                      <Calculator className="w-6 h-6" />
                      Calculators, Forms & Audits
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Professional financial optimizers and compliance generators.
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                      23+ Modules Active
                    </span>
                  </div>
                </div>
              </div>
              <ComplianceModulesHub 
                demoClients={[
                  { id: "demo-1", name: "Acme Technologies (Demo)" },
                  { id: "demo-2", name: "GlobalTrade India (Demo)" },
                  { id: "demo-3", name: "SecurePay Solutions (Demo)" },
                  { id: "demo-4", name: "Vertex EduTech (Demo)" }
                ]} 
              />
            </section>

            <ClientDependencyTracker isRealDashboard={false} />
            <RegulatoryNewsRuleImpact isRealDashboard={false} />
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
    </CAAgentProvider>
  );
};

export default CADashboard;
