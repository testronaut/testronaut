import { describe, expect, it } from 'vitest';
import { FileExistsError, FileSystem } from './file-system';

export function applyFileSystemContract(
  setUp: () => Promise<{ fileSystem: FileSystem; testingRootPath: string }>
) {
  describe('writeFile', () => {
    it('writes file', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/index.ts`;

      await fileSystem.writeFile(path, 'entrypoint content');
      expect(await fileSystem.readFile(path)).toBe('entrypoint content');
    });

    it('writes file and creates parent directories recursively', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/src/some-feature/my-component.ts`;

      await fileSystem.writeFile(path, 'my component');
      expect(await fileSystem.readFile(path)).toBe('my component');
    });

    it('throws if file exists', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/src/some-feature/my-component.ts`;

      await fileSystem.writeFile(path, 'my component');

      await expect(() =>
        fileSystem.writeFile(path, 'my replacement component')
      ).rejects.toThrowError(FileExistsError);
    });

    it('overwrites if file exists and overwrite is true', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/src/some-feature/my-component.ts`;

      await fileSystem.writeFile(path, 'my component');

      await fileSystem.writeFile(path, 'my replacement component', {
        overwrite: true,
      });

      expect(await fileSystem.readFile(path)).toBe('my replacement component');
    });
  });

  describe('writeFileSync', () => {
    it('writes file', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/index.ts`;

      fileSystem.writeFileSync(path, 'entrypoint content');
      expect(await fileSystem.readFile(path)).toBe('entrypoint content');
    });

    it('writes file and creates parent directories recursively', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/src/some-feature/my-component.ts`;

      fileSystem.writeFileSync(path, 'my component');
      expect(await fileSystem.readFile(path)).toBe('my component');
    });

    it('throws if file exists', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/src/some-feature/my-component.ts`;

      fileSystem.writeFileSync(path, 'my component');

      expect(() =>
        fileSystem.writeFileSync(path, 'my replacement component')
      ).toThrowError(FileExistsError);
    });

    it('overwrites if file exists and overwrite is true', async () => {
      const { fileSystem, testingRootPath } = await setUp();
      const path = `${testingRootPath}/src/some-feature/my-component.ts`;

      fileSystem.writeFileSync(path, 'my component');

      fileSystem.writeFileSync(path, 'my replacement component', {
        overwrite: true,
      });

      expect(await fileSystem.readFile(path)).toBe('my replacement component');
    });
  });
}
