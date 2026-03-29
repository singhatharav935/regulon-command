import { useState, useEffect } from "react";
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
  const [alertsResponse, statusResponse] = await Promise.all([
    fetch("http://localhost:8787/alerts"),
    fetch("http://localhost:8787/sources/status"),
  ]);
  const payload = await alertsResponse.json().catch(() => []);
  const statusPayload = await statusResponse.json().catch(() => ({} as Record<string, { status?: string }>));
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
      source_label: item.authority ?? "Regulon Agent",
      title: item.title ?? "Regulatory update",
      summary: item.summary ?? null,
      category: null,
      announced_by: item.authority ?? "Regulon Agent",
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
  const { data: publicAnnouncements, refetch: refetchPublicAnnouncements } = useQuery({
    queryKey: ["public-regulatory-announcements"],
    queryFn: async () => {
      try {
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
    },
    staleTime: 60_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("regulon-intro-seen");
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
        <section id="hero">
          <HeroSection content={landingOverview ?? null} />
        </section>
        <section id="regulatory-intelligence">
          <div className="container mx-auto px-4 max-w-7xl">
            <RegulatoryIntelligenceCenter
              view="universal"
              updates={(publicAnnouncements?.announcements ?? []).map((item) => ({
                id: item.id,
                source: item.source,
                sourceLabel: item.source_label,
                title: item.title,
                summary: item.summary,
                category: item.category,
                announcedBy: item.announced_by,
                announcedOn: item.announced_on,
                effectiveDate: item.effective_date,
                actionDeadline: item.action_deadline,
                impactScore: Number(item.impact_score ?? 0),
                companyExposure: item.company_exposure,
                actionOwner: item.action_owner,
                sourceVerified: item.source_verified,
                originalUrl: item.source_url ?? item.original_url,
              }))}
              lastSyncedAt={publicAnnouncements?.last_synced_at ?? null}
              monitoredPortals={publicAnnouncements?.monitored_portals ?? 12}
              syncStatus={publicAnnouncements?.sync_status ?? "awaiting_first_sync"}
              sourceStatus={(publicAnnouncements?.source_status ?? []).map((item) => ({
                source: item.source,
                sourceLabel: item.source_label,
                status: item.status,
                latestNoticeAt: item.latest_notice_at,
                latestNoticeTitle: item.latest_notice_title,
              }))}
              onSyncNow={async () => {
                try {
                  await workspacePublicRequest("/public/regulatory-announcements/sync-now", { method: "POST" });
                } catch {
                  await fetch("http://localhost:8787/sync-now", { method: "POST" });
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
