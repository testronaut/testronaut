import { Page } from '@playwright/test';
import { describe, it } from 'vitest';
import { PageAdapterPlaywright } from './page-adapter-playwright';

class PageFake {
  #resolveWaitForFunction = false;
  reloadCounter = 0;

  activateFunction() {
    this.#resolveWaitForFunction = true;
  }

  readonly page = {
    waitForFunction: () => {
      return this.#resolveWaitForFunction
        ? Promise.resolve()
        : Promise.reject();
    },

    reload: () => {
      this.reloadCounter++;
      return Promise.resolve();
    },
  } as unknown as Page;
}

describe('Page Loader Pageoff', () => {
  const setup = () => {
    const fake = new PageFake();
    const adapter = new PageAdapterPlaywright(fake.page);

    return { fake, adapter };
  };

  it('should resolve if page is already loaded', async () => {
    const { adapter, fake } = setup();
    fake.activateFunction();
    const promise = adapter.waitForFunctionAndReload(() => void true, {
      hash: '',
    });
    await promise;
    expect(fake.reloadCounter).toBe(0);
  });

  it.only('should fail after 5 seconds', async () => {
    vitest.useFakeTimers();
    const { adapter, fake } = setup();
    const promise = adapter.waitForFunctionAndReload(() => void true, {
      hash: '',
    });
    vitest.advanceTimersByTime(5_000);
    await expect(promise).rejects.toThrow();
    await expect(fake.reloadCounter).toBe(1);
    vitest.useRealTimers();
  });
});
