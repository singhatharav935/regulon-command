/**
 * AuthCallback — handles Supabase email-confirmation and OAuth redirects.
 *
 * When the user clicks the confirmation link in their email, Supabase redirects
 * them to this page with auth tokens in the URL fragment or query string.
 * This page:
 *  1. Lets Supabase's `detectSessionInUrl` exchange the code/token for a session.
 *  2. Reads the user's `registration_role` from their metadata.
 *  3. Stores the role in localStorage (for downstream components).
 *  4. Redirects the user to their persona-specific dashboard.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/dashboard-routes";
import { Loader2, CheckCircle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // The role might be passed as a query param from emailRedirectTo
        const roleFromUrl = searchParams.get("role");

        // 1. Wait for Supabase to process the URL tokens.
        //    `detectSessionInUrl: true` in the client config means Supabase
        //    auto-exchanges the PKCE code. We just need to wait for the session.
        //
        //    Try getSession first — if Supabase already processed the hash, the
        //    session will be available immediately.
        let session = (await supabase.auth.getSession()).data.session;

        // If no session yet, listen for the auth state change event
        if (!session) {
          session = await new Promise<typeof session>((resolve) => {
            const timeout = setTimeout(() => resolve(null), 15000);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, sess) => {
                if (
                  (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
                  sess
                ) {
                  clearTimeout(timeout);
                  subscription.unsubscribe();
                  resolve(sess);
                }
              }
            );
          });
        }

        if (cancelled) return;

        if (!session?.user) {
          setStatus("error");
          setErrorMessage(
            "Could not verify your email. The link may have expired. Please try signing in or requesting a new confirmation email."
          );
          return;
        }

        // 2. Determine the user's registration role
        const meta = session.user.user_metadata || {};
        const effectiveRole =
          roleFromUrl ||
          meta.registration_role ||
          localStorage.getItem("pending_registration_role") ||
          localStorage.getItem("current_user_role") ||
          "company_owner";

        // 3. Persist role and session tokens to localStorage
        localStorage.setItem("current_user_role", effectiveRole);
        localStorage.setItem("pending_registration_role", effectiveRole);
        localStorage.setItem("sannidh_auth_token", session.access_token);
        localStorage.setItem("sannidh_refresh_token", session.refresh_token || "");
        localStorage.setItem("auth_token", session.access_token);

        // Build user object for enhanced-auth compatibility
        const authUser = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: meta.full_name || "",
          registration_role: effectiveRole,
          verification_entity_name: meta.verification_entity_name,
          email_verified: !!session.user.email_confirmed_at,
          profile_completed: true,
          created_at: session.user.created_at,
          last_login: new Date().toISOString(),
        };
        localStorage.setItem("sannidh_user", JSON.stringify(authUser));

        // Handle company_owner company_id recovery
        if (effectiveRole === "company_owner") {
          const metaCompanyId = meta.company_id;
          if (metaCompanyId) {
            localStorage.setItem("sannidh_company_id", metaCompanyId);
          } else if (!localStorage.getItem("sannidh_company_id")) {
            const fallbackCompanyId = `user-${session.user.id}`;
            localStorage.setItem("sannidh_company_id", fallbackCompanyId);
            localStorage.setItem(
              "sannidh_company_data",
              JSON.stringify({
                id: fallbackCompanyId,
                company_name: meta.full_name
                  ? `${meta.full_name}'s Company`
                  : "My Company",
                industry: "General",
                compliance_score: 0,
                health_status: "unknown",
              })
            );
          }
        }

        // 4. Brief success state, then redirect
        if (!cancelled) {
          setStatus("success");
          setTimeout(() => {
            if (!cancelled) {
              navigate(getDashboardRoute(effectiveRole), { replace: true });
            }
          }, 1500);
        }
      } catch (err: any) {
        console.error("AuthCallback error:", err);
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            err.message || "An unexpected error occurred during email verification."
          );
        }
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === "processing" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Verifying your email...
            </h2>
            <p className="text-gray-400 text-sm">
              Please wait while we confirm your account.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Email Verified!
            </h2>
            <p className="text-gray-400 text-sm">
              Redirecting to your dashboard...
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading dashboard...</span>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Verification Failed
            </h2>
            <p className="text-gray-400 text-sm">{errorMessage}</p>
            <button
              onClick={() => navigate("/auth", { replace: true })}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
