import { expect, Page } from '@playwright/test';
import { ExtractionPipeline } from './extraction-pipeline';

export class Runner {
  constructor(
    private extractionPipeline: ExtractionPipeline,
    private page: Page
  ) {}

  async extract(filePath: string) {
    return this.extractionPipeline.extract(filePath);
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

    /* Execute the function in the browser context. */
    await this.page.evaluate(
      async ({ functionName, hash, data }) => {
        const module = await (globalThis as unknown as ExtractionUnitRecord)[
          hash
        ]();
        return module.extractedFunctionsRecord[functionName](data);
      },
      { functionName, hash, data }
    );
  }

  private waitUntilHashIsAvailable(hash: string) {
    let timeout = 100;
    return expect(async () => {
      try {
        await this.page.waitForFunction(
          ({ hash }) => hash in globalThis,
          { hash },
          { timeout }
        );
      } catch (error) {
        /* Exponential backoff.
         * We don't want to retry too fast as maybe the page is too slow to load. */
        timeout *= 2;

        /* Reload on failure. */
        await this.page.reload();

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
      (data?: Record<string, unknown>) => void
    >;
  }>
>;
