# miLuka — Deployment Guide

## Architecture

```
┌─────────────────┐     ┌─────────────────────────┐
│  Cloudflare     │     │  Supabase Cloud         │
│  Pages          │────▶│  (Managed)              │
│                 │     │                         │
│  React SPA      │     │  ┌─────────────────┐   │
│  (static files) │     │  │ Auth (GoTrue)    │   │
└─────────────────┘     │  ├─────────────────┤   │
                        │  │ REST API         │   │
                        │  │ (PostgREST)      │   │
                        │  ├─────────────────┤   │
                        │  │ Database         │   │
                        │  │ (PostgreSQL)     │   │
                        │  └─────────────────┘   │
                        └─────────────────────────┘
```

**Cost:** $0/month (both services have free tiers)

---

## Phase 1: Supabase Cloud Setup

### 1.1 Create Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### 1.2 Create Project

1. Click "New Project"
2. Choose organization (or create one)
3. Enter project details:
   - **Name:** `miluka` (or your preferred name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 1.3 Get Credentials

1. Go to **Settings → API** (gear icon in sidebar)
2. Copy these values:
   - **Project URL:** `https://xxxxxxxx.supabase.co`
   - **Anon (public) key:** `eyJhbG...`
   - **Service role key:** `eyJhbG...` (keep secret!)

### 1.4 Apply Database Schema

1. Go to **SQL Editor** (left sidebar)
2. Run the combined migration script:

```sql
-- Paste contents of sql/000_supabase_cloud_init.sql
-- This single script creates ALL tables, RLS policies, triggers, and seeds
-- Fully idempotent: safe to re-run on existing databases
```

The script creates:
- profiles, wallets, categories, transactions, budgets tables
- Row Level Security on all tables
- Auto-create profile + wallet trigger on signup
- 18 default categories (13 expense + 5 income)
- Budgets with period support (monthly/custom)

### 1.5 Configure Authentication

1. Go to **Authentication → URL Configuration**
2. Set these values:
   - **Site URL:** `https://your-app.pages.dev` (your Cloudflare Pages URL)
   - **Redirect URLs:** Add `https://your-app.pages.dev/**`

3. Go to **Authentication → Providers**
4. Ensure **Email** is enabled
5. Optionally enable **Magic Link** or **Google** (requires OAuth setup)

---

## Phase 2: Cloudflare Pages Setup

### 2.1 Push Code to GitHub

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/miluka.git
   git push -u origin main
   ```

### 2.2 Connect to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create** → **Pages** → **Connect to Git**
4. Select your GitHub repository
5. Configure build settings:
   - **Production branch:** `main`
   - **Framework preset:** `Vite`
   - **Build command:** `cd web && npm install && npm run build`
   - **Build output directory:** `web/dist`
   - **Root directory:** `/` (leave empty)

### 2.3 Set Environment Variables

In Cloudflare Pages project settings → **Settings → Variables and secrets**:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (your anon key) |

### 2.4 Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (1-2 minutes)
3. Your app is live at `https://your-app.pages.dev`

---

## Phase 3: Post-Deployment

### 3.1 Test Authentication

1. Open your deployed app
2. Click "Register"
3. Create an account
4. Check email for confirmation (or check Supabase Dashboard → Authentication → Users)

### 3.2 Verify Database

1. Go to Supabase Dashboard → Table Editor
2. You should see:
   - A row in `profiles` for your user
   - A default wallet ("General", MXN) in `wallets`
   - 18 default categories in `categories`
   - `budgets` table ready for budget creation

### 3.3 Test PWA (Mobile)

1. Open your app on a mobile device
2. Tap "Add to Home Screen" (iOS) or "Install" (Android)
3. The app now works like a native app!

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Cloudflare Pages | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Cloudflare Pages | Supabase anonymous (public) key |

**Important:** Never commit `VITE_SUPABASE_ANON_KEY` to Git. Use Cloudflare Pages environment variables.

---

## Custom Domain (Optional)

### Cloudflare Pages

1. Go to your Pages project → **Custom domains**
2. Add your domain (e.g., `miluka.yourdomain.com`)
3. Follow DNS configuration instructions
4. SSL is automatic

### Supabase Auth Redirects

After adding custom domain, update Supabase:
1. Go to **Authentication → URL Configuration**
2. Update **Site URL** to your custom domain
3. Update **Redirect URLs** to include your custom domain

---

## Troubleshooting

### "Invalid API key" error

- Verify `VITE_SUPABASE_URL` matches your Supabase project URL
- Verify `VITE_SUPABASE_ANON_KEY` is the **anon** key (not service role)
- Check for typos in environment variables

### Auth not working

- Ensure Site URL in Supabase matches your Cloudflare Pages URL
- Check Redirect URLs include your domain
- Verify email confirmation is enabled (or auto-confirm for testing)

### Build fails on Cloudflare

- Check build logs for errors
- Ensure Node.js version is 18+ (set in Cloudflare Pages settings)
- Verify `npm run build` works locally

### Database tables missing

- Re-run `sql/000_supabase_cloud_init.sql` — it's fully idempotent and safe to re-run
- Check Supabase Dashboard → Table Editor for existing tables

---

## Updating the App

### Code Changes

1. Push changes to GitHub
2. Cloudflare Pages auto-deploys from `main` branch

### Database Migrations

1. Create new SQL file in `sql/` directory (e.g., `006_new_feature.sql`)
2. Run in Supabase SQL Editor
3. **Update `sql/000_supabase_cloud_init.sql`** to include the new schema — this file must always reflect the current state of the database
4. Document in ARCHITECTURE.md

---

## Backup Strategy

**Supabase Cloud Free Tier:** No automatic backups

**Manual Backup:**
1. Go to Supabase Dashboard → SQL Editor
2. Run: `pg_dump` via Supabase CLI (or use Table Editor → Export)

**Recommended:** Upgrade to Supabase Pro ($25/mo) for automatic daily backups when in production.

---

## Cost Monitoring

### Supabase Cloud

- Check usage at: Dashboard → Settings → Usage
- Free tier limits:
  - 500MB database
  - 50K monthly active users
  - 5GB bandwidth
  - 1GB file storage

### Cloudflare Pages

- Check usage at: Dashboard → Workers & Pages → Your project → Analytics
- Free tier limits:
  - Unlimited bandwidth
  - 500 builds/month
  - 100k requests/day (if using Functions)
