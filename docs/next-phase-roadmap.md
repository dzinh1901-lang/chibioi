# Next-Phase Roadmap — Chibi Creator v4

## 30-Day Sprint — Foundation & Security

**Goal**: Launch safely on GitHub Pages with critical security risks mitigated.

- ✅ Deploy to GitHub Pages via CI/CD
- ✅ Build server-side backend proxy for OpenAI API key (Supabase Edge Function + Vercel Functions)
- ✅ PWA manifest + service worker added
- ✅ Unit tests + Playwright E2E tests added
- ✅ robots.txt + sitemap.xml added
- ✅ Supabase Edge Function proxy scaffold created (`supabase/functions/generate-chibi/`)
- ✅ Vercel API routes scaffold created (`api/generate.js`, `api/health.js`, `api/billing/`)
- [ ] Replace `btoa(password)` with `bcrypt` (cost 12+) on the server
- [ ] Implement short-lived JWT sessions (access token + HTTP-only refresh cookie)
- [ ] Set spending limits on OpenAI account
- [ ] Add Sentry for JavaScript error monitoring
- [ ] Register custom domain and configure HTTPS

---

## 60-Day Sprint — Backend Integration

**Goal**: Replace demo stubs with real backend services.

- [ ] Connect Supabase database for users, galleries, quotas
- [ ] Implement Stripe webhook handler (`/api/billing/webhook`) for plan upgrades
- [ ] Add S3 / Cloudflare R2 image storage (download + store generated images permanently)
- [ ] Implement Google OAuth via Supabase Auth
- [ ] Implement Discord OAuth via Supabase Auth
- [ ] Enforce generation quotas server-side (not client-side localStorage)
- [ ] Add basic rate limiting on the backend proxy

---

## 90-Day Sprint — Growth & Polish

**Goal**: Production-quality product ready for marketing push.

- [ ] Prompt Marketplace — community-shared prompts
- [ ] API access for Studio plan users
- [ ] Mobile-responsive improvements
- [ ] Localization / i18n foundation
- [ ] Referral / sharing features (share avatar, share creation)
- [ ] A/B test pricing page
- [ ] Set up PostHog or Mixpanel for product analytics
- [ ] Performance audit — consider self-hosting React/Babel to reduce CDN dependency
- [ ] Accessibility audit — WCAG 2.1 AA compliance
