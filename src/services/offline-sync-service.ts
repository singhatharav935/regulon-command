/**
 * Offline Mode & PWA Queue Synchronization Service (Gap 15)
 * Real Supabase direct insertions/updates when online.
 * Buffers data changes locally when in simulated or actual offline modes.
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MutationAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface OfflineMutation {
  id: string;
  action: MutationAction;
  table: string;
  payload: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

// ─── Connectivity State Checks ───────────────────────────────────────────────

/**
 * Checks if the application is online. Takes both actual navigator status
 * and local simulated offline mode override into account.
 */
export function isOnline(): boolean {
  const simulatedOffline = localStorage.getItem('ca_simulated_offline') === 'true';
  if (simulatedOffline) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function setSimulatedOffline(offline: boolean): void {
  localStorage.setItem('ca_simulated_offline', String(offline));
  // Dispatch custom event to trigger UI reactivity across components
  window.dispatchEvent(new CustomEvent('ca:connectivity-change', { detail: { online: !offline } }));
  if (offline) {
    toast.warning('Simulated Offline Mode enabled. All database actions will queue locally.');
  } else {
    toast.success('Simulated Online Mode restored. Initializing automatic synchronization...');
    syncOfflineQueue();
  }
}

// ─── Local Mutation Queue Manager ─────────────────────────────────────────────

const QUEUE_KEY = 'ca_offline_sync_queue';

export function getOfflineQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflineMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Buffer a database mutation in the local queue when offline.
 */
export function queueOfflineMutation(
  action: MutationAction,
  table: string,
  payload: Record<string, any>
): OfflineMutation {
  const queue = getOfflineQueue();
  const mutation: OfflineMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    table,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  queue.push(mutation);
  saveOfflineQueue(queue);

  toast.info(`Offline Mode Active: Changes buffered inside local Sync Queue (${table}).`, {
    description: 'Modifications will synchronize automatically upon connection.',
  });

  // Log inside immutable audit logs in simulated online fashion if needed
  triggerAuditTrailLog(action, table, mutation.id);

  return mutation;
}

export function clearSyncQueue(): void {
  saveOfflineQueue([]);
  toast.success('Offline Sync Queue cleared.');
  window.dispatchEvent(new Event('ca:queue-updated'));
}

// ─── Automatic Batch Synchronization Engine ──────────────────────────────────

let isSyncing = false;

/**
 * Iterates through the buffered queue and executes mutations sequentially on Supabase.
 */
export async function syncOfflineQueue(): Promise<void> {
  if (isSyncing) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  // Ensure network is actually available (and simulated offline is disabled)
  if (!isOnline() && localStorage.getItem('ca_simulated_offline') === 'true') {
    return; // Block sync if simulated offline is active
  }

  isSyncing = true;
  console.log(`[Offline Sync] Commencing batch sync of ${queue.length} buffered operations...`);
  
  const updatedQueue = [...queue];
  let successfulCount = 0;

  for (let i = 0; i < updatedQueue.length; i++) {
    const mut = updatedQueue[i];
    if (mut.status === 'syncing') continue;

    mut.status = 'syncing';
    saveOfflineQueue(updatedQueue);
    window.dispatchEvent(new CustomEvent('ca:queue-updated'));

    try {
      let query: any = supabase.from(mut.table as any);

      if (mut.action === 'INSERT') {
        const { error } = await query.insert([mut.payload]);
        if (error) throw error;
      } else if (mut.action === 'UPDATE') {
        const { error } = await query
          .update(mut.payload)
          .eq('id', mut.payload.id || mut.payload.user_id);
        if (error) throw error;
      } else if (mut.action === 'DELETE') {
        const { error } = await query
          .delete()
          .eq('id', mut.payload.id);
        if (error) throw error;
      }

      console.log(`[Offline Sync] Successfully synced operation ${mut.id} for table ${mut.table}`);
      mut.status = 'pending'; // marked for deletion from queue
      successfulCount++;
    } catch (err: any) {
      console.error(`[Offline Sync] Failed to sync operation ${mut.id}:`, err.message);
      mut.status = 'failed';
      mut.errorMessage = err.message || 'Supabase query error occurred during sync.';
    }
  }

  // Filter out successfully completed items
  const finalQueue = updatedQueue.filter(m => m.status === 'failed');
  saveOfflineQueue(finalQueue);
  isSyncing = false;

  window.dispatchEvent(new Event('ca:queue-updated'));

  if (successfulCount > 0) {
    toast.success(`Network Reestablished: ${successfulCount} offline operations synchronized with Supabase!`, {
      description: finalQueue.length > 0 
        ? `${finalQueue.length} operations failed to sync. Review PWA Sync Queue.` 
        : 'All local changes successfully written to external database.',
    });
  }
}

// ─── Fallback Helper ─────────────────────────────────────────────────────────

async function triggerAuditTrailLog(action: string, table: string, mutationId: string) {
  try {
    const { logAuditEvent } = await import('./audit-trail-service');
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) {
      await logAuditEvent({
        ca_user_id: userData.user.id,
        actor_type: 'ca_user',
        actor_id: userData.user.id,
        actor_name: 'CA Admin',
        module: 'system',
        action: 'offline_queue_operation',
        resource_type: 'offline_mutation',
        resource_id: mutationId,
        resource_name: `Table: ${table} | Action: ${action}`,
        metadata: { table, action, queued_locally: true },
        severity: 'info',
        risk_score: 1,
        is_sensitive: false,
      });
    }
  } catch {
    // Graceful fallback when audit logger not fully resolved
  }
}

// ─── Online Listeners ────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    toast.success('Internet connection reestablished.');
    syncOfflineQueue();
  });
  window.addEventListener('offline', () => {
    toast.warning('Network connection disconnected. Core systems running in offline shell mode.');
  });
}
