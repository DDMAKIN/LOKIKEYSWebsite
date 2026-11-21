# Contributing to LOKI KEYS

Thanks for helping. This repository is the storefront for the LOKI KEYS online store. Changes go live to paying customers, so please keep them small, tested and easy to review.

## Before you start

- **Security issues:** don't open a public issue. Follow [SECURITY.md](SECURITY.md).
- **Bugs and ideas:** open an issue using a template, so we can agree on the fix before you write code.
- Read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Set up

```bash
pnpm install
pnpm dev          # local preview
pnpm typecheck
pnpm test         # storefront, sign-in, phone-server and ad-safety tests
pnpm build
```

Node 22 and pnpm 10 (see `.mise.toml`).

## Rules for changes

1. **One change per pull request**, branched from `main`, with a clear title.
2. **Tests stay green.** CI runs type-check, tests, build, `pnpm audit`, CodeQL and a secret scan on every pull request. Add a test when you change behaviour.
3. **Never commit secrets.** Use environment variables (see `.env.example`). Anything prefixed `VITE_` is visible in the browser.
4. **Keep it ad-safe.** No "genuine", "official", "instant", "cheapest", "hack" or unverified discount claims; keep the independent-reseller disclaimer and region/delivery details. The tests check this. See [ADS-READINESS-CHECKLIST.md](ADS-READINESS-CHECKLIST.md).
5. **Keep the design.** Follow the existing LOKI look (`src/cyberpunk.css`), keep text readable (12px+), respect the FX switch and reduced motion, and check phones.
6. **New scripts or API hosts** must be added to the Content Security Policy in both `vercel.json` and `public/_headers`.
7. **Prices and products** live in Wix; mirror any change in `src/catalog.ts`.

## Commit messages

Short summary line (under 72 characters), blank line, then what changed and why.

## Licence

This code is proprietary (see [LICENSE](LICENSE)). By contributing you agree that LOKI KEYS may use your contribution in the project.
