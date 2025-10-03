import { resolveTestServerPort } from './resolve-test-server-port';
import { describe, it } from 'vitest';

describe(resolveTestServerPort.name, () => {
  it.todo('derives the port from the provided seed');

  it.todo('picks the next available port');

  it.todo('tells if another test server might be running');

  it.todo('tells if no other test server is running');
});
