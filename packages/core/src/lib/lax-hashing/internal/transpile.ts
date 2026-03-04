import * as ts from 'typescript';

/**
 * Transpiles TypeScript/JavaScript function code to JavaScript.
 * Used to normalize the code before tokenization so we match what
 * Playwright and Angular CLI would produce.
 */
export function transpileToJs(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020, // same modern level as Playwright/Angular; stable
      module: ts.ModuleKind.ESNext, // no CJS wrapper; we only need the function body for hashing
      esModuleInterop: true, // standard default; no effect on this snippet
    },
  });
  return result.outputText;
}
