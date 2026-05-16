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

// Company information
const companyInfo = {
  founded: "2025",
  headquarters: "India",
  employees: "2-10",
  origin: "India",
};

// Leadership team - only co-founders
const leadershipTeam = [
  {
    name: "Atharav Singh",
    title: "CEO & Co-Founder",
    avatar: "AS", 
    education: "CSE - B.Tech - JIIT Noida",
    expertise: ["Strategic Leadership", "Compliance Technology", "Product Vision"],
    linkedin: "https://www.linkedin.com/in/atharav-singh-chauhan-a14636226/",
    email: "atharav1402singh@gmail.com",
  },
  {
    name: "Rishabh Shukla",
    title: "CTO & Co-Founder", 
    avatar: "RS",
    education: "Integrated CSE - BTech+MTech - JIIT Noida",
    expertise: ["Full-Stack Engineering", "AI & Machine Learning", "System Architecture"],
    linkedin: "https://www.linkedin.com/in/rishabh-shukla-70260231b/",
    email: "rishabhshukla2510@gmail.com",
  },
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
    examples: ["Dedicated onboarding support", "Continuous feature improvements", "24/7 platform availability"]
  },
  {
    value: "Regulatory Excellence",
    icon: <Shield className="w-8 h-8" />,
    description: "We maintain the highest standards of regulatory knowledge and compliance, ensuring our platform exceeds industry requirements.",
    examples: ["Comprehensive Indian compliance coverage", "Real-time regulatory updates", "Built-in audit trails"]
  },
  {
    value: "Inclusive Growth",
    icon: <Users className="w-8 h-8" />, 
    description: "We believe great compliance technology should be accessible to organizations of all sizes, from startups to enterprises.",
    examples: ["Scalable pricing models", "SME-focused features", "Educational resources"]
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
              About SANNIDH
            </Badge>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight">
              Transforming Compliance
              <br />
              Through Intelligence
            </h1>
            <p className="text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Founded by compliance and technology experts, SANNIDH is pioneering the future of 
              regulatory intelligence. We're building India's most advanced AI-powered compliance platform 
              to help businesses navigate complex regulatory landscapes with confidence.
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
          </motion.div>

          {/* Company Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-6"
          >
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{companyInfo.founded}</p>
                <p className="text-sm font-medium text-white mb-1">Founded</p>
                <p className="text-xs text-slate-400">Building the Future</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">{companyInfo.employees}</p>
                <p className="text-sm font-medium text-white mb-1">Team Members</p>
                <p className="text-xs text-slate-400">Passionate Builders</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-2">🇮🇳</p>
                <p className="text-sm font-medium text-white mb-1">Indian Originated</p>
                <p className="text-xs text-slate-400">Made in India</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Tabbed Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700 mb-12 h-14">
            <TabsTrigger value="story" className="text-white data-[state=active]:bg-cyan-600">
              Vision & Mission
            </TabsTrigger>
            <TabsTrigger value="team" className="text-white data-[state=active]:bg-cyan-600">
              Leadership Team
            </TabsTrigger>
            <TabsTrigger value="values" className="text-white data-[state=active]:bg-cyan-600">
              Values & Culture
            </TabsTrigger>
          </TabsList>

          {/* Vision & Mission */}
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
          </TabsContent>

          {/* Leadership Team */}
          <TabsContent value="team" className="space-y-12">
            <h2 className="text-4xl font-bold text-white mb-8">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {leadershipTeam.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
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

                      <div className="flex gap-3 mt-6">
                        <Button 
                          variant="outline" 
                          className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                          onClick={() => window.open(member.linkedin, '_blank', 'noopener,noreferrer')}
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-slate-600 text-white hover:bg-slate-700"
                          onClick={() => window.open(`mailto:${member.email}`, '_self')}
                        >
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
                    <h4 className="font-semibold text-white mb-2">Real Impact</h4>
                    <p className="text-cyan-200 text-sm">Work that transforms compliance for organizations across India</p>
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
            Be part of the team transforming compliance intelligence in India. We're building 
            the future of regulatory technology and looking for passionate individuals to join our journey.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-10 py-4 text-lg">
              <Briefcase className="w-5 h-5 mr-2" />
              View Open Positions
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg"
              onClick={() => window.open('mailto:rishabhshukla2510@gmail.com', '_self')}
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Us
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}