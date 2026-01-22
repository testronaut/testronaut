import { createHash } from 'node:crypto';

/* A bit above 1024 (privileged ports) to stay on the safe side. */
const MIN_PORT = 2000;
/* A bit below max ports to stay on the safe side. */
const MAX_PORT = 60000;

/**
 * Derives a deterministic port number from a seed.
 */
export function derivePortFromSeed(seed: string): number {
  const hash = createHash('sha-256');
  hash.update(seed);
  const hex = hash.digest('hex');

  const big = BigInt(`0x${hex}`);
  const range = BigInt(MAX_PORT - MIN_PORT);
  return Number(big % range) + MIN_PORT;
}
