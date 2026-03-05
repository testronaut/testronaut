import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  FileExistsError,
  type FileSystem,
  type WriteFileOptions,
} from './file-system';

export class FileSystemImpl implements FileSystem {
  async readFile(path: string): Promise<string> {
    return readFile(path, 'utf-8');
  }

  maybeGetLastModifiedDate(path: string): Date | undefined {
    try {
      return statSync(path).mtime;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return undefined;
      }
      throw error;
    }
  }

  async writeFile(
    path: string,
    content: string,
    options: WriteFileOptions = {}
  ): Promise<void> {
    const { mkdirArgs, writeArgs } = this.#prepareWrite(path, content, options);
    await mkdir(...mkdirArgs);
    try {
      await writeFile(...writeArgs);
    } catch (error) {
      this.#convertError({ error, path });
    }
  }

  writeFileSync(
    path: string,
    content: string,
    options: WriteFileOptions = {}
  ): void {
    const { mkdirArgs, writeArgs } = this.#prepareWrite(path, content, options);
    mkdirSync(...mkdirArgs);
    try {
      writeFileSync(...writeArgs);
    } catch (error) {
      this.#convertError({ error, path });
    }
  }

  #prepareWrite(
    path: string,
    content: string,
    { overwrite }: WriteFileOptions
  ) {
    const folderPath = dirname(path);
    return {
      mkdirArgs: [folderPath, { recursive: true }] as const,
      writeArgs: [
        path,
        content,
        {
          encoding: 'utf-8',
          flag: overwrite ? 'w' : 'wx',
        },
      ] as const,
    };
  }

  #convertError({ error, path }: { error: unknown; path: string }) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new FileExistsError(path);
    } else {
      throw error;
    }
  }
}
