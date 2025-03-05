export interface FileSystem {
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

export class FileExistsError extends Error {
  override name = 'FileExistsError';

  constructor(path: string) {
    super(`File already exists at path: ${path}`);
  }
}
