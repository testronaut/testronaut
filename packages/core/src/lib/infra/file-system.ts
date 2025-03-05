export interface FileSystem {
  /**
   * @throws {FileDoesNotExistError} if file does not exist at path.
   */
  readFile(path: string): Promise<string>;

  /**
   * @throws {FileExistsError} if file already exists at path.
   * This error is never thrown if `options.overwrite` is set to `true`.
   */
  writeFile(
    path: string,
    content: string,
    options?: WriteFileOptions
  ): Promise<void>;
}

export interface WriteFileOptions {
  overwrite?: boolean;
}

export class FileDoesNotExistError extends Error {
  override name = 'FileDoesNotExistError';

  constructor(path: string) {
    super(`File does not exist at path: ${path}`);
  }
}

export class FileExistsError extends Error {
  override name = 'FileExistsError';

  constructor(path: string) {
    super(`File already exists at path: ${path}`);
  }
}
