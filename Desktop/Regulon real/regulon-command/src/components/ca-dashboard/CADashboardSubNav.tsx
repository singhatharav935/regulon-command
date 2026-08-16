/**
 * CADashboardSubNav — Premium Sticky Sidebar Navigation
 *
 * Enterprise-grade left sidebar for the Real External CA Dashboard.
 * 4 professional zones:
 *  1. Command Center  — Alerts, AI Briefs, Deadlines, News
 *  2. AI Swarm Control — Agent deployment, Logs, Portal sync
 *  3. Client Vault    — Portfolio, Onboarding, Tasks
 *  4. Firm Operations — Billing, Analytics, Audit, Comms
 *
 * AI Drafting Engine is a global slide-up drawer — accessible from ALL zones.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Users,
  BarChart3,
  Zap,
  Radio,
  CreditCard,
  Settings,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CADashboardZone = "command" | "ai-swarm" | "clients" | "operations";

interface NavItem {
  id: CADashboardZone;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: string;
  accentColor: string;
  activeBg: string;
  activeBorder: string;
  activeGlow: string;
}

// ─── Nav Configuration ───────────────────────────────────────────────────────

const navItems: NavItem[] = [
  {
    id: "command",
    label: "Command Center",
    sublabel: "Alerts · Briefs · Deadlines",
    icon: LayoutDashboard,
    accentColor: "text-cyan-400",
    activeBg: "bg-cyan-500/10",
    activeBorder: "border-cyan-500/40",
    activeGlow: "shadow-[0_0_20px_-4px_rgba(6,182,212,0.3)]",
  },
  {
    id: "ai-swarm",
    label: "AI Swarm Control",
    sublabel: "Agents · Deploy · Sync",
    icon: Bot,
    badge: "LIVE",
    accentColor: "text-purple-400",
    activeBg: "bg-purple-500/10",
    activeBorder: "border-purple-500/40",
    activeGlow: "shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]",
  },
  {
    id: "clients",
    label: "Client Vault",
    sublabel: "Portfolio · Onboarding",
    icon: Users,
    accentColor: "text-indigo-400",
    activeBg: "bg-indigo-500/10",
    activeBorder: "border-indigo-500/40",
    activeGlow: "shadow-[0_0_20px_-4px_rgba(99,102,241,0.3)]",
  },
  {
    id: "operations",
    label: "Firm Operations",
    sublabel: "Billing · Analytics · Docs",
    icon: BarChart3,
    accentColor: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-emerald-500/40",
    activeGlow: "shadow-[0_0_20px_-4px_rgba(52,211,153,0.3)]",
  },
];

// ─── Helper to get tailwind bg class from text class ─────────────────────────

const accentBg = (accentColor: string) =>
  accentColor.replace("text-", "bg-").replace("-400", "-500");

// ─── Props ───────────────────────────────────────────────────────────────────

interface CADashboardSubNavProps {
  activeZone: CADashboardZone;
  onZoneChange: (zone: CADashboardZone) => void;
  onOpenDraftingEngine: () => void;
  /** Number of pending approvals to show on Command Center badge */
  pendingApprovals?: number;
  /** CA's credit balance from backend */
  creditBalance?: number;
  /** CA's name to display in the sidebar header */
  caName?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const CADashboardSubNav: React.FC<CADashboardSubNavProps> = ({
  activeZone,
  onZoneChange,
  onOpenDraftingEngine,
  pendingApprovals = 0,
  creditBalance,
  caName,
}) => {
  const navigate = useNavigate();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-[220px] shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)] flex flex-col gap-1.5 overflow-y-auto pb-4"
    >

      {/* ── Firm Identity Header ─────────────────────────────────────── */}
      <div className="px-3 mb-3 pb-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              {caName || "CA Workspace"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] text-green-400 font-medium">Live · Authenticated</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Label ────────────────────────────────────────────── */}
      <p className="px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
        Navigation
      </p>

      {/* ── Zone Navigation ──────────────────────────────────────────── */}
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeZone === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onZoneChange(item.id)}
            className={`
              group relative w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl border
              transition-all duration-200 overflow-hidden
              ${isActive
                ? `${item.activeBg} ${item.activeBorder} ${item.activeGlow}`
                : "border-transparent hover:bg-card/50 hover:border-border/30"
              }
            `}
          >
            {/* Active left accent bar */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  key={item.id + "-bar"}
                  layoutId="navActiveBar"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${accentBg(item.accentColor)}`}
                />
              )}
            </AnimatePresence>

            {/* Icon */}
            <div
              className={`
                p-2 rounded-lg shrink-0 transition-all duration-200
                ${isActive ? item.activeBg + " border " + item.activeBorder : "bg-card/40 group-hover:bg-card/70"}
              `}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${isActive ? item.accentColor : "text-muted-foreground group-hover:text-foreground"}`}
              />
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[13px] font-semibold leading-tight transition-colors ${
                    isActive ? item.accentColor : "text-foreground/90 group-hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>

                {/* LIVE badge */}
                {item.badge && (
                  <Badge className="text-[8px] py-0 px-1 h-3.5 bg-purple-500/15 text-purple-400 border-purple-500/30">
                    <Radio className="w-1.5 h-1.5 mr-0.5 animate-pulse" />
                    {item.badge}
                  </Badge>
                )}

                {/* Pending approval count */}
                {item.id === "command" && pendingApprovals > 0 && (
                  <Badge variant="destructive" className="text-[8px] py-0 px-1 h-3.5">
                    {pendingApprovals}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                {item.sublabel}
              </p>
            </div>

            {/* Arrow */}
            {isActive && (
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${item.accentColor}`} />
            )}
          </button>
        );
      })}

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="border-t border-border/20 mx-2 my-2" />

      {/* ── AI Drafting Engine CTA ────────────────────────────────────── */}
      <button
        onClick={onOpenDraftingEngine}
        className="group relative w-full overflow-hidden flex items-center gap-3 px-3 py-3 rounded-xl border border-purple-500/25 bg-gradient-to-br from-purple-900/20 via-indigo-900/15 to-cyan-900/15 hover:border-purple-500/50 hover:from-purple-900/30 transition-all duration-200"
      >
        {/* Shimmer sweep on hover */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

        <div className="relative p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
          <Zap className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
        </div>

        <div className="relative flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-white">AI Drafting Engine</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Generate legal drafts instantly
          </p>
        </div>

        <Sparkles className="w-4 h-4 text-purple-400/60 group-hover:text-cyan-400 transition-colors shrink-0" />
      </button>

      {/* ── Credit Balance Widget ─────────────────────────────────────── */}
      {creditBalance !== undefined && (
        <div className="mx-0.5 p-3 rounded-xl border border-border/25 bg-card/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[11px] text-muted-foreground font-medium">AI Credits</span>
            </div>
            <span
              className={`text-sm font-bold tabular-nums ${
                creditBalance > 5
                  ? "text-green-400"
                  : creditBalance > 0
                  ? "text-orange-400"
                  : "text-red-400"
              }`}
            >
              {creditBalance}
            </span>
          </div>

          {/* Credit bar */}
          <div className="w-full bg-border/30 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((creditBalance / 20) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                creditBalance > 5 ? "bg-green-500" : creditBalance > 0 ? "bg-orange-500" : "bg-red-500"
              }`}
            />
          </div>

          {creditBalance === 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <p className="text-[10px] text-red-400 leading-tight">No credits — purchase to generate drafts</p>
            </div>
          )}
        </div>
      )}

      {/* ── Settings Footer ──────────────────────────────────────────── */}
      <div className="mt-auto pt-2">
        <button
          onClick={() => navigate("/settings/agent-control-center")}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-card/40 transition-all text-[12px] font-medium"
        >
          <Settings className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Agent Control Center</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default CADashboardSubNav;
