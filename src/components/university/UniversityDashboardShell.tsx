import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CreditCard,
  FileCheck2,
  GraduationCap,
  Receipt,
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

type AdmissionItem = {
  application_number: string;
  applicant_name: string;
  program_applied: string;
  status: "submitted" | "under_review" | "accepted" | "rejected";
};

type PeopleItem = {
  id: string;
  name: string;
  tag: string;
};

type InvoiceItem = {
  invoice_number: string;
  amount: number;
  status: "issued" | "partially_paid" | "paid" | "overdue" | "draft";
  due_date: string;
};

type ComplianceTaskItem = {
  id: string;
  title: string;
  authority: string;
  due_date: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "under_review" | "submitted" | "closed" | "overdue";
};

type FilingItem = {
  id: string;
  filing_name: string;
  authority: string;
  period_label: string | null;
  status: "pending" | "in_progress" | "under_review" | "submitted" | "closed" | "overdue";
  reference_number: string | null;
};

const demoKpis = {
  students: 8450,
  faculty: 520,
  programs: 74,
  feeCollectionCrore: 62.4,
  complianceScore: 94,
  openFilings: 7,
};

const demoAdmissions: AdmissionItem[] = [
  { application_number: "JIIT-2026-1024", applicant_name: "Aarav Sharma", program_applied: "B.Tech CSE", status: "under_review" },
  { application_number: "JIIT-2026-1028", applicant_name: "Ananya Gupta", program_applied: "B.Tech ECE", status: "accepted" },
  { application_number: "JIIT-2026-1036", applicant_name: "Yash Mehta", program_applied: "MBA Tech", status: "submitted" },
  { application_number: "JIIT-2026-1041", applicant_name: "Ishita Jain", program_applied: "M.Tech AI", status: "rejected" },
];

const demoStudents: PeopleItem[] = [
  { id: "S-2211", name: "Ritika Bansal", tag: "CSE • Sem 6" },
  { id: "S-2208", name: "Rohan Khanna", tag: "ECE • Sem 8" },
  { id: "S-2331", name: "Nikita Verma", tag: "MBA Tech • Sem 2" },
];

const demoFaculty: PeopleItem[] = [
  { id: "F-041", name: "Dr. P. A. Kumar", tag: "Dean Academics" },
  { id: "F-052", name: "Prof. N. S. Batra", tag: "HOD CSE" },
  { id: "F-071", name: "Dr. Meenal Saxena", tag: "Associate Professor" },
];

const demoInvoices: InvoiceItem[] = [
  { invoice_number: "INV-2026-001", amount: 125000, status: "issued", due_date: "2026-03-12" },
  { invoice_number: "INV-2026-014", amount: 140000, status: "partially_paid", due_date: "2026-03-15" },
  { invoice_number: "INV-2026-028", amount: 118500, status: "overdue", due_date: "2026-02-27" },
  { invoice_number: "INV-2026-033", amount: 98000, status: "paid", due_date: "2026-02-20" },
];

const demoComplianceTasks: ComplianceTaskItem[] = [
  {
    id: "T-001",
    title: "AICTE Annual Faculty Compliance",
    authority: "AICTE",
    due_date: "2026-03-22",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "T-002",
    title: "NAAC Criterion Evidence Consolidation",
    authority: "NAAC",
    due_date: "2026-03-27",
    priority: "critical",
    status: "under_review",
  },
  {
    id: "T-003",
    title: "UGC Academic Audit Submission",
    authority: "UGC",
    due_date: "2026-04-04",
    priority: "medium",
    status: "pending",
  },
];

const demoFilings: FilingItem[] = [
  {
    id: "F-001",
    filing_name: "NIRF Data Sheet 2026",
    authority: "NIRF",
    period_label: "AY 2025-26",
    status: "submitted",
    reference_number: "NIRF-REF-2026-991",
  },
  {
    id: "F-002",
    filing_name: "AICTE Approved Intake Return",
    authority: "AICTE",
    period_label: "2026",
    status: "under_review",
    reference_number: null,
  },
  {
    id: "F-003",
    filing_name: "State Scholarship Utilization",
    authority: "State Dept",
    period_label: "Q4 2025-26",
    status: "pending",
    reference_number: null,
  },
];

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

const statusClass: Record<string, string> = {
  pending: "text-yellow-300",
  in_progress: "text-cyan-300",
  closed: "text-green-300",
  submitted: "text-yellow-300",
  under_review: "text-cyan-300",
  accepted: "text-green-300",
  rejected: "text-red-300",
  issued: "text-cyan-300",
  partially_paid: "text-yellow-300",
  paid: "text-green-300",
  overdue: "text-red-300",
  draft: "text-muted-foreground",
};

const UniversityDashboardShell = ({ mode }: UniversityDashboardShellProps) => {
  const supabaseAny = supabase as any;

  const [viewerName, setViewerName] = useState("University Team");
  const [source, setSource] = useState<"demo" | "live">("demo");
  const [kpis, setKpis] = useState(demoKpis);
  const [admissions, setAdmissions] = useState<AdmissionItem[]>(demoAdmissions);
  const [students, setStudents] = useState<PeopleItem[]>(demoStudents);
  const [faculty, setFaculty] = useState<PeopleItem[]>(demoFaculty);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(demoInvoices);
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTaskItem[]>(demoComplianceTasks);
  const [filings, setFilings] = useState<FilingItem[]>(demoFilings);
  const [evidenceCount, setEvidenceCount] = useState(128);

  useEffect(() => {
    if (mode === "demo") {
      setSource("demo");
      return;
    }

    let mounted = true;

    const loadLiveUniversity = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !mounted) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (mounted && profile?.full_name) setViewerName(profile.full_name);

        const { data: membership } = await supabaseAny
          .from("university_members")
          .select("university_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        const universityId = membership?.university_id;
        if (!universityId || !mounted) {
          setSource("demo");
          return;
        }

        const [studentsRes, facultyRes, admissionsRes, invoicesRes, tasksRes, filingsRes, evidenceRes] = await Promise.all([
          supabaseAny.from("university_students").select("id, full_name, program, semester").eq("university_id", universityId).limit(5000),
          supabaseAny.from("university_faculty").select("id, full_name, designation").eq("university_id", universityId).limit(2000),
          supabaseAny.from("university_admissions").select("application_number, applicant_name, program_applied, status").eq("university_id", universityId).order("updated_at", { ascending: false }).limit(8),
          supabaseAny.from("university_fee_invoices").select("invoice_number, total_amount, status, due_date").eq("university_id", universityId).order("created_at", { ascending: false }).limit(8),
          supabaseAny.from("university_compliance_tasks").select("id, title, authority, due_date, priority, status").eq("university_id", universityId).order("due_date", { ascending: true }).limit(8),
          supabaseAny.from("university_compliance_filings").select("id, filing_name, authority, period_label, status, reference_number").eq("university_id", universityId).order("updated_at", { ascending: false }).limit(8),
          supabaseAny.from("university_compliance_evidence").select("id", { count: "exact", head: true }).eq("university_id", universityId),
        ]);

        const studentsData = studentsRes.data ?? [];
        const facultyData = facultyRes.data ?? [];
        const admissionsData = admissionsRes.data ?? [];
        const invoicesData = invoicesRes.data ?? [];
        const tasksData = tasksRes.data ?? [];
        const filingsData = filingsRes.data ?? [];

        const paidAmount = invoicesData
          .filter((i: any) => i.status === "paid")
          .reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

        if (!mounted) return;

        setSource("live");
        setKpis({
          students: studentsData.length,
          faculty: facultyData.length,
          programs: new Set(studentsData.map((s: any) => s.program)).size || demoKpis.programs,
          feeCollectionCrore: Number((paidAmount / 10000000).toFixed(2)),
          complianceScore: demoKpis.complianceScore,
          openFilings: demoKpis.openFilings,
        });

        setStudents(
          studentsData.slice(0, 5).map((s: any) => ({
            id: s.id,
            name: s.full_name,
            tag: `${s.program || "Program"}${s.semester ? ` • Sem ${s.semester}` : ""}`,
          }))
        );

        setFaculty(
          facultyData.slice(0, 5).map((f: any) => ({
            id: f.id,
            name: f.full_name,
            tag: f.designation || "Faculty",
          }))
        );

        setAdmissions(
          admissionsData.length > 0
            ? admissionsData
            : demoAdmissions
        );

        setInvoices(
          invoicesData.length > 0
            ? invoicesData.map((inv: any) => ({
                invoice_number: inv.invoice_number,
                amount: Number(inv.total_amount || 0),
                status: inv.status,
                due_date: inv.due_date,
              }))
            : demoInvoices
        );

        setComplianceTasks(
          tasksData.length > 0
            ? tasksData
            : demoComplianceTasks
        );

        setFilings(
          filingsData.length > 0
            ? filingsData
            : demoFilings
        );

        setEvidenceCount(typeof evidenceRes.count === "number" ? evidenceRes.count : 128);
      } catch {
        if (!mounted) return;
        setSource("demo");
      }
    };

    loadLiveUniversity();

    return () => {
      mounted = false;
    };
  }, [mode, supabaseAny]);

  const instituteName = mode === "demo"
    ? "JAYPEE INSTITUTE OF INFORMATION TECHNOLOGY"
    : source === "live"
      ? "University Live Operations Workspace"
      : "Your University Workspace (Demo Fallback)";

  const admissionsBreakdown = useMemo(() => ({
    submitted: admissions.filter((a) => a.status === "submitted").length,
    under_review: admissions.filter((a) => a.status === "under_review").length,
    accepted: admissions.filter((a) => a.status === "accepted").length,
    rejected: admissions.filter((a) => a.status === "rejected").length,
  }), [admissions]);

  const feeSummary = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const collected = invoices.filter((i) => i.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices
      .filter((i) => i.status === "issued" || i.status === "partially_paid" || i.status === "overdue")
      .reduce((sum, inv) => sum + inv.amount, 0);
    return { total, collected, outstanding };
  }, [invoices]);

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
                    : `Welcome ${viewerName}. ${source === "live" ? "Live institutional data is loaded for your roles." : "Showing demo fallback until university mapping is available."}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={mode === "demo" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : source === "live" ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"}>
                  {mode === "demo" ? "Demo Experience" : source === "live" ? "Live Workspace" : "Live Mode (Demo Data)"}
                </Badge>
                <Button variant="outline" className="border-primary/30">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Students</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{kpis.students.toLocaleString()}</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Faculty</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{kpis.faculty}</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Programs</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{kpis.programs}</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Fee Collection</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">₹{kpis.feeCollectionCrore} Cr</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Compliance Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-green-400">{kpis.complianceScore}%</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Open Filings</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-yellow-400">{kpis.openFilings}</p></CardContent></Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> University Modules Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {moduleCards.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div key={module.title} className="rounded-xl border border-border/50 p-4 bg-background/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><p className="font-medium text-sm">{module.title}</p></div>
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
                  <CardTitle className="text-lg flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Priority Deadlines</CardTitle>
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

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-border/50 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Admissions Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-border/50 p-2">Submitted: <span className="font-semibold">{admissionsBreakdown.submitted}</span></div>
                  <div className="rounded-lg border border-border/50 p-2">Review: <span className="font-semibold">{admissionsBreakdown.under_review}</span></div>
                  <div className="rounded-lg border border-border/50 p-2">Accepted: <span className="font-semibold text-green-400">{admissionsBreakdown.accepted}</span></div>
                  <div className="rounded-lg border border-border/50 p-2">Rejected: <span className="font-semibold text-red-400">{admissionsBreakdown.rejected}</span></div>
                </div>
                {admissions.slice(0, 4).map((a) => (
                  <div key={a.application_number} className="rounded-lg border border-border/50 p-2">
                    <p className="text-sm font-medium">{a.applicant_name}</p>
                    <p className="text-xs text-muted-foreground">{a.application_number} • {a.program_applied}</p>
                    <p className={`text-xs mt-1 ${statusClass[a.status] || "text-muted-foreground"}`}>{a.status.replace("_", " ")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Students & Faculty Ops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent Students</p>
                {students.slice(0, 3).map((s) => (
                  <div key={s.id} className="rounded-lg border border-border/50 p-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.tag}</p>
                  </div>
                ))}
                <p className="text-xs uppercase tracking-wide text-muted-foreground pt-2">Recent Faculty</p>
                {faculty.slice(0, 3).map((f) => (
                  <div key={f.id} className="rounded-lg border border-border/50 p-2">
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.tag}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Fees & Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="rounded-lg border border-border/50 p-2">Billed: <span className="font-semibold">₹{feeSummary.total.toLocaleString()}</span></div>
                  <div className="rounded-lg border border-border/50 p-2">Collected: <span className="font-semibold text-green-400">₹{feeSummary.collected.toLocaleString()}</span></div>
                  <div className="rounded-lg border border-border/50 p-2">Outstanding: <span className="font-semibold text-yellow-400">₹{feeSummary.outstanding.toLocaleString()}</span></div>
                </div>
                {invoices.slice(0, 4).map((inv) => (
                  <div key={inv.invoice_number} className="rounded-lg border border-border/50 p-2">
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">₹{inv.amount.toLocaleString()} • Due {inv.due_date}</p>
                    <p className={`text-xs mt-1 ${statusClass[inv.status] || "text-muted-foreground"}`}>{inv.status.replace("_", " ")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Compliance Command Center
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Compliance Tasks</p>
                  {complianceTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.authority} • Due {task.due_date ?? "TBD"}</p>
                      <p className={`text-xs mt-1 ${statusClass[task.status] || "text-muted-foreground"}`}>
                        {task.status.replace("_", " ")} • {task.priority}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Filings Pipeline</p>
                  {filings.slice(0, 4).map((filing) => (
                    <div key={filing.id} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm font-medium">{filing.filing_name}</p>
                      <p className="text-xs text-muted-foreground">{filing.authority} • {filing.period_label ?? "Current Cycle"}</p>
                      <p className={`text-xs mt-1 ${statusClass[filing.status] || "text-muted-foreground"}`}>
                        {filing.status.replace("_", " ")}
                        {filing.reference_number ? ` • Ref ${filing.reference_number}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-primary" />
                  Filing Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/50 p-3 bg-background/40">
                  <p className="text-xs text-muted-foreground">Evidence Vault</p>
                  <p className="text-2xl font-semibold">{evidenceCount}</p>
                  <p className="text-xs text-muted-foreground">documents mapped to compliance tasks</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3 bg-background/40">
                  <p className="text-xs text-muted-foreground">Drafting Engine</p>
                  <p className="text-sm">Ready for notice replies, hearing notes, and filing packages.</p>
                </div>
                <Button className="w-full">Open Filing Workflow</Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UniversityDashboardShell;
