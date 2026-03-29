import { motion } from "framer-motion";
import { Play, Users, FileCheck, ArrowRight, CheckCircle, AlertCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import complianceMeetingImage from "@/assets/compliance-meeting.jpg";
import registrationDemoVideo from "@/assets/registration-demo.mp4";

const IndianRegulatoryFrameworks = [
  { name: "GST Compliance", icon: "📋", color: "from-blue-500 to-blue-600", coverage: "All States" },
  { name: "Income Tax India", icon: "💰", color: "from-green-500 to-green-600", coverage: "Central" },
  { name: "Labour Compliance", icon: "👷", color: "from-orange-500 to-orange-600", coverage: "State Level" },
  { name: "MCA Regulations", icon: "🏢", color: "from-purple-500 to-purple-600", coverage: "Corporate" },
  { name: "RBI Guidelines", icon: "🏦", color: "from-red-500 to-red-600", coverage: "Financial" },
  { name: "SEBI Standards", icon: "📊", color: "from-amber-500 to-amber-600", coverage: "Securities" },
];

const ComplianceShowcase = () => {
  const navigate = useNavigate();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedFramework, setSelectedFramework] = useState(0);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <section className="py-24 relative bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Expert Collaboration</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Where Business Meets <span className="text-gradient-primary">Compliance Excellence</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Master Indian regulatory compliance across 7 government authorities. Our AI-powered platform 
            monitors GST, Income Tax, Labour Laws, MCA, RBI, SEBI, and eGazette in real-time, ensuring 
            your organization stays compliant with the latest regulatory changes.
          </p>
        </motion.div>

        {/* Indian Regulatory Frameworks Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16"
        >
          {IndianRegulatoryFrameworks.map((framework, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="glass-card p-4 cursor-pointer border border-border/50 hover:border-primary/50 transition-all"
              onClick={() => setSelectedFramework(index)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{framework.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{framework.name}</p>
                  <p className="text-xs text-muted-foreground">{framework.coverage}</p>
                </div>
              </div>
              {selectedFramework === index && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Badge variant="outline" className="text-xs">Currently Monitoring</Badge>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Compliance Meeting Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group"
          >
            <div className="glass-card overflow-hidden">
              <div className="relative">
                <img
                  src={complianceMeetingImage}
                  alt="Compliance meeting with CAs and Lawyers"
                  className="w-full h-[400px] object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">
                      Active Compliance Review
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Expert Review Sessions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Dedicated CA & Legal teams review every compliance action before execution, 
                    ensuring 100% accuracy and regulatory adherence across all 7 Indian government authorities.
                  </p>
                  
                  {/* Stats */}
                  <div className="flex gap-6 mt-4 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-2xl font-bold text-primary">500+</p>
                      <p className="text-xs text-muted-foreground">Reviews/Month</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">100%</p>
                      <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">24hrs</p>
                      <p className="text-xs text-muted-foreground">Avg. Turnaround</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Regulatory Monitoring Video */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative group"
          >
            <div className="glass-card overflow-hidden">
              <div className="relative">
                <video
                  ref={videoRef}
                  src={registrationDemoVideo}
                  className="w-full h-[400px] object-cover"
                  loop
                  muted
                  playsInline
                  onEnded={() => setIsVideoPlaying(false)}
                />
                
                {/* Play button overlay */}
                {!isVideoPlaying && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <motion.button
                      onClick={handlePlayVideo}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                    </motion.button>
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">
                      Live Regulatory Monitoring
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Real-Time Indian Compliance Alerts
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor GST, Income Tax, Labour Laws, MCA, RBI, SEBI updates in real-time. 
                    Get instant notifications when new regulatory changes are announced. Avg. detection time: under 2 minutes.
                  </p>
                  
                  <Button 
                    className="mt-4 btn-glow"
                    onClick={() => navigate("/auth?mode=signup&role=company_owner")}
                  >
                    Start Your Journey
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Indian Compliance Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card p-8 mb-16 border border-border/50"
        >
          <h3 className="text-2xl font-bold mb-8 text-center">Why Indian Organizations Choose REGULON</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <CheckCircle className="w-6 h-6 text-primary" />,
                title: "7 Government Sources",
                desc: "Monitor GSTN, CBIC, Income Tax, MCA, RBI, SEBI, eGazette simultaneously"
              },
              {
                icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
                title: "Instant Alerts",
                desc: "Get notified within 2 minutes of any regulatory change announcement"
              },
              {
                icon: <FileCheck className="w-6 h-6 text-green-500" />,
                title: "Compliance Automation",
                desc: "Auto-generate tasks, deadlines, and impact assessments for your team"
              },
              {
                icon: <Briefcase className="w-6 h-6 text-blue-500" />,
                title: "Expert Review",
                desc: "CA & Legal review before execution ensures 100% compliance accuracy"
              }
            ].map((benefit, index) => (
              <motion.div key={index} whileHover={{ y: -5 }} className="text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold mb-2">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <div className="glass-card inline-block px-8 py-6">
            <p className="text-muted-foreground mb-4 font-semibold">
              Ready to transform your Indian compliance workflow?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="btn-glow" onClick={() => navigate("/auth?mode=signup&role=company_owner")}>
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                View Live Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComplianceShowcase;
