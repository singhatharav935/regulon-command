/**
 * useRealtimeSync — Supabase Realtime subscription hook.
 *
 * Subscribes to Postgres changes on critical tables and invokes a callback
 * whenever a row is inserted, updated, or deleted. This ensures that when
 * *any* device logged into the same account makes a change, every other
 * device sees it instantly without needing a manual refresh.
 *
 * Uses per-table subscriptions instead of wildcard (*) to avoid 406 errors
 * from tables that don't have Realtime enabled.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WATCHED_TABLES = [
  'companies',
  'company_members',
  'compliance_tasks',
  'ca_clients',
  'consent_requests',
  'documents',
  'ca_firm_invoices',
];

export function useRealtimeSync(onDataChange: () => void) {
  const callbackRef = useRef(onDataChange);
  callbackRef.current = onDataChange;

  useEffect(() => {
    // Debounce: avoid re-fetching too rapidly when many rows change at once
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedCallback = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(), 500);
    };

    // Create one channel, subscribe to each table individually
    let channel = supabase.channel('dashboard-sync');

    for (const table of WATCHED_TABLES) {
      channel = channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table } as any,
        debouncedCallback
      );
    }

    channel.subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR') {
        // Realtime might not be enabled for all tables — fail silently
        console.debug('[RealtimeSync] Channel error, falling back to polling');
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);
}

export default useRealtimeSync;
