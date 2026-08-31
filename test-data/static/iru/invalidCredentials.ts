/**
 * Sign-in attempts that the login form rejects on the client, before any
 * request reaches Auth0.
 *
 * Only client-side cases belong here, and that is a hard constraint rather than
 * a stylistic one. Auth0 throttles failed sign-ins both per identifier and per
 * source IP, so every scenario that actually reaches it spends real
 * brute-force budget on every run. The single server-rejected case lives in
 * `login.spec.ts` and draws a fresh identifier from
 * `test-data/factories/iru/credentials.factory.ts` precisely so that no fixed
 * address accumulates failures across runs.
 *
 * Never add a scenario here whose credentials Auth0 would have to evaluate.
 *
 * `expectedErrors` are error KINDS, not message strings — the spec maps each
 * kind to its `Messages` locator. Static data files may export only literals,
 * so the enum cannot be imported here.
 *
 * Confirmed against the live Auth0 tenant.
 */
export const CLIENT_SIDE_VALIDATION_CASES = [
    {
        description: 'empty email and password',
        email: '',
        password: '',
        expectedErrors: ['email-required', 'password-required'],
    },
    {
        description: 'empty password with a well-formed email',
        email: 'someone@example.com',
        password: '',
        expectedErrors: ['password-required'],
    },
] as const;
