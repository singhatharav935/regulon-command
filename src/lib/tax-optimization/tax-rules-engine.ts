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

  return optimizations;
}
