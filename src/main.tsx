import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import StartupErrorBoundary from "./components/system/StartupErrorBoundary.tsx";
import { initSentry } from "./lib/sentry.tsx";

// Initialize error tracking before React renders
initSentry();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' not found.");
}

createRoot(rootElement).render(
  <StartupErrorBoundary>
    <App />
  </StartupErrorBoundary>
);

// Register PWA Service Worker (Only in Production mode)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully under scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });
    });
  } else {
    // In development mode, unregister any active service worker to prevent dev server interference
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('[PWA] Unregistered Service Worker for Development');
      }
    });
  }
}

