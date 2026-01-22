import {
  FileDoesNotExistError,
  FileExistsError,
  FileSystem,
  WriteFileOptions,
} from './file-system';

export class FileSystemFake implements FileSystem {
  private _files: Record<string, FileEntry> = {};

  /*
   * Fake specific methods.
   */

  configure(files: Record<string, FileEntry>) {
    this._files = files;
  }

  getFiles(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [path, file] of Object.entries(this._files)) {
      result[path] = file.content;
    }
    return result;
  }

  /*
   * FileSystem methods.
   */

  async readFile(path: string): Promise<string> {
    const file = this._files[path];

    if (file === undefined) {
      throw new FileDoesNotExistError(path);
    }

    return file.content;
  }

  maybeGetLastModifiedDate(path: string): Date | undefined {
    return this._files[path]?.lastModified;
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
    if (this._files[path] && !overwrite) {
      throw new FileExistsError(path);
    }

    this._files[path] = {
      content,
      lastModified: new Date(),
    };
  }
}

interface FileEntry {
  content: string;
  lastModified: Date;
}
