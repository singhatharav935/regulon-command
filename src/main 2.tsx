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
