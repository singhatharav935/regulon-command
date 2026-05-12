import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, Loader, Building2, User, FileText, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // New states for Unified Consent Flow
  const [authStep, setAuthStep] = useState<"initial" | "gst_otp">("initial");
  const [otp, setOtp] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [gstinInput, setGstinInput] = useState("");

  useEffect(() => {
    if (!token) { setState("not_found"); return; }
    (async () => {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}?action=status&token=${token}`);
      const data = await res.json();
      if (!res.ok || !data.success) { setState("not_found"); return; }
      setInfo(data);
      if (data.gstin) setGstinInput(data.gstin);
      
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

  const sendGstOtp = async () => {
    setIsOtpLoading(true);
    try {
      const actualGstin = info?.gstin || gstinInput;
      if (!actualGstin || actualGstin.length !== 15) {
        alert("Please provide a valid 15-digit GSTIN.");
        setIsOtpLoading(false);
        return;
      }
      
      // Make real call to GSTN API
      const res = await supabase.functions.invoke('gstn-otp-auth', {
        body: { action: 'send_otp', gstin: actualGstin }
      });
      if (res.error) throw res.error;
      
      setAuthStep("gst_otp");
    } catch (err: any) {
      alert("Error sending OTP: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsOtpLoading(false);
    }
  };

  const verifyGstOtpAndApprove = async () => {
    setIsOtpLoading(true);
    try {
      const actualGstin = info?.gstin || gstinInput;
      
      // Verify real OTP with GSTN API
      const res = await supabase.functions.invoke('gstn-otp-auth', {
        body: { action: 'verify_otp', gstin: actualGstin, otp: otp }
      });
      if (res.error) throw res.error;
      
      // If OTP succeeds, Government token is received. Now fully approve consent.
      await respond("approved");
    } catch (err: any) {
      alert("Invalid OTP or Error: " + (err.message || JSON.stringify(err)));
      setIsOtpLoading(false);
    }
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
              ? `${info?.ca_name || "Your CA"} can now securely sync your Bank and GSTN data.`
              : "No data will be accessed. Your CA has been notified."}
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
  const isSubmitting = state === "submitting" || isOtpLoading;
  const formattedDate = info ? new Date(info.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">SANNIDH Unified Authorization</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Connect Statutory Data</h1>
          <p className="text-slate-400">Securely sync your Bank and GSTN history with {info?.ca_name || "your CA"}.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-6">
          
          {authStep === "initial" ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 space-y-2">
                <p className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  What this will connect:
                </p>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span><strong className="text-white">Bank Account:</strong> Auto-fetch statements via RBI Account Aggregator</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span><strong className="text-white">GSTN Portal:</strong> Fetch 2-year filing history & notices via secure OTP</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span><strong className="text-white">MCA Portal:</strong> Public director & balance sheet records</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm text-slate-400 font-medium ml-1">Confirm your GSTIN</label>
                <Input 
                  value={gstinInput} 
                  onChange={(e) => setGstinInput(e.target.value)} 
                  placeholder="e.g. 27AADCB2230M1Z2"
                  className="bg-slate-950 border-slate-700 text-white font-mono h-12 text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={() => respond("rejected")}
                  disabled={isSubmitting}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 py-6 text-base"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Decline
                </Button>
                <Button
                  onClick={sendGstOtp}
                  disabled={isSubmitting || gstinInput.length !== 15}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-6 text-base shadow-lg shadow-indigo-500/25"
                >
                  {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Smartphone className="w-5 h-5 mr-2" /> Request GST OTP</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <Smartphone className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Enter GST OTP</h3>
                <p className="text-slate-400 text-sm mt-2">
                  An OTP has been sent to the mobile number registered with GSTIN <strong>{info?.gstin || gstinInput}</strong>.
                </p>
              </div>

              <div className="space-y-4 px-6">
                <Input 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder="Enter 6-digit OTP"
                  className="bg-slate-950 border-slate-700 text-white font-mono h-14 text-2xl text-center tracking-widest"
                  maxLength={6}
                />
                
                <Button
                  onClick={verifyGstOtpAndApprove}
                  disabled={isSubmitting || otp.length < 4}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg shadow-lg shadow-green-500/25"
                >
                  {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5 mr-2" /> Verify & Authorize Access</>}
                </Button>

                <Button
                  onClick={() => setAuthStep("initial")}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-slate-600 text-xs">
          🔒 Secured by SANNIDH · 100% API Driven · Zero Passwords Stored
        </p>
      </motion.div>
    </div>
  );
}
