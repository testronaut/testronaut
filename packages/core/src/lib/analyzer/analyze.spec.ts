import { describe } from 'vitest';
import { FileAnalysis } from '../core/file-analysis';
import { LaxHashCollisionError } from '../core/lax-hash-collision-error';
import { analyze } from './analyze';
import { InvalidInPageCallError } from './visit-in-page-calls';
import { DuplicatedNamedFunctionsError } from '../core/duplicate-extracted-functions.error';

describe(analyze.name, () => {
  it('generates file hash', () => {
    const { hash } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
    `);
    expect(hash).toBe('MLZi2ARp');
  });

  it('extracts `inPage` sync arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toHaveLength(1);
    expect(extractedFunctions[0]).toMatchObject({
      code: `() => console.log('Hello!')`,
      importedIdentifiers: [],
    });
    expect(extractedFunctions[0].name).toMatch('__lax__c5374cf9');
  });

  it('extracts multiple anonymous `inPage` calls in one file', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => console.log('a'));
  await inPage(() => console.log('b'));
});
    `);
    expect(extractedFunctions).toHaveLength(2);
  });

  it('throws LaxHashCollisionError when two anonymous functions have same lax but different full hash', () => {
    expect(() =>
      analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => (message) => console.log(message()));
  await inPage(() => (message) => console.log(message));
});
    `)
    ).toThrow(LaxHashCollisionError);
  });

  it('checks for collision on fullhash but not source code (transpiler adds semicolons)', () => {
    expect(() =>
      analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => (message) => console.log(message))
  await inPage(() => (message) => console.log(message));
});
    `)
    ).not.toThrow();
  })

  it('does not throw if two anonymous functions have the same code', () => {
    expect(() =>
      analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => (message) => console.log(message()));
  await inPage(() => (message) => console.log(message()));
});
    `)
    ).not.toThrow();
  });

  it('extracts `inPage` async arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(async () => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toHaveLength(1);
    expect(extractedFunctions[0]).toMatchObject({
      code: `async () => console.log('Hello!')`,
      importedIdentifiers: [],
    });
  });

  it('extracts `inPage` function call', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(function sayHello() { console.log('Hello!'); });
});
    `);
    expect(extractedFunctions).toHaveLength(1);
    expect(extractedFunctions[0]).toMatchObject({
      code: `function sayHello() { console.log('Hello!'); }`,
      importedIdentifiers: [],
    });
  });

  it('extracts `inPage` outside test: in beforeEach', () => {
    const { extractedFunctions } = analyzeFileContent(`
test.beforeEach(async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toHaveLength(1);
    expect(extractedFunctions[0]).toMatchObject({
      code: `() => console.log('Hello!')`,
      importedIdentifiers: [],
    });
  });

  it('extracts `inPage` outside test: in a function', () => {
    const { extractedFunctions } = analyzeFileContent(`
function somewhereElse() {
  await inPage(() => console.log('Hello!'));
}
    `);
    expect(extractedFunctions).toHaveLength(1);
    expect(extractedFunctions[0]).toMatchObject({
      code: `() => console.log('Hello!')`,
      importedIdentifiers: [],
    });
  });

  it('extracts named `inPageWithNamedFunction`', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPageWithNamedFunction}) => {
  await inPageWithNamedFunction('say hello', () => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toEqual([
      {
        name: 'say hello',
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts aliased `inPage`', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage: run}) => {
  await run(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toHaveLength(1);
    expect(extractedFunctions[0]).toMatchObject({
      code: `() => console.log('Hello!')`,
      importedIdentifiers: [],
    });
  });

  it('extracts imported identifiers used in `inPageWithNamedFunction`', () => {
    const { extractedFunctions } = analyzeFileContent(`
import { something, somethingElse, somethingUsedOutside } from './something';
import { somethingFromAnotherFile } from './another-file';

console.log(somethingUsedOutside);

inPageWithNamedFunction('say hi', () => {
  console.log(something);
});

inPageWithNamedFunction('say bye', () => {
  console.log(something);
  console.log(somethingFromAnotherFile);
});
    `);
    expect(extractedFunctions).toEqual([
      expect.objectContaining({
        name: 'say hi',
        importedIdentifiers: [
          {
            name: 'something',
            module: './something',
          },
        ],
      }),
      expect.objectContaining({
        name: 'say bye',
        importedIdentifiers: [
          {
            name: 'something',
            module: './something',
          },
          {
            name: 'somethingFromAnotherFile',
            module: './another-file',
          },
        ],
      }),
    ]);
  });

  it.todo('extracts imported identifiers with alias used in `inPage`');

  it.todo('extracts imported identifiers with default import used in `inPage`');

  it.todo('extracts imported identifiers with namespace used in `inPage`');

  it('fails if `inPage` is called without args', () => {
    expect(() => analyzeFileContent(`inPage();`)).toThrow(
      InvalidInPageCallError
    );
  });

  it('fails if `inPage` is called with too many args', () => {
    expect(() =>
      analyzeFileContent(
        `inPage({}, () => console.log('Say hi!'), 'superfluous');`
      )
    ).toThrow(InvalidInPageCallError);
  });

  it('fails if `inPageWithNamedFunction` is called with too many args', () => {
    expect(() =>
      analyzeFileContent(
        `inPageWithNamedFunction('say hi', {}, () => console.log('Say hi!'), 'superfluous');`
      )
    ).toThrow(InvalidInPageCallError);
  });

  it('fails if `inPageWithNamedFunction` name is not a string literal', () => {
    expect(() =>
      analyzeFileContent(`
const name = 'say hi';
inPageWithNamedFunction(name, () => console.log('Say hi!'));
      `)
    ).toThrow(InvalidInPageCallError);
  });

  it('fails if `inPageWithNamedFunction` name uses reserved `__lax__` prefix', () => {
    expect(() =>
      analyzeFileContent(`
inPageWithNamedFunction('__lax__pretendingToBeAnonymous', () => console.log('Hi'));
      `)
    ).toThrow(InvalidInPageCallError);
  });

  it('fails if `inPage` function is not an inline function', () => {
    expect(() =>
      analyzeFileContent(`
const fn = () => console.log('Say hi!');
inPage(fn);
      `)
    ).toThrow(InvalidInPageCallError);
  });

  describe('duplicated named functions', () => {
    it('fails if `inPageWithNamedFunction` is called with a duplicated name', () => {
      expect(() =>
        analyzeFileContent(`
inPageWithNamedFunction('duplicate name', () => console.log('Say hi!'));
inPageWithNamedFunction('duplicate name', () => console.log('Say hi!'));
        `)
      ).toThrow(DuplicatedNamedFunctionsError);
    });
  });
});

function analyzeFileContent(content: string): FileAnalysis {
  return analyze({
    fileData: {
      path: 'my-component.spec.ts',
      content,
    },
  });
}
