import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { StatutoryDeadline } from '@/services/ca-supabase-service';
import { getStatutoryDeadlines, getLiveRegulatoryNews } from '@/services/ca-supabase-service';
import { useFirmClients, useFirmMembers, useFirmInvoices } from '@/hooks/personas/useCAFirmData';
import {
  Building2, Users, IndianRupee, AlertTriangle, Clock,
  CheckCircle2, TrendingUp, ExternalLink, Newspaper, ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface KPI { label: string; value: string | number; sub: string; icon: any; color: string; }
interface FirmPulseHomeProps {
  firmId: string;
  kpis: KPI[];
  colorMap: Record<string, string>;
  urgent: StatutoryDeadline[];
}

export default function FirmPulseHome({ firmId, kpis, colorMap, urgent }: FirmPulseHomeProps) {
  const { data: invoices } = useFirmInvoices(firmId);
  const { data: clients } = useFirmClients(firmId);
  const { data: members } = useFirmMembers(firmId);
  const deadlines = useMemo(() => getStatutoryDeadlines(), []);
  const news = useMemo(() => getLiveRegulatoryNews().slice(0, 4), []);

  const paid = useMemo(() => (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);
  const overdue = useMemo(() => (invoices || []).filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);

  const impactColor: Record<string, string> = {
    high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const grad = colorMap[k.color] || colorMap['slate'];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="relative bg-[#0f0f1e] border border-white/[0.06] rounded-2xl p-5 overflow-hidden"
            >
              {/* Glow accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${grad}`} />
              <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${grad} shadow-lg mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{k.value}</p>
              <p className="text-sm text-slate-400 mt-0.5">{k.label}</p>
              <p className="text-xs text-slate-600 mt-1">{k.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Middle: Deadlines + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Statutory Deadlines */}
        <div className="lg:col-span-2 bg-[#0f0f1e] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Statutory Deadlines</h3>
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
              {deadlines.length} Total
            </Badge>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
            {deadlines.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    d.status === 'overdue' ? 'bg-rose-500' :
                    d.status === 'urgent' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.regulator} · Due {d.deadline}</p>
                  </div>
                </div>
                <Badge className={`shrink-0 ml-3 border text-[10px] font-semibold ${
                  d.status === 'overdue' ? 'bg-rose-600 text-white border-0' :
                  d.status === 'urgent' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-slate-700/50 text-slate-400 border-slate-700'
                }`}>
                  {d.status === 'overdue' ? 'OVERDUE' : `${d.daysRemaining}d`}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Revenue Snapshot */}
        <div className="space-y-4">
          <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Revenue Snapshot</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Collected</span>
                <span className="text-base font-bold text-emerald-400">₹{(paid/100000).toFixed(2)}L</span>
              </div>
              <div className="h-px bg-white/[0.04]" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Overdue</span>
                <span className="text-base font-bold text-rose-400">₹{(overdue/100000).toFixed(2)}L</span>
              </div>
              <div className="h-px bg-white/[0.04]" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Invoices Raised</span>
                <span className="text-sm font-semibold text-white">{(invoices || []).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Paid</span>
                <span className="text-sm font-semibold text-emerald-400">{(invoices || []).filter(i => i.status === 'paid').length}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Firm Capacity</h3>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Members</span>
                  <span className="text-white">{(members || []).length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, (members || []).length * 10)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Clients / Member</span>
                  <span className="text-white">{(members || []).length > 0 ? ((clients || []).length / (members || []).length).toFixed(1) : 0}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ((clients || []).length / Math.max(1, (members || []).length)) * 10)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory News */}
      <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
          <Newspaper className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Live Regulatory News</h3>
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px] ml-1">LIVE</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
          {news.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-slate-200 leading-snug">{n.title}</p>
                <Badge className={`shrink-0 border text-[9px] ${impactColor[n.impact]}`}>
                  {n.impact.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{n.summary}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-600 font-medium">{n.source}</span>
                <span className="text-[10px] text-slate-700">·</span>
                <span className="text-[10px] text-slate-600">{n.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
