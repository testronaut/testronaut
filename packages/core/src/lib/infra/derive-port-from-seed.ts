import { h32 } from 'xxhashjs';

/* A bit above 1024 (privileged ports) to stay on the safe side. */
const MIN_PORT = 2000;
/* A bit below max ports to stay on the safe side. */
const MAX_PORT = 60000;

/**
 * Derives a deterministic port number from a seed.
 */
export function derivePortFromSeed(seed: string): number {
  const hashValue = h32(seed, 0).toNumber();
  const range = MAX_PORT - MIN_PORT;
  return (hashValue % range) + MIN_PORT;
}
