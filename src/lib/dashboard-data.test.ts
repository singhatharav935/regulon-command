import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEMO_DATA, loadDashboardData } from "./dashboard-data";

// Mock workspace-backend
vi.mock("@/lib/workspace-backend", () => ({
  workspaceBackendRequest: vi.fn(),
}));

import { workspaceBackendRequest } from "@/lib/workspace-backend";

describe("dashboard-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DEMO_DATA", () => {
    it("should have company dashboard demo data", () => {
      expect(DEMO_DATA.companyDashboard).toBeDefined();
      expect(DEMO_DATA.companyDashboard.company).toBeDefined();
      expect(DEMO_DATA.companyDashboard.company.name).toBe("Demo Company");
      expect(DEMO_DATA.companyDashboard.exposures).toBeInstanceOf(Array);
      expect(DEMO_DATA.companyDashboard.tasks).toBeInstanceOf(Array);
    });

    it("should have CA dashboard demo data", () => {
      expect(DEMO_DATA.caDashboard).toBeDefined();
      expect(DEMO_DATA.caDashboard.clients).toBeInstanceOf(Array);
      expect(DEMO_DATA.caDashboard.stats).toBeDefined();
    });

    it("should have admin dashboard demo data", () => {
      expect(DEMO_DATA.adminDashboard).toBeDefined();
      expect(DEMO_DATA.adminDashboard.users).toBeInstanceOf(Array);
      expect(DEMO_DATA.adminDashboard.systemHealth).toBeDefined();
    });

    it("should have legal dashboard demo data", () => {
      expect(DEMO_DATA.legalDashboard).toBeDefined();
      expect(DEMO_DATA.legalDashboard.pendingReviews).toBeInstanceOf(Array);
      expect(DEMO_DATA.legalDashboard.citations).toBeInstanceOf(Array);
    });

    it("should have CA firm dashboard demo data", () => {
      expect(DEMO_DATA.caFirmDashboard).toBeDefined();
      expect(DEMO_DATA.caFirmDashboard.firm).toBeDefined();
      expect(DEMO_DATA.caFirmDashboard.members).toBeInstanceOf(Array);
    });
  });

  describe("loadDashboardData", () => {
    it("should return real data when backend succeeds", async () => {
      const realData = { company: { name: "Real Company" } };
      (workspaceBackendRequest as ReturnType<typeof vi.fn>).mockResolvedValue(realData);

      const result = await loadDashboardData("/company/dashboard", DEMO_DATA.companyDashboard);

      expect(result.data).toEqual(realData);
      expect(result.isDemo).toBe(false);
    });

    it("should return demo data when backend fails", async () => {
      (workspaceBackendRequest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const result = await loadDashboardData("/company/dashboard", DEMO_DATA.companyDashboard);

      expect(result.data).toEqual(DEMO_DATA.companyDashboard);
      expect(result.isDemo).toBe(true);
    });

    it("should throw error when throwOnError is true", async () => {
      (workspaceBackendRequest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      await expect(
        loadDashboardData("/company/dashboard", DEMO_DATA.companyDashboard, { throwOnError: true })
      ).rejects.toThrow("Network error");
    });
  });
});
