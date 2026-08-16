import { motion } from "framer-motion";
import {
  FileText, Scale, Bell, ShieldAlert, Clock, TrendingUp, CheckCircle,
  AlertCircle, ArrowUpRight, Inbox,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  LawyerReviewRequest, LawyerContract, LawyerCase, LawyerNotice, LawyerRisk,
} from "@/hooks/useInhouseLawyerData";

interface KPICardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<any>;
  color: string;
  glow: string;
  trend?: string;
}

const KPICard = ({ label, value, sub, icon: Icon, color, glow, trend }: KPICardProps) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="relative overflow-hidden border-0" style={{ background: "#0D1425" }}>
      <div className={`absolute inset-0 opacity-5 ${glow}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-slate-400 text-sm">{label}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

interface LawyerDashboardHomeProps {
  reviews: LawyerReviewRequest[];
  contracts: LawyerContract[];
  cases: LawyerCase[];
  notices: LawyerNotice[];
  risks: LawyerRisk[];
}

export default function LawyerDashboardHome({
  reviews, contracts, cases, notices, risks,
}: LawyerDashboardHomeProps) {
  const pendingReviews = reviews.filter(r => r.review_status === "pending").length;
  const activeContracts = contracts.filter(c => c.status === "active").length;
  const ongoingCases = cases.filter(c => c.status === "ongoing").length;
  const pendingNotices = notices.filter(n => n.status === "pending").length;
  const highRisks = risks.filter(r => r.probability === "high" || r.impact === "high").length;

  // Upcoming deadlines
  const upcomingDeadlines = [
    ...notices
      .filter(n => n.response_due_date && n.status === "pending")
      .map(n => ({
        label: n.subject,
        type: "Notice",
        days: daysUntil(n.response_due_date),
        color: "text-amber-400",
      })),
    ...contracts
      .filter(c => c.end_date && c.status === "active")
      .map(c => ({
        label: c.title,
        type: "Contract Expiry",
        days: daysUntil(c.end_date),
        color: "text-blue-400",
      })),
    ...cases
      .filter(c => c.next_hearing && c.status === "ongoing")
      .map(c => ({
        label: c.case_title,
        type: "Court Hearing",
        days: daysUntil(c.next_hearing),
        color: "text-indigo-400",
      })),
  ]
    .filter(d => d.days !== null && d.days >= 0 && d.days <= 30)
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
    .slice(0, 6);

  // Recent reviews
  const recentActivity = reviews.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Pending CA Reviews"
          value={pendingReviews}
          sub="awaiting your review"
          icon={Inbox}
          color="bg-indigo-500/15 text-indigo-400"
          glow="bg-indigo-500"
          trend={pendingReviews > 0 ? "Action needed" : undefined}
        />
        <KPICard
          label="Active Contracts"
          value={activeContracts}
          sub={`${contracts.length} total`}
          icon={FileText}
          color="bg-blue-500/15 text-blue-400"
          glow="bg-blue-500"
        />
        <KPICard
          label="Ongoing Cases"
          value={ongoingCases}
          sub={`${cases.length} total cases`}
          icon={Scale}
          color="bg-purple-500/15 text-purple-400"
          glow="bg-purple-500"
        />
        <KPICard
          label="High Risk Items"
          value={highRisks}
          sub={`${risks.length} risks tracked`}
          icon={ShieldAlert}
          color="bg-red-500/15 text-red-400"
          glow="bg-red-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="border-0" style={{ background: "#0D1425" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-semibold text-sm">Upcoming Deadlines</h3>
              <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                Next 30 Days
              </Badge>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-400/40 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">All clear — no upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{d.label}</p>
                      <p className="text-slate-500 text-xs">{d.type}</p>
                    </div>
                    <Badge
                      className={`shrink-0 ml-3 border text-xs ${
                        (d.days ?? 99) <= 3
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : (d.days ?? 99) <= 7
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-slate-700 text-slate-400 border-slate-600"
                      }`}
                    >
                      {d.days === 0 ? "Today" : `${d.days}d`}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Draft Activity */}
        <Card className="border-0" style={{ background: "#0D1425" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-semibold text-sm">Recent Draft Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-500/40 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No draft review activity yet</p>
                <p className="text-slate-600 text-xs mt-1">In-house CAs will send drafts here for review</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {r.draft?.document_type?.replace(/-/g, " ") || "Document"}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge
                      className={`shrink-0 ml-3 border text-xs ${
                        r.review_status === "approved"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : r.review_status === "rejected"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : r.review_status === "pending"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-slate-700 text-slate-300 border-slate-600"
                      }`}
                    >
                      {r.review_status.replace(/_/g, " ")}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
