import { motion } from "framer-motion";
import { Play, Users, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import complianceMeetingImage from "@/assets/compliance-meeting.jpg";
import registrationDemoVideo from "@/assets/registration-demo.mp4";

const ComplianceShowcase = () => {
  const navigate = useNavigate();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our team of Chartered Accountants and Lawyers work directly with your leadership 
            to ensure seamless regulatory compliance across all domains.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
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
                    ensuring 100% accuracy and regulatory adherence.
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

          {/* Registration Demo Video */}
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
                    <FileCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">
                      Quick Onboarding
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Get Started in Minutes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Watch how easy it is to register your company and select compliance 
                    services tailored to your regulatory requirements.
                  </p>
                  
                  <Button 
                    className="mt-4 btn-glow"
                    onClick={() => navigate("/auth?mode=signup")}
                  >
                    Start Your Journey
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="glass-card inline-block px-8 py-6">
            <p className="text-muted-foreground mb-4">
              Ready to transform your compliance workflow?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="btn-glow" onClick={() => navigate("/auth?mode=signup")}>
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                View Demo Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComplianceShowcase;
