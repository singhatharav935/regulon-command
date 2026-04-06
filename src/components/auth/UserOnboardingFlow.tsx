import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Building2,
  Users,
  Shield,
  Gavel,
  UserCheck,
  Briefcase,
  ArrowRight,
  Star,
  BookOpen,
  Zap,
  Target,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAuth } from '@/lib/enhanced-auth-context';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed?: boolean;
  optional?: boolean;
}

interface RoleSpecificContent {
  welcomeTitle: string;
  welcomeDescription: string;
  features: Array<{
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    benefit: string;
  }>;
  quickActions: Array<{
    title: string;
    description: string;
    action: string;
    icon: React.ComponentType<any>;
  }>;
  learningResources: Array<{
    title: string;
    description: string;
    type: 'video' | 'article' | 'guide';
    duration?: string;
  }>;
}

export const UserOnboardingFlow: React.FC = () => {
  const { user, updateProfile } = useEnhancedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  // Get role-specific content
  const getRoleContent = (role: string): RoleSpecificContent => {
    switch (role) {
      case 'company_owner':
        return {
          welcomeTitle: 'Welcome to REGULON for Business Owners',
          welcomeDescription: 'Streamline your compliance management and stay ahead of regulatory changes.',
          features: [
            {
              icon: Shield,
              title: 'Automated Compliance Tracking',
              description: 'Never miss a deadline with our intelligent tracking system',
              benefit: 'Reduce compliance risks by 90%'
            },
            {
              icon: TrendingUp,
              title: 'Real-time Regulatory Updates',
              description: 'Stay informed about changes that affect your business',
              benefit: 'Always stay ahead of regulations'
            },
            {
              icon: Target,
              title: 'Custom Compliance Dashboards',
              description: 'Get personalized insights for your industry',
              benefit: 'Save 15+ hours per month'
            },
          ],
          quickActions: [
            {
              title: 'Set up Company Profile',
              description: 'Complete your business information',
              action: '/profile/company',
              icon: Building2,
            },
            {
              title: 'Configure Compliance Calendar',
              description: 'Set up your regulatory deadlines',
              action: '/compliance/calendar',
              icon: Target,
            },
            {
              title: 'Invite Team Members',
              description: 'Add your compliance team',
              action: '/team/invite',
              icon: Users,
            },
          ],
          learningResources: [
            {
              title: 'Getting Started with REGULON',
              description: 'Complete overview of the platform',
              type: 'video',
              duration: '5 min'
            },
            {
              title: 'Compliance Best Practices',
              description: 'Essential compliance strategies for business owners',
              type: 'guide',
              duration: '10 min'
            },
          ]
        };

      case 'external_ca':
      case 'in_house_ca':
        return {
          welcomeTitle: 'Welcome to REGULON for Chartered Accountants',
          welcomeDescription: 'Enhance your practice with powerful compliance tools and client management.',
          features: [
            {
              icon: Users,
              title: 'Client Portfolio Management',
              description: 'Manage all your clients\' compliance needs in one place',
              benefit: 'Handle 50% more clients efficiently'
            },
            {
              icon: BookOpen,
              title: 'Regulatory Research Hub',
              description: 'Access latest updates, case studies, and interpretations',
              benefit: 'Save 10+ hours on research weekly'
            },
            {
              icon: Award,
              title: 'Professional Certification Tracking',
              description: 'Keep track of CPE credits and renewals',
              benefit: 'Never miss certification deadlines'
            },
          ],
          quickActions: [
            {
              title: 'Verify CA Credentials',
              description: 'Complete your professional verification',
              action: '/verification/ca',
              icon: UserCheck,
            },
            {
              title: 'Set up Practice Profile',
              description: 'Configure your service offerings',
              action: '/profile/practice',
              icon: Briefcase,
            },
            {
              title: 'Import Client List',
              description: 'Bulk import your existing clients',
              action: '/clients/import',
              icon: Users,
            },
          ],
          learningResources: [
            {
              title: 'CA Practice Management',
              description: 'Optimize your practice with REGULON',
              type: 'video',
              duration: '8 min'
            },
            {
              title: 'Client Onboarding Best Practices',
              description: 'Streamline client acquisition and management',
              type: 'guide',
              duration: '12 min'
            },
          ]
        };

      case 'ca_firm':
        return {
          welcomeTitle: 'Welcome to REGULON for CA Firms',
          welcomeDescription: 'Scale your firm with enterprise-grade compliance management tools.',
          features: [
            {
              icon: Users,
              title: 'Multi-CA Collaboration',
              description: 'Coordinate work across your team seamlessly',
              benefit: 'Improve team productivity by 40%'
            },
            {
              icon: TrendingUp,
              title: 'Firm Analytics & Insights',
              description: 'Track performance, workload, and client satisfaction',
              benefit: 'Data-driven growth strategies'
            },
            {
              icon: Shield,
              title: 'Enterprise Security',
              description: 'Bank-grade security for all client data',
              benefit: '100% compliance with data protection'
            },
          ],
          quickActions: [
            {
              title: 'Set up Firm Structure',
              description: 'Define roles and permissions for your team',
              action: '/firm/structure',
              icon: Building2,
            },
            {
              title: 'Bulk Client Onboarding',
              description: 'Import and organize existing client base',
              action: '/clients/bulk-import',
              icon: Users,
            },
            {
              title: 'Configure Workflows',
              description: 'Set up automated compliance workflows',
              action: '/workflows/setup',
              icon: Zap,
            },
          ],
          learningResources: [
            {
              title: 'Firm Management Masterclass',
              description: 'Advanced strategies for CA firm growth',
              type: 'video',
              duration: '15 min'
            },
            {
              title: 'Team Collaboration Guide',
              description: 'Best practices for multi-CA coordination',
              type: 'guide',
              duration: '8 min'
            },
          ]
        };

      case 'in_house_lawyer':
        return {
          welcomeTitle: 'Welcome to REGULON for Legal Professionals',
          welcomeDescription: 'Navigate regulatory compliance with confidence using our legal-focused tools.',
          features: [
            {
              icon: BookOpen,
              title: 'Legal Research Engine',
              description: 'Access comprehensive regulatory databases and case law',
              benefit: 'Cut research time by 60%'
            },
            {
              icon: Shield,
              title: 'Risk Assessment Tools',
              description: 'Identify and mitigate compliance risks proactively',
              benefit: 'Reduce legal exposure significantly'
            },
            {
              icon: Users,
              title: 'Cross-functional Collaboration',
              description: 'Work seamlessly with finance and operations teams',
              benefit: 'Ensure company-wide compliance'
            },
          ],
          quickActions: [
            {
              title: 'Legal Profile Setup',
              description: 'Configure your areas of expertise',
              action: '/profile/legal',
              icon: Gavel,
            },
            {
              title: 'Risk Assessment Matrix',
              description: 'Set up compliance risk monitoring',
              action: '/risk/assessment',
              icon: Shield,
            },
            {
              title: 'Connect with Teams',
              description: 'Link with finance and operations',
              action: '/teams/connect',
              icon: Users,
            },
          ],
          learningResources: [
            {
              title: 'Legal Compliance Framework',
              description: 'Comprehensive guide to regulatory compliance',
              type: 'guide',
              duration: '20 min'
            },
            {
              title: 'Risk Management Strategies',
              description: 'Advanced risk assessment techniques',
              type: 'video',
              duration: '12 min'
            },
          ]
        };

      default:
        return {
          welcomeTitle: 'Welcome to REGULON',
          welcomeDescription: 'Get started with professional compliance management.',
          features: [],
          quickActions: [],
          learningResources: []
        };
    }
  };

  const baseSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to REGULON',
      description: 'Learn about the platform and your role-specific features',
      component: 'welcome',
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Set up your professional profile and preferences',
      component: 'profile',
    },
    {
      id: 'verification',
      title: 'Verify Your Credentials',
      description: 'Complete professional verification (if applicable)',
      component: 'verification',
      optional: user?.registration_role === 'company_owner',
    },
    {
      id: 'quick-setup',
      title: 'Quick Setup',
      description: 'Configure essential settings to get started',
      component: 'quick-setup',
    },
    {
      id: 'resources',
      title: 'Learning Resources',
      description: 'Explore guides and tutorials for your role',
      component: 'resources',
      optional: true,
    },
    {
      id: 'complete',
      title: 'Ready to Go!',
      description: 'Your onboarding is complete',
      component: 'complete',
    },
  ];

  const roleContent = getRoleContent(user?.registration_role || '');
  
  const handleCompleteStep = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNext = () => {
    if (currentStep < baseSteps.length - 1) {
      handleCompleteStep(baseSteps[currentStep].id);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (baseSteps[currentStep].optional) {
      handleNext();
    }
  };

  // Get dashboard route based on role
  const getDashboardRoute = (role: string): string => {
    switch (role) {
      case 'external_ca':
        return '/real-external-ca-dashboard';
      case 'in_house_ca':
      case 'ca_firm':
        return '/ca-dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'in_house_lawyer':
        return '/lawyer-dashboard';
      case 'company_owner':
        return '/real-company-dashboard';
      default:
        return '/real-company-dashboard';
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await updateProfile({ profile_completed: true });
      toast({
        title: 'Welcome to REGULON!',
        description: 'Your onboarding is complete. Let\'s get started!',
      });
      // Navigate to role-appropriate dashboard
      const dashboardRoute = getDashboardRoute(user?.registration_role || 'company_owner');
      navigate(dashboardRoute);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const progress = ((completedSteps.size) / baseSteps.length) * 100;

  const renderStepContent = () => {
    const step = baseSteps[currentStep];
    
    switch (step.component) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {roleContent.welcomeTitle}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {roleContent.welcomeDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {roleContent.features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {feature.benefit}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
              <p className="text-gray-600">
                Add your professional details to personalize your REGULON experience
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <h3 className="font-medium">Basic Information</h3>
                    <p className="text-sm text-gray-500">Name and email verified</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="w-5 h-5 border-2 border-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-medium">Professional Details</h3>
                    <p className="text-sm text-gray-500">Add your professional information</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/profile/professional')}
                    className="ml-auto"
                  >
                    Complete
                  </Button>
                </div>
                
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <div>
                    <h3 className="font-medium">Preferences</h3>
                    <p className="text-sm text-gray-500">Notification and privacy settings</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/settings/preferences')}
                    className="ml-auto"
                  >
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'quick-setup':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Setup</h2>
              <p className="text-gray-600">
                Get started with these essential configurations for your role
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleContent.quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <action.icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                          <Button 
                            size="sm" 
                            onClick={() => navigate(action.action)}
                            className="w-full"
                          >
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'resources':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Learning Resources</h2>
              <p className="text-gray-600">
                Explore these resources to master REGULON and excel in your role
              </p>
            </div>

            <div className="space-y-4">
              {roleContent.learningResources.map((resource, index) => (
                <Card key={resource.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        resource.type === 'video' ? 'bg-red-100' :
                        resource.type === 'guide' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <BookOpen className={`w-6 h-6 ${
                          resource.type === 'video' ? 'text-red-600' :
                          resource.type === 'guide' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                          <Badge variant="outline">
                            {resource.type}
                          </Badge>
                          {resource.duration && (
                            <span className="text-sm text-gray-500">{resource.duration}</span>
                          )}
                        </div>
                        <p className="text-gray-600">{resource.description}</p>
                      </div>
                      <Button size="sm">
                        Start Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                You're All Set! 🎉
              </h1>
              <p className="text-xl text-gray-600">
                Welcome to REGULON! Your account is ready and you can now access all features.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleFinishOnboarding}
                size="lg"
                className="w-full max-w-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-sm text-gray-500">
                Need help? Check out our <a href="/help" className="text-purple-600 hover:underline">Help Center</a> or contact support.
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Getting Started</h1>
            <Badge variant="secondary">
              Step {currentStep + 1} of {baseSteps.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="mb-2" />
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>{completedSteps.size} of {baseSteps.length} steps completed</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <div key={currentStep}>
            {renderStepContent()}
          </div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            {baseSteps[currentStep]?.optional && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            
            {currentStep < baseSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinishOnboarding}>
                Complete Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};