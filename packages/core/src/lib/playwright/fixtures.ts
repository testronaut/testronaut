import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { test as base } from '@playwright/test';
import { createHash } from 'node:crypto';

export const test = base.extend<{ runInBrowser: RunInBrowser }>({
  page: async ({ page }, use) => {
    await page.goto('/');

    await use(page);
  },

  runInBrowser: async ({ page }, use, testInfo) => {
    const hash = await computeHash(testInfo.file);
    const destPath = testInfo.file.replace('src/app', 'ct-tests/generated/app');
    const dir = dirname(destPath);
    await mkdir(dir, { recursive: true });

    const runInBrowserImpl: RunInBrowser = async (fn) => {
      await writeFile(
        destPath,
        `
export const extractedFunctionsMap = {
  '': ${fn.toString()},
};
    `,
        'utf-8'
      );

      await writeFile(
        'ct-tests/generated/index.ts',
        `
// This file is auto-generated. Do not edit it directly.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

globalThis['${hash}'] = () => import('./app/run-in-browser.ct-spec');
      `,
        'utf-8'
      );

      // @ts-expect-error no index signature
      await page.waitForFunction(({ hash }) => globalThis[hash], { hash });
      await page.evaluate(
        async ({ hash }) => {
          // @ts-expect-error no index signature
          const module = await globalThis[hash]();
          return module.extractedFunctionsMap['']();
        },
        { hash }
      );
    };

    await use(runInBrowserImpl);
  },
});

export interface RunInBrowser {
  <RETURN_TYPE>(fn: () => RETURN_TYPE | Promise<RETURN_TYPE>): Promise<void>;

  <RETURN_TYPE>(
    name: string,
    fn: () => RETURN_TYPE | Promise<RETURN_TYPE>
  ): Promise<void>;
}

async function computeHash(path: string) {
  const content = await readFile(path, 'utf8');
  return createHash('sha256').update(content).digest('base64').slice(0, 8);
}
