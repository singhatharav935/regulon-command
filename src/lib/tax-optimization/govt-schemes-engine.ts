/**
 * GOVERNMENT SCHEMES & SUBSIDIES ENGINE — Complete 12-Scheme Analysis
 * ====================================================================
 * Analyzes company profile against Central & State Government subsidy
 * schemes for MSMEs, manufacturers, exporters, and startups.
 */

import { CompanyProfile, TaxOptimization } from './types';

export function analyzeGovtSchemeOptimizations(profile: CompanyProfile): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const fy = '2024-25';

  const isMsme = ['micro', 'small', 'medium'].includes(profile.msme_category || '');
  const isMicro = profile.msme_category === 'micro';
  const isSmall = profile.msme_category === 'small';
  const isMedium = profile.msme_category === 'medium';
  const isExporter = !!profile.is_exporter && profile.total_exports > 0;
  const isManufacturer = !!profile.is_manufacturing;

  // ─── 1. MSME ZED Scheme ────────────────────────────────────────────────────
  const zedSubsidyRate = isMicro ? 0.80 : isSmall ? 0.60 : isMedium ? 0.50 : 0;
  const zedEstimate = isMsme && isManufacturer ? 500000 * zedSubsidyRate : 0;
  optimizations.push({
    id: 'govt_zed',
    category: 'govt_scheme',
    section: 'MSME ZED Certification',
    title: 'Zero Defect Zero Effect (ZED) Subsidy',
    short_description: `Up to ${zedSubsidyRate * 100}% subsidy on ZED certification, testing, and quality improvement costs.`,
    detailed_explanation: 'The ZED Certification Scheme by Ministry of MSME promotes quality manufacturing. MSMEs get subsidies on certification cost (Micro: 80%, Small: 60%, Medium: 50%), plus additional financial assistance for handholding, consultancy, and technology upgradation to achieve ZED benchmarks. Total subsidy can go up to ₹5 Lakhs for certification and ₹10 Lakhs for testing equipment.',
    legal_reference: 'MSME Sustainable (ZED) Certification Scheme — Ministry of MSME, Government of India, Notification dated 14.04.2022.',
    eligibility_criteria: [
      'Valid Udyam Registration Certificate',
      'Manufacturing enterprise',
      `MSME Category: ${profile.msme_category || 'Not Registered'} (Subsidy: ${zedSubsidyRate * 100}%)`
    ],
    is_eligible: isMsme && isManufacturer,
    status: isMsme && isManufacturer ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: isMsme && isManufacturer ? 'medium' : 'low',
    estimated_savings: zedEstimate,
    savings_calculation: isMsme && isManufacturer
      ? `ZED Certification Cost: ~₹5,00,000\nSubsidy Rate (${profile.msme_category}): ${zedSubsidyRate * 100}%\nEstimated Subsidy: ₹${zedEstimate.toLocaleString('en-IN')}`
      : 'Not eligible — requires MSME registration and manufacturing activity.',
    action_items: [
      { id: 'zed_1', label: 'Register on ZED Portal (zed.msme.gov.in)', type: 'apply_scheme', completed: false },
      { id: 'zed_2', label: 'Apply for ZED Assessment', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Udyam Registration Certificate', 'Manufacturing License', 'Quality Standards Documentation'],
    deadline: 'Ongoing — open for applications',
    fy_applicable: fy,
    tags: ['MSME', 'Quality', 'Manufacturing'],
    icon_name: 'Award',
    color_accent: 'orange'
  });

  // ─── 2. RoDTEP Scheme ─────────────────────────────────────────────────────
  const rodtepRate = 0.02; // Average 2% (ranges 0.5% to 4.3%)
  const rodtepSavings = isExporter ? profile.total_exports * rodtepRate : 0;
  optimizations.push({
    id: 'govt_rodtep',
    category: 'govt_scheme',
    section: 'RoDTEP Scheme',
    title: 'Remission of Duties and Taxes on Exported Products',
    short_description: 'Claim 0.5% to 4.3% of FOB export value as duty credit scrips for reimbursement of embedded taxes.',
    detailed_explanation: 'RoDTEP replaces the earlier MEIS scheme. It reimburses central, state, and local duties/taxes/levies that are currently not being refunded under any other scheme (like GST refund or Drawback). The credit is given as transferable electronic duty credit ledger scrips that can be used to pay Basic Customs Duty on imports or transferred to other importers.',
    legal_reference: 'RoDTEP Scheme — Directorate General of Foreign Trade (DGFT), Notification No. 19/2015-2020 as amended. Rates notified HS-code wise.',
    eligibility_criteria: [
      'Exporter of goods (not services)',
      'Products covered under notified RoDTEP schedule',
      'Declaration made in Shipping Bill'
    ],
    is_eligible: isExporter,
    status: isExporter ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: isExporter ? 'high' : 'low',
    estimated_savings: rodtepSavings,
    savings_calculation: isExporter
      ? `Total Exports (FOB): ₹${profile.total_exports.toLocaleString('en-IN')}\nAverage RoDTEP Rate: ~2%\nEstimated Duty Credit: ₹${rodtepSavings.toLocaleString('en-IN')}`
      : 'Not an exporter of goods.',
    action_items: [
      { id: 'rodtep_1', label: 'Declare RoDTEP intent in Shipping Bill', type: 'generate_form', completed: false },
      { id: 'rodtep_2', label: 'Verify HS codes against RoDTEP schedule', type: 'calculate', completed: false }
    ],
    documents_required: ['Shipping Bills', 'RCMC (Registration-cum-Membership Certificate)', 'IEC Code'],
    deadline: 'At time of each export shipment',
    fy_applicable: fy,
    tags: ['Export', 'Duty Credit', 'DGFT'],
    icon_name: 'Globe',
    color_accent: 'blue'
  });

  // ─── 3. PLI Scheme ────────────────────────────────────────────────────────
  const pliEligible = isManufacturer && profile.annual_turnover >= 10000000; // ₹1 Cr+
  const pliIncentive = pliEligible ? profile.annual_turnover * 0.04 : 0; // 4% of incremental
  optimizations.push({
    id: 'govt_pli',
    category: 'govt_scheme',
    section: 'PLI Scheme',
    title: 'Production Linked Incentive (4-6% on Incremental Sales)',
    short_description: 'Earn 4% to 6% incentive on incremental sales over base year for eligible manufacturing sectors.',
    detailed_explanation: 'The PLI Scheme covers 14 key sectors including automobiles, advanced chemistry cells, textiles, food processing, electronics, pharma, telecom, white goods, specialty steel, drones, solar PV, and medical devices. Manufacturers achieving incremental sales growth over base year qualify for 4-6% incentive on the incremental production/sales value for 5 years.',
    legal_reference: 'Production Linked Incentive Schemes — Various sector-specific notifications by DPIIT/MoCI/MeitY. Master circular by DPIIT.',
    eligibility_criteria: [
      'Manufacturing unit in an eligible PLI sector',
      'Minimum investment thresholds met',
      'Incremental sales growth over base year'
    ],
    is_eligible: pliEligible,
    status: pliEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: pliEligible ? 'high' : 'low',
    estimated_savings: pliIncentive,
    savings_calculation: pliEligible
      ? `Annual Turnover: ₹${profile.annual_turnover.toLocaleString('en-IN')}\nPLI Incentive Rate: ~4%\nEstimated Annual Incentive: ₹${pliIncentive.toLocaleString('en-IN')}\n(Subject to sector-specific thresholds)`
      : 'Not in eligible manufacturing sector or below threshold.',
    action_items: [
      { id: 'pli_1', label: 'Identify applicable PLI sector', type: 'calculate', completed: false },
      { id: 'pli_2', label: 'Apply on PLI portal of respective Ministry', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Manufacturing License', 'Investment Proof', 'Audited Financial Statements', 'CA Certificate for Incremental Sales'],
    deadline: 'As per sector-specific window (check respective Ministry)',
    fy_applicable: fy,
    tags: ['Manufacturing', 'Incentive', 'Make in India'],
    icon_name: 'Factory',
    color_accent: 'green'
  });

  // ─── 4. CLCSS — Credit Linked Capital Subsidy ─────────────────────────────
  const clcssEligible = isMsme && profile.new_machinery_investment > 0;
  const clcssSubsidy = clcssEligible ? Math.min(profile.new_machinery_investment * 0.15, 1500000) : 0;
  optimizations.push({
    id: 'govt_clcss',
    category: 'govt_scheme',
    section: 'CLCSS',
    title: 'Credit Linked Capital Subsidy (15% on P&M)',
    short_description: '15% upfront capital subsidy on Plant & Machinery investment for technology upgradation (max ₹15 Lakhs).',
    detailed_explanation: 'Under Credit Linked Capital Subsidy Scheme (CLCSS), MSMEs investing in technology upgradation (Plant & Machinery) can avail 15% upfront capital subsidy on institutional finance up to ₹1 Crore. Maximum subsidy is ₹15 Lakhs. The scheme covers both new and existing MSMEs upgrading their production technology.',
    legal_reference: 'Credit Linked Capital Subsidy Scheme — Ministry of MSME, Office Memorandum No. 1(12)/2005-SSI(P&C).',
    eligibility_criteria: [
      'Valid Udyam Registration',
      'Investment in Plant & Machinery for technology upgradation',
      'Institutional finance (bank loan) availed',
      'Eligible sub-sectors as per scheme guidelines'
    ],
    is_eligible: clcssEligible,
    status: clcssEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: clcssEligible ? 'high' : 'low',
    estimated_savings: clcssSubsidy,
    savings_calculation: clcssEligible
      ? `Machinery Investment: ₹${profile.new_machinery_investment.toLocaleString('en-IN')}\nSubsidy Rate: 15%\nSubsidy Amount: ₹${(profile.new_machinery_investment * 0.15).toLocaleString('en-IN')}\nCapped at: ₹15,00,000\nActual Subsidy: ₹${clcssSubsidy.toLocaleString('en-IN')}`
      : 'No machinery investment or not an MSME.',
    action_items: [
      { id: 'clcss_1', label: 'Apply through nodal bank (SIDBI/Nationalized Banks)', type: 'apply_scheme', completed: false },
      { id: 'clcss_2', label: 'Submit technology upgradation DPR', type: 'generate_form', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'Bank Loan Sanction Letter', 'Machinery Invoices', 'Project Report/DPR'],
    deadline: 'Within 12 months of machinery installation',
    fy_applicable: fy,
    tags: ['MSME', 'Capital Subsidy', 'Technology'],
    icon_name: 'Factory',
    color_accent: 'violet'
  });

  // ─── 5. PMEGP ─────────────────────────────────────────────────────────────
  const pmegpEligible = profile.annual_turnover <= 50000000 && isManufacturer; // New/small units
  const pmegpSubsidy = pmegpEligible ? Math.min(profile.new_machinery_investment * 0.25, 2500000) : 0;
  optimizations.push({
    id: 'govt_pmegp',
    category: 'govt_scheme',
    section: 'PMEGP',
    title: 'Prime Minister Employment Generation Programme',
    short_description: 'Up to 25% margin money subsidy on project cost for new manufacturing/service enterprises.',
    detailed_explanation: 'PMEGP provides margin money (subsidy) of 15% to 35% of project cost for setting up new micro-enterprises in manufacturing (up to ₹50 Lakhs) and services (up to ₹20 Lakhs). General category gets 15-25%, Special category (SC/ST/Women/Ex-servicemen/NE) gets 25-35%.',
    legal_reference: 'Prime Minister\'s Employment Generation Programme — Ministry of MSME, implemented through KVIC, KVIB, and DIC.',
    eligibility_criteria: [
      'New manufacturing or service enterprise',
      'Project cost up to ₹50 Lakhs (manufacturing) or ₹20 Lakhs (services)',
      'No income ceiling for general category'
    ],
    is_eligible: pmegpEligible,
    status: pmegpEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: pmegpEligible ? 'medium' : 'low',
    estimated_savings: pmegpSubsidy,
    savings_calculation: pmegpEligible
      ? `Project Investment: ₹${profile.new_machinery_investment.toLocaleString('en-IN')}\nMargin Money Subsidy (25%): ₹${pmegpSubsidy.toLocaleString('en-IN')}`
      : 'Not eligible for PMEGP.',
    action_items: [
      { id: 'pmegp_1', label: 'Apply on kviconline.gov.in', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Project Report', 'Aadhar Card', 'Bank Account Details', 'EDP Training Certificate'],
    deadline: 'Open throughout the year',
    fy_applicable: fy,
    tags: ['MSME', 'New Enterprise', 'Margin Money'],
    icon_name: 'Briefcase',
    color_accent: 'cyan'
  });

  // ─── 6. Interest Subvention for MSMEs ─────────────────────────────────────
  const intSubEligible = isMsme;
  const intSubSavings = intSubEligible ? 200000 : 0; // Max 2% on ₹1 Cr
  optimizations.push({
    id: 'govt_interest_sub',
    category: 'govt_scheme',
    section: 'MSME Interest Subvention',
    title: '2% Interest Subvention on MSME Loans',
    short_description: '2% relief in interest rates on incremental or fresh term loans/working capital up to ₹1 Crore.',
    detailed_explanation: 'Under the Interest Subvention Scheme for MSMEs, eligible enterprises can claim 2% interest subvention on outstanding/incremental term loans or working capital from scheduled commercial banks. Maximum eligible loan amount is ₹1 Crore. The 2% interest relief is credited directly to the borrower\'s loan account through the lending bank.',
    legal_reference: 'Interest Subvention Scheme for MSMEs — RBI/SIDBI, as notified by Ministry of MSME. Extended multiple times, last extended for FY 2023-24 and beyond.',
    eligibility_criteria: [
      'Valid Udyam Registration',
      'Valid GSTN',
      'Standard loan account (not NPA)',
      'Loan from scheduled commercial bank'
    ],
    is_eligible: intSubEligible,
    status: intSubEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: intSubEligible ? 'medium' : 'low',
    estimated_savings: intSubSavings,
    savings_calculation: intSubEligible
      ? `Maximum Eligible Loan: ₹1,00,00,000\nInterest Subvention Rate: 2% per annum\nMaximum Annual Savings: ₹${intSubSavings.toLocaleString('en-IN')}`
      : 'Not an MSME.',
    action_items: [
      { id: 'int_sub_1', label: 'Submit claim through lending bank', type: 'apply_scheme', completed: false },
      { id: 'int_sub_2', label: 'Ensure Udyam and GSTN are linked', type: 'calculate', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'GST Registration', 'Bank Loan Statement', 'CA Certificate of outstanding loan'],
    deadline: 'Half-yearly submission',
    fy_applicable: fy,
    tags: ['MSME', 'Finance', 'Interest'],
    icon_name: 'Banknote',
    color_accent: 'green'
  });

  // ─── 7. State Capital Investment Subsidy (15-25%) ─────────────────────────
  const stateCapSubEligible = isManufacturer && profile.new_machinery_investment > 0;
  const stateCapSubsidy = stateCapSubEligible ? Math.min(profile.new_machinery_investment * 0.20, 5000000) : 0;
  optimizations.push({
    id: 'govt_state_capital',
    category: 'state_subsidy',
    section: 'State Industrial Policy',
    title: 'State Capital Investment Subsidy (15-25%)',
    short_description: '15% to 25% Capital Subsidy on Plant & Machinery from State Industrial Development Policy.',
    detailed_explanation: `Most Indian states offer Capital Investment Subsidies under their Industrial Policy (e.g., Maharashtra\'s Mega/Ultra Mega project incentives, Gujarat Industrial Policy 2020-25, Karnataka Industrial Policy 2020-25, Tamil Nadu Combined Incentive Scheme). Manufacturing units investing in designated industrial zones can claim 15-25% of eligible fixed capital investment as subsidy. Rates vary by state, location (backward/non-backward), and investment quantum.`,
    legal_reference: `State Industrial Policy — ${profile.state} (refer to respective State\'s Industrial Development Corporation website for current policy document and incentive schedules).`,
    eligibility_criteria: [
      'Manufacturing unit',
      `Located in ${profile.state} (or proposing to set up)`,
      'Investment in Plant & Machinery in designated industrial area',
      'Commencement of commercial production within stipulated time'
    ],
    is_eligible: stateCapSubEligible,
    status: stateCapSubEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: stateCapSubEligible ? 'high' : 'low',
    estimated_savings: stateCapSubsidy,
    savings_calculation: stateCapSubEligible
      ? `Machinery Investment: ₹${profile.new_machinery_investment.toLocaleString('en-IN')}\nEstimated Subsidy Rate: ~20%\nSubsidy (capped ₹50L): ₹${stateCapSubsidy.toLocaleString('en-IN')}`
      : 'No machinery investment or not a manufacturer.',
    action_items: [
      { id: 'state_cap_1', label: `Check ${profile.state} Industrial Policy incentives`, type: 'apply_scheme', completed: false },
      { id: 'state_cap_2', label: 'Apply through State DIC/SIDC portal', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Machinery Invoices', 'Commencement Certificate', 'DPR', 'Land/Factory Lease Document'],
    deadline: 'Within 1-2 years of commencement (varies by state)',
    fy_applicable: fy,
    tags: ['State Policy', 'Capital Subsidy', 'Manufacturing'],
    icon_name: 'Building2',
    color_accent: 'amber'
  });

  // ─── 8. State Electricity Duty Exemption ──────────────────────────────────
  const elecDutyEligible = isManufacturer;
  const elecDutySavings = elecDutyEligible ? Math.round(profile.total_expenses * 0.015) : 0; // ~1.5% of expenses
  optimizations.push({
    id: 'govt_state_elec',
    category: 'state_subsidy',
    section: 'State Electricity Duty Exemption',
    title: '100% Electricity Duty Exemption (5-10 Years)',
    short_description: 'Full exemption from State Electricity Duty for 5 to 10 years for new manufacturing units.',
    detailed_explanation: 'Most state industrial policies exempt new manufacturing units from paying state electricity duty (typically 2-6% of electricity bill) for a period of 5 to 10 years from the date of commencement of commercial production. This directly reduces operating costs.',
    legal_reference: `${profile.state} Electricity Duty Act / State Industrial Policy — Exemption from electricity duty for new industrial units.`,
    eligibility_criteria: [
      'New manufacturing unit',
      'Commercial production commenced',
      'Located in eligible industrial zone'
    ],
    is_eligible: elecDutyEligible,
    status: elecDutyEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: elecDutyEligible ? 'medium' : 'low',
    estimated_savings: elecDutySavings,
    savings_calculation: elecDutyEligible
      ? `Estimated Annual Electricity Bill Duty: ~1.5% of operating expenses\nAnnual Savings: ₹${elecDutySavings.toLocaleString('en-IN')}`
      : 'Not a manufacturer.',
    action_items: [
      { id: 'elec_1', label: 'Apply to State Electricity Board for duty exemption', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Factory Registration', 'Electricity Connection Details', 'Commencement Certificate'],
    deadline: 'Within 6 months of commencement',
    fy_applicable: fy,
    tags: ['State Policy', 'Electricity', 'Operating Cost'],
    icon_name: 'Zap',
    color_accent: 'yellow'
  });

  // ─── 9. State Stamp Duty Refund ───────────────────────────────────────────
  optimizations.push({
    id: 'govt_state_stamp',
    category: 'state_subsidy',
    section: 'State Stamp Duty Refund',
    title: '100% Stamp Duty & Registration Fee Reimbursement',
    short_description: 'Full reimbursement of stamp duty and registration fees paid on industrial land/factory purchase.',
    detailed_explanation: 'Several states reimburse 100% of stamp duty and registration charges paid for purchase or lease of land/factory premises for industrial purposes. This is a one-time benefit that can result in significant savings on real estate transactions for setting up manufacturing or service operations.',
    legal_reference: `${profile.state} Industrial Policy — Stamp Duty Reimbursement/Exemption for industrial enterprises.`,
    eligibility_criteria: [
      'Land/factory purchased for industrial use',
      'In designated industrial areas',
      'Applied within stipulated period after registration'
    ],
    is_eligible: isManufacturer,
    status: isManufacturer ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: 'medium',
    estimated_savings: isManufacturer ? 300000 : 0, // Estimated average
    savings_calculation: isManufacturer
      ? 'Stamp duty rates vary 5-8% across states.\nEstimated one-time savings: ₹3,00,000 (varies with property value).'
      : 'Not applicable.',
    action_items: [
      { id: 'stamp_1', label: 'Submit reimbursement application to DIC', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Registered Sale Deed', 'Stamp Duty Receipt', 'Factory Plan Approval'],
    deadline: 'Within 1 year of registration (varies by state)',
    fy_applicable: fy,
    tags: ['State Policy', 'Real Estate', 'One-Time'],
    icon_name: 'FileText',
    color_accent: 'slate'
  });

  // ─── 10. State SGST Reimbursement ─────────────────────────────────────────
  const sgstReimbEligible = isManufacturer && profile.total_gst_output > 0;
  const sgstReimbursement = sgstReimbEligible ? profile.total_gst_output * 0.25 : 0; // 50% SGST * 50% reimbursement
  optimizations.push({
    id: 'govt_state_sgst',
    category: 'state_subsidy',
    section: 'State SGST Reimbursement',
    title: 'SGST Reimbursement (50-100% for 5-7 Years)',
    short_description: 'Some states reimburse 50-100% of SGST collected by new industrial units for 5-7 years.',
    detailed_explanation: 'Select states (e.g., AP, Telangana, Gujarat, UP) reimburse a portion (50-100%) of the SGST deposited by new industrial units into the state treasury for a period of 5-7 years from commencement. This is essentially a tax cashback incentive to attract industrial investment.',
    legal_reference: `${profile.state} Industrial Investment Promotion Policy — SGST Reimbursement/Incentive scheme for new industrial units.`,
    eligibility_criteria: [
      'New industrial/manufacturing unit',
      'Commenced production within policy period',
      'SGST regularly deposited'
    ],
    is_eligible: sgstReimbEligible,
    status: sgstReimbEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: sgstReimbEligible ? 'high' : 'low',
    estimated_savings: sgstReimbursement,
    savings_calculation: sgstReimbEligible
      ? `Total GST Output: ₹${profile.total_gst_output.toLocaleString('en-IN')}\nSGST Portion (~50%): ₹${(profile.total_gst_output * 0.5).toLocaleString('en-IN')}\nEstimated Reimbursement (~50%): ₹${sgstReimbursement.toLocaleString('en-IN')}`
      : 'Not eligible.',
    action_items: [
      { id: 'sgst_1', label: `Check ${profile.state} SGST reimbursement policy`, type: 'apply_scheme', completed: false },
      { id: 'sgst_2', label: 'Submit quarterly reimbursement claim', type: 'generate_form', completed: false }
    ],
    documents_required: ['GSTR-3B Returns', 'SGST Payment Challans', 'Commencement Certificate'],
    deadline: 'Quarterly/Half-yearly as per state policy',
    fy_applicable: fy,
    tags: ['State Policy', 'SGST', 'Tax Cashback'],
    icon_name: 'HandCoins',
    color_accent: 'emerald'
  });

  // ─── 11. Technology Upgradation Fund (TUFS) ───────────────────────────────
  const isTextile = profile.industry?.toLowerCase().includes('textile') || profile.industry?.toLowerCase().includes('garment');
  optimizations.push({
    id: 'govt_tufs',
    category: 'govt_scheme',
    section: 'ATUFS (Amended TUFS)',
    title: 'Technology Upgradation Fund for Textiles',
    short_description: '5% interest reimbursement and 10-15% capital subsidy for textile and apparel industry upgradation.',
    detailed_explanation: 'Amended Technology Upgradation Fund Scheme (ATUFS) provides one-time capital subsidy of 15% for garmenting/made-ups and 10% for other textile segments on eligible machinery purchased from approved list. Additionally, 5% interest reimbursement on term loans is available.',
    legal_reference: 'Amended Technology Upgradation Fund Scheme (ATUFS) — Ministry of Textiles, Government of India.',
    eligibility_criteria: [
      'Textile/Apparel/Jute/Silk manufacturing unit',
      'Investment in eligible machinery',
      'Bank loan availed'
    ],
    is_eligible: !!isTextile,
    status: isTextile ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: isTextile ? 'high' : 'low',
    estimated_savings: isTextile ? profile.new_machinery_investment * 0.15 : 0,
    savings_calculation: isTextile
      ? `Machinery Investment: ₹${profile.new_machinery_investment.toLocaleString('en-IN')}\nCapital Subsidy (15%): ₹${(profile.new_machinery_investment * 0.15).toLocaleString('en-IN')}`
      : 'Not in textile/apparel sector.',
    action_items: [
      { id: 'tufs_1', label: 'Register on ATUFS portal (txcindia.gov.in)', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['UID from ATUFS Portal', 'Machinery Invoices (from approved list)', 'Bank Loan Details'],
    deadline: 'Before installation of machinery',
    fy_applicable: fy,
    tags: ['Textiles', 'Capital Subsidy', 'Technology'],
    icon_name: 'Leaf',
    color_accent: 'indigo'
  });

  // ─── 12. Patent/Trademark Subsidy for MSMEs ──────────────────────────────
  const ipSubsidyEligible = isMsme;
  optimizations.push({
    id: 'govt_ip_subsidy',
    category: 'govt_scheme',
    section: 'MSME IP Facilitation',
    title: 'Patent & Trademark Registration Subsidy (50% Reimbursement)',
    short_description: 'Up to 50% reimbursement on patent filing, trademark registration, and GI registration costs for MSMEs.',
    detailed_explanation: 'Under the MSME Intellectual Property (IP) Facilitation Scheme, MSMEs can claim: (a) Reimbursement of patent filing fees — up to ₹5 Lakhs for domestic patents and ₹25 Lakhs for foreign patents, (b) Reimbursement of 50% of trademark registration cost, (c) 50% reimbursement for GI (Geographical Indication) registration. This encourages MSMEs to protect their innovations and brands.',
    legal_reference: 'MSME Scheme for Facilitating Intellectual Property (IP) Rights — Ministry of MSME, Government of India.',
    eligibility_criteria: [
      'Valid Udyam Registration',
      'Filed or intending to file patent/trademark/GI',
      'Not previously availed IP subsidy for same application'
    ],
    is_eligible: ipSubsidyEligible,
    status: ipSubsidyEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: ipSubsidyEligible ? 'low' : 'low',
    estimated_savings: ipSubsidyEligible ? 250000 : 0,
    savings_calculation: ipSubsidyEligible
      ? 'Domestic Patent Filing: ~₹50,000 (50% reimbursed = ₹25,000)\nForeign Patent: Up to ₹25,00,000 subsidy\nTrademark: ~₹10,000 (50% reimbursed)\nEstimated Total: ₹2,50,000'
      : 'Not an MSME.',
    action_items: [
      { id: 'ip_1', label: 'Identify patentable innovations/trademarks', type: 'calculate', completed: false },
      { id: 'ip_2', label: 'Apply through MSME IP Facilitation Centre', type: 'apply_scheme', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'Patent/TM Application Receipt', 'Fee Payment Receipts'],
    deadline: 'Within 1 year of filing',
    fy_applicable: fy,
    tags: ['MSME', 'IP', 'Patent', 'Trademark'],
    icon_name: 'Star',
    color_accent: 'purple'
  });


  // ══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL CENTRAL GOVERNMENT SCHEMES
  // ══════════════════════════════════════════════════════════════════════════

  // ─── 13. CGTMSE Credit Guarantee ──────────────────────────────────────────
  const cgtmseEligible = isMsme;
  const cgtmseSavings = cgtmseEligible ? profile.annual_turnover * 0.02 : 0;
  optimizations.push({
    id: 'govt_cgtmse',
    category: 'govt_scheme',
    section: 'CGTMSE Scheme',
    title: 'CGTMSE Credit Guarantee — 85% Loan Guarantee for MSMEs',
    short_description: 'Get up to 85% government guarantee on collateral-free loans up to ₹5 Crore.',
    detailed_explanation: 'The Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE) provides guarantee cover to banks lending to MSMEs without collateral security. Guarantee coverage is 85% for micro enterprises and 75% for small enterprises. This dramatically reduces the cost of credit and enables MSMEs to access formal banking without pledging assets.',
    legal_reference: 'CGTMSE Trust Deed — Ministry of MSME & SIDBI',
    eligibility_criteria: ['Micro or Small Enterprise (Udyam registered)', 'New or existing loan up to ₹5 Crore', 'Account not NPA', 'Business for manufacturing or service'],
    is_eligible: cgtmseEligible,
    status: cgtmseEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: cgtmseEligible ? 'high' : 'low',
    estimated_savings: cgtmseSavings,
    savings_calculation: cgtmseEligible ? `2% lower interest on credit = ₹${cgtmseSavings.toFixed(2)} annual savings` : 'N/A',
    action_items: [
      { id: 'cgtmse_1', label: 'Apply to bank for CGTMSE-backed loan', type: 'compliance', completed: false },
      { id: 'cgtmse_2', label: 'Obtain Udyam Registration if not done', type: 'documentation', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'Bank Application', 'Balance Sheet', 'Project Report'],
    deadline: 'Anytime',
    fy_applicable: fy,
    tags: ['Credit', 'Loan', 'MSME', 'Guarantee'],
    icon_name: 'Shield',
    color_accent: 'blue'
  });

  // ─── 14. Startup India Seed Fund ──────────────────────────────────────────
  const seedFundEligible = !!profile.dipp_registered && profile.annual_turnover < 10000000;
  optimizations.push({
    id: 'govt_seed_fund',
    category: 'govt_scheme',
    section: 'Startup India Seed Fund',
    title: 'Startup India Seed Fund — Up to ₹50L Grant',
    short_description: 'DPIIT-recognized startups can get up to ₹50 Lakh grant for product development and early traction.',
    detailed_explanation: 'The Startup India Seed Fund Scheme (SISFS) provides financial assistance to eligible startups for proof of concept, prototype development, product trials, market-entry, and commercialization. Grants up to ₹20L for validation and ₹50L for market entry are available through DPIIT-recognized incubators.',
    legal_reference: 'Startup India Seed Fund Scheme — DPIIT, Ministry of Commerce',
    eligibility_criteria: ['DPIIT-recognized startup', 'Incorporated less than 2 years before application', 'Annual turnover < ₹1 Crore', 'Not received funding from VC/Angel > ₹10L'],
    is_eligible: seedFundEligible,
    status: seedFundEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: seedFundEligible ? 'critical' : 'low',
    estimated_savings: seedFundEligible ? 5000000 : 0,
    savings_calculation: seedFundEligible ? 'Up to ₹50,00,000 non-repayable grant' : 'N/A',
    action_items: [
      { id: 'seed_1', label: 'Apply via DPIIT startup portal to registered incubator', type: 'compliance', completed: false },
      { id: 'seed_2', label: 'Prepare business plan and utilization schedule', type: 'documentation', completed: false }
    ],
    documents_required: ['DPIIT Recognition Certificate', 'Business Plan', 'Incorporation Certificate', 'Financial Projections'],
    deadline: 'Rolling applications',
    fy_applicable: fy,
    tags: ['Startup', 'Grant', 'DPIIT', 'Seed Funding'],
    icon_name: 'Rocket',
    color_accent: 'violet'
  });

  // ─── 15. PLI for Food Processing ──────────────────────────────────────────
  const pliFood = profile.industry.toLowerCase().includes('food') || profile.industry.toLowerCase().includes('beverage') || profile.industry.toLowerCase().includes('agro');
  const pliFoodSavings = pliFood && isManufacturer ? profile.total_revenue * 0.10 : 0;
  optimizations.push({
    id: 'govt_pli_food',
    category: 'govt_scheme',
    section: 'PLI Scheme \u2014 Food Processing',
    title: 'PLI \u2014 Food Processing 10% Production Incentive',
    short_description: '10% production-linked incentive on incremental sales for food processing manufacturers.',
    detailed_explanation: 'The Production Linked Incentive (PLI) scheme for Food Processing offers 10% incentive on incremental sales above the base year for approved food product categories including ready-to-eat, mozzarella cheese, processed fruits/vegetables, marine products, and innovative/organic products.',
    legal_reference: 'PLI Scheme for Food Processing Industries \u2014 Ministry of Food Processing Industries',
    eligibility_criteria: ['Manufacturer of approved food products', 'Minimum committed investment fulfilled', 'Registered under PLI scheme', 'Incremental sales above base year'],
    is_eligible: pliFood && isManufacturer,
    status: (pliFood && isManufacturer) ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: (pliFood && isManufacturer) ? 'critical' : 'low',
    estimated_savings: pliFoodSavings,
    savings_calculation: (pliFood && isManufacturer) ? `10% of revenue ₹${profile.total_revenue} = ₹${pliFoodSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'pli_food_1', label: 'Apply for PLI scheme registration via MoFPI portal', type: 'compliance', completed: false },
      { id: 'pli_food_2', label: 'Submit annual performance report', type: 'filing', completed: false }
    ],
    documents_required: ['PLI Registration', 'Audited Revenue Statements', 'Base Year Sales Proof'],
    deadline: 'Scheme window \u2014 check MoFPI portal',
    fy_applicable: fy,
    tags: ['PLI', 'Food Processing', 'Manufacturing', 'Incentive'],
    icon_name: 'Package',
    color_accent: 'amber'
  });

  // ─── 16. PLI for Textiles ────────────────────────────────────────────────
  const pliTextile = profile.industry.toLowerCase().includes('textile') || profile.industry.toLowerCase().includes('garment') || profile.industry.toLowerCase().includes('apparel');
  const pliTextileSavings = pliTextile && isManufacturer ? profile.total_revenue * 0.15 : 0;
  optimizations.push({
    id: 'govt_pli_textile',
    category: 'govt_scheme',
    section: 'PLI Scheme \u2014 Textiles',
    title: 'PLI \u2014 Textiles 15% Production Incentive',
    short_description: '15% PLI incentive for MMF (Man-Made Fibre) fabric, garments and technical textile manufacturers.',
    detailed_explanation: 'The PLI scheme for textiles provides 15% incentive for MMF fabrics and garments on incremental turnover, and 11% for technical textiles. It targets high-value technical textiles and man-made fibre segments to boost India\'s competitiveness in global textile exports.',
    legal_reference: 'PLI Scheme for Textiles \u2014 Ministry of Textiles, Notification S.O. 3778(E)',
    eligibility_criteria: ['Manufacturer of MMF fabrics/garments/technical textiles', 'Minimum investment threshold met', 'Registered under PLI scheme', 'Incremental production over base year'],
    is_eligible: pliTextile && isManufacturer,
    status: (pliTextile && isManufacturer) ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: (pliTextile && isManufacturer) ? 'critical' : 'low',
    estimated_savings: pliTextileSavings,
    savings_calculation: (pliTextile && isManufacturer) ? `15% of revenue ₹${profile.total_revenue} = ₹${pliTextileSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'pli_textile_1', label: 'Register under Textiles PLI on ministry portal', type: 'compliance', completed: false }
    ],
    documents_required: ['Ministry Registration', 'Factory License', 'Production Records'],
    deadline: 'Scheme window \u2014 check Ministry of Textiles',
    fy_applicable: fy,
    tags: ['PLI', 'Textile', 'Garment', 'Manufacturing'],
    icon_name: 'Layers',
    color_accent: 'blue'
  });

  // ─── 17. NEIA Export Insurance ────────────────────────────────────────────
  const neiaEligible = isExporter && profile.total_exports > 5000000;
  const neiaSavings = neiaEligible ? profile.total_exports * 0.005 : 0;
  optimizations.push({
    id: 'govt_neia',
    category: 'govt_scheme',
    section: 'NEIA Scheme',
    title: 'National Export Insurance Account \u2014 Export Credit Cover',
    short_description: 'Government-backed export credit insurance at subsidized premiums for project exports.',
    detailed_explanation: 'The National Export Insurance Account (NEIA) provides export credit insurance support for eligible project exports and long-term export contracts that are considered commercially non-insurable. Premium subsidies of up to 50% reduce the cost of export risk cover, enabling more competitive bidding on international projects.',
    legal_reference: 'NEIA Trust Deed \u2014 Ministry of Commerce & Export Credit Guarantee Corporation',
    eligibility_criteria: ['Exporter with exports > ₹50 Lakhs', 'Project/goods export with payment risk', 'ECGC registered exporter', 'Export contracts with deferred payment'],
    is_eligible: neiaEligible,
    status: neiaEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: neiaEligible ? 'high' : 'low',
    estimated_savings: neiaSavings,
    savings_calculation: neiaEligible ? `0.5% subsidy on export value ₹${profile.total_exports} = ₹${neiaSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'neia_1', label: 'Register with ECGC for export credit cover', type: 'compliance', completed: false },
      { id: 'neia_2', label: 'Apply for NEIA cover on specific export contracts', type: 'filing', completed: false }
    ],
    documents_required: ['ECGC Registration', 'Export Contracts', 'Foreign Buyer Details'],
    deadline: 'Before export shipment',
    fy_applicable: fy,
    tags: ['Export', 'Insurance', 'Credit', 'ECGC'],
    icon_name: 'Globe',
    color_accent: 'blue'
  });

  // ─── 18. MSME Samadhaan Portal ────────────────────────────────────────────
  const samadhaanEligible = profile.msme_overdue_payables > 0;
  const samadhaanSavings = samadhaanEligible ? profile.msme_overdue_payables * 0.18 : 0;
  optimizations.push({
    id: 'govt_samadhaan',
    category: 'govt_scheme',
    section: 'MSME Samadhaan \u2014 MSEFC',
    title: 'MSME Samadhaan \u2014 Recover Delayed Payments + 18% Interest',
    short_description: 'File online application to recover overdue MSME payments at 3x bank rate (approx. 18%) interest.',
    detailed_explanation: 'Under the MSMED Act 2006, Micro and Small Enterprises can file applications on the MSME Samadhaan portal to recover delayed payments from buyers. The Micro and Small Enterprises Facilitation Council (MSEFC) can award compound interest at 3 times the RBI bank rate on delayed payments, which is currently approximately 18% per annum.',
    legal_reference: 'Section 15-23 of MSMED Act, 2006 \u2014 MSME Samadhaan Portal',
    eligibility_criteria: ['Registered Micro or Small Enterprise (Udyam)', 'Payment overdue beyond agreed terms (max 45 days)', 'Buyer is any entity including Govt/PSU/private'],
    is_eligible: samadhaanEligible,
    status: samadhaanEligible ? 'action_required' : 'not_eligible',
    risk_level: 'safe',
    priority: samadhaanEligible ? 'critical' : 'low',
    estimated_savings: samadhaanSavings,
    savings_calculation: samadhaanEligible ? `18% compound interest recovery on overdue ₹${profile.msme_overdue_payables} = ₹${samadhaanSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'sam_1', label: 'File application on samadhaan.msme.gov.in', type: 'compliance', completed: false },
      { id: 'sam_2', label: 'Send legal notice to defaulting buyers', type: 'documentation', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'Purchase Orders/Contracts', 'Invoices', 'Bank Statements showing non-payment'],
    deadline: '3 years from due date',
    fy_applicable: fy,
    tags: ['MSME', 'Payment Recovery', 'Legal', 'Interest'],
    icon_name: 'Scale',
    color_accent: 'orange'
  });

  // ─── 19. Design Clinic Scheme ─────────────────────────────────────────────
  const designClinicEligible = isManufacturer && isMsme;
  const designClinicSavings = designClinicEligible ? Math.min(profile.total_expenses * 0.01 * 0.75, 4000000) : 0;
  optimizations.push({
    id: 'govt_design_clinic',
    category: 'govt_scheme',
    section: 'Design Clinic Scheme',
    title: 'Design Clinic Scheme \u2014 75% Subsidy on Design Consultation',
    short_description: 'Get 75% subsidy (up to ₹40 Lakh) on professional design consultation for MSME manufacturers.',
    detailed_explanation: 'The Design Clinic Scheme by the Ministry of MSME provides financial assistance to MSME manufacturers to engage design professionals to improve product design, packaging, and manufacturing processes. Individual enterprises get 75% subsidy on design project costs up to ₹40 lakhs total project cost, and ₹9 lakhs per design intervention.',
    legal_reference: 'Design Clinic Scheme \u2014 Ministry of MSME, National Design Policy 2007',
    eligibility_criteria: ['MSME manufacturer (Udyam registered)', 'Design project for product improvement or new product', 'Design consultant from approved list', 'Min project cost ₹40,000'],
    is_eligible: designClinicEligible,
    status: designClinicEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: designClinicEligible ? 'medium' : 'low',
    estimated_savings: designClinicSavings,
    savings_calculation: designClinicEligible ? `75% of design consultation costs (max ₹40L) = ₹${designClinicSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'dc_1', label: 'Apply on National Design Centre portal', type: 'compliance', completed: false },
      { id: 'dc_2', label: 'Select approved design consultant', type: 'verification', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'Design Project Proposal', 'Design Consultant Agreement'],
    deadline: 'Rolling applications',
    fy_applicable: fy,
    tags: ['Design', 'Subsidy', 'MSME', 'Innovation'],
    icon_name: 'Palette',
    color_accent: 'purple'
  });

  // ─── 20. GeM Portal Procurement Preference ────────────────────────────────
  const gemEligible = isMsme;
  const gemSavings = gemEligible ? profile.total_revenue * 0.10 : 0;
  optimizations.push({
    id: 'govt_gem',
    category: 'govt_scheme',
    section: 'GeM \u2014 Public Procurement Policy',
    title: 'GeM Portal \u2014 25% Govt Procurement Preference for MSMEs',
    short_description: 'Get mandatory 25% share of all government procurement orders through GeM portal as an MSME.',
    detailed_explanation: 'The Government e-Marketplace (GeM) and the Public Procurement Policy mandate that Central Ministries and PSUs must procure a minimum of 25% of their annual purchases from MSMEs. Of this, 4% is reserved for SC/ST-owned MSMEs. Registering on GeM opens a direct channel to ₹2+ lakh crore annual government procurement without going through tender processes.',
    legal_reference: 'Public Procurement Policy for Micro and Small Enterprises Order 2012 \u2014 Ministry of MSME',
    eligibility_criteria: ['Udyam registered MSME', 'Products/services required by Govt depts', 'GeM seller registration completed', 'Products compliant with BIS/quality standards'],
    is_eligible: gemEligible,
    status: gemEligible ? 'eligible' : 'not_eligible',
    risk_level: 'safe',
    priority: gemEligible ? 'high' : 'low',
    estimated_savings: gemSavings,
    savings_calculation: gemEligible ? `10% potential revenue growth from govt orders = ₹${gemSavings.toFixed(2)}` : 'N/A',
    action_items: [
      { id: 'gem_1', label: 'Register as seller on gem.gov.in', type: 'compliance', completed: false },
      { id: 'gem_2', label: 'List all products/services on GeM catalogue', type: 'documentation', completed: false }
    ],
    documents_required: ['Udyam Certificate', 'GST Registration', 'Bank Account Details', 'Product Catalogue'],
    deadline: 'Anytime \u2014 ongoing registration',
    fy_applicable: fy,
    tags: ['GeM', 'Govt Procurement', 'MSME', 'Sales'],
    icon_name: 'ShoppingCart',
    color_accent: 'emerald'
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STATE-SPECIFIC SCHEMES
  // ══════════════════════════════════════════════════════════════════════════

  const stateL = profile.state.toLowerCase();

  // ─── MAHARASHTRA ──────────────────────────────────────────────────────────
  if (stateL.includes('maharashtra') || stateL === 'mh') {
    // Maharashtra PSI 2019 — Power Tariff Subsidy
    const mhPowerEligible = isManufacturer;
    const mhPowerSavings = mhPowerEligible ? profile.total_revenue * 0.015 : 0;
    optimizations.push({
      id: 'state_mh_power',
      category: 'state_subsidy',
      section: 'Maharashtra PSI 2019',
      title: 'Maharashtra PSI \u2014 ₹1–3/Unit Electricity Tariff Subsidy (7 Years)',
      short_description: 'Get ₹1–3 per unit electricity subsidy for 7 years under Maharashtra Package Scheme of Incentives 2019.',
      detailed_explanation: 'Under the Maharashtra Package Scheme of Incentives (PSI) 2019, new manufacturing units in notified areas get electricity tariff subsidy of ₹1–3 per unit consumed for 7 years. This significantly reduces operating costs for energy-intensive manufacturers.',
      legal_reference: 'Maharashtra Package Scheme of Incentives 2019 \u2014 Industries, Energy & Labour Dept, GoM',
      eligibility_criteria: ['New manufacturing unit in Maharashtra', 'Located in notified PSI zone', 'Commenced commercial production post-notification', 'Eligible investment thresholds met'],
      is_eligible: mhPowerEligible,
      status: mhPowerEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: mhPowerEligible ? 'high' : 'low',
      estimated_savings: mhPowerSavings,
      savings_calculation: mhPowerEligible ? `~1.5% of revenue as power cost reduction = ₹${mhPowerSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'mh_pow_1', label: 'Apply to MIDC / District Industries Centre for PSI eligibility', type: 'compliance', completed: false },
        { id: 'mh_pow_2', label: 'Obtain PSI Eligibility Certificate', type: 'documentation', completed: false }
      ],
      documents_required: ['Udyam Certificate', 'Investment Details', 'Power Bill', 'MIDC Plot Documents'],
      deadline: 'Within 1 year of commencement',
      fy_applicable: fy,
      tags: ['Maharashtra', 'Electricity', 'PSI', 'Subsidy'],
      icon_name: 'Zap',
      color_accent: 'amber'
    });

    // Maharashtra SGST Reimbursement
    const mhSgstEligible = isManufacturer && profile.total_gst_output > 0;
    const mhSgstSavings = mhSgstEligible ? profile.total_gst_output * 0.5 : 0;
    optimizations.push({
      id: 'state_mh_sgst',
      category: 'state_subsidy',
      section: 'Maharashtra PSI 2019 \u2014 SGST',
      title: 'Maharashtra 100% SGST Reimbursement (5–7 Years)',
      short_description: 'Get 100% of SGST paid reimbursed by Maharashtra government for eligible manufacturing units.',
      detailed_explanation: 'New manufacturing units under PSI 2019 in Maharashtra get 100% reimbursement of net SGST (State GST) paid for 5–7 years (depending on zone) up to 100% of eligible fixed capital investment. This is actual cash-back from the government treasury and one of the most valuable industrial incentives in India.',
      legal_reference: 'Maharashtra PSI 2019 \u2014 Annexure A, SGST Reimbursement Clause',
      eligibility_criteria: ['New manufacturing unit under PSI 2019', 'SGST registration in Maharashtra', 'Fixed capital investment within eligible limits', 'Unit not availing CST/VAT refund for same period'],
      is_eligible: mhSgstEligible,
      status: mhSgstEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: mhSgstEligible ? 'critical' : 'low',
      estimated_savings: mhSgstSavings,
      savings_calculation: mhSgstEligible ? `50–100% of SGST paid ₹${profile.total_gst_output} = ₹${mhSgstSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'mh_sgst_1', label: 'File SGST reimbursement claim with DIC', type: 'filing', completed: false },
        { id: 'mh_sgst_2', label: 'Maintain GSTR-3B returns as proof', type: 'documentation', completed: false }
      ],
      documents_required: ['PSI Eligibility Certificate', 'GSTR-3B Returns', 'Audited Balance Sheet'],
      deadline: 'Annually \u2014 before 31st March',
      fy_applicable: fy,
      tags: ['Maharashtra', 'SGST', 'Reimbursement', 'Manufacturing'],
      icon_name: 'IndianRupee',
      color_accent: 'emerald'
    });
  }

  // ─── GUJARAT ──────────────────────────────────────────────────────────────
  if (stateL.includes('gujarat') || stateL === 'gj') {
    const gjCapEligible = isManufacturer && profile.new_machinery_investment > 0;
    const gjCapSavings = gjCapEligible ? profile.new_machinery_investment * 0.25 : 0;
    optimizations.push({
      id: 'state_gj_cap',
      category: 'state_subsidy',
      section: 'GIIP 2022 \u2014 Capital Subsidy',
      title: 'Gujarat GIIP 2022 \u2014 25–35% Capital Investment Subsidy',
      short_description: 'Get 25–35% capital subsidy (max ₹50 Crore for small units) under Gujarat Industrial Investment Policy 2022.',
      detailed_explanation: 'The Gujarat Industrial Investment Policy (GIIP) 2022 provides significant capital subsidies ranging from 25% (for existing industry) to 35% (for priority sectors like renewable energy, defense, EV) on eligible fixed capital investment. Micro enterprises get up to ₹35 Crore and small enterprises up to ₹50 Crore in total subsidy.',
      legal_reference: 'Gujarat Industrial Investment Policy 2022 \u2014 Industries & Mines Dept, GoG',
      eligibility_criteria: ['Manufacturing unit in Gujarat', 'New investment or substantial expansion', 'COD within 5 years of sanction', 'Udyam registration completed'],
      is_eligible: gjCapEligible,
      status: gjCapEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: gjCapEligible ? 'critical' : 'low',
      estimated_savings: gjCapSavings,
      savings_calculation: gjCapEligible ? `25% of investment ₹${profile.new_machinery_investment} = ₹${gjCapSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'gj_cap_1', label: 'Apply to iNDEXTb / DIC for GIIP sanction', type: 'compliance', completed: false }
      ],
      documents_required: ['Project Report', 'Investment Details', 'Land Documents', 'Udyam Certificate'],
      deadline: 'Within 1 year of investment',
      fy_applicable: fy,
      tags: ['Gujarat', 'Capital Subsidy', 'GIIP', 'Manufacturing'],
      icon_name: 'Building2',
      color_accent: 'blue'
    });

    const gjEmpEligible = profile.new_employees_fy > 0;
    const gjEmpSavings = gjEmpEligible ? profile.new_employees_fy * 2000 * 12 : 0;
    optimizations.push({
      id: 'state_gj_emp',
      category: 'state_subsidy',
      section: 'GIIP 2022 \u2014 Employment Subsidy',
      title: 'Gujarat GIIP 2022 \u2014 ₹1,000–3,000/Employee/Month Subsidy',
      short_description: 'Get ₹1,000–3,000 per new employee per month for 5 years under GIIP 2022.',
      detailed_explanation: 'GIIP 2022 provides employment generation assistance of ₹1,000–3,000 per new employee per month for a period of 5 years for eligible manufacturing units in Gujarat. Higher assistance is provided for employing local Gujarati workers and workers from weaker sections.',
      legal_reference: 'GIIP 2022 — Employment Generation Assistance Clause',
      eligibility_criteria: ['Manufacturing unit in Gujarat under GIIP', 'New local employees on payroll', 'ESIC/EPFO compliance mandatory', 'Unit approved under GIIP'],
      is_eligible: gjEmpEligible,
      status: gjEmpEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: gjEmpEligible ? 'high' : 'low',
      estimated_savings: gjEmpSavings,
      savings_calculation: gjEmpEligible ? `${profile.new_employees_fy} employees × ₹2,000/month × 12 = ₹${gjEmpSavings.toFixed(2)}/yr` : 'N/A',
      action_items: [
        { id: 'gj_emp_1', label: 'Maintain employee joining records and ESIC registration', type: 'compliance', completed: false },
        { id: 'gj_emp_2', label: 'File annual employment claim with DIC Gujarat', type: 'filing', completed: false }
      ],
      documents_required: ['GIIP Approval', 'Employee Joining Register', 'EPFO/ESIC Challans', 'Salary Sheets'],
      deadline: 'Annual claim by 30th June',
      fy_applicable: fy,
      tags: ['Gujarat', 'Employment', 'GIIP', 'Subsidy'],
      icon_name: 'Users',
      color_accent: 'emerald'
    });
  }

  // ─── KARNATAKA ────────────────────────────────────────────────────────────
  if (stateL.includes('karnataka') || stateL === 'ka') {
    const kaCapEligible = isManufacturer && profile.new_machinery_investment > 0;
    const kaCapSavings = kaCapEligible ? profile.new_machinery_investment * 0.20 : 0;
    optimizations.push({
      id: 'state_ka_cap',
      category: 'state_subsidy',
      section: 'Karnataka Industrial Policy 2020-25',
      title: 'Karnataka New Industrial Policy \u2014 20–25% Capital Subsidy',
      short_description: '20–25% capital subsidy for new manufacturing units under Karnataka Industrial Policy 2020–25.',
      detailed_explanation: 'Karnataka\'s New Industrial Policy 2020–25 offers 20–25% capital subsidies for eligible new industrial units, with enhanced benefits in backward districts. MSME manufacturers get priority processing through Karnataka Udyog Mitra (KUM) single-window system and additional employment generation subsidies.',
      legal_reference: 'Karnataka New Industrial Policy 2020–25 \u2014 Dept of Industries & Commerce, GoK',
      eligibility_criteria: ['New manufacturing unit in Karnataka', 'Fixed capital investment within eligible limits', 'Employment generation minimum threshold', 'Commenced production after policy date'],
      is_eligible: kaCapEligible,
      status: kaCapEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: kaCapEligible ? 'high' : 'low',
      estimated_savings: kaCapSavings,
      savings_calculation: kaCapEligible ? `20% of investment ₹${profile.new_machinery_investment} = ₹${kaCapSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'ka_cap_1', label: 'Apply via Karnataka Udyog Mitra single-window portal', type: 'compliance', completed: false }
      ],
      documents_required: ['Project Report', 'Land Documents', 'CA Certificate on Investment', 'Udyam Certificate'],
      deadline: 'Within 2 years of commencement',
      fy_applicable: fy,
      tags: ['Karnataka', 'Capital Subsidy', 'Industrial Policy', 'Manufacturing'],
      icon_name: 'Building',
      color_accent: 'orange'
    });
  }

  // ─── TAMIL NADU ───────────────────────────────────────────────────────────
  if (stateL.includes('tamil') || stateL === 'tn') {
    const tnCapEligible = isManufacturer && profile.new_machinery_investment > 0;
    const tnCapSavings = tnCapEligible ? Math.min(profile.new_machinery_investment * 0.20, 5000000) : 0;
    optimizations.push({
      id: 'state_tn_cap',
      category: 'state_subsidy',
      section: 'TNIDB Policy 2021',
      title: 'Tamil Nadu Industrial Policy 2021 \u2014 20% Capital Subsidy',
      short_description: '20% capital subsidy (max ₹50L for small units) for new manufacturing investment in Tamil Nadu.',
      detailed_explanation: 'The Tamil Nadu Industrial Policy 2021 and New MSME Policy offer 20% capital subsidy on new plant and machinery (maximum ₹50 Lakhs for small enterprises) along with interest subvention and employment generation subsidies for manufacturing units established in Tamil Nadu.',
      legal_reference: 'Tamil Nadu New MSME Policy 2021 \u2014 Dept of Industries, GoTN',
      eligibility_criteria: ['New manufacturing unit in Tamil Nadu', 'MSME registration (Udyam)', 'New plant and machinery purchase', 'Employment threshold met'],
      is_eligible: tnCapEligible,
      status: tnCapEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: tnCapEligible ? 'high' : 'low',
      estimated_savings: tnCapSavings,
      savings_calculation: tnCapEligible ? `20% of investment (max ₹50L) = ₹${tnCapSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'tn_cap_1', label: 'Apply at MSME-DI (Tamil Nadu) or District Industries Centre', type: 'compliance', completed: false }
      ],
      documents_required: ['Udyam Certificate', 'Machinery Invoices', 'Project Report', 'Land/Lease Documents'],
      deadline: 'Within 3 years of investment',
      fy_applicable: fy,
      tags: ['Tamil Nadu', 'Capital Subsidy', 'MSME', 'Manufacturing'],
      icon_name: 'Factory',
      color_accent: 'red'
    });

    const tnEmpEligible = profile.new_employees_fy > 0;
    const tnEmpSavings = tnEmpEligible ? profile.new_employees_fy * 2000 * 36 : 0;
    optimizations.push({
      id: 'state_tn_emp',
      category: 'state_subsidy',
      section: 'TN Employment Subsidy',
      title: 'Tamil Nadu Employment Generation Subsidy \u2014 ₹2,000/Month (3 Years)',
      short_description: '₹2,000/month per new local employee for 3 years under Tamil Nadu employment generation scheme.',
      detailed_explanation: 'Tamil Nadu provides employment generation subsidy of ₹2,000 per month per new local employee (Tamil Nadu resident) for 3 years to eligible manufacturing units. Priority is given to women employees and persons with disabilities who get higher subsidy amounts.',
      legal_reference: 'TN New MSME Policy 2021 \u2014 Employment Subsidy Clause, TIDCO',
      eligibility_criteria: ['Manufacturing unit in Tamil Nadu', 'New Tamil Nadu resident employees', 'EPFO/ESIC registration', 'Minimum employment threshold'],
      is_eligible: tnEmpEligible,
      status: tnEmpEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: tnEmpEligible ? 'high' : 'low',
      estimated_savings: tnEmpSavings,
      savings_calculation: tnEmpEligible ? `${profile.new_employees_fy} employees × ₹2,000 × 36 months = ₹${tnEmpSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'tn_emp_1', label: 'Register with DIC Tamil Nadu for employment subsidy', type: 'compliance', completed: false },
        { id: 'tn_emp_2', label: 'Submit quarterly employee attendance and payroll', type: 'filing', completed: false }
      ],
      documents_required: ['Employee Joining Letters', 'Address Proof (TN)', 'EPFO Challan', 'Payroll Statements'],
      deadline: 'Quarterly claims for 3 years',
      fy_applicable: fy,
      tags: ['Tamil Nadu', 'Employment', 'Subsidy', 'Manufacturing'],
      icon_name: 'Users',
      color_accent: 'red'
    });
  }

  // ─── TELANGANA ────────────────────────────────────────────────────────────
  if (stateL.includes('telangana') || stateL === 'ts') {
    const tsCapEligible = isManufacturer && profile.new_machinery_investment > 0;
    const tsSgstSavings = tsCapEligible ? profile.total_gst_output * 0.5 : 0;
    const tsCapSavings = tsCapEligible ? profile.new_machinery_investment * 0.20 + tsSgstSavings : 0;
    optimizations.push({
      id: 'state_ts_ipass',
      category: 'state_subsidy',
      section: 'TS-iPASS \u2014 Telangana',
      title: 'Telangana TS-iPASS \u2014 Capital Subsidy + 100% SGST Reimbursement',
      short_description: '15–25% capital subsidy + 100% SGST reimbursement under Telangana\'s TS-iPASS single window system.',
      detailed_explanation: 'Telangana\'s Industrial Project Approval and Self-Certification System (TS-iPASS) provides instant approval for industrial projects with guaranteed time-bound clearances. Benefits include 15–25% capital subsidy on eligible fixed assets, 100% SGST reimbursement for 5 years, power cost reimbursement, and stamp duty exemption.',
      legal_reference: 'TS-iPASS Act 2014 and Telangana Industrial Policy 2020–25',
      eligibility_criteria: ['New manufacturing unit in Telangana', 'Apply through TS-iPASS portal before investment', 'Fixed capital investment within eligible range', 'Employment generation as per policy'],
      is_eligible: tsCapEligible,
      status: tsCapEligible ? 'eligible' : 'not_eligible',
      risk_level: 'safe',
      priority: tsCapEligible ? 'critical' : 'low',
      estimated_savings: tsCapSavings,
      savings_calculation: tsCapEligible ? `20% capital subsidy ₹${(profile.new_machinery_investment * 0.20).toFixed(0)} + 50% SGST ₹${tsSgstSavings.toFixed(0)} = ₹${tsCapSavings.toFixed(2)}` : 'N/A',
      action_items: [
        { id: 'ts_1', label: 'Apply on ipass.telangana.gov.in before starting investment', type: 'compliance', completed: false },
        { id: 'ts_2', label: 'Get Project Approval Order (PAO) from TSIIC', type: 'documentation', completed: false }
      ],
      documents_required: ['Project Report', 'Udyam Certificate', 'Land Documents', 'CA Investment Certificate'],
      deadline: 'Apply before investment commencement',
      fy_applicable: fy,
      tags: ['Telangana', 'TS-iPASS', 'Capital Subsidy', 'SGST'],
      icon_name: 'Award',
      color_accent: 'cyan'
    });
  }

  return optimizations;
}
