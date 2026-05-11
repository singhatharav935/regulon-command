import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, Loader2, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import BackgroundEffects from '@/components/BackgroundEffects';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailWaitingPageProps {
  email: string;
  registrationRole: string;
  fullName: string;
  onUseAnotherAccount: () => void;
}

const getDashboardRoute = (role: string): string => {
  switch (role) {
    case "external_ca":
      return "/real-external-ca-dashboard";
    case "in_house_ca":
      return "/real-inhouse-ca-dashboard";
    case "ca_firm":
      return "/dashboards/ca-firm";
    case "admin":
      return "/admin-dashboard";
    case "in_house_lawyer":
      return "/dashboards/lawyer";
    case "company_owner":
    default:
      return "/real-company-dashboard";
  }
};

export const EmailWaitingPage: React.FC<EmailWaitingPageProps> = ({
  email,
  registrationRole,
  fullName,
  onUseAnotherAccount,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60); // Start with a 60s cooldown since we just sent one
  const [pollCount, setPollCount] = useState(0);

  // Shared handler for when verification is confirmed — prevents duplicate toasts/redirects
  const handleVerified = useCallback(() => {
    if (isVerified) return; // guard against duplicate calls
    setIsVerified(true);

    // Store role info
    localStorage.setItem('pending_registration_role', registrationRole);
    localStorage.setItem('current_user_role', registrationRole);

    toast({
      title: "✅ Email Verified!",
      description: `Welcome to SANNIDH, ${fullName}! Redirecting to your dashboard...`,
    });

    // Navigate to dashboard after short delay for the success animation
    setTimeout(() => {
      const dashboardRoute = getDashboardRoute(registrationRole);
      navigate(dashboardRoute);
    }, 2000);
  }, [isVerified, registrationRole, fullName, navigate, toast]);

  // Poll Supabase for session confirmation.
  // Uses refreshSession() to force a fresh read from Supabase instead of relying
  // on the in-memory cached session (which won't update when verification
  // happens in a different browser tab).
  const checkVerification = useCallback(async () => {
    try {
      // First try a lightweight getSession (reads localStorage)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        handleVerified();
        return true;
      }

      // If no confirmed session yet, try refreshing — this forces Supabase to
      // fetch fresh user data from the server, picking up verification done in
      // another tab.
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session?.user?.email_confirmed_at) {
        handleVerified();
        return true;
      }
    } catch {
      // Silently ignore — we'll try again on next poll
    }
    return false;
  }, [handleVerified]);

  // Set up polling interval
  useEffect(() => {
    if (isVerified) return;

    const interval = setInterval(async () => {
      setPollCount(prev => prev + 1);
      await checkVerification();
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [isVerified, checkVerification]);

  // Listen for Supabase auth state changes (fires when verification link is
  // opened in the SAME tab or when Supabase processes a cross-tab token update)
  useEffect(() => {
    if (isVerified) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        session?.user?.email_confirmed_at
      ) {
        handleVerified();
      }
    });

    return () => subscription.unsubscribe();
  }, [isVerified, handleVerified]);

  // Cross-tab detection: listen for localStorage changes made by the other tab
  // where the user clicked the verification link. Supabase stores the session
  // in localStorage, so when the new tab writes it, this event fires here.
  useEffect(() => {
    if (isVerified) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Supabase stores session under a key containing "auth-token"
      if (e.key && (e.key.includes('auth-token') || e.key.includes('supabase'))) {
        // Session was updated in another tab — check if user is now verified
        checkVerification();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isVerified, checkVerification]);

  // Visibility change: when user switches back to this tab after clicking the
  // verification link in another tab, immediately check for verification.
  useEffect(() => {
    if (isVerified) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVerification();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVerified, checkVerification]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?mode=login&role=${registrationRole}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: "A new confirmation email has been sent to your inbox.",
      });
      setCountdown(60);
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <BackgroundEffects />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {isVerified ? (
            /* ── Success State ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card className="p-8 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                <p className="text-gray-300 mb-6">
                  Welcome, <span className="text-white font-medium">{fullName}</span>!
                  <br />Redirecting to your dashboard...
                </p>

                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading dashboard...</span>
                </div>
              </Card>
            </motion.div>
          ) : (
            /* ── Waiting State ── */
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Card className="p-8 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                {/* Animated mail icon */}
                <div className="text-center mb-8">
                  <motion.div
                    className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 relative"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(0, 212, 255, 0.3)',
                        '0 0 0 20px rgba(0, 212, 255, 0)',
                        '0 0 0 0 rgba(0, 212, 255, 0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  >
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Mail className="w-10 h-10 text-primary" />
                    </motion.div>
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                  <p className="text-gray-300">
                    We've sent a confirmation email to
                  </p>
                  <p className="text-primary font-medium mt-1">{email}</p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <motion.div
                    className="flex items-center gap-2 text-sm text-gray-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <RefreshCw className={`w-4 h-4 ${pollCount > 0 ? 'animate-spin' : ''}`} 
                      style={{ animationDuration: '3s' }} 
                    />
                    <span>Waiting for verification...</span>
                  </motion.div>
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">What to do:</h3>
                  <ol className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary/30 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                      <span>Open your email inbox</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary/30 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                      <span>Find the email from <strong className="text-white">SANNIDH</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary/30 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                      <span>Click the <strong className="text-white">Confirm your email</strong> button</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary/30 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                      <span>This page will <strong className="text-white">automatically redirect</strong> you</span>
                    </li>
                  </ol>
                </div>

                {/* Check spam notice */}
                <div className="text-center text-sm text-gray-400 mb-6">
                  <p>Can't find it? Check your <strong className="text-gray-300">spam</strong> or <strong className="text-gray-300">promotions</strong> folder.</p>
                </div>

                {/* Resend button */}
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={isResending || countdown > 0}
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 mb-3"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Resend in {countdown}s
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Confirmation Email
                    </>
                  )}
                </Button>

                {/* Back to login */}
                <Button
                  variant="ghost"
                  onClick={onUseAnotherAccount}
                  className="w-full text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Use a Different Account
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
