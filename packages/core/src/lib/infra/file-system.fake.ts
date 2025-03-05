import { FileExistsError, FileSystem, WriteFileOptions } from './file-system';

export class FileSystemFake implements FileSystem {
  #files: Record<string, string> = {};

  async writeFile(
    path: string,
    content: string,
    { overwrite = false }: WriteFileOptions = {}
  ): Promise<void> {
    if (this.#files[path] && !overwrite) {
      throw new FileExistsError(path);
    }

    this.#files[path] = content;
  }

  getFiles(): Record<string, string> {
    return this.#files;
  }
}
