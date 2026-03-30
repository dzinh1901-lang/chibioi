# Next-Phase Roadmap — Chibi Creator v4

## 30-Day Sprint — Foundation & Security

**Goal**: Launch safely on GitHub Pages with critical security risks mitigated.

- [ ] Deploy to GitHub Pages via CI/CD (ready now)
- [ ] Build server-side backend proxy for OpenAI API key (Node.js/Vercel Functions or Supabase Edge Functions)
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
- [ ] Add Playwright E2E tests for critical user flows

---

## 90-Day Sprint — Growth & Polish

**Goal**: Production-quality product ready for marketing push.

- [ ] Prompt Marketplace — community-shared prompts
- [ ] API access for Studio plan users
- [ ] Mobile-responsive improvements and PWA manifest
- [ ] Localization / i18n foundation
- [ ] Referral / sharing features (share avatar, share creation)
- [ ] A/B test pricing page
- [ ] Set up PostHog or Mixpanel for product analytics
- [ ] Performance audit — consider self-hosting React/Babel to reduce CDN dependency
- [ ] Accessibility audit — WCAG 2.1 AA compliance
- [ ] Add automated tests: unit (prompt builders), integration (API proxy), E2E (Playwright)
