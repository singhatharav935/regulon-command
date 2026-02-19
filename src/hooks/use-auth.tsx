import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const rolePriority: Record<AppRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

const sortRoles = (roles: AppRole[]) => [...roles].sort((a, b) => rolePriority[b] - rolePriority[a]);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!mounted) return;
      if (error) {
        setRoles([]);
        return;
      }

      const nextRoles = (data ?? []).map((row) => row.role);
      setRoles(sortRoles(nextRoles));
    };

    const bootstrap = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await loadRoles(initialSession.user.id);
      } else {
        setRoles([]);
      }

      setLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadRoles(nextSession.user.id);
      } else {
        setRoles([]);
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
    };
  }, [loading, session, user, roles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
