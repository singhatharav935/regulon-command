import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const AppAdminDashboard = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-workspace"],
    queryFn: async () => {
      const [
        companiesResult,
        tasksResult,
        docsResult,
        deadlinesResult,
        rolesResult,
        draftsResult,
      ] = await Promise.all([
        (supabase as any).from("companies").select("id, name, industry, compliance_health, created_at").order("created_at", { ascending: false }),
        (supabase as any).from("compliance_tasks").select("id, company_id, title, priority, status, due_date, created_at").order("created_at", { ascending: false }).limit(200),
        (supabase as any).from("documents").select("id, company_id, status, created_at").order("created_at", { ascending: false }).limit(200),
        (supabase as any).from("deadlines").select("id, company_id, title, due_date, created_at").order("due_date", { ascending: true }).limit(200),
        (supabase as any).from("user_roles").select("id, role, user_id"),
        (supabase as any).from("draft_runs").select("id, user_id, status, document_type, created_at").order("created_at", { ascending: false }).limit(200),
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (docsResult.error) throw docsResult.error;
      if (deadlinesResult.error) throw deadlinesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (draftsResult.error) throw draftsResult.error;

      return {
        companies: companiesResult.data ?? [],
        tasks: tasksResult.data ?? [],
        documents: docsResult.data ?? [],
        deadlines: deadlinesResult.data ?? [],
        roles: rolesResult.data ?? [],
        drafts: draftsResult.data ?? [],
      };
    },
  });

  const mapped = useMemo(() => {
    if (!data) return null;

    const companiesById = new Map<string, { name: string }>();
    for (const company of data.companies) {
      companiesById.set(company.id, { name: company.name });
    }

    const openTasks = data.tasks.filter((task) => task.status !== "completed").length;
    const overdueTasks = data.tasks.filter((task) => task.status === "overdue").length;
    const approvedDocuments = data.documents.filter((doc) => doc.status === "approved").length;

    const roleCounts = {
      admin: data.roles.filter((r) => r.role === "admin").length,
      manager: data.roles.filter((r) => r.role === "manager").length,
      user: data.roles.filter((r) => r.role === "user").length,
    };

    return {
      stats: {
        companies: data.companies.length,
        openTasks,
        overdueTasks,
        approvedDocuments,
        draftRuns: data.drafts.length,
      },
      roleCounts,
      recentCompanies: data.companies.slice(0, 10),
      criticalTasks: data.tasks.filter((task) => task.priority === "critical" || task.status === "overdue").slice(0, 20).map((task) => ({
        ...task,
        companyName: companiesById.get(task.company_id)?.name || "Unknown company",
      })),
      recentDrafts: data.drafts.slice(0, 20),
      nearestDeadlines: data.deadlines.slice(0, 20).map((deadline) => ({
        ...deadline,
        companyName: companiesById.get(deadline.company_id)?.name || "Unknown company",
      })),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Failed to load admin workspace</h1>
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
          <DashboardTypeNav activeType="admin" routePrefix="/app" />

          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <p className="text-sm text-purple-300">
              <strong>Production Admin Workspace</strong> - Live tenant data, role oversight, and delivery monitoring.
            </p>
          </div>

          {mapped && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Companies</p><p className="text-2xl font-bold">{mapped.stats.companies}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Open Tasks</p><p className="text-2xl font-bold">{mapped.stats.openTasks}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overdue Tasks</p><p className="text-2xl font-bold">{mapped.stats.overdueTasks}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved Docs</p><p className="text-2xl font-bold">{mapped.stats.approvedDocuments}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Draft Runs</p><p className="text-2xl font-bold">{mapped.stats.draftRuns}</p></CardContent></Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="glass-card border-border/40">
                  <CardHeader><CardTitle>Role Distribution</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Admins: <span className="font-semibold">{mapped.roleCounts.admin}</span></p>
                    <p>Managers: <span className="font-semibold">{mapped.roleCounts.manager}</span></p>
                    <p>Users: <span className="font-semibold">{mapped.roleCounts.user}</span></p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/40 lg:col-span-2">
                  <CardHeader><CardTitle>Latest Company Onboarding</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Health</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mapped.recentCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.industry || "-"}</TableCell>
                            <TableCell>{company.compliance_health ?? 0}%</TableCell>
                            <TableCell>{format(parseISO(company.created_at), "MMM dd, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card border-border/40 mb-8">
                <CardHeader><CardTitle>Critical Task Monitor</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mapped.criticalTasks.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-muted-foreground">No critical/overdue tasks right now.</TableCell></TableRow>
                      ) : mapped.criticalTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.companyName}</TableCell>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.priority}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={task.status === "overdue" ? "border-red-500/40 text-red-300" : "border-yellow-500/40 text-yellow-300"}>{task.status}</Badge>
                          </TableCell>
                          <TableCell>{task.due_date ? format(parseISO(task.due_date), "MMM dd, yyyy") : "No due date"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-border/40">
                  <CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mapped.nearestDeadlines.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.companyName}</TableCell>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{format(parseISO(item.due_date), "MMM dd, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/40">
                  <CardHeader><CardTitle>Recent Draft Runs</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mapped.recentDrafts.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.document_type}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{format(parseISO(item.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppAdminDashboard;
