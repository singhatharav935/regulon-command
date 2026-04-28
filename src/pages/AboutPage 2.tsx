import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Users,
  Target,
  Award,
  Globe,
  Calendar,
  MapPin,
  Briefcase,
  Heart,
  Lightbulb,
  Rocket,
  Shield,
  TrendingUp,
  Code,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  ExternalLink,
  Download,
  ArrowRight,
  Star,
  Clock,
  CheckCircle
} from "lucide-react";

/**
 * SANNIDH About Page - Professional Company Story and Team
 * Company history, team profiles, mission, values, and achievements
 */

// Company information and milestones
const companyInfo = {
  founded: "2019",
  headquarters: "Bangalore, India",
  employees: "150+",
  locations: ["Bangalore", "Mumbai", "Delhi", "Chennai", "Pune"],
  customers: "3,890+",
  countries: "15+",
  funding: "Series B",
  valuation: "$85M"
};

const companyMilestones = [
  {
    year: "2019",
    title: "Company Founded",
    description: "SANNIDH founded with vision to transform compliance through AI and automation",
    achievement: "Initial team of 8 compliance and technology experts"
  },
  {
    year: "2020",
    title: "Product Launch",
    description: "First SANNIDH platform launched for CA firms and small businesses",
    achievement: "100+ early adopters, ₹2 Cr ARR achieved"
  },
  {
    year: "2021", 
    title: "Series A Funding",
    description: "Raised ₹25 Cr Series A to expand platform capabilities and team",
    achievement: "1,000+ customers, enterprise features launched"
  },
  {
    year: "2022",
    title: "Enterprise Expansion", 
    description: "Major banking and enterprise customers onboarded, SOC 2 certification achieved",
    achievement: "10x revenue growth, ISO 27001 certified"
  },
  {
    year: "2023",
    title: "AI Platform Evolution",
    description: "Advanced AI capabilities launched, international expansion initiated", 
    achievement: "2,500+ customers, multi-jurisdiction support"
  },
  {
    year: "2024",
    title: "Series B & Scale",
    description: "₹60 Cr Series B funding, 3,000+ customers, market leadership established",
    achievement: "₹50 Cr ARR, regional expansion completed"
  },
  {
    year: "2025",
    title: "Market Leadership",
    description: "Industry leader in compliance intelligence, advanced automation launched",
    achievement: "3,890+ customers, ₹850+ Cr customer savings"
  },
  {
    year: "2026",
    title: "Global Expansion",
    description: "International markets expansion, next-gen AI compliance platform",
    achievement: "15+ countries, enterprise dominance"
  }
];

// Leadership team
const leadershipTeam = [
  {
    name: "Arjun Krishnamurthy",
    title: "CEO & Co-Founder",
    avatar: "AK", 
    image: "/team/arjun-krishnamurthy.jpg",
    bio: "Former McKinsey consultant and compliance technology expert with 15+ years experience. Led digital transformation at major Indian banks before founding SANNIDH.",
    expertise: ["Strategic Leadership", "Compliance Technology", "Enterprise Sales"],
    education: "MBA - IIM Bangalore, B.Tech - IIT Delhi",
    linkedin: "https://linkedin.com/in/arjunkrishnamurthy",
    achievements: [
      "Ex-McKinsey Principal, Financial Services Practice",
      "Led compliance transformation at 3 major banks",
      "Named 'CEO of the Year 2025' by FinTech India"
    ]
  },
  {
    name: "Dr. Priya Sharma",
    title: "CTO & Co-Founder", 
    avatar: "PS",
    image: "/team/priya-sharma.jpg",
    bio: "AI and machine learning expert with PhD from Stanford. Former Principal Engineer at Microsoft, specializing in enterprise AI platforms and regulatory technology.",
    expertise: ["Artificial Intelligence", "Machine Learning", "Enterprise Architecture"],
    education: "PhD AI/ML - Stanford University, B.Tech CS - IIT Bombay",
    linkedin: "https://linkedin.com/in/drpriyasharma",
    achievements: [
      "Ex-Microsoft Principal Engineer, AI Platform",
      "15+ patents in AI and compliance technology", 
      "Featured in Forbes '40 Under 40' Tech Leaders"
    ]
  },
  {
    name: "Rajesh Gupta",
    title: "Chief Compliance Officer",
    avatar: "RG",
    image: "/team/rajesh-gupta.jpg", 
    bio: "Former RBI Executive Director with 25+ years in banking regulation and compliance. Expert in Indian regulatory frameworks and international compliance standards.",
    expertise: ["Banking Regulation", "Compliance Strategy", "Risk Management"],
    education: "MBA Finance - XLRI, CA - ICAI",
    linkedin: "https://linkedin.com/in/rajeshguptarca",
    achievements: [
      "Ex-RBI Executive Director, Banking Supervision",
      "Authored 'Modern Banking Compliance' (bestseller)",
      "Advisory board member at 5 fintech companies"
    ]
  },
  {
    name: "Meera Patel",
    title: "Chief Product Officer",
    avatar: "MP",
    image: "/team/meera-patel.jpg",
    bio: "Product leader with 12+ years at leading SaaS companies. Expert in enterprise product strategy, user experience, and compliance workflow design.",
    expertise: ["Product Strategy", "UX Design", "Enterprise SaaS"],
    education: "MS Design - Carnegie Mellon, B.E. - BITS Pilani", 
    linkedin: "https://linkedin.com/in/meerapatel",
    achievements: [
      "Ex-Salesforce Senior Director, Compliance Products",
      "Led product teams at Zoho and Freshworks",
      "Winner of 'Product Excellence Award 2024'"
    ]
  },
  {
    name: "Vikram Joshi",
    title: "Chief Revenue Officer",
    avatar: "VJ", 
    image: "/team/vikram-joshi.jpg",
    bio: "Sales and revenue leader with proven track record of scaling B2B SaaS companies from startup to enterprise. Expert in enterprise sales and customer success.",
    expertise: ["Enterprise Sales", "Revenue Growth", "Customer Success"],
    education: "MBA - ISB Hyderabad, B.Com - Mumbai University",
    linkedin: "https://linkedin.com/in/vikramjoshi",
    achievements: [
      "Scaled 3 SaaS companies to ₹100+ Cr ARR",
      "Built enterprise sales teams across India",
      "Recognized as 'Sales Leader of the Year 2025'"
    ]
  },
  {
    name: "Dr. Anitha Reddy",
    title: "Chief Data Officer",
    avatar: "AR",
    image: "/team/anitha-reddy.jpg",
    bio: "Data science and analytics expert with PhD in Statistics. Former Chief Data Scientist at leading Indian banks, specializing in regulatory data and AI model governance.",
    expertise: ["Data Science", "AI Governance", "Regulatory Analytics"],
    education: "PhD Statistics - ISI Bangalore, M.Tech CSE - IISC", 
    linkedin: "https://linkedin.com/in/dranithareddyy",
    achievements: [
      "Ex-HDFC Bank Chief Data Scientist",
      "Published 40+ research papers on RegTech AI", 
      "IEEE Fellow for contributions to AI governance"
    ]
  }
];

// Company values and culture
const companyValues = [
  {
    value: "Innovation First",
    icon: <Lightbulb className="w-8 h-8" />,
    description: "We continuously push the boundaries of what's possible in compliance technology, creating solutions that didn't exist before.",
    examples: ["AI-powered regulatory analysis", "Real-time compliance scoring", "Predictive risk modeling"]
  },
  {
    value: "Customer Success",
    icon: <Heart className="w-8 h-8" />,
    description: "Our customers' success is our primary measure of achievement. We're not satisfied until they achieve measurable business results.",
    examples: ["99% customer satisfaction", "Average 340% ROI", "24/7 dedicated support"]
  },
  {
    value: "Regulatory Excellence",
    icon: <Shield className="w-8 h-8" />,
    description: "We maintain the highest standards of regulatory knowledge and compliance, ensuring our platform exceeds industry requirements.",
    examples: ["SOC 2 Type II certified", "ISO 27001 compliance", "GDPR by design"]
  },
  {
    value: "Inclusive Growth",
    icon: <Users className="w-8 h-8" />, 
    description: "We believe great compliance technology should be accessible to organizations of all sizes, from startups to enterprises.",
    examples: ["Scalable pricing models", "SME-focused features", "Educational resources"]
  }
];

// Company achievements and recognitions
const achievements = [
  {
    category: "Industry Recognition",
    awards: [
      { title: "RegTech Company of the Year 2025", authority: "FinTech India Awards", year: "2025" },
      { title: "Best Compliance Platform", authority: "SaaS India Excellence Awards", year: "2025" },
      { title: "Innovation in AI Award", authority: "NASSCOM Technology Awards", year: "2024" },
      { title: "Emerging Technology Leader", authority: "Deloitte Fast 50 India", year: "2024" }
    ]
  },
  {
    category: "Business Milestones", 
    awards: [
      { title: "₹50 Cr ARR Achieved", authority: "Revenue Milestone", year: "2024" },
      { title: "3,890+ Enterprise Customers", authority: "Customer Growth", year: "2026" },
      { title: "Series B Funding - ₹60 Cr", authority: "Investment Round", year: "2024" },
      { title: "15+ Countries Expansion", authority: "Global Presence", year: "2026" }
    ]
  },
  {
    category: "Technology & Security",
    awards: [
      { title: "SOC 2 Type II Certification", authority: "AICPA Security Audit", year: "2024" },
      { title: "ISO 27001:2022 Certified", authority: "Information Security Standard", year: "2025" },
      { title: "GDPR Compliance Verified", authority: "EU Privacy Regulation", year: "2025" },
      { title: "99.98% Platform Uptime", authority: "Performance Achievement", year: "2025" }
    ]
  }
];

// Office locations
const officeLocations = [
  {
    city: "Bangalore",
    type: "Global Headquarters",
    address: "WeWork Prestige Atlanta, 80 Feet Road, Koramangala",
    employees: "85+",
    departments: ["Engineering", "Product", "Sales", "Operations"],
    established: "2019"
  },
  {
    city: "Mumbai", 
    type: "Sales & Customer Success",
    address: "Lower Parel Business District, Kamala Mills Compound",
    employees: "25+",
    departments: ["Sales", "Customer Success", "Marketing"],
    established: "2021"
  },
  {
    city: "Delhi NCR",
    type: "Enterprise Sales Hub", 
    address: "Cyber City, Gurugram, Haryana",
    employees: "20+",
    departments: ["Enterprise Sales", "Partnerships", "Government Relations"],
    established: "2022"
  },
  {
    city: "Chennai",
    type: "Customer Support Center",
    address: "IT Corridor, Old Mahabalipuram Road",
    employees: "15+", 
    departments: ["Customer Support", "Training", "Implementation"],
    established: "2023"
  }
];

export default function AboutPage() {
  const [selectedTab, setSelectedTab] = useState("story");
  const [hoveredTeamMember, setHoveredTeamMember] = useState<number | null>(null);

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
            <Badge className="mb-6 bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
              About SANNIDH • Our Story
            </Badge>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight">
              Transforming Compliance
              <br />
              Through Intelligence
            </h1>
            <p className="text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Founded by compliance and technology experts, SANNIDH is pioneering the future of 
              regulatory intelligence. We're building the world's most advanced compliance platform, 
              trusted by 3,890+ organizations to navigate complex regulatory landscapes with confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-8 py-4 text-lg">
              <Users className="w-5 h-5 mr-2" />
              Meet Our Team
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Company Overview
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg">
              Careers
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Company Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{companyInfo.founded}</p>
                <p className="text-sm font-medium text-white mb-1">Founded</p>
                <p className="text-xs text-slate-400">7+ Years Innovation</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{companyInfo.employees}</p>
                <p className="text-sm font-medium text-white mb-1">Team Members</p>
                <p className="text-xs text-slate-400">Across 4 Offices</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{companyInfo.customers}</p>
                <p className="text-sm font-medium text-white mb-1">Customers</p>
                <p className="text-xs text-slate-400">Trusted Globally</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{companyInfo.countries}</p>
                <p className="text-sm font-medium text-white mb-1">Countries</p>
                <p className="text-xs text-slate-400">Global Presence</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Tabbed Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-700 mb-12 h-14">
            <TabsTrigger value="story" className="text-white data-[state=active]:bg-cyan-600">
              Our Story
            </TabsTrigger>
            <TabsTrigger value="team" className="text-white data-[state=active]:bg-cyan-600">
              Leadership Team
            </TabsTrigger>
            <TabsTrigger value="values" className="text-white data-[state=active]:bg-cyan-600">
              Values & Culture
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-cyan-600">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-white data-[state=active]:bg-cyan-600">
              Global Presence
            </TabsTrigger>
          </TabsList>

          {/* Company Story */}
          <TabsContent value="story" className="space-y-12">
            {/* Mission & Vision */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-8 h-8 text-cyan-400" />
                    <h3 className="text-2xl font-bold text-white">Our Mission</h3>
                  </div>
                  <p className="text-lg text-cyan-100 leading-relaxed">
                    To democratize compliance intelligence by making advanced regulatory technology 
                    accessible to organizations of all sizes. We believe every business deserves 
                    enterprise-grade compliance capabilities without enterprise complexity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Rocket className="w-8 h-8 text-purple-400" />
                    <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                  </div>
                  <p className="text-lg text-purple-100 leading-relaxed">
                    To become the global standard for compliance intelligence, powering regulatory 
                    decision-making for millions of professionals worldwide through AI-driven insights 
                    and predictive compliance technology.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Company Timeline */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Our Journey</h2>
              <div className="space-y-8">
                {companyMilestones.map((milestone, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                          <div className="text-center lg:text-left">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-600 rounded-full text-white font-bold text-xl mb-4">
                              {milestone.year}
                            </div>
                          </div>
                          
                          <div className="lg:col-span-2">
                            <h3 className="text-xl font-bold text-white mb-3">{milestone.title}</h3>
                            <p className="text-slate-300 leading-relaxed">{milestone.description}</p>
                          </div>
                          
                          <div className="bg-slate-700/30 rounded-lg p-4">
                            <h4 className="font-semibold text-cyan-400 mb-2">Key Achievement</h4>
                            <p className="text-slate-300 text-sm">{milestone.achievement}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Leadership Team */}
          <TabsContent value="team" className="space-y-12">
            <h2 className="text-4xl font-bold text-white mb-8">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {leadershipTeam.map((member, idx) => (
                <motion.div
                  key={idx}
                  onHoverStart={() => setHoveredTeamMember(idx)}
                  onHoverEnd={() => setHoveredTeamMember(null)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                          <AvatarFallback className="bg-cyan-600 text-white font-bold text-xl">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                        <p className="text-cyan-400 font-semibold">{member.title}</p>
                      </div>
                      
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        {member.bio}
                      </p>
                      
                      <div className="mb-6">
                        <h4 className="font-semibold text-white mb-3">Expertise:</h4>
                        <div className="flex flex-wrap gap-2">
                          {member.expertise.map((skill, sidx) => (
                            <Badge key={sidx} className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-white mb-2 text-sm">Education:</h4>
                        <p className="text-slate-400 text-xs">{member.education}</p>
                      </div>

                      {hoveredTeamMember === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="border-t border-slate-600 pt-4 mt-4"
                        >
                          <h4 className="font-semibold text-white mb-2 text-sm">Key Achievements:</h4>
                          <ul className="space-y-1">
                            {member.achievements.slice(0, 2).map((achievement, aidx) => (
                              <li key={aidx} className="text-slate-400 text-xs flex items-start gap-2">
                                <div className="w-1 h-1 bg-cyan-400 rounded-full flex-shrink-0 mt-2" />
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 flex-1">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </Button>
                        <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Values & Culture */}
          <TabsContent value="values" className="space-y-12">
            <h2 className="text-4xl font-bold text-white mb-8">Our Values & Culture</h2>
            <div className="grid gap-8">
              {companyValues.map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-cyan-600/20 rounded-lg text-cyan-400">
                              {value.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-white">{value.value}</h3>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-slate-300 leading-relaxed">{value.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-white mb-3">Examples in Action:</h4>
                          <div className="space-y-2">
                            {value.examples.map((example, eidx) => (
                              <div key={eidx} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-slate-300 text-sm">{example}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Culture Highlights */}
            <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Why People Love Working at SANNIDH</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Growth Mindset</h4>
                    <p className="text-cyan-200 text-sm">Continuous learning and career advancement opportunities</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Collaborative Culture</h4>
                    <p className="text-cyan-200 text-sm">Open communication and cross-functional teamwork</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Global Impact</h4>
                    <p className="text-cyan-200 text-sm">Work that transforms compliance for organizations worldwide</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Work-Life Balance</h4>
                    <p className="text-cyan-200 text-sm">Flexible work arrangements and comprehensive benefits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-12">
            <h2 className="text-4xl font-bold text-white mb-8">Awards & Recognition</h2>
            <div className="space-y-8">
              {achievements.map((category, idx) => (
                <Card key={idx} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <Award className="w-6 h-6 text-yellow-500" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {category.awards.map((award, aidx) => (
                        <div key={aidx} className="p-6 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-white text-lg">{award.title}</h4>
                            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                              {award.year}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">{award.authority}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Global Presence */}
          <TabsContent value="locations" className="space-y-12">
            <h2 className="text-4xl font-bold text-white mb-8">Our Global Presence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {officeLocations.map((location, idx) => (
                <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{location.city}</h3>
                        <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                          {location.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-400">{location.employees}</p>
                        <p className="text-xs text-slate-400">Team Members</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-sm">{location.address}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-white mb-2 text-sm">Departments:</h4>
                      <div className="flex flex-wrap gap-2">
                        {location.departments.map((dept, didx) => (
                          <Badge key={didx} className="bg-slate-600/20 text-slate-300 text-xs">
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Established: {location.established}</span>
                      <Button variant="ghost" className="text-cyan-400 hover:text-white hover:bg-slate-700/50 h-auto p-2">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Information */}
            <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Get in Touch</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-semibold text-white mb-3">General Inquiries</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300 text-sm">info@sannidh.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300 text-sm">+91-80-4567-8900</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-3">Sales & Partnerships</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300 text-sm">sales@sannidh.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300 text-sm">+91-80-4567-8901</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-3">Media & Press</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300 text-sm">press@sannidh.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span className="text-slate-300 text-sm">sannidh.com/press</span>
                      </div>
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
          className="mt-20 bg-gradient-to-br from-cyan-900/30 via-slate-800/50 to-blue-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur"
        >
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Be part of the team transforming compliance intelligence worldwide. We're building 
            the future of regulatory technology and looking for passionate individuals to join our journey.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-10 py-4 text-lg">
              <Briefcase className="w-5 h-5 mr-2" />
              View Open Positions
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <Mail className="w-5 h-5 mr-2" />
              Contact Us
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-10 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Company Deck
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div>
              <p className="text-3xl font-bold text-white mb-1">150+</p>
              <p className="text-sm text-slate-400">Team Members</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">4.8/5</p>
              <p className="text-sm text-slate-400">Employee Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">25+</p>
              <p className="text-sm text-slate-400">Industry Awards</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">₹85M</p>
              <p className="text-sm text-slate-400">Company Valuation</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}