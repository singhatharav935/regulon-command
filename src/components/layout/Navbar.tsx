import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Shield, Cpu, Building2, Users, Lock, LogIn, LogOut, Landmark, FileCheck, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardRoute } from "@/lib/dashboard-routes";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserProfile } from "@/store/useUserProfile";

type NavDropdownItem = {
  title: string;
  detail: string;
  href: string;
  icon?: typeof Shield;
};

const platformLinks = [
  { title: "Sovereign Infrastructure Overview", detail: "How SANNIDH Secures National Data.", href: "/platform/infrastructure", icon: Landmark },
  { title: "Agentic Execution Model", detail: "Understanding AI + Human Review Workflows.", href: "/platform/ai-human-review", icon: Users },
  { title: "Compliance Command Center", detail: "Unified Dashboard for Multiple Taxpayer Entities.", href: "/platform", icon: Building2 },
  { title: "Nexus-9™ Drafting Engine", detail: "Autonomous Legal & Regulatory Document Generation.", href: "/platform/ai-assistant", icon: Cpu },
  { title: "Audit & Traceability Vault", detail: "100% Immutable Logs for Every Regulatory Action.", href: "/platform/audit", icon: Lock },
  { title: "Sentinel™ Live Monitoring", detail: "24/7 Portal Scanning & Risk Alert System.", href: "/platform/regulators", icon: Shield },
] satisfies NavDropdownItem[];

const solutionsLinks = [
  { title: "Statutory GST Compliance", detail: "Integrated GSTR-1/3B/9 Execution.", href: "/solutions/gst", icon: FileCheck },
  { title: "Direct Tax Scrutiny Management", detail: "Faceless Assessment & Sec 143(2) Defense.", href: "/solutions/income-tax", icon: FileCheck },
  { title: "Corporate & MCA Governance", detail: "ROC Filing & Annual Secretarial Audit.", href: "/solutions/roc", icon: Building2 },
  { title: "RBI & FEMA Regulatory", detail: "Foreign Remittance & NBFC Compliance Infrastructure.", href: "/solutions/rbi", icon: Landmark },
  { title: "SEBI & Market Oversight", detail: "Listing Compliance & Insider Trading Prevention.", href: "/solutions/sebi", icon: Shield },
  { title: "Labour Law & EPFO Audits", detail: "Statutory Payroll & Compliance Health Checks.", href: "/solutions/labour-law", icon: Users },
  { title: "Lattice™ Contract Reviews", detail: "AI-Powered Risk Analysis of Legal Agreements.", href: "/solutions/contracts", icon: Lock },
] satisfies NavDropdownItem[];

const securityLinks = [
  { title: "Data Residency Guarantee", detail: "100% Indian Cloud (MeitY Empaneled).", href: "/security/data-residency", icon: Landmark },
  { title: "Lattice™ Encryption Standards", detail: "Quantum-Resistant Financial Data Security.", href: "/security/encryption-standards", icon: Shield },
  { title: "DPDP 2026 Compliance", detail: "Zero-Trust Privacy Framework for Taxpayers.", href: "/security/dpdp-2026", icon: FileCheck },
  { title: "SOC 2 Type II Certified", detail: "Enterprise-Grade Operational Security.", href: "/security/soc2-type-ii", icon: Shield },
] satisfies NavDropdownItem[];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, persona, loading } = useAuth();
  const { displayName, avatarUrl, clearProfile } = useUserProfile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isLoggedIn = !loading && !!user;
  const dashboardPath = isLoggedIn ? getDashboardRoute(persona) : "/auth?mode=login&role=company_owner";

  // Hide "Return to Dashboard" when user is already on a dashboard page
  const dashboardPrefixes = [
    "/real-company-dashboard", "/real-external-ca-dashboard", "/real-inhouse-ca-dashboard",
    "/ca-firm-dashboard", "/dashboards/ca-firm", "/dashboards/lawyer", "/lawyer-dashboard", "/admin-dashboard", "/dashboard",
    "/app/", "/agent-control", "/drafting"
  ];
  const isOnDashboard = dashboardPrefixes.some(prefix => location.pathname.startsWith(prefix));

  const handleLogout = async () => {
    clearProfile(); // Wipe stale avatar/name before navigating
    await supabase.auth.signOut();
    localStorage.removeItem("current_user_role");
    localStorage.removeItem("pending_registration_role");
    navigate("/");
  };

  const handleDropdownEnter = (dropdown: string) => {
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  // Compute avatar initials
  const userName = displayName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "U";
  const initials = userName
    .split(/[\s@]+/)
    .map((s: string) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const renderDropdown = (items: NavDropdownItem[], heading: string, subheading: string, columns: "one" | "two" = "two") => (
    <div className="space-y-2">
      <div className="px-3 py-2">
        <p className="text-[11px] tracking-[0.14em] uppercase text-cyan-300">{heading}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subheading}</p>
      </div>
      <div className={cn("grid gap-2", columns === "two" ? "grid-cols-2" : "grid-cols-1")}>
        {items.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="group rounded-lg border border-border/30 bg-card/20 px-3 py-3 hover:bg-accent/50 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start gap-2.5">
              {link.icon ? <link.icon className="w-4 h-4 text-primary/80 mt-0.5 shrink-0" /> : null}
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{link.detail}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl z-50 border border-white/10 bg-card/70 backdrop-blur-2xl rounded-2xl shadow-2xl transition-all duration-500 hover:bg-card/80">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gradient-primary">SANNIDH</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter("platform")}
              onMouseLeave={handleDropdownLeave}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Platform
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  activeDropdown === "platform" && "rotate-180"
                )} />
              </button>
              <AnimatePresence>
                {activeDropdown === "platform" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-4 w-[52rem] max-w-[calc(100vw-2rem)] bento-card p-4 shadow-2xl border-primary/20"
                  >
                    {renderDropdown(platformLinks, "Platform Stack", "Deep infrastructure, workflows, and sovereign controls.", "two")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter("solutions")}
              onMouseLeave={handleDropdownLeave}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Solutions
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  activeDropdown === "solutions" && "rotate-180"
                )} />
              </button>
              <AnimatePresence>
                {activeDropdown === "solutions" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-4 w-[52rem] max-w-[calc(100vw-2rem)] bento-card p-4 shadow-2xl border-primary/20"
                  >
                    {renderDropdown(solutionsLinks, "Execution Solutions", "Regulator-specific statutory lanes for CA and enterprise operations.", "two")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Security Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter("security")}
              onMouseLeave={handleDropdownLeave}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Security
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  activeDropdown === "security" && "rotate-180"
                )} />
              </button>
              <AnimatePresence>
                {activeDropdown === "security" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-4 w-[44rem] max-w-[calc(100vw-2rem)] bento-card p-4 shadow-2xl border-primary/20"
                  >
                    {renderDropdown(securityLinks, "Security & Trust", "Institutional-grade privacy, encryption, and residency guarantees.", "one")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/customers" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Customers
            </Link>
            <Link to="/resources" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Resources
            </Link>
            <Link to="/about" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>

          {/* Desktop Actions — auth-aware */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn && isOnDashboard ? (
              /* ── Avatar Dropdown (on dashboard pages) ── */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex items-center gap-2.5 rounded-full border border-border/50 bg-card/50 hover:bg-card/80 pl-3 pr-1.5 py-1 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/30">
                    <span className="text-sm font-medium text-foreground/80 hidden xl:block max-w-[120px] truncate">
                      {userName}
                    </span>
                    <Avatar className="w-8 h-8 border border-border/50">
                      <AvatarImage src={avatarUrl || undefined} alt={userName} />
                      <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-card border-border/50 backdrop-blur-xl shadow-2xl"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    className="cursor-pointer px-3 py-2 hover:bg-accent/50"
                    onClick={() => navigate("/profile")}
                  >
                    <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    className="cursor-pointer px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Button size="sm" className="btn-glow" onClick={() => navigate(dashboardPath)}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Button>
                {/* Small avatar for non-dashboard pages */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer">
                      <Avatar className="w-8 h-8 border border-border/50 hover:border-cyan-500/50 transition-colors">
                        <AvatarImage src={avatarUrl || undefined} alt={userName} />
                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-card border-border/50 backdrop-blur-xl shadow-2xl"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="px-3 py-2">
                      <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem
                      className="cursor-pointer px-3 py-2 hover:bg-accent/50"
                      onClick={() => navigate("/profile")}
                    >
                      <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                      Profile & Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem
                      className="cursor-pointer px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth?mode=login&role=company_owner")}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button size="sm" className="btn-glow" onClick={() => navigate("/auth?mode=signup&role=company_owner")}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Platform</p>
                {platformLinks.slice(0, 4).map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-3 py-2 text-sm text-foreground/80 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Solutions</p>
                {solutionsLinks.slice(0, 4).map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-3 py-2 text-sm text-foreground/80 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Security</p>
                {securityLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-3 py-2 text-sm text-foreground/80 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
              <div className="pt-4 space-y-3 border-t border-border/50">
                {isLoggedIn ? (
                  <>
                    {/* Mobile user info */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="w-10 h-10 border border-border/50">
                        <AvatarImage src={avatarUrl || undefined} alt={userName} />
                        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { navigate("/profile"); setMobileOpen(false); }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile & Settings
                    </Button>
                    {isOnDashboard ? null : (
                      <Button className="w-full" onClick={() => { navigate(dashboardPath); setMobileOpen(false); }}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Return to Dashboard
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { navigate("/auth?mode=login&role=company_owner"); setMobileOpen(false); }}>
                      Login
                    </Button>
                    <Button className="w-full" onClick={() => { navigate("/auth?mode=signup&role=company_owner"); setMobileOpen(false); }}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
