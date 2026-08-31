import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Secret, TOTP } from 'otpauth';

/** TOTP step length in seconds — the RFC 6238 default, which Auth0 uses. */
const PERIOD_SECONDS = 30;

/** Never mint a code with less than this much of its window left. */
const MIN_REMAINING_SECONDS = 5;

/**
 * How many steps must pass between two codes.
 *
 * Three, and each one is load-bearing:
 *
 * - Auth0 will not accept a code it has already consumed (+1).
 * - It accepts the neighbouring step to tolerate clock drift, so the step
 *   either side of a consumed one counts as consumed too (+2).
 * - Which step Auth0 *attributes* a code to depends on its clock, not ours.
 *   A sub-second skew near a boundary makes it record our step N as N+1, which
 *   then makes our "fresh" N+2 adjacent to its record and rejected (+3).
 *
 * A gap of 2 passes most runs and fails intermittently on that last case —
 * observed as `The code you entered is invalid` on a repeat run.
 */
const MIN_WINDOW_GAP = 3;

/**
 * Where the last-issued step is recorded.
 *
 * Deliberately a file, not a module variable. Playwright starts a fresh worker
 * process after a test failure, which would reset an in-memory counter to -1
 * and let the very next login mint a code adjacent to the one just consumed —
 * turning a single failure into a cascade of MFA rejections. The file also
 * carries the gap across separate `npx playwright test` invocations, which need
 * it just as much.
 */
const STATE_FILE = join(tmpdir(), 'iru-playwright-totp-window');

const currentWindow = (): number =>
    Math.floor(Date.now() / 1000 / PERIOD_SECONDS);

const secondsLeftInWindow = (): number =>
    PERIOD_SECONDS - (Math.floor(Date.now() / 1000) % PERIOD_SECONDS);

const awaitNextWindow = async (): Promise<void> => {
    const delayMs = secondsLeftInWindow() * 1000 + 500;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
};

const readLastIssuedWindow = (): number => {
    try {
        const parsed = Number.parseInt(readFileSync(STATE_FILE, 'utf8'), 10);
        return Number.isFinite(parsed) ? parsed : -1;
    } catch {
        // No previous run on this machine, or the temp file was cleaned up.
        return -1;
    }
};

const writeLastIssuedWindow = (windowIndex: number): void => {
    writeFileSync(STATE_FILE, String(windowIndex), 'utf8');
};

/**
 * Generates a one-time code for the MFA challenge.
 *
 * Every test signs in from scratch, so this is called several times per run.
 * Two guards keep that reliable:
 *
 * 1. **Expiry** — a code minted in the last few seconds of its step can expire
 *    between generation and submission.
 * 2. **Replay** — Auth0 rejects a code it has already consumed, and both its
 *    drift tolerance and its own clock widen that to the neighbouring steps.
 *
 * Both are handled by waiting out whole steps, so an authenticated test can sit
 * idle for up to a minute and a half before it even opens the browser. That is
 * the price of keeping no cached session; it is not a bug to tune away.
 *
 * The suite runs `workers: 1`: the state file is read-modify-written with no
 * locking, and concurrent workers would race it.
 *
 * @returns {Promise<string>} A six-digit code valid for the current step.
 */
export async function generateTotpCode(): Promise<string> {
    // Bracket access is required: `2FA_SECRET` starts with a digit, so
    // `process.env.2FA_SECRET` is not valid TypeScript.
    const secret = process.env['2FA_SECRET'];

    if (!secret) {
        throw new Error('2FA_SECRET is not set. Add it to the env file.');
    }

    const lastIssuedWindow = readLastIssuedWindow();

    while (currentWindow() < lastIssuedWindow + MIN_WINDOW_GAP) {
        await awaitNextWindow();
    }

    if (secondsLeftInWindow() < MIN_REMAINING_SECONDS) {
        await awaitNextWindow();
    }

    writeLastIssuedWindow(currentWindow());

    return new TOTP({
        secret: Secret.fromBase32(secret),
        digits: 6,
        period: PERIOD_SECONDS,
    }).generate();
}
