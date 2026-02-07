import { motion } from "framer-motion";
import { 
  Building2, 
  FileText, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  CreditCard 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const demoStats = [
  { label: "Assigned Companies", value: "24", icon: Building2, color: "text-cyan-400" },
  { label: "Pending Tasks", value: "18", icon: FileText, color: "text-yellow-400" },
  { label: "Due in 7 Days", value: "5", icon: Clock, color: "text-orange-400" },
  { label: "High-Risk Alerts", value: "3", icon: AlertTriangle, color: "text-red-400" },
  { label: "Revenue This Month", value: "₹2.4L", icon: DollarSign, color: "text-green-400" },
  { label: "Plan Limit", value: "30/50", icon: CreditCard, color: "text-primary" },
];

const CAHomeSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CA Control Tower</h1>
          <p className="text-muted-foreground">Your professional compliance overview</p>
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
              <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors">
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

export default CAHomeSection;
