import { expect } from '@playwright/test';
import { DashboardPage } from '../../pages/iru/dashboard.page';
import { LoginPage } from '../../pages/iru/login.page';
import { generateTotpCode } from './totp';

/**
 * Signs in from a clean context: credentials, then the TOTP challenge.
 *
 * The suite deliberately keeps no cached storage state, so every test that
 * needs an authenticated session calls this. It returns only once the
 * application shell has rendered, so callers never race the post-login
 * redirect. The announcement modal is handled by the `dashboardPage` fixture.
 *
 * @param {LoginPage} loginPage - Login page object.
 * @param {DashboardPage} dashboardPage - Dashboard page object.
 * @returns {Promise<void>} Resolves when the authenticated shell is visible.
 */
export async function loginToIru(
    loginPage: LoginPage,
    dashboardPage: DashboardPage
): Promise<void> {
    await loginPage.open();
    await loginPage.submitCredentials(
        process.env.APP_EMAIL!,
        process.env.APP_PASSWORD!
    );

    await expect(loginPage.otpHeading).toBeVisible();
    await loginPage.submitOtp(await generateTotpCode());

    await expect(dashboardPage.sidebar.container).toBeVisible();
}
