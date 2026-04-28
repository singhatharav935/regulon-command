import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  loading: false,
  user: null as null | { user_metadata?: { registration_role?: string } },
  roles: [] as string[],
  persona: null as null | "external_ca" | "admin" | "company_owner" | "in_house_ca" | "in_house_lawyer" | "ca_firm",
  isVerified: false,
};

const renderRoleLanding = async () => {
  vi.resetModules();
  vi.stubEnv("VITE_ENABLE_PREVIEW_BYPASS", "true");
  vi.doMock("@/hooks/use-auth", () => ({
    useAuth: () => authState,
  }));

  const { default: RoleLandingRoute } = await import("@/components/auth/RoleLandingRoute");

  render(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route path="/app" element={<RoleLandingRoute />} />
        <Route path="/app/dashboard" element={<div>COMPANY_DASHBOARD</div>} />
        <Route path="/app/admin-dashboard" element={<div>ADMIN_DASHBOARD</div>} />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("RoleLandingRoute preview bypass contract", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.loading = false;
    authState.user = null;
    authState.roles = [];
    authState.persona = null;
    authState.isVerified = false;
  });

  it("routes to company dashboard from local preview persona without login", async () => {
    localStorage.setItem("sannidh:local-preview-auth", JSON.stringify({ persona: "company_owner" }));
    await renderRoleLanding();
    expect(screen.getByText("COMPANY_DASHBOARD")).toBeInTheDocument();
  });

  it("routes to admin dashboard from local preview persona without login", async () => {
    localStorage.setItem("sannidh:local-preview-auth", JSON.stringify({ persona: "admin" }));
    await renderRoleLanding();
    expect(screen.getByText("ADMIN_DASHBOARD")).toBeInTheDocument();
  });
});
