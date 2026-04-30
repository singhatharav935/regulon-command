import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Zap,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Target,
  Layers,
  Shield,
} from "lucide-react";

/**
 * Advanced Platform Dashboard
 * Complete overview of SANNIDH platform capabilities and performance
 */

const complianceScoreTrend = [
  { week: "Week 1", score: 72, alerts: 8 },
  { week: "Week 2", score: 78, alerts: 6 },
  { week: "Week 3", score: 85, alerts: 4 },
  { week: "Week 4", score: 92, alerts: 2 },
  { week: "Week 5", score: 95, alerts: 1 },
];

const sourceMonitoring = [
  { source: "GSTN", status: "active", notices: 15, lastSync: "2 min ago" },
  { source: "RBI", status: "active", notices: 10, lastSync: "3 min ago" },
  { source: "Income Tax", status: "active", notices: 6, lastSync: "5 min ago" },
  { source: "MCA", status: "active", notices: 6, lastSync: "4 min ago" },
  { source: "SEBI", status: "active", notices: 15, lastSync: "6 min ago" },
  { source: "CBIC", status: "active", notices: 8, lastSync: "3 min ago" },
  { source: "eGazette", status: "monitoring", notices: 6, lastSync: "7 min ago" },
];

const taskCompletion = [
  { category: "GST Compliance", completed: 12, pending: 3 },
  { category: "Income Tax", completed: 8, pending: 2 },
  { category: "Company Law", completed: 10, pending: 4 },
  { category: "Audit Prep", completed: 15, pending: 2 },
  { category: "Other", completed: 5, pending: 1 },
];

const userActivity = [
  { day: "Mon", logins: 45, actions: 230 },
  { day: "Tue", logins: 52, actions: 280 },
  { day: "Wed", logins: 48, actions: 265 },
  { day: "Thu", logins: 61, actions: 320 },
  { day: "Fri", logins: 55, actions: 290 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdvancedPlatformDashboard() {
  const [selectedView, setSelectedView] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-16"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">SANNIDH Platform Dashboard</h1>
          <p className="text-xl text-slate-300">
            Advanced regulatory compliance intelligence platform with real-time monitoring and AI-powered insights
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Badge className="bg-green-600 text-white">🟢 All Systems Operational</Badge>
            <Badge className="bg-blue-600 text-white">📊 Real-time Analytics</Badge>
            <Badge className="bg-purple-600 text-white">🤖 AI-Powered</Badge>
            <Badge className="bg-orange-600 text-white">🔒 Enterprise Security</Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: <Users className="w-8 h-8" />,
              label: "Active Users",
              value: "1,245",
              change: "+12%",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: <AlertCircle className="w-8 h-8" />,
              label: "Live Alerts",
              value: "66+",
              change: "Real-time",
              color: "from-orange-500 to-red-500",
            },
            {
              icon: <CheckCircle className="w-8 h-8" />,
              label: "Compliance Score",
              value: "94%",
              change: "+8%",
              color: "from-emerald-500 to-teal-500",
            },
            {
              icon: <BarChart3 className="w-8 h-8" />,
              label: "Tasks Completed",
              value: "2,847",
              change: "+15%",
              color: "from-violet-500 to-purple-500",
            },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${metric.color} border-0 text-white`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="opacity-80">{metric.icon}</div>
                    <Badge className="bg-white bg-opacity-20 text-white">{metric.change}</Badge>
                  </div>
                  <p className="text-sm opacity-90 mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold">{metric.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Compliance Score Trend */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white">Compliance Score Trend</CardTitle>
                <CardDescription className="text-slate-400">
                  Weekly compliance score with alert count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="week" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Compliance Score" />
                    <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} name="Alert Count" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Task Completion by Category */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white">Task Completion Status</CardTitle>
                <CardDescription className="text-slate-400">By compliance category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskCompletion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="category" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Source Monitoring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-slate-800 border-slate-700 mb-12">
            <CardHeader>
              <CardTitle className="text-white">Regulatory Source Monitoring</CardTitle>
              <CardDescription className="text-slate-400">
                Real-time status of all 7 government source monitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sourceMonitoring.map((source, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white">{source.source}</h3>
                        <Badge
                          className={
                            source.status === "active" ? "bg-green-600 text-white" : "bg-yellow-600 text-white"
                          }
                        >
                          {source.status === "active" ? "🟢 Active" : "🟡 Monitoring"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-slate-400 text-xs">Notices Available</p>
                          <p className="text-2xl font-bold text-blue-400">{source.notices}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Last Synced</p>
                          <p className="text-sm text-slate-300">{source.lastSync}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-slate-800 border-slate-700 mb-12">
            <CardHeader>
              <CardTitle className="text-white">User Activity Metrics</CardTitle>
              <CardDescription className="text-slate-400">Weekly login and action statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Daily Logins"
                  />
                  <Line type="monotone" dataKey="actions" stroke="#10b981" strokeWidth={2} name="Total Actions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-3xl font-bold text-white mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                title: "Real-time Monitoring",
                description: "Monitor 7 government sources simultaneously with live alerts and notifications",
              },
              {
                icon: <Target className="w-8 h-8 text-red-400" />,
                title: "Smart Targeting",
                description: "AI-powered filtering shows only alerts relevant to your business and clients",
              },
              {
                icon: <Layers className="w-8 h-8 text-blue-400" />,
                title: "Multi-Layer Analysis",
                description: "Analyze regulatory changes across domains with cross-domain impact assessment",
              },
              {
                icon: <Shield className="w-8 h_8 text-green-400" />,
                title: "Risk Management",
                description: "Identify compliance gaps and manage risks with automated task assignment",
              },
              {
                icon: <FileText className="w-8 h-8 text-purple-400" />,
                title: "Document Automation",
                description: "Auto-generate compliance documents and reports with AI assistance",
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
                title: "Advanced Analytics",
                description: "Track compliance trends and generate actionable insights with dashboards",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-800 border-slate-700 h-full hover:border-slate-500 transition">
                  <CardContent className="pt-6">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-slate-800 border-slate-700 mb-12">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Uptime (30 days)</p>
                  <p className="text-3xl font-bold text-green-400">99.99%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Response Time (avg)</p>
                  <p className="text-3xl font-bold text-blue-400">145ms</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Data Centers</p>
                  <p className="text-3xl font-bold text-purple-400">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-12 text-center border border-slate-700"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Transform Your Compliance Operations</h2>
          <p className="text-lg text-slate-300 mb-8">
            Join leading CAs and organizations managing compliance intelligently with SANNIDH
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              Start 14-day Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
              Request Demo
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
