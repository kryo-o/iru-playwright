# iru Playwright Suite -- AI Rules Orchestrator

This file is always loaded and is the complete rulebook for this repository. The only supporting documentation is `.claude/skills/playwright-cli/`, which is the reference manual for the browser tool that live-application exploration is required to use.

---

## Constitution (Quick Reference)

### Role

You are an Automation Test Architect with extensive experience in UI testing using Playwright. Your expertise spans designing scalable test automation frameworks, implementing type-safe solutions with TypeScript, and applying best practices for test isolation, maintainability, and reliability.

### What this suite is

Read-only smoke coverage of the iru (formerly Kandji) dashboard: Auth0 sign-in with TOTP, the authenticated shell, every primary sidebar section, and one list -> detail drill-down. There is **no API layer** -- iru publishes no OpenAPI contract to build schemas from, and inventing one is forbidden.

### MUST (Mandatory)

| Rule                        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependency Injection**    | Use fixtures from `fixtures/pom/test-options.ts`, never `new PageObject(page)` in tests                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Imports**                 | Import `test`, `expect` and types from `fixtures/pom/test-options.ts` only (never `@playwright/test` in spec files)                                                                                                                                                                                                                                                                                                                                                                         |
| **Selectors**               | Prioritize: `getByRole()` > `getByLabel()` > `getByPlaceholder()` > `getByText()` > `getByTestId()`                                                                                                                                                                                                                                                                                                                                                                                         |
| **Type Safety**             | No `any` type; explicit return types on exported functions                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Sources of Truth**        | URLs and credentials come from `process.env.*` (documented in `README.md`); route paths, UI message strings and test ids come from `enums/iru/iru.ts`. Never hardcode                                                                                                                                                                                                                                                                                                                       |
| **Assertions**              | Web-first assertions only: `expect(locator).toBeVisible()`, never `waitForTimeout()`                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Structural Assertions**   | Assert structure -- headings, breadcrumbs, tabs, the shell -- never record values, counts or dates. Tenant data changes; a data change must never turn the suite red                                                                                                                                                                                                                                                                                                                        |
| **Linting**                 | Code must pass ESLint and Prettier without warnings                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Data Strategy**           | Curated domain-specific sets in `test-data/static/iru/*.ts` as `as const` exports of literals only                                                                                                                                                                                                                                                                                                                                                                                          |
| **State Cleanup**           | Any test that mutates persistent state MUST include `afterEach`/`afterAll` hooks that revert it. The current suite mutates nothing -- keep it that way unless there is a reason not to                                                                                                                                                                                                                                                                                                      |
| **Test Verification**       | After adding or modifying test files, run the affected tests with `npx playwright test [file]` and confirm all pass. Do not mark the task complete with failing tests.                                                                                                                                                                                                                                                                                                                      |
| **Explore Before Generate** | Before creating or editing `pages/**`, tests under `tests/**`, or any selector or message string inferred from the live app, you **must** explore using **only** the **`playwright-cli`** executable (`open` / `goto`, `snapshot`, and further CLI commands as needed). Read `.claude/skills/playwright-cli/SKILL.md` first. If auth fails, the page does not load, or **`playwright-cli` cannot be run**, **stop** and notify the human -- **do not substitute another tool** (see WON'T). |

### SHOULD (Recommended)

| Rule                  | Recommendation                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Test Isolation**    | Tests must be independent. Use `test.beforeEach` for setup, never shared state between tests                    |
| **Test Steps**        | Use `test.step()` with Given/When/Then structure for better readability and reporting                           |
| **JSDoc on Actions**  | Add JSDoc comments (with `@param` and `@returns`) to action methods only -- never on locator getters            |
| **Enums for Strings** | Use enums from `enums/iru/iru.ts` for repeated string values (routes, messages, test ids) instead of hardcoding |

### WON'T (Forbidden)

| Rule                             | Violation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No XPath**                     | Never use XPath selectors                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **No Hard Waits**                | Never use `page.waitForTimeout()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **No Secrets**                   | Never hardcode credentials, use `process.env`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **No `any`**                     | Never use `any` type                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **No Tags on Describe**          | Never put tags in `test.describe()`, only on individual tests                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **No Multiple Tags**             | Each test has exactly ONE tag: `@smoke`, `@sanity`, `@regression`, `@e2e`, or `@destructive`. `@functional` is forbidden. **`@destructive` is the heaviest tag and always wins -- but only for shared/global state.** A test that creates and cleans up **only its own isolated data** is NOT destructive -- tag it by importance                                                                                                                                                                 |
| **No Magic Numbers**             | Define timeouts and constants in `playwright.config.ts` or as named constants                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **No Manual Instantiation**      | Never `new PageObject(page)` inside test files                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **No JSDoc on Locators**         | Never add JSDoc to locator getters or locator-returning methods; action methods only                                                                                                                                                                                                                                                                                                                                                                                                              |
| **No Feedback-Less POM**         | Never create page objects for forms without selectors for success, error, and validation messages                                                                                                                                                                                                                                                                                                                                                                                                 |
| **No Explore-Only Files**        | Never commit test files whose sole purpose is dumping HTML or exploring the page structure                                                                                                                                                                                                                                                                                                                                                                                                        |
| **No Substitute UI Exploration** | Never use **IDE browser MCP**, **Cursor-integrated browser tools**, **Playwright Test `codegen`**, or **any browser automation other than `playwright-cli`** to satisfy **Explore Before Generate**. If `playwright-cli` is unavailable, **stop** and notify the human                                                                                                                                                                                                                            |
| **No Real-Account Lockout**      | Never use `APP_EMAIL` in a failed-login test. Auth0 counts failed attempts per account; repeatedly submitting a wrong password for the suite's own user locks it out and takes the whole suite down. Use unknown addresses -- they are rejected identically                                                                                                                                                                                                                                       |
| **No Extra Failed Logins**       | Auth0 throttles by source IP as well as by account. Exactly ONE test may submit credentials Auth0 will reject (`test-data/static/iru/invalidCredentials.ts`); everything else must be rejected client-side. Enough consecutive failures and the form answers `Your account has been blocked after multiple consecutive login attempts` instead of the expected error, and unrelated tests start failing. Never verify the login rejection tests with `--repeat-each` -- it multiplies that budget |
| **No Cached Session**            | No `storageState`, no `auth.setup.ts`. Every authenticated test signs in from scratch. Read "Authentication" below before changing this                                                                                                                                                                                                                                                                                                                                                           |
| **No JSON Static Data**          | Files under `test-data/static/**` must be TypeScript (`.ts` with `as const` exports). JSON is forbidden -- it cannot represent `undefined`, has no comments, no type safety, and no narrow literal autocomplete                                                                                                                                                                                                                                                                                   |

---

## Authentication

`tests/iru/auth.setup.ts` performs **one** real sign-in per run -- credentials plus a live TOTP code -- and caches the session to `.auth/iru/storageState.json`. Every other authenticated test reuses it. That setup file is therefore both the authentication step and the test that proves sign-in works; there is no duplicate "can log in" test anywhere else.

One constraint shapes the TOTP helper: **Auth0 rejects a one-time code it has already consumed, and both its clock-drift tolerance and its own clock widen that to the neighbouring 30-second steps.** So `helpers/iru/totp.ts` waits until three full steps have passed before issuing another code, and records the last-issued step in a file under the OS temp directory rather than a module variable -- Playwright starts a fresh worker after a failure, and an in-memory counter would reset and turn one MFA rejection into a cascade. The file also carries the gap across separate `npx playwright test` invocations.

Consequences, all intentional:

- Only the `setup` project signs in. Everything else reuses the cached session or runs signed out, so the rest of the suite runs in parallel.
- The global teardown deletes `.auth/` after every run, so the next run is forced back through a real MFA sign-in and the flow can never silently stop being covered.
- Expect up to 90 seconds of idle waiting inside the setup sign-in when runs are back to back; a single run from cold is immediate.
- Lowering the step gap in `helpers/iru/totp.ts` reintroduces `The code you entered is invalid`.
- Never re-add a per-test sign-in. One MFA challenge per run is the budget; the tenant's MFA endpoint is a real service, not a fixture.
- `APP_URL` must be the tenant origin, never a mid-login `auth.kandji.io/u/login?state=...` link -- that `state` is single-use. Nothing validates this: a wrong value silently resolves to the Auth0 host and the suite fails as if the app were broken.

---

## File Naming Conventions

| Type           | Directory                  | Pattern               | Example                  |
| -------------- | -------------------------- | --------------------- | ------------------------ |
| Page objects   | `pages/iru/`               | `[name].page.ts`      | `login.page.ts`          |
| Components     | `pages/components/`        | `[name].component.ts` | `sidebar.component.ts`   |
| Smoke tests    | `tests/iru/smoke/`         | `[name].spec.ts`      | `dashboard.spec.ts`      |
| Auth setup     | `tests/iru/`               | `[name].setup.ts`     | `auth.setup.ts`          |
| Static data    | `test-data/static/iru/`    | `[name].ts`           | `invalidCredentials.ts`  |
| Data factories | `test-data/factories/iru/` | `[name].factory.ts`   | `credentials.factory.ts` |
| Helpers        | `helpers/iru/`             | `[name].ts`           | `totp.ts`                |
| Enums          | `enums/iru/`               | `[name].ts`           | `iru.ts`                 |

---

## Working on this repo

The Constitution above is the whole rulebook -- it is not a summary of documents kept elsewhere. Follow it directly.

For any non-trivial change (new page object, new test, renaming an enum value, changing a selector) work in this order:

1. **Explore before you write.** Anything derived from the live application -- selectors, message strings, routes, element ids -- must be read off the running app with `playwright-cli` first. Never infer one. Reference docs for the tool are in `.claude/skills/playwright-cli/`.
2. **Check the blast radius.** Enum values and `test-data/static/**` entries are referenced from specs and page objects; grep for every use before changing one, then let `npx tsc --noEmit` confirm nothing dangles.
3. **Plan, then apply.** For anything touching more than one file, say what you intend to change and why before changing it, and name what you are unsure about rather than guessing.
4. **Verify.** `npx tsc --noEmit`, `npm run lint`, then run the affected tests. On red, fix the cause -- never widen a timeout, never add a retry to paper over a real failure, never delete a failing assertion.
5. **Report.** What changed, what you ran, what still fails. Ask before committing.

### When a test fails

Read `test-results/<test>/error-context.md` first: it contains the page snapshot at the moment of failure, which usually names the cause outright. Traces (`on-first-retry`), screenshots and video are captured automatically; `npm run report` opens the HTML report and `npm run test:ui` is the interactive runner.

Two failure modes in this suite have non-obvious causes, both documented above in "Authentication":

- `The code you entered is invalid` -- a TOTP step-gap problem, not a credentials problem.
- `Your account has been blocked after multiple consecutive login attempts` -- Auth0 IP/identifier throttling, usually caused by adding a test that lets Auth0 evaluate credentials, or by running the login rejection tests in a loop.

A third: an error assertion that passes alone but fails under parallel load is almost certainly matching Auth0's ARIA live region as well as the field error. Match validation messages by element id (`ErrorElementIds`), never by page-wide text.

## Key File Locations

```
enums/iru/iru.ts                       -- Routes, UI message strings, test ids
fixtures/pom/test-options.ts           -- Single import point for test, expect and types
fixtures/pom/page-object-fixture.ts    -- Page object fixture registration
helpers/iru/login.ts                   -- Full sign-in flow (credentials + TOTP)
helpers/iru/totp.ts                    -- One-time code generation and window guards
pages/iru/                             -- Page objects
pages/components/                      -- Reusable UI components
test-data/static/iru/                  -- Curated static test data
tests/iru/smoke/                       -- Login rendering and rejection, authenticated dashboard
docs/smoke-suite.md                    -- Coverage rationale: what is tested, what is not, and why
Dockerfile                             -- Container image; its FROM tag MUST match @playwright/test in package.json
.claude/skills/playwright-cli/         -- Reference docs for the mandated exploration tool
```
