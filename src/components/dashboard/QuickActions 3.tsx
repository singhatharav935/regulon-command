import { motion } from "framer-motion";
import { Plus, Upload, MessageSquare, FileSearch, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const QuickActions = () => {
  const actions = [
    { icon: Plus, label: "Raise Compliance Request", description: "Submit a new compliance task", primary: true },
    { icon: Upload, label: "Upload Document", description: "Add documents to vault", primary: false },
    { icon: Bot, label: "Ask AI Assistant", description: "Analyze documents with AI", primary: false },
    { icon: MessageSquare, label: "Talk to Expert", description: "Connect with our team", primary: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <Button
                variant={action.primary ? "default" : "outline"}
                className={`w-full h-auto flex flex-col items-center gap-3 p-6 ${
                  action.primary 
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-card/30 border-border/50 hover:bg-card/60 hover:border-primary/30"
                } transition-all duration-300`}
              >
                <div className={`p-3 rounded-xl ${action.primary ? "bg-white/20" : "bg-primary/10"}`}>
                  <Icon className={`w-6 h-6 ${action.primary ? "text-white" : "text-primary"}`} />
                </div>
                <div className="text-center">
                  <p className={`font-medium ${action.primary ? "text-white" : "text-foreground"}`}>
                    {action.label}
                  </p>
                  <p className={`text-xs mt-1 ${action.primary ? "text-white/70" : "text-muted-foreground"}`}>
                    {action.description}
                  </p>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickActions;
