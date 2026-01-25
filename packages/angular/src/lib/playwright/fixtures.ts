import type { Type } from '@angular/core';
import { test as base, type Page } from '@testronaut/core';
import { computeTokenHash } from '@testronaut/core/devkit';
import {
  BrowserMount,
  Inputs,
  OUTPUT_BUS_VARIABLE_NAME,
  OutputEvent,
  OutputTypes,
} from '../common';

export { expect } from '@testronaut/core';

/**
 * TODO: Consider changing the mount API to accept a function (similar to runInBrowser):
 *   - Current: `mount(Component, { inputs: {...} })`
 *   - Proposed: `mount(() => [Component, { inputs: {...} }])`
 *
 * Reasoning:
 * 1. **Code-to-code matching**: Both transform and runtime would serialize function source code
 *    directly (via `arg.getText()` and `fn.toString()`), eliminating the need to serialize
 *    runtime values. The tokenizer normalizes TypeScript→JavaScript differences, so they match.
 *
 * 2. **Eliminates serialization challenges**: No need to handle object key ordering, quote styles,
 *    or edge cases (functions, symbols, etc.) - they're all just code.
 *
 * 3. **Consistency**: Matches the `runInBrowser(() => { ... })` pattern for the same use case.
 *
 * 4. **More reliable**: Code-to-code matching is more robust than value-to-code matching.
 *
 * Trade-offs:
 * - Breaking change (API change)
 * - More verbose syntax for users
 * - Requires extracting function body (but we already do this for runInBrowser)
 *
 * This would be a good candidate for a future major version.
 */

export const test = base.extend<Fixtures>({
  mount: async ({ page, runInBrowser }, use) => {
    const mountImpl: Fixtures['mount'] = async <CMP_TYPE extends Type<unknown>>(
      ...args: MountParameters<CMP_TYPE>
    ) => {
      /* Handle both signatures:
       * - mount(cmp, opts)
       * - mount(functionName, cmp, opts) */
      const { functionName, cmp, options } = normalizeArgs(args);

      const inputs = options?.inputs;

      /* Using a placeholder function here because what matters to `runInBrowser`
       * is the name (if not anonymous). */
      const nameToUse = functionName ?? generateMountName(cmp, options);

      const { outputNames } = await runInBrowser(
        nameToUse,
        { inputs },
        placeholderMount<CMP_TYPE>
      );

      const { outputsCalls } = await listenToOutputBus({ page, outputNames });

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
  cmp: CMP_TYPE;
  options: MountOpts<InstanceType<CMP_TYPE>>;
} {
  if (isNamedMount(args)) {
    return {
      functionName: args[0],
      cmp: args[1],
      options: args[2] ?? {},
    };
  } else {
    return {
      functionName: null,
      cmp: args[0],
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
 * This is a placeholder function that should never be called.
 */
const placeholderMount = async <CMP_TYPE extends Type<unknown>>(): ReturnType<
  BrowserMount<CMP_TYPE>
> => {
  throw new Error(`Placeholder function shouldn't have been called.`);
};

async function listenToOutputBus<CMP_TYPE extends Type<unknown>>({
  page,
  outputNames,
}: {
  page: Page;
  outputNames: Array<keyof OutputTypes<InstanceType<CMP_TYPE>>>;
}) {
  const outputsCalls = Object.fromEntries(
    outputNames.map((name) => [name, { calls: [] }])
  ) as unknown as Outputs<InstanceType<CMP_TYPE>>;

  await page.exposeFunction(
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
  cmp: CMP_TYPE,
  opts?: MountOpts<InstanceType<CMP_TYPE>>
];

type MountParametersNamed<CMP_TYPE extends Type<unknown>> = [
  name: string,
  cmp: CMP_TYPE,
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

/**
 * Serialization for deterministic name generation
 *
 * When generating names for anonymous mount calls, we need to serialize the mount
 * arguments to match what the transform sees in source code (via `arg.getText()`).
 *
 * Component name: Straightforward - just use `cmp.name` (e.g., "Hello", "World").
 * This matches what `arg.getText()` produces for a class reference.
 *
 * Inputs serialization: This is the challenging part. At runtime we have JavaScript
 * values that need to be serialized back to TypeScript syntax. Key considerations:
 *
 * - String quotes: Don't matter! The tokenizer normalizes string literals to their
 *   values (without quotes), so `'hello'` and `"hello"` produce the same tokens.
 *
 * - Object key ordering: Preserved as-is. The transform uses `arg.getText(sourceFile)`
 *   which preserves source order. At runtime, we rely on JavaScript's object insertion
 *   order (ES2015+) to match. If order differs, names won't match - users can use
 *   named mounts as fallback.
 *
 * - Edge cases: We keep it simple and handle common cases (strings, numbers, booleans,
 *   objects, arrays). Functions, symbols, bigints, etc. may not serialize exactly as
 *   the transform sees them. If name generation fails for edge cases, users can fall
 *   back to named mounts (`mount('name', Component)`) or call `runInBrowser` directly.
 *
 * Future improvement: Consider changing the mount signature to accept a function
 * (e.g., `mount(() => [Component, { inputs: {...} }])`), similar to how `runInBrowser`
 * works. This would allow both the transform and runtime to serialize the function's
 * source code directly (via `arg.getText()` and `fn.toString()`), eliminating the
 * need to serialize runtime values. See `packages/core/README.md` for details on how
 * `runInBrowser` handles function-based code extraction.
 */

/**
 * Serializes mount options to TypeScript object literal syntax.
 * Uses JSON.stringify to preserve key order (matching source order).
 */
function serializeMountOptions(options: MountOpts<unknown>): string {
  if (!options || Object.keys(options).length === 0) {
    return '';
  }

  // Use JSON.stringify to preserve key order, then convert double quotes to single quotes
  const json = JSON.stringify(options);
  return json.replace(/"/g, "'");
}

/**
 * Generates a deterministic name for an anonymous mount call.
 * This matches the algorithm used in angular-transform.ts.
 */
function generateMountName<CMP_TYPE extends Type<unknown>>(
  cmp: CMP_TYPE,
  options?: MountOpts<InstanceType<CMP_TYPE>>
): string {
  const componentName = cmp.name;
  const optionsText = options ? serializeMountOptions(options) : '';
  const mountArgsText = optionsText
    ? `${componentName}, ${optionsText}`
    : componentName;
  const mountCallText = `mount(${mountArgsText})`;
  const hash = computeTokenHash(mountCallText);
  return `__testronaut__${hash}`;
}
