import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path/posix';
import { ExtractedFunction } from '../extracted-function';
import { ExtractionConfig } from '../extraction/extraction-config';

/**
 * TODO: replace this with `ExtractionWriter` from https://github.com/playwright-ct/playwright-ct/pull/4
 */
export class TmpExtractionWriter {
  #config: ExtractionConfig;

  constructor(config: ExtractionConfig) {
    this.#config = config;
  }

  async write(analysis: FileAnalysis) {
    const relativePath = relative(this.#config.projectRoot, analysis.path);
    const destPath = join(
      this.#config.projectRoot,
      this.#config.extractionDir,
      relativePath
    );

    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(
      destPath,
      `
export const extractedFunctionsMap = {
  '': ${analysis.extractedFunctions[0].code},
};
    `,
      'utf-8'
    );

    await writeFile(
      join(this.#config.projectRoot, this.#config.extractionDir, 'index.ts'),
      `
// This file is auto-generated. Do not edit it directly.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

globalThis['${analysis.hash}'] = () => import('./${relativePath}');
      `,
      'utf-8'
    );
  }
}

interface FileAnalysis {
  path: string;
  hash: string;
  extractedFunctions: ExtractedFunction[];
}
