import { readFile } from 'node:fs/promises';
import { h32 } from 'xxhashjs';
import { analyze } from '../analyzer/analyze';
import { createFileData } from '../analyzer/core';
import {
  ExtractionWriter,
  type ExtractionWriterConfig,
} from '../extraction-writer/extraction-writer';
import { createFileInfo, toFileHash, type FileInfo } from './file-info';

export class ExtractionPipeline {
  readonly #extractionWriter: ExtractionWriter;

  constructor(config: ExtractionPipelineConfig) {
    this.#extractionWriter = new ExtractionWriter(config);
  }

  async extract(path: string): Promise<FileInfo> {
    const content = await readFile(path, 'utf-8');

    const fileAnalysis = analyze(
      createFileData({
        path,
        content,
      })
    );

    const fileInfo = createFileInfo({
      fileHash: toFileHash(this.#computeFileHash(content)),
      path,
    });

    await this.#extractionWriter.write(fileAnalysis);

    return fileInfo;
  }

  #computeFileHash(content: string) {
    return h32(content, 0).toString(16).padStart(8, '0');
  }
}

export type ExtractionPipelineConfig = ExtractionWriterConfig;
