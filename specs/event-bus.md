# Goals

Create a mechanism to allow the code in `runInBrowser` to emit events to the test runner.

# Desired Behavior

## Provide a new `getEventBus` function

```ts
const { events } = await runInBrowser(() => {
  const eventBus = getEventBus<{ a: string; b: boolean }>();

  eventBus.emit('a', 'hello');
  setTimeout(() => {
    eventBus.emit('b', true);
  }, 1000);

  return {
    events: eventBus.events,
  };
});

console.log(events.a.calls); // ['hello']
console.log(events.b.calls); // []

// 1 second later...
console.log(events.b.calls); // [true]
```

## Use the new `getEventBus` function in the `mount` function which is in the `@testronaut/angular` package `browser.ts`.

The `mount` function is in the `@testronaut/angular` package `browser.ts` and returns: `{outputs: eventBus.events}`

# Design

## Implementation Details

- Add a `browser` entrypoint to the `@testronaut/core` package.
- Put the `getEventBus` function in the `browser` entrypoint.
- The `runInBrowser` fixture exposes a global variable `__TESTRONAUT_EVENT_BUS` (symbol) to the browser. It is actually a function.
- `getEventBus` actually calls a global variable `__TESTRONAUT_EVENT_BUS` (symbol). It is actually a function exposed by the Playwright fixture `runInBrowser`.
- `getEventBus`'s `events` property has a magic property that allows us to detect that the value returned by the browser is an `EventBus#events` object.
- The `runInBrowser` fixture dynamically detects if any property in the value returned by the browser is an `EventBus#events` object. If it is, then `runInBrowser` should update the mutable `events` object with the events emitted by the code in the browser through the function exposed as a global variable `__TESTRONAUT_EVENT_BUS` to the browser.

