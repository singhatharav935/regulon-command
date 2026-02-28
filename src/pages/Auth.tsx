import { useState, useEffect } from "react";
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

  useEffect(() => {
    const syncMode = searchParams.get("mode") === "signup" ? "signup" : "login";
    const syncPersona = isPersona(searchParams.get("role")) ? (searchParams.get("role") as Persona) : "company_owner";
    setMode(syncMode);
    setSelectedPersona(syncPersona);
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          navigate(returnPath || "/app", { replace: true });
        }
      })
      .catch((error) => {
        console.warn("Initial session check failed on auth page.", error);
      });
  }, [navigate, returnPath]);

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

    if (mode === "signup") {
      if (!entityName.trim()) {
        toast({ title: "Entity name is required", variant: "destructive" });
        return false;
      }
      if (roleNeedsRegistrationNumber(selectedPersona) && registrationNumber.trim().length < 3) {
        toast({ title: "Registration number is required", variant: "destructive" });
        return false;
      }
      if (roleNeedsLicenseNumber(selectedPersona) && licenseNumber.trim().length < 3) {
        toast({ title: "License number is required", variant: "destructive" });
        return false;
      }
      if (jurisdiction.trim().length < 2) {
        toast({ title: "Jurisdiction is required", variant: "destructive" });
        return false;
      }
    }

    return true;
  };

  const resolveUserPersona = async (userId: string): Promise<Persona | null> => {
    const supabaseAny = supabase as any;

    const { data: personaData } = await supabaseAny
      .from("user_personas")
      .select("persona")
      .eq("user_id", userId)
      .maybeSingle();

    if (isPersona(personaData?.persona ?? null)) return personaData.persona;

    const { data: roleRows } = await supabaseAny
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles: string[] = (roleRows ?? []).map((row: { role: string }) => row.role);

    if (roles.includes("admin")) return "admin";

    if (roles.includes("manager")) {
      const { data: caWorkspace } = await supabaseAny
        .from("ca_workspace_profiles")
        .select("workspace_type")
        .eq("user_id", userId)
        .maybeSingle();

      if (caWorkspace?.workspace_type === "regulon_ca") return "in_house_ca";
      return "external_ca";
    }

    return roles.includes("user") ? "company_owner" : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (user) {
          const accountPersona = await resolveUserPersona(user.id);
          if (accountPersona && accountPersona !== selectedPersona) {
            await supabase.auth.signOut();
            throw new Error(`This account is registered as ${accountPersona.replaceAll("_", " ")}. Select that role to login.`);
          }
        }

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
                  <Label>Entity / Organization Name</Label>
                  <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Entity name" />
                </div>

                {roleNeedsRegistrationNumber(selectedPersona) && (
                  <div className="space-y-2">
                    <Label>Registration Number</Label>
                    <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="Company/Firm/Admin registration" />
                  </div>
                )}

                {roleNeedsLicenseNumber(selectedPersona) && (
                  <div className="space-y-2">
                    <Label>Professional License Number</Label>
                    <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="CA/Lawyer license number" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
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
