import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, Zap, FileText, Download } from "lucide-react";

/**
 * GST Compliance Hub - Advanced Page
 * Real-time GST monitoring, rate tracking, and compliance management
 */

const gstNotifications = [
  {
    id: 1,
    title: "GST Rate Amendment - Electronics Category",
    date: "2026-03-25",
    priority: "high",
    impact: "Affects import duty on electronics, effective April 1",
    status: "active",
  },
  {
    id: 2,
    title: "ITC Procedure Changes - Enhanced Documentation",
    date: "2026-03-24",
    priority: "high",
    impact: "New documentary requirements for ITC claims from Q2 2026",
    status: "active",
  },
  {
    id: 3,
    title: "GSTR-1 Filing Window Extended",
    date: "2026-03-23",
    priority: "medium",
    impact: "Filing deadline extended to 13th of next month",
    status: "active",
  },
  {
    id: 4,
    title: "E-Invoice Mandatory for Supply Chain",
    date: "2026-03-22",
    priority: "high",
    impact: "E-invoice mandatory for B2B transactions above threshold",
    status: "active",
  },
];

const gstRateData = [
  { category: "Essentials", rate: 5, count: 45 },
  { category: "Standard", rate: 12, count: 120 },
  { category: "Luxury", rate: 28, count: 85 },
  { category: "Exempted", rate: 0, count: 200 },
];

const complianceTrend = [
  { month: "Jan", compliance: 85, alerts: 12 },
  { month: "Feb", compliance: 88, alerts: 8 },
  { month: "Mar", compliance: 92, alerts: 6 },
  { month: "Apr", compliance: 89, alerts: 9 },
  { month: "May", compliance: 94, alerts: 4 },
  { month: "Jun", compliance: 96, alerts: 2 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function GSTComplianceHub() {
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-16 text-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🏛️</span>
            <h1 className="text-5xl font-bold">GST Compliance Hub</h1>
          </div>
          <p className="text-xl opacity-90">
            Real-time GST notification tracking, rate monitoring, and automated compliance management
          </p>
          <div className="flex gap-4 mt-8">
            <Badge className="bg-white text-blue-600">Live Monitoring</Badge>
            <Badge className="bg-white text-blue-600">Real-time Alerts</Badge>
            <Badge className="bg-white text-blue-600">AI Analysis</Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="notifications" className="text-white">
              Live Notifications
            </TabsTrigger>
            <TabsTrigger value="rates" className="text-white">
              Rate Monitor
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-white">
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Live Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Active Alerts", value: "4", color: "text-red-400" },
                { label: "High Priority", value: "2", color: "text-orange-400" },
                { label: "Pending Actions", value: "3", color: "text-yellow-400" },
                { label: "Compliant Status", value: "94%", color: "text-green-400" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-white mt-12">Latest GST Notifications</h2>
            <div className="space-y-4">
              {gstNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 10 }}
                  onClick={() => setSelectedNotification(selectedNotification === notif.id ? null : notif.id)}
                >
                  <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-blue-500 transition">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            {notif.title}
                          </CardTitle>
                          <CardDescription className="text-slate-400 mt-2">{notif.impact}</CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={notif.priority === "high" ? "destructive" : "secondary"}
                            className="mb-2"
                          >
                            {notif.priority.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-slate-500">{notif.date}</p>
                        </div>
                      </div>
                    </CardHeader>

                    {selectedNotification === notif.id && (
                      <CardContent className="pt-0 border-t border-slate-700">
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="font-bold text-white mb-2">Key Changes:</h4>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                              <li>Applicable to registered GST dealers</li>
                              <li>Mandatory implementation from effective date</li>
                              <li>Update your billing systems and procedures</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-white mb-2">Action Required:</h4>
                            <p className="text-slate-300">
                              Review your current GST procedures and update them to comply with this notification.
                            </p>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              View Full Notice
                            </Button>
                            <Button size="sm" variant="outline" className="border-slate-600 text-white">
                              Create Task
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Rate Monitor Tab */}
          <TabsContent value="rates" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">GST Rate Distribution</h2>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gstRateData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {gstRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} items`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gstRateData.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <h3 className="text-white font-bold mb-2">{item.category}</h3>
                      <p className="text-3xl font-bold text-blue-400">{item.rate}%</p>
                      <p className="text-sm text-slate-400 mt-2">{item.count} items</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">Compliance Trend Analysis</h2>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">Compliance Checklist</h2>

            {[
              {
                item: "GST Registration Current",
                status: true,
                dueDate: "Ongoing",
              },
              {
                item: "GSTR-1 Filing",
                status: true,
                dueDate: "13th of next month",
              },
              {
                item: "GSTR-3B Filing",
                status: true,
                dueDate: "20th of next month",
              },
              {
                item: "Annual Return Filing",
                status: false,
                dueDate: "December 31, 2026",
              },
              {
                item: "ITC Documentation",
                status: true,
                dueDate: "Ongoing",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        {item.status ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                        )}
                        {item.item}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">Due: {item.dueDate}</p>
                    </div>
                    <Badge variant={item.status ? "secondary" : "destructive"}>
                      {item.status ? "✓ Done" : "⚠ Pending"}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-8 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Never Miss a GST Update Again</h2>
          <p className="text-lg opacity-90 mb-8">
            Get real-time alerts for all GST notifications, rate changes, and compliance deadlines.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Monitoring
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
              View Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
