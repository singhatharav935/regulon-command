import { motion } from "framer-motion";
import { TrendingUp, Users, AlertTriangle, ShieldCheck, DollarSign, Clock, RefreshCw, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirmMembers, useFirmClients, useFirmInvoices } from "@/hooks/personas/useCAFirmData";
import { getStatutoryDeadlines } from "@/services/ca-supabase-service";
import { useMemo } from "react";

interface FirmOverviewPulseProps {
  firmId: string;
}

export default function FirmOverviewPulse({ firmId }: FirmOverviewPulseProps) {
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useFirmMembers(firmId);
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useFirmClients(firmId);
  const { data: invoices, isLoading: invoicesLoading } = useFirmInvoices(firmId);

  const isLoading = membersLoading || clientsLoading || invoicesLoading;

  const deadlines = useMemo(() => getStatutoryDeadlines(), []);
  const urgentDeadlines = deadlines.filter(d => d.status === 'urgent' || d.status === 'overdue');

  const totalRevenue = useMemo(() => {
    return (invoices || [])
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices]);

  const pendingRevenue = useMemo(() => {
    return (invoices || [])
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices]);

  const activeMembers = (members || []).filter(m => m.status === 'active').length;
  const totalClients = (clients || []).length;
  const activeClients = (clients || []).filter(c => c.status === 'active').length;

  const handleRefresh = () => {
    refetchMembers();
    refetchClients();
  };

  const stats = [
    {
      label: "Total Active Clients",
      value: isLoading ? "—" : String(totalClients),
      sub: `${activeClients} active`,
      trendUp: true,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/20",
    },
    {
      label: "Revenue Collected (All Time)",
      value: isLoading ? "—" : `₹${(totalRevenue / 100000).toFixed(1)}L`,
      sub: `₹${(pendingRevenue / 100000).toFixed(1)}L pending`,
      trendUp: totalRevenue > 0,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/20",
    },
    {
      label: "Critical Deadlines",
      value: isLoading ? "—" : String(urgentDeadlines.length),
      sub: "Next 7 days",
      trendUp: false,
      icon: Clock,
      color: urgentDeadlines.length > 0 ? "text-rose-400" : "text-slate-400",
      bg: urgentDeadlines.length > 0 ? "bg-rose-500/20" : "bg-slate-500/20",
      border: urgentDeadlines.length > 0 ? "border-rose-500/20" : "border-slate-500/20",
    },
    {
      label: "Active Team Members",
      value: isLoading ? "—" : String(activeMembers),
      sub: `${(members || []).length} total`,
      trendUp: true,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/20",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Firm Overview Pulse</h2>
          <p className="text-sm text-slate-400 mt-1">Live macro-level view of your entire CA practice.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className={`bg-slate-800/50 border-gray-700/50 hover:bg-slate-800 transition-all h-full`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${stat.bg} border ${stat.border}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    {stat.trendUp ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400 opacity-70" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 opacity-70" />
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {isLoading ? (
                        <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
                      ) : stat.value}
                    </p>
                    <p className="text-sm font-medium text-slate-400 mt-1">{stat.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming Deadlines Preview */}
      {urgentDeadlines.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-rose-500/5 border-rose-500/20">
            <CardContent className="p-5">
              <h3 className="text-base font-semibold text-rose-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Urgent Statutory Deadlines — Action Required
              </h3>
              <div className="space-y-2">
                {urgentDeadlines.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-rose-500/10 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{d.title}</p>
                      <p className="text-xs text-slate-400">{d.regulator} · Due: {d.deadline}</p>
                    </div>
                    <Badge className={d.status === 'overdue' ? 'bg-rose-600 text-white border-0' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                      {d.status === 'overdue' ? 'OVERDUE' : `${d.daysRemaining}d left`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick firm health summary when data loaded */}
      {!isLoading && totalClients === 0 && (members || []).length === 0 && (
        <Card className="bg-slate-800/30 border-dashed border-slate-700/50">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Your firm dashboard is ready!</p>
            <p className="text-slate-500 text-sm mt-1">
              Start by adding team members in <strong>Resource Allocation</strong>, then add your clients in <strong>Client Management</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
