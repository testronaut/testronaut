import {
  FileDoesNotExistError,
  FileExistsError,
  FileSystem,
} from '../infra/file-system';

/**
 * A collection of convenient file operations wrapping the file system.
 */
export class FileOps {
  readonly #fileSystem: FileSystem;

  constructor({ fileSystem }: { fileSystem: FileSystem }) {
    this.#fileSystem = fileSystem;
  }

  /**
   * Replace any line containing `match` with `replacement` in the file at `path`.
   *
   * @param path The path to the file to modify.
   * @param match The string to match in the file.
   * @param replacement The string to replace the matched line with.
   */
  async upsertLine({
    path,
    match,
    replacement,
  }: {
    path: string;
    match: string;
    replacement: string;
  }) {
    const content = await this.#tryReadFile(path);
    const lines = content?.split('\n') ?? [];

    let replaced = false;

    const newLines = lines.map((line) => {
      if (line.includes(match)) {
        replaced = true;
        return replacement;
      }
      return line;
    });

    if (!replaced) {
      newLines.push(replacement);
    }

    await this.#fileSystem.writeFile(path, newLines.join('\n'), {
      overwrite: true,
    });
  }

  createFileIfNotExistsSync(path: string, content: string) {
    try {
      this.#fileSystem.writeFileSync(path, content);
    } catch (error) {
      if (error instanceof FileExistsError) {
        return;
      }
      throw error;
    }
  }

  async #tryReadFile(path: string): Promise<string | null> {
    try {
      return await this.#fileSystem.readFile(path);
    } catch (error) {
      if (error instanceof FileDoesNotExistError) {
        return null;
      }
      throw error;
    }
  }
}
