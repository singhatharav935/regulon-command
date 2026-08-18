import { motion } from "framer-motion";
import { ArrowRight, Shield, Users, FileCheck, Building2, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardRoute } from "@/lib/dashboard-routes";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type HeroSectionProps = {
  content?: {
    title?: string;
    subtitle?: string;
    description?: string;
    cta_primary_label?: string;
    cta_secondary_label?: string;
    stat_regulators_covered?: number;
    stat_regulatory_blueprints?: string;
    stat_reasoning_prompts?: string;
    stat_review_model?: string;
  } | null;
};

const HeroSection = ({ content }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { user, persona, loading } = useAuth();
  const isLoggedIn = !loading && !!user;
  const dashboardPath = isLoggedIn ? getDashboardRoute(persona) : "/auth?mode=signup&role=company_owner";
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    message: "",
  });
  const title = "SANNIDH"; // Brand name - always hardcoded, not from backend
  const subtitle = content?.subtitle || "Compliance & Regulatory Command Platform";
  const description = content?.description ||
    "AI-powered, human-verified regulatory execution for businesses. Complete compliance coverage across MCA, GST, Income Tax, RBI & SEBI.";
  const ctaPrimary = content?.cta_primary_label || "Get Started";
  const ctaSecondary = content?.cta_secondary_label || "Login to Dashboard";
  const statRegulators = typeof content?.stat_regulators_covered === "number" ? content.stat_regulators_covered : 5;
  const statBlueprints = content?.stat_regulatory_blueprints || "10K+";
  const statPrompts = content?.stat_reasoning_prompts || "5K+";
  const statReview = content?.stat_review_model || "CA+Law";

  const openLeadDialog = () => {
    setLeadDialogOpen(true);
  };

  // Rate limiting: max 2 requests per day per browser
  const checkRateLimit = (): boolean => {
    const key = "sannidh_onboarding_requests";
    const stored = localStorage.getItem(key);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let data: { date: string; count: number } = { date: today, count: 0 };
    if (stored) {
      try {
        data = JSON.parse(stored);
        if (data.date !== today) {
          data = { date: today, count: 0 };
        }
      } catch {
        data = { date: today, count: 0 };
      }
    }
    if (data.count >= 2) {
      return false; // Rate limit exceeded
    }
    data.count += 1;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  };

  const submitLead = async () => {
    if (!leadForm.name.trim() || !leadForm.email.trim()) {
      toast.error("Please provide your name and email.");
      return;
    }

    if (!checkRateLimit()) {
      toast.error("You've reached the maximum of 2 onboarding requests per day. Please try again tomorrow.");
      return;
    }

    try {
      setIsSubmittingLead(true);

      // The edge function uses query params, so let's call it directly
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/send-consent?action=onboarding_lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          companyName: leadForm.companyName,
          message: leadForm.message,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit request");
      }

      toast.success("The SANNIDH team has been notified and will reach out to you as soon as possible! 🚀", {
        duration: 6000,
      });
      setLeadDialogOpen(false);
      setLeadForm({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        message: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request. Please try again.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden perspective-1000">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* ── Sannidh Logo ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-8"
          >
            {/* Logo image */}
            <img
              src="/favicon.ico"
              alt="Sannidh Logo"
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,212,255,0.2),0_0_80px_rgba(0,136,170,0.1)] mx-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Enterprise Compliance Infrastructure</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gradient-primary">{title}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground font-light mb-4"
          >
            {subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-primary/10 text-xs text-primary font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
              {statBlueprints} Regulatory Blueprints
            </span>
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-primary/10 text-xs text-primary font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
              {statPrompts} Reasoning Prompts
            </span>
            <span className="px-4 py-1.5 rounded-full border border-white/10 bg-card/60 text-xs text-muted-foreground font-medium shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
              Advisory · Drafting · Comprehensive
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            {isLoggedIn ? (
              <>
                <Button size="lg" className="btn-glow h-12 px-8" onClick={() => navigate(dashboardPath)}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button size="lg" variant="ghost" className="h-12 px-8" onClick={() => openLeadDialog()}>
                  Request Onboarding
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="btn-glow h-12 px-8" onClick={() => navigate("/auth?mode=signup&role=company_owner")}>
                  {ctaPrimary}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" onClick={() => navigate("/auth?mode=login&role=company_owner")}>
                  {ctaSecondary}
                </Button>
                <Button size="lg" variant="ghost" className="h-12 px-8" onClick={() => openLeadDialog()}>
                  Request Onboarding
                </Button>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            <div className="bento-card p-6 text-center transform hover:-translate-y-2 group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <p className="text-4xl font-extrabold text-white mb-1 drop-shadow-md">{statRegulators}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Regulators Covered</p>
            </div>
            <div className="bento-card p-6 text-center transform hover:-translate-y-2 group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <FileCheck className="w-7 h-7 text-primary" />
              </div>
              <p className="text-4xl font-extrabold text-white mb-1 drop-shadow-md">{statBlueprints}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Regulatory Blueprints</p>
            </div>
            <div className="bento-card p-6 text-center transform hover:-translate-y-2 group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <p className="text-4xl font-extrabold text-white mb-1 drop-shadow-md">{statPrompts}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Reasoning Prompts</p>
            </div>
            <div className="bento-card p-6 text-center transform hover:-translate-y-2 group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <p className="text-4xl font-extrabold text-white mb-1 drop-shadow-md">{statReview}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Verified Review</p>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Onboarding</DialogTitle>
            <DialogDescription>
              Fill in your details and the SANNIDH team will reach out to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="lead-name">Name</Label>
              <Input
                id="lead-name"
                value={leadForm.name}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={leadForm.email}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input
                id="lead-phone"
                value={leadForm.phone}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+91..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-company">Company</Label>
              <Input
                id="lead-company"
                value={leadForm.companyName}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, companyName: event.target.value }))}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-message">Requirement</Label>
              <Textarea
                id="lead-message"
                value={leadForm.message}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Tell us what you need"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitLead} disabled={isSubmittingLead}>
              {isSubmittingLead ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
