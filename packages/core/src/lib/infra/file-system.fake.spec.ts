import { describe } from 'vitest';
import { applyFileSystemContract } from './file-system.contract';
import { FileSystemFake } from './file-system.fake';

describe(FileSystemFake.name, () => {
  applyFileSystemContract(async () => ({
    fileSystem: new FileSystemFake(),
    testingRootPath: '/my-fake-workspace',
  }));
});
