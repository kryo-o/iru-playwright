import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { StorageStatePaths } from './enums/iru/iru';

/**
 * Load environment variables.
 *
 * Defaults to `./env/.env`. Set ENVIRONMENT to target a per-environment file:
 *   ENVIRONMENT=staging npx playwright test   ->   ./env/.env.staging
 */
const environment = process.env.ENVIRONMENT;
const environmentPath = environment
    ? `./env/.env.${environment}`
    : './env/.env';

// quiet: dotenv v17+ prints promotional "injected env" banners by default
dotenv.config({ path: environmentPath, quiet: true });

/** Forced on every project so a section never renders its narrow layout. */
const VIEWPORT = { width: 1920, height: 1080 } as const;

/**
 * Browsers under test. Firefox and WebKit are opt-in: CROSS_BROWSER=1.
 *
 * They are left out of the list entirely rather than deselected with
 * `--project`, because `signout` depends on every browser project and
 * Playwright runs a selected project's dependencies automatically — asking for
 * chromium alone would drag firefox and webkit in behind it.
 *
 * All three share the one session `setup` writes: `storageState` is plain JSON,
 * not a browser artefact.
 */
const BROWSERS = [
    { name: 'chromium', device: devices['Desktop Chrome'] },
    ...(process.env.CROSS_BROWSER === '1'
        ? [
              { name: 'firefox', device: devices['Desktop Firefox'] },
              { name: 'webkit', device: devices['Desktop Safari'] },
          ]
        : []),
];

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests',

    /*
     * Safe to parallelise: only the `setup` project performs an MFA sign-in,
     * and it runs alone before everything else. The remaining tests either
     * reuse its cached session or run signed out, so no two workers can ever
     * race for a one-time code.
     */
    fullyParallel: true,

    /*
     * Unset means Playwright's default, half the cores. Override where memory
     * rather than CPU is the limit: docker-compose.yml pins it, because three
     * engines across four workers exhaust the Docker VM's RAM and the app then
     * mounts its notification banner late enough to shift the sidebar
     * mid-click, failing the stability check on an element that is on screen.
     * Fewer workers finished sooner there than four plus the retries.
     */
    workers: process.env.PLAYWRIGHT_WORKERS
        ? Number(process.env.PLAYWRIGHT_WORKERS)
        : undefined,

    /*
     * Deletes the cached session after the run, so the next one is forced
     * through a real sign-in. See helpers/iru/global-teardown.ts.
     */
    globalTeardown: './helpers/iru/global-teardown.ts',

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Reporter configuration */
    reporter: process.env.CI
        ? [['blob'], ['html', { open: 'never' }]]
        : [['html', { open: 'on-failure' }]],

    /* Shared settings for all projects */
    use: {
        /* Tenant origin; page objects navigate with relative paths. */
        baseURL: process.env.APP_URL,

        /* The application exposes test ids via data-testid attributes */
        testIdAttribute: 'data-testid',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',

        /* Action timeout */
        actionTimeout: 10000,

        /* Navigation timeout */
        navigationTimeout: 30000,
    },

    /*
     * Generous: the setup sign-in may wait out up to three TOTP steps before it
     * can mint a usable code, on top of the Auth0 round trips and dashboard load.
     */
    timeout: 180000,

    /* Expect timeout */
    expect: {
        timeout: 15000,
    },

    projects: [
        /* The single real sign-in; writes the session every other test reuses. */
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                viewport: VIEWPORT,
            },
        },

        ...BROWSERS.map(({ name, device }) => ({
            name,
            testIgnore: [/.*\.setup\.ts/, /signout\.spec\.ts/],
            use: {
                ...device,
                viewport: VIEWPORT,
                storageState: StorageStatePaths.IRU,
            },
            dependencies: ['setup'],
        })),

        /*
         * Sign-out runs alone, after everything else. It invalidates the
         * session server-side, so the cached storageState is dead once it has
         * run — inside a browser project it would strip the session from tests
         * still executing in parallel. `dependencies` is what orders it last,
         * and it names every browser project so that holds cross-browser too.
         *
         * Chromium only: the flow is application behaviour, not engine
         * behaviour, and the session it destroys is shared, so a second run of
         * it in another browser could only ever fail.
         *
         * retries: 0 because a retry would start from that dead session and
         * fail on the sign-in screen, burying the real failure.
         */
        {
            name: 'signout',
            testMatch: /signout\.spec\.ts/,
            retries: 0,
            use: {
                ...devices['Desktop Chrome'],
                viewport: VIEWPORT,
                storageState: StorageStatePaths.IRU,
            },
            dependencies: BROWSERS.map(({ name }) => name),
        },
    ],
});
