/**
 * INTELLIGENT TAX OPTIMIZATION — MASTER INDEX
 * =============================================
 * Aggregates all 4 optimization engines and produces a unified
 * scan result with categorized summary.
 */

export * from './types';
export { analyzeIncomeTaxOptimizations } from './tax-rules-engine';
export { analyzeGSTOptimizations } from './gst-optimization-engine';
export { analyzeGovtSchemeOptimizations } from './govt-schemes-engine';
export { analyzePromoterOptimizations } from './promoter-optimization-engine';

import type { CompanyProfile, TaxOptimization, OptimizationSummary, OptimizationCategory } from './types';
import { analyzeIncomeTaxOptimizations } from './tax-rules-engine';
import { analyzeGSTOptimizations } from './gst-optimization-engine';
import { analyzeGovtSchemeOptimizations } from './govt-schemes-engine';
import { analyzePromoterOptimizations } from './promoter-optimization-engine';

export function runFullTaxOptimizationScan(profile: CompanyProfile): {
  optimizations: TaxOptimization[];
  summary: OptimizationSummary;
} {
  // Run all optimization engines
  const itOptimizations = analyzeIncomeTaxOptimizations(profile);
  const gstOptimizations = analyzeGSTOptimizations(profile);
  const govtOptimizations = analyzeGovtSchemeOptimizations(profile);
  const promoterOptimizations = analyzePromoterOptimizations(profile);

  // Aggregate all results
  const allOptimizations = [
    ...itOptimizations,
    ...gstOptimizations,
    ...govtOptimizations,
    ...promoterOptimizations,
  ];

  // Sort by estimated savings descending
  allOptimizations.sort((a, b) => b.estimated_savings - a.estimated_savings);

  // Compute summary
  let totalSavings = 0;
  let eligibleCount = 0;
  let actionRequiredCount = 0;
  let claimedCount = 0;

  const categoryAmounts: Record<OptimizationCategory, number> = {
    income_tax: 0,
    gst: 0,
    govt_scheme: 0,
    state_subsidy: 0,
    promoter_wealth: 0,
  };

  const categoryCounts: Record<OptimizationCategory, number> = {
    income_tax: 0,
    gst: 0,
    govt_scheme: 0,
    state_subsidy: 0,
    promoter_wealth: 0,
  };

  for (const opt of allOptimizations) {
    categoryCounts[opt.category] = (categoryCounts[opt.category] || 0) + 1;

    if (opt.is_eligible || opt.status === 'eligible' || opt.status === 'action_required' || opt.status === 'partially_eligible') {
      totalSavings += opt.estimated_savings;
      categoryAmounts[opt.category] = (categoryAmounts[opt.category] || 0) + opt.estimated_savings;
    }

    if (opt.status === 'eligible' || opt.status === 'partially_eligible') eligibleCount++;
    if (opt.status === 'action_required') actionRequiredCount++;
    if (opt.status === 'claimed') claimedCount++;
  }

  const category_breakdown: { category: OptimizationCategory; count: number; amount: number }[] = (
    Object.keys(categoryAmounts) as OptimizationCategory[]
  ).map((cat) => ({
    category: cat,
    count: categoryCounts[cat] || 0,
    amount: categoryAmounts[cat] || 0,
  }));

  const summary: OptimizationSummary = {
    total_savings: totalSavings,
    income_tax_savings: categoryAmounts.income_tax,
    gst_recovery: categoryAmounts.gst,
    govt_subsidies: categoryAmounts.govt_scheme,
    state_subsidies: categoryAmounts.state_subsidy,
    promoter_savings: categoryAmounts.promoter_wealth,
    total_optimizations: allOptimizations.length,
    eligible_count: eligibleCount,
    action_required_count: actionRequiredCount,
    claimed_count: claimedCount,
    category_breakdown,
  };

  return {
    optimizations: allOptimizations,
    summary,
  };
}
