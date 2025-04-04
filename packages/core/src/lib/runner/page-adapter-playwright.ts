import { expect, Page } from '@playwright/test';
import { PageAdapter } from './page-adapter';

export class PageAdapterPlaywright implements PageAdapter {
  readonly #page: Page;

  constructor(page: Page) {
    this.#page = page;
  }

  async waitForFunctionAndReload(
    pageFunction: (args: { hash: string }) => void,
    args: { hash: string }
  ): Promise<void> {
    let timeout = 100;
    await expect(async () => {
      try {
        await this.#page.waitForFunction(pageFunction, args, {
          timeout,
        });
      } catch (error) {
        /* Reload on failure. */
        await this.#page.reload();

        /* Exponential backoff.
         * We don't want to retry too fast as maybe the page is too slow to load. */
        timeout *= 2;

        throw error;
      }
    }).toPass({ timeout: 5_000 });
  }

  async evaluate<R, Arg>(pageFunction: (args: Arg) => R, arg: Arg): Promise<R> {
    // @eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.#page.evaluate(pageFunction as any, arg);
  }
}
