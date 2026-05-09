import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, Loader, Building2, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ConsentInfo {
  id: string;
  client_name: string;
  ca_name: string | null;
  ca_firm_name: string | null;
  gstin: string | null;
  pan: string | null;
  consent_status: "pending" | "approved" | "rejected";
  created_at: string;
}

type PageState = "loading" | "pending" | "submitting" | "approved" | "rejected" | "already_responded" | "not_found" | "error";

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-consent`;

export default function ConsentApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<ConsentInfo | null>(null);
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    if (!token) { setState("not_found"); return; }
    (async () => {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}?action=status&token=${token}`);
      const data = await res.json();
      if (!res.ok || !data.success) { setState("not_found"); return; }
      setInfo(data);
      if (data.consent_status === "approved") setState("already_responded");
      else if (data.consent_status === "rejected") setState("already_responded");
      else setState("pending");
    })();
  }, [token]);

  const respond = async (decision: "approved" | "rejected") => {
    setState("submitting");
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}?action=respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, decision }),
    });
    const data = await res.json();
    if (res.ok && data.success) setState(decision);
    else setState("error");
  };

  // ── Loading ──
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (state === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-slate-400">This consent link is invalid or has expired. Please contact your CA.</p>
        </div>
      </div>
    );
  }

  // ── Already responded ──
  if (state === "already_responded") {
    const wasApproved = info?.consent_status === "approved";
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center max-w-md">
          {wasApproved
            ? <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            : <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />}
          <h1 className="text-2xl font-bold text-white mb-2">
            {wasApproved ? "Already Authorized" : "Already Declined"}
          </h1>
          <p className="text-slate-400">
            {wasApproved
              ? "You have already authorized access. Your CA can now manage your compliance filings."
              : "You have already declined this request. Contact your CA if you changed your mind."}
          </p>
        </div>
      </div>
    );
  }

  // ── Success states ──
  if (state === "approved" || state === "rejected") {
    const approved = state === "approved";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-slate-950 p-4"
      >
        <div className="text-center max-w-md">
          {approved
            ? <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            : <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />}
          <h1 className="text-3xl font-bold text-white mb-3">
            {approved ? "Access Authorized ✅" : "Request Declined"}
          </h1>
          <p className="text-slate-300 text-lg mb-2">
            {approved
              ? `${info?.ca_name || "Your CA"} can now manage your compliance filings on SANNIDH.`
              : "No data will be accessed. Your CA has been notified."}
          </p>
          <p className="text-slate-500 text-sm mt-4">
            {approved
              ? "You can revoke this access at any time by contacting your CA."
              : "You can always authorize later by requesting a new link from your CA."}
          </p>
          <div className="mt-8 p-4 rounded-xl border border-slate-700 bg-slate-900/50 text-xs text-slate-500">
            🔒 Powered by SANNIDH — India's Compliance AI Platform
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Error ──
  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-4">Please try again or contact your CA.</p>
          <Button onClick={() => setState("pending")} variant="outline" className="border-slate-600 text-slate-300">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Main consent page (pending) ──
  const isSubmitting = state === "submitting";
  const formattedDate = info ? new Date(info.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">SANNIDH Secure Authorization</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Access Request</h1>
          <p className="text-slate-400">Review and respond to your CA's authorization request</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-6">
          {/* CA Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{info?.ca_name || "Your CA"}</p>
              {info?.ca_firm_name && <p className="text-slate-400 text-sm">{info.ca_firm_name}</p>}
              <p className="text-slate-500 text-xs mt-0.5">Requested on {formattedDate}</p>
            </div>
          </div>

          {/* Client info */}
          <div className="mb-6">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Request Details</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Company</p>
                  <p className="text-white text-sm font-medium">{info?.client_name}</p>
                </div>
              </div>
              {info?.gstin && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">GSTIN</p>
                    <p className="text-white text-sm font-mono">{info.gstin}</p>
                  </div>
                </div>
              )}
              {info?.pan && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">PAN</p>
                    <p className="text-white text-sm font-mono">{info.pan}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What access means */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6 text-sm text-slate-400 space-y-1.5">
            <p className="text-slate-300 font-medium mb-2">What this authorization allows:</p>
            <p>✅ Monitor GST, MCA, Income Tax compliance status</p>
            <p>✅ Prepare and review filings on your behalf</p>
            <p>✅ Receive compliance deadline reminders</p>
            <p className="text-slate-500 text-xs mt-2">❌ Does not allow filing submissions without your approval</p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => respond("rejected")}
              disabled={isSubmitting}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 py-3"
            >
              {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" />Decline</>}
            </Button>
            <Button
              onClick={() => respond("approved")}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white py-3"
            >
              {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Authorize</>}
            </Button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs">
          🔒 Secured by SANNIDH · Your decision is recorded and encrypted · sannidh.in
        </p>
      </motion.div>
    </div>
  );
}
