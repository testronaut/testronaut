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
});
