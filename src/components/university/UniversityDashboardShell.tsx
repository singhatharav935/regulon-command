import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Filter,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Plus,
  Receipt,
  School,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
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
type DashboardPage =
  | "executive"
  | "roledesk"
  | "admissions"
  | "academics"
  | "facultyops"
  | "compliance"
  | "finance"
  | "workflow"
  | "copilot"
  | "analytics";

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
  { id: "S-2341", name: "Sarthak Raina", tag: "Data Science • Sem 4" },
];

const demoFaculty: PeopleItem[] = [
  { id: "F-041", name: "Dr. P. A. Kumar", tag: "Dean Academics" },
  { id: "F-052", name: "Prof. N. S. Batra", tag: "HOD CSE" },
  { id: "F-071", name: "Dr. Meenal Saxena", tag: "Associate Professor" },
  { id: "F-093", name: "Prof. Aditya Rao", tag: "Controller of Examination" },
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

const statusClass: Record<string, string> = {
  pending: "text-yellow-300",
  in_progress: "text-cyan-300",
  closed: "text-green-300",
  submitted: "text-green-300",
  under_review: "text-cyan-300",
  accepted: "text-green-300",
  rejected: "text-red-300",
  issued: "text-cyan-300",
  partially_paid: "text-yellow-300",
  paid: "text-green-300",
  overdue: "text-red-300",
  draft: "text-muted-foreground",
};

const roleProfile: Record<UniversityRole, { title: string; outcomes: string[]; defaultPage: DashboardPage }> = {
  admin: {
    title: "University Admin",
    outcomes: ["Control institution risk and escalations", "Approve final filings and closures", "Track cross-department performance"],
    defaultPage: "executive",
  },
  registrar: {
    title: "Registrar",
    outcomes: ["Run admissions and records workflow", "Clear review queues", "Own academic-compliance SLAs"],
    defaultPage: "admissions",
  },
  finance: {
    title: "Finance Controller",
    outcomes: ["Control collection velocity", "Reduce overdues and leakage", "Reconcile invoices and payments"],
    defaultPage: "finance",
  },
  faculty: {
    title: "Faculty/Department",
    outcomes: ["Publish department evidence quickly", "Close academic action items", "Support filing submissions"],
    defaultPage: "academics",
  },
  student: {
    title: "Student Services",
    outcomes: ["Assist application queries", "Support payment confirmations", "Track service response SLAs"],
    defaultPage: "roledesk",
  },
};

const pageConfig: Array<{ id: DashboardPage; label: string; icon: any }> = [
  { id: "executive", label: "Executive Command", icon: LayoutDashboard },
  { id: "roledesk", label: "Role Desk", icon: School },
  { id: "admissions", label: "Admissions Queue", icon: GraduationCap },
  { id: "academics", label: "Academics Ops", icon: BookOpen },
  { id: "facultyops", label: "Faculty Admin", icon: Users },
  { id: "compliance", label: "Compliance Register", icon: ShieldCheck },
  { id: "finance", label: "Finance Ledger", icon: Receipt },
  { id: "workflow", label: "Approval Pipeline", icon: Workflow },
  { id: "copilot", label: "AI Copilot", icon: Bot },
  { id: "analytics", label: "Institution Analytics", icon: BarChart3 },
];

const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

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
          supabaseAny.from("university_admissions").select("id, application_number, applicant_name, program_applied, status").eq("university_id", scopedUniversityId).order("updated_at", { ascending: false }).limit(20),
          supabaseAny.from("university_fee_invoices").select("id, invoice_number, total_amount, status, due_date").eq("university_id", scopedUniversityId).order("created_at", { ascending: false }).limit(20),
          supabaseAny.from("university_compliance_tasks").select("id, title, authority, due_date, priority, status").eq("university_id", scopedUniversityId).order("due_date", { ascending: true }).limit(20),
          supabaseAny.from("university_compliance_filings").select("id, filing_name, authority, period_label, status, reference_number").eq("university_id", scopedUniversityId).order("updated_at", { ascending: false }).limit(20),
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
          studentsData.slice(0, 12).map((s: any) => ({
            id: s.id,
            name: s.full_name,
            tag: `${s.program || "Program"}${s.semester ? ` • Sem ${s.semester}` : ""}`,
          }))
        );

        setFaculty(
          facultyData.slice(0, 12).map((f: any) => ({
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

  useEffect(() => {
    setActivePage(roleProfile[effectiveRole].defaultPage);
  }, [effectiveRole]);

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

  const complianceSummary = useMemo(() => {
    const openFilings = filings.filter((f) => f.status !== "submitted" && f.status !== "closed").length;
    const atRiskFilings = filings.filter((f) => f.status === "pending" || f.status === "overdue").length;
    const pendingApprovals =
      filings.filter((f) => f.status === "under_review").length +
      complianceTasks.filter((t) => t.status === "under_review").length +
      admissions.filter((a) => a.status === "under_review").length;
    const criticalAlerts =
      complianceTasks.filter((t) => t.priority === "critical" && t.status !== "closed").length +
      invoices.filter((i) => i.status === "overdue").length;
    return { openFilings, atRiskFilings, pendingApprovals, criticalAlerts };
  }, [admissions, complianceTasks, filings, invoices]);

  const complianceHeatmap = useMemo(() => {
    const authorities = ["AICTE", "UGC", "NAAC", "NIRF", "State Dept"];
    return authorities.map((authority) => {
      const tasks = complianceTasks.filter((t) => t.authority === authority);
      const authorityFilings = filings.filter((f) => f.authority === authority);
      const total = tasks.length + authorityFilings.length;
      const done =
        tasks.filter((t) => t.status === "submitted" || t.status === "closed").length +
        authorityFilings.filter((f) => f.status === "submitted" || f.status === "closed").length;
      const score = total === 0 ? 90 : Math.max(50, Math.round((done / total) * 100));
      return { authority, score, openItems: total - done };
    });
  }, [complianceTasks, filings]);

  const actionQueue = [
    { title: "Close registrar review queue", owner: "Registrar", sla: "24h", risk: "high" },
    { title: "Recover overdue student invoices", owner: "Finance", sla: "48h", risk: "high" },
    { title: "Submit NAAC evidence packet", owner: "Faculty", sla: "36h", risk: "medium" },
    { title: "Finalize intake return filing", owner: "Compliance", sla: "72h", risk: "medium" },
    { title: "Publish weekly VC brief", owner: "Admin", sla: "EOD", risk: "low" },
  ];

  const workflowTrail = [
    { stage: "Maker", actor: "Department Coordinator", status: "completed", timestamp: "2026-02-18 10:32" },
    { stage: "Reviewer", actor: "Registrar Office", status: "completed", timestamp: "2026-02-18 15:05" },
    { stage: "Finance Check", actor: "Finance Controller", status: "in_progress", timestamp: "2026-02-20 09:40" },
    { stage: "Final Sign-off", actor: "University Admin", status: "pending", timestamp: "Awaited" },
  ];

  const copilotRecommendations = [
    "Escalate AICTE filing F-002 due to 5-day review delay.",
    "NAAC evidence completeness below threshold in 2 sub-criteria.",
    "Trigger parent reminders for invoices overdue above 15 days.",
    "Registrar can close 3 pending actions to reduce risk band from Medium to Low.",
  ];

  const isLiveWritable = mode === "live" && source === "live" && !!universityId;
  const canManageAdmissions = effectiveRole === "admin" || effectiveRole === "registrar";
  const canManageFinance = effectiveRole === "admin" || effectiveRole === "registrar" || effectiveRole === "finance";
  const canManageCompliance = effectiveRole === "admin" || effectiveRole === "registrar" || effectiveRole === "faculty";

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
      setAdmissions((prev) => [payload, ...prev].slice(0, 20));
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
      setInvoices((prev) => [payload, ...prev].slice(0, 20));
      toast({ title: "Invoice Created", description: "Fee invoice added to finance queue." });
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
      setInvoices((prev) => prev.map((item) => (item.invoice_number === invoice.invoice_number ? { ...item, status: "paid" } : item)));
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
      setComplianceTasks((prev) => [payload, ...prev].slice(0, 20));
      toast({ title: "Task Added", description: "Compliance task has been added." });
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
      setFilings((prev) => [payload, ...prev].slice(0, 20));
      toast({ title: "Filing Added", description: "New filing draft is ready." });
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

  const renderRoleDesk = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><School className="w-5 h-5 text-primary" /> {roleProfile[effectiveRole].title} Desk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {roleProfile[effectiveRole].outcomes.map((line) => (
            <div key={line} className="rounded border border-border/50 px-3 py-2">{line}</div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> My SLA Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {actionQueue.slice(0, 5).map((a) => (
            <div key={a.title} className="rounded border border-border/50 px-3 py-2">
              <p>{a.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.owner} • SLA {a.sla} • {a.risk}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderExecutive = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Critical Alerts</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-red-300">{complianceSummary.criticalAlerts}</p></CardContent></Card>
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">At-Risk Filings</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-yellow-300">{complianceSummary.atRiskFilings}</p></CardContent></Card>
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Pending Approvals</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-cyan-300">{complianceSummary.pendingApprovals}</p></CardContent></Card>
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Collection Velocity</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{feeSummary.velocity}%</p></CardContent></Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> Institutional War-Room Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 pr-4">SLA</th>
                  <th className="py-2 pr-4">Risk</th>
                  <th className="py-2 pr-4">Next</th>
                </tr>
              </thead>
              <tbody>
                {actionQueue.map((row) => (
                  <tr key={row.title} className="border-b border-border/30">
                    <td className="py-2 pr-4">{row.title}</td>
                    <td className="py-2 pr-4">{row.owner}</td>
                    <td className="py-2 pr-4">{row.sla}</td>
                    <td className={`py-2 pr-4 ${row.risk === "high" ? "text-red-300" : row.risk === "medium" ? "text-yellow-300" : "text-green-300"}`}>{row.risk}</td>
                    <td className="py-2 pr-4"><Button size="sm" variant="ghost">Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdmissions = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Admissions Processing Queue</span>
          <div className="flex gap-2">
            <Badge variant="outline">Submitted {admissionsBreakdown.submitted}</Badge>
            <Badge variant="outline">Review {admissionsBreakdown.under_review}</Badge>
            {canManageAdmissions ? <Button size="sm" variant="outline" onClick={handleCreateAdmission} disabled={actionBusy === "admission-create"}><Plus className="w-3 h-3 mr-1" /> New App</Button> : null}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="py-2 pr-4">Application No.</th>
                <th className="py-2 pr-4">Applicant</th>
                <th className="py-2 pr-4">Program</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.slice(0, 12).map((a) => (
                <tr key={a.application_number} className="border-b border-border/30">
                  <td className="py-2 pr-4">{a.application_number}</td>
                  <td className="py-2 pr-4">{a.applicant_name}</td>
                  <td className="py-2 pr-4">{a.program_applied}</td>
                  <td className={`py-2 pr-4 ${statusClass[a.status] || "text-muted-foreground"}`}>{a.status.replace("_", " ")}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <Button size="sm" variant="ghost">Open</Button>
                    {canManageAdmissions && (a.status === "submitted" || a.status === "under_review") ? (
                      <Button size="sm" variant="ghost" disabled={actionBusy === `admission-${a.application_number}`} onClick={() => void handleAdvanceAdmission(a)}>Move Next</Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderAcademics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Academic Operations Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Timetable</th>
                  <th className="py-2 pr-4">Assessments</th>
                  <th className="py-2 pr-4">Attendance</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["CSE", "100%", "94%", "96%", "healthy"],
                  ["ECE", "96%", "92%", "91%", "watch"],
                  ["Biotech", "92%", "86%", "89%", "watch"],
                  ["MBA", "98%", "95%", "93%", "healthy"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-border/30">
                    <td className="py-2 pr-4">{row[0]}</td>
                    <td className="py-2 pr-4">{row[1]}</td>
                    <td className="py-2 pr-4">{row[2]}</td>
                    <td className="py-2 pr-4">{row[3]}</td>
                    <td className={`py-2 pr-4 ${row[4] === "healthy" ? "text-green-300" : "text-yellow-300"}`}>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> Academic Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 px-3 py-2">2 departments pending assessment closure.</div>
          <div className="rounded border border-border/50 px-3 py-2">4 course plans awaiting HOD approval.</div>
          <div className="rounded border border-border/50 px-3 py-2">Semester moderation due in 3 days.</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFacultyOps = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Faculty Workload and Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="py-2 pr-4">Faculty</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Workload</th>
                <th className="py-2 pr-4">Leave</th>
                <th className="py-2 pr-4">Appraisal</th>
              </tr>
            </thead>
            <tbody>
              {faculty.slice(0, 10).map((f, idx) => (
                <tr key={f.id} className="border-b border-border/30">
                  <td className="py-2 pr-4">{f.name}</td>
                  <td className="py-2 pr-4">{f.tag}</td>
                  <td className="py-2 pr-4">{90 - (idx % 4) * 5}%</td>
                  <td className="py-2 pr-4">{idx % 3 === 0 ? "Pending" : "Clear"}</td>
                  <td className="py-2 pr-4">{idx % 2 === 0 ? "Submitted" : "Due"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompliance = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Compliance Task and Filing Register</span>
            <div className="flex gap-2">
              {canManageCompliance ? <Button size="sm" variant="outline" onClick={handleCreateTask} disabled={actionBusy === "task-create"}><Plus className="w-3 h-3 mr-1" /> Task</Button> : null}
              {canManageCompliance ? <Button size="sm" variant="outline" onClick={handleCreateFiling} disabled={actionBusy === "filing-create"}><Plus className="w-3 h-3 mr-1" /> Filing</Button> : null}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4">Task</th>
                  <th className="py-2 pr-4">Authority</th>
                  <th className="py-2 pr-4">Due</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {complianceTasks.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-border/30">
                    <td className="py-2 pr-4">{t.title}</td>
                    <td className="py-2 pr-4">{t.authority}</td>
                    <td className="py-2 pr-4">{t.due_date ?? "TBD"}</td>
                    <td className="py-2 pr-4">{t.priority}</td>
                    <td className={`py-2 pr-4 ${statusClass[t.status] || "text-muted-foreground"}`}>{t.status.replace("_", " ")}</td>
                    <td className="py-2 pr-4">{canManageCompliance && t.status !== "closed" ? <Button size="sm" variant="ghost" disabled={actionBusy === `task-${t.id}`} onClick={() => void handleAdvanceTask(t)}>Advance</Button> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4">Filing</th>
                  <th className="py-2 pr-4">Authority</th>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filings.slice(0, 10).map((f) => (
                  <tr key={f.id} className="border-b border-border/30">
                    <td className="py-2 pr-4">{f.filing_name}</td>
                    <td className="py-2 pr-4">{f.authority}</td>
                    <td className="py-2 pr-4">{f.period_label ?? "Current"}</td>
                    <td className={`py-2 pr-4 ${statusClass[f.status] || "text-muted-foreground"}`}>{f.status.replace("_", " ")}</td>
                    <td className="py-2 pr-4">{f.reference_number ?? "-"}</td>
                    <td className="py-2 pr-4">{canManageCompliance && f.status !== "closed" ? <Button size="sm" variant="ghost" disabled={actionBusy === `filing-${f.id}`} onClick={() => void handleAdvanceFiling(f)}>Advance</Button> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-primary" /> Compliance Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {complianceHeatmap.map((h) => (
            <div key={h.authority} className="rounded border border-border/50 px-3 py-2">
              <div className="flex justify-between text-sm">
                <span>{h.authority}</span>
                <span className="text-cyan-300">{h.score}%</span>
              </div>
              <div className="h-2 bg-muted/30 rounded mt-2 overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${h.score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Open: {h.openItems}</p>
            </div>
          ))}
          <div className="rounded border border-border/50 px-3 py-2 text-sm">
            Evidence mapped: <span className="text-green-300 font-medium">{evidenceCount}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinance = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Finance Ledger and Reconciliation</span>
          {canManageFinance ? <Button size="sm" variant="outline" onClick={handleCreateInvoice} disabled={actionBusy === "invoice-create"}><Plus className="w-3 h-3 mr-1" /> New Invoice</Button> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded border border-border/50 px-3 py-2"><p className="text-xs text-muted-foreground">Billed</p><p className="text-xl">{formatCurrency(feeSummary.total)}</p></div>
          <div className="rounded border border-border/50 px-3 py-2"><p className="text-xs text-muted-foreground">Collected</p><p className="text-xl text-green-300">{formatCurrency(feeSummary.collected)}</p></div>
          <div className="rounded border border-border/50 px-3 py-2"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl text-yellow-300">{formatCurrency(feeSummary.outstanding)}</p></div>
          <div className="rounded border border-border/50 px-3 py-2"><p className="text-xs text-muted-foreground">Velocity</p><p className="text-xl">{feeSummary.velocity}%</p></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Due Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 12).map((i) => (
                <tr key={i.invoice_number} className="border-b border-border/30">
                  <td className="py-2 pr-4">{i.invoice_number}</td>
                  <td className="py-2 pr-4">{formatCurrency(i.amount)}</td>
                  <td className="py-2 pr-4">{i.due_date}</td>
                  <td className={`py-2 pr-4 ${statusClass[i.status] || "text-muted-foreground"}`}>{i.status.replace("_", " ")}</td>
                  <td className="py-2 pr-4">{canManageFinance && i.status !== "paid" ? <Button size="sm" variant="ghost" disabled={actionBusy === `invoice-${i.invoice_number}`} onClick={() => void handleMarkInvoicePaid(i)}>Mark Paid</Button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderWorkflow = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Workflow className="w-5 h-5 text-primary" /> Maker-Checker-Signoff Pipeline</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {workflowTrail.map((s) => (
            <div key={s.stage} className="rounded border border-border/50 px-3 py-2 flex justify-between items-center gap-3 text-sm">
              <div>
                <p className="font-medium">{s.stage}</p>
                <p className="text-xs text-muted-foreground">{s.actor}</p>
              </div>
              <div className="text-right">
                <p className={statusClass[s.status] || "text-muted-foreground"}>{s.status.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{s.timestamp}</p>
              </div>
            </div>
          ))}
          <div className="rounded border border-border/50 px-3 py-2 text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-300" /> Immutable lock turns on after final sign-off.</div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Audit Highlights</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 px-3 py-2">17 field edits tracked with before/after snapshot.</div>
          <div className="rounded border border-border/50 px-3 py-2">2 SLA breaches auto-escalated to registrar.</div>
          <div className="rounded border border-border/50 px-3 py-2">Evidence linkage verified for {evidenceCount} documents.</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCopilot = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> AI Copilot Recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {copilotRecommendations.map((r) => (
            <div key={r} className="rounded border border-border/50 px-3 py-2 text-sm">{r}</div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button>Generate Hearing Notes</Button>
            <Button variant="outline">Create Filing Package</Button>
            <Button variant="outline">Explain Recommendation</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> Risk Bands</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 px-3 py-2">Institution Risk: <span className="text-yellow-300">Medium</span></div>
          <div className="rounded border border-border/50 px-3 py-2">Closure Probability: <span className="text-green-300">78%</span></div>
          <div className="rounded border border-border/50 px-3 py-2">Top move: clear review filings within 48h.</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Institutional Performance Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50">
                  <th className="py-2 pr-4">Metric</th>
                  <th className="py-2 pr-4">Current</th>
                  <th className="py-2 pr-4">Last Month</th>
                  <th className="py-2 pr-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Automation Coverage", "61%", "55%", "up"],
                  ["SLA Adherence", "96.2%", "93.4%", "up"],
                  ["Filing Turnaround", "2.1 days", "2.8 days", "up"],
                  ["Audit Readiness", "94/100", "89/100", "up"],
                ].map((r) => (
                  <tr key={r[0]} className="border-b border-border/30">
                    <td className="py-2 pr-4">{r[0]}</td>
                    <td className="py-2 pr-4">{r[1]}</td>
                    <td className="py-2 pr-4">{r[2]}</td>
                    <td className="py-2 pr-4 text-green-300">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Investor Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 px-3 py-2">One OS for admissions, academics, finance, and compliance.</div>
          <div className="rounded border border-border/50 px-3 py-2">Maker-checker-signoff with evidence lineage and audit trails.</div>
          <div className="rounded border border-border/50 px-3 py-2">Role-driven adoption across complete university operations.</div>
        </CardContent>
      </Card>
    </div>
  );

  const contentByPage: Record<DashboardPage, JSX.Element> = {
    executive: renderExecutive(),
    roledesk: renderRoleDesk(),
    admissions: renderAdmissions(),
    academics: renderAcademics(),
    facultyops: renderFacultyOps(),
    compliance: renderCompliance(),
    finance: renderFinance(),
    workflow: renderWorkflow(),
    copilot: renderCopilot(),
    analytics: renderAnalytics(),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-card/40 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">University Operations OS</p>
                <h1 className="text-2xl font-bold mt-1">{instituteName}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === "demo"
                    ? "Enterprise-grade demo with role-based pages, queues, registers, and approval workflows."
                    : `Welcome ${viewerName}. ${source === "live" ? "Live operational data connected." : "Showing demo fallback until mapping is ready."}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={mode === "demo" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : source === "live" ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"}>
                  {mode === "demo" ? "Demo" : source === "live" ? "Live" : "Fallback"}
                </Badge>
                <Badge variant="outline">Role: {effectiveRole}</Badge>
                <Button size="sm" variant="outline"><Bell className="w-4 h-4 mr-1" /> Alerts</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/50 xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-primary" /> Workspace Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mode === "demo" ? (
                  <div className="rounded border border-border/50 p-2">
                    <p className="text-xs text-muted-foreground mb-2">Role Simulator</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["admin", "registrar", "finance", "faculty", "student"] as UniversityRole[]).map((role) => (
                        <Button key={role} size="sm" variant={demoRole === role ? "default" : "outline"} onClick={() => setDemoRole(role)}>{role}</Button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded border border-border/50 p-2 space-y-2">
                  <p className="text-xs text-muted-foreground">Pages</p>
                  {pageConfig.map((page) => {
                    const Icon = page.icon;
                    const active = activePage === page.id;
                    return (
                      <button
                        key={page.id}
                        onClick={() => setActivePage(page.id)}
                        className={`w-full text-left rounded px-2 py-2 border transition ${active ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40"}`}
                      >
                        <span className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {page.label}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="xl:col-span-3 space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded border border-border/50 px-3 py-2 text-sm text-muted-foreground"><Search className="w-4 h-4" /> Search records</div>
                    <Button size="sm" variant="outline">Find Student</Button>
                    <Button size="sm" variant="outline">Find Filing</Button>
                    <Button size="sm" variant="outline">Find Invoice</Button>
                    <Button size="sm" variant="outline"><Filter className="w-3 h-3 mr-1" /> Saved Filters</Button>
                  </div>
                </CardContent>
              </Card>

              <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Students</p><p className="text-2xl font-semibold mt-1">{kpis.students.toLocaleString()}</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Faculty</p><p className="text-2xl font-semibold mt-1">{kpis.faculty}</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Programs</p><p className="text-2xl font-semibold mt-1">{kpis.programs}</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Fee Collection</p><p className="text-2xl font-semibold mt-1">₹{kpis.feeCollectionCrore} Cr</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Compliance Score</p><p className="text-2xl font-semibold mt-1 text-green-300">{kpis.complianceScore}%</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Critical Alerts</p><p className="text-2xl font-semibold mt-1 text-yellow-300">{complianceSummary.criticalAlerts}</p></CardContent></Card>
              </section>

              {contentByPage[activePage]}

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Output Package</CardTitle></CardHeader>
                  <CardContent className="text-sm">Reply draft, annexure index, hearing notes, argument script, and checklist are generated as one package with version tracking.</CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Enterprise Controls</CardTitle></CardHeader>
                  <CardContent className="text-sm">PII masking, role scopes, audit trail, retry queues, and incident monitoring remain enabled for production compliance.</CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UniversityDashboardShell;
