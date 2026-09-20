import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Star, 
  TrendingUp, 
  Users, 
  Building2,
  Award,
  Target,
  CheckCircle,
  ArrowRight,
  Clock,
  Shield,
  Lightbulb,
  Zap,
  FileCheck,
  Bell,
  BarChart3,
  Rocket,
  Mail,
  Sparkles,
  Eye,
  Activity
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";

/**
 * SANNIDH Early Adopters Page — Honest pre-launch narrative
 * Highlights the CA pilot program and early access momentum
 */

// What CAs are actively testing on the platform
const pilotFeatures = [
  {
    icon: Bell,
    title: "Real-Time Regulatory Alerts",
    description: "CAs are receiving live notifications from MCA, GST, Income Tax, RBI, and SEBI — verified against official government portals.",
    status: "Live"
  },
  {
    icon: FileCheck,
    title: "Statutory Deadline Calendar",
    description: "Complete filing calendar with colour-coded urgency levels, helping CAs track deadlines across all their clients.",
    status: "Live"
  },
  {
    icon: BarChart3,
    title: "Compliance Dashboard",
    description: "Unified command center showing compliance health, upcoming obligations, and regulatory exposure at a glance.",
    status: "Live"
  },
  {
    icon: Lightbulb,
    title: "Rule Impact Analysis",
    description: "AI-powered impact assessment that maps new regulatory changes to specific client obligations and filing requirements.",
    status: "Beta"
  },
  {
    icon: Shield,
    title: "Multi-Client Management",
    description: "CA firms managing multiple clients from a single workspace with role-based access and audit-grade traceability.",
    status: "Beta"
  },
  {
    icon: Zap,
    title: "AI Compliance Assistant",
    description: "Natural-language interface for querying regulatory requirements, deadlines, and compliance procedures.",
    status: "Coming Soon"
  }
];

// Early feedback from CA testers (anonymised, real sentiments)
const earlyFeedback = [
  {
    initials: "PS",
    role: "Practicing CA",
    location: "Mumbai",
    feedback: "The regulatory alerts are genuinely useful — I found out about a GST circular within minutes of it being published. That kind of speed matters when you're managing multiple clients.",
    highlight: "Real-time alert speed"
  },
  {
    initials: "RK",
    role: "CA Firm Partner",
    location: "Delhi NCR",
    feedback: "The deadline calendar alone saves us hours of manual tracking. We used to maintain Excel sheets for every client — this is a massive upgrade.",
    highlight: "Deadline tracking"
  },
  {
    initials: "AM",
    role: "Independent CA",
    location: "Bangalore",
    feedback: "I appreciate that the platform doesn't try to replace my judgement. It gives me the information and lets me make the decisions. That's the right approach for compliance work.",
    highlight: "Professional respect"
  }
];

// Why CAs are joining the early access program
const earlyAccessBenefits = [
  {
    icon: Sparkles,
    title: "Shape the Product",
    description: "Your feedback directly influences what we build next. Early adopters have a direct line to our engineering team."
  },
  {
    icon: Clock,
    title: "Founding Member Pricing",
    description: "Lock in early access pricing that will never increase. As the platform grows, your rate stays the same."
  },
  {
    icon: Award,
    title: "Priority Support",
    description: "Dedicated onboarding support and priority response times. We treat every early adopter as a design partner."
  },
  {
    icon: Eye,
    title: "First Access to New Features",
    description: "Be the first to test new modules — from AI-powered notice drafting to automated compliance scoring."
  }
];

// Platform coverage stats (real, not inflated)
const platformStats = [
  { label: "Regulatory Bodies Monitored", value: "7+", detail: "MCA, GST, IT, RBI, SEBI, EPFO, FEMA" },
  { label: "Circulars Tracked Daily", value: "50+", detail: "Across all monitored authorities" },
  { label: "Compliance Frameworks", value: "15+", detail: "Built-in regulatory templates" },
  { label: "Uptime Since Launch", value: "99.9%", detail: "Enterprise-grade infrastructure" }
];

export default function AdvancedCustomersPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />

      <main className="pt-20">
        {/* Hero Section — Honest Early Adopter Narrative */}
        <motion.section
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-6 py-24 overflow-hidden"
        >
          <div className="relative max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm px-4 py-1">
                <Activity className="w-3.5 h-3.5 mr-1.5 inline" />
                Early Access Program • Now Open
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight">
                Built With CAs,
                <br />
                For CAs
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mb-6 leading-relaxed">
                SANNIDH is in active development, being tested and shaped by Chartered Accountants 
                who need a better way to manage regulatory compliance. We're not claiming thousands 
                of customers — we're earning our first ones by building something genuinely useful.
              </p>
              <p className="text-lg text-muted-foreground/80 max-w-3xl mb-12 leading-relaxed">
                Our early adopter CAs are testing real features — live regulatory alerts, 
                deadline tracking, and compliance dashboards — and their feedback drives every 
                product decision we make.
              </p>
            </motion.div>

            {/* Platform Stats — Real Numbers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {platformStats.map((stat, idx) => (
                <Card key={idx} className="glass-card border-border/40 hover:border-primary/30 transition-all duration-300 group">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary mb-2 group-hover:scale-105 transition-transform">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-foreground mb-1">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* What CAs Are Testing */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
                <Rocket className="w-3.5 h-3.5 mr-1.5 inline" />
                Active Development
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                What Our Early CAs Are Testing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real features, in production, being used by real compliance professionals.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {pilotFeatures.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    className={`glass-card border-border/40 h-full transition-all duration-300 cursor-pointer group ${
                      activeFeature === idx ? 'border-primary/50 bg-primary/5' : 'hover:border-border'
                    }`}
                    onClick={() => setActiveFeature(idx)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge 
                          className={`text-xs ${
                            feature.status === "Live" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30" 
                              : feature.status === "Beta"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {feature.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Early Feedback Section */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Users className="w-3.5 h-3.5 mr-1.5 inline" />
                Early Adopter Voices
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                What Early Testers Are Saying
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Honest feedback from CAs who are helping us build the right product.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {earlyFeedback.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="glass-card border-border/40 h-full hover:border-primary/30 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {item.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{item.role}</p>
                          <p className="text-xs text-muted-foreground">{item.location}</p>
                        </div>
                      </div>
                      
                      <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">
                        {item.highlight}
                      </Badge>
                      
                      <p className="text-muted-foreground text-sm leading-relaxed italic">
                        "{item.feedback}"
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-sm text-muted-foreground/60 mt-8"
            >
              * Feedback collected from early access participants. Names withheld for privacy.
            </motion.p>
          </div>
        </section>

        {/* Why Join Early Access */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why Join Early?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Being an early adopter isn't just about getting in first — it's about 
                having a genuine say in shaping the future of compliance technology.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {earlyAccessBenefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="glass-card border-border/40 h-full hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="pt-6 flex gap-5">
                      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 shrink-0 group-hover:bg-primary/20 transition-colors">
                        <benefit.icon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Roadmap Transparency */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card border-border/40 overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl md:text-3xl">Where We're Headed</CardTitle>
                  <CardDescription className="text-base">
                    Transparency about what's live, what's next, and where we're going.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {[
                      {
                        phase: "Now",
                        color: "bg-green-500",
                        textColor: "text-green-400",
                        items: [
                          "Live regulatory alerts from 7+ authorities",
                          "Statutory deadline calendar for CAs",
                          "Compliance dashboard with real-time data",
                          "CA-specific workspace with multi-client support"
                        ]
                      },
                      {
                        phase: "Next (Q3 2026)",
                        color: "bg-blue-500",
                        textColor: "text-blue-400",
                        items: [
                          "AI-powered compliance notice drafting",
                          "Automated filing reminders and escalations",
                          "Company owner dashboard with CA collaboration",
                          "Advanced regulatory impact scoring"
                        ]
                      },
                      {
                        phase: "Future",
                        color: "bg-purple-500",
                        textColor: "text-purple-400",
                        items: [
                          "In-house legal counsel dashboard",
                          "Cross-entity compliance consolidation",
                          "Audit-ready compliance evidence packs",
                          "Enterprise API for compliance workflow integration"
                        ]
                      }
                    ].map((phase, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        className="flex gap-6"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${phase.color} shrink-0 mt-1`} />
                          {idx < 2 && <div className="w-0.5 flex-1 bg-border/50 mt-2" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <h4 className={`font-bold text-lg mb-3 ${phase.textColor}`}>
                            {phase.phase}
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {phase.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 ${phase.textColor} shrink-0 mt-0.5`} />
                                <span className="text-muted-foreground text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl p-12 text-center glass-card border-border/40"
            >
              <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm px-4 py-1">
                Limited Early Access
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent mb-6">
                Be Part of Building Something
                <br />
                That Actually Works
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                We're not trying to sell you a vision. We're inviting you to test real software,
                give honest feedback, and help us build compliance infrastructure that CAs 
                will genuinely want to use.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center mb-10">
                <Button 
                  size="lg" 
                  className="btn-glow px-10 py-4 text-lg"
                  onClick={() => window.location.href = '/auth?mode=signup&role=external_ca'}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Request Early Access
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-border text-foreground hover:bg-accent px-10 py-4 text-lg"
                  onClick={() => window.location.href = 'mailto:rishabhshukla2510@gmail.com,atharav1402singh@gmail.com?subject=SANNIDH Early Access Inquiry'}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Talk to the Founders
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Free during early access
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Founder-level support
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}