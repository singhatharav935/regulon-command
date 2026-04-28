import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface EmailVerificationFlowProps {
  email: string;
  isVerified: boolean;
  onResendVerification: () => Promise<void>;
  onVerifyCode?: (code: string) => Promise<void>;
  className?: string;
}

export const EmailVerificationFlow: React.FC<EmailVerificationFlowProps> = ({
  email,
  isVerified,
  onResendVerification,
  onVerifyCode,
  className = '',
}) => {
  const [verificationCode, setVerificationCode] = React.useState('');
  const [isResending, setIsResending] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [lastSentTime, setLastSentTime] = React.useState<number | null>(null);
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (lastSentTime && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lastSentTime, countdown]);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      await onResendVerification();
      setLastSentTime(Date.now());
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error('Failed to resend verification:', error);
      // Show user-friendly error message
      if (typeof window !== 'undefined') {
        alert('Failed to resend verification email. Please try again or contact support.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!onVerifyCode || !verificationCode.trim()) return;

    try {
      setIsVerifying(true);
      await onVerifyCode(verificationCode.trim());
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}
      >
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-800">Email Verified</p>
            <p className="text-sm text-green-600">{email}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
            <p className="text-sm text-gray-600 mt-1">
              We've sent a verification link to <span className="font-medium">{email}</span>
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span>Please verify your email to continue</span>
          </div>

          {onVerifyCode && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="verificationCode" className="text-sm font-medium">
                  Or enter verification code
                </Label>
                <div className="mt-1 flex space-x-2">
                  <Input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || verificationCode.length !== 6}
                    size="sm"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-3">
              Didn't receive the email? Check your spam folder or request a new one.
            </p>
            
            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending || countdown > 0}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};