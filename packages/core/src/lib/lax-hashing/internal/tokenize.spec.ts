import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize';

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

  it('matches string tokens when quote and escape styles differ for the same value', () => {
    const escapedDouble = 'console.log("say \\"hi\\"")';
    const singleWithDouble = "console.log('say \"hi\"')";
    const { laxTokens: a } = tokenize(escapedDouble);
    const { laxTokens: b } = tokenize(singleWithDouble);
    expect(a).toEqual(b);
  });

  it.each([
    ['single-quoted', "'hello'"],
    ['double-quoted', '"hello"'],
    ['backtick', '`hello`'],
  ])('normalizes %s literals to the same canonical token', (_style, code) => {
    expect(tokenize(code).fullTokens).toEqual(["'hello'"]);
  });

  it.each([
    ['double quotes', '"it\'s"'],
    ['backticks', "`it's`"],
  ])('escapes single quotes in string content from %s', (_style, code) => {
    expect(tokenize(code).fullTokens).toEqual(["'it\\'s'"]);
  });

  it('maps escape-equivalent spellings to the same string token', () => {
    const escapedDouble = tokenize('"say \\"hi\\""').fullTokens;
    const singleWithDouble = tokenize(`'say "hi"'`).fullTokens;
    expect(escapedDouble).toEqual(singleWithDouble);
    expect(escapedDouble).toEqual(["'say \"hi\"'"]);
  });

  it('preserves backticks in template literal content', () => {
    // Valid one-token template; inner backticks escaped in source. TS getTokenValue
    // is the span including the closing backtick (here "`a`b`").
    const code = '`' + '\\`a\\`b\\`' + '`';
    expect(tokenize(code).fullTokens).toEqual(["'" + '`a`b`' + "'"]);
  });

  it('tokenizes empty string literal', () => {
    expect(tokenize("''").fullTokens).toEqual(["''"]);
  });

  it('tokenizes single-character string literal', () => {
    expect(tokenize("'a'").fullTokens).toEqual(["'a'"]);
  });

  it('leaves non-string tokens as scanner text', () => {
    expect(tokenize('identifier').fullTokens).toEqual(['identifier']);
    expect(tokenize('=>').fullTokens).toEqual(['=>']);
  });
});
