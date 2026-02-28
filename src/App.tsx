import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CADashboard from "./pages/CADashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import AppDashboard from "./pages/AppDashboard";
import AppCADashboard from "./pages/AppCADashboard";
import AppAdminDashboard from "./pages/AppAdminDashboard";
import UniversityDemoDashboard from "./pages/UniversityDemoDashboard";
import AppUniversityDashboard from "./pages/AppUniversityDashboard";
import AppLegalDashboard from "./pages/AppLegalDashboard";
import AppVerification from "./pages/AppVerification";
import CAFirmDashboard from "./pages/CAFirmDashboard";
import AppCAFirmDashboard from "./pages/AppCAFirmDashboard";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleLandingRoute from "./components/auth/RoleLandingRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ca-dashboard" element={<CADashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/university-demo" element={<UniversityDemoDashboard />} />
            <Route path="/ca-firm-dashboard" element={<CAFirmDashboard />} />

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

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
