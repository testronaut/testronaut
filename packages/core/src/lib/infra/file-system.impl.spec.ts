import { mkdtemp } from 'node:fs/promises';
import { describe } from 'vitest';
import { FileSystemImpl } from './file-system.impl';
import { applyFileSystemContract } from './file-system.contract';

describe(FileSystemImpl.name, () => {
  applyFileSystemContract(async () => ({
    fileSystem: new FileSystemImpl(),
    testingRootPath: await mkdtemp('test-file-system-impl-'),
  }));
});
