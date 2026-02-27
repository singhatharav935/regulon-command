import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
export type AppPersona = "external_ca" | "admin" | "company_owner" | "in_house_ca" | "in_house_lawyer";

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  persona: AppPersona | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const rolePriority: Record<AppRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

const sortRoles = (roles: AppRole[]) => [...roles].sort((a, b) => rolePriority[b] - rolePriority[a]);

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

  useEffect(() => {
    let mounted = true;

    const loadIdentity = async (userId: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!mounted) return;
      if (error) {
        setRoles([]);
        setPersona(null);
        return;
      }

      const nextRoles = (data ?? []).map((row) => row.role);
      setRoles(sortRoles(nextRoles));

      const supabaseAny = supabase as any;
      const { data: personaData } = await supabaseAny
        .from("user_personas")
        .select("persona")
        .eq("user_id", userId)
        .maybeSingle();

      const nextPersona = personaData?.persona as AppPersona | undefined;
      if (
        nextPersona === "external_ca" ||
        nextPersona === "admin" ||
        nextPersona === "company_owner" ||
        nextPersona === "in_house_ca" ||
        nextPersona === "in_house_lawyer"
      ) {
        setPersona(nextPersona);
        return;
      }

      if (nextRoles.includes("admin")) {
        setPersona("admin");
      } else if (nextRoles.includes("manager")) {
        setPersona("external_ca");
      } else if (nextRoles.includes("user")) {
        setPersona("company_owner");
      } else {
        setPersona(null);
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
          await loadIdentity(initialSession.user.id);
        } else {
          setRoles([]);
          setPersona(null);
        }
      } catch (error) {
        if (!mounted) return;
        console.warn("Auth bootstrap failed.", error);
        setSession(null);
        setUser(null);
        setRoles([]);
        setPersona(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadIdentity(nextSession.user.id);
      } else {
        setRoles([]);
        setPersona(null);
      }

      setLoading(false);
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
    };
  }, [loading, session, user, roles, persona]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
