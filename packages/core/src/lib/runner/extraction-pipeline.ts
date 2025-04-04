import { readFile } from 'node:fs/promises';
import { analyze } from '../analyzer/analyze';
import { ExtractionConfig } from '../extraction-writer/extraction-config';
import { ExtractionWriter } from '../extraction-writer/extraction-writer';
import { createFileInfo, FileInfo } from './file-info';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;

  constructor(config: ExtractionConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
  }

  init() {
    this.#extractionWriter.init();
  }

  async extract(path: string): Promise<FileInfo> {
    const content = await readFile(path, 'utf-8');

    const analysis = analyze({ path, content });

    await this.#extractionWriter.write(analysis);

    return createFileInfo({
      path: analysis.path,
      hash: analysis.hash,
    });
  }
}
