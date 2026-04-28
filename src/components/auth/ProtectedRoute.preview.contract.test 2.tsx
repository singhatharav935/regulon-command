import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  loading: false,
  user: null as null | { user_metadata?: { registration_role?: string } },
  roles: [] as string[],
  persona: null as null | "external_ca" | "admin" | "company_owner" | "in_house_ca" | "in_house_lawyer" | "ca_firm",
  isVerified: false,
  session: null,
  primaryRole: null,
  verificationStatus: null,
};

const renderProtected = async () => {
  vi.resetModules();
  vi.stubEnv("VITE_ENABLE_PREVIEW_BYPASS", "true");
  vi.doMock("@/hooks/use-auth", () => ({
    useAuth: () => authState,
  }));

  const { default: ProtectedRoute } = await import("@/components/auth/ProtectedRoute");

  render(
    <MemoryRouter initialEntries={["/app/legal-dashboard"]}>
      <Routes>
        <Route
          path="/app/legal-dashboard"
          element={(
            <ProtectedRoute allowPersonas={["in_house_lawyer"]}>
              <div>LEGAL_DASHBOARD</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/app" element={<div>APP_HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ProtectedRoute preview bypass contract", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.loading = false;
    authState.user = null;
    authState.roles = [];
    authState.persona = null;
    authState.isVerified = false;
  });

  it("allows persona-protected route with local preview persona and no auth session", async () => {
    localStorage.setItem("sannidh:local-preview-auth", JSON.stringify({ persona: "in_house_lawyer" }));
    await renderProtected();
    expect(screen.getByText("LEGAL_DASHBOARD")).toBeInTheDocument();
  });
});
