/**
 * Security Headers Configuration
 * 
 * This file defines security headers for production deployment.
 * These headers should be configured in your hosting platform (Vercel, Netlify, etc.)
 */

export const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com https://www.google-analytics.com https://api.sentry.io https://*.onrender.com https://api.sannidh.ai",
      "worker-src 'self' blob:",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/**
 * CORS Configuration for Production
 * 
 * Configure these allowed origins in your backend/API
 */
export const corsConfig = {
  // Production domains (update these with your actual domains)
  allowedOrigins: [
    "https://sannidh.ai",
    "https://www.sannidh.ai",
    "https://app.sannidh.ai",
  ],
  
  // Development (only for local testing)
  developmentOrigins: [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
  ],
  
  // Allowed methods
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  
  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  
  // Expose headers
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  
  // Credentials
  credentials: true,
  
  // Max age for preflight cache (24 hours)
  maxAge: 86400,
};

/**
 * Get CORS configuration based on environment
 */
export function getCorsOrigins(isDevelopment: boolean): string[] {
  if (isDevelopment) {
    return [...corsConfig.allowedOrigins, ...corsConfig.developmentOrigins];
  }
  return corsConfig.allowedOrigins;
}
