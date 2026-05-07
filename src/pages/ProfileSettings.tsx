/**
 * Profile & Settings Page
 * Premium dark-mode design matching the CA Dashboard aesthetic.
 * Three sections: CA Details, Subscription & Billing, Danger Zone.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Building2,
  Award,
  Crown,
  LogOut,
  Camera,
  Shield,
  AlertTriangle,
  Sparkles,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/store/useUserProfile";
import { getDashboardRoute } from "@/lib/dashboard-routes";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, persona } = useAuth();
  const {
    displayName,
    avatarUrl,
    firmName,
    icaiNumber,
    setDisplayName,
    setAvatarUrl,
    setFirmName,
    setIcaiNumber,
  } = useUserProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Local editable state
  const [localName, setLocalName] = useState(displayName || "");
  const [localFirm, setLocalFirm] = useState(firmName || "");
  const [localIcai, setLocalIcai] = useState(icaiNumber || "");

  useEffect(() => {
    if (!localName && user?.user_metadata?.full_name) {
      setLocalName(user.user_metadata.full_name);
    }
    if (!localName && user?.email) {
      setLocalName(user.email.split("@")[0]);
    }
  }, [user]);

  const userEmail = user?.email || "user@sannidh.in";
  const initials = (localName || userEmail)
    .split(/[\s@]+/)
    .map((s: string) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 and store in localStorage for offline-first behavior
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        toast.success("Profile picture updated!");
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload profile picture.");
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDetails = () => {
    setDisplayName(localName);
    setFirmName(localFirm);
    setIcaiNumber(localIcai);
    toast.success("Profile details saved!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("current_user_role");
    localStorage.removeItem("pending_registration_role");
    navigate("/");
  };

  const dashboardPath = getDashboardRoute(persona);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground mb-2"
              onClick={() => navigate(dashboardPath)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h1 className="text-3xl font-bold text-foreground">
              Profile & Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account information and preferences.
            </p>
          </motion.div>

          {/* ─── Section 1: CA Details ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 border-border/40 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  CA Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-2 border-border/50 ring-2 ring-cyan-500/20">
                      <AvatarImage src={avatarUrl || undefined} alt={localName} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300">
                        {initials || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">
                        {localName || "User"}
                      </h3>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified Partner
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-3.5 h-3.5 mr-1.5" />
                      {uploading ? "Uploading..." : "Change Photo"}
                    </Button>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Full Name
                    </Label>
                    <Input
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email
                    </Label>
                    <Input
                      value={userEmail}
                      disabled
                      className="bg-background/30 border-border/30 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> CA Firm Name
                    </Label>
                    <Input
                      value={localFirm}
                      onChange={(e) => setLocalFirm(e.target.value)}
                      placeholder="e.g. Shukla & Associates"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3 h-3" /> ICAI Membership Number
                    </Label>
                    <Input
                      value={localIcai}
                      onChange={(e) => setLocalIcai(e.target.value)}
                      placeholder="e.g. 123456"
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveDetails}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Section 2: Subscription & Billing ─────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/50 border-border/40 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  Subscription & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 border border-cyan-500/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Current Plan
                    </p>
                    <p className="text-lg font-bold text-cyan-400 mt-0.5">
                      Sannidh Early Access (Beta)
                    </p>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <Button
                  disabled
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white/70 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Upgrade to Enterprise
                </Button>
                <p className="text-xs text-muted-foreground/60 text-center">
                  Billing infrastructure is currently locked during the closed
                  beta phase.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Section 3: Danger Zone ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/50 border-red-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Sign out of your account
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You will be redirected to the landing page.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
