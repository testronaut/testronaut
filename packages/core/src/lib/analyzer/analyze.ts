import { createHash } from 'node:crypto';
import {
  createExtractedFunction,
  createFileAnalysis,
  ExtractedFunction,
  FileAnalysis,
  ImportedIdentifier,
} from '../file-analysis';
import { AnalysisContext, createFileData, FileData } from './core';
import { Transform } from './transform';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitRunInBrowserCalls } from './visit-run-in-browser-calls';

export function analyze(
  fileData: FileData,
  { transforms }: { transforms?: Transform[] } = {}
): FileAnalysis {
  if (transforms) {
    for (const transform of transforms) {
      const content = transform(fileData.content, fileData.path);
      fileData = createFileData({
        ...fileData,
        content,
      });
    }
  }

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
  return createFileAnalysis({
    path: fileData.path,
    hash: generateHash(fileData.content),
    extractedFunctions,
  });
}

function generateHash(content: string) {
  return createHash('sha256').update(content).digest('base64').slice(0, 8);
}
