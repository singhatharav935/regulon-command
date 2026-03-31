import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  Zap,
  Shield,
  ExternalLink,
  Globe,
  Target,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchLiveRegulatoryNews } from "@/lib/live-regulatory-data";

interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary?: string;
  authority: string;
  sourceUrl: string;
  impactType: string;
  affectedEntities: string;
  implementationStatus: string;
  urgency: string;
  regulatoryArea: string;
  date: string;
  severity: "high" | "medium" | "low";
  previousNotices?: number;
}

const RegulatoryNewsPanel = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async () => {
    try {
      setRefreshing(true);
      const liveNews = await fetchLiveRegulatoryNews();
      setNews(liveNews);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
      setNews([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Refresh every 1 minute (60000 ms)
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case "medium":
        return <TrendingUp className="w-5 h-5 text-amber-500" />;
      default:
        return <Zap className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-rose-500/10 border-rose-500/30";
      case "medium":
        return "bg-amber-500/10 border-amber-500/30";
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Collapsible Header */}
      <CardHeader 
        className="border-b border-purple-500/20 pb-3 cursor-pointer hover:bg-purple-500/5 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Globe className="w-5 h-5 text-purple-400" />
              {!refreshing && (
                <motion.div
                  className="absolute inset-0 rounded-full border border-purple-400"
                  animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm text-white">
                  Indian Regulatory News
                </CardTitle>
                <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300 text-xs animate-pulse">
                  {news.length} LIVE
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isExpanded ? "Click to collapse" : `Live from government portals • Last updated: ${formatTime(lastRefresh)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                fetchNews();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-purple-400" />
            </motion.div>
          </div>
        </div>
      </CardHeader>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
                  <span className="ml-2 text-sm text-gray-400">Fetching live news from government portals...</span>
                </div>
              ) : error ? (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-300 text-xs">
                  {error}
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No regulatory updates found. Checking portals...
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {news.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <div
                          className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${getSeverityBgColor(
                            item.severity
                          )}`}
                          onClick={() =>
                            setExpandedId(
                              expandedId === item.id ? null : item.id
                            )
                          }
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{getSeverityIcon(item.severity)}</div>
                            <div className="flex-1 min-w-0">
                              {/* Compact header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1 flex-wrap mb-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-purple-900/40 border-purple-600/60 text-purple-200"
                                    >
                                      {item.category}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        item.urgency === "high"
                                          ? "bg-rose-900/40 border-rose-600/60 text-rose-200"
                                          : "bg-amber-900/40 border-amber-600/60 text-amber-200"
                                      }`}
                                    >
                                      {item.urgency.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs bg-green-900/40 border-green-600/60 text-green-200">
                                      LIVE
                                    </Badge>
                                  </div>
                                  <h4 className="text-xs font-semibold text-white line-clamp-1">
                                    {item.title}
                                  </h4>
                                </div>
                              </div>

                              {/* Expandable details */}
                              <AnimatePresence>
                                {expandedId === item.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2 space-y-2 border-t border-slate-700 pt-2"
                                  >
                                    {/* Summary */}
                                    {item.summary && (
                                      <p className="text-xs text-gray-300">
                                        {item.summary}
                                      </p>
                                    )}

                                    {/* Metadata grid */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="text-xs">
                                        <p className="font-semibold text-purple-300">Impact</p>
                                        <p className="text-gray-300">{item.impactType}</p>
                                      </div>
                                      <div className="text-xs">
                                        <p className="font-semibold text-purple-300">Status</p>
                                        <p className="text-gray-300">{item.implementationStatus}</p>
                                      </div>
                                    </div>

                                    {/* Affected entities */}
                                    <div className="text-xs">
                                      <p className="font-semibold text-purple-300">Affected</p>
                                      <p className="text-gray-300">{item.affectedEntities}</p>
                                    </div>

                                    {/* View Source Link */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                                      <span className="text-xs text-gray-400">
                                        {formatDate(item.date)}
                                      </span>
                                      <a
                                        href={item.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition font-semibold"
                                      >
                                        View Source
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Collapsed footer */}
                              {expandedId !== item.id && (
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                                  <span className="text-xs text-purple-400">+</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Auto-refresh notice */}
              <div className="mt-3 text-xs text-gray-500 border-t border-slate-700 pt-2 flex items-center gap-1">
                <motion.div
                  animate={{ opacity: [0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Globe className="w-3 h-3" />
                </motion.div>
                Auto-refreshes every 60 seconds from government portals
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default RegulatoryNewsPanel;
