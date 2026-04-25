# Monitoring & Analytics Setup Guide

## Overview

REGULON uses two monitoring tools:
1. **Sentry** - Error tracking and performance monitoring
2. **Google Analytics 4** - User behavior and feature usage tracking

---

## 1. Sentry Setup (Error Tracking)

### Step 1: Install Sentry Package
```bash
npm install @sentry/react
```

### Step 2: Create Sentry Account
1. Go to [sentry.io](https://sentry.io)
2. Create free account (10,000 errors/month free)
3. Create new project → Choose "React"
4. Copy your DSN (looks like: `https://xxxxx@sentry.io/xxxxx`)

### Step 3: Set Environment Variable

**Development** (`.env`):
```bash
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Production** (Vercel/Netlify):
Set in hosting platform dashboard → Environment Variables

### Step 4: Initialize in App

Already configured in `src/lib/sentry.ts`. Just initialize in `main.tsx`:

```typescript
import { initSentry } from "./lib/sentry";

// Initialize Sentry before React
initSentry();

// Then render React app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 5: Test Error Tracking

```typescript
import { captureException, captureMessage } from "@/lib/sentry";

// Test error
try {
  throw new Error("Test error from REGULON");
} catch (error) {
  captureException(error as Error, { context: "Testing" });
}

// Test message
captureMessage("Test message from REGULON", "info");
```

### Sentry Features
- ✅ Automatic error capture
- ✅ Performance monitoring
- ✅ Session replay (errors only)
- ✅ Breadcrumb tracking
- ✅ User context tracking
- ✅ Sensitive data filtering

---

## 2. Google Analytics 4 Setup

### Step 1: Install GA4 Package
```bash
npm install react-ga4
```

### Step 2: Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Create account (if new)
3. Create GA4 property
4. Add data stream → Choose "Web"
5. Enter website URL
6. Copy Measurement ID (looks like: `G-XXXXXXXXXX`)

### Step 3: Set Environment Variable

**Development** (`.env`):
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Production** (Vercel/Netlify):
Set in hosting platform dashboard → Environment Variables

### Step 4: Initialize in App

Already configured in `src/lib/analytics.ts`. Initialize in `main.tsx`:

```typescript
import { initAnalytics } from "./lib/analytics";

// Initialize analytics
initAnalytics();

// Then render React app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 5: Track Page Views

In `App.tsx` or router setup:

```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

function App() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  // ... rest of app
}
```

### Step 6: Track Custom Events

```typescript
import {
  trackUserRegistration,
  trackUserLogin,
  trackFeatureUsage,
  trackAIDrafting,
  trackChatbot,
} from "@/lib/analytics";

// Track registration
trackUserRegistration("Company Owner");

// Track login
trackUserLogin("External CA");

// Track feature usage
trackFeatureUsage("AI Drafting", "Generate");

// Track AI drafting
trackAIDrafting("GST Return", true);

// Track chatbot
trackChatbot("Open");
```

### Analytics Events Available
- `trackUserRegistration(persona)` - User signs up
- `trackUserLogin(persona)` - User logs in
- `trackFeatureUsage(feature, action)` - Feature interaction
- `trackAIDrafting(docType, success)` - AI drafting usage
- `trackChatbot(action)` - Chatbot interactions
- `trackDocumentUpload(type, size)` - Document uploads
- `trackTaskCreation(type)` - Task creation
- `trackDashboardView(persona)` - Dashboard views
- `trackVerificationComplete(persona)` - Verification completion

---

## 3. Production Deployment Checklist

### Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   VITE_SENTRY_DSN = https://xxxxx@sentry.io/xxxxx
   VITE_GA_MEASUREMENT_ID = G-XXXXXXXXXX
   ```
3. Select "Production" environment
4. Redeploy

### Netlify
1. Go to Netlify Dashboard → Site settings → Build & deploy → Environment
2. Add:
   ```
   VITE_SENTRY_DSN = https://xxxxx@sentry.io/xxxxx
   VITE_GA_MEASUREMENT_ID = G-XXXXXXXXXX
   ```
3. Redeploy

---

## 4. Testing Monitoring

### Test Sentry (Error Tracking)

Create a test page or add to existing page:

```typescript
import { captureException, captureMessage, addBreadcrumb } from "@/lib/sentry";

function TestSentry() {
  const testError = () => {
    try {
      addBreadcrumb("Testing Sentry", "test", { action: "button-click" });
      throw new Error("Test error from REGULON frontend");
    } catch (error) {
      captureException(error as Error, {
        page: "Test Page",
        action: "Manual Test",
      });
      alert("Error sent to Sentry! Check your Sentry dashboard.");
    }
  };

  const testMessage = () => {
    captureMessage("Test message from REGULON", "info");
    alert("Message sent to Sentry!");
  };

  return (
    <div>
      <button onClick={testError}>Test Error</button>
      <button onClick={testMessage}>Test Message</button>
    </div>
  );
}
```

### Test Google Analytics

1. Open browser DevTools → Network tab
2. Filter by "collect" or "analytics"
3. Perform actions in app (login, navigate, use features)
4. Verify requests being sent to Google Analytics
5. Check GA4 dashboard → Reports → Realtime (see live events)

---

## 5. Privacy & GDPR Compliance

### Sentry
- ✅ Automatically masks sensitive data
- ✅ beforeSend hook filters passwords, tokens
- ✅ User IPs anonymized by default

### Google Analytics
- ✅ IP anonymization enabled (`anonymize_ip: true`)
- ✅ No personally identifiable information (PII) sent
- ⚠️ Add to Privacy Policy: "We use Google Analytics for analytics"
- ⚠️ Get user consent before enabling (cookie consent banner)

### Cookie Consent
Users must consent to analytics cookies before tracking:

```typescript
// Only initialize after user consents
if (userConsentedToCookies) {
  initAnalytics();
}
```

---

## 6. Monitoring Dashboard URLs

Once set up, access dashboards at:

### Sentry
- Dashboard: `https://sentry.io/organizations/your-org/issues/`
- Errors: Real-time error tracking
- Performance: Transaction monitoring
- Releases: Track deployments

### Google Analytics
- Dashboard: `https://analytics.google.com/`
- Realtime: Live user activity
- Reports: User behavior, acquisition, engagement
- Conversions: Goal tracking

---

## 7. Cost Estimates

### Sentry
- **Free Tier:** 10,000 errors/month, 1 user
- **Team Plan:** $26/month for 50,000 errors
- **Business Plan:** $80/month for 150,000 errors
- **Recommended:** Start with Free tier

### Google Analytics 4
- **Free:** Unlimited (standard implementation)
- **GA4 360:** $50,000+/year (enterprise)
- **Recommended:** Free tier is sufficient

---

## 8. Troubleshooting

### Sentry Not Working?
1. Check `VITE_SENTRY_DSN` is set
2. Check browser console for Sentry init message
3. Check Network tab for requests to `sentry.io`
4. Verify DSN is correct in Sentry dashboard

### Google Analytics Not Working?
1. Check `VITE_GA_MEASUREMENT_ID` is set
2. Check browser console for GA init message
3. Check Network tab for requests to `google-analytics.com`
4. Use GA Debugger Chrome extension
5. Check GA4 Realtime view for live events

### No Data in Dashboards?
- Wait 24-48 hours for initial data
- Check environment variables are set correctly
- Verify `import.meta.env.VITE_*` is defined in browser console
- Check CSP headers allow analytics domains

---

## Files Created
- `src/lib/sentry.ts` - Sentry configuration
- `src/lib/analytics.ts` - Google Analytics configuration
- `MONITORING_SETUP.md` - This guide

## Next Steps
1. Install packages: `npm install @sentry/react react-ga4`
2. Set up Sentry account and get DSN
3. Set up GA4 property and get Measurement ID
4. Add environment variables
5. Initialize in `main.tsx`
6. Test in development
7. Deploy to production
8. Monitor dashboards

**Last Updated:** March 31, 2026
