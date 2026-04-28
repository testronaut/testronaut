import { describe, expect, it } from 'vitest';
import { computeHash } from './hash';

describe('computeHash', () => {
  it('produces deterministic hex string', () => {
    const input = 'message=>console.logmessage';
    const h1 = computeHash(input);
    const h2 = computeHash(input);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]+$/);
  });

  it('produces different hashes for different inputs', () => {
    const h1 = computeHash('ab');
    const h2 = computeHash('abc');
    expect(h1).not.toBe(h2);
  });
});
