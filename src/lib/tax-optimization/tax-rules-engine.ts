import { CompanyProfile, TaxOptimization, OptimizationStatus, RiskLevel, Priority } from './types';

export function analyzeIncomeTaxOptimizations(profile: CompanyProfile): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const taxRate = 0.26; // 26% effective tax rate
  const fy = '2024-25';

  // 1. Sec 80JJAA - New Employee Deduction
  const sec80jjaaEligible = profile.new_employees_fy > 0 && profile.new_employee_avg_salary <= 25000;
  const sec80jjaaSavings = sec80jjaaEligible ? (profile.new_employees_fy * profile.new_employee_avg_salary * 12 * 0.30 * taxRate) : 0;
  optimizations.push({
    id: 'it_80jjaa',
    category: 'income_tax',
    section: 'Sec 80JJAA',
    title: 'Additional Deduction for New Employees',
    short_description: '30% additional deduction on salary paid to new employees for 3 years.',
    detailed_explanation: 'Under Section 80JJAA, an employer can claim an additional 30% deduction (over and above the regular 100% deduction) on the salary paid to new regular employees, provided their salary does not exceed ₹25,000 per month and they are employed for at least 240 days in the year.',
    legal_reference: 'Section 80JJAA of Income Tax Act, 1961',
    eligibility_criteria: ['Business subject to tax audit u/s 44AB', 'New employee salary ≤ ₹25,000/month', 'Employed for ≥ 240 days (150 for apparel)'],
    is_eligible: sec80jjaaEligible,
    status: sec80jjaaEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec80jjaaEligible ? 'high' : 'low',
    estimated_savings: sec80jjaaSavings,
    savings_calculation: sec80jjaaEligible ? `30% of (₹${profile.new_employee_avg_salary} * 12 * ${profile.new_employees_fy}) * ${taxRate * 100}% tax rate = ₹${sec80jjaaSavings.toFixed(2)}` : 'Not eligible',
    action_items: [
      { id: '80jjaa_1', label: 'Generate Form 10DA from CA', type: 'compliance', completed: false },
      { id: '80jjaa_2', label: 'Verify PF registration for new employees', type: 'verification', completed: false }
    ],
    documents_required: ['Form 10DA', 'Payroll register', 'PF returns'],
    deadline: 'Before filing ITR',
    fy_applicable: fy,
    tags: ['Employment', 'Deduction'],
    icon_name: 'users',
    color_accent: 'blue'
  });

  // 2. Sec 32(1)(iia) - Additional Depreciation
  const sec32Eligible = profile.is_manufacturing && profile.new_machinery_investment > 0;
  const sec32Savings = sec32Eligible ? (profile.new_machinery_investment * 0.20 * taxRate) : 0;
  optimizations.push({
    id: 'it_32_1_iia',
    category: 'income_tax',
    section: 'Sec 32(1)(iia)',
    title: 'Additional Depreciation on New Machinery',
    short_description: '20% additional depreciation on new plant and machinery.',
    detailed_explanation: 'Manufacturing units can claim an additional 20% depreciation on the actual cost of new plant and machinery acquired and installed during the year.',
    legal_reference: 'Section 32(1)(iia) of Income Tax Act, 1961',
    eligibility_criteria: ['Assessee engaged in manufacture or production of any article', 'New plant and machinery installed'],
    is_eligible: sec32Eligible,
    status: sec32Eligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec32Eligible ? 'high' : 'medium',
    estimated_savings: sec32Savings,
    savings_calculation: sec32Eligible ? `20% of ₹${profile.new_machinery_investment} * ${taxRate * 100}% = ₹${sec32Savings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '32_1', label: 'Ensure invoices are in company name', type: 'verification', completed: false }],
    documents_required: ['Machinery Invoices', 'Installation Certificate'],
    deadline: 'During ITR filing',
    fy_applicable: fy,
    tags: ['Manufacturing', 'Depreciation'],
    icon_name: 'settings',
    color_accent: 'gray'
  });

  // 3. Sec 115BAB - New Manufacturing 15% rate
  const incDate = new Date(profile.incorporation_date);
  const oct2019 = new Date('2019-10-01');
  const isCompanyType = ['company', 'pvt_ltd', 'public_ltd', 'opc'].includes(profile.entity_type);
  const sec115babEligible = profile.is_manufacturing && isCompanyType && incDate >= oct2019;
  const normalTax = profile.net_profit_before_tax * 0.25;
  const babTax = profile.net_profit_before_tax * 0.15;
  const sec115babSavings = Math.max(0, normalTax - babTax);
  optimizations.push({
    id: 'it_115bab',
    category: 'income_tax',
    section: 'Sec 115BAB',
    title: '15% Concessional Tax Rate for New Manufacturers',
    short_description: 'Opt for a lower 15% corporate tax rate for new manufacturing companies.',
    detailed_explanation: 'New manufacturing domestic companies incorporated on or after Oct 1, 2019 can opt to pay tax at 15% (plus surcharge/cess) provided they do not claim specified deductions.',
    legal_reference: 'Section 115BAB of Income Tax Act',
    eligibility_criteria: ['Incorporated >= 01-Oct-2019', 'Manufacturing business', 'Cannot claim Chapter VI-A deductions'],
    is_eligible: sec115babEligible,
    status: sec115babEligible ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: sec115babEligible ? 'critical' : 'low',
    estimated_savings: sec115babEligible ? sec115babSavings : 0,
    savings_calculation: sec115babEligible ? `(Normal 25% - Concessional 15%) on Profit ₹${profile.net_profit_before_tax} = ₹${sec115babSavings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '115bab_1', label: 'File Form 10-ID before ITR', type: 'form', completed: false }],
    documents_required: ['Form 10-ID'],
    deadline: 'Before ITR filing date',
    fy_applicable: fy,
    tags: ['Tax Rate', 'Manufacturing'],
    icon_name: 'percent',
    color_accent: 'green'
  });

  // 4. Sec 115BAA - Domestic Company 22% rate
  const sec115baaEligible = isCompanyType && !sec115babEligible;
  const baaTax = profile.net_profit_before_tax * 0.22;
  const baaNormalTax = profile.net_profit_before_tax * 0.25;
  const sec115baaSavings = Math.max(0, baaNormalTax - baaTax);
  optimizations.push({
    id: 'it_115baa',
    category: 'income_tax',
    section: 'Sec 115BAA',
    title: '22% Concessional Corporate Tax Rate',
    short_description: 'Opt for 22% tax rate for domestic companies.',
    detailed_explanation: 'Domestic companies can opt for 22% tax rate (effective ~25.17%) by foregoing certain deductions and exemptions.',
    legal_reference: 'Section 115BAA of Income Tax Act',
    eligibility_criteria: ['Domestic Company', 'Forego specified deductions/exemptions'],
    is_eligible: sec115baaEligible,
    status: sec115baaEligible ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: sec115baaEligible ? 'high' : 'low',
    estimated_savings: sec115baaEligible ? sec115baaSavings : 0,
    savings_calculation: sec115baaEligible ? `(Normal 25% - Concessional 22%) on Profit ₹${profile.net_profit_before_tax} = ₹${sec115baaSavings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '115baa_1', label: 'File Form 10-IC', type: 'form', completed: false }],
    documents_required: ['Form 10-IC'],
    deadline: 'Before ITR filing',
    fy_applicable: fy,
    tags: ['Tax Rate'],
    icon_name: 'percent',
    color_accent: 'blue'
  });

  // 5. Sec 80-IAC - Startup Tax Holiday
  const sec80iacEligible = profile.dipp_registered && profile.annual_turnover <= 1000000000; // 100Cr
  const sec80iacSavings = sec80iacEligible ? profile.net_profit_before_tax * taxRate : 0;
  optimizations.push({
    id: 'it_80iac',
    category: 'income_tax',
    section: 'Sec 80-IAC',
    title: 'Startup Tax Holiday (100% Deduction)',
    short_description: '100% tax exemption on profits for 3 out of 10 years for eligible startups.',
    detailed_explanation: 'Eligible startups can claim a 100% deduction of profits for any 3 consecutive years out of their first 10 years of incorporation.',
    legal_reference: 'Section 80-IAC of Income Tax Act',
    eligibility_criteria: ['DPIIT Recognized Startup', 'Turnover < 100 Cr', 'Incorporated between Apr 2016 and Mar 2024'],
    is_eligible: sec80iacEligible,
    status: sec80iacEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec80iacEligible ? 'critical' : 'low',
    estimated_savings: sec80iacSavings,
    savings_calculation: sec80iacEligible ? `100% of tax on Profit ₹${profile.net_profit_before_tax} = ₹${sec80iacSavings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '80iac_1', label: 'Apply for 80-IAC certificate from Inter-Ministerial Board', type: 'certificate', completed: false }],
    documents_required: ['IMB Certificate'],
    deadline: 'Varies',
    fy_applicable: fy,
    tags: ['Startup', 'Exemption'],
    icon_name: 'rocket',
    color_accent: 'purple'
  });

  // 6. Sec 35(1)(i) - Revenue R&D
  const sec351iEligible = profile.r_and_d_expenditure > 0;
  const sec351iSavings = sec351iEligible ? profile.r_and_d_expenditure * taxRate : 0;
  optimizations.push({
    id: 'it_35_1_i',
    category: 'income_tax',
    section: 'Sec 35(1)(i)',
    title: 'Revenue Expenditure on Scientific Research',
    short_description: '100% deduction on revenue R&D expenditure.',
    detailed_explanation: 'Expenditure (other than land) incurred on scientific research related to business is fully deductible.',
    legal_reference: 'Section 35(1)(i) of Income Tax Act',
    eligibility_criteria: ['Incurred R&D expenditure related to business'],
    is_eligible: sec351iEligible,
    status: sec351iEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec351iEligible ? 'high' : 'low',
    estimated_savings: sec351iSavings,
    savings_calculation: sec351iEligible ? `100% deduction of ₹${profile.r_and_d_expenditure} * ${taxRate * 100}% = ₹${sec351iSavings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '351i_1', label: 'Document all R&D expenses separately', type: 'accounting', completed: false }],
    documents_required: ['Ledger for R&D expenses'],
    deadline: 'Ongoing',
    fy_applicable: fy,
    tags: ['R&D'],
    icon_name: 'flask',
    color_accent: 'teal'
  });

  // 7. Sec 35(2AB) - In-house R&D (Currently limited to 100%, earlier was weighted)
  // 8. Sec 35D - Preliminary Expenses
  const sec35dEligible = profile.preliminary_expenses > 0;
  const sec35dSavings = sec35dEligible ? (profile.preliminary_expenses / 5) * taxRate : 0;
  optimizations.push({
    id: 'it_35d',
    category: 'income_tax',
    section: 'Sec 35D',
    title: 'Amortization of Preliminary Expenses',
    short_description: 'Amortize preliminary/incorporation expenses over 5 years.',
    detailed_explanation: 'Certain preliminary expenses incurred before commencement of business or for extension of undertaking can be amortized over 5 successive years.',
    legal_reference: 'Section 35D of Income Tax Act',
    eligibility_criteria: ['Indian company or resident non-corporate'],
    is_eligible: sec35dEligible,
    status: sec35dEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec35dEligible ? 'medium' : 'low',
    estimated_savings: sec35dSavings,
    savings_calculation: sec35dEligible ? `1/5th of ₹${profile.preliminary_expenses} = ₹${profile.preliminary_expenses/5} * ${taxRate*100}% = ₹${sec35dSavings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '35d_1', label: 'Track unamortized preliminary expenses', type: 'accounting', completed: false }],
    documents_required: ['Invoices of incorporation expenses', 'Form 3CEB if applicable'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['Amortization'],
    icon_name: 'file-text',
    color_accent: 'gray'
  });

  // 9. Sec 43B(h) - MSME 45-Day Payment
  const sec43bhRisk = profile.msme_overdue_payables > 0;
  const sec43bhPotentialLoss = sec43bhRisk ? profile.msme_overdue_payables * taxRate : 0;
  optimizations.push({
    id: 'it_43bh',
    category: 'income_tax',
    section: 'Sec 43B(h)',
    title: 'Prevent Disallowance on MSME Dues',
    short_description: 'Pay MSME dues within 45 days to prevent disallowance of expense.',
    detailed_explanation: 'Any sum payable to a micro or small enterprise beyond the time limit specified in MSMED Act (max 45 days) will be allowed as deduction only on actual payment.',
    legal_reference: 'Section 43B(h) of Income Tax Act',
    eligibility_criteria: ['Purchases from Micro/Small enterprises'],
    is_eligible: true, // Always applicable to check
    status: sec43bhRisk ? 'action_required' : 'claimed',
    risk_level: sec43bhRisk ? 'high' : 'safe',
    priority: sec43bhRisk ? 'critical' : 'low',
    estimated_savings: sec43bhPotentialLoss, // This is technically avoiding a loss
    savings_calculation: sec43bhRisk ? `Avoiding tax on disallowed expense of ₹${profile.msme_overdue_payables} = ₹${sec43bhPotentialLoss.toFixed(2)}` : 'No overdue MSME payables.',
    action_items: [{ id: '43bh_1', label: 'Clear overdue MSME payments before year-end', type: 'payment', completed: false }],
    documents_required: ['MSME Registration of vendors', 'Aging Report'],
    deadline: '31st March / Due date of payment',
    fy_applicable: fy,
    tags: ['Compliance', 'MSME'],
    icon_name: 'alert-triangle',
    color_accent: 'red'
  });

  // 12. Sec 44AD - Presumptive taxation business <= 3 Cr (Assume 2Cr for most, 3Cr if digital)
  const sec44adEligible = ['proprietorship', 'huf', 'partnership'].includes(profile.entity_type) && profile.annual_turnover <= 30000000 && !profile.is_manufacturing;
  optimizations.push({
    id: 'it_44ad',
    category: 'income_tax',
    section: 'Sec 44AD',
    title: 'Presumptive Taxation for Business',
    short_description: 'Declare profits at 8% (or 6% for digital) of turnover without maintaining detailed books.',
    detailed_explanation: 'Eligible businesses with turnover up to ₹3 Cr (if 95% digital receipts) or ₹2 Cr can declare presumptive profit at 8% (non-digital) or 6% (digital).',
    legal_reference: 'Section 44AD of Income Tax Act',
    eligibility_criteria: ['Resident Individual, HUF, Partnership (not LLP)', 'Turnover limits met'],
    is_eligible: sec44adEligible,
    status: sec44adEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec44adEligible ? 'medium' : 'low',
    estimated_savings: 0, // Hard to estimate without actual profit margins, so keep it as strategic
    savings_calculation: sec44adEligible ? 'Savings depend on actual margins vs presumptive 6%/8% rate.' : 'N/A',
    action_items: [{ id: '44ad_1', label: 'Evaluate actual profit margin against 6/8%', type: 'analysis', completed: false }],
    documents_required: ['Bank Statements'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['Presumptive', 'Compliance'],
    icon_name: 'briefcase',
    color_accent: 'blue'
  });

  // 19. Sec 40A(3) - Cash payment limit
  optimizations.push({
    id: 'it_40a3',
    category: 'income_tax',
    section: 'Sec 40A(3)',
    title: 'Cash Payment Limit Violation Detection',
    short_description: 'Avoid 100% disallowance on cash payments exceeding ₹10,000.',
    detailed_explanation: 'Any expenditure in respect of which payment exceeds ₹10,000 in a day to a single person otherwise than by account payee cheque/draft/ECS is 100% disallowed.',
    legal_reference: 'Section 40A(3) of Income Tax Act',
    eligibility_criteria: ['Applicable to all businesses'],
    is_eligible: true,
    status: 'action_required', // Ongoing compliance
    risk_level: 'high',
    priority: 'high',
    estimated_savings: 0,
    savings_calculation: 'Prevents 100% disallowance of expense.',
    action_items: [{ id: '40a3_1', label: 'Enforce digital payments for all transactions > ₹10k', type: 'policy', completed: false }],
    documents_required: ['Cash Book'],
    deadline: 'Ongoing',
    fy_applicable: fy,
    tags: ['Compliance', 'Cash'],
    icon_name: 'ban',
    color_accent: 'red'
  });

  // 20. Sec 10AA - SEZ Unit profit deduction
  const sec10aaEligible = profile.special_zone === 'sez';
  const sec10aaSavings = sec10aaEligible ? (profile.total_exports / profile.total_revenue) * profile.net_profit_before_tax * taxRate : 0;
  optimizations.push({
    id: 'it_10aa',
    category: 'income_tax',
    section: 'Sec 10AA',
    title: 'SEZ Export Profit Deduction',
    short_description: 'Tax holiday for units in Special Economic Zones.',
    detailed_explanation: '100% of export profits for first 5 years, 50% for next 5 years, and up to 50% for another 5 years subject to reserve creation.',
    legal_reference: 'Section 10AA of Income Tax Act',
    eligibility_criteria: ['Unit in SEZ', 'Manufacture or services export'],
    is_eligible: sec10aaEligible,
    status: sec10aaEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec10aaEligible ? 'critical' : 'low',
    estimated_savings: sec10aaSavings,
    savings_calculation: sec10aaEligible ? `(Export Turnover / Total Turnover) * Profit * Tax Rate = ₹${sec10aaSavings.toFixed(2)}` : 'N/A',
    action_items: [{ id: '10aa_1', label: 'Obtain CA certificate in Form 56F', type: 'certificate', completed: false }],
    documents_required: ['Form 56F', 'Export Invoices'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['SEZ', 'Exports'],
    icon_name: 'globe',
    color_accent: 'blue'
  });


  // ─── 12. Sec 80IC — Special Category States 100% Deduction ─────────────────
  const sec80icEligible = ['ne_state', 'jk', 'hp', 'uttarakhand'].includes(profile.special_zone || '');
  const sec80icSavings = sec80icEligible ? profile.net_profit_before_tax * taxRate : 0;
  optimizations.push({
    id: 'it_80ic',
    category: 'income_tax',
    section: 'Sec 80IC',
    title: '100% Profit Deduction — Special Category States',
    short_description: '100% income tax deduction for units in Uttarakhand, HP, and North-East for 10 years.',
    detailed_explanation: 'Units set up in special category states (Uttarakhand, Himachal Pradesh, North-East states, J&K) engaged in manufacturing or specified businesses get 100% deduction for first 5 years and 25% (30% for companies) for next 5 years.',
    legal_reference: 'Section 80IC of Income Tax Act, 1961',
    eligibility_criteria: ['Located in Uttarakhand / HP / NE State / J&K', 'Manufacturing or specified business', 'Commenced operations after approved date'],
    is_eligible: sec80icEligible,
    status: sec80icEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec80icEligible ? 'critical' : 'low',
    estimated_savings: sec80icSavings,
    savings_calculation: sec80icEligible ? `100% of profit ₹${profile.net_profit_before_tax} * ${taxRate * 100}% = ₹${sec80icSavings.toFixed(2)}` : 'N/A — not in special category state',
    action_items: [
      { id: '80ic_1', label: 'Obtain commencement certificate from state authority', type: 'compliance', completed: false },
      { id: '80ic_2', label: 'Claim deduction in ITR under Part C', type: 'filing', completed: false }
    ],
    documents_required: ['Commencement Certificate', 'CA Audit Report', 'Factory Location Proof'],
    deadline: 'ITR filing date',
    fy_applicable: fy,
    tags: ['Special Zone', 'Deduction', 'Manufacturing'],
    icon_name: 'map-pin',
    color_accent: 'emerald'
  });

  // ─── 13. Sec 32AC — Investment Allowance on New Machinery ──────────────────
  const sec32acEligible = profile.is_manufacturing && profile.new_machinery_investment > 2500000;
  const sec32acSavings = sec32acEligible ? profile.new_machinery_investment * 0.15 * taxRate : 0;
  optimizations.push({
    id: 'it_32ac',
    category: 'income_tax',
    section: 'Sec 32AC',
    title: 'Investment Allowance — 15% on New Machinery',
    short_description: 'Additional 15% investment allowance deduction on new plant & machinery exceeding ₹25L.',
    detailed_explanation: 'Manufacturing companies investing more than ₹25 lakhs in new plant and machinery during the year can claim an additional 15% investment allowance (over and above normal depreciation) as a deduction from taxable income.',
    legal_reference: 'Section 32AC of Income Tax Act, 1961',
    eligibility_criteria: ['Company engaged in manufacturing', 'New P&M investment > ₹25 lakhs in the FY', 'Machinery not second-hand'],
    is_eligible: sec32acEligible,
    status: sec32acEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec32acEligible ? 'high' : 'low',
    estimated_savings: sec32acSavings,
    savings_calculation: sec32acEligible ? `15% of ₹${profile.new_machinery_investment} * ${taxRate * 100}% tax = ₹${sec32acSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '32ac_1', label: 'Prepare investment allowance schedule', type: 'documentation', completed: false },
      { id: '32ac_2', label: 'Include in Form 3CD', type: 'filing', completed: false }
    ],
    documents_required: ['Machinery Purchase Invoices', 'Installation Certificates', 'Asset Register'],
    deadline: 'Before ITR filing',
    fy_applicable: fy,
    tags: ['Manufacturing', 'Investment', 'Allowance'],
    icon_name: 'settings',
    color_accent: 'blue'
  });

  // ─── 14. Sec 35CCD — Skill Development Project 150% Deduction ──────────────
  const sec35ccdEligible = profile.total_employees > 10;
  const skillSpend = profile.total_expenses * 0.02;
  const sec35ccdSavings = sec35ccdEligible ? skillSpend * 1.0 * taxRate : 0;
  optimizations.push({
    id: 'it_35ccd',
    category: 'income_tax',
    section: 'Sec 35CCD',
    title: 'Skill Development Expenditure — 100% Deduction',
    short_description: '100% deduction on expenditure incurred on approved skill development projects (weighted deduction reduced to 100% from AY 2021-22).',
    detailed_explanation: 'Companies with more than 10 employees can claim 100% deduction on expenditure incurred for skill development of their employees through approved training programs and institutions under the National Skill Development Corporation framework. Note: The 150% weighted deduction was reduced to 100% from Assessment Year 2021-22 by Finance Act 2020.',
    legal_reference: 'Section 35CCD of Income Tax Act, 1961 (as amended by Finance Act 2020 — 100% from AY 2021-22)',
    eligibility_criteria: ['More than 10 employees', 'Expenditure on approved skill development project', 'Training through NSDC-approved institution'],
    is_eligible: sec35ccdEligible,
    status: sec35ccdEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec35ccdEligible ? 'medium' : 'low',
    estimated_savings: sec35ccdSavings,
    savings_calculation: sec35ccdEligible ? `100% deduction on estimated 2% of expenses ₹${skillSpend.toFixed(0)} * ${taxRate * 100}% = ₹${sec35ccdSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '35ccd_1', label: 'Get training program approved by NSDC', type: 'compliance', completed: false },
      { id: '35ccd_2', label: 'Maintain separate ledger for skill training expenses', type: 'documentation', completed: false }
    ],
    documents_required: ['NSDC Approval Letter', 'Training Invoices', 'Attendance Records'],
    deadline: 'Before ITR filing',
    fy_applicable: fy,
    tags: ['Skill', 'Training', 'Deduction'],
    icon_name: 'graduation-cap',
    color_accent: 'violet'
  });

  // ─── 15. Sec 80G — CSR & Approved Donations 100% Deduction ─────────────────
  const sec80gEligible = profile.net_profit_before_tax > 1000000;
  const sec80gSavings = sec80gEligible ? (profile.net_profit_before_tax * 0.02) * taxRate : 0;
  optimizations.push({
    id: 'it_80g',
    category: 'income_tax',
    section: 'Sec 80G',
    title: 'CSR & Approved Donation 100% Deduction',
    short_description: '100% deduction on donations to approved charitable institutions and PM Relief Funds.',
    detailed_explanation: 'Donations to approved charitable institutions, PM CARES Fund, CM Relief Funds, National Defence Fund, and other specified entities qualify for 100% or 50% deduction under Section 80G. For companies with CSR obligations (net profit > ₹50L), this integrates seamlessly with mandatory CSR spend.',
    legal_reference: 'Section 80G of Income Tax Act, 1961',
    eligibility_criteria: ['Net profit > ₹10 Lakhs', 'Donation to 80G-approved institution', 'Cash donations capped at ₹2,000'],
    is_eligible: sec80gEligible,
    status: sec80gEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec80gEligible ? 'medium' : 'low',
    estimated_savings: sec80gSavings,
    savings_calculation: sec80gEligible ? `2% of profits ₹${(profile.net_profit_before_tax * 0.02).toFixed(0)} * ${taxRate * 100}% = ₹${sec80gSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '80g_1', label: 'Verify donee institution 80G registration', type: 'verification', completed: false },
      { id: '80g_2', label: 'Collect Form 10BE (donation receipt) from donee', type: 'documentation', completed: false }
    ],
    documents_required: ['Form 10BE from donee', 'Bank transfer receipt', '80G certificate of donee'],
    deadline: 'Before 31st May (for Form 10BE)',
    fy_applicable: fy,
    tags: ['CSR', 'Donation', 'Deduction'],
    icon_name: 'heart',
    color_accent: 'rose'
  });

  // ─── 16. Sec 36(1)(va) — Timely PF/ESI Deposit ─────────────────────────────
  const pfEsiRisk = profile.payroll_count > 0;
  const pfEsiPotentialLoss = pfEsiRisk ? profile.payroll_count * 1500 * 12 * taxRate * 0.05 : 0;
  optimizations.push({
    id: 'it_36_1_va',
    category: 'income_tax',
    section: 'Sec 36(1)(va)',
    title: 'PF & ESI Deposit Compliance — Prevent Disallowance',
    short_description: 'Ensure PF/ESI contributions are deposited before due date to avoid 100% disallowance.',
    detailed_explanation: 'Under Section 36(1)(va), employee contributions to PF, ESI, and other welfare funds collected from salaries are only deductible if deposited before the due date specified under the respective Acts. Late deposit (even by one day) leads to 100% disallowance of the employee contribution amount.',
    legal_reference: 'Section 36(1)(va) of Income Tax Act, 1961 read with Provident Funds Act',
    eligibility_criteria: ['Has employees on payroll', 'Deducts PF/ESI from employee salaries', 'Must deposit before respective due dates'],
    is_eligible: pfEsiRisk,
    status: 'action_required',
    risk_level: 'high',
    priority: pfEsiRisk ? 'critical' : 'low',
    estimated_savings: pfEsiPotentialLoss,
    savings_calculation: pfEsiRisk ? `Prevents disallowance on ₹${(profile.payroll_count * 1500 * 12).toFixed(0)} in PF contributions — saves ₹${pfEsiPotentialLoss.toFixed(2)} in taxes` : 'N/A',
    action_items: [
      { id: '36va_1', label: 'Set auto-payment for PF by 15th of each month', type: 'compliance', completed: false },
      { id: '36va_2', label: 'Set auto-payment for ESI by 15th of each month', type: 'compliance', completed: false },
      { id: '36va_3', label: 'Reconcile Form 26A with Form 3CD', type: 'verification', completed: false }
    ],
    documents_required: ['PF Challan Receipts', 'ESI Challan Receipts', 'Payroll Register'],
    deadline: 'Monthly — 15th for PF, 15th for ESI',
    fy_applicable: fy,
    tags: ['Compliance', 'Payroll', 'PF', 'ESI'],
    icon_name: 'shield',
    color_accent: 'red'
  });

  // ─── 17. Sec 80EEB — Electric Vehicle Loan Interest ─────────────────────────
  const sec80eebSavings = 150000 * taxRate;
  optimizations.push({
    id: 'it_80eeb',
    category: 'income_tax',
    section: 'Sec 80EEB',
    title: 'EV Loan Interest Deduction — Up to ₹1.5L',
    short_description: 'Deduct up to ₹1.5 lakh interest on loan taken for purchase of Electric Vehicle.',
    detailed_explanation: 'Individuals and directors can claim a deduction of up to ₹1,50,000 on interest paid on loans taken for purchase of an electric vehicle. The loan must be taken from a financial institution and the EV must be for business or personal use. This benefit is available from FY 2019-20 onwards.',
    legal_reference: 'Section 80EEB of Income Tax Act, 1961',
    eligibility_criteria: ['Loan from bank/NBFC for EV purchase', 'Loan sanctioned between Apr 2019 – Mar 2023', 'Individual taxpayer or director'],
    is_eligible: true,
    status: 'eligible',
    risk_level: 'safe',
    priority: 'medium',
    estimated_savings: sec80eebSavings,
    savings_calculation: `Max ₹1,50,000 interest * ${taxRate * 100}% = ₹${sec80eebSavings.toFixed(2)}`,
    action_items: [
      { id: '80eeb_1', label: 'Obtain interest certificate from lender', type: 'documentation', completed: false },
      { id: '80eeb_2', label: 'Claim in director personal ITR', type: 'filing', completed: false }
    ],
    documents_required: ['EV Loan Statement', 'Interest Certificate from Bank', 'RC Book of EV'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['EV', 'Green', 'Director', 'Loan'],
    icon_name: 'zap',
    color_accent: 'emerald'
  });

  // ─── 18. Sec 35(1)(ii) — Donation to Approved Scientific Research ──────────
  const sec35_1_iiEligible = profile.r_and_d_expenditure > 0;
  const sec35_1_iiSavings = sec35_1_iiEligible ? profile.r_and_d_expenditure * taxRate : 0;
  optimizations.push({
    id: 'it_35_1_ii',
    category: 'income_tax',
    section: 'Sec 35(1)(ii)',
    title: 'Donation to Approved Scientific Research — 100% Deduction',
    short_description: '100% deduction on donations made to approved scientific research institutions (weighted deduction reduced to 100% from AY 2021-22).',
    detailed_explanation: 'Donations to approved scientific research associations, universities, IITs, and national laboratories qualify for 100% deduction. Note: The earlier 125% weighted deduction was reduced to 100% from Assessment Year 2021-22 by Finance Act 2020. It still incentivizes industry-academia collaboration by allowing full deduction of any donation to DSIR-approved institutions.',
    legal_reference: 'Section 35(1)(ii) of Income Tax Act, 1961 (as amended by Finance Act 2020 — 100% from AY 2021-22)',
    eligibility_criteria: ['Incurred R&D expenditure in current FY', 'Donation to DSIR-approved institution / IIT / NIT / National Lab', 'Payment by account payee cheque/NEFT'],
    is_eligible: sec35_1_iiEligible,
    status: sec35_1_iiEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec35_1_iiEligible ? 'high' : 'low',
    estimated_savings: sec35_1_iiSavings,
    savings_calculation: sec35_1_iiEligible ? `100% of ₹${profile.r_and_d_expenditure} R&D donation * ${taxRate * 100}% = ₹${sec35_1_iiSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '35_1_ii_1', label: 'Verify DSIR/SIRO approval of recipient institution', type: 'verification', completed: false },
      { id: '35_1_ii_2', label: 'Obtain deduction certificate from institution', type: 'documentation', completed: false }
    ],
    documents_required: ['DSIR Approval of Institution', 'Donation Receipt', 'Bank Transfer Proof'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['R&D', 'Donation', 'Deduction', 'Innovation'],
    icon_name: 'flask-conical',
    color_accent: 'cyan'
  });

  // ─── 19. Sec 10B — EOU Export Profit 100% Deduction ────────────────────────
  const sec10bEligible = profile.special_zone === 'eou';
  const exportRatio = profile.total_revenue > 0 ? profile.total_exports / profile.total_revenue : 0;
  const sec10bSavings = sec10bEligible ? exportRatio * profile.net_profit_before_tax * taxRate : 0;
  optimizations.push({
    id: 'it_10b',
    category: 'income_tax',
    section: 'Sec 10B',
    title: 'EOU Export Profit — 100% Tax Deduction',
    short_description: '100% deduction on export profits for Export Oriented Units (EOUs).',
    detailed_explanation: 'Export Oriented Units (EOUs) approved by the Board of Approval can claim 100% deduction on profits derived from export of goods/services. This is subject to positive NFE (Net Foreign Exchange) earnings and must be claimed before converting to a DTA unit.',
    legal_reference: 'Section 10B of Income Tax Act, 1961',
    eligibility_criteria: ['Approved EOU by Board of Approval / DGFT', 'Positive Net Foreign Exchange (NFE)', 'Has not opted for Chapter VI-A deductions for same income'],
    is_eligible: sec10bEligible,
    status: sec10bEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec10bEligible ? 'critical' : 'low',
    estimated_savings: sec10bSavings,
    savings_calculation: sec10bEligible ? `Export ratio ${(exportRatio * 100).toFixed(1)}% * Profit ₹${profile.net_profit_before_tax} * ${taxRate * 100}% = ₹${sec10bSavings.toFixed(2)}` : 'N/A — not an EOU',
    action_items: [
      { id: '10b_1', label: 'Calculate Net Foreign Exchange (NFE) for the year', type: 'verification', completed: false },
      { id: '10b_2', label: 'Obtain Form 56G from CA', type: 'compliance', completed: false }
    ],
    documents_required: ['EOU Approval Letter', 'Form 56G', 'Export Invoices', 'Foreign Exchange Receipts'],
    deadline: 'ITR filing date',
    fy_applicable: fy,
    tags: ['EOU', 'Exports', 'Tax Holiday'],
    icon_name: 'globe',
    color_accent: 'blue'
  });

  // ─── 20. Sec 115JB — Minimum Alternate Tax (MAT) Credit ────────────────────
  optimizations.push({
    id: 'it_115jb',
    category: 'income_tax',
    section: 'Sec 115JB',
    title: 'MAT Credit Utilisation Check',
    short_description: 'Check and utilise accumulated MAT credit against regular tax liability for up to 15 years.',
    detailed_explanation: 'If a company pays Minimum Alternate Tax (18.5% of book profit), the excess over regular tax becomes MAT credit. This credit can be carried forward for 15 years and set-off against regular tax in years when regular tax exceeds MAT. Many companies have significant unutilised MAT credit sitting idle.',
    legal_reference: 'Section 115JB and 115JAA of Income Tax Act, 1961',
    eligibility_criteria: ['Company taxpayer', 'Has paid MAT in prior years', 'Regular tax liability exists in current year'],
    is_eligible: true,
    status: 'action_required',
    risk_level: 'safe',
    priority: 'high',
    estimated_savings: profile.net_profit_before_tax * 0.05,
    savings_calculation: 'Review MAT credit account — potential recovery of past excess taxes paid',
    action_items: [
      { id: '115jb_1', label: 'Compute Book Profit as per Sch III', type: 'verification', completed: false },
      { id: '115jb_2', label: 'Review MAT credit ledger from prior years', type: 'documentation', completed: false },
      { id: '115jb_3', label: 'Set-off MAT credit in current year ITR', type: 'filing', completed: false }
    ],
    documents_required: ['Audited Balance Sheet', 'Prior Year ITR Computation', 'Form 29C'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['MAT', 'Credit', 'Company Tax'],
    icon_name: 'refresh-cw',
    color_accent: 'amber'
  });

  // ─── 21. Sec 80RRB — Patent Royalty Income Deduction ───────────────────────
  const sec80rrbEligible = profile.r_and_d_expenditure > 0 && !!profile.dipp_registered;
  const sec80rrbSavings = sec80rrbEligible ? Math.min(profile.r_and_d_expenditure * 0.5, 300000) * taxRate : 0;
  optimizations.push({
    id: 'it_80rrb',
    category: 'income_tax',
    section: 'Sec 80RRB',
    title: 'Patent Royalty Income — ₹3L Deduction',
    short_description: 'Deduction up to ₹3 lakh on royalty income from Indian patents for inventors.',
    detailed_explanation: 'An individual who is a patentee of an Indian patent can claim deduction on royalty income up to ₹3,00,000 per year. For DPIIT-recognized startups with R&D activities, this is a significant optimization as patent licensing income can be structured to maximize this benefit.',
    legal_reference: 'Section 80RRB of Income Tax Act, 1961',
    eligibility_criteria: ['Indian resident patentee', 'Patent registered under Patents Act 1970', 'DPIIT registration helps qualify faster', 'Royalty from licensing the patent'],
    is_eligible: sec80rrbEligible,
    status: sec80rrbEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec80rrbEligible ? 'medium' : 'low',
    estimated_savings: sec80rrbSavings,
    savings_calculation: sec80rrbEligible ? `Min(50% of R&D spend, ₹3L) = ₹${Math.min(profile.r_and_d_expenditure * 0.5, 300000).toFixed(0)} * ${taxRate * 100}% = ₹${sec80rrbSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '80rrb_1', label: 'File patent application with Patent Office', type: 'compliance', completed: false },
      { id: '80rrb_2', label: 'Structure R&D output for royalty licensing', type: 'documentation', completed: false }
    ],
    documents_required: ['Patent Grant Certificate', 'Royalty Agreement', 'CA Certificate'],
    deadline: 'ITR filing',
    fy_applicable: fy,
    tags: ['Patent', 'R&D', 'Royalty', 'Innovation'],
    icon_name: 'award',
    color_accent: 'amber'
  });

  // ─── 22. Sec 35AD — Capital Expenditure for Specified Businesses ────────────
  const sec35adEligible = profile.is_manufacturing && profile.new_machinery_investment > 0;
  const sec35adSavings = sec35adEligible ? profile.new_machinery_investment * taxRate : 0;
  optimizations.push({
    id: 'it_35ad',
    category: 'income_tax',
    section: 'Sec 35AD',
    title: '100% Capital Expenditure Deduction — Specified Businesses',
    short_description: 'Claim 100% deduction on capital expenditure for specified businesses instead of normal depreciation.',
    detailed_explanation: 'Specified businesses (cold chain, warehousing, cross-country natural gas pipelines, hotels, hospitals, fertilizer plants, etc.) can opt to deduct 100% of capital expenditure in the year of incurrence instead of claiming regular depreciation over multiple years. This front-loads the tax benefit significantly.',
    legal_reference: 'Section 35AD of Income Tax Act, 1961',
    eligibility_criteria: ['Engaged in specified business u/s 35AD(8)', 'Capital expenditure incurred for that business', 'New plant — not second-hand'],
    is_eligible: sec35adEligible,
    status: sec35adEligible ? 'eligible' : 'not_eligible',
    risk_level: 'moderate',
    priority: sec35adEligible ? 'high' : 'low',
    estimated_savings: sec35adSavings,
    savings_calculation: sec35adEligible ? `100% of ₹${profile.new_machinery_investment} vs normal depreciation — Tax benefit ₹${sec35adSavings.toFixed(2)} upfront` : 'N/A',
    action_items: [
      { id: '35ad_1', label: 'Verify if business qualifies under Sec 35AD(8) list', type: 'verification', completed: false },
      { id: '35ad_2', label: 'Do not claim 80-IC/80-IE if opting for 35AD', type: 'compliance', completed: false }
    ],
    documents_required: ['Asset Purchase Invoices', 'Installation Certificate', 'CA Certificate'],
    deadline: 'Year of capital expenditure',
    fy_applicable: fy,
    tags: ['Capital Expenditure', 'Depreciation', 'Manufacturing'],
    icon_name: 'building',
    color_accent: 'gray'
  });

  // ─── 23. Sec 80M — Inter-corporate Dividend Deduction ──────────────────────
  const sec80mEligible = isCompanyType && profile.dividend_distributed > 0;
  const sec80mSavings = sec80mEligible ? profile.dividend_distributed * taxRate : 0;
  optimizations.push({
    id: 'it_80m',
    category: 'income_tax',
    section: 'Sec 80M',
    title: 'Inter-Corporate Dividend — Deduction to Prevent Cascading',
    short_description: 'Deduct dividends received from subsidiary/domestic company before paying your own dividend.',
    detailed_explanation: 'Under Section 80M, a domestic company that receives dividends from another domestic company/mutual fund can claim a deduction for the dividend amount, provided it distributes the same amount (or more) as dividend to its own shareholders within one month before the due date of filing ITR. This prevents cascading of dividend taxation.',
    legal_reference: 'Section 80M of Income Tax Act, 1961',
    eligibility_criteria: ['Domestic company receiving dividends from subsidiary', 'Pays out dividends before ITR due date', 'Deduction limited to lower of received or distributed dividend'],
    is_eligible: sec80mEligible,
    status: sec80mEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sec80mEligible ? 'high' : 'low',
    estimated_savings: sec80mSavings,
    savings_calculation: sec80mEligible ? `Dividend ₹${profile.dividend_distributed} * ${taxRate * 100}% = ₹${sec80mSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: '80m_1', label: 'Compute net dividend received from subsidiaries', type: 'verification', completed: false },
      { id: '80m_2', label: 'Ensure distribution before ITR due date', type: 'compliance', completed: false }
    ],
    documents_required: ['Dividend Receipts from Subsidiaries', 'Board Resolution for Dividend', 'Bank Statements'],
    deadline: '1 month before ITR filing',
    fy_applicable: fy,
    tags: ['Dividend', 'Subsidiary', 'Group Structure'],
    icon_name: 'git-branch',
    color_accent: 'violet'
  });

  return optimizations;
}
