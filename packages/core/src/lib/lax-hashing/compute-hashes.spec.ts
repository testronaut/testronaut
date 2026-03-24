import { describe, expect, it } from 'vitest';
import { computeHashes } from './compute-hashes';

const withTokenizer = { isAlreadyJs: true, useTokenizer: true };
const withoutTokenizer = { isAlreadyJs: true, useTokenizer: false };

describe('differences between hashes with and without tokenizer', () => {
  it('fail with different string literal quote styles', () => {
    const single = `console.log('hi')`; // transpiled from source code
    const double = `console.log("hi")`; // transpiled by Playwright
    const { laxHash: laxHashSingleWithoutTokenizer } = computeHashes(single, withoutTokenizer);
    const { laxHash: laxHashDoubleWithoutTokenizer } = computeHashes(double, withoutTokenizer);
    expect(laxHashSingleWithoutTokenizer).not.toBe(laxHashDoubleWithoutTokenizer);

    const { laxHash: laxHashSingleWithTokenizer } = computeHashes(single, withTokenizer);
    const { laxHash: laxHashDoubleWithTokenizer } = computeHashes(double, withTokenizer);
    expect(laxHashSingleWithTokenizer).toBe(laxHashDoubleWithTokenizer);
  });

  it('fails with different whitespace', () => {
    const compact = 'x+1'; // transpiled from source code
    const spaced = 'x + 1'; // transpiled by Playwright
    const { laxHash: laxHashCompactWithoutTokenizer } = computeHashes(compact, withoutTokenizer);
    const { laxHash: laxHashSpacedWithoutTokenizer } = computeHashes(spaced, withoutTokenizer);
    expect(laxHashCompactWithoutTokenizer).not.toBe(
      laxHashSpacedWithoutTokenizer
    );

    const { laxHash: laxHashCompactWithTokenizer } = computeHashes(compact, withTokenizer);
    const { laxHash: laxHashSpacedWithTokenizer } = computeHashes(spaced, withTokenizer);
    expect(laxHashCompactWithTokenizer).toBe(laxHashSpacedWithTokenizer);
  });

  it('fails with different arrow parens', () => {
    const withParens = '(message) => console.log(message);'; // transpiled from source code
    const withoutParens = 'message => console.log(message)'; // transpiled by Playwright
    const { laxHash: laxHashWithParensWithoutTokenizer } = computeHashes(withParens, withoutTokenizer);
    const { laxHash: laxHashWithoutParensWithoutTokenizer } = computeHashes(
      withoutParens,
      withoutTokenizer
    );
    expect(laxHashWithParensWithoutTokenizer).not.toBe(
      laxHashWithoutParensWithoutTokenizer
    );

    const { laxHash: laxHashWithParensWithTokenizer } = computeHashes(
      withParens,
      true
    );
    const { laxHash: laxHashWithoutParensWithTokenizer } = computeHashes(
      withoutParens,
      true
    );
    expect(laxHashWithParensWithTokenizer).toBe(
      laxHashWithoutParensWithTokenizer
    );
  });

  it('fails with different lax hashes for the same full hash', () => {
    const a = '(message) => console.log(message());'; // transpiled from source code
    const b = '(message) => console.log(message);'; // transpiled by Playwright
    const hashesAWithTokenizer = computeHashes(a, withTokenizer);
    const hashesBWithTokenizer = computeHashes(b, withTokenizer);
    expect(hashesAWithTokenizer.laxHash).toBe(hashesBWithTokenizer.laxHash);
    expect(hashesAWithTokenizer.fullHash).not.toBe(
      hashesBWithTokenizer.fullHash
    );

    const hashesAWithoutTokenizer = computeHashes(a, withoutTokenizer);
    const hashesBWithoutTokenizer = computeHashes(b, withoutTokenizer);
    expect(hashesAWithoutTokenizer.laxHash).not.toBe(
      hashesBWithoutTokenizer.laxHash
    );
    expect(hashesAWithoutTokenizer.fullHash).not.toBe(
      hashesBWithoutTokenizer.fullHash
    );
  });
});
