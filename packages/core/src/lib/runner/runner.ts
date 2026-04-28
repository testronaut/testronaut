import { expect, type Page } from '@playwright/test';
import { ExtractionPipeline } from './extraction-pipeline';
import type { FileHash } from './file-info';

export class Runner {
  #extractionPipeline: ExtractionPipeline;
  #page: Page;

  constructor(extractionPipeline: ExtractionPipeline, page: Page) {
    this.#extractionPipeline = extractionPipeline;
    this.#page = page;
  }

  async extract(filePath: string) {
    return this.#extractionPipeline.extract(filePath);
  }

  async inPage(
    fileHash: FileHash,
    functionName: string,
    data: Record<string, unknown>
  ) {
    await this.waitUntilFileHashIsAvailable(fileHash);

    /* Execute the function in the browser context and return the result. */
    return await this.#page.evaluate(
      async ({ functionName, fileHash, data }) => {
        const module = await (globalThis as unknown as ExtractionUnitRecord)[
          fileHash
        ]();
        return module.extractedFunctionsRecord[functionName](data);
      },
      { functionName, fileHash, data }
    );
  }

  private waitUntilFileHashIsAvailable(fileHash: FileHash) {
    let timeout = 100;
    return expect(async () => {
      try {
        await this.#page.waitForFunction(
          ({ fileHash }) => fileHash in globalThis,
          { fileHash },
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
  FileHash,
  () => Promise<{
    extractedFunctionsRecord: Record<
      string,
      (data?: Record<string, unknown>) => void
    >;
  }>
>;
