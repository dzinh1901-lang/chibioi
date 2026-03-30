# Architecture — Chibi Creator v4

## Overview

Chibi Creator is a **fully static single-page application (SPA)** that requires no server to run in demo mode. All rendering, state management, and API calls happen in the user's browser.

---

## Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Markup | HTML5 | `index.html` (app), `landing.html` (marketing page) |
| Styling | CSS3 with custom properties | `css/styles.css`, `css/landing.css` |
| UI Framework | React 18 (production CDN) | Loaded from `unpkg.com` |
| JSX Transpilation | Babel Standalone | Transpiled in-browser at runtime |
| AI Image Generation | OpenAI DALL-E 2/3 | Called directly from the browser |
| Auth state | `localStorage` | Session persisted as JSON |
| API key storage | `localStorage` | User-supplied key, stored client-side |
| Database (optional) | REST Table API (Supabase-compatible) | Used for users, galleries, quotas |
| Billing (optional) | Stripe Checkout + Webhook | Not yet wired up server-side |
| Hosting | Any static file host | GitHub Pages, Vercel, Netlify, CDN |

---

## Application Structure

```
chibioi/
├── index.html          # Main SPA shell — loads React + Babel + app.js
├── landing.html        # Marketing landing page (static HTML)
├── 404.html            # Custom 404 error page
├── health.html         # Health check endpoint
├── js/
│   ├── app.js          # ~2400 lines: all React components, state, logic
│   └── landing.js      # Landing page interactive JS
├── css/
│   ├── styles.css      # App styles + design tokens
│   └── landing.css     # Landing page styles
├── docs/               # Documentation
├── .github/workflows/  # CI/CD
├── .gitignore
├── .env.example
├── DEPLOYMENT.md
└── README.md
```

---

## Data Flow

```
User browser
│
├─ index.html loads React 18 (unpkg CDN) + Babel Standalone
├─ Babel transpiles JSX in js/app.js at runtime
│
├─ App mounts → AuthProvider reads chibi_user from localStorage
├─ User enters OpenAI API key → stored in localStorage (chibi_openai_key)
│
├─ Generation request:
│   User selects profession/style/background
│   → buildChibiPrompt() constructs DALL-E prompt
│   → generateWithOpenAI() POSTs to api.openai.com/v1/images/generations
│   → Returns base64 image data-URL
│   → Rendered in browser, optionally saved to gallery table
│
├─ Avatar Wizard:
│   User completes 4-step wizard
│   → buildAvatarPrompt() constructs avatar-specific DALL-E prompt
│   → generateWithOpenAI() generates chibi avatar
│   → Avatar stored in localStorage (chibi_avatar)
│
└─ Gallery: reads from REST table API (mocked or Supabase)
```

---

## Security Architecture (Current State)

> ⚠️ **Demo-grade security only.** See `docs/open-issues.md` for production requirements.

| Concern | Current Implementation | Production Requirement |
|---|---|---|
| Authentication | btoa(password) stored in DB | Server-side bcrypt + JWT |
| API key | Stored in localStorage, sent from browser | Server-side proxy |
| Sessions | JSON in localStorage | HTTP-only JWT cookies |
| HTTPS | Provided by hosting platform | Required |

---

## CDN Dependencies

All external dependencies are loaded from CDNs (no npm install required):

```html
<!-- React 18 (production) -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Babel Standalone (JSX transpilation in browser) -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:...&display=swap">
```

---

## Design System

CSS custom properties defined in `:root` in `styles.css`:

- Color palette: `--peach`, `--pink`, `--blue`, `--gold`, `--gold-soft`, `--gold-warm`
- Typography: `--font-heading` (Plus Jakarta Sans), `--font-body` (Inter)
- Spacing/radius: `--radius-sm/md/lg/xl/pill`
- Transitions: `--transition`, `--transition-fast`, `--transition-slow`
- Backgrounds: `--bg-gradient`, `--section-alt`, `--section-pink`, `--section-blue`
