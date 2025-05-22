export class DuplicateExtractedFunctionsError extends Error {
  override name = 'DuplicateExtractedFunctionsError';

  constructor(filePath: string, duplicates: string[]) {
    super(
      `There can only be one anonymous function to extract per file.
      File: ${filePath}.
      Duplicates: ${duplicates
        .map((name) => (name !== '' ? `"${name}"` : 'anonymous'))
        .join(', ')}`
    );
  }
}
