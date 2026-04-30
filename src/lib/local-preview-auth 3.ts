import type { AppPersona } from "@/hooks/use-auth";

const LOCAL_PREVIEW_AUTH_KEY = "sannidh:local-preview-auth";

type LocalPreviewAuthPayload = {
  persona: AppPersona;
};

const isPersona = (value: unknown): value is AppPersona =>
  value === "external_ca" ||
  value === "admin" ||
  value === "company_owner" ||
  value === "in_house_ca" ||
  value === "in_house_lawyer" ||
  value === "ca_firm";

export const getLocalPreviewPersona = (): AppPersona | null => {
  try {
    const raw = localStorage.getItem(LOCAL_PREVIEW_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalPreviewAuthPayload>;
    return isPersona(parsed.persona) ? parsed.persona : null;
  } catch {
    return null;
  }
};

export const setLocalPreviewPersona = (persona: AppPersona) => {
  const payload: LocalPreviewAuthPayload = { persona };
  localStorage.setItem(LOCAL_PREVIEW_AUTH_KEY, JSON.stringify(payload));
};

export const clearLocalPreviewPersona = () => {
  localStorage.removeItem(LOCAL_PREVIEW_AUTH_KEY);
};

export const personaToFallbackRole = (persona: AppPersona): "user" | "manager" | "admin" => {
  if (persona === "admin") return "admin";
  if (persona === "company_owner") return "user";
  return "manager";
};
