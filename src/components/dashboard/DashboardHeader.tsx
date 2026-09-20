import { Shield, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  companyName: string;
  industry?: string;
  complianceHealth: number;
}

const DashboardHeader = ({ companyName, industry, complianceHealth }: DashboardHeaderProps) => {
  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-400";
    if (health >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthBg = (health: number) => {
    if (health >= 80) return "bg-green-500/20 border-green-500/30";
    if (health >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{companyName}</h1>
          {industry && (
            <p className="text-muted-foreground mt-1">{industry}</p>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          {/* Compliance Health Score */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${getHealthBg(complianceHealth)}`}>
            <Activity className={`w-5 h-5 ${getHealthColor(complianceHealth)}`} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Compliance Health</p>
              <p className={`text-2xl font-bold ${getHealthColor(complianceHealth)}`}>{complianceHealth}%</p>
            </div>
          </div>
          
          {/* AI + Human Badge */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-sm font-medium text-primary">AI + Human Oversight Active</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
