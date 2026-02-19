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

const AppCADashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca" routePrefix="/app" />

          <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <p className="text-sm text-cyan-400">
              <strong>Production CA Workspace</strong> - Access-controlled routing with authenticated AI calls.
            </p>
          </div>

          <CAHomeSection />
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
      <ComplianceChatbot />
    </div>
  );
};

export default AppCADashboard;
