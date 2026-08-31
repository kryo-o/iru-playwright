import { Page } from '@playwright/test';

/**
 * The in-app product guides are served by Pendo, loaded from this host.
 *
 */
const PENDO_URL_PATTERN = '**/*pendo.io/**';

/**
 * Stops the Pendo agent from loading, so its guides never render.
 *
 * A Pendo guide is what the `Got it!` announcement modal is. While one is open
 * the application root carries `aria-hidden="true"` and every `getByRole`
 * query outside the modal resolves to nothing, so a guide that appears
 * mid-test fails it on an element that is plainly on screen.
 *
 * Blocking removes the race rather than reacting to it: the modal cannot
 * appear at all, so there is no window in which the shell is unreachable.
 * Pendo is third-party instrumentation, not application behaviour, so nothing
 * under test is lost. The standard Pendo install snippet stubs `window.pendo`
 * before requesting the agent, so the application's own calls stay safe.
 *
 * `DashboardPage.dismissAnnouncementWhenShown` stays as the backstop for a
 * modal this does not cover — a new vendor, or one the application ships
 * itself.
 *
 * @param {Page} page - Page to install the route on, before it navigates.
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function blockProductGuides(page: Page): Promise<void> {
    await page.route(PENDO_URL_PATTERN, async (route) => {
        try {
            await route.abort();
        } catch {
            // the page navigated away mid-request; nothing left to abort
        }
    });
}
