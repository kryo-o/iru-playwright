import { expect, test, type Locator } from '../../../fixtures/pom/test-options';
import { Messages } from '../../../enums/iru/iru';
import { LoginPage } from '../../../pages/iru/login.page';
import { generateUnknownCredentials } from '../../../test-data/factories/iru/credentials.factory';
import { CLIENT_SIDE_VALIDATION_CASES } from '../../../test-data/static/iru/invalidCredentials';

/**
 * Maps an expected-error kind from the static data to the element that carries
 * it and the copy it must show. Both are asserted: the element is matched by
 * id, so checking the text as well is what stops a message change slipping
 * through as a still-visible but wrong error.
 */
const errorFor = (
    loginPage: LoginPage,
    kind: (typeof CLIENT_SIDE_VALIDATION_CASES)[number]['expectedErrors'][number]
): { locator: Locator; message: Messages } => {
    switch (kind) {
        case 'email-required':
            return {
                locator: loginPage.emailRequiredError,
                message: Messages.EMAIL_REQUIRED,
            };
        case 'password-required':
            return {
                locator: loginPage.passwordRequiredError,
                message: Messages.PASSWORD_REQUIRED,
            };
    }
};

/*
 * Signed out on purpose. The `chromium` project loads the cached session, but
 * these cases must meet an unauthenticated login form — with a session in place
 * the tenant URL redirects straight to the dashboard and none of them apply.
 *
 * The successful sign-in is not duplicated here: it lives in
 * `tests/iru/auth.setup.ts`, the run's single real MFA authentication.
 */
test.describe('iru login', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.open();
        await expect(loginPage.heading).toBeVisible();
    });

    test(
        'should render the login form',
        { tag: '@smoke' },
        async ({ loginPage }) => {
            await test.step('THEN the credentials form is presented', async () => {
                await expect(loginPage.emailInput).toBeVisible();
                await expect(loginPage.passwordInput).toBeVisible();
                await expect(loginPage.continueButton).toBeEnabled();
                await expect(loginPage.forgotPasswordLink).toBeVisible();
            });
        }
    );

    /*
     * The ONLY test that lets Auth0 evaluate credentials. It uses a freshly
     * generated identifier every run: Auth0 counts failures per identifier and
     * blocks one that accumulates them, so a hardcoded address goes permanently
     * red after enough runs. Do not add a second test like this without a
     * reason that outweighs the brute-force budget it spends.
     *
     * Chromium only, for the same reason: Auth0 also throttles by source IP, so
     * running it once per browser would spend that budget three times a run for
     * no extra signal — the rejection is Auth0's, not the engine's. The other
     * cases here are refused client-side and cost nothing, so they run
     * everywhere.
     */
    test(
        'should reject sign-in for an account that does not exist',
        { tag: '@smoke' },
        async ({ loginPage, dashboardPage, browserName }) => {
            test.skip(
                browserName !== 'chromium',
                'Auth0 throttles per identifier and per source IP; one rejected sign-in per run is the budget'
            );

            const { email, password } = generateUnknownCredentials();

            await test.step('WHEN credentials for an unknown account are submitted', async () => {
                await loginPage.submitCredentials(email, password);
            });

            await test.step('THEN the sign-in is refused and no session is created', async () => {
                await expect(loginPage.wrongCredentialsError).toBeVisible();
                await expect(loginPage.wrongCredentialsError).toHaveText(
                    Messages.WRONG_CREDENTIALS
                );
                await expect(dashboardPage.sidebar.container).toBeHidden();
            });
        }
    );

    for (const {
        description,
        email,
        password,
        expectedErrors,
    } of CLIENT_SIDE_VALIDATION_CASES) {
        test(
            `should reject sign-in - ${description}`,
            { tag: '@smoke' },
            async ({ loginPage, dashboardPage }) => {
                await test.step('WHEN incomplete credentials are submitted', async () => {
                    await loginPage.submitCredentials(email, password);
                });

                await test.step('THEN the expected field errors are shown and no session is created', async () => {
                    for (const kind of expectedErrors) {
                        const { locator, message } = errorFor(loginPage, kind);

                        await expect(locator).toBeVisible();
                        await expect(locator).toHaveText(message);
                    }

                    await expect(dashboardPage.sidebar.container).toBeHidden();
                });
            }
        );
    }
});
