import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path/posix';
import { ExtractedFunction } from '../extracted-function';
import { ExtractionConfig } from '../extraction-writer/extraction-config';

/**
 * TODO: replace this with `ExtractionWriter` from https://github.com/playwright-ct/playwright-ct/pull/4
 */
export class TmpExtractionWriter {
  readonly #extractionDir: string;
  readonly #projectRoot: string;

  constructor(config: ExtractionConfig) {
    this.#projectRoot = config.projectRoot;
    this.#extractionDir = config.extractionDir ?? 'generated';
  }

  async write(analysis: FileAnalysis) {
    const relativePath = relative(this.#projectRoot, analysis.path);
    const destPath = join(this.#projectRoot, this.#extractionDir, relativePath);

    await mkdir(dirname(destPath), { recursive: true });

    await writeFile(
      destPath,
      `
export const extractedFunctionsMap = {
  ${analysis.extractedFunctions
    .map((fn) => `'${fn.name ?? ''}': ${fn.code},`)
    .join('\n')}
};
    `,
      'utf-8'
    );

    await writeFile(
      join(this.#projectRoot, this.#extractionDir, 'index.ts'),
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
