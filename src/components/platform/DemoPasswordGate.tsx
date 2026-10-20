/**
 * DemoPasswordGate — Password protection for the Demo Dashboard.
 * Opens as a modal overlay. Password is hardcoded by the owner.
 * Correct password → navigates to /dashboard
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, X, ShieldCheck, AlertCircle } from "lucide-react";

interface DemoPasswordGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Owner-set password ────────────────────────────────────────────────────────
const DEMO_PASSWORD = "Risath18502371";

export function DemoPasswordGate({ isOpen, onClose, onSuccess }: DemoPasswordGateProps) {
  const [value, setValue]         = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState(false);
  const [shake, setShake]         = useState(false);
  const [checking, setChecking]   = useState(false);
  const [success, setSuccess]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setValue("");
      setError(false);
      setSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (checking || success) return;

    setChecking(true);
    // Small delay to feel like it's verifying
    setTimeout(() => {
      if (value === DEMO_PASSWORD) {
        setError(false);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setValue("");
          setSuccess(false);
        }, 800);
      } else {
        setError(true);
        setChecking(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setValue("");
        inputRef.current?.focus();
      }
    }, 400);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="pointer-events-auto w-full max-w-sm"
            >
              <div className="relative rounded-2xl border border-white/10 bg-[#0d0f14] shadow-2xl shadow-black/60 overflow-hidden">

                {/* Top glow accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-7 space-y-6">
                  {/* Icon + heading */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                      success
                        ? "bg-green-500/20 border-green-500/40"
                        : error
                        ? "bg-red-500/20 border-red-500/30"
                        : "bg-cyan-500/15 border-cyan-500/25"
                    }`}>
                      {success
                        ? <ShieldCheck className="w-7 h-7 text-green-400" />
                        : <Lock className={`w-7 h-7 ${error ? "text-red-400" : "text-cyan-400"}`} />
                      }
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Demo Dashboard Access</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        This is a restricted preview. Enter the access password to continue.
                      </p>
                    </div>
                  </div>

                  {/* Password form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Access Password</label>
                      <div className="relative">
                        <input
                          ref={inputRef}
                          type={showPw ? "text" : "password"}
                          value={value}
                          onChange={e => { setValue(e.target.value); setError(false); }}
                          placeholder="Enter password"
                          autoComplete="off"
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all ${
                            error
                              ? "border-red-500/50 focus:border-red-500"
                              : success
                              ? "border-green-500/50"
                              : "border-white/10 focus:border-cyan-500/60"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Error message */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[11px] text-red-400"
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Incorrect password. Please try again.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="submit"
                      disabled={!value || checking || success}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                        success
                          ? "bg-green-500 text-white"
                          : checking
                          ? "bg-cyan-500/50 text-cyan-200 cursor-wait"
                          : !value
                          ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                          : "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/20"
                      }`}
                    >
                      {success ? "✓ Access Granted — Opening Dashboard..." : checking ? "Verifying..." : "Unlock Demo Dashboard"}
                    </button>
                  </form>

                  <p className="text-center text-[10px] text-muted-foreground/50">
                    🔒 Protected by Sannidh · Authorized access only
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
