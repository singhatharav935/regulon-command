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
import { useCAWorkspace } from "@/hooks/use-ca-workspace";

const AppCADashboard = () => {
  const { loading, workspaceType, source } = useCAWorkspace();
  const isRegulonCA = workspaceType === "regulon_ca";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading CA workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca" routePrefix="/app" />

          <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <p className="text-sm text-cyan-400">
              <strong>{isRegulonCA ? "Regulon In-House CA Workspace" : "External CA Workspace"}</strong>
              {" "} - {isRegulonCA
                ? "Includes in-house legal review workflow for company-led execution."
                : "Solo CA mode: legal step is removed; CA goes directly to final approval."}
            </p>
            <p className="text-xs text-cyan-300/80 mt-1">
              Workspace profile source: {source === "profile" ? "configured" : "default (external_ca)"}
            </p>
          </div>

          <CAHomeSection />
          <AIDraftingEngine includeLawyerReview={isRegulonCA} />
          <ClientPortfolioSection />
          <TaskFilingManagement />
          <ClientDependencyTracker />
          {isRegulonCA ? <CALawImpactSection /> : null}
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
