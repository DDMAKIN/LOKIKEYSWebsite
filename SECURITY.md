# Security Policy

## Reporting a vulnerability

If you find a security issue on this website, please **do not open a public GitHub issue**.

Email: `support@lokikeys.com` (subject line: "Security")

Please include the page URL, what you found and how to reproduce it. We aim to reply within 3 working days.

## Customer accounts

Accounts are Wix store members, so passwords, Google sign-in and the member records live with Wix, not in this code.

| Sign-in route | How it is protected |
|---|---|
| **Continue with Google** | Wix runs the Google flow. We start it with OAuth 2.0 **PKCE** (S256) and a random `state`; the code comes back in the URL fragment, is checked against the stored `state`, swapped once for tokens and wiped from the address bar and history. |
| **Email + password** | Our form calls Wix's Register / Login APIs. Wix stores and checks the password. Wrong email and wrong password show the same message, and password reset always says "sent", so the forms can't be used to find out who has an account. 5 wrong tries lock the form for 30 seconds on that device; Wix also rate-limits and filters abusive networks. |
| **Mobile number (optional)** | Firebase sends the SMS code with invisible reCAPTCHA. `api/phone-signin.ts` only accepts a Firebase ID token after checking Google's signature, issuer, audience, that it is a *phone* sign-in, and that it is under 10 minutes old. It also checks the request comes from an allowed origin, caps body size and rate-limits per IP. The Wix API key it uses lives only in server environment variables. Each verified number maps to one member whose login email is a placeholder (`ph<number>@phone.lokikeys.com`) that can't be claimed with a password. |

Other rules the code follows:

- After sign-in, the only places the browser can be sent are same-site paths (`safeReturnPath`): no open redirects.
- Sign-in state (`loki-auth-pending`) is per tab, single-use and expires after 15 minutes.
- Session tokens are kept in `localStorage` so the cart and sign-in survive reloads. The Content Security Policy below blocks injected scripts that could read them. Signing out clears them here and ends the Wix session.
- Orders placed while signed in are attached to the member's account by Wix checkout.

## What this repo does to stay secure

- HTTPS only, with HSTS (`vercel.json` / `public/_headers`).
- **Content Security Policy**: scripts only from this site and Google reCAPTCHA; network calls only to this site, Wix's API and Google's sign-in services; no framing of the site (`frame-ancestors 'none'`); no plugins; forms only post to this site.
- Also on every page: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- **CI** (`.github/workflows/ci.yml`) on every push and pull request: type-check, 22 tests (including the sign-in and phone-server security checks), build, and `pnpm audit` for known vulnerabilities in shipped packages.
- **CodeQL** code scanning every push and weekly (`.github/workflows/codeql.yml`).
- Every push is scanned for leaked secrets (`.github/workflows/secret-scan.yml`).
- Dependabot opens pull requests for vulnerable npm packages and GitHub Actions (`.github/dependabot.yml`).
- `.env` and key files are git-ignored; `.env.example` lists every setting without values.
- Payments never touch this site: checkout runs on Wix's hosted, PCI-compliant checkout.

### Hosting note

Figma Make's own hosting (`*.figma.site`) does not let you set response headers, so the CSP and other headers only apply when the site is deployed on Vercel (or Netlify / Cloudflare Pages via `public/_headers`). Phone sign-in also needs Vercel, because it uses a server function.

## Rules for contributors

1. Never commit API keys, tokens or passwords. Use your host's environment variables. Anything with a `VITE_` prefix ends up in the browser, so only public values (like the Firebase web config) may use it.
2. If a secret is ever committed, **revoke it immediately** at the provider. Deleting the commit is not enough, because it stays in git history.
3. Keep the page free of pop-ups, auto-downloads and third-party scripts you don't need. Adding a new script or API host means adding it to the CSP in both `vercel.json` and `public/_headers`.
