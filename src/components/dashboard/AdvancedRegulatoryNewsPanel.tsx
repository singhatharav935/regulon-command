/**
 * Advanced Indian Regulatory News Panel
 * Real-time news from government portals and media sources
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Zap,
  Globe,
  Target,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  fetchRegulatoryNews, 
  type NewsItem 
} from "@/lib/advanced-regulatory-service";

const AdvancedRegulatoryNewsPanel = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isExpanded, setIsExpanded] = useState(false); // Main section expansion
  const [isNewsExpanded, setIsNewsExpanded] = useState(false); // News items expansion

  // Load news data
  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 2 * 60 * 1000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, [selectedCategory, selectedSeverity]);

  const loadNews = async () => {
    try {
      setRefreshing(true);
      const params: any = { limit: 20 };
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (selectedSeverity !== "all") params.severity = selectedSeverity;
      
      const data = await fetchRegulatoryNews(params);
      setNews(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadNews();
  };

  // Filter news based on search
  const filteredNews = news.filter(item => 
    searchQuery === "" || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedNews = isNewsExpanded ? filteredNews : filteredNews.slice(0, 6);
  const hiddenNewsCount = filteredNews.length - 6;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'medium': return <Info className="w-4 h-4 text-amber-400" />;
      default: return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-rose-500/40 text-rose-300';
      case 'medium': return 'border-amber-500/40 text-amber-300';
      default: return 'border-emerald-500/40 text-emerald-300';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-rose-500/40 text-rose-300';
      case 'medium': return 'border-amber-500/40 text-amber-300';
      default: return 'border-blue-500/40 text-blue-300';
    }
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

  // Categories for filtering
  const categories = Array.from(new Set(news.map(item => item.category))).filter(Boolean);
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-emerald-300" />
            <p className="text-sm tracking-wider uppercase text-emerald-300">Live News Intelligence</p>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
            Indian Regulatory News
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Real-time regulatory updates from government portals and leading business media across India.
          </p>
          
          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5">
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs text-muted-foreground">Live Feed Active</span>
            </div>
            
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-muted-foreground">
                Updated: {formatTimeAgo(lastRefresh.toISOString())}
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-xs text-muted-foreground">
                {news.length} Active Stories ({news.filter(item => item.authority.includes('Portal')).length} Government + {news.filter(item => !item.authority.includes('Portal')).length} Media)
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={refreshing}
            onClick={handleRefresh}
            className="border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-emerald-300 hover:text-emerald-200"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand News
              </>
            )}
          </Button>
        </div>
      </div>

      {/* News Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/20 border-border/40"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-muted/20 border-border/40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="bg-muted/20 border-border/40">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High Impact</SelectItem>
            <SelectItem value="medium">Medium Impact</SelectItem>
            <SelectItem value="low">Low Impact</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          {filteredNews.length} of {news.length} stories
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/20 mb-4">
          <TabsTrigger value="grid">Card View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-3">
          {/* News Dropdown Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">
              {filteredNews.length} News Item{filteredNews.length !== 1 ? 's' : ''} Found
            </p>
            {filteredNews.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-300 hover:text-emerald-200"
                onClick={() => setIsNewsExpanded(!isNewsExpanded)}
              >
                {isNewsExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show All ({hiddenNewsCount} more)
                  </>
                )}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-emerald-300" />
              <p className="text-xs text-muted-foreground">Loading latest regulatory news...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-xs text-muted-foreground">No news matches your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {displayedNews.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="glass-card border-border/40 hover:border-border/60 transition-colors h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.authority.includes('Portal') ? 
                              'border-blue-500/40 text-blue-300' : 
                              'border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            {item.authority.includes('Portal') ? '🏛️ ' : '📰 '}{item.authority}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getSeverityIcon(item.severity)}
                          </div>
                        </div>
                        
                        <CardTitle className="text-xs leading-tight line-clamp-2">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        {item.summary && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                            {item.summary}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(item.severity)}`}
                          >
                            {item.severity.toUpperCase()} Impact
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getUrgencyColor(item.urgency)}`}
                          >
                            {item.urgency.toUpperCase()} Priority
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatTimeAgo(item.date)}</span>
                          <div className="flex items-center gap-2">
                            {item.source_url && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => window.open(item.source_url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setExpandedId(
                                expandedId === item.id ? null : item.id
                              )}
                            >
                              {expandedId === item.id ? 
                                <ChevronUp className="w-3 h-3" /> : 
                                <ChevronDown className="w-3 h-3" />
                              }
                            </Button>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 pt-3 border-t border-border/40"
                            >
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="font-medium text-foreground">Category:</span>
                                  <span className="ml-2 text-muted-foreground">{item.category}</span>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-foreground">Regulatory Area:</span>
                                  <span className="ml-2 text-muted-foreground">{item.regulatory_area}</span>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-foreground">Affected Entities:</span>
                                  <span className="ml-2 text-muted-foreground">{item.affected_entities}</span>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-foreground">Implementation:</span>
                                  <span className="ml-2 text-muted-foreground">{item.implementation_status}</span>
                                </div>
                                
                                {item.previous_notices && item.previous_notices > 0 && (
                                  <div>
                                    <span className="font-medium text-foreground">Previous Notices:</span>
                                    <span className="ml-2 text-muted-foreground">{item.previous_notices}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">
              Latest Regulatory Updates
            </p>
            {filteredNews.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-300 hover:text-emerald-200"
                onClick={() => setIsNewsExpanded(!isNewsExpanded)}
              >
                {isNewsExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show All ({hiddenNewsCount} more)
                  </>
                )}
              </Button>
            )}
          </div>
          
          {displayedNews.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="glass-card p-4 border border-border/40 hover:border-border/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs border-emerald-500/40 text-emerald-300"
                    >
                      {item.authority}
                    </Badge>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSeverityColor(item.severity)}`}
                    >
                      {item.severity.toUpperCase()}
                    </Badge>
                    
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(item.date)}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-foreground mb-1 line-clamp-2">
                    {item.title}
                  </h4>
                  
                  {item.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {getSeverityIcon(item.severity)}
                  {item.source_url && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(item.source_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Compact Preview when collapsed */}
      {!isExpanded && (
        <div className="mt-4 p-4 rounded-lg bg-muted/10 border border-border/40">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{news.length} regulatory news items available</span>
            <span>Last updated: {formatTimeAgo(lastRefresh.toISOString())}</span>
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default AdvancedRegulatoryNewsPanel;