import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { analyze } from '../analyzer/analyze';
import { ExtractionConfig } from '../extraction-writer/extraction-config';
import { ExtractionWriter } from '../extraction-writer/extraction-writer';
import { createFileInfo, FileInfo } from './file-info';
import { TmpExtractionWriter } from './tmp-extraction-writer';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;
  readonly #tmpExtractionWriter: TmpExtractionWriter;

  constructor(config: ExtractionConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
    this.#tmpExtractionWriter = new TmpExtractionWriter(config);
  }

  init() {
    this.#extractionWriter.init();
  }

  async extract(path: string): Promise<FileInfo> {
    const content = await readFile(path, 'utf-8');

    const extractedFunctions = analyze({
      path,
      content,
    });

    const fileInfo = createFileInfo({ hash: this.#computeHash(content), path });

    await this.#tmpExtractionWriter.write({
      ...fileInfo,
      extractedFunctions,
    });

    return fileInfo;
  }

  #computeHash(content: string) {
    return createHash('sha256').update(content).digest('base64').slice(0, 8);
  }
}
