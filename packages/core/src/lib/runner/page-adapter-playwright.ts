import { expect, Page } from '@playwright/test';
import { PageAdapter } from './page-adapter';

export class PageAdapterPlaywright implements PageAdapter {
  readonly #page: Page;

  constructor(page: Page) {
    this.#page = page;
  }

  async waitForFunctionAndReload<R, Arg>(
    pageFunction: (args: Arg) => R,
    arg: Arg
  ): Promise<void> {
    await expect(async () => {
      try {
        // @eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.#page.waitForFunction(pageFunction as any, arg, {
          timeout: 1_000,
        });
      } catch (error) {
        /* Reload on failure. */
        await this.#page.reload();
        throw error;
      }
    }).toPass();
  }

  async evaluate<R, Arg>(pageFunction: (args: Arg) => R, arg: Arg): Promise<R> {
    // @eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.#page.evaluate(pageFunction as any, arg);
  }
}
