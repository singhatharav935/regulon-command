import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Shield, Cpu, Building2, Users, Lock, BookOpen, Info, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const platformLinks = [
  { label: "Platform Overview", href: "/platform", icon: Cpu },
  { label: "How the Platform Works", href: "/platform/how-it-works", icon: Shield },
  { label: "Compliance Infrastructure", href: "/platform/infrastructure", icon: Building2 },
  { label: "AI + Human Review Model", href: "/platform/ai-human-review", icon: Users },
  { label: "Company Dashboards", href: "/dashboard", icon: Building2 },
  { label: "Regulatory Coverage", href: "/platform/regulators", icon: Shield },
  { label: "AI Assistant", href: "/platform/ai-assistant", icon: Cpu },
  { label: "Audit & Traceability", href: "/platform/audit", icon: Lock },
];

const solutionsLinks = [
  { label: "Corporate & ROC Compliance", href: "/solutions/roc" },
  { label: "GST Compliance", href: "/solutions/gst" },
  { label: "Income Tax Compliance", href: "/solutions/income-tax" },
  { label: "Labour Law Compliance", href: "/solutions/labour-law" },
  { label: "RBI Regulatory Compliance", href: "/solutions/rbi" },
  { label: "SEBI Regulatory Compliance", href: "/solutions/sebi" },
  { label: "Contract Reviews", href: "/solutions/contracts" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleDropdownEnter = (dropdown: string) => {
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gradient-primary">REGULON</span>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-72 glass-card p-2"
                  >
                    {platformLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-primary/70" />
                        {link.label}
                      </Link>
                    ))}
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-64 glass-card p-2"
                  >
                    {solutionsLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="block px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/customers" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Customers
            </Link>
            <Link to="/security" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Security
            </Link>
            <Link to="/resources" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Resources
            </Link>
            <Link to="/about" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button size="sm" className="btn-glow" onClick={() => navigate("/auth?mode=signup")}>
              Get Started
            </Button>
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
                    {link.label}
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
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="pt-4 space-y-3 border-t border-border/50">
                <Button variant="outline" className="w-full" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
                  Login
                </Button>
                <Button className="w-full" onClick={() => { navigate("/auth?mode=signup"); setMobileOpen(false); }}>
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
