import {
  createExtractedFunction,
  ExtractedFunction,
  ImportedIdentifier,
} from '../extracted-function';
import { AnalysisContext, FileData } from './core';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitRunInBrowserCalls } from './visit-run-in-browser-calls';

export function analyze(fileData: FileData) {
  /* Create compiler context. */
  const ctx = new AnalysisContext(fileData);

  const extractedFunctions: ExtractedFunction[] = [];

  /* Extract `runInBrowser` calls. */
  visitRunInBrowserCalls(ctx, (runInBrowserCall) => {
    /* Extracted identifiers inside `runInBrowser` call that are imported. */
    const importedIdentifiers: ImportedIdentifier[] = [];
    visitImportedIdentifiers(ctx, runInBrowserCall.node, (importedIdentifier) =>
      importedIdentifiers.push(importedIdentifier)
    );

    extractedFunctions.push(
      createExtractedFunction({
        code: runInBrowserCall.code,
        name: runInBrowserCall.name,
        importedIdentifiers,
      })
    );
  });

  /* Return extracted calls. */
  return extractedFunctions;
}
