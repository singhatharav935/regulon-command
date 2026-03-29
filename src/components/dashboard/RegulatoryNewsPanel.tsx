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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8787/regulatory-news");
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setNews(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load news");
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Refresh every 60s
    return () => clearInterval(interval);
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

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <CardHeader className="border-b border-purple-500/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-purple-400 animate-pulse" />
            <div>
              <CardTitle className="text-lg text-white">
                Indian Regulatory News & Compliance Updates
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Major regulatory changes from past 30 days | 7 Government Sources
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300">
            {news.length} Major Changes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-300 text-sm">
            {error}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No regulatory updates in past 30 days
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {news.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div
                    className={`rounded-lg border p-4 cursor-pointer transition-all hover:shadow-lg ${getSeverityBgColor(
                      item.severity
                    )}`}
                    onClick={() =>
                      setExpandedId(
                        expandedId === item.id ? null : item.id
                      )
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getSeverityIcon(item.severity)}</div>
                      <div className="flex-1 min-w-0">
                        {/* Top badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs bg-purple-900/40 border-purple-600/60 text-purple-200"
                          >
                            {item.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs bg-slate-800 border-slate-600"
                          >
                            {item.regulatoryArea}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              item.urgency === "High"
                                ? "bg-rose-900/40 border-rose-600/60 text-rose-200"
                                : "bg-amber-900/40 border-amber-600/60 text-amber-200"
                            }`}
                          >
                            {item.urgency} Priority
                          </Badge>
                        </div>

                        {/* Title and authority */}
                        <h4 className="text-sm font-semibold text-white line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-purple-300 mt-1 font-medium">
                          {item.authority}
                        </p>

                        {/* Summary preview */}
                        {item.summary && (
                          <p className="text-xs text-gray-300 mt-2 line-clamp-2">
                            {item.summary}
                          </p>
                        )}

                        {/* Expandable section */}
                        <AnimatePresence>
                          {expandedId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 space-y-4 border-t border-slate-700 pt-4"
                            >
                              {/* Impact Type & Status Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Impact Type
                                  </p>
                                  <p className="text-xs text-gray-200">
                                    {item.impactType}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Status
                                  </p>
                                  <p className="text-xs text-gray-200">
                                    {item.implementationStatus}
                                  </p>
                                </div>
                              </div>

                              {/* Affected Entities */}
                              <div>
                                <p className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> Affected Entities
                                </p>
                                <p className="text-xs text-gray-200">
                                  {item.affectedEntities}
                                </p>
                              </div>

                              {/* Full Summary */}
                              <div>
                                <p className="text-xs font-semibold text-purple-300 mb-1">
                                  Detailed Summary
                                </p>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                  {item.summary || "No detailed summary available"}
                                </p>
                              </div>

                              {/* Previous Notices Count */}
                              {item.previousNotices && item.previousNotices > 1 && (
                                <div className="bg-slate-800/50 rounded px-2 py-1.5">
                                  <p className="text-xs text-gray-300">
                                    <span className="text-purple-300 font-semibold">
                                      {item.previousNotices}
                                    </span>{" "}
                                    related notices from this authority in past 30 days
                                  </p>
                                </div>
                              )}

                              {/* Date and View Official Source Button */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                                <span className="text-xs text-gray-400">
                                  {formatDate(item.date)}
                                </span>
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition font-semibold bg-purple-500/20 px-3 py-1.5 rounded"
                                >
                                  View Official Source
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Collapsed view footer */}
                        {expandedId !== item.id && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                            <span className="text-xs text-gray-400">
                              {formatDate(item.date)}
                            </span>
                            <span className="text-xs text-purple-400 font-semibold">
                              View Details →
                            </span>
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
      </CardContent>
    </Card>
  );
};

export default RegulatoryNewsPanel;
