import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import AdminHomeSection from "@/components/admin-dashboard/AdminHomeSection";
import CompanyRiskOversight from "@/components/admin-dashboard/CompanyRiskOversight";
import CAManagementSection from "@/components/admin-dashboard/CAManagementSection";
import RegulationRuleEngine from "@/components/admin-dashboard/RegulationRuleEngine";
import ComplianceHealthLogic from "@/components/admin-dashboard/ComplianceHealthLogic";
import AuditQualityControl from "@/components/admin-dashboard/AuditQualityControl";
import IncidentManagement from "@/components/admin-dashboard/IncidentManagement";
import SystemActivityLogs from "@/components/admin-dashboard/SystemActivityLogs";
import PlatformAnalytics from "@/components/admin-dashboard/PlatformAnalytics";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.warn("Admin dashboard auth check failed, continuing in demo mode.", error);
      } finally {
        // Demo mode - show dashboard without auth
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="admin" />
          
          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center"
          >
            <p className="text-sm text-purple-400">
              <strong>Admin Control Center</strong> — Full platform oversight, CA governance, and system management.
            </p>
          </motion.div>

          <AdminHomeSection />
          <CompanyRiskOversight />
          <CAManagementSection />
          <RegulationRuleEngine />
          <ComplianceHealthLogic />
          <AuditQualityControl />
          <IncidentManagement />
          <SystemActivityLogs />
          <PlatformAnalytics />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
