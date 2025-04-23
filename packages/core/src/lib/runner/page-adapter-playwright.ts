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
    await expect(async () => {
      try {
        await this.#page.waitForFunction(pageFunction, args);
      } catch (error) {
        /* Reload on failure. */
        await this.#page.reload();
        throw error;
      }
    }).toPass({
      intervals: [100, 500, 1_000, 2_000],
      timeout: 5_000,
    });
  }

  async evaluate<R, Arg>(pageFunction: (args: Arg) => R, arg: Arg): Promise<R> {
    // @eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.#page.evaluate(pageFunction as any, arg);
  }
}
