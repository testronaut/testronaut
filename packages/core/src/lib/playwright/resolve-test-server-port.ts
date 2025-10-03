import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

/* A bit above 1024 (privileged ports) to stay on the safe side. */
const MIN_PORT = 2000;
/* A bit below max ports to stay on the safe side. */
const MAX_PORT = 60000;

const MAX_ATTEMPTS = 10;

/**
 * Resolves a port for a test server based on a seed.
 *
 * The goal is to always use the same port for each seed (e.g. project config path),
 * then pick the next available port if the initial port is taken.
 * This allows us the caller to decide if they should run some initialization
 * logic or not.
 */
export function resolveTestServerPort(seed: string): {
  port: number;
  anotherTestServerMightBeRunning: boolean;
} {
  const initialPort = seedToPort(seed);
  const maxPort = initialPort + MAX_ATTEMPTS - 1;
  let port = initialPort;

  do {
    if (!isServerRunning(port)) {
      return { port, anotherTestServerMightBeRunning: port !== initialPort };
    }

    ++port;
  } while (port < maxPort);

  throw new Error(
    `Can't start test server. Ports ${initialPort}-${maxPort} are taken.`
  );
}

function isServerRunning(port: number) {
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

function seedToPort(value: string): number {
  const hash = createHash('sha-256');
  hash.update(value);
  const hex = hash.digest('hex');

  const big = BigInt(`0x${hex}`);
  const range = BigInt(MAX_PORT - MIN_PORT);
  return Number(big % range) + MIN_PORT;
}
