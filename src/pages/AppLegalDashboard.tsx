import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AppLegalDashboard = () => {
  const reviewQueue = [
    { matter: "GST SCN Reply - Acme", owner: "In-House CA", status: "Under Legal Review", due: "Mar 03, 2026" },
    { matter: "MCA Adjudication Reply - Nova", owner: "Compliance Team", status: "Draft QA", due: "Mar 05, 2026" },
    { matter: "Customs Notice Rebuttal - Zenith", owner: "External Counsel", status: "Evidence Mapping", due: "Mar 08, 2026" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardTypeNav activeType="ca" routePrefix="/app" />

          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm text-amber-300">
              <strong>In-House Lawyer Workspace</strong> - Legal review, citation hardening, and filing sign-off controls.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-card border-border/40">
              <CardHeader>
                <CardTitle>Legal Review Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviewQueue.map((item) => (
                  <div key={item.matter} className="rounded-lg border border-border/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.matter}</p>
                      <p className="text-sm text-muted-foreground">Owner: {item.owner}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">{item.status}</Badge>
                      <span className="text-sm text-muted-foreground">Due {item.due}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardHeader>
                <CardTitle>Quality Gates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Verified citations only (jurisdiction-filtered)</p>
                <p>Annexure linkage check before approval</p>
                <p>Computation mismatch blocker enabled</p>
                <p>Immutable audit log for all edits</p>
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
