import { createFileData, type TransformResult } from '@testronaut/core/devkit';
import { describe } from 'vitest';

import { angularTransform } from './angular-transform';

describe(angularTransform.name, () => {
  it('returns content unchanged and no imported identifiers', () => {
    const content = `
import { test } from '@testronaut/angular';

test('hello', async ({ inPage }) => {
  await inPage(() => {
    console.log('hello');
  });
});
    `;
    const result = transform(content);

    expect(result.content).toBe(content);
    expect(result.importedIdentifiers).toHaveLength(0);
  });
});

function transform(content: string): TransformResult {
  const fileData = createFileData({ content, path: './my-test.pw.ts' });
  return angularTransform.apply(fileData);
}
