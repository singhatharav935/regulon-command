import { useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardTypeNav from "@/components/dashboard/DashboardTypeNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Brain, Cpu, Radar, Search, Sparkles, Users, Wand2 } from "lucide-react";

type CAStatus = "active" | "on_leave" | "at_capacity";
type WorkStatus = "todo" | "in_progress" | "blocked" | "completed" | "overdue";
type WorkPriority = "critical" | "high" | "medium" | "low";

type DemoCA = {
  name: string;
  license: string;
  specialty: string;
  status: CAStatus;
  openCases: number;
  completed: number;
  utilization: number;
  assignedClients: number;
};

type DemoWork = {
  id: string;
  assignedLicense: string;
  assignedCA: string;
  company: string;
  task: string;
  regulator: "MCA" | "GST" | "Income Tax" | "RBI" | "SEBI";
  dueDate: string;
  priority: WorkPriority;
  status: WorkStatus;
};

type AIRecommendation = {
  taskId: string;
  task: string;
  company: string;
  fromCA: string;
  toCA: string;
  confidence: number;
  reason: string;
};

const demoCas: DemoCA[] = [
  { name: "CA Rohan Mehta", license: "ICAI-274191", specialty: "MCA Adjudication", status: "active", openCases: 12, completed: 48, utilization: 79, assignedClients: 16 },
  { name: "CA Nidhi Sharma", license: "ICAI-221983", specialty: "Income Tax Notices", status: "active", openCases: 9, completed: 36, utilization: 71, assignedClients: 12 },
  { name: "CA Prateek Jain", license: "ICAI-300214", specialty: "Customs & SEZ", status: "on_leave", openCases: 3, completed: 27, utilization: 33, assignedClients: 5 },
  { name: "CA Aditi Rao", license: "ICAI-287771", specialty: "GST Litigation", status: "active", openCases: 15, completed: 51, utilization: 88, assignedClients: 20 },
  { name: "CA Vikram Iyer", license: "ICAI-239054", specialty: "RBI/FEMA", status: "at_capacity", openCases: 18, completed: 62, utilization: 95, assignedClients: 22 },
  { name: "CA Sneha Kulkarni", license: "ICAI-312870", specialty: "SEBI Compliance", status: "active", openCases: 7, completed: 29, utilization: 63, assignedClients: 9 },
];

const demoWorkItems: DemoWork[] = [
  { id: "w1", assignedLicense: "ICAI-274191", assignedCA: "CA Rohan Mehta", company: "Orbit Health Systems Pvt. Ltd.", task: "MCA reply draft (92/137)", regulator: "MCA", dueDate: "2026-03-10", priority: "critical", status: "in_progress" },
  { id: "w2", assignedLicense: "ICAI-221983", assignedCA: "CA Nidhi Sharma", company: "GlobalTrade India Ltd.", task: "143(2) response packet", regulator: "Income Tax", dueDate: "2026-03-12", priority: "high", status: "todo" },
  { id: "w3", assignedLicense: "ICAI-312870", assignedCA: "CA Sneha Kulkarni", company: "Zenith Media Labs Pvt. Ltd.", task: "LODR disclosure compliance note", regulator: "SEBI", dueDate: "2026-03-15", priority: "medium", status: "in_progress" },
  { id: "w4", assignedLicense: "ICAI-287771", assignedCA: "CA Aditi Rao", company: "NovaRetail Ventures Pvt. Ltd.", task: "DRC-01 rebuttal with ITC matrix", regulator: "GST", dueDate: "2026-03-08", priority: "critical", status: "overdue" },
  { id: "w5", assignedLicense: "ICAI-239054", assignedCA: "CA Vikram Iyer", company: "SecurePay Solutions", task: "FEMA reporting rectification", regulator: "RBI", dueDate: "2026-03-09", priority: "high", status: "blocked" },
  { id: "w6", assignedLicense: "ICAI-274191", assignedCA: "CA Rohan Mehta", company: "DataSync Analytics", task: "Officer-specific defense matrix", regulator: "MCA", dueDate: "2026-03-11", priority: "high", status: "todo" },
  { id: "w7", assignedLicense: "ICAI-287771", assignedCA: "CA Aditi Rao", company: "Acme Technologies Pvt. Ltd.", task: "MCA chronology & annexure reconciliation", regulator: "MCA", dueDate: "2026-03-13", priority: "medium", status: "in_progress" },
  { id: "w8", assignedLicense: "ICAI-221983", assignedCA: "CA Nidhi Sharma", company: "MetroMed Devices Pvt. Ltd.", task: "TDS mismatch defense note", regulator: "Income Tax", dueDate: "2026-03-14", priority: "medium", status: "completed" },
];

const statusBadgeClass: Record<WorkStatus, string> = {
  todo: "border-slate-400/40 text-slate-300",
  in_progress: "border-cyan-400/40 text-cyan-300",
  blocked: "border-amber-500/40 text-amber-300",
  completed: "border-emerald-500/40 text-emerald-300",
  overdue: "border-rose-500/40 text-rose-300",
};

const caStatusBadgeClass: Record<CAStatus, string> = {
  active: "border-emerald-500/40 text-emerald-300",
  on_leave: "border-amber-500/40 text-amber-300",
  at_capacity: "border-rose-500/40 text-rose-300",
};

const priorityBadgeClass: Record<WorkPriority, string> = {
  critical: "border-rose-500/40 text-rose-300",
  high: "border-orange-500/40 text-orange-300",
  medium: "border-amber-500/40 text-amber-300",
  low: "border-cyan-500/40 text-cyan-300",
};

const sorters: Record<string, (a: DemoCA, b: DemoCA) => number> = {
  utilization_desc: (a, b) => b.utilization - a.utilization,
  open_cases_desc: (a, b) => b.openCases - a.openCases,
  completed_desc: (a, b) => b.completed - a.completed,
  name_asc: (a, b) => a.name.localeCompare(b.name),
};

const CAFirmDashboard = () => {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "directory" | "work">("all");
  const [caStatus, setCaStatus] = useState<"all" | CAStatus>("all");
  const [workStatus, setWorkStatus] = useState<"all" | WorkStatus>("all");
  const [regulator, setRegulator] = useState<"all" | DemoWork["regulator"]>("all");
  const [sortBy, setSortBy] = useState("utilization_desc");
  const [scenario, setScenario] = useState<"normal" | "mca_spike" | "gst_surge" | "two_ca_leave">("normal");
  const [aiCommand, setAiCommand] = useState("");
  const [executedCommand, setExecutedCommand] = useState("Run AI command to generate autonomous firm actions.");

  const normalizedQuery = search.toLowerCase().trim();

  const directoryRows = useMemo(() => {
    const rows = demoCas
      .filter((ca) => (caStatus === "all" ? true : ca.status === caStatus))
      .filter((ca) => {
        if (!normalizedQuery) return true;
        if (scope === "work") return false;
        return [ca.name, ca.license, ca.specialty].some((v) => v.toLowerCase().includes(normalizedQuery));
      })
      .sort(sorters[sortBy] ?? sorters.utilization_desc);

    return rows;
  }, [caStatus, normalizedQuery, scope, sortBy]);

  const workRows = useMemo(() => {
    return demoWorkItems
      .filter((work) => (workStatus === "all" ? true : work.status === workStatus))
      .filter((work) => (regulator === "all" ? true : work.regulator === regulator))
      .filter((work) => {
        if (!normalizedQuery) return true;
        if (scope === "directory") return false;
        return [work.assignedCA, work.assignedLicense, work.company, work.task, work.regulator]
          .some((v) => v.toLowerCase().includes(normalizedQuery));
      });
  }, [workStatus, regulator, normalizedQuery, scope]);

  const aiInsights = useMemo(() => {
    const overdue = workRows.filter((w) => w.status === "overdue").length;
    const blocked = workRows.filter((w) => w.status === "blocked").length;
    const highestUtilization = [...demoCas].sort((a, b) => b.utilization - a.utilization)[0];
    const reassignTarget = [...demoCas].filter((ca) => ca.status === "active").sort((a, b) => a.utilization - b.utilization)[0];
    const criticalMca = workRows.filter((w) => w.regulator === "MCA" && (w.priority === "critical" || w.priority === "high")).length;

    return [
      `AI Risk Signal: ${overdue} overdue and ${blocked} blocked tasks need intervention in next 24 hours.`,
      `AI Workload Signal: ${highestUtilization.name} is at ${highestUtilization.utilization}% utilization. Route new critical filings to ${reassignTarget.name}.`,
      `AI MCA Signal: ${criticalMca} high-priority MCA matters require fast-track drafting and review sequencing.`,
    ];
  }, [workRows]);

  const autopilotRecommendations = useMemo<AIRecommendation[]>(() => {
    const activeCas = demoCas.filter((ca) => ca.status === "active").sort((a, b) => a.utilization - b.utilization);
    const overloaded = demoCas.filter((ca) => ca.utilization >= 85);
    const candidateTasks = workRows.filter((w) => w.status !== "completed" && (w.priority === "critical" || w.status === "blocked" || w.status === "overdue"));
    if (activeCas.length === 0 || candidateTasks.length === 0) return [];

    return candidateTasks.slice(0, 4).map((task, idx) => {
      const from = overloaded.find((ca) => ca.name === task.assignedCA)?.name || task.assignedCA;
      const target = activeCas[idx % activeCas.length];
      const confidence = Math.max(72, 96 - target.utilization + (task.priority === "critical" ? 8 : 0));
      return {
        taskId: task.id,
        task: task.task,
        company: task.company,
        fromCA: from,
        toCA: target.name,
        confidence,
        reason: `${task.regulator} expertise fit + lower utilization (${target.utilization}%) + deadline pressure (${task.dueDate}).`,
      };
    });
  }, [workRows]);

  const scenarioMetrics = useMemo(() => {
    const baseRisk = demoWorkItems.filter((w) => w.status === "overdue" || w.status === "blocked").length * 9;
    if (scenario === "mca_spike") return { risk: baseRisk + 28, sla: 71, impact: "MCA intake +40% in 72 hours; add parallel reviewer lane and MCA-only fast queue." };
    if (scenario === "gst_surge") return { risk: baseRisk + 19, sla: 76, impact: "GST litigation load spike expected; assign dual-owner model for critical GST files." };
    if (scenario === "two_ca_leave") return { risk: baseRisk + 34, sla: 66, impact: "Two active CAs unavailable; trigger emergency rebalance + temporary specialization override." };
    return { risk: baseRisk + 8, sla: 89, impact: "Current staffing sustains SLA with proactive rebalance every 24h." };
  }, [scenario]);

  const runAiCommand = () => {
    const q = aiCommand.trim().toLowerCase();
    if (!q) {
      setExecutedCommand("No command entered. Try: 'rebalance critical MCA work' or 'show blocked tasks with replacement plan'.");
      return;
    }
    if (q.includes("rebalance")) {
      setExecutedCommand(`Autopilot Plan Created: ${autopilotRecommendations.length} task reassignments drafted with confidence scoring and explainability trace.`);
    } else if (q.includes("blocked")) {
      const blocked = workRows.filter((w) => w.status === "blocked").length;
      setExecutedCommand(`Blocked-Task Rescue: ${blocked} blocked matters detected. AI generated dependency-unblock sequence with owner mapping.`);
    } else if (q.includes("mca")) {
      const mca = workRows.filter((w) => w.regulator === "MCA" && w.status !== "completed").length;
      setExecutedCommand(`MCA War-Room: ${mca} active MCA files prioritized into 24h/48h/72h lanes with draft-review-hearing sequencing.`);
    } else {
      setExecutedCommand("Command interpreted. AI generated an optimization brief, risk ladder, and owner-level execution checklist.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">
          <DashboardTypeNav activeType="ca-firm" />

          <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-slate-500/10">
            <p className="text-sm text-cyan-200">
              <strong>AI Command CA Firm Console</strong> - autonomous routing, command-driven operations, what-if simulation, and explainable reassignment intelligence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tracked CAs</p><p className="text-2xl font-bold">{demoCas.length}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Work Items</p><p className="text-2xl font-bold">{demoWorkItems.filter((w) => w.status !== "completed").length}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-rose-300">{demoWorkItems.filter((w) => w.status === "overdue").length}</p></CardContent></Card>
            <Card className="glass-card border-border/40"><CardContent className="p-4"><p className="text-xs text-muted-foreground">MCA Priority Queue</p><p className="text-2xl font-bold text-cyan-300">{demoWorkItems.filter((w) => w.regulator === "MCA" && w.status !== "completed").length}</p></CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="glass-card border-cyan-500/30 lg:col-span-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
              <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-300" /> AI Command Center (Firm Autopilot)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={aiCommand} onChange={(e) => setAiCommand(e.target.value)} className="min-h-[90px] bg-background/50" placeholder="Type command: Rebalance all critical MCA tasks with explainability and replacement owners." />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAiCommand("rebalance critical MCA work and generate owner plan")}>Quick: MCA Rebalance</Button>
                  <Button size="sm" variant="outline" onClick={() => setAiCommand("show blocked tasks with replacement plan")}>Quick: Blocked Rescue</Button>
                  <Button size="sm" variant="outline" onClick={() => setAiCommand("generate 48h firm execution plan with SLA protection")}>Quick: 48h Plan</Button>
                  <Button size="sm" onClick={runAiCommand} className="btn-glow"><Wand2 className="w-4 h-4 mr-2" />Run AI Command</Button>
                </div>
                <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 text-sm">{executedCommand}</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/40">
              <CardHeader><CardTitle className="flex items-center gap-2"><Radar className="w-5 h-5 text-cyan-300" /> Scenario Lab</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={scenario} onValueChange={(v: "normal" | "mca_spike" | "gst_surge" | "two_ca_leave") => setScenario(v)}>
                  <SelectTrigger><SelectValue placeholder="Scenario" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Week</SelectItem>
                    <SelectItem value="mca_spike">MCA Spike</SelectItem>
                    <SelectItem value="gst_surge">GST Surge</SelectItem>
                    <SelectItem value="two_ca_leave">2 CA Leave Shock</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">Predicted SLA Retention</div>
                <Progress value={scenarioMetrics.sla} />
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">AI Risk Index</span><span className="text-rose-300 font-medium">{scenarioMetrics.risk}/100</span></div>
                <p className="text-sm text-cyan-100">{scenarioMetrics.impact}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-cyan-300" /> Search Engine & Smart Filters</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Search by CA name/license/specialty, company, regulator, or assigned task" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="grid md:grid-cols-5 gap-3">
                <Select value={scope} onValueChange={(v: "all" | "directory" | "work") => setScope(v)}>
                  <SelectTrigger><SelectValue placeholder="Search Scope" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="directory">Directory Only</SelectItem><SelectItem value="work">Assigned Work Only</SelectItem></SelectContent>
                </Select>
                <Select value={caStatus} onValueChange={(v: "all" | CAStatus) => setCaStatus(v)}>
                  <SelectTrigger><SelectValue placeholder="CA Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All CA Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="on_leave">On Leave</SelectItem><SelectItem value="at_capacity">At Capacity</SelectItem></SelectContent>
                </Select>
                <Select value={workStatus} onValueChange={(v: "all" | WorkStatus) => setWorkStatus(v)}>
                  <SelectTrigger><SelectValue placeholder="Work Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Work Status</SelectItem><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="blocked">Blocked</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                </Select>
                <Select value={regulator} onValueChange={(v: "all" | DemoWork["regulator"]) => setRegulator(v)}>
                  <SelectTrigger><SelectValue placeholder="Regulator" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Regulators</SelectItem><SelectItem value="MCA">MCA</SelectItem><SelectItem value="GST">GST</SelectItem><SelectItem value="Income Tax">Income Tax</SelectItem><SelectItem value="RBI">RBI</SelectItem><SelectItem value="SEBI">SEBI</SelectItem></SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue placeholder="Sort Directory" /></SelectTrigger>
                  <SelectContent><SelectItem value="utilization_desc">Sort: Utilization (High-Low)</SelectItem><SelectItem value="open_cases_desc">Sort: Open Cases (High-Low)</SelectItem><SelectItem value="completed_desc">Sort: Completed (High-Low)</SelectItem><SelectItem value="name_asc">Sort: Name (A-Z)</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="glass-card border-border/40 lg:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-cyan-300" /> AI Directory Intelligence</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {directoryRows.map((ca) => (
                  <div key={ca.license} className="p-3 rounded-lg border border-border/40 bg-background/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><p className="font-medium">{ca.name}</p><p className="text-xs text-muted-foreground">{ca.license} • {ca.specialty}</p></div>
                      <div className="flex items-center gap-2"><Badge variant="outline" className={caStatusBadgeClass[ca.status]}>{ca.status}</Badge><Badge variant="outline">{ca.assignedClients} clients</Badge></div>
                    </div>
                    <div><div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Utilization</span><span>{ca.utilization}%</span></div><Progress value={ca.utilization} /></div>
                    <div className="grid grid-cols-2 gap-2 text-xs"><p className="text-muted-foreground">Open: <span className="text-foreground">{ca.openCases}</span></p><p className="text-muted-foreground">Completed: <span className="text-foreground">{ca.completed}</span></p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card border-border/40">
              <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-cyan-300" /> AI Ops Suggestions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="text-sm p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-100"><div className="flex items-start gap-2"><Sparkles className="w-4 h-4 mt-0.5 text-cyan-300" /><p>{insight}</p></div></div>
                ))}
                <div className="grid gap-2 pt-1">
                  <Button variant="outline">AI Rebalance Workload</Button>
                  <Button variant="outline">AI Prioritize Critical Filings</Button>
                  <Button variant="outline">AI Generate Daily Assignment Plan</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-cyan-300" /> Autonomous Reassignment Engine (Explainability)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Task</TableHead><TableHead>Company</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Confidence</TableHead><TableHead>Why AI Suggested This</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {autopilotRecommendations.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-muted-foreground">No reassignment needed under current load profile.</TableCell></TableRow>
                  ) : autopilotRecommendations.map((item) => (
                    <TableRow key={item.taskId}>
                      <TableCell className="font-medium">{item.task}</TableCell>
                      <TableCell>{item.company}</TableCell>
                      <TableCell>{item.fromCA}</TableCell>
                      <TableCell>{item.toCA}</TableCell>
                      <TableCell><Badge variant="outline" className="border-cyan-500/40 text-cyan-300">{item.confidence}%</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{item.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader><CardTitle>Assigned Work Explorer</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-sm"><TabsTrigger value="table">Work Table</TabsTrigger><TabsTrigger value="queue">Critical Queue</TabsTrigger></TabsList>
                <TabsContent value="table" className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Company</TableHead><TableHead>Assigned CA</TableHead><TableHead>Task</TableHead><TableHead>Regulator</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {workRows.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-muted-foreground">No work items found for current search/filter set.</TableCell></TableRow>
                      ) : workRows.map((work) => (
                        <TableRow key={work.id}>
                          <TableCell className="font-medium">{work.company}</TableCell>
                          <TableCell>{work.assignedCA}</TableCell>
                          <TableCell>{work.task}</TableCell>
                          <TableCell>{work.regulator}</TableCell>
                          <TableCell><Badge variant="outline" className={priorityBadgeClass[work.priority]}>{work.priority}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={statusBadgeClass[work.status]}>{work.status}</Badge></TableCell>
                          <TableCell>{work.dueDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="queue" className="mt-4 space-y-2">
                  {workRows.filter((w) => w.priority === "critical" || w.status === "overdue" || w.status === "blocked").map((w) => (
                    <div key={w.id} className="p-3 rounded-lg border border-border/40 bg-background/30">
                      <p className="font-medium">{w.company} - {w.task}</p>
                      <p className="text-xs text-muted-foreground">{w.assignedCA} • {w.regulator} • due {w.dueDate}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CAFirmDashboard;

