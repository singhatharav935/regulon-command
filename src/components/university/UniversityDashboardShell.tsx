import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CreditCard,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface UniversityDashboardShellProps {
  mode: "demo" | "live";
}

const demoMetrics = {
  students: 8450,
  faculty: 520,
  programs: 74,
  feeCollectionCrore: 62.4,
  complianceScore: 94,
  openFilings: 7,
};

const moduleCards = [
  {
    title: "Admissions & Enrollment",
    icon: GraduationCap,
    description: "Applications, merit lists, counseling rounds, seat allotment, and onboarding in one workflow.",
    status: "Phase 2",
  },
  {
    title: "Academic Operations",
    icon: BookOpen,
    description: "Timetable, attendance, assessments, and semester progression with department-level controls.",
    status: "Phase 2",
  },
  {
    title: "Faculty Ops",
    icon: Users,
    description: "Workload planning, leave approvals, appraisal records, and document lifecycle for staff.",
    status: "Phase 2",
  },
  {
    title: "Fees & Payments",
    icon: CreditCard,
    description: "Smart fee plans, scholarships, dues tracking, and payment reconciliation dashboard.",
    status: "Phase 2",
  },
  {
    title: "Compliance Command Center",
    icon: ShieldCheck,
    description: "UGC/AICTE/NAAC/NIRF task calendar, filing trackers, and evidence repository.",
    status: "Phase 2",
  },
  {
    title: "Notices & Filings AI",
    icon: FileCheck2,
    description: "Drafting assistant, reviewer flow, and auditable final sign-off workflow for replies.",
    status: "Live",
  },
];

const demoDeadlines = [
  { label: "NAAC SSR Data Lock", date: "March 12, 2026", owner: "IQAC Office", priority: "High" },
  { label: "AICTE Faculty Data Submission", date: "March 18, 2026", owner: "HR + Registrar", priority: "High" },
  { label: "NIRF Annual Upload", date: "April 03, 2026", owner: "Institution Ranking Cell", priority: "Medium" },
  { label: "Scholarship Utilization Filing", date: "April 10, 2026", owner: "Finance Office", priority: "Medium" },
];

const UniversityDashboardShell = ({ mode }: UniversityDashboardShellProps) => {
  const [viewerName, setViewerName] = useState("University Team");

  useEffect(() => {
    if (mode === "demo") return;

    const loadName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.full_name) {
        setViewerName(data.full_name);
      }
    };

    loadName();
  }, [mode]);

  const instituteName = mode === "demo"
    ? "JAYPEE INSTITUTE OF INFORMATION TECHNOLOGY"
    : "Your University Workspace";

  const metrics = useMemo(() => demoMetrics, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          <section className="glass-card p-7 rounded-2xl border border-primary/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">University Command Dashboard</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{instituteName}</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {mode === "demo"
                    ? "Unified operations for academic, finance, compliance, and institutional governance."
                    : `Welcome ${viewerName}. This live workspace is ready to connect your real campus workflows.`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={mode === "demo" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-green-500/20 text-green-300 border-green-500/40"}>
                  {mode === "demo" ? "Demo Experience" : "Live Workspace"}
                </Badge>
                <Button variant="outline" className="border-primary/30">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Students</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{metrics.students.toLocaleString()}</p></CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Faculty</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{metrics.faculty}</p></CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Programs</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">{metrics.programs}</p></CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Fee Collection</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold">₹{metrics.feeCollectionCrore} Cr</p></CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Compliance Score</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold text-green-400">{metrics.complianceScore}%</p></CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Open Filings</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold text-yellow-400">{metrics.openFilings}</p></CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    University Modules Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {moduleCards.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div key={module.title} className="rounded-xl border border-border/50 p-4 bg-background/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <p className="font-medium text-sm">{module.title}</p>
                          </div>
                          <Badge variant="outline">{module.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-primary" />
                    Priority Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {demoDeadlines.map((deadline) => (
                    <div key={deadline.label} className="rounded-xl border border-border/50 p-3 bg-background/40">
                      <p className="text-sm font-medium">{deadline.label}</p>
                      <p className="text-xs text-muted-foreground">{deadline.date} • {deadline.owner}</p>
                      <Badge className="mt-2" variant="outline">{deadline.priority}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UniversityDashboardShell;
