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
  }: {
    hash: string;
    functionName: string;
  }) {
    await this.waitUntilHashIsAvailable(hash);

    // execute the function in the browser context
    await this.page.evaluate(
      async ({ functionName, hash }) => {
        const module = await (globalThis as unknown as ExtractionUnitRecord)[
          hash
        ]();
        return module.extractedFunctionsMap[functionName]();
      },
      { functionName, hash }
    );
  }

  private waitUntilHashIsAvailable(hash: string) {
    return expect(() => {
      this.page
        .waitForFunction(({ hash }) => hash in globalThis, {
          hash,
        })
        .catch(async (error) => {
          await this.page.reload();
          throw error;
        });
    }).toPass({
      intervals: [100, 500, 1_000, 2_000, 3_000],
      timeout: 5_000,
    });
  }
}

type ExtractionUnitRecord = Record<
  string,
  () => Promise<{ extractedFunctionsMap: Record<string, () => void> }>
>;
