import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path/posix';

/**
 * TODO: replace this with `FileOps` from https://github.com/testronaut/testronaut/pull/4
 */
export class TmpFileOps {
  createFileIfNotExistsSync(filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    try {
      writeFileSync(filePath, '', {
        encoding: 'utf-8',
        flag: 'wx',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code !== 'EEXIST'
      ) {
        throw error;
      }
    }
  }
}
