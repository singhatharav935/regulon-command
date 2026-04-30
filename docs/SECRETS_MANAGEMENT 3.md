# Secrets Management Guide

## ⚠️ CRITICAL: Never Commit Secrets to Git!

This document explains how to properly manage secrets and environment variables for SANNIDH.

---

## Environment Files Status

### ✅ Properly Configured
- `.env` - **GITIGNORED** (local development secrets)
- `.env.agent` - **GITIGNORED** (agent-specific secrets)
- `.env.example` - Template file (safe to commit, no real secrets)
- `.env.agent.example` - Template file (safe to commit, no real secrets)

### Verification
Check `.gitignore` contains:
```
.env
.env.local
.env.*.local
.env.agent
```

---

## Required Environment Variables

### Development (`.env`)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics (Development)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Sentry (Development)
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Production (Set in Hosting Platform)

#### Vercel
```bash
# Set these in Vercel Dashboard > Settings > Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

#### Netlify
```bash
# Set these in Netlify Dashboard > Site settings > Build & deploy > Environment
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Secrets Checklist

### Before Deploying to Production

- [ ] **Remove all hardcoded API keys** from code
- [ ] **Verify `.env` is in `.gitignore`**
- [ ] **Never commit `.env` files to Git**
- [ ] **Use environment variables** for all secrets
- [ ] **Set production secrets** in hosting platform (Vercel/Netlify)
- [ ] **Rotate Supabase keys** for production
- [ ] **Use separate Supabase projects** for dev/staging/production
- [ ] **Enable RLS (Row Level Security)** in Supabase
- [ ] **Review CORS settings** in Supabase (production domains only)
- [ ] **Set up API key rotation schedule** (every 90 days)

---

## Secret Types & Where to Get Them

### 1. Supabase Keys (Required)
**Where:** Supabase Dashboard > Project Settings > API
- `VITE_SUPABASE_URL` - Your project URL
- `VITE_SUPABASE_ANON_KEY` - Anon/public key (safe for frontend)

**Security:**
- ✅ Anon key is safe for frontend (protected by RLS)
- ❌ Never expose service_role key in frontend
- ✅ Use separate projects for dev/prod

### 2. Google Analytics (Optional)
**Where:** Google Analytics > Admin > Data Streams
- `VITE_GA_MEASUREMENT_ID` - Measurement ID (e.g., G-XXXXXXXXXX)

**Security:**
- ✅ Safe to expose in frontend (public tracking ID)

### 3. Sentry (Optional - Error Tracking)
**Where:** Sentry > Settings > Projects > Your Project > Client Keys (DSN)
- `VITE_SENTRY_DSN` - Data Source Name

**Security:**
- ✅ Safe to expose in frontend (public DSN)
- ⚠️ Set up rate limiting in Sentry to prevent abuse

### 4. SendGrid/AWS SES (Backend Only)
**Where:** SendGrid Dashboard or AWS Console
- `SENDGRID_API_KEY` or `AWS_ACCESS_KEY_ID`
- **IMPORTANT:** These should ONLY be in backend/Supabase Edge Functions
- ❌ NEVER in frontend code or frontend `.env`

---

## CI/CD Secrets

### GitHub Actions
If using GitHub Actions for CI/CD, set secrets in:
**Repo Settings > Secrets and variables > Actions**

```yaml
# Required secrets
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VERCEL_TOKEN (if deploying to Vercel via GH Actions)
```

---

## Security Best Practices

### ✅ DO
- Use environment variables for all configuration
- Separate dev/staging/production environments
- Rotate keys every 90 days
- Use `.env.example` files as templates
- Set production secrets in hosting platform UI
- Enable RLS in Supabase
- Use Supabase anon key (not service_role) in frontend

### ❌ DON'T
- Commit `.env` files to Git
- Hardcode API keys in source code
- Share secrets in Slack/email/docs
- Use production keys in development
- Expose service_role keys in frontend
- Store secrets in frontend code
- Share the same keys across environments

---

## Emergency: Secret Leaked?

If you accidentally committed a secret to Git:

1. **Rotate the secret immediately** in the service (Supabase, SendGrid, etc.)
2. **Remove from Git history:**
   ```bash
   # Use BFG Repo-Cleaner or git-filter-branch
   bfg --replace-text passwords.txt
   ```
3. **Force push** (⚠️ coordinate with team):
   ```bash
   git push --force
   ```
4. **Notify team** that they need to re-pull
5. **Update all environments** with new secret

---

## Audit Checklist

Run this audit before launch:

```bash
# 1. Check for hardcoded secrets in code
grep -r "sk-\|pk_\|AIza\|AKIA" src/

# 2. Check .gitignore includes .env
grep ".env" .gitignore

# 3. Check no .env committed
git ls-files | grep "^\.env$"

# 4. Verify environment variables are loaded
npm run dev
# Check browser console: import.meta.env.VITE_SUPABASE_URL should be defined
```

---

## Production Deployment Checklist

Before deploying:

- [ ] All secrets set in hosting platform (Vercel/Netlify)
- [ ] Supabase production project created
- [ ] Production Supabase keys rotated
- [ ] RLS enabled on all tables
- [ ] CORS configured for production domain only
- [ ] Environment-specific configs tested
- [ ] No `.env` files in repository
- [ ] Secret rotation schedule documented
- [ ] Team trained on secrets management

---

## Contact

For questions about secrets management:
- **Security Lead:** TBD
- **DevOps:** TBD
- **Documentation:** This file

**Last Updated:** March 31, 2026
