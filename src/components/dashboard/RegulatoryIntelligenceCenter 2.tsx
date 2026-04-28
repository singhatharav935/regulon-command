import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, BellRing, CalendarClock, Gauge, Radio, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AILiveAgentStatus from "./AILiveAgentStatus";
import RegulatoryNewsPanel from "./RegulatoryNewsPanel";

export interface RegulatoryUpdateItem {
  id: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  source: string;
  sourceLabel: string;
  announcedBy: string;
  announcedOn: string;
  effectiveDate: string | null;
  actionDeadline: string | null;
  impactScore: number;
  companyExposure: "low" | "medium" | "high";
  actionOwner: string;
  sourceVerified?: boolean;
  originalUrl: string | null;
}

interface RegulatoryIntelligenceCenterProps {
  currentHealthScore?: number;
  updates: RegulatoryUpdateItem[];
  lastSyncedAt?: string | null;
  monitoredPortals?: number;
  syncStatus?: "agent_active" | "awaiting_first_sync";
  sourceStatus?: Array<{
    source: string;
    sourceLabel: string;
    status: "active" | "awaiting_feed";
    latestNoticeAt: string | null;
    latestNoticeTitle: string | null;
  }>;
  view?: "company" | "universal";
  onSyncNow?: (() => Promise<void>) | null;
}

const exposureClass: Record<RegulatoryUpdateItem["companyExposure"], string> = {
  low: "border-emerald-500/40 text-emerald-300",
  medium: "border-amber-500/40 text-amber-300",
  high: "border-rose-500/40 text-rose-300",
};

// Collapsible notices dropdown component
const NoticesDropdown = ({ notices }: { notices: RegulatoryUpdateItem[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedNotices = isExpanded ? notices : notices.slice(0, 3);
  const hiddenCount = notices.length - 3;

  return (
    <div className="space-y-2">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {notices.length} Regulatory Update{notices.length !== 1 ? 's' : ''}
        </p>
        {notices.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-cyan-300 hover:text-cyan-200"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show All ({hiddenCount} more)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Notices list */}
      <AnimatePresence mode="popLayout">
        {displayedNotices.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={idx >= 3 ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border/40 bg-card/30 p-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                {item.summary ? (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                ) : null}
                <p className="text-xs text-muted-foreground mt-1">
                  {item.sourceLabel} announcement by {item.announcedBy} on {item.announcedOn}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                    {item.sourceVerified === false ? "Verification Pending" : "Source Verified"}
                  </Badge>
                  {item.category ? (
                    <Badge variant="outline" className="border-blue-500/40 text-blue-300">
                      {item.category}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Effective: {item.effectiveDate ?? "Not specified"}
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                    Deadline: {item.actionDeadline ?? "Not specified"}
                  </Badge>
                  <Badge variant="outline" className={exposureClass[item.companyExposure]}>
                    {item.companyExposure.toUpperCase()} Exposure
                  </Badge>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-xs text-muted-foreground">Avg Company Impact</p>
                <p className="text-lg font-semibold text-rose-300">-{item.impactScore}%</p>
                <p className="text-xs text-cyan-300 mt-1">Owner: {item.actionOwner}</p>
                {item.originalUrl ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open(item.originalUrl as string, "_blank", "noopener,noreferrer")}
                  >
                    External Verification ↗
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Click to expand collapsed state indicator */}
      {!isExpanded && notices.length > 3 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-2 text-sm text-cyan-300 hover:text-cyan-200 border border-dashed border-border/40 rounded-lg flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-4 h-4" />
          Click to view {hiddenCount} more notice{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

const RegulatoryIntelligenceCenter = ({
  currentHealthScore,
  updates,
  lastSyncedAt = null,
  monitoredPortals = 12,
  syncStatus = "agent_active",
  sourceStatus = [],
  view = "company",
  onSyncNow = null,
}: RegulatoryIntelligenceCenterProps) => {
  const [liveView, setLiveView] = useState<"universal" | "company">(view);
  const [syncingNow, setSyncingNow] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const avgImpact = updates.length > 0
    ? Number((updates.reduce((sum, item) => sum + item.impactScore, 0) / updates.length).toFixed(1))
    : 0;
  const projectedHealth = typeof currentHealthScore === "number"
    ? Math.max(0, Number((currentHealthScore - avgImpact).toFixed(1)))
    : null;
  const highExposureCount = updates.filter((item) => item.companyExposure === "high").length;
  const sortedByDeadline = useMemo(
    () => updates
      .map((item) => ({ item, t: item.actionDeadline ? Date.parse(item.actionDeadline) : Number.POSITIVE_INFINITY }))
      .sort((a, b) => a.t - b.t),
    [updates],
  );
  const nearestDeadline = updates
    .map((item) => ({ label: item.actionDeadline ?? "TBD", time: item.actionDeadline ? Date.parse(item.actionDeadline) : Number.NaN }))
    .filter((item) => Number.isFinite(item.time) && item.time > 0)
    .sort((a, b) => a.time - b.time)[0]?.label ?? "TBD";
  const totalAnnouncements = updates.length;
  const latestPublishedAt = updates
    .map((item) => Date.parse(item.announcedOn))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a)[0];
  const stale = typeof latestPublishedAt === "number" ? Date.now() - latestPublishedAt > 24 * 60 * 60 * 1000 : true;
  const pulseTone = syncStatus === "awaiting_first_sync" ? "amber" : highExposureCount > 0 ? "red" : stale ? "amber" : "green";
  const syncLabel = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not synced yet";
  const isCompanyView = liveView === "company";
  const effectiveSourceStatus = sourceStatus.length > 0
    ? sourceStatus
    : [
        { source: "gstn", sourceLabel: "GSTN", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
        { source: "cbic", sourceLabel: "CBIC", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
        { source: "incometax", sourceLabel: "Income Tax India", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
        { source: "mca", sourceLabel: "MCA", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
        { source: "sebi", sourceLabel: "SEBI", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
        { source: "rbi", sourceLabel: "RBI", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
        { source: "egazette", sourceLabel: "eGazette", status: "awaiting_feed" as const, latestNoticeAt: null, latestNoticeTitle: null },
      ];
  const sourceFolders = useMemo(() => {
    const known = new Map<string, string>();
    for (const entry of effectiveSourceStatus) {
      known.set(entry.source.toLowerCase(), entry.sourceLabel);
    }
    for (const item of updates) {
      const key = item.source.toLowerCase();
      if (!known.has(key)) {
        known.set(key, item.sourceLabel);
      }
    }
    return Array.from(known.entries()).map(([source, sourceLabel]) => ({ source, sourceLabel }));
  }, [effectiveSourceStatus, updates]);
  const filteredUpdates = selectedSource === "all"
    ? updates
    : updates.filter((item) => item.source.toLowerCase() === selectedSource);

  return (
    <div className="space-y-6 mb-8">
      {/* Regulatory News Panel - Above Radar */}
      <RegulatoryNewsPanel />

      {/* Main Radar Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="glass-card p-6 mb-8"
      >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-4 h-4 text-cyan-300" />
            <p className="text-xs tracking-wider uppercase text-cyan-300">Live Regulatory Intelligence</p>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Government & Compliance Change Radar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI Live Agent monitoring GST, CBIC, Income Tax, MCA, SEBI, RBI &amp; eGazette portals with source-verifiable alerts.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1">
              <motion.span
                className={pulseTone === "red" ? "h-2 w-2 rounded-full bg-rose-400" : pulseTone === "amber" ? "h-2 w-2 rounded-full bg-amber-300" : "h-2 w-2 rounded-full bg-emerald-400"}
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs text-muted-foreground">
                {pulseTone === "red"
                  ? "High Exposure Detected: Action Required."
                  : syncStatus === "awaiting_first_sync"
                    ? "Agent Ready: Awaiting First Source Sync."
                    : "Agent Active: Monitoring Portals."}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1">
              <Radio className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-xs text-muted-foreground">Last Synced: {syncLabel}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1">
              <span className="text-xs text-muted-foreground">Monitoring {monitoredPortals} Portals.</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSyncNow ? (
            <Button
              size="sm"
              variant="outline"
              disabled={syncingNow}
              onClick={async () => {
                setSyncingNow(true);
                try {
                  await onSyncNow();
                } finally {
                  setSyncingNow(false);
                }
              }}
            >
              {syncingNow ? "Syncing..." : "Sync Now"}
            </Button>
          ) : null}
          <Button size="sm" variant={liveView === "universal" ? "default" : "outline"} onClick={() => setLiveView("universal")}>
            Universal Public View
          </Button>
          <Button size="sm" variant={liveView === "company" ? "default" : "outline"} onClick={() => setLiveView("company")}>
            CA + Company View
          </Button>
        </div>
      </div>

      {/* AI Live Agent Status Panel */}
      <div className="mb-6">
        <AILiveAgentStatus
          isActive={syncStatus === "agent_active"}
          lastSyncedAt={lastSyncedAt}
          monitoredPortals={monitoredPortals}
          sourceStatus={effectiveSourceStatus.map((s) => ({
            source: s.source,
            sourceLabel: s.sourceLabel,
            status: s.status,
            latestNoticeAt: s.latestNoticeAt,
            latestNoticeTitle: s.latestNoticeTitle,
          }))}
          totalAlerts={updates.length}
          highExposureCount={highExposureCount}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {isCompanyView && typeof currentHealthScore === "number" ? (
          <>
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Current Health Score</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-bold text-cyan-300">{currentHealthScore}%</p>
            <Gauge className="w-5 h-5 text-cyan-300" />
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Avg Impact (If Ignored)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-bold text-rose-300">-{avgImpact}%</p>
            <AlertTriangle className="w-5 h-5 text-rose-300" />
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Projected Health</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-bold text-amber-300">{projectedHealth ?? 0}%</p>
            <ShieldCheck className="w-5 h-5 text-amber-300" />
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">High Exposure Alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-3xl font-bold text-foreground">{highExposureCount}</p>
            <CalendarClock className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
          </>
        ) : (
          <>
            <Card className="glass-card border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Active Announcements</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-bold text-cyan-300">{totalAnnouncements}</p>
                <BellRing className="w-5 h-5 text-cyan-300" />
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Avg Impact (Ecosystem)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-bold text-rose-300">-{avgImpact}%</p>
                <AlertTriangle className="w-5 h-5 text-rose-300" />
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Nearest Deadline</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-xl font-bold text-amber-300">{nearestDeadline}</p>
                <CalendarClock className="w-5 h-5 text-amber-300" />
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Most Recent Alert</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-sm font-semibold text-foreground truncate">{sortedByDeadline[0]?.item.title ?? "No alerts"}</p>
                <BellRing className="w-5 h-5 text-primary" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={selectedSource === "all" ? "default" : "outline"}
            onClick={() => setSelectedSource("all")}
          >
            All Sources
          </Button>
          {sourceFolders.map((folder) => (
            <Button
              key={folder.source}
              size="sm"
              variant={selectedSource === folder.source ? "default" : "outline"}
              onClick={() => setSelectedSource(folder.source)}
            >
              {folder.sourceLabel}
            </Button>
          ))}
        </div>
        {filteredUpdates.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/30 p-6 text-sm text-muted-foreground">
            {selectedSource === "all"
              ? "No government announcements ingested yet. Sovereign Agent is active and awaiting first successful sync."
              : `No notices captured yet for ${sourceFolders.find((item) => item.source === selectedSource)?.sourceLabel ?? selectedSource}.`}
          </div>
        ) : null}
        
        {/* Notices collapsible section */}
        {filteredUpdates.length > 0 && (
          <NoticesDropdown notices={filteredUpdates} />
        )}
      </div>

      <div className="mt-5 rounded-xl border border-border/40 bg-card/20 p-4">
        <p className="text-xs uppercase tracking-wider text-cyan-300 mb-3">Source Monitoring Status</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {effectiveSourceStatus.map((source) => (
            <div key={source.source} className="rounded-lg border border-border/30 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-foreground">{source.sourceLabel}</p>
                <Badge
                  variant="outline"
                  className={source.status === "active" ? "border-emerald-500/40 text-emerald-300" : "border-cyan-500/40 text-cyan-300"}
                >
                  {source.status === "active" ? "Feed Active" : "Monitoring"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {source.latestNoticeTitle ?? "No notice captured yet"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
    </div>
  );
};

export default RegulatoryIntelligenceCenter;
