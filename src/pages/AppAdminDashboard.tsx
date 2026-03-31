import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
// DashboardTypeNav removed - users should only see their assigned dashboard based on role
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";
import RegulonLiveAgent from "@/components/ai/RegulonLiveAgent";
import { useAuth } from "@/hooks/use-auth";
import { workspaceBackendRequest } from "@/lib/real-backend";

const AppAdminDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-workspace", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("User is not authenticated");
      
      // Check if we're in demo mode
      const isDemoMode = import.meta.env.VITE_ENABLE_PREVIEW_BYPASS === "true" || 
                        user.id.startsWith("local_");
      
      if (isDemoMode) {
        // Return demo data for admin role
        return {
          companies: [
            { 
              id: "demo-company-1", 
              name: "Demo Tech Corp", 
              industry: "Technology", 
              compliance_health: 85, 
              created_at: new Date().toISOString() 
            },
            { 
              id: "demo-company-2", 
              name: "Sample Industries", 
              industry: "Manufacturing", 
              compliance_health: 72, 
              created_at: new Date().toISOString() 
            }
          ],
          tasks: [
            {
              id: "demo-task-1",
              company_id: "demo-company-1",
              title: "System Health Check",
              priority: "high",
              status: "pending",
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          documents: [
            {
              id: "demo-doc-1", 
              company_id: "demo-company-1",
              status: "approved",
              created_at: new Date().toISOString()
            }
          ],
          deadlines: [
            {
              id: "demo-deadline-1",
              company_id: "demo-company-1",
              title: "Monthly System Review",
              due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          roles: [
            { id: "demo-role-1", role: "admin", user_id: user.id },
            { id: "demo-role-2", role: "manager", user_id: "demo-user-2" },
            { id: "demo-role-3", role: "user", user_id: "demo-user-3" }
          ],
          drafts: [
            {
              id: "demo-draft-1",
              user_id: user.id,
              status: "draft", 
              document_type: "system_report",
              created_at: new Date().toISOString()
            }
          ]
        };
      }
      
      try {
        return await workspaceBackendRequest<{
          companies: Array<{ id: string; name: string; industry: string | null; compliance_health: number | null; created_at: string }>;
          tasks: Array<{ id: string; company_id: string; title: string; priority: string; status: string; due_date: string | null; created_at: string }>;
          documents: Array<{ id: string; company_id: string; status: string; created_at: string }>;
          deadlines: Array<{ id: string; company_id: string; title: string; due_date: string; created_at: string }>;
          roles: Array<{ id: string; role: string; user_id: string }>;
          drafts: Array<{ id: string; user_id: string | null; status: string; document_type: string; created_at: string }>;
        }>("/admin/dashboard");
      } catch (error) {
        console.error("Failed to load admin dashboard data:", error);
        throw new Error("Unable to load admin dashboard data. Please check system configuration.");
      }
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

  if (isError && !data) {
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
          {/* Dashboard navigation removed - Admin users access admin panel only */}

          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <p className="text-sm text-purple-300">
              <strong>Production Admin Workspace</strong> - Live tenant data, role oversight, and delivery monitoring.
            </p>
          </div>

          <AIVoiceBriefAgent
            dashboardId="app-admin"
            actorName="Platform Admin"
            roleLabel="Production Admin Workspace"
            pendingWork={[
              `Open tasks: ${mapped?.stats.openTasks || 0}`,
              `Overdue tasks: ${mapped?.stats.overdueTasks || 0}`,
              `Draft runs awaiting review: ${mapped?.stats.draftRuns || 0}`,
            ]}
            newRules={[
              "Platform policy: strict gate checks before final draft approval",
              "Governance policy: maintain immutable audit event coverage",
            ]}
            autopilotActions={[
              "Queued high-risk tenant anomaly scan",
              "Prepared nearest-deadline cross-tenant escalation list",
            ]}
          />

          {/* Regulon Live AI Agent - Conversational like Siri/Alexa */}
          <RegulonLiveAgent
            dashboardId="app-admin"
            dashboardType="admin"
            userName="Platform Admin"
            companyName="All Tenants"
          />

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
