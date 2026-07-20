# ADR 001: Use stack-trace to resolve extracted functions

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related design doc:** [001-replace-lax-hash-with-inpage-call-line](../design-docs/001-replace-lax-hash-with-inpage-call-line.md)

## Context

- Testronaut extracts `inPage(...)` callbacks into a separate file.
- Angular CLI transpiles that file; Playwright transpiles the callback at runtime.
- Anonymous `inPage` calls must be matched between extract-time and runtime.
- Transpiled-body matching fails when Playwright and static analysis diverge
  (CommonJS rewrites, decorators, etc.).
- Heuristic body matching requires ongoing upkeep as transpiler output changes.

## Decision

- Drop lax hashing for anonymous `inPage` matching.
- Use the **source line number of the `inPage` call** as the "synthetic key" instead (`line:<n>`).
- **At extract time:** read the line from the TypeScript AST.
- **At runtime:** capture the call site by parsing the stack trace of a freshly thrown `Error` with the [`stack-trace`](https://www.npmjs.com/package/stack-trace) package, then derive the same `line:<n>` key.

## Consequences

### Positive

- Anonymous `inPage` works with CommonJS, decorators, and other heavy Playwright transforms without comparing transpiled bodies.
- No more collisions.
- Matching logic is simpler.
- Keys are human-readable (`line:42`) and map directly to the test source.

### Negative / accepted risks

- It **works as long as Playwright does not break sourcemaps**.
  We are confident because Playwright needs that too for integrations such as VSCode extension.
- **Works with V8 compatible stack traces** so it might need fixes for runtimes other than NodeJS.
- **Fragile frame indexing.** The correct stack frame index depends on Testronaut's internal call chain. Refactors to `fixtures.ts` or the runner must preserve the offset used to find the user's `inPage` call.
- **Same-line calls are forbidden.** Authors must split multiple `inPage` calls onto separate lines.
  We could extract columns but we do not want to encourage multiple calls per line anyway.
