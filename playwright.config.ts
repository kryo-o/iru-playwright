import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { getAppUrl } from './helpers/iru/app';
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
        /*
         * Resolved once, here, so a missing or malformed APP_URL fails the run
         * immediately by name rather than inside every test's first navigation.
         * Page objects navigate with relative paths.
         */
        baseURL: getAppUrl(),

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
                viewport: { width: 1920, height: 1080 },
            },
        },

        {
            name: 'chromium',
            testIgnore: /.*\.setup\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                storageState: StorageStatePaths.IRU,
            },
            dependencies: ['setup'],
        },
    ],
});
