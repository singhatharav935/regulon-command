import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Shield, 
  Briefcase, 
  Building2, 
  Users, 
  Gavel, 
  UserCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { enhancedAuth } from "@/lib/enhanced-auth";
import { createLocalDemoUser } from "@/lib/local-demo-auth";
import { SecurePasswordInput } from "@/components/auth/PasswordStrengthMeter";
import { EmailVerificationFlow } from "@/components/auth/EmailVerificationFlow";
import { MultiStepRegistration, type RegistrationFormData } from "@/components/auth/MultiStepRegistration";
import { EmailWaitingPage } from "@/components/auth/EmailWaitingPage";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = 'login' | 'forgot-password' | 'reset-password' | 'multi-step-register' | 'email-verification' | 'email-waiting';

const AuthReal = () => {
  const [searchParams] = useSearchParams();
  
  // Initialize mode from URL params IMMEDIATELY (not in useEffect)
  const getInitialMode = (): AuthMode => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "register" || urlMode === "signup" || urlMode === "multi-step") {
      return "multi-step-register";
    }
    if (urlMode === "forgot-password") return "forgot-password";
    if (urlMode === "reset-password") return "reset-password";
    if (urlMode === "verify-email") return "email-verification";
    return "login";
  };
  
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [registrationRole, setRegistrationRole] = useState("company_owner");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  // State for email waiting page
  const [waitingEmail, setWaitingEmail] = useState("");
  const [waitingRole, setWaitingRole] = useState("");
  const [waitingName, setWaitingName] = useState("");

  // User state for verification flow
  const [currentUser, setCurrentUser] = useState(enhancedAuth.getCurrentUser());

  // Initialize mode from URL params
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    const role = searchParams.get("role");
    const token = searchParams.get("token");
    
    // Support both 'register' and 'signup' modes - go directly to multi-step
    if (urlMode === "register" || urlMode === "signup") setMode("multi-step-register");
    if (urlMode === "forgot-password") setMode("forgot-password");
    if (urlMode === "reset-password" && token) {
      setMode("reset-password");
      setResetToken(token);
    }
    if (urlMode === "verify-email") setMode("email-verification");
    if (urlMode === "multi-step") setMode("multi-step-register");
    
    if (role) setRegistrationRole(role);
  }, [searchParams]);

  // Check if user needs email verification — but NEVER hijack a fresh signup/register URL
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    // If the user is explicitly trying to register/sign up, don't interrupt them
    // with a verification screen for a stale old user from a previous session.
    if (urlMode === "signup" || urlMode === "register" || urlMode === "multi-step") return;
    const user = enhancedAuth.getCurrentUser();
    if (user && !user.email_verified && mode !== 'email-verification') {
      setMode('email-verification');
      setCurrentUser(user);
    }
  }, [mode, searchParams]);

  // Persistent device login: auto-redirect to dashboard if already authenticated
  // Also handles email-verification callbacks (Supabase redirects here with a hash token)
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    // Don't auto-redirect if user is explicitly navigating to signup/register/reset flows
    if (urlMode === "signup" || urlMode === "register" || urlMode === "multi-step" || urlMode === "forgot-password" || urlMode === "reset-password" || urlMode === "verify-email") return;

    let cancelled = false;

    const redirectToDashboard = (userOrSession: any) => {
      if (cancelled) return;
      // Determine role: URL param > user_metadata > localStorage > default
      const urlRole = searchParams.get("role");
      const role = urlRole || userOrSession?.user_metadata?.registration_role || localStorage.getItem('current_user_role') || 'company_owner';
      // Keep localStorage in sync
      localStorage.setItem('current_user_role', role);
      localStorage.setItem('pending_registration_role', role);
      navigate(getDashboardRoute(role), { replace: true });
    };

    // 1) Check existing session first (covers "already logged in" case)
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled || !session?.user) return;
        redirectToDashboard(session.user);
      } catch {
        // Session check failed — stay on auth page
      }
    };
    checkExistingSession();

    // 2) Also listen for auth state changes — covers the email-verification
    //    callback where Supabase is still processing the hash token when
    //    getSession() runs above.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session?.user) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        redirectToDashboard(session.user);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [searchParams, navigate]);

  const roleOptions = [
    { value: "company_owner", label: "Company Owner", icon: Building2, description: "Business owner needing compliance management" },
    { value: "external_ca", label: "External CA", icon: UserCheck, description: "Chartered Accountant providing services" },
    { value: "in_house_ca", label: "In-House CA", icon: Shield, description: "Internal company CA professional" },
    { value: "ca_firm", label: "CA Firm", icon: Users, description: "CA firm managing multiple clients" },
    { value: "in_house_lawyer", label: "In-House Lawyer", icon: Gavel, description: "Legal professional within company" },
    { value: "admin", label: "Admin", icon: Briefcase, description: "System administrator" },
  ];

  // Dashboard route mapper - defined early so it can be used in handlers
  const getDashboardRoute = (role: string): string => {
    switch (role) {
      case "external_ca":
        return "/real-external-ca-dashboard";
      case "in_house_ca":
        return "/real-inhouse-ca-dashboard";
      case "ca_firm":
        return "/ca-firm-dashboard";
      case "admin":
        return "/admin-dashboard";
      case "in_house_lawyer":
        return "/lawyer-dashboard";
      case "company_owner":
        return "/real-company-dashboard";
      default:
        return "/real-company-dashboard";
    }
  };

  const selectedRole = roleOptions.find(r => r.value === registrationRole);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await enhancedAuth.login(email.trim(), password, rememberMe, trustDevice);

      // Use the role from Supabase user metadata
      const effectiveRole = response.user.registration_role || 'company_owner';

      // Keep localStorage in sync
      localStorage.setItem('current_user_role', effectiveRole);
      localStorage.setItem('pending_registration_role', effectiveRole);

      // Check if user needs email verification
      if (!response.user.email_verified) {
        setCurrentUser({...response.user, registration_role: effectiveRole});
        setMode('email-verification');
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to continue.",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully",
      });

      // Navigate to appropriate dashboard
      const redirectTo = (location.state as any)?.from || getDashboardRoute(effectiveRole);
      navigate(redirectTo);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!fullName.trim()) {
        toast({ title: "Error", description: "Full name is required", variant: "destructive" });
        return;
      }

      const localResponse = await createLocalDemoUser(
        email.trim(),
        password,
        fullName.trim(),
        registrationRole,
        entityName.trim() || undefined
      );

      if (!localResponse.success) {
        throw new Error(localResponse.error || "Failed to create account");
      }

      if (localResponse.requiresEmailConfirmation) {
        toast({
          title: "✅ Account Created!",
          description: `We've sent a confirmation email to ${email}. Please check your inbox.`,
        });
        setWaitingEmail(email.trim());
        setWaitingRole(registrationRole);
        setWaitingName(fullName.trim());
        setMode('email-waiting');
        return;
      }

      if (localResponse.user) {
        toast({
          title: "✅ Account Created Successfully!",
          description: `Welcome to SANNIDH, ${fullName}! Redirecting to your dashboard...`,
        });

        localStorage.setItem('pending_registration_role', registrationRole);
        localStorage.setItem('current_user_role', registrationRole);

        const dashboardRoute = getDashboardRoute(registrationRole);
        setTimeout(() => {
          navigate(dashboardRoute);
        }, 500);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiStepRegistration = async (formData: RegistrationFormData) => {
    try {
      const localResponse = await createLocalDemoUser(
        formData.email,
        formData.password,
        formData.fullName,
        formData.registrationRole,
        formData.entityName
      );

      if (!localResponse.success) {
        throw new Error(localResponse.error || "Failed to create account");
      }

      if (!localResponse.user) {
        throw new Error("Failed to create account. Please try again.");
      }

      // If email confirmation is required, show check-email message
      if (localResponse.requiresEmailConfirmation) {
        toast({
          title: "✅ Account Created!",
          description: `We've sent a confirmation email to ${formData.email}. Please check your inbox.`,
        });

        // Store role for after confirmation
        localStorage.setItem('pending_registration_role', formData.registrationRole);
        localStorage.setItem('current_user_role', formData.registrationRole);

        // Show the email waiting page instead of redirecting to login
        setWaitingEmail(formData.email);
        setWaitingRole(formData.registrationRole);
        setWaitingName(formData.fullName);
        setMode('email-waiting');
        return;
      }

      // Email confirmation not required — user is immediately signed in
      // For company_owner role, try registering with backend API
      if (formData.registrationRole === 'company_owner') {
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
          const companyResponse = await fetch(`${API_BASE}/company/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_name: formData.companyInfo?.name || formData.entityName || formData.fullName + "'s Company",
              industry: formData.companyInfo?.industry || null,
              email: formData.email,
              phone: null,
              gstin: null,
              pan: null,
              cin: null,
              company_type: null,
              state: formData.companyInfo?.location || null,
              password: formData.password
            })
          });
          
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            localStorage.setItem('sannidh_company_id', companyData.company_id);
            localStorage.setItem('sannidh_company_data', JSON.stringify({
              id: companyData.company_id,
              company_name: companyData.company_name,
              compliance_score: 0,
              health_status: 'unknown'
            }));
          }
        } catch (apiError) {
          console.warn('Backend company registration failed, using local fallback:', apiError);
          const localCompanyId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('sannidh_company_id', localCompanyId);
          localStorage.setItem('sannidh_company_data', JSON.stringify({
            id: localCompanyId,
            company_name: formData.companyInfo?.name || formData.entityName || formData.fullName + "'s Company",
            industry: formData.companyInfo?.industry || null,
            compliance_score: 0,
            health_status: 'unknown'
          }));
        }
      }

      toast({
        title: "✅ Account Created Successfully!",
        description: `Welcome to SANNIDH, ${formData.fullName}! Redirecting to your dashboard...`,
      });

      // Store role info
      localStorage.setItem('pending_registration_role', formData.registrationRole);
      localStorage.setItem('current_user_role', formData.registrationRole);

      // Redirect to dashboard
      const dashboardRoute = getDashboardRoute(formData.registrationRole);
      setTimeout(() => {
        window.location.href = dashboardRoute;
      }, 500);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await enhancedAuth.requestPasswordReset(email.trim());
      
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      
      setMode('login');
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await enhancedAuth.resetPassword(resetToken, password);
      
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully. Please log in.",
      });
      
      setMode('login');
      setPassword('');
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await enhancedAuth.resendEmailVerification();
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      });
    }
  };

  const handleEmailVerified = () => {
    const user = enhancedAuth.getCurrentUser();
    if (user) {
      navigate(getDashboardRoute(user.registration_role));
    }
  };

  const renderSecurityFeatures = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-3"
    >
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Shield className="w-4 h-4 text-green-500" />
        <span>256-bit SSL encryption</span>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span>GDPR compliant data protection</span>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Smartphone className="w-4 h-4 text-blue-500" />
        <span>Multi-device session management</span>
      </div>
    </motion.div>
  );

  // Email waiting page mode — shown after signup when email confirmation is required
  if (mode === 'email-waiting' && waitingEmail) {
    return (
      <EmailWaitingPage
        email={waitingEmail}
        registrationRole={waitingRole}
        fullName={waitingName}
        onUseAnotherAccount={() => {
          enhancedAuth.logout();
          setMode('login');
          setCurrentUser(null);
          setWaitingEmail('');
          setWaitingRole('');
          setWaitingName('');
        }}
      />
    );
  }

  // Multi-step registration mode
  if (mode === 'multi-step-register') {
    return (
      <MultiStepRegistration 
        onComplete={handleMultiStepRegistration}
        initialRole={registrationRole}
      />
    );
  }

  // Email verification mode
  if (mode === 'email-verification' && currentUser) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <BackgroundEffects />
        <div className="w-full max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-300">Complete your account setup</p>
          </motion.div>

          <EmailVerificationFlow
            email={currentUser.email}
            isVerified={currentUser.email_verified}
            onResendVerification={handleResendVerification}
            className="w-full"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <Button
              variant="ghost"
              onClick={() => {
                enhancedAuth.logout();
                setMode('login');
                setCurrentUser(null);
              }}
              className="text-primary hover:text-primary/80"
            >
              Use Different Account
            </Button>
          </motion.div>

          {renderSecurityFeatures()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <BackgroundEffects />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <div className="p-0">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-cyan-500 rounded-full flex items-center justify-center mb-4"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'reset-password' && 'New Password'}
              </h1>
              
              <p className="text-gray-300">
                {mode === 'login' && 'Sign in to your compliance workspace'}
                {mode === 'forgot-password' && 'Enter your email to reset your password'}
                {mode === 'reset-password' && 'Create a new secure password'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="border-white/30 data-[state=checked]:bg-primary"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-300">
                        Remember me
                      </Label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trust-device"
                      checked={trustDevice}
                      onCheckedChange={setTrustDevice}
                      className="border-white/30 data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="trust-device" className="text-sm text-gray-300">
                      Trust this device
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-600 text-white font-medium py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/auth?mode=signup&role=company_owner')}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      Don't have an account? <span className="font-medium">Sign up</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* register mode removed - signup redirects to Get Started page */}

              {mode === 'forgot-password' && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2 text-sm text-blue-300 bg-blue-600/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>Enter your email address and we'll send you a password reset link</span>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-600 text-white font-medium py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending reset email...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary hover:text-primary/80 text-sm flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Sign In
                    </button>
                  </div>
                </motion.form>
              )}

              {mode === 'reset-password' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetPassword}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2 text-sm text-green-300 bg-green-600/20 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>Create a new secure password for your account</span>
                  </div>

                  <SecurePasswordInput
                    label="New Password"
                    value={password}
                    onValueChange={setPassword}
                    placeholder="Create a new secure password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-600 text-white font-medium py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Resetting password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary hover:text-primary/80 text-sm flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Sign In
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {renderSecurityFeatures()}
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthReal;