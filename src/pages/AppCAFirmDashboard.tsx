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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const AppCAFirmDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [firmName, setFirmName] = useState("");
  const [firmRegistration, setFirmRegistration] = useState("");
  const [firmJurisdiction, setFirmJurisdiction] = useState("");
  const [creatingFirm, setCreatingFirm] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ca-firm", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("User is not authenticated");

      const supabaseAny = supabase as any;
      const { data: membership, error: membershipError } = await supabaseAny
        .from("ca_firm_members")
        .select("ca_firm_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership?.ca_firm_id) {
        return { firm: null, members: [], directory: [], runs: [] };
      }

      const [firmResult, membersResult, directoryResult, runsResult] = await Promise.all([
        supabaseAny.from("ca_firms").select("id, name, registration_number, jurisdiction").eq("id", membership.ca_firm_id).single(),
        supabaseAny.from("ca_firm_members").select("id, user_id, role").eq("ca_firm_id", membership.ca_firm_id),
        supabaseAny
          .from("ca_firm_ca_directory")
          .select("id, ca_user_id, ca_name, license_number, specialty, status")
          .eq("ca_firm_id", membership.ca_firm_id)
          .order("ca_name", { ascending: true }),
        supabaseAny
          .from("draft_runs")
          .select("id, user_id, status")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      if (firmResult.error) throw firmResult.error;
      if (membersResult.error) throw membersResult.error;
      if (directoryResult.error) throw directoryResult.error;
      if (runsResult.error) throw runsResult.error;

      return {
        firm: firmResult.data,
        members: membersResult.data ?? [],
        directory: directoryResult.data ?? [],
        runs: runsResult.data ?? [],
      };
    },
  });

  const filteredDirectory = useMemo(() => {
    if (!data?.directory) return [];

    const runCounts = new Map<string, number>();
    for (const run of data.runs ?? []) {
      if (!run.user_id) continue;
      runCounts.set(run.user_id, (runCounts.get(run.user_id) ?? 0) + 1);
    }

    const enriched = data.directory.map((entry: any) => ({
      ...entry,
      workCount: entry.ca_user_id ? runCounts.get(entry.ca_user_id) ?? 0 : 0,
    }));

    const q = search.toLowerCase().trim();
    if (!q) return enriched;
    return enriched.filter((entry: any) =>
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
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny.rpc("create_ca_firm_with_owner", {
        _name: firmName.trim(),
        _registration_number: firmRegistration.trim(),
        _jurisdiction: firmJurisdiction.trim() || null,
      });
      if (error) throw error;

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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Team Members</p><p className="text-2xl font-bold">{data.members.length}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tracked CAs</p><p className="text-2xl font-bold">{data.directory.length}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Work Items</p><p className="text-2xl font-bold">{data.runs.length}</p></CardContent></Card>
                <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active CAs</p><p className="text-2xl font-bold">{data.directory.filter((c: any) => c.status === "active").length}</p></CardContent></Card>
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
                      ) : filteredDirectory.map((entry: any) => (
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
