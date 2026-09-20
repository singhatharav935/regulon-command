import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: {
            access_token: "test-access-token",
            user: { id: "00000000-0000-0000-0000-000000000001" },
          },
        },
      })),
    },
  },
}));

describe("workspace backend contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-publishable");
    vi.stubEnv("VITE_AI_FRONTEND_BASE_BACKOFF_MS", "1");
    vi.stubEnv("VITE_AI_FRONTEND_MIN_REQUEST_GAP_MS", "0");
    vi.stubEnv("VITE_AI_FRONTEND_MAX_RETRIES", "3");
  });

  it("exposes retry classifiers for AI reliability policy", async () => {
    const { workspaceBackendTesting } = await import("@/lib/workspace-backend");
    expect(workspaceBackendTesting.shouldRetryResponse(429)).toBe(true);
    expect(workspaceBackendTesting.shouldRetryResponse(503)).toBe(true);
    expect(workspaceBackendTesting.shouldRetryResponse(400)).toBe(false);
  });

  it("retries drafting AI requests on 429 and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "rate limited", error_code: "AI_RATE_LIMITED" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, data: { accepted: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { workspaceBackendRequest } = await import("@/lib/workspace-backend");
    const payload = await workspaceBackendRequest<{ accepted: boolean }>("/drafting/ai", {
      method: "POST",
      body: JSON.stringify({ operation: "draft" }),
    });

    expect(payload.accepted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
