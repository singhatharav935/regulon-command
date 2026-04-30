/**
 * useCAIdentity — JWT-based CA Identity Resolution Hook
 * 
 * Reads the JWT from localStorage (Supabase session), decodes the sub claim,
 * and provides the real caId and caFirmId for use across all dashboard components.
 * Falls back to 'ca-001' when no authenticated session exists (local dev).
 */

import { useState, useEffect } from 'react';

export interface CAIdentity {
  caId: string;
  caFirmId: string;
  email: string;
  role: string;
  isLoading: boolean;
}

const FALLBACK_CA_ID = 'ca-001';
const FALLBACK_FIRM_ID = 'firm-001';

/**
 * Decode a JWT token without external dependencies
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Pad base64 string
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get the access token from Supabase session in localStorage
 */
function getSupabaseToken(): string | null {
  try {
    // Supabase stores session under this key pattern
    const keys = Object.keys(localStorage).filter(k => k.includes('supabase') && k.includes('auth-token'));
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      return parsed?.access_token || parsed?.currentSession?.access_token || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function useCAIdentity(): CAIdentity {
  const [identity, setIdentity] = useState<CAIdentity>({
    caId: FALLBACK_CA_ID,
    caFirmId: FALLBACK_FIRM_ID,
    email: '',
    role: 'default',
    isLoading: true,
  });

  useEffect(() => {
    const resolve = () => {
      const token = getSupabaseToken();

      if (!token) {
        setIdentity({
          caId: FALLBACK_CA_ID,
          caFirmId: FALLBACK_FIRM_ID,
          email: 'dev@sannidh.ai',
          role: 'admin',
          isLoading: false,
        });
        return;
      }

      const claims = decodeJWT(token);
      if (!claims) {
        setIdentity(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Supabase JWT claims:
      // sub = user UUID, email = email, user_metadata for custom fields
      const sub = (claims.sub as string) || FALLBACK_CA_ID;
      const metadata = (claims.user_metadata as Record<string, string>) || {};
      const appMeta = (claims.app_metadata as Record<string, string>) || {};

      setIdentity({
        caId: sub,
        caFirmId: metadata.ca_firm_id || appMeta.ca_firm_id || `firm_${sub.slice(0, 8)}`,
        email: (claims.email as string) || '',
        role: metadata.role || appMeta.role || 'senior_ca',
        isLoading: false,
      });
    };

    resolve();

    // Re-resolve if storage changes (login/logout events)
    const handleStorage = () => resolve();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return identity;
}
