import * as ts from 'typescript';

/**
 * Transpiles TypeScript code to JavaScript by removing type annotations.
 * This is used to normalize code before tokenization, since types don't exist at runtime.
 *
 * The transpiler can add certain tokens which are not present in the original code.
 * For example, it adds closing semicolons automatically.
 *
 * @param code - The TypeScript code to transpile
 * @returns The transpiled JavaScript code
 *
 * @example
 * ```ts
 * import { transpile } from '@run-in-browser/core';
 * const result = transpile('function hello(): void { console.log("Hello"); }');
 * // Returns: 'function hello() { console.log("Hello"); }'
 * ```
 */
export function transpile(code: string): string {
  if (!code.trim()) {
    return code;
  }

  const result = ts.transpile(code, {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.None,
    removeComments: false,
    preserveConstEnums: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: false,
  });

  return result;
}
