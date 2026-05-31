/**
 * useRealtimeSync — Supabase Realtime subscription hook.
 *
 * Subscribes to Postgres changes on critical tables (companies, compliance_tasks,
 * company_members, ca_clients, etc.) and invokes a callback whenever a row is
 * inserted, updated, or deleted.  This ensures that when *any* device logged
 * into the same account makes a change, every other device sees it instantly
 * without needing a manual refresh.
 *
 * Usage:
 *   useRealtimeSync(() => { refetchMetrics(); refetchClients(); });
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WATCHED_TABLES = [
  'companies',
  'company_members',
  'compliance_tasks',
  'ca_clients',
  'ca_dependencies',
  'ca_task_history',
  'client_govt_notices',
  'communication_logs',
  'consent_requests',
  'document_vault',
  'regulatory_news_feed',
  'ca_firm_invoices',
];

export function useRealtimeSync(onDataChange: () => void) {
  // Use a ref so the callback can be updated without re-subscribing
  const callbackRef = useRef(onDataChange);
  callbackRef.current = onDataChange;

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: '*' } as any,
        (_payload: any) => {
          // Only fire if the changed table is one we watch
          if (WATCHED_TABLES.includes(_payload.table)) {
            callbackRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

export default useRealtimeSync;
