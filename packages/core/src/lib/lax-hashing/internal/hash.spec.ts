import { describe, expect, it } from 'vitest';
import { computeHash } from './hash';

describe('computeHash', () => {
  it('produces deterministic hex string', () => {
    const h1 = computeHash('message => console.log(message)');
    const h2 = computeHash('message => console.log(message)');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]+$/);
  });

  it('produces different hashes for different inputs', () => {
    const h1 = computeHash('a b');
    const h2 = computeHash('a b c');
    expect(h1).not.toBe(h2);
  });
});
