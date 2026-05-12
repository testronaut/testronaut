export class DuplicatedNamedFunctionsError extends Error {
  override name = 'DuplicatedNamedFunctionsError';

  constructor(filePath: string, name: string) {
    super(
      `\`inPage\` calls must be on unique lines — each call gets its identifier from its source line number.

The identifier "${name}" in the file ${filePath} is used by more than one call. Move the conflicting calls to separate lines.`
    );
  }
}
