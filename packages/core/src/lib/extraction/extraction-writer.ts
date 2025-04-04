import { ExtractionConfig } from './extraction-config';
import { join } from 'node:path/posix';
import { TmpFileOps } from './tmp-file-ops';

export class ExtractionWriter {
  readonly #config: ExtractionConfig;
  readonly #fileOps = new TmpFileOps();
  constructor(config: ExtractionConfig) {
    this.#config = config;
  }

  init() {
    this.#fileOps.createFileIfNotExistsSync(
      join(this.#config.projectRoot, this.#config.extractionDir, 'index.ts')
    );
  }
}
