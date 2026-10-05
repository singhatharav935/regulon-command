import { lazy, ComponentType } from "react";

/**
 * Resilient lazy loader for Vite dynamic module imports.
 * Automatically handles stale HMR module cache timestamps and Vite dev server restarts
 * by refreshing the chunk or reloading the browser once instead of throwing
 * 'TypeError: Failed to fetch dynamically imported module'.
 *
 * Also exposes a `.preload()` method so we can warm up the chunk in the background
 * before the user navigates, eliminating the "Loading workspace..." delay.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  const component = lazy(async () => {
    const key = `vite_retry_${window.location.pathname}`;

    try {
      const mod = await componentImport();
      window.sessionStorage.removeItem(key);
      return mod;
    } catch (error) {
      console.warn('[Vite HMR Engine] Dynamic import failed, retrying module load...', error);
      
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const modRetry = await componentImport();
        window.sessionStorage.removeItem(key);
        return modRetry;
      } catch (retryErr) {
        const retryCount = Number(window.sessionStorage.getItem(key) || '0');

        if (retryCount < 2) {
          window.sessionStorage.setItem(key, String(retryCount + 1));
          window.location.reload();
          return new Promise<{ default: T }>((resolve) => {
            setTimeout(resolve, 3000);
          });
        }

        window.sessionStorage.removeItem(key);
        throw retryErr;
      }
    }
  });

  // Attach a preload helper that silently fetches the chunk in the background
  (component as any).preload = () => {
    try { componentImport(); } catch (_) { /* silent — just warming cache */ }
  };

  return component;
}

/**
 * Silently prefetch an array of lazy components after a short idle delay.
 * Call this after the initial page finishes painting so it doesn't compete
 * with the first render.
 */
export function prefetchRoutes(
  routes: Array<ReturnType<typeof lazyWithRetry>>,
  delayMs = 2000
) {
  if (typeof window === "undefined") return;
  const schedule = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, delayMs));
  schedule(() => {
    routes.forEach((r) => {
      try { (r as any).preload?.(); } catch (_) { /* silent */ }
    });
  });
}
