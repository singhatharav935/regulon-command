import { useState, useEffect } from "react";
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
import BackgroundEffects from "@/components/BackgroundEffects";

const Index = () => {
  const [showCinematic, setShowCinematic] = useState(true);

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
        <HeroSection />
        <ComplianceShowcase />
        <RegulatorsSection />
        <CapabilitiesSection />
        <ExecutionPipeline />
        <AIAssistantPreview />
        <TargetAudienceSection />
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
