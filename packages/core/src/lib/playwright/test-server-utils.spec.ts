import { createServer, Server } from 'node:http';
import { test as base, describe } from 'vitest';
import { isServerRunning, seedToPort } from './test-server-utils';

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

describe(seedToPort.name, () => {
  test('derives the port from the provided seed', () => {
    const port = seedToPort(
      '/users/me/my-project/playwright-testronaut.config.ts'
    );

    expect(port).toBe(10801);
  });
});

describe(isServerRunning.name, () => {
  test('tells if a server is running on the provided port', ({
    startServer,
  }) => {
    startServer(10801);

    expect(isServerRunning(10801)).toBe(true);
  });

  test('tells if a server is not running on the provided port', () => {
    expect(isServerRunning(10802)).toBe(false);
  });
});
