import { createServer, Server } from 'node:http';
import { test as base, describe } from 'vitest';
import { resolveTestServerPort } from './resolve-test-server-port';

const test = base.extend<{ startServer: StartServerFn }>({
  // eslint-disable-next-line no-empty-pattern
  startServer: async ({}, use) => {
    let servers: Server[] = [];

    await use((port) => {
      const server = createServer((_, res) => {
        res
          .writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': '0',
            Connection: 'close',
          })
          .end();
      }).listen(port);

      servers = [...servers, server];
    });

    for (const server of servers) {
      server.close();
    }
  },
});
type StartServerFn = (port: number) => void;

describe(resolveTestServerPort.name, () => {
  test('derives the port from the provided seed', () => {
    const { port } = resolveTestServerPort(
      '/users/me/my-project/playwright-testronaut.config.ts'
    );

    /* "10801" is derived from the hash of the config path. */
    expect(port).toBe(10801);
  });

  test('picks the next available port', ({ startServer }) => {
    const seed = '/users/me/my-project/playwright-testronaut.config.ts';
    for (let i = 10801; i <= 10803; i++) {
      startServer(i);
    }

    const { port } = resolveTestServerPort(seed);
    expect(port).toBe(10804);
  });

  test('fails after 10 attempts', ({ startServer }) => {
    const seed = '/users/me/my-project/playwright-testronaut.config.ts';
    for (let i = 10801; i <= 10810; i++) {
      startServer(i);
    }

    expect(() => resolveTestServerPort(seed)).toThrow(
      `Can't start test server. Ports 10801-10810 are taken.`
    );
  });

  test('tells if another test server might be running', ({ startServer }) => {
    const seed = '/users/me/my-project/playwright-testronaut.config.ts';

    startServer(10801);

    const { anotherTestServerMightBeRunning } = resolveTestServerPort(seed);
    expect(anotherTestServerMightBeRunning).toBe(true);
  });

  test('tells if no other test server is running', () => {
    const seed = '/users/me/my-project/playwright-testronaut.config.ts';
    const { anotherTestServerMightBeRunning } = resolveTestServerPort(seed);
    expect(anotherTestServerMightBeRunning).toBe(false);
  });
});
