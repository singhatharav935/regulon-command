import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";
import { useAuth } from "@/hooks/use-auth";

const AppLegalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["legal-workspace", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("User is not authenticated");
      const supabaseAny = supabase as any;

      const { data: memberships, error: membershipError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id);
      if (membershipError) throw membershipError;

      const companyIds = Array.from(new Set((memberships ?? []).map((row) => row.company_id)));
      if (companyIds.length === 0) {
        return { companyIds: [], runs: [], events: [] };
      }

      const { data: runs, error: runsError } = await supabaseAny
        .from("draft_runs")
        .select("id, company_id, document_type, draft_mode, status, created_at")
        .in("company_id", companyIds)
        .order("created_at", { ascending: false })
        .limit(100);
      if (runsError) throw runsError;

      const draftRunIds = Array.from(new Set((runs ?? []).map((run: { id: string }) => run.id)));
      let events: Array<{ id: string; event_type: string; created_at: string; draft_run_id: string }> = [];
      if (draftRunIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabaseAny
          .from("draft_audit_events")
          .select("id, draft_run_id, event_type, created_at")
          .in("draft_run_id", draftRunIds)
          .order("created_at", { ascending: false })
          .limit(200);
        if (eventsError) throw eventsError;
        events = eventsData ?? [];
      }

      return { companyIds, runs: runs ?? [], events };
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

  if (isError) {
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

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca" routePrefix="/app" />

          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Draft Runs</p><p className="text-2xl font-bold">{data?.runs.length ?? 0}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Under Review</p><p className="text-2xl font-bold">{underReview}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold">{approved}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Signed Off</p><p className="text-2xl font-bold">{signedOff}</p></CardContent></Card>
          </div>

          {data && data.companyIds.length === 0 ? (
            <Card className="glass-card border-border/40 mb-8">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No company assignment found for this legal workspace yet. Assign the lawyer to a company in `company_members` to activate live review queues.
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
