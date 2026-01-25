import { transpile } from './transpile';

describe('transpile', () => {
  it('adds closing semicolons automatically', () => {
    const result = transpile(`() => { console.log('Hi!'); }`);

    expect(result).toContain(`() => { console.log('Hi!'); };`);
  });

  it('adds closing semicolons automatically multiple times', () => {
    const result = transpile(`
      () => { console.log('Hi!'); }
      () => { console.log('Hello!'); }
      `);

    expect(result).toContain(`() => { console.log('Hi!'); };`);
    expect(result).toContain(`() => { console.log('Hello!'); };`);
  });

  it('removes type annotations', () => {
    const result = transpile(`function hello(): void { console.log('Hi!'); }`);

    expect(result).toContain(`function hello() { console.log('Hi!'); }`);
  });
});
