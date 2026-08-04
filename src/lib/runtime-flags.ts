function asTrue(value: unknown): boolean {
  return String(value ?? "").trim().toLowerCase() === "true";
}

// Preview bypass flag for local dev testing
export function isPreviewBypassEnabled(): boolean {
  return Boolean(import.meta.env.DEV && asTrue(import.meta.env.VITE_ENABLE_PREVIEW_BYPASS));
}

export const previewBypassEnabled: boolean = Boolean(
  import.meta.env.DEV && asTrue(import.meta.env.VITE_ENABLE_PREVIEW_BYPASS)
);

export default previewBypassEnabled;
