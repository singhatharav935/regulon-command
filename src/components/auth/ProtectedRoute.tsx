import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";
import type { AppPersona } from "@/hooks/use-auth";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactElement;
  allowRoles?: AppRole[];
  allowPersonas?: AppPersona[];
}

const ProtectedRoute = ({ children, allowRoles, allowPersonas }: ProtectedRouteProps) => {
  const { loading, user, roles, persona } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (allowRoles && allowRoles.length > 0) {
    const hasAllowedRole = allowRoles.some((role) => roles.includes(role));

    if (!hasAllowedRole && (!allowPersonas || allowPersonas.length === 0)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  if (allowPersonas && allowPersonas.length > 0) {
    const hasAllowedPersona = persona ? allowPersonas.includes(persona) : false;
    if (!hasAllowedPersona) {
      return <Navigate to="/app" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
