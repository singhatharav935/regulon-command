import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, FileCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type HeroSectionProps = {
  content?: {
    title?: string;
    subtitle?: string;
    description?: string;
    cta_primary_label?: string;
    cta_secondary_label?: string;
    stat_regulators_covered?: number;
    stat_regulatory_blueprints?: string;
    stat_reasoning_prompts?: string;
    stat_review_model?: string;
  } | null;
};

const HeroSection = ({ content }: HeroSectionProps) => {
  const navigate = useNavigate();
  const title = content?.title || "REGULON";
  const subtitle = content?.subtitle || "Compliance & Regulatory Command Platform";
  const description = content?.description ||
    "AI-powered, human-verified regulatory execution for businesses. Complete compliance coverage across MCA, GST, Income Tax, RBI & SEBI.";
  const ctaPrimary = content?.cta_primary_label || "Get Started";
  const ctaSecondary = content?.cta_secondary_label || "Login to Dashboard";
  const statRegulators = typeof content?.stat_regulators_covered === "number" ? content.stat_regulators_covered : 5;
  const statBlueprints = content?.stat_regulatory_blueprints || "10K+";
  const statPrompts = content?.stat_reasoning_prompts || "5K+";
  const statReview = content?.stat_review_model || "CA+Law";

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Enterprise Compliance Infrastructure</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient-primary">{title}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground font-light mb-4"
          >
            {subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-8"
          >
            <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary font-medium">
              {statBlueprints} Regulatory Blueprints
            </span>
            <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary font-medium">
              {statPrompts} Reasoning Prompts
            </span>
            <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary font-medium">
              Advisory · Drafting · Comprehensive
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Button size="lg" className="btn-glow h-12 px-8" onClick={() => navigate("/auth?mode=signup&role=company_owner")}>
              {ctaPrimary}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" onClick={() => navigate("/auth?mode=login&role=company_owner")}>
              {ctaSecondary}
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-8">
              Request Onboarding
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-8">
              Talk to Expert
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{statRegulators}</p>
              <p className="text-sm text-muted-foreground">Regulators Covered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{statBlueprints}</p>
              <p className="text-sm text-muted-foreground">Regulatory Blueprints</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{statPrompts}</p>
              <p className="text-sm text-muted-foreground">Reasoning Prompts</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{statReview}</p>
              <p className="text-sm text-muted-foreground">Verified Review</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
