import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Building2, UserCheck, Users, Shield, Gavel, Briefcase, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SecurePasswordInput } from './PasswordStrengthMeter';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStepProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onPrevious,
  canProceed = true,
  nextLabel = 'Continue',
  isLoading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < currentStep
                      ? 'bg-green-500'
                      : i === currentStep
                      ? 'bg-purple-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="mb-8">{children}</div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentStep === 0}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <Button
            onClick={onNext}
            disabled={!canProceed || isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

interface MultiStepRegistrationProps {
  onComplete: (formData: RegistrationFormData) => Promise<void>;
  initialRole?: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  password: string;
  registrationRole: string;
  entityName?: string;
  companyInfo?: {
    name: string;
    industry: string;
    size: string;
    location: string;
  };
  professionalInfo?: {
    licenseNumber?: string;
    experience: string;
    specializations?: string[];
  };
  agreeToTerms: boolean;
  agreeToNewsletter: boolean;
}

export const MultiStepRegistration: React.FC<MultiStepRegistrationProps> = ({
  onComplete,
  initialRole = 'company_owner',
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = React.useState<RegistrationFormData>({
    fullName: '',
    email: '',
    password: '',
    registrationRole: initialRole,
    entityName: '',
    companyInfo: {
      name: '',
      industry: '',
      size: '',
      location: '',
    },
    professionalInfo: {
      licenseNumber: '',
      experience: '',
      specializations: [],
    },
    agreeToTerms: false,
    agreeToNewsletter: false,
  });

  const roleOptions = [
    { 
      value: "company_owner", 
      label: "Company Owner", 
      icon: Building2, 
      description: "Business owner needing compliance management",
      needsCompanyInfo: true,
    },
    { 
      value: "external_ca", 
      label: "External CA", 
      icon: UserCheck, 
      description: "Chartered Accountant providing services",
      needsProfessionalInfo: true,
    },
    { 
      value: "in_house_ca", 
      label: "In-House CA", 
      icon: Shield, 
      description: "Internal company CA professional",
      needsProfessionalInfo: true,
    },
    { 
      value: "ca_firm", 
      label: "CA Firm", 
      icon: Users, 
      description: "CA firm managing multiple clients",
      needsProfessionalInfo: true,
    },
    { 
      value: "in_house_lawyer", 
      label: "In-House Lawyer", 
      icon: Gavel, 
      description: "Legal professional within company",
      needsProfessionalInfo: true,
    },
    { 
      value: "admin", 
      label: "Admin", 
      icon: Briefcase, 
      description: "System administrator",
    },
  ];

  const selectedRole = roleOptions.find(r => r.value === formData.registrationRole);

  const updateFormData = (updates: Partial<RegistrationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const steps = React.useMemo(() => {
    const baseSteps = [
      {
        title: 'Choose Your Role',
        description: 'Select your professional role to customize your experience',
        component: 'role-selection',
      },
      {
        title: 'Personal Information',
        description: 'Tell us about yourself',
        component: 'personal-info',
      },
      {
        title: 'Account Security',
        description: 'Create a secure password for your account',
        component: 'security',
      },
    ];

    // Add conditional steps based on role
    if (selectedRole?.needsCompanyInfo) {
      baseSteps.push({
        title: 'Company Information',
        description: 'Tell us about your company',
        component: 'company-info',
      });
    }

    if (selectedRole?.needsProfessionalInfo) {
      baseSteps.push({
        title: 'Professional Information',
        description: 'Your professional credentials and experience',
        component: 'professional-info',
      });
    }

    baseSteps.push({
      title: 'Review & Complete',
      description: 'Review your information and complete registration',
      component: 'review',
    });

    return baseSteps;
  }, [selectedRole]);

  const canProceedFromStep = (step: number) => {
    const stepComponent = steps[step]?.component;
    
    switch (stepComponent) {
      case 'role-selection':
        return !!formData.registrationRole;
      case 'personal-info':
        return formData.fullName.trim() && formData.email.trim();
      case 'security':
        return formData.password.length >= 8;
      case 'company-info':
        return formData.companyInfo?.name?.trim();
      case 'professional-info':
        return formData.professionalInfo?.experience;
      case 'review':
        return formData.agreeToTerms;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await onComplete(formData);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const stepComponent = steps[currentStep]?.component;

    switch (stepComponent) {
      case 'role-selection':
        return (
          <div className="space-y-4">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => updateFormData({ registrationRole: role.value })}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    formData.registrationRole === role.value
                      ? "bg-purple-50 border-purple-500 ring-2 ring-purple-200"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      formData.registrationRole === role.value 
                        ? "bg-purple-100 text-purple-600" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{role.label}</h3>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                    {formData.registrationRole === role.value && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'personal-info':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                  className="pl-10"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                  className="pl-10"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {(formData.registrationRole === "external_ca" || formData.registrationRole === "ca_firm") && (
              <div>
                <Label htmlFor="entityName">
                  {formData.registrationRole === "ca_firm" ? "Firm Name" : "Practice Name"}
                </Label>
                <Input
                  id="entityName"
                  type="text"
                  value={formData.entityName || ''}
                  onChange={(e) => updateFormData({ entityName: e.target.value })}
                  placeholder="Enter your firm/practice name"
                />
              </div>
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <SecurePasswordInput
              label="Password"
              value={formData.password}
              onValueChange={(password) => updateFormData({ password })}
              placeholder="Create a secure password"
              showStrengthMeter={true}
            />
          </div>
        );

      case 'company-info':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                value={formData.companyInfo?.name || ''}
                onChange={(e) => updateFormData({
                  companyInfo: { ...formData.companyInfo!, name: e.target.value }
                })}
                placeholder="Enter your company name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <select
                  id="industry"
                  value={formData.companyInfo?.industry || ''}
                  onChange={(e) => updateFormData({
                    companyInfo: { ...formData.companyInfo!, industry: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="companySize">Company Size</Label>
                <select
                  id="companySize"
                  value={formData.companyInfo?.size || ''}
                  onChange={(e) => updateFormData({
                    companyInfo: { ...formData.companyInfo!, size: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                value={formData.companyInfo?.location || ''}
                onChange={(e) => updateFormData({
                  companyInfo: { ...formData.companyInfo!, location: e.target.value }
                })}
                placeholder="City, Country"
              />
            </div>
          </div>
        );

      case 'professional-info':
        return (
          <div className="space-y-6">
            {(formData.registrationRole === "external_ca" || formData.registrationRole === "in_house_ca") && (
              <div>
                <Label htmlFor="licenseNumber">CA License Number (Optional)</Label>
                <Input
                  id="licenseNumber"
                  type="text"
                  value={formData.professionalInfo?.licenseNumber || ''}
                  onChange={(e) => updateFormData({
                    professionalInfo: { ...formData.professionalInfo!, licenseNumber: e.target.value }
                  })}
                  placeholder="Enter your CA license number"
                />
              </div>
            )}

            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <select
                id="experience"
                value={formData.professionalInfo?.experience || ''}
                onChange={(e) => updateFormData({
                  professionalInfo: { ...formData.professionalInfo!, experience: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Experience</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="11-15">11-15 years</option>
                <option value="15+">15+ years</option>
              </select>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Review Your Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-600">{formData.fullName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-600">{formData.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2 text-gray-600">{selectedRole?.label}</span>
                </div>
                {formData.entityName && (
                  <div>
                    <span className="font-medium text-gray-700">Organization:</span>
                    <span className="ml-2 text-gray-600">{formData.entityName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => updateFormData({ agreeToTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  required
                />
                <span className="text-sm text-gray-700">
                  I agree to the <a href="/terms" className="text-purple-600 hover:underline">Terms of Service</a> and{' '}
                  <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.agreeToNewsletter}
                  onChange={(e) => updateFormData({ agreeToNewsletter: e.target.checked })}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  I'd like to receive product updates and regulatory news (optional)
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-12 px-4">
      <AnimatePresence mode="wait">
        <OnboardingStep
          key={currentStep}
          currentStep={currentStep}
          totalSteps={steps.length}
          title={steps[currentStep]?.title || ''}
          description={steps[currentStep]?.description || ''}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canProceed={canProceedFromStep(currentStep)}
          nextLabel={currentStep === steps.length - 1 ? 'Complete Registration' : 'Continue'}
          isLoading={isLoading}
        >
          {renderStepContent()}
        </OnboardingStep>
      </AnimatePresence>
    </div>
  );
};