import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CAAgentProvider } from "./components/agents/CAAgentOrchestrator";
const Index = lazy(() => import("./pages/Index"));
const AuthReal = lazy(() => import("./pages/Auth-Real-Enhanced"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettings"));
const UserOnboardingFlow = lazy(() => import("./components/auth/UserOnboardingFlow").then(module => ({ default: module.UserOnboardingFlow })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Disclaimers = lazy(() => import("./pages/Disclaimers"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ComplianceCenterStandalone = lazy(() => import("./pages/ComplianceCenterStandalone"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MarketingOptionPage = lazy(() => import("./pages/MarketingOptionPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

// Dashboards & Personas
const RoleLandingRoute = lazy(() => import("./components/auth/RoleLandingRoute"));
const PersonaSelector = lazy(() => import("./components/auth/PersonaSelector").then(module => ({ default: module.PersonaSelector })));
const ExternalCADashboardFull = lazy(() => import("./pages/dashboards/phases/ExternalCADashboardFull").then(module => ({ default: module.ExternalCADashboardFull })));
const InhouseCADashboard = lazy(() => import("./pages/dashboards/InhouseCADashboard").then(module => ({ default: module.InhouseCADashboard })));
const CAFirmDashboardReal = lazy(() => import("./pages/dashboards/CAFirmDashboardReal").then(module => ({ default: module.CAFirmDashboardReal })));
const LawyerDashboard = lazy(() => import("./pages/dashboards/LawyerDashboard").then(module => ({ default: module.LawyerDashboard })));
const InhouseLawyerDashboardReal = lazy(() => import("./pages/dashboards/InhouseLawyerDashboardReal").then(module => ({ default: module.InhouseLawyerDashboardReal })));
const OwnerDashboard = lazy(() => import("./pages/dashboards/OwnerDashboard").then(module => ({ default: module.OwnerDashboard })));
const PersonaAdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard").then(module => ({ default: module.AdminDashboard })));

// Contexts & Route Utilities (Eagerly loaded)
import { AuthProvider } from "./hooks/use-auth";
import { EnhancedAuthProvider } from "./lib/enhanced-auth-context";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PersonaAuthProvider } from "./lib/persona-auth-context";
import { PersonaRoute } from "./components/auth/PersonaRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CADashboard = lazy(() => import("./pages/CADashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EFilingAckPdfViewer = lazy(() => import("./pages/EFilingAckPdfViewer"));
const PaymentChallanPdfViewer = lazy(() => import("./pages/PaymentChallanPdfViewer"));
// const AppDashboard = lazy(() => import("./pages/AppDashboard")); // Removed - use demo dashboards
// const AppCADashboard = lazy(() => import("./pages/AppCADashboard")); // Removed - use demo dashboards
// const AppAdminDashboard = lazy(() => import("./pages/AppAdminDashboard")); // Removed - use demo dashboards
// const AppLegalDashboard = lazy(() => import("./pages/AppLegalDashboard")); // Removed - use demo dashboards
const AppVerification = lazy(() => import("./pages/AppVerification"));
const CAFirmDashboard = lazy(() => import("./pages/CAFirmDashboard"));
// const AppCAFirmDashboard = lazy(() => import("./pages/AppCAFirmDashboard")); // Removed - use demo dashboards
// const RealCADashboard = lazy(() => import("./pages/RealCADashboard")); // Removed - use demo dashboards
const ExternalCADashboardReal = lazy(() => import("./pages/ExternalCADashboardReal")); // REAL External CA Dashboard
const CompanyDashboardReal = lazy(() => import("./pages/CompanyDashboardReal")); // REAL Company Owner Dashboard
const InhouseCADashboardReal = lazy(() => import("./pages/InhouseCADashboardReal")); // REAL In-House CA Dashboard
const AgentControlCenter = lazy(() => import("./pages/AgentControlCenter")); // CA Agent Control Center Settings
const CompanyAgentControlCenter = lazy(() => import("./pages/CompanyAgentControlCenter")); // Company Agent Control Center Settings
const AgentWorkReview = lazy(() => import("./pages/AgentWorkReview"));
const LegalPolicyPage = lazy(() => import("./pages/LegalPolicyPage"));
const ComplianceCenter = lazy(() => import("./pages/ComplianceCenter"));
const AdvancedPlatformPage = lazy(() => import("./pages/AdvancedPlatformPage"));
const AdvancedSolutionsPage = lazy(() => import("./pages/AdvancedSolutionsPage"));
const AdvancedSecurityPage = lazy(() => import("./pages/AdvancedSecurityPage"));
const AdvancedCustomersPage = lazy(() => import("./pages/AdvancedCustomersPage"));
const SovereignInfrastructurePage = lazy(() => import("./pages/SovereignInfrastructurePage"));
const AgenticExecutionModelPage = lazy(() => import("./pages/AgenticExecutionModelPage"));
const ComplianceCommandCenterPage = lazy(() => import("./pages/ComplianceCommandCenterPage"));
const Nexus9DraftingEnginePage = lazy(() => import("./pages/Nexus9DraftingEnginePage"));

const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const ConsentApprovalPage = lazy(() => import("./pages/ConsentApprovalPage")); // Public — CA client consent

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
      <LanguageProvider>
        <EnhancedAuthProvider>
          <PersonaAuthProvider>
          <CAAgentProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/platform" element={<ComplianceCommandCenterPage />} />
            <Route path="/platform/compliance-command-center" element={<ComplianceCommandCenterPage />} />
            <Route path="/platform/how-it-works" element={<AdvancedPlatformPage />} />
            <Route path="/platform/infrastructure" element={<SovereignInfrastructurePage />} />
            <Route path="/platform/ai-human-review" element={<AgenticExecutionModelPage />} />
            <Route path="/platform/nexus-9-drafting" element={<Nexus9DraftingEnginePage />} />
            <Route path="/platform/ai-assistant" element={<Nexus9DraftingEnginePage />} />
            <Route path="/platform/regulators" element={<AdvancedPlatformPage />} />
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

            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/disclaimers" element={<Disclaimers />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/compliance" element={<ComplianceCenterStandalone />} />
            <Route path="/auth" element={<AuthReal />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<UserOnboardingFlow />} />
            <Route path="/settings/account" element={<AccountSettingsPage />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/settings/agent-control-center" element={<AgentControlCenter />} />
            <Route path="/settings/company-agent-control-center" element={<CompanyAgentControlCenter />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/disclaimers" element={<Disclaimers />} />
            <Route path="/persona-selector" element={<PersonaSelector />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ca-dashboard" element={<CADashboard />} />
            <Route path="/ca-dashboard/efiling-ack-pdf" element={<EFilingAckPdfViewer />} />
            <Route path="/ca-dashboard/payment-challan-pdf" element={<PaymentChallanPdfViewer />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/ca-firm-dashboard" element={<CAFirmDashboard />} />
            <Route path="/real-external-ca-dashboard" element={<ExternalCADashboardReal />} />
            <Route path="/real-company-dashboard" element={<CompanyDashboardReal />} />
            <Route path="/real-inhouse-ca-dashboard" element={<InhouseCADashboardReal />} />
            {/* RealCADashboard removed - using demo dashboards */}
            <Route path="/agent-work-review" element={<AgentWorkReview />} />

            <Route path="/app" element={<RoleLandingRoute />} />
            {/* Removed App Dashboard - use demo dashboards */}
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
            {/* Removed old ExternalCADashboard - now using RealCADashboard at /real-ca-dashboard */}
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
            <Route path="/dashboards/ca-firm" element={<CAFirmDashboardReal />} />
            {/* Phase 3: Full CA Firm Dashboard (coming soon) */}
            {/* <Route
              path="/dashboards/ca-firm/full"
              element={
                <PersonaRoute allowedPersonas={["ca_firm"]}>
                  <CAFirmDashboardFull />
                </PersonaRoute>
              }
            /> */}
            <Route path="/dashboards/lawyer" element={<InhouseLawyerDashboardReal />} />
            {/* Public: CA client consent page — no auth required */}
            <Route path="/consent/:token" element={<ConsentApprovalPage />} />
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
      </CAAgentProvider>
      </PersonaAuthProvider>
      </EnhancedAuthProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
