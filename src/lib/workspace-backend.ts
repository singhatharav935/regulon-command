import { supabase } from "@/integrations/supabase/client";

type WorkspaceBackendEnvelope<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
};

const getWorkspaceBackendBaseUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL for workspace backend.");
  }
  return `${supabaseUrl}/functions/v1/workspace-backend`;
};

const getWorkspaceBackendHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !publishableKey) {
    throw new Error("Missing authenticated session for workspace backend.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: publishableKey,
  };
};

export const workspaceBackendRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const headers = await getWorkspaceBackendHeaders();
  const response = await fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as WorkspaceBackendEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload?.error || `Workspace backend request failed (${response.status}).`);
  }

  return payload.data as T;
};

export const workspaceBackendStreamRequest = async (
  path: string,
  payload: Record<string, unknown>,
) => {
  const headers = await getWorkspaceBackendHeaders();
  return fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
};
