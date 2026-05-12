import { describe } from 'vitest';
import { FileAnalysis } from '../core/file-analysis';

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
    expect(hash).toBe('b97e4f00');
  });

  it('extracts `inPage` sync arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__3',
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts multiple anonymous `inPage` calls in one file with distinct line-based names', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(() => console.log('a'));
  await inPage(() => console.log('b'));
});
    `);
    expect(extractedFunctions).toHaveLength(2);
    expect(extractedFunctions[0].name).toBe('__line__3');
    expect(extractedFunctions[1].name).toBe('__line__4');
  });

  it('throws DuplicatedNamedFunctionsError when two anonymous inPage calls share a line', () => {
    expect(() =>
      analyzeFileContent(
        // prettier-ignore
        `test('...', async ({inPage}) => { await inPage(() => 'a'); await inPage(() => 'b'); });`
      )
    ).toThrow(DuplicatedNamedFunctionsError);
  });

  it('extracts `inPage` async arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({inPage}) => {
  await inPage(async () => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__3',
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
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__3',
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
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__3',
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
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__3',
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
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__3',
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts imported identifiers used in `inPage`', () => {
    const { extractedFunctions } = analyzeFileContent(`
import { something, somethingElse, somethingUsedOutside } from './something';
import { somethingFromAnotherFile } from './another-file';

console.log(somethingUsedOutside);

inPage(() => {
  console.log(something);
});

inPage(() => {
  console.log(something);
  console.log(somethingFromAnotherFile);
});
    `);
    expect(extractedFunctions).toStrictEqual([
      {
        name: '__line__7',
        code: `() => {
  console.log(something);
}`,
        importedIdentifiers: [
          {
            name: 'something',
            module: './something',
          },
        ],
      },
      {
        name: '__line__11',
        code: `() => {
  console.log(something);
  console.log(somethingFromAnotherFile);
}`,
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
      },
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
    path: 'my-component.spec.ts',
    content,
  });
}
