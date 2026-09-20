/**
 * Google Analytics 4 Configuration
 * 
 * Install: npm install react-ga4
 * 
 * Set environment variable:
 * VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 */

import ReactGA from "react-ga4";

let isInitialized = false;

/**
 * Initialize Google Analytics
 */
export function initAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const environment = import.meta.env.MODE;
  const isProduction = environment === "production";

  // Only initialize in production or if explicitly enabled in development
  if (!measurementId) {
    console.warn("Google Analytics Measurement ID not configured. Analytics disabled.");
    return;
  }

  // Don't initialize twice
  if (isInitialized) {
    return;
  }

  ReactGA.initialize(measurementId, {
    testMode: !isProduction,
    gtagOptions: {
      send_page_view: false, // We'll send manually
      anonymize_ip: true, // GDPR compliance
    },
  });

  isInitialized = true;
  console.log(`Google Analytics initialized for ${environment} environment`);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  if (!isInitialized) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title || document.title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (!isInitialized) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
}

/**
 * Track user registration
 */
export function trackUserRegistration(persona: string) {
  trackEvent("User", "Registration", persona);
}

/**
 * Track user login
 */
export function trackUserLogin(persona: string) {
  trackEvent("User", "Login", persona);
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, action: string) {
  trackEvent("Feature", action, feature);
}

/**
 * Track AI drafting usage
 */
export function trackAIDrafting(documentType: string, success: boolean) {
  trackEvent("AI Drafting", success ? "Success" : "Error", documentType);
}

/**
 * Track chatbot interaction
 */
export function trackChatbot(action: "Open" | "Message" | "Close") {
  trackEvent("Chatbot", action);
}

/**
 * Track document upload
 */
export function trackDocumentUpload(fileType: string, size: number) {
  trackEvent("Document", "Upload", fileType, size);
}

/**
 * Track task creation
 */
export function trackTaskCreation(taskType: string) {
  trackEvent("Task", "Create", taskType);
}

/**
 * Track error
 */
export function trackError(errorMessage: string, errorLocation: string) {
  trackEvent("Error", errorMessage, errorLocation);
}

/**
 * Track dashboard view
 */
export function trackDashboardView(persona: string) {
  trackEvent("Dashboard", "View", persona);
}

/**
 * Track verification completion
 */
export function trackVerificationComplete(persona: string) {
  trackEvent("Verification", "Complete", persona);
}

/**
 * Set user ID for analytics (after login)
 */
export function setAnalyticsUserId(userId: string) {
  if (!isInitialized) return;

  ReactGA.set({ userId });
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, string | number | boolean>) {
  if (!isInitialized) return;

  ReactGA.set(properties);
}
