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
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Mock data for Indian regulatory news - past 1 month compliance updates
        const mockNews: NewsItem[] = [
          {
            id: "news-001",
            category: "GST",
            title: "New GST Return Filing Format - GSTR-3B Auto-Population",
            summary: "GSTN introduces simplified GSTR-3B filing with auto-population from GSTR-2B. Reduces manual entry errors.",
            authority: "Goods and Services Tax Network (GSTN)",
            sourceUrl: "https://www.gstn.org/news",
            impactType: "filing_change",
            affectedEntities: "All GST registered businesses",
            implementationStatus: "active",
            urgency: "high",
            regulatoryArea: "GST Compliance",
            date: "2024-03-01",
            severity: "high",
            previousNotices: 3,
          },
          {
            id: "news-002",
            category: "Income Tax",
            title: "TDS Rate Changes on Contractor Payments",
            summary: "Increase in TDS rate from 1% to 2% on contractor payments above ₹30,000.",
            authority: "Income Tax Department",
            sourceUrl: "https://www.incometaxindia.gov.in/notices",
            impactType: "rate_change",
            affectedEntities: "Businesses making contractor payments",
            implementationStatus: "active",
            urgency: "high",
            regulatoryArea: "Income Tax",
            date: "2024-02-28",
            severity: "high",
            previousNotices: 2,
          },
          {
            id: "news-003",
            category: "Labour Compliance",
            title: "Updated Provident Fund Contribution Rates FY 2024-25",
            summary: "EPF contribution rates adjusted. Employee contribution increased by 0.5%.",
            authority: "Employee Provident Fund Organization (EPFO)",
            sourceUrl: "https://www.epfo.gov.in",
            impactType: "rate_change",
            affectedEntities: "Employers with EPF members",
            implementationStatus: "active",
            urgency: "medium",
            regulatoryArea: "Labour Compliance",
            date: "2024-02-15",
            severity: "medium",
            previousNotices: 1,
          },
          {
            id: "news-004",
            category: "MCA",
            title: "E-Filing Requirements - Digital Signature Mandatory",
            summary: "All MCA filings require advanced e-signature. Class 2 certificates no longer accepted.",
            authority: "Ministry of Corporate Affairs (MCA)",
            sourceUrl: "https://www.mca.gov.in",
            impactType: "compliance_requirement",
            affectedEntities: "Private limited companies",
            implementationStatus: "active",
            urgency: "high",
            regulatoryArea: "MCA Compliance",
            date: "2024-02-10",
            severity: "medium",
            previousNotices: 0,
          },
          {
            id: "news-005",
            category: "RBI",
            title: "Enhanced KYC Verification for Bank Accounts",
            summary: "RBI mandates face-to-face verification. Video KYC accepted as alternative.",
            authority: "Reserve Bank of India (RBI)",
            sourceUrl: "https://www.rbi.org.in",
            impactType: "kyc_requirement",
            affectedEntities: "All bank account holders",
            implementationStatus: "active",
            urgency: "high",
            regulatoryArea: "Banking Compliance",
            date: "2024-03-05",
            severity: "high",
            previousNotices: 1,
          },
        ];
        
        setNews(mockNews);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load news");
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000);
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
      {/* Collapsible Header */}
      <CardHeader 
        className="border-b border-purple-500/20 pb-3 cursor-pointer hover:bg-purple-500/5 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Globe className="w-5 h-5 text-purple-400 animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm text-white">
                  Indian Regulatory News
                </CardTitle>
                <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50 text-purple-300 text-xs">
                  {news.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isExpanded ? "Click to collapse" : "Click to view major changes from past 30 days"}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-purple-400" />
          </motion.div>
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
                </div>
              ) : error ? (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-300 text-xs">
                  {error}
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No regulatory updates in past 30 days
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
                                        item.urgency === "High"
                                          ? "bg-rose-900/40 border-rose-600/60 text-rose-200"
                                          : "bg-amber-900/40 border-amber-600/60 text-amber-200"
                                      }`}
                                    >
                                      {item.urgency}
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
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default RegulatoryNewsPanel;
