import { expect, test } from '../../fixtures/pom/test-options';
import { StorageStatePaths } from '../../enums/iru/iru';
import { loginToIru } from '../../helpers/iru/login';

/**
 * The one real sign-in per run: credentials plus a live TOTP code.
 *
 * Every other authenticated test reuses the session this writes, so this file
 * is both the authentication setup AND the test that proves sign-in works. It
 * is not an optimisation around the MFA flow — it is the only thing exercising
 * it, which is why the global teardown deletes the cached state afterwards.
 */
test.describe('auth setup', () => {
    test('should sign in with credentials and a one-time code', async ({
        loginPage,
        dashboardPage,
        context,
    }) => {
        await test.step('WHEN the user completes both authentication steps', async () => {
            await loginToIru(loginPage, dashboardPage);
        });

        await test.step('THEN the authenticated shell is rendered', async () => {
            await expect(dashboardPage.sidebar.container).toBeVisible();
            await expect(dashboardPage.sidebar.userName).toBeVisible();
        });

        await test.step('AND the session is cached for the remaining tests', async () => {
            await context.storageState({ path: StorageStatePaths.IRU });
        });
    });
});
