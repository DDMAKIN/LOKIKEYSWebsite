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
| Reward wheel codes | `LOKI05`–`LOKI20` exist as real Wix coupons (one use per customer) |
| Legal and help pages | `public/contact.html`, `privacy-policy.html`, `terms.html`, `refund-policy.html` (shared `legal.css`) |
| Search and social settings | `.figma/make/site.json` (title, description, indexing, social image) |
| Ads/security kit | `ADS-READINESS-CHECKLIST.md`, `SECURITY.md`, `public/robots.txt`, `public/sitemap.xml`, `public/_headers`, `vercel.json`, `.github/` |

Wix store: dashboard `https://manage.wix.com/dashboard/08e3d6d9-b449-4ad0-90b6-65a57df0c64d`

## Changing things

- **Price or stock:** change it in the Wix dashboard (that's what is charged), then update the same plan in `src/catalog.ts`.
- **New product:** create it in Wix, copy its product ID and variant ID into a new entry in `src/catalog.ts`.
- **Email or hours:** edit `src/site.ts` and the four pages in `public/`.
- **New domain:** add it to `public/robots.txt`, `public/sitemap.xml`, `.figma/make/site.json` (social image URL) and to the Wix OAuth app's allowed redirect domains, or checkout can't return to the site.

## Develop

```bash
pnpm install
pnpm dev            # local preview
pnpm build          # production build in dist/
node --test tests/storefront.test.cjs
```

## Deploying

Figma Make's GitHub push is one-way: a push from Make overwrites files added on GitHub. Either keep editing in Make after importing these changes, or deploy this repo directly (Vercel/Netlify read `vercel.json` / `public/_headers` for the security headers).

## Security

See `SECURITY.md`. Never commit secrets. The Wix client id in `src/site.ts` is public by design: it can only create anonymous shopper sessions.
