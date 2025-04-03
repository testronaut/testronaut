import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { FileExistsError, FileSystem } from './file-system';
import { dirname } from 'node:path/posix';

export class FileSystemImpl implements FileSystem {
  /**
   * @deprecated 🚧 work in progress
   */
  async readFile(path: string): Promise<string> {
    return readFile(path, 'utf-8');
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async writeFile(path: string, content: string): Promise<void> {
    const folderPath = dirname(path);
    await mkdir(folderPath, { recursive: true });
    try {
      await writeFile(path, content, { encoding: 'utf-8', flag: 'wx' });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'EEXIST'
      ) {
        throw new FileExistsError(path);
      } else {
        throw error;
      }
    }
  }
}
