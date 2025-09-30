import type { Type } from '@angular/core';
import { test as base, type Page } from '@testronaut/core';
import {
  BrowserMount,
  Inputs,
  OUTPUT_BUS_VARIABLE_NAME,
  OutputEvent,
  OutputTypes,
  ValueOrAsyncFactory,
} from '../common';

export { expect } from '@testronaut/core';

export const test = base.extend<Fixtures>({
  mount: async ({ page, runInBrowser }, use) => {
    const mountImpl: Fixtures['mount'] = async <CMP_TYPE extends Type<unknown>>(
      ...args: MountParameters<CMP_TYPE>
    ) => {
      /* Handle both signatures:
       * - mount(cmp, opts)
       * - mount(functionName, cmp, opts) */
      const { functionName, options } = normalizeArgs(args);

      const inputs = options?.inputs;

      /* Using a placeholder function here because what matters to `runInBrowser`
       * is the name (if not anonymous). */
      const { outputNames } =
        functionName != null
          ? await runInBrowser(
              functionName,
              { inputs },
              placeholderMount<CMP_TYPE>
            )
          : await runInBrowser({ inputs }, placeholderMount<CMP_TYPE>);

      const { outputsCalls } = listenToOutputBus({ page, outputNames });

      return {
        outputs: outputsCalls,
      };
    };

    await use(mountImpl);
  },
});

function normalizeArgs<CMP_TYPE extends Type<unknown>>(
  args: MountParameters<CMP_TYPE>
): {
  functionName: string | null;
  options: MountOpts<InstanceType<CMP_TYPE>>;
} {
  if (isNamedMount(args)) {
    return {
      functionName: args[0],
      options: args[2] ?? {},
    };
  } else {
    return {
      functionName: null,
      options: args[1] ?? {},
    };
  }
}

function isNamedMount<CMP extends Type<unknown>>(
  args: MountParameters<CMP>
): args is MountParametersNamed<CMP> {
  return typeof args[0] === 'string';
}

/**
 * This is a placeholder functiont that should never be called.
 */
const placeholderMount = async <CMP_TYPE extends Type<unknown>>(): ReturnType<
  BrowserMount<CMP_TYPE>
> => {
  throw new Error(`Placeholder function shouldn't have been called.`);
};

function listenToOutputBus<CMP_TYPE extends Type<unknown>>({
  page,
  outputNames,
}: {
  page: Page;
  outputNames: Array<keyof OutputTypes<InstanceType<CMP_TYPE>>>;
}) {
  const outputsCalls = Object.fromEntries(
    outputNames.map((name) => [name, { calls: [] }])
  ) as unknown as Outputs<InstanceType<CMP_TYPE>>;

  page.exposeFunction(
    OUTPUT_BUS_VARIABLE_NAME,
    (outputEvent: OutputEvent<InstanceType<CMP_TYPE>>) => {
      const output = outputsCalls[outputEvent.outputName];
      output.calls = [
        ...output.calls,
        outputEvent.value as OutputTypes<
          InstanceType<CMP_TYPE>
        >[typeof outputEvent.outputName],
      ];
    }
  );

  return { outputsCalls };
}

export interface Fixtures {
  mount<CMP_TYPE extends Type<unknown>>(
    ...args: MountParametersAnonymous<CMP_TYPE>
  ): Promise<MountResult<InstanceType<CMP_TYPE>>>;
  mount<CMP_TYPE extends Type<unknown>>(
    ...args: MountParametersNamed<CMP_TYPE>
  ): Promise<MountResult<InstanceType<CMP_TYPE>>>;
}

type MountParameters<CMP_TYPE extends Type<unknown>> =
  | MountParametersAnonymous<CMP_TYPE>
  | MountParametersNamed<CMP_TYPE>;

type MountParametersAnonymous<CMP_TYPE extends Type<unknown>> = [
  cmp: ValueOrAsyncFactory<CMP_TYPE>,
  opts?: MountOpts<InstanceType<CMP_TYPE>>
];

type MountParametersNamed<CMP_TYPE extends Type<unknown>> = [
  name: string,
  cmp: ValueOrAsyncFactory<CMP_TYPE>,
  opts?: MountOpts<InstanceType<CMP_TYPE>>
];

export interface MountOpts<CMP> {
  inputs?: Inputs<CMP>;
}

export interface MountResult<CMP> {
  outputs: Outputs<CMP>;
}

export type Outputs<CMP> = {
  [PROP in keyof CMP]: CMP[PROP] extends Subscribable<infer VALUE>
    ? { calls: VALUE[] }
    : never;
};

type Subscribable<T> = {
  subscribe: (fn: (value: T) => void) => unknown;
};
