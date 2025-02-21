export interface ExtractedFunction {
  code: string;
  importedIdentifiers: string[];
}

export function createExtractedFunction(
  extractedFunction: ExtractedFunction
): ExtractedFunction {
  return extractedFunction;
}
