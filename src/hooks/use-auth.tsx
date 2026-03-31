import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
export type AppPersona = "external_ca" | "admin" | "company_owner" | "in_house_ca" | "in_house_lawyer" | "ca_firm";
type VerificationStatus = "pending" | "approved" | "rejected";

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  persona: AppPersona | null;
  verificationStatus: VerificationStatus | null;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const rolePriority: Record<AppRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

const sortRoles = (roles: AppRole[]) => [...roles].sort((a, b) => rolePriority[b] - rolePriority[a]);

const inferPersonaFromUserMetadata = (user: User | null): AppPersona | null => {
  const raw = user?.user_metadata?.registration_role;
  if (
    raw === "external_ca" ||
    raw === "admin" ||
    raw === "company_owner" ||
    raw === "in_house_ca" ||
    raw === "in_house_lawyer" ||
    raw === "ca_firm"
  ) {
    return raw;
  }
  return null;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });

  const result = await Promise.race([promise, timeoutPromise]);

  if (timer) {
    clearTimeout(timer);
  }

  return result;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [persona, setPersona] = useState<AppPersona | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadIdentity = async (activeUser: User) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", activeUser.id);

      if (!mounted) return;
      if (error) {
        setRoles([]);
        setPersona(inferPersonaFromUserMetadata(activeUser));
        setVerificationStatus(null);
        setIsVerified(false);
        return;
      }

      const nextRoles = (data ?? []).map((row) => row.role);
      setRoles(sortRoles(nextRoles));

      // Check metadata first (stored during signup)
      const metadataPersona = inferPersonaFromUserMetadata(activeUser);
      if (metadataPersona) {
        setPersona(metadataPersona);
      } else {
        // Fallback to role-based inference
        if (nextRoles.includes("admin")) {
          setPersona("admin");
        } else if (nextRoles.includes("manager")) {
          setPersona("external_ca");
        } else if (nextRoles.includes("user")) {
          setPersona("company_owner");
        } else {
          setPersona("company_owner"); // Default fallback
        }
      }

      // Load verification status from user_verifications table
      try {
        const { data: verificationData, error: verificationError } = await supabase
          .from("user_verifications")
          .select("status, is_verified")
          .eq("user_id", activeUser.id)
          .maybeSingle();

        if (!mounted) return;

        if (verificationError) {
          // Table might not exist or other error - default to unverified
          setVerificationStatus(null);
          setIsVerified(false);
        } else if (verificationData) {
          setVerificationStatus(verificationData.status as VerificationStatus);
          setIsVerified(verificationData.is_verified ?? false);
        } else {
          // No verification record exists yet
          setVerificationStatus("pending");
          setIsVerified(false);
        }
      } catch {
        // Fallback for any errors
        setVerificationStatus(null);
        setIsVerified(false);
      }
    };

    const bootstrap = async () => {
      try {
        const sessionResponse = await withTimeout(
          supabase.auth.getSession(),
          3000,
          { data: { session: null }, error: null },
        );
        const initialSession = sessionResponse.data.session;

        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await loadIdentity(initialSession.user);
        } else {
          setRoles([]);
          setPersona(null);
          setVerificationStatus(null);
          setIsVerified(false);
        }
      } catch (error) {
        if (!mounted) return;
        console.warn("Auth bootstrap failed.", error);
        setSession(null);
        setUser(null);
        setRoles([]);
        setPersona(null);
        setVerificationStatus(null);
        setIsVerified(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        // Do not block auth state propagation on profile/role fetches.
        void loadIdentity(nextSession.user);
      } else {
        setRoles([]);
        setPersona(null);
        setVerificationStatus(null);
        setIsVerified(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const primaryRole = roles.length > 0 ? roles[0] : null;

    return {
      loading,
      session,
      user,
      roles,
      primaryRole,
      persona,
      verificationStatus,
      isVerified,
    };
  }, [loading, session, user, roles, persona, verificationStatus, isVerified]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
