import { expect, it } from 'vitest';
import { FileExistsError, FileSystem } from './file-system';

export function applyFileSystemContract(
  setUp: () => Promise<{ fileSystem: FileSystem; testingRootPath: string }>
) {
  it('writes file', async () => {
    const { fileSystem, testingRootPath } = await setUp();
    const path = `${testingRootPath}/entrypoint.ts`;

    await fileSystem.writeFile(path, 'entrypoint content');
    expect(await fileSystem.readFile(path)).toBe('entrypoint content');
  });

  it('writes file and creates parent directories recursively', async () => {
    const { fileSystem, testingRootPath } = await setUp();
    const path = `${testingRootPath}/src/some-feature/my-component.ts`;

    await fileSystem.writeFile(path, 'my component');
    expect(await fileSystem.readFile(path)).toBe('my component');
  });

  it.todo('throws if file exists', async () => {
    const { fileSystem, testingRootPath } = await setUp();
    const path = `${testingRootPath}/src/some-feature/my-component.ts`;

    await fileSystem.writeFile(path, 'my component');

    await expect(() =>
      fileSystem.writeFile(path, 'my replacement component')
    ).rejects.toThrowError(FileExistsError);
  });

  it.todo('overwrites if file exists and overwrite is true', async () => {
    const { fileSystem, testingRootPath } = await setUp();
    const path = `${testingRootPath}/src/some-feature/my-component.ts`;

    await fileSystem.writeFile(path, 'my component');

    await fileSystem.writeFile(path, 'my replacement component', {
      overwrite: true,
    });

    expect(await fileSystem.readFile(path)).toBe('my replacement component');
  });
}
