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

// Register PWA Service Worker (Gap 15)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully under scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

