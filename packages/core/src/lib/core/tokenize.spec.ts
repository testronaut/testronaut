import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('tokenizes an empty string', () => {
    const tokens = tokenize('');

    expect(tokens).toEqual([]);
  });

  it('does not tokenize whitespace', () => {
    const tokens = tokenize(' true ');

    expect(tokens).toEqual(['true']);
  });

  it('tokenizes a simple function', () => {
    const tokens = tokenize('function hello() { console.log("Hello"); }');

    expect(tokens).toEqual([
      'function',
      'hello',
      '(',
      ')',
      '{',
      'console',
      '.',
      'log',
      '(',
      'Hello',
      ')',
      ';',
      '}',
    ]);
  });

  it('tokenizes an anonymous arrow function', () => {
    const tokens = tokenize('() => { console.log("Hello"); }');

    expect(tokens).toEqual([
      '(',
      ')',
      '=>',
      '{',
      'console',
      '.',
      'log',
      '(',
      'Hello',
      ')',
      ';',
      '}',
    ]);
  });

  it('tokenizes code with TestBed configuration', () => {
    const tokens = tokenize(
      `TestBed.configureTestingModule({
  providers: [provideHttpClient()]
})`
    );

    expect(tokens).toEqual([
      'TestBed',
      '.',
      'configureTestingModule',
      '(',
      '{',
      'providers',
      ':',
      '[',
      'provideHttpClient',
      '(',
      ')',
      ']',
      '}',
      ')',
    ]);
  });

  it('tokenizes anonymous arrow function', () => {
    const tokens = tokenize('() => { return 42; }');

    expect(tokens).toEqual(['(', ')', '=>', '{', 'return', '42', ';', '}']);
  });

  it('tokenizes code with variables and assignments', () => {
    const tokens = tokenize('const x = 10; let y = "test";');

    expect(tokens).toEqual([
      'const',
      'x',
      '=',
      '10',
      ';',
      'let',
      'y',
      '=',
      'test',
      ';',
    ]);
  });

  it('tokenizes code with operators', () => {
    const tokens = tokenize('a + b * c - d / e');

    expect(tokens).toEqual(['a', '+', 'b', '*', 'c', '-', 'd', '/', 'e']);
  });

  it('tokenizes code with comparison operators', () => {
    const tokens = tokenize('x === y && z !== w');

    expect(tokens).toEqual(['x', '===', 'y', '&&', 'z', '!==', 'w']);
  });

  it('produces multiple tokens for a template literal', () => {
    const tokens = tokenize('`Hello ${name}!`');

    expect(tokens).toEqual(['`Hello ${', 'name', '}', '!', '`']);
  });

  it('tokenizes code with array and object literals', () => {
    const tokens = tokenize(
      'const arr = [1, 2, 3]; const obj = { a: 1, b: 2 };'
    );

    expect(tokens).toEqual([
      'const',
      'arr',
      '=',
      '[',
      '1',
      ',',
      '2',
      ',',
      '3',
      ']',
      ';',
      'const',
      'obj',
      '=',
      '{',
      'a',
      ':',
      '1',
      ',',
      'b',
      ':',
      '2',
      '}',
      ';',
    ]);
  });

  it('normalizes whitespace differences', () => {
    const tokens1 = tokenize('function hello() { console.log("Hello"); }');
    const tokens2 = tokenize(
      'function   hello(  )  {  console.log( "Hello" )  ;  }'
    );

    expect(tokens1).toEqual(tokens2);
  });

  it('handles empty code', () => {
    const tokens = tokenize('');

    expect(tokens).toEqual([]);
  });

  it('handles code with only whitespace', () => {
    const tokens = tokenize('   \n\t  ');

    expect(tokens).toEqual([]);
  });

  it('tokenizes code with comments', () => {
    const tokens = tokenize('// comment\nfunction test() { }');

    expect(tokens).toEqual(['function', 'test', '(', ')', '{', '}']);
  });

  it('tokenizes code with block comments', () => {
    const tokens = tokenize('/* comment */ function test() { }');

    expect(tokens).toEqual(['function', 'test', '(', ')', '{', '}']);
  });

  it('produces multiple tokens for a regex literal', () => {
    const tokens = tokenize('const r = /ab+/gi;');

    expect(tokens).toEqual(['const', 'r', '=', '/', 'ab', '+', '/', 'gi', ';']);
  });

  it('tokenizes code with nested structures', () => {
    const tokens = tokenize('if (x > 0) { if (y < 10) { return true; } }');

    expect(tokens).toEqual([
      'if',
      '(',
      'x',
      '>',
      '0',
      ')',
      '{',
      'if',
      '(',
      'y',
      '<',
      '10',
      ')',
      '{',
      'return',
      'true',
      ';',
      '}',
      '}',
    ]);
  });

  it('tokenizes code with method chaining', () => {
    const tokens = tokenize('obj.method1().method2().method3()');

    expect(tokens).toEqual([
      'obj',
      '.',
      'method1',
      '(',
      ')',
      '.',
      'method2',
      '(',
      ')',
      '.',
      'method3',
      '(',
      ')',
    ]);
  });

  it('produces same tokens for functionally equivalent code', () => {
    const tokens1 = tokenize('function test() { return x + y; }');
    const tokens2 = tokenize('function test() { return x+y; }');

    expect(tokens1).toEqual(tokens2);
  });

  it('produces different tokens for different code', () => {
    const tokens1 = tokenize('function test() { return x + y; }');
    const tokens2 = tokenize('function test() { return x - y; }');

    expect(tokens1).not.toEqual(tokens2);
  });

  describe('dropTrailingCommas (post-step)', () => {
    it('normalizes trailing comma in arrays', () => {
      const without = tokenize('x([1, 2])');
      const withTrailing = tokenize('x([1, 2,])');

      expect(without).toEqual(withTrailing);
    });

    it('normalizes trailing comma in objects', () => {
      const without = tokenize('x({ a: 1, b: 2 })');
      const withTrailing = tokenize('x({ a: 1, b: 2, })');

      expect(without).toEqual(withTrailing);
    });

    it('normalizes trailing comma in TestBed-style providers', () => {
      const without = tokenize('f({ providers: [a(), b()] })');
      const withTrailing = tokenize('f({ providers: [a(), b(),] })');

      expect(without).toEqual(withTrailing);
    });

    it('does not strip elision commas in arrays', () => {
      const elision = tokenize('[,]');
      const empty = tokenize('[]');

      expect(elision).not.toEqual(empty);
      expect(elision).toEqual(['[', ',', ']']);
    });

    it('does not strip elision commas before trailing comma', () => {
      const withBoth = tokenize('[,,]');

      expect(withBoth).toEqual(['[', ',', ',', ']']);
    });
  });

  describe('normalizeArrowFunctionParams (post-step)', () => {
    it('normalizes single parameter with parentheses to match without parentheses', () => {
      const withParens = tokenize('(data) => { console.log(data); }');
      const withoutParens = tokenize('data => { console.log(data); }');

      expect(withParens).toEqual(withoutParens);
    });

    it('normalizes single parameter with parentheses in runInBrowser context', () => {
      const withParens = tokenize(
        'runInBrowser((data) => { console.log(data.word1, data.word2); })'
      );
      const withoutParens = tokenize(
        'runInBrowser(data => { console.log(data.word1, data.word2); })'
      );

      expect(withParens).toEqual(withoutParens);
    });

    it('normalizes multiple single-parameter arrow functions', () => {
      const withParens = tokenize('(x) => x + 1; (y) => y * 2;');
      const withoutParens = tokenize('x => x + 1; y => y * 2;');

      expect(withParens).toEqual(withoutParens);
    });

    it('does not normalize empty parameters', () => {
      const empty = tokenize('() => { return 42; }');

      expect(empty).toEqual(['(', ')', '=>', '{', 'return', '42', ';', '}']);
    });

    it('does not normalize multiple parameters', () => {
      const multiple = tokenize('(a, b) => { return a + b; }');

      expect(multiple).toEqual([
        '(',
        'a',
        ',',
        'b',
        ')',
        '=>',
        '{',
        'return',
        'a',
        '+',
        'b',
        ';',
        '}',
      ]);
    });

    it('does not normalize object destructuring', () => {
      const destructuring = tokenize('({ data }) => { console.log(data); }');

      expect(destructuring).toEqual([
        '(',
        '{',
        'data',
        '}',
        ')',
        '=>',
        '{',
        'console',
        '.',
        'log',
        '(',
        'data',
        ')',
        ';',
        '}',
      ]);
    });

    it('does not normalize array destructuring', () => {
      const destructuring = tokenize(
        '([ first, second ]) => { console.log(first, second); }'
      );

      expect(destructuring).toContain('(');
      expect(destructuring).toContain('[');
      expect(destructuring).toContain('first');
      expect(destructuring).toContain(',');
      expect(destructuring).toContain('second');
      expect(destructuring).toContain(']');
      expect(destructuring).toContain(')');
      expect(destructuring).toContain('=>');
    });

    it('does not normalize rest parameters', () => {
      const rest = tokenize('(...args) => { console.log(args); }');

      expect(rest).toEqual([
        '(',
        '...',
        'args',
        ')',
        '=>',
        '{',
        'console',
        '.',
        'log',
        '(',
        'args',
        ')',
        ';',
        '}',
      ]);
    });

    it('does not normalize default parameters', () => {
      const withDefault = tokenize('(data = {}) => { console.log(data); }');

      expect(withDefault).toContain('(');
      expect(withDefault).toContain('data');
      expect(withDefault).toContain('=');
      expect(withDefault).toContain('{');
      expect(withDefault).toContain('}');
      expect(withDefault).toContain(')');
      expect(withDefault).toContain('=>');
    });

    it('does not normalize type annotations', () => {
      const withType = tokenize('(data: string) => { console.log(data); }');

      expect(withType).toContain('(');
      expect(withType).toContain('data');
      expect(withType).toContain(':');
      expect(withType).toContain('string');
      expect(withType).toContain(')');
      expect(withType).toContain('=>');
    });

    it('does not normalize nested parentheses that are not arrow function parameters', () => {
      const nested = tokenize('const fn = (x) => (y) => x + y;');

      // Should normalize both arrow function parameters
      const expected = tokenize('const fn = x => y => x + y;');
      expect(nested).toEqual(expected);
    });

    it('normalizes single parameter even with whitespace', () => {
      const withSpaces = tokenize('( data ) => { return data; }');
      const withoutParens = tokenize('data => { return data; }');

      expect(withSpaces).toEqual(withoutParens);
    });

    it('handles complex nested structures with normalized arrow functions', () => {
      const complex = tokenize(
        'runInBrowser({ word1, word2 }, (data) => { console.log(data.word1, data.word2); })'
      );
      const expected = tokenize(
        'runInBrowser({ word1, word2 }, data => { console.log(data.word1, data.word2); })'
      );

      expect(complex).toEqual(expected);
    });

    it('does not normalize when parentheses contain comma-separated values', () => {
      const multiple = tokenize('(a, b, c) => a + b + c;');

      expect(multiple).toContain('(');
      expect(multiple).toContain('a');
      expect(multiple).toContain(',');
      expect(multiple).toContain('b');
      expect(multiple).toContain(',');
      expect(multiple).toContain('c');
      expect(multiple).toContain(')');
      expect(multiple).toContain('=>');
    });

    it('normalizes single parameter in array of arrow functions', () => {
      const withParens = tokenize('[(x) => x, (y) => y, (z) => z]');
      const withoutParens = tokenize('[x => x, y => y, z => z]');

      expect(withParens).toEqual(withoutParens);
    });
  });
});
