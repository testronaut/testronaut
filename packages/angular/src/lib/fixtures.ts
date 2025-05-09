import { test as base } from '@playwright-ct/core';
export { expect } from '@playwright-ct/core';
import { Type } from '@angular/core';

export const test = base.extend<Fixtures>({
  mount: async ({ runInBrowser }, use) => {
    const mountImpl: Fixtures['mount'] = async () => {
      await runInBrowser(noop);
    };

    await use(mountImpl);
  },
});

interface Fixtures {
  mount(cmp: Type<unknown>): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
