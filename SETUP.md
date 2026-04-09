# 🚀 SETUP.md — Launch Chibi Creator in 15 Minutes

This guide takes you from zero to a fully live, production-ready Chibi Creator app.
No coding required. Just follow each step exactly.

---

## What You'll Need

- A GitHub account (you already have one — `dzinh1901-lang`)
- An OpenAI account with API access
- 15 minutes

**You will NOT need:**
- A credit card (all free tiers used)
- Any coding knowledge
- A server

---

## Step 1 — Get Your OpenAI API Key (3 minutes)

> This key lets your app generate chibi images. It stays **100% server-side** — your users never see it.

1. Go to: **https://platform.openai.com/api-keys**
2. Click **"+ Create new secret key"**
3. Name it: `chibioi-production`
4. Click **"Create secret key"**
5. **Copy the key** — it starts with `sk-proj-...`
   > ⚠️ Save it somewhere safe — you can only see it once!
6. **Set a spending limit** (recommended):
   - Go to: **https://platform.openai.com/settings/organization/limits**
   - Set **Monthly budget** to `$10` to start
   - This prevents surprise charges

---

## Step 2 — Create Your Free Supabase Project (5 minutes)

> Supabase is your database + user auth. Free tier, no credit card.

1. Go to: **https://supabase.com**
2. Click **"Start your project"** → sign in with GitHub
3. Click **"New project"**
4. Fill in:
   - **Organization**: your personal org
   - **Name**: `chibioi`
   - **Database Password**: generate a strong one and save it
   - **Region**: pick the closest to your users
5. Click **"Create new project"** → wait ~2 minutes for it to provision

### 2a — Run the Database Schema

6. In your Supabase project, click **"SQL Editor"** in the left sidebar
7. Click **"+ New query"**
8. Go to your GitHub repo: **https://github.com/dzinh1901-lang/chibioi/blob/main/supabase/migrations/001_initial_schema.sql**
9. Click the **Raw** button, select all text, copy it
10. Paste it into the Supabase SQL Editor
11. Click **"Run"** (or press Ctrl+Enter)
12. You should see: `Success. No rows returned`

### 2b — Get Your Supabase Keys

13. In Supabase, go to **Settings → API** (in the left sidebar)
14. Copy and save these 3 values:
    - **Project URL** — looks like: `https://abcdefghijkl.supabase.co`
    - **anon public** key — starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
    - **service_role secret** key — also starts with `eyJ...` (keep this secret!)

### 2c — Enable Email Auth

15. Go to **Authentication → Providers** in the left sidebar
16. Make sure **Email** is enabled (it is by default)
17. Optionally turn off **"Confirm email"** for easier testing

---

## Step 3 — Deploy to Vercel (5 minutes)

> Vercel hosts your app + runs your backend API functions. Free tier.

1. Go to: **https://vercel.com**
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Click **"Add New Project"**
4. Find `chibioi` in your repository list → click **"Import"**
5. On the configuration page:
   - **Framework Preset**: leave as "Other"
   - **Root Directory**: leave as `./`
   - **Build Command**: leave empty (no build step needed)
   - **Output Directory**: leave empty
6. Click **"Environment Variables"** to expand it
7. Add these variables one by one (click "Add" after each):

   | Name | Value |
   |------|-------|
   | `OPENAI_API_KEY` | `sk-proj-...` (your key from Step 1) |
   | `SUPABASE_URL` | `https://xxxx.supabase.co` (from Step 2b) |
   | `SUPABASE_ANON_KEY` | `eyJ...` anon key (from Step 2b) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` service role key (from Step 2b) |
   | `NODE_ENV` | `production` |

8. Click **"Deploy"**
9. Wait ~1 minute for deployment to complete
10. Vercel will give you a URL like: `https://chibioi-abc123.vercel.app`

---

## Step 4 — Verify Everything Works (2 minutes)

1. Open your Vercel URL in a browser
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
   - You should see: `{"status":"ok","app":"chibioi","version":"4.0.0"}`
3. Go back to the main app
4. Click **"Sign Up"** and create a test account
5. Click **"Create"** tab → type any prompt → click **"Generate"**
6. Your chibi should generate in ~10 seconds! 🎉

---

## Step 5 — (Optional) Set Up a Custom Domain

1. In Vercel dashboard → your project → **Settings → Domains**
2. Click **"Add"** → enter your domain (e.g. `chibioi.com`)
3. Follow Vercel's DNS instructions
4. HTTPS is automatic ✅

---

## Step 6 — (Optional) Set Up Stripe Payments

> Only needed if you want to charge users for PRO/STUDIO plans.

1. Go to: **https://dashboard.stripe.com**
2. Create an account if you don't have one
3. Create two products:
   - **Chibi PRO** — $9.99/month recurring → copy the Price ID (`price_xxx`)
   - **Chibi STUDIO** — $24.99/month recurring → copy the Price ID (`price_yyy`)
4. In Vercel → **Settings → Environment Variables**, add:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (from Stripe → Developers → API keys)
   - `STRIPE_PRO_PRICE_ID` = `price_xxx`
   - `STRIPE_STUDIO_PRICE_ID` = `price_yyy`
5. Set up webhook:
   - Stripe → **Developers → Webhooks → Add endpoint**
   - URL: `https://your-app.vercel.app/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy the webhook signing secret
   - Add to Vercel: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
6. Redeploy in Vercel (push any commit or click "Redeploy")

---

## Your App is Live! 🎉

| What | URL |
|------|-----|
| **Main App** | `https://your-app.vercel.app` |
| **Landing Page** | `https://your-app.vercel.app/landing.html` |
| **Health Check** | `https://your-app.vercel.app/api/health` |
| **Supabase Dashboard** | `https://supabase.com/dashboard` |

---

## How the App Works for Your Users

```
User visits your app
  → Signs up with email (free, 5 generations/day)
  → Types a description or picks a chibi preset
  → Clicks "Generate"
  → Your server calls OpenAI with YOUR key
  → Beautiful chibi appears in ~10 seconds
  → User can download, save to gallery, share
  → When they hit their limit → prompted to upgrade
  → Upgrade → Stripe checkout → plan updated → more generations
```

**Your users never see or touch any API keys. It just works.**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "AI service not configured" | Check `OPENAI_API_KEY` is set in Vercel env vars |
| "Sign in to generate images" | User needs to register/login first |
| "Daily limit reached" | User hit their plan quota — they can upgrade |
| Images not saving to gallery | Check Supabase `SUPABASE_SERVICE_ROLE_KEY` is correct |
| Auth not working | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct |
| Vercel deploy fails | Check the Function Logs in Vercel dashboard |

---

## Cost Estimate (Monthly)

| Service | Free Tier | When You Pay |
|---------|-----------|-------------|
| Vercel | ✅ Free | 100GB bandwidth/month |
| Supabase | ✅ Free | 500MB database, 2GB storage |
| OpenAI | Pay per use | ~$0.04/image (DALL-E 3) |
| Stripe | ✅ Free | 2.9% + 30¢ per transaction |

**At 100 users generating 5 images/day = ~500 images/day = ~$20/day OpenAI cost.**
Set a spending limit! Start with $10/month and increase as you grow.

---

*Made with 💖 · Chibi Creator v4 · Need help? Open an issue on GitHub*
