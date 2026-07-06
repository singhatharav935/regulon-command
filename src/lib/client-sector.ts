/**
 * client-sector.ts
 * Shared sector configuration for Sannidh CA platform.
 * Used by both real (ExternalCADashboardReal) and demo (CADashboard) — never merged.
 * DO NOT import dashboard-specific logic here.
 */

export type ClientSector =
  | 'msme'
  | 'corporate'
  | 'banking'
  | 'individual'
  | 'startup'
  | 'ngo'
  | 'general'; // default — no restriction

// ─── Sector Display Config ────────────────────────────────────────────────────

export interface SectorConfig {
  id: ClientSector;
  label: string;
  shortLabel: string;
  description: string;
  color: string;         // Tailwind text color
  bgColor: string;       // Tailwind bg color
  borderColor: string;   // Tailwind border color
  badgeCls: string;      // Full badge class string
  emoji: string;
  /** Dashboard zone IDs this sector can access. null = all zones allowed */
  allowedZones: string[] | null;
  /** Compliance module IDs this sector can access. null = all allowed */
  allowedModules: string[] | null;
}

export const SECTOR_CONFIGS: Record<ClientSector, SectorConfig> = {
  msme: {
    id: 'msme',
    label: 'MSME',
    shortLabel: 'MSME',
    description: 'Micro, Small & Medium Enterprise — Udyam registered businesses',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    emoji: '🏭',
    allowedZones: [
      'command', 'clients', 'e-filing', 'payment', 'operations',
      'calculations', 'ai-swarm', 'doc-ocr', 'audit-trail',
      'team-rbac', 'notifications', 'branding', 'language-hub',
      'offline-hub', 'gov-scraper', 'multi-entity',
    ],
    allowedModules: [
      'gstr1', 'gstr2b', 'gstr3b', 'itr', 'epf_esi',
      'financials', 'notice_tracker', 'debtors_aging',
      'invoice_parser', 'salary_tds', 'regime_optimizer',
      'advance_tax', 'bank_recon', 'accounting_sync',
      'audit_file', 'capital_gains',
    ],
  },

  corporate: {
    id: 'corporate',
    label: 'Corporate',
    shortLabel: 'Corp',
    description: 'Pvt Ltd / Ltd / MNC — MCA, ROC and board compliance',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/40',
    badgeCls: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    emoji: '🏢',
    allowedZones: null, // all zones
    allowedModules: [
      'gstr1', 'gstr2b', 'gstr3b', 'itr', 'epf_esi',
      'financials', 'notice_tracker', 'debtors_aging',
      'audit_file', 'board_meetings', 'invoice_parser',
      'fema_sebi', 'import_export', 'professional_cqc',
      'salary_tds', 'gratuity', 'board_resolutions',
      'agm_minutes', 'mca_form20b', 'din_tan_renewal',
      'advance_tax', 'bank_recon', 'accounting_sync',
      'regime_optimizer', 'capital_gains', 'deferred_tax',
    ],
  },

  banking: {
    id: 'banking',
    label: 'Banking / NBFC',
    shortLabel: 'Bank',
    description: 'Banks, NBFCs — RBI, FEMA, SEBI regulated entities',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/15',
    borderColor: 'border-violet-500/40',
    badgeCls: 'bg-violet-500/15 text-violet-400 border-violet-500/40',
    emoji: '🏦',
    allowedZones: [
      'command', 'clients', 'e-filing', 'payment', 'operations',
      'enterprise-api', 'erp-integration', 'doc-ocr', 'audit-trail',
      'team-rbac', 'notifications', 'branding', 'language-hub',
      'offline-hub', 'gov-scraper', 'multi-entity', 'calculations',
    ],
    allowedModules: [
      'itr', 'financials', 'notice_tracker', 'audit_file',
      'fema_sebi', 'board_meetings', 'agm_minutes',
      'board_resolutions', 'din_tan_renewal', 'salary_tds',
      'gratuity', 'capital_gains', 'deferred_tax',
      'bank_recon', 'advance_tax',
    ],
  },

  individual: {
    id: 'individual',
    label: 'Individual / HUF',
    shortLabel: 'Indv',
    description: 'Individual taxpayers and Hindu Undivided Families',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    badgeCls: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    emoji: '👤',
    allowedZones: [
      'command', 'clients', 'e-filing', 'payment', 'operations',
      'calculations', 'ai-swarm', 'doc-ocr', 'audit-trail',
      'notifications', 'branding', 'language-hub', 'offline-hub',
    ],
    allowedModules: [
      'itr', 'regime_optimizer', 'advance_tax', 'capital_gains',
      'notice_tracker', 'salary_tds', 'bank_recon', 'financials',
    ],
  },

  startup: {
    id: 'startup',
    label: 'Startup',
    shortLabel: 'Startup',
    description: 'DPIIT registered startups — ESOPs, angel tax, early stage',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    badgeCls: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    emoji: '🚀',
    allowedZones: [
      'command', 'clients', 'e-filing', 'payment', 'operations',
      'calculations', 'ai-swarm', 'doc-ocr', 'audit-trail',
      'team-rbac', 'notifications', 'branding', 'language-hub',
      'offline-hub', 'gov-scraper', 'enterprise-api', 'erp-integration',
    ],
    allowedModules: [
      'gstr1', 'gstr2b', 'gstr3b', 'itr', 'epf_esi',
      'financials', 'notice_tracker', 'invoice_parser',
      'salary_tds', 'advance_tax', 'capital_gains',
      'bank_recon', 'accounting_sync', 'din_tan_renewal',
      'board_meetings', 'board_resolutions',
    ],
  },

  ngo: {
    id: 'ngo',
    label: 'NGO / Trust',
    shortLabel: 'NGO',
    description: 'Section 8 companies, charitable trusts — FCRA, 80G, 12A',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/15',
    borderColor: 'border-pink-500/40',
    badgeCls: 'bg-pink-500/15 text-pink-400 border-pink-500/40',
    emoji: '🤝',
    allowedZones: [
      'command', 'clients', 'e-filing', 'payment', 'operations',
      'calculations', 'ai-swarm', 'doc-ocr', 'audit-trail',
      'notifications', 'branding', 'language-hub', 'offline-hub',
    ],
    allowedModules: [
      'itr', 'financials', 'notice_tracker', 'audit_file',
      'salary_tds', 'advance_tax', 'bank_recon',
      'board_meetings', 'agm_minutes', 'board_resolutions',
    ],
  },

  general: {
    id: 'general',
    label: 'General',
    shortLabel: 'General',
    description: 'No specific sector — all features visible',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/15',
    borderColor: 'border-slate-500/40',
    badgeCls: 'bg-slate-500/15 text-slate-400 border-slate-500/40',
    emoji: '📋',
    allowedZones: null, // no restriction
    allowedModules: null, // no restriction
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** All sectors available for selection (excludes 'general' as it's the default) */
export const SELECTABLE_SECTORS: ClientSector[] = [
  'msme', 'corporate', 'banking', 'individual', 'startup', 'ngo', 'general',
];

/** Get config for a sector (defaults to 'general' if unknown) */
export function getSectorConfig(sector?: ClientSector | string | null): SectorConfig {
  if (!sector) return SECTOR_CONFIGS.general;
  return SECTOR_CONFIGS[sector as ClientSector] ?? SECTOR_CONFIGS.general;
}

/** Check if a zone is allowed for a given sector */
export function isZoneAllowed(sector: ClientSector | null | undefined, zoneId: string): boolean {
  if (!sector || sector === 'general') return true;
  const config = SECTOR_CONFIGS[sector];
  if (!config || !config.allowedZones) return true;
  return config.allowedZones.includes(zoneId);
}

/** Check if a compliance module is allowed for a given sector */
export function isModuleAllowed(sector: ClientSector | null | undefined, moduleId: string): boolean {
  if (!sector || sector === 'general') return true;
  const config = SECTOR_CONFIGS[sector];
  if (!config || !config.allowedModules) return true;
  return config.allowedModules.includes(moduleId);
}

/**
 * Map an industry string (from Supabase companies.industry column) to a ClientSector.
 * This allows backward compatibility with existing data.
 */
export function industryToSector(industry?: string | null): ClientSector {
  if (!industry) return 'general';
  const lower = industry.toLowerCase();
  if (lower.includes('msme') || lower.includes('manufactur') || lower.includes('trading')) return 'msme';
  if (lower.includes('corporate') || lower.includes('pvt') || lower.includes('limited') || lower.includes('mnc')) return 'corporate';
  if (lower.includes('bank') || lower.includes('nbfc') || lower.includes('finance') || lower.includes('financial')) return 'banking';
  if (lower.includes('individual') || lower.includes('huf') || lower.includes('personal')) return 'individual';
  if (lower.includes('startup') || lower.includes('dpiit') || lower.includes('tech')) return 'startup';
  if (lower.includes('ngo') || lower.includes('trust') || lower.includes('society') || lower.includes('section 8') || lower.includes('charitable')) return 'ngo';
  return 'general';
}
