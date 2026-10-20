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


  // ─── 8. Director Medical Insurance — Sec 80D ─────────────────────────────
  const medInsEligible = hasSalary;
  const medInsSavings = medInsEligible ? 50000 * 0.30 : 0;
  optimizations.push({
    id: 'promoter_80d',
    category: 'promoter_wealth',
    section: 'Sec 80D',
    title: 'Director Medical Insurance — ₹50K Deduction (Sec 80D)',
    short_description: 'Director gets ₹25K deduction for own health insurance + ₹25K for parents = ₹50K total under Sec 80D.',
    detailed_explanation: 'Under Section 80D, directors can claim ₹25,000 deduction on health insurance premium paid for self/spouse/children, and an additional ₹25,000 for parents (₹50,000 if parents are senior citizens). The company can also pay this as a tax-free perquisite structuring it as part of the CTC package, reducing director\'s personal tax outgo at 30% slab.',
    legal_reference: 'Section 80D of Income Tax Act, 1961',
    eligibility_criteria: ['Director receiving salary', 'Health insurance policy in director\'s name or family', 'Premium paid by cheque/digital mode', 'Policy from IRDA-approved insurer'],
    is_eligible: medInsEligible,
    status: medInsEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: medInsEligible ? 'medium' : 'low',
    estimated_savings: medInsSavings,
    savings_calculation: medInsEligible ? `₹50,000 deduction * 30% slab = ₹${medInsSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '80d_1', label: 'Purchase family floater health insurance policy', type: 'compliance', completed: false },
      { id: '80d_2', label: 'Claim deduction in director personal ITR', type: 'filing', completed: false }
    ],
    documents_required: ['Health Insurance Policy Copy', 'Premium Payment Receipt'],
    deadline: 'Before 31st March',
    fy_applicable: fy,
    tags: ['Health Insurance', 'Director', 'Deduction', 'Personal Tax'],
    icon_name: 'Heart',
    color_accent: 'rose'
  });

  // ─── 9. Leave Travel Concession (LTC) ─────────────────────────────────────
  const ltcEligible = hasSalary;
  const ltcSavings = ltcEligible ? Math.min(profile.director_salary * 0.05, 50000) * 0.30 : 0;
  optimizations.push({
    id: 'promoter_ltc',
    category: 'promoter_wealth',
    section: 'Sec 10(5)',
    title: 'Leave Travel Concession — Tax-Free Domestic Travel',
    short_description: 'Director gets tax exemption on actual domestic travel costs for 2 journeys in any block of 4 years.',
    detailed_explanation: 'Under Section 10(5) of the Income Tax Act, Leave Travel Concession (LTC) allows directors and employees to claim exemption on actual domestic travel expenses (economy class air fare or AC first class train fare) for 2 journeys in any block of 4 years. The current block is 2022–2025. This is best structured as part of the director\'s CTC to reduce taxable salary.',
    legal_reference: 'Section 10(5) of Income Tax Act, 1961 read with Rule 2B',
    eligibility_criteria: ['Director receiving salary income', 'Actual domestic travel undertaken within India', 'Travel by economy air/AC first class rail/deluxe bus', '2 journeys in a block of 4 calendar years'],
    is_eligible: ltcEligible,
    status: ltcEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: ltcEligible ? 'low' : 'low',
    estimated_savings: ltcSavings,
    savings_calculation: ltcEligible ? `5% of salary or ₹50K cap * 30% = ₹${ltcSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'ltc_1', label: 'Include LTC in director CTC structure', type: 'compliance', completed: false },
      { id: 'ltc_2', label: 'Collect travel tickets as documentary proof', type: 'documentation', completed: false }
    ],
    documents_required: ['Travel Tickets (Air/Rail)', 'Leave Sanctioned Certificate', 'Journey Details'],
    deadline: 'Claim in ITR of travel year',
    fy_applicable: fy,
    tags: ['LTC', 'Travel', 'Director', 'Exemption'],
    icon_name: 'Plane',
    color_accent: 'blue'
  });

  // ─── 10. Company Car Perquisite Optimization ────────────────────────────────
  const carEligible = hasSalary && profile.director_salary > 1200000;
  const carSavings = carEligible ? 150000 * 0.30 : 0;
  optimizations.push({
    id: 'promoter_car',
    category: 'promoter_wealth',
    section: 'Sec 17(2) — Perquisite',
    title: 'Company Car — Only ₹1,800/Month Perquisite vs Actual Cost',
    short_description: 'Director using company car for both official + personal use is taxed at only ₹1,800/month (engine ≤1.6L) perquisite instead of actual car cost.',
    detailed_explanation: 'Instead of the director buying a car personally from post-tax salary, the company can own and provide the car. The perquisite value is fixed at just ₹1,800/month (engine ≤1.6L) or ₹2,400/month (engine >1.6L) when used for both official and personal purposes and chauffeur is not provided. This vs. actual car EMI of ₹30,000–50,000/month creates massive tax arbitrage. The company also gets depreciation deduction on the car.',
    legal_reference: 'Section 17(2)(ii) of Income Tax Act, 1961 read with Rule 3(2)(B)',
    eligibility_criteria: ['Director salary > ₹12 Lakhs per year', 'Company owns the car (not leased)', 'Car used for both official and personal purposes', 'Car cost charged to company P&L as business asset'],
    is_eligible: carEligible,
    status: carEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: carEligible ? 'high' : 'low',
    estimated_savings: carSavings,
    savings_calculation: carEligible ? `₹1,800/month × 12 = ₹21,600 taxable vs ~₹1.5L actual cost. Director saves ₹${carSavings.toFixed(2)}/yr` : 'N/A',
    action_items: [
      { id: 'car_1', label: 'Register car in company name', type: 'compliance', completed: false },
      { id: 'car_2', label: 'Compute perquisite value at ₹1,800–₹2,400/month in payslip', type: 'documentation', completed: false }
    ],
    documents_required: ['Car RC Book (Company Name)', 'Board Resolution for Car Usage Policy', 'Logbook for usage'],
    deadline: 'Tax structuring before April 1',
    fy_applicable: fy,
    tags: ['Car', 'Perquisite', 'Director', 'CTC Structuring'],
    icon_name: 'Car',
    color_accent: 'gray'
  });

  // ─── 11. Superannuation Fund — Sec 10(13) ────────────────────────────────
  const superEligible = hasSalary && isCompanyType;
  const superSavings = superEligible ? 100000 * 0.30 : 0;
  optimizations.push({
    id: 'promoter_super',
    category: 'promoter_wealth',
    section: 'Sec 10(13) + 36(1)(iv)',
    title: 'Approved Superannuation Fund — ₹1L Tax-Free Annual Benefit',
    short_description: 'Company contributes up to ₹1 Lakh per year to director\'s superannuation fund — tax-free in their hands.',
    detailed_explanation: 'Under Section 10(13) read with Section 36(1)(iv), an employer can contribute up to ₹1,50,000 per year per employee to an approved superannuation fund as a deductible business expense. The amount up to ₹1,00,000 is not taxable as perquisite in the employee/director\'s hands. The fund accumulates tax-free and the annuity paid on retirement is exempt (partially). This creates a dual benefit — company tax deduction + director\'s tax-free corpus.',
    legal_reference: 'Section 10(13) and 36(1)(iv) of Income Tax Act, 1961 — Approved Superannuation Fund',
    eligibility_criteria: ['Private or Public Limited Company', 'Director receiving salary', 'Trust registered with Income Tax Dept as Approved Superannuation Fund', 'Contribution up to ₹1,50,000/year per employee'],
    is_eligible: superEligible,
    status: superEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: superEligible ? 'medium' : 'low',
    estimated_savings: superSavings,
    savings_calculation: superEligible ? `₹1,00,000 tax-free + company deduction * 30% director slab = ₹${superSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'super_1', label: 'Set up Approved Superannuation Trust with a life insurer', type: 'compliance', completed: false },
      { id: 'super_2', label: 'Get IT Dept approval for the trust', type: 'filing', completed: false }
    ],
    documents_required: ['Trust Deed', 'IT Approval Order', 'LIC Policy / Insurance Annuity Contract'],
    deadline: 'Before year-end',
    fy_applicable: fy,
    tags: ['Superannuation', 'Retirement', 'Director', 'Tax-Free'],
    icon_name: 'PiggyBank',
    color_accent: 'amber'
  });

  // ─── 12. ESOP — Defer Tax to Capital Gains Rate ─────────────────────────
  const esopEligible = !!profile.dipp_registered && profile.total_employees > 5;
  const esopSavings = esopEligible ? profile.director_salary * 0.15 * 0.10 : 0;
  optimizations.push({
    id: 'promoter_esop',
    category: 'promoter_wealth',
    section: 'Sec 17(2)(vi) + 112A',
    title: 'ESOP Structuring — Defer Salary Tax to 10% Capital Gains',
    short_description: 'Grant ESOPs to key employees and director. Tax is deferred to exercise/sale, and at sale rate of 10% LTCG instead of 30% salary slab.',
    detailed_explanation: 'ESOPs allow key employees/directors to acquire company shares at a pre-determined price. Tax is triggered only at exercise (treated as perquisite = FMV minus exercise price) and again at sale (capital gains). For DPIIT startups, Budget 2020 deferred even the perquisite tax to earliest of sale, employment cessation, or 5 years — effectively converting 30% salary tax into 10% LTCG for listed shares or 20% for unlisted. This is a powerful wealth creation and retention tool.',
    legal_reference: 'Section 17(2)(vi) of IT Act, 1961 for perquisite; Section 112A for LTCG at 10%; Sec 80-IAC startup tax deferral',
    eligibility_criteria: ['DPIIT-recognized startup', 'More than 5 employees', 'ESOP scheme approved by Board and shareholders', 'Vesting period minimum 1 year'],
    is_eligible: esopEligible,
    status: esopEligible ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: esopEligible ? 'high' : 'low',
    estimated_savings: esopSavings,
    savings_calculation: esopEligible ? `Tax arbitrage: 30% salary → 10% LTCG on ${(profile.director_salary * 0.15).toFixed(0)} = ₹${esopSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'esop_1', label: 'Draft ESOP scheme and get Board + shareholder approval', type: 'compliance', completed: false },
      { id: 'esop_2', label: 'Register ESOP with DPIIT (for startup tax deferral)', type: 'filing', completed: false }
    ],
    documents_required: ['ESOP Scheme Document', 'Board Resolution', 'Shareholder Approval', 'DPIIT Certificate'],
    deadline: 'Before next salary review',
    fy_applicable: fy,
    tags: ['ESOP', 'Startup', 'Capital Gains', 'Wealth Creation'],
    icon_name: 'TrendingUp',
    color_accent: 'violet'
  });

  // ─── 13. HUF Creation for Promoter ───────────────────────────────────────
  const hufEligible = ['proprietorship', 'partnership', 'huf'].includes(profile.entity_type);
  const hufSavings = hufEligible ? 250000 * 0.30 : 0;
  optimizations.push({
    id: 'promoter_huf',
    category: 'promoter_wealth',
    section: 'HUF — Hindu Undivided Family',
    title: 'HUF Entity — Separate ₹2.5L Basic Exemption + Slab Benefits',
    short_description: 'Create a HUF entity to get a completely separate ₹2.5 Lakh basic exemption and benefit from the full income tax slab.',
    detailed_explanation: 'A Hindu Undivided Family (HUF) is a separate taxable entity under Indian law. By creating a HUF, the promoter gets an additional ₹2,50,000 basic exemption (like an individual). Income from ancestral property, gifts from non-relatives, and income from business carried on by HUF can be assessed in the HUF\'s hands, effectively splitting income across two entities and reducing the overall tax incidence. HUF also has access to all the deductions — 80C, 80D, 80G etc.',
    legal_reference: 'Hindu Undivided Family under Income Tax Act, 1961 — Separate PAN and entity status',
    eligibility_criteria: ['Hindu, Sikh, Jain or Buddhist promoter', 'Ancestral or coparcenary property available', 'At least 2 members in HUF (Karta + any coparcener)', 'HUF PAN separately obtained from IT Dept'],
    is_eligible: hufEligible,
    status: hufEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: hufEligible ? 'high' : 'low',
    estimated_savings: hufSavings,
    savings_calculation: hufEligible ? `₹2,50,000 basic exemption slab saved * 30% = ₹${hufSavings.toFixed(2)} (plus further slab benefits)` : 'N/A',
    action_items: [
      { id: 'huf_1', label: 'Create HUF deed with all coparceners', type: 'documentation', completed: false },
      { id: 'huf_2', label: 'Apply for HUF PAN on NSDL portal', type: 'compliance', completed: false },
      { id: 'huf_3', label: 'Open separate HUF bank account', type: 'compliance', completed: false }
    ],
    documents_required: ['HUF Deed', 'PAN Application (HUF)', 'Coparcener Identity Proofs', 'Joint Bank Account'],
    deadline: 'Any time (better before income accrual)',
    fy_applicable: fy,
    tags: ['HUF', 'Income Splitting', 'Exemption', 'Family Tax'],
    icon_name: 'Home',
    color_accent: 'emerald'
  });

  // ─── 14. Director Remuneration Optimization via Professional Fees ─────────
  const profFeesEligible = hasSalary && profile.director_salary > 2000000;
  const profFeesSavings = profFeesEligible ? Math.min(profile.director_salary * 0.10, 500000) * 0.20 : 0;
  optimizations.push({
    id: 'promoter_prof_fees',
    category: 'promoter_wealth',
    section: 'Sec 194J + Consulting Structure',
    title: 'Restructure Director Fees as Consulting — Move to Lower Slab',
    short_description: 'Part of director remuneration restructured as legitimate professional/consulting fees to director\'s spouse or family firm at lower tax slab.',
    detailed_explanation: 'Where a director has a spouse or family member with professional expertise (legal, medical, design, marketing, IT), the company can legitimately pay professional fees under a service agreement instead of paying salary to the director. Income in family member\'s hands at 0–20% slab vs director\'s 30% slab. Under Section 56(2), this must reflect fair market value for actual services rendered to withstand scrutiny.',
    legal_reference: 'Section 194J of IT Act (TDS on professional fees); Section 56(2) (arm\'s length principle); Clubbing provisions Sec 64 apply if spouse has no independent qualification',
    eligibility_criteria: ['Director salary > ₹20 Lakhs', 'Qualified family member can render actual services', 'Fair market value fee structure', 'Proper service agreement in place', 'TDS deducted under 194J'],
    is_eligible: profFeesEligible,
    status: profFeesEligible ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: profFeesEligible ? 'medium' : 'low',
    estimated_savings: profFeesSavings,
    savings_calculation: profFeesEligible ? `Moving ₹${Math.min(profile.director_salary * 0.10, 500000).toFixed(0)} from 30% to 10% slab = saving 20% = ₹${profFeesSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'pf_1', label: 'Draft professional services agreement at arm\'s length', type: 'documentation', completed: false },
      { id: 'pf_2', label: 'Deduct TDS u/s 194J at 10% on fees paid', type: 'compliance', completed: false },
      { id: 'pf_3', label: 'Ensure family member files ITR with this income', type: 'filing', completed: false }
    ],
    documents_required: ['Professional Service Agreement', 'Family Member Qualification Proof', 'TDS Challans', 'Fee Payment Records'],
    deadline: 'Structure before next salary review',
    fy_applicable: fy,
    tags: ['Professional Fees', 'Income Splitting', 'Director', 'Slab Optimization'],
    icon_name: 'Briefcase',
    color_accent: 'indigo'
  });

  return optimizations;
}
