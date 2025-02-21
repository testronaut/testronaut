import { describe } from 'vitest';
import { Analyzer, InvalidRunInBrowserCallError } from './analyzer';

describe(Analyzer.name, () => {
  it.each([
    [
      'extracts `runInBrowser` sync arrow function',
      {
        content: `
test('...', async ({runInBrowser}) => {
  await runInBrowser(() => console.log('Hello!'));
});
`,
        expectedExtractedFunctions: [
          {
            code: `() => console.log('Hello!')`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
    [
      'extracts `runInBrowser` async arrow function',
      {
        content: `
test('...', async ({runInBrowser}) => {
  await runInBrowser(async () => console.log('Hello!'));
});
`,
        expectedExtractedFunctions: [
          {
            code: `async () => console.log('Hello!')`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
    [
      'extracts `runInBrowser` function call',
      {
        content: `
test('...', async ({runInBrowser}) => {
  await runInBrowser(function sayHello() { console.log('Hello!'); });
});
`,
        expectedExtractedFunctions: [
          {
            code: `function sayHello() { console.log('Hello!'); }`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
    [
      'extracts `runInBrowser` outside test: in beforeEach',
      {
        content: `
test.beforeEach(async ({runInBrowser}) => {
  await runInBrowser(() => console.log('Hello!'));
});
`,
        expectedExtractedFunctions: [
          {
            code: `() => console.log('Hello!')`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
    [
      'extracts `runInBrowser` outside test: in a function',
      {
        content: `
function somewhereElse() {
  await runInBrowser(() => console.log('Hello!'));
});
`,
        expectedExtractedFunctions: [
          {
            code: `() => console.log('Hello!')`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
    [
      'extracts named `runInBrowser`',
      {
        content: `
test('...', async ({runInBrowser}) => {
  await runInBrowser('say hello', () => console.log('Hello!'));
});
    `,
        expectedExtractedFunctions: [
          {
            name: 'say hello',
            code: `() => console.log('Hello!')`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
  ])('%s', (_, { content, expectedExtractedFunctions }) => {
    const extractedFunctions = new Analyzer().analyze({
      path: 'my-component.spec.ts',
      content,
    });

    expect(extractedFunctions).toEqual(expectedExtractedFunctions);
  });

  it.todo.each([
    [
      'extracts aliased `runInBrowser`',
      {
        content: `
test('...', async ({runInBrowser: run}) => {
  await run(() => console.log('Hello!'));
});
    `,
        expectedExtractedFunctions: [
          {
            code: `() => console.log('Hello!')`,
            importedIdentifiers: [],
          },
        ],
      },
    ],
    [
      'extracts imported identifiers used in `runInBrowser`',
      {
        content: `
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
    `,
        expectedExtractedFunctions: [
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
        ],
      },
    ],
  ])('%s', () => {
    throw new Error('🚧 work in progress');
  });

  it('fails if `runInBrowser` is called without args', () => {
    expect(() =>
      new Analyzer().analyze({
        path: 'my-component.spec.ts',
        content: `runInBrowser();`,
      })
    ).toThrow(InvalidRunInBrowserCallError);
  });

  it.todo('fails if `runInBrowser` is called with too many args');

  it.todo('fails if `runInBrowser` name is not a string literal');

  it.todo('fails if `runInBrowser` function is not an inline function');
});
