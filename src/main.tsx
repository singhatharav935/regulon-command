import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import StartupErrorBoundary from "./components/system/StartupErrorBoundary.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' not found.");
}

try {
  createRoot(rootElement).render(
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  );
} catch (error) {
  console.error("[REGULON] Fatal bootstrap failure.", error);
  rootElement.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#040b1a;color:#e5eefc;font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:860px;width:100%;border:1px solid #1f355d;border-radius:12px;padding:20px;background:#07122a;">
        <h1 style="margin:0 0 10px 0;font-size:20px;">REGULON bootstrap error</h1>
        <p style="margin:0;color:#9eb2d9;">Open browser console and share the error logs.</p>
      </div>
    </div>
  `;
}
