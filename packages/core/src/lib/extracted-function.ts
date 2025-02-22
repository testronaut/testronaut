export interface ExtractedFunction {
  code: string;
  importedIdentifiers: ImportedIdentifier[];
  name?: string;
}

export interface ImportedIdentifier {
  name: string;
  module: string;
}

export function createExtractedFunction(
  extractedFunction: ExtractedFunction
): ExtractedFunction {
  return extractedFunction;
}

export function createImportedIdentifier(
  importedIdentifier: ImportedIdentifier
): ImportedIdentifier {
  return importedIdentifier;
}
