import { describe, expect, it } from 'vitest';
import { derivePortFromSeed } from './derive-port-from-seed';

describe(derivePortFromSeed.name, () => {
  it('returns a predictable port number from a seed in the hardcoded range of 2000-60000', () => {
    const port = derivePortFromSeed('test-seed');
    expect(port).toBe(13712);
  });
});
