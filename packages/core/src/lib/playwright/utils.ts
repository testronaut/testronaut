import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function generateFileIfNotExists(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  try {
    writeFileSync(filePath, '', {
      encoding: 'utf-8',
      flag: 'wx',
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }
}
