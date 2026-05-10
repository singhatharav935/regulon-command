import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Inbox, FileText, Scale, Bell, ShieldAlert,
  Settings, ChevronRight, Menu, X, Zap, RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  uselawyerReviewRequests,
  useLawyerContracts,
  useLawyerCases,
  useLawyerNotices,
  useLawyerRisks,
} from "@/hooks/useInhouseLawyerData";
import LawyerDashboardHome from "@/components/lawyer-dashboard/LawyerDashboardHome";
import DraftReviewInbox from "@/components/lawyer-dashboard/DraftReviewInbox";
import LawyerContractManagement from "@/components/lawyer-dashboard/LawyerContractManagement";
import LawyerLitigationTracker from "@/components/lawyer-dashboard/LawyerLitigationTracker";
import LawyerNoticesInbox from "@/components/lawyer-dashboard/LawyerNoticesInbox";
import LawyerRiskRegistry from "@/components/lawyer-dashboard/LawyerRiskRegistry";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "home" | "reviews" | "contracts" | "litigation" | "notices" | "risks";

const TABS: {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<any>;
  badgeKey?: string;
}[] = [
  { id: "home",      label: "Dashboard",     shortLabel: "Home",      icon: LayoutDashboard },
  { id: "reviews",   label: "Draft Reviews", shortLabel: "Reviews",   icon: Inbox,       badgeKey: "pendingReviews" },
  { id: "contracts", label: "Contracts",     shortLabel: "Contracts", icon: FileText },
  { id: "litigation",label: "Litigation",    shortLabel: "Cases",     icon: Scale },
  { id: "notices",   label: "Legal Notices", shortLabel: "Notices",   icon: Bell,        badgeKey: "pendingNotices" },
  { id: "risks",     label: "Risk Registry", shortLabel: "Risks",     icon: ShieldAlert },
];

// ─── Hook: resolve company ID for the current user ────────────────────────────
// Priority: user_metadata.company_id → company_members lookup → null (user-scoped)
function useUserCompanyId(userId: string | undefined): {
  companyId: string | null;
  resolvedScope: "company" | "user" | "none";
  isResolving: boolean;
} {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [resolvedScope, setResolvedScope] = useState<"company" | "user" | "none">("none");
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsResolving(false);
      return;
    }

    const resolve = async () => {
      setIsResolving(true);
      try {
        // 1. Check company_members table first
        const { data: membership } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (membership?.company_id) {
          setCompanyId(membership.company_id);
          setResolvedScope("company");
          return;
        }
        // 2. Fall back — user has no company yet; scope by user_id
        // We pass userId as a "virtual company ID" so queries use created_by = userId
        setCompanyId(null);
        setResolvedScope("user");
      } catch {
        setCompanyId(null);
        setResolvedScope("user");
      } finally {
        setIsResolving(false);
      }
    };

    void resolve();
  }, [userId]);

  return { companyId, resolvedScope, isResolving };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InhouseLawyerDashboardReal() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auth guard — redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Resolve company ID: company_members → user-scoped fallback
  const userId = user?.id || "";
  const { companyId, resolvedScope, isResolving: companyResolving } = useUserCompanyId(userId || undefined);

  // Effective scope: use companyId if available, otherwise scope by userId directly
  const effectiveCompanyId = companyId; // null = user-scoped (hooks handle this)
  const effectiveUserId = userId;

  // Data hooks — all gracefully handle null companyId by querying by created_by instead
  const { data: reviews = [], isLoading: loadingReviews, refetch: refetchReviews } = uselawyerReviewRequests(effectiveCompanyId);
  const { data: contracts = [] } = useLawyerContracts(effectiveCompanyId, effectiveUserId);
  const { data: cases = [] } = useLawyerCases(effectiveCompanyId, effectiveUserId);
  const { data: notices = [] } = useLawyerNotices(effectiveCompanyId, effectiveUserId);
  const { data: risks = [] } = useLawyerRisks(effectiveCompanyId, effectiveUserId);

  // Computed badge counts
  const pendingReviews = reviews.filter(r => r.review_status === "pending").length;
  const pendingNotices = notices.filter(n => n.status === "pending").length;

  const BADGE_VALUES: Record<string, number> = { pendingReviews, pendingNotices };

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground text-sm">Loading Legal Hub…</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // Redirect handled by useEffect above

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <LawyerDashboardHome
            reviews={reviews}
            contracts={contracts}
            cases={cases}
            notices={notices}
            risks={risks}
          />
        );
      case "reviews":
        return (
          <DraftReviewInbox
            requests={reviews}
            companyId={companyId || ""}
            isLoading={loadingReviews}
          />
        );
      case "contracts":
        return (
          <LawyerContractManagement
            contracts={contracts}
            companyId={effectiveCompanyId || ""}
            userId={effectiveUserId}
          />
        );
      case "litigation":
        return (
          <LawyerLitigationTracker
            cases={cases}
            companyId={effectiveCompanyId || ""}
            userId={effectiveUserId}
          />
        );
      case "notices":
        return (
          <LawyerNoticesInbox
            notices={notices}
            companyId={effectiveCompanyId || ""}
          />
        );
      case "risks":
        return (
          <LawyerRiskRegistry
            risks={risks}
            companyId={effectiveCompanyId || ""}
            userId={effectiveUserId}
          />
        );
    }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Shared Navbar — matches all other dashboards */}
      <Navbar />

      {/* Dashboard body — sidebar + main content below navbar */}
      <div className="flex flex-1 pt-20 overflow-hidden" style={{ minHeight: 'calc(100vh - 5rem)' }}>

        {/* ── Sidebar ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex flex-col bg-card/60 backdrop-blur-md border-r border-border/40 overflow-hidden shrink-0 z-30"
            >
              {/* Branding Header */}
              <div className="px-4 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground font-bold text-sm leading-tight truncate">Legal Hub</p>
                    <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-semibold">In-house Counsel</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const badge = tab.badgeKey ? BADGE_VALUES[tab.badgeKey] : 0;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/80"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`} style={{ width: 18, height: 18 }} />
                      <span className="truncate">{tab.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                      {badge > 0 && (
                        <span className="absolute right-2 top-2 min-w-[18px] h-[18px] rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Settings only — Sign Out removed (handled by Navbar) */}
              <div className="px-3 pb-4 pt-3 border-t border-border/30">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all text-sm"
                >
                  <Settings style={{ width: 18, height: 18 }} />
                  <span>Settings</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Sub-header bar */}
          <header className="flex items-center justify-between px-6 h-14 bg-card/40 backdrop-blur-xl border-b border-border/30 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(s => !s)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div>
                <h1 className="text-foreground font-bold text-lg">{activeTabInfo.label}</h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {user?.email || "In-house Counsel"} · Legal Department
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Live</span>
              </div>

              {activeTab === "reviews" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/40 text-muted-foreground hover:text-foreground"
                  onClick={() => refetchReviews()}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Refresh
                </Button>
              )}

              {pendingReviews > 0 && activeTab !== "reviews" && (
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-300 text-xs font-medium">
                    {pendingReviews} pending review{pendingReviews > 1 ? "s" : ""}
                  </span>
                </button>
              )}
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Scope notice for user without company */}
            {!companyResolving && resolvedScope === "user" && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <span className="text-amber-400 text-lg">⚠️</span>
                <div>
                  <p className="text-amber-300 text-sm font-medium">Personal Workspace Mode</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">
                    You're not linked to a company yet — showing your personal data. Ask your company admin to add you to the company, or contact support.
                  </p>
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
