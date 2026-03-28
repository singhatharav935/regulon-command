import { supabase } from "@/integrations/supabase/client";

type WorkspaceBackendEnvelope<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
  error_code?: string;
};

const AI_FRONTEND_MAX_RETRIES = Math.max(1, Number(import.meta.env.VITE_AI_FRONTEND_MAX_RETRIES ?? "3"));
const AI_FRONTEND_BASE_BACKOFF_MS = Math.max(300, Number(import.meta.env.VITE_AI_FRONTEND_BASE_BACKOFF_MS ?? "800"));
const AI_FRONTEND_MIN_REQUEST_GAP_MS = Math.max(0, Number(import.meta.env.VITE_AI_FRONTEND_MIN_REQUEST_GAP_MS ?? "1200"));

const aiUserQueue = new Map<string, Promise<void>>();
const aiUserLastRequestAt = new Map<string, number>();

const getWorkspaceBackendBaseUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL for workspace backend.");
  }
  return `${supabaseUrl}/functions/v1/workspace-backend`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (retryAfterHeader: string | null) => {
  if (!retryAfterHeader) return 0;
  const numericSeconds = Number(retryAfterHeader);
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return numericSeconds * 1000;
  }
  const dateMs = Date.parse(retryAfterHeader);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return 0;
};

const shouldRetryResponse = (status: number) => status === 429 || status >= 500;

const withPerUserAiQueue = async <T>(
  userId: string,
  task: () => Promise<T>,
): Promise<T> => {
  const previous = aiUserQueue.get(userId) ?? Promise.resolve();
  let release: (() => void) | null = null;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  aiUserQueue.set(userId, previous.then(() => current));

  await previous;
  try {
    const lastRequestAt = aiUserLastRequestAt.get(userId) ?? 0;
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < AI_FRONTEND_MIN_REQUEST_GAP_MS) {
      await sleep(AI_FRONTEND_MIN_REQUEST_GAP_MS - elapsed);
    }
    aiUserLastRequestAt.set(userId, Date.now());
    return await task();
  } finally {
    if (release) release();
    if (aiUserQueue.get(userId) === current) {
      aiUserQueue.delete(userId);
    }
  }
};

const getAuthenticatedContext = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  const userId = session?.user?.id;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !publishableKey || !userId) {
    throw new Error("Missing authenticated session for workspace backend.");
  }

  return {
    userId,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: publishableKey,
    },
  };
};

const getWorkspaceBackendHeaders = async () => {
  const { headers } = await getAuthenticatedContext();
  return headers;
};

export const workspaceBackendRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const { userId, headers } = await getAuthenticatedContext();
  const mergedHeaders = {
    ...headers,
    ...(init?.headers ?? {}),
  };

  const executeRequest = async () => fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
    ...init,
    headers: mergedHeaders,
  });

  const isAiPath = path.startsWith("/drafting/ai");
  const perform = async () => {
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt < AI_FRONTEND_MAX_RETRIES; attempt += 1) {
      const response = await executeRequest();
      if (!isAiPath || !shouldRetryResponse(response.status) || attempt === AI_FRONTEND_MAX_RETRIES - 1) {
        return response;
      }
      lastResponse = response;
      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      const jitter = Math.floor(Math.random() * 300);
      const backoffMs = AI_FRONTEND_BASE_BACKOFF_MS * (attempt + 1) + jitter;
      await sleep(Math.max(retryAfterMs, backoffMs));
    }
    if (lastResponse) return lastResponse;
    return executeRequest();
  };

  const response = isAiPath
    ? await withPerUserAiQueue(userId, perform)
    : await perform();

  const payload = (await response.json().catch(() => ({}))) as WorkspaceBackendEnvelope<T>;
  if (!response.ok) {
    const message = payload?.error || `Workspace backend request failed (${response.status}).`;
    const code = payload?.error_code;
    throw new Error(code ? `${message} [${code}]` : message);
  }

  return payload.data as T;
};

export const workspaceBackendStreamRequest = async (
  path: string,
  payload: Record<string, unknown>,
) => {
  const { userId, headers } = await getAuthenticatedContext();
  const isAiPath = path.startsWith("/drafting/ai");

  const perform = async () => {
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt < AI_FRONTEND_MAX_RETRIES; attempt += 1) {
      const response = await fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!isAiPath || !shouldRetryResponse(response.status) || attempt === AI_FRONTEND_MAX_RETRIES - 1) {
        return response;
      }
      lastResponse = response;
      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      const jitter = Math.floor(Math.random() * 300);
      const backoffMs = AI_FRONTEND_BASE_BACKOFF_MS * (attempt + 1) + jitter;
      await sleep(Math.max(retryAfterMs, backoffMs));
    }
    if (lastResponse) return lastResponse;
    return fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  };

  return isAiPath
    ? withPerUserAiQueue(userId, perform)
    : perform();
};

export const workspacePublicRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${getWorkspaceBackendBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(publishableKey ? { apikey: publishableKey } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as WorkspaceBackendEnvelope<T>;
  if (!response.ok) {
    const message = payload?.error || `Workspace backend public request failed (${response.status}).`;
    const code = payload?.error_code;
    throw new Error(code ? `${message} [${code}]` : message);
  }

  return payload.data as T;
};
