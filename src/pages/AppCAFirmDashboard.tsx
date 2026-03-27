import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import AIVoiceBriefAgent from "@/components/voice/AIVoiceBriefAgent";
import { workspaceBackendRequest } from "@/lib/workspace-backend";

const AppCAFirmDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [firmName, setFirmName] = useState("");
  const [firmRegistration, setFirmRegistration] = useState("");
  const [firmJurisdiction, setFirmJurisdiction] = useState("");
  const [creatingFirm, setCreatingFirm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ca-firm", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("User is not authenticated");
      return workspaceBackendRequest<{
        firm: { id: string; name: string; registration_number: string; jurisdiction: string | null } | null;
        members: Array<{ id: string; user_id: string; role: string }>;
        directory: Array<{ id: string; ca_user_id: string | null; ca_name: string; license_number: string | null; specialty: string | null; status: string | null }>;
        runs: Array<{ id: string; user_id: string | null; status: string }>;
      }>("/ca-firm/dashboard");
    },
  });

  const filteredDirectory = useMemo(() => {
    if (!data?.directory) return [];

    const runCounts = new Map<string, number>();
    for (const run of data.runs ?? []) {
      if (!run.user_id) continue;
      runCounts.set(run.user_id, (runCounts.get(run.user_id) ?? 0) + 1);
    }

    const enriched = data.directory.map((entry) => ({
      ...entry,
      workCount: entry.ca_user_id ? runCounts.get(entry.ca_user_id) ?? 0 : 0,
    }));

    const q = search.toLowerCase().trim();
    if (!q) return enriched;
    return enriched.filter((entry) =>
      entry.ca_name?.toLowerCase().includes(q) ||
      entry.license_number?.toLowerCase().includes(q) ||
      entry.specialty?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleCreateFirm = async () => {
    if (!firmName.trim() || !firmRegistration.trim()) {
      toast({ title: "Firm name and registration are required", variant: "destructive" });
      return;
    }

    setCreatingFirm(true);
    try {
      await workspaceBackendRequest<{ created: boolean }>("/ca-firm/workspace", {
        method: "POST",
        body: JSON.stringify({
          name: firmName.trim(),
          registrationNumber: firmRegistration.trim(),
          jurisdiction: firmJurisdiction.trim() || null,
        }),
      });

      toast({ title: "CA firm created", description: "Your firm workspace is ready." });
      setFirmName("");
      setFirmRegistration("");
      setFirmJurisdiction("");
      await refetch();
    } catch (error) {
      toast({
        title: "Failed to create firm",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setCreatingFirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading CA firm workspace...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Failed to load CA firm workspace</h1>
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
          <DashboardTypeNav activeType="ca-firm" routePrefix="/app" />

          {!data?.firm ? (
            <Card className="glass-card border-border/40 max-w-lg">
              <CardHeader>
                <CardTitle>Create CA Firm Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Firm Name" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
                <Input placeholder="Firm Registration Number" value={firmRegistration} onChange={(e) => setFirmRegistration(e.target.value)} />
                <Input placeholder="Jurisdiction (optional)" value={firmJurisdiction} onChange={(e) => setFirmJurisdiction(e.target.value)} />
                <Button className="w-full btn-glow" onClick={handleCreateFirm} disabled={creatingFirm}>
                  {creatingFirm ? "Creating..." : "Create Firm"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-sm text-cyan-300">
                  <strong>{data.firm.name}</strong> · {data.firm.registration_number} · {data.firm.jurisdiction || "Jurisdiction not set"}
                </p>
              </div>

              <AIVoiceBriefAgent
                dashboardId="app-ca-firm"
                actorName={data.firm.name}
                roleLabel="CA Firm Workspace"
                pendingWork={filteredDirectory.slice(0, 4).map((entry) => `${entry.ca_name} has ${entry.workCount} tracked work items`)}
                newRules={[
                  "Firm ops: prioritize overdue filings with backup-owner routing",
                  "Quality: enforce issue detector and AI-fix cycle before submission",
                ]}
                autopilotActions={[
                  "Compiled workload distribution across tracked CAs",
                  "Prepared high-load rebalance recommendations",
                ]}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Team Members</p><p className="text-2xl font-bold">{data.members.length}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tracked CAs</p><p className="text-2xl font-bold">{data.directory.length}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Work Items</p><p className="text-2xl font-bold">{data.runs.length}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active CAs</p><p className="text-2xl font-bold">{data.directory.filter((c) => c.status === "active").length}</p></CardContent></Card>
              </div>

              <Card className="glass-card border-border/40 mb-6">
                <CardHeader><CardTitle>Search CA Directory</CardTitle></CardHeader>
                <CardContent>
                  <Input placeholder="Search by name, license, specialty" value={search} onChange={(e) => setSearch(e.target.value)} />
                </CardContent>
              </Card>

              <Card className="glass-card border-border/40">
                <CardHeader><CardTitle>CA Work Tracker (Live)</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CA</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tracked Work Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDirectory.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-muted-foreground">No CAs found.</TableCell></TableRow>
                      ) : filteredDirectory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.ca_name}</TableCell>
                          <TableCell>{entry.license_number || "-"}</TableCell>
                          <TableCell>{entry.specialty || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{entry.status || "active"}</Badge></TableCell>
                          <TableCell>{entry.workCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AppCAFirmDashboard;
