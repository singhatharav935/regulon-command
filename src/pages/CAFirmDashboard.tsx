import { useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const demoCas = [
  { name: "CA Rohan Mehta", license: "ICAI-274191", specialty: "GST Litigation", status: "active", openCases: 12, completed: 48 },
  { name: "CA Nidhi Sharma", license: "ICAI-221983", specialty: "Income Tax Notices", status: "active", openCases: 9, completed: 36 },
  { name: "CA Prateek Jain", license: "ICAI-300214", specialty: "Customs & SEZ", status: "on_leave", openCases: 3, completed: 27 },
];

const CAFirmDashboard = () => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return demoCas;
    return demoCas.filter((ca) =>
      ca.name.toLowerCase().includes(q) ||
      ca.license.toLowerCase().includes(q) ||
      ca.specialty.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca-firm" />

          <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <p className="text-sm text-cyan-300">
              <strong>Demo CA Firm Dashboard</strong> - Search CAs, track allocation, and monitor filing output.
            </p>
          </div>

          <Card className="glass-card border-border/40 mb-6">
            <CardHeader><CardTitle>CA Search</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Search by CA name, license, or specialty" value={search} onChange={(e) => setSearch(e.target.value)} />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader><CardTitle>CA Workbench (Demo)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CA</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Open Cases</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ca) => (
                    <TableRow key={ca.license}>
                      <TableCell className="font-medium">{ca.name}</TableCell>
                      <TableCell>{ca.license}</TableCell>
                      <TableCell>{ca.specialty}</TableCell>
                      <TableCell><Badge variant="outline">{ca.status}</Badge></TableCell>
                      <TableCell>{ca.openCases}</TableCell>
                      <TableCell>{ca.completed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CAFirmDashboard;
