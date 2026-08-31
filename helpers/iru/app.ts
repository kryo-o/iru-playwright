/**
 * Auth0's hosted-login host, overridable per environment.
 *
 * Read inside `getAppUrl` rather than at module scope: `playwright.config.ts`
 * imports this file, and an import evaluates before that file's body calls
 * `dotenv.config()`, so a module-level read would always miss the env file.
 */
const DEFAULT_IDENTITY_PROVIDER_HOST = 'auth.kandji.io';

/**
 * Returns the tenant origin, e.g. `https://<tenant>.kandji.io`.
 *
 * Consumed by `playwright.config.ts` as `baseURL`.
 *
 * Both guards reject the same mistake — copying the URL out of the address bar
 * mid-login — at different stages of cleanup: with the single-use `state` query
 * still attached, and with it stripped, which leaves the identity-provider host
 * behind still looking like a valid origin. Neither guard covers the other.
 *
 * @returns {string} The tenant origin.
 */
export function getAppUrl(): string {
    const raw = process.env.APP_URL;
    const identityProviderHost =
        process.env.IDENTITY_PROVIDER_HOST ?? DEFAULT_IDENTITY_PROVIDER_HOST;

    if (!raw) {
        throw new Error('APP_URL is not set. Add it to the env file.');
    }

    const url = new URL(raw);

    if (url.search || url.pathname !== '/') {
        throw new Error(
            `APP_URL must be the tenant origin (e.g. https://<tenant>.kandji.io), got "${raw}". ` +
                'A mid-login Auth0 URL carries a single-use "state" that expires.'
        );
    }

    if (url.hostname === identityProviderHost) {
        throw new Error(
            `APP_URL is "${raw}", which is Auth0's login host, not your tenant. ` +
                'Use the tenant origin the dashboard runs on, e.g. https://<tenant>.kandji.io — ' +
                `sign-in redirects through ${identityProviderHost}, so that is what the address bar shows mid-login.`
        );
    }

    return url.origin;
}
