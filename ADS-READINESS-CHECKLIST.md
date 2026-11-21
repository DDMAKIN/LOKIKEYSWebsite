# Ads Readiness Checklist (Google, Meta) for LOKI KEYS

Software key stores sit in Google's and Meta's highest-enforcement tier. Accounts get banned for
**Counterfeit**, **Misrepresentation** and **Trademark** reasons far more often than for anything
technical. Work through every box before the first campaign, for the US, Canada and every other
market. `[x]` = done in this repo. `[ ]` = needs you.

Site URL: `https://ditch-mess-23616146.figma.site` (replace when you move to your own domain)

---

## 0. Sourcing (decides everything else)

- [ ] Every key comes from the publisher or an **authorised distributor**, and you can show invoices or a reseller agreement for each product line (Norton/Gen Digital, McAfee, Microsoft, Malwarebytes, Bitdefender, Watchdog)
- [ ] No OEM, volume (MAK), academic, NFR or region-bypassed keys anywhere on the domain. One such product can get the whole domain and ad account suspended
- [ ] Only once both boxes above are ticked: you may describe keys as "genuine" or "authorized" (the site doesn't say this today)

## 1. Landing page: identity and honesty

- [x] Independent-reseller disclaimer naming the brands (footer, product details, checkout, contact, terms)
- [x] Business name LOKI KEYS shown clearly; no publisher name or logo used as our brand (LOKI-styled product art, plain-text brand names)
- [x] No unverifiable claims: removed "Genuine", "Real keys", "Instant", "Zero compromises", "Hack your price"
- [x] No strike-through "Save X%" badges on the site. Only add them back if each list price is the publisher's real current price
- [ ] In Wix, check the "compare at" prices (they show crossed out at checkout). Remove any that aren't the publisher's real list price
- [x] US spelling ("license") for US and Canadian audiences
- [ ] Registered business name, **full postal address and phone** added to `src/site.ts` (`legalName`, `address`, `phone`) and `public/contact.html`, **matching Google Merchant Center and Meta Business Manager exactly**

## 2. Landing page: product disclosures

- [x] Every product card shows its **activation region** and **email delivery**
- [x] Product details show devices, term, platforms, region, delivery time, where it's activated, and the refund route
- [x] Delivery promise stated consistently: "within 24 hours, usually much sooner" (`SITE.deliveryTime`). **Only keep this if you always meet it**
- [x] Prices in USD; checkout states that tax is shown before payment and there are no card fees
- [x] Refund policy with clear rules and timelines, no "all sales final" (`public/refund-policy.html`): unopened keys refunded within 14 days; faulty keys replaced or refunded with a reply within 48 hours

## 3. Privacy and consent (US states, Canada, India)

- [x] No tracking loads without consent; banner appears automatically once `VITE_GOOGLE_TAG_ID` / `VITE_META_PIXEL_ID` are set
- [x] Global Privacy Control honoured (required in California and Colorado)
- [x] "Your privacy choices" footer link to change consent
- [x] Privacy policy covers Google tag and Meta Pixel, US state rights, Canada (PIPEDA), India (DPDP) and international transfers
- [x] Fonts self-hosted: no third-party request before consent

## 4. Security and technical

- [x] HTTPS + HSTS, strict Content Security Policy, anti-framing, referrer/permissions/cross-origin policies (`vercel.json`, `public/_headers`)
- [x] `security.txt` and a public Security & Trust page (`/security.html`)
- [x] `robots.txt` allows AdsBot-Google, Googlebot and Facebook's crawler
- [x] No pop-ups, auto-downloads or fake warnings; the spin wheel opens only when clicked
- [x] No secrets in the repo; CI runs type-check, tests, build, `pnpm audit`, CodeQL and secret scanning; actions pinned to exact commits
- [ ] Site moved to **your own domain on Vercel** (Figma Make hosting can't send the security headers). Then re-test at https://securityheaders.com (target A+)
- [ ] Page content visible to Google: Search Console → URL Inspection → "View crawled page"
- [ ] Mobile speed checked at https://pagespeed.web.dev

## 5. Ad accounts

### Google Ads and Merchant Center
- [ ] Advertiser verification completed; verified name = legal name on the site
- [ ] Merchant Center business info (name, address, phone, email) = the site, exactly
- [ ] Shipping set as digital/free and returns policy URL = `/refund-policy.html`
- [ ] Subscriptions advertised in Shopping are 12-month prepaid, with "subscription" and the term in the title
- [ ] Feed images: plain product art with no "% OFF", "CHEAP" or watermark badges

### Meta
- [ ] Business verified; domain verified (Brand Safety → Domains)
- [ ] Page name = LOKI KEYS
- [ ] Advantage+ creative auto-edits (text generation, image enhancements) **turned off**
- [ ] Watch the Page feedback score; answer support emails fast, since slow delivery or refunds drop it

## 6. Ad copy rules (keep next to whoever writes ads)

- Lead with **LOKI KEYS**, not publisher names. Keep Microsoft, Norton and other trademarks **out of headlines** unless you hold written reseller authorisation; bid on intent terms ("antivirus license key", "VPN subscription deal")
- Never: "90% off", "lifetime key for $5", "cheapest", "hack", "crack", "official Microsoft store"
- Do: curated deals, email delivery, clear regions, activation help, refund policy
- Don't use publisher logos, box art or trailers in creatives without distributor rights; use LOKI art or screen recordings of the store
- Checkout is on Wix: set up purchase conversions in Wix (Marketing Integrations → Google Ads / Facebook Pixel) with the **same IDs** so ads see sales

## 7. Payments and fraud

- [ ] Payment provider has approved **digital license key** sales in writing (some freeze key stores under high-risk rules)
- [ ] 3-D Secure / AVS / CVV checks on in Wix Payments; watch chargebacks (keep under 0.75%)
- [ ] Keep order, IP and delivery records for chargeback evidence (Wix keeps order logs)

## 8. Lower-risk growth channels to run alongside ads

- Deal sites and price aggregators that accept authorised resellers
- Creator codes on YouTube, Instagram and Twitch (5–10% off, tracked per creator)
- Email list and a Discord or WhatsApp community for drops
