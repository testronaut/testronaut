import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

/* A bit above 1024 (privileged ports) to stay on the safe side. */
const MIN_PORT = 2000;
/* A bit below max ports to stay on the safe side. */
const MAX_PORT = 60000;

/**
 * Check if a server is running on the provided port.
 */
export function isServerRunning(port: number): boolean {
  const result = spawnSync(
    `node`,
    [
      '-e',
      `
import { connect } from 'net';
const s = connect({ port: ${port}, host: 'localhost' });
s.once('connect', () => { s.end(); process.exit(0); });
s.once('error', () => process.exit(1));
`,
    ],
    { timeout: 1_000 }
  );

  const { error, status } = result;
  if (error) {
    throw error;
  }
  return status === 0;
}

/**
 * Generate a predictable port number based on the provided seed.
 */
export function seedToPort(value: string): number {
  const hash = createHash('sha-256');
  hash.update(value);
  const hex = hash.digest('hex');

  const big = BigInt(`0x${hex}`);
  const range = BigInt(MAX_PORT - MIN_PORT);
  return Number(big % range) + MIN_PORT;
}
