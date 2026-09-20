import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Shield, 
  FileText, 
  Calendar, 
  Bot, 
  Settings, 
  Bell,
  ChevronRight,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Regulatory Exposure", href: "/dashboard/exposure", icon: Shield },
  { label: "Compliance Tasks", href: "/dashboard/tasks", icon: FileText },
  { label: "Document Vault", href: "/dashboard/documents", icon: FileText },
  { label: "Deadlines", href: "/dashboard/deadlines", icon: Calendar },
  { label: "AI Assistant", href: "/dashboard/assistant", icon: Bot },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const DashboardNav = () => {
  const location = useLocation();
  
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
        <span className="text-foreground">Company Dashboard</span>
      </div>
      
      {/* Navigation Tabs */}
      <div className="glass-card p-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href === "/dashboard" && location.pathname === "/dashboard");
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardNav;
