import { expect, type Page } from '@playwright/test';
import { ExtractionPipeline } from './extraction-pipeline';

type RunInBrowserParams = {
  name: string | undefined;
  tokenHash: string | undefined;
  tokens: string[];
  hash: string;
  data: Record<string, unknown>;
  fn: () => unknown;
};

type EvaluatePayload = {
  name: string | undefined;
  tokenHash: string | undefined;
  hash: string;
  data: Record<string, unknown>;
  errorMessages: Record<'anonymous' | 'named', string>;
};

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

  async runInBrowser({
    hash,
    name,
    tokenHash,
    tokens,
    data,
    fn,
  }: RunInBrowserParams) {
    await this.waitUntilHashIsAvailable(hash);

    /* Execute the function in the browser context and return the result. */
    return await this.#page.evaluate(
      async ({
        name,
        tokenHash,
        hash,
        data,
        errorMessages,
      }: EvaluatePayload) => {
        const module = await (globalThis as unknown as ExtractionUnitRecord)[
          hash
        ]();
        const record = module.extractedFunctionsRecord;
        const extractedFn = name
          ? record.named[name]
          : (tokenHash && record.anonymous[tokenHash]) ?? null;
        if (!extractedFn) {
          throw new Error(
            errorMessages[name ? 'named' : 'anonymous'] +
              '\n\n' +
              JSON.stringify(record, null, 2)
          );
        }
        return extractedFn(data);
      },
      {
        name,
        tokenHash,
        hash,
        data,
        errorMessages: this.#getErrorMessages(name ?? '', fn, tokens),
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

  #getErrorMessages(
    name: string,
    fn: () => unknown,
    tokens: string[]
  ): Record<'anonymous' | 'named', string> {
    return {
      anonymous: `Function not found:
${fn.toString()}

Please assign a unique name to it in \`runInBrowser\`, e.g., \`runInBrowser('my-name', () => { ... });\` 
and report this as a bug at https://github.com/testronaut/testronaut/issues/new.

Copy & paste the following text into the issue:
=================================================
Testronaut's matcher failed to find the anonymous function in the code.

The original function was:
${fn.toString()}

The generated tokens were
[${tokens.map((token) => `'${token}'`).join(', ')}]
=================================================`,
      named: `Function named "${name}" not found.

Function:
${fn.toString()}

This should not happen. Please report: https://github.com/testronaut/testronaut/issues/new.

Copy & paste the following text into the issue:
=================================================
Testronaut's matcher failed to find the named function in the code.

The original function was:
${fn.toString()}

The function name was: ${name}
=================================================
`,
    };
  }
}

type ExtractionUnitRecord = Record<
  string,
  () => Promise<{
    extractedFunctionsRecord: {
      anonymous: Record<string, (data?: Record<string, unknown>) => unknown>;
      named: Record<string, (data?: Record<string, unknown>) => unknown>;
    };
  }>
>;
