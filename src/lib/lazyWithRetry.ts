import { lazy, ComponentType } from "react";

/**
 * Resilient lazy loader for Vite dynamic module imports.
 * Automatically handles stale HMR module cache timestamps and Vite dev server restarts
 * by refreshing the chunk or reloading the browser once instead of throwing
 * 'TypeError: Failed to fetch dynamically imported module'.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const key = `vite_retry_${window.location.pathname}`;

    try {
      const component = await componentImport();
      window.sessionStorage.removeItem(key);
      return component;
    } catch (error) {
      console.warn('[Vite HMR Engine] Dynamic import failed, auto-refreshing module bundle...', error);
      const retryCount = Number(window.sessionStorage.getItem(key) || '0');

      if (retryCount < 2) {
        window.sessionStorage.setItem(key, String(retryCount + 1));
        // Hard refresh browser location to bust Vite dev server stale timestamp cache
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      // Reset retry count for future navigations
      window.sessionStorage.removeItem(key);
      throw error;
    }
  });
}
