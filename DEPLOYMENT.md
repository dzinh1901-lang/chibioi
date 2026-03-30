# Deployment Guide — Chibi Creator v4

## Overview

Chibi Creator is a fully static single-page application (SPA). No server-side runtime is required for demo mode. Any static host (GitHub Pages, Vercel, Netlify, bare CDN) can serve it.

---

## Option 1 — GitHub Pages (Recommended, Free)

### Prerequisites
- Repository is public, or you have a GitHub Pro/Team plan for private repos.

### Steps
1. Go to **Settings → Pages** in your GitHub repository.
2. Under **Source**, select **GitHub Actions**.
3. The included `.github/workflows/ci.yml` automatically deploys `main` to Pages on every push.
4. After the first deployment, your site is live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

### Manual deployment (without CI)
1. Go to **Settings → Pages → Source → Deploy from a branch**.
2. Select `main` branch, `/ (root)` folder.
3. Click **Save** — GitHub will publish within a minute.

---

## Option 2 — Vercel (with API Routes)

### Static deploy (no backend)
1. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. From the repository root: `vercel --prod`
3. Follow the prompts (Framework: Other, Output: `.`)
4. Or connect your GitHub repo via the [Vercel dashboard](https://vercel.com/dashboard) for automatic deploys on push.

### With backend API routes (recommended for production)
The `api/` directory contains Vercel serverless functions that act as a secure server-side proxy:

1. Deploy to Vercel as above.
2. Set the following environment variables in your Vercel project settings:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Server-side OpenAI key — never sent to browser |
| `STRIPE_SECRET_KEY` | Stripe billing |
| `STRIPE_PRO_PRICE_ID` | Pro plan price ID |
| `STRIPE_STUDIO_PRICE_ID` | Studio plan price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL |
| `ALLOWED_ORIGIN` | Restrict CORS to your domain (optional) |

3. The API endpoints will be available at:
   - `POST /api/generate` — OpenAI image generation proxy
   - `GET /api/health` — Health check
   - `POST /api/billing/checkout` — Stripe checkout session
   - `POST /api/billing/webhook` — Stripe webhook handler

---

## Option 3 — Supabase Edge Functions (alternative backend)

The `supabase/functions/generate-chibi/` directory contains a Deno-based Edge Function for secure OpenAI proxying:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli): `npm i -g supabase`
2. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Deploy the function:
   ```
   supabase functions deploy generate-chibi --project-ref YOUR_PROJECT_REF
   ```
4. Set the OpenAI API key as a secret:
   ```
   supabase secrets set OPENAI_API_KEY=sk-proj-your-key --project-ref YOUR_PROJECT_REF
   ```
5. The endpoint will be available at:
   ```
   POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-chibi
   ```

---

## Option 4 — Netlify

1. Install [Netlify CLI](https://docs.netlify.com/cli/get-started/): `npm i -g netlify-cli`
2. Run: `netlify deploy --prod --dir .`
3. Or drag-and-drop the repository folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

### Netlify config (`netlify.toml`, optional)
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

---

## Option 5 — Custom Domain / Bare Hosting

1. Copy all repository files to your web server's document root.
2. Configure your web server to serve `index.html` for the root path.
3. Add a custom 404 page pointing to `404.html`.

---

## Environment Variables

For **static demo mode** (no backend), no environment variables are needed. The OpenAI API key is entered by the user at runtime and stored in their browser's `localStorage`.

For a **production deployment with a backend proxy**:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Server-side OpenAI key (never expose to client) |
| `STRIPE_SECRET_KEY` | Stripe billing |
| `STRIPE_PRO_PRICE_ID` | Pro plan price ID |
| `STRIPE_STUDIO_PRICE_ID` | Studio plan price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature |
| `DATABASE_URL` | PostgreSQL / Supabase connection string |
| `NEXT_PUBLIC_APP_URL` | Public URL of deployed app |

See `.env.example` for a complete template.

---

## Post-Deployment Checklist

- [ ] App loads at the deployment URL
- [ ] React loads without console errors (production builds, not development)
- [ ] `health.html` returns `{"status":"ok",...}`
- [ ] `404.html` shows for unknown paths
- [ ] Open Graph image appears when sharing on social media
- [ ] Settings modal allows entering an OpenAI API key
- [ ] Chibi generation works end-to-end with a valid key
- [ ] My Avatar wizard navigates all 4 steps and generates an image
- [ ] Gallery loads with placeholder data
- [ ] Pricing section displays correctly
- [ ] No hardcoded API keys present in deployed files

---

## Rollback

- **GitHub Pages**: Revert the commit via `git revert` and push to `main`.
- **Vercel**: Use the Vercel dashboard to instantly roll back to a previous deployment.
- **Netlify**: Use the Netlify dashboard → Deploys → select a previous deploy → **Publish deploy**.

---

## PWA Installation (End Users)

Chibi Creator ships with a Progressive Web App manifest and service worker, enabling installation on mobile and desktop.

### Mobile (iOS / Android)
1. Open the app URL in Safari (iOS) or Chrome (Android).
2. Tap the **Share** button (iOS) or the **three-dot menu** (Android).
3. Select **Add to Home Screen**.
4. The app will install and launch in standalone mode (no browser chrome).

### Desktop (Chrome / Edge)
1. Open the app URL in Chrome or Edge.
2. Look for the **install icon** (⊕) in the address bar.
3. Click it and confirm **Install**.
4. The app opens as a standalone window.

### Offline support
The service worker (`sw.js`) caches static assets so the app shell loads even without a network connection. API calls (image generation) still require internet access.
