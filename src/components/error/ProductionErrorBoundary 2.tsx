import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logError } from '@/lib/api-service-complete';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ProductionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to backend
    logError({
      error_type: 'react_error_boundary',
      error_message: error.message,
      stack_trace: error.stack,
      severity: 'error',
      request_data: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    }).catch(console.error);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <Card className="max-w-md w-full bg-slate-900 border-slate-700">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-white">
                  Something went wrong
                </h1>
                <p className="text-slate-400 text-sm">
                  We've encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <div className="bg-slate-800 p-4 rounded-lg text-left">
                  <p className="text-red-400 text-xs font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={this.handleRetry}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Error ID: {Date.now().toString(36)}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;