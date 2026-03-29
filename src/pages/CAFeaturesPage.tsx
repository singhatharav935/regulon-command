import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Clock,
  Award,
  Zap,
  BarChart3,
  GitBranch,
} from "lucide-react";

/**
 * CA Features Dashboard - Complete Feature Set
 * Comprehensive dashboard of all features available for Chartered Accountants
 */

const caFeatures = [
  {
    category: "Client Management",
    icon: <Users className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    features: [
      {
        name: "Client Portfolio Manager",
        description: "Manage unlimited client portfolios with compliance tracking",
        status: "available",
      },
      {
        name: "Multi-Entity Tracking",
        description: "Track compliance for individual clients and their entities",
        status: "available",
      },
      {
        name: "Client Collaboration Portal",
        description: "Secure workspace for document sharing and communication",
        status: "available",
      },
      {
        name: "Fee & Billing Management",
        description: "Track fees, create invoices, and manage payments",
        status: "available",
      },
    ],
  },
  {
    category: "Compliance Automation",
    icon: <CheckSquare className="w-6 h-6" />,
    color: "from-emerald-500 to-teal-500",
    features: [
      {
        name: "AI Compliance Tracker",
        description: "Automatic tracking of all compliance deadlines and requirements",
        status: "available",
      },
      {
        name: "Task Assignment Engine",
        description: "Assign compliance tasks to team members with deadline tracking",
        status: "available",
      },
      {
        name: "Automated Compliance Checklist",
        description: "Industry-specific compliance checklists that auto-update",
        status: "available",
      },
      {
        name: "Smart Alert System",
        description: "Real-time alerts for regulatory changes affecting clients",
        status: "available",
      },
    ],
  },
  {
    category: "Document Management",
    icon: <FileText className="w-6 h-6" />,
    color: "from-violet-500 to-purple-500",
    features: [
      {
        name: "Intelligent Document Vault",
        description: "Secure cloud storage with version control and audit trails",
        status: "available",
      },
      {
        name: "Document Template Library",
        description: "Pre-built templates for compliance documents and reports",
        status: "available",
      },
      {
        name: "OCR & Digital Extraction",
        description: "Extract data from documents using AI and ML",
        status: "available",
      },
      {
        name: "Document Workflow Automation",
        description: "Automate document creation and approval workflows",
        status: "available",
      },
    ],
  },
  {
    category: "Analytics & Reporting",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    features: [
      {
        name: "Compliance Score Dashboard",
        description: "Real-time compliance health score for all clients",
        status: "available",
      },
      {
        name: "Advanced Analytics",
        description: "Detailed analytics on compliance trends and risks",
        status: "available",
      },
      {
        name: "Custom Report Builder",
        description: "Create custom reports for clients and management",
        status: "available",
      },
      {
        name: "Export & Integration",
        description: "Export reports in PDF, Excel, and other formats",
        status: "available",
      },
    ],
  },
  {
    category: "AI Tools",
    icon: <Zap className="w-6 h-6" />,
    color: "from-pink-500 to-rose-500",
    features: [
      {
        name: "AI Drafting Assistant",
        description: "AI-powered drafting of compliance documents",
        status: "available",
      },
      {
        name: "Regulatory Intelligence",
        description: "AI analysis of regulatory changes and their impact",
        status: "available",
      },
      {
        name: "Smart Recommendations",
        description: "AI-powered compliance recommendations based on industry",
        status: "available",
      },
      {
        name: "Audit Support AI",
        description: "AI assistance during audit preparation and execution",
        status: "available",
      },
    ],
  },
  {
    category: "Team Collaboration",
    icon: <GitBranch className="w-6 h-6" />,
    color: "from-indigo-500 to-blue-500",
    features: [
      {
        name: "Team Workspace",
        description: "Collaborative workspace for your CA team members",
        status: "available",
      },
      {
        name: "Role-Based Permissions",
        description: "Granular permission controls for team members",
        status: "available",
      },
      {
        name: "Activity Audit Trail",
        description: "Complete audit trail of all team activities",
        status: "available",
      },
      {
        name: "Real-time Communication",
        description: "Built-in chat and notification system",
        status: "available",
      },
    ],
  },
];

export default function CAFeaturesPage() {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-16 text-white"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">CA Platform Features</h1>
          <p className="text-xl opacity-90">
            Complete suite of tools designed specifically for Chartered Accountants to streamline compliance and automate workflows
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Badge className="bg-white text-blue-600">50+ Features</Badge>
            <Badge className="bg-white text-blue-600">AI-Powered</Badge>
            <Badge className="bg-white text-blue-600">Team Collaboration</Badge>
            <Badge className="bg-white text-blue-600">Enterprise Grade</Badge>
          </div>
        </div>
      </motion.div>

      {/* Features Overview */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Clients Managed", value: "500+", icon: "👥" },
            { label: "Compliance Tasks", value: "10,000+", icon: "✅" },
            { label: "Documents Stored", value: "50,000+", icon: "📄" },
            { label: "Team Members", value: "Unlimited", icon: "👨‍💼" },
            { label: "Integration APIs", value: "40+", icon: "🔗" },
            { label: "Compliance Score", value: "98%", icon: "🎯" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl mb-2">{stat.icon}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-slate-400 text-sm mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features by Category */}
        <h2 className="text-3xl font-bold text-white mb-8">Complete Feature Set</h2>
        <div className="space-y-6">
          {caFeatures.map((category, catIdx) => (
            <motion.div
              key={catIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
            >
              <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${category.color} p-6 text-white cursor-pointer hover:opacity-90 transition`}
                  onClick={() => setExpandedCategory(expandedCategory === catIdx ? null : catIdx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <h3 className="text-xl font-bold">{category.category}</h3>
                      <Badge className="bg-white bg-opacity-20 text-white">
                        {category.features.length} Features
                      </Badge>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedCategory === catIdx ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      ▼
                    </motion.div>
                  </div>
                </div>

                {expandedCategory === catIdx && (
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.features.map((feature, fIdx) => (
                        <motion.div
                          key={fIdx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: fIdx * 0.1 }}
                          className="p-4 bg-slate-700 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-white text-sm">{feature.name}</h4>
                            <Badge className="bg-green-600 text-white text-xs">✓</Badge>
                          </div>
                          <p className="text-slate-300 text-sm">{feature.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Key Benefits */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Why CAs Choose REGULON</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <TrendingUp className="w-8 h-8 text-blue-400" />,
                title: "Increase Efficiency",
                description: "Automate compliance workflows and save 15+ hours per week",
              },
              {
                icon: <Award className="w-8 h-8 text-emerald-400" />,
                title: "Better Client Service",
                description: "Deliver proactive compliance advice and regulatory insights",
              },
              {
                icon: <AlertCircle className="w-8 h-8 text-orange-400" />,
                title: "Reduce Risk",
                description: "Never miss compliance deadlines or regulatory changes",
              },
              {
                icon: <Clock className="w-8 h-8 text-purple-400" />,
                title: "Save Time",
                description: "AI-powered drafting and analysis saves hours on complex tasks",
              },
              {
                icon: <CheckSquare className="w-8 h-8 text-pink-400" />,
                title: "Quality Assurance",
                description: "Built-in compliance checks ensure 100% accuracy",
              },
              {
                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                title: "Scale Easily",
                description: "Manage more clients without proportional increase in team size",
              },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-800 border-slate-700 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">{benefit.icon}</div>
                      <div>
                        <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                        <p className="text-slate-300 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-12 text-white text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join 1000+ CAs who are using REGULON to automate compliance and deliver better client service.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 px-8">
              Book Demo
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 px-8">
              View Pricing
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-8">No credit card required • 14-day free trial • Cancel anytime</p>
        </motion.div>

        {/* Integration Support */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Integrations & Compatibility</h2>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-300 mb-6">
                REGULON seamlessly integrates with your existing tools and workflows:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Tally",
                  "Excel/Sheets",
                  "QuickBooks",
                  "Xero",
                  "Email Services",
                  "Calendar Apps",
                  "Slack",
                  "Microsoft Teams",
                  "Google Drive",
                  "Dropbox",
                  "REST APIs",
                  "Webhooks",
                ].map((integration) => (
                  <div key={integration} className="p-4 bg-slate-700 rounded-lg text-center">
                    <p className="text-white text-sm font-medium">{integration}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                View All Integrations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
