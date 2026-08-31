# iru Playwright Smoke Suite

[![Smoke Tests](https://github.com/kryo-o/iru-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/kryo-o/iru-playwright/actions/workflows/playwright.yml)

Read-only smoke coverage of the iru (formerly Kandji) dashboard: Auth0 sign-in
with TOTP, the authenticated shell, every primary sidebar section, one
list → detail drill-down, and sign-out.

Playwright + TypeScript, page objects behind fixtures.

## Requirements

- Node >= 20
- An iru tenant login with a TOTP authenticator enrolled

## Setup

```bash
npm ci
npx playwright install chromium
npx playwright-cli install-browser chromium   # separate browser, for live-app exploration
```

Create `env/.env` (gitignored — never commit it):

| Variable       | Meaning                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`      | Tenant origin, e.g. `https://<tenant>.kandji.io`. **Not** an `auth.kandji.io/u/login?state=…` link — that `state` is single-use and expires. |
| `APP_EMAIL`    | Sign-in email                                                                                                                                |
| `APP_PASSWORD` | Sign-in password                                                                                                                             |
| `2FA_SECRET`   | Base32 TOTP seed from authenticator enrollment. 32 chars for Auth0; `A–Z` and `2–7` only.                                                    |

`ENVIRONMENT=staging` loads `env/.env.staging` instead.

## Running

```bash
npm test              # whole suite
npm run test:headed   # watch it drive the browser
npm run report        # open the last HTML report
npm run lint
npm run typecheck
```

## Docker

No local Node or browser install needed, only the env file.

```bash
npm run test:docker
```

`env/` is mounted read-only and excluded from the build context, so credentials
never reach an image layer. Reports land back on the host.

Leave ~90 seconds between a host run and a container run: they do not share the
TOTP step-gap file, so a quick rerun can submit a code Auth0 has already
consumed.

Windows needs Docker Desktop on the WSL2 backend in Linux containers mode.
Clone inside the WSL2 filesystem; bind mounts from a Windows drive are slow.

## Documentation

- `docs/smoke-suite.md` — what the suite covers, what it leaves out, where it is thin
- `CLAUDE.md` — the complete rulebook: conventions, constraints, how authentication works
- `.claude/skills/playwright-cli/` — reference docs for the exploration tool
