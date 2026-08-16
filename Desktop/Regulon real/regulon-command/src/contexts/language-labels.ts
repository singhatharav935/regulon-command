import type { Language } from './LanguageContext';

/** Language display labels. Kept in a separate file to satisfy
 *  Vite SWC Fast Refresh which requires context files to export only components/hooks. */
export const LANGUAGE_LABELS: Record<Language, { label: string; code: string }> = {
  en: { label: 'English', code: 'EN' },
  hi: { label: 'हिन्दी (Hindi)', code: 'HI' },
  mr: { label: 'मराठी (Marathi)', code: 'MR' },
  ta: { label: 'தமிழ் (Tamil)', code: 'TA' },
  te: { label: 'తెలుగు (Telugu)', code: 'TE' },
  bn: { label: 'বাংলা (Bengali)', code: 'BN' },
};
