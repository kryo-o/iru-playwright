# Smoke suite: what we test, and why

## The job

One question: is the dashboard up and usable right now?

Not "is every feature correct". If this suite goes red, someone should be able
to assume something is genuinely broken and go looking.

Everything below follows from that.

## What we cover

Nine tests, one browser, about <60 seconds.

| Area          | Test                                        |
| ------------- | ------------------------------------------- |
| Sign-in       | real credentials + live TOTP, shell renders |
| Login form    | renders signed out                          |
| Login refused | unknown account, rejected by Auth0          |
| Login refused | two client-side validation cases            |
| Dashboard     | lands on Devices, shell present             |
| Dashboard     | all ten sidebar sections load               |
| Dashboard     | blueprint list opens a blueprint detail     |
| Sign-out      | signs out, returns to the login form        |

Auth gets the most attention because it is the one thing that takes the whole
product down when it breaks, and the one thing we cannot check by looking at a
page. Everything else is breadth: ten sections, one drill-down to prove
list-to-detail routing works at all.

## Rules we hold to

**Assert structure, never data.** Headings, breadcrumbs, tabs, the shell. Never
counts, names, dates or record values. The tenant is a live system and its data
changes on its own. A test that fails because someone enrolled a laptop is not
telling us anything.

**Change nothing.** Every test is read-only, so there is no cleanup to get
wrong and nothing to leave behind if a run dies halfway. The one place we click
a destructive-sounding button is `Leave without saving`, which discards a draft
view rather than saving one.

**One sign-in per run.** `auth.setup.ts` signs in for real, once, and caches the
session. Everything else reuses it. This is not a speed optimisation, it is a
budget: the MFA endpoint is a real service and Auth0 throttles.

**Nothing about the app is guessed.** Selectors, message strings and routes are
read off the running application before they are written down. When the sign-out
flow was added, the confirmation dialog it sometimes shows was found by driving
the real UI, not by assuming it existed.

## What we deliberately leave out

**Wrong password for a real account.** Auth0 counts failures per identifier and
locks the account. One locked account takes the entire suite down, so exactly
one test lets Auth0 evaluate credentials, and it uses a freshly generated
address every run.

**Anything that writes.** No creating blueprints, no editing devices. The moment
this suite mutates the tenant it needs cleanup, and cleanup that fails halfway
leaves a mess someone has to find.

**Copy on three sections.** Detections, Vulnerabilities and Enrollment render
onboarding or marketing states that change when the tenant is configured or
licensed. We assert the route and the shell and stop there.

## Where it is thin

Worth saying out loud, because green here does not mean healthy:

- Structural assertions pass on an empty page. A dead backend that still
  renders a shell and a heading looks fine to us.
- The three heading-less sections are close to a no-op. A stack trace inside a
  working shell would pass.
- Devices is the primary object in the product and its detail view is not
  covered. Blueprints is.
- No search, no filters, no cross-browser, one viewport.

None of these are accidents, but none of them are free either. If this suite
grows, unauthenticated redirect and a Devices drill-down are the next two.

## Two things that will bite you

**Modals.** The app raises dialogs on its own schedule: a product announcement,
and a `Save your view?` guard when it thinks a view is dirty. While one is open
the app root carries `aria-hidden="true"`, so every role query outside the modal
finds nothing and a test fails on an element that is plainly on screen. We block
the announcement at the network layer and dismiss both with locator handlers.
Never "fix" this with a visibility check, it races.

**Sign-out kills the shared session.** Not just its own browser context, the
cached session for everything. That is why it runs in its own project that
depends on `chromium`, so it starts only after every other test has finished.
Move it back in with the rest and it will pull the session out from under tests
still running.
