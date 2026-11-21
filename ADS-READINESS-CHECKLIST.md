# Ads Readiness Checklist — Security & Transparency

Run through this before launching **Google Ads** or **Meta (Instagram/Facebook) Ads** to this site.
Tick each box (`[x]`) in a commit so the repo history shows when the site became ad-ready.

Site URL: `https://ditch-mess-23616146.figma.site`
Promoting: `LOKI KEYS software licence keys`
Checked by / date: `________________________`

---

## 1. Security (landing page)

- [ ] Site loads on **HTTPS** with a valid certificate (no browser warning)
- [ ] `http://` redirects to `https://` automatically
- [x] `robots.txt` does **not** block `AdsBot-Google` or `Googlebot` (see `public/robots.txt`)
- [x] No password, login wall or geo-block on the landing page
- [ ] Page content is visible to crawlers (test: Google Search Console → URL Inspection → "View crawled page"; React/Figma Make sites must not render blank)
- [ ] No broken links, 404s or long redirect chains (test every button and the final ad URL)
- [ ] No pop-ups, auto-downloads, fake system warnings or hidden click areas
- [ ] The final URL in the ad is on the **same domain** as the display URL
- [x] Security headers are live (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) — see `vercel.json` / `public/_headers`. Test at https://securityheaders.com
- [x] No API keys, tokens or `.env` files in the repo (the `secret-scan` GitHub Action checks every push)
- [ ] Mobile page loads in under ~3 seconds (test at https://pagespeed.web.dev)

## 2. Transparency (website)

- [x] The business / brand name is clearly shown on the landing page
- [ ] Contact details are visible: email ✅ (footer + /contact.html), phone/WhatsApp ⬜, address ⬜
- [x] **Privacy Policy** page is live and linked in the footer (`public/privacy-policy.html`)
- [ ] Privacy Policy mentions the Meta Pixel / Google Tag if you install them
- [ ] Forms ask for consent before collecting personal data (India DPDP Act)
- [x] Terms of Service and Refund Policy pages exist **if you sell anything**
- [ ] What the ad promises (offer, price, product) matches what the landing page shows
- [ ] No unverifiable claims ("#1", "guaranteed", fake reviews or testimonials)

## 3. Transparency (ad accounts)

### Google Ads
- [ ] Advertiser verification completed (Admin → Policy → Account)
- [ ] Verified name matches the business name on the website
- [ ] Payment profile name is correct (it can show as "Ads funded by …")
- [ ] Checked how the brand looks in the Ads Transparency Center: https://adstransparency.google.com

### Meta Ads
- [ ] Business verified in Meta Business Manager
- [ ] Facebook Page and Instagram account linked to the ad account
- [ ] Page name matches the business name on the website
- [ ] Domain verified in Business Manager (Brand Safety → Domains)
- [ ] Meta Pixel installed only after the Privacy Policy is live

---

## Hosting notes

| Host | Security headers | HTTPS |
|---|---|---|
| **Vercel** | `vercel.json` in this repo applies them | Automatic |
| **Netlify / Cloudflare Pages** | `public/_headers` in this repo applies them | Automatic |
| **GitHub Pages** | ❌ Custom headers not supported — put Cloudflare in front, or host on Vercel/Netlify | Tick "Enforce HTTPS" in Settings → Pages |
| **Figma Sites hosting** | Managed by Figma, can't be changed | Automatic |

## Reference policies
- Google Ads destination requirements: https://support.google.com/adspolicy/answer/6368661
- Google advertiser verification: https://support.google.com/adspolicy/answer/9703665
- Meta Advertising Standards: https://transparency.meta.com/policies/ad-standards/
- Meta non-functional landing page policy: https://transparency.meta.com/policies/ad-standards/product-format-specific-policies/non-functional-landing-page/
