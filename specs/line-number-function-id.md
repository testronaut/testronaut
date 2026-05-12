# Plan: Replace Lax-Hash with Line-Number Function Identification for `inPage`

## Context

`inPage(() => { ... })` extracts anonymous functions at analysis time (TypeScript AST) and must match them at runtime. The current approach computes a "lax hash" of the transpiled function body at both analysis time and runtime. This breaks in (at least) two scenarios:

1. **Angular decorator transforms** — `@Injectable`, `@Component`, etc. produce drastically different compiled output from the original source, so `fn.toString()` at runtime no longer matches the hash computed at analysis time (issue #134).
2. **CommonJS vs ESM** — projects without `"type": "module"` in their `package.json` are treated as CommonJS, which changes `fn.toString()` output. The lax hash tried to normalize punctuation differences but couldn't fully bridge the gap.

Spike PR #135 proves a better approach: use the source line number of the `inPage(...)` call. The TypeScript AST gives the line at analysis time; `new Error().stack` gives it at runtime. Source maps are reliable because Playwright already depends on them for VS Code integration and error reporting. Line numbers are unaffected by transpiler output format.

This plan implements the spike approach in a production-ready way and removes all lax-hashing infrastructure.

---

## Branch

```
git fetch upstream
git checkout -b feat/line-number-id upstream/main
```

---

## Step 1 — Create shared prefix module

**New file:** `packages/core/src/lib/core/in-page-line-prefix.ts`

```typescript
export const IN_PAGE_LINE_PREFIX = '__line__';

export function isLineBasedName(name: string): boolean {
  return name.startsWith(IN_PAGE_LINE_PREFIX);
}

export function lineBasedName(line: number): string {
  return `${IN_PAGE_LINE_PREFIX}${line}`;
}
```

Shared by `analyze.ts` and `visit-in-page-calls.ts` to keep the prefix in one place.

---

## Step 2 — Modify `packages/core/src/lib/analyzer/analyze.ts`

Remove:
- `import { LaxHashCollisionError } from '../core/lax-hash-collision-error';`
- `import { computeHashes } from '../lax-hashing/compute-hashes';`
- `const laxToFull: Record<...> = {};` and all collision detection logic

Add:
- `import { lineBasedName } from '../core/in-page-line-prefix';`

Replace the anonymous `inPageCall` branch:
```typescript
// Before (lax hash):
const { laxHash, fullHash } = computeHashes(inPageCall.code);
// collision check...
name: laxHash,

// After (line number):
const { line } = ctx.sourceFile.getLineAndCharacterOfPosition(
  inPageCall.node.getStart(ctx.sourceFile)
);
name: lineBasedName(line + 1),  // 0-indexed → 1-indexed
```

Line numbers are inherently unique per call site, so anonymous calls need no collision detection.

---

## Step 3 — Remove `inPageWithNamedFunction` entirely

The line-number approach is reliable: the only theoretical collision (two `inPage` calls on the same source line) is caught at analysis time as a `DuplicatedNamedFunctionsError`, not a silent runtime failure. `inPageWithNamedFunction` was the escape hatch for lax-hash failures (decorators, CJS/ESM). With line numbers, that escape hatch is unnecessary.

**Remove from `packages/core/src/lib/playwright/fixtures.ts`:**
- The `inPageWithNamedFunction` fixture definition
- The `InPageWithNamedFunction` interface export
- The `createInPageVariant` overload for `'inPageWithNamedFunction'`
- The `computeHashes` import

**Remove from `packages/core/src/lib/analyzer/visit-in-page-calls.ts`:**
- The `'inPageWithNamedFunction'` variant in `getInPageVariant()`
- The `getInPageWithNamedFunctionIdentifier()` import and usage
- The `isLaxHash` import and reserved-prefix guard (no longer relevant)
- The named-function argument parsing branch

**Remove from `packages/core/src/lib/core/in-page-identifier.ts`:**
- `getInPageWithNamedFunctionIdentifier()` function

**Remove from `packages/core/src/lib/analyzer/analyze.ts`:**
- The `namedFunctionNames` array and `DuplicatedNamedFunctionsError` check for named functions (no longer needed since `inPageWithNamedFunction` is gone)

**Update `packages/core/src/lib/playwright/fixtures.ts` `Fixtures` interface:**
```typescript
export interface Fixtures {
  inPage: InPage;
  // inPageWithNamedFunction removed
}
```

---

## Step 4 — Extract and fix call location helper

**New file:** `packages/core/src/lib/playwright/capture-in-page-call-location.ts`

```typescript
import { fileURLToPath } from 'node:url';

export function captureInPageCallLocation(): { filePath: string; line: number } | null {
  const frames = (new Error().stack ?? '').split('\n');
  // Stack: [0] "Error", [1] captureInPageCallLocation, [2] inPageImpl, [3] caller
  return _parseCallerFrame(frames[3]);
}

export function _parseCallerFrame(frame: string | undefined): { filePath: string; line: number } | null {
  if (!frame) return null;
  const match = frame.match(/^ +at (file:\/\/\/.+):(\d+):\d+$/);
  if (!match) return null;
  return {
    filePath: fileURLToPath(match[1]),
    line: parseInt(match[2], 10),
  };
}
```

`fileURLToPath` correctly handles both Unix (`file:///home/...`) and Windows (`file:///C:/...`). The spike's `split(':')` approach breaks on Windows paths — this is the key production fix over the spike.

**New test file:** `packages/core/src/lib/playwright/capture-in-page-call-location.spec.ts`

Test `_parseCallerFrame` with static strings (no real stack capture needed):
- Unix path: `'    at file:///home/user/test.ts:10:5'` → `{ filePath: '/home/user/test.ts', line: 10 }`
- Windows path: `'    at file:///C:/Users/user/test.ts:10:5'` → `{ filePath: 'C:\\Users\\user\\test.ts', line: 10 }`
- Node internal frame: `'    at node:internal/process:123:5'` → `null`
- `undefined` → `null`

---

## Step 5 — Modify `packages/core/src/lib/playwright/fixtures.ts`

Remove:
- `import { computeHashes } from '../lax-hashing/compute-hashes';`

Add:
- `import { captureInPageCallLocation } from './capture-in-page-call-location';`
- `import { lineBasedName } from '../core/in-page-line-prefix';`

Replace the `computeHashes` fallback in the anonymous `inPage` path:
```typescript
// Before:
if (functionName === '') {
  const fn = args[0] as () => unknown;
  const { laxHash } = computeHashes(fn.toString(), { skipTranspilation: true });
  functionName = laxHash;
}

// After:
const location = captureInPageCallLocation();
if (!location || location.filePath !== filePath) {
  throw new Error(
    `Failed to capture \`inPage\` call location.\n` +
    `Expected: ${filePath}\nDetected: ${location?.filePath ?? 'none'}\n` +
    `This is likely a Testronaut bug. Please report it at https://github.com/testronaut/testronaut/issues`
  );
}
functionName = lineBasedName(location.line);
```

---

## Step 6 — Document `xxhashjs` follow-up

`xxhashjs` was the main reason lax-hashing needed a fast non-crypto hash. After removing the lax-hashing module, `xxhashjs` is still used only for file-level hashing in `extraction-pipeline.ts` and `derive-port-from-seed.ts`.

**Create `specs/remove-xxhashjs.md`** describing the follow-up task:
- Location of remaining `xxhashjs` usages (`extraction-pipeline.ts`, `derive-port-from-seed.ts`)
- Suggested replacement: `node:crypto`'s `createHash('sha256')` (already used elsewhere in the codebase)
- Note that `@types/xxhashjs` can be removed too

Do NOT migrate or remove `xxhashjs` in this PR.

---

## Step 7 — Delete dead code

Files to delete:
- `packages/core/src/lib/lax-hashing/compute-hashes.ts`
- `packages/core/src/lib/lax-hashing/compute-hashes.spec.ts`
- `packages/core/src/lib/lax-hashing/internal/hash.ts`
- `packages/core/src/lib/lax-hashing/internal/hash.spec.ts`
- `packages/core/src/lib/lax-hashing/internal/transpile.ts`
- `packages/core/src/lib/lax-hashing/internal/transpile.spec.ts`
- `packages/core/src/lib/core/lax-hash-collision-error.ts`
- `specs/lax-approach.md`

Also delete all `inPageWithNamedFunction`-related tests:
- Any spec file that tests `inPageWithNamedFunction` exclusively
- E2e test `tests/angular-wide/src/app/in-page-with-named-__lax__-function.pw.ts`

Verify: `grep -r 'lax-hashing\|LaxHashCollision\|computeHashes\|isLaxHash\|inPageWithNamedFunction' packages/` should return zero results.

---

## Step 8 — Update `packages/core/src/lib/analyzer/analyze.spec.ts`

**Remove:**
- `import { LaxHashCollisionError }` and all tests using it (collision tests)
- `const laxAnonymousName = expect.stringMatching(/^__lax__/)`

**Update** all tests that used `laxAnonymousName` to assert the exact `__line__N` value. Since test content is inline strings, the line numbers are fixed. For example:
```typescript
// Content string (line 3 is the inPage call):
`
test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
`
// Assert:
expect(extractedFunctions[0].name).toBe('__line__3');
```

**Add** a test: `'assigns distinct line-based names to two anonymous inPage calls'`.

**Add** a test verifying that two `inPage` calls on the same line throw `DuplicatedNamedFunctionsError`:
```typescript
it('throws DuplicatedNamedFunctionsError when two anonymous inPage calls share a line', () => {
  expect(() =>
    analyzeFileContent(
      // prettier-ignore
      `test('...', async ({inPage}) => { await inPage(() => 'a'); await inPage(() => 'b'); });`
    )
  ).toThrow(DuplicatedNamedFunctionsError);
});
```
Both calls land on line 1, both get `__line__1`, triggering the duplicate check.

---

## Step 9 — Update e2e tests

| File | Action |
|------|--------|
| `tests/angular-wide/src/app/lax-hashing-anonymous.pw.ts` | Keep tests; remove lax-hash comments, rename to `anonymous-inpage.pw.ts` |
| `tests/angular-wide/src/app/in-page-failing.pw.ts` | Delete — trailing-comma collision no longer applies |
| `tests/angular-wide/src/app/in-page-with-named-__lax__-function.pw.ts` | Delete |

**Add** `tests/angular-wide/src/app/angular-decorator-inpage.pw.ts` as a regression test for issue #134 — an anonymous `inPage` call containing a component with Angular decorators that should pass without runtime error.

---

## Verification

1. **Unit tests:** `pnpm nx test core` — all `analyze.spec.ts`, `capture-in-page-call-location.spec.ts` tests pass
2. **Type check:** `pnpm nx typecheck core` — no errors after removing lax-hash imports
3. **No dead imports:** `grep -r 'lax-hashing\|LaxHashCollision\|computeHashes\|isLaxHash\|inPageWithNamedFunction' packages/` returns zero results
4. **E2e tests:** `pnpm nx e2e angular-wide` — all tests pass including the new decorator regression test
5. **Windows paths:** The `_parseCallerFrame` unit test with a Windows-style frame passes

---

## Files Summary

| File | Action |
|------|--------|
| `packages/core/src/lib/core/in-page-line-prefix.ts` | Create |
| `packages/core/src/lib/playwright/capture-in-page-call-location.ts` | Create |
| `packages/core/src/lib/playwright/capture-in-page-call-location.spec.ts` | Create |
| `packages/core/src/lib/analyzer/analyze.ts` | Modify |
| `packages/core/src/lib/analyzer/analyze.spec.ts` | Modify |
| `packages/core/src/lib/analyzer/visit-in-page-calls.ts` | Modify |
| `packages/core/src/lib/playwright/fixtures.ts` | Modify |
| `specs/remove-xxhashjs.md` | Create (follow-up issue doc) |
| `packages/core/src/lib/lax-hashing/` (6 files) | Delete |
| `packages/core/src/lib/core/lax-hash-collision-error.ts` | Delete |
| `specs/lax-approach.md` | Delete |
| `tests/angular-wide/src/app/lax-hashing-anonymous.pw.ts` | Rename → `anonymous-inpage.pw.ts` + edit |
| `tests/angular-wide/src/app/in-page-failing.pw.ts` | Delete |
| `tests/angular-wide/src/app/in-page-with-named-__lax__-function.pw.ts` | Delete |
| `tests/angular-wide/src/app/angular-decorator-inpage.pw.ts` | Create |
