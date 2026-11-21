# Security Policy

## Reporting a vulnerability

If you find a security issue on this website, please **do not open a public GitHub issue**.

Email: `support@lokikeys.com` (subject line: "Security")

Please include the page URL, what you found and how to reproduce it. We aim to reply within 3 working days.

## What this repo does to stay secure

- HTTPS only, with HSTS enabled (`vercel.json` / `public/_headers`)
- Security headers on every page: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- Every push and pull request is scanned for leaked secrets (`.github/workflows/secret-scan.yml`)
- Dependabot opens pull requests for vulnerable npm packages (`.github/dependabot.yml`)
- `.env` and key files are git-ignored (`.gitignore`)
- Payments never touch this site: checkout runs on Wix's hosted, PCI-compliant checkout. The only Wix value in the code is the public client id, which can mint anonymous shopper tokens and nothing else.

## Rules for contributors

1. Never commit API keys, tokens or passwords. Use your host's environment variables (Vercel/Netlify → Settings → Environment Variables).
2. If a secret is ever committed, **revoke it immediately** at the provider — deleting the commit is not enough, because it stays in git history.
3. Keep the landing page free of pop-ups, auto-downloads and third-party scripts you don't need.
