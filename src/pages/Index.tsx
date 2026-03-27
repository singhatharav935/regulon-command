import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import CinematicEntry from "@/components/CinematicEntry";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/platform/HeroSection";
import RegulatorsSection from "@/components/platform/RegulatorsSection";
import CapabilitiesSection from "@/components/platform/CapabilitiesSection";
import ExecutionPipeline from "@/components/platform/ExecutionPipeline";
import AIAssistantPreview from "@/components/platform/AIAssistantPreview";
import TargetAudienceSection from "@/components/platform/TargetAudienceSection";
import TeamSection from "@/components/platform/TeamSection";
import ComplianceShowcase from "@/components/platform/ComplianceShowcase";
import FAQSection from "@/components/platform/FAQSection";
import BackgroundEffects from "@/components/BackgroundEffects";
import { workspacePublicRequest } from "@/lib/workspace-backend";

const Index = () => {
  const [showCinematic, setShowCinematic] = useState(true);
  const { data: landingOverview } = useQuery({
    queryKey: ["landing-overview"],
    queryFn: async () =>
      workspacePublicRequest<{
        title?: string;
        subtitle?: string;
        description?: string;
        cta_primary_label?: string;
        cta_secondary_label?: string;
        stat_regulators_covered?: number;
        stat_regulatory_blueprints?: string;
        stat_reasoning_prompts?: string;
        stat_review_model?: string;
      }>("/public/landing/overview"),
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("regulon-intro-seen");
    if (hasSeenIntro) {
      setShowCinematic(false);
    }
  }, []);

  const handleCinematicComplete = () => {
    sessionStorage.setItem("regulon-intro-seen", "true");
    setShowCinematic(false);
  };

  if (showCinematic) {
    return <CinematicEntry onComplete={handleCinematicComplete} />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />
      <main>
        <HeroSection content={landingOverview ?? null} />
        <ComplianceShowcase />
        <RegulatorsSection />
        <CapabilitiesSection />
        <ExecutionPipeline />
        <AIAssistantPreview />
        <TargetAudienceSection />
        <FAQSection />
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
