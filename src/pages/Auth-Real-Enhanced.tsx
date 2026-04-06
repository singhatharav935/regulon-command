import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'multi-step-register' | 'email-verification';

const AuthReal = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [searchParams] = useSearchParams();
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

  // User state for verification flow
  const [currentUser, setCurrentUser] = useState(enhancedAuth.getCurrentUser());

  // Initialize mode from URL params
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    const role = searchParams.get("role");
    const token = searchParams.get("token");
    
    if (urlMode === "register") setMode("register");
    if (urlMode === "forgot-password") setMode("forgot-password");
    if (urlMode === "reset-password" && token) {
      setMode("reset-password");
      setResetToken(token);
    }
    if (urlMode === "verify-email") setMode("email-verification");
    if (urlMode === "multi-step") setMode("multi-step-register");
    
    if (role) setRegistrationRole(role);
  }, [searchParams]);

  // Check if user needs email verification
  useEffect(() => {
    const user = enhancedAuth.getCurrentUser();
    if (user && !user.email_verified && mode !== 'email-verification') {
      setMode('email-verification');
      setCurrentUser(user);
    }
  }, [mode]);

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
      case "ca_firm":
        return "/ca-dashboard";
      case "admin":
        return "/admin-dashboard";
      case "in_house_lawyer":
        return "/lawyer-dashboard";
      case "company_owner":
        return "/real-company-dashboard";  // REAL Company Dashboard - separate from demo
      default:
        return "/real-company-dashboard";  // Default to real company dashboard
    }
  };

  const selectedRole = roleOptions.find(r => r.value === registrationRole);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await enhancedAuth.login(email.trim(), password, rememberMe, trustDevice);

      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully",
      });

      // Check if user needs email verification
      if (!response.user.email_verified) {
        setCurrentUser(response.user);
        setMode('email-verification');
        return;
      }

      // Navigate to appropriate dashboard
      const redirectTo = (location.state as any)?.from || getDashboardRoute(response.user.registration_role);
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

      // Use local demo mode directly
      const localResponse = await createLocalDemoUser(
        email.trim(),
        password,
        fullName.trim(),
        registrationRole,
        entityName.trim() || undefined
      );

      if (localResponse.success && localResponse.user) {
        toast({
          title: "✅ Account Created Successfully!",
          description: `Welcome to REGULON, ${fullName}! Redirecting to your dashboard...`,
        });

        // Store user info
        localStorage.setItem('pending_registration_role', registrationRole);
        localStorage.setItem('current_user_role', registrationRole);
        
        // For company_owner, store company ID for real dashboard
        if (registrationRole === 'company_owner') {
          const localCompanyId = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('regulon_company_id', localCompanyId);
          localStorage.setItem('regulon_company_data', JSON.stringify({
            id: localCompanyId,
            company_name: entityName || fullName + "'s Company",
            industry: 'General',
            compliance_score: 0,
            health_status: 'unknown'
          }));
        }
        
        // Navigate to appropriate dashboard based on role
        const dashboardRoute = getDashboardRoute(registrationRole);
        setTimeout(() => {
          navigate(dashboardRoute);
        }, 500);
      } else {
        throw new Error(localResponse.error || "Failed to create account");
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
    console.log("Processing registration for:", formData.registrationRole);
    
    try {
      const localResponse = await createLocalDemoUser(
        formData.email,
        formData.password,
        formData.fullName,
        formData.registrationRole,
        formData.entityName
      );

      if (localResponse.success && localResponse.user) {
        // For company_owner role, register with backend API to get isolated dashboard
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
                gstin: null,  // Optional - user can add later
                pan: null,    // Optional - user can add later
                cin: null,    // Optional - user can add later
                company_type: null,
                state: formData.companyInfo?.location || null,
                password: formData.password
              })
            });
            
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              // Store company ID for Real Company Dashboard
              localStorage.setItem('regulon_company_id', companyData.company_id);
              localStorage.setItem('regulon_company_data', JSON.stringify({
                id: companyData.company_id,
                company_name: companyData.company_name,
                compliance_score: 0,
                health_status: 'unknown'
              }));
              console.log('Company registered with backend:', companyData.company_id);
            }
          } catch (apiError) {
            console.warn('Backend registration failed, using local storage:', apiError);
            // Fallback: create local company ID
            const localCompanyId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('regulon_company_id', localCompanyId);
            localStorage.setItem('regulon_company_data', JSON.stringify({
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
          description: `Welcome to REGULON, ${formData.fullName}! Redirecting to your dashboard...`,
        });

        // Store user info and role
        localStorage.setItem('pending_registration_role', formData.registrationRole);
        localStorage.setItem('current_user_role', formData.registrationRole);
        
        // Get the correct dashboard route based on role
        const dashboardRoute = getDashboardRoute(formData.registrationRole);
        
        // Small delay for toast to show, then redirect to dashboard
        setTimeout(() => {
          navigate(dashboardRoute);
        }, 500);
      } else {
        throw new Error(localResponse.error || "Failed to create account");
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
              className="text-purple-300 hover:text-purple-200"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'register' && 'Join REGULON'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'reset-password' && 'New Password'}
              </h1>
              
              <p className="text-gray-300">
                {mode === 'login' && 'Sign in to your compliance workspace'}
                {mode === 'register' && 'Create your professional account'}
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
                        className="border-white/30 data-[state=checked]:bg-purple-600"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-300">
                        Remember me
                      </Label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-sm text-purple-300 hover:text-purple-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trust-device"
                      checked={trustDevice}
                      onCheckedChange={setTrustDevice}
                      className="border-white/30 data-[state=checked]:bg-purple-600"
                    />
                    <Label htmlFor="trust-device" className="text-sm text-gray-300">
                      Trust this device
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
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
                      onClick={() => setMode('register')}
                      className="text-purple-300 hover:text-purple-200 text-sm"
                    >
                      Don't have an account? <span className="font-medium">Sign up</span>
                    </button>
                  </div>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode('multi-step-register')}
                      className="text-purple-300 border-purple-300 hover:bg-purple-600/20"
                    >
                      Professional Registration
                    </Button>
                  </div>
                </motion.form>
              )}

              {mode === 'register' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="fullName" className="text-white">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Professional Role</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {roleOptions.map((role) => {
                        const Icon = role.icon;
                        return (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setRegistrationRole(role.value)}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                              registrationRole === role.value
                                ? "bg-purple-600/30 border-purple-400 text-white"
                                : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5" />
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-sm opacity-70">{role.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(registrationRole === "external_ca" || registrationRole === "ca_firm") && (
                    <div>
                      <Label htmlFor="entityName" className="text-white">
                        {registrationRole === "ca_firm" ? "Firm Name" : "Practice Name"}
                      </Label>
                      <Input
                        id="entityName"
                        type="text"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 mt-1"
                        placeholder="Enter your firm/practice name"
                      />
                    </div>
                  )}

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

                  <SecurePasswordInput
                    label="Password"
                    value={password}
                    onValueChange={setPassword}
                    placeholder="Create a secure password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-purple-300 hover:text-purple-200 text-sm"
                    >
                      Already have an account? <span className="font-medium">Sign in</span>
                    </button>
                    
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMode('multi-step-register')}
                        className="text-purple-300 hover:text-purple-200 text-sm"
                      >
                        Prefer guided setup?
                      </Button>
                    </div>
                  </div>
                </motion.form>
              )}

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
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
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
                      className="text-purple-300 hover:text-purple-200 text-sm flex items-center justify-center"
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
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
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
                      className="text-purple-300 hover:text-purple-200 text-sm flex items-center justify-center"
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