import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Radio, Zap, Shield, Activity, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface SourceStatusItem {
  source: string;
  sourceLabel: string;
  status: "active" | "awaiting_feed";
  latestNoticeAt: string | null;
  latestNoticeTitle: string | null;
}

interface AILiveAgentStatusProps {
  isActive: boolean;
  lastSyncedAt: string | null;
  monitoredPortals: number;
  sourceStatus: SourceStatusItem[];
  totalAlerts: number;
  highExposureCount: number;
}

const SOURCE_ICONS: Record<string, string> = {
  gstn: "🧾",
  cbic: "📦",
  incometax: "💰",
  mca: "🏢",
  sebi: "📈",
  rbi: "🏦",
  egazette: "📜",
};

const SOURCE_URLS: Record<string, string> = {
  gstn: "https://www.gst.gov.in",
  cbic: "https://www.cbic.gov.in",
  incometax: "https://www.incometax.gov.in",
  mca: "https://www.mca.gov.in",
  sebi: "https://www.sebi.gov.in",
  rbi: "https://rbi.org.in",
  egazette: "https://egazette.gov.in",
};

const AILiveAgentStatus = ({
  isActive,
  lastSyncedAt,
  monitoredPortals,
  sourceStatus,
  totalAlerts,
  highExposureCount,
}: AILiveAgentStatusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const activeSourceCount = useMemo(
    () => sourceStatus.filter((s) => s.status === "active").length,
    [sourceStatus]
  );

  const timeSinceSync = useMemo(() => {
    if (!lastSyncedAt) return "Syncing...";
    const diff = Date.now() - new Date(lastSyncedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [lastSyncedAt]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-cyan-950/40">
        {/* Scanning line animation - subtle */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Compact Header - Always Visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Agent Info */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
                    animate={isActive ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : { opacity: 0.4 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">AI Live Agent</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        isActive
                          ? "border-emerald-500/50 text-emerald-400"
                          : "border-amber-500/50 text-amber-400"
                      }`}
                    >
                      {isActive ? "LIVE" : "STANDBY"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Monitoring {activeSourceCount}/{sourceStatus.length} govt portals • {timeSinceSync}
                  </p>
                </div>
              </div>

              {/* Right: Quick Stats + Expand */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{totalAlerts}</p>
                    <p className="text-[9px] text-muted-foreground">Alerts</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${highExposureCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {highExposureCount}
                    </p>
                    <p className="text-[9px] text-muted-foreground">High Risk</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-xs">{isExpanded ? "Less" : "Details"}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Source Status Strip - Compact inline view */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
              {sourceStatus.map((source) => (
                <div
                  key={source.source}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                    source.status === "active"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  <span>{SOURCE_ICONS[source.source.toLowerCase()] ?? "📋"}</span>
                  <span className="font-medium">{source.sourceLabel}</span>
                  <motion.span
                    className={`w-1.5 h-1.5 rounded-full ${
                      source.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                    animate={source.status === "active" ? { opacity: [1, 0.4, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              ))}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/5"
              >
                <div className="p-4 space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-foreground">{monitoredPortals}</p>
                      <p className="text-[9px] text-muted-foreground">Portals</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-emerald-400">{activeSourceCount}</p>
                      <p className="text-[9px] text-muted-foreground">Live Feeds</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-foreground">{totalAlerts}</p>
                      <p className="text-[9px] text-muted-foreground">Alerts</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <Shield className="w-3.5 h-3.5 text-rose-400 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-rose-400">{highExposureCount}</p>
                      <p className="text-[9px] text-muted-foreground">High Risk</p>
                    </div>
                  </div>

                  {/* Source Details Grid */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-medium mb-2">
                      Government Portal Status
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {sourceStatus.map((source) => (
                        <button
                          key={source.source}
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = SOURCE_URLS[source.source.toLowerCase()];
                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className={`relative rounded-lg border p-2.5 text-left transition-all hover:scale-[1.01] ${
                            source.status === "active"
                              ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                              : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{SOURCE_ICONS[source.source.toLowerCase()] ?? "📋"}</span>
                              <div>
                                <p className="text-xs font-medium text-foreground">{source.sourceLabel}</p>
                                <p className={`text-[10px] ${source.status === "active" ? "text-emerald-400" : "text-amber-400"}`}>
                                  {source.status === "active" ? "● Live Feed Active" : "○ Monitoring"}
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                          </div>
                          {source.latestNoticeTitle && (
                            <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">
                              Latest: {source.latestNoticeTitle}
                            </p>
                          )}
                          {source.latestNoticeAt && (
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                              {new Date(source.latestNoticeAt).toLocaleDateString()}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Auto-scanning government portals every 15 seconds
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default AILiveAgentStatus;
