import type { InputSignal, Type } from '@angular/core';
import { test as base } from '@testronaut/core';

export { expect } from '@testronaut/core';

export const test = base.extend<Fixtures>({
  mount: async ({ runInBrowser }, use) => {
    const mountImpl: Mount = async (...args) => {
      const functionName = typeof args[0] === 'string' ? args[0] : null;

      const opts =
        functionName != null && typeof args[1] === 'object' ? args[1] : null;

      const inputs = opts?.inputs;

      /* Using a no-op function here because what matters to `runInBrowser`
       * is the name (if not anonymous). */
      if (functionName != null) {
        await runInBrowser(functionName, { inputs }, noop);
      } else {
        await runInBrowser({ inputs }, noop);
      }
    };

    await use(mountImpl);
  },
});

interface Fixtures {
  mount: Mount;
}

interface Mount {
  <CMP extends Type<unknown>>(
    cmp: CMP,
    opts?: MountOpts<InstanceType<CMP>>
  ): Promise<void>;
  <CMP extends Type<unknown>>(
    name: string,
    cmp: CMP,
    opts?: MountOpts<InstanceType<CMP>>
  ): Promise<void>;
}

interface MountOpts<CMP> {
  inputs?: Inputs<CMP>;
}

type Inputs<CMP> = Partial<{
  [PROP in keyof CMP]: CMP[PROP] extends InputSignal<infer VALUE>
    ? VALUE
    : never;
}>;

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
