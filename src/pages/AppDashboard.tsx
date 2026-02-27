import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const AppDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["app-dashboard", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }

      const { data: membership, error: membershipError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership?.company_id) {
        return {
          company: null,
          exposures: [],
          tasks: [],
          documents: [],
          deadlines: [],
        };
      }

      const companyId = membership.company_id;

      const [companyResult, exposuresResult, tasksResult, documentsResult, deadlinesResult] = await Promise.all([
        supabase.from("companies").select("id, name, industry, compliance_health").eq("id", companyId).single(),
        supabase
          .from("regulatory_exposure")
          .select("id, regulator, status, notes")
          .eq("company_id", companyId)
          .order("regulator", { ascending: true }),
        supabase
          .from("compliance_tasks")
          .select("id, title, regulator, priority, status, due_date")
          .eq("company_id", companyId)
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(20),
        supabase
          .from("documents")
          .select("id, name, file_type, regulator, status, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("deadlines")
          .select("id, title, regulator, due_date, is_recurring")
          .eq("company_id", companyId)
          .order("due_date", { ascending: true })
          .limit(20),
      ]);

      if (companyResult.error) throw companyResult.error;
      if (exposuresResult.error) throw exposuresResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (documentsResult.error) throw documentsResult.error;
      if (deadlinesResult.error) throw deadlinesResult.error;

      return {
        company: companyResult.data,
        exposures: exposuresResult.data ?? [],
        tasks: tasksResult.data ?? [],
        documents: documentsResult.data ?? [],
        deadlines: deadlinesResult.data ?? [],
      };
    },
  });

  const mappedData = useMemo(() => {
    if (!data) return null;

    const now = new Date();

    return {
      company: {
        name: data.company?.name ?? "Your Company",
        industry: data.company?.industry ?? "",
        complianceHealth: data.company?.compliance_health ?? 0,
      },
      exposures: data.exposures.map((exposure) => ({
        regulator: exposure.regulator,
        status: exposure.status,
        notes: exposure.notes ?? undefined,
      })),
      tasks: data.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        regulator: task.regulator,
        priority: task.priority,
        status: task.status,
        dueDate: task.due_date ? format(parseISO(task.due_date), "MMM dd, yyyy") : "No due date",
      })),
      documents: data.documents.map((document) => ({
        id: document.id,
        name: document.name,
        fileType: document.file_type ?? "file",
        regulator: document.regulator ?? undefined,
        status: document.status,
        uploadedAt: format(parseISO(document.created_at), "MMM dd, yyyy"),
      })),
      deadlines: data.deadlines.map((deadline) => {
        const dueDate = parseISO(deadline.due_date);
        return {
          id: deadline.id,
          title: deadline.title,
          regulator: deadline.regulator,
          dueDate: format(dueDate, "MMM dd, yyyy"),
          isRecurring: deadline.is_recurring ?? false,
          daysLeft: Math.max(differenceInCalendarDays(dueDate, now), 0),
        };
      }),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading production dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Failed to load dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Unexpected error"}
          </p>
        </div>
      </div>
    );
  }

  if (!data?.company || !mappedData) {
    const handleCreateCompany = async () => {
      if (!companyName.trim()) {
        toast({
          title: "Company name required",
          description: "Enter your company name to create your workspace.",
          variant: "destructive",
        });
        return;
      }

      setCreatingCompany(true);
      try {
        const supabaseAny = supabase as any;
        const { error } = await supabaseAny.rpc("create_company_with_owner", {
          _name: companyName.trim(),
          _industry: industry.trim() || null,
        });

        if (error) throw error;

        toast({
          title: "Company workspace created",
          description: "Your live compliance dashboard is now ready.",
        });
        window.location.reload();
      } catch (error) {
        toast({
          title: "Failed to create company",
          description: error instanceof Error ? error.message : "Unexpected error",
          variant: "destructive",
        });
      } finally {
        setCreatingCompany(false);
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <DashboardTypeNav activeType="company" routePrefix="/app" />
            <div className="glass-card p-8 text-center">
              <h1 className="text-2xl font-semibold mb-3">No company is assigned yet</h1>
              <p className="text-muted-foreground mb-6">
                Create your company workspace to start using live compliance data immediately.
              </p>
              <div className="max-w-md mx-auto space-y-3 text-left">
                <Input
                  placeholder="Company name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
                <Input
                  placeholder="Industry (optional)"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                />
                <Button className="w-full btn-glow" onClick={handleCreateCompany} disabled={creatingCompany}>
                  {creatingCompany ? "Creating workspace..." : "Create Company Workspace"}
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="company" routePrefix="/app" />

          <DashboardHeader
            companyName={mappedData.company.name}
            industry={mappedData.company.industry}
            complianceHealth={mappedData.company.complianceHealth}
          />

          <RegulatoryExposurePanel exposures={mappedData.exposures} />

          <ComplianceGapSection />
          <UpcomingLawImpactSection />
          <AuditEvidenceVault />

          <QuickActions />

          <ComplianceTasksTable tasks={mappedData.tasks} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DocumentVault documents={mappedData.documents} />
            </div>
            <div className="lg:col-span-1">
              <UpcomingDeadlines deadlines={mappedData.deadlines} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppDashboard;
