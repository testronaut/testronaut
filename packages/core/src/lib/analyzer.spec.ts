import { describe } from 'vitest';
import { Analyzer } from './analyzer';

describe(Analyzer.name, () => {
  it.todo.each([
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
    [
      'extracts named `runInBrowser`',
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
  ])('%s', (_, { content, expectedExtractedFunctions }) => {
    const analyzer = new Analyzer();

    const extractedFunctions = analyzer.analyze({
      path: 'my-component.spec.ts',
      content,
    });

    expect(extractedFunctions).toEqual(expectedExtractedFunctions);
  });

  it.todo('extracts imported identifiers used in `runInBrowser`');

  it.todo('fails if `runInBrowser` name is not a string literal');
});
