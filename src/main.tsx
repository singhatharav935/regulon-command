import { createRoot } from "react-dom/client";
import "./index.css";

const renderFatal = (message: string, detail?: string) => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  rootElement.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#040b1a;color:#e5eefc;font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:980px;width:100%;border:1px solid #1f355d;border-radius:12px;padding:20px;background:#07122a;">
        <h1 style="margin:0 0 10px 0;font-size:20px;">REGULON startup error</h1>
        <p style="margin:0 0 12px 0;color:#9eb2d9;">${message}</p>
        ${
          detail
            ? `<pre style="white-space:pre-wrap;word-break:break-word;margin:0;padding:12px;background:#030917;border-radius:8px;border:1px solid #1a2a49;color:#9ce9ff;font-size:12px;line-height:1.5;max-height:50vh;overflow:auto;">${detail}</pre>`
            : ""
        }
      </div>
    </div>
  `;
};

window.addEventListener("error", (event) => {
  console.error("[REGULON] Uncaught startup error", event.error || event.message);
  renderFatal("Unhandled runtime error.", String(event.error || event.message || ""));
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[REGULON] Unhandled promise rejection", event.reason);
  renderFatal("Unhandled promise rejection.", String(event.reason || ""));
});

const bootstrap = async () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element '#root' not found.");
  }

  try {
    const [{ default: App }, { default: StartupErrorBoundary }] = await Promise.all([
      import("./App.tsx"),
      import("./components/system/StartupErrorBoundary.tsx"),
    ]);

    createRoot(rootElement).render(
      <StartupErrorBoundary>
        <App />
      </StartupErrorBoundary>
    );
  } catch (error) {
    console.error("[REGULON] Fatal bootstrap failure.", error);
    renderFatal("App failed during bootstrap.", String(error));
  }
};

bootstrap();
