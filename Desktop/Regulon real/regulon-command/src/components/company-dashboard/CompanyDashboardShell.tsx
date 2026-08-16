/**
 * COMPANY DASHBOARD SHELL
 * ========================
 * Horizontal Tab-based navigation shell matching CA Dashboard structure.
 * Used by BOTH:
 *   - Demo Company Dashboard
 *   - Real Company Dashboard
 *
 * Horizontal Tabs:
 *  1. Overview      — Health Score, AI Alerts, Quick Actions
 *  2. Compliance    — Exposure, Gaps, Tasks, Audit, Regulatory Impact
 *  3. News          — Indian Regulatory News & Updates
 *  4. Smart ERP     — Invoices, bills, payroll & reconciliation
 *  5. CFO Intel     — Cash flow, receivables & Virtual CFO insights
 *  6. Documents     — Vault & audit records
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Shield, BarChart3, BrainCircuit,
  FolderOpen, Newspaper
} from "lucide-react";

export type DashboardTab = "overview" | "compliance" | "news" | "erp" | "cfo" | "documents";

interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  badgeColor?: string;
}

export const DASHBOARD_TABS: TabConfig[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Health score & AI alerts",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Shield,
    description: "Filings, gaps & tasks",
    badge: "Live",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  {
    id: "news",
    label: "Regulatory News",
    icon: Newspaper,
    description: "Regulatory updates & law impact",
    badge: "Live",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  {
    id: "erp",
    label: "Smart ERP",
    icon: BarChart3,
    description: "Invoices, bills & payroll",
    badge: "AI",
    badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  },
  {
    id: "cfo",
    label: "CFO Intel",
    icon: BrainCircuit,
    description: "Cash flow & insights",
    badge: "Virtual CFO",
    badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    description: "Vault & audit records",
  },
];

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  companyName: string;
  complianceScore: number;
  healthStatus: "green" | "yellow" | "red" | "unknown";
  alertCount?: number;
  isDemo?: boolean;
  children: React.ReactNode;
}

export function CompanyDashboardShell({
  activeTab,
  onTabChange,
  companyName,
  complianceScore,
  healthStatus,
  alertCount = 0,
  isDemo = false,
  children,
}: Props) {
  const currentTab = DASHBOARD_TABS.find(t => t.id === activeTab)!;

  const scoreColor =
    complianceScore >= 80 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
    complianceScore >= 60 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-red-400 border-red-500/30 bg-red-500/10";

  return (
    <div className="w-full space-y-6">
      {/* ── Top Header Strip & Horizontal Tab Bar (Same Structure as CA Dashboard) ── */}
      <div className="space-y-4">
        {/* Horizontal Navigation Pills Bar */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
            {DASHBOARD_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}

                  {tab.id === "compliance" && alertCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CompanyDashboardShell;
