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
  requireVerified?: boolean;
}

const verificationRequiredPersonas: AppPersona[] = ["external_ca", "in_house_ca", "in_house_lawyer", "company_owner", "admin", "ca_firm"];

const ProtectedRoute = ({ children, allowRoles, allowPersonas, requireVerified = true }: ProtectedRouteProps) => {
  const { loading, user, roles, persona, isVerified } = useAuth();
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
    const hasAllowedRole = allowRoles && allowRoles.length > 0
      ? allowRoles.some((role) => roles.includes(role))
      : false;

    // Fallback for older users/sessions where persona row is not present yet.
    if (!hasAllowedPersona && !hasAllowedRole) {
      return <Navigate to="/app" replace />;
    }
  }

  if (requireVerified && persona && verificationRequiredPersonas.includes(persona) && !isVerified) {
    return <Navigate to="/app/verification" replace />;
  }

  return children;
};

export default ProtectedRoute;
