export class TooManyAnonymousExtractedFunctionsError extends Error {
  override name = 'TooManyAnonymousExtractedFunctionsError';

  constructor(filePath: string) {
    super(
      `There can only be one anonymous function to extract per file. File: ${filePath}`
    );
  }
}
