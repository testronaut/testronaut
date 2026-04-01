import { describe, expect, it } from 'vitest';
import { computeHashes } from './compute-hashes';

describe('computeLaxHashes', () => {
  it('returns laxHash, fullHash', () => {
    const code = '(message: string) => console.log(message);';
    expect(computeHashes(code)).toEqual({
      laxHash: '__lax__7f8a930c',
      fullHash: '1fd125ca',
    });
  });

  it('returns same laxHash but different fullHash when slightly different code', () => {
    const a = computeHashes('(message) => console.log(message)');
    const b = computeHashes('(message) => console.log(message);');
    expect(a.fullHash).not.toBe(b.fullHash);
    expect(a.laxHash).toBe(b.laxHash);
  });

  it('returns same laxHash for extra parens', () => {
    const a = computeHashes('message => console.log(message)');
    const b = computeHashes('(message) => console.log(message)');
    expect(a.laxHash).toBe(b.laxHash);
  });

  it('returns same laxHash for extra whitespace', () => {
    const a = computeHashes('x+1');
    const b = computeHashes('x + 1');
    expect(a.laxHash).toBe(b.laxHash);
  });

  it('returns same laxHash for extra semicolon', () => {
    const a = computeHashes('(message) => console.log(message);');
    const b = computeHashes('(message) => console.log(message)');
    expect(a.laxHash).toBe(b.laxHash);
  });

  it('returns same laxHash for different quote styles', () => {
    const a = computeHashes('console.log("hello")');
    const b = computeHashes("console.log('hello')");
    expect(a.laxHash).toBe(b.laxHash);
  });
});
