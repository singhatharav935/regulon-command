/**
 * Sentry Configuration for Error Tracking
 * 
 * Install: npm install @sentry/react
 * 
 * Set environment variable:
 * VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
 */

import * as Sentry from "@sentry/react";

export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const isProduction = environment === "production";

  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.warn("Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, reduce this to a smaller percentage (e.g., 0.1 for 10%)
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    
    // Capture 100% of errors in production, 50% in development
    sampleRate: isProduction ? 1.0 : 0.5,
    
    // Enable performance monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set routes for better transaction names
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          // These will be set in main.tsx with actual router
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay({
        // Only record sessions with errors in production
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Session Replay sampling
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Before sending to Sentry, filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.apiKey;
          }
          return breadcrumb;
        });
      }
      
      // Don't send errors in development
      if (!isProduction && hint.originalException?.message?.includes("development")) {
        return null;
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "chrome-extension://",
      "moz-extension://",
      
      // Network errors (users going offline)
      "NetworkError",
      "Failed to fetch",
      
      // Third-party script errors
      "Script error.",
      
      // Non-critical React errors
      "ResizeObserver loop limit exceeded",
    ],
    
    // Set user context (optional)
    initialScope: {
      tags: {
        app: "regulon-frontend",
      },
    },
  });
  
  console.log(`Sentry initialized for ${environment} environment`);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
  });
}
