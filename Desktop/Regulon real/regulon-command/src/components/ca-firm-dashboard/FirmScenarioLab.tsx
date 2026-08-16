import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Radar, AlertTriangle, TrendingDown, Shield, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FirmMember, FirmClient, CAAssignment } from '@/hooks/personas/useCAFirmData';
import { getStatutoryDeadlines } from '@/services/ca-supabase-service';

interface Props {
  firmId: string;
  members: FirmMember[];
  clients: FirmClient[];
  assignments: CAAssignment[];
}

type Scenario = 'normal' | 'mca_spike' | 'gst_surge' | 'two_ca_leave';

export default function FirmScenarioLab({ firmId, members, clients, assignments }: Props) {
  const [scenario, setScenario] = useState<Scenario>('normal');
  const deadlines = useMemo(() => getStatutoryDeadlines(), []);

  const overdueCount = deadlines.filter(d => d.status === 'overdue').length;
  const urgentCount = deadlines.filter(d => d.status === 'urgent').length;
  const activeMembers = members.filter(m => m.status === 'active');

  const scenarioMetrics = useMemo(() => {
    const baseRisk = (overdueCount + urgentCount) * 6;
    const teamSize = activeMembers.length || 1;
    const clientLoad = clients.length;
    const loadPerCA = clientLoad / teamSize;

    switch (scenario) {
      case 'mca_spike':
        return {
          risk: Math.min(100, baseRisk + 28),
          sla: Math.max(50, 89 - Math.round(loadPerCA * 3)),
          impact: `MCA intake +40% in 72 hours. AI recommends: add parallel reviewer lane, create MCA-only fast queue, and redistribute ${Math.ceil(clientLoad * 0.3)} clients to under-utilized CAs.`,
          color: 'text-amber-400',
        };
      case 'gst_surge':
        return {
          risk: Math.min(100, baseRisk + 19),
          sla: Math.max(55, 85 - Math.round(loadPerCA * 2)),
          impact: `GST litigation load spike expected during return season. AI recommends: assign dual-owner model for critical GST files, enable auto-ITC reconciliation, and prepare GSTR-9 templates across ${clientLoad} clients.`,
          color: 'text-orange-400',
        };
      case 'two_ca_leave':
        return {
          risk: Math.min(100, baseRisk + 34),
          sla: Math.max(40, 78 - Math.round(loadPerCA * 4)),
          impact: `Two active CAs unavailable. ${activeMembers.length - 2 > 0 ? activeMembers.length - 2 : 0} remaining CAs must absorb ${Math.ceil(clientLoad * 0.35)} additional clients. AI recommends: trigger emergency rebalance + temporary specialization override + article assistant escalation.`,
          color: 'text-rose-400',
        };
      default:
        return {
          risk: Math.min(100, baseRisk + 8),
          sla: Math.max(70, 92 - Math.round(loadPerCA)),
          impact: `Current staffing of ${activeMembers.length} CAs sustains SLA across ${clientLoad} clients with proactive rebalance every 24h. ${overdueCount > 0 ? `${overdueCount} overdue deadlines need immediate attention.` : 'No critical bottlenecks detected.'}`,
          color: 'text-emerald-400',
        };
    }
  }, [scenario, overdueCount, urgentCount, activeMembers.length, clients.length]);

  // Simulated CA impact per scenario
  const caImpact = useMemo(() => {
    return activeMembers.map(m => {
      const assignCount = assignments.filter(a => a.ca_id === m.id).length;
      let simLoad = Math.min(100, assignCount * 12);
      let simStatus = m.status;

      if (scenario === 'mca_spike') simLoad = Math.min(100, simLoad + 15);
      if (scenario === 'gst_surge') simLoad = Math.min(100, simLoad + 10);
      if (scenario === 'two_ca_leave' && activeMembers.indexOf(m) < 2) {
        simStatus = 'on_leave';
        simLoad = 0;
      } else if (scenario === 'two_ca_leave') {
        simLoad = Math.min(100, simLoad + 25);
      }

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        specialization: m.specialization,
        baseLoad: Math.min(100, assignCount * 12),
        simLoad,
        simStatus,
        clients: assignCount,
      };
    });
  }, [activeMembers, assignments, scenario]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Scenario Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-cyan-300" /> Scenario Lab — What-If Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Scenario picker */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Select Scenario</p>
                <Select value={scenario} onValueChange={(v: Scenario) => setScenario(v)}>
                  <SelectTrigger><SelectValue placeholder="Scenario" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Week</SelectItem>
                    <SelectItem value="mca_spike">MCA Spike (+40% Intake)</SelectItem>
                    <SelectItem value="gst_surge">GST Return Surge</SelectItem>
                    <SelectItem value="two_ca_leave">2 CA Leave Shock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SLA Retention */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Predicted SLA Retention</p>
                <Progress value={scenarioMetrics.sla} className="h-3" />
                <p className="text-lg font-bold text-foreground">{scenarioMetrics.sla}%</p>
              </div>

              {/* Risk Index */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">AI Risk Index</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        scenarioMetrics.risk > 70 ? 'bg-rose-500' :
                        scenarioMetrics.risk > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${scenarioMetrics.risk}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold ${scenarioMetrics.color}`}>{scenarioMetrics.risk}/100</span>
                </div>
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${scenarioMetrics.color}`} />
                <p className="text-sm text-cyan-100">{scenarioMetrics.impact}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CA Impact Table */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-300" /> Team Impact Under "{scenario === 'normal' ? 'Normal' : scenario === 'mca_spike' ? 'MCA Spike' : scenario === 'gst_surge' ? 'GST Surge' : '2 CA Leave'}" Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {caImpact.length === 0 ? (
            <p className="text-muted-foreground text-sm">Add team members to see scenario impact analysis.</p>
          ) : caImpact.map((ca, i) => {
            const statusBadge = ca.simStatus === 'active' ? 'border-emerald-500/40 text-emerald-300'
              : ca.simStatus === 'on_leave' ? 'border-amber-500/40 text-amber-300' : 'border-rose-500/40 text-rose-300';
            const loadColor = ca.simLoad > 80 ? 'bg-rose-500' : ca.simLoad > 50 ? 'bg-amber-500' : 'bg-emerald-500';
            const delta = ca.simLoad - ca.baseLoad;
            return (
              <motion.div
                key={ca.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-border/40 bg-background/30"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-medium text-foreground">{ca.name}</p>
                    <p className="text-xs text-muted-foreground">{ca.specialization || ca.role} · {ca.clients} clients</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusBadge}>{ca.simStatus}</Badge>
                    {delta > 0 && (
                      <Badge variant="outline" className="border-rose-500/40 text-rose-300">
                        +{delta}% load
                      </Badge>
                    )}
                    {ca.simStatus === 'on_leave' && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300">Unavailable</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${loadColor}`} style={{ width: `${ca.simLoad}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium w-10 text-right">{ca.simLoad}%</span>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Deadline Impact */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-300" /> Regulatory Deadline Stress Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-background/30 border border-border/20 text-center">
              <p className="text-2xl font-bold text-foreground">{deadlines.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Deadlines</p>
            </div>
            <div className="p-4 rounded-xl bg-background/30 border border-border/20 text-center">
              <p className="text-2xl font-bold text-rose-400">{overdueCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Overdue</p>
            </div>
            <div className="p-4 rounded-xl bg-background/30 border border-border/20 text-center">
              <p className="text-2xl font-bold text-amber-400">{urgentCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Urgent (≤7 days)</p>
            </div>
            <div className="p-4 rounded-xl bg-background/30 border border-border/20 text-center">
              <p className="text-2xl font-bold text-emerald-400">{deadlines.filter(d => d.status === 'upcoming').length}</p>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
