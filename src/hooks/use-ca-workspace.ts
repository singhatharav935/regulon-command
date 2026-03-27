import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { workspaceBackendRequest } from "@/lib/workspace-backend";

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
        const data = await workspaceBackendRequest<{ workspaceType: CAWorkspaceType; source: "default" | "profile" }>(
          "/ca/workspace-profile",
        );

        if (!mounted) return;
        setWorkspaceType(data.workspaceType);
        setSource(data.source);
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
