import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const demoAnalytics = {
  successRate: "94.2%",
  avgResolutionTime: "2.8 days",
  topCAPerformance: "Anita Patel",
  industryRiskTrend: "FinTech ↑",
  revenueByUser: "₹48L",
  activeSubscriptions: 156,
};

const PlatformAnalytics = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Platform Analytics</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.successRate}</p>
            <p className="text-xs text-muted-foreground">Compliance Success</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.avgResolutionTime}</p>
            <p className="text-xs text-muted-foreground">Avg Resolution</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">{demoAnalytics.topCAPerformance}</p>
            <p className="text-xs text-muted-foreground">Top CA Performance</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">{demoAnalytics.industryRiskTrend}</p>
            <p className="text-xs text-muted-foreground">Industry Risk Trend</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.revenueByUser}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.activeSubscriptions}</p>
            <p className="text-xs text-muted-foreground">Active Subscriptions</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default PlatformAnalytics;
