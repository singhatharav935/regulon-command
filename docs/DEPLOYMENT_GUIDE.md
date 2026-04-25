# 🚀 REGULON Production Deployment Guide

## Quick Start (5 steps)

1. **Push to GitHub** → Triggers CI/CD
2. **Set secrets** in Vercel/Netlify dashboard
3. **Deploy** via platform UI or Git integration
4. **Configure domain** and SSL
5. **Test** production site

---

## Option 1: Vercel (Recommended - Easiest)

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Vercel auto-detects Vite ✅

### Step 2: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-production-anon-key
VITE_SENTRY_DSN = https://xxxxx@sentry.io/xxxxx
VITE_GA_MEASUREMENT_ID = G-XXXXXXXXXX
```

### Step 3: Deploy
Click **"Deploy"** - Done! 🎉

Vercel URL: `https://your-project.vercel.app`

### Step 4: Custom Domain
Settings → Domains → Add Domain → Follow DNS instructions

---

## Option 2: Netlify

### Step 1: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub → Select repository

### Step 2: Build Settings
```
Build command: npm run build
Publish directory: dist
```

### Step 3: Environment Variables
Site settings → Build & deploy → Environment:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SENTRY_DSN
VITE_GA_MEASUREMENT_ID
```

### Step 4: Deploy
Click **"Deploy site"** - Done! 🎉

---

## GitHub Actions CI/CD

### Setup Secrets
GitHub Repo → Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN (from Vercel account settings)
VERCEL_ORG_ID (from Vercel)
VERCEL_PROJECT_ID (from Vercel)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Auto-Deploy on Push
- Push to `main` → deploys to production
- Push to `develop` → deploys to staging
- Pull requests → preview deployment

---

## Pre-Deploy Checklist

- [ ] Tests passing (`npm run test`)
- [ ] Build successful (`npm run build`)
- [ ] No hardcoded secrets
- [ ] Environment variables set
- [ ] Supabase production project created
- [ ] Security headers configured (`vercel.json`/`netlify.toml`)
- [ ] Legal pages finalized
- [ ] Cookie consent banner enabled
- [ ] Analytics & Sentry configured

---

## Post-Deploy Verification

1. **Check homepage loads**: https://your-domain.com
2. **Test authentication**: Sign up, login
3. **Verify dashboards**: Load without errors
4. **Check security headers**: Use [securityheaders.com](https://securityheaders.com)
5. **Test mobile**: Responsive design works
6. **Verify analytics**: Events in GA4 dashboard
7. **Check error tracking**: Errors in Sentry

---

## Custom Domain Setup

### Vercel
1. Vercel Dashboard → Domains → Add
2. Follow DNS instructions from your registrar
3. SSL auto-configured ✅

### Netlify
1. Domain settings → Add custom domain
2. Update DNS records at registrar
3. Enable HTTPS (auto)

---

## Rollback

### Vercel
Deployments → Previous deployment → "Promote to Production"

### Netlify
Deploys → Old deployment → "Publish deploy"

---

## Monitoring

- **Vercel Analytics**: Built-in, auto-enabled
- **Sentry**: https://sentry.io → Check errors
- **Google Analytics**: https://analytics.google.com

---

## Troubleshooting

**Build fails?**
- Check Node version (20+)
- Verify environment variables
- Check build logs

**404 on routes?**
- Vercel/Netlify auto-configures SPA routing ✅
- Check `vercel.json` or `netlify.toml` rewrites

**Environment variables not working?**
- Must start with `VITE_`
- Redeploy after adding variables
- Check spelling

---

**Files configured:**
- `.github/workflows/ci-cd.yml` - GitHub Actions
- `vercel.json` - Vercel config + security headers
- `netlify.toml` - Netlify config + security headers

**Deployment time:** ~2-3 minutes per deploy

✅ **You're ready to deploy!**
