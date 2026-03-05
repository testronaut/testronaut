export interface FileSystem {
  /**
   * @throws {FileDoesNotExistError} if file does not exist at path.
   */
  readFile(path: string): Promise<string>;

  /**
   * Returns the last modified date of the file at the given path, or `undefined` if the file does not exist.
   */
  maybeGetLastModifiedDate(path: string): Date | undefined;

  /**
   * @throws {FileExistsError} if file already exists at path.
   * This error is never thrown if `options.overwrite` is set to `true`.
   */
  writeFile(
    path: string,
    content: string,
    options?: WriteFileOptions
  ): Promise<void>;

  /**
   * @throws {FileExistsError} if file already exists at path.
   * This error is never thrown if `options.overwrite` is set to `true`.
   */
  writeFileSync(
    path: string,
    content: string,
    options?: WriteFileOptions
  ): void;
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
