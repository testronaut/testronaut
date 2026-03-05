export class DuplicatedNamedFunctionsError extends Error {
  override name = 'DuplicatedNamedFunctionsError';

  constructor(filePath: string, name: string) {
    super(
      `runInPageWithNamedFunction have to use unique names.

The name "${name}" in the file ${filePath} is used multiple times.`
    );
  }
}
