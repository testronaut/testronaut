import { describe } from 'vitest';
import { FileSystemImpl } from './file-system.impl';
import { applyFileSystemContract } from './file-system.contract';
import { FileSystemFake } from './file-system.fake';

describe(FileSystemImpl.name, () => {
  applyFileSystemContract(async () => ({
    fileSystem: new FileSystemFake(),
    testingRootPath: '/my-fake-workspace',
  }));
});
