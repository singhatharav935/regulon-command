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
} from "recharts";
import { Calendar, TrendingDown, Users, FileText, AlertCircle, CheckCircle } from "lucide-react";

/**
 * Income Tax Solutions - Advanced Page
 * Income Tax law tracking, amendments, and compliance guidance
 */

const incomeTaxNotifications = [
  {
    id: 1,
    title: "Crypto Asset Tax Treatment - New Guidelines",
    date: "2026-03-25",
    category: "Investment Income",
    deadline: "2026-04-15",
    impact: "Affects all crypto asset holders, traders, and validators",
    status: "critical",
  },
  {
    id: 2,
    title: "Section 115BAC Provisions Updated",
    date: "2026-03-24",
    category: "Tax Regimes",
    deadline: "2026-04-01",
    impact: "New optional tax regime rates apply from FY 2026-27",
    status: "high",
  },
  {
    id: 3,
    title: "Working from Home Deduction Enhanced",
    date: "2026-03-23",
    category: "Deductions",
    deadline: "2026-06-30",
    impact: "Increased deduction limit for WFH expenses",
    status: "medium",
  },
  {
    id: 4,
    title: "Investment in Listed Securities - Tax Benefits",
    date: "2026-03-22",
    category: "Benefits",
    deadline: "2026-12-31",
    impact: "New deduction limit under Section 80EEA",
    status: "medium",
  },
];

const filingDeadlines = [
  { return_type: "ITR-1", deadline: "July 31", status: "upcoming" },
  { return_type: "ITR-3", deadline: "September 30", status: "upcoming" },
  { return_type: "ITR-4", deadline: "September 30", status: "upcoming" },
  { return_type: "ITR-5", deadline: "September 30", status: "upcoming" },
  { return_type: "ITR-6", deadline: "September 30", status: "upcoming" },
];

const taxSavingData = [
  { section: "80C", maxLimit: 150000, claimed: 85000 },
  { section: "80D", maxLimit: 25000, claimed: 15000 },
  { section: "80E", maxLimit: 50000, claimed: 0 },
  { section: "80EEA", maxLimit: 200000, claimed: 120000 },
];

const incomeDistribution = [
  { year: "FY 2024-25", salary: 60, capital: 20, other: 20 },
  { year: "FY 2025-26", salary: 55, capital: 25, other: 20 },
  { year: "FY 2026-27", salary: 50, capital: 30, other: 20 },
];

export default function IncomeTaxSolutions() {
  const [expandedNotif, setExpandedNotif] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-16 text-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">💰</span>
            <h1 className="text-5xl font-bold">Income Tax Solutions</h1>
          </div>
          <p className="text-xl opacity-90">
            Track tax law amendments, filing deadlines, and maximize tax savings with AI guidance
          </p>
          <div className="flex gap-4 mt-8">
            <Badge className="bg-white text-emerald-600">Real-time Updates</Badge>
            <Badge className="bg-white text-emerald-600">Tax Planning</Badge>
            <Badge className="bg-white text-emerald-600">Smart Alerts</Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <Tabs defaultValue="amendments" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="amendments" className="text-white">
              Amendments
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="text-white">
              Deadlines
            </TabsTrigger>
            <TabsTrigger value="savings" className="text-white">
              Tax Savings
            </TabsTrigger>
            <TabsTrigger value="planning" className="text-white">
              Planning
            </TabsTrigger>
          </TabsList>

          {/* Amendments Tab */}
          <TabsContent value="amendments" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "New Amendments", value: "4", icon: "📄" },
                { label: "Critical Alerts", value: "2", icon: "⚠️" },
                { label: "Tax Changes", value: "8", icon: "📈" },
                { label: "Days to Act", value: "18", icon: "⏰" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-3xl mb-2">{stat.icon}</p>
                      <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-white mt-12">Latest Tax Amendments</h2>
            <div className="space-y-4">
              {incomeTaxNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 10 }}
                  onClick={() => setExpandedNotif(expandedNotif === notif.id ? null : notif.id)}
                >
                  <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-emerald-500 transition">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white">{notif.title}</CardTitle>
                          <div className="flex gap-2 mt-3">
                            <Badge variant="outline" className="text-slate-300">
                              {notif.category}
                            </Badge>
                            <Badge variant="outline" className="text-slate-300">
                              📅 {notif.date}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              notif.status === "critical"
                                ? "bg-red-600"
                                : notif.status === "high"
                                  ? "bg-orange-600"
                                  : "bg-yellow-600"
                            }
                          >
                            {notif.status.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-2">Deadline: {notif.deadline}</p>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedNotif === notif.id && (
                      <CardContent className="pt-0 border-t border-slate-700">
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="font-bold text-white mb-2">Impact:</h4>
                            <p className="text-slate-300">{notif.impact}</p>
                          </div>
                          <div>
                            <h4 className="font-bold text-white mb-2">Your Action Items:</h4>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                              <li>Review the amendment details</li>
                              <li>Calculate impact on your tax liability</li>
                              <li>Update your financial planning if needed</li>
                              <li>Document the changes for audit trail</li>
                            </ul>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              Read Full Amendment
                            </Button>
                            <Button size="sm" variant="outline" className="border-slate-600 text-white">
                              Create Planning Task
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

          {/* Deadlines Tab */}
          <TabsContent value="deadlines" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">Filing Deadlines for FY 2025-26</h2>

            <div className="space-y-4">
              {filingDeadlines.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="text-white font-bold text-lg">{item.return_type}</p>
                          <p className="text-slate-400 text-sm">Income Tax Return</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{item.deadline}</p>
                        <Badge variant="outline" className="text-slate-300 mt-2">
                          {item.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="bg-slate-800 border-slate-700 mt-8">
              <CardHeader>
                <CardTitle className="text-white">Deadline Calendar</CardTitle>
                <CardDescription className="text-slate-400">
                  Set reminders for all ITR filing deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Add Deadlines to Calendar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Savings Tab */}
          <TabsContent value="savings" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">Tax Saving Opportunities</h2>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taxSavingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="section" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="maxLimit" fill="#10b981" name="Max Limit" />
                    <Bar dataKey="claimed" fill="#3b82f6" name="Amount Claimed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taxSavingData.map((item, idx) => {
                const unclaimed = item.maxLimit - item.claimed;
                const utilization = ((item.claimed / item.maxLimit) * 100).toFixed(0);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <h3 className="text-white font-bold mb-4">Section {item.section}</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-400 text-sm">Limit Utilization</p>
                            <p className="text-2xl font-bold text-emerald-400">{utilization}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Opportunity to Save</p>
                            <p className="text-2xl font-bold text-orange-400">
                              ₹{unclaimed.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-white">Income Distribution Trend</h2>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="salary" fill="#3b82f6" name="Salary Income" stackId="a" />
                    <Bar dataKey="capital" fill="#10b981" name="Capital Gains" stackId="a" />
                    <Bar dataKey="other" fill="#f59e0b" name="Other Income" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Tax Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Increase investments under Section 80C to ₹150,000",
                  "Explore Section 80EEA benefits (home loan interest deduction)",
                  "Consider balanced fund investments for dividend income",
                  "Document all expenses for eligible deductions",
                ].map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-700 rounded">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-200">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-8 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Maximize Your Tax Savings Today</h2>
          <p className="text-lg opacity-90 mb-8">
            Get AI-powered tax planning recommendations and never miss a tax-saving opportunity.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
              Start Tax Planning
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-emerald-700">
              Download Guide
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
