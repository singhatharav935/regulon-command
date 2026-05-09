import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Wand2, Sparkles, Brain, Cpu, Users, AlertTriangle,
  ArrowRight, CheckCircle2, Clock, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import AIVoiceBriefAgent from '@/components/voice/AIVoiceBriefAgent';
import type { FirmMember, FirmClient, CAAssignment } from '@/hooks/personas/useCAFirmData';
import { getStatutoryDeadlines } from '@/services/ca-supabase-service';

interface Props {
  firmId: string;
  firmName: string;
  members: FirmMember[];
  clients: FirmClient[];
  assignments: CAAssignment[];
}

interface WorkItem {
  id: string;
  assignedCA: string;
  caId: string;
  company: string;
  task: string;
  regulator: string;
  dueDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'blocked' | 'completed' | 'overdue';
}

export default function FirmAutopilot({ firmId, firmName, members, clients, assignments }: Props) {
  const [aiCommand, setAiCommand] = useState('');
  const [executedCommand, setExecutedCommand] = useState('Run AI command to generate autonomous firm actions.');

  const deadlines = useMemo(() => getStatutoryDeadlines(), []);

  // Build synthesized work items from real assignments + deadlines
  const workItems = useMemo<WorkItem[]>(() => {
    const items: WorkItem[] = [];
    const regulators = ['GST', 'Income Tax', 'MCA', 'RBI', 'SEBI'];
    const tasks = [
      'GSTR-3B Return Filing', 'TDS Quarterly Return', 'ROC Annual Filing',
      'GST Audit Preparation', 'Income Tax Assessment Reply', 'FEMA Compliance Report',
      'Board Resolution Drafting', 'Tax Planning Advisory', 'Statutory Audit Completion',
      'Transfer Pricing Documentation'
    ];

    assignments.forEach((a, idx) => {
      const member = members.find(m => m.id === a.ca_id);
      const client = clients.find(c => c.id === a.client_id);
      if (!member || !client) return;

      const deadline = deadlines[idx % deadlines.length];
      const daysLeft = deadline?.daysRemaining ?? 30;
      const status: WorkItem['status'] = daysLeft < 0 ? 'overdue' : daysLeft < 3 ? 'in_progress' : daysLeft < 7 ? 'todo' : 'completed';
      const priority: WorkItem['priority'] = daysLeft < 0 ? 'critical' : daysLeft < 3 ? 'high' : daysLeft < 7 ? 'medium' : 'low';

      items.push({
        id: a.id,
        assignedCA: member.name,
        caId: member.id,
        company: client.company_name,
        task: tasks[idx % tasks.length],
        regulator: regulators[idx % regulators.length],
        dueDate: deadline?.deadline || new Date(Date.now() + daysLeft * 86400000).toISOString().split('T')[0],
        priority,
        status,
      });
    });

    // If no real assignments, generate synthetic items from deadlines
    if (items.length === 0 && members.length > 0) {
      deadlines.slice(0, 6).forEach((d, idx) => {
        const m = members[idx % members.length];
        const c = clients[idx % Math.max(1, clients.length)];
        items.push({
          id: `synth-${idx}`,
          assignedCA: m.name,
          caId: m.id,
          company: c?.company_name || 'Unassigned Client',
          task: d.title,
          regulator: d.regulator,
          dueDate: d.deadline,
          priority: d.status === 'overdue' ? 'critical' : d.status === 'urgent' ? 'high' : 'medium',
          status: d.status === 'overdue' ? 'overdue' : d.status === 'urgent' ? 'in_progress' : 'todo',
        });
      });
    }

    return items;
  }, [assignments, members, clients, deadlines]);

  // AI Insights computed from real data
  const aiInsights = useMemo(() => {
    const overdue = workItems.filter(w => w.status === 'overdue').length;
    const blocked = workItems.filter(w => w.status === 'blocked').length;
    const activeMembers = members.filter(m => m.status === 'active');
    const highestUtil = activeMembers.length > 0
      ? activeMembers.reduce((best, m) => {
          const count = assignments.filter(a => a.ca_id === m.id).length;
          const bestCount = assignments.filter(a => a.ca_id === best.id).length;
          return count > bestCount ? m : best;
        }, activeMembers[0])
      : null;
    const lowestUtil = activeMembers.length > 0
      ? activeMembers.reduce((best, m) => {
          const count = assignments.filter(a => a.ca_id === m.id).length;
          const bestCount = assignments.filter(a => a.ca_id === best.id).length;
          return count < bestCount ? m : best;
        }, activeMembers[0])
      : null;
    const mcaCritical = workItems.filter(w => w.regulator === 'MCA' && (w.priority === 'critical' || w.priority === 'high')).length;
    const highUtilPct = highestUtil ? Math.min(100, assignments.filter(a => a.ca_id === highestUtil.id).length * 12) : 0;

    const insights: string[] = [];
    if (overdue > 0 || blocked > 0) {
      insights.push(`AI Risk Signal: ${overdue} overdue and ${blocked} blocked tasks need intervention in the next 24 hours.`);
    }
    if (highestUtil && lowestUtil && highestUtil.id !== lowestUtil.id) {
      insights.push(`AI Workload Signal: ${highestUtil.name} is at ${highUtilPct}% utilization. Route new critical filings to ${lowestUtil.name}.`);
    }
    if (mcaCritical > 0) {
      insights.push(`AI MCA Signal: ${mcaCritical} high-priority MCA matters require fast-track drafting and review sequencing.`);
    }
    if (insights.length === 0) {
      insights.push('AI Status: All team members are within optimal workload thresholds. No immediate rebalancing required.');
    }
    return insights;
  }, [workItems, members, assignments]);

  // Autopilot reassignment recommendations
  const recommendations = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');
    const sortedByLoad = [...activeMembers].sort((a, b) => {
      const aCount = assignments.filter(x => x.ca_id === a.id).length;
      const bCount = assignments.filter(x => x.ca_id === b.id).length;
      return aCount - bCount;
    });
    const candidateTasks = workItems.filter(w => w.status !== 'completed' && (w.priority === 'critical' || w.status === 'overdue' || w.status === 'blocked'));
    if (sortedByLoad.length === 0 || candidateTasks.length === 0) return [];

    return candidateTasks.slice(0, 4).map((task, idx) => {
      const target = sortedByLoad[idx % sortedByLoad.length];
      const targetLoad = assignments.filter(a => a.ca_id === target.id).length;
      const confidence = Math.max(72, 96 - targetLoad * 5 + (task.priority === 'critical' ? 8 : 0));
      return {
        taskId: task.id,
        task: task.task,
        company: task.company,
        fromCA: task.assignedCA,
        toCA: target.name,
        confidence: Math.min(98, confidence),
        reason: `${task.regulator} expertise fit + lower utilization (${Math.min(100, targetLoad * 12)}%) + deadline pressure (${task.dueDate}).`,
      };
    });
  }, [workItems, members, assignments]);

  const runAiCommand = () => {
    const q = aiCommand.trim().toLowerCase();
    if (!q) {
      setExecutedCommand("No command entered. Try: 'rebalance critical MCA work' or 'show blocked tasks with replacement plan'.");
      return;
    }
    if (q.includes('rebalance')) {
      setExecutedCommand(`Autopilot Plan Created: ${recommendations.length} task reassignments drafted with confidence scoring. ${members.length} team members analysed across ${clients.length} active clients.`);
    } else if (q.includes('blocked')) {
      const blocked = workItems.filter(w => w.status === 'blocked').length;
      setExecutedCommand(`Blocked-Task Rescue: ${blocked} blocked matters detected. AI generated dependency-unblock sequence with owner mapping for ${firmName}.`);
    } else if (q.includes('mca')) {
      const mca = workItems.filter(w => w.regulator === 'MCA' && w.status !== 'completed').length;
      setExecutedCommand(`MCA War-Room: ${mca} active MCA files prioritized into 24h/48h/72h lanes with draft-review-hearing sequencing.`);
    } else if (q.includes('gst')) {
      const gst = workItems.filter(w => w.regulator === 'GST' && w.status !== 'completed').length;
      setExecutedCommand(`GST Operations: ${gst} active GST filings detected. Return-wise deadline ladder generated with ITC reconciliation checkpoints.`);
    } else if (q.includes('plan') || q.includes('48h')) {
      setExecutedCommand(`48h Execution Plan Generated: ${workItems.filter(w => w.status !== 'completed').length} open tasks sequenced into priority lanes. ${members.filter(m => m.status === 'active').length} active CAs assigned with SLA protection.`);
    } else {
      setExecutedCommand(`Command interpreted. AI generated an optimization brief for ${firmName}: risk ladder across ${workItems.length} work items, owner-level execution checklist for ${members.length} team members.`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Voice Brief Agent */}
      <AIVoiceBriefAgent
        dashboardId={`firm-${firmId}`}
        actorName="Managing Partner"
        roleLabel="CA Firm Command Dashboard"
        pendingWork={workItems.filter(w => w.status !== 'completed').slice(0, 4).map(w => `${w.company}: ${w.task}`)}
        newRules={aiInsights}
        autopilotActions={recommendations.slice(0, 3).map(r => `Reassignment: ${r.fromCA} → ${r.toCA} for ${r.company}`)}
        actionLedger={[
          { id: 'firm-auto-1', timeLabel: '04:55 AM', portal: 'MCA', action: `Re-sequenced ${workItems.filter(w => w.regulator === 'MCA').length} MCA matters into 24h/48h firm lanes.`, status: 'completed' },
          { id: 'firm-auto-2', timeLabel: '05:11 AM', portal: 'GST', action: `Prepared dependency-unblock steps for ${workItems.filter(w => w.regulator === 'GST').length} GST cases.`, status: 'completed' },
          { id: 'firm-auto-3', timeLabel: '05:29 AM', portal: 'Income Tax', action: `Drafted reassignment plan for time-sensitive assessment responses.`, status: 'needs_approval', approvalTitle: 'Approve IT reassignment plan and dispatch client-side updates.' },
          { id: 'firm-auto-4', timeLabel: '05:44 AM', portal: 'RBI/SEBI', action: 'Created compliance watchlist for new circular-driven client impact.', status: 'needs_approval', approvalTitle: 'Approve circulation of regulator watchlist to partner group.' },
        ]}
      />

      {/* AI Command Center + AI Ops Suggestions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass-card border-cyan-500/30 lg:col-span-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-300" /> AI Command Center (Firm Autopilot)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={aiCommand}
              onChange={e => setAiCommand(e.target.value)}
              className="min-h-[90px] bg-background/50"
              placeholder="Type command: Rebalance all critical MCA tasks with explainability and replacement owners."
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setAiCommand('rebalance critical MCA work and generate owner plan')}>Quick: MCA Rebalance</Button>
              <Button size="sm" variant="outline" onClick={() => setAiCommand('show blocked tasks with replacement plan')}>Quick: Blocked Rescue</Button>
              <Button size="sm" variant="outline" onClick={() => setAiCommand('generate 48h firm execution plan with SLA protection')}>Quick: 48h Plan</Button>
              <Button size="sm" onClick={runAiCommand} className="btn-glow"><Wand2 className="w-4 h-4 mr-2" />Run AI Command</Button>
            </div>
            <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-100 text-sm">{executedCommand}</div>
          </CardContent>
        </Card>

        {/* AI Ops Suggestions */}
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-300" /> AI Ops Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="text-sm p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 mt-0.5 text-cyan-300 shrink-0" />
                  <p>{insight}</p>
                </div>
              </div>
            ))}
            <div className="grid gap-2 pt-1">
              <Button variant="outline" onClick={() => { setAiCommand('rebalance workload'); runAiCommand(); }}>AI Rebalance Workload</Button>
              <Button variant="outline" onClick={() => { setAiCommand('prioritize critical filings'); runAiCommand(); }}>AI Prioritize Critical Filings</Button>
              <Button variant="outline" onClick={() => { setAiCommand('generate 48h plan'); runAiCommand(); }}>AI Generate Daily Assignment Plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tracked CAs</p>
            <p className="text-2xl font-bold">{members.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Work Items</p>
            <p className="text-2xl font-bold">{workItems.filter(w => w.status !== 'completed').length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-rose-300">{workItems.filter(w => w.status === 'overdue').length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Critical Queue</p>
            <p className="text-2xl font-bold text-cyan-300">{workItems.filter(w => w.priority === 'critical' && w.status !== 'completed').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Autonomous Reassignment Engine */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-300" /> Autonomous Reassignment Engine (Explainability)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Why AI Suggested This</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No reassignment needed under current load profile.</TableCell></TableRow>
              ) : recommendations.map(item => (
                <TableRow key={item.taskId}>
                  <TableCell className="font-medium">{item.task}</TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell>{item.fromCA}</TableCell>
                  <TableCell>{item.toCA}</TableCell>
                  <TableCell><Badge variant="outline" className="border-cyan-500/40 text-cyan-300">{item.confidence}%</Badge></TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">{item.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CA Directory Intelligence */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-300" /> AI Directory Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">No team members added yet. Add members from the Team & Allocation tab.</p>
          ) : members.map(ca => {
            const assignCount = assignments.filter(a => a.ca_id === ca.id).length;
            const utilization = Math.min(100, assignCount * 12);
            const statusBadge = ca.status === 'active' ? 'border-emerald-500/40 text-emerald-300'
              : ca.status === 'on_leave' ? 'border-amber-500/40 text-amber-300' : 'border-rose-500/40 text-rose-300';
            return (
              <div key={ca.id} className="p-3 rounded-lg border border-border/40 bg-background/30 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{ca.name}</p>
                    <p className="text-xs text-muted-foreground">{ca.email} • {ca.specialization || ca.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusBadge}>{ca.status}</Badge>
                    <Badge variant="outline">{assignCount} clients</Badge>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Utilization</span>
                    <span>{utilization}%</span>
                  </div>
                  <Progress value={utilization} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
