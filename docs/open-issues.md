# Open Issues — Chibi Creator v4

Last updated: 2026-03-30

---

## 🔴 CRITICAL

### Issue #1 — btoa() Password "Hashing"
- **Severity**: CRITICAL
- **Affected files**: `js/app.js` (login and register functions)
- **Problem**: Passwords are stored and compared using `btoa(password)`, which is Base64 *encoding*, not a cryptographic hash. Anyone with read access to the database can trivially decode every user's password.
- **Impact**: Full plaintext password exposure for all registered users.
- **Remediation**: Replace with server-side bcrypt (cost factor ≥ 12) or Argon2id. The comparison must happen on the server, not in the browser.
- **Status**: ⚠️ Warning comment added. Fix pending backend implementation.

---

### Issue #2 — OpenAI API Key Exposed in Browser
- **Severity**: CRITICAL
- **Affected files**: `js/app.js` (generateWithOpenAI, getApiKey, localStorage)
- **Problem**: The OpenAI API key is stored in `localStorage` and sent directly from the user's browser to `api.openai.com`. It is visible in browser DevTools, network inspector, and any browser extension.
- **Impact**: API key theft, unauthorized usage charges, account compromise.
- **Remediation**: Build a server-side proxy endpoint (e.g., `/api/generate`) that holds the key server-side and forwards sanitized requests to OpenAI. The browser should never see the key.
- **Status**: ⚠️ Warning comment added. Fix pending backend implementation.

---

## 🟠 HIGH

### Issue #3 — No Real JWT / Session Tokens
- **Severity**: HIGH
- **Affected files**: `js/app.js` (AuthProvider)
- **Problem**: User session is stored as a plain JSON object in `localStorage`. There is no token expiry, no refresh flow, and no server-side session validation.
- **Impact**: Session can be forged or persist indefinitely.
- **Remediation**: Implement server-side JWT (short-lived access token + refresh token in HTTP-only cookie).
- **Status**: Open — requires backend.

---

### Issue #4 — No Google / Discord OAuth Implemented
- **Severity**: HIGH
- **Affected files**: `js/app.js` (AuthModal social buttons)
- **Problem**: "Continue with Google" and "Continue with Discord" buttons show a toast saying "coming soon" — they are not implemented.
- **Impact**: Users expect social login to work; broken UX trust.
- **Remediation**: Implement OAuth flow via Supabase Auth or a custom OAuth provider.
- **Status**: Open.

---

## 🟡 MEDIUM

### Issue #5 — No Real Stripe Webhook Handler
- **Severity**: MEDIUM
- **Affected files**: `js/app.js` (PricingSection), `.env.example`
- **Problem**: Stripe checkout links and billing portal calls exist in the UI, but there is no server-side webhook to update user plan after payment.
- **Impact**: Users can pay but their plan won't upgrade.
- **Remediation**: Implement a `/api/billing/webhook` endpoint that verifies Stripe signatures and updates the user's plan in the database.
- **Status**: Open — requires backend.

---

### Issue #6 — No Image Persistence
- **Severity**: MEDIUM
- **Affected files**: `js/app.js` (gallery saving logic)
- **Problem**: Generated images are served from OpenAI's CDN with short-lived URLs. They expire and are lost.
- **Impact**: Gallery images disappear after expiry.
- **Remediation**: Download images immediately after generation and upload to S3/R2/Supabase Storage. Store the permanent URL.
- **Status**: Open — requires storage backend.

---

## 🟢 LOW

### Issue #7 — No Rate Limiting on Generations
- **Severity**: LOW
- **Affected files**: `js/app.js` (generateWithOpenAI)
- **Problem**: The free plan quota is tracked client-side only in `localStorage`. A user can bypass limits by clearing storage.
- **Impact**: Unlimited free generations; potential API cost abuse.
- **Remediation**: Enforce quotas server-side with per-user counters in the database.
- **Status**: Open — requires backend.

---

### Issue #8 — No Automated Tests
- **Severity**: LOW
- **Affected files**: All
- **Problem**: There are no unit tests, integration tests, or end-to-end tests.
- **Impact**: Regressions are caught only by manual QA.
- **Remediation**: Add Playwright E2E tests for critical flows (generation, auth, avatar wizard) and unit tests for prompt-building functions.
- **Status**: Open.
