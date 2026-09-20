/**
 * GSTIN Validator — Pure TypeScript, zero external API dependencies.
 * Implements the official GST checksum algorithm (mod-36 Luhn variant).
 */

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh',      '05': 'Uttarakhand',      '06': 'Haryana',
  '07': 'Delhi',           '08': 'Rajasthan',         '09': 'Uttar Pradesh',
  '10': 'Bihar',           '11': 'Sikkim',            '12': 'Arunachal Pradesh',
  '13': 'Nagaland',        '14': 'Manipur',           '15': 'Mizoram',
  '16': 'Tripura',         '17': 'Meghalaya',         '18': 'Assam',
  '19': 'West Bengal',     '20': 'Jharkhand',         '21': 'Odisha',
  '22': 'Chhattisgarh',    '23': 'Madhya Pradesh',    '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',       '30': 'Goa',               '31': 'Lakshadweep',
  '32': 'Kerala',          '33': 'Tamil Nadu',         '34': 'Puducherry',
  '35': 'Andaman & Nicobar', '36': 'Telangana',       '37': 'Andhra Pradesh',
  '38': 'Ladakh',          '97': 'Other Territory',   '99': 'Centre Jurisdiction',
};

export interface GSTINValidationResult {
  valid: boolean;
  error?: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  entityNumber?: string;
  checkDigit?: string;
}

function computeCheckDigit(gstin: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const val = CHARSET.indexOf(gstin[i]);
    if (val === -1) return '';
    const product = val * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36];
}

export function validateGSTIN(gstin: string): GSTINValidationResult {
  const g = gstin.trim().toUpperCase();

  if (!g) return { valid: false, error: 'GSTIN is required' };
  if (g.length !== 15) return { valid: false, error: `GSTIN must be 15 characters (got ${g.length})` };
  if (!/^[0-9A-Z]{15}$/.test(g)) return { valid: false, error: 'GSTIN contains invalid characters' };

  const stateCode = g.substring(0, 2);
  if (!STATE_CODES[stateCode]) return { valid: false, error: `Invalid state code: ${stateCode}` };

  // PAN embedded in chars 3–12
  const pan = g.substring(2, 12);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return { valid: false, error: 'Invalid PAN embedded in GSTIN' };

  // Entity number (char 13) must be 1–9 or A–Z
  const entityNum = g[12];
  if (!/^[1-9A-Z]$/.test(entityNum)) return { valid: false, error: 'Invalid entity number' };

  // Char 14 must be 'Z' (default registration suffix)
  if (g[13] !== 'Z') return { valid: false, error: 'GSTIN char 14 must be Z' };

  // Checksum validation
  const expected = computeCheckDigit(g);
  if (!expected || g[14] !== expected) {
    return { valid: false, error: 'Invalid GSTIN checksum — please verify the number' };
  }

  return {
    valid: true,
    stateCode,
    stateName: STATE_CODES[stateCode],
    pan,
    entityNumber: entityNum,
    checkDigit: g[14],
  };
}

/** Lightweight format check only (no checksum) — for real-time typing feedback */
export function isGSTINFormatValid(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  return g.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g);
}
