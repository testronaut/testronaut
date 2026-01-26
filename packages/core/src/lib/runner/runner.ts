import { expect, type Page } from '@playwright/test';
import {
  EVENT_BUS_MARKER,
  EVENT_BUS_VARIABLE_NAME,
  type EventsBuffer,
} from '../../browser';
import { ExtractionPipeline } from './extraction-pipeline';

export class Runner {
  #extractionPipeline: ExtractionPipeline;
  #page: Page;
  #eventBusExposed = false;

  constructor(extractionPipeline: ExtractionPipeline, page: Page) {
    this.#extractionPipeline = extractionPipeline;
    this.#page = page;
  }

  async extract(filePath: string) {
    return this.#extractionPipeline.extract(filePath);
  }

  async runInBrowser({
    hash,
    functionName,
    data,
  }: {
    hash: string;
    functionName: string;
    data: Record<string, unknown>;
  }) {
    await this.waitUntilHashIsAvailable(hash);

    const eventsBuffer = this.#createEventsBuffer();

    /* Register listener for the EventBus#events object. */
    const eventBusListener = (eventName: string, value: unknown) => {
      eventsBuffer[eventName] = eventsBuffer[eventName] ?? { calls: [] };
      eventsBuffer[eventName].calls = [...eventsBuffer[eventName].calls, value];
    };

    /* Expose the event bus function to the browser (only once per page). */
    if (!this.#eventBusExposed) {
      await this.#page.exposeFunction(
        EVENT_BUS_VARIABLE_NAME,
        eventBusListener
      );
      this.#eventBusExposed = true;
    }

    /* Execute the function in the browser context and return the result. */
    const result = await this.#page.evaluate(
      async ({ functionName, hash, data }) => {
        const module = await (globalThis as unknown as ExtractionUnitRecord)[
          hash
        ]();
        return module.extractedFunctionsRecord[functionName](data);
      },
      { functionName, hash, data }
    );

    /* Find EventBus#events objects at the root level of the result. */
    const eventBusEventsKeys: string[] = [];

    if (typeof result === 'object' && result !== null) {
      for (const key of Object.keys(result)) {
        const value = (result as Record<string, unknown>)[key];
        if (
          typeof value === 'object' &&
          value !== null &&
          EVENT_BUS_MARKER in value &&
          (value as Record<string, unknown>)[EVENT_BUS_MARKER] === true
        ) {
          eventBusEventsKeys.push(key);
        }
      }
    }

    /* Only one EventBus#events object is supported. */
    if (eventBusEventsKeys.length > 1) {
      throw new Error(
        `Only one EventBus#events object is supported per result, but found ${
          eventBusEventsKeys.length
        }: ${eventBusEventsKeys.join(', ')}`
      );
    }

    /* Process EventBus#events object found in the result.
     * Replace it with a mutable object that gets updated when events are emitted. */
    if (eventBusEventsKeys.length === 1) {
      const key = eventBusEventsKeys[0];
      (result as Record<string, unknown>)[key] = eventsBuffer;
    }

    return result;
  }

  #createEventsBuffer(): EventsBuffer<Record<string, unknown>> {
    const eventsData: Record<string, { calls: unknown[] }> = {};

    return new Proxy(
      {},
      {
        get(target, prop) {
          const key = prop as string;
          if (!(key in eventsData)) {
            eventsData[key] = { calls: [] };
          }
          return eventsData[key];
        },
        set(target, prop, newValue: { calls: unknown[] }) {
          const key = prop as string;
          eventsData[key] = newValue;
          return true;
        },
        ownKeys() {
          return Object.keys(eventsData);
        },
        getOwnPropertyDescriptor(target, prop) {
          if (prop in eventsData) {
            return { enumerable: true, configurable: true };
          }
          return undefined;
        },
      }
    );
  }

  private waitUntilHashIsAvailable(hash: string) {
    let timeout = 100;
    return expect(async () => {
      try {
        await this.#page.waitForFunction(
          ({ hash }) => hash in globalThis,
          { hash },
          { timeout }
        );
      } catch (error) {
        /* Exponential backoff.
         * We don't want to retry too fast as maybe the page is too slow to load. */
        timeout *= 2;

        /* Reload on failure. */
        await this.#page.reload();

        throw error;
      }
    }).toPass({ timeout: 5_000 });
  }
}

type ExtractionUnitRecord = Record<
  string,
  () => Promise<{
    extractedFunctionsRecord: Record<
      string,
      (data?: Record<string, unknown>) => unknown
    >;
  }>
>;
