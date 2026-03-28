import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MarketingOptionPage from "./pages/MarketingOptionPage";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleLandingRoute from "./components/auth/RoleLandingRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CADashboard = lazy(() => import("./pages/CADashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AppDashboard = lazy(() => import("./pages/AppDashboard"));
const AppCADashboard = lazy(() => import("./pages/AppCADashboard"));
const AppAdminDashboard = lazy(() => import("./pages/AppAdminDashboard"));
const UniversityDemoDashboard = lazy(() => import("./pages/UniversityDemoDashboard"));
const AppUniversityDashboard = lazy(() => import("./pages/AppUniversityDashboard"));
const AppLegalDashboard = lazy(() => import("./pages/AppLegalDashboard"));
const AppVerification = lazy(() => import("./pages/AppVerification"));
const CAFirmDashboard = lazy(() => import("./pages/CAFirmDashboard"));
const AppCAFirmDashboard = lazy(() => import("./pages/AppCAFirmDashboard"));
const AgentWorkReview = lazy(() => import("./pages/AgentWorkReview"));
const LegalPolicyPage = lazy(() => import("./pages/LegalPolicyPage"));
const ComplianceCenter = lazy(() => import("./pages/ComplianceCenter"));

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/platform" element={<MarketingOptionPage />} />
            <Route path="/platform/how-it-works" element={<MarketingOptionPage />} />
            <Route path="/platform/infrastructure" element={<MarketingOptionPage />} />
            <Route path="/platform/ai-human-review" element={<MarketingOptionPage />} />
            <Route path="/platform/regulators" element={<MarketingOptionPage />} />
            <Route path="/platform/ai-assistant" element={<MarketingOptionPage />} />
            <Route path="/platform/audit" element={<MarketingOptionPage />} />
            <Route path="/solutions/roc" element={<MarketingOptionPage />} />
            <Route path="/solutions/gst" element={<MarketingOptionPage />} />
            <Route path="/solutions/income-tax" element={<MarketingOptionPage />} />
            <Route path="/solutions/labour-law" element={<MarketingOptionPage />} />
            <Route path="/solutions/rbi" element={<MarketingOptionPage />} />
            <Route path="/solutions/sebi" element={<MarketingOptionPage />} />
            <Route path="/solutions/contracts" element={<MarketingOptionPage />} />
            <Route path="/customers" element={<MarketingOptionPage />} />
            <Route path="/security" element={<MarketingOptionPage />} />
            <Route path="/security/data-residency" element={<MarketingOptionPage />} />
            <Route path="/security/encryption-standards" element={<MarketingOptionPage />} />
            <Route path="/security/dpdp-2026" element={<MarketingOptionPage />} />
            <Route path="/security/soc2-type-ii" element={<MarketingOptionPage />} />
            <Route path="/resources" element={<MarketingOptionPage />} />
            <Route path="/about" element={<MarketingOptionPage />} />
            <Route path="/privacy" element={<LegalPolicyPage docKey="privacy_policy" fallbackTitle="Privacy Policy" />} />
            <Route path="/terms" element={<LegalPolicyPage docKey="terms_of_service" fallbackTitle="Terms of Service" />} />
            <Route path="/refund-policy" element={<LegalPolicyPage docKey="refund_policy" fallbackTitle="Refund Policy" />} />
            <Route path="/dpa" element={<LegalPolicyPage docKey="dpa_terms" fallbackTitle="Data Processing Addendum" />} />
            <Route path="/data-retention" element={<LegalPolicyPage docKey="data_retention_policy" fallbackTitle="Data Retention & Deletion Policy" />} />
            <Route path="/compliance" element={<ComplianceCenter />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ca-dashboard" element={<CADashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/university-demo" element={<UniversityDemoDashboard />} />
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
              path="/app/university"
              element={
                <ProtectedRoute allowRoles={["user", "manager", "admin"]}>
                  <AppUniversityDashboard />
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

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
