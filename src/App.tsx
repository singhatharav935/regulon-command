import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { lazyWithRetry, prefetchRoutes } from "./lib/lazyWithRetry";
import { CAAgentProvider } from "./components/agents/CAAgentOrchestrator";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PersonaRoute } from "./components/auth/PersonaRoute";

const Index = lazyWithRetry(() => import("./pages/Index"));
const AuthReal = lazyWithRetry(() => import("./pages/Auth-Real-Enhanced"));
const AccountSettingsPage = lazyWithRetry(() => import("./pages/AccountSettings"));
const UserOnboardingFlow = lazyWithRetry(() => import("./components/auth/UserOnboardingFlow").then(module => ({ default: module.UserOnboardingFlow })));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const Disclaimers = lazyWithRetry(() => import("./pages/Disclaimers"));
const RefundPolicy = lazyWithRetry(() => import("./pages/RefundPolicy"));
const ComplianceCenterStandalone = lazyWithRetry(() => import("./pages/ComplianceCenterStandalone"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const MarketingOptionPage = lazyWithRetry(() => import("./pages/MarketingOptionPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const ForBusinessOwnersPage = lazyWithRetry(() => import("./pages/ForBusinessOwnersPage"));
const ForCAsPage = lazyWithRetry(() => import("./pages/ForCAsPage"));
const HowItWorksPage = lazyWithRetry(() => import("./pages/HowItWorksPage"));

// Dashboards & Personas
const RoleLandingRoute = lazyWithRetry(() => import("./components/auth/RoleLandingRoute"));
const PersonaSelector = lazyWithRetry(() => import("./components/auth/PersonaSelector").then(module => ({ default: module.PersonaSelector })));
const ExternalCADashboardFull = lazyWithRetry(() => import("./pages/dashboards/phases/ExternalCADashboardFull").then(module => ({ default: module.ExternalCADashboardFull })));
const InhouseCADashboard = lazyWithRetry(() => import("./pages/dashboards/InhouseCADashboard").then(module => ({ default: module.InhouseCADashboard })));
const CAFirmDashboardReal = lazyWithRetry(() => import("./pages/dashboards/CAFirmDashboardReal").then(module => ({ default: module.CAFirmDashboardReal })));
const LawyerDashboard = lazyWithRetry(() => import("./pages/dashboards/LawyerDashboard").then(module => ({ default: module.LawyerDashboard })));
const InhouseLawyerDashboardReal = lazyWithRetry(() => import("./pages/dashboards/InhouseLawyerDashboardReal").then(module => ({ default: module.InhouseLawyerDashboardReal })));
const OwnerDashboard = lazyWithRetry(() => import("./pages/dashboards/OwnerDashboard").then(module => ({ default: module.OwnerDashboard })));
const PersonaAdminDashboard = lazyWithRetry(() => import("./pages/dashboards/AdminDashboard").then(module => ({ default: module.AdminDashboard })));

// Contexts & Route Utilities (Eagerly loaded)
import { AuthProvider } from "./hooks/use-auth";
import { EnhancedAuthProvider } from "./lib/enhanced-auth-context";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PersonaAuthProvider } from "./lib/persona-auth-context";

const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const CADashboard = lazyWithRetry(() => import("./pages/CADashboard"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const EFilingAckPdfViewer = lazyWithRetry(() => import("./pages/EFilingAckPdfViewer"));
const PaymentChallanPdfViewer = lazyWithRetry(() => import("./pages/PaymentChallanPdfViewer"));
const AppVerification = lazyWithRetry(() => import("./pages/AppVerification"));
const CAFirmDashboard = lazyWithRetry(() => import("./pages/CAFirmDashboard"));
const CompanyDashboardReal = lazyWithRetry(() => import("./pages/CompanyDashboardReal"));
const ExternalCADashboardReal = lazyWithRetry(() => import("./pages/ExternalCADashboardReal"));
const InhouseCADashboardReal = lazyWithRetry(() => import("./pages/InhouseCADashboardReal"));
const AgentControlCenter = lazyWithRetry(() => import("./pages/AgentControlCenter"));
const CompanyAgentControlCenter = lazyWithRetry(() => import("./pages/CompanyAgentControlCenter"));
const AgentWorkReview = lazyWithRetry(() => import("./pages/AgentWorkReview"));
const LegalPolicyPage = lazyWithRetry(() => import("./pages/LegalPolicyPage"));
const ComplianceCenter = lazyWithRetry(() => import("./pages/ComplianceCenter"));
const AdvancedPlatformPage = lazyWithRetry(() => import("./pages/AdvancedPlatformPage"));
const AdvancedSolutionsPage = lazyWithRetry(() => import("./pages/AdvancedSolutionsPage"));
const AdvancedSecurityPage = lazyWithRetry(() => import("./pages/AdvancedSecurityPage"));
const AdvancedCustomersPage = lazyWithRetry(() => import("./pages/AdvancedCustomersPage"));
const SovereignInfrastructurePage = lazyWithRetry(() => import("./pages/SovereignInfrastructurePage"));
const AgenticExecutionModelPage = lazyWithRetry(() => import("./pages/AgenticExecutionModelPage"));
const ComplianceCommandCenterPage = lazyWithRetry(() => import("./pages/ComplianceCommandCenterPage"));
const Nexus9DraftingEnginePage = lazyWithRetry(() => import("./pages/Nexus9DraftingEnginePage"));

const ProfileSettings = lazyWithRetry(() => import("./pages/ProfileSettings"));
const ConsentApprovalPage = lazyWithRetry(() => import("./pages/ConsentApprovalPage"));

const queryClient = new QueryClient();

// Prefetch the heaviest dashboard chunks 2s after app loads (production only)
if (typeof window !== "undefined" && import.meta.env.PROD) {
  prefetchRoutes(
    [CADashboard, CompanyDashboardReal, ExternalCADashboardReal, InhouseCADashboardReal, Dashboard],
    2000
  );
}

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
                      <Route path="/for-business-owners" element={<ForBusinessOwnersPage />} />
                      <Route path="/for-chartered-accountants" element={<ForCAsPage />} />
                      <Route path="/how-it-works" element={<HowItWorksPage />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/disclaimers" element={<Disclaimers />} />
                      <Route path="/refund-policy" element={<RefundPolicy />} />
                      <Route path="/compliance" element={<ComplianceCenterStandalone />} />
                      <Route path="/auth" element={<AuthReal />} />
                      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/reset-password" element={<ResetPassword />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/onboarding" element={<UserOnboardingFlow />} />
                      <Route path="/settings/account" element={<AccountSettingsPage />} />
                      <Route path="/profile" element={<ProfileSettings />} />
                      <Route path="/settings/agent-control-center" element={<AgentControlCenter />} />
                      <Route path="/settings/company-agent-control-center" element={<CompanyAgentControlCenter />} />
                      <Route path="/persona-selector" element={<PersonaSelector />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/ca-dashboard" element={<CADashboard />} />
                      <Route path="/ca-dashboard/efiling-ack-pdf" element={<EFilingAckPdfViewer />} />
                      <Route path="/ca-dashboard/payment-challan-pdf" element={<PaymentChallanPdfViewer />} />
                      <Route path="/admin-dashboard" element={<AdminDashboard />} />
                      <Route path="/ca-firm-dashboard" element={<CAFirmDashboard />} />
                      <Route path="/real-external-ca-dashboard" element={
                        <ProtectedRoute allowRoles={["user", "manager", "admin"]} allowPersonas={["external_ca", "in_house_ca", "ca_firm"]} requireVerified={false}>
                          <ExternalCADashboardReal />
                        </ProtectedRoute>
                      } />
                      <Route path="/real-company-dashboard" element={
                        <ProtectedRoute allowRoles={["user", "manager", "admin"]} allowPersonas={["company_owner"]} requireVerified={false}>
                          <CompanyDashboardReal />
                        </ProtectedRoute>
                      } />
                      <Route path="/real-inhouse-ca-dashboard" element={
                        <ProtectedRoute allowRoles={["user", "manager", "admin"]} allowPersonas={["in_house_ca", "external_ca"]} requireVerified={false}>
                          <InhouseCADashboardReal />
                        </ProtectedRoute>
                      } />
                      <Route path="/agent-work-review" element={<AgentWorkReview />} />
                      <Route path="/app" element={<RoleLandingRoute />} />
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
                      <Route path="/dashboards/lawyer" element={<InhouseLawyerDashboardReal />} />
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
