import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Bell 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const demoStats = [
  { label: "Active Companies", value: "156", icon: Building2, color: "text-primary" },
  { label: "Active CAs", value: "24", icon: Users, color: "text-cyan-400" },
  { label: "High-Risk Companies", value: "12", icon: AlertTriangle, color: "text-red-400" },
  { label: "Overdue Items", value: "28", icon: Clock, color: "text-orange-400" },
  { label: "Failed Filings", value: "3", icon: XCircle, color: "text-red-400" },
  { label: "System Alerts", value: "7", icon: Bell, color: "text-yellow-400" },
];

const AdminHomeSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Control Center</h1>
          <p className="text-muted-foreground">Enterprise-wide compliance oversight</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {demoStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card border-border/50 hover:border-purple-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-card/50 ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AdminHomeSection;
