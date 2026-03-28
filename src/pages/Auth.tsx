import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Shield, Briefcase, Building2, Users, Gavel, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const AUTH_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

type RestLoginResponse = {
  access_token?: string;
  refresh_token?: string;
  error_description?: string;
  msg?: string;
  error?: string;
};

const signInViaRest = async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  if (!supabaseUrl || !publishableKey) {
    throw new Error("Supabase env missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    const payload = (await res.json().catch(() => ({}))) as RestLoginResponse;

    if (!res.ok || !payload?.access_token || !payload?.refresh_token) {
      const details =
        payload?.error_description ||
        payload?.msg ||
        payload?.error ||
        `Login failed (HTTP ${res.status}).`;
      throw new Error(details);
    }

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Login request timed out. Please check Supabase connection and retry.");
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach Supabase auth host. Verify VITE_SUPABASE_URL and internet access.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};


const personas = [
  {
    id: "company_owner",
    label: "Company Owner",
    description: "Client dashboard access for company compliance control",
    icon: Building2,
  },
  {
    id: "external_ca",
    label: "External CA",
    description: "Solo/firm CA workflow without in-house lawyer dependency",
    icon: Briefcase,
  },
  {
    id: "ca_firm",
    label: "CA Firm",
    description: "CA firm workspace for multi-CA oversight and search",
    icon: Briefcase,
  },
  {
    id: "in_house_ca",
    label: "In-House CA",
    description: "Regulon internal CA workflow with legal review path",
    icon: Users,
  },
  {
    id: "in_house_lawyer",
    label: "In-House Lawyer",
    description: "Legal QA, citation validation, and filing sign-off",
    icon: Gavel,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Platform governance and tenant-level controls",
    icon: UserCheck,
  },
] as const;

type Persona = (typeof personas)[number]["id"];

const isPersona = (value: string | null): value is Persona => {
  return personas.some((persona) => persona.id === value);
};

const roleNeedsRegistrationNumber = (persona: Persona) =>
  persona === "company_owner" || persona === "admin" || persona === "ca_firm";

const roleNeedsLicenseNumber = (persona: Persona) =>
  persona === "external_ca" || persona === "in_house_ca" || persona === "in_house_lawyer";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const returnPath = (location.state as { from?: string } | null)?.from;

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const initialPersona = isPersona(searchParams.get("role")) ? (searchParams.get("role") as Persona) : "company_owner";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona>(initialPersona);
  const [entityName, setEntityName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const submitFailSafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncMode = searchParams.get("mode") === "signup" ? "signup" : "login";
    const syncPersona = isPersona(searchParams.get("role")) ? (searchParams.get("role") as Persona) : "company_owner";
    setMode(syncMode);
    setSelectedPersona(syncPersona);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (submitFailSafeRef.current) {
        clearTimeout(submitFailSafeRef.current);
        submitFailSafeRef.current = null;
      }
    };
  }, []);

  const updateMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode, role: selectedPersona });
  };

  const updatePersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setSearchParams({ mode, role: persona });
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
    }

    if (mode === "signup" && fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    submitFailSafeRef.current = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Error",
        description: "Request timed out. Please check internet/Supabase connection and try again.",
        variant: "destructive",
      });
    }, AUTH_TIMEOUT_MS + 1000);

    try {
      if (mode === "login") {
        let loginError: any = null;
        try {
          const sdkLogin = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            AUTH_TIMEOUT_MS,
            "SDK login timed out.",
          );
          loginError = sdkLogin.error;
        } catch (sdkError: any) {
          if (typeof sdkError?.message === "string" && sdkError.message.includes("timed out")) {
            const rest = await signInViaRest(email, password);
            const setSession = await withTimeout(
              supabase.auth.setSession({
                access_token: rest.accessToken,
                refresh_token: rest.refreshToken,
              }),
              10000,
              "Auth session setup timed out after REST login.",
            );
            loginError = setSession.error;
          } else {
            throw sdkError;
          }
        }
        if (loginError) throw loginError;

        toast({ title: "Welcome back", description: "Login successful. Redirecting to your workspace." });
        navigate(returnPath || "/app", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/auth?mode=login&role=${selectedPersona}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              registration_role: selectedPersona,
              verification_entity_name: entityName,
              verification_registration_number: registrationNumber,
              verification_license_number: licenseNumber,
              verification_jurisdiction: jurisdiction,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const supabaseAny = supabase as any;
          await supabaseAny.from("user_verifications").upsert({
            user_id: data.user.id,
            persona: selectedPersona,
            entity_name: entityName,
            registration_number: registrationNumber || null,
            license_number: licenseNumber || null,
            jurisdiction: jurisdiction,
            status: "pending",
            is_verified: false,
          }, { onConflict: "user_id" });
        }

        if (data.session) {
          toast({ title: "Account created", description: "Complete verification to unlock dashboard access." });
          navigate("/app/verification", { replace: true });
        } else {
          toast({
            title: "Confirm your email",
            description: "We sent a verification link. After verification, login with the same selected role.",
          });
          updateMode("login");
        }
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("User already registered")) {
        message = "An account with this email already exists. Please login instead.";
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      if (submitFailSafeRef.current) {
        clearTimeout(submitFailSafeRef.current);
        submitFailSafeRef.current = null;
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-3xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Platform
        </button>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 text-gradient-primary">REGULON ACCESS</h1>
            <p className="text-muted-foreground">Role-specific authentication and verification-first onboarding</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {personas.map((persona) => {
              const Icon = persona.icon;
              const isActive = selectedPersona === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => updatePersona(persona.id)}
                  className={`rounded-xl border p-4 text-left transition ${isActive ? "border-cyan-400 bg-cyan-500/10" : "border-border hover:border-cyan-600/60"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-cyan-300" />
                    <p className="font-semibold">{persona.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{persona.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mb-6">
            <Button type="button" variant={mode === "login" ? "default" : "outline"} onClick={() => updateMode("login")} className="flex-1">
              Login
            </Button>
            <Button type="button" variant={mode === "signup" ? "default" : "outline"} onClick={() => updateMode("signup")} className="flex-1">
              Register
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`} />
                  </div>
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Entity / Organization Name (Optional)</Label>
                  <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Entity name" />
                </div>

                {roleNeedsRegistrationNumber(selectedPersona) && (
                  <div className="space-y-2">
                    <Label>Registration Number (Optional)</Label>
                    <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="Company/Firm/Admin registration (optional)" />
                  </div>
                )}

                {roleNeedsLicenseNumber(selectedPersona) && (
                  <div className="space-y-2">
                    <Label>Professional License Number (Optional)</Label>
                    <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="CA/Lawyer license number" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Jurisdiction (Optional)</Label>
                  <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="State/Council/Jurisdiction" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 ${errors.email ? "border-destructive" : ""}`} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full btn-glow" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? `Login as ${selectedPersona.replaceAll("_", " ")}` : `Register as ${selectedPersona.replaceAll("_", " ")}`}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Role-bound access with verification-first compliance controls</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
