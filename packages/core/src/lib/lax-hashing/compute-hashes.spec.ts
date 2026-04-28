import { describe, expect, it } from 'vitest';
import { computeHashes } from './compute-hashes';

describe('computeHashes', () => {
  it('returns laxHash, fullHash', () => {
    const ts = '(message: string) => console.log(message);';
    const { laxHash, fullHash } = computeHashes(ts);
    // Values will change after the regex refactor, so we just check they exist
    expect(laxHash).toMatch(/^__lax__[a-f0-9]+$/);
    expect(fullHash).toMatch(/^[a-f0-9]+$/);
  });

  it('normalizes whitespace and semicolons', () => {
    const a = '(msg) => { console.log(msg); };';
    const b = '(msg)=>{console.log(msg)}';
    const { laxHash: laxA } = computeHashes(a, true);
    const { laxHash: laxB } = computeHashes(b, true);
    expect(laxA).toBe(laxB);
  });

  it('normalizes parentheses while preserving empty ones ()', () => {
    // isolated ( and ) are removed, but () is kept
    const a = '(msg) => console.log(msg)';
    const b = 'msg => console.log(msg)';
    const { laxHash: laxA } = computeHashes(a, true);
    const { laxHash: laxB } = computeHashes(b, true);
    expect(laxA).toBe(laxB);

    const callWithArgs = '() => fn(arg)';
    const callNoArgs = '() => fn()';
    const { laxHash: laxCallWithArgs } = computeHashes(callWithArgs, true);
    const { laxHash: laxCallNoArgs } = computeHashes(callNoArgs, true);
    expect(laxCallWithArgs).not.toBe(laxCallNoArgs);
  });

  it('normalizes all quote styles (single, double, backtick)', () => {
    const single = "() => 'hello'";
    const double = '() => "hello"';
    const backtick = '() => `hello`';
    const { laxHash: laxS } = computeHashes(single, true);
    const { laxHash: laxD } = computeHashes(double, true);
    const { laxHash: laxB } = computeHashes(backtick, true);
    expect(laxS).toBe(laxD);
    expect(laxS).toBe(laxB);
  });

  it('ignores type annotations (via transpilation)', () => {
    const ts = '(msg: string): void => console.log(msg)';
    const js = '(msg) => console.log(msg)';
    const { laxHash: laxTs } = computeHashes(ts, false);
    const { laxHash: laxJs } = computeHashes(js, true);
    expect(laxTs).toBe(laxJs);
  });

  it('still distinguishes different snippets when normalization keeps a meaningful difference', () => {
    const a = '() => console.log(1)';
    const b = '() => console.log(2)';
    const { laxHash: laxA } = computeHashes(a, true);
    const { laxHash: laxB } = computeHashes(b, true);
    expect(laxA).not.toBe(laxB);
  });

  it('produces different full hashes for equivalent code with different formatting', () => {
    const a = '() => { console.log(1); }';
    const b = '()=> {console.log(1)}';
    const { fullHash: fullA, laxHash: laxA } = computeHashes(a, true);
    const { fullHash: fullB, laxHash: laxB } = computeHashes(b, true);
    expect(laxA).toBe(laxB);
    expect(fullA).not.toBe(fullB);
  });
});
