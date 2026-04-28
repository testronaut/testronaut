import { describe, expect, it } from 'vitest';
import { transpileToJs } from './transpile';

describe('transpileToJs', () => {
  it('transpiles TypeScript arrow function to JavaScript', () => {
    const ts = '(message: string) => console.log(message);';
    expect(transpileToJs(ts)).toContain('(message) => console.log(message)');
  });

  it('transpiles async arrow function', () => {
    const ts = 'async () => console.log("hi")';
    expect(transpileToJs(ts)).toContain('async () => console.log("hi")');
  });

  it('adds semicolons to the end of the function body', () => {
    const ts = '() => console.log("hi")';
    expect(transpileToJs(ts)).toContain('() => console.log("hi");');
  });

  it('does not remove trailing commas', () => {
    const ts = 'const numbers = [1, 2, 3,];';
    expect(transpileToJs(ts)).toContain('const numbers = [1, 2, 3,];');
  });

  it('does not add trailing comma', () => {
    const ts = 'const numbers = [1, 2, 3],';
    expect(transpileToJs(ts)).not.toContain('const numbers = [1, 2, 3],');
  });

  it('does not remove training commas', () => {
    const ts = 'const numbers = [1, 2, 3,];';
    expect(transpileToJs(ts)).toContain('const numbers = [1, 2, 3,];');
  })
});
