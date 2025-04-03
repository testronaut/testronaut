import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { FileSystem } from './file-system';
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
    await writeFile(path, content, { encoding: 'utf-8' });
  }
}
