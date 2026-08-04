import type { AppPersona } from "@/hooks/use-auth";

const LOCAL_PREVIEW_AUTH_KEY = "sannidh:local-preview-auth";

type LocalPreviewAuthPayload = {
  persona: AppPersona;
};

function isPersona(value: unknown): value is AppPersona {
  return (
    value === "external_ca" ||
    value === "admin" ||
    value === "company_owner" ||
    value === "in_house_ca" ||
    value === "in_house_lawyer" ||
    value === "ca_firm"
  );
}

export function getLocalPreviewPersona(): AppPersona | null {
  try {
    const raw = localStorage.getItem(LOCAL_PREVIEW_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalPreviewAuthPayload>;
    return isPersona(parsed.persona) ? parsed.persona : null;
  } catch {
    return null;
  }
}

export function setLocalPreviewPersona(persona: AppPersona): void {
  const payload: LocalPreviewAuthPayload = { persona };
  localStorage.setItem(LOCAL_PREVIEW_AUTH_KEY, JSON.stringify(payload));
}

export function clearLocalPreviewPersona(): void {
  localStorage.removeItem(LOCAL_PREVIEW_AUTH_KEY);
}

export function personaToFallbackRole(persona: AppPersona): "user" | "manager" | "admin" {
  if (persona === "admin") return "admin";
  if (persona === "company_owner") return "user";
  return "manager";
}
