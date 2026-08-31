import { randomUUID } from 'node:crypto';

/**
 * Builds credentials for an account that cannot exist.
 *
 * The address MUST be unique per call. Auth0 counts failed sign-ins per
 * identifier and does not meaningfully reset that counter between runs, so a
 * hardcoded unknown address accumulates one failure on every run until it is
 * permanently answered with "Your account has been blocked after multiple
 * consecutive login attempts" instead of the expected rejection. A fresh
 * identifier each time keeps every run at a single failure.
 *
 * `example.com` is reserved by RFC 2606, so these can never reach a real inbox.
 *
 * @returns {{ email: string; password: string }} Credentials Auth0 will reject.
 */
export const generateUnknownCredentials = (): {
    email: string;
    password: string;
} => ({
    email: `no-such-user-${randomUUID()}@example.com`,
    password: `Rejected-${randomUUID()}`,
});
