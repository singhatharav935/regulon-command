import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Briefcase, Shield, Home, ChevronRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTypeNavProps {
  activeType: "company" | "ca" | "admin" | "university" | "ca-firm";
  routePrefix?: string;
}

const dashboardTypes = [
  { 
    id: "company", 
    label: "Company Dashboard", 
    href: "/dashboard", 
    icon: Building2,
    description: "Your company compliance overview"
  },
  { 
    id: "ca", 
    label: "CA Dashboard", 
    href: "/ca-dashboard", 
    icon: Briefcase,
    description: "Professional CA control center"
  },
  { 
    id: "admin", 
    label: "Admin Dashboard", 
    href: "/admin-dashboard", 
    icon: Shield,
    description: "Platform administration & oversight"
  },
  {
    id: "university",
    label: "University Dashboard",
    href: "/university",
    icon: GraduationCap,
    description: "Campus operations & compliance command"
  },
  {
    id: "ca-firm",
    label: "CA Firm Dashboard",
    href: "/ca-firm-dashboard",
    icon: Briefcase,
    description: "Firm-wide CA operations and workload visibility",
  },
];

const DashboardTypeNav = ({ activeType, routePrefix = "" }: DashboardTypeNavProps) => {
  const withPrefix = (href: string, id: string) => {
    if (id === "university") {
      return routePrefix ? "/app/university" : "/university-demo";
    }
    if (id === "ca-firm") {
      return routePrefix ? "/app/ca-firm-dashboard" : "/ca-firm-dashboard";
    }
    return `${routePrefix}${href}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
          <span>Platform</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">
          {dashboardTypes.find(d => d.id === activeType)?.label}
        </span>
      </div>
      
      {/* Dashboard Type Selector */}
      <div className="glass-card p-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dashboardTypes.map((dashboard) => {
            const Icon = dashboard.icon;
            const isActive = activeType === dashboard.id;
            
            return (
              <Link
                key={dashboard.id}
                to={withPrefix(dashboard.href, dashboard.id)}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-fit",
                  isActive 
                    ? dashboard.id === "company" 
                      ? "bg-primary text-primary-foreground" 
                      : dashboard.id === "ca"
                        ? "bg-cyan-500 text-white"
                        : dashboard.id === "admin"
                          ? "bg-purple-500 text-white"
                          : "bg-emerald-500 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">{dashboard.label}</div>
                  <div className={cn(
                    "text-xs",
                    isActive ? "opacity-80" : "text-muted-foreground"
                  )}>
                    {dashboard.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardTypeNav;
