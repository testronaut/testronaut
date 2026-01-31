# Running Code in the Browser: `inPage` API

Testronaut provides two functions for running code directly in the browser context:

- **`inPage`** - The recommended approach for most use cases
- **`inPageWithNamedFunction`** - A last resort for rare scenarios requiring explicit function naming

## `inPage` (Recommended)

The `inPage` function is the standard way to execute code in the browser context. It supports two signatures:

### Basic Usage

```ts
test('example', async ({ page, inPage }) => {
  await inPage(() => {
    document.body.textContent = 'Hello!';
  });

  await expect(page.getByText('Hello!')).toBeVisible();
});
```

### With Data

You can pass data to the browser function:

```ts
test('with data', async ({ page, inPage }) => {
  await inPage({ name: 'World' }, ({ name }) => {
    document.body.textContent = `Hello ${name}!`;
  });

  await expect(page.getByText('Hello World!')).toBeVisible();
});
```

## `inPageWithNamedFunction` (Last Resort)

**Warning: This should only be used as a last resort.**

The `inPageWithNamedFunction` function requires an explicit function name as the first argument. This name serves as a unique identifier for the function.

### When to Use

Use `inPageWithNamedFunction` only when you need to perform **multiple distinct browser actions within the same test file** that need to be uniquely identified at runtime.

Common scenarios:
- Multiple `mount` calls in the same test file
- Tests that combine `mount` with additional `inPage` calls
- Complex test setups where anonymous functions would conflict

### Basic Usage

```ts
test('example', async ({ page, inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('setup-dom', () => {
    document.body.textContent = 'Hello!';
  });

  await expect(page.getByText('Hello!')).toBeVisible();
});
```

### With Data

```ts
test('with data', async ({ page, inPageWithNamedFunction }) => {
  await inPageWithNamedFunction('greet-user', { name: 'World' }, ({ name }) => {
    document.body.textContent = `Hello ${name}!`;
  });

  await expect(page.getByText('Hello World!')).toBeVisible();
});
```

## Why Prefer `inPage`?

The anonymous `inPage` variant is preferred because:

1. **Simpler API** - No need to think about naming
2. **Less Error-Prone** - No risk of duplicate function names
3. **Better Developer Experience** - Just write the function, Testronaut handles the rest

The named `inPageWithNamedFunction` variant exists for backward compatibility and edge cases where explicit naming is unavoidable. In most tests, you should never need it.

## Migration Guide

If you were previously using named `inPage` calls like this:

```ts
// Old API (no longer supported)
await inPage('my-function', () => { ... });
```

You should now use:

```ts
// New API
await inPageWithNamedFunction('my-function', () => { ... });
```

Or, better yet, refactor to use the anonymous `inPage` if possible:

```ts
// Recommended
await inPage(() => { ... });
```
