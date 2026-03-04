import { describe, expect, it } from 'vitest';
import { computeHashes } from './compute-hashes';

describe('computeLaxHashes', () => {
  it('returns laxHash, fullHash', () => {
    const ts = '(message: string) => console.log(message);';
    const { laxHash, fullHash } = computeHashes(ts);
    expect(laxHash).toBe('ℒc8b941f6');
    expect(fullHash).toBe('3efddd87');
  });

  it('returns same laxHash for equivalent JS variants', () => {
    const a = '(message) => console.log(message);';
    const b = 'message => console.log(message)';
    const { laxHash: laxA } = computeHashes(a, true);
    const { laxHash: laxB } = computeHashes(b, true);
    expect(laxA).toBe(laxB);
  });

  it('returns same lax but different fullHash', () => {
    const a = '(message) => console.log(message());';
    const b = '(message) => console.log(message);';
    const { fullHash: fullA, laxHash: laxA } = computeHashes(a, true);
    const { fullHash: fullB, laxHash: laxB } = computeHashes(b, true);
    expect(fullA).not.toBe(fullB);
    expect(laxA).toBe(laxB);
  });
});
