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

  return optimizations;
}
