import type { InputSignal, Type } from '@angular/core';
import { test as base } from '@testronaut/core';
import { BrowserMount } from '../common';

export { expect } from '@testronaut/core';

export const test = base.extend<Fixtures>({
  mount: async ({ runInBrowser }, use) => {
    const mountImpl: Mount = async (...args) => {
      /* Handle both signatures:
       * - mount(cmp, opts)
       * - mount(functionName, cmp, opts) */
      const functionName = typeof args[0] === 'string' ? args[0] : null;
      const opts =
        functionName != null && typeof args[1] === 'object' ? args[1] : null;

      const inputs = opts?.inputs;

      /* Using a placeholder function here because what matters to `runInBrowser`
       * is the name (if not anonymous). */
      const { outputNames } =
        functionName != null
          ? await runInBrowser(functionName, { inputs }, placeholderMount)
          : await runInBrowser({ inputs }, placeholderMount);

      return {
        outputs: Object.fromEntries(
          outputNames.map((name) => [name, { calls: [] }])
        ),
      };
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
  ): Promise<MountResult<InstanceType<CMP>>>;
  <CMP extends Type<unknown>>(
    name: string,
    cmp: CMP,
    opts?: MountOpts<InstanceType<CMP>>
  ): Promise<MountResult<InstanceType<CMP>>>;
}

interface MountOpts<CMP> {
  inputs?: Inputs<CMP>;
}

interface MountResult<CMP> {
  outputs: Outputs<CMP>;
}

type Inputs<CMP> = Partial<{
  [PROP in keyof CMP]: CMP[PROP] extends InputSignal<infer VALUE>
    ? VALUE
    : never;
}>;

type Outputs<CMP> = {
  [PROP in keyof CMP]: CMP[PROP] extends {
    subscribe: (fn: (value: infer VALUE) => void) => unknown;
  }
    ? { calls: VALUE[] }
    : never;
};

/**
 * This is a placeholder functiont that should never be called.
 */
const placeholderMount = async (): ReturnType<BrowserMount> => {
  throw new Error(`Placeholder function shouldn't have been called.`);
};
