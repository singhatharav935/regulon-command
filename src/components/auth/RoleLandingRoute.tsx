import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { AppPersona } from "@/hooks/use-auth";

const VERIFICATION_OPTIONAL_FOR_NOW =
  import.meta.env.DEV || import.meta.env.VITE_VERIFICATION_OPTIONAL === "true";

const inferPersonaFromMetadata = (registrationRole: unknown): AppPersona | null => {
  if (
    registrationRole === "external_ca" ||
    registrationRole === "admin" ||
    registrationRole === "company_owner" ||
    registrationRole === "in_house_ca" ||
    registrationRole === "in_house_lawyer" ||
    registrationRole === "ca_firm"
  ) {
    return registrationRole;
  }
  return null;
};

const resolveLandingPath = ({
  persona,
  roles,
  metadataPersona,
}: {
  persona: AppPersona | null;
  roles: string[];
  metadataPersona: AppPersona | null;
}) => {
  const effectivePersona = persona ?? metadataPersona;

  if (effectivePersona === "admin") return "/app/admin-dashboard";
  if (effectivePersona === "in_house_lawyer") return "/app/legal-dashboard";
  if (effectivePersona === "external_ca" || effectivePersona === "in_house_ca") return "/app/ca-dashboard";
  if (effectivePersona === "ca_firm") return "/app/ca-firm-dashboard";
  if (effectivePersona === "company_owner") return "/app/dashboard";

  if (roles.includes("admin")) return "/app/admin-dashboard";
  if (roles.includes("manager")) return "/app/ca-dashboard";
  return "/app/dashboard";
};

const RoleLandingRoute = () => {
  const { loading, user, roles, persona, isVerified } = useAuth();
  const [forceResolve, setForceResolve] = useState(false);
  const metadataPersona = inferPersonaFromMetadata(user?.user_metadata?.registration_role);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setForceResolve(true), 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  const hasPersistedSession = (() => {
    try {
      const keys = Object.keys(localStorage);
      return keys.some((key) => {
        if (!key.includes("supabase.auth.token")) return false;
        const raw = localStorage.getItem(key) || "";
        return raw.includes("access_token");
      });
    } catch {
      return false;
    }
  })();

  if (loading && !forceResolve) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (loading && forceResolve) {
    return (
      <Navigate
        to={hasPersistedSession ? resolveLandingPath({ persona, roles, metadataPersona }) : "/auth"}
        replace
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!persona && roles.length === 0) {
    return <Navigate to={resolveLandingPath({ persona, roles, metadataPersona })} replace />;
  }

  const requiresVerification =
    persona === "external_ca" ||
    persona === "in_house_ca" ||
    persona === "in_house_lawyer" ||
    persona === "company_owner" ||
    persona === "admin" ||
    persona === "ca_firm";

  if (!VERIFICATION_OPTIONAL_FOR_NOW && requiresVerification && !isVerified) {
    return <Navigate to="/app/verification" replace />;
  }

  return <Navigate to={resolveLandingPath({ persona, roles, metadataPersona })} replace />;
};

export default RoleLandingRoute;
