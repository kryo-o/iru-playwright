import { expect, test } from '../../../fixtures/pom/test-options';

/**
 * Sign-out, deliberately isolated in its own project.
 *
 * Signing out invalidates the session on the server, not just in this browser
 * context: a fresh context loading the same cached `storageState` afterwards
 * never authenticates — it hangs on the application's loading state. Verified
 * against the live tenant before this test was written.
 *
 * So the `signout` project depends on `chromium` and starts only once every
 * other test has finished. Moving this file back in with the rest would let it
 * pull the session out from under tests still running in parallel.
 */
test.describe('iru sign-out', () => {
    test(
        'should sign out and return to the login form',
        { tag: '@smoke' },
        async ({ dashboardPage, loginPage }) => {
            await test.step('GIVEN the user is on the authenticated dashboard', async () => {
                await dashboardPage.open();
                await expect(dashboardPage.sidebar.container).toBeVisible();
            });

            await test.step('WHEN the user signs out and confirms the prompt', async () => {
                await dashboardPage.signOut();
            });

            await test.step('THEN the login form is shown and the shell is gone', async () => {
                await expect(loginPage.heading).toBeVisible();
                await expect(dashboardPage.sidebar.container).toBeHidden();
            });
        }
    );
});
