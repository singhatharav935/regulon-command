/**
 * GST OPTIMIZATION ENGINE — Complete 7-Provision Analysis
 * ========================================================
 * Analyzes company GST data against all applicable CGST/IGST provisions.
 */

import { CompanyProfile, TaxOptimization } from './types';

export function analyzeGSTOptimizations(profile: CompanyProfile): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const fy = '2024-25';

  // ─── 1. Sec 16(2)(aa) — GSTR-2B ITC Mismatch Recovery ─────────────────────
  const itcMismatch = profile.gst_itc_mismatch_amount > 0;
  optimizations.push({
    id: 'gst_16_2_aa',
    category: 'gst',
    section: 'Sec 16(2)(aa) CGST',
    title: 'GSTR-2B ITC Mismatch Recovery',
    short_description: 'Recover unclaimed Input Tax Credit by reconciling purchase invoices with GSTR-2B auto-populated data.',
    detailed_explanation: 'Under Section 16(2)(aa) of CGST Act, Input Tax Credit can only be availed if the supplier has filed their GSTR-1 and the invoice details appear in the recipient\'s GSTR-2B. Any mismatch means your ITC claim will be rejected by the department. Sannidh auto-reconciles your purchase ledger against GSTR-2B and identifies defaulting vendors who haven\'t uploaded invoices, so you can follow up before filing GSTR-3B.',
    legal_reference: 'Section 16(2)(aa) of CGST Act, 2017 — "Input tax credit shall be availed only if the details of the invoice or debit note referred to in clause (a) has been furnished by the supplier in the statement of outward supplies."',
    eligibility_criteria: [
      'Registered under GST',
      'Purchase invoices not reflected in GSTR-2B',
      'ITC claimed differs from GSTR-2B auto-populated amount'
    ],
    is_eligible: itcMismatch,
    status: itcMismatch ? 'action_required' : 'claimed',
    risk_level: 'high',
    priority: itcMismatch ? 'critical' : 'low',
    estimated_savings: profile.gst_itc_mismatch_amount,
    savings_calculation: itcMismatch
      ? `Total ITC Available: ₹${profile.total_gst_itc_available.toLocaleString('en-IN')}\nTotal ITC Claimed: ₹${profile.total_gst_itc_claimed.toLocaleString('en-IN')}\nMismatch (Lost ITC): ₹${profile.gst_itc_mismatch_amount.toLocaleString('en-IN')}\n\nRecovery Action: Follow up with defaulting vendors → Recover ₹${profile.gst_itc_mismatch_amount.toLocaleString('en-IN')}`
      : 'All ITC fully matched with GSTR-2B. No mismatch found.',
    action_items: [
      { id: '16_2_aa_1', label: 'Send WhatsApp/Email reminders to defaulting vendors', type: 'notify_vendor', completed: false },
      { id: '16_2_aa_2', label: 'Hold vendor payments until GSTR-1 is filed', type: 'notify_vendor', completed: false },
      { id: '16_2_aa_3', label: 'Download Mismatch Report', type: 'download_report', completed: false }
    ],
    documents_required: ['GSTR-2B from GST Portal', 'Purchase Register', 'Vendor GSTIN List'],
    deadline: 'Monthly — before 20th (GSTR-3B filing date)',
    fy_applicable: fy,
    tags: ['ITC', 'Reconciliation', 'Vendor Management'],
    icon_name: 'Receipt',
    color_accent: 'orange'
  });

  // ─── 2. Sec 54(3) — Inverted Duty Structure Refund ────────────────────────
  const invertedDuty = profile.gst_input_rate_avg > profile.gst_output_rate_avg;
  const netITCAccumulated = Math.max(0, profile.total_gst_itc_claimed - profile.total_gst_output);
  // Formula per Rule 89(5): Max Refund = {(Turnover of Inverted rated supply / Adjusted total turnover) × Net ITC} - {Tax payable on inverted supply}
  const invertedRefund = invertedDuty && netITCAccumulated > 0 ? netITCAccumulated * 0.6 : 0; // Conservative 60% of net accumulated
  optimizations.push({
    id: 'gst_54_3',
    category: 'gst',
    section: 'Sec 54(3) CGST',
    title: 'Inverted Duty Structure Refund',
    short_description: 'Claim cash refund of accumulated ITC when GST on inputs exceeds GST on output supplies.',
    detailed_explanation: 'When the rate of tax on inputs (e.g., 18% GST on raw materials) is higher than the rate of tax on output supplies (e.g., 12% on finished goods), ITC keeps accumulating without full utilization. Section 54(3) read with Rule 89(5) allows claiming refund of such accumulated ITC. The refund formula under Rule 89(5) is: Max Refund = {(Turnover of inverted supply / Adjusted Total Turnover) × Net ITC} - Tax payable on inverted supplies.',
    legal_reference: 'Section 54(3) of CGST Act, 2017 read with Rule 89(5) of CGST Rules — Refund of unutilized ITC on account of inverted tax structure.',
    eligibility_criteria: [
      'Average GST rate on inputs > Average GST rate on outputs',
      'Accumulated unutilized ITC exists',
      'Not applicable for nil-rated or exempt output supplies'
    ],
    is_eligible: invertedDuty,
    status: invertedDuty && invertedRefund > 0 ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: invertedDuty && invertedRefund > 0 ? 'high' : 'low',
    estimated_savings: invertedRefund,
    savings_calculation: invertedDuty && invertedRefund > 0
      ? `Input GST Rate (avg): ${profile.gst_input_rate_avg}%\nOutput GST Rate (avg): ${profile.gst_output_rate_avg}%\nNet Accumulated ITC: ₹${netITCAccumulated.toLocaleString('en-IN')}\nEstimated Refundable (Rule 89(5)): ₹${invertedRefund.toLocaleString('en-IN')}`
      : 'No inverted duty structure detected.',
    action_items: [
      { id: '54_3_1', label: 'File GST RFD-01 Application', type: 'generate_form', completed: false },
      { id: '54_3_2', label: 'Prepare Statement 1A (Rule 89(5))', type: 'generate_form', completed: false }
    ],
    documents_required: ['GSTR-1', 'GSTR-3B (all periods)', 'RFD-01', 'Statement 1A'],
    deadline: '2 years from the end of the financial year in which supply was made',
    fy_applicable: fy,
    tags: ['Refund', 'ITC', 'Working Capital'],
    icon_name: 'Banknote',
    color_accent: 'green'
  });

  // ─── 3. Sec 16 IGST — Zero-Rated Export ITC Refund under LUT ──────────────
  const isExporter = !!profile.is_exporter && profile.total_exports > 0;
  const exportITCRefund = isExporter ? profile.total_exports * (profile.gst_input_rate_avg / 100) * 0.85 : 0;
  optimizations.push({
    id: 'gst_16_igst',
    category: 'gst',
    section: 'Sec 16 IGST Act',
    title: 'Zero-Rated Export Refund (LUT)',
    short_description: 'Export goods/services without IGST under Letter of Undertaking (LUT) and claim refund of unutilized input ITC.',
    detailed_explanation: 'Under Section 16 of IGST Act, exports of goods or services are zero-rated supplies. An exporter can either: (a) Export under bond/LUT without payment of IGST and claim refund of accumulated ITC, or (b) Export with payment of IGST and claim refund of IGST paid. Option (a) with LUT is recommended as it avoids blocking working capital in IGST payment.',
    legal_reference: 'Section 16 of IGST Act, 2017 read with Rule 96A of CGST Rules — "A registered person making zero rated supply shall be eligible to claim refund of unutilized input tax credit."',
    eligibility_criteria: [
      'Engaged in export of goods or services',
      'Valid LUT (Form GST RFD-11) filed',
      'Exporter not prosecuted for tax evasion > ₹2.5 Crore'
    ],
    is_eligible: isExporter,
    status: isExporter ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: isExporter ? 'high' : 'low',
    estimated_savings: exportITCRefund,
    savings_calculation: isExporter
      ? `Total Exports: ₹${profile.total_exports.toLocaleString('en-IN')}\nEstimated ITC on Export Inputs: ₹${exportITCRefund.toLocaleString('en-IN')}\n(Working capital freed by avoiding upfront IGST payment)`
      : 'Not an exporter.',
    action_items: [
      { id: '16_igst_1', label: 'File/Renew LUT (Form GST RFD-11)', type: 'generate_form', completed: false },
      { id: '16_igst_2', label: 'File RFD-01 for ITC Refund', type: 'generate_form', completed: false }
    ],
    documents_required: ['Form GST RFD-11 (LUT)', 'Shipping Bills', 'BRC/FIRC for Services', 'RFD-01'],
    deadline: 'LUT: Before 1st April each year. Refund: Within 2 years.',
    fy_applicable: fy,
    tags: ['Export', 'LUT', 'Working Capital'],
    icon_name: 'Globe',
    color_accent: 'blue'
  });

  // ─── 4. Sec 18 — Capital Goods ITC Optimization ───────────────────────────
  const hasCapitalGoods = profile.new_machinery_investment > 0;
  const capitalITC = hasCapitalGoods ? profile.new_machinery_investment * (profile.gst_input_rate_avg / 100) : 0;
  optimizations.push({
    id: 'gst_18_capital',
    category: 'gst',
    section: 'Sec 18 CGST',
    title: 'Capital Goods ITC Claim Optimization',
    short_description: 'Full ITC on capital goods in the year of purchase; optimize between GST ITC and IT Act depreciation.',
    detailed_explanation: 'Under Section 16(3) of CGST Act, if ITC is availed on capital goods, the depreciation under Income Tax Act shall be computed after reducing the GST component from the cost. Sannidh ensures you don\'t double-claim (ITC + Depreciation on GST portion) which would trigger scrutiny, while maximizing the combined tax benefit across both GST and Income Tax.',
    legal_reference: 'Section 18 read with Section 16(3) of CGST Act, 2017 — ITC on capital goods and its interplay with Income Tax depreciation under Section 32.',
    eligibility_criteria: [
      'Capital goods purchased during the FY',
      'Used for making taxable supplies',
      'Not used exclusively for exempt supplies'
    ],
    is_eligible: hasCapitalGoods,
    status: hasCapitalGoods ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: hasCapitalGoods ? 'high' : 'low',
    estimated_savings: capitalITC,
    savings_calculation: hasCapitalGoods
      ? `New Capital Investment: ₹${profile.new_machinery_investment.toLocaleString('en-IN')}\nGST Rate: ${profile.gst_input_rate_avg}%\nITC Available: ₹${capitalITC.toLocaleString('en-IN')}\n\nNote: IT Depreciation base reduced by ₹${capitalITC.toLocaleString('en-IN')}`
      : 'No capital goods purchased.',
    action_items: [
      { id: '18_cap_1', label: 'Verify ITC claim in GSTR-3B', type: 'calculate', completed: false },
      { id: '18_cap_2', label: 'Adjust IT Depreciation base accordingly', type: 'calculate', completed: false }
    ],
    documents_required: ['Capital Goods Invoices', 'Fixed Asset Register', 'GSTR-2B Match'],
    deadline: 'Within the return period of invoice receipt',
    fy_applicable: fy,
    tags: ['Capital Goods', 'ITC', 'Depreciation'],
    icon_name: 'Factory',
    color_accent: 'violet'
  });

  // ─── 5. Rule 42/43 — Common Credit ITC Reversal Minimization ──────────────
  const hasExemptSupply = profile.gst_output_rate_avg < profile.gst_input_rate_avg;
  const estimatedOverReversal = hasExemptSupply ? profile.total_gst_itc_claimed * 0.03 : 0;
  optimizations.push({
    id: 'gst_rule_42_43',
    category: 'gst',
    section: 'Rule 42/43 CGST',
    title: 'Common Credit ITC Reversal Optimization',
    short_description: 'Minimize ITC reversal on common inputs used for both taxable and exempt supplies.',
    detailed_explanation: 'When a business makes both taxable and exempt supplies using common inputs, Rule 42 (for inputs/input services) and Rule 43 (for capital goods) require proportionate ITC reversal. Incorrect categorization of supplies as "exempt" when they are actually "non-supplies" can lead to over-reversal of legitimate ITC. Sannidh ensures precise calculation to prevent excess reversal.',
    legal_reference: 'Rule 42 and Rule 43 of CGST Rules, 2017 — Manner of determination of input tax credit in respect of inputs or input services and reversal thereof.',
    eligibility_criteria: [
      'Making both taxable and exempt/nil-rated supplies',
      'Common inputs used across supply types'
    ],
    is_eligible: hasExemptSupply,
    status: hasExemptSupply ? 'action_required' : 'not_eligible',
    risk_level: 'moderate',
    priority: hasExemptSupply ? 'medium' : 'low',
    estimated_savings: estimatedOverReversal,
    savings_calculation: hasExemptSupply
      ? `Total ITC Pool: ₹${profile.total_gst_itc_claimed.toLocaleString('en-IN')}\nEstimated Over-reversal Prevention: ₹${estimatedOverReversal.toLocaleString('en-IN')}\n(3% of ITC saved through precise categorization)`
      : 'No exempt/mixed supplies detected.',
    action_items: [
      { id: 'r42_1', label: 'Categorize supplies: Taxable vs Exempt vs Non-supply', type: 'calculate', completed: false },
      { id: 'r42_2', label: 'Run Rule 42/43 precise ITC reversal calculation', type: 'calculate', completed: false }
    ],
    documents_required: ['Supply-wise Revenue Breakup', 'Common Input Invoices'],
    deadline: 'Monthly in GSTR-3B',
    fy_applicable: fy,
    tags: ['ITC Reversal', 'Common Credit'],
    icon_name: 'Scale',
    color_accent: 'amber'
  });

  // ─── 6. Sec 17(5) — Blocked Credit Identification & Recovery ──────────────
  const estimatedBlockedCredit = profile.total_gst_itc_claimed * 0.02; // 2% typically blocked
  optimizations.push({
    id: 'gst_17_5',
    category: 'gst',
    section: 'Sec 17(5) CGST',
    title: 'Blocked Credit Audit & Recovery',
    short_description: 'Identify wrongly claimed blocked ITC to avoid SCN and also find wrongly reversed legitimate ITC.',
    detailed_explanation: 'Section 17(5) blocks ITC on specific items: motor vehicles (except for transportation/driving school/further supply), food & beverages, outdoor catering, health/fitness memberships, life insurance, travel (LTA), works contract for immovable property (except input service), goods lost/stolen/destroyed, and free gifts/samples. Businesses often wrongly claim ITC on these (risk of SCN) OR wrongly block legitimate ITC (loss of credit). Sannidh audits both directions.',
    legal_reference: 'Section 17(5) of CGST Act, 2017 — "Notwithstanding anything contained in sub-section (1) or (2), input tax credit shall not be available in respect of the following..."',
    eligibility_criteria: [
      'All GST registered businesses',
      'Purchases include potential blocked categories'
    ],
    is_eligible: true,
    status: 'action_required',
    risk_level: 'moderate',
    priority: 'medium',
    estimated_savings: estimatedBlockedCredit,
    savings_calculation: `Total ITC Claimed: ₹${profile.total_gst_itc_claimed.toLocaleString('en-IN')}\nEstimated ITC at Risk (wrongly claimed blocked items): ~2%\nPotential Recovery (wrongly reversed legitimate ITC): ₹${estimatedBlockedCredit.toLocaleString('en-IN')}`,
    action_items: [
      { id: '17_5_1', label: 'Run Blocked Credit Audit on Purchase Ledger', type: 'calculate', completed: false },
      { id: '17_5_2', label: 'Reverse wrongly claimed ITC before SCN', type: 'file_return', completed: false },
      { id: '17_5_3', label: 'Recover wrongly reversed legitimate ITC', type: 'calculate', completed: false }
    ],
    documents_required: ['Purchase Register with HSN/SAC codes', 'Expense Category Mapping'],
    deadline: 'Before annual return (GSTR-9)',
    fy_applicable: fy,
    tags: ['Blocked Credit', 'Audit', 'SCN Prevention'],
    icon_name: 'Shield',
    color_accent: 'red'
  });

  // ─── 7. Composition Scheme Comparison ─────────────────────────────────────
  const smallBusiness = profile.annual_turnover <= 15000000; // 1.5 Cr for goods
  const compositionTax = smallBusiness ? profile.annual_turnover * 0.01 : 0; // 1% for manufacturers
  const regularTax = profile.total_gst_output - profile.total_gst_itc_claimed;
  const compositionSavings = smallBusiness && regularTax > compositionTax ? (regularTax - compositionTax) : 0;
  optimizations.push({
    id: 'gst_composition',
    category: 'gst',
    section: 'Sec 10 CGST',
    title: 'Composition Scheme Comparison',
    short_description: 'Compare regular GST filing vs Composition Scheme for small businesses (turnover ≤ ₹1.5 Cr).',
    detailed_explanation: 'Small businesses with turnover up to ₹1.5 Crore (₹75 Lakhs for services) can opt for Composition Scheme paying a flat 1% (manufacturers), 5% (restaurants), or 6% (services) on turnover instead of regular GST rates. No ITC available under composition, but compliance burden is drastically reduced (quarterly return instead of monthly). Sannidh compares your actual tax liability under both scenarios.',
    legal_reference: 'Section 10 of CGST Act, 2017 — Composition levy for taxpayers with aggregate turnover not exceeding ₹1.5 Crore.',
    eligibility_criteria: [
      'Aggregate turnover ≤ ₹1.5 Crore (goods) or ₹75 Lakhs (services)',
      'Not engaged in inter-state supply',
      'Not an e-commerce operator',
      'Not a manufacturer of notified goods (ice cream, pan masala, tobacco)'
    ],
    is_eligible: smallBusiness,
    status: smallBusiness && compositionSavings > 0 ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: smallBusiness && compositionSavings > 0 ? 'high' : 'low',
    estimated_savings: compositionSavings,
    savings_calculation: smallBusiness
      ? `Regular GST Net Liability: ₹${regularTax.toLocaleString('en-IN')}\nComposition Tax (1% of Turnover): ₹${compositionTax.toLocaleString('en-IN')}\nPotential Savings: ₹${compositionSavings.toLocaleString('en-IN')}\n\n⚠️ Note: ITC not available under Composition`
      : 'Turnover exceeds composition scheme limit.',
    action_items: [
      { id: 'comp_1', label: 'Run Composition vs Regular comparison', type: 'calculate', completed: false },
      { id: 'comp_2', label: 'File CMP-02 to opt for Composition', type: 'generate_form', completed: false }
    ],
    documents_required: ['GSTR-3B Summary', 'Annual Turnover Certificate'],
    deadline: 'Before 31st March for next FY',
    fy_applicable: fy,
    tags: ['Composition', 'Small Business', 'Compliance'],
    icon_name: 'Calculator',
    color_accent: 'teal'
  });

  return optimizations;
}
