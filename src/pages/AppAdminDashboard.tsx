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

const AppAdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="admin" routePrefix="/app" />

          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <p className="text-sm text-purple-400">
              <strong>Production Admin Workspace</strong> - Restricted access and centralized governance controls.
            </p>
          </div>

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

export default AppAdminDashboard;
