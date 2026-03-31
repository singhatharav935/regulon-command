import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Shield, Briefcase, Building2, Users, Gavel, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerUser, loginUser } from "@/lib/real-auth";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [registrationRole, setRegistrationRole] = useState("company_owner");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize mode from URL params
  useState(() => {
    const mode = searchParams.get("mode");
    const role = searchParams.get("role");
    if (mode === "register") setIsSignUp(true);
    if (role) setRegistrationRole(role);
  });

  const roleOptions = [
    { value: "company_owner", label: "Company Owner", icon: Building2, description: "Business owner needing compliance management" },
    { value: "external_ca", label: "External CA", icon: UserCheck, description: "Chartered Accountant providing services" },
    { value: "in_house_ca", label: "In-House CA", icon: Shield, description: "Internal company CA professional" },
    { value: "ca_firm", label: "CA Firm", icon: Users, description: "CA firm managing multiple clients" },
    { value: "in_house_lawyer", label: "In-House Lawyer", icon: Gavel, description: "Legal professional within company" },
    { value: "admin", label: "Admin", icon: Briefcase, description: "System administrator" },
  ];

  const selectedRole = roleOptions.find(r => r.value === registrationRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Register
        if (!fullName.trim()) {
          toast({ title: "Error", description: "Full name is required", variant: "destructive" });
          return;
        }

        const response = await registerUser(
          email.trim(),
          password,
          fullName.trim(),
          registrationRole,
          entityName.trim() || undefined
        );

        toast({
          title: "Success!",
          description: response.message || "Account created successfully",
        });

        // Navigate to appropriate dashboard
        navigate(getDashboardRoute(registrationRole));
      } else {
        // Login
        const response = await loginUser(email.trim(), password);

        toast({
          title: "Success!",
          description: response.message || "Logged in successfully",
        });

        // Navigate to appropriate dashboard
        navigate(getDashboardRoute(response.user.registration_role));
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardRoute = (role: string): string => {
    switch (role) {
      case "external_ca":
      case "in_house_ca":
      case "ca_firm":
        return "/ca-dashboard";
      case "admin":
        return "/admin-dashboard";
      case "in_house_lawyer":
        return "/lawyer-dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? "Join REGULON" : "Welcome Back"}
          </h1>
          <p className="text-gray-300">
            {isSignUp ? "Create your compliance account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <>
              <div>
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <div className="relative">
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
                <Label className="text-white">Registration Role</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setRegistrationRole(role.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
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
                    {registrationRole === "ca_firm" ? "Firm Name" : "CA Practice Name"}
                  </Label>
                  <Input
                    id="entityName"
                    type="text"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Enter your firm/practice name"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <div className="relative">
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
            <div className="relative">
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
          >
            {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-300 hover:text-purple-200 text-sm"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        {selectedRole && (
          <div className="mt-6 p-4 bg-purple-600/20 rounded-lg border border-purple-400/30">
            <div className="flex items-center space-x-3 text-purple-200">
              <selectedRole.icon className="w-5 h-5" />
              <div>
                <div className="font-medium">{selectedRole.label}</div>
                <div className="text-sm opacity-80">{selectedRole.description}</div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;