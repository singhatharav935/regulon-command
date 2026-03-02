import { createRoot } from "react-dom/client";
import "./index.css";

let appMounted = false;
const APP_BOOTSTRAP_RETRY_KEY = "regulon-bootstrap-retry";

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

const shouldAttemptBootstrapRetry = (errorText: string) => {
  if (!/failed to fetch dynamically imported module/i.test(errorText)) return false;

  try {
    const match = errorText.match(/https?:\/\/[^/\s]+/i);
    const failedOrigin = match?.[0] ?? "";
    if (!failedOrigin) return false;
    if (failedOrigin === window.location.origin) return false;
  } catch {
    return false;
  }

  const alreadyRetried = sessionStorage.getItem(APP_BOOTSTRAP_RETRY_KEY) === "1";
  return !alreadyRetried;
};

const retryBootstrap = () => {
  sessionStorage.setItem(APP_BOOTSTRAP_RETRY_KEY, "1");
  const retryUrl = `${window.location.origin}${window.location.pathname}?v=${Date.now()}`;
  window.location.replace(retryUrl);
};

window.addEventListener("error", (event) => {
  console.error("[REGULON] Uncaught startup error", event.error || event.message);
  if (!appMounted) {
    renderFatal("Unhandled runtime error.", String(event.error || event.message || ""));
  }
});

const isBenignAbort = (reason: unknown) => {
  const message = String(reason ?? "").toLowerCase();
  if (message.includes("aborterror")) return true;
  if (message.includes("signal is aborted")) return true;
  if (message.includes("the operation was aborted")) return true;
  if (message.includes("request was aborted")) return true;
  return false;
};

window.addEventListener("unhandledrejection", (event) => {
  if (isBenignAbort(event.reason)) {
    console.warn("[REGULON] Ignored benign aborted promise.", event.reason);
    return;
  }

  console.error("[REGULON] Unhandled promise rejection", event.reason);
  if (!appMounted) {
    renderFatal("Unhandled promise rejection.", String(event.reason || ""));
  }
});

const bootstrap = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element '#root' not found.");
  }

  import("./App.tsx")
    .then(async ({ default: App }) => {
      const { default: StartupErrorBoundary } = await import("./components/system/StartupErrorBoundary.tsx");

      createRoot(rootElement).render(
        <StartupErrorBoundary>
          <App />
        </StartupErrorBoundary>
      );
      appMounted = true;
      sessionStorage.removeItem(APP_BOOTSTRAP_RETRY_KEY);
    })
    .catch((error) => {
      const errorText = String(error ?? "");
      if (shouldAttemptBootstrapRetry(errorText)) {
        console.warn("[REGULON] Retrying bootstrap after stale module origin error.", errorText);
        retryBootstrap();
        return;
      }

    console.error("[REGULON] Fatal bootstrap failure.", error);
      renderFatal("App failed during bootstrap.", errorText);
    });
};

bootstrap();
