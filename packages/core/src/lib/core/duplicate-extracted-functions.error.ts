export class DuplicateExtractedFunctionsError extends Error {
  override name = 'DuplicateExtractedFunctionsError';

  constructor(filePath: string, duplicates: string[]) {
    super(
      `Extracted function identifiers must be unique per file.
      File: ${filePath}.
      Duplicates: ${duplicates.map(name => `"${name}"`).join(', ')}`
    );
  }
}
