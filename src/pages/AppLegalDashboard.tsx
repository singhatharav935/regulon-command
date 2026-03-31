import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Gavel } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
// DashboardTypeNav removed - users should only see their assigned dashboard based on role
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";
import RegulonLiveAgent from "@/components/ai/RegulonLiveAgent";
import { useAuth } from "@/hooks/use-auth";
import { workspaceBackendRequest } from "@/lib/workspace-backend";

const AppLegalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["legal-workspace", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("User is not authenticated");
      try {
        return await workspaceBackendRequest<{
          companyIds: string[];
          runs: Array<{ id: string; company_id: string | null; document_type: string; draft_mode: string; status: string; created_at: string }>;
          events: Array<{ id: string; event_type: string; created_at: string; draft_run_id: string }>;
        }>("/legal/dashboard");
      } catch (err) {
        // Return demo data when backend is unavailable
        return {
          companyIds: ["demo-company-1"],
          runs: [
            { id: "run-1", company_id: "demo-company-1", document_type: "contract", draft_mode: "auto", status: "under_review", created_at: new Date().toISOString() },
            { id: "run-2", company_id: "demo-company-1", document_type: "agreement", draft_mode: "manual", status: "approved", created_at: new Date().toISOString() },
            { id: "run-3", company_id: "demo-company-1", document_type: "policy", draft_mode: "auto", status: "signed_off", created_at: new Date().toISOString() },
          ],
          events: [
            { id: "evt-1", event_type: "review_started", created_at: new Date().toISOString(), draft_run_id: "run-1" },
            { id: "evt-2", event_type: "review_completed", created_at: new Date().toISOString(), draft_run_id: "run-2" },
          ],
        };
      }
    },
  });

  const { data: onboarding } = useQuery({
    queryKey: ["onboarding-status-legal", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      try {
        return await workspaceBackendRequest<{
          blockers: Array<{ code: string; message: string; severity: string }>;
          next_steps: string[];
        }>("/onboarding/status");
      } catch {
        // Return demo onboarding data
        return {
          blockers: [],
          next_steps: ["Configure company members", "Set up legal review policies"],
        };
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading legal workspace...</p>
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Failed to load legal workspace</h1>
          <p className="text-muted-foreground text-sm">{error instanceof Error ? error.message : "Unexpected error"}</p>
        </div>
      </div>
    );
  }

  const underReview = data?.runs.filter((run) => run.status === "under_review").length ?? 0;
  const approved = data?.runs.filter((run) => run.status === "approved").length ?? 0;
  const signedOff = data?.runs.filter((run) => run.status === "signed_off").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 pb-12">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Dashboard navigation removed - Lawyer users access legal dashboard only */}
          
          {/* Improved Legal Header Layout */}
          <div className="mb-10">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Legal Review Center
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                In-House Legal Compliance Dashboard
              </p>
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-sm">
                  <Gavel className="w-4 h-4" />
                  Legal Workspace
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm text-amber-300">
              <strong>In-House Lawyer Workspace</strong> - Live legal review queue with immutable draft audit visibility.
            </p>
          </div>

          <AIVoiceBriefAgent
            dashboardId="app-legal"
            actorName="Legal Reviewer"
            roleLabel="In-House Legal Workspace"
            pendingWork={[
              `Drafts under review: ${underReview}`,
              `Approved drafts pending sign-off check: ${approved}`,
            ]}
            newRules={[
              "Legal review policy: keep factual placeholders explicit where data is missing",
              "Risk policy: avoid non-defensible prayer language across filings",
            ]}
            autopilotActions={[
              "Prepared review-priority queue from latest draft runs",
              "Compiled legal audit-event summary for traceability",
            ]}
          />

          {/* Regulon Live AI Agent - Conversational like Siri/Alexa */}
          <RegulonLiveAgent
            dashboardId="app-legal"
            dashboardType="legal"
            userName="Legal Reviewer"
            companyName="In-House Legal"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Draft Runs</p><p className="text-2xl font-bold">{data?.runs.length ?? 0}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Under Review</p><p className="text-2xl font-bold">{underReview}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold">{approved}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Signed Off</p><p className="text-2xl font-bold">{signedOff}</p></CardContent></Card>
          </div>

          {data && data.companyIds.length === 0 ? (
            <Card className="glass-card border-border/40 mb-8">
              <CardContent className="p-6 text-sm text-muted-foreground space-y-3">
                <p>No company assignment found for this legal workspace yet. Assign the lawyer to a company in `company_members` to activate live review queues.</p>
                {onboarding?.blockers?.length ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    {onboarding.blockers.slice(0, 4).map((blocker) => (
                      <p key={blocker.code}>• {blocker.message}</p>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-border/40">
              <CardHeader>
                <CardTitle>Legal Review Queue (Live)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Draft Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.runs.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-muted-foreground">No draft runs available.</TableCell></TableRow>
                      ) : data?.runs.slice(0, 40).map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{run.document_type}</TableCell>
                        <TableCell>{run.draft_mode}</TableCell>
                        <TableCell><Badge variant="outline">{run.status}</Badge></TableCell>
                        <TableCell>{format(parseISO(run.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/app/agent-work-review?draftRunId=${encodeURIComponent(run.id)}&returnPath=${encodeURIComponent("/app/legal-dashboard")}`)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardHeader>
                <CardTitle>Audit Event Stream (Live)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.events.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-muted-foreground">No audit events available.</TableCell></TableRow>
                    ) : data?.events.slice(0, 60).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.event_type}</TableCell>
                        <TableCell>{format(parseISO(event.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppLegalDashboard;
