import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLocalPreviewPersona,
  getLocalPreviewPersona,
  personaToFallbackRole,
  setLocalPreviewPersona,
} from "@/lib/local-preview-auth";

describe("local preview auth contract", () => {
  beforeEach(() => {
    clearLocalPreviewPersona();
  });

  it("stores and restores local preview persona", () => {
    setLocalPreviewPersona("ca_firm");
    expect(getLocalPreviewPersona()).toBe("ca_firm");
  });

  it("maps persona to fallback app role", () => {
    expect(personaToFallbackRole("company_owner")).toBe("user");
    expect(personaToFallbackRole("admin")).toBe("admin");
    expect(personaToFallbackRole("in_house_lawyer")).toBe("manager");
  });
});
