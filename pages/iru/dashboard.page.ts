import { expect, Locator, Page } from '@playwright/test';
import { SidebarComponent } from '../components/sidebar.component';

/**
 * The authenticated application shell and its primary sections.
 *
 * Section landing states differ — most render an `h2` naming the section, a few
 * render only tenant-dependent empty states — so assertions are kept structural
 * (shell, heading, breadcrumb, tabs) and never touch record data.
 */
export class DashboardPage {
    readonly sidebar: SidebarComponent;

    constructor(private readonly page: Page) {
        this.sidebar = new SidebarComponent(page);
    }

    // ==================== Locators ====================

    get content(): Locator {
        return this.page.getByRole('main');
    }

    pageHeading(name: string): Locator {
        return this.page.getByRole('heading', { name, level: 2 });
    }

    /** Blueprint cards on `/blueprints`; each wraps a level-3 heading. */
    get blueprintCards(): Locator {
        return this.page
            .getByRole('link')
            .filter({ has: this.page.getByRole('heading', { level: 3 }) });
    }

    get firstBlueprintCard(): Locator {
        // eslint-disable-next-line playwright/no-nth-methods -- the drill-down opens whichever blueprint sorts first; names are tenant data and must not be hardcoded
        return this.blueprintCards.first();
    }

    get breadcrumb(): Locator {
        return this.page.getByRole('navigation', { name: 'breadcrumb' });
    }

    get assignmentMapTab(): Locator {
        return this.page.getByRole('tab', { name: 'Assignment Map' });
    }

    /** Product-announcement modal; see `dismissAnnouncementWhenShown`. */
    get announcementDialog(): Locator {
        return this.page.getByRole('dialog');
    }

    get announcementDismissButton(): Locator {
        return this.announcementDialog.getByRole('button', { name: 'Got it!' });
    }

    /** Guard the application raises when leaving a view it considers dirty. */
    get unsavedViewDialog(): Locator {
        return this.page.getByRole('dialog', { name: 'Save your view?' });
    }

    get leaveWithoutSavingButton(): Locator {
        return this.unsavedViewDialog.getByRole('button', {
            name: 'Leave without saving',
        });
    }

    /** Confirmation the application raises before it signs the user out. */
    get signOutDialog(): Locator {
        return this.page.getByRole('dialog', { name: 'Log out' });
    }

    get signOutConfirmButton(): Locator {
        return this.signOutDialog.getByRole('button', { name: 'Log out' });
    }

    // ==================== Actions ====================

    /**
     * Opens the tenant origin (`baseURL`) with an already-authenticated session.
     *
     * The application redirects to its default landing section, so callers land
     * on Devices rather than a login form.
     *
     * @returns {Promise<void>} Resolves when the document has loaded.
     */
    async open(): Promise<void> {
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    /**
     * Arms auto-dismissal of the `Save your view?` navigation guard.
     *
     * The application raises it when leaving a view it considers dirty, which
     * it decides for itself — a section that navigated cleanly on one run can
     * be blocked on the next. Discarding is the read-only choice: `Leave
     * without saving` changes nothing on the tenant.
     *
     * @returns {Promise<void>} Resolves once the handler is registered.
     */
    async dismissUnsavedViewPromptWhenShown(): Promise<void> {
        await this.page.addLocatorHandler(
            this.leaveWithoutSavingButton,
            async (button) => {
                await button.click();
                await expect(button).toBeHidden();
            }
        );
    }

    /**
     * Signs the user out through the account menu.
     *
     * The `You will lose all unsaved work` confirmation only appears when the
     * current view holds unsaved state, so it cannot be clicked
     * unconditionally — from a freshly opened dashboard the menu item signs
     * out directly. A locator handler covers both paths without a visibility
     * check that would race the navigation.
     *
     * This invalidates the session server-side, not only in this browser
     * context, so the cached `storageState` is worthless afterwards. Only the
     * `signout` project may call it — see `tests/iru/smoke/signout.spec.ts`.
     *
     * @returns {Promise<void>} Resolves once sign-out has been requested.
     */
    async signOut(): Promise<void> {
        await this.page.addLocatorHandler(
            this.signOutConfirmButton,
            async (button) => {
                await button.click();
            }
        );

        await this.sidebar.openUserMenu();
        await this.sidebar.signOutMenuItem.click();
    }

    /**
     * Arms auto-dismissal of the product-announcement modal.
     *
     * Kandji injects these some seconds after load — the exact moment varies,
     * and the modal shows itself once more after being dismissed. While it is
     * open the application root carries `aria-hidden="true"`, so every
     * `getByRole` query outside the modal resolves to nothing and a test the
     * modal outlives fails on an element that is plainly on screen.
     *
     * A one-shot check after `open()` cannot catch that; Playwright runs this
     * handler before every action and every assertion retry instead.
     *
     * @returns {Promise<void>} Resolves once the handler is registered.
     */
    async dismissAnnouncementWhenShown(): Promise<void> {
        await this.page.addLocatorHandler(
            this.announcementDismissButton,
            async (button) => {
                await button.click();
                await expect(button).toBeHidden();
            }
        );
    }
}
