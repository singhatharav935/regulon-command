import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Clock, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const demoAnalytics = {
  tasksCompleted: 42,
  tasksDelayed: 8,
  avgClosureTime: "3.2 days",
  riskReduction: "18%",
  scoreImprovement: "+12 avg",
  earnings: "₹4.8L",
};

const CAAnalyticsSection = () => {
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
          <h2 className="text-xl font-semibold text-foreground">CA Analytics & Performance</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.tasksDelayed}</p>
            <p className="text-xs text-muted-foreground">Tasks Delayed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.avgClosureTime}</p>
            <p className="text-xs text-muted-foreground">Avg Closure Time</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.riskReduction}</p>
            <p className="text-xs text-muted-foreground">Client Risk Reduction</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.scoreImprovement}</p>
            <p className="text-xs text-muted-foreground">Score Improvement</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{demoAnalytics.earnings}</p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default CAAnalyticsSection;
