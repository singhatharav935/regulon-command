import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const RoleLandingRoute = () => {
  const { loading, user, roles, persona, isVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!persona && roles.length === 0) {
    return <Navigate to="/auth?mode=login&role=company_owner" replace />;
  }

  const requiresVerification =
    persona === "external_ca" ||
    persona === "in_house_ca" ||
    persona === "in_house_lawyer" ||
    persona === "company_owner" ||
    persona === "admin" ||
    persona === "ca_firm";

  if (requiresVerification && !isVerified) {
    return <Navigate to="/app/verification" replace />;
  }

  if (persona === "admin") {
    return <Navigate to="/app/admin-dashboard" replace />;
  }

  if (persona === "in_house_lawyer") {
    return <Navigate to="/app/legal-dashboard" replace />;
  }

  if (persona === "external_ca" || persona === "in_house_ca") {
    return <Navigate to="/app/ca-dashboard" replace />;
  }

  if (persona === "ca_firm") {
    return <Navigate to="/app/ca-firm-dashboard" replace />;
  }

  if (persona === "company_owner") {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (roles.includes("admin")) {
    return <Navigate to="/app/admin-dashboard" replace />;
  }

  if (roles.includes("manager")) {
    return <Navigate to="/app/ca-dashboard" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
};

export default RoleLandingRoute;
