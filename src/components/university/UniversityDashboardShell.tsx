import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Flame,
  GraduationCap,
  Landmark,
  LineChart,
  Lock,
  Plus,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UniversityDashboardShellProps {
  mode: "demo" | "live";
}

type AdmissionItem = {
  id?: string;
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
  id?: string;
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

type UniversityRole = "admin" | "registrar" | "finance" | "faculty" | "student";
type DashboardPage = "executive" | "operations" | "compliance" | "finance" | "workflow" | "copilot";

const demoKpis = {
  students: 8450,
  faculty: 520,
  programs: 74,
  feeCollectionCrore: 62.4,
  complianceScore: 94,
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
  },
  {
    title: "Academic Operations",
    icon: BookOpen,
    description: "Timetable, attendance, assessments, and semester progression with department-level controls.",
  },
  {
    title: "Faculty Ops",
    icon: Users,
    description: "Workload planning, leave approvals, appraisal records, and document lifecycle for staff.",
  },
  {
    title: "Fees & Payments",
    icon: CreditCard,
    description: "Smart fee plans, scholarships, dues tracking, and payment reconciliation dashboard.",
  },
  {
    title: "Compliance Command Center",
    icon: ShieldCheck,
    description: "UGC/AICTE/NAAC/NIRF task calendar, filing trackers, and evidence repository.",
  },
  {
    title: "Notices & Filings AI",
    icon: FileCheck2,
    description: "Drafting assistant, reviewer flow, and auditable final sign-off workflow for replies.",
  },
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

const pageConfig: Array<{ id: DashboardPage; label: string; icon: any }> = [
  { id: "executive", label: "Executive", icon: Landmark },
  { id: "operations", label: "Operations", icon: ClipboardList },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "finance", label: "Finance", icon: Receipt },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "copilot", label: "AI Copilot", icon: Bot },
];

const roleProfile: Record<
  UniversityRole,
  { title: string; manages: string[]; kpiFocus: string[]; approvalScope: string }
> = {
  admin: {
    title: "University Admin",
    manages: ["Cross-function governance", "Final compliance sign-off", "Risk and escalation controls"],
    kpiFocus: ["Institution risk", "Revenue certainty", "Regulatory closure"],
    approvalScope: "Full maker-checker-signoff chain",
  },
  registrar: {
    title: "Registrar",
    manages: ["Admissions and records", "Regulatory filings coordination", "Department SLA enforcement"],
    kpiFocus: ["Admission funnel", "Deadline adherence", "Approval backlog"],
    approvalScope: "Academic + compliance approvals",
  },
  finance: {
    title: "Finance Controller",
    manages: ["Fee invoice lifecycle", "Payment reconciliation", "Scholarship and dues tracking"],
    kpiFocus: ["Collection velocity", "Overdues", "Leakage controls"],
    approvalScope: "Invoice/payment + finance signoff",
  },
  faculty: {
    title: "Department Faculty",
    manages: ["Evidence preparation", "Program-level data updates", "Task submissions"],
    kpiFocus: ["Department action queue", "Evidence completeness", "Submission quality"],
    approvalScope: "Task execution and submission only",
  },
  student: {
    title: "Student Services",
    manages: ["Application status support", "Payment support", "Document handoff"],
    kpiFocus: ["Service SLAs", "Pending tickets", "Turnaround time"],
    approvalScope: "View and request updates",
  },
};

const UniversityDashboardShell = ({ mode }: UniversityDashboardShellProps) => {
  const supabaseAny = supabase as any;
  const { toast } = useToast();

  const [viewerName, setViewerName] = useState("University Team");
  const [viewerRole, setViewerRole] = useState<UniversityRole>("student");
  const [demoRole, setDemoRole] = useState<UniversityRole>("registrar");
  const [activePage, setActivePage] = useState<DashboardPage>("executive");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [source, setSource] = useState<"demo" | "live">("demo");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

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
      setUniversityId(null);
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
          .select("university_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        const scopedUniversityId = membership?.university_id;
        if (!scopedUniversityId || !mounted) {
          setSource("demo");
          setUniversityId(null);
          return;
        }

        if (mounted) {
          setUniversityId(scopedUniversityId);
          setViewerRole((membership?.role as UniversityRole) || "student");
        }

        const [studentsRes, facultyRes, admissionsRes, invoicesRes, tasksRes, filingsRes, evidenceRes] = await Promise.all([
          supabaseAny.from("university_students").select("id, full_name, program, semester").eq("university_id", scopedUniversityId).limit(5000),
          supabaseAny.from("university_faculty").select("id, full_name, designation").eq("university_id", scopedUniversityId).limit(2000),
          supabaseAny.from("university_admissions").select("id, application_number, applicant_name, program_applied, status").eq("university_id", scopedUniversityId).order("updated_at", { ascending: false }).limit(8),
          supabaseAny.from("university_fee_invoices").select("id, invoice_number, total_amount, status, due_date").eq("university_id", scopedUniversityId).order("created_at", { ascending: false }).limit(8),
          supabaseAny.from("university_compliance_tasks").select("id, title, authority, due_date, priority, status").eq("university_id", scopedUniversityId).order("due_date", { ascending: true }).limit(8),
          supabaseAny.from("university_compliance_filings").select("id, filing_name, authority, period_label, status, reference_number").eq("university_id", scopedUniversityId).order("updated_at", { ascending: false }).limit(8),
          supabaseAny.from("university_compliance_evidence").select("id", { count: "exact", head: true }).eq("university_id", scopedUniversityId),
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
        });

        setStudents(
          studentsData.slice(0, 6).map((s: any) => ({
            id: s.id,
            name: s.full_name,
            tag: `${s.program || "Program"}${s.semester ? ` • Sem ${s.semester}` : ""}`,
          }))
        );

        setFaculty(
          facultyData.slice(0, 6).map((f: any) => ({
            id: f.id,
            name: f.full_name,
            tag: f.designation || "Faculty",
          }))
        );

        setAdmissions(admissionsData.length > 0 ? admissionsData : demoAdmissions);
        setInvoices(
          invoicesData.length > 0
            ? invoicesData.map((inv: any) => ({
                id: inv.id,
                invoice_number: inv.invoice_number,
                amount: Number(inv.total_amount || 0),
                status: inv.status,
                due_date: inv.due_date,
              }))
            : demoInvoices
        );
        setComplianceTasks(tasksData.length > 0 ? tasksData : demoComplianceTasks);
        setFilings(filingsData.length > 0 ? filingsData : demoFilings);
        setEvidenceCount(typeof evidenceRes.count === "number" ? evidenceRes.count : 128);
      } catch {
        if (!mounted) return;
        setSource("demo");
        setUniversityId(null);
      }
    };

    loadLiveUniversity();

    return () => {
      mounted = false;
    };
  }, [mode, supabaseAny]);

  const effectiveRole = mode === "demo" ? demoRole : viewerRole;
  const instituteName =
    mode === "demo"
      ? "JAYPEE INSTITUTE OF INFORMATION TECHNOLOGY"
      : source === "live"
        ? "University Live Operations Workspace"
        : "Your University Workspace (Demo Fallback)";

  const admissionsBreakdown = useMemo(
    () => ({
      submitted: admissions.filter((a) => a.status === "submitted").length,
      under_review: admissions.filter((a) => a.status === "under_review").length,
      accepted: admissions.filter((a) => a.status === "accepted").length,
      rejected: admissions.filter((a) => a.status === "rejected").length,
    }),
    [admissions]
  );

  const feeSummary = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const collected = invoices.filter((i) => i.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices
      .filter((i) => i.status === "issued" || i.status === "partially_paid" || i.status === "overdue")
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      total,
      collected,
      outstanding,
      velocity: total > 0 ? Math.round((collected / total) * 100) : 0,
      overdueCount: invoices.filter((i) => i.status === "overdue").length,
    };
  }, [invoices]);

  const today = new Date();
  const in7days = new Date();
  in7days.setDate(in7days.getDate() + 7);
  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);

  const complianceSummary = useMemo(() => {
    const openFilings = filings.filter((f) => f.status !== "submitted" && f.status !== "closed").length;
    const atRiskFilings = filings.filter((f) => f.status === "pending" || f.status === "overdue").length;
    const pendingApprovals =
      filings.filter((f) => f.status === "under_review").length +
      complianceTasks.filter((t) => t.status === "under_review").length +
      admissions.filter((a) => a.status === "under_review").length;

    const upcoming7 = complianceTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= today && d <= in7days;
    }).length;

    const upcoming30 = complianceTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= today && d <= in30days;
    }).length;

    const criticalAlerts =
      complianceTasks.filter((t) => t.priority === "critical" && t.status !== "closed").length +
      invoices.filter((i) => i.status === "overdue").length;

    return { openFilings, atRiskFilings, pendingApprovals, upcoming7, upcoming30, criticalAlerts };
  }, [admissions, complianceTasks, filings, invoices, in30days, in7days, today]);

  const complianceHeatmap = useMemo(() => {
    const authorities = ["AICTE", "UGC", "NAAC", "NIRF", "State Dept"];
    return authorities.map((authority) => {
      const tasks = complianceTasks.filter((t) => t.authority === authority);
      const authorityFilings = filings.filter((f) => f.authority === authority);
      const openTasks = tasks.filter((t) => t.status !== "closed").length;
      const completedTasks = tasks.filter((t) => t.status === "closed" || t.status === "submitted").length;
      const filingsClosed = authorityFilings.filter((f) => f.status === "submitted" || f.status === "closed").length;
      const total = tasks.length + authorityFilings.length;
      const score = total === 0 ? 88 : Math.max(55, Math.min(99, Math.round(((completedTasks + filingsClosed) / total) * 100)));
      const evidenceCompleteness = Math.max(45, Math.min(99, score + (evidenceCount > 120 ? 4 : -5)));
      return { authority, score, evidenceCompleteness, openTasks };
    });
  }, [complianceTasks, filings, evidenceCount]);

  const actionQueue = useMemo(() => {
    return [
      {
        title: "Resolve overdue fee invoices",
        owner: "Finance",
        sla: "24h",
        blocker: feeSummary.overdueCount > 0 ? "Parent confirmations pending" : "No blockers",
        risk: feeSummary.overdueCount > 0 ? "high" : "low",
      },
      {
        title: "Close under-review filings",
        owner: "Registrar",
        sla: "48h",
        blocker: complianceSummary.pendingApprovals > 0 ? "Awaiting reviewer notes" : "No blockers",
        risk: complianceSummary.pendingApprovals > 2 ? "high" : "medium",
      },
      {
        title: "Submit critical NAAC evidence packet",
        owner: "Department Head",
        sla: "36h",
        blocker: evidenceCount < 120 ? "Evidence mapping incomplete" : "No blockers",
        risk: evidenceCount < 120 ? "high" : "medium",
      },
      {
        title: "Finalize admission review backlog",
        owner: "Admissions Cell",
        sla: "72h",
        blocker: admissionsBreakdown.under_review > 0 ? "Counseling slot allocation pending" : "No blockers",
        risk: admissionsBreakdown.under_review > 1 ? "medium" : "low",
      },
    ];
  }, [admissionsBreakdown.under_review, complianceSummary.pendingApprovals, evidenceCount, feeSummary.overdueCount]);

  const workflowTrail = [
    { stage: "Maker", actor: "Department Coordinator", status: "completed", timestamp: "2026-02-18 10:32" },
    { stage: "Reviewer", actor: "Registrar Office", status: "completed", timestamp: "2026-02-18 15:05" },
    { stage: "Finance Check", actor: "Finance Controller", status: "in_progress", timestamp: "2026-02-20 09:40" },
    { stage: "Final Sign-off", actor: "University Admin", status: "pending", timestamp: "Awaited" },
  ];

  const auditHighlights = [
    "Immutable version v1.8 locked after reviewer approval",
    "17 field-level edits tracked with before/after snapshots",
    "2 SLA breaches auto-escalated to registrar",
    "Evidence linkage verified for 94% of active filings",
  ];

  const copilotRecommendations = [
    "Escalate AICTE filing F-002: 5-day delay risk due to under-review status.",
    "Run evidence completeness sweep for NAAC packet; 3 mandatory proofs flagged missing.",
    "Send automated parent reminder campaign for 2 overdue invoices above ₹1L.",
    "Registrar should clear admission review queue before next counseling batch.",
  ];

  const investorStory = [
    { label: "Manual workload reduced", value: "61%" },
    { label: "SLA adherence", value: "96.2%" },
    { label: "Filing turnaround", value: "2.1 days" },
    { label: "Audit readiness score", value: "94/100" },
  ];

  const isLiveWritable = mode === "live" && source === "live" && !!universityId;
  const canManageAdmissions = effectiveRole === "admin" || effectiveRole === "registrar";
  const canManageFinance = effectiveRole === "admin" || effectiveRole === "registrar" || effectiveRole === "finance";
  const canManageCompliance = effectiveRole === "admin" || effectiveRole === "registrar";

  const nextAdmissionStatus = (status: AdmissionItem["status"]): AdmissionItem["status"] => {
    if (status === "submitted") return "under_review";
    if (status === "under_review") return "accepted";
    return status;
  };

  const nextComplianceStatus = (status: ComplianceTaskItem["status"]): ComplianceTaskItem["status"] => {
    if (status === "pending") return "in_progress";
    if (status === "in_progress") return "under_review";
    if (status === "under_review") return "submitted";
    if (status === "submitted") return "closed";
    return status;
  };

  const handleCreateAdmission = async () => {
    if (!canManageAdmissions) return;
    const seed = Date.now().toString().slice(-4);
    const payload: AdmissionItem = {
      application_number: `AUTO-${new Date().getFullYear()}-${seed}`,
      applicant_name: "New Applicant",
      program_applied: "Program Pending Allocation",
      status: "submitted",
    };

    try {
      setActionBusy("admission-create");
      if (isLiveWritable) {
        const { error } = await supabaseAny.from("university_admissions").insert({
          university_id: universityId,
          application_number: payload.application_number,
          applicant_name: payload.applicant_name,
          program_applied: payload.program_applied,
          status: payload.status,
        });
        if (error) throw error;
      }
      setAdmissions((prev) => [payload, ...prev].slice(0, 8));
      toast({ title: "Admission Added", description: "New application has been queued for review." });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not create admission.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleAdvanceAdmission = async (admission: AdmissionItem) => {
    if (!canManageAdmissions) return;
    const nextStatus = nextAdmissionStatus(admission.status);
    if (nextStatus === admission.status) return;

    try {
      setActionBusy(`admission-${admission.application_number}`);
      if (isLiveWritable) {
        const { error } = await supabaseAny
          .from("university_admissions")
          .update({ status: nextStatus })
          .eq("university_id", universityId)
          .eq("application_number", admission.application_number);
        if (error) throw error;
      }
      setAdmissions((prev) =>
        prev.map((item) =>
          item.application_number === admission.application_number ? { ...item, status: nextStatus } : item
        )
      );
      toast({ title: "Admission Updated", description: `Moved to ${nextStatus.replace("_", " ")}.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not update admission.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleCreateInvoice = async () => {
    if (!canManageFinance) return;
    const seed = Date.now().toString().slice(-4);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${seed}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const payload: InvoiceItem = {
      invoice_number: invoiceNumber,
      amount: 125000,
      status: "issued",
      due_date: dueDate.toISOString().slice(0, 10),
    };

    try {
      setActionBusy("invoice-create");
      if (isLiveWritable) {
        const { error } = await supabaseAny.from("university_fee_invoices").insert({
          university_id: universityId,
          invoice_number: payload.invoice_number,
          total_amount: payload.amount,
          due_date: payload.due_date,
          status: payload.status,
        });
        if (error) throw error;
      }
      setInvoices((prev) => [payload, ...prev].slice(0, 8));
      toast({ title: "Invoice Created", description: "Fee invoice is now visible in the collection queue." });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not create invoice.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleMarkInvoicePaid = async (invoice: InvoiceItem) => {
    if (!canManageFinance || invoice.status === "paid") return;

    try {
      setActionBusy(`invoice-${invoice.invoice_number}`);
      if (isLiveWritable && invoice.id) {
        const { error: invoiceError } = await supabaseAny
          .from("university_fee_invoices")
          .update({ status: "paid" })
          .eq("id", invoice.id)
          .eq("university_id", universityId);
        if (invoiceError) throw invoiceError;

        const { error: paymentError } = await supabaseAny.from("university_fee_payments").insert({
          university_id: universityId,
          invoice_id: invoice.id,
          amount: invoice.amount,
          paid_on: new Date().toISOString().slice(0, 10),
          payment_method: "portal",
          reference_number: `PAY-${Date.now().toString().slice(-6)}`,
        });
        if (paymentError) throw paymentError;
      }
      setInvoices((prev) =>
        prev.map((item) =>
          item.invoice_number === invoice.invoice_number ? { ...item, status: "paid" } : item
        )
      );
      toast({ title: "Payment Recorded", description: `${invoice.invoice_number} marked as paid.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not record payment.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleCreateTask = async () => {
    if (!canManageCompliance) return;
    const seed = Date.now().toString().slice(-4);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const payload: ComplianceTaskItem = {
      id: `tmp-task-${seed}`,
      title: "New Compliance Task",
      authority: "UGC",
      due_date: dueDate.toISOString().slice(0, 10),
      priority: "medium",
      status: "pending",
    };

    try {
      setActionBusy("task-create");
      if (isLiveWritable) {
        const { error } = await supabaseAny.from("university_compliance_tasks").insert({
          university_id: universityId,
          title: payload.title,
          authority: payload.authority,
          due_date: payload.due_date,
          priority: payload.priority,
          status: payload.status,
        });
        if (error) throw error;
      }
      setComplianceTasks((prev) => [payload, ...prev].slice(0, 8));
      toast({ title: "Task Added", description: "Compliance task has been added to the tracker." });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not create task.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleAdvanceTask = async (task: ComplianceTaskItem) => {
    if (!canManageCompliance) return;
    const nextStatus = nextComplianceStatus(task.status);
    if (nextStatus === task.status) return;

    try {
      setActionBusy(`task-${task.id}`);
      if (isLiveWritable) {
        const { error } = await supabaseAny
          .from("university_compliance_tasks")
          .update({ status: nextStatus })
          .eq("id", task.id)
          .eq("university_id", universityId);
        if (error) throw error;
      }
      setComplianceTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
      toast({ title: "Task Progressed", description: `Task moved to ${nextStatus.replace("_", " ")}.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not progress task.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleCreateFiling = async () => {
    if (!canManageCompliance) return;
    const seed = Date.now().toString().slice(-4);
    const payload: FilingItem = {
      id: `tmp-filing-${seed}`,
      filing_name: "New Filing Pack",
      authority: "AICTE",
      period_label: `Cycle ${new Date().getFullYear()}`,
      status: "pending",
      reference_number: null,
    };

    try {
      setActionBusy("filing-create");
      if (isLiveWritable) {
        const { error } = await supabaseAny.from("university_compliance_filings").insert({
          university_id: universityId,
          filing_name: payload.filing_name,
          authority: payload.authority,
          period_label: payload.period_label,
          status: payload.status,
        });
        if (error) throw error;
      }
      setFilings((prev) => [payload, ...prev].slice(0, 8));
      toast({ title: "Filing Added", description: "New filing draft is ready for preparation." });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not create filing.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const handleAdvanceFiling = async (filing: FilingItem) => {
    if (!canManageCompliance) return;
    const nextStatus = nextComplianceStatus(filing.status);
    if (nextStatus === filing.status) return;

    try {
      setActionBusy(`filing-${filing.id}`);
      if (isLiveWritable) {
        const { error } = await supabaseAny
          .from("university_compliance_filings")
          .update({ status: nextStatus })
          .eq("id", filing.id)
          .eq("university_id", universityId);
        if (error) throw error;
      }
      setFilings((prev) => prev.map((item) => (item.id === filing.id ? { ...item, status: nextStatus } : item)));
      toast({ title: "Filing Progressed", description: `Filing moved to ${nextStatus.replace("_", " ")}.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not progress filing.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">
          <section className="glass-card p-7 rounded-2xl border border-primary/20 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">University Command Dashboard</p>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{instituteName}</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {mode === "demo"
                    ? "Unified operations for admissions, academics, finance, compliance, approvals, and AI workflow in one place."
                    : `Welcome ${viewerName}. ${source === "live" ? "Live institutional data is loaded for your role." : "Showing demo fallback until university mapping is available."}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={mode === "demo" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : source === "live" ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"}>
                  {mode === "demo" ? "Demo Experience" : source === "live" ? "Live Workspace" : "Live Mode (Demo Data)"}
                </Badge>
                <Badge variant="outline">Role: {effectiveRole}</Badge>
                <Button variant="outline" className="border-primary/30">
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                </Button>
              </div>
            </div>

            {mode === "demo" ? (
              <div className="rounded-xl border border-primary/20 p-3 bg-background/30">
                <p className="text-xs text-muted-foreground mb-2">Demo Role Preview: switch to see what each role can manage.</p>
                <div className="flex flex-wrap gap-2">
                  {(["admin", "registrar", "finance", "faculty", "student"] as UniversityRole[]).map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={demoRole === role ? "default" : "outline"}
                      onClick={() => setDemoRole(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
              {pageConfig.map((page) => {
                const Icon = page.icon;
                const active = activePage === page.id;
                return (
                  <button
                    key={page.id}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border/50 hover:border-primary/40"
                    }`}
                    onClick={() => setActivePage(page.id)}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4" />
                      <span>{page.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Students</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{kpis.students.toLocaleString()}</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Faculty</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{kpis.faculty}</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Programs</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{kpis.programs}</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Fee Collection</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">₹{kpis.feeCollectionCrore} Cr</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Compliance Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-green-400">{kpis.complianceScore}%</p></CardContent></Card>
            <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">At-Risk Filings</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-yellow-300">{complianceSummary.atRiskFilings}</p></CardContent></Card>
          </section>

          {activePage === "executive" ? (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-red-300" /> Critical Alerts</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-semibold text-red-300">{complianceSummary.criticalAlerts}</p><p className="text-xs text-muted-foreground">risk alerts needing immediate action</p></CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="w-4 h-4 text-cyan-300" /> Next 7 Days</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-semibold">{complianceSummary.upcoming7}</p><p className="text-xs text-muted-foreground">deadlines in the next week</p></CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-yellow-300" /> Next 30 Days</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-semibold">{complianceSummary.upcoming30}</p><p className="text-xs text-muted-foreground">deadlines this month</p></CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-300" /> Pending Approvals</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-semibold">{complianceSummary.pendingApprovals}</p><p className="text-xs text-muted-foreground">awaiting reviewer/sign-off steps</p></CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-border/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Action Queue with SLA and Blockers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionQueue.map((item) => (
                      <div key={item.title} className="rounded-lg border border-border/50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{item.title}</p>
                          <Badge variant="outline">SLA: {item.sla}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Owner: {item.owner}</p>
                        <p className="text-xs mt-1">Blocker: <span className="text-muted-foreground">{item.blocker}</span></p>
                        <p className={`text-xs mt-1 ${item.risk === "high" ? "text-red-300" : item.risk === "medium" ? "text-yellow-300" : "text-green-300"}`}>Risk: {item.risk}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> {roleProfile[effectiveRole].title} View</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">What this role manages</p>
                      {roleProfile[effectiveRole].manages.map((line) => (
                        <p className="text-sm" key={line}>• {line}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">KPI focus</p>
                      {roleProfile[effectiveRole].kpiFocus.map((line) => (
                        <p className="text-sm" key={line}>• {line}</p>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border/50 p-2">
                      <p className="text-xs text-muted-foreground">Approval Scope</p>
                      <p className="text-sm mt-1">{roleProfile[effectiveRole].approvalScope}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-border/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> University Modules Roadmap</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {moduleCards.map((module) => {
                      const Icon = module.icon;
                      return (
                        <div key={module.title} className="rounded-xl border border-border/50 p-4 bg-background/40">
                          <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-primary" /><p className="font-medium text-sm">{module.title}</p></div>
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Investor Story Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {investorStory.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-semibold text-cyan-300">{item.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          ) : null}

          {activePage === "operations" ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Admissions Pipeline</span>
                    {canManageAdmissions ? (
                      <Button size="sm" variant="outline" onClick={handleCreateAdmission} disabled={actionBusy === "admission-create"}>
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-border/50 p-2">Submitted: <span className="font-semibold">{admissionsBreakdown.submitted}</span></div>
                    <div className="rounded-lg border border-border/50 p-2">Review: <span className="font-semibold">{admissionsBreakdown.under_review}</span></div>
                    <div className="rounded-lg border border-border/50 p-2">Accepted: <span className="font-semibold text-green-400">{admissionsBreakdown.accepted}</span></div>
                    <div className="rounded-lg border border-border/50 p-2">Rejected: <span className="font-semibold text-red-400">{admissionsBreakdown.rejected}</span></div>
                  </div>
                  {admissions.slice(0, 6).map((a) => (
                    <div key={a.application_number} className="rounded-lg border border-border/50 p-2">
                      <p className="text-sm font-medium">{a.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{a.application_number} • {a.program_applied}</p>
                      <p className={`text-xs mt-1 ${statusClass[a.status] || "text-muted-foreground"}`}>{a.status.replace("_", " ")}</p>
                      {canManageAdmissions && (a.status === "submitted" || a.status === "under_review") ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 mt-1 px-2"
                          disabled={actionBusy === `admission-${a.application_number}`}
                          onClick={() => void handleAdvanceAdmission(a)}
                        >
                          Move Next
                        </Button>
                      ) : null}
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
                  {students.slice(0, 4).map((s) => (
                    <div key={s.id} className="rounded-lg border border-border/50 p-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.tag}</p>
                    </div>
                  ))}
                  <p className="text-xs uppercase tracking-wide text-muted-foreground pt-2">Recent Faculty</p>
                  {faculty.slice(0, 4).map((f) => (
                    <div key={f.id} className="rounded-lg border border-border/50 p-2">
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.tag}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Admissions Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Application to Review Conversion</p>
                    <p className="text-2xl font-semibold">{Math.max(10, Math.round((admissionsBreakdown.under_review / Math.max(1, admissions.length)) * 100))}%</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Acceptance Yield</p>
                    <p className="text-2xl font-semibold text-green-300">{Math.max(10, Math.round((admissionsBreakdown.accepted / Math.max(1, admissions.length)) * 100))}%</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Department Variance</p>
                    <p className="text-sm">CSE demand +14%, ECE +6%, Core branches -3%</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {activePage === "compliance" ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Compliance Command Center</span>
                    {canManageCompliance ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCreateTask} disabled={actionBusy === "task-create"}><Plus className="w-3 h-3 mr-1" /> Task</Button>
                        <Button size="sm" variant="outline" onClick={handleCreateFiling} disabled={actionBusy === "filing-create"}><Plus className="w-3 h-3 mr-1" /> Filing</Button>
                      </div>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Compliance Tasks</p>
                    {complianceTasks.slice(0, 6).map((task) => (
                      <div key={task.id} className="rounded-lg border border-border/50 p-3">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.authority} • Due {task.due_date ?? "TBD"}</p>
                        <p className={`text-xs mt-1 ${statusClass[task.status] || "text-muted-foreground"}`}>{task.status.replace("_", " ")} • {task.priority}</p>
                        {canManageCompliance && task.status !== "closed" ? (
                          <Button size="sm" variant="ghost" className="h-7 mt-1 px-2" disabled={actionBusy === `task-${task.id}`} onClick={() => void handleAdvanceTask(task)}>
                            Advance
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Filings Pipeline</p>
                    {filings.slice(0, 6).map((filing) => (
                      <div key={filing.id} className="rounded-lg border border-border/50 p-3">
                        <p className="text-sm font-medium">{filing.filing_name}</p>
                        <p className="text-xs text-muted-foreground">{filing.authority} • {filing.period_label ?? "Current Cycle"}</p>
                        <p className={`text-xs mt-1 ${statusClass[filing.status] || "text-muted-foreground"}`}>{filing.status.replace("_", " ")}{filing.reference_number ? ` • Ref ${filing.reference_number}` : ""}</p>
                        {canManageCompliance && filing.status !== "closed" ? (
                          <Button size="sm" variant="ghost" className="h-7 mt-1 px-2" disabled={actionBusy === `filing-${filing.id}`} onClick={() => void handleAdvanceFiling(filing)}>
                            Advance
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><LineChart className="w-5 h-5 text-primary" /> Compliance Heatmap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {complianceHeatmap.map((row) => (
                    <div key={row.authority} className="rounded-lg border border-border/50 p-3">
                      <div className="flex justify-between text-sm"><p>{row.authority}</p><p className="text-cyan-300">{row.score}%</p></div>
                      <div className="h-2 bg-muted/30 rounded mt-2 overflow-hidden"><div className="h-full bg-cyan-400" style={{ width: `${row.score}%` }} /></div>
                      <p className="text-xs mt-2 text-muted-foreground">Evidence: {row.evidenceCompleteness}% • Open tasks: {row.openTasks}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {activePage === "finance" ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Financial Cockpit</span>
                    {canManageFinance ? (
                      <Button size="sm" variant="outline" onClick={handleCreateInvoice} disabled={actionBusy === "invoice-create"}><Plus className="w-3 h-3 mr-1" /> Invoice</Button>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border/50 p-3"><p className="text-xs text-muted-foreground">Billed</p><p className="text-xl font-semibold">₹{feeSummary.total.toLocaleString()}</p></div>
                    <div className="rounded-lg border border-border/50 p-3"><p className="text-xs text-muted-foreground">Collected</p><p className="text-xl font-semibold text-green-300">₹{feeSummary.collected.toLocaleString()}</p></div>
                    <div className="rounded-lg border border-border/50 p-3"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-semibold text-yellow-300">₹{feeSummary.outstanding.toLocaleString()}</p></div>
                    <div className="rounded-lg border border-border/50 p-3"><p className="text-xs text-muted-foreground">Velocity</p><p className="text-xl font-semibold">{feeSummary.velocity}%</p></div>
                  </div>

                  {invoices.slice(0, 8).map((inv) => (
                    <div key={inv.invoice_number} className="rounded-lg border border-border/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">Due {inv.due_date}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">₹{inv.amount.toLocaleString()}</p>
                      <p className={`text-xs mt-1 ${statusClass[inv.status] || "text-muted-foreground"}`}>{inv.status.replace("_", " ")}</p>
                      {canManageFinance && inv.status !== "paid" ? (
                        <Button size="sm" variant="ghost" className="h-7 mt-1 px-2" disabled={actionBusy === `invoice-${inv.invoice_number}`} onClick={() => void handleMarkInvoicePaid(inv)}>
                          Mark Paid
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Finance Risk Lens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Overdue Cohort</p>
                    <p className="text-2xl font-semibold text-red-300">{feeSummary.overdueCount}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Scholarship Leakage Risk</p>
                    <p className="text-xl font-semibold text-yellow-300">{mode === "demo" ? "2.8%" : "2.1%"}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Reconciliation Status</p>
                    <p className="text-sm">Matched: 91% • Pending: 9%</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {activePage === "workflow" ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Workflow className="w-5 h-5 text-primary" /> Approval Workflow Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflowTrail.map((step) => (
                    <div key={step.stage} className="rounded-lg border border-border/50 p-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{step.stage}</p>
                        <p className="text-xs text-muted-foreground">{step.actor}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${statusClass[step.status] || "text-muted-foreground"}`}>{step.status.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{step.timestamp}</p>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg border border-border/50 p-3 bg-background/40">
                    <p className="text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-300" /> Immutable versioning is enabled after final sign-off.</p>
                    <p className="text-xs text-muted-foreground mt-1">Maker-checker-signoff flow applies before filing package lock.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-primary" /> Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditHighlights.map((item) => (
                    <div key={item} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {activePage === "copilot" ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> AI Copilot Command Deck</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {copilotRecommendations.map((rec) => (
                    <div key={rec} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button className="w-full">Generate Hearing Notes</Button>
                    <Button className="w-full" variant="outline">Create Filing Package</Button>
                    <Button className="w-full" variant="outline">Explain Recommendations</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary" /> Risk & Win Bands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Institution Risk</p>
                    <p className="text-lg font-semibold text-yellow-300">Medium</p>
                    <p className="text-xs">Driver: under-review filings + overdue invoices.</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Closure Probability</p>
                    <p className="text-lg font-semibold text-green-300">High (78%)</p>
                    <p className="text-xs">Driver: evidence completeness + approval hygiene.</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Next best action</p>
                    <p className="text-sm">Clear review queue for filings F-002/F-003 within 48h.</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ArrowRight className="w-5 h-5 text-primary" /> Multi-Output Package</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Reply Draft + Annexure Index + Hearing Notes + Argument Script.</p>
                <p className="text-muted-foreground">Every pack is versioned and traceable to evidence + reviewer edits.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> Enterprise Reliability Layer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Rate limiting, retries, uptime monitor, and incident logs are now represented in dashboard controls.</p>
                <p className="text-muted-foreground">PII masking, scoped access, and retention policy controls remain enabled in drafting workflows.</p>
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
