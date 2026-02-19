import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const RoleLandingRoute = () => {
  const { loading, user, roles } = useAuth();

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

  if (roles.includes("admin")) {
    return <Navigate to="/app/admin-dashboard" replace />;
  }

  if (roles.includes("manager")) {
    return <Navigate to="/app/ca-dashboard" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
};

export default RoleLandingRoute;
