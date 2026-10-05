/**
 * DEMO CA LINK STORE
 * ==================
 * Shared localStorage-based store that simulates the bidirectional
 * Company ↔ CA connection in demo mode.
 *
 * Key structure:
 *  demo:ca_link_code      — CA's unique 8-char code
 *  demo:company_link_code — Company's unique 8-char code
 *  demo:ca_connection     — { caCode, companyCode, companyName, linkedAt, status }
 *  demo:company_connection— { caCode, caFirmName, companyCode, linkedAt, status }
 *  demo:synced_payload    — Last data payload sent by company to CA
 */

export interface DemoCAConnection {
  caCode: string;
  caFirmName: string;
  companyCode: string;
  companyName: string;
  linkedAt: string;
  status: 'linked' | 'pending';
}

export interface DemoSyncPayload {
  sentAt: string;
  companyName: string;
  companyCode: string;
  gstin: string;
  pan: string;
  financialYear: string;
  revenue: string;
  profitAfterTax: string;
  totalAssets: string;
  gstReturns: string;
  tdsFilings: string;
  complianceScore: number;
  pendingTasks: number;
  balanceSheet: string;
  profitLoss: string;
  trialBalance: string;
  documents: { name: string; type: string; status: string }[];
  notifications: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── CA Code ──────────────────────────────────────────────────────────────────

export function getCADemoCode(): string {
  let code = localStorage.getItem('demo:ca_link_code');
  if (!code) {
    code = generateCode('CA');
    localStorage.setItem('demo:ca_link_code', code);
  }
  return code;
}

// ─── Company Code ─────────────────────────────────────────────────────────────

export function getCompanyDemoCode(): string {
  let code = localStorage.getItem('demo:company_link_code');
  if (!code) {
    code = generateCode('CO');
    localStorage.setItem('demo:company_link_code', code);
  }
  return code;
}

// ─── CA Connection ────────────────────────────────────────────────────────────

export function getCAConnection(): DemoCAConnection | null {
  try {
    const raw = localStorage.getItem('demo:ca_connection');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCAConnection(conn: DemoCAConnection): void {
  localStorage.setItem('demo:ca_connection', JSON.stringify(conn));
  window.dispatchEvent(new CustomEvent('demo:ca-link-updated'));
}

export function clearCAConnection(): void {
  localStorage.removeItem('demo:ca_connection');
  window.dispatchEvent(new CustomEvent('demo:ca-link-updated'));
}

// ─── Company Connection ───────────────────────────────────────────────────────

export function getCompanyConnection(): DemoCAConnection | null {
  try {
    const raw = localStorage.getItem('demo:company_connection');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCompanyConnection(conn: DemoCAConnection): void {
  localStorage.setItem('demo:company_connection', JSON.stringify(conn));
  window.dispatchEvent(new CustomEvent('demo:company-link-updated'));
}

export function clearCompanyConnection(): void {
  localStorage.removeItem('demo:company_connection');
  window.dispatchEvent(new CustomEvent('demo:company-link-updated'));
}

// ─── Sync Payload ─────────────────────────────────────────────────────────────

export function saveSyncPayload(payload: DemoSyncPayload): void {
  localStorage.setItem('demo:synced_payload', JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('demo:data-synced', { detail: payload }));
}

export function getSyncPayload(): DemoSyncPayload | null {
  try {
    const raw = localStorage.getItem('demo:synced_payload');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
