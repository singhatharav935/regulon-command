import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Inbox, FileText, Scale, Bell, ShieldAlert,
  LogOut, Settings, ChevronLeft, ChevronRight, Zap, RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InhouseLawyerDashboardReal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Company ID from user metadata
  const companyId: string | null = user?.user_metadata?.company_id || null;
  const userId = user?.id || "";

  // Data hooks
  const { data: reviews = [], isLoading: loadingReviews, refetch: refetchReviews } = uselawyerReviewRequests(companyId);
  const { data: contracts = [] } = useLawyerContracts(companyId);
  const { data: cases = [] } = useLawyerCases(companyId);
  const { data: notices = [] } = useLawyerNotices(companyId);
  const { data: risks = [] } = useLawyerRisks(companyId);

  // Computed badge counts
  const pendingReviews = reviews.filter(r => r.review_status === "pending").length;
  const pendingNotices = notices.filter(n => n.status === "pending").length;

  const BADGE_VALUES: Record<string, number> = {
    pendingReviews,
    pendingNotices,
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate("/auth");
  };

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
            companyId={companyId || ""}
            userId={userId}
          />
        );
      case "litigation":
        return (
          <LawyerLitigationTracker
            cases={cases}
            companyId={companyId || ""}
            userId={userId}
          />
        );
      case "notices":
        return (
          <LawyerNoticesInbox
            notices={notices}
            companyId={companyId || ""}
          />
        );
      case "risks":
        return (
          <LawyerRiskRegistry
            risks={risks}
            companyId={companyId || ""}
            userId={userId}
          />
        );
    }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab)!;

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "linear-gradient(135deg, #060B18 0%, #0A0F20 50%, #060B18 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex flex-col shrink-0 border-r border-slate-800/60"
        style={{ background: "#080D1A" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white font-bold text-sm whitespace-nowrap">Legal Hub</p>
                <p className="text-indigo-400 text-xs whitespace-nowrap">In-house Counsel</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.badgeKey ? BADGE_VALUES[tab.badgeKey] : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left relative ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className={`shrink-0 ${isActive ? "text-indigo-400" : ""}`}>
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {badge > 0 && (
                  <span className={`absolute right-2 top-2 min-w-[18px] h-[18px] rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ${sidebarCollapsed ? "right-1 top-1" : ""}`}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-1 border-t border-slate-800/60 pt-4">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all">
            <Settings style={{ width: 18, height: 18 }} />
            {!sidebarCollapsed && <span className="text-sm">Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut style={{ width: 18, height: 18 }} />
            {!sidebarCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-indigo-500 hover:border-indigo-500 transition-all z-10"
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            : <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />}
        </button>
      </motion.aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div>
            <h1 className="text-white font-bold text-xl">{activeTabInfo.label}</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {user?.email || "In-house Counsel"} · Legal Department
            </p>
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
                className="border-slate-700 text-slate-400 hover:text-white"
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {!companyId ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Scale className="w-8 h-8 text-indigo-400/50" />
                  </div>
                  <p className="text-slate-400 font-medium">No company linked to your account</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Ask your company admin to add you as a member in the company settings.
                  </p>
                </div>
              ) : (
                renderContent()
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
