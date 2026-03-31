import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Disclaimers from "./pages/Disclaimers";
import NotFound from "./pages/NotFound";
import MarketingOptionPage from "./pages/MarketingOptionPage";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleLandingRoute from "./components/auth/RoleLandingRoute";
import { PersonaAuthProvider } from "./lib/persona-auth-context";
import { PersonaRoute } from "./components/auth/PersonaRoute";
import { PersonaSelector } from "./components/auth/PersonaSelector";
import { ExternalCADashboard } from "./pages/dashboards/ExternalCADashboard";
import { ExternalCADashboardFull } from "./pages/dashboards/phases/ExternalCADashboardFull";
// import { CAFirmDashboardFull } from "./pages/dashboards/phases/CAFirmDashboardFull";
import { InhouseCADashboard } from "./pages/dashboards/InhouseCADashboard";
import { CAFirmDashboard } from "./pages/dashboards/CAFirmDashboard";
import { LawyerDashboard } from "./pages/dashboards/LawyerDashboard";
import { OwnerDashboard } from "./pages/dashboards/OwnerDashboard";
import { AdminDashboard as PersonaAdminDashboard } from "./pages/dashboards/AdminDashboard";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CADashboard = lazy(() => import("./pages/CADashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AppDashboard = lazy(() => import("./pages/AppDashboard"));
const AppCADashboard = lazy(() => import("./pages/AppCADashboard"));
const AppAdminDashboard = lazy(() => import("./pages/AppAdminDashboard"));
const AppLegalDashboard = lazy(() => import("./pages/AppLegalDashboard"));
const AppVerification = lazy(() => import("./pages/AppVerification"));
const CAFirmDashboard = lazy(() => import("./pages/CAFirmDashboard"));
const AppCAFirmDashboard = lazy(() => import("./pages/AppCAFirmDashboard"));
const AgentWorkReview = lazy(() => import("./pages/AgentWorkReview"));
const LegalPolicyPage = lazy(() => import("./pages/LegalPolicyPage"));
const ComplianceCenter = lazy(() => import("./pages/ComplianceCenter"));
const AdvancedPlatformPage = lazy(() => import("./pages/AdvancedPlatformPage"));
const AdvancedSolutionsPage = lazy(() => import("./pages/AdvancedSolutionsPage"));
const AdvancedSecurityPage = lazy(() => import("./pages/AdvancedSecurityPage"));
const AdvancedCustomersPage = lazy(() => import("./pages/AdvancedCustomersPage"));
const AdvancedResourcesPage = lazy(() => import("./pages/AdvancedResourcesPage"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-muted-foreground">Loading workspace...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PersonaAuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/platform" element={<AdvancedPlatformPage />} />
            <Route path="/platform/how-it-works" element={<AdvancedPlatformPage />} />
            <Route path="/platform/infrastructure" element={<AdvancedPlatformPage />} />
            <Route path="/platform/ai-human-review" element={<AdvancedPlatformPage />} />
            <Route path="/platform/regulators" element={<AdvancedPlatformPage />} />
            <Route path="/platform/ai-assistant" element={<AdvancedPlatformPage />} />
            <Route path="/platform/audit" element={<AdvancedPlatformPage />} />
            <Route path="/solutions" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/roc" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/gst" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/income-tax" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/labour-law" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/rbi" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/sebi" element={<AdvancedSolutionsPage />} />
            <Route path="/solutions/contracts" element={<AdvancedSolutionsPage />} />
            <Route path="/customers" element={<AdvancedCustomersPage />} />
            <Route path="/security" element={<AdvancedSecurityPage />} />
            <Route path="/security/data-residency" element={<AdvancedSecurityPage />} />
            <Route path="/security/encryption-standards" element={<AdvancedSecurityPage />} />
            <Route path="/security/dpdp-2026" element={<AdvancedSecurityPage />} />
            <Route path="/security/soc2-type-ii" element={<AdvancedSecurityPage />} />
            <Route path="/resources" element={<AdvancedResourcesPage />} />
            <Route path="/about" element={<MarketingOptionPage />} />
            <Route path="/privacy" element={<LegalPolicyPage docKey="privacy_policy" fallbackTitle="Privacy Policy" />} />
            <Route path="/terms" element={<LegalPolicyPage docKey="terms_of_service" fallbackTitle="Terms of Service" />} />
            <Route path="/refund-policy" element={<LegalPolicyPage docKey="refund_policy" fallbackTitle="Refund Policy" />} />
            <Route path="/dpa" element={<LegalPolicyPage docKey="dpa_terms" fallbackTitle="Data Processing Addendum" />} />
            <Route path="/data-retention" element={<LegalPolicyPage docKey="data_retention_policy" fallbackTitle="Data Retention & Deletion Policy" />} />
            <Route path="/compliance" element={<ComplianceCenter />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/disclaimers" element={<Disclaimers />} />
            <Route path="/persona-selector" element={<PersonaSelector />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ca-dashboard" element={<CADashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/ca-firm-dashboard" element={<CAFirmDashboard />} />
            <Route path="/agent-work-review" element={<AgentWorkReview />} />

            <Route path="/app" element={<RoleLandingRoute />} />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute
                  allowRoles={["user", "manager", "admin"]}
                  allowPersonas={["company_owner", "admin"]}
                >
                  <AppDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ca-dashboard"
              element={
                <ProtectedRoute
                  allowRoles={["manager", "admin"]}
                  allowPersonas={["external_ca", "in_house_ca", "admin"]}
                >
                  <AppCADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin-dashboard"
              element={
                <ProtectedRoute allowRoles={["admin"]} allowPersonas={["admin"]}>
                  <AppAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/legal-dashboard"
              element={
                <ProtectedRoute
                  allowRoles={["manager", "admin"]}
                  allowPersonas={["in_house_lawyer", "admin"]}
                >
                  <AppLegalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ca-firm-dashboard"
              element={
                <ProtectedRoute
                  allowRoles={["manager", "admin"]}
                  allowPersonas={["ca_firm", "admin"]}
                >
                  <AppCAFirmDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/verification"
              element={
                <ProtectedRoute
                  allowRoles={["user", "manager", "admin"]}
                  allowPersonas={["company_owner", "external_ca", "in_house_ca", "in_house_lawyer", "admin", "ca_firm"]}
                  requireVerified={false}
                >
                  <AppVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/agent-work-review"
              element={
                <ProtectedRoute
                  allowRoles={["user", "manager", "admin"]}
                  allowPersonas={["company_owner", "external_ca", "in_house_ca", "in_house_lawyer", "admin", "ca_firm"]}
                  requireVerified={false}
                >
                  <AgentWorkReview />
                </ProtectedRoute>
              }
            />

                        {/* New Persona Dashboards - Phase 1-2 */}
            <Route
              path="/dashboards/external-ca"
              element={
                <PersonaRoute allowedPersonas={["external_ca"]}>
                  <ExternalCADashboard />
                </PersonaRoute>
              }
            />
            {/* Phase 3: Full External CA Dashboard with all features */}
            <Route
              path="/dashboards/external-ca/full"
              element={
                <PersonaRoute allowedPersonas={["external_ca"]}>
                  <ExternalCADashboardFull />
                </PersonaRoute>
              }
            />
            <Route
              path="/dashboards/inhouse-ca"
              element={
                <PersonaRoute allowedPersonas={["inhouse_ca"]}>
                  <InhouseCADashboard />
                </PersonaRoute>
              }
            />
            <Route
              path="/dashboards/ca-firm"
              element={
                <PersonaRoute allowedPersonas={["ca_firm"]}>
                  <CAFirmDashboard />
                </PersonaRoute>
              }
            />
            {/* Phase 3: Full CA Firm Dashboard (coming soon) */}
            {/* <Route
              path="/dashboards/ca-firm/full"
              element={
                <PersonaRoute allowedPersonas={["ca_firm"]}>
                  <CAFirmDashboardFull />
                </PersonaRoute>
              }
            /> */}
            <Route
              path="/dashboards/lawyer"
              element={
                <PersonaRoute allowedPersonas={["inhouse_lawyer"]}>
                  <LawyerDashboard />
                </PersonaRoute>
              }
            />
            <Route
              path="/dashboards/owner"
              element={
                <PersonaRoute allowedPersonas={["company_owner"]}>
                  <OwnerDashboard />
                </PersonaRoute>
              }
            />
            <Route
              path="/dashboards/admin"
              element={
                <PersonaRoute allowedPersonas={["admin"]}>
                  <PersonaAdminDashboard />
                </PersonaRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </PersonaAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
