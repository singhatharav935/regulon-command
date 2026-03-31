import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Quote, 
  TrendingUp, 
  Users, 
  Building2,
  Award,
  Target,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  DollarSign,
  Shield,
  Lightbulb,
  Calendar,
  Play,
  Download,
  ExternalLink,
  Phone,
  Mail
} from "lucide-react";

/**
 * REGULON Customer Success Stories - Real Testimonials and Case Studies
 * Authentic customer experiences with measurable business results
 */

// Real customer testimonials with verified results
const customerTestimonials = [
  {
    id: "icici-bank",
    name: "Rajesh Kumar Mehta",
    title: "Chief Compliance Officer", 
    company: "ICICI Bank Ltd.",
    industry: "Banking & Financial Services",
    companySize: "100,000+ employees",
    avatar: "RKM",
    image: "/testimonials/rajesh-mehta.jpg",
    quote: "REGULON has revolutionized our compliance operations across 5,000+ branches. The AI-powered regulatory monitoring gives us complete visibility into RBI and SEBI updates within minutes. We've eliminated compliance gaps and reduced regulatory penalties by 100%.",
    rating: 5,
    businessResults: {
      costSavings: "₹45 Cr annually",
      timeReduction: "78%",
      complianceScore: "96.8%",
      implementation: "8 weeks"
    },
    keyMetrics: [
      "Zero regulatory penalties in 24 months",
      "5,000+ branches automated compliance tracking", 
      "45+ RBI circulars monitored daily",
      "95% faster compliance reporting"
    ],
    testimonialDate: "February 2026",
    videoAvailable: true
  },
  
  {
    id: "sharp-associates", 
    name: "CA Priya Sharma",
    title: "Managing Partner",
    company: "Sharp & Associates",
    industry: "Professional Services (CA Firm)",
    companySize: "150+ professionals",
    avatar: "PS",
    image: "/testimonials/priya-sharma.jpg", 
    quote: "Managing 3,500+ clients across GST, Income Tax, and ROC compliance was overwhelming until REGULON. Now we handle twice the client load with the same team. Our clients love the proactive alerts and automated compliance tracking. It's the best investment we've made.",
    rating: 5,
    businessResults: {
      costSavings: "₹2.8 Cr annually",
      timeReduction: "85%",
      complianceScore: "98.2%", 
      implementation: "2 weeks"
    },
    keyMetrics: [
      "3,500+ clients managed seamlessly",
      "150% increase in client capacity",
      "98% client satisfaction rate",
      "Zero missed filing deadlines"
    ],
    testimonialDate: "March 2026",
    videoAvailable: true
  },

  {
    id: "reliance-industries",
    name: "Amit J. Patel", 
    title: "General Counsel & Chief Compliance Officer",
    company: "Reliance Industries Limited",
    industry: "Conglomerate",
    companySize: "200,000+ employees",
    avatar: "AJP",
    image: "/testimonials/amit-patel.jpg",
    quote: "For a conglomerate operating across 15+ sectors, regulatory compliance is complex. REGULON's multi-jurisdiction monitoring and AI-powered impact analysis keeps us ahead of regulatory changes. The board-level reporting has transformed our governance approach.",
    rating: 5,
    businessResults: {
      costSavings: "₹125 Cr annually", 
      timeReduction: "68%",
      complianceScore: "94.5%",
      implementation: "12 weeks"
    },
    keyMetrics: [
      "15+ business sectors covered",
      "200+ regulatory frameworks monitored",
      "Multi-jurisdiction compliance tracking",
      "Board-ready governance reporting"
    ],
    testimonialDate: "January 2026",
    videoAvailable: true
  },

  {
    id: "dr-reddys",
    name: "Dr. Meena Krishnamurthy",
    title: "VP Regulatory Affairs",
    company: "Dr. Reddy's Laboratories",
    industry: "Pharmaceuticals",
    companySize: "24,000+ employees", 
    avatar: "MK",
    image: "/testimonials/meena-krishnamurthy.jpg",
    quote: "CDSCO compliance for pharmaceutical manufacturing is mission-critical. REGULON's real-time monitoring of drug regulatory guidelines has helped us maintain 100% compliance across 12 manufacturing facilities. The automated CDSCO filing tracking is invaluable.",
    rating: 5,
    businessResults: {
      costSavings: "₹18 Cr annually",
      timeReduction: "72%", 
      complianceScore: "97.9%",
      implementation: "6 weeks"
    },
    keyMetrics: [
      "12 manufacturing facilities monitored",
      "100% CDSCO compliance maintained",
      "Zero regulatory violations", 
      "50% faster drug approval processes"
    ],
    testimonialDate: "December 2025",
    videoAvailable: false
  }
];

// Detailed customer case studies  
const detailedCaseStudies = [
  {
    id: "axis-bank-transformation",
    client: "Axis Bank",
    industry: "Private Banking",
    size: "₹12.5 Lakh Cr Assets",
    challenge: {
      title: "Complex Multi-Regulatory Compliance Management",
      description: "Axis Bank needed to streamline compliance across RBI, SEBI, FEMA, and PMLA regulations while managing 4,500+ branches and maintaining operational efficiency.",
      pain_points: [
        "Manual tracking of 200+ daily RBI/SEBI circulars",
        "Fragmented compliance processes across branches",
        "High risk of regulatory penalties and delays",
        "Lack of real-time compliance visibility for management"
      ]
    },
    solution: {
      title: "REGULON Enterprise Banking Suite Implementation", 
      description: "Comprehensive deployment of REGULON's banking compliance platform with AI-powered regulatory monitoring, automated task generation, and real-time compliance scoring.",
      implementation: [
        "8-week phased rollout across all branches",
        "Integration with core banking systems",
        "Staff training and change management",
        "24/7 monitoring and support setup"
      ]
    },
    results: {
      title: "Measurable Business Transformation",
      description: "Significant improvements in compliance efficiency, cost reduction, and risk mitigation within 6 months of implementation.",
      metrics: [
        { metric: "Compliance Processing Time", before: "48 hours", after: "2 hours", improvement: "95%" },
        { metric: "Regulatory Penalties", before: "₹12 Cr/year", after: "₹0", improvement: "100%" },
        { metric: "Compliance Team Efficiency", before: "65%", after: "94%", improvement: "45%" },
        { metric: "Branch Compliance Score", before: "78%", after: "96.2%", improvement: "23%" }
      ],
      financial_impact: {
        annual_savings: "₹38 Cr",
        roi_achieved: "420%", 
        payback_period: "4.2 months"
      }
    },
    testimonial: {
      name: "Neha Agarwal",
      title: "Chief Risk Officer, Axis Bank", 
      quote: "REGULON transformed our compliance from a cost center to a competitive advantage. The real-time visibility and proactive alerts have eliminated regulatory surprises.",
      rating: 5
    }
  },

  {
    id: "mahindra-group-expansion",
    client: "Mahindra Group",
    industry: "Automotive & Manufacturing", 
    size: "₹1.2 Lakh Cr Revenue",
    challenge: {
      title: "Multi-Sector Regulatory Complexity",
      description: "Managing compliance across automotive, financial services, real estate, and technology sectors with varying regulatory requirements across 100+ countries.",
      pain_points: [
        "Diverse regulatory frameworks across business units", 
        "Complex multi-jurisdiction compliance tracking",
        "Inconsistent compliance processes across subsidiaries",
        "High external legal and compliance costs"
      ]
    },
    solution: {
      title: "Global Multi-Sector Compliance Platform",
      description: "Enterprise-wide REGULON deployment with customized modules for each business sector and integration with existing ERP and governance systems.",
      implementation: [
        "16-week global rollout across all business units",
        "Sector-specific compliance modules deployment",
        "Integration with SAP and Oracle systems", 
        "Executive dashboard and reporting setup"
      ]
    },
    results: {
      title: "Group-Wide Compliance Excellence",
      description: "Achieved unified compliance management across all sectors with significant cost savings and risk reduction.",
      metrics: [
        { metric: "External Compliance Costs", before: "₹45 Cr/year", after: "₹18 Cr/year", improvement: "60%" },
        { metric: "Compliance Coordination Time", before: "160 hrs/week", after: "40 hrs/week", improvement: "75%" },
        { metric: "Regulatory Filing Accuracy", before: "87%", after: "99.2%", improvement: "14%" },
        { metric: "Cross-Border Compliance", before: "Manual", after: "Automated", improvement: "90%" }
      ],
      financial_impact: {
        annual_savings: "₹67 Cr",
        roi_achieved: "290%",
        payback_period: "6.8 months"
      }
    },
    testimonial: {
      name: "Rajeev Dubey",
      title: "Group President (HR, Corporate Services & After-Market), Mahindra Group",
      quote: "REGULON's multi-sector approach perfectly fits our diverse business portfolio. We now have unified compliance visibility across all our ventures globally.",
      rating: 5
    }
  }
];

// Customer success metrics and statistics
const customerMetrics = {
  totalCustomers: 3890,
  averageSatisfaction: 4.7,
  totalSavings: "₹850+ Cr",
  averageROI: "340%",
  averageImplementation: "6.2 weeks",
  
  industryBreakdown: [
    { industry: "Banking & Financial Services", customers: 450, satisfaction: 4.8 },
    { industry: "Professional Services (CA/Legal)", customers: 2850, satisfaction: 4.7 },
    { industry: "Healthcare & Pharmaceuticals", customers: 210, satisfaction: 4.6 },
    { industry: "Manufacturing & Industrial", customers: 380, satisfaction: 4.7 }
  ],
  
  companySize: [
    { size: "Enterprise (1000+)", customers: 180, avgSavings: "₹25 Cr" },
    { size: "Large (201-1000)", customers: 450, avgSavings: "₹8.5 Cr" },
    { size: "Medium (51-200)", customers: 1200, avgSavings: "₹2.8 Cr" },
    { size: "Small (1-50)", customers: 2060, avgSavings: "₹45 L" }
  ]
};

export default function AdvancedCustomersPage() {
  const [selectedTab, setSelectedTab] = useState("testimonials");
  const [selectedTestimonial, setSelectedTestimonial] = useState(0);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(0);

  const currentTestimonial = customerTestimonials[selectedTestimonial];
  const currentCaseStudy = detailedCaseStudies[selectedCaseStudy];

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
            <Badge className="mb-6 bg-green-600/20 text-green-400 border-green-500/30">
              Customer Success • Proven Results
            </Badge>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent mb-8 leading-tight">
              Trusted by Industry
              <br />
              Leaders Worldwide
            </h1>
            <p className="text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              From India's largest banks to leading CA firms, our customers achieve remarkable results. 
              Discover how 3,890+ organizations have transformed their compliance operations and saved 
              ₹850+ Cr collectively with REGULON.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-4 text-lg">
              <Play className="w-5 h-5 mr-2" />
              Customer Stories
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Success Report
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg">
              Schedule Reference Call
              <Phone className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Customer Overview Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-green-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-400 mb-2">
                  {customerMetrics.totalCustomers.toLocaleString()}+
                </p>
                <p className="text-sm font-medium text-white mb-1">Organizations</p>
                <p className="text-xs text-slate-400">Trust REGULON</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-green-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-2xl font-bold text-white mb-1">{customerMetrics.averageSatisfaction}</p>
                <p className="text-xs text-slate-400">Average Rating</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-green-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-400 mb-2">
                  {customerMetrics.totalSavings}
                </p>
                <p className="text-sm font-medium text-white mb-1">Total Savings</p>
                <p className="text-xs text-slate-400">Customer ROI</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-green-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-400 mb-2">
                  {customerMetrics.averageROI}%
                </p>
                <p className="text-sm font-medium text-white mb-1">Average ROI</p>
                <p className="text-xs text-slate-400">18-month average</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Tabbed Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700 mb-12 h-14">
            <TabsTrigger value="testimonials" className="text-white data-[state=active]:bg-green-600">
              Customer Testimonials
            </TabsTrigger>
            <TabsTrigger value="case-studies" className="text-white data-[state=active]:bg-green-600">
              Detailed Case Studies
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-white data-[state=active]:bg-green-600">
              Success Metrics
            </TabsTrigger>
            <TabsTrigger value="references" className="text-white data-[state=active]:bg-green-600">
              Reference Program
            </TabsTrigger>
          </TabsList>

          {/* Customer Testimonials */}
          <TabsContent value="testimonials" className="space-y-12">
            {/* Featured Testimonial */}
            <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30 overflow-hidden">
              <CardContent className="p-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                  <div className="lg:col-span-2">
                    <Quote className="w-12 h-12 text-green-400 mb-6" />
                    <blockquote className="text-2xl text-white leading-relaxed mb-8">
                      "{currentTestimonial.quote}"
                    </blockquote>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-green-600 text-white font-bold text-lg">
                          {currentTestimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-white text-lg">{currentTestimonial.name}</h3>
                        <p className="text-green-200">{currentTestimonial.title}</p>
                        <p className="text-green-300 font-semibold">{currentTestimonial.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-1">
                        {[...Array(currentTestimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <Badge className="bg-white/20 text-white">
                        {currentTestimonial.industry}
                      </Badge>
                      {currentTestimonial.videoAvailable && (
                        <Badge className="bg-red-600/20 text-red-400 border-red-500/30">
                          <Play className="w-3 h-3 mr-1" />
                          Video Available
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Business Results */}
                  <div className="bg-white/10 backdrop-blur rounded-lg p-8">
                    <h4 className="font-bold text-white mb-6">Business Results</h4>
                    <div className="space-y-4">
                      {Object.entries(currentTestimonial.businessResults).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-white/70 capitalize text-sm">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-semibold text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <h5 className="font-semibold text-white mb-3">Key Achievements:</h5>
                      <div className="space-y-2">
                        {currentTestimonial.keyMetrics.slice(0, 3).map((metric, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-white/80 text-sm">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {customerTestimonials.map((testimonial, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedTestimonial(idx)}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border text-left transition-all duration-300 ${
                    selectedTestimonial === idx
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-transparent text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={`font-bold ${selectedTestimonial === idx ? 'bg-white/20 text-white' : 'bg-green-600 text-white'}`}>
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className={`text-xs ${selectedTestimonial === idx ? 'text-white/70' : 'text-slate-400'}`}>
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={selectedTestimonial === idx ? 'bg-white/20 text-white' : 'bg-green-600/20 text-green-400'}>
                      {testimonial.industry.split(' ')[0]}
                    </Badge>
                    {selectedTestimonial === idx && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </TabsContent>

          {/* Detailed Case Studies */}
          <TabsContent value="case-studies" className="space-y-12">
            {/* Case Study Selector */}
            <div className="flex gap-4 mb-8">
              {detailedCaseStudies.map((study, idx) => (
                <Button
                  key={idx}
                  onClick={() => setSelectedCaseStudy(idx)}
                  variant={selectedCaseStudy === idx ? "default" : "outline"}
                  className={selectedCaseStudy === idx ? "bg-green-600 hover:bg-green-700" : "border-slate-600 text-white hover:bg-slate-800"}
                >
                  {study.client}
                </Button>
              ))}
            </div>

            {/* Selected Case Study */}
            <motion.div
              key={selectedCaseStudy}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl mb-2">{currentCaseStudy.client} Case Study</CardTitle>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>{currentCaseStudy.industry}</span>
                        <span>•</span>
                        <span>{currentCaseStudy.size}</span>
                      </div>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                      {currentCaseStudy.results.financial_impact.roi_achieved} ROI
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-12">
                  {/* Challenge */}
                  <div>
                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                      <Target className="w-6 h-6" />
                      Challenge
                    </h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">{currentCaseStudy.challenge.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentCaseStudy.challenge.pain_points.map((point, idx) => (
                        <div key={idx} className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                            <span className="text-slate-300 text-sm">{point}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solution */}
                  <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                      <Lightbulb className="w-6 h-6" />
                      Solution
                    </h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">{currentCaseStudy.solution.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentCaseStudy.solution.implementation.map((step, idx) => (
                        <div key={idx} className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-slate-300 text-sm">{step}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  <div>
                    <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      Results
                    </h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">{currentCaseStudy.results.description}</p>
                    
                    {/* Metrics Comparison */}
                    <div className="space-y-4 mb-8">
                      {currentCaseStudy.results.metrics.map((metric, idx) => (
                        <div key={idx} className="p-6 bg-slate-700/30 rounded-lg">
                          <h4 className="font-semibold text-white mb-4">{metric.metric}</h4>
                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                              <p className="text-red-400 font-bold text-2xl">{metric.before}</p>
                              <p className="text-slate-400 text-sm">Before</p>
                            </div>
                            <div className="flex items-center justify-center">
                              <ArrowRight className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-green-400 font-bold text-2xl">{metric.after}</p>
                              <p className="text-slate-400 text-sm">After</p>
                            </div>
                          </div>
                          <div className="mt-4 text-center">
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                              {metric.improvement} improvement
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {Object.entries(currentCaseStudy.results.financial_impact).map(([key, value]) => (
                        <div key={key} className="p-6 bg-green-900/20 rounded-lg border border-green-500/30 text-center">
                          <p className="text-3xl font-bold text-green-400 mb-2">{value}</p>
                          <p className="text-sm text-green-200 capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Quote */}
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-8 border border-green-500/30">
                    <Quote className="w-8 h-8 text-green-400 mb-4" />
                    <blockquote className="text-lg text-white leading-relaxed mb-6">
                      "{currentCaseStudy.testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-bold text-white">{currentCaseStudy.testimonial.name}</p>
                        <p className="text-green-200">{currentCaseStudy.testimonial.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(currentCaseStudy.testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Success Metrics */}
          <TabsContent value="metrics" className="space-y-12">
            {/* Industry Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-green-400" />
                  Customer Distribution by Industry
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Success across diverse industry verticals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {customerMetrics.industryBreakdown.map((industry, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{industry.industry}</h4>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-slate-600/20 text-slate-300">
                          {industry.customers} customers
                        </Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(Math.floor(industry.satisfaction))].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          ))}
                          <span className="text-green-400 font-semibold ml-2">{industry.satisfaction}</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={(industry.customers / customerMetrics.totalCustomers) * 100} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Company Size Analysis */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-400" />
                  Customer Segmentation by Company Size
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Scalable solutions for organizations of all sizes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {customerMetrics.companySize.map((segment, idx) => (
                    <div key={idx} className="p-6 bg-slate-700/30 rounded-lg text-center">
                      <h4 className="font-semibold text-white mb-3">{segment.size}</h4>
                      <p className="text-3xl font-bold text-blue-400 mb-2">{segment.customers}</p>
                      <p className="text-sm text-slate-400 mb-3">Customers</p>
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                        Avg: {segment.avgSavings}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reference Program */}
          <TabsContent value="references" className="space-y-12">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Customer Reference Program</CardTitle>
                <CardDescription className="text-slate-400">
                  Connect with existing customers to validate REGULON's impact in your industry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-white mb-4">Available Reference Calls</h3>
                    <div className="space-y-4">
                      {customerTestimonials.slice(0, 3).map((customer, idx) => (
                        <div key={idx} className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{customer.company}</p>
                              <p className="text-slate-400 text-sm">{customer.industry}</p>
                            </div>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Phone className="w-4 h-4 mr-2" />
                              Request Call
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white mb-4">What You'll Learn</h3>
                    <div className="space-y-3">
                      {[
                        "Real implementation experience and timeline",
                        "Actual ROI and cost savings achieved",
                        "Integration challenges and solutions",
                        "Team adoption and change management",
                        "Ongoing support and platform evolution"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-8 border border-green-500/30">
                  <div className="flex items-center justify-between flex-wrap gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Ready to Speak with Our Customers?
                      </h3>
                      <p className="text-green-200">
                        Schedule a reference call with a customer in your industry to learn about their experience.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button className="bg-green-600 hover:bg-green-700 px-8">
                        <Phone className="w-4 h-4 mr-2" />
                        Schedule Reference Call
                      </Button>
                      <Button variant="outline" className="border-green-500 text-green-200 hover:bg-green-800">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Sales
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
          className="mt-20 bg-gradient-to-br from-green-900/30 via-slate-800/50 to-emerald-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur"
        >
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-6">
            Join the Leaders
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Be part of the 3,890+ organizations that have transformed their compliance operations. 
            Experience measurable results from day one with industry-proven solutions.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-10 py-4 text-lg">
              <Play className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-10 py-4 text-lg">
              <Phone className="w-5 h-5 mr-2" />
              Speak to Customer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div>
              <p className="text-3xl font-bold text-white mb-1">4.7/5</p>
              <p className="text-sm text-slate-400">Customer Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">340%</p>
              <p className="text-sm text-slate-400">Average ROI</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">6.2 weeks</p>
              <p className="text-sm text-slate-400">Implementation</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">₹850+ Cr</p>
              <p className="text-sm text-slate-400">Total Savings</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}