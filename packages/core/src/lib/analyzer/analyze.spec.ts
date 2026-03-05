import { describe } from 'vitest';
import { FileAnalysis } from '../core/file-analysis';
import { analyze } from './analyze';
import { InvalidInPageCallError } from './visit-in-page-calls';

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
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `inPage` async arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(async () => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `async () => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `inPage` function call', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(function sayHello() { console.log('Hello!'); });
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `function sayHello() { console.log('Hello!'); }`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `inPage` outside test: in beforeEach', () => {
    const { extractedFunctions } = analyzeFileContent(`
test.beforeEach(async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `inPage` outside test: in a function', () => {
    const { extractedFunctions } = analyzeFileContent(`
function somewhereElse() {
  await inPage(() => console.log('Hello!'));
}
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
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
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
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

  it.todo(
    'extracts imported identifiers with default import used in `inPage`'
  );

  it.todo(
    'extracts imported identifiers with namespace used in `inPage`'
  );

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

  it('fails if `inPage` function is not an inline function', () => {
    expect(() =>
      analyzeFileContent(`
const fn = () => console.log('Say hi!');
inPage(fn);
      `)
    ).toThrow(InvalidInPageCallError);
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
