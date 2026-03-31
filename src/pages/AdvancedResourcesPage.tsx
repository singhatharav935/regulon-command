import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Search,
  Calendar,
  Globe,
  Code,
  Lightbulb,
  Award,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  ArrowRight,
  Star,
  Eye,
  Filter
} from "lucide-react";

/**
 * REGULON Resource Center - Comprehensive Learning and Support Hub
 * Professional resources, documentation, training, and support materials
 */

// Comprehensive resource library
const resourceLibrary = {
  whitepapers: [
    {
      id: "regulatory-intelligence-2026",
      title: "The Future of Regulatory Intelligence: AI-Powered Compliance in 2026",
      description: "Comprehensive analysis of regulatory technology trends, AI adoption in compliance, and strategic recommendations for enterprise leaders.",
      category: "Industry Analysis",
      pages: 48,
      publishDate: "March 2026",
      downloadCount: "12,500+",
      author: "REGULON Research Team",
      topics: ["AI in Compliance", "RegTech Trends", "Enterprise Strategy"],
      featured: true
    },
    {
      id: "banking-compliance-guide",
      title: "Banking Compliance Transformation: RBI Regulation Management",
      description: "Complete guide to modernizing banking compliance operations with real-time regulatory monitoring and automated workflow management.",
      category: "Banking & Financial Services", 
      pages: 62,
      publishDate: "February 2026",
      downloadCount: "8,200+",
      author: "Banking Compliance Experts",
      topics: ["RBI Compliance", "Banking Automation", "Risk Management"]
    },
    {
      id: "ca-firm-digital-transformation",
      title: "CA Firm Digital Transformation: Scaling Client Services with Technology",
      description: "Strategic framework for CA firms to leverage technology for client growth, operational efficiency, and competitive advantage.",
      category: "Professional Services",
      pages: 35,
      publishDate: "January 2026", 
      downloadCount: "15,800+",
      author: "CA Practice Management Institute",
      topics: ["Digital Transformation", "Client Management", "Practice Growth"]
    },
    {
      id: "gdpr-compliance-enterprise",
      title: "Enterprise GDPR Compliance: Privacy by Design Implementation",
      description: "Practical guide to implementing GDPR compliance at enterprise scale with automated privacy controls and data protection frameworks.",
      category: "Data Privacy & Security",
      pages: 54,
      publishDate: "December 2025",
      downloadCount: "6,900+", 
      author: "Privacy & Security Consultants",
      topics: ["GDPR", "Privacy Controls", "Data Protection"]
    }
  ],

  guides: [
    {
      id: "quick-start-guide",
      title: "REGULON Quick Start Guide",
      description: "Get up and running with REGULON in 30 minutes. Complete setup, configuration, and first compliance workflow.",
      duration: "30 minutes",
      difficulty: "Beginner",
      lastUpdated: "March 2026",
      viewCount: "25,000+",
      rating: 4.9
    },
    {
      id: "api-integration-guide", 
      title: "API Integration Guide",
      description: "Complete developer guide for integrating REGULON APIs with your existing systems. Includes code samples and best practices.",
      duration: "2 hours",
      difficulty: "Advanced", 
      lastUpdated: "February 2026",
      viewCount: "8,500+",
      rating: 4.8
    },
    {
      id: "advanced-automation-setup",
      title: "Advanced Compliance Automation Setup",
      description: "Configure sophisticated compliance workflows, custom alert rules, and automated reporting for enterprise environments.",
      duration: "90 minutes",
      difficulty: "Intermediate",
      lastUpdated: "March 2026",
      viewCount: "12,200+",
      rating: 4.7
    },
    {
      id: "multi-entity-management",
      title: "Multi-Entity Compliance Management",
      description: "Best practices for managing compliance across subsidiaries, joint ventures, and international entities.",
      duration: "45 minutes", 
      difficulty: "Intermediate",
      lastUpdated: "January 2026",
      viewCount: "5,800+",
      rating: 4.8
    }
  ],

  webinars: [
    {
      id: "ai-compliance-future",
      title: "AI in Compliance: Transforming Regulatory Risk Management",
      description: "Expert panel discussion on AI adoption in compliance operations, featuring industry leaders and regulatory technology pioneers.",
      date: "April 15, 2026",
      duration: "60 minutes",
      speakers: ["Dr. Rajesh Mehta (Ex-RBI)", "Priya Sharma (Compliance AI Expert)", "Amit Gupta (REGULON CTO)"],
      attendees: "2,500+",
      recording: true,
      upcoming: true
    },
    {
      id: "banking-compliance-automation",
      title: "Banking Compliance Automation: Real-World Implementation Stories",
      description: "Leading banks share their compliance transformation journeys, challenges overcome, and measurable results achieved.",
      date: "March 28, 2026",
      duration: "75 minutes", 
      speakers: ["ICICI Bank CRO", "Axis Bank Compliance Head", "HDFC Legal Team"],
      attendees: "3,200+",
      recording: true,
      upcoming: false
    },
    {
      id: "ca-practice-efficiency",
      title: "CA Practice Efficiency: Managing 5x More Clients with Technology",
      description: "Successful CA firms demonstrate how technology enables massive client growth without proportional staff increases.",
      date: "March 14, 2026",
      duration: "55 minutes",
      speakers: ["Leading CA Practitioners", "Practice Management Experts"],
      attendees: "1,800+",
      recording: true,
      upcoming: false
    }
  ],

  caseStudies: [
    {
      id: "icici-transformation",
      title: "ICICI Bank: 95% Compliance Efficiency Improvement",
      description: "How India's largest private bank automated compliance across 5,000+ branches and eliminated regulatory penalties.",
      industry: "Banking",
      metrics: ["95% efficiency gain", "₹45 Cr annual savings", "Zero penalties"],
      readTime: "8 minutes",
      publishDate: "February 2026"
    },
    {
      id: "mahindra-global-compliance",
      title: "Mahindra Group: Global Multi-Sector Compliance Unification",
      description: "Unifying compliance across automotive, financial services, and technology sectors with centralized monitoring.",
      industry: "Conglomerate",
      metrics: ["60% cost reduction", "₹67 Cr savings", "15+ sectors unified"],
      readTime: "12 minutes", 
      publishDate: "January 2026"
    },
    {
      id: "sharp-associates-growth",
      title: "Sharp & Associates: 3x Client Growth with Same Team Size",
      description: "How a leading CA firm scaled from 1,200 to 3,500 clients without hiring additional compliance staff.",
      industry: "Professional Services",
      metrics: ["3x client growth", "150% capacity increase", "98% satisfaction"],
      readTime: "6 minutes",
      publishDate: "March 2026"
    }
  ]
};

// Training and certification programs
const trainingPrograms = [
  {
    id: "compliance-professional",
    title: "Certified Compliance Professional (CCP)",
    description: "Comprehensive certification program covering modern compliance practices, regulatory intelligence, and technology implementation.",
    duration: "40 hours",
    modules: 8,
    certification: "REGULON Certified",
    price: "₹25,000",
    nextBatch: "May 15, 2026",
    enrolled: "450+",
    rating: 4.8
  },
  {
    id: "ca-digital-mastery",
    title: "CA Digital Practice Mastery",
    description: "Specialized program for Chartered Accountants on leveraging technology for practice growth and client service excellence.",
    duration: "24 hours",
    modules: 6,
    certification: "Digital CA Specialist",
    price: "₹18,000", 
    nextBatch: "April 20, 2026",
    enrolled: "280+",
    rating: 4.9
  },
  {
    id: "enterprise-admin",
    title: "REGULON Enterprise Administrator",
    description: "Technical certification for system administrators and IT professionals managing enterprise REGULON deployments.",
    duration: "16 hours",
    modules: 4,
    certification: "Technical Specialist",
    price: "₹15,000",
    nextBatch: "May 1, 2026", 
    enrolled: "125+",
    rating: 4.7
  }
];

// Support and community resources
const supportResources = [
  {
    type: "24/7 Support",
    description: "Round-the-clock technical support with guaranteed response times",
    availability: "24/7/365",
    response: "< 15 minutes",
    channels: ["Phone", "Email", "Chat", "Video Call"],
    contact: "+91-80-4567-8900"
  },
  {
    type: "Community Forum",
    description: "Active community of 5,000+ compliance professionals sharing knowledge and best practices",
    members: "5,200+",
    posts: "15,000+",
    categories: 25,
    moderators: "Expert volunteers and REGULON team"
  },
  {
    type: "Knowledge Base",
    description: "Comprehensive searchable database of solutions, tutorials, and troubleshooting guides",
    articles: "1,200+",
    views: "2.5M+ monthly",
    languages: 3,
    updateFrequency: "Daily"
  },
  {
    type: "Customer Success",
    description: "Dedicated success managers to ensure optimal platform utilization and business outcomes",
    managers: "25+ specialists",
    customers: "Enterprise clients",
    meetings: "Quarterly business reviews",
    support: "Strategic guidance and optimization"
  }
];

export default function AdvancedResourcesPage() {
  const [selectedTab, setSelectedTab] = useState("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Professional Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-6 py-24 overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-700/25 bg-[size:20px_20px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 bg-purple-600/20 text-purple-400 border-purple-500/30">
              Resource Center • Expert Knowledge
            </Badge>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-white via-purple-100 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight">
              Knowledge Center
              <br />
              & Learning Hub
            </h1>
            <p className="text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Accelerate your compliance expertise with comprehensive resources, training programs, 
              and expert guidance. From technical documentation to industry insights, everything you 
              need for compliance success is here.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 text-lg">
              <BookOpen className="w-5 h-5 mr-2" />
              Browse Library
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Video className="w-5 h-5 mr-2" />
              Watch Webinars
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg">
              Join Training
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Resource Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-purple-400 mb-2">200+</p>
                <p className="text-sm font-medium text-white mb-1">Resources</p>
                <p className="text-xs text-slate-400">Guides & Documentation</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-purple-400 mb-2">50+</p>
                <p className="text-sm font-medium text-white mb-1">Webinars</p>
                <p className="text-xs text-slate-400">Expert Sessions</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-purple-400 mb-2">5.2K+</p>
                <p className="text-sm font-medium text-white mb-1">Community</p>
                <p className="text-xs text-slate-400">Active Members</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-purple-400 mb-2">24/7</p>
                <p className="text-sm font-medium text-white mb-1">Support</p>
                <p className="text-xs text-slate-400">Expert Help</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Tabbed Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-700 mb-12 h-14">
            <TabsTrigger value="library" className="text-white data-[state=active]:bg-purple-600">
              Resource Library
            </TabsTrigger>
            <TabsTrigger value="training" className="text-white data-[state=active]:bg-purple-600">
              Training & Certification
            </TabsTrigger>
            <TabsTrigger value="webinars" className="text-white data-[state=active]:bg-purple-600">
              Webinars & Events
            </TabsTrigger>
            <TabsTrigger value="support" className="text-white data-[state=active]:bg-purple-600">
              Support & Community
            </TabsTrigger>
            <TabsTrigger value="api" className="text-white data-[state=active]:bg-purple-600">
              API Documentation
            </TabsTrigger>
          </TabsList>

          {/* Resource Library */}
          <TabsContent value="library" className="space-y-12">
            {/* Search and Filter */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search resources, guides, whitepapers..."
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Whitepapers */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Featured Whitepapers</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {resourceLibrary.whitepapers.slice(0, 2).map((paper, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={`bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 h-full ${paper.featured ? 'ring-2 ring-purple-500/30' : ''}`}>
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                            {paper.category}
                          </Badge>
                          {paper.featured && (
                            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                          {paper.title}
                        </h3>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                          {paper.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {paper.topics.map((topic, tidx) => (
                            <Badge key={tidx} className="bg-slate-600/20 text-slate-300 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-400 mb-6">
                          <span>{paper.pages} pages</span>
                          <span>{paper.downloadCount} downloads</span>
                          <span>{paper.publishDate}</span>
                        </div>

                        <div className="flex gap-3">
                          <Button className="bg-purple-600 hover:bg-purple-700 flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Implementation Guides */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Implementation Guides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resourceLibrary.guides.map((guide, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-white text-lg">{guide.title}</h3>
                        <Badge className={`${
                          guide.difficulty === 'Beginner' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                          guide.difficulty === 'Intermediate' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-600/20 text-red-400 border-red-500/30'
                        }`}>
                          {guide.difficulty}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 text-sm mb-4">{guide.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {guide.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {guide.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          {guide.rating}
                        </div>
                      </div>

                      <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Guide
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Case Studies */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Success Stories & Case Studies</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resourceLibrary.caseStudies.map((study, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30 mb-4">
                        {study.industry}
                      </Badge>
                      
                      <h3 className="font-bold text-white mb-3">{study.title}</h3>
                      <p className="text-slate-300 text-sm mb-4">{study.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        {study.metrics.map((metric, midx) => (
                          <div key={midx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-slate-300 text-xs">{metric}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{study.readTime}</span>
                        <span>{study.publishDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Training & Certification */}
          <TabsContent value="training" className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Professional Certification Programs</h2>
              <div className="grid gap-8">
                {trainingPrograms.map((program, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-2xl font-bold text-white">{program.title}</h3>
                              <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                                {program.certification}
                              </Badge>
                            </div>
                            
                            <p className="text-slate-300 mb-6 leading-relaxed">{program.description}</p>
                            
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold text-white mb-2">Program Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Duration:</span>
                                    <span className="text-white">{program.duration}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Modules:</span>
                                    <span className="text-white">{program.modules}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Price:</span>
                                    <span className="text-white">{program.price}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-white mb-2">Enrollment</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Next Batch:</span>
                                    <span className="text-white">{program.nextBatch}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Enrolled:</span>
                                    <span className="text-white">{program.enrolled}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Rating:</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span className="text-white">{program.rating}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center gap-4">
                            <Button className="bg-purple-600 hover:bg-purple-700 px-8 py-3">
                              <Award className="w-5 h-5 mr-2" />
                              Enroll Now
                            </Button>
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 px-8 py-3">
                              <BookOpen className="w-5 h-5 mr-2" />
                              View Curriculum
                            </Button>
                            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-3">
                              <Video className="w-5 h-5 mr-2" />
                              Preview Course
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Webinars & Events */}
          <TabsContent value="webinars" className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Upcoming Webinars & Recorded Sessions</h2>
              <div className="space-y-6">
                {resourceLibrary.webinars.map((webinar, idx) => (
                  <Card key={idx} className={`bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 ${webinar.upcoming ? 'ring-2 ring-blue-500/30' : ''}`}>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-4 mb-4">
                            <Badge className={webinar.upcoming ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-green-600/20 text-green-400 border-green-500/30"}>
                              {webinar.upcoming ? "Upcoming" : "Recorded"}
                            </Badge>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Calendar className="w-4 h-4" />
                              {webinar.date}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              {webinar.duration}
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-3">{webinar.title}</h3>
                          <p className="text-slate-300 mb-4">{webinar.description}</p>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold text-white mb-2">Speakers:</h4>
                            <div className="flex flex-wrap gap-2">
                              {webinar.speakers.map((speaker, sidx) => (
                                <Badge key={sidx} className="bg-slate-600/20 text-slate-300">
                                  {speaker}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {webinar.attendees} attendees
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          {webinar.upcoming ? (
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <Calendar className="w-4 h-4 mr-2" />
                              Register Free
                            </Button>
                          ) : (
                            <Button className="bg-green-600 hover:bg-green-700">
                              <Play className="w-4 h-4 mr-2" />
                              Watch Recording
                            </Button>
                          )}
                          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                            <Download className="w-4 h-4 mr-2" />
                            Download Slides
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Support & Community */}
          <TabsContent value="support" className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Support Channels & Community</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {supportResources.map((resource, idx) => (
                  <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-all duration-300">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                        {resource.type === "24/7 Support" && <Headphones className="w-6 h-6 text-orange-400" />}
                        {resource.type === "Community Forum" && <MessageCircle className="w-6 h-6 text-orange-400" />}
                        {resource.type === "Knowledge Base" && <BookOpen className="w-6 h-6 text-orange-400" />}
                        {resource.type === "Customer Success" && <Users className="w-6 h-6 text-orange-400" />}
                        {resource.type}
                      </h3>
                      
                      <p className="text-slate-300 mb-6 leading-relaxed">{resource.description}</p>
                      
                      <div className="space-y-3 mb-6">
                        {Object.entries(resource).slice(2).map(([key, value]) => (
                          key !== 'description' && (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="text-white font-medium">{Array.isArray(value) ? value.join(', ') : value}</span>
                            </div>
                          )
                        ))}
                      </div>

                      <div className="flex gap-3">
                        {resource.type === "24/7 Support" && (
                          <>
                            <Button className="bg-orange-600 hover:bg-orange-700 flex-1">
                              <Phone className="w-4 h-4 mr-2" />
                              Call Support
                            </Button>
                            <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {resource.type === "Community Forum" && (
                          <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Join Community
                          </Button>
                        )}
                        {resource.type === "Knowledge Base" && (
                          <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                            <Search className="w-4 h-4 mr-2" />
                            Search KB
                          </Button>
                        )}
                        {resource.type === "Customer Success" && (
                          <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Meeting
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* API Documentation */}
          <TabsContent value="api" className="space-y-12">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Code className="w-6 h-6 text-green-400" />
                  REGULON API Documentation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Comprehensive developer resources for integrating REGULON with your systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-700/30 rounded-lg">
                    <h4 className="font-bold text-white mb-3">REST API</h4>
                    <p className="text-slate-300 text-sm mb-4">Complete REST API with 150+ endpoints for all platform features</p>
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View REST Docs
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-slate-700/30 rounded-lg">
                    <h4 className="font-bold text-white mb-3">GraphQL API</h4>
                    <p className="text-slate-300 text-sm mb-4">Flexible GraphQL interface for efficient data querying</p>
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      GraphQL Playground
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-slate-700/30 rounded-lg">
                    <h4 className="font-bold text-white mb-3">Webhooks</h4>
                    <p className="text-slate-300 text-sm mb-4">Real-time event notifications for compliance updates</p>
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Webhook Guide
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-8 border border-slate-600">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <p className="text-slate-300 mb-4">Get started with REGULON API in minutes:</p>
                      <ol className="space-y-2 text-sm text-slate-300">
                        <li>1. Generate API key from dashboard</li>
                        <li>2. Install SDK or use REST endpoints</li>
                        <li>3. Authenticate and make first call</li>
                        <li>4. Set up webhooks for real-time updates</li>
                      </ol>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Code className="w-4 h-4 mr-2" />
                        Get API Key
                      </Button>
                      <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                        <Download className="w-4 h-4 mr-2" />
                        Download SDK
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 bg-gradient-to-br from-purple-900/30 via-slate-800/50 to-blue-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur"
        >
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-6">
            Accelerate Your Success
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Access comprehensive resources, expert guidance, and community support to maximize 
            your compliance intelligence capabilities and achieve measurable business results.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-10 py-4 text-lg">
              <BookOpen className="w-5 h-5 mr-2" />
              Explore Resources
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <Award className="w-5 h-5 mr-2" />
              Get Certified
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-10 py-4 text-lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Join Community
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div>
              <p className="text-3xl font-bold text-white mb-1">200+</p>
              <p className="text-sm text-slate-400">Resources Available</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">5.2K+</p>
              <p className="text-sm text-slate-400">Community Members</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">24/7</p>
              <p className="text-sm text-slate-400">Expert Support</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">4.8/5</p>
              <p className="text-sm text-slate-400">Training Rating</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}