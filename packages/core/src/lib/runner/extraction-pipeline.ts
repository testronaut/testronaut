import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Analyzer } from '../analyzer/analyzer';
import { type Transform } from '../analyzer/transform';
import {
  ExtractionWriter,
  type ExtractionWriterConfig,
} from '../extraction-writer/extraction-writer';
import { createFileInfo, type FileInfo } from './file-info';
import { assertNoDuplicateExtractedFunctions } from '../core/assert-no-duplicate-extracted-functions';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;
  readonly #transforms?: Transform[];
  readonly #analyzer = new Analyzer();

  constructor({ transforms, ...config }: ExtractionPipelineConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
    this.#transforms = transforms;
  }

  async extract(path: string): Promise<FileInfo> {
    const content = await readFile(path, 'utf-8');

    // Step 1: Analyze - Extract raw TypeScript code
    const fileAnalysis = this.#analyzer.analyze(
      {
        path,
        content,
      },
      this.#transforms ?? []
    );

    /* TODO: it's cheap to just throw an error here.
     * Later, we'll have to extract the errors so that we can throw them
     * when `runInBrowser` is called in the test.
     * 
    /* Step 2: Assert no duplicate extracted functions. */
    assertNoDuplicateExtractedFunctions(fileAnalysis);

    /* Step 3: Write the extracted functions to the file system. */
    const fileInfo = createFileInfo({ hash: this.#computeHash(content), path });
    await this.#extractionWriter.write(fileAnalysis);

    return fileInfo;
  }

  #computeHash(content: string) {
    return createHash('sha256').update(content).digest('base64').slice(0, 8);
  }
}

export interface ExtractionPipelineConfig extends ExtractionWriterConfig {
  transforms?: Transform[];
}
