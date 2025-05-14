import { ExtractionConfig } from './extraction-config';
import { join } from 'node:path/posix';
import { TmpFileOps } from './tmp-file-ops';

export class ExtractionWriter {
  readonly #config: ExtractionConfig;
  readonly #extractionDir: string;
  readonly #fileOps = new TmpFileOps();
  constructor(config: ExtractionConfig) {
    this.#config = config;
    this.#extractionDir = config.extractionDir ?? 'generated';
  }

  init() {
    this.#fileOps.createFileIfNotExistsSync(
      join(this.#config.projectRoot, this.#extractionDir, 'index.ts')
    );
  }
}
