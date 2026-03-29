import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  Zap,
  Shield,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary?: string;
  authority: string;
  impact: string;
  caActionItems?: string[];
  date: string;
  severity: "high" | "medium" | "low";
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
    const interval = setInterval(fetchNews, 30000); // Refresh every 30s
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
    <Card className="border-indigo-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <CardHeader className="border-b border-indigo-500/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-400" />
            <div>
              <CardTitle className="text-lg text-white">
                Regulatory Compliance Updates
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Latest regulatory changes & CA action items
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/50">
            {news.length} Updates
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-300 text-sm">
            {error}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No regulatory news available
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
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${getSeverityBgColor(
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-xs bg-slate-800 border-slate-600"
                              >
                                {item.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-slate-700 border-slate-600"
                              >
                                {item.authority}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-semibold text-white mt-2 line-clamp-2">
                              {item.title}
                            </h4>
                          </div>
                        </div>

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
                              className="mt-3 space-y-3 border-t border-slate-700 pt-3"
                            >
                              {/* Impact section */}
                              <div>
                                <p className="text-xs font-semibold text-gray-300 mb-1">
                                  Impact Level:
                                </p>
                                <p className="text-sm text-gray-200">
                                  {item.impact}
                                </p>
                              </div>

                              {/* CA Action Items */}
                              {item.caActionItems && item.caActionItems.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-indigo-300 mb-2">
                                    CA Action Items:
                                  </p>
                                  <ul className="space-y-1">
                                    {item.caActionItems.map(
                                      (action, actionIdx) => (
                                        <li
                                          key={actionIdx}
                                          className="flex items-start gap-2 text-xs text-gray-300"
                                        >
                                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-indigo-400 flex-shrink-0" />
                                          <span>{action}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                              {/* Date */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                                <span className="text-xs text-gray-400">
                                  {formatDate(item.date)}
                                </span>
                                <button className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition">
                                  View Details
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Collapsed view footer */}
                        {expandedId !== item.id && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(item.date)}
                            </span>
                            <span className="text-xs text-indigo-400">
                              {item.caActionItems?.length || 0} actions →
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
