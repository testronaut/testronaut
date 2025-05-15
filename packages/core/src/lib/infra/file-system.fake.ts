import {
  FileDoesNotExistError,
  FileExistsError,
  FileSystem,
  WriteFileOptions,
} from './file-system';

export class FileSystemFake implements FileSystem {
  #files: Record<string, string> = {};

  async readFile(path: string): Promise<string> {
    const content = this.#files[path];

    if (content === undefined) {
      throw new FileDoesNotExistError(path);
    }

    return content;
  }

  async writeFile(
    path: string,
    content: string,
    options: WriteFileOptions = {}
  ): Promise<void> {
    this.writeFileSync(path, content, options);
  }

  writeFileSync(
    path: string,
    content: string,
    { overwrite }: WriteFileOptions = {}
  ): void {
    if (this.#files[path] && !overwrite) {
      throw new FileExistsError(path);
    }

    this.#files[path] = content;
  }

  getFiles(): Record<string, string> {
    return this.#files;
  }
}
