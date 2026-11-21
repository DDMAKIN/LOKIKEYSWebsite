# LOKI KEYS website

Storefront for LOKI KEYS: antivirus, VPN and Office licence keys. React 19 + Vite + Tailwind v4, built in Figma Make.
The bag hands off to the **LOKI KEYS Wix store** for payment, so checkout, orders, coupons and refunds are all managed in the Wix dashboard.

## How it fits together

| Piece | Where it lives |
|---|---|
| Storefront (this repo) | `src/App.tsx`, styles in `src/index.css` + `src/cyberpunk.css` |
| Catalogue | `src/catalog.ts`: one entry per Wix product plan (variant), with its Wix IDs, price and region |
| Business details (name, email, support hours) | `src/site.ts` |
| Checkout handoff | `src/wixCheckout.ts`: puts the bag in the shopper's Wix cart, applies the wheel code, opens Wix's hosted checkout |
| Customer accounts | `src/auth.ts` (Google, email sign-up/sign-in, email codes, password reset, sign out), `src/AuthPanel.tsx` (the sign-in and account screens), `src/wixSession.ts` (one Wix session per browser: shopper until sign-in, then member) |
| Phone sign-in (optional) | `src/phoneAuth.ts` (SMS code in the browser) + `api/phone-signin.ts` (server check that signs the member in to Wix) |
| Reward wheel codes | `LOKI05`–`LOKI20` exist as real Wix coupons (one use per customer) |
| Legal and help pages | `public/contact.html`, `privacy-policy.html`, `terms.html`, `refund-policy.html` (shared `legal.css`) |
| Search and social settings | `.figma/make/site.json` (title, description, indexing, social image) |
| Ads/security kit | `ADS-READINESS-CHECKLIST.md`, `SECURITY.md`, `public/robots.txt`, `public/sitemap.xml`, `public/_headers`, `vercel.json`, `.github/` |

Wix store: dashboard `https://manage.wix.com/dashboard/08e3d6d9-b449-4ad0-90b6-65a57df0c64d`

## Changing things

- **Price or stock:** change it in the Wix dashboard (that's what is charged), then update the same plan in `src/catalog.ts`.
- **New product:** create it in Wix, copy its product ID and variant ID into a new entry in `src/catalog.ts`.
- **Email or hours:** edit `src/site.ts` and the four pages in `public/`.
- **New domain:** add it to `public/robots.txt`, `public/sitemap.xml`, `.figma/make/site.json` (social image URL), `ALLOWED_ORIGINS`, and in Wix → Settings → Headless Settings → your client: add `https://yourdomain/` to **Allowed authorization redirect URIs** (sign-in) and `https://yourdomain` to **Allowed redirect domains** (checkout). Without these, sign-in and checkout can't return to the site.

## Customer accounts

Sign-in uses the Wix store's member system, so every customer appears under **Wix dashboard → Contacts / Site Members**, and orders they place while signed in are saved to their account.

- **Continue with Google** and **email + password** work as soon as the site is live. The sign-up form asks for first name, email, mobile number and password; the mobile number is saved on the customer's Wix contact.
- Already allowed in Wix as sign-in return addresses: `https://ditch-mess-23616146.figma.site/`, `http://localhost:5173/`, `http://localhost:4173/`.
- Wix blocks sign-up from some VPN and datacenter networks to stop spam accounts. Those visitors are told to switch off the VPN or use Google.

### Phone sign-in (one-time SMS code)

Wix doesn't offer phone-number login, so this uses Google Firebase to send and check the code, then `api/phone-signin.ts` signs the customer in to the same Wix account system. The "Continue with mobile number" button stays hidden until it's set up:

1. Create a Firebase project at console.firebase.google.com → **Authentication → Sign-in method → Phone → Enable**. SMS needs the pay-as-you-go **Blaze** plan; check Firebase's current SMS pricing for India. Under **Authentication → Settings → Authorized domains**, add your site's domain.
2. Firebase → Project settings → **Your apps → Web app**: copy `apiKey`, `authDomain`, `projectId`, `appId`.
3. Wix → Settings → **API Keys** → create a key with **Manage Members Authentication** (Members & Contacts) permission.
4. Deploy this repo on **Vercel** (Figma Make hosting can't run the server function) and add the variables from `.env.example` in Vercel → Settings → Environment Variables: the four `VITE_FIREBASE_*` values, plus `FIREBASE_PROJECT_ID`, `WIX_API_KEY`, `WIX_SITE_ID` and `ALLOWED_ORIGINS` (your site address).
5. Redeploy. The mobile-number button appears on the sign-in screen.

## Before running ads

Read `ADS-READINESS-CHECKLIST.md` first. In short: only authorised keys, fill in `legalName`, `address` and `phone` in `src/site.ts` (matching your Google and Meta business accounts), keep `deliveryTime` truthful, and add `VITE_GOOGLE_TAG_ID` / `VITE_META_PIXEL_ID` in Vercel's environment variables. The consent banner then appears by itself.

## Develop

```bash
pnpm install
pnpm dev            # local preview
pnpm build          # production build in dist/
pnpm typecheck
pnpm test           # storefront, sign-in and phone-server security tests
```

## Deploying

Figma Make's GitHub push is one-way: a push from Make overwrites files added on GitHub. Either keep editing in Make after importing these changes, or deploy this repo directly (Vercel/Netlify read `vercel.json` / `public/_headers` for the security headers).

## Security

See `SECURITY.md` for how sign-in is protected and which headers are set. Never commit secrets. The Wix client id in `src/site.ts` is public by design: it can only start shopper and member sessions through Wix's own checks. The Wix API key for phone sign-in is a secret and lives only in the server's environment variables.

## Community and licence

- [Contributing guide](CONTRIBUTING.md) · [Code of conduct](CODE_OF_CONDUCT.md) · [Support](SUPPORT.md) · [Security policy](SECURITY.md)
- Issues use templates (bug report, idea); order and security questions go to email, not public issues.
- **Licence:** proprietary, all rights reserved ([LICENSE](LICENSE)). The code is public for transparency and security review.
