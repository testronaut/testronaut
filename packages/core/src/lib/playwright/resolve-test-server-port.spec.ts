import { createServer, Server } from 'node:http';
import { test as base, describe } from 'vitest';
import { resolveTestServerPort } from './resolve-test-server-port';

const test = base.extend<{ startServer: StartServerFn }>({
  // eslint-disable-next-line no-empty-pattern
  startServer: async ({}, use) => {
    let servers: Server[] = [];
    await use((port) => {
      const server = createServer((_, res) => {
        res.statusCode = 200;
        res.end();
      });
      servers = [...servers, server];
      server.listen(port);
    });
  },
});
type StartServerFn = (port: number) => void;

describe(resolveTestServerPort.name, () => {
  test.todo('derives the port from the provided seed', () => {
    const { port } = resolveTestServerPort(
      '/users/me/my-project/playwright-testronaut.config.ts'
    );

    /* 8801 is the port computed from the provided seed. */
    expect(port).toBe(8801);
  });

  test.todo('picks the next available port', ({ startServer }) => {
    const seed = '/users/me/my-project/playwright-testronaut.config.ts';
    startServer(8801);
    startServer(8802);
    startServer(8803);

    const { port } = resolveTestServerPort(seed);
    expect(port).toBe(8804);
  });

  test.todo(
    'tells if another test server might be running',
    ({ startServer }) => {
      const seed = '/users/me/my-project/playwright-testronaut.config.ts';
      startServer(8801);

      const { anotherTestServerMightBeRunning } = resolveTestServerPort(seed);
      expect(anotherTestServerMightBeRunning).toBe(true);
    }
  );

  test.todo('tells if no other test server is running', () => {
    const seed = '/users/me/my-project/playwright-testronaut.config.ts';
    const { anotherTestServerMightBeRunning } = resolveTestServerPort(seed);
    expect(anotherTestServerMightBeRunning).toBe(false);
  });
});
