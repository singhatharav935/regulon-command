import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileSearch,
  Filter,
  Landmark,
  LayoutDashboard,
  Lock,
  Plus,
  Receipt,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
type CompliancePage =
  | "command"
  | "roledesk"
  | "statutory"
  | "finance"
  | "procurement"
  | "grants"
  | "audit"
  | "workflow"
  | "copilot"
  | "analytics";

type DashboardKpis = {
  controlledSpendCrore: number;
  openFilings: number;
  overdueItems: number;
  auditReadiness: number;
  criticalAlerts: number;
  evidenceMapped: number;
};

const demoKpis: DashboardKpis = {
  controlledSpendCrore: 62.4,
  openFilings: 9,
  overdueItems: 3,
  auditReadiness: 94,
  criticalAlerts: 2,
  evidenceMapped: 128,
};

const demoInvoices: InvoiceItem[] = [
  { invoice_number: "FIN-INV-2026-001", amount: 125000, status: "issued", due_date: "2026-03-12" },
  { invoice_number: "FIN-INV-2026-014", amount: 140000, status: "partially_paid", due_date: "2026-03-15" },
  { invoice_number: "FIN-INV-2026-028", amount: 118500, status: "overdue", due_date: "2026-02-27" },
  { invoice_number: "FIN-INV-2026-033", amount: 98000, status: "paid", due_date: "2026-02-20" },
];

const demoComplianceTasks: ComplianceTaskItem[] = [
  {
    id: "T-001",
    title: "GST Annual Reconciliation DRC Matrix",
    authority: "GST",
    due_date: "2026-03-22",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "T-002",
    title: "PF/ESI Payment Compliance Validation",
    authority: "Labour",
    due_date: "2026-03-27",
    priority: "critical",
    status: "under_review",
  },
  {
    id: "T-003",
    title: "Grant Utilization Certificate Pack",
    authority: "State Dept",
    due_date: "2026-04-04",
    priority: "medium",
    status: "pending",
  },
];

const demoFilings: FilingItem[] = [
  {
    id: "F-001",
    filing_name: "GST Show Cause Reply - Q4",
    authority: "GST",
    period_label: "Q4 FY 2025-26",
    status: "submitted",
    reference_number: "GST-REF-2026-991",
  },
  {
    id: "F-002",
    filing_name: "TDS/TCS Statement Rectification",
    authority: "Income Tax",
    period_label: "FY 2025-26",
    status: "under_review",
    reference_number: null,
  },
  {
    id: "F-003",
    filing_name: "Public Procurement Declaration",
    authority: "Procurement Cell",
    period_label: "Mar 2026",
    status: "pending",
    reference_number: null,
  },
];

const procurementRows = [
  { id: "PO-2026-041", vendor: "Tech Grid Systems", amount: 4500000, stage: "under_review", control: "L1/L2 approval" },
  { id: "PO-2026-043", vendor: "Secure Infra LLP", amount: 2200000, stage: "pending", control: "Tender note" },
  { id: "PO-2026-049", vendor: "Campus Utility Co.", amount: 970000, stage: "submitted", control: "Invoice match" },
];

const grantRows = [
  { grant: "State R&D Grant", budget: 12000000, utilized: 9300000, variance: "within limit", status: "reviewed" },
  { grant: "Central Digital Infra", budget: 8000000, utilized: 7100000, variance: "watch", status: "pending" },
  { grant: "Innovation Fund", budget: 6000000, utilized: 5800000, variance: "within limit", status: "submitted" },
];

const employeeComplianceRows = [
  { area: "Code of Conduct Attestation", completion: "98%", owner: "HR Compliance", status: "healthy" },
  { area: "Conflict of Interest Declarations", completion: "89%", owner: "Legal", status: "watch" },
  { area: "Anti-Bribery Training", completion: "93%", owner: "Internal Audit", status: "healthy" },
  { area: "Vendor Interaction Declarations", completion: "86%", owner: "Procurement", status: "watch" },
];

const statusClass: Record<string, string> = {
  pending: "text-yellow-300",
  in_progress: "text-cyan-300",
  closed: "text-green-300",
  submitted: "text-green-300",
  under_review: "text-cyan-300",
  issued: "text-cyan-300",
  partially_paid: "text-yellow-300",
  paid: "text-green-300",
  overdue: "text-red-300",
  draft: "text-muted-foreground",
  healthy: "text-green-300",
  watch: "text-yellow-300",
};

const roleMeta: Record<UniversityRole, { title: string; defaultPage: CompliancePage; mandate: string[] }> = {
  admin: {
    title: "Compliance Head",
    defaultPage: "command",
    mandate: ["Cross-sector compliance governance", "Final approvals and escalations", "Risk and closure accountability"],
  },
  registrar: {
    title: "Statutory Compliance Manager",
    defaultPage: "statutory",
    mandate: ["Statutory filing pipeline", "Notice/reply timelines", "Authority-wise closure discipline"],
  },
  finance: {
    title: "Finance Compliance Controller",
    defaultPage: "finance",
    mandate: ["Tax + payment control", "Ledger integrity and reconciliation", "Overdue and leakage containment"],
  },
  faculty: {
    title: "Department Compliance SPOC",
    defaultPage: "procurement",
    mandate: ["Department spend compliance", "Evidence submission quality", "Procurement control checks"],
  },
  student: {
    title: "Employee Compliance Desk",
    defaultPage: "roledesk",
    mandate: ["Policy acknowledgements", "Declaration completion", "Escalation and support routing"],
  },
};

const pageConfig: Array<{ id: CompliancePage; label: string; icon: any }> = [
  { id: "command", label: "Command Center", icon: LayoutDashboard },
  { id: "roledesk", label: "Employee Compliance Desk", icon: UserCheck },
  { id: "statutory", label: "Statutory Filings", icon: FileCheck2 },
  { id: "finance", label: "Finance Compliance", icon: CreditCard },
  { id: "procurement", label: "Procurement Compliance", icon: Scale },
  { id: "grants", label: "Grant Utilization", icon: Receipt },
  { id: "audit", label: "Audit & Controls", icon: FileSearch },
  { id: "workflow", label: "Approval Workflow", icon: Workflow },
  { id: "copilot", label: "AI Copilot", icon: Bot },
  { id: "analytics", label: "Compliance Analytics", icon: BarChart3 },
];

const rolePageAccess: Record<UniversityRole, CompliancePage[]> = {
  admin: ["command", "roledesk", "statutory", "finance", "procurement", "grants", "audit", "workflow", "copilot", "analytics"],
  registrar: ["command", "statutory", "audit", "workflow", "copilot", "analytics"],
  finance: ["command", "finance", "grants", "audit", "workflow", "analytics"],
  faculty: ["roledesk", "procurement", "audit", "copilot"],
  student: ["roledesk", "workflow"],
};

const roleQueueMap: Record<UniversityRole, Array<{ title: string; sla: string; risk: string; section: string }>> = {
  admin: [
    { title: "Sign-off pending high-risk filing packs", sla: "24h", risk: "high", section: "statutory" },
    { title: "Close critical procurement exception", sla: "48h", risk: "high", section: "procurement" },
    { title: "Review audit deviation report", sla: "72h", risk: "medium", section: "audit" },
  ],
  registrar: [
    { title: "Finalize GST reply under Section 73", sla: "24h", risk: "high", section: "statutory" },
    { title: "Resolve pending DIN/RFN mismatch", sla: "36h", risk: "high", section: "statutory" },
    { title: "Push filing packet to final approval", sla: "48h", risk: "medium", section: "workflow" },
  ],
  finance: [
    { title: "Reconcile overdue tax-linked invoices", sla: "24h", risk: "high", section: "finance" },
    { title: "Validate grant utilization variance", sla: "48h", risk: "medium", section: "grants" },
    { title: "Confirm payroll statutory deductions", sla: "72h", risk: "medium", section: "finance" },
  ],
  faculty: [
    { title: "Upload procurement evidence pack", sla: "24h", risk: "medium", section: "procurement" },
    { title: "Close department compliance checklist", sla: "48h", risk: "medium", section: "audit" },
    { title: "Respond to reviewer observations", sla: "72h", risk: "low", section: "workflow" },
  ],
  student: [
    { title: "Complete policy attestation acknowledgement", sla: "24h", risk: "medium", section: "roledesk" },
    { title: "Submit conflict declaration", sla: "48h", risk: "medium", section: "roledesk" },
    { title: "Escalate unresolved compliance ticket", sla: "72h", risk: "low", section: "workflow" },
  ],
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

const UniversityDashboardShell = ({ mode }: UniversityDashboardShellProps) => {
  const supabaseAny = supabase as any;
  const { toast } = useToast();

  const [viewerName, setViewerName] = useState("Compliance Team");
  const [viewerRole, setViewerRole] = useState<UniversityRole>("student");
  const [demoRole, setDemoRole] = useState<UniversityRole>("admin");
  const [activePage, setActivePage] = useState<CompliancePage>("command");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [source, setSource] = useState<"demo" | "live">("demo");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const [kpis, setKpis] = useState<DashboardKpis>(demoKpis);
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

    const loadLiveCompliance = async () => {
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

        const [invoicesRes, tasksRes, filingsRes, evidenceRes] = await Promise.all([
          supabaseAny.from("university_fee_invoices").select("id, invoice_number, total_amount, status, due_date").eq("university_id", scopedUniversityId).order("created_at", { ascending: false }).limit(30),
          supabaseAny.from("university_compliance_tasks").select("id, title, authority, due_date, priority, status").eq("university_id", scopedUniversityId).order("due_date", { ascending: true }).limit(30),
          supabaseAny.from("university_compliance_filings").select("id, filing_name, authority, period_label, status, reference_number").eq("university_id", scopedUniversityId).order("updated_at", { ascending: false }).limit(30),
          supabaseAny.from("university_compliance_evidence").select("id", { count: "exact", head: true }).eq("university_id", scopedUniversityId),
        ]);

        const invoicesData = invoicesRes.data ?? [];
        const tasksData = tasksRes.data ?? [];
        const filingsData = filingsRes.data ?? [];

        if (!mounted) return;

        const totalControlledSpend = invoicesData.reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0);
        const overdueItems = invoicesData.filter((row: any) => row.status === "overdue").length;
        const openFilings = filingsData.filter((row: any) => row.status !== "submitted" && row.status !== "closed").length;
        const criticalAlerts = tasksData.filter((row: any) => row.priority === "critical" && row.status !== "closed").length + overdueItems;

        setSource("live");
        setKpis({
          controlledSpendCrore: Number((totalControlledSpend / 10000000).toFixed(2)),
          openFilings,
          overdueItems,
          auditReadiness: 94,
          criticalAlerts,
          evidenceMapped: typeof evidenceRes.count === "number" ? evidenceRes.count : 0,
        });

        setInvoices(
          invoicesData.length > 0
            ? invoicesData.map((row: any) => ({
                id: row.id,
                invoice_number: row.invoice_number,
                amount: Number(row.total_amount || 0),
                status: row.status,
                due_date: row.due_date,
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

    loadLiveCompliance();

    return () => {
      mounted = false;
    };
  }, [mode, supabaseAny]);

  const effectiveRole = mode === "demo" ? demoRole : viewerRole;

  useEffect(() => {
    setActivePage(roleMeta[effectiveRole].defaultPage);
  }, [effectiveRole]);

  const instituteName =
    mode === "demo"
      ? "JAYPEE INSTITUTE OF INFORMATION TECHNOLOGY"
      : source === "live"
        ? "Institution Compliance Workspace"
        : "Institution Workspace (Demo Fallback)";

  const complianceSummary = useMemo(() => {
    const openFilings = filings.filter((f) => f.status !== "submitted" && f.status !== "closed").length;
    const pendingApprovals =
      filings.filter((f) => f.status === "under_review").length +
      complianceTasks.filter((t) => t.status === "under_review").length;
    return { openFilings, pendingApprovals };
  }, [filings, complianceTasks]);

  const myRoleQueue = useMemo(() => roleQueueMap[effectiveRole], [effectiveRole]);
  const visiblePages = useMemo(() => pageConfig.filter((p) => rolePageAccess[effectiveRole].includes(p.id)), [effectiveRole]);

  const isLiveWritable = mode === "live" && source === "live" && !!universityId;
  const canManageFinance = effectiveRole === "admin" || effectiveRole === "finance";
  const canManageCompliance = effectiveRole === "admin" || effectiveRole === "registrar" || effectiveRole === "faculty";

  const nextComplianceStatus = (status: ComplianceTaskItem["status"]): ComplianceTaskItem["status"] => {
    if (status === "pending") return "in_progress";
    if (status === "in_progress") return "under_review";
    if (status === "under_review") return "submitted";
    if (status === "submitted") return "closed";
    return status;
  };

  const handleCreateInvoice = async () => {
    if (!canManageFinance) return;
    const seed = Date.now().toString().slice(-4);
    const invoiceNumber = `FIN-INV-${new Date().getFullYear()}-${seed}`;
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
      setInvoices((prev) => [payload, ...prev].slice(0, 30));
      toast({ title: "Financial Record Added", description: "Invoice added to compliance ledger." });
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
      }
      setInvoices((prev) => prev.map((row) => (row.invoice_number === invoice.invoice_number ? { ...row, status: "paid" } : row)));
      toast({ title: "Ledger Updated", description: `${invoice.invoice_number} marked paid.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not update invoice.", variant: "destructive" });
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
      authority: "Regulatory",
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
      setComplianceTasks((prev) => [payload, ...prev].slice(0, 30));
      toast({ title: "Task Created", description: "Compliance task added." });
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
      setComplianceTasks((prev) => prev.map((row) => (row.id === task.id ? { ...row, status: nextStatus } : row)));
      toast({ title: "Task Updated", description: `Moved to ${nextStatus.replace("_", " ")}.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not update task.", variant: "destructive" });
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
      setFilings((prev) => prev.map((row) => (row.id === filing.id ? { ...row, status: nextStatus } : row)));
      toast({ title: "Filing Updated", description: `Moved to ${nextStatus.replace("_", " ")}.` });
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message ?? "Could not update filing.", variant: "destructive" });
    } finally {
      setActionBusy(null);
    }
  };

  const renderCommandCenter = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Open Filings</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-cyan-300">{kpis.openFilings}</p></CardContent></Card>
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Overdue Items</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-yellow-300">{kpis.overdueItems}</p></CardContent></Card>
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Pending Approvals</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{complianceSummary.pendingApprovals}</p></CardContent></Card>
        <Card className="bg-card/50 border-border/50"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Critical Alerts</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-red-300">{kpis.criticalAlerts}</p></CardContent></Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> Role-Owned Action Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myRoleQueue.map((q) => (
            <div key={q.title} className="rounded border border-border/50 p-3 flex flex-wrap justify-between gap-2 text-sm">
              <span>{q.title}</span>
              <span className="text-muted-foreground">SLA {q.sla} • {q.risk} • {q.section}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderRoleDesk = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" /> {roleMeta[effectiveRole].title}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {roleMeta[effectiveRole].mandate.map((line) => (
            <div key={line} className="rounded border border-border/50 px-3 py-2">{line}</div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> My Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {myRoleQueue.map((q) => (
            <div key={q.title} className="rounded border border-border/50 p-2">
              <p>{q.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{q.sla} • {q.risk}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderStatutory = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-lg flex items-center justify-between gap-2"><span className="flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-primary" /> Statutory Filing Register</span>{canManageCompliance ? <Button size="sm" variant="outline" onClick={handleCreateTask} disabled={actionBusy === "task-create"}><Plus className="w-3 h-3 mr-1" /> Task</Button> : null}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="py-2 pr-4">Task</th><th className="py-2 pr-4">Authority</th><th className="py-2 pr-4">Due</th><th className="py-2 pr-4">Priority</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Action</th>
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
                  <td className="py-2 pr-4">{canManageCompliance && t.status !== "closed" ? <Button size="sm" variant="ghost" onClick={() => void handleAdvanceTask(t)} disabled={actionBusy === `task-${t.id}`}>Advance</Button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="py-2 pr-4">Filing</th><th className="py-2 pr-4">Authority</th><th className="py-2 pr-4">Period</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Reference</th><th className="py-2 pr-4">Action</th>
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
                  <td className="py-2 pr-4">{canManageCompliance && f.status !== "closed" ? <Button size="sm" variant="ghost" onClick={() => void handleAdvanceFiling(f)} disabled={actionBusy === `filing-${f.id}`}>Advance</Button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinance = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-lg flex items-center justify-between gap-2"><span className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Finance Compliance Ledger</span>{canManageFinance ? <Button size="sm" variant="outline" onClick={handleCreateInvoice} disabled={actionBusy === "invoice-create"}><Plus className="w-3 h-3 mr-1" /> Add</Button> : null}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded border border-border/50 p-3"><p className="text-xs text-muted-foreground">Controlled Spend</p><p className="text-xl">₹{kpis.controlledSpendCrore} Cr</p></div>
          <div className="rounded border border-border/50 p-3"><p className="text-xs text-muted-foreground">Open Financial Items</p><p className="text-xl text-yellow-300">{kpis.overdueItems}</p></div>
          <div className="rounded border border-border/50 p-3"><p className="text-xs text-muted-foreground">Audit Readiness</p><p className="text-xl text-green-300">{kpis.auditReadiness}%</p></div>
          <div className="rounded border border-border/50 p-3"><p className="text-xs text-muted-foreground">Evidence Linked</p><p className="text-xl">{evidenceCount}</p></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Due</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 12).map((i) => (
                <tr key={i.invoice_number} className="border-b border-border/30">
                  <td className="py-2 pr-4">{i.invoice_number}</td>
                  <td className="py-2 pr-4">{formatCurrency(i.amount)}</td>
                  <td className="py-2 pr-4">{i.due_date}</td>
                  <td className={`py-2 pr-4 ${statusClass[i.status] || "text-muted-foreground"}`}>{i.status.replace("_", " ")}</td>
                  <td className="py-2 pr-4">{canManageFinance && i.status !== "paid" ? <Button size="sm" variant="ghost" onClick={() => void handleMarkInvoicePaid(i)} disabled={actionBusy === `invoice-${i.invoice_number}`}>Mark Paid</Button> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcurement = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> Procurement Compliance Register</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50"><th className="py-2 pr-4">PO/Ref</th><th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Stage</th><th className="py-2 pr-4">Control</th></tr>
            </thead>
            <tbody>
              {procurementRows.map((r) => (
                <tr key={r.id} className="border-b border-border/30">
                  <td className="py-2 pr-4">{r.id}</td>
                  <td className="py-2 pr-4">{r.vendor}</td>
                  <td className="py-2 pr-4">{formatCurrency(r.amount)}</td>
                  <td className={`py-2 pr-4 ${statusClass[r.stage] || "text-muted-foreground"}`}>{r.stage.replace("_", " ")}</td>
                  <td className="py-2 pr-4">{r.control}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderGrants = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Grant Utilization Compliance</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50"><th className="py-2 pr-4">Grant</th><th className="py-2 pr-4">Budget</th><th className="py-2 pr-4">Utilized</th><th className="py-2 pr-4">Variance</th><th className="py-2 pr-4">Status</th></tr>
            </thead>
            <tbody>
              {grantRows.map((g) => (
                <tr key={g.grant} className="border-b border-border/30">
                  <td className="py-2 pr-4">{g.grant}</td>
                  <td className="py-2 pr-4">{formatCurrency(g.budget)}</td>
                  <td className="py-2 pr-4">{formatCurrency(g.utilized)}</td>
                  <td className={`py-2 pr-4 ${statusClass[g.variance] || "text-muted-foreground"}`}>{g.variance}</td>
                  <td className={`py-2 pr-4 ${statusClass[g.status] || "text-muted-foreground"}`}>{g.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderAudit = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileSearch className="w-5 h-5 text-primary" /> Audit and Internal Controls</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 p-3">Control testing coverage: <span className="text-green-300">92%</span></div>
          <div className="rounded border border-border/50 p-3">Exception queue: <span className="text-yellow-300">7 open</span></div>
          <div className="rounded border border-border/50 p-3">Material deviations: <span className="text-red-300">2 critical</span></div>
          <div className="rounded border border-border/50 p-3">Evidence linkage completeness: <span className="text-cyan-300">{evidenceCount} mapped docs</span></div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Audit Trail</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 p-3">17 edits tracked with before/after snapshots.</div>
          <div className="rounded border border-border/50 p-3">2 SLA breaches auto-escalated.</div>
          <div className="rounded border border-border/50 p-3">Immutable evidence chain active.</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkflow = () => (
    <Card className="bg-card/50 border-border/50">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Workflow className="w-5 h-5 text-primary" /> Compliance Approval Workflow</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {[
          ["Maker", "Department SPOC", "completed", "2026-02-18 10:32"],
          ["Reviewer", "Compliance Manager", "completed", "2026-02-18 15:05"],
          ["Finance Check", "Finance Controller", "in_progress", "2026-02-20 09:40"],
          ["Final Sign-off", "Compliance Head", "pending", "Awaited"],
        ].map((row) => (
          <div key={row[0]} className="rounded border border-border/50 p-3 flex justify-between gap-2">
            <div>
              <p className="font-medium">{row[0]}</p>
              <p className="text-xs text-muted-foreground">{row[1]}</p>
            </div>
            <div className="text-right">
              <p className={statusClass[row[2]] || "text-muted-foreground"}>{row[2].replace("_", " ")}</p>
              <p className="text-xs text-muted-foreground">{row[3]}</p>
            </div>
          </div>
        ))}
        <div className="rounded border border-border/50 p-3 flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-300" /> Immutable lock enabled after final sign-off.</div>
      </CardContent>
    </Card>
  );

  const renderCopilot = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> AI Compliance Copilot</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            "Escalate pending GST filing due in 48 hours.",
            "PF/ESI control check failed for 2 cost centers.",
            "Overdue invoice cluster suggests vendor compliance risk.",
            "Prepare personal hearing note pack for next authority date.",
          ].map((r) => (
            <div key={r} className="rounded border border-border/50 p-3 text-sm">{r}</div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button>Generate Reply Pack</Button>
            <Button variant="outline">Generate Hearing Notes</Button>
            <Button variant="outline">Explain Risk Factors</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> Risk Bands</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 p-3">Institution risk: <span className="text-yellow-300">Medium</span></div>
          <div className="rounded border border-border/50 p-3">Closure probability: <span className="text-green-300">78%</span></div>
          <div className="rounded border border-border/50 p-3">Primary blocker: delayed statutory review approvals.</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-border/50 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Compliance Performance Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/50"><th className="py-2 pr-4">Metric</th><th className="py-2 pr-4">Current</th><th className="py-2 pr-4">Prev</th><th className="py-2 pr-4">Trend</th></tr>
              </thead>
              <tbody>
                {[
                  ["Filing SLA Compliance", "96.2%", "93.4%", "up"],
                  ["Audit Control Coverage", "92%", "88%", "up"],
                  ["Evidence Linkage", `${evidenceCount}`, "110", "up"],
                  ["Overdue Financial Items", `${kpis.overdueItems}`, "5", "down"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-border/30">
                    <td className="py-2 pr-4">{row[0]}</td>
                    <td className="py-2 pr-4">{row[1]}</td>
                    <td className="py-2 pr-4">{row[2]}</td>
                    <td className={`py-2 pr-4 ${row[3] === "up" ? "text-green-300" : "text-yellow-300"}`}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Investor Snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded border border-border/50 p-3">Single compliance operating system across spend-heavy sectors.</div>
          <div className="rounded border border-border/50 p-3">Filing + finance + audit + procurement controls in one command plane.</div>
          <div className="rounded border border-border/50 p-3">Role-based accountability and immutable evidence lineage.</div>
        </CardContent>
      </Card>
    </div>
  );

  const contentByPage: Record<CompliancePage, JSX.Element> = {
    command: renderCommandCenter(),
    roledesk: renderRoleDesk(),
    statutory: renderStatutory(),
    finance: renderFinance(),
    procurement: renderProcurement(),
    grants: renderGrants(),
    audit: renderAudit(),
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
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Compliance Operations OS</p>
                <h1 className="text-2xl font-bold mt-1">{instituteName}</h1>
                <p className="text-sm text-muted-foreground mt-1">Compliance-only dashboard for all spend-linked sectors: statutory, finance, procurement, grants, audit, and employee controls.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={mode === "demo" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : source === "live" ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"}>{mode === "demo" ? "Demo" : source === "live" ? "Live" : "Fallback"}</Badge>
                <Badge variant="outline">Role: {roleMeta[effectiveRole].title}</Badge>
                <Button size="sm" variant="outline"><Bell className="w-4 h-4 mr-1" /> Alerts</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/50 xl:col-span-1">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-primary" /> Compliance Navigation</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {mode === "demo" ? (
                  <div className="rounded border border-border/50 p-2">
                    <p className="text-xs text-muted-foreground mb-2">Role Simulator</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["admin", "registrar", "finance", "faculty", "student"] as UniversityRole[]).map((role) => (
                        <Button key={role} size="sm" variant={demoRole === role ? "default" : "outline"} onClick={() => setDemoRole(role)}>{roleMeta[role].title.split(" ")[0]}</Button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded border border-border/50 p-2 space-y-2">
                  <p className="text-xs text-muted-foreground">Role Mandate</p>
                  {roleMeta[effectiveRole].mandate.map((m) => (
                    <div key={m} className="rounded border border-border/40 p-2 text-xs">{m}</div>
                  ))}
                </div>

                <div className="rounded border border-border/50 p-2 space-y-2">
                  <p className="text-xs text-muted-foreground">Pages for this role</p>
                  {visiblePages.map((page) => {
                    const Icon = page.icon;
                    const active = activePage === page.id;
                    return (
                      <button key={page.id} onClick={() => setActivePage(page.id)} className={`w-full text-left rounded px-2 py-2 border transition ${active ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40"}`}>
                        <span className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {page.label}</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></span>
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
                    <div className="flex items-center gap-2 rounded border border-border/50 px-3 py-2 text-sm text-muted-foreground"><Search className="w-4 h-4" /> Search compliance records</div>
                    <Button size="sm" variant="outline">Find DIN/RFN</Button>
                    <Button size="sm" variant="outline">Find Invoice</Button>
                    <Button size="sm" variant="outline">Find Filing</Button>
                    <Button size="sm" variant="outline"><Filter className="w-3 h-3 mr-1" /> Saved Views</Button>
                  </div>
                </CardContent>
              </Card>

              <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Controlled Spend</p><p className="text-2xl font-semibold mt-1">₹{kpis.controlledSpendCrore} Cr</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Open Filings</p><p className="text-2xl font-semibold mt-1 text-cyan-300">{kpis.openFilings}</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Overdue Items</p><p className="text-2xl font-semibold mt-1 text-yellow-300">{kpis.overdueItems}</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Audit Readiness</p><p className="text-2xl font-semibold mt-1 text-green-300">{kpis.auditReadiness}%</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Critical Alerts</p><p className="text-2xl font-semibold mt-1 text-red-300">{kpis.criticalAlerts}</p></CardContent></Card>
                <Card className="bg-card/50 border-border/50"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Evidence Mapped</p><p className="text-2xl font-semibold mt-1">{kpis.evidenceMapped}</p></CardContent></Card>
              </section>

              {contentByPage[activePage]}

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Output Package</CardTitle></CardHeader>
                  <CardContent className="text-sm">Final package includes draft reply, annexure index, hearing notes, argument script, and reviewer checklist.</CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Enterprise Controls</CardTitle></CardHeader>
                  <CardContent className="text-sm">PII masking, role scopes, audit trail, retries, and incident logs remain enforced.</CardContent>
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
