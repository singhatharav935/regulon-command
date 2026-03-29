import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CheckCircle, TrendingUp, Users, Clock, Shield, Zap } from "lucide-react";

/**
 * Advanced Solutions Page
 * Industry-specific compliance solutions and case studies
 */

const solutions = [
  {
    id: "financial-services",
    name: "Financial Services",
    icon: "🏦",
    description: "Complete compliance for banks, insurance, and fintech companies",
    color: "from-blue-500 to-cyan-500",
    benefits: [
      "Real-time regulatory monitoring",
      "Automated compliance reporting",
      "Risk assessment & mitigation",
      "Audit trail management",
    ],
    stats: { clients: 350, uptime: "99.99%", alerts: "1000+/day" },
  },
  {
    id: "legal-firms",
    name: "Legal Firms",
    icon: "⚖️",
    description: "Regulatory intelligence for law firms and legal departments",
    color: "from-violet-500 to-purple-500",
    benefits: [
      "Policy monitoring & updates",
      "Case law tracking",
      "Compliance briefings",
      "Legal risk assessment",
    ],
    stats: { clients: 180, uptime: "99.99%", alerts: "800+/day" },
  },
  {
    id: "corporate-compliance",
    name: "Corporate Compliance",
    icon: "🏢",
    description: "Enterprise compliance solution for large organizations",
    color: "from-emerald-500 to-teal-500",
    benefits: [
      "Multi-entity monitoring",
      "Centralized control",
      "Team collaboration",
      "Advanced analytics",
    ],
    stats: { clients: 200, uptime: "99.99%", alerts: "1500+/day" },
  },
  {
    id: "ca-firms",
    name: "CA & Tax Firms",
    icon: "💼",
    description: "Dedicated solution for Chartered Accountants and tax professionals",
    color: "from-orange-500 to-red-500",
    benefits: [
      "Tax compliance automation",
      "Client portfolio management",
      "Deadline reminders",
      "Compliance checklists",
    ],
    stats: { clients: 500, uptime: "99.99%", alerts: "2000+/day" },
  },
];

const caseStudies = [
  {
    company: "Fortune 500 Bank",
    challenge: "Manual compliance monitoring across 50 entities",
    solution: "Centralized REGULON platform with AI analysis",
    result: "85% reduction in compliance time, 100% deadline accuracy",
    metrics: { timeSaved: "500 hrs/month", accuracy: "100%", roi: "3.2x" },
  },
  {
    company: "Top 10 Law Firm",
    challenge: "Complex regulatory tracking across multiple domains",
    solution: "Real-time monitoring with smart alerts",
    result: "60% faster compliance response, zero missed deadlines",
    metrics: { timeSaved: "300 hrs/month", accuracy: "99.9%", roi: "2.8x" },
  },
  {
    company: "CA Network (50+ firms)",
    challenge: "Managing compliance for 5000+ clients",
    solution: "Automated task generation and tracking",
    result: "Improved client satisfaction by 45%, 3x more clients per CA",
    metrics: { timeSaved: "2000 hrs/month", accuracy: "99.8%", roi: "4.5x" },
  },
];

const adoptionData = [
  { month: "Jan", adoption: 15, satisfaction: 72 },
  { month: "Feb", adoption: 28, satisfaction: 81 },
  { month: "Mar", adoption: 42, satisfaction: 88 },
  { month: "Apr", adoption: 58, satisfaction: 92 },
  { month: "May", adoption: 71, satisfaction: 94 },
  { month: "Jun", adoption: 85, satisfaction: 96 },
];

export default function AdvancedSolutionsPage() {
  const [selectedSolution, setSelectedSolution] = useState("financial-services");
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(0);

  const currentSolution = solutions.find(s => s.id === selectedSolution);
  const currentCaseStudy = caseStudies[selectedCaseStudy];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6">Industry-Specific Solutions</h1>
          <p className="text-xl text-slate-300 max-w-3xl mb-8">
            Purpose-built compliance solutions for different industries. Choose your solution and transform your
            compliance operations.
          </p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Solution Selector */}
        <h2 className="text-3xl font-bold text-white mb-8">Choose Your Solution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {solutions.map((sol) => (
            <motion.div
              key={sol.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedSolution(sol.id)}
            >
              <Card
                className={`cursor-pointer transition ${
                  selectedSolution === sol.id
                    ? `bg-gradient-to-br ${sol.color} border-white border-2`
                    : "bg-slate-800 border-slate-700 hover:border-slate-500"
                } ${selectedSolution === sol.id ? "text-white" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-4xl">{sol.icon}</span>
                    {selectedSolution === sol.id && (
                      <CheckCircle className="w-6 h-6" />
                    )}
                  </div>
                  <CardTitle className={selectedSolution === sol.id ? "text-white" : "text-white"}>
                    {sol.name}
                  </CardTitle>
                  <CardDescription
                    className={selectedSolution === sol.id ? "text-white opacity-90" : "text-slate-400"}
                  >
                    {sol.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Selected Solution Details */}
        {currentSolution && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className={`bg-gradient-to-r ${currentSolution.color} rounded-lg p-8 text-white`}>
              <h2 className="text-3xl font-bold mb-6">{currentSolution.name}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: "Active Clients", value: currentSolution.stats.clients, suffix: "+" },
                  { label: "System Uptime", value: currentSolution.stats.uptime },
                  { label: "Daily Alerts", value: currentSolution.stats.alerts },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-sm opacity-90">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}{stat.suffix || ""}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4">Key Benefits:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentSolution.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full bg-white text-slate-900 hover:bg-gray-100">
              Get Started with {currentSolution.name}
            </Button>
          </motion.div>
        )}

        {/* Case Studies */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Success Stories</h2>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-800 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-2xl">{currentCaseStudy.company}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Challenge", value: currentCaseStudy.challenge, color: "text-orange-400" },
                    { label: "Solution", value: currentCaseStudy.solution, color: "text-blue-400" },
                    { label: "Result", value: currentCaseStudy.result, color: "text-green-400" },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <p className={`font-bold ${item.color} mb-2`}>{item.label}</p>
                      <p className="text-slate-300 text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-700">
                  <h4 className="font-bold text-white mb-4">Key Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Time Saved/Month", value: currentCaseStudy.metrics.timeSaved },
                      { label: "Accuracy", value: currentCaseStudy.metrics.accuracy },
                      { label: "ROI", value: currentCaseStudy.metrics.roi },
                    ].map((metric, idx) => (
                      <div key={idx} className="p-4 bg-slate-700 rounded-lg">
                        <p className="text-slate-400 text-sm">{metric.label}</p>
                        <p className="text-2xl font-bold text-white">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center mb-8">
              {caseStudies.map((_, idx) => (
                <Button
                  key={idx}
                  onClick={() => setSelectedCaseStudy(idx)}
                  variant={selectedCaseStudy === idx ? "default" : "outline"}
                  className={selectedCaseStudy === idx ? "bg-blue-600" : "border-slate-600 text-white"}
                >
                  Case Study {idx + 1}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Adoption & Satisfaction */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Adoption & Satisfaction Trends</h2>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adoptionData}>
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
                  <Line
                    type="monotone"
                    dataKey="adoption"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Platform Adoption %"
                  />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="User Satisfaction %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Solution Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-white font-bold">Feature</th>
                  {solutions.map((sol) => (
                    <th key={sol.id} className="text-center p-4 text-white font-bold">
                      {sol.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  "Real-time Monitoring",
                  "Automated Tasks",
                  "Team Collaboration",
                  "Advanced Analytics",
                  "Custom Reports",
                  "API Access",
                  "Dedicated Support",
                ].map((feature, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700 transition">
                    <td className="p-4 text-slate-300">{feature}</td>
                    {solutions.map((sol) => (
                      <td key={sol.id} className="text-center p-4">
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-12 text-center border border-slate-700"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Find Your Perfect Solution</h2>
          <p className="text-lg text-slate-300 mb-8">
            Each solution is purpose-built for your industry's unique compliance needs
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600">
              Schedule Demo
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white">
              Download Comparison
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
