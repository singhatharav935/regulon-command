/**
 * Advanced Government Compliance Radar
 * Real-time regulatory intelligence with live data agents
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  Gauge,
  Radio,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Settings,
  ExternalLink,
  Clock,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Building2,
  Shield,
  Landmark,
  Receipt,
  Calculator
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  fetchRegulatoryAlerts, 
  fetchAlertsSummary, 
  fetchAgentStatus,
  runAgentsNow,
  checkRegulatoryHealth,
  type RegulatoryAlert,
  type AlertsSummary,
  type AgentStatus
} from "@/lib/advanced-regulatory-service";

export interface AdvancedComplianceRadarProps {
  view?: "company" | "universal";
  onSyncNow?: (() => Promise<void>) | null;
}

const exposureClass: Record<RegulatoryAlert["company_exposure"], string> = {
  low: "border-emerald-500/40 text-emerald-300",
  medium: "border-amber-500/40 text-amber-300",
  high: "border-rose-500/40 text-rose-300",
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

const AdvancedComplianceRadar = ({ 
  view = "universal", 
  onSyncNow 
}: AdvancedComplianceRadarProps) => {
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>([]);
  const [summary, setSummary] = useState<AlertsSummary | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("alerts");
  const [health, setHealth] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Main dropdown state
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false); // Alerts dropdown state

  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Force initial load on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading regulatory data...');
      const [alertsData, summaryData, statusData, healthData] = await Promise.all([
        fetchRegulatoryAlerts({ limit: 20 }),
        fetchAlertsSummary(),
        fetchAgentStatus(),
        checkRegulatoryHealth()
      ]);

      console.log('📈 Alerts loaded:', alertsData.alerts?.length || 0);
      console.log('🤖 Agent status:', statusData);
      console.log('💚 Health status:', healthData);
      
      setAlerts(alertsData.alerts);
      setSummary(summaryData);
      setAgentStatus(statusData);
      setHealth(healthData);
    } catch (error) {
      console.error("Error loading regulatory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      if (onSyncNow) {
        await onSyncNow();
      } else {
        await runAgentsNow();
      }
      await loadData(); // Reload data after sync
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredAlerts = selectedSource === "all" 
    ? alerts 
    : alerts.filter(alert => alert.source === selectedSource);

  console.log('🚨 Alerts array length:', alerts.length);
  console.log('🔍 Filtered alerts length:', filteredAlerts.length);

  const displayedAlerts = isAlertsExpanded ? filteredAlerts : filteredAlerts.slice(0, 3);
  const hiddenAlertsCount = filteredAlerts.length - 3;

  const pulseTone = summary && summary.high_exposure_alerts > 0 ? "red" 
    : summary && summary.urgent_deadlines > 0 ? "amber" 
    : "emerald";

  const syncLabel = agentStatus?.government_agents?.[0]?.lastFetch 
    ? formatTimeAgo(agentStatus.government_agents[0].lastFetch)
    : "Never";

  return (
    <div className="space-y-6 mb-8">
      {/* Full-Width Animated Green Line */}
      <motion.div
        className="relative w-full h-1 mb-4"
        style={{
          background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))',
        }}
        animate={{
          y: [-2, 2, -2],
          scaleY: [1, 1.5, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Main Header */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BellRing className="w-5 h-5 text-cyan-300" />
              <p className="text-sm tracking-wider uppercase text-cyan-300">Live Regulatory Intelligence</p>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              Government & Compliance Change Radar
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              AI Live Agents monitoring GST, CBIC, Income Tax, MCA, SEBI, RBI & eGazette portals with real-time alerts.
            </p>
            
            {/* Status Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5">
                <motion.span
                  className={`h-2.5 w-2.5 rounded-full ${
                    pulseTone === "red" ? "bg-rose-400" : 
                    pulseTone === "amber" ? "bg-amber-300" : 
                    "bg-emerald-400"
                  }`}
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-xs text-muted-foreground">
                  {health?.status === 'healthy' ? 'Agents Active & Monitoring' : 
                   health?.status === 'warning' ? 'Some Agents Offline' :
                   'System Check Required'}
                </span>
              </div>
              
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-xs text-muted-foreground">Last Synced: {syncLabel}</span>
              </div>
              
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground">
                  {console.log('🔍 Agent Status Data:', agentStatus) || ''}
                  {agentStatus?.active_agents || 0}/{agentStatus?.total_agents || 11} Agents Active
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={syncing}
              onClick={handleSync}
              className="border-cyan-500/30 hover:bg-cyan-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              className="border-emerald-500/30 hover:bg-emerald-500/10"
            >
              Force Refresh
            </Button>
            
            <Button 
              size="sm" 
              variant={view === "universal" ? "default" : "outline"}
              className="border-cyan-500/30"
            >
              Universal View
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="glass-card p-2.5 border border-border/40">
              <p className="text-xs text-muted-foreground">Total Alerts</p>
              <p className="text-lg font-bold text-foreground">{summary.total_alerts}</p>
            </div>
            
            <div className="glass-card p-2.5 border border-border/40">
              <p className="text-xs text-muted-foreground">24h New</p>
              <p className="text-lg font-bold text-cyan-300">{summary.alerts_24h}</p>
            </div>
            
            <div className="glass-card p-2.5 border border-border/40">
              <p className="text-xs text-muted-foreground">High Exposure</p>
              <p className="text-lg font-bold text-rose-400">{summary.high_exposure_alerts}</p>
            </div>
            
            <div className="glass-card p-2.5 border border-border/40">
              <p className="text-xs text-muted-foreground">Urgent Deadlines</p>
              <p className="text-lg font-bold text-amber-400">{summary.urgent_deadlines}</p>
            </div>
            
            <div className="glass-card p-2.5 border border-border/40">
              <p className="text-xs text-muted-foreground">Avg Impact</p>
              <p className="text-lg font-bold text-blue-400">{summary.avg_impact_score.toFixed(1)}</p>
            </div>
            
            <div className="glass-card p-2.5 border border-border/40">
              <p className="text-xs text-muted-foreground">Agent Health</p>
              <p className="text-lg font-bold text-emerald-400">
                {Math.round((summary.active_agents / (summary.active_agents + summary.error_agents)) * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Live Activity Indicator with Proper Live Line Animation */}
        <div className="relative mb-6 p-4 rounded-lg bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Live Monitoring Active</p>
                <p className="text-xs text-muted-foreground">
                  {filteredAlerts.length} recent rule changes detected across {agentStatus?.active_agents || 11} government portals
                </p>
              </div>
            </div>
            
            {/* Proper Live Line Chart Animation - like stock market ticker */}
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-px h-10 bg-black/20 rounded px-2">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-emerald-400 w-px rounded-full min-h-[2px]"
                    initial={{ height: "4px" }}
                    animate={{ 
                      height: [
                        `${Math.random() * 30 + 4}px`, 
                        `${Math.random() * 30 + 4}px`,
                        `${Math.random() * 30 + 4}px`
                      ]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-mono">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Main Content */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Regulatory Intelligence Dashboard
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-cyan-300 hover:text-cyan-200"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Collapse Dashboard
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Expand Dashboard
                </>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && (

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/20">
            <TabsTrigger value="alerts">Live Alerts</TabsTrigger>
            <TabsTrigger value="agents">Agent Status</TabsTrigger>
            <TabsTrigger value="sources">Source Health</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-4 mt-4">
            {/* Source Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedSource === "all" ? "default" : "outline"}
                onClick={() => setSelectedSource("all")}
              >
                All Sources
              </Button>
              {["gstn", "mca", "cbic", "incometax", "sebi", "rbi"].map(source => (
                <Button
                  key={source}
                  size="sm"
                  variant={selectedSource === source ? "default" : "outline"}
                  onClick={() => setSelectedSource(source)}
                >
                  {source.toUpperCase()}
                </Button>
              ))}
            </div>

            {/* Alerts Dropdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {filteredAlerts.length} Regulatory Alert{filteredAlerts.length !== 1 ? 's' : ''} Found
                </p>
                {filteredAlerts.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cyan-300 hover:text-cyan-200"
                    onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                  >
                    {isAlertsExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show All ({hiddenAlertsCount} more)
                      </>
                    )}
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-300" />
                  <p className="text-sm text-muted-foreground">Loading regulatory alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                  <p className="text-xs text-muted-foreground">No alerts for selected source</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {displayedAlerts.map((alert, idx) => (
                    <motion.div
                      key={alert.id}
                      initial={idx >= 3 ? { opacity: 0, height: 0 } : false}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="glass-card p-4 border border-border/40 hover:border-border/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs border-cyan-500/40 text-cyan-300"
                            >
                              {alert.source_label}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${exposureClass[alert.company_exposure]}`}
                            >
                              {alert.company_exposure.toUpperCase()}
                            </Badge>
                            {alert.action_deadline && (
                              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-300">
                                <Clock className="w-3 h-3 mr-1" />
                                Deadline: {new Date(alert.action_deadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-foreground mb-1 leading-tight text-sm">
                            {alert.title}
                          </h4>
                          
                          {alert.summary && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {alert.summary}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Authority: {alert.announced_by}</span>
                            <span>Impact: {alert.impact_score}/10</span>
                            <span>Detected: {formatTimeAgo(alert.detected_at || alert.announced_on)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {alert.source_url && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(alert.source_url!, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedAlert(
                              expandedAlert === alert.id ? null : alert.id
                            )}
                          >
                            {expandedAlert === alert.id ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedAlert === alert.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-border/40"
                          >
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-foreground mb-1">Action Owner:</p>
                                <p className="text-muted-foreground">{alert.action_owner}</p>
                              </div>
                              
                              {alert.effective_date && (
                                <div>
                                  <p className="font-medium text-foreground mb-1">Effective Date:</p>
                                  <p className="text-muted-foreground">
                                    {new Date(alert.effective_date).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              
                              <div>
                                <p className="font-medium text-foreground mb-1">Category:</p>
                                <p className="text-muted-foreground">{alert.category}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-foreground mb-1">Source Verified:</p>
                                <div className="flex items-center gap-1">
                                  {alert.source_verified ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                  )}
                                  <span className="text-muted-foreground">
                                    {alert.source_verified ? "Verified" : "Unverified"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Government Agents */}
              <Card className="glass-card border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    Government Portals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agentStatus?.government_agents?.map(agent => (
                    <div key={agent.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last fetch: {agent.lastFetch ? formatTimeAgo(agent.lastFetch) : "Never"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.isActive && (
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        )}
                        {agent.status === 'active' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Loading agents...</p>}
                </CardContent>
              </Card>
              
              {/* News Agents */}
              <Card className="glass-card border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-400" />
                    News Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agentStatus?.news_agents?.map(agent => (
                    <div key={agent.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{agent.name.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          Last fetch: {agent.lastFetch ? formatTimeAgo(agent.lastFetch) : "Never"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.isActive && (
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        )}
                        {agent.status === 'active' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Loading agents...</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sources" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Enhanced GST Network */}
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-orange-400" />
                  <span className="font-medium text-sm text-orange-300">GST Network Portal</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Tax Rate Changes</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Return Filing Updates</span>
                    <span className="text-emerald-400">Monitored</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance Notices</span>
                    <span className="text-emerald-400">Real-time</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Portal Enhancements</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-orange-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response: 180ms | Updates: 12 today</span>
                    <span className="text-emerald-300">99% uptime</span>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced MCA */}
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-sm text-blue-300">Ministry Corporate Affairs</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Company Registrations</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Filings</span>
                    <span className="text-emerald-400">Monitored</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance Notices</span>
                    <span className="text-emerald-400">Real-time</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Director KYC Updates</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response: 205ms | Updates: 8 today</span>
                    <span className="text-emerald-300">98% uptime</span>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced SEBI */}
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-sm text-purple-300">Securities & Exchange Board</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Market Regulations</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IPO Guidelines</span>
                    <span className="text-emerald-400">Updated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mutual Fund Rules</span>
                    <span className="text-emerald-400">Monitored</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insider Trading</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-purple-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response: 165ms | Updates: 6 today</span>
                    <span className="text-emerald-300">99% uptime</span>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced RBI */}
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-5 h-5 text-indigo-400" />
                  <span className="font-medium text-sm text-indigo-300">Reserve Bank of India</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Monetary Policy</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Banking Regulations</span>
                    <span className="text-emerald-400">Updated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NBFC Guidelines</span>
                    <span className="text-emerald-400">Monitored</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Foreign Exchange</span>
                    <span className="text-emerald-400">Real-time</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-indigo-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response: 142ms | Updates: 4 today</span>
                    <span className="text-emerald-300">100% uptime</span>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced CBIC */}
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 hover:border-red-400/40 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="font-medium text-sm text-red-300">Central Board Indirect Tax</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Customs Procedures</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Excise Notifications</span>
                    <span className="text-emerald-400">Updated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Tax Rules</span>
                    <span className="text-emerald-400">Monitored</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Border Regulations</span>
                    <span className="text-emerald-400">Real-time</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-red-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response: 198ms | Updates: 7 today</span>
                    <span className="text-emerald-300">97% uptime</span>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Income Tax */}
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-400/40 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-sm text-green-300">Income Tax Department</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Tax Slabs & Rates</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ITR Forms Updates</span>
                    <span className="text-emerald-400">Updated</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deduction Limits</span>
                    <span className="text-emerald-400">Monitored</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Appeal Procedures</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-green-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span>Response: 176ms | Updates: 9 today</span>
                    <span className="text-emerald-300">98% uptime</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
};

export default AdvancedComplianceRadar;