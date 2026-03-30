# Operations Runbook — Chibi Creator v4

## How to Deploy

### GitHub Pages (Primary)
1. Ensure the `main` branch is up-to-date.
2. The `.github/workflows/ci.yml` workflow auto-deploys on every push to `main`.
3. Monitor the **Actions** tab for deployment status.
4. Verify at `https://<owner>.github.io/<repo>/`.

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Or connect the GitHub repo via the Vercel dashboard for auto-deploys.

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```
Or drag-and-drop the folder to Netlify Drop.

---

## Local Development

No build step required. Open `index.html` directly in a browser, or use any local static server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code extension
# Use "Live Server" extension, right-click index.html → Open with Live Server
```

Then visit `http://localhost:8080`.

---

## Environment Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in real API keys.
3. For static hosting, no environment variables need to be set on the server.
4. For a backend proxy, configure variables in the hosting platform's dashboard.

---

## Monitoring Recommendations

Since this is a static SPA, monitoring focuses on:

| Concern | Tool |
|---|---|
| JavaScript errors | Sentry (add `<script src="https://browser.sentry-cdn.com/...">` + `Sentry.init()`) |
| Uptime | UptimeRobot or Better Uptime — monitor `health.html` |
| API usage | OpenAI dashboard — set usage limits and alerts |
| Billing | Stripe dashboard — set up email alerts for failed charges |
| CDN availability | Monitor unpkg.com uptime; consider self-hosting React/Babel for production |

---

## Common Issues and Troubleshooting

### "No images generated — API key error"
- Check the API key in the Settings modal.
- Verify the key at https://platform.openai.com/api-keys.
- Check OpenAI billing at https://platform.openai.com/account/billing.

### "Blank page / React not loading"
- Check browser console for errors.
- Verify `unpkg.com` is reachable.
- Confirm `index.html` loads `react.production.min.js` (not development).

### "Avatar not saving to profile"
- Check `localStorage.getItem('chibi_avatar')` in browser DevTools.
- Clear storage and retry if corrupted.

### "Login not working"
- The auth system uses a REST table API. Verify the `tables/` endpoint is reachable.
- In demo mode without a backend, auth operations will fail silently.

### "Styles broken / layout wrong"
- Hard-refresh with `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS).
- Check that `css/styles.css` loads without 404.

---

## Rollback Procedure

### GitHub Pages
```bash
git revert HEAD
git push origin main
```
The CI/CD pipeline will automatically redeploy the reverted version.

### Vercel
Go to the Vercel dashboard → Deployments → select a previous successful deployment → **Promote to Production**.

### Netlify
Go to Netlify dashboard → Deploys → select a previous deployment → **Publish deploy**.

---

## Backup Notes

- **Code**: Stored in GitHub — full history with `git log`.
- **User data**: Stored in the configured database (Supabase/PostgreSQL). Set up automated daily backups via Supabase dashboard or `pg_dump` cron.
- **Generated images**: Currently lost on OpenAI CDN expiry. Add S3/R2 storage to persist images (see `docs/open-issues.md` — Issue #6).
- **API keys**: Never committed to the repository. Stored in platform secrets and `localStorage` only.

---

## Health Check

Verify the app is up:
```bash
curl -s https://<your-domain>/health.html
# Expected: {"status":"ok","app":"chibioi","version":"4.0.0"}
```
