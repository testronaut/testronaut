import { describe, expect, it } from 'vitest';
import { computeHashes } from './compute-hashes';

describe('computeHashes', () => {
  it('returns laxHash and fullHash', () => {
    const ts = '(message: string) => console.log(message);';
    const { laxHash, fullHash } = computeHashes(ts);
    expect(laxHash).toBe('__lax__c8b941f6');
    expect(fullHash).toBe('fe3cafb1');
  });

  it('returns same laxHash for equivalent JS variants', () => {
    const a = '(message) => console.log(message);';
    const b = 'message => console.log(message)';
    const { laxHash: laxA } = computeHashes(a, { skipTranspilation: true });
    const { laxHash: laxB } = computeHashes(b, { skipTranspilation: true });
    expect(laxA).toBe(laxB);
  });

  it('returns same laxHash for different whitespace', () => {
    const a = '() => { console.log("hi"); }';
    const b = '() => {\n  console.log("hi");\n}';
    const { laxHash: laxA } = computeHashes(a, { skipTranspilation: true });
    const { laxHash: laxB } = computeHashes(b, { skipTranspilation: true });
    expect(laxA).toBe(laxB);
  });

  it('returns same laxHash when only string quote style differs', () => {
    const single = `() => console.log('hi');`;
    const double = '() => console.log("hi");';
    const { laxHash: laxSingle } = computeHashes(single, {
      skipTranspilation: true,
    });
    const { laxHash: laxDouble } = computeHashes(double, {
      skipTranspilation: true,
    });
    expect(laxSingle).toBe(laxDouble);
  });

  it('returns same lax but different fullHash', () => {
    const a = '(message) => console.log(message());';
    const b = '(message) => console.log(message);';
    const { fullHash: fullA, laxHash: laxA } = computeHashes(a, {
      skipTranspilation: true,
    });
    const { fullHash: fullB, laxHash: laxB } = computeHashes(b, {
      skipTranspilation: true,
    });
    expect(fullA).not.toBe(fullB);
    expect(laxA).toBe(laxB);
  });
});

describe('computeHashes lax collisions (same laxHash, different fullHash)', () => {
  it('string literal vs identifier: lax matches, full does not', () => {
    const withString = `() => console.log('msg');`;
    const withIdentifier = '() => console.log(msg);';
    const { laxHash: laxS, fullHash: fullS } = computeHashes(withString, {
      skipTranspilation: true,
    });
    const { laxHash: laxI, fullHash: fullI } = computeHashes(withIdentifier, {
      skipTranspilation: true,
    });
    expect(laxS).toBe(laxI);
    expect(fullS).not.toBe(fullI);
  });

  it('comma inside string vs none: lax can match, full does not', () => {
    const withCommaInString = `() => console.log('a,b');`;
    const withoutCommandInString = `() => console.log('ab');`;
    const { laxHash: laxA, fullHash: fullA } = computeHashes(
      withCommaInString,
      { skipTranspilation: true }
    );
    const { laxHash: laxB, fullHash: fullB } = computeHashes(
      withoutCommandInString,
      { skipTranspilation: true }
    );
    expect(laxA).toBe(laxB);
    expect(fullA).not.toBe(fullB);
  });
});
