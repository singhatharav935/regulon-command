import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicEntryProps {
  onComplete: () => void;
}

const CinematicEntry = ({ onComplete }: CinematicEntryProps) => {
  const [phase, setPhase] = useState<"logo" | "tagline" | "exit">("logo");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("tagline"), 800);
    const timer2 = setTimeout(() => setPhase("exit"), 2200);
    const timer3 = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Background ambient glow */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(192 85% 55% / 0.08) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Logo */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="text-gradient-primary">REGULON</span>
            </h1>
            
            {/* Subtle underline glow */}
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="relative z-10 mt-8 text-lg md:text-xl text-muted-foreground font-light tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: phase === "tagline" ? 1 : 0, 
              y: phase === "tagline" ? 0 : 10 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Compliance & Regulatory Command Platform
          </motion.p>

          {/* Loading indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
              Initializing
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicEntry;
