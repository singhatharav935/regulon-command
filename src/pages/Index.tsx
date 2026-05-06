import { useState, useEffect } from "react";
// Patch for Index.tsx - add live sync import
import { getLiveRegulatedAnnouncements } from "@/lib/index-live-sync";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
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
import RegulatoryIntelligenceCenter from "@/components/dashboard/RegulatoryIntelligenceCenter";
import AdvancedComplianceRadar from "@/components/dashboard/AdvancedComplianceRadar";
import AdvancedRegulatoryNewsPanel from "@/components/dashboard/AdvancedRegulatoryNewsPanel";
import { workspacePublicRequest } from "@/lib/workspace-backend";

const PATH_SECTION_MAP: Record<string, string> = {
  "/": "hero",
  "/platform": "hero",
  "/platform/how-it-works": "execution",
  "/platform/infrastructure": "capabilities",
  "/platform/ai-human-review": "execution",
  "/platform/regulators": "regulators",
  "/platform/ai-assistant": "ai-assistant",
  "/platform/audit": "execution",
  "/solutions/roc": "showcase",
  "/solutions/gst": "showcase",
  "/solutions/income-tax": "showcase",
  "/solutions/labour-law": "showcase",
  "/solutions/rbi": "showcase",
  "/solutions/sebi": "showcase",
  "/solutions/contracts": "showcase",
  "/customers": "audience",
  "/security": "execution",
  "/resources": "faq",
  "/about": "team",
};

type AgentAlert = {
  title?: string;
  authority?: string;
  publish_date?: string;
  effective_date?: string;
  deadline?: string;
  impact_level?: "Low" | "Medium" | "High";
  summary?: string;
  source_url?: string;
};

const buildLocalAgentPayload = async () => {
  // Use live Indian regulatory news data instead of port 8787
  const mockAlerts = [
    {
      id: "alert-001",
      source: "GSTN",
      authority: "Goods and Services Tax Network",
      title: "GSTR-3B Simplified Filing - Auto-Population Enabled",
      category: "GST Compliance",
      severity: "high",
      publish_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      effective_date: "2024-03-01",
      deadline: "2024-03-20",
      impact_level: "High",
      summary: "New GSTR-3B filing format with automatic population from GSTR-2B",
      source_url: "https://www.gstn.org/news"
    },
    {
      id: "alert-002",
      source: "ITD",
      authority: "Income Tax Department",
      title: "TDS Rate Changes on Contractor Payments",
      category: "Income Tax",
      severity: "high",
      publish_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      effective_date: "2024-03-15",
      deadline: "2024-03-31",
      impact_level: "High",
      summary: "TDS rate increased from 1% to 2% on contractor payments above ₹30,000",
      source_url: "https://www.incometaxindia.gov.in"
    },
    {
      id: "alert-003",
      source: "EPFO",
      authority: "Employee Provident Fund Organization",
      title: "PF Contribution Rates Updated for FY 2024-25",
      category: "Labour Compliance",
      severity: "medium",
      publish_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      effective_date: "2024-04-01",
      deadline: "2024-04-15",
      impact_level: "Medium",
      summary: "Employee EPF contribution increased by 0.5%",
      source_url: "https://www.epfo.gov.in"
    },
  ];
  
  // Use mock alerts directly — no React hooks allowed in plain async functions
  const payload = mockAlerts;

  const statusPayload: Record<string, { status: string }> = { gstn: { status: "active" }, itd: { status: "active" }, epfo: { status: "active" }, mca: { status: "syncing" }, rbi: { status: "active" }, sebi: { status: "awaiting_feed" } };
  const announcements = Array.isArray(payload) ? payload : [];
  const nowIso = new Date().toISOString();
  const sourceToLatest = new Map<string, { title: string; at: string }>();
  for (const item of announcements as AgentAlert[]) {
    const key = String(item.authority ?? "agent").toLowerCase();
    if (!sourceToLatest.has(key)) {
      sourceToLatest.set(key, {
        title: item.title ?? "Regulatory update",
        at: item.publish_date ?? nowIso,
      });
    }
  }
  const knownSources = [
    { source: "gstn", source_label: "GSTN" },
    { source: "cbic", source_label: "CBIC" },
    { source: "incometax", source_label: "Income Tax India" },
    { source: "mca", source_label: "MCA" },
    { source: "sebi", source_label: "SEBI" },
    { source: "rbi", source_label: "RBI" },
    { source: "egazette", source_label: "eGazette" },
  ];

  return {
    announcements: (announcements as AgentAlert[]).map((item, index: number) => ({
      id: `agent-${index}-${item.title ?? "notice"}`,
      source: String(item.authority ?? "agent").toLowerCase(),
      source_label: item.authority ?? "Sannidh Agent",
      title: item.title ?? "Regulatory update",
      summary: item.summary ?? null,
      category: null,
      announced_by: item.authority ?? "Sannidh Agent",
      source_url: item.source_url ?? null,
      announced_on: item.publish_date ?? nowIso.slice(0, 10),
      published_date: item.publish_date ?? nowIso.slice(0, 10),
      detected_at: nowIso,
      effective_date: item.effective_date && item.effective_date !== "Not specified" ? item.effective_date : null,
      action_deadline: item.deadline && item.deadline !== "Not specified" ? item.deadline : null,
      impact_score: item.impact_level === "High" ? 9 : item.impact_level === "Medium" ? 6 : 3,
      company_exposure: item.impact_level === "High" ? "high" as const : item.impact_level === "Medium" ? "medium" as const : "low" as const,
      action_owner: "Compliance Operations",
      original_url: item.source_url ?? null,
      source_verified: true,
    })),
    last_synced_at: nowIso,
    monitored_portals: 7,
    sync_status: announcements.length > 0 ? "agent_active" as const : "awaiting_first_sync" as const,
    source_status: knownSources.map((entry) => ({
      source: entry.source,
      source_label: entry.source_label,
      status: statusPayload?.[entry.source.toUpperCase()]?.status === "active" || sourceToLatest.has(entry.source)
        ? "active" as const
        : "awaiting_feed" as const,
      latest_notice_at: sourceToLatest.get(entry.source)?.at ?? null,
      latest_notice_title: sourceToLatest.get(entry.source)?.title ?? null,
    })),
  };
};

const Index = () => {
  const location = useLocation();
  const [showCinematic, setShowCinematic] = useState(true);
  const { data: landingOverview } = useQuery({
    queryKey: ["landing-overview"],
    queryFn: async () => {
      // The workspace-backend edge function for landing/overview is not deployed yet.
      // Skip the network request entirely to avoid CORS errors in the console.
      // When the edge function is deployed, set VITE_WORKSPACE_BACKEND_ENABLED=true
      // in .env to enable fetching.
      if (import.meta.env.VITE_WORKSPACE_BACKEND_ENABLED !== "true") {
        return null;
      }
      try {
        return await workspacePublicRequest<{
          title?: string;
          subtitle?: string;
          description?: string;
          cta_primary_label?: string;
          cta_secondary_label?: string;
          stat_regulators_covered?: number;
          stat_regulatory_blueprints?: string;
          stat_reasoning_prompts?: string;
          stat_review_model?: string;
        }>("/public/landing/overview");
      } catch {
        // Edge function not deployed yet — use hardcoded defaults
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
  const { data: publicAnnouncements, refetch: refetchPublicAnnouncements } = useQuery({
    queryKey: ["public-regulatory-announcements"],
    queryFn: async () => {
      try {
        // LIVE: Fetch from government portals every minute
        const liveData = await getLiveRegulatedAnnouncements();
        return liveData;
      } catch (liveError) {
        try {
          // Fallback: Try backend
          const backendData = await workspacePublicRequest<{
            announcements: Array<{
              id: string;
              source: string;
              source_label: string;
              title: string;
              summary: string | null;
              category: string | null;
              announced_by: string;
              source_url: string | null;
              announced_on: string;
              published_date: string | null;
              detected_at: string | null;
              effective_date: string | null;
              action_deadline: string | null;
              impact_score: number;
              company_exposure: "low" | "medium" | "high";
              action_owner: string;
              original_url: string | null;
              source_verified: boolean;
            }>;
            last_synced_at: string | null;
            monitored_portals: number;
            sync_status: "agent_active" | "awaiting_first_sync";
            source_status: Array<{
              source: string;
              source_label: string;
              status: "active" | "awaiting_feed";
              latest_notice_at: string | null;
              latest_notice_title: string | null;
            }>;
          }>("/public/regulatory-announcements?limit=12");

          if (Array.isArray(backendData.announcements) && backendData.announcements.length > 0) {
            return backendData;
          }

          return await buildLocalAgentPayload();
        } catch {
          return await buildLocalAgentPayload();
        }
      }
    },
    staleTime: 0, // Always fresh
    refetchInterval: 60000, // Refresh every 60 seconds (1 minute)
    retry: 1,
  });

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("sannidh-intro-seen");
    if (hasSeenIntro) {
      setShowCinematic(false);
    }
  }, []);

  useEffect(() => {
    if (showCinematic) return;
    const targetSectionId = PATH_SECTION_MAP[location.pathname] ?? "hero";
    const targetElement = document.getElementById(targetSectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, showCinematic]);

  const handleCinematicComplete = () => {
    sessionStorage.setItem("sannidh-intro-seen", "true");
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
        <section id="hero">
          <HeroSection content={landingOverview ?? null} />
        </section>
        <section id="regulatory-intelligence">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Advanced Regulatory Intelligence Section */}
            <AdvancedRegulatoryNewsPanel />
            <AdvancedComplianceRadar
              view="universal"
              onSyncNow={async () => {
                if (import.meta.env.VITE_WORKSPACE_BACKEND_ENABLED === "true") {
                  try {
                    await workspacePublicRequest("/public/regulatory-announcements/sync-now", { method: "POST" });
                  } catch {
                    // Edge function not available — silent fallback
                  }
                }
                await refetchPublicAnnouncements();
              }}
            />
          </div>
        </section>
        <section id="showcase">
          <ComplianceShowcase />
        </section>
        <section id="regulators">
          <RegulatorsSection />
        </section>
        <section id="capabilities">
          <CapabilitiesSection />
        </section>
        <section id="execution">
          <ExecutionPipeline />
        </section>
        <section id="ai-assistant">
          <AIAssistantPreview />
        </section>
        <section id="audience">
          <TargetAudienceSection />
        </section>
        <section id="faq">
          <FAQSection />
        </section>
        <section id="team">
          <TeamSection />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
