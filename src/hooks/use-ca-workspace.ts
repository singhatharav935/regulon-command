import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type CAWorkspaceType = "external_ca" | "regulon_ca";

interface CAWorkspaceState {
  loading: boolean;
  workspaceType: CAWorkspaceType;
  source: "default" | "profile";
}

export const useCAWorkspace = (): CAWorkspaceState => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workspaceType, setWorkspaceType] = useState<CAWorkspaceType>("external_ca");
  const [source, setSource] = useState<"default" | "profile">("default");

  useEffect(() => {
    let mounted = true;
    const supabaseAny = supabase as any;

    const load = async () => {
      if (!user) {
        if (!mounted) return;
        setWorkspaceType("external_ca");
        setSource("default");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabaseAny
          .from("ca_workspace_profiles")
          .select("workspace_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!mounted) return;

        if (data?.workspace_type === "regulon_ca" || data?.workspace_type === "external_ca") {
          setWorkspaceType(data.workspace_type);
          setSource("profile");
          return;
        }

        // If profile does not exist, keep safe default as external CA.
        setWorkspaceType("external_ca");
        setSource("default");
      } catch {
        if (!mounted) return;
        setWorkspaceType("external_ca");
        setSource("default");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { loading, workspaceType, source };
};
