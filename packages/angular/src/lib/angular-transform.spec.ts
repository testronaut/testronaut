import {
  TransformResult,
  createFileData,
  createImportedIdentifier,
} from '@playwright-ct/core/devkit';
import { describe } from 'vitest';

import { angularTransform } from './angular-transform';

describe(angularTransform.name, () => {
  it('replaces anonymous mount call with runInBrowser + mount', () => {
    const result = transform(`
import { test } from '@playwright-ct/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello);
});
    `);

    expect(result.content).toContain(`\
import { test } from '@playwright-ct/angular';
import { Hello } from './hello.component';
test('hello', async ({ runInBrowser }) => {
    await runInBrowser(() => mount(Hello));
});
`);
  });

  it('replaces mount call with runInBrowser + mount', () => {
    const result = transform(`
import { test } from '@playwright-ct/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount('hello', Hello);
});
    `);

    expect(result.content).toContain(`\
import { test } from '@playwright-ct/angular';
import { Hello } from './hello.component';
test('hello', async ({ runInBrowser }) => {
    await runInBrowser('hello', () => mount(Hello));
});
`);
  });

  it('returns `mount` import from `@playwright-ct/angular/browser` in the imported identifiers to be added', () => {
    const result = transform(`
import { test } from '@playwright-ct/angular';
import { Hello } from './hello.component';

test('hello', async ({ mount }) => {
  await mount(Hello);
});
    `);

    expect(result.importedIdentifiers).toEqual([
      createImportedIdentifier({
        name: 'mount',
        module: '@playwright-ct/angular/browser',
      }),
    ]);
  });

  it('does nothing if there is no mount function', () => {
    const result = transform(`
import { test } from '@playwright-ct/angular';

test('hello', async ({ runInBrowser }) => {
  await runInBrowser(() => {
    console.log('hello');
  });
});
    `);

    expect.soft(result.importedIdentifiers).toHaveLength(0);
    expect.soft(result.content).not.toContain('mount');
  });

  it.todo('replaces mount call even if aliased');

  it.todo('does not replace mount calls if they are not fixtures');
});

function transform(content: string): TransformResult {
  const fileData = createFileData({ content, path: './my-test.pw.ts' });
  return angularTransform.apply(fileData);
}
