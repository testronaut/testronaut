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
});
