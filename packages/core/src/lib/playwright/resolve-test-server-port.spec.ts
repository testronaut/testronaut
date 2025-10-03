import { resolveTestServerPort } from './resolve-test-server-port';
import { describe, test as base } from 'vitest';
import { createServer, Server } from 'node:http';

const test = base.extend<{ startServer: StartServerFn }>({
  // eslint-disable-next-line no-empty-pattern
  startServer: async ({}, use) => {
    let servers: Server[] = [];
    await use((seed: string) => {
      /* Using `resolveTestServer` ourselves here in the tests
       * to start an existing server for tests who need it. */
      const { port } = resolveTestServerPort(seed);
      const server = createServer((_, res) => {
        res.statusCode = 200;
        res.end();
      });
      servers = [...servers, server];
      return { port };
    });
  },
});

type StartServerFn = (seed: string) => { port: number };

describe(resolveTestServerPort.name, () => {
  test('derives the port from the provided seed', () => {
    // expect(server.port).toBe(7357);
  });

  test.todo('picks the next available port');

  test.todo('tells if another test server might be running');

  test.todo('tells if no other test server is running');
});
