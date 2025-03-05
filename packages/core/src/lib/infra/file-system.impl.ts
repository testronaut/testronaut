import { FileSystem } from './file-system';

export class FileSystemImpl implements FileSystem {
  /**
   * @deprecated 🚧 work in progress
   */
  async readFile(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async writeFile(): Promise<void> {
    throw new Error('🚧 work in progress');
  }
}
