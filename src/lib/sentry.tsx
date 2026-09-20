/**
 * Sentry Error Tracking Configuration
 * 
 * To enable Sentry:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy your DSN and set it as VITE_SENTRY_DSN in your .env file
 * 4. Import initSentry() in main.tsx before React renders
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  // Only initialize if DSN is configured
  if (!SENTRY_DSN) {
    // Silently skip — Sentry DSN is optional and not having it is expected
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment configuration
    environment: import.meta.env.MODE,
    
    // Release version (set via CI/CD)
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Replay for session recordings (on error)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint?.originalException;
      
      // Ignore network errors that are expected
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          // Only report if not on local development
          if (import.meta.env.DEV) {
            return null;
          }
        }
        
        // Ignore user-cancelled requests
        if (error.name === 'AbortError') {
          return null;
        }
      }

      return event;
    },

    // Don't send events in development unless explicitly enabled
    enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_FORCE_ENABLE === 'true',
  });

  console.log('[Sentry] Error tracking initialized');
}

// Error Boundary component for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Higher-order component to wrap routes with error boundaries
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || <ErrorFallback />,
  });
}

// Default error fallback component
function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We've been notified and are working to fix the issue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

// Utility to capture custom errors
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Utility to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Set user context for error tracking
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}
