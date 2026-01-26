/**
 * The global variable name used by Testronaut to expose the event bus function.
 */
export const EVENT_BUS_VARIABLE_NAME = '__TESTRONAUT_EVENT_BUS';

/**
 * Marker key used to identify EventBus#events objects.
 * Using a string key instead of a Symbol because Playwright's page.evaluate
 * cannot serialize Symbols across the browser/Node boundary.
 */
export const EVENT_BUS_MARKER = '__TESTRONAUT_EVENT_BUS_MARKER__';

/**
 * Represents the events emitted by the EventBus.
 */
export type EventsBuffer<T extends Record<string, unknown>> = {
  [K in keyof T]: {
    calls: T[K][];
  };
};

/**
 * The EventBus interface for emitting events from browser code.
 */
export interface EventBus<T extends Record<string, unknown>> {
  emit<K extends keyof T>(event: K, value: T[K]): void;
  events: EventsBuffer<T>;
}

/**
 * Internal type for the global event bus function exposed by the runInBrowser fixture.
 */
type EventBusGlobalFn = (eventName: string, value: unknown) => void;

/**
 * Returns an EventBus instance that can be used to emit events from browser code
 * running in `runInBrowser` back to the test runner.
 *
 * @example
 * ```ts
 * const { events } = await runInBrowser(() => {
 *   const eventBus = getEventBus<{ a: string; b: boolean }>();
 *
 *   eventBus.emit('a', 'hello');
 *   setTimeout(() => {
 *     eventBus.emit('b', true);
 *   }, 1000);
 *
 *   return {
 *     events: eventBus.events,
 *   };
 * });
 *
 * console.log(events.a.calls); // ['hello']
 * console.log(events.b.calls); // []
 *
 * // 1 second later...
 * console.log(events.b.calls); // [true]
 * ```
 */
export function getEventBus<T extends Record<string, unknown>>(): EventBus<T> {
  const g = globalThis as typeof globalThis & {
    [EVENT_BUS_VARIABLE_NAME]?: EventBusGlobalFn;
  };

  const globalEventBusFn = g[EVENT_BUS_VARIABLE_NAME];
  if (!globalEventBusFn) {
    throw new Error(
      `getEventBus() must be called inside runInBrowser(). ` +
        `The global ${EVENT_BUS_VARIABLE_NAME} function is not available.`
    );
  }

  const events = { [EVENT_BUS_MARKER]: true as const } as EventsBuffer<T>;

  return {
    emit<K extends keyof T>(eventName: K, value: T[K]) {
      /* Notify the test runner. */
      globalEventBusFn(eventName as string, value);
    },
    events,
  };
}

/**
 * Checks if the given value is an EventBus#events object.
 */
export function isEventBusEvents(
  value: unknown
): value is EventsBuffer<Record<string, unknown>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    EVENT_BUS_MARKER in value &&
    (value as Record<string, unknown>)[EVENT_BUS_MARKER] === true
  );
}
