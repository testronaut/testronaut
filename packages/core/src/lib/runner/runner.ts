import { ExtractionPipeline } from './extraction-pipeline';
import { PageAdapter } from './page-adapter';
import { RunnerConfig } from './runner-config';

export class Runner {
  readonly #extractionPipeline: ExtractionPipeline;
  readonly #pageAdapter: PageAdapter;

  constructor({
    pageAdapter,
    ...config
  }: RunnerConfig & {
    pageAdapter: PageAdapter;
  }) {
    this.#extractionPipeline = new ExtractionPipeline(config);
    this.#pageAdapter = pageAdapter;
  }

  init() {
    this.#extractionPipeline.init();
  }

  async extract(filePath: string) {
    return this.#extractionPipeline.extract(filePath);
  }

  async runInBrowser({
    hash,
    functionName,
  }: {
    hash: string;
    functionName: string;
  }) {
    await this.#pageAdapter.waitForFunctionAndReload(
      // @ts-expect-error no index signature
      ({ hash }) => globalThis[hash],
      { hash }
    );

    await this.#pageAdapter.evaluate(
      async ({ functionName, hash }) => {
        // @ts-expect-error no index signature
        const module = await globalThis[hash]();
        return module.extractedFunctionsMap[functionName]();
      },
      { functionName, hash }
    );
  }
}
