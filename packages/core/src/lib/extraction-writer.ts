import { FileAnalysis } from './file-analysis';
import { FileSystem } from './infra/file-system';
import { FileSystemImpl } from './infra/file-system.impl';

/**
 * @deprecated 🚧 work in progress
 */
export class ExtractionWriter {
  // eslint-disable-next-line no-unused-private-class-members
  #projectRoot: string;
  // eslint-disable-next-line no-unused-private-class-members
  #destPath: string;
  // eslint-disable-next-line no-unused-private-class-members
  #fileSystem: FileSystem;

  constructor({
    projectRoot,
    destPath,
    fileSystem = new FileSystemImpl(),
  }: {
    projectRoot: string;
    destPath: string;
    fileSystem?: FileSystem;
  }) {
    this.#projectRoot = projectRoot;
    this.#destPath = destPath;
    this.#fileSystem = fileSystem;
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async init() {
    throw new Error('🚧 work in progress');
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async write(fileAnalysis: FileAnalysis) {
    throw new Error('🚧 work in progress');
  }
}
