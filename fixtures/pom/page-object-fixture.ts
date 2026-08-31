import { test as base } from '@playwright/test';
import { blockProductGuides } from '../../helpers/iru/network';
import { DashboardPage } from '../../pages/iru/dashboard.page';
import { LoginPage } from '../../pages/iru/login.page';

/**
 * Page object fixtures. Add new page object types here as you create them.
 */
export type FrameworkFixtures = {
    /** Auth0 universal login: credentials form and MFA challenge. */
    loginPage: LoginPage;
    /** Authenticated application shell and its primary sections. */
    dashboardPage: DashboardPage;
};

/**
 * Extended test with page object fixtures.
 * Import `test` and `expect` from `fixtures/pom/test-options.ts` in specs.
 *
 * @example
 * ```ts
 * import { expect, test } from '../../../fixtures/pom/test-options';
 *
 * test('example', async ({ loginPage }) => {
 *   await loginPage.open();
 *   await expect(loginPage.heading).toBeVisible();
 * });
 * ```
 */
export const test = base.extend<FrameworkFixtures>({
    page: async ({ page }, use) => {
        await blockProductGuides(page);
        await use(page);
    },

    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    dashboardPage: async ({ page }, use) => {
        const dashboardPage = new DashboardPage(page);
        // both can surface at any point, on any section
        await dashboardPage.dismissAnnouncementWhenShown();
        await dashboardPage.dismissUnsavedViewPromptWhenShown();
        await use(dashboardPage);
    },
});
