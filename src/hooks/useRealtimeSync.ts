/**
 * useRealtimeSync — Cross-device data synchronization hook.
 *
 * Keeps the dashboard fresh by re-invoking a callback when data may have
 * changed. Uses a lightweight polling + browser-event strategy:
 *
 *   1. Polls every 30 seconds while the tab is visible.
 *   2. Instantly refetches when the user returns to the tab (visibilitychange).
 *   3. Instantly refetches when the window regains focus.
 *   4. Refetches when the browser comes back online.
 *
 * This replaces the previous Supabase Realtime WebSocket approach, which
 * produced 406/400 console errors when tables don't have Realtime enabled
 * in the Supabase dashboard. Polling is equally effective for this dashboard's
 * update cadence and produces zero console errors.
 */

import { useEffect, useRef, useCallback } from 'react';

/** How often to poll while the tab is visible (ms). */
const POLL_INTERVAL_MS = 30_000;

export function useRealtimeSync(onDataChange: () => void) {
  const callbackRef = useRef(onDataChange);
  callbackRef.current = onDataChange;

  // Debounce rapid-fire triggers (e.g. focus + visibility firing together)
  const lastFiredRef = useRef(0);
  const debounce = useCallback(() => {
    const now = Date.now();
    if (now - lastFiredRef.current < 2_000) return; // skip if fired < 2s ago
    lastFiredRef.current = now;
    callbackRef.current();
  }, []);

  useEffect(() => {
    // --- 1. Interval polling (only while tab is visible) ---
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          debounce();
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPolling();

    // --- 2. Visibility change (user switches back to this tab) ---
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        debounce();
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // --- 3. Window focus ---
    const onFocus = () => debounce();
    window.addEventListener('focus', onFocus);

    // --- 4. Online event (reconnecting after offline) ---
    const onOnline = () => debounce();
    window.addEventListener('online', onOnline);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [debounce]);
}

export default useRealtimeSync;
