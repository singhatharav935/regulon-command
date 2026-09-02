/**
 * Profile & Settings Page
 * Premium dark-mode design matching the CA Dashboard aesthetic.
 * Sections: CA Details, Subscription & Billing, and a Logout action.
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
import { useCAAgentOrchestrator } from "@/components/agents/CAAgentOrchestrator";
import { Bot, AlertTriangle } from "lucide-react";

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
    clearProfile,
  } = useUserProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Local editable state
  const [localName, setLocalName] = useState(displayName || "");
  const [localFirm, setLocalFirm] = useState(firmName || "");
  const [localIcai, setLocalIcai] = useState(icaiNumber || "");

  // Swarm Orchestrator and Dashboard automation controls
  const { isRunning, startAllAgents, pauseAllAgents } = useCAAgentOrchestrator();
  const [dashboardMode, setDashboardMode] = useState<'auto' | 'manual'>(() => {
    return (localStorage.getItem('sannidh:dashboard-mode') as 'auto' | 'manual') || 'manual';
  });

  const handleSetDashboardMode = (mode: 'auto' | 'manual') => {
    setDashboardMode(mode);
    localStorage.setItem('sannidh:dashboard-mode', mode);
    toast.success(`Dashboard mode set to ${mode === 'auto' ? 'Automatic' : 'Manual'}`);
  };

  const handleToggleSwarm = () => {
    if (isRunning) {
      pauseAllAgents();
      toast.success("AI Swarm Engine deactivated.");
    } else {
      startAllAgents();
      toast.success("AI Swarm Engine activated.");
    }
  };

  // ── Fetch full_name and other metadata from Supabase user_metadata ──
  useEffect(() => {
    if (dbLoaded) return;

    const meta = user?.user_metadata;
    if (meta) {
      // full_name is set during signup
      if (!localName && meta.full_name) {
        setLocalName(meta.full_name);
        setDisplayName(meta.full_name);
      }
      // entity name → firm name
      if (!localFirm && meta.verification_entity_name) {
        setLocalFirm(meta.verification_entity_name);
        setFirmName(meta.verification_entity_name);
      }
      // ICAI number if stored
      if (!localIcai && meta.icai_membership_number) {
        setLocalIcai(meta.icai_membership_number);
        setIcaiNumber(meta.icai_membership_number);
      }
      // avatar_url from user_metadata (quick sync)
      if (!avatarUrl && meta.avatar_url) {
        setAvatarUrl(meta.avatar_url);
      }
      setDbLoaded(true);
    }

    // Fallback: use email prefix as name
    if (!localName && !meta?.full_name && user?.email) {
      const fallbackName = user.email.split("@")[0];
      setLocalName(fallbackName);
    }
  }, [user, dbLoaded]);

  // ── Fetch avatar from Supabase profiles table for cross-device sync ──
  useEffect(() => {
    if (!user?.id) return;
    // Only fetch if we don't have a remote avatar URL already
    const isRemote = avatarUrl?.startsWith("http://") || avatarUrl?.startsWith("https://");
    if (isRemote) return;

    const fetchAvatar = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch {
        // Silently ignore — avatar will show fallback initials
      }
    };
    fetchAvatar();
  }, [user?.id]);

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

    if (!user?.id) {
      toast.error("You must be logged in to upload a profile picture.");
      return;
    }

    setUploading(true);
    try {
      // Generate a unique file path for this user
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage (upsert to overwrite previous avatar)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        toast.error("Failed to upload profile picture. Please try again.");
        setUploading(false);
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache-bust

      // Save URL to the profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (dbError) {
        console.error("Profile DB update error:", dbError);
        // Non-fatal: the storage upload succeeded, URL is still usable
      }

      // Also persist to user_metadata for quick access
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      // Update local state
      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDetails = async () => {
    setDisplayName(localName);
    setFirmName(localFirm);
    setIcaiNumber(localIcai);

    // Also persist full_name back to Supabase user_metadata
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: localName,
          verification_entity_name: localFirm,
          icai_membership_number: localIcai,
        },
      });
    } catch {
      // Local save still succeeded
    }

    toast.success("Profile details saved!");
  };

  const handleLogout = async () => {
    clearProfile(); // Wipe stale avatar/name before navigating
    await supabase.auth.signOut({ scope: 'local' });
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

          {/* ─── Section 1: Entity & User Details (Role-Aware) ─────────────────────────── */}
          {(() => {
            const userRole = persona || user?.user_metadata?.registration_role || 'company_owner';
            const isCA = userRole === 'external_ca' || userRole === 'ca_firm' || userRole === 'in_house_ca';
            const isLawyer = userRole === 'in_house_lawyer';

            const sectionTitle = isCA
              ? "CA Details & Practice Info"
              : isLawyer
              ? "Legal Counsel & Regulatory Details"
              : "Company Owner & Entity Details";

            const badgeLabel = isCA
              ? "Verified CA Partner"
              : isLawyer
              ? "Verified Legal Counsel"
              : "Verified Entity Owner";

            const nameLabel = isCA
              ? "Full Name"
              : isLawyer
              ? "Full Name"
              : "Director / Authorized Signatory Name";

            const entityLabel = isCA
              ? "CA Firm Name"
              : isLawyer
              ? "Law Firm / Organization Name"
              : "Registered Business / Company Name";

            const entityPlaceholder = isCA
              ? "e.g. Shukla & Associates"
              : isLawyer
              ? "e.g. Lex Juris LLP"
              : "e.g. Regulon Command Technologies Pvt Ltd";

            const registrationLabel = isCA
              ? "ICAI Membership Number"
              : isLawyer
              ? "Bar Council Enrollment Number"
              : "GSTIN / CIN / PAN Number";

            const registrationPlaceholder = isCA
              ? "e.g. 123456"
              : isLawyer
              ? "e.g. MAH/1234/2020"
              : "e.g. 27AAACR1234F1Z5 / U72900MH2025PTC123456";

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-card/50 border-border/40 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        {isCA ? (
                          <Award className="w-5 h-5 text-cyan-400" />
                        ) : isLawyer ? (
                          <Shield className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Building2 className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      {sectionTitle}
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
                            {badgeLabel}
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
                          <User className="w-3 h-3" /> {nameLabel}
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
                          <Mail className="w-3 h-3" /> Email Address
                        </Label>
                        <Input
                          value={userEmail}
                          disabled
                          className="bg-background/30 border-border/30 text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> {entityLabel}
                        </Label>
                        <Input
                          value={localFirm}
                          onChange={(e) => setLocalFirm(e.target.value)}
                          placeholder={entityPlaceholder}
                          className="bg-background/50 border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3 h-3" /> {registrationLabel}
                        </Label>
                        <Input
                          value={localIcai}
                          onChange={(e) => setLocalIcai(e.target.value)}
                          placeholder={registrationPlaceholder}
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
            );
          })()}

          {/* ─── Section: AI Swarm & Dashboard Settings ─────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-card/50 border-border/40 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  AI Swarm & Dashboard Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Swarm Engine Status (On / Off Toggle) */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/40">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      AI Swarm Consensus Engine
                      <Badge className={isRunning ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs" : "bg-red-500/20 text-red-400 border-red-500/30 text-xs"}>
                        {isRunning ? "ACTIVE" : "OFFLINE"}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable the background multi-agent simulation for automated tax/regulatory audits.
                    </p>
                  </div>
                  <Button
                    variant={isRunning ? "destructive" : "default"}
                    className={isRunning ? "" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                    onClick={handleToggleSwarm}
                  >
                    {isRunning ? "Turn Off" : "Turn On"}
                  </Button>
                </div>

                {/* Automation Preference (Automatic vs Manual) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-background/50 border border-border/40 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Task Execution Mode
                      <Badge className={dashboardMode === 'auto' ? "bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs" : "bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"}>
                        {dashboardMode === 'auto' ? "AUTOMATIC" : "MANUAL"}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      <b>Automatic:</b> AI Swarm automatically consumes and resolves statutory notice tasks.<br />
                      <b>Manual:</b> You must manually click the "Run Swarm" button on each task to resolve it.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant={dashboardMode === 'manual' ? "default" : "outline"}
                      className={dashboardMode === 'manual' ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500/30 h-9" : "border-border/50 h-9"}
                      onClick={() => handleSetDashboardMode('manual')}
                    >
                      Manual
                    </Button>
                    <Button
                      variant={dashboardMode === 'auto' ? "default" : "outline"}
                      className={dashboardMode === 'auto' ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500/30 h-9" : "border-border/50 h-9"}
                      onClick={() => handleSetDashboardMode('auto')}
                    >
                      Automatic
                    </Button>
                  </div>
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

          {/* ─── Logout Button ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 text-base border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
