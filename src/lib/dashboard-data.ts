/**
 * Dashboard Data Loading Utilities
 * 
 * Provides standardized data loading with automatic fallback to demo data
 * when the backend is unavailable. This ensures dashboards always work
 * for demonstration purposes.
 */

import { workspaceBackendRequest } from "@/lib/workspace-backend";

// Demo data for each dashboard type
export const DEMO_DATA = {
  companyDashboard: {
    company: { name: "Demo Company", industry: "Technology", compliance_health: 78 },
    exposures: [
      { regulator: "MCA", status: "compliant", notes: "ROC filings current" },
      { regulator: "GST", status: "compliant", notes: "Monthly returns filed" },
      { regulator: "Income Tax", status: "attention", notes: "TDS pending review" },
      { regulator: "SEBI", status: "compliant", notes: "Annual compliance done" },
      { regulator: "RBI", status: "compliant", notes: "No exposure" },
    ],
    tasks: [
      { id: "t1", title: "File DIR-3 KYC", regulator: "MCA", priority: "high", status: "pending", due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "t2", title: "GST Return GSTR-3B", regulator: "GST", priority: "high", status: "in_progress", due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "t3", title: "TDS Quarterly Return", regulator: "Income Tax", priority: "medium", status: "pending", due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "t4", title: "Annual Return AOC-4", regulator: "MCA", priority: "medium", status: "completed", due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    documents: [
      { id: "d1", name: "Board Resolution.pdf", file_type: "pdf", regulator: "MCA", status: "approved", created_at: new Date().toISOString() },
      { id: "d2", name: "GST Certificate.pdf", file_type: "pdf", regulator: "GST", status: "active", created_at: new Date().toISOString() },
      { id: "d3", name: "PAN Card.pdf", file_type: "pdf", regulator: "Income Tax", status: "active", created_at: new Date().toISOString() },
    ],
    deadlines: [
      { id: "dl1", title: "GSTR-3B Filing", regulator: "GST", due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: true },
      { id: "dl2", title: "TDS Return", regulator: "Income Tax", due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: true },
      { id: "dl3", title: "Annual General Meeting", regulator: "MCA", due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: true },
    ],
    draftRuns: [],
    draftAuditEvents: [],
  },

  caDashboard: {
    clients: [
      { id: "c1", company_name: "Tech Corp Ltd", industry: "Technology", compliance_health: 85, status: "active", tasks_pending: 3 },
      { id: "c2", company_name: "Finance Pro Pvt", industry: "Finance", compliance_health: 72, status: "active", tasks_pending: 5 },
      { id: "c3", company_name: "Retail India Ltd", industry: "Retail", compliance_health: 90, status: "active", tasks_pending: 1 },
    ],
    pendingReviews: [
      { id: "pr1", client: "Tech Corp Ltd", document: "Annual Return", type: "review", due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "pr2", client: "Finance Pro Pvt", document: "GST Reconciliation", type: "approval", due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    stats: {
      totalClients: 12,
      activeFilings: 8,
      completedThisMonth: 24,
      complianceScore: 87,
    },
  },

  adminDashboard: {
    users: [
      { id: "u1", email: "john@example.com", role: "company_owner", status: "active", created_at: new Date().toISOString() },
      { id: "u2", email: "jane@example.com", role: "external_ca", status: "active", created_at: new Date().toISOString() },
      { id: "u3", email: "bob@example.com", role: "in_house_lawyer", status: "pending", created_at: new Date().toISOString() },
    ],
    pendingVerifications: [
      { id: "v1", user_email: "newuser@example.com", persona: "external_ca", submitted_at: new Date().toISOString() },
    ],
    stats: {
      totalUsers: 156,
      activeUsers: 142,
      pendingVerifications: 8,
      companiesOnboarded: 45,
    },
    systemHealth: {
      api: "healthy",
      database: "healthy",
      auth: "healthy",
      storage: "healthy",
    },
  },

  legalDashboard: {
    pendingReviews: [
      { id: "lr1", title: "Contract Review - Tech Corp", type: "contract", priority: "high", status: "pending", submitted_at: new Date().toISOString() },
      { id: "lr2", title: "Draft Validation - GST Filing", type: "filing", priority: "medium", status: "in_review", submitted_at: new Date().toISOString() },
    ],
    citations: [
      { id: "cit1", document: "Annual Compliance Report", citation: "Companies Act 2013, Section 134", status: "validated" },
      { id: "cit2", document: "GST Return Guide", citation: "CGST Act 2017, Section 39", status: "validated" },
    ],
    stats: {
      pendingReviews: 5,
      completedToday: 12,
      averageReviewTime: "2.4 hours",
      accuracyRate: 99.2,
    },
  },

  caFirmDashboard: {
    firm: { name: "Demo CA Firm LLP", registration: "FRN123456", members: 8 },
    members: [
      { id: "m1", name: "Rajesh Kumar", role: "partner", clients_assigned: 15, status: "active" },
      { id: "m2", name: "Priya Sharma", role: "manager", clients_assigned: 22, status: "active" },
      { id: "m3", name: "Amit Patel", role: "analyst", clients_assigned: 8, status: "active" },
    ],
    clients: [
      { id: "fc1", name: "ABC Industries", assigned_to: "Rajesh Kumar", compliance_health: 88 },
      { id: "fc2", name: "XYZ Solutions", assigned_to: "Priya Sharma", compliance_health: 76 },
    ],
    stats: {
      totalClients: 45,
      activeFilings: 32,
      revenueThisMonth: 850000,
      teamUtilization: 78,
    },
  },
};

/**
 * Load dashboard data with automatic fallback to demo data
 */
export async function loadDashboardData<T>(
  endpoint: string,
  demoData: T,
  options?: { throwOnError?: boolean }
): Promise<{ data: T; isDemo: boolean }> {
  try {
    const data = await workspaceBackendRequest<T>(endpoint);
    return { data, isDemo: false };
  } catch (error) {
    if (options?.throwOnError) {
      throw error;
    }
    console.log(`[Dashboard] Using demo data for ${endpoint}:`, error);
    return { data: demoData, isDemo: true };
  }
}

/**
 * Type-safe wrapper for company dashboard
 */
export async function loadCompanyDashboard() {
  return loadDashboardData("/company/dashboard", DEMO_DATA.companyDashboard);
}

/**
 * Type-safe wrapper for CA dashboard
 */
export async function loadCADashboard() {
  return loadDashboardData("/ca/dashboard", DEMO_DATA.caDashboard);
}

/**
 * Type-safe wrapper for Admin dashboard
 */
export async function loadAdminDashboard() {
  return loadDashboardData("/admin/dashboard", DEMO_DATA.adminDashboard);
}

/**
 * Type-safe wrapper for Legal dashboard
 */
export async function loadLegalDashboard() {
  return loadDashboardData("/legal/dashboard", DEMO_DATA.legalDashboard);
}

/**
 * Type-safe wrapper for CA Firm dashboard
 */
export async function loadCAFirmDashboard() {
  return loadDashboardData("/ca-firm/dashboard", DEMO_DATA.caFirmDashboard);
}
