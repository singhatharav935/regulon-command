import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowlist = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const isLocalOrigin =
    origin.startsWith("http://localhost:") ||
    origin.startsWith("https://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("https://127.0.0.1:");

  const hasWildcard = allowlist.includes("*");
  const isAllowlisted = allowlist.includes(origin);
  const allowOrigin = allowlist.length === 0 ? "*" : (isLocalOrigin || hasWildcard || isAllowlisted ? origin : "null");

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dispatch-token",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  };
};

const json = (req: Request, status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });

const getEnv = () => {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !anon || !service) {
    throw new Error("Missing Supabase env configuration");
  }
  return { url, anon, service };
};

const getUserClient = async (req: Request) => {
  const { url, anon } = getEnv();
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.replace(/^bearer\s+/i, "").trim();
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }
  return { client, user: data.user };
};

const getAdminClient = () => {
  const { url, service } = getEnv();
  return createClient(url, service);
};

const sendEmailViaResend = async ({
  apiKey,
  from,
  to,
  subject,
  bodyText,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: bodyText,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : `resend_send_failed_${response.status}`;
    throw new Error(message);
  }
};

const parseBearerToken = (req: Request) => {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.replace(/^bearer\s+/i, "").trim();
};

const isDispatchTokenAuthorized = (req: Request) => {
  const configuredToken = Deno.env.get("DISPATCH_CRON_TOKEN") || "";
  if (!configuredToken) return false;
  const headerToken = (req.headers.get("x-dispatch-token") || "").trim();
  const bearerToken = parseBearerToken(req);
  return headerToken === configuredToken || bearerToken === configuredToken;
};

const assertDispatchAuthorized = async (req: Request) => {
  const machineAuthorized = isDispatchTokenAuthorized(req);
  if (machineAuthorized) return;

  const { client, user } = await getUserClient(req);
  const { data: roleRows, error: roleError } = await client.from("user_roles").select("role").eq("user_id", user.id);
  if (roleError) throw new Error(roleError.message);
  const roles = new Set((roleRows ?? []).map((row) => String(row.role)));
  if (!roles.has("admin")) throw new Error("Forbidden");
};

const getRetryBackoffMs = (attempts: number) => {
  // 1, 2, 4, 8, 16 minutes capped at 16 minutes.
  const minutes = Math.min(16, Math.max(1, 2 ** Math.max(0, attempts - 1)));
  return minutes * 60 * 1000;
};

const shouldSkipFailedRowForBackoff = (attempts: number, updatedAt: string | null) => {
  if (!updatedAt) return false;
  const updated = Date.parse(updatedAt);
  if (Number.isNaN(updated)) return false;
  const nextEligibleAt = updated + getRetryBackoffMs(attempts);
  return Date.now() < nextEligibleAt;
};

const isOlderThanMinutes = (timestamp: string | null, minutes: number) => {
  if (!timestamp) return false;
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return false;
  return parsed <= Date.now() - (minutes * 60 * 1000);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/+/, "");
    const admin = getAdminClient();

    if (req.method === "GET" && path.endsWith("notifications/stats")) {
      await assertDispatchAuthorized(req);
      const staleProcessingMinutesRaw = Number(url.searchParams.get("stale_processing_minutes") ?? 15);
      const staleProcessingMinutes = Number.isFinite(staleProcessingMinutesRaw)
        ? Math.max(1, Math.min(240, staleProcessingMinutesRaw))
        : 15;

      const [queued, processing, sent, failed] = await Promise.all([
        admin.from("agent_notifications_outbox").select("id", { count: "exact", head: true }).eq("channel", "email").eq("status", "queued"),
        admin.from("agent_notifications_outbox").select("id", { count: "exact", head: true }).eq("channel", "email").eq("status", "processing"),
        admin.from("agent_notifications_outbox").select("id", { count: "exact", head: true }).eq("channel", "email").eq("status", "sent"),
        admin.from("agent_notifications_outbox").select("id", { count: "exact", head: true }).eq("channel", "email").eq("status", "failed"),
      ]);

      const countErrors = [queued.error, processing.error, sent.error, failed.error].filter(Boolean);
      if (countErrors.length > 0) {
        return json(req, 400, { error: countErrors[0]?.message || "Failed to load notification counts" });
      }

      const { data: recentFailures, error: recentFailuresError } = await admin
        .from("agent_notifications_outbox")
        .select("id, attempts, last_error, updated_at, payload")
        .eq("channel", "email")
        .eq("status", "failed")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (recentFailuresError) return json(req, 400, { error: recentFailuresError.message });

      const failureSamples = (recentFailures ?? []).map((row) => ({
        id: row.id,
        attempts: row.attempts,
        last_error: row.last_error,
        updated_at: row.updated_at,
        to: typeof (row.payload as Record<string, unknown>)?.to === "string"
          ? ((row.payload as Record<string, unknown>).to as string)
          : null,
      }));

      const { data: processingRows, error: processingRowsError } = await admin
        .from("agent_notifications_outbox")
        .select("id, updated_at")
        .eq("channel", "email")
        .eq("status", "processing")
        .order("updated_at", { ascending: true })
        .limit(500);
      if (processingRowsError) return json(req, 400, { error: processingRowsError.message });

      const staleProcessing = (processingRows ?? []).filter((row) => isOlderThanMinutes(row.updated_at ?? null, staleProcessingMinutes));

      return json(req, 200, {
        ok: true,
        counts: {
          queued: queued.count ?? 0,
          processing: processing.count ?? 0,
          sent: sent.count ?? 0,
          failed: failed.count ?? 0,
          stale_processing: staleProcessing.length,
        },
        stale_processing_minutes: staleProcessingMinutes,
        stale_processing_sample_ids: staleProcessing.slice(0, 10).map((row) => row.id),
        recent_failures: failureSamples,
      });
    }

    if (req.method === "POST" && path.endsWith("notifications/requeue-failed")) {
      await assertDispatchAuthorized(req);

      const body = await req.json().catch(() => ({}));
      const limitRaw = Number(body?.limit ?? 50);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 50;

      const { data: failedRows, error: failedRowsError } = await admin
        .from("agent_notifications_outbox")
        .select("id")
        .eq("channel", "email")
        .eq("status", "failed")
        .order("updated_at", { ascending: true })
        .limit(limit);
      if (failedRowsError) return json(req, 400, { error: failedRowsError.message });

      const ids = (failedRows ?? []).map((row) => row.id);
      if (!ids.length) {
        return json(req, 200, { ok: true, requeued: 0 });
      }

      const { error: requeueError } = await admin
        .from("agent_notifications_outbox")
        .update({ status: "queued", last_error: null, attempts: 0 })
        .in("id", ids);
      if (requeueError) return json(req, 400, { error: requeueError.message });

      return json(req, 200, { ok: true, requeued: ids.length });
    }

    if (req.method === "POST" && path.endsWith("notifications/recover-processing")) {
      await assertDispatchAuthorized(req);

      const body = await req.json().catch(() => ({}));
      const limitRaw = Number(body?.limit ?? 100);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, limitRaw)) : 100;
      const staleMinutesRaw = Number(body?.stale_minutes ?? 15);
      const staleMinutes = Number.isFinite(staleMinutesRaw) ? Math.max(1, Math.min(240, staleMinutesRaw)) : 15;

      const { data: processingRows, error: processingRowsError } = await admin
        .from("agent_notifications_outbox")
        .select("id, updated_at")
        .eq("channel", "email")
        .eq("status", "processing")
        .order("updated_at", { ascending: true })
        .limit(limit * 2);
      if (processingRowsError) return json(req, 400, { error: processingRowsError.message });

      const staleRows = (processingRows ?? [])
        .filter((row) => isOlderThanMinutes(row.updated_at ?? null, staleMinutes))
        .slice(0, limit);
      const staleIds = staleRows.map((row) => row.id);

      if (!staleIds.length) {
        return json(req, 200, { ok: true, recovered: 0, stale_minutes: staleMinutes });
      }

      const { error: recoverError } = await admin
        .from("agent_notifications_outbox")
        .update({ status: "failed", last_error: "Recovered from stale processing state" })
        .in("id", staleIds)
        .eq("status", "processing");
      if (recoverError) return json(req, 400, { error: recoverError.message });

      return json(req, 200, {
        ok: true,
        recovered: staleIds.length,
        stale_minutes: staleMinutes,
        sample_ids: staleIds.slice(0, 10),
      });
    }

    if (req.method === "POST" && path.endsWith("notifications/dispatch")) {
      await assertDispatchAuthorized(req);

      const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
      const emailFrom = Deno.env.get("EMAIL_FROM") || "";
      if (!resendApiKey || !emailFrom) {
        return json(req, 400, { error: "Missing RESEND_API_KEY or EMAIL_FROM" });
      }

      const body = await req.json().catch(() => ({}));
      const limitRaw = Number(body?.limit ?? 20);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 20;
      const maxAttemptsRaw = Number(body?.max_attempts ?? 5);
      const maxAttempts = Number.isFinite(maxAttemptsRaw) ? Math.max(1, Math.min(10, maxAttemptsRaw)) : 5;
      const dryRun = body?.dry_run === true;

      const { data: queuedRows, error: loadError } = await admin
        .from("agent_notifications_outbox")
        .select("id, payload, attempts, status, updated_at")
        .eq("channel", "email")
        .in("status", ["queued", "failed"])
        .lt("attempts", maxAttempts)
        .order("created_at", { ascending: true })
        .limit(limit * 3);
      if (loadError) return json(req, 400, { error: loadError.message });

      const candidateRows = queuedRows ?? [];
      const rows = candidateRows
        .filter((row) => !(row.status === "failed" && shouldSkipFailedRowForBackoff(Number(row.attempts ?? 0), row.updated_at ?? null)))
        .slice(0, limit);
      const skippedBackoff = Math.max(0, candidateRows.length - rows.length);
      if (!rows.length) {
        return json(req, 200, { ok: true, processed: 0, sent: 0, failed: 0, skipped_backoff: skippedBackoff, dry_run: dryRun });
      }

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      if (dryRun) {
        return json(req, 200, {
          ok: true,
          processed: rows.length,
          sent: 0,
          failed: 0,
          skipped_backoff: skippedBackoff,
          dry_run: true,
          sample_ids: rows.slice(0, 10).map((row) => row.id),
        });
      }

      for (const row of rows) {
        const { data: claimedRow } = await admin
          .from("agent_notifications_outbox")
          .update({ status: "processing", attempts: (Number(row.attempts ?? 0) + 1) })
          .eq("id", row.id)
          .in("status", ["queued", "failed"])
          .select("id, payload, attempts")
          .maybeSingle();

        if (!claimedRow) continue;

        try {
          const payload = claimedRow.payload && typeof claimedRow.payload === "object"
            ? claimedRow.payload as Record<string, unknown>
            : {};
          const to = typeof payload.to === "string" ? payload.to.trim() : "";
          const subject = typeof payload.subject === "string" ? payload.subject.trim() : "Regulon Notification";
          const bodyText = typeof payload.body_text === "string" ? payload.body_text : "You have a new workflow update.";
          if (!to) throw new Error("missing_to_email");

          await sendEmailViaResend({ apiKey: resendApiKey, from: emailFrom, to, subject, bodyText });

          const { error: sentUpdateError } = await admin
            .from("agent_notifications_outbox")
            .update({ status: "sent", last_error: null })
            .eq("id", row.id);
          if (sentUpdateError) throw sentUpdateError;
          sent += 1;
        } catch (sendError) {
          failed += 1;
          const errorMessage = sendError instanceof Error ? sendError.message : "email_dispatch_failed";
          errors.push(errorMessage);
          await admin
            .from("agent_notifications_outbox")
            .update({ status: "failed", last_error: errorMessage.slice(0, 500) })
            .eq("id", row.id);
        }
      }

      return json(req, 200, {
        ok: true,
        processed: rows.length,
        sent,
        failed,
        skipped_backoff: skippedBackoff,
        dry_run: false,
        error_samples: Array.from(new Set(errors)).slice(0, 5),
      });
    }

    const { client, user } = await getUserClient(req);

    if (req.method === "POST" && path.endsWith("run")) {
      const body = await req.json();
      const companyId = body.company_id ?? null;
      const dashboardScope = (body.dashboard_scope || "ca").toString();
      const summary = body.summary?.toString() || null;
      const context = body.context ?? {};
      const actions = Array.isArray(body.actions) ? body.actions : [];

      const { data: run, error: runError } = await client
        .from("agent_runs")
        .insert({
          company_id: companyId,
          owner_user_id: user.id,
          dashboard_scope: dashboardScope,
          summary,
          context,
          status: "needs_owner_review",
          started_at: new Date().toISOString(),
        })
        .select("id, company_id, owner_user_id, dashboard_scope, status, created_at")
        .single();

      if (runError || !run) {
        return json(req, 400, { error: runError?.message || "Could not create agent run" });
      }

      if (actions.length > 0) {
        const rows = actions.map((item: Record<string, unknown>) => ({
          run_id: run.id,
          company_id: companyId,
          owner_user_id: user.id,
          portal: (item.portal || "Regulatory").toString(),
          action_type: (item.action_type || "draft_generation").toString(),
          title: (item.title || "Agent-generated work item").toString(),
          generated_work: (item.generated_work || "").toString(),
          status: (item.status || "needs_approval").toString(),
          needs_approval: item.needs_approval === false ? false : true,
          metadata: item.metadata ?? {},
        }));
        const { error: actionInsertError } = await client.from("agent_actions").insert(rows);
        if (actionInsertError) {
          return json(req, 400, { error: actionInsertError.message });
        }
      }

      return json(req, 200, { ok: true, run_id: run.id });
    }

    if (req.method === "GET" && path.endsWith("dashboard")) {
      const dashboardScope = url.searchParams.get("dashboard_scope");
      const companyId = url.searchParams.get("company_id");
      let query = client
        .from("agent_runs")
        .select("id, company_id, owner_user_id, dashboard_scope, status, summary, created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (dashboardScope) query = query.eq("dashboard_scope", dashboardScope);
      if (companyId) query = query.eq("company_id", companyId);

      const { data: runs, error } = await query;
      if (error) return json(req, 400, { error: error.message });

      const runIds = (runs || []).map((r) => r.id);
      let actions: unknown[] = [];
      if (runIds.length > 0) {
        const { data: actionsData, error: actionsError } = await client
          .from("agent_actions")
          .select("id, run_id, portal, action_type, title, status, needs_approval, approval_note, approved_at, created_at")
          .in("run_id", runIds)
          .order("created_at", { ascending: false });
        if (actionsError) return json(req, 400, { error: actionsError.message });
        actions = actionsData || [];
      }

      return json(req, 200, { ok: true, runs: runs || [], actions });
    }

    if (req.method === "GET" && path.includes("run/")) {
      const runId = path.split("run/")[1];
      const { data: run, error: runError } = await client
        .from("agent_runs")
        .select("*")
        .eq("id", runId)
        .single();
      if (runError) return json(req, 404, { error: runError.message });

      const { data: actions, error: actionError } = await client
        .from("agent_actions")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: false });
      if (actionError) return json(req, 400, { error: actionError.message });

      return json(req, 200, { ok: true, run, actions: actions || [] });
    }

    if (req.method === "POST" && path.includes("action/") && path.endsWith("/approve")) {
      const actionId = path.split("action/")[1].replace("/approve", "");
      const body = await req.json();
      const approvalNote = (body.approval_note || "").toString() || null;

      const { data: action, error: actionError } = await client
        .from("agent_actions")
        .select("id, run_id")
        .eq("id", actionId)
        .single();
      if (actionError || !action) return json(req, 404, { error: "Action not found" });

      const { error: updateError } = await client
        .from("agent_actions")
        .update({
          status: "approved",
          needs_approval: false,
          approval_note: approvalNote,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", actionId);
      if (updateError) return json(req, 400, { error: updateError.message });

      const { error: runUpdateError } = await admin
        .from("agent_runs")
        .update({ status: "approved", finished_at: new Date().toISOString() })
        .eq("id", action.run_id)
        .eq("owner_user_id", user.id);
      if (runUpdateError) return json(req, 400, { error: runUpdateError.message });

      return json(req, 200, { ok: true });
    }

    if (req.method === "POST" && path.includes("action/") && path.endsWith("/edit")) {
      const actionId = path.split("action/")[1].replace("/edit", "");
      const body = await req.json();
      const editedWork = (body.edited_work || "").toString();
      const changeNote = (body.change_note || "").toString() || null;
      if (!editedWork.trim()) return json(req, 400, { error: "edited_work is required" });

      const { data: action, error: actionError } = await client
        .from("agent_actions")
        .select("id, status")
        .eq("id", actionId)
        .single();
      if (actionError || !action) return json(req, 404, { error: "Action not found" });

      const { error: editError } = await client
        .from("agent_action_edits")
        .insert({
          action_id: actionId,
          edited_by: user.id,
          edited_work: editedWork,
          change_note: changeNote,
        });
      if (editError) return json(req, 400, { error: editError.message });

      const { error: actionUpdateError } = await client
        .from("agent_actions")
        .update({
          generated_work: editedWork,
          status: action.status === "approved" ? "needs_approval" : action.status,
          needs_approval: true,
          approval_note: null,
          approved_by: null,
          approved_at: null,
        })
        .eq("id", actionId);
      if (actionUpdateError) return json(req, 400, { error: actionUpdateError.message });

      return json(req, 200, { ok: true });
    }

    return json(req, 404, { error: "Route not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return json(req, status, { error: message });
  }
});
