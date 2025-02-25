import { FileSystem } from './file-system';

export class FileSystemFake implements FileSystem {
  #files: Record<string, string> = {};

  async writeFile(path: string, content: string): Promise<void> {
    this.#files[path] = content;
  }

  getFiles(): Record<string, string> {
    return this.#files;
  }
}
