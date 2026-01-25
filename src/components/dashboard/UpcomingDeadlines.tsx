import { motion } from "framer-motion";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Deadline {
  id: string;
  title: string;
  regulator: string;
  dueDate: string;
  isRecurring?: boolean;
  daysLeft: number;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
}

const UpcomingDeadlines = ({ deadlines }: UpcomingDeadlinesProps) => {
  const getUrgencyClass = (daysLeft: number) => {
    if (daysLeft <= 3) return "border-red-500/30 bg-red-500/5";
    if (daysLeft <= 7) return "border-yellow-500/30 bg-yellow-500/5";
    return "border-border/50 bg-card/30";
  };

  const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft <= 3) return { className: "bg-red-500/20 text-red-400", label: "Urgent" };
    if (daysLeft <= 7) return { className: "bg-yellow-500/20 text-yellow-400", label: "Soon" };
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Upcoming Deadlines</h2>
      </div>
      
      <div className="space-y-3">
        {deadlines.map((deadline, index) => {
          const urgencyBadge = getUrgencyBadge(deadline.daysLeft);
          
          return (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`p-4 rounded-xl border ${getUrgencyClass(deadline.daysLeft)} transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-foreground">{deadline.title}</h3>
                    {urgencyBadge && (
                      <Badge className={`${urgencyBadge.className} border-none text-xs`}>
                        {urgencyBadge.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="bg-card/50 border-border/50">
                      {deadline.regulator}
                    </Badge>
                    
                    {deadline.isRecurring && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{deadline.dueDate}</p>
                  <p className={`text-xs ${deadline.daysLeft <= 3 ? 'text-red-400' : deadline.daysLeft <= 7 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    {deadline.daysLeft === 0 ? 'Due today' : deadline.daysLeft === 1 ? '1 day left' : `${deadline.daysLeft} days left`}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default UpcomingDeadlines;
