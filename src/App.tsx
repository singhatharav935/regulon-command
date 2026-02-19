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

            <Route path="/app" element={<RoleLandingRoute />} />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute allowRoles={["user", "manager", "admin"]}>
                  <AppDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/ca-dashboard"
              element={
                <ProtectedRoute allowRoles={["manager", "admin"]}>
                  <AppCADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin-dashboard"
              element={
                <ProtectedRoute allowRoles={["admin"]}>
                  <AppAdminDashboard />
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
