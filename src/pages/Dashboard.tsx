import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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

// Demo data for the dashboard example
const demoCompany = {
  name: "Acme Technologies Pvt. Ltd.",
  industry: "Financial Technology · Series B",
  complianceHealth: 87,
};

const demoExposures = [
  { regulator: "MCA", status: "active" as const, notes: "Annual filings up to date" },
  { regulator: "GST", status: "active" as const, notes: "Monthly returns filed" },
  { regulator: "Income Tax", status: "active" as const, notes: "Advance tax paid" },
  { regulator: "RBI", status: "active" as const, notes: "NBFC compliance monitored" },
  { regulator: "SEBI", status: "potential" as const, notes: "Evaluating for advisory registration" },
];

const demoTasks = [
  { id: "1", title: "Annual Return Filing (MGT-7)", regulator: "MCA", priority: "high" as const, status: "in_progress" as const, dueDate: "Feb 15, 2026" },
  { id: "2", title: "GST-3B January Filing", regulator: "GST", priority: "medium" as const, status: "pending" as const, dueDate: "Feb 20, 2026" },
  { id: "3", title: "Advance Tax Q4 Payment", regulator: "Income Tax", priority: "critical" as const, status: "under_review" as const, dueDate: "Mar 15, 2026" },
  { id: "4", title: "RBI Annual Compliance Certificate", regulator: "RBI", priority: "high" as const, status: "pending" as const, dueDate: "Mar 31, 2026" },
  { id: "5", title: "Board Meeting Minutes Filing", regulator: "MCA", priority: "low" as const, status: "completed" as const, dueDate: "Jan 30, 2026" },
];

const demoDocuments = [
  { id: "1", name: "Certificate of Incorporation", fileType: "pdf", regulator: "MCA", status: "approved" as const, uploadedAt: "Jan 10, 2026" },
  { id: "2", name: "GST Registration Certificate", fileType: "pdf", regulator: "GST", status: "approved" as const, uploadedAt: "Jan 10, 2026" },
  { id: "3", name: "Annual Return Draft 2025", fileType: "docx", regulator: "MCA", status: "under_review" as const, uploadedAt: "Jan 22, 2026" },
  { id: "4", name: "Tax Audit Report", fileType: "pdf", regulator: "Income Tax", status: "submitted" as const, uploadedAt: "Jan 20, 2026" },
  { id: "5", name: "RBI Compliance Report Q4", fileType: "pdf", regulator: "RBI", status: "under_review" as const, uploadedAt: "Jan 24, 2026" },
  { id: "6", name: "SEBI Advisory Evaluation", fileType: "docx", regulator: "SEBI", status: "under_review" as const, uploadedAt: "Jan 23, 2026" },
];

const demoDeadlines = [
  { id: "1", title: "TDS Return Filing", regulator: "Income Tax", dueDate: "Jan 31, 2026", isRecurring: true, daysLeft: 6 },
  { id: "2", title: "GST-3B Return", regulator: "GST", dueDate: "Feb 20, 2026", isRecurring: true, daysLeft: 26 },
  { id: "3", title: "Annual Return (MGT-7)", regulator: "MCA", dueDate: "Feb 15, 2026", isRecurring: false, daysLeft: 21 },
  { id: "4", title: "Advance Tax Q4", regulator: "Income Tax", dueDate: "Mar 15, 2026", isRecurring: true, daysLeft: 49 },
  { id: "5", title: "RBI Annual Certificate", regulator: "RBI", dueDate: "Mar 31, 2026", isRecurring: false, daysLeft: 65 },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.warn("Dashboard auth check failed, continuing in demo mode.", error);
      } finally {
        // For demo purposes, we always allow rendering.
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
          <p className="text-muted-foreground">Loading dashboard...</p>
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
          <DashboardTypeNav activeType="company" />
          
          {/* Demo Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center"
          >
            <p className="text-sm text-primary">
              <strong>Demo Dashboard</strong> — This is an example customer dashboard with sample data. 
              <span className="text-muted-foreground ml-2">Sign in to access your company's actual compliance data.</span>
            </p>
          </motion.div>

          <DashboardHeader 
            companyName={demoCompany.name}
            industry={demoCompany.industry}
            complianceHealth={demoCompany.complianceHealth}
          />
          
          <RegulatoryExposurePanel exposures={demoExposures} />
          
          {/* New Sections */}
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

export default Dashboard;
