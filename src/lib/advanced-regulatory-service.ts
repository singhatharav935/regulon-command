/**
 * Advanced Regulatory Data Service
 * Frontend service for fetching real-time regulatory updates
 */

import axios from 'axios';

// Use /api for both dev (Vite proxy) and production (Vercel rewrites)
// There is no standalone api.sannidh.ai backend — all API calls go through the proxy/rewrite
const API_BASE = '/api';

export interface RegulatoryAlert {
  id: string;
  source: string;
  source_label: string;
  title: string;
  summary: string | null;
  category: string | null;
  announced_by: string;
  source_url: string | null;
  announced_on: string;
  published_date: string | null;
  detected_at: string | null;
  effective_date: string | null;
  action_deadline: string | null;
  impact_score: number;
  company_exposure: 'low' | 'medium' | 'high';
  action_owner: string;
  original_url: string | null;
  source_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary?: string;
  authority: string;
  source_url: string;
  impact_type: string;
  affected_entities: string;
  implementation_status: string;
  urgency: 'low' | 'medium' | 'high';
  regulatory_area: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  previous_notices?: number;
  source_verified: boolean;
}

export interface AgentStatus {
  government_agents: Array<{
    name: string;
    isActive: boolean;
    lastFetch: string | null;
    errorCount: number;
    status: 'active' | 'error';
  }>;
  news_agents: Array<{
    name: string;
    isActive: boolean;
    lastFetch: string | null;
    errorCount: number;
    status: 'active' | 'error';
  }>;
  total_agents: number;
  active_agents: number;
  system_running: boolean;
}

export interface AlertsSummary {
  total_alerts: number;
  alerts_24h: number;
  alerts_7d: number;
  high_exposure_alerts: number;
  urgent_deadlines: number;
  avg_impact_score: number;
  active_agents: number;
  error_agents: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: No regulatory backend is currently deployed.  All functions below
// return curated mock data directly (the same data the catch-fallbacks used
// to return).  When a backend becomes available, uncomment the axios calls
// and remove the mock returns.
// ─────────────────────────────────────────────────────────────────────────────

// Regulatory Alerts API
export const fetchRegulatoryAlerts = async (options: {
  source?: string;
  category?: string;
  exposure?: string;
  limit?: number;
  offset?: number;
  since?: string;
  search?: string;
} = {}): Promise<{
  alerts: RegulatoryAlert[];
  total: number;
  limit: number;
  offset: number;
}> => {
  // Return mock data directly — no backend to call
  return {
    alerts: generateMockAlerts(),
    total: 25,
    limit: options.limit || 50,
    offset: options.offset || 0
  };
};

// Get alerts summary for dashboard
export const fetchAlertsSummary = async (): Promise<AlertsSummary> => {
  const mockAlerts = generateMockAlerts();
  return {
    total_alerts: mockAlerts.length,
    alerts_24h: 12,
    alerts_7d: 89,
    high_exposure_alerts: 23,
    urgent_deadlines: 5,
    avg_impact_score: 4.2,
    active_agents: 11,
    error_agents: 0
  };
};

// Regulatory News API
export const fetchRegulatoryNews = async (_options: {
  category?: string;
  severity?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<NewsItem[]> => {
  return generateMockNews();
};

// Agent Management API
export const startRegulatoryAgents = async (): Promise<{ message: string }> => {
  return { message: 'Agents started (mock)' };
};

export const runAgentsNow = async (): Promise<{ message: string }> => {
  return { message: 'Agents running (mock)' };
};

export const fetchAgentStatus = async (): Promise<AgentStatus> => {
  return {
    government_agents: [
      { name: 'GSTN', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'CBIC', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'INCOMETAX', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'MCA', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'SEBI', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'RBI', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'EGAZETTE', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' }
    ],
    news_agents: [
      { name: 'BUSINESS_STANDARD', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'ECONOMIC_TIMES', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'LIVEMINT', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' },
      { name: 'FINANCIAL_EXPRESS', isActive: true, lastFetch: new Date().toISOString(), errorCount: 0, status: 'active' }
    ],
    total_agents: 11,
    active_agents: 11,
    system_running: true
  };
};

// Search alerts
export const searchAlerts = async (_searchParams: {
  query?: string;
  sources?: string[];
  categories?: string[];
  exposureLevel?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  limit?: number;
}): Promise<RegulatoryAlert[]> => {
  return [];
};

// Health check
export const checkRegulatoryHealth = async (): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  agents: {
    total: number;
    active: number;
    running: boolean;
  };
}> => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agents: { total: 11, active: 11, running: true }
  };
};


// Helper function to get valid source URLs
const getValidSourceUrl = (sourceId: string, index: number): string => {
  const validUrls: { [key: string]: string[] } = {
    'gstn': [
      'https://www.gst.gov.in/',
      'https://www.gst.gov.in/newsandupdates',
      'https://www.gst.gov.in/help/notifications'
    ],
    'mca': [
      'https://www.mca.gov.in/',
      'https://www.mca.gov.in/content/mca/global/en/home.html',
      'https://www.mca.gov.in/content/mca/global/en/acts-rules/acts.html'
    ],
    'cbic': [
      'https://www.cbic.gov.in/',
      'https://www.cbic.gov.in/htdocs-cbec/customs/cs-tariff2017-18',
      'https://www.cbic.gov.in/htdocs-cbec/gst/gst-notifications'
    ],
    'incometax': [
      'https://www.incometax.gov.in/',
      'https://www.incometax.gov.in/iec/foportal',
      'https://www.incometax.gov.in/iec/foportal/help'
    ],
    'sebi': [
      'https://www.sebi.gov.in/',
      'https://www.sebi.gov.in/legal/regulations.html',
      'https://www.sebi.gov.in/legal/circulars.html'
    ],
    'rbi': [
      'https://www.rbi.org.in/',
      'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
      'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx'
    ],
    'egazette': [
      'https://egazette.nic.in/',
      'https://egazette.nic.in/SearchResult.aspx',
      'https://egazette.nic.in/Login.aspx'
    ]
  };
  
  const urls = validUrls[sourceId] || ['https://www.google.com/'];
  return urls[index % urls.length];
};

// Helper function to get valid news URLs
const getValidNewsUrl = (sourceName: string, index: number, isGovSource: boolean): string => {
  if (isGovSource) {
    const govUrls = {
      'Economic Times': 'https://economictimes.indiatimes.com/news/economy/policy',
      'Business Standard': 'https://www.business-standard.com/policy',
      'LiveMint': 'https://www.livemint.com/policy',
      'Financial Express': 'https://www.financialexpress.com/policy/'
    };
    return govUrls[sourceName as keyof typeof govUrls] || 'https://www.google.com/news';
  } else {
    const mediaUrls = {
      'Economic Times': 'https://economictimes.indiatimes.com/news/economy/policy',
      'Business Standard': 'https://www.business-standard.com/policy', 
      'LiveMint': 'https://www.livemint.com/policy',
      'Financial Express': 'https://www.financialexpress.com/policy/'
    };
    return mediaUrls[sourceName as keyof typeof mediaUrls] || 'https://www.google.com/news';
  }
};

// Mock data generators (fallbacks)
const generateMockAlerts = (): RegulatoryAlert[] => {
  // Mock data fallback — no log needed in production
  const alerts: RegulatoryAlert[] = [];
  const sources = [
    { id: 'gstn', name: 'GSTN', authority: 'Goods and Services Tax Network', category: 'GST' },
    { id: 'mca', name: 'MCA', authority: 'Ministry of Corporate Affairs', category: 'Corporate Affairs' },
    { id: 'cbic', name: 'CBIC', authority: 'Central Board of Indirect Taxes and Customs', category: 'Customs & Excise' },
    { id: 'incometax', name: 'Income Tax India', authority: 'Income Tax Department', category: 'Income Tax' },
    { id: 'sebi', name: 'SEBI', authority: 'Securities and Exchange Board of India', category: 'Securities' },
    { id: 'rbi', name: 'RBI', authority: 'Reserve Bank of India', category: 'Banking & Finance' },
    { id: 'egazette', name: 'eGazette', authority: 'Government of India', category: 'Official Gazette' }
  ];

  const sampleUpdates = [
    'GST Return Filing Extension for March 2024 - Due date extended to April 25, 2024',
    'Companies (Amendment) Rules, 2024 - New mandatory board resolution format under Section 179',
    'CBIC Circular on Import Duty Exemptions - Updated procedures for manufacturing sector',
    'Income Tax Amendment - New TDS rates effective from April 1, 2024',
    'SEBI Guidelines on ESG Reporting - Mandatory sustainability disclosures for listed companies',
    'RBI Monetary Policy Update - New repo rate and banking regulations',
    'Labour Code Implementation - New compliance requirements for establishments',
    'Digital Signature Certificate Mandate - E-filing requirements for all statutory returns',
    'Foreign Exchange Management (FEMA) Amendment - Updated investment guidelines',
    'Companies Act Notification - Enhanced disclosure norms for related party transactions',
    'GST Input Tax Credit Rules - Revised matching and reversal procedures',
    'Securities Contracts Regulation - New derivative trading guidelines',
    'Banking Regulation Update - Enhanced KYC and AML compliance requirements',
    'Environmental Clearance Norms - Updated procedures for industrial projects',
    'Corporate Social Responsibility - Revised spending and reporting guidelines',
    'Insolvency and Bankruptcy Code Amendment - New resolution framework',
    'Competition Act Guidelines - Updated merger and acquisition approval process',
    'Data Protection Regulations - Enhanced privacy compliance for businesses',
    'Export-Import Policy Update - Revised procedures and incentive schemes',
    'Direct Tax Code Proposals - Simplified taxation structure for corporates'
  ];

  // Generate 25+ alerts from the past month
  for (let i = 0; i < 25; i++) {
    const source = sources[i % sources.length];
    const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
    const update = sampleUpdates[i % sampleUpdates.length];
    const parts = update.split(' - ');
    
    alerts.push({
      id: `${source.id}_2024_${String(i + 1).padStart(3, '0')}`,
      source: source.id,
      source_label: source.name,
      title: parts[0],
      summary: parts[1] || `Important regulatory update from ${source.authority}`,
      category: source.category,
      announced_by: source.authority,
      source_url: getValidSourceUrl(source.id, i),
      announced_on: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      published_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      detected_at: new Date(Date.now() - (daysAgo - 0.5) * 24 * 60 * 60 * 1000).toISOString(),
      effective_date: i % 3 === 0 ? new Date(Date.now() + (30 - daysAgo) * 24 * 60 * 60 * 1000).toISOString() : null,
      action_deadline: i % 4 === 0 ? new Date(Date.now() + (60 - daysAgo) * 24 * 60 * 60 * 1000).toISOString() : null,
      impact_score: Math.floor(Math.random() * 6) + 3, // 3-8 impact score
      company_exposure: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      action_owner: ['Compliance Team', 'Legal Team', 'Finance Team', 'Operations Team'][Math.floor(Math.random() * 4)],
      original_url: getValidSourceUrl(source.id, 0),
      source_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return alerts.sort((a, b) => new Date(b.announced_on).getTime() - new Date(a.announced_on).getTime());
};

const generateMockNews = (): NewsItem[] => {
  const news = [];
  
  const mediaHouses = [
    { name: 'Economic Times', category: 'Economic Policy' },
    { name: 'Business Standard', category: 'Business News' },
    { name: 'LiveMint', category: 'Policy Updates' },
    { name: 'Financial Express', category: 'Financial Policy' }
  ];

  const govPortals = [
    { name: 'GSTN Portal', category: 'GST Updates' },
    { name: 'MCA Portal', category: 'Corporate Affairs' },
    { name: 'CBIC Portal', category: 'Customs & Excise' },
    { name: 'Income Tax Portal', category: 'Tax Policy' },
    { name: 'SEBI Portal', category: 'Securities Regulation' },
    { name: 'RBI Portal', category: 'Banking & Finance' },
    { name: 'eGazette Portal', category: 'Official Notifications' }
  ];

  const newsTopics = [
    {
      title: 'RBI Proposes New Framework for Digital Lending Platforms',
      summary: 'Reserve Bank of India releases draft guidelines for regulating digital lending platforms and fintech companies.',
      impact: 'Regulatory Change',
      entities: 'NBFCs, Fintech Companies, Digital Lenders',
      status: 'Draft Guidelines - Public Comments Invited',
      area: 'Financial Services'
    },
    {
      title: 'SEBI Tightens Norms for Mutual Fund Advertising',
      summary: 'Securities market regulator introduces stricter guidelines for mutual fund advertisements and investor disclosures.',
      impact: 'Compliance Requirement',
      entities: 'Mutual Funds, Asset Management Companies',
      status: 'Effective Immediately',
      area: 'Capital Markets'
    },
    {
      title: 'GST Council Approves Rate Changes for Multiple Items',
      summary: 'Latest GST Council meeting results in tax rate modifications for consumer goods, healthcare, and technology sectors.',
      impact: 'Tax Rate Change',
      entities: 'Manufacturers, Retailers, Service Providers',
      status: 'Effective from Next Month',
      area: 'Taxation'
    },
    {
      title: 'MCA Mandates Digital Filing for All Company Returns',
      summary: 'Ministry of Corporate Affairs makes digital submission mandatory for annual returns and financial statements.',
      impact: 'Process Change',
      entities: 'All Registered Companies',
      status: 'Implementation from April 2024',
      area: 'Corporate Compliance'
    },
    {
      title: 'New Labour Codes Implementation Timeline Announced',
      summary: 'Government releases phased implementation schedule for the four new labour codes affecting employment regulations.',
      impact: 'Legislative Change',
      entities: 'All Employers, Contractors, Workers',
      status: 'Phased Implementation Starting July 2024',
      area: 'Employment Law'
    },
    {
      title: 'FEMA Regulations Updated for Foreign Investments',
      summary: 'Foreign Exchange Management Act sees major amendments affecting FDI procedures and compliance requirements.',
      impact: 'Investment Regulation',
      entities: 'Foreign Investors, Indian Companies',
      status: 'Effective Immediately',
      area: 'Foreign Exchange'
    },
    {
      title: 'Environmental Clearance Norms Tightened for Industries',
      summary: 'Ministry of Environment strengthens environmental impact assessment requirements for industrial projects.',
      impact: 'Regulatory Tightening',
      entities: 'Manufacturing Companies, Infrastructure Projects',
      status: 'New Applications from May 2024',
      area: 'Environmental Compliance'
    },
    {
      title: 'Insolvency Code Amendments Streamline Resolution Process',
      summary: 'Parliament approves key amendments to Insolvency and Bankruptcy Code to expedite corporate resolution.',
      impact: 'Process Improvement',
      entities: 'Creditors, Debtors, Resolution Professionals',
      status: 'Presidential Assent Pending',
      area: 'Insolvency Law'
    },
    {
      title: 'Competition Commission Issues New M&A Guidelines',
      summary: 'Competition Commission of India releases updated guidelines for merger and acquisition approvals.',
      impact: 'Procedural Update',
      entities: 'Acquiring Companies, Target Companies',
      status: 'Effective from Current Date',
      area: 'Competition Law'
    },
    {
      title: 'Data Protection Bill Provisions Create Compliance Obligations',
      summary: 'Proposed data protection legislation outlines extensive compliance requirements for data processing entities.',
      impact: 'New Compliance Framework',
      entities: 'All Data Processing Organizations',
      status: 'Legislative Approval Awaited',
      area: 'Data Privacy'
    },
    {
      title: 'Export-Import Policy Revised with New Incentives',
      summary: 'Directorate General of Foreign Trade announces revised export-import policy with enhanced incentive schemes.',
      impact: 'Policy Revision',
      entities: 'Exporters, Importers, Traders',
      status: 'Effective from New Financial Year',
      area: 'Trade Policy'
    },
    {
      title: 'Corporate Social Responsibility Rules See Major Updates',
      summary: 'MCA revises CSR rules with new spending requirements and monitoring mechanisms for companies.',
      impact: 'CSR Obligation Change',
      entities: 'Companies Above Threshold Limit',
      status: 'Effective from Current Financial Year',
      area: 'Corporate Governance'
    }
  ];

  // Generate news from past 30 days mixing government portals and media houses
  for (let i = 0; i < 30; i++) {
    const topic = newsTopics[i % newsTopics.length];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    
    // Alternate between government portals and media houses
    const isGovSource = i % 3 === 0; // Every 3rd item is from government portal
    const source = isGovSource ? 
      govPortals[i % govPortals.length] : 
      mediaHouses[i % mediaHouses.length];

    const urgencyLevels = ['low', 'medium', 'high'] as const;
    const severityLevels = ['low', 'medium', 'high'] as const;
    
    news.push({
      id: `news_${isGovSource ? 'gov' : 'media'}_2024_${String(i + 1).padStart(3, '0')}`,
      category: source.category,
      title: topic.title,
      summary: topic.summary,
      authority: source.name,
      source_url: getValidNewsUrl(source.name, i, isGovSource),
      impact_type: topic.impact,
      affected_entities: topic.entities,
      implementation_status: topic.status,
      urgency: urgencyLevels[Math.floor(Math.random() * 3)],
      regulatory_area: topic.area,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      severity: severityLevels[Math.floor(Math.random() * 3)],
      previous_notices: Math.floor(Math.random() * 5),
      source_verified: true
    });
  }
  
  return news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Export the original functions for backwards compatibility
export const fetchLiveRegulatoryNews = fetchRegulatoryNews;
export const getLiveRegulatedAnnouncements = fetchRegulatoryAlerts;