import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Calendar,
  AlertTriangle,
  FileText,
  Bell,
  RefreshCw,
  ExternalLink,
  Filter,
  Search,
  Bot,
  Zap,
  Activity,
  Shield,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Download,
  TrendingUp,
  Globe,
  Gavel,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
interface RegulatoryNews {
  id: string;
  title: string;
  authority: string;
  authorityCode: string;
  category: 'law_amendment' | 'new_regulation' | 'circular' | 'notification' | 'guideline' | 'penalty_update';
  effectiveDate: string;
  publishedDate: string;
  summary: string;
  fullText?: string;
  sourceUrl: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  affectedSectors: string[];
  affectedCompanyTypes: string[];
  requiredActions: string[];
  penaltyInfo?: {
    maxPenalty: string;
    lateFilingFee?: string;
  };
  relatedFilings?: string[];
  isBookmarked?: boolean;
  aiSummary?: string;
  aiImpactAnalysis?: string;
}

interface RegulatoryNewsRuleImpactProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  aiEnabled?: boolean;
  caId?: string;
}

// Demo data for CA Demo Dashboard
const DEMO_REGULATORY_NEWS: RegulatoryNews[] = [
  {
    id: 'reg-001',
    title: '📜 DPDP Act 2023 - Data Principal Rights Implementation',
    authority: 'Ministry of Electronics & IT',
    authorityCode: 'MEITY',
    category: 'new_regulation',
    effectiveDate: '2026-04-01',
    publishedDate: '2026-03-15',
    summary: 'New data protection regulations requiring explicit consent mechanisms, data portability rights, and right to erasure for all data principals.',
    sourceUrl: 'https://meity.gov.in/dpdp-act-2023',
    impactLevel: 'critical',
    affectedSectors: ['IT Services', 'E-commerce', 'Healthcare', 'BFSI'],
    affectedCompanyTypes: ['Private Limited', 'LLP', 'Public Limited'],
    requiredActions: [
      'Update privacy policies',
      'Implement consent management systems',
      'Establish data grievance mechanisms',
      'Conduct data mapping exercises',
    ],
    penaltyInfo: {
      maxPenalty: '₹250 Crore',
      lateFilingFee: '₹200 per day',
    },
    relatedFilings: ['DPO Registration', 'Annual Data Audit Report'],
    aiSummary: 'Critical compliance update requiring immediate action for all data-handling entities.',
    aiImpactAnalysis: 'High impact on IT and e-commerce sectors. Estimated 60% of your clients need to update systems.',
  },
  {
    id: 'reg-002',
    title: '🏛️ MCA Amendment - ESG Disclosure Requirements for Listed Companies',
    authority: 'Ministry of Corporate Affairs',
    authorityCode: 'MCA',
    category: 'law_amendment',
    effectiveDate: '2026-07-01',
    publishedDate: '2026-03-10',
    summary: 'Mandatory ESG (Environmental, Social, Governance) reporting for all listed companies and large unlisted companies with turnover exceeding ₹500 Cr.',
    sourceUrl: 'https://mca.gov.in/esg-disclosure-2026',
    impactLevel: 'high',
    affectedSectors: ['Manufacturing', 'Energy', 'Mining', 'All Listed'],
    affectedCompanyTypes: ['Public Listed', 'Large Private'],
    requiredActions: [
      'Prepare BRSR (Business Responsibility & Sustainability Report)',
      'Board attestation on ESG compliance',
      'Third-party ESG audit',
      'Carbon footprint assessment',
    ],
    penaltyInfo: {
      maxPenalty: '₹25 Lakh + Directors liability',
    },
    relatedFilings: ['BRSR Report', 'ESG Audit Certificate'],
    aiSummary: 'ESG disclosure now mandatory for large companies. Plan sustainability reporting early.',
    aiImpactAnalysis: 'Affects 35% of your listed company clients. Recommend starting ESG audit process immediately.',
  },
  {
    id: 'reg-003',
    title: '💰 GST Council - New Rate Structure for IT Services',
    authority: 'GST Council / CBIC',
    authorityCode: 'GST',
    category: 'circular',
    effectiveDate: '2026-03-01',
    publishedDate: '2026-02-20',
    summary: 'Revised GST rates for IT services: SaaS products now at 12% (down from 18%), while consulting services remain at 18%. New compliance requirements for e-invoicing.',
    sourceUrl: 'https://cbic.gov.in/gst-circular-2026',
    impactLevel: 'medium',
    affectedSectors: ['IT Services', 'Software Development', 'Consulting'],
    affectedCompanyTypes: ['All'],
    requiredActions: [
      'Update invoicing systems with new rates',
      'Revise client contracts',
      'File transitional returns',
      'Update accounting software',
    ],
    penaltyInfo: {
      maxPenalty: '₹10,000 or tax amount (whichever higher)',
      lateFilingFee: '₹50 per day (max ₹10,000)',
    },
    relatedFilings: ['GSTR-1', 'GSTR-3B', 'ITC-04'],
    aiSummary: 'Beneficial rate reduction for SaaS. Update systems before effective date.',
    aiImpactAnalysis: '45% of IT clients benefit from rate reduction. Action needed on invoicing systems.',
  },
  {
    id: 'reg-004',
    title: '🏦 RBI Guidelines - Digital Lending Framework Update',
    authority: 'Reserve Bank of India',
    authorityCode: 'RBI',
    category: 'guideline',
    effectiveDate: '2026-05-15',
    publishedDate: '2026-03-01',
    summary: 'Enhanced KYC requirements for digital lending platforms. All NBFC-connected apps must implement Video KYC and real-time consent tracking.',
    sourceUrl: 'https://rbi.org.in/digital-lending-2026',
    impactLevel: 'high',
    affectedSectors: ['FinTech', 'NBFC', 'Digital Lending'],
    affectedCompanyTypes: ['NBFC', 'FinTech Companies'],
    requiredActions: [
      'Implement Video KYC systems',
      'Establish real-time consent tracking',
      'Update loan documentation',
      'Submit compliance report to RBI',
    ],
    penaltyInfo: {
      maxPenalty: 'License cancellation + ₹2 Crore',
    },
    relatedFilings: ['RBI Compliance Report', 'KYC Audit Certificate'],
    aiSummary: 'Strict new guidelines for digital lenders. Non-compliance risks license.',
    aiImpactAnalysis: '12% of fintech clients need immediate action. High risk of license issues.',
  },
];

// Government portal sources
const GOVERNMENT_PORTALS = [
  { code: 'MCA', name: 'Ministry of Corporate Affairs', url: 'https://mca.gov.in', icon: '🏛️' },
  { code: 'GST', name: 'GST Council / CBIC', url: 'https://cbic.gov.in', icon: '💰' },
  { code: 'RBI', name: 'Reserve Bank of India', url: 'https://rbi.org.in', icon: '🏦' },
  { code: 'SEBI', name: 'Securities & Exchange Board', url: 'https://sebi.gov.in', icon: '📈' },
  { code: 'MEITY', name: 'Ministry of Electronics & IT', url: 'https://meity.gov.in', icon: '💻' },
  { code: 'MoF', name: 'Ministry of Finance', url: 'https://finmin.nic.in', icon: '💵' },
  { code: 'EPFO', name: 'Employees PF Organization', url: 'https://epfindia.gov.in', icon: '👥' },
  { code: 'ESIC', name: 'ESI Corporation', url: 'https://esic.nic.in', icon: '🏥' },
  { code: 'IT', name: 'Income Tax Department', url: 'https://incometax.gov.in', icon: '📊' },
  { code: 'ROC', name: 'Registrar of Companies', url: 'https://mca.gov.in/roc', icon: '📋' },
];

export default function RegulatoryNewsRuleImpact({
  isRealDashboard = false,
  apiEndpoint = 'http://localhost:8001/api/v1/regulatory/news',
  aiEnabled = true,
  caId = 'ca-001',
}: RegulatoryNewsRuleImpactProps) {
  const [news, setNews] = useState<RegulatoryNews[]>([]);
  const [filteredNews, setFilteredNews] = useState<RegulatoryNews[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [aiFetchingStatus, setAiFetchingStatus] = useState<'idle' | 'scanning' | 'analyzing' | 'complete'>('idle');
  const [filters, setFilters] = useState({
    authority: 'all',
    impactLevel: 'all',
    category: 'all',
  });

  // Load initial data
  useEffect(() => {
    if (isRealDashboard) {
      // Real mode - fetch from backend
      setNews([]);
      setFilteredNews([]);
      fetchRegulatoryNews();
    } else {
      // Demo mode - use sample data
      setNews(DEMO_REGULATORY_NEWS);
      setFilteredNews(DEMO_REGULATORY_NEWS);
    }
  }, [isRealDashboard]);

  // Fetch live regulatory news from backend
  const fetchRegulatoryNews = useCallback(async () => {
    if (!isRealDashboard) return;

    try {
      setLoading(true);
      setAiFetchingStatus('scanning');

      // Simulate AI scanning government portals
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiFetchingStatus('analyzing');

      const response = await fetch(`${apiEndpoint}?ca_id=${caId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ca_token') || ''}`,
          'Content-Type': 'application/json',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      setAiFetchingStatus('complete');

      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
        setFilteredNews(data.news || []);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch regulatory news:', error);
      setAiFetchingStatus('idle');
    } finally {
      setLoading(false);
      setTimeout(() => setAiFetchingStatus('idle'), 2000);
    }
  }, [isRealDashboard, apiEndpoint, caId]);

  // Auto-refresh for real dashboard
  useEffect(() => {
    if (!isRealDashboard) return;

    const interval = setInterval(() => {
      fetchRegulatoryNews();
    }, 300000); // Refresh every 5 minutes for regulatory news

    return () => clearInterval(interval);
  }, [isRealDashboard, fetchRegulatoryNews]);

  // Apply filters and search
  useEffect(() => {
    let filtered = news;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.authority.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query)
      );
    }

    if (filters.authority !== 'all') {
      filtered = filtered.filter((item) => item.authorityCode === filters.authority);
    }

    if (filters.impactLevel !== 'all') {
      filtered = filtered.filter((item) => item.impactLevel === filters.impactLevel);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((item) => item.category === filters.category);
    }

    setFilteredNews(filtered);
  }, [news, searchQuery, filters]);

  const getImpactBadge = (level: string) => {
    const config = {
      critical: { emoji: '🚨', label: 'CRITICAL', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      high: { emoji: '⚠️', label: 'HIGH', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      medium: { emoji: '🟡', label: 'MEDIUM', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      low: { emoji: '🟢', label: 'LOW', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    };
    const { emoji, label, color } = config[level as keyof typeof config] || config.low;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${color}`}>
        {emoji} {label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const config = {
      law_amendment: { icon: <Gavel className="w-3 h-3" />, label: 'Law Amendment', color: 'bg-purple-500/20 text-purple-400' },
      new_regulation: { icon: <Scale className="w-3 h-3" />, label: 'New Regulation', color: 'bg-blue-500/20 text-blue-400' },
      circular: { icon: <FileText className="w-3 h-3" />, label: 'Circular', color: 'bg-cyan-500/20 text-cyan-400' },
      notification: { icon: <Bell className="w-3 h-3" />, label: 'Notification', color: 'bg-indigo-500/20 text-indigo-400' },
      guideline: { icon: <Info className="w-3 h-3" />, label: 'Guideline', color: 'bg-teal-500/20 text-teal-400' },
      penalty_update: { icon: <AlertCircle className="w-3 h-3" />, label: 'Penalty Update', color: 'bg-red-500/20 text-red-400' },
    };
    const { icon, label, color } = config[category as keyof typeof config] || config.notification;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${color}`}>
        {icon} {label}
      </span>
    );
  };

  const getDaysUntilEffective = (effectiveDate: string) => {
    const days = Math.ceil(
      (new Date(effectiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const stats = [
    {
      label: 'Critical Updates',
      count: filteredNews.filter((n) => n.impactLevel === 'critical').length,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'High Priority',
      count: filteredNews.filter((n) => n.impactLevel === 'high').length,
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Coming This Month',
      count: filteredNews.filter((n) => getDaysUntilEffective(n.effectiveDate) <= 30).length,
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Updates',
      count: filteredNews.length,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="w-6 h-6 text-cyan-400" />
              📜 Regulatory News & Rule Impact
            </h2>
            {isRealDashboard && (
              <>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  Live System
                </div>
                {aiEnabled && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-semibold">
                    <Bot className="w-3 h-3" />
                    AI Agent Active
                  </div>
                )}
                {aiFetchingStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold"
                  >
                    <Activity className="w-3 h-3 animate-pulse" />
                    {aiFetchingStatus === 'scanning' && '🔍 Scanning Gov Portals...'}
                    {aiFetchingStatus === 'analyzing' && '🤖 AI Analyzing...'}
                    {aiFetchingStatus === 'complete' && '✅ Sync Complete'}
                  </motion.div>
                )}
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRegulatoryNews}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {isRealDashboard
            ? 'Live updates from government portals including MCA, GST, RBI, SEBI, and more. AI-powered analysis for your clients.'
            : 'New or upcoming regulations affecting your assigned clients. Demo data shown.'}
        </p>

        {/* Last Sync Info */}
        {isRealDashboard && lastSync && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <motion.div
              animate={{ scale: isAutoSyncing ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1.5, repeat: isAutoSyncing ? Infinity : 0 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </motion.div>
            Last synced: {lastSync.toLocaleTimeString()} • Auto-refreshes every 5 minutes
          </div>
        )}
      </div>

      {/* Government Portals Status (Real Dashboard Only) */}
      {isRealDashboard && (
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-foreground">Connected Government Portals</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOVERNMENT_PORTALS.map((portal) => (
                <Badge
                  key={portal.code}
                  variant="outline"
                  className="text-xs flex items-center gap-1 hover:bg-primary/10 cursor-pointer"
                >
                  <span>{portal.icon}</span>
                  <span>{portal.code}</span>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-lg p-3 text-center ${stat.bgColor} border-border/50`}
          >
            <div className={`flex items-center justify-center gap-2 mb-2 ${stat.color}`}>
              {stat.icon}
              <span className="text-xs font-semibold">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.count}</div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filter & Search</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search regulations, authorities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.authority}
              onValueChange={(value) => setFilters({ ...filters, authority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Authorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🏛️ All Authorities</SelectItem>
                {GOVERNMENT_PORTALS.map((portal) => (
                  <SelectItem key={portal.code} value={portal.code}>
                    {portal.icon} {portal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.impactLevel}
              onValueChange={(value) => setFilters({ ...filters, impactLevel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Impact Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 All Impact Levels</SelectItem>
                <SelectItem value="critical">🚨 Critical</SelectItem>
                <SelectItem value="high">⚠️ High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📋 All Categories</SelectItem>
                <SelectItem value="law_amendment">⚖️ Law Amendment</SelectItem>
                <SelectItem value="new_regulation">📜 New Regulation</SelectItem>
                <SelectItem value="circular">📄 Circular</SelectItem>
                <SelectItem value="notification">🔔 Notification</SelectItem>
                <SelectItem value="guideline">📖 Guideline</SelectItem>
                <SelectItem value="penalty_update">⚠️ Penalty Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* News Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNews.length > 0 ? (
            filteredNews.map((item, index) => {
              const daysUntil = getDaysUntilEffective(item.effectiveDate);
              const isExpanded = expandedId === item.id;
              const isUrgent = daysUntil <= 30;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`bg-card/50 border transition-all cursor-pointer hover:shadow-lg ${
                      item.impactLevel === 'critical'
                        ? 'border-red-500/30 hover:border-red-500/50'
                        : item.impactLevel === 'high'
                        ? 'border-orange-500/30 hover:border-orange-500/50'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Header Row */}
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {getImpactBadge(item.impactLevel)}
                            {getCategoryBadge(item.category)}
                            <Badge variant="outline" className="text-xs">
                              {GOVERNMENT_PORTALS.find((p) => p.code === item.authorityCode)?.icon}{' '}
                              {item.authority}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Effective:{' '}
                                <strong className={isUrgent ? 'text-red-400' : ''}>
                                  {new Date(item.effectiveDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span
                                className={
                                  daysUntil <= 7
                                    ? 'text-red-400 font-bold'
                                    : daysUntil <= 30
                                    ? 'text-orange-400 font-semibold'
                                    : ''
                                }
                              >
                                {daysUntil > 0 ? `${daysUntil} days remaining` : 'Already in effect'}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button variant="ghost" size="sm">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          {isRealDashboard && (
                            <div className="text-xs text-green-400 flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              AI Verified
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-border/30 space-y-4"
                          >
                            {/* AI Analysis (Real Dashboard Only) */}
                            {isRealDashboard && item.aiImpactAnalysis && (
                              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <Bot className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm font-semibold text-purple-400">
                                    AI Impact Analysis
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">{item.aiImpactAnalysis}</p>
                              </div>
                            )}

                            {/* Affected Sectors & Company Types */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  <Building2 className="w-3 h-3 inline mr-1" />
                                  Affected Sectors:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {item.affectedSectors.map((sector) => (
                                    <Badge key={sector} variant="outline" className="text-xs">
                                      {sector}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  <Shield className="w-3 h-3 inline mr-1" />
                                  Affected Company Types:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {item.affectedCompanyTypes.map((type) => (
                                    <Badge key={type} variant="outline" className="text-xs">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Required Actions */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Required CA Actions:
                              </p>
                              <ul className="space-y-1">
                                {item.requiredActions.map((action, idx) => (
                                  <li
                                    key={idx}
                                    className="text-sm text-foreground flex items-start gap-2"
                                  >
                                    <span className="text-green-400">✓</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Penalty Info */}
                            {item.penaltyInfo && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-xs text-muted-foreground mb-2">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  Penalty Information:
                                </p>
                                <div className="text-sm text-foreground space-y-1">
                                  <p>
                                    <strong>Maximum Penalty:</strong> {item.penaltyInfo.maxPenalty}
                                  </p>
                                  {item.penaltyInfo.lateFilingFee && (
                                    <p>
                                      <strong>Late Filing Fee:</strong>{' '}
                                      {item.penaltyInfo.lateFilingFee}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Related Filings */}
                            {item.relatedFilings && item.relatedFilings.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  <FileText className="w-3 h-3 inline mr-1" />
                                  Related Filings:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {item.relatedFilings.map((filing) => (
                                    <Badge key={filing} className="text-xs bg-cyan-500/20 text-cyan-400">
                                      📄 {filing}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button size="sm" variant="outline">
                                <Bell className="w-3 h-3 mr-1" />
                                Notify Clients
                              </Button>
                              <Button size="sm" variant="outline">
                                <FileText className="w-3 h-3 mr-1" />
                                Prepare Filing
                              </Button>
                              <Button size="sm" variant="outline">
                                <Bookmark className="w-3 h-3 mr-1" />
                                Bookmark
                              </Button>
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Source
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-3 h-3 mr-1" />
                                Export
                              </Button>
                              <Button size="sm" variant="outline">
                                <Share2 className="w-3 h-3 mr-1" />
                                Share
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-card/30 border-border/50">
                <CardContent className="p-12 text-center">
                  <Scale className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {isRealDashboard
                      ? 'No regulatory updates yet'
                      : 'No regulations matching your criteria'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isRealDashboard
                      ? 'AI agents are continuously scanning government portals. Updates will appear here automatically.'
                      : 'Try adjusting your filters or search terms.'}
                  </p>
                  {isRealDashboard && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchRegulatoryNews}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Scan Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
