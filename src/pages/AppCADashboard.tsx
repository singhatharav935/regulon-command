import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import AIDraftingEngine from "@/components/ca-dashboard/AIDraftingEngine";
import ComplianceChatbot from "@/components/ca-dashboard/ComplianceChatbot";
import { useCAWorkspace } from "@/hooks/use-ca-workspace";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusClass: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  in_progress: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  under_review: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  completed: "bg-green-500/20 text-green-300 border-green-500/40",
  overdue: "bg-red-500/20 text-red-300 border-red-500/40",
};

const AppCADashboard = () => {
  const { user } = useAuth();
  const { loading, workspaceType, source } = useCAWorkspace();
  const isRegulonCA = workspaceType === "regulon_ca";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ca-workspace", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("User is not authenticated");

      const { data: memberships, error: membershipError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;
      const companyIds = Array.from(new Set((memberships ?? []).map((row) => row.company_id)));

      if (companyIds.length === 0) {
        return { companies: [], tasks: [], deadlines: [], documents: [], drafts: [] };
      }

      const [companiesResult, tasksResult, deadlinesResult, documentsResult, draftsResult] = await Promise.all([
        (supabase as any)
          .from("companies")
          .select("id, name, industry, compliance_health")
          .in("id", companyIds)
          .order("name", { ascending: true }),
        (supabase as any)
          .from("compliance_tasks")
          .select("id, company_id, title, regulator, priority, status, due_date")
          .in("company_id", companyIds)
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(150),
        (supabase as any)
          .from("deadlines")
          .select("id, company_id, title, regulator, due_date")
          .in("company_id", companyIds)
          .order("due_date", { ascending: true })
          .limit(120),
        (supabase as any)
          .from("documents")
          .select("id, company_id, name, status, created_at")
          .in("company_id", companyIds)
          .order("created_at", { ascending: false })
          .limit(120),
        (supabase as any)
          .from("draft_runs")
          .select("id, company_id, document_type, draft_mode, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (deadlinesResult.error) throw deadlinesResult.error;
      if (documentsResult.error) throw documentsResult.error;
      if (draftsResult.error) throw draftsResult.error;

      return {
        companies: companiesResult.data ?? [],
        tasks: tasksResult.data ?? [],
        deadlines: deadlinesResult.data ?? [],
        documents: documentsResult.data ?? [],
        drafts: draftsResult.data ?? [],
      };
    },
  });

  const mapped = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const deadlineByCompany = new Map<string, Date>();
    for (const deadline of data.deadlines) {
      if (!deadline?.due_date) continue;
      const parsed = parseISO(deadline.due_date);
      const prev = deadlineByCompany.get(deadline.company_id);
      if (!prev || parsed < prev) deadlineByCompany.set(deadline.company_id, parsed);
    }

    const taskCountByCompany = new Map<string, number>();
    for (const task of data.tasks) {
      taskCountByCompany.set(task.company_id, (taskCountByCompany.get(task.company_id) ?? 0) + 1);
    }

    const companies = data.companies.map((company) => {
      const health = company.compliance_health ?? 0;
      const risk = health < 70 ? "High" : health < 85 ? "Medium" : "Low";
      const nextDeadline = deadlineByCompany.get(company.id);
      return {
        ...company,
        risk,
        openTasks: taskCountByCompany.get(company.id) ?? 0,
        nextDeadline: nextDeadline ? format(nextDeadline, "MMM dd, yyyy") : "No upcoming deadline",
      };
    });

    const pendingTasks = data.tasks.filter((task) => task.status !== "completed").length;
    const dueIn7 = data.tasks.filter((task) => {
      if (!task.due_date || task.status === "completed") return false;
      const delta = differenceInCalendarDays(parseISO(task.due_date), now);
      return delta >= 0 && delta <= 7;
    }).length;

    return {
      companies,
      tasks: data.tasks,
      drafts: data.drafts,
      stats: {
        assignedCompanies: companies.length,
        pendingTasks,
        dueIn7,
        highRiskCompanies: companies.filter((company) => company.risk === "High").length,
        documents: data.documents.length,
      },
    };
  }, [data]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading CA workspace...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Failed to load CA workspace</h1>
          <p className="text-muted-foreground text-sm">{error instanceof Error ? error.message : "Unexpected error"}</p>
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
              {" "}- {isRegulonCA
                ? "Includes in-house legal review workflow for company-led execution."
                : "Solo CA mode: legal step is removed; CA goes directly to final approval."}
            </p>
            <p className="text-xs text-cyan-300/80 mt-1">
              Workspace profile source: {source === "profile" ? "configured" : "default (external_ca)"}
            </p>
          </div>

          {!mapped || mapped.stats.assignedCompanies === 0 ? (
            <Card className="glass-card border-border/40 mb-8">
              <CardHeader>
                <CardTitle>No companies assigned</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Ask platform admin/company owner to assign you in <code>company_members</code> to start live CA operations.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Assigned Companies</p><p className="text-2xl font-bold">{mapped.stats.assignedCompanies}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending Tasks</p><p className="text-2xl font-bold">{mapped.stats.pendingTasks}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Due in 7 Days</p><p className="text-2xl font-bold">{mapped.stats.dueIn7}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">High Risk Companies</p><p className="text-2xl font-bold">{mapped.stats.highRiskCompanies}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Documents Tracked</p><p className="text-2xl font-bold">{mapped.stats.documents}</p></CardContent></Card>
              </div>

              <Card className="glass-card border-border/40 mb-8">
                <CardHeader>
                  <CardTitle>Client Portfolio (Live)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Open Tasks</TableHead>
                        <TableHead>Next Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapped.companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.industry || "-"}</TableCell>
                          <TableCell>{company.compliance_health ?? 0}%</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={company.risk === "High" ? "border-red-500/40 text-red-300" : company.risk === "Medium" ? "border-yellow-500/40 text-yellow-300" : "border-green-500/40 text-green-300"}>
                              {company.risk}
                            </Badge>
                          </TableCell>
                          <TableCell>{company.openTasks}</TableCell>
                          <TableCell>{company.nextDeadline}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/40 mb-8">
                <CardHeader>
                  <CardTitle>Task & Filing Queue (Live)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Authority</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapped.tasks.slice(0, 50).map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.regulator}</TableCell>
                          <TableCell>{task.priority}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusClass[task.status] ?? "border-border"}>{task.status}</Badge>
                          </TableCell>
                          <TableCell>{task.due_date ? format(parseISO(task.due_date), "MMM dd, yyyy") : "No due date"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/40 mb-8">
                <CardHeader>
                  <CardTitle>Recent Draft Workflows (Live)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapped.drafts.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-muted-foreground">No draft runs yet.</TableCell></TableRow>
                      ) : mapped.drafts.map((draft) => (
                        <TableRow key={draft.id}>
                          <TableCell>{draft.document_type}</TableCell>
                          <TableCell>{draft.draft_mode}</TableCell>
                          <TableCell><Badge variant="outline" className={statusClass[draft.status] ?? "border-border"}>{draft.status}</Badge></TableCell>
                          <TableCell>{format(parseISO(draft.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          <AIDraftingEngine includeLawyerReview={isRegulonCA} />
        </div>
      </main>

      <Footer />
      <ComplianceChatbot />
    </div>
  );
};

export default AppCADashboard;
