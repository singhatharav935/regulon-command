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
import AIBusinessIntelligencePanel from "@/components/dashboard/AIBusinessIntelligencePanel";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import RuntimeErrorBoundary from "@/components/common/RuntimeErrorBoundary";
import { workspaceBackendRequest } from "@/lib/workspace-backend";

const AppDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [repairingOnboarding, setRepairingOnboarding] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["app-dashboard", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return workspaceBackendRequest<{
        company: { name: string; industry: string | null; compliance_health: number | null } | null;
        exposures: Array<{ regulator: string; status: string; notes: string | null }>;
        tasks: Array<{ id: string; title: string; regulator: string; priority: string; status: string; due_date: string | null }>;
        documents: Array<{ id: string; name: string; file_type: string | null; regulator: string | null; status: string; created_at: string }>;
        deadlines: Array<{ id: string; title: string; regulator: string; due_date: string; is_recurring: boolean | null }>;
        draftRuns: Array<{ id: string; document_type: string; draft_mode: string; status: string; created_at: string }>;
        draftAuditEvents: Array<{ id: string; draft_run_id: string; event_type: string; created_at: string }>;
      }>("/company/dashboard");
    },
  });

  const { data: onboarding } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User is not authenticated");
      }
      return workspaceBackendRequest<{
        ready_for_dashboard: boolean;
        target_dashboard: string;
        next_steps: string[];
        blockers: Array<{ code: string; message: string; severity: string }>;
      }>("/onboarding/status");
    },
  });

  const mappedData = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const lawPreparationByRegulator: Record<string, string[]> = {
      MCA: ["Validate statutory registers", "Prepare board resolution backup", "Cross-check filing evidence"],
      GST: ["Reconcile invoices and GSTR data", "Prepare ITC support pack", "Review portal filing acknowledgements"],
      "Income Tax": ["Prepare computation note", "Review supporting ledgers", "Compile response annexures"],
      RBI: ["Map FEMA transaction trail", "Collect AD bank records", "Validate reporting timelines"],
      SEBI: ["Validate disclosure matrix", "Compile exchange filings", "Prepare governance notes"],
      Contract: ["Review clause obligations", "Map exception register", "Prepare amendment recommendations"],
      Customs: ["Validate BOE documentation", "Prepare valuation support", "Compile duty computation trail"],
    };

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
      draftRuns: data.draftRuns.map((run: { id: string; document_type: string; draft_mode: string; status: string; created_at: string }) => ({
        id: run.id,
        documentType: run.document_type,
        draftMode: run.draft_mode,
        status: run.status,
        createdAt: format(parseISO(run.created_at), "MMM dd, yyyy HH:mm"),
      })),
      draftAuditEvents: data.draftAuditEvents.map((event: { id: string; event_type: string; created_at: string }) => ({
        id: event.id,
        eventType: event.event_type,
        createdAt: format(parseISO(event.created_at), "MMM dd, yyyy HH:mm"),
      })),
      complianceGaps: data.tasks
        .filter((task) => task.status !== "completed")
        .slice(0, 8)
        .map((task) => {
          const taskDueDate = task.due_date ? parseISO(task.due_date) : null;
          const days = taskDueDate ? differenceInCalendarDays(taskDueDate, now) : null;
          const type = days !== null && days < 0
            ? "expired"
            : task.status === "pending"
              ? "missing"
              : "pending";
          const impact = task.priority === "critical"
            ? "+6%"
            : task.priority === "high"
              ? "+4%"
              : "+2%";
          return {
            id: task.id,
            type,
            title: task.title,
            regulator: task.regulator,
            impact,
            timeToClose: days === null ? "TBD" : days <= 0 ? "Immediate" : `${days} day${days === 1 ? "" : "s"}`,
          };
        }),
      upcomingLawImpacts: data.exposures
        .slice(0, 6)
        .map((exposure) => {
          const riskLevel = exposure.status === "critical" || exposure.status === "non_compliant"
            ? "high"
            : exposure.status === "potential" || exposure.status === "watchlist"
              ? "medium"
              : "low";
          const scoreImpact = riskLevel === "high" ? "-10%" : riskLevel === "medium" ? "-5%" : "-2%";
          const preparationSteps = lawPreparationByRegulator[exposure.regulator] ?? [
            "Review latest compliance obligation",
            "Prepare filing-ready evidence",
            "Assign responsible owner and due date",
          ];
          return {
            id: exposure.regulator,
            title: `${exposure.regulator} Compliance Update`,
            effectiveDate: "Immediate",
            scoreImpact,
            riskLevel,
            riskDescription: exposure.notes ?? `Active ${exposure.regulator} exposure requires monitoring and action.`,
            preparationSteps,
          };
        }),
      auditRecords: [
        ...data.documents.slice(0, 12).map((document) => ({
          id: `doc-${document.id}`,
          category: (document.status === "submitted" ? "filing" : "evidence") as "filing" | "evidence",
          title: document.name,
          regulator: document.regulator ?? "General",
          date: format(parseISO(document.created_at), "MMM yyyy"),
          status: document.status === "submitted" ? "ready" : "pending",
        })),
        ...data.deadlines.slice(0, 6).map((deadline) => ({
          id: `deadline-${deadline.id}`,
          category: "timeline" as const,
          title: deadline.title,
          regulator: deadline.regulator,
          date: format(parseISO(deadline.due_date), "MMM dd, yyyy"),
          status: "ready" as const,
        })),
      ].slice(0, 18),
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
    const handleRepairOnboarding = async () => {
      setRepairingOnboarding(true);
      try {
        await workspaceBackendRequest<{
          repaired: { role: string; persona: string };
        }>("/onboarding/repair-self", {
          method: "POST",
          body: JSON.stringify({}),
        });
        toast({
          title: "Onboarding state repaired",
          description: "Role/persona/verification rows are synced. You can continue setup.",
        });
        window.location.reload();
      } catch (error) {
        toast({
          title: "Onboarding repair failed",
          description: error instanceof Error ? error.message : "Unexpected error",
          variant: "destructive",
        });
      } finally {
        setRepairingOnboarding(false);
      }
    };

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
        await workspaceBackendRequest<{ created: boolean }>("/company/workspace", {
          method: "POST",
          body: JSON.stringify({
            name: companyName.trim(),
            industry: industry.trim() || null,
          }),
        });

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
              {onboarding?.blockers?.length ? (
                <div className="max-w-2xl mx-auto mb-5 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-left">
                  <p className="text-sm font-medium text-amber-300 mb-2">Onboarding blockers</p>
                  <ul className="text-xs text-amber-100/90 space-y-1">
                    {onboarding.blockers.map((blocker) => (
                      <li key={blocker.code}>• {blocker.message}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleRepairOnboarding} disabled={repairingOnboarding}>
                      {repairingOnboarding ? "Repairing..." : "Repair My Onboarding State"}
                    </Button>
                  </div>
                </div>
              ) : null}
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

          <RuntimeErrorBoundary scopeLabel="Company Voice Agent">
            <AIVoiceBriefAgent
              dashboardId="app-company"
              actorName={mappedData.company.name}
              roleLabel="Company Compliance Workspace"
              pendingWork={mappedData.tasks.filter((task) => task.status !== "completed").slice(0, 4).map((task) => `${task.title} (${task.regulator})`)}
              newRules={mappedData.exposures.slice(0, 4).map((item) => `${item.regulator}: ${item.notes || "status updated"}`)}
              autopilotActions={[
                "Prepared upcoming deadline alerts for client stakeholders",
                "Updated regulator exposure summary with current task posture",
              ]}
            />
          </RuntimeErrorBoundary>

          <RuntimeErrorBoundary scopeLabel="Company Dashboard Content">
            <DashboardHeader
              companyName={mappedData.company.name}
              industry={mappedData.company.industry}
              complianceHealth={mappedData.company.complianceHealth}
            />

            <RegulatoryExposurePanel exposures={mappedData.exposures} />

            <AIBusinessIntelligencePanel
              companyName={mappedData.company.name}
              industry={mappedData.company.industry}
              complianceHealth={mappedData.company.complianceHealth}
              exposures={mappedData.exposures}
              tasks={mappedData.tasks}
              deadlines={mappedData.deadlines}
            />

            <ComplianceGapSection gaps={mappedData.complianceGaps} useDemoFallback={false} />
            <UpcomingLawImpactSection impacts={mappedData.upcomingLawImpacts} useDemoFallback={false} />
            <AuditEvidenceVault records={mappedData.auditRecords} useDemoFallback={false} />

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="glass-card border border-border/40 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Live Draft Workflow</h2>
                {mappedData.draftRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No live draft runs for this company yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mappedData.draftRuns.slice(0, 8).map((run) => (
                      <div key={run.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3">
                        <div>
                          <p className="font-medium text-sm">{run.documentType}</p>
                          <p className="text-xs text-muted-foreground">{run.draftMode} · {run.createdAt}</p>
                        </div>
                        <span className="text-xs rounded-full border border-border px-3 py-1">{run.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card border border-border/40 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Audit Trail Snapshot</h2>
                {mappedData.draftAuditEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No draft audit events recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mappedData.draftAuditEvents.slice(0, 8).map((event) => (
                      <div key={event.id} className="rounded-lg border border-border/40 p-3">
                        <p className="font-medium text-sm">{event.eventType}</p>
                        <p className="text-xs text-muted-foreground">{event.createdAt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </RuntimeErrorBoundary>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppDashboard;
