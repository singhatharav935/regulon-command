import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

const AppLegalDashboard = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["legal-workspace"],
    queryFn: async () => {
      const [runsResult, eventsResult] = await Promise.all([
        (supabase as any)
          .from("draft_runs")
          .select("id, document_type, draft_mode, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        (supabase as any)
          .from("draft_audit_events")
          .select("id, event_type, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (runsResult.error) throw runsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      return {
        runs: runsResult.data ?? [],
        events: eventsResult.data ?? [],
      };
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Draft Runs</p><p className="text-2xl font-bold">{data?.runs.length ?? 0}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Under Review</p><p className="text-2xl font-bold">{underReview}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold">{approved}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Signed Off</p><p className="text-2xl font-bold">{signedOff}</p></CardContent></Card>
          </div>

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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.runs.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-muted-foreground">No draft runs available.</TableCell></TableRow>
                    ) : data?.runs.slice(0, 40).map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{run.document_type}</TableCell>
                        <TableCell>{run.draft_mode}</TableCell>
                        <TableCell><Badge variant="outline">{run.status}</Badge></TableCell>
                        <TableCell>{format(parseISO(run.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
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
