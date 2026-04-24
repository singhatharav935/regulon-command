import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { AppPersona } from "@/hooks/use-auth";
import { previewBypassEnabled } from "@/lib/runtime-flags";
import { getLocalPreviewPersona, personaToFallbackRole } from "@/lib/local-preview-auth";

const VERIFICATION_OPTIONAL_FOR_NOW = previewBypassEnabled;

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

export const resolveLandingPath = ({
  persona,
  roles,
  metadataPersona,
}: {
  persona: AppPersona | null;
  roles: string[];
  metadataPersona: AppPersona | null;
}) => {
  // Ultra-resilient local fallback
  const localRole = localStorage.getItem("current_user_role") || localStorage.getItem("pending_registration_role") || "company_owner";
  const effectivePersona = persona ?? metadataPersona ?? (localRole as AppPersona);

  if (effectivePersona === "admin") return "/admin-dashboard";
  if (effectivePersona === "in_house_lawyer") return "/lawyer-dashboard";
  if (effectivePersona === "external_ca") return "/real-external-ca-dashboard";
  if (effectivePersona === "in_house_ca") return "/real-inhouse-ca-dashboard";
  if (effectivePersona === "ca_firm") return "/ca-firm-dashboard";
  if (effectivePersona === "company_owner") return "/real-company-dashboard";

  if (roles.includes("admin")) return "/admin-dashboard";
  if (roles.includes("manager")) return "/real-external-ca-dashboard";
  return "/real-company-dashboard";
};

const RoleLandingRoute = () => {
  const { loading, user, roles, persona, isVerified } = useAuth();
  const [forceResolve, setForceResolve] = useState(false);
  const metadataPersona = inferPersonaFromMetadata(user?.user_metadata?.registration_role);
  const previewPersona = VERIFICATION_OPTIONAL_FOR_NOW ? getLocalPreviewPersona() : null;
  // localRole (registration form) takes priority over previewPersona (demo PersonaSelector)
  const localRole = (localStorage.getItem("current_user_role") || localStorage.getItem("pending_registration_role")) as AppPersona | null;
  const effectivePersona = persona ?? metadataPersona ?? localRole ?? previewPersona;
  const effectiveRoles = roles.length > 0
    ? roles
    : previewPersona
      ? [personaToFallbackRole(previewPersona)]
      : localRole ? [personaToFallbackRole(localRole)] : [];

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
        to={hasPersistedSession || Boolean(previewPersona)
          ? resolveLandingPath({ persona: effectivePersona, roles: effectiveRoles, metadataPersona: null })
          : "/auth"}
        replace
      />
    );
  }

  if (!user && !previewPersona) {
    return <Navigate to="/auth" replace />;
  }

  if (!effectivePersona && effectiveRoles.length === 0) {
    return <Navigate to={resolveLandingPath({ persona: effectivePersona, roles: effectiveRoles, metadataPersona: null })} replace />;
  }

  const requiresVerification =
    effectivePersona === "external_ca" ||
    effectivePersona === "in_house_ca" ||
    effectivePersona === "in_house_lawyer" ||
    effectivePersona === "company_owner" ||
    effectivePersona === "admin" ||
    effectivePersona === "ca_firm";

  if (!VERIFICATION_OPTIONAL_FOR_NOW && requiresVerification && !isVerified) {
    return <Navigate to="/app/verification" replace />;
  }

  return <Navigate to={resolveLandingPath({ persona: effectivePersona, roles: effectiveRoles, metadataPersona: null })} replace />;
};

export default RoleLandingRoute;
