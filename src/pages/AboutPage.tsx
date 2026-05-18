import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Target,
  Rocket,
  Shield,
  Code,
  Mail,
  Linkedin,
  CheckCircle,
  Zap,
  Eye,
  Scale,
  Users,
  Heart,
  GraduationCap,
  Lightbulb,
  Globe
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";

/**
 * SANNIDH About Page — Honest pre-launch startup story
 * Real founders, real mission, no inflated numbers
 */

// The founding team — real people
const founders = [
  {
    name: "Atharav Singh",
    title: "CEO & Co-Founder",
    avatar: "AS",
    education: "CSE - B.Tech - JIIT Noida",
    bio: "Drives the product vision and business strategy. Passionate about making regulatory compliance accessible to every CA and business in India.",
    expertise: ["Product Strategy", "Compliance Domain", "Business Development"],
    linkedin: "https://www.linkedin.com/in/atharav-singh-chauhan-a14636226/",
    email: "atharav1402singh@gmail.com",
  },
  {
    name: "Rishabh Shukla",
    title: "CTO & Co-Founder",
    avatar: "RS",
    education: "Integrated CSE - BTech+MTech - JIIT Noida",
    bio: "Architects the entire platform — from AI regulatory engines to the real-time compliance dashboards. Believes great technology should feel effortless.",
    expertise: ["Full-Stack Engineering", "AI & Machine Learning", "System Architecture"],
    linkedin: "https://www.linkedin.com/in/rishabh-shukla-70260231b/",
    email: "rishabhshukla2510@gmail.com",
  },
];

// Why we're building SANNIDH — the honest story
const whyPoints = [
  {
    icon: Scale,
    title: "Compliance Is Broken for Most Businesses",
    description: "Indian businesses face 1,500+ regulatory changes every year. Most CAs still track deadlines in Excel sheets and scan government portals manually. We believe technology should handle the monitoring — so professionals can focus on advisory."
  },
  {
    icon: Zap,
    title: "CAs Deserve Better Tools",
    description: "Chartered Accountants are the backbone of Indian compliance. Yet the tools available to them haven't evolved in decades. SANNIDH is being built hand-in-hand with practicing CAs to create software they actually want to use."
  },
  {
    icon: Shield,
    title: "AI Should Assist, Not Replace",
    description: "We're not building AI that files returns or gives legal opinions. We're building AI that monitors, alerts, and organises — so licensed professionals can make better decisions faster. The human always has the final say."
  }
];

// What SANNIDH actually is today
const whatWeveBuilt = [
  {
    label: "Real-time regulatory monitoring across 7+ Indian authorities",
    done: true
  },
  {
    label: "Statutory deadline calendar with urgency colour-coding",
    done: true
  },
  {
    label: "Live compliance dashboard for CA workflows",
    done: true
  },
  {
    label: "Rule impact analysis engine for new regulatory changes",
    done: true
  },
  {
    label: "Multi-client workspace for CA firms",
    done: true
  },
  {
    label: "AI-powered notice drafting assistant",
    done: false
  },
  {
    label: "Automated filing reminders & escalations",
    done: false
  },
  {
    label: "Company owner dashboard with CA collaboration",
    done: false
  }
];

// Core principles — not generic corporate values
const principles = [
  {
    icon: Eye,
    title: "Transparency Over Optics",
    description: "We won't claim thousands of customers when we have a handful. We won't show fake testimonials from ICICI Bank. What you see on this site is what we actually are — an early-stage startup building something real."
  },
  {
    icon: Lightbulb,
    title: "Build With Users, Not For Them",
    description: "Every feature in SANNIDH has been shaped by direct conversations with CAs. We don't build in a vacuum — our early adopters have a direct line to our engineering team."
  },
  {
    icon: Code,
    title: "Engineering Quality Matters",
    description: "We don't ship half-baked features. Every component is built with production-grade architecture — from type-safe APIs to real-time data pipelines. The foundation matters more than speed."
  },
  {
    icon: Heart,
    title: "Accessible Pricing",
    description: "Great compliance tools shouldn't be enterprise-only. We're committed to building pricing that works for solo practitioners and small firms, not just large corporations."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
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
              <Badge className="mb-6 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm px-4 py-1">
                About SANNIDH
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight">
                Two Engineers.
                <br />
                One Problem Worth Solving.
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mb-6 leading-relaxed">
                SANNIDH started from a simple observation: Chartered Accountants — the people who 
                keep Indian businesses compliant — are drowning in manual work that technology 
                should be handling. We're building the tool they've been asking for.
              </p>
              <p className="text-lg text-muted-foreground/80 max-w-3xl leading-relaxed">
                Founded in 2025. Based in India. Currently in early access with practicing CAs.
              </p>
            </motion.div>

            {/* Quick facts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4 mt-12 max-w-2xl"
            >
              <Card className="glass-card border-border/40 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-1 group-hover:scale-105 transition-transform">2025</p>
                  <p className="text-sm text-muted-foreground">Founded</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/40 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-1 group-hover:scale-105 transition-transform">🇮🇳</p>
                  <p className="text-sm text-muted-foreground">Made in India</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/40 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-1 group-hover:scale-105 transition-transform">
                    <Globe className="w-8 h-8 inline" />
                  </p>
                  <p className="text-sm text-muted-foreground">Early Access</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Why We're Building This */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why SANNIDH Exists
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The problem is real, and we've seen it first-hand.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {whyPoints.map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="glass-card border-border/40 h-full hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-5 group-hover:bg-primary/20 transition-colors">
                        <point.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-3">{point.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {point.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Founders */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Users className="w-3.5 h-3.5 mr-1.5 inline" />
                The Team
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Who's Building This
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Two engineers from JIIT Noida who decided compliance technology needed a rewrite from scratch.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {founders.map((founder, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="glass-card border-border/40 h-full hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                            {founder.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold mb-1">{founder.name}</h3>
                        <p className="text-primary font-semibold text-sm">{founder.title}</p>
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed mb-5 text-center">
                        {founder.bio}
                      </p>

                      <div className="mb-5">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {founder.expertise.map((skill, sidx) => (
                            <Badge key={sidx} className="bg-primary/10 text-primary border-primary/20 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mb-5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {founder.education}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="border-border text-foreground hover:bg-accent flex-1"
                          onClick={() => window.open(founder.linkedin, '_blank', 'noopener,noreferrer')}
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </Button>
                        <Button
                          variant="outline"
                          className="border-border text-foreground hover:bg-accent"
                          onClick={() => { window.location.href = `mailto:rishabhshukla2510@gmail.com,atharav1402singh@gmail.com`; }}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What We've Built So Far */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card border-border/40 overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl md:text-3xl">What We've Built So Far</CardTitle>
                  <CardDescription className="text-base">
                    Honest progress — what's live, and what's coming next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {whatWeveBuilt.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                          item.done ? 'text-green-400' : 'text-muted-foreground/30'
                        }`} />
                        <div>
                          <span className={`text-sm ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {item.label}
                          </span>
                          {!item.done && (
                            <Badge className="ml-2 bg-muted text-muted-foreground border-border text-[10px] px-1.5">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Our Principles */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How We Think
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Not corporate values on a poster. Actual principles that drive our daily decisions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {principles.map((principle, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="glass-card border-border/40 h-full hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="pt-6 flex gap-5">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 shrink-0 group-hover:bg-primary/20 transition-colors">
                        <principle.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{principle.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {principle.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent mb-6">
                Interested? Let's Talk.
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                Whether you're a CA looking for better tools, an investor interested in compliance tech,
                or an engineer who wants to build something meaningful — we'd love to hear from you.
              </p>

              <div className="flex flex-wrap gap-4 justify-center mb-10">
                <Button
                  size="lg"
                  className="btn-glow px-10 py-4 text-lg"
                  onClick={() => window.location.href = '/auth?mode=signup&role=external_ca'}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Try SANNIDH
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent px-10 py-4 text-lg"
                  onClick={() => window.location.href = 'mailto:rishabhshukla2510@gmail.com,atharav1402singh@gmail.com?subject=Hello from the SANNIDH About Page'}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email the Founders
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  No sales pitch
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Founders respond personally
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Free during early access
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