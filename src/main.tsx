import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import StartupErrorBoundary from "./components/system/StartupErrorBoundary.tsx";

const pathname = window.location.pathname;
if (
  pathname === "/university-demo" ||
  pathname === "/university-demo/" ||
  pathname.startsWith("/university-demo/")
) {
  window.history.replaceState(null, "", `/app/university${window.location.search}${window.location.hash}`);
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' not found.");
}

createRoot(rootElement).render(
  <StartupErrorBoundary>
    <App />
  </StartupErrorBoundary>
);
