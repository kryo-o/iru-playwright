/**
 * Application constants for the iru (Kandji) dashboard.
 *
 * Every value here was read off the live application during exploration —
 * none is inferred. Re-verify with `playwright-cli` before changing one.
 */

/** UI strings asserted by tests. Auth0 renders the login messages. */
export enum Messages {
    WRONG_CREDENTIALS = 'Wrong email or password',
    EMAIL_REQUIRED = 'Please enter an email address',
    PASSWORD_REQUIRED = 'Password is required',
}

/**
 * Element ids of Auth0's validation messages.
 *
 * These are matched by id rather than by text, and that is load-bearing.
 * Auth0 mirrors every message into an ARIA live region (`#ulp-error-announcer`)
 * which is itself visible. When a single error is showing, the announcer's text
 * is IDENTICAL to the field error's, so a page-wide `getByText(exact)` resolves
 * to two elements and fails Playwright's strict mode. The announcer is filled
 * by script a moment after validation, so that failure is intermittent — it
 * depends on whether the assertion resolves before or after the fill.
 *
 * All four elements are always present in the DOM; visibility is the signal.
 */
export enum ErrorElementIds {
    EMAIL_REQUIRED = 'error-cs-username-required',
    PASSWORD_REQUIRED = 'error-cs-password-required',
    WRONG_CREDENTIALS = 'error-element-password',
}

/** Primary route paths, relative to the tenant base URL. */
export enum AppRoutes {
    DEVICES = '/devices',
    BLUEPRINTS = '/blueprints',
    LIBRARY = '/library',
    USERS = '/users',
    DETECTIONS = '/detections',
    VULNERABILITIES = '/vulnerabilities',
    ALERTS = '/alerts/active',
    ACTIVITY = '/activity',
    ENROLLMENT = '/add-devices',
    RESOURCES = '/resources',
}

/**
 * `data-testid` values. Used only where the element exposes no usable role or
 * accessible name — the sidebar shell and the user chip are plain `div`s.
 */
export enum TestIds {
    SIDEBAR = 'sidebar',
    SIDEBAR_USER_NAME = 'sidebar-user-name',
}

/**
 * Where the authenticated session is cached.
 *
 * Written once per run by `tests/iru/auth.setup.ts` and deleted again by the
 * global teardown, so every run performs one real MFA sign-in.
 */
export enum StorageStatePaths {
    IRU = '.auth/iru/storageState.json',
}

/** Root of the cached-session directory, removed wholesale by the teardown. */
export enum AuthStateDirectory {
    ROOT = '.auth',
}
