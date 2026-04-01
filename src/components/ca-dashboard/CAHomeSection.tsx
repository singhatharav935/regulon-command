import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Building2, 
  FileText, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  CreditCard,
  RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const demoStats = [
  { label: "Assigned Companies", value: "24", icon: Building2, color: "text-cyan-400" },
  { label: "Pending Tasks", value: "18", icon: FileText, color: "text-yellow-400" },
  { label: "Due in 7 Days", value: "5", icon: Clock, color: "text-orange-400" },
  { label: "High-Risk Alerts", value: "3", icon: AlertTriangle, color: "text-red-400" },
  { label: "Revenue This Month", value: "₹2.4L", icon: DollarSign, color: "text-green-400" },
  { label: "Plan Limit", value: "30/50", icon: CreditCard, color: "text-primary" },
];

interface CAHomeSectionProps {
  isRealDashboard?: boolean;
  realData?: any;
  apiEndpoint?: string;
}

const CAHomeSection: React.FC<CAHomeSectionProps> = ({ 
  isRealDashboard = false, 
  realData, 
  apiEndpoint 
}) => {
  const [stats, setStats] = useState(demoStats);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (isRealDashboard && apiEndpoint) {
      loadRealStats();
    }
  }, [isRealDashboard, apiEndpoint]);

  const loadRealStats = async () => {
    if (!apiEndpoint) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle both wrapped and unwrapped responses
        
        // Transform real data to match stats format
        const realStats = [
          { 
            label: "Assigned Companies", 
            value: data.assigned_companies?.toString() || "0", 
            icon: Building2, 
            color: "text-cyan-400" 
          },
          { 
            label: "Pending Tasks", 
            value: data.active_tasks?.toString() || "0", 
            icon: FileText, 
            color: "text-yellow-400" 
          },
          { 
            label: "Due in 7 Days", 
            value: data.pending_filings_week?.toString() || "0", 
            icon: Clock, 
            color: "text-orange-400" 
          },
          { 
            label: "High-Risk Alerts", 
            value: data.high_risk_alerts?.toString() || "0", 
            icon: AlertTriangle, 
            color: "text-red-400" 
          },
          { 
            label: "Revenue This Month", 
            value: `₹${(data.monthly_revenue || 0).toLocaleString()}`, 
            icon: DollarSign, 
            color: "text-green-400" 
          },
          { 
            label: "Overdue Items", 
            value: `${data.overdue_dependencies || 0}`, 
            icon: CreditCard, 
            color: "text-primary" 
          },
        ];
        
        setStats(realStats);
        setLastUpdated(new Date().toLocaleString());
      } else {
        console.log("Real API not available, using demo data");
      }
    } catch (error) {
      console.log("Error loading real stats, using demo data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRealDashboard ? "🎯 Real CA Control Tower" : "CA Control Tower"}
          </h1>
          <p className="text-muted-foreground">
            {isRealDashboard 
              ? "Live production dashboard with real client data" 
              : "Your professional compliance overview"
            }
          </p>
          {isRealDashboard && lastUpdated && (
            <p className="text-xs text-green-400 mt-1">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        {isRealDashboard && (
          <Button 
            onClick={loadRealStats} 
            size="sm" 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`glass-card border-border/50 hover:border-primary/30 transition-colors ${
                isRealDashboard ? 'bg-green-500/5 border-green-500/20' : ''
              }`}>
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
