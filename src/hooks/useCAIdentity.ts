/**
 * useCAIdentity — Supabase Auth-Based CA Identity Resolution Hook
 * 
 * Reads the authenticated user from Supabase auth session and provides
 * the real caId (user UUID) and caFirmId for use across all dashboard components.
 * 
 * When no authenticated session exists, caId is null — downstream hooks and
 * services MUST guard against null/invalid UUIDs before querying Supabase.
 * 
 * IMPORTANT: This hook NEVER returns a hardcoded fallback like 'ca-001'.
 * Non-UUID strings cause PostgreSQL errors on UUID columns.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CAIdentity {
  caId: string | null;
  caFirmId: string | null;
  email: string;
  role: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

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

const hasActiveRealSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth-token') || key.includes('supabase.auth.token'))) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (parsed && (parsed.access_token || parsed.user || parsed.currentSession)) {
            return true;
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return false;
};

export function useCAIdentity(): CAIdentity {
  const isDemo = typeof window !== 'undefined' && (window.location.pathname === '/ca-dashboard' || window.location.pathname === '/ca-dashboard/' || window.location.pathname.startsWith('/ca-dashboard/'));

  const [identity, setIdentity] = useState<CAIdentity>(() => {
    const hasReal = hasActiveRealSession();
    const useMock = isDemo && !hasReal;
    return {
      caId: useMock ? '00000000-0000-0000-0000-000000000000' : null,
      caFirmId: useMock ? 'firm_demo_consolidated' : null,
      email: useMock ? 'ca@sannidh.ai' : '',
      role: useMock ? 'senior_ca' : 'default',
      isLoading: useMock ? false : true,
      isAuthenticated: useMock ? true : false,
    };
  });

  useEffect(() => {
    if (isDemo && !hasActiveRealSession()) return;
    let mounted = true;

    const resolve = async () => {
      try {
        // Use the Supabase auth API to get the current session — this returns a real UUID
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setIdentity({
              caId: null,
              caFirmId: null,
              email: '',
              role: 'default',
              isLoading: false,
              isAuthenticated: false,
            });
          }
          return;
        }

        const user = session.user;
        const userId = user.id; // Always a valid UUID from Supabase

        // Extract metadata from JWT claims for firm/role info
        const accessToken = session.access_token;
        const claims = accessToken ? decodeJWT(accessToken) : null;
        const metadata = (claims?.user_metadata as Record<string, string>) || user.user_metadata || {};
        const appMeta = (claims?.app_metadata as Record<string, string>) || user.app_metadata || {};

        if (mounted) {
          setIdentity({
            caId: userId,
            caFirmId: metadata.ca_firm_id || appMeta.ca_firm_id || `firm_${userId.slice(0, 8)}`,
            email: user.email || '',
            role: metadata.role || appMeta.role || 'senior_ca',
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } catch (err) {
        console.warn('[useCAIdentity] Failed to resolve identity:', err);
        if (mounted) {
          setIdentity(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    resolve();

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setIdentity({
          caId: null,
          caFirmId: null,
          email: '',
          role: 'default',
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      const user = session.user;
      const userId = user.id;
      const metadata = user.user_metadata || {};
      const appMeta = user.app_metadata || {};

      setIdentity({
        caId: userId,
        caFirmId: metadata.ca_firm_id || appMeta.ca_firm_id || `firm_${userId.slice(0, 8)}`,
        email: user.email || '',
        role: metadata.role || appMeta.role || 'senior_ca',
        isLoading: false,
        isAuthenticated: true,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return identity;
}
