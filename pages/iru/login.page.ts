import { Locator, Page } from '@playwright/test';
import { ErrorElementIds } from '../../enums/iru/iru';

/**
 * Auth0 universal login, covering both steps of the sign-in flow:
 * the credentials form and the TOTP challenge that follows it.
 *
 * They are one page object because they are one continuous flow on one host
 * (`auth.kandji.io`), reached by navigating to the tenant URL.
 */
export class LoginPage {
    constructor(private readonly page: Page) {}

    // ==================== Locators: credentials step ====================

    get heading(): Locator {
        return this.page.getByRole('heading', {
            name: 'Welcome back',
            level: 1,
        });
    }

    get emailInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Email address' });
    }

    get passwordInput(): Locator {
        return this.page.getByRole('textbox', { name: 'Password' });
    }

    /** `exact` matters: "Continue with Google"/"…Microsoft" also start with it. */
    get continueButton(): Locator {
        return this.page.getByRole('button', { name: 'Continue', exact: true });
    }

    get forgotPasswordLink(): Locator {
        return this.page.getByRole('link', { name: 'Forgot password?' });
    }

    // ==================== Locators: MFA step ====================

    get otpHeading(): Locator {
        return this.page.getByRole('heading', {
            name: 'Verify Your Identity',
            level: 1,
        });
    }

    get otpInput(): Locator {
        return this.page.getByRole('textbox', {
            name: 'Enter your one-time code',
        });
    }

    /**
     * Left unchecked on purpose: ticking it suppresses MFA for 30 days, which
     * would stop the suite from exercising the challenge it is meant to cover.
     */
    get rememberDeviceCheckbox(): Locator {
        return this.page.getByRole('checkbox', {
            name: 'Remember this device for 30 days',
        });
    }

    // ==================== Locators: feedback ====================

    private errorElement(id: ErrorElementIds): Locator {
        // Matched by id, not by text. Auth0 mirrors each message into a visible
        // ARIA live region whose text is identical to the field error when only
        // one error is showing, so getByText resolves to two elements and trips
        // strict mode. See ErrorElementIds for the full explanation. These
        // elements are always in the DOM; assert visibility, not presence.
        // Auth0's validation text carries no role or accessible name, so the
        // element id is the only unambiguous hook available.
        return this.page.locator(`#${id}`);
    }

    get wrongCredentialsError(): Locator {
        return this.errorElement(ErrorElementIds.WRONG_CREDENTIALS);
    }

    get emailRequiredError(): Locator {
        return this.errorElement(ErrorElementIds.EMAIL_REQUIRED);
    }

    get passwordRequiredError(): Locator {
        return this.errorElement(ErrorElementIds.PASSWORD_REQUIRED);
    }

    // ==================== Actions ====================

    /**
     * Navigates to the tenant origin (`baseURL`), which redirects to Auth0
     * universal login.
     *
     * @returns {Promise<void>} Resolves when the document has loaded.
     */
    async open(): Promise<void> {
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    /**
     * Fills the credentials form and submits it.
     *
     * No response wait: empty or malformed input is rejected client-side with
     * no request sent, so callers assert the outcome with web-first assertions.
     *
     * @param {string} email - Email address to sign in with.
     * @param {string} password - Password to sign in with.
     * @returns {Promise<void>} Resolves once the form has been submitted.
     */
    async submitCredentials(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.continueButton.click();
    }

    /**
     * Fills the MFA challenge and submits it.
     *
     * @param {string} code - Six-digit one-time code.
     * @returns {Promise<void>} Resolves once the challenge has been submitted.
     */
    async submitOtp(code: string): Promise<void> {
        await this.otpInput.fill(code);
        await this.continueButton.click();
    }
}
