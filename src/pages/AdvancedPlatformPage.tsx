import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  Layers,
  Clock,
  BarChart3,
  GitBranch,
  Cloud,
  Lock,
  Database,
  Cpu,
  Globe,
  ArrowRight,
  Calendar,
} from "lucide-react";

/**
 * Advanced Platform Page
 * Complete platform overview with architecture, capabilities, and roadmap
 */

const platformFeatures = [
  {
    category: "Real-time Intelligence",
    features: [
      { icon: <Zap className="w-6 h-6" />, name: "Live Monitoring", desc: "7 sources 24/7" },
      { icon: <TrendingUp className="w-6 h-6" />, name: "AI Analysis", desc: "Impact assessment" },
      { icon: <Clock className="w-6 h-6" />, name: "Instant Alerts", desc: "<2 min response" },
    ],
  },
  {
    category: "Compliance Automation",
    features: [
      { icon: <CheckCircle className="w-6 h-6" />, name: "Smart Tasks", desc: "Auto-generated" },
      { icon: <Calendar className="w-6 h-6" />, name: "Deadline Mgmt", desc: "Never miss dates" },
      { icon: <BarChart3 className="w-6 h-6" />, name: "Score Tracking", desc: "Real-time metrics" },
    ],
  },
  {
    category: "Enterprise Features",
    features: [
      { icon: <Users className="w-6 h-6" />, name: "Team Collab", desc: "Multi-workspace" },
      { icon: <Lock className="w-6 h-6" />, name: "Security", desc: "Enterprise-grade" },
      { icon: <Database className="w-6 h-6" />, name: "Data Vault", desc: "Secure storage" },
    ],
  },
];

const architectureLayers = [
  { name: "API Layer", color: "from-blue-500 to-cyan-500", features: ["30+ Endpoints", "RESTful", "GraphQL ready"] },
  { name: "Service Layer", color: "from-emerald-500 to-teal-500", features: ["Auth", "Compliance", "Analytics"] },
  { name: "Data Layer", color: "from-violet-500 to-purple-500", features: ["PostgreSQL", "Redis Cache", "S3 Storage"] },
  { name: "Integration Layer", color: "from-orange-500 to-red-500", features: ["Webhooks", "APIs", "Slack/Teams"] },
];

const roadmapItems = [
  { quarter: "Q2 2026", items: ["Mobile App", "Advanced AI", "Custom Reports"], status: "in_progress" },
  { quarter: "Q3 2026", items: ["Machine Learning", "Predictive Compliance", "Multi-language"], status: "planned" },
  { quarter: "Q4 2026", items: ["Blockchain Audit", "Global Compliance", "Enterprise Suite"], status: "planned" },
];

export default function AdvancedPlatformPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6">
            Enterprise Regulatory Intelligence Platform
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mb-8">
            Built on advanced AI and real-time monitoring, REGULON transforms regulatory compliance from a cost center
            into a strategic advantage. Monitor 7 government sources simultaneously with intelligent automation.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              Explore Platform
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
              View Architecture
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700 mb-8">
            <TabsTrigger value="overview" className="text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="architecture" className="text-white">
              Architecture
            </TabsTrigger>
            <TabsTrigger value="features" className="text-white">
              Features
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="text-white">
              Roadmap
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: "🎯", label: "Accuracy", value: "99.9%", desc: "Data accuracy" },
                { icon: "⚡", label: "Speed", value: "<2min", desc: "Alert delivery" },
                { icon: "🔒", label: "Security", value: "Enterprise", desc: "Grade protection" },
                { icon: "📈", label: "Uptime", value: "99.99%", desc: "Service availability" },
              ].map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800 border-slate-700 text-center">
                    <CardContent className="pt-6">
                      <p className="text-4xl mb-2">{metric.icon}</p>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <p className="text-xs text-slate-400 mt-2">{metric.label}</p>
                      <p className="text-xs text-slate-500">{metric.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Capabilities Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {platformFeatures.map((cat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        {cat.category}
                      </h3>
                      <div className="space-y-3">
                        {cat.features.map((feat, fidx) => (
                          <div
                            key={fidx}
                            className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-cyan-400">{feat.icon}</span>
                              <p className="font-medium text-white">{feat.name}</p>
                            </div>
                            <p className="text-xs text-slate-400 ml-9">{feat.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Cloud-Native Architecture</CardTitle>
                <CardDescription className="text-slate-400">
                  Scalable, secure, and enterprise-ready infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {architectureLayers.map((layer, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className={`bg-gradient-to-r ${layer.color} rounded-lg p-6 text-white`}>
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        {layer.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {layer.features.map((feat, fidx) => (
                          <Badge key={fidx} className="bg-white bg-opacity-20 text-white">
                            {feat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Cloud className="w-8 h-8" />, title: "Cloud Deployment", desc: "Multi-region, auto-scaling infrastructure" },
                { icon: <Cpu className="w-8 h-8" />, title: "High Performance", desc: "Sub-200ms response time" },
                { icon: <Globe className="w-8 h-8" />, title: "Global Scale", desc: "99.99% uptime SLA" },
              ].map((item, idx) => (
                <Card key={idx} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-cyan-400 mb-4">{item.icon}</div>
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-300 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Real-time Regulatory Monitoring",
                  items: [
                    "7 government sources monitored simultaneously",
                    "AI-powered impact analysis",
                    "Custom alert filtering",
                    "Compliance impact scoring",
                  ],
                },
                {
                  title: "Intelligent Compliance Automation",
                  items: [
                    "Automatic task generation",
                    "Smart deadline tracking",
                    "Team task assignment",
                    "Progress monitoring",
                  ],
                },
                {
                  title: "Advanced Analytics",
                  items: [
                    "Real-time compliance metrics",
                    "Trend analysis & forecasting",
                    "Custom report generation",
                    "Predictive insights",
                  ],
                },
                {
                  title: "Enterprise Security",
                  items: [
                    "JWT authentication",
                    "Role-based access control",
                    "End-to-end encryption",
                    "Audit trails & logging",
                  ],
                },
              ].map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800 border-slate-700 h-full">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {section.items.map((item, lidx) => (
                          <li key={lidx} className="flex items-start gap-3">
                            <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                            <span className="text-slate-300 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-8">Platform Roadmap 2026</h2>
            <div className="space-y-6">
              {roadmapItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`${item.status === "in_progress" ? "bg-gradient-to-r from-blue-900 to-cyan-900" : "bg-slate-800"} border-slate-700`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{item.quarter}</CardTitle>
                        <Badge className={item.status === "in_progress" ? "bg-green-600" : "bg-yellow-600"}>
                          {item.status === "in_progress" ? "In Progress" : "Planned"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {item.items.map((feature, fidx) => (
                          <div key={fidx} className="p-3 bg-slate-700 rounded-lg">
                            <p className="text-white font-medium text-sm">{feature}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-12 text-center border border-slate-700"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Compliance?</h2>
          <p className="text-lg text-slate-300 mb-8">Experience the platform trusted by leading organizations</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
