import { describe } from 'vitest';
import { FileAnalysis } from '../core/file-analysis';
import { analyze } from './analyze';
import { InvalidRunInBrowserCallError } from './visit-run-in-browser-calls';

describe(analyze.name, () => {
  it('generates file hash', () => {
    const { hash } = analyzeFileContent(`
test('...', async ({runInBrowser}) => {
  await runInBrowser(() => console.log('Hello!'));
});
    `);
    expect(hash).toBe('dzvDWHTi');
  });

  it('extracts `runInBrowser` sync arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({runInBrowser}) => {
  await runInBrowser(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `runInBrowser` async arrow function', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({runInBrowser}) => {
  await runInBrowser(async () => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `async () => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `runInBrowser` function call', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({runInBrowser}) => {
  await runInBrowser(function sayHello() { console.log('Hello!'); });
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `function sayHello() { console.log('Hello!'); }`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `runInBrowser` outside test: in beforeEach', () => {
    const { extractedFunctions } = analyzeFileContent(`
test.beforeEach(async ({runInBrowser}) => {
  await runInBrowser(() => console.log('Hello!'));
});
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts `runInBrowser` outside test: in a function', () => {
    const { extractedFunctions } = analyzeFileContent(`
function somewhereElse() {
  await runInBrowser(() => console.log('Hello!'));
}
    `);
    expect(extractedFunctions).toEqual([
      {
        code: `() => console.log('Hello!')`,
        importedIdentifiers: [],
      },
    ]);
  });

  it('extracts named `runInBrowser`', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({runInBrowser}) => {
  await runInBrowser('say hello', () => console.log('Hello!'));
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

  it('extracts aliased `runInBrowser`', () => {
    const { extractedFunctions } = analyzeFileContent(`
test('...', async ({runInBrowser: run}) => {
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

  it('extracts imported identifiers used in `runInBrowser`', () => {
    const { extractedFunctions } = analyzeFileContent(`
import { something, somethingElse, somethingUsedOutside } from './something';
import { somethingFromAnotherFile } from './another-file';

console.log(somethingUsedOutside);

runInBrowser('say hi', () => {
  console.log(something);
});

runInBrowser('say bye', () => {
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

  it.todo('extracts imported identifiers with alias used in `runInBrowser`');

  it.todo(
    'extracts imported identifiers with default import used in `runInBrowser`'
  );

  it.todo(
    'extracts imported identifiers with namespace used in `runInBrowser`'
  );

  it('fails if `runInBrowser` is called without args', () => {
    expect(() => analyzeFileContent(`runInBrowser();`)).toThrow(
      InvalidRunInBrowserCallError
    );
  });

  it('fails if `runInBrowser` is called with too many args', () => {
    expect(() =>
      analyzeFileContent(
        `runInBrowser('say hi', () => console.log('Say hi!'), 'superfluous');`
      )
    ).toThrow(InvalidRunInBrowserCallError);
  });

  it('fails if `runInBrowser` name is not a string literal', () => {
    expect(() =>
      analyzeFileContent(`
const name = 'say hi';
runInBrowser(name, () => console.log('Say hi!'));
      `)
    ).toThrow(InvalidRunInBrowserCallError);
  });

  it('fails if `runInBrowser` function is not an inline function', () => {
    expect(() =>
      analyzeFileContent(`
const fn = () => console.log('Say hi!');
runInBrowser(fn);
      `)
    ).toThrow(InvalidRunInBrowserCallError);
  });
});

function analyzeFileContent(content: string): FileAnalysis {
  return analyze({
    path: 'my-component.spec.ts',
    content,
  });
}
