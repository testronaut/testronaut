# Goals

- **Fix support for CommonJS**: When using commonjs, static analysis and code transformed by Playwright are very different. (e.g. `TestBed.inject()` is transformed into something like `commonjs.TestBed.inject()`)
- **Fix support for heavily transformed code even when using ESM**: e.g. decorators are massively transformed by Playwright's build pipeline.
- **Reduced friction**: Remove or sharply narrow cases where authors hit **`LaxHashCollisionError`** and must refactor to **`inPageWithNamedFunction`** solely because lax normalization collided for different bodies.

# Non-Goals

- Multiple `inPage` calls in one line. Authors should split lines if needed.

# Desired Behavior

- Use line number as the synthetic key for each extracted function. 
- Throw an `MultiInPageCallsOnSameLineError` error when multiple `inPage` calls in one line. Advise authors to separate calls onto distinct lines.

# Design

## Implementation Details

- [ ] PR#1 — In `analyze.ts`, collect the line number:
```ts
const { line } = ctx.sourceFile.getLineAndCharacterOfPosition(
  inPageCall.node.getStart(ctx.sourceFile)
);
```
- [ ] PR#1 — Use `line:${line}` as extracted function name. (`line:` is more readable and we will remove `inPageWithNamedFunction` so no collisions).
- [ ] PR#1 — In `fixtures.ts`, instead of computing hashes, analyze the call stack and collect the `inPage` call line number:

<details>
<summary>Example</summary>

```ts
function _maybeCaptureParentCallLocation(): {
  filePath: string;
  line: number;
} | null {
  const error = new Error();
  /**
   * The stack trace is like this:
   * Error
   *     at _captureParentCallLocation
   *     at inPageWithNamedFunctionImpl
   *     at file:///Users/y/Desktop/demo.ts:1:1 <--- this is the line we want to capture
   */
  const stack = error.stack?.split('\n')[3];
  if (!stack) {
    return null;
  }
  const [filePath, lineStr] = stack
    .replace(/ +at file:\/\//, '')
    .trim()
    .split(':');
  const line = parseInt(lineStr);
  if (isNaN(line)) {
    return null;
  }
  return { filePath, line };
}
```

</details>

- [ ] PR#2 — If multiple extracted functions point to same file, throw `MultiInPageCallsOnSameLineError`. (In other words, rename `DuplicatedNamedFunctionsError` and rephrase error.)
- [ ] PR#3 — Remove anything related to lax hashing.
- [ ] PR#4 — Remove `inPageWithNamedFunction`.

# Testing Strategy

## `analyze`

### [ ] PR#1 — Extract line number

- Act: call `analyze` with

```ts
test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
});
```

- Assert: extracted function's name is `line:2`

### [ ] PR#1 — Extract different `inPage` calls

- Act: call `analyze` with

```ts

test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
  await inPage(() => console.log('Goodbye!'));
});
```

- Assert: extracted function are:
  - `{name: 'line:2', code: "() => console.log('Hello!')"}`
  - `{name: 'line:3', code: "() => console.log('Goodbye!')"}`

### [ ] PR#1 — Extract identical `inPage` calls

- Act: call `analyze` with

```ts
test('...', async ({inPage}) => {
  await inPage(() => console.log('Hello!'));
  await inPage(() => console.log('Hello!'));
});
```

- Assert: extracted function are:
  - `{name: 'line:2', code: "() => console.log('Hello!')"}`
  - `{name: 'line:3', code: "() => console.log('Hello!')"}`


### [ ] PR#1 — Use partial matching for all other tests

In all other tests, use partial matching to only match `code` and `importedIdentifiers`. Do not check the `name` field in all tests.

### [ ] PR#4 — Rewrite `extracts imported identifiers used in inPageWithNamedFunction` test using `inPage` only

### [ ] PR#3 — Remove following tests

- [ ] PR#3 — throws `LaxHashCollisionError` when two anonymous functions have same lax but different full hash
- [ ] PR#3 — checks for collision on fullhash but not source code (transpiler adds semicolons)
- [ ] PR#3 — does not throw if two anonymous functions have the same code
- [ ] PR#4 — extracts named `inPageWithNamedFunction`
- [ ] PR#4 — ALL TESTS STARTING WITH: fails if `inPageWithNamedFunction`

### [ ] PR#2 — Same-line duplicate anonymous `inPage`
- Act: call `analyze` with
```ts
test('...', async ({inPage}) => {
  const result = await inPage(() => null) ?? await inPage(() => 42);
});
```
- Assert: throws `MultiInPageCallsOnSameLineError` with message "Multiple `inPage` calls on the same line are not allowed. Please split them onto separate lines."  

## `extraction-writer.ts`

### [ ] PR#1 — Update all tests to use `line:${line}` in the testing data.

## Playwright `fixtures.ts` + runner integration

### [ ] PR#1 — Allow decorators

- Act: mount an inline component
```ts
test('...', async ({inPage}) => {
  await inPage(() => {
    @Component({template: '<h1>Hello!</h1>'})
    class Greetings {}
    return mount(Greetings);
  });
});
```
- Assert: Heading is "Hello!"

### [ ] PR#3 — Remove the following tests

- [ ] PR#3 — `tests/angular-wide/src/app/in-page-failing.pw.ts`
- [ ] PR#4 — `tests/angular-wide/src/app/in-page-with-named-__lax__-function.pw.ts`
- [ ] PR#4 — `tests/angular-wide/src/app/in-page-with-named-function.pw.ts`
- [ ] PR#4 — `tests/angular-wide/src/app/in-page-with-named-function-errors.pw.ts`

# PR Plan

```mermaid
flowchart TD
  PR1["PR1 Line-based `inPage`"]
  PR2["PR2 MultiInPageCallsOnSameLineError"]
  PR3["PR3 Remove lax hashing remains"]
  PR4["PR4 Remove `inPageWithNamedFunction`]

  PR1 --> PR2
  PR1 --> PR3
```

## PR1 — Line-based `inPage`

- Replace lax hashing with line-based `inPage`, but do not remove code related to lax hashing.


## PR2 — `MultiInPageCallsOnSameLineError`

## PR3 — Remove lax hashing remains

Remove anything related to lax hashing

## PR4 - Remove `inPageWithNamedFunction`

Remove `inPageWithNamedFunction` and all related code.

# Alternatives Considered

-

# Kitchen Sink

-
