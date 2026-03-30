# ✨ Chibi Creator — AI Chibi Character Generator

> **Production-ready React SPA** with pastel anime palette, full OpenAI integration, auth, gallery, billing, and a separate mobile-app landing page.

---

## 🗂️ Project Files

| File | Size | Description |
|------|------|-------------|
| `index.html` | ~2 KB | React 18 SPA entry point (Babel CDN) |
| `landing.html` | ~54 KB | Standalone mobile-app landing page |
| `js/app.js` | ~90 KB | Full React application (v4) |
| `js/landing.js` | ~10 KB | Landing page interactivity |
| `css/styles.css` | ~55 KB | SPA design system |
| `css/landing.css` | ~40 KB | Landing page styles |

---

## 🚀 Getting Started (Live Demo Mode)

Open `index.html` in any browser — **no server required**.

- Guests get **3 free** chibi generations per session (demo gradient previews)
- Create a free account for **5/day** + gallery saving
- Add your **OpenAI API key** via the **⚙️ Setup button** (top navbar) for real AI images

---

## 🔑 Connecting OpenAI

1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key (`sk-proj-…`)
3. Click the **⚙️ Setup** button in the top navbar (or **⚙️ Settings** in the user dropdown)
4. Paste your key → **Test Key** → **Save Settings**
5. Generate your first real chibi! 🎨

**Supported models:**
- `dall-e-3` — Best quality, ~$0.04/image (default)
- `dall-e-2` — Faster & cheaper, ~$0.02/image

The key is stored in `localStorage` and never sent anywhere except directly to `api.openai.com`.

---

## ✅ Completed Features

### 🎨 Creation Studio
- **Text-to-Chibi** — Natural language prompts up to 500 chars; `Ctrl+Enter` to generate
- **Photo-to-Chibi** — Upload JPG/PNG/WebP (PRO plan required), drag-and-drop or click
- **6 Profession Presets** — Doctor, Pastry Chef, Scientist, Pilot, Engineer, Marching Band
- **6 Art Styles** — Polished Anime, Soft Watercolor, Pixel Art, 3D Render, Sticker Style, Pastel Sketch
- **6 Magical Backgrounds** — Cherry Blossom, Soft Glow, Moonlit Night, Cloud Kingdom, Festival Lights, Fantasy Castle
- **Customization Sliders** — Softness (0–100%) and Sparkle & Glow (0–100%)
- **Real OpenAI generation** via DALL-E 3 / DALL-E 2 (returns base64 PNG directly — no CORS issues)
- **Demo mode** — gradient placeholder with canvas PNG export when no API key configured

### ⬇️ Export & Share
- **PNG Download** — Downloads real AI image or canvas-generated demo preview
- **HD Download** — Pro plan; downloads same image (4K quality flag sent to DALL-E 3)
- **🔗 Share** — Web Share API (mobile) with clipboard fallback
- **📋 Copy Link** — Copies image URL or page URL
- **📄 Metadata Export** — JSON file with prompt, style, settings

### 🖼️ Gallery
- **Masonry grid** — 12 sample items + user-saved real items
- **Filters** — All, 🔥 Trending (sort by likes), 🎨 My Chibis
- **Lightbox** — Click any card; `←`/`→` arrows to navigate; `Esc` to close
- **Lightbox Download** — One-click download for real images
- **Like toggle** — Optimistic update + DB persist for real items
- **Delete & Visibility toggle** — Owner-only; PUBLIC / PRIVATE 🌍🔒
- **DB-backed** — Loads from `gallery` table on mount; user items loaded on login

### 🔐 Auth
- **Register / Login** — Email + password (btoa hash) stored in `users` table
- **Session restore** — Re-validates against DB on page reload
- **Google / Discord** — "Coming soon" stubs
- **Password visibility toggle** — 👁️ / 🙈 button
- **Form validation** — Email regex, min 8-char password, confirm match, T&C checkbox

### ⚡ Quota System
- **Guests** — 3 generations/day via `sessionStorage` (resets at midnight)
- **FREE plan** — 5/day tracked in `quota_usage` table
- **PRO plan** — 100/day
- **STUDIO plan** — Unlimited
- **Quota bar** — Live counter with sign-in CTA for guests
- **Post-generation nudge** — Dismissible banner for guests after first creation

### ⚙️ Settings Modal
- Enter / test / clear OpenAI API key
- Switch between DALL-E 3 and DALL-E 2
- Key is previewed obfuscated (sk-proj-••••••)
- **Test Key** button validates against OpenAI `/v1/models` endpoint live

### 💎 Pricing & Billing
- Monthly / Annual toggle (20% discount)
- Free / Pro / Studio cards with feature comparison
- Demo upgrade: PATCH `users/{id}` to change plan (shows plan badge immediately)
- Real Stripe checkout via `POST /api/billing/checkout` (returns `url` redirect)
- Billing portal via `POST /api/billing/portal`

### 🏗️ Architecture Section
- 5-layer diagram: Frontend → API → AI Engine → Data → Billing
- Tech stack pill cloud (Next.js, React 18, TypeScript, Prisma, Redis, OpenAI, Stripe…)

### 🏠 Navbar
- Glassmorphism, scroll-aware shadow
- Auth-aware: shows user name, plan badge (click to go to Pricing), avatar dropdown
- **⚙️ Setup** indicator (green "AI Ready" when key set, grey "Setup" when not)
- Mobile hamburger menu with full nav + auth buttons

### 🌐 Landing Page (`landing.html`)
- Separate file — no React dependency
- Hero with phone mockup, store buttons, social proof
- Features grid, How It Works steps, community gallery, mobile app banner
- Pricing with monthly/annual toggle
- Testimonials, notification form
- Responsive, pastel palette, smooth animations via Intersection Observer

---

## 🔌 API Endpoints Reference

### Chibi Generation
```
POST /api/generate-chibi
Body: { prompt, profession, style, background, softness, sparkle, sourceImageUrl? }
Returns: { imageUrl }
```

### Auth
```
POST /api/auth/register   → { id, name, email, plan }
POST /api/auth/login      → { token, user }
GET  /api/auth/me         → { user }
```

### Billing
```
POST /api/billing/checkout   Body: { plan }   → { url } (Stripe session)
POST /api/billing/portal                       → { url } (Stripe portal)
```

### Table API (RESTful — already wired)
```
GET    tables/gallery?limit=50&sort=created_at
POST   tables/gallery          Body: { userId, title, imageUrl, ... }
PATCH  tables/gallery/{id}     Body: { likes, visibility }
DELETE tables/gallery/{id}

GET    tables/quota_usage?search={userId}&limit=100
POST   tables/quota_usage      Body: { userId, date, count }
PATCH  tables/quota_usage/{id} Body: { count }

GET    tables/users?search={email}&limit=100
POST   tables/users            Body: { name, email, passwordHash, plan }
PATCH  tables/users/{id}       Body: { plan }

POST   tables/generations      Body: { userId, prompt, style, ... }
PATCH  tables/generations/{id} Body: { outputImageUrl, status, downloads }
```

---

## 🗄️ Database Tables

### `users`
| Field | Type | Notes |
|-------|------|-------|
| id | text | UUID |
| name | text | Display name |
| email | text | Unique, lowercase |
| passwordHash | text | btoa(password) |
| plan | text | FREE / PRO / STUDIO |
| createdAt | number | Unix ms |

### `gallery`
| Field | Type | Notes |
|-------|------|-------|
| id | text | UUID |
| userId | text | FK → users.id |
| creatorName | text | Display name snapshot |
| title | text | e.g. "Doctor Chibi" |
| imageUrl | text | OpenAI CDN URL or "demo" |
| prompt | text | Original prompt |
| style | text | Art style name |
| background | text | Background name |
| visibility | text | PUBLIC / PRIVATE |
| likes | number | Like count |
| downloads | number | Download count |
| demoGradient | text | CSS gradient fallback |
| demoEmoji | text | Emoji fallback |
| createdAt | number | Unix ms |

### `generations`
| Field | Type | Notes |
|-------|------|-------|
| id | text | UUID |
| userId | text | FK or "anonymous" |
| prompt | text | Final prompt |
| profession | text | Preset or "general" |
| style | text | Art style |
| background | text | Background |
| softness | number | 0–100 |
| sparkle | number | 0–100 |
| sourceImageUrl | text | "[uploaded]" or "" |
| outputImageUrl | text | Result URL or "" |
| status | text | PENDING / SUCCEEDED / DEMO |
| downloads | number | Download count |
| createdAt | number | Unix ms |
| updatedAt | number | Unix ms |

### `quota_usage`
| Field | Type | Notes |
|-------|------|-------|
| id | text | UUID |
| userId | text | FK |
| date | text | "2025-03-27" |
| count | number | Generations today |

---

## 🔮 Pending / Next Steps

### To activate full backend
1. **OpenAI** — Add `sk-proj-…` key via ⚙️ Settings modal (client-side)
2. **Stripe** — Set `STRIPE_SECRET_KEY` + price IDs on your backend server
3. **Database** — Connect PostgreSQL (Supabase) with Prisma ORM
4. **Storage** — Cloudflare R2 or AWS S3 for image persistence
5. **GPU fallback** — Deploy Stable Diffusion XL on RunPod/Modal

### Features not yet implemented
- [ ] Real password hashing (upgrade from btoa → bcrypt server-side)
- [ ] JWT-based session tokens (replace localStorage user object)
- [ ] Google / Discord OAuth login
- [ ] Prompt Marketplace
- [ ] API access for Studio plan
- [ ] Custom style training pipeline
- [ ] Push notifications (mobile app)
- [ ] Real Stripe webhook for plan sync

---

## 🤖 AI Avatar Generator

The **My Avatar** tab lets you create a fully personalized chibi avatar in 4 guided steps.

### How to Use

1. **Click "My Avatar"** in the navigation bar (or scroll to the My Avatar section).
2. Complete the 4-step wizard:
   - **Step 1 — Character**: Choose gender, hair color & style, eye color
   - **Step 2 — Outfit / Role**: Pick a themed profession outfit
   - **Step 3 — Background & Mood**: Select the scene/environment
   - **Step 4 — Fine-tune**: Set art style, softness, and sparkle level
3. Click **✨ Generate My Avatar** — your chibi is created with DALL-E.
4. **Set as Profile Avatar** to save it to your profile.

### Profession / Style Options

| Outfit | Theme |
|--------|-------|
| 🎺 Marching Band | Navy & gold uniform, white feather cap, trumpet |
| 🍽️ Fine Dining | Dark red suit, white gloves, candles & wine |
| 👩‍⚕️ Doctor / Nurse | White coat, stethoscope, medical background |
| 👨‍🍳 Pastry Chef | White chef hat, piping bag, bakery background |
| ✈️ Pilot | White uniform, headset, cockpit background |
| 🌅 Romantic Dinner | Casual elegant, sunset background, wine |
| 🌸 Kimono / Traditional | Pink floral kimono, cherry blossom garden |
| 👗 Casual Fashion | Jeans, cozy sweater, warm bokeh background |
| 🔬 Scientist | Lab coat, microscope, laboratory |
| 👷 Engineer / Builder | Work clothes, laptop, blueprints |

### Prompt Engineering

The wizard uses `buildAvatarPrompt()` to construct optimized DALL-E prompts. Every generated prompt includes:
- "chibi anime" + "cute chibi proportions with large expressive eyes"
- Outfit vocabulary tuned to the selected role
- Background and mood descriptors
- Quality boosters: high quality, professional digital art, vivid colors, detailed illustration
- Style modifiers based on softness/sparkle sliders

---

## 🎨 Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--peach` | `#FFD6C0` | Primary background tint |
| `--pink` | `#FFB6C1` | Borders, highlights |
| `--blue` | `#87CEEB` | Secondary accents |
| `--gold` | `#FFD700` | CTA buttons, badges |
| `--gold-soft` | `#F0C674` | Gradient gold |
| `--gold-warm` | `#E8B84B` | Text accents |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Enter` | Generate chibi (when textarea focused) |
| `Escape` | Close lightbox / dismiss nudge banner |
| `←` / `→` | Navigate lightbox images |

---

*Made with 💖 and AI · Chibi Creator v4 · © 2025*
