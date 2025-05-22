import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { analyze } from '../analyzer/analyze';
import { createFileData } from '../analyzer/core';
import { Transform } from '../analyzer/transform';
import { assertNoDuplicateExtractedFunctions } from '../core/assert-no-duplicate-extracted-functions';
import {
  ExtractionWriter,
  ExtractionWriterConfig,
} from '../extraction-writer/extraction-writer';
import { createFileInfo, FileInfo } from './file-info';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;
  readonly #transforms?: Transform[];

  constructor({ transforms, ...config }: ExtractionPipelineConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
    this.#transforms = transforms;
  }

  init() {
    this.#extractionWriter.init();
  }

  async extract(path: string): Promise<FileInfo> {
    const content = await readFile(path, 'utf-8');

    const fileAnalysis = analyze({
      fileData: createFileData({
        path,
        content,
      }),
      transforms: this.#transforms,
    });

    /* TODO: it's cheap to just throw an error here.
     * Later, we'll have to extract the errors so that we can throw them
     * when `runInBrowser` is called in the test.*/
    assertNoDuplicateExtractedFunctions(fileAnalysis);

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
