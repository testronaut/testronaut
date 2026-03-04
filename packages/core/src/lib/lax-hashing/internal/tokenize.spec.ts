import { describe, expect, it } from 'vitest';
import { normalizeStringLiteral, tokenize } from './tokenize';

describe('tokenize', () => {
  it('produces full tokens', () => {
    const js = '(message) => console.log(message);';
    const { fullTokens, laxTokens } = tokenize(js);
    expect(fullTokens).toEqual([
      '(',
      'message',
      ')',
      '=>',
      'console',
      '.',
      'log',
      '(',
      'message',
      ')',
      ';',
    ]);

    expect(laxTokens).toEqual([
      'message',
      '=>',
      'console',
      '.',
      'log',
      'message',
    ]);
  });

  it('normalizes string literals to single-quote form', () => {
    const single = "console.log('hi')";
    const double = 'console.log("hi")';
    const { laxTokens: singleTokens } = tokenize(single);
    const { laxTokens: doubleTokens } = tokenize(double);
    expect(singleTokens).toEqual(doubleTokens);
  });
});

describe('normalizeStringLiteral', () => {
  it.each([
    ['single-quoted', "'hello'", "'hello'"],
    ['double-quoted', '"hello"', "'hello'"],
    ['backtick', '`hello`', "'hello'"],
  ])('normalizes %s to single-quoted', (_style, input, expected) => {
    expect(normalizeStringLiteral(input)).toBe(expected);
  });

  it.each([
    ['double quotes', '"it\'s"'],
    ['backticks', "`it's`"],
  ])('escapes single quotes when converting from %s', (_style, input) => {
    expect(normalizeStringLiteral(input)).toBe("'it\\'s'");
  });

  it('doubles backslashes when wrapping in single quotes', () => {
    expect(normalizeStringLiteral('"say \\"hi\\""')).toBe(
      '\'say \\\\"hi\\\\"\''
    );
  });

  it('preserves backticks in content when converting from backticks', () => {
    expect(normalizeStringLiteral('`a`b`')).toBe("'a`b'");
  });

  it('returns string shorter than 2 characters unchanged', () => {
    expect(normalizeStringLiteral('')).toBe('');
    expect(normalizeStringLiteral('a')).toBe('a');
  });

  it('returns non-string-literal text unchanged', () => {
    expect(normalizeStringLiteral('identifier')).toBe('identifier');
    expect(normalizeStringLiteral('=>')).toBe('=>');
  });
});
