import { expect, test } from '../../../fixtures/pom/test-options';
import { AppRoutes } from '../../../enums/iru/iru';
import {
    NAV_SECTIONS,
    NAV_SECTIONS_WITHOUT_HEADING,
} from '../../../test-data/static/iru/navigationSections';

/**
 * Read-only smoke coverage of the authenticated dashboard.
 *
 * These run on the session cached by `tests/iru/auth.setup.ts` rather than
 * signing in themselves — one MFA challenge per run, not one per test.
 *
 * Nothing here creates, edits or deletes anything, so no cleanup hooks are
 * needed and no test is `@destructive`. Assertions are structural only —
 * headings, breadcrumbs, tabs — never record values or counts, which are
 * tenant data and would make the suite fail on a data change.
 */
test.describe('iru dashboard', () => {
    test.beforeEach(async ({ dashboardPage }) => {
        await dashboardPage.open();
    });

    test(
        'should land on the devices view with the app shell rendered',
        { tag: '@smoke' },
        async ({ page, dashboardPage }) => {
            await test.step('THEN the signed-in user and navigation are present', async () => {
                await expect(dashboardPage.sidebar.container).toBeVisible();
                await expect(dashboardPage.sidebar.userName).toBeVisible();
                await expect(dashboardPage.content).toBeVisible();
            });

            await test.step('AND the default landing section is Devices', async () => {
                await expect(page).toHaveURL(new RegExp(AppRoutes.DEVICES));
                await expect(
                    dashboardPage.pageHeading('Devices')
                ).toBeVisible();
            });
        }
    );

    test(
        'should reach every primary section from the sidebar',
        { tag: '@smoke' },
        async ({ page, dashboardPage }) => {
            for (const { link, route, heading } of NAV_SECTIONS) {
                await test.step(`WHEN the user opens ${link} THEN its page renders`, async () => {
                    await dashboardPage.sidebar.goTo(link);
                    await expect(page).toHaveURL(new RegExp(route));
                    await expect(
                        dashboardPage.pageHeading(heading)
                    ).toBeVisible();
                });
            }

            for (const { link, route } of NAV_SECTIONS_WITHOUT_HEADING) {
                await test.step(`WHEN the user opens ${link} THEN the route loads inside the shell`, async () => {
                    await dashboardPage.sidebar.goTo(link);
                    await expect(page).toHaveURL(new RegExp(route));
                    await expect(dashboardPage.sidebar.container).toBeVisible();
                });
            }
        }
    );

    test(
        'should open a blueprint detail view from the blueprint list',
        { tag: '@smoke' },
        async ({ page, dashboardPage }) => {
            await test.step('GIVEN the user is on the blueprint list', async () => {
                await dashboardPage.sidebar.goTo('Blueprints');
                await expect(
                    dashboardPage.pageHeading('Blueprints')
                ).toBeVisible();
            });

            await test.step('WHEN the first blueprint is opened', async () => {
                await expect(dashboardPage.firstBlueprintCard).toBeVisible();
                await dashboardPage.firstBlueprintCard.click();
            });

            await test.step('THEN its detail view renders', async () => {
                await expect(page).toHaveURL(
                    /\/blueprints\/[0-9a-f-]{36}\/assignments/
                );
                await expect(dashboardPage.breadcrumb).toBeVisible();
                await expect(dashboardPage.assignmentMapTab).toBeVisible();
            });
        }
    );
});
