import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const authState = {
  loading: false,
  user: { id: "user-1" },
  roles: [] as string[],
  persona: null as "external_ca" | "admin" | "company_owner" | "in_house_ca" | "in_house_lawyer" | "ca_firm" | null,
  isVerified: false,
  session: null,
  primaryRole: null,
  verificationStatus: null,
};

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
}));

const renderProtected = (element: ReactElement) => {
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/app" element={<div>APP_HOME</div>} />
        <Route path="/app/verification" element={<div>VERIFICATION_PAGE</div>} />
        <Route path="/app/dashboard" element={<div>DASHBOARD_PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ProtectedRoute contract", () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = { id: "user-1" };
    authState.roles = [];
    authState.persona = null;
    authState.isVerified = false;
    authState.session = null;
    authState.primaryRole = null;
    authState.verificationStatus = null;
  });

  it("redirects to auth when user is not authenticated", () => {
    authState.user = null;

    renderProtected(
      <ProtectedRoute>
        <div>PROTECTED_CONTENT</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
  });

  it("allows allowed persona through to protected content", () => {
    authState.persona = "company_owner";
    authState.isVerified = true;

    renderProtected(
      <ProtectedRoute allowPersonas={["company_owner"]}>
        <div>PROTECTED_CONTENT</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("PROTECTED_CONTENT")).toBeInTheDocument();
  });

  it("redirects to app root for disallowed persona", () => {
    authState.persona = "in_house_lawyer";
    authState.isVerified = true;

    renderProtected(
      <ProtectedRoute allowPersonas={["company_owner"]}>
        <div>PROTECTED_CONTENT</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("APP_HOME")).toBeInTheDocument();
  });

  it("redirects unverified required personas to verification page", () => {
    authState.persona = "external_ca";
    authState.isVerified = false;

    renderProtected(
      <ProtectedRoute allowPersonas={["external_ca"]} requireVerified>
        <div>PROTECTED_CONTENT</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("VERIFICATION_PAGE")).toBeInTheDocument();
  });

  it("allows unverified persona when requireVerified is false", () => {
    authState.persona = "external_ca";
    authState.isVerified = false;

    renderProtected(
      <ProtectedRoute allowPersonas={["external_ca"]} requireVerified={false}>
        <div>PROTECTED_CONTENT</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("PROTECTED_CONTENT")).toBeInTheDocument();
  });
});
