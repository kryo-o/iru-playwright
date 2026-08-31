import { Locator, Page } from '@playwright/test';
import { TestIds } from '../../enums/iru/iru';

/**
 * The persistent left-hand navigation rail of the authenticated application.
 *
 * Composed into `DashboardPage`; its presence is what "the user is logged in"
 * is asserted against.
 */
export class SidebarComponent {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get container(): Locator {
        return this.page.getByTestId(TestIds.SIDEBAR);
    }

    /** User chip at the foot of the rail; shows the signed-in name and email. */
    get userName(): Locator {
        return this.page.getByTestId(TestIds.SIDEBAR_USER_NAME);
    }

    link(name: string): Locator {
        return this.container.getByRole('link', { name, exact: true });
    }

    get userMenu(): Locator {
        return this.page.getByRole('menu');
    }

    /** Accessible name carries the account email; substring match avoids it. */
    get signOutMenuItem(): Locator {
        return this.userMenu.getByRole('menuitem', { name: 'Log out' });
    }

    // ==================== Actions ====================

    /**
     * Opens the account menu at the foot of the rail.
     *
     * The chip is a plain `div` with no role, so the click targets the user
     * name inside it and relies on the handler on the wrapper.
     *
     * @returns {Promise<void>} Resolves once the menu is on screen.
     */
    async openUserMenu(): Promise<void> {
        await this.userName.click();
    }

    /**
     * Opens a primary section by its sidebar link label.
     *
     * @param {string} name - Visible link label, e.g. `Devices`, `Blueprints`.
     * @returns {Promise<void>} Resolves once the link has been clicked.
     */
    async goTo(name: string): Promise<void> {
        await this.link(name).click();
    }
}
