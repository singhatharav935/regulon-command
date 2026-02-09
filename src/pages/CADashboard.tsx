import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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

const CADashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Demo mode - show dashboard without auth
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

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

          <CAHomeSection />
          
          {/* AI Drafting Engine - CA Only */}
          <AIDraftingEngine />
          
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
