import { createHash } from 'node:crypto';
import {
  createExtractedFunction,
  createFileAnalysis,
  ExtractedFunction,
  FileAnalysis,
  ImportedIdentifier,
} from '../core/file-analysis';
import { AnalysisContext, createFileData, FileData } from './core';
import { Transform } from './transform';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitRunInBrowserCalls } from './visit-run-in-browser-calls';

export function analyze({
  fileData,
  transforms = [],
}: {
  fileData: FileData;
  transforms?: Transform[];
}): FileAnalysis {
  let additionalImportedIdentifiers: ImportedIdentifier[] = [];

  /* It is important to compute the hash here before the file is transformed. */
  const hash = generateHash(fileData.content);

  /* Apply transforms to the file data. */
  for (const transform of transforms) {
    const result = transform.apply(fileData);
    fileData = createFileData({ ...fileData, content: result.content });

    additionalImportedIdentifiers = [
      ...additionalImportedIdentifiers,
      ...result.importedIdentifiers,
    ];
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
    hash,
    extractedFunctions,
    importedIdentifiers: additionalImportedIdentifiers,
  });
}

function generateHash(content: string) {
  return createHash('sha256').update(content).digest('base64').slice(0, 8);
}
