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
