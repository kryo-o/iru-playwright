# iru Playwright Smoke Suite

Read-only smoke coverage of the iru (formerly Kandji) dashboard: Auth0 sign-in
with TOTP, the authenticated shell, every primary sidebar section, and one
list → detail drill-down.

Playwright + TypeScript, page objects behind fixtures, no cached session.

## Requirements

- Node >= 20
- An iru tenant login with a TOTP authenticator enrolled

## Setup

```bash
npm ci
npx playwright install chromium
```

Exploring the live application (required before writing any selector — see
`CLAUDE.md`) additionally needs the CLI's own browser, which is a separate
download from the one `@playwright/test` uses:

```bash
npx playwright-cli install-browser chromium
```

Create `env/.env` (gitignored — never commit it):

| Variable                 | Meaning                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`                | Tenant origin, e.g. `https://<tenant>.kandji.io`. **Not** an `auth.kandji.io/u/login?state=…` link — that `state` is single-use and expires. |
| `APP_EMAIL`              | Sign-in email                                                                                                                                |
| `APP_PASSWORD`           | Sign-in password                                                                                                                             |
| `2FA_SECRET`             | Base32 TOTP seed from authenticator enrollment. 32 chars for Auth0; `A–Z` and `2–7` only.                                                    |
| `IDENTITY_PROVIDER_HOST` | Optional. Host that sign-in redirects through, rejected as an `APP_URL`. Defaults to `auth.kandji.io`.                                       |

`ENVIRONMENT=staging` loads `env/.env.staging` instead.

## Running

```bash
npm test              # whole suite
npm run test:smoke    # @smoke only
npm run test:headed   # watch it drive the browser
npm run report        # open the last HTML report
```

Lint and types:

```bash
npm run lint
npm run typecheck
```

## How authentication works

`tests/iru/auth.setup.ts` signs in **once per run** — credentials, then a TOTP
code minted in-process by `helpers/iru/totp.ts` — and caches the session to
`.auth/iru/storageState.json`. Every other authenticated test reuses it. That
setup file is both the authentication step and the test proving sign-in works,
so there is no duplicate "can log in" test.

A global teardown deletes `.auth/` when the run ends, so the next run is forced
back through a real MFA sign-in. Without that, a stale session could satisfy a
later run whose setup was filtered out (`--grep`, `--no-deps`) and the MFA flow
would quietly stop being exercised while the suite still reported green.

Two constraints are worth knowing before you touch any of this:

**Auth0 rejects a one-time code it has already consumed**, and both its
clock-drift tolerance and its own clock widen that to the neighbouring
30-second steps. So the TOTP helper waits until three full steps have passed
before issuing another code, and records the last-issued step in a file under
the OS temp directory rather than in memory — Playwright starts a fresh worker
after a failure, and an in-memory counter would reset and turn one MFA
rejection into a cascade. Back-to-back runs therefore pause up to 90 seconds
inside setup; a single run from cold is immediate.

**Auth0 also throttles by source IP**, not just by account. Exactly one test
submits credentials Auth0 will reject; the rest are rejected client-side and
cost nothing. Enough consecutive failures from one address and the login form
starts answering `Your account has been blocked after multiple consecutive
login attempts` instead of the expected error, and unrelated tests begin
failing. Do not verify the login rejection tests with `--repeat-each` — it
multiplies that budget. To check stability, run the suite a few times in
sequence instead.

## What is asserted, and what deliberately is not

Assertions are structural — headings, breadcrumbs, tabs, the sidebar — never
record values, counts or dates. A tenant gaining or losing devices must not turn
the suite red.

Three sections assert only their route and the surrounding shell, because they
render no stable heading: **Detections** and **Enrollment** show onboarding
empty states that change once EDR or APNs is configured, and **Vulnerabilities**
shows a marketing page until the feature is licensed. See
`test-data/static/iru/navigationSections.ts`.

The blueprint drill-down opens whichever blueprint sorts first and asserts only
that a detail view rendered; it needs at least one blueprint to exist.

## Layout

```
enums/iru/               routes, UI message strings, test ids
fixtures/pom/            page-object fixtures; the only place specs import test/expect from
helpers/iru/             APP_URL validation, sign-in flow, TOTP, guide blocking
pages/iru/               login and dashboard page objects
pages/components/        sidebar component
test-data/factories/iru/ generated credentials (unique per run)
test-data/static/iru/    curated invalid credentials, navigation sections
tests/iru/auth.setup.ts  the run's single real MFA sign-in; caches the session
tests/iru/smoke/         login rendering and rejection; authenticated dashboard
```

Conventions the code follows are in `CLAUDE.md`, which is the complete rulebook. `.claude/skills/playwright-cli/` holds the reference docs for the browser tool that live-application exploration must use.

## Tags

One tag per test. Everything here is `@smoke`: the suite is the critical path
and nothing in it mutates state, so no test is `@destructive`.
