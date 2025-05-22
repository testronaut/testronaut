export class DuplicateExtractedFunctionsError extends Error {
  override name = 'DuplicateExtractedFunctionsError';

  constructor(filePath: string, duplicates: string[]) {
    super(
      `Extracted functions should be unique — unique name per file, or one anonymous call per file.
      File: ${filePath}.
      Duplicates: ${duplicates
        .map((name) => (name !== '' ? `"${name}"` : '[anonymous call]'))
        .join(', ')}`
    );
  }
}
