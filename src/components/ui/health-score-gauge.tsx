import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

interface HealthScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export const HealthScoreGauge = ({ 
  score, 
  size = 'md', 
  showLabel = true, 
  animated = true 
}: HealthScoreGaugeProps) => {
  const controls = useAnimation();
  
  useEffect(() => {
    if (animated) {
      controls.start({
        scale: [0.8, 1.1, 1],
        transition: { duration: 0.6 }
      });
    }
  }, [controls, animated]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGaugeColor = (score: number) => {
    if (score >= 80) return 'stroke-green-400';
    if (score >= 50) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return { text: 'LOW RISK', bg: 'bg-green-500/20 text-green-400' };
    if (score >= 50) return { text: 'MEDIUM RISK', bg: 'bg-yellow-500/20 text-yellow-400' };
    return { text: 'HIGH RISK', bg: 'bg-red-500/20 text-red-400' };
  };

  const sizes = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' }
  };

  const { width, height, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const risk = getRiskBadge(score);

  return (
    <div className="flex flex-col items-center space-y-2">
      <motion.div
        animate={controls}
        className="relative"
      >
        <svg width={width} height={height} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-700"
          />
          
          {/* Progress Circle */}
          <motion.circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ 
              strokeDashoffset: animated ? strokeDashoffset : strokeDashoffset 
            }}
            transition={{ 
              duration: animated ? 2 : 0, 
              ease: "easeOut", 
              delay: animated ? 0.3 : 0 
            }}
            className={getGaugeColor(score)}
          />
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: animated ? 1 : 0 }}
            className={`font-bold ${fontSize} ${getScoreColor(score)}`}
          >
            {animated ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                {score}%
              </motion.span>
            ) : (
              `${score}%`
            )}
          </motion.span>
        </div>
      </motion.div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: animated ? 1.2 : 0 }}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${risk.bg}`}
        >
          {risk.text}
        </motion.div>
      )}
    </div>
  );
};

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  prefix = '', 
  suffix = '', 
  className = '' 
}: AnimatedCounterProps) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration }}
      >
        {prefix}
        <motion.span
          initial={{ textShadow: "0 0 0 transparent" }}
          animate={{ textShadow: "0 0 8px currentColor" }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          {value.toLocaleString()}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  );
};