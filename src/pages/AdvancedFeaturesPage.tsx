import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Users, Zap, CheckCircle, Clock, BarChart3, FileText } from "lucide-react";

/**
 * Advanced Features Dashboard Page
 * Comprehensive showcase of all Sannidh features organized by domain
 */

export default function AdvancedFeaturesPage() {
  const [selectedDomain, setSelectedDomain] = useState("all");

  const domains = [
    {
      id: "gst",
      name: "GST Compliance",
      icon: "🏛️",
      description: "Real-time GST notification tracking and compliance management",
      color: "from-blue-500 to-cyan-500",
      features: [
        {
          title: "Live GST Rate Monitor",
          description: "Track GST rate changes across 40+ commodity categories in real-time",
          impact: "Reduces compliance risk by 85%",
        },
        {
          title: "ITC Procedure Updates",
          description: "Automated alerts for Input Tax Credit procedure changes from GSTN",
          impact: "Save 5 hours/week on manual research",
        },
        {
          title: "Return Filing Deadlines",
          description: "Intelligent deadline tracking for GSTR-1, GSTR-3B, and other returns",
          impact: "100% on-time filing rate",
        },
        {
          title: "Compliance Checklist",
          description: "Auto-generated GST compliance checklist based on your business type",
          impact: "Ensure no compliance gaps",
        },
      ],
    },
    {
      id: "income-tax",
      name: "Income Tax",
      icon: "💰",
      description: "Income Tax law changes and compliance tracking",
      color: "from-emerald-500 to-teal-500",
      features: [
        {
          title: "Tax Amendment Tracker",
          description: "Real-time notifications of Income Tax Act amendments and clarifications",
          impact: "Stay 24hrs ahead of changes",
        },
        {
          title: "Crypto Tax Guidance",
          description: "Automated guidance on crypto asset tax treatment with latest rulings",
          impact: "Reduce tax litigation risk",
        },
        {
          title: "Deadline Calendar",
          description: "Comprehensive tax filing and compliance deadline calendar",
          impact: "Never miss a deadline",
        },
        {
          title: "Tax Law Impact Analysis",
          description: "AI-powered impact analysis of new tax laws on client portfolios",
          impact: "Proactive tax planning",
        },
      ],
    },
    {
      id: "company-law",
      name: "Company Law",
      icon: "📋",
      description: "MCA notifications and compliance management",
      color: "from-violet-500 to-purple-500",
      features: [
        {
          title: "MCA Notification Monitor",
          description: "Live tracking of all MCA notifications and circulars",
          impact: "100% compliance coverage",
        },
        {
          title: "Board Meeting Compliance",
          description: "Automated compliance checks for board meeting procedures",
          impact: "Reduce procedural risks",
        },
        {
          title: "Filing Requirements Tracker",
          description: "Smart tracking of annual filing deadlines (AOC-4, MBP-1, etc.)",
          impact: "Perfect filing record",
        },
        {
          title: "Charge Registration",
          description: "Automated alerts for charge registration requirement changes",
          impact: "Prevent registration delays",
        },
      ],
    },
    {
      id: "sebi",
      name: "SEBI Regulations",
      icon: "📈",
      description: "Securities and investment regulatory tracking",
      color: "from-orange-500 to-red-500",
      features: [
        {
          title: "Circular Tracker",
          description: "Real-time SEBI circular notifications for all categories",
          impact: "Stay compliant with regulations",
        },
        {
          title: "Investment Advisor Compliance",
          description: "Automated compliance requirements for registered investment advisors",
          impact: "Reduce regulatory penalties",
        },
        {
          title: "Market Regulation Updates",
          description: "Track market conduct rules and compliance requirements",
          impact: "Monitor market changes 24/7",
        },
        {
          title: "Audit Trail Management",
          description: "Maintain comprehensive audit trails for SEBI compliance",
          impact: "Audit ready at all times",
        },
      ],
    },
    {
      id: "rbi",
      name: "RBI Banking",
      icon: "🏦",
      description: "Banking sector regulatory compliance",
      color: "from-pink-500 to-rose-500",
      features: [
        {
          title: "Notification Monitor",
          description: "Real-time RBI notification tracking from official RSS feed",
          impact: "First to know banking changes",
        },
        {
          title: "Digital Payment Compliance",
          description: "Track digital payment framework and security requirements",
          impact: "Ensure fintech compliance",
        },
        {
          title: "KYC/AML Updates",
          description: "Automated tracking of KYC and AML procedure changes",
          impact: "Reduce fraud risk",
        },
        {
          title: "Policy Implementation Guide",
          description: "Step-by-step implementation guides for new RBI policies",
          impact: "Smooth policy implementation",
        },
      ],
    },
    {
      id: "egazette",
      name: "Government Gazette",
      icon: "📰",
      description: "eGazette notifications and government policy tracking",
      color: "from-indigo-500 to-blue-500",
      features: [
        {
          title: "Official Notification Tracker",
          description: "Track all government notifications from official eGazette portal",
          impact: "Authoritative source compliance",
        },
        {
          title: "Policy Implementation Timeline",
          description: "Track policy notification to implementation timelines",
          impact: "Plan ahead for changes",
        },
        {
          title: "Government Circular Alerts",
          description: "Automated alerts for all government circulars affecting compliance",
          impact: "Comprehensive coverage",
        },
        {
          title: "Cross-Domain Impact Analysis",
          description: "AI analysis of policy impact across multiple domains",
          impact: "Holistic compliance view",
        },
      ],
    },
  ];

  const filteredDomains = selectedDomain === "all" ? domains : domains.filter(d => d.id === selectedDomain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">Regulatory Compliance Features</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Advanced tools and automation for every compliance domain. Monitor 7 government sources with real-time alerts, automatic tracking, and intelligent analysis.
          </p>
        </motion.div>
      </div>

      {/* Domain Filter */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedDomain === "all" ? "default" : "outline"}
              onClick={() => setSelectedDomain("all")}
              className="rounded-full"
            >
              All Domains
            </Button>
            {domains.map(domain => (
              <Button
                key={domain.id}
                variant={selectedDomain === domain.id ? "default" : "outline"}
                onClick={() => setSelectedDomain(domain.id)}
                className="rounded-full"
              >
                {domain.icon} {domain.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {filteredDomains.map((domain, idx) => (
            <motion.div key={domain.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="mb-16">
              {/* Domain Header */}
              <div className={`bg-gradient-to-r ${domain.color} rounded-lg p-8 mb-8 text-white`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{domain.icon}</span>
                  <div>
                    <h2 className="text-3xl font-bold">{domain.name}</h2>
                    <p className="text-lg opacity-90">{domain.description}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {domain.features.map((feature, fidx) => (
                  <motion.div
                    key={fidx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: fidx * 0.1 }}
                  >
                    <Card className="bg-slate-800 border-slate-700 h-full hover:border-slate-500 transition">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-slate-300">{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-300 font-medium">{feature.impact}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Key Benefits Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-16 border-t border-slate-700">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Key Benefits Across All Domains</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: <AlertCircle className="w-8 h-8" />,
                title: "Real-time Alerts",
                description: "Get notified instantly when regulatory changes are announced",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI-Powered Analysis",
                description: "Intelligent impact analysis of every regulatory change",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Team Collaboration",
                description: "Assign tasks and track compliance with your team",
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Compliance Score",
                description: "Track your overall compliance health in real-time",
              },
            ].map((benefit, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className="bg-slate-700 border-slate-600 text-center">
                  <CardContent className="pt-6">
                    <div className="text-cyan-400 mb-4 flex justify-center">{benefit.icon}</div>
                    <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-slate-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Master Regulatory Compliance?</h2>
          <p className="text-slate-300 mb-8">Start monitoring all 7 government sources with real-time alerts and AI-powered analysis today.</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
