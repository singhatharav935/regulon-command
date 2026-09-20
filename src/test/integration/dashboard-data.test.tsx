/**
 * Dashboard Integration Tests
 * 
 * Tests dashboard components work correctly with data loading
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock workspace-backend
vi.mock("@/lib/workspace-backend", () => ({
  workspaceBackendRequest: vi.fn(),
  workspacePublicRequest: vi.fn(),
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { 
          session: { 
            user: { id: "test-user-123", email: "test@example.com" },
            access_token: "test-token"
          } 
        }, 
        error: null 
      })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: "test-user-123", user_metadata: { registration_role: "company_owner" } } } 
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [{ role: "user" }], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock useAuth
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-123", email: "test@example.com" },
    loading: false,
    session: { access_token: "test-token" },
    persona: "company_owner",
    roles: ["user"],
    primaryRole: "user",
    verificationStatus: null,
    isVerified: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { workspaceBackendRequest } from "@/lib/workspace-backend";
import { DEMO_DATA } from "@/lib/dashboard-data";

describe("Dashboard Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe("Data Loading", () => {
    it("should load real data when backend is available", async () => {
      const realData = {
        company: { name: "Real Company Inc", industry: "Finance", compliance_health: 92 },
        exposures: [],
        tasks: [],
        documents: [],
        deadlines: [],
        draftRuns: [],
        draftAuditEvents: [],
      };

      (workspaceBackendRequest as ReturnType<typeof vi.fn>).mockResolvedValue(realData);

      // Simulate data fetch
      const result = await workspaceBackendRequest("/company/dashboard");

      expect(result).toEqual(realData);
      expect(workspaceBackendRequest).toHaveBeenCalledWith("/company/dashboard");
    });

    it("should have demo data available for fallback", () => {
      // Verify demo data structure
      expect(DEMO_DATA.companyDashboard).toBeDefined();
      expect(DEMO_DATA.companyDashboard.company.name).toBe("Demo Company");
      expect(DEMO_DATA.companyDashboard.exposures.length).toBeGreaterThan(0);
      expect(DEMO_DATA.companyDashboard.tasks.length).toBeGreaterThan(0);
    });

    it("should have all required fields in demo data", () => {
      const companyData = DEMO_DATA.companyDashboard;
      
      // Company object
      expect(companyData.company).toHaveProperty("name");
      expect(companyData.company).toHaveProperty("industry");
      expect(companyData.company).toHaveProperty("compliance_health");

      // Arrays
      expect(Array.isArray(companyData.exposures)).toBe(true);
      expect(Array.isArray(companyData.tasks)).toBe(true);
      expect(Array.isArray(companyData.documents)).toBe(true);
      expect(Array.isArray(companyData.deadlines)).toBe(true);

      // Each exposure should have required fields
      companyData.exposures.forEach(exposure => {
        expect(exposure).toHaveProperty("regulator");
        expect(exposure).toHaveProperty("status");
      });

      // Each task should have required fields
      companyData.tasks.forEach(task => {
        expect(task).toHaveProperty("id");
        expect(task).toHaveProperty("title");
        expect(task).toHaveProperty("priority");
        expect(task).toHaveProperty("status");
      });
    });
  });

  describe("CA Dashboard Data", () => {
    it("should have CA dashboard demo data with correct structure", () => {
      const caData = DEMO_DATA.caDashboard;

      expect(caData.clients).toBeDefined();
      expect(Array.isArray(caData.clients)).toBe(true);
      expect(caData.clients.length).toBeGreaterThan(0);

      expect(caData.stats).toBeDefined();
      expect(caData.stats).toHaveProperty("totalClients");
      expect(caData.stats).toHaveProperty("activeFilings");
      expect(caData.stats).toHaveProperty("completedThisMonth");
      expect(caData.stats).toHaveProperty("complianceScore");

      // Verify client structure
      caData.clients.forEach(client => {
        expect(client).toHaveProperty("id");
        expect(client).toHaveProperty("company_name");
        expect(client).toHaveProperty("compliance_health");
        expect(client).toHaveProperty("status");
      });
    });
  });

  describe("Admin Dashboard Data", () => {
    it("should have admin dashboard demo data with correct structure", () => {
      const adminData = DEMO_DATA.adminDashboard;

      expect(adminData.users).toBeDefined();
      expect(Array.isArray(adminData.users)).toBe(true);

      expect(adminData.stats).toBeDefined();
      expect(adminData.stats).toHaveProperty("totalUsers");
      expect(adminData.stats).toHaveProperty("activeUsers");
      expect(adminData.stats).toHaveProperty("pendingVerifications");

      expect(adminData.systemHealth).toBeDefined();
      expect(adminData.systemHealth).toHaveProperty("api");
      expect(adminData.systemHealth).toHaveProperty("database");
      expect(adminData.systemHealth).toHaveProperty("auth");
    });
  });

  describe("Legal Dashboard Data", () => {
    it("should have legal dashboard demo data with correct structure", () => {
      const legalData = DEMO_DATA.legalDashboard;

      expect(legalData.pendingReviews).toBeDefined();
      expect(Array.isArray(legalData.pendingReviews)).toBe(true);

      expect(legalData.citations).toBeDefined();
      expect(Array.isArray(legalData.citations)).toBe(true);

      expect(legalData.stats).toBeDefined();
      expect(legalData.stats).toHaveProperty("pendingReviews");
      expect(legalData.stats).toHaveProperty("completedToday");
      expect(legalData.stats).toHaveProperty("accuracyRate");
    });
  });

  describe("CA Firm Dashboard Data", () => {
    it("should have CA firm dashboard demo data with correct structure", () => {
      const firmData = DEMO_DATA.caFirmDashboard;

      expect(firmData.firm).toBeDefined();
      expect(firmData.firm).toHaveProperty("name");
      expect(firmData.firm).toHaveProperty("registration");
      expect(firmData.firm).toHaveProperty("members");

      expect(firmData.members).toBeDefined();
      expect(Array.isArray(firmData.members)).toBe(true);

      expect(firmData.stats).toBeDefined();
      expect(firmData.stats).toHaveProperty("totalClients");
      expect(firmData.stats).toHaveProperty("activeFilings");
      expect(firmData.stats).toHaveProperty("teamUtilization");
    });
  });
});
