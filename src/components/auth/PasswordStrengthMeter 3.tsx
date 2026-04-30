import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { validatePasswordStrength } from '@/lib/security';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRequirements = true,
}) => {
  const validation = validatePasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  };

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Number', met: /[0-9]/.test(password) },
    { text: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3 mt-2"
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Password Strength</span>
          <span className={`text-sm font-medium ${
            validation.score <= 2 ? 'text-red-500' : 
            validation.score <= 3 ? 'text-yellow-500' : 
            'text-green-500'
          }`}>
            {getStrengthText(validation.score)}
          </span>
        </div>
        
        <Progress 
          value={(validation.score / 5) * 100} 
          className="h-2"
        />
        
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full transition-colors ${
                level <= validation.score ? getStrengthColor(validation.score) : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-gray-400" />
              )}
              <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {validation.feedback.length > 0 && (
        <div className="text-sm text-orange-600 space-y-1">
          {validation.feedback.map((feedback, index) => (
            <div key={index}>• {feedback}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

interface SecurePasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showStrengthMeter?: boolean;
  value: string;
  onValueChange: (value: string) => void;
}

export const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  label,
  showStrengthMeter = true,
  value,
  onValueChange,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {showStrengthMeter && (
        <PasswordStrengthMeter password={value} />
      )}
    </div>
  );
};