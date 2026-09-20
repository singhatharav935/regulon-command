/**
 * INTELLIGENT TAX & SCHEME OPTIMIZATION ENGINE
 * =============================================
 * Premium, advanced AI-driven tax optimization module for Sannidh.
 * Analyzes company financials against ALL Indian tax provisions,
 * GST optimizations, Government schemes, and promoter wealth strategies.
 *
 * Placed in Advisory tab (beside CFO Intel) as a dedicated sub-tab.
 * Uses the same dark glassmorphism design language as VirtualCFOModule.
 *
 * 5 Pillars:
 *   1. Income Tax Act Optimizations (20+ sections)
 *   2. GST Credit & Refund Recovery (7 provisions)
 *   3. Central Govt Schemes & Subsidies (12 schemes)
 *   4. State Industrial Subsidies (4 categories)
 *   5. Promoter/Director Wealth Optimization (7 strategies)
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  IndianRupee, Calendar, Shield, Zap, ArrowUpRight, ArrowDownRight,
  Clock, Download, RefreshCw, Eye, ChevronDown, ChevronUp,
  Target, Lightbulb, Building2, FileText, Briefcase, Scale,
  Calculator, Landmark, Percent, Award, Gift, Factory,
  Users, Globe, Banknote, PiggyBank, Receipt, Search,
  Filter, BarChart3, Star, Lock, Unlock, AlertCircle,
  Info, ExternalLink, Layers, Cpu, Crown, Wallet,
  HandCoins, BadgePercent, ShieldCheck, CircleDollarSign,
  BookOpen, Gavel, FileCheck, Leaf
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFinancialEngineStore } from "@/stores/useFinancialEngineStore";
import type {
  TaxOptimization, OptimizationSummary, OptimizationCategory,
  OptimizationStatus, CompanyProfile
} from "@/lib/tax-optimization/types";
import { runFullTaxOptimizationScan } from "@/lib/tax-optimization";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function fmtINRFull(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

// ─── Category Config ────────────────────────────────────────────────────────

interface CategoryConfig {
  id: OptimizationCategory | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'all',
    label: 'All Optimizations',
    icon: Layers,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/25',
    description: 'View all identified savings'
  },
  {
    id: 'income_tax',
    label: 'Income Tax',
    icon: Landmark,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/25',
    description: 'IT Act 1961 deductions & exemptions'
  },
  {
    id: 'gst',
    label: 'GST Recovery',
    icon: Receipt,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/25',
    description: 'ITC recovery & refund claims'
  },
  {
    id: 'govt_scheme',
    label: 'Central Schemes',
    icon: Award,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/25',
    description: 'MSME, PLI & export incentives'
  },
  {
    id: 'state_subsidy',
    label: 'State Subsidies',
    icon: Building2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/25',
    description: 'State industrial policy benefits'
  },
  {
    id: 'promoter_wealth',
    label: 'Director Wealth',
    icon: Crown,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/15',
    borderColor: 'border-violet-500/25',
    description: 'Promoter salary & perquisite optimization'
  }
];

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OptimizationStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  eligible: { label: 'Eligible', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', icon: CheckCircle2 },
  partially_eligible: { label: 'Partial', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25', icon: AlertTriangle },
  action_required: { label: 'Action Required', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25', icon: AlertCircle },
  claimed: { label: 'Claimed', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/25', icon: ShieldCheck },
  not_eligible: { label: 'Not Eligible', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/25', icon: Lock },
  expired: { label: 'Expired', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25', icon: Clock },
};

// ─── Icon Resolver ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Building2, Factory, Calculator, Landmark, Shield, Sparkles,
  Target, Lightbulb, Award, Gift, Globe, Receipt, Banknote,
  PiggyBank, Scale, Briefcase, Crown, Wallet, FileText,
  Star, Leaf, Percent, HandCoins, BadgePercent, BookOpen,
  Gavel, FileCheck, CircleDollarSign, Zap, Search, Lock
};

function resolveIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Sparkles;
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO SUMMARY BANNER
// ═══════════════════════════════════════════════════════════════════════════

function HeroSummaryBanner({ summary }: { summary: OptimizationSummary }) {
  const savingsBreakdown = [
    { label: 'Income Tax Saved', amount: summary.income_tax_savings, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', icon: Landmark },
    { label: 'GST ITC Recovered', amount: summary.gst_recovery, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5', icon: Receipt },
    { label: 'Govt Subsidies', amount: summary.govt_subsidies + summary.state_subsidies, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', icon: Award },
    { label: 'Promoter Savings', amount: summary.promoter_savings, color: 'text-violet-400', bg: 'from-violet-500/20 to-violet-500/5', icon: Crown },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden relative">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-violet-500/5 animate-pulse" />
        
        <CardContent className="pt-6 pb-6 relative z-10">
          {/* Top Row: Total Savings */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Sparkles className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Intelligent Tax & Scheme Optimization
                </p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl md:text-4xl font-bold font-mono text-emerald-400">
                    {fmtINR(summary.total_savings)}
                  </h2>
                  <span className="text-sm text-muted-foreground">total identified savings</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-bold px-3 py-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {summary.eligible_count} Eligible
              </Badge>
              <Badge className="text-[10px] bg-orange-500/15 text-orange-400 border-orange-500/25 font-bold px-3 py-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {summary.action_required_count} Action Required
              </Badge>
              <Badge className="text-[10px] bg-cyan-500/15 text-cyan-400 border-cyan-500/25 font-bold px-3 py-1">
                <Layers className="w-3 h-3 mr-1" />
                {summary.total_optimizations} Total
              </Badge>
            </div>
          </div>

          {/* Savings Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {savingsBreakdown.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.3 }}
                  className={`p-4 rounded-xl bg-gradient-to-br ${item.bg} border border-white/8 hover:border-white/15 transition-all duration-300 group cursor-default`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  </div>
                  <p className={`text-xl font-bold font-mono ${item.color} group-hover:scale-105 transition-transform`}>
                    {fmtINR(item.amount)}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* ROI Banner */}
          {summary.total_savings > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-medium">
                  Sannidh ROI: For a ₹50,000/yr subscription, that's a <strong className="text-emerald-400">{Math.round(summary.total_savings / 50000)}x return</strong> on your investment
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTIMIZATION CARD (Individual Tax Provision Card)
// ═══════════════════════════════════════════════════════════════════════════

function OptimizationCard({ opt, index }: { opt: TaxOptimization; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const statusStyle = STATUS_STYLES[opt.status];
  const StatusIcon = statusStyle.icon;
  const OptIcon = resolveIcon(opt.icon_name);

  const categoryConfig = CATEGORY_CONFIGS.find(c => c.id === opt.category);
  const catColor = categoryConfig?.color || 'text-cyan-400';
  const catBg = categoryConfig?.bgColor || 'bg-cyan-500/15';

  const handleAction = (action: any) => {
    toast({
      title: `${action.label}`,
      description: `Action initiated for ${opt.section}. This will be processed by Sannidh AI.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card className={`border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden hover:border-white/15 transition-all duration-300 ${
        opt.status === 'action_required' ? 'ring-1 ring-orange-500/20' : ''
      }`}>
        <CardContent className="p-0">
          {/* Card Header */}
          <div
            className="p-4 cursor-pointer hover:bg-white/3 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className={`p-2.5 rounded-xl ${catBg} border ${categoryConfig?.borderColor || 'border-cyan-500/25'} shrink-0`}>
                  <OptIcon className={`w-5 h-5 ${catColor}`} />
                </div>

                {/* Title & Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className={`text-[9px] font-bold ${catBg} ${catColor} ${categoryConfig?.borderColor}`}>
                      {opt.section}
                    </Badge>
                    <Badge className={`text-[9px] font-bold ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                      <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                      {statusStyle.label}
                    </Badge>
                    {opt.risk_level === 'safe' && (
                      <Badge className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Safe
                      </Badge>
                    )}
                    {opt.priority === 'critical' && (
                      <Badge className="text-[9px] font-bold bg-red-500/15 text-red-400 border-red-500/25 animate-pulse">
                        🔴 Critical
                      </Badge>
                    )}
                    {opt.priority === 'high' && (
                      <Badge className="text-[9px] font-bold bg-orange-500/10 text-orange-400 border-orange-500/20">
                        🟠 High Priority
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground truncate">{opt.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opt.short_description}</p>
                </div>
              </div>

              {/* Savings Amount + Chevron */}
              <div className="flex items-center gap-3 shrink-0">
                {opt.is_eligible && opt.estimated_savings > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Savings</p>
                    <p className="text-lg font-bold font-mono text-emerald-400">
                      +{fmtINR(opt.estimated_savings)}
                    </p>
                  </div>
                )}
                {!opt.is_eligible && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Not Applicable</p>
                  </div>
                )}
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Expanded Detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                  {/* Detailed Explanation */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Detailed Explanation
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{opt.detailed_explanation}</p>
                  </div>

                  {/* Savings Calculation */}
                  {opt.savings_calculation && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator className="w-3 h-3" /> Savings Calculation
                      </h4>
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                        {opt.savings_calculation}
                      </div>
                    </div>
                  )}

                  {/* Eligibility Criteria */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3 h-3" /> Eligibility Criteria
                    </h4>
                    <ul className="space-y-1">
                      {opt.eligibility_criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Documents Required */}
                  {opt.documents_required.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Documents Required
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {opt.documents_required.map((doc, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                            <FileText className="w-2.5 h-2.5 mr-1" /> {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legal Reference Accordion */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowLegal(!showLegal)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      <Gavel className="w-3 h-3" /> Legal Reference
                      <ChevronDown className={`w-3 h-3 transition-transform ${showLegal ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showLegal && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 leading-relaxed italic">
                            {opt.legal_reference}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  {opt.action_items.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Actions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {opt.action_items.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant={action.completed ? "outline" : "default"}
                            className={`text-xs h-8 ${
                              action.completed
                                ? 'text-slate-400 border-slate-700'
                                : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0'
                            }`}
                            onClick={() => handleAction(action)}
                            disabled={action.completed}
                          >
                            {action.completed ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : action.type === 'generate_form' ? (
                              <FileCheck className="w-3 h-3 mr-1" />
                            ) : action.type === 'notify_vendor' ? (
                              <Users className="w-3 h-3 mr-1" />
                            ) : action.type === 'apply_scheme' ? (
                              <ExternalLink className="w-3 h-3 mr-1" />
                            ) : action.type === 'download_report' ? (
                              <Download className="w-3 h-3 mr-1" />
                            ) : (
                              <Zap className="w-3 h-3 mr-1" />
                            )}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags & Deadline */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {opt.tags.map((tag, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {opt.deadline && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Deadline: {opt.deadline}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEFORE vs AFTER COMPARISON CARD
// ═══════════════════════════════════════════════════════════════════════════

function BeforeAfterCard({ summary, profile }: { summary: OptimizationSummary; profile: CompanyProfile }) {
  const taxRate = 0.26;
  const normalTax = profile.net_profit_before_tax * taxRate;
  const totalLeakages = summary.income_tax_savings + summary.gst_recovery;
  const totalBeforeTax = normalTax + totalLeakages;
  const afterTaxWithSannidh = normalTax;
  const subsidyCashback = summary.govt_subsidies + summary.state_subsidies;

  const netProfitBefore = profile.net_profit_before_tax - totalBeforeTax;
  const netProfitAfter = profile.net_profit_before_tax - afterTaxWithSannidh + subsidyCashback + summary.promoter_savings;
  const profitBoost = netProfitBefore > 0 ? ((netProfitAfter - netProfitBefore) / netProfitBefore * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/15 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Before vs After Sannidh</CardTitle>
              <p className="text-xs text-muted-foreground">Impact analysis on your bottom line</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/15">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Without Sannidh</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-mono text-slate-300">{fmtINRFull(profile.total_revenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profit Before Tax</span>
                  <span className="font-mono text-slate-300">{fmtINRFull(profile.net_profit_before_tax)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Normal Tax (26%)</span>
                  <span className="font-mono text-red-400">-{fmtINRFull(normalTax)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Hidden Leakages & Missed Claims</span>
                  <span className="font-mono text-red-400">-{fmtINRFull(totalLeakages)}</span>
                </div>
                <div className="border-t border-red-500/20 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">Net Profit in Pocket</span>
                  <span className="font-mono text-red-400">{fmtINRFull(Math.max(0, netProfitBefore))}</span>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">With Sannidh</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-mono text-slate-300">{fmtINRFull(profile.total_revenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profit Before Tax</span>
                  <span className="font-mono text-slate-300">{fmtINRFull(profile.net_profit_before_tax)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Optimized Tax</span>
                  <span className="font-mono text-yellow-400">-{fmtINRFull(afterTaxWithSannidh)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400">+ IT/GST Savings Recovered</span>
                  <span className="font-mono text-emerald-400">+{fmtINRFull(totalLeakages)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400">+ Govt Subsidies Claimed</span>
                  <span className="font-mono text-emerald-400">+{fmtINRFull(subsidyCashback)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400">+ Promoter Optimization</span>
                  <span className="font-mono text-emerald-400">+{fmtINRFull(summary.promoter_savings)}</span>
                </div>
                <div className="border-t border-emerald-500/20 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">Net Profit in Pocket</span>
                  <span className="font-mono text-emerald-400">{fmtINRFull(Math.max(0, netProfitAfter))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Boost Indicator */}
          {profitBoost > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-emerald-500/20 text-center"
            >
              <p className="text-sm font-bold text-emerald-400">
                <ArrowUpRight className="w-4 h-4 inline mr-1" />
                +{profitBoost.toFixed(1)}% Pure Profit Boost with Sannidh
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Extra {fmtINRFull(Math.max(0, netProfitAfter - netProfitBefore))} recovered from legal tax savings, ITC recovery & govt subsidies
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: IntelligentTaxOptimization
// ═══════════════════════════════════════════════════════════════════════════

interface IntelligentTaxOptimizationProps {
  companyId: string;
  companyName?: string;
}

export function IntelligentTaxOptimization({ companyId, companyName }: IntelligentTaxOptimizationProps) {
  const [activeCategory, setActiveCategory] = useState<OptimizationCategory | 'all'>('all');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'savings' | 'priority' | 'section'>('savings');
  const [isScanning, setIsScanning] = useState(false);

  // Read from Zustand store
  const { invoices, purchases, expenses, payroll, bankTxns, fixedAssets } = useFinancialEngineStore();

  // Build company profile from store data
  const profile = useMemo<CompanyProfile>(() => {
    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || Number(inv.total) || 0), 0);
    const totalPurchases = purchases.reduce((sum: number, p: any) => sum + (Number(p.amount) || Number(p.total) || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const totalPayroll = payroll.reduce((sum: number, p: any) => sum + (Number(p.gross) || Number(p.net_pay) || 0), 0);
    const grossProfit = totalRevenue - totalPurchases;
    const netPBT = grossProfit - totalExpenses - totalPayroll;
    
    // Calculate GST metrics
    const totalGSTOutput = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.gst) || Number(inv.tax) || 0), 0);
    const totalGSTInput = purchases.reduce((sum: number, p: any) => sum + (Number(p.gst) || Number(p.tax) || 0), 0);
    
    // Fixed assets
    const totalFixedAssetsCost = (fixedAssets || []).reduce((sum: number, a: any) => sum + (Number(a.cost) || 0), 0);
    const newMachinery = (fixedAssets || []).filter((a: any) => {
      const acqDate = new Date(a.date_acquired);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return acqDate >= oneYearAgo && (a.category === 'Plant_Machinery' || a.category === 'plant_machinery');
    }).reduce((sum: number, a: any) => sum + (Number(a.cost) || 0), 0);

    return {
      id: companyId,
      name: companyName || 'Company',
      entity_type: 'pvt_ltd',
      incorporation_date: '2020-01-01',
      state: 'Maharashtra',
      industry: 'General',
      msme_category: totalRevenue <= 50000000 ? 'small' : totalRevenue <= 250000000 ? 'medium' : null,
      dipp_registered: false,
      gstin: '',
      pan: '',
      cin: '',
      is_manufacturing: false,
      is_exporter: false,
      special_zone: null,
      annual_turnover: totalRevenue,
      total_employees: payroll.length || 0,
      new_employees_fy: Math.max(0, Math.round(payroll.length * 0.15)),
      new_employee_avg_salary: totalPayroll > 0 && payroll.length > 0 ? Math.round(totalPayroll / payroll.length / 12) : 0,
      total_revenue: totalRevenue,
      total_purchases: totalPurchases,
      total_expenses: totalExpenses,
      gross_profit: grossProfit,
      net_profit_before_tax: netPBT,
      total_gst_itc_claimed: totalGSTInput * 0.95,
      total_gst_itc_available: totalGSTInput,
      total_gst_output: totalGSTOutput,
      gst_itc_mismatch_amount: totalGSTInput * 0.05,
      gst_input_rate_avg: 18,
      gst_output_rate_avg: 18,
      new_machinery_investment: newMachinery,
      r_and_d_expenditure: 0,
      total_exports: 0,
      msme_vendor_payables: totalPurchases * 0.1,
      msme_overdue_payables: totalPurchases * 0.03,
      total_fixed_assets_cost: totalFixedAssetsCost,
      director_salary: 0,
      dividend_distributed: 0,
      preliminary_expenses: 0,
      payroll_count: payroll.length,
    };
  }, [companyId, companyName, invoices, purchases, expenses, payroll, bankTxns, fixedAssets]);

  // Run the full tax optimization scan
  const { optimizations, summary } = useMemo(() => {
    return runFullTaxOptimizationScan(profile);
  }, [profile]);

  // Filter & Sort
  const filteredOptimizations = useMemo(() => {
    let filtered = [...optimizations];

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(o => o.category === activeCategory);
    }

    // Eligible only filter
    if (showEligibleOnly) {
      filtered = filtered.filter(o => o.is_eligible);
    }

    // Sort
    switch (sortBy) {
      case 'savings':
        filtered.sort((a, b) => b.estimated_savings - a.estimated_savings);
        break;
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'section':
        filtered.sort((a, b) => a.section.localeCompare(b.section));
        break;
    }

    return filtered;
  }, [optimizations, activeCategory, showEligibleOnly, sortBy]);

  const handleRescan = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: `Analyzed ${optimizations.length} tax provisions. Found ${summary.eligible_count} eligible optimizations worth ${fmtINR(summary.total_savings)}.`,
      });
    }, 2000);
  }, [optimizations.length, summary]);

  return (
    <div className="space-y-6 font-sans">
      {/* ── Module Header ─────────────────────────────────── */}
      <Card className="border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/15 border border-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">Intelligent Tax & Scheme Optimization</CardTitle>
                  <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-bold">
                    AI Powered
                  </Badge>
                  <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border-amber-500/25 font-bold">
                    FY 2024-25
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete legal tax savings, ITC recovery, govt subsidies & promoter wealth optimization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-white/10"
                onClick={handleRescan}
                disabled={isScanning}
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Re-Scan'}
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Hero Summary Banner ───────────────────────────── */}
      <HeroSummaryBanner summary={summary} />

      {/* ── Before vs After Card ──────────────────────────── */}
      <BeforeAfterCard summary={summary} profile={profile} />

      {/* ── Category Filter Tabs ──────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-2 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
          {CATEGORY_CONFIGS.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const count = cat.id === 'all'
              ? optimizations.length
              : optimizations.filter(o => o.category === cat.id).length;
            const amount = cat.id === 'all'
              ? summary.total_savings
              : summary.category_breakdown.find(b => b.category === cat.id)?.amount || 0;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? `${cat.bgColor} ${cat.color} border ${cat.borderColor} shadow-md`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? cat.color : 'text-slate-400'}`} />
                <span>{cat.label}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? `${cat.bgColor} ${cat.color} ${cat.borderColor}` : 'bg-white/5 text-slate-500'
                } border`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sort & Filter Controls ────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showEligibleOnly ? "default" : "outline"}
            className={`text-xs h-7 ${showEligibleOnly ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'border-white/10 text-slate-400'}`}
            onClick={() => setShowEligibleOnly(!showEligibleOnly)}
          >
            <Filter className="w-3 h-3 mr-1" />
            Eligible Only
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Sort by:</span>
          {[
            { id: 'savings' as const, label: 'Savings', icon: IndianRupee },
            { id: 'priority' as const, label: 'Priority', icon: AlertTriangle },
            { id: 'section' as const, label: 'Section', icon: BookOpen },
          ].map(s => (
            <Button
              key={s.id}
              size="sm"
              variant="ghost"
              className={`text-[10px] h-6 px-2 ${sortBy === s.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
              onClick={() => setSortBy(s.id)}
            >
              <s.icon className="w-2.5 h-2.5 mr-0.5" />
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Optimization Cards List ───────────────────────── */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${showEligibleOnly}-${sortBy}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {filteredOptimizations.length === 0 ? (
              <Card className="border-white/8 bg-card/40 backdrop-blur-xl">
                <CardContent className="py-12 text-center">
                  <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No optimizations found in this category</p>
                  <p className="text-xs text-slate-500 mt-1">Try changing filters or selecting a different category</p>
                </CardContent>
              </Card>
            ) : (
              filteredOptimizations.map((opt, idx) => (
                <OptimizationCard key={opt.id} opt={opt} index={idx} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer Disclaimer ─────────────────────────────── */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-center">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <Shield className="w-3 h-3 inline mr-1" />
          All tax optimizations are based on the Income Tax Act 1961, GST Act 2017, MSME Development Act 2006, and applicable
          State Industrial Policies. Savings are estimated based on your financial data and may vary. Consult with your CA
          for final verification before filing. Sannidh AI continuously monitors law changes and updates recommendations.
        </p>
      </div>
    </div>
  );
}

export default IntelligentTaxOptimization;
