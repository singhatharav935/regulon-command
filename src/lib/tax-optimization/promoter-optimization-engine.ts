/**
 * PROMOTER & DIRECTOR WEALTH OPTIMIZATION ENGINE — Complete 7-Strategy Analysis
 * ==============================================================================
 * Optimizes director/promoter personal tax liability through legal
 * structuring of salary, perquisites, and retirement benefits.
 */

import { CompanyProfile, TaxOptimization } from './types';

export function analyzePromoterOptimizations(profile: CompanyProfile): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const fy = '2024-25';

  const isCompanyType = ['company', 'pvt_ltd', 'public_ltd', 'opc'].includes(profile.entity_type);
  const hasSalary = profile.director_salary > 0;
  const hasDividend = profile.dividend_distributed > 0;

  // ─── 1. Salary vs Dividend Structuring ────────────────────────────────────
  const needsRestructuring = isCompanyType && hasDividend && profile.dividend_distributed > profile.director_salary;
  const salDivSavings = needsRestructuring
    ? Math.round(profile.dividend_distributed * 0.10) // ~10% arbitrage between corp tax deduction and individual slab
    : 0;
  optimizations.push({
    id: 'promoter_salary_div',
    category: 'promoter_wealth',
    section: 'Remuneration Structuring',
    title: 'Optimize Director Salary vs. Dividend Mix',
    short_description: 'Balance director remuneration (tax-deductible for company) and dividends (taxed in individual hands) to minimize combined tax outgo.',
    detailed_explanation: 'Director salary is a tax-deductible expense for the company (reducing corporate tax at 22-25%). Dividends, on the other hand, are paid from post-tax profits and are further taxed in the hands of the recipient at their individual slab rate (up to 39% including surcharge). By optimizing the mix — increasing salary (where company tax rate < individual slab rate) or increasing dividend (where company rate > individual rate) — the combined family tax burden can be significantly reduced. Sannidh runs scenario analysis across all permutations.',
    legal_reference: 'Income Tax Act, 1961 — Section 17 (Salary), Section 2(22) (Dividend), Section 115-O (abolished, now taxed at slab rates post Finance Act 2020).',
    eligibility_criteria: [
      'Company/LLP entity type',
      'Promoters are directors drawing salary and/or dividends',
      'Current dividend exceeds salary — restructuring opportunity exists'
    ],
    is_eligible: isCompanyType,
    status: needsRestructuring ? 'action_required' : isCompanyType ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: needsRestructuring ? 'high' : 'medium',
    estimated_savings: salDivSavings,
    savings_calculation: needsRestructuring
      ? `Current Director Salary: ₹${profile.director_salary.toLocaleString('en-IN')}\nCurrent Dividends: ₹${profile.dividend_distributed.toLocaleString('en-IN')}\nDividend > Salary → Restructuring recommended\nEstimated Arbitrage Savings: ₹${salDivSavings.toLocaleString('en-IN')}\n(~10% of dividend redirected to salary)`
      : 'Run scenario analysis for optimal mix.',
    action_items: [
      { id: 'sal_div_1', label: 'Run Salary vs Dividend Scenario Analysis', type: 'calculate', completed: false },
      { id: 'sal_div_2', label: 'Pass Board Resolution for revised remuneration', type: 'generate_form', completed: false }
    ],
    documents_required: ['Board Resolution', 'Companies Act Schedule V compliance', 'Form MBP-1 (Director Interest)'],
    deadline: 'Before beginning of FY (April)',
    fy_applicable: fy,
    tags: ['Structuring', 'Directors', 'Tax Planning'],
    icon_name: 'Crown',
    color_accent: 'purple'
  });

  // ─── 2. Sec 10 Tax-Free Perquisites ───────────────────────────────────────
  const perqSavings = hasSalary ? Math.round(Math.min(profile.director_salary * 0.15, 600000) * 0.30) : 0;
  optimizations.push({
    id: 'promoter_perquisites',
    category: 'promoter_wealth',
    section: 'Sec 10 (Various)',
    title: 'Tax-Free Perquisite Structuring',
    short_description: 'Structure up to 15% of CTC as tax-free allowances — fuel, driver, telephone, newspaper, medical insurance.',
    detailed_explanation: 'Several components of salary/CTC can be made tax-free under various clauses of Section 10:\n• Fuel/Conveyance Reimbursement (actual bills)\n• Driver Salary Reimbursement (actual)\n• Mobile/Telephone Bill Reimbursement (actual)\n• Newspaper/Periodical Reimbursement (actual)\n• Meal Vouchers/Coupons (₹50/meal)\n• Leave Travel Allowance — Sec 10(5) (2 journeys in 4 years)\n• Children Education Allowance — ₹100/child/month up to 2 children\n\nRestructuring CTC to include these tax-free components reduces the director\'s taxable salary without reducing take-home pay.',
    legal_reference: 'Section 10(5) (LTA), Section 10(14) read with Rule 2BB (prescribed allowances), Section 17(2) Proviso (medical reimbursement). Income Tax Rules — valuation of perquisites.',
    eligibility_criteria: [
      'Director drawing salary from the company',
      'Actual expenditure incurred and documented'
    ],
    is_eligible: hasSalary,
    status: hasSalary ? 'action_required' : 'not_eligible',
    risk_level: 'safe',
    priority: hasSalary ? 'high' : 'low',
    estimated_savings: perqSavings,
    savings_calculation: hasSalary
      ? `Director Salary: ₹${profile.director_salary.toLocaleString('en-IN')}\nEstimated Restructurable Amount (15%): ₹${Math.min(profile.director_salary * 0.15, 600000).toLocaleString('en-IN')}\nTax Saved (30% slab): ₹${perqSavings.toLocaleString('en-IN')}`
      : 'No director salary drawn.',
    action_items: [
      { id: 'perq_1', label: 'Restructure CTC with tax-free components', type: 'calculate', completed: false },
      { id: 'perq_2', label: 'Set up reimbursement policy and documentation', type: 'generate_form', completed: false }
    ],
    documents_required: ['Revised Appointment Letter/CTC Breakup', 'Actual Expense Bills/Receipts', 'Board Resolution for Perquisite Policy'],
    deadline: 'Before beginning of FY',
    fy_applicable: fy,
    tags: ['Perquisites', 'Salary Structuring', 'Tax-Free'],
    icon_name: 'Wallet',
    color_accent: 'emerald'
  });

  // ─── 3. Sec 80D — Health Insurance Premium Deduction ──────────────────────
  const healthInsSavings = hasSalary ? Math.round(75000 * 0.30) : 0; // Max ₹75K (self + parents senior)
  optimizations.push({
    id: 'promoter_80d',
    category: 'promoter_wealth',
    section: 'Sec 80D',
    title: 'Health Insurance Premium Deduction',
    short_description: 'Deduction of up to ₹75,000 for health insurance premiums — self, spouse, children, and parents.',
    detailed_explanation: 'Under Section 80D, deduction is available for health insurance premiums: ₹25,000 for self/family (₹50,000 if senior citizen) + ₹25,000 for parents (₹50,000 if senior). Additionally, ₹5,000 for preventive health check-up is included within the limit. If the company pays the premium as a perquisite, it\'s both a company expense AND the director can claim 80D deduction.',
    legal_reference: 'Section 80D of Income Tax Act, 1961 — Deduction in respect of health insurance premia. Maximum ₹1,00,000 (if both self and parents are senior citizens).',
    eligibility_criteria: [
      'Health insurance policy in force',
      'Premium paid by cheque/digital mode',
      'Policy covers self, spouse, dependent children, and/or parents'
    ],
    is_eligible: hasSalary,
    status: hasSalary ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: hasSalary ? 'medium' : 'low',
    estimated_savings: healthInsSavings,
    savings_calculation: hasSalary
      ? `Self/Family Premium: ₹25,000\nParents (Senior Citizen): ₹50,000\nTotal Deduction: ₹75,000\nTax Saved (30% slab): ₹${healthInsSavings.toLocaleString('en-IN')}`
      : 'No director salary.',
    action_items: [
      { id: '80d_1', label: 'Ensure health insurance covers all eligible members', type: 'calculate', completed: false },
      { id: '80d_2', label: 'Maximize premium within 80D limits', type: 'calculate', completed: false }
    ],
    documents_required: ['Health Insurance Premium Receipts', 'Policy Schedule', 'Preventive Health Check-up Bills'],
    deadline: 'Before 31st March',
    fy_applicable: fy,
    tags: ['Health', 'Deduction', 'Insurance'],
    icon_name: 'Shield',
    color_accent: 'blue'
  });

  // ─── 4. Sec 80C — PF/PPF/NPS/ELSS Optimization ───────────────────────────
  const sec80cSavings = hasSalary ? Math.round(150000 * 0.30) : 0; // ₹1.5L max * 30%
  optimizations.push({
    id: 'promoter_80c',
    category: 'promoter_wealth',
    section: 'Sec 80C',
    title: 'Maximize Sec 80C (₹1.5 Lakh Deduction)',
    short_description: 'Optimize PF, PPF, ELSS, and life insurance to claim full ₹1,50,000 deduction under Sec 80C.',
    detailed_explanation: 'Section 80C provides up to ₹1,50,000 deduction from gross total income for investments in: EPF (employer PF contribution), PPF (₹500 to ₹1.5L), ELSS Mutual Funds (3-year lock-in), Life Insurance Premium, NSC, Tax-saving FDs (5-year lock-in), Sukanya Samriddhi, Home Loan Principal repayment, and Tuition Fees (up to 2 children). Most directors under-utilize this limit.',
    legal_reference: 'Section 80C of Income Tax Act, 1961 — Deduction in respect of life insurance premia, deferred annuity, contributions to provident fund, subscription to certain equity shares or debentures etc.',
    eligibility_criteria: [
      'Individual/HUF taxpayer',
      'Investments in specified instruments'
    ],
    is_eligible: hasSalary,
    status: hasSalary ? 'action_required' : 'not_eligible',
    risk_level: 'safe',
    priority: hasSalary ? 'medium' : 'low',
    estimated_savings: sec80cSavings,
    savings_calculation: hasSalary
      ? `Maximum 80C Deduction: ₹1,50,000\nTax Saved (30% slab): ₹${sec80cSavings.toLocaleString('en-IN')}\n\nRecommended Split:\n• EPF: ₹21,600/yr (₹1,800/mo)\n• PPF: ₹50,000/yr\n• ELSS: ₹50,000/yr\n• LIC: ₹28,400/yr`
      : 'No salary income.',
    action_items: [
      { id: '80c_1', label: 'Verify current 80C utilization', type: 'calculate', completed: false },
      { id: '80c_2', label: 'Invest remaining amount in ELSS/PPF', type: 'calculate', completed: false }
    ],
    documents_required: ['PF Passbook', 'PPF Statement', 'ELSS Statement', 'LIC Premium Receipts'],
    deadline: 'Before 31st March',
    fy_applicable: fy,
    tags: ['Investment', 'Deduction', '80C'],
    icon_name: 'PiggyBank',
    color_accent: 'cyan'
  });

  // ─── 5. Sec 10(10D) — Keyman Insurance Benefits ──────────────────────────
  const keymanEligible = isCompanyType && hasSalary;
  const keymanSavings = keymanEligible ? Math.round(profile.director_salary * 0.05 * 0.26) : 0; // 5% of salary as premium
  optimizations.push({
    id: 'promoter_keyman',
    category: 'promoter_wealth',
    section: 'Sec 10(10D)',
    title: 'Keyman Insurance Policy Benefits',
    short_description: 'Company-paid keyman insurance as business expense; maturity proceeds potentially tax-free for individual.',
    detailed_explanation: 'A keyman insurance policy taken by the company on the life of key directors/promoters serves dual purpose: (a) the premium is a business expense deductible for the company under Section 37(1), (b) if the policy is later assigned to the keyman on retirement, the maturity proceeds can be exempt under Section 10(10D) in the hands of the individual (subject to conditions). This is a powerful wealth transfer mechanism.',
    legal_reference: 'Section 10(10D) of Income Tax Act — "Any sum received under a life insurance policy, including bonus" is exempt subject to premium limits. Section 37(1) — business expenditure deduction for premium.',
    eligibility_criteria: [
      'Company entity type',
      'Keyman (director/promoter) is critical to business',
      'Premium paid by company'
    ],
    is_eligible: keymanEligible,
    status: keymanEligible ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: keymanEligible ? 'medium' : 'low',
    estimated_savings: keymanSavings,
    savings_calculation: keymanEligible
      ? `Director Salary: ₹${profile.director_salary.toLocaleString('en-IN')}\nEstimated Premium (5%): ₹${(profile.director_salary * 0.05).toLocaleString('en-IN')}\nCompany Tax Saved (26%): ₹${keymanSavings.toLocaleString('en-IN')}\n+ Future maturity exempt u/s 10(10D)`
      : 'Not applicable.',
    action_items: [
      { id: 'keyman_1', label: 'Evaluate keyman insurance quotes', type: 'calculate', completed: false },
      { id: 'keyman_2', label: 'Pass Board Resolution for keyman policy', type: 'generate_form', completed: false }
    ],
    documents_required: ['Board Resolution', 'Insurance Policy Document', 'Premium Payment Proof'],
    deadline: 'Anytime during FY',
    fy_applicable: fy,
    tags: ['Insurance', 'Wealth Transfer', 'Business Expense'],
    icon_name: 'Shield',
    color_accent: 'indigo'
  });

  // ─── 6. HRA / Rent-Free Accommodation ─────────────────────────────────────
  const hraEligible = hasSalary && profile.director_salary >= 1200000; // ₹10L+ salary
  const hraSavings = hraEligible ? Math.round(Math.min(profile.director_salary * 0.40, 1200000) * 0.30) : 0;
  optimizations.push({
    id: 'promoter_hra',
    category: 'promoter_wealth',
    section: 'Sec 10(13A) / 17(2)',
    title: 'HRA or Rent-Free Accommodation Optimization',
    short_description: 'Optimize between claiming HRA exemption or company-provided accommodation to minimize tax.',
    detailed_explanation: 'Directors can either: (a) Claim HRA exemption under Sec 10(13A) — least of (Actual HRA received, Rent paid - 10% salary, 50%/40% of salary for metro/non-metro), or (b) Company provides rent-free accommodation — taxed as perquisite at concessional rates (15% of salary for furnished, 10% for unfurnished). Sannidh compares both scenarios. If director is paying high rent in a metro, HRA exemption can save more. If the company owns property, rent-free accommodation perquisite valuation may be lower than market rent.',
    legal_reference: 'Section 10(13A) read with Rule 2A — HRA Exemption. Section 17(2) read with Rule 3 — Valuation of rent-free accommodation perquisite.',
    eligibility_criteria: [
      'Director drawing salary with HRA component',
      'Rent paid for accommodation',
      'Or company-provided accommodation'
    ],
    is_eligible: hraEligible,
    status: hraEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: hraEligible ? 'medium' : 'low',
    estimated_savings: hraSavings,
    savings_calculation: hraEligible
      ? `Director Salary: ₹${profile.director_salary.toLocaleString('en-IN')}\nMax HRA Exemption (40% salary): ₹${Math.min(profile.director_salary * 0.40, 1200000).toLocaleString('en-IN')}\nTax Saved (30% slab): ₹${hraSavings.toLocaleString('en-IN')}`
      : 'Salary below threshold for significant HRA benefit.',
    action_items: [
      { id: 'hra_1', label: 'Compare HRA exemption vs Rent-Free Accommodation', type: 'calculate', completed: false },
      { id: 'hra_2', label: 'Restructure CTC with optimal HRA component', type: 'generate_form', completed: false }
    ],
    documents_required: ['Rent Agreement', 'Rent Receipts', 'PAN of Landlord (if rent > ₹1L/yr)'],
    deadline: 'Before beginning of FY',
    fy_applicable: fy,
    tags: ['HRA', 'Accommodation', 'Exemption'],
    icon_name: 'Building2',
    color_accent: 'amber'
  });

  // ─── 7. NPS Employer Contribution — Sec 80CCD(2) ─────────────────────────
  const npsSavings = hasSalary ? Math.round(profile.director_salary * 0.10 * 0.30) : 0;
  optimizations.push({
    id: 'promoter_nps',
    category: 'promoter_wealth',
    section: 'Sec 80CCD(2)',
    title: 'Corporate NPS — Employer Contribution',
    short_description: 'Up to 10% of Basic Salary contributed by company to NPS is tax-free for the director (over and above ₹1.5L of 80C).',
    detailed_explanation: 'Under Section 80CCD(2), employer contribution to National Pension System (NPS) up to 10% of Basic Salary + DA is: (a) Deductible as business expense for the company, (b) NOT treated as taxable perquisite in the hands of the employee/director, (c) This deduction is OVER AND ABOVE the ₹1.5 Lakh limit of Section 80C. Additionally, the director can claim extra ₹50,000 deduction under Sec 80CCD(1B) for their own NPS contribution. Total NPS tax benefit can be ₹2L+ of salary above 80C limits.',
    legal_reference: 'Section 80CCD(2) of Income Tax Act — "The amount contributed by the employer to the account of employee under NPS shall be allowed as deduction to the extent of 10% of salary."',
    eligibility_criteria: [
      'Director drawing salary from company',
      'Company contributes to NPS Tier-I account',
      'NPS account opened with PFRDA-registered POP'
    ],
    is_eligible: hasSalary,
    status: hasSalary ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: hasSalary ? 'high' : 'low',
    estimated_savings: npsSavings,
    savings_calculation: hasSalary
      ? `Director Basic Salary: ₹${profile.director_salary.toLocaleString('en-IN')}\nEmployer NPS (10%): ₹${(profile.director_salary * 0.10).toLocaleString('en-IN')}\nTax Saved for Director (30%): ₹${npsSavings.toLocaleString('en-IN')}\n+ Additional ₹50,000 u/s 80CCD(1B) for own contribution\n\n⭐ This is ABOVE 80C limit — no overlap!`
      : 'No director salary drawn.',
    action_items: [
      { id: 'nps_1', label: 'Open/Register Corporate NPS Account', type: 'apply_scheme', completed: false },
      { id: 'nps_2', label: 'Setup monthly NPS SIP for employer contribution', type: 'calculate', completed: false },
      { id: 'nps_3', label: 'Claim additional ₹50K u/s 80CCD(1B)', type: 'calculate', completed: false }
    ],
    documents_required: ['NPS PRAN Card', 'Employer NPS Contribution Receipt', 'Board Resolution for Corporate NPS'],
    deadline: 'Before 31st March',
    fy_applicable: fy,
    tags: ['NPS', 'Retirement', 'Over 80C', 'Tax-Free Perquisite'],
    icon_name: 'PiggyBank',
    color_accent: 'teal'
  });

  return optimizations;
}
