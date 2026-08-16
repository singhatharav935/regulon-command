import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Bell,
  Target,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  useCompanyKPIs,
  useComplianceScore,
  useRiskAssessment,
  useDeadlineAlerts,
  useNotifications,
  useTrendData,
  useDashboardSummary,
  useMarkNotificationRead,
} from "@/hooks/personas/useOwnerData";
import { usePersonaAuth } from "@/lib/persona-auth-context";

// KPI Dashboard Component
function KPIDashboard({ kpis, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-700/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="w-5 h-5" /> Key Performance Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis?.slice(0, 6).map((kpi) => {
            const progress = (kpi.metric_value / kpi.target_value) * 100;
            const isOnTrack = progress >= 80;

            return (
              <div
                key={kpi.id}
                className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      {kpi.category}
                    </p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {kpi.metric_name}
                    </p>
                  </div>
                  {isOnTrack ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {kpi.metric_value.toFixed(1)} {kpi.unit}
                    </span>
                    <span className="text-slate-500">
                      Target: {kpi.target_value}
                    </span>
                  </div>

                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOnTrack ? "bg-green-500" : "bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-400">
                    {progress.toFixed(0)}% of target
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!kpis?.length && (
          <div className="text-center py-8 text-slate-400">
            No KPI data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compliance Score Component
function ComplianceScore({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Compliance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-slate-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Compliance Score</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-slate-400">
          No compliance data available
        </CardContent>
      </Card>
    );
  }

  const scorePercentage = (data.score / data.max_score) * 100;
  const scoreStatus =
    scorePercentage >= 80
      ? { color: "text-green-400", bg: "bg-green-400", label: "Excellent" }
      : scorePercentage >= 60
      ? { color: "text-amber-400", bg: "bg-amber-400", label: "Good" }
      : { color: "text-red-400", bg: "bg-red-400", label: "At Risk" };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Compliance Score</CardTitle>
          {data.trend > 0 ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="text-center space-y-3">
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-700"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(scorePercentage / 100) * 339.29} 339.29`}
                className={scoreStatus.color}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreStatus.color}`}>
                {data.score}
              </span>
              <span className="text-xs text-slate-400">
                /{data.max_score}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className={`text-sm font-semibold ${scoreStatus.color}`}>
              {scoreStatus.label}
            </p>
            <p className="text-xs text-slate-400">
              {data.trend > 0 ? "↑" : "↓"} {Math.abs(data.trend).toFixed(1)} points
              trend
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Score Breakdown
          </p>
          {Object.entries(data.breakdown || {}).map(([key, value]: [string, number]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400 capitalize">
                  {key.replace("_", " ")}
                </span>
                <span className="text-sm font-semibold text-white">
                  {value}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Risk Heat Map Component
function RiskHeatMap({ risks, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Risk Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const riskData = risks?.map((risk) => ({
    id: risk.id,
    name: risk.risk_area,
    impact: risk.impact_score,
    probability: risk.probability_score,
    level: risk.risk_level,
  })) || [];

  const colorMap = {
    critical: "text-red-400",
    high: "text-orange-400",
    medium: "text-amber-400",
    low: "text-green-400",
  };

  const colorBg = {
    critical: "bg-red-400/20 border-red-400/50",
    high: "bg-orange-400/20 border-orange-400/50",
    medium: "bg-amber-400/20 border-amber-400/50",
    low: "bg-green-400/20 border-green-400/50",
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5" /> Risk Assessment Heat Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskData.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="probability"
                    type="number"
                    label={{ value: "Probability", offset: 10, fill: "#cbd5e1" }}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis
                    dataKey="impact"
                    type="number"
                    label={{ value: "Impact", angle: -90, position: "insideLeft", fill: "#cbd5e1" }}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Scatter name="Risks" data={riskData} fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-700">
              {riskData.map((risk) => (
                <div
                  key={risk.id}
                  className={`p-3 rounded-lg border ${colorBg[risk.level]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {risk.name}
                      </p>
                      <p className={`text-xs mt-1 ${colorMap[risk.level]}`}>
                        {risk.level.toUpperCase()}
                      </p>
                    </div>
                    <Badge className={colorMap[risk.level]}>
                      {risk.probability.toFixed(0)}% × {risk.impact.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No risk data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Deadline Alerts Component
function DeadlineAlerts({ deadlines, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityColors = {
    critical: "border-l-4 border-red-500 bg-red-400/10",
    high: "border-l-4 border-orange-500 bg-orange-400/10",
    medium: "border-l-4 border-amber-500 bg-amber-400/10",
    low: "border-l-4 border-blue-500 bg-blue-400/10",
  };

  const priorityIcons = {
    critical: <AlertTriangle className="w-4 h-4 text-red-400" />,
    high: <AlertCircle className="w-4 h-4 text-orange-400" />,
    medium: <Clock className="w-4 h-4 text-amber-400" />,
    low: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5" /> Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deadlines?.length > 0 ? (
            deadlines.slice(0, 5).map((deadline) => {
              const daysLeft = Math.ceil(
                (new Date(deadline.deadline_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysLeft < 0;

              return (
                <div
                  key={deadline.id}
                  className={`p-3 rounded-lg ${priorityColors[deadline.priority]}`}
                >
                  <div className="flex items-center gap-3">
                    {priorityIcons[deadline.priority]}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {deadline.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(deadline.deadline_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {isOverdue ? (
                          <span className="text-red-400">
                            {Math.abs(daysLeft)} days overdue
                          </span>
                        ) : (
                          <span className="text-slate-300">
                            {daysLeft} days left
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400">
              No upcoming deadlines
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Notification Center Component
function NotificationCenter({ notifications, isLoading, onMarkRead }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Notification Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-700/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const typeStyles = {
    alert: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
    success: "text-green-400",
  };

  const typeBg = {
    alert: "bg-red-400/10 border-red-400/30",
    warning: "bg-amber-400/10 border-amber-400/30",
    info: "bg-blue-400/10 border-blue-400/30",
    success: "bg-green-400/10 border-green-400/30",
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5" /> Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications?.length > 0 ? (
            notifications.slice(0, 8).map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border ${typeBg[notif.type]} cursor-pointer transition-all hover:border-opacity-100`}
                onClick={() => {
                  if (!notif.read) {
                    onMarkRead(notif.id);
                  }
                  setExpandedId(expandedId === notif.id ? null : notif.id);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      )}
                      {notif.action_required && (
                        <Zap className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    {expandedId === notif.id && (
                      <p className="text-xs text-slate-400 mt-2">
                        {notif.message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notif.read) {
                        onMarkRead(notif.id);
                      }
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    {notif.read ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400">
              No notifications
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Trend Chart Component
function TrendChart({ trendData, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">30-Day Compliance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5" /> 30-Day Compliance Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trendData?.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                <Line
                  type="monotone"
                  dataKey="compliance_score"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                  name="Compliance Score"
                />
                <Line
                  type="monotone"
                  dataKey="kpi_average"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                  name="KPI Average"
                />
                <Line
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  name="Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Executive Summary Component
function ExecutiveSummary({ summary, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 bg-slate-700/50 rounded animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const metrics = [
    {
      label: "Compliance Score",
      value: summary.compliance_score,
      unit: "%",
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Active KPIs",
      value: summary.total_kpis,
      unit: "",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "High Risk Items",
      value: summary.high_risk_items,
      unit: "",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Overdue Deadlines",
      value: summary.overdue_deadlines,
      unit: "",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Unread Notifications",
      value: summary.unread_notifications,
      unit: "",
      icon: Bell,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Critical Actions",
      value: summary.critical_actions,
      unit: "",
      icon: Zap,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
    >
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-lg border border-slate-700 ${metric.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {metric.label}
              </p>
              <Icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <p className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
              <span className="text-sm text-slate-400 ml-1">{metric.unit}</span>
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Action Required Component
function ActionRequired({ deadlines, notifications, risks, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Action Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-slate-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const actions = [];

  deadlines?.forEach((d) => {
    if (d.status === "overdue") {
      actions.push({
        id: d.id,
        title: d.description,
        type: "overdue_deadline",
        priority: "critical",
        message: `Overdue by ${Math.ceil((Date.now() - new Date(d.deadline_date).getTime()) / (1000 * 60 * 60 * 24))} days`,
      });
    }
  });

  notifications?.forEach((n) => {
    if (n.action_required && !n.read) {
      actions.push({
        id: n.id,
        title: n.title,
        type: "notification",
        priority: n.type === "alert" ? "critical" : "high",
        message: n.message,
      });
    }
  });

  risks?.forEach((r) => {
    if (r.risk_level === "critical") {
      actions.push({
        id: r.id,
        title: r.risk_area,
        type: "critical_risk",
        priority: "critical",
        message: `Risk Score: ${(r.impact_score * r.probability_score).toFixed(0)}%`,
      });
    }
  });

  const sortedActions = actions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="border-red-700/50 bg-red-400/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-400">
          <Zap className="w-5 h-5" /> Action Required ({actions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedActions.length > 0 ? (
          <div className="space-y-2">
            {sortedActions.slice(0, 5).map((action) => (
              <Alert
                key={action.id}
                className="bg-red-400/10 border-red-400/50 text-red-400"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold text-sm">{action.title}</p>
                  <p className="text-xs text-red-300/70">{action.message}</p>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400">
            No action required
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Dashboard Component
export function OwnerDashboardFull() {
  const { currentUser } = usePersonaAuth();
  const companyId = currentUser?.companyId;

  const { data: kpis, isLoading: kpisLoading } = useCompanyKPIs(companyId);
  const { data: compliance, isLoading: complianceLoading } =
    useComplianceScore(companyId);
  const { data: risks, isLoading: risksLoading } = useRiskAssessment(companyId);
  const { data: deadlines, isLoading: deadlinesLoading } =
    useDeadlineAlerts(companyId);
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications(companyId);
  const { data: trends, isLoading: trendsLoading } = useTrendData(companyId);
  const { data: summary } = useDashboardSummary(companyId);
  const markNotificationRead = useMarkNotificationRead();

  const isLoading =
    kpisLoading ||
    complianceLoading ||
    risksLoading ||
    deadlinesLoading ||
    notificationsLoading ||
    trendsLoading;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Executive Dashboard
              </h1>
              <p className="text-slate-400 mt-1">
                {currentUser.companyName} • Compliance & Risk Overview
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-slate-300 border-slate-600">
                <Download className="w-4 h-4 mr-2" /> Export Report
              </Button>
              <Button variant="outline" className="text-slate-300 border-slate-600">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <ExecutiveSummary summary={summary} isLoading={isLoading} />
        </div>

        {/* Critical Alerts */}
        {(deadlines?.some((d) => d.status === "overdue") ||
          summary?.critical_actions > 0) && (
          <ActionRequired
            deadlines={deadlines}
            notifications={notifications}
            risks={risks}
            isLoading={isLoading}
          />
        )}

        {/* Main Content - Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ComplianceScore data={compliance} isLoading={complianceLoading} />
              <DeadlineAlerts
                deadlines={deadlines}
                isLoading={deadlinesLoading}
              />
            </div>

            <KPIDashboard kpis={kpis} isLoading={kpisLoading} />

            <TrendChart trendData={trends} isLoading={trendsLoading} />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <ComplianceScore data={compliance} isLoading={complianceLoading} />
            <TrendChart trendData={trends} isLoading={trendsLoading} />
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-6">
            <RiskHeatMap risks={risks} isLoading={risksLoading} />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DeadlineAlerts
                deadlines={deadlines}
                isLoading={deadlinesLoading}
              />
              <NotificationCenter
                notifications={notifications}
                isLoading={notificationsLoading}
                onMarkRead={(id) => markNotificationRead.mutate(id)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
