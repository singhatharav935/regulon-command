const asTrue = (value: unknown) => String(value ?? "").trim().toLowerCase() === "true";

// Preview bypass must never be enabled in production builds.
export const previewBypassEnabled = import.meta.env.DEV && asTrue(import.meta.env.VITE_ENABLE_PREVIEW_BYPASS);
