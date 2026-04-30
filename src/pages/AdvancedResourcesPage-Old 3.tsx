import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Video,
  FileText,
  BarChart3,
  Download,
  ExternalLink,
  Play,
  Clock,
  Users,
  Target,
} from "lucide-react";

/**
 * Advanced Resources Page
 * Documentation, guides, webinars, and learning materials
 */

const resources = [
  {
    category: "Documentation",
    icon: <FileText className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    items: [
      {
        title: "Getting Started Guide",
        description: "Complete setup and configuration guide",
        duration: "15 min read",
        level: "Beginner",
        downloads: 2500,
      },
      {
        title: "API Documentation",
        description: "Complete REST API reference with examples",
        duration: "45 min read",
        level: "Advanced",
        downloads: 1800,
      },
      {
        title: "Security & Compliance",
        description: "Security features, certifications, and compliance",
        duration: "20 min read",
        level: "Intermediate",
        downloads: 950,
      },
      {
        title: "Integration Guide",
        description: "Integrate SANNIDH with your systems",
        duration: "30 min read",
        level: "Advanced",
        downloads: 680,
      },
    ],
  },
  {
    category: "Video Tutorials",
    icon: <Video className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    items: [
      {
        title: "Platform Overview",
        description: "10-minute introduction to SANNIDH",
        duration: "10:30 min",
        level: "Beginner",
        views: 5200,
      },
      {
        title: "Setting Up Your First Workspace",
        description: "Step-by-step workspace configuration",
        duration: "8:45 min",
        level: "Beginner",
        views: 3800,
      },
      {
        title: "Advanced Compliance Automation",
        description: "Automate your compliance workflows",
        duration: "22:15 min",
        level: "Advanced",
        views: 1950,
      },
      {
        title: "Team Collaboration Features",
        description: "Manage teams and assignments",
        duration: "12:30 min",
        level: "Intermediate",
        views: 2400,
      },
    ],
  },
  {
    category: "Webinars & Workshops",
    icon: <Users className="w-6 h-6" />,
    color: "from-emerald-500 to-teal-500",
    items: [
      {
        title: "Compliance Best Practices for CAs",
        description: "Expert webinar on compliance automation",
        duration: "60 min",
        level: "All Levels",
        attendees: 3200,
        date: "April 15, 2026",
      },
      {
        title: "Regulatory Updates 2026",
        description: "Overview of new regulatory requirements",
        duration: "45 min",
        level: "All Levels",
        attendees: 2800,
        date: "April 22, 2026",
      },
      {
        title: "Enterprise Security Implementation",
        description: "Security best practices workshop",
        duration: "90 min",
        level: "Advanced",
        attendees: 1500,
        date: "April 29, 2026",
      },
      {
        title: "Advanced Analytics & Reporting",
        description: "Master compliance analytics",
        duration: "75 min",
        level: "Intermediate",
        attendees: 2100,
        date: "May 6, 2026",
      },
    ],
  },
];

const whitepapers = [
  {
    title: "The Future of Regulatory Compliance",
    description: "How AI and automation are transforming compliance",
    pages: 24,
    downloads: 4200,
  },
  {
    title: "Enterprise Compliance Benchmarks 2026",
    description: "Industry standards and best practices",
    pages: 18,
    downloads: 3100,
  },
  {
    title: "Cost of Non-Compliance",
    description: "Financial impact analysis of compliance failures",
    pages: 16,
    downloads: 2800,
  },
  {
    title: "Building a Compliance Culture",
    description: "Organizational strategies for compliance",
    pages: 22,
    downloads: 2400,
  },
];

const tools = [
  {
    name: "Compliance Checklist Generator",
    description: "Auto-generate industry-specific checklists",
    type: "Tool",
  },
  {
    name: "Deadline Calculator",
    description: "Calculate all compliance deadlines for your jurisdiction",
    type: "Tool",
  },
  {
    name: "ROI Calculator",
    description: "Calculate your potential ROI with SANNIDH",
    type: "Calculator",
  },
  {
    name: "Risk Assessment Tool",
    description: "Assess your compliance risk level",
    type: "Assessment",
  },
];

export default function AdvancedResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-900 to-slate-900 border-b border-slate-700 px-6 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen className="w-12 h-12 text-indigo-400" />
            <h1 className="text-6xl font-bold text-white">Learning Resources</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mb-8">
            Comprehensive guides, tutorials, webinars, and tools to help you master SANNIDH and transform your
            compliance operations.
          </p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <Tabs defaultValue="documentation" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700 mb-12">
            <TabsTrigger value="documentation" className="text-white">
              Documentation
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-white">
              Videos & Webinars
            </TabsTrigger>
            <TabsTrigger value="whitepapers" className="text-white">
              Whitepapers & Tools
            </TabsTrigger>
          </TabsList>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-8">
            <div className="space-y-6">
              {resources
                .filter(r => r.category === "Documentation")
                .map((resource) => (
                  <div key={resource.category} className="space-y-4">
                    <div className="space-y-4">
                      {resource.items.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition cursor-pointer">
                            <CardHeader>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    {item.title}
                                  </CardTitle>
                                  <CardDescription className="text-slate-400 mt-2">
                                    {item.description}
                                  </CardDescription>
                                </div>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  <Download className="w-4 h-4 mr-2" />
                                  Read
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Clock className="w-4 h-4" />
                                  {item.duration}
                                </span>
                                <Badge className={item.level === "Beginner" ? "bg-green-600" : item.level === "Intermediate" ? "bg-yellow-600" : "bg-red-600"}>
                                  {item.level}
                                </Badge>
                                <span className="text-slate-400 ml-auto">
                                  {item.downloads?.toLocaleString()} downloads
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-8">
            <div className="space-y-6">
              {/* Video Tutorials */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Video Tutorials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resources
                    .find(r => r.category === "Video Tutorials")
                    ?.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="bg-slate-800 border-slate-700 overflow-hidden hover:border-purple-500 transition cursor-pointer">
                          <div className="w-full h-40 bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center">
                            <Play className="w-12 h-12 text-purple-400" />
                          </div>
                          <CardHeader>
                            <CardTitle className="text-white text-sm">{item.title}</CardTitle>
                            <CardDescription className="text-slate-400 text-xs mt-1">
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {item.duration}
                              </span>
                              <span className="text-slate-400">{item.views?.toLocaleString()} views</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Webinars */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Upcoming Webinars</h3>
                <div className="space-y-4">
                  {resources
                    .find(r => r.category === "Webinars & Workshops")
                    ?.items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="bg-slate-800 border-slate-700">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-white flex items-center gap-2">
                                  <Users className="w-5 h-5 text-emerald-400" />
                                  {item.title}
                                </CardTitle>
                                <CardDescription className="text-slate-400 mt-2">
                                  {item.description}
                                </CardDescription>
                              </div>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                Register
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-4 text-sm text-slate-400">
                              <span>{item.date}</span>
                              <span>•</span>
                              <span>{item.duration}</span>
                              <span>•</span>
                              <span>{item.attendees?.toLocaleString()} registered</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Whitepapers Tab */}
          <TabsContent value="whitepapers" className="space-y-8">
            {/* Whitepapers */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Whitepapers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {whitepapers.map((paper, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-indigo-500 transition">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-white text-base">{paper.title}</CardTitle>
                            <CardDescription className="text-slate-400 mt-2">{paper.description}</CardDescription>
                          </div>
                          <Button size="sm" variant="outline" className="border-slate-600">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex text-sm text-slate-400">
                          <span>{paper.pages} pages</span>
                          <span className="ml-auto">{paper.downloads?.toLocaleString()} downloads</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Tools & Calculators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-indigo-500 transition">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white">{tool.name}</CardTitle>
                            <CardDescription className="text-slate-400 mt-2">
                              {tool.description}
                            </CardDescription>
                          </div>
                          <Badge className="bg-indigo-600">{tool.type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Try Now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Support Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Knowledge Base",
                description: "Search hundreds of articles and FAQs",
                icon: "📚",
                link: "Browse Articles",
              },
              {
                title: "Community Forum",
                description: "Connect with other SANNIDH users",
                icon: "👥",
                link: "Visit Forum",
              },
              {
                title: "Support Team",
                description: "Get help from our expert support team",
                icon: "💬",
                link: "Contact Support",
              },
            ].map((support, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-4xl mb-4">{support.icon}</p>
                  <h3 className="font-bold text-white mb-2">{support.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{support.description}</p>
                  <Button size="sm" variant="outline" className="w-full border-slate-600">
                    {support.link}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-lg p-12 text-center border border-indigo-700"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Master SANNIDH Today</h2>
          <p className="text-lg text-slate-300 mb-8">Access all resources and start your learning journey</p>
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            Explore All Resources
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
