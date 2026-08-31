import { rmSync } from 'node:fs';
import { AuthStateDirectory } from '../../enums/iru/iru';

/**
 * Deletes the cached session once the run finishes.
 *
 * Without this a stale `storageState` could satisfy a later run whose setup
 * project was filtered out (`--grep`, `--no-deps`), and the MFA flow would
 * silently stop being exercised while the suite still reported green. Clearing
 * it guarantees the next run signs in for real.
 *
 * @returns {void}
 */
export default function globalTeardown(): void {
    rmSync(AuthStateDirectory.ROOT, { recursive: true, force: true });
}
