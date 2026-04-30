import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, TrendingUp, Users } from "lucide-react";

/**
 * Advanced Customers Page
 * Testimonials, case studies, and customer success stories
 */

const testimonials = [
  {
    name: "Rajesh Kumar",
    title: "Chief Compliance Officer",
    company: "ICICI Bank",
    image: "RK",
    quote:
      "SANNIDH reduced our compliance overhead by 70%. We went from manual tracking to fully automated intelligent monitoring. It's transformed how we manage regulatory risk.",
    rating: 5,
    results: ["70% time reduction", "100% deadline accuracy", "500+ alerts/day"],
  },
  {
    name: "Priya Sharma",
    title: "Managing Partner",
    company: "Sharp & Associates (Top CA Firm)",
    image: "PS",
    quote:
      "As a CA firm managing 2000+ clients, SANNIDH is a game-changer. We can now handle 3x more clients without additional compliance staff. Client satisfaction is at an all-time high.",
    rating: 5,
    results: ["3x client growth", "45% satisfaction increase", "2000+ hrs/month saved"],
  },
  {
    name: "Amit Patel",
    title: "General Counsel",
    company: "Reliance Industries",
    image: "AP",
    quote:
      "The platform's AI-powered analysis of regulatory impact is exceptional. It identifies compliance risks we would have missed. This is enterprise-grade compliance intelligence.",
    rating: 5,
    results: ["Zero missed deadlines", "Risk mitigation", "Board-ready reports"],
  },
  {
    name: "Neha Singh",
    title: "Head of Compliance",
    company: "Axis Bank",
    image: "NS",
    quote:
      "Real-time monitoring of all regulatory sources keeps us ahead of changes. The automated task generation and team collaboration features have revolutionized our workflow.",
    rating: 5,
    results: ["Real-time visibility", "Automated workflows", "Team alignment"],
  },
];

const caseStudies = [
  {
    title: "Fortune 500 Bank - Compliance Automation",
    company: "ICICI Bank",
    challenge:
      "Manual compliance tracking across 150+ entities, multiple regulatory domains, spreadsheet-based processes",
    solution: "Implemented SANNIDH for centralized monitoring, automated task generation, team collaboration",
    results: {
      timeSaved: "500 hours/month",
      accuracy: "100%",
      roi: "3.8x",
      adoptionTime: "2 weeks",
    },
    metrics: [
      { label: "Entities Monitored", value: "150+" },
      { label: "Regulatory Domains", value: "7" },
      { label: "Compliance Score", value: "98%" },
      { label: "Cost Saved/Year", value: "₹2.5Cr" },
    ],
  },
  {
    title: "CA Network - Client Portfolio Scaling",
    company: "Sharp & Associates",
    challenge: "Managing compliance for 2000+ clients, manual deadline tracking, limited scalability",
    solution: "Deployed SANNIDH for automated compliance tracking, smart task assignment, client dashboards",
    results: {
      timeSaved: "2000 hours/month",
      accuracy: "99.8%",
      roi: "4.5x",
      adoptionTime: "3 weeks",
    },
    metrics: [
      { label: "Clients Managed", value: "2000+" },
      { label: "CAs Productive", value: "3x more" },
      { label: "Compliance Rate", value: "99.8%" },
      { label: "Revenue Growth", value: "45%" },
    ],
  },
  {
    title: "Legal Firm - Regulatory Intelligence",
    company: "Wadia Ghandy & Co",
    challenge: "Complex regulatory tracking across domains, policy monitoring, legal risk assessment",
    solution: "Integrated SANNIDH for real-time monitoring, impact analysis, integrated legal workflows",
    results: {
      timeSaved: "300 hours/month",
      accuracy: "99.9%",
      roi: "3.2x",
      adoptionTime: "1 week",
    },
    metrics: [
      { label: "Legal Cases Tracked", value: "500+" },
      { label: "Policy Changes", value: "Instant" },
      { label: "Compliance Rate", value: "99.9%" },
      { label: "Client Satisfaction", value: "96%" },
    ],
  },
];

const customerStats = [
  { label: "Active Customers", value: "1000+", icon: "🏢" },
  { label: "Compliance Domains", value: "7", icon: "🌍" },
  { label: "Entities Tracked", value: "50,000+", icon: "📊" },
  { label: "Avg Satisfaction", value: "4.9/5", icon: "⭐" },
];

export default function AdvancedCustomersPage() {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(0);
  const currentCaseStudy = caseStudies[selectedCaseStudy];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-900 to-slate-900 border-b border-slate-700 px-6 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6">Trusted by Industry Leaders</h1>
          <p className="text-xl text-slate-300 max-w-3xl mb-8">
            1000+ organizations across India rely on SANNIDH for intelligent regulatory compliance. See how our
            customers are transforming their compliance operations.
          </p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {customerStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-emerald-900 to-slate-800 border-emerald-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl mb-2">{stat.icon}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-slate-300 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <h2 className="text-4xl font-bold text-white mb-12">Customer Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-800 border-slate-700 h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {testimonial.image}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-400">{testimonial.title}</p>
                        <p className="text-xs text-slate-500">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 mb-3">
                    <Quote className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  </div>
                  <p className="text-slate-300 italic">"{testimonial.quote}"</p>
                  <div className="pt-4 border-t border-slate-700">
                    <div className="space-y-2">
                      {testimonial.results.map((result, ridx) => (
                        <p key={ridx} className="text-sm text-emerald-400 flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                          {result}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Detailed Case Studies */}
        <h2 className="text-4xl font-bold text-white mb-12">Detailed Case Studies</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-white">{currentCaseStudy.title}</h3>
                <Badge className="w-fit bg-emerald-600 text-white">{currentCaseStudy.company}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Challenge, Solution, Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    Challenge
                  </h4>
                  <p className="text-slate-300 text-sm">{currentCaseStudy.challenge}</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Solution
                  </h4>
                  <p className="text-slate-300 text-sm">{currentCaseStudy.solution}</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Results
                  </h4>
                  <p className="text-slate-300 text-sm">
                    Transformation achieved in <strong>{currentCaseStudy.results.adoptionTime}</strong>
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="pt-6 border-t border-slate-700">
                <h4 className="font-bold text-white mb-4">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentCaseStudy.metrics.map((metric, idx) => (
                    <div key={idx} className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-xs mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-emerald-400">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI Breakdown */}
              <div className="pt-6 border-t border-slate-700">
                <h4 className="font-bold text-white mb-4">Business Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-gradient-to-br from-blue-900 to-slate-800 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Time Saved Monthly</p>
                    <p className="text-3xl font-bold text-white">{currentCaseStudy.results.timeSaved}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-900 to-slate-800 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Accuracy Achieved</p>
                    <p className="text-3xl font-bold text-white">{currentCaseStudy.results.accuracy}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-900 to-slate-800 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">ROI</p>
                    <p className="text-3xl font-bold text-white">{currentCaseStudy.results.roi}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Study Selector */}
          <div className="flex gap-4 justify-center mb-8 flex-wrap">
            {caseStudies.map((_, idx) => (
              <Button
                key={idx}
                onClick={() => setSelectedCaseStudy(idx)}
                variant={selectedCaseStudy === idx ? "default" : "outline"}
                className={`${
                  selectedCaseStudy === idx
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-slate-600 text-white hover:bg-slate-700"
                }`}
              >
                {caseStudies[idx].company}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Customer Industries */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Industries We Serve</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: "🏦", name: "Financial Services", clients: "350+" },
              { icon: "⚖️", name: "Legal & Compliance", clients: "180+" },
              { icon: "🏢", name: "Corporate", clients: "200+" },
              { icon: "💼", name: "CA & Tax Firms", clients: "500+" },
            ].map((industry, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl mb-2">{industry.icon}</p>
                  <p className="font-bold text-white">{industry.name}</p>
                  <p className="text-sm text-emerald-400 mt-2">{industry.clients} Customers</p>
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
          className="mt-16 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-lg p-12 text-center border border-emerald-700"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Join 1000+ Successful Organizations</h2>
          <p className="text-lg text-slate-300 mb-8">Transform your compliance operations like our existing customers</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Start Your Success Story
            </Button>
            <Button size="lg" variant="outline" className="border-emerald-600 text-white hover:bg-emerald-950">
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
